
/**
 * @file gameLoop.ts
 * @description
 * This file contains the 'tick' function, which is the heart of the game's execution phase.
 * It is called every second and is responsible for updating the entire game state, including
 * player actions, guard AI, security systems, and checking for win/loss conditions.
 */

// Import type definitions.
import { GameState, ActiveInteraction, PlayerStatus, TileType, Guard, PlanStep, Player, Scenario, ActionType } from '../types';
// Import game balance constants.
import { CASE_SMASH_PENALTY_MIN, CASE_SMASH_PENALTY_MAX, TIME_COST, NOISE_RANGE, DISTRACTION_NOISE_RANGE, DYNAMITE_BLAST_RADIUS, DYNAMITE_FUSE_TIME, GRID_WIDTH, GRID_HEIGHT, STUN_O_MAT_RADIUS, STUN_O_MAT_DURATION } from '../constants';
// Import utility functions for pathfinding and line of sight.
import { findShortestPath, getLineOfSight } from './pathfinding';
// Import tile property check functions.
import { isEvidenceTile, isWalkable, isSuspiciousChange, isDecoration } from './tiles';
// Import guard and noise utility functions.
import { calculateGuardVision } from './guards';
import { calculateNoiseSpread } from './noise';
import { findRoom } from './rooms';
import { deepClone } from './utils';

/**
 * A helper function to find all available alarm boxes on the map.
 * @param map The current game map.
 * @returns An array of coordinates for each ALARM_BOX.
 */
function findAlarmBoxes(map: TileType[][]): { x: number; y: number }[] {
    const boxes: { x: number; y: number }[] = [];
    map.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile === TileType.ALARM_BOX) {
                boxes.push({ x, y });
            }
        });
    });
    return boxes;
}

/**
 * Triggers a loud, 30-second alarm if the system is active.
 * This sets the timer to 30s if it's higher, fails the stealth objective,
 * and notifies the player.
 * @param state The current game state.
 * @param playerName The name of the player or entity that triggered the alarm.
 * @param objectName A description of what was tampered with (e.g., "door", "safe").
 * @param newEvents The array to push new event messages into.
 */
const triggerLoudAlarm = (state: GameState, playerName: string, objectName: string, newEvents: string[]) => {
    if (state.alarmSystemActive && state.alarmType !== 'loud') {
        state.alarmType = 'loud';
        state.objectiveStatus.stealth = 'failed';
        if (state.executionTimer > 30) {
            state.executionTimer = 30;
        }
        newEvents.push(`LOUD ALARM! ${playerName} triggered the alarm via an alarmed ${objectName}! Timer is now 30s!`);
    }
};

/**
 * Merges a new noise tile map into the state's noiseEffect, rather than overwriting it.
 * If noiseEffect already exists this tick, tiles from both sources are combined (minimum distance wins on overlap).
 * This prevents simultaneous events (e.g. two players smashing things in the same second) from clobbering each other.
 */
const mergeNoiseEffect = (
    state: GameState,
    newTiles: Map<string, number>,
    duration: number,
    source: { x: number; y: number },
    type: 'stone' | 'explosion'
) => {
    if (!state.noiseEffect || state.noiseEffect.duration <= 0) {
        state.noiseEffect = { tiles: newTiles, duration, source, type };
    } else {
        // Merge tile maps — keep shortest distance for each key
        newTiles.forEach((dist, key) => {
            const existing = state.noiseEffect!.tiles.get(key);
            if (existing === undefined || dist < existing) {
                state.noiseEffect!.tiles.set(key, dist);
            }
        });
        // Extend duration to the longer of the two, prefer 'explosion' type
        if (duration > state.noiseEffect.duration) state.noiseEffect.duration = duration;
        if (type === 'explosion') state.noiseEffect.type = 'explosion';
    }
};

/**
 * Helper to find an empty adjacent tile for a player to step aside to.
 */
const findEmptyAdjacentTile = (pos: { x: number, y: number }, map: TileType[][], players: Player[]): { x: number, y: number } | null => {
    const moves = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }];
    for (const move of moves) {
        const nextPos = { x: pos.x + move.dx, y: pos.y + move.dy };
        if (nextPos.y < 0 || nextPos.y >= map.length || nextPos.x < 0 || nextPos.x >= map[0].length) continue;

        const tile = map[nextPos.y][nextPos.x];
        const isTileWalkable = isWalkable(tile);
        const isOccupied = players.some(p => p.x === nextPos.x && p.y === nextPos.y);

        if (isTileWalkable && !isOccupied) {
            return nextPos;
        }
    }
    return null;
}


/**
 * The main game loop function. Called once per second during the execution phase.
 * It processes all game logic for that second and returns the new state.
 * @param {GameState} gameState - The current state of the game.
 * @param {Scenario} scenario - The static data for the current scenario.
 * @returns An object containing the updated game state and any new event messages for the ticker.
 */
export const tick = (gameState: GameState, scenario: Scenario): { nextState: GameState, newEvents: string[] } => {
    // Create a robust deep copy of the state to avoid direct mutation.
    const nextState: GameState = deepClone(gameState);

    const newEvents: string[] = [];
    nextState.activeInteractions = []; // Clear previous interactions.
    nextState.explosionEffect = null; // Clear single-tick effects
    nextState.blastEffect = null;

    // If the game is already over, do nothing.
    if (nextState.gameOver || nextState.gameWon) {
        return { nextState, newEvents };
    }

    /**
     * Handles the outcome of a collision between a player and a guard.
     * @returns {boolean} True if a collision was handled, false otherwise.
     */
    const handleCollision = (player: Player, guard: Guard, playerIndex: number): boolean => {
        // Check if either is already incapacitated to prevent repeated collisions.
        if (nextState.playerStatuses[playerIndex] === 'captured' || guard.status === 'knocked_out' || guard.status === 'guarding_captured_player') {
            return false;
        }

        if (Math.random() < 0.5) { // 50% chance player is captured
            nextState.playerStatuses[playerIndex] = 'captured';
            if (!nextState.capturedPlayers.includes(player.name)) {
                nextState.capturedPlayers.push(player.name);
            }
            // Stop the player's plan
            nextState.executionPlanIndices[playerIndex] = -1;

            // Guard stops and guards the player
            guard.status = 'guarding_captured_player';
            guard.path_to_alarm = undefined;
            guard.path_to_noise = undefined;
            guard.path_to_post = undefined;
            guard.path_to_suspicion = undefined;
            guard.noise_source = undefined;
            guard.suspicion_target = undefined;
            newEvents.push(`COLLISION! ${guard.name} captured ${player.name}!`);
        } else { // 50% chance guard is knocked out
            guard.status = 'knocked_out';
            guard.knockout_timer = 5;
            guard.path_to_alarm = undefined;
            guard.path_to_noise = undefined;
            guard.path_to_post = undefined;
            guard.path_to_suspicion = undefined;
            guard.noise_source = undefined;
            guard.suspicion_target = undefined;
            newEvents.push(`COLLISION! ${player.name} knocked out ${guard.name}!`);
        }
        return true; // Collision was handled
    };

    // --- Police Car Logic ---
    // Handle police car spawning and movement before decrementing the timer.
    if (nextState.executionTimer <= 10) {
        let carPos: { x: number; y: number } | null = null;
        // Find the getaway car's position.
        for (let y = 0; y < nextState.map.length; y++) {
            for (let x = 0; x < nextState.map[y].length; x++) {
                if (nextState.map[y][x] === TileType.CAR) {
                    carPos = { x, y };
                    break;
                }
            }
            if (carPos) break;
        }

        if (carPos) {
            const arrivalPos = { x: carPos.x, y: carPos.y + 1 };
            // Clamp arrival position to be within bounds
            if (arrivalPos.y >= GRID_HEIGHT) {
                arrivalPos.y = GRID_HEIGHT - 1;
            }

            // At exactly 10 seconds, and if the police car doesn't exist yet, spawn it.
            if (nextState.executionTimer === 10 && !nextState.policeCar) {
                // Spawn location: 1 field down, 18 fields to the right of the getaway car
                let spawnX = carPos.x + 18;
                let spawnY = carPos.y + 1;

                // Clamp spawn position to be within map bounds
                if (spawnX >= GRID_WIDTH) {
                    spawnX = GRID_WIDTH - 1;
                }
                if (spawnY >= GRID_HEIGHT) {
                    spawnY = GRID_HEIGHT - 1;
                }

                nextState.policeCar = { x: spawnX, y: spawnY };
                newEvents.push("Police are arriving on the scene!");

            } else if (nextState.policeCar) { // If it's less than 10s and the car exists, move it.
                // Move the police car two steps per tick towards the spot below the getaway car.
                const path = findShortestPath(nextState.policeCar, arrivalPos, nextState.map, true);
                if (path.length > 0) {
                    // Take the first step.
                    const nextStep = path.shift();
                    if (nextStep) {
                        nextState.policeCar = nextStep;
                        // If there's another step, take that too for 2 tiles/tick speed.
                        if (path.length > 0) {
                            const secondStep = path.shift();
                            if (secondStep) {
                                nextState.policeCar = secondStep;
                            }
                        }
                    }
                }
            }
        }
    }


    // --- 1. Decrement Timers & Handle Passive Effects ---
    nextState.executionTimer -= 1;

    if (nextState.executionTimer <= 0) {
        // Capture any player not at the car and not already captured.
        nextState.players.forEach((p, i) => {
            if (nextState.map[p.y]?.[p.x] !== TileType.CAR && nextState.playerStatuses[i] !== 'captured') {
                nextState.playerStatuses[i] = 'captured';
                // Avoid duplicates in captured list
                if (!nextState.capturedPlayers.includes(p.name)) {
                    nextState.capturedPlayers.push(p.name);
                }
            }
        });

        // If, after capturing stragglers, there are any players left who are NOT captured, it's a win.
        // This means some players made it to the car in time.
        const escapedPlayers = nextState.players.filter((p, i) => nextState.playerStatuses[i] !== 'captured');

        if (escapedPlayers.length > 0) {
            nextState.gameWon = true;
            if (escapedPlayers.length < nextState.players.length) {
                nextState.stolenValue = 0;
                nextState.message = "Time's up! Those at the car escaped, but because crew members were left behind, the loot was lost!";
                newEvents.push("THE LOOT WAS LOST: Not all crew members reached the car.");
            } else {
                nextState.message = "Time's up! Those at the car made a clean getaway.";
            }
        } else {
            nextState.gameOver = true;
            nextState.message = "Time's up! The entire crew was caught.";
            newEvents.push("EXECUTION FAILED: Time expired.");
        }
        return { nextState, newEvents };
    }

    // elapsedTime should represent the time at the START of the current second [0, 1)
    // So the first tick (100 -> 99) corresponds to elapsedTime = 0.
    // FIX: Removing -1 to ensure check happens against the state at T=1 (end of tick), matching the planning view.
    const elapsedTimeSinceStart = nextState.initialExecutionTimer - nextState.executionTimer;

    // Decrement noise effect timer
    if (nextState.noiseEffect && nextState.noiseEffect.duration > 0) {
        nextState.noiseEffect.duration--;
    }

    // Process Active Fuses, Lances, and other timed effects
    const remainingFuses = [];
    for (const fuse of nextState.activeFuses) {
        fuse.timer -= 1;
        if (fuse.timer <= 0) {
            // BOOM!
            nextState.explosivesDetonated = true;
            newEvents.push("An explosion rocks the building!");
            nextState.explosionEffect = { x: fuse.x, y: fuse.y, duration: 1 };

            const blastRadiusTiles = calculateNoiseSpread({ x: fuse.x, y: fuse.y }, nextState.map, DYNAMITE_BLAST_RADIUS);
            nextState.blastEffect = { tiles: blastRadiusTiles, duration: 1 };
            const noiseTiles = calculateNoiseSpread({ x: fuse.x, y: fuse.y }, nextState.map, NOISE_RANGE * 2, true);
            mergeNoiseEffect(nextState, noiseTiles, 2, { x: fuse.x, y: fuse.y }, 'explosion');

            const targetTile = nextState.map[fuse.y][fuse.x];
            if ([TileType.SAFE, TileType.SAFE_ALARMED, TileType.SAFE_TIMELOCK].includes(targetTile)) {
                if (targetTile === TileType.SAFE_ALARMED) {
                    const planterName = nextState.players[fuse.planter]?.name;
                    if (planterName) {
                        triggerLoudAlarm(nextState, planterName, "safe", newEvents);
                    }
                }
                nextState.map[fuse.y][fuse.x] = TileType.SAFE_SMASHED;
            } else if ([TileType.VAULT_DOOR, TileType.VAULT_DOOR_TIMELOCK].includes(targetTile)) {
                nextState.map[fuse.y][fuse.x] = TileType.DOOR_SMASHED;
            }

            // blastRadiusTiles is a Map<string, number>. forEach passes (value=distance, key=coordKey).
            blastRadiusTiles.forEach((_dist, coordKey) => {
                const [tx, ty] = coordKey.split('-').map(Number);

                nextState.players.forEach((p, index) => {
                    if (p.x === tx && p.y === ty && nextState.playerStatuses[index] !== 'knocked_out') {
                        nextState.playerStatuses[index] = 'knocked_out';
                        nextState.playerKnockoutTimers[index] = 10;
                        newEvents.push(`${p.name} was knocked out by the blast!`);
                    }
                });

                nextState.guards.forEach(g => {
                    if (g.x === tx && g.y === ty && g.status !== 'knocked_out') {
                        g.status = 'knocked_out';
                        g.knockout_timer = 10;
                        g.path_to_alarm = undefined;
                        g.path_to_noise = undefined;
                        g.path_to_post = undefined;
                        g.path_to_suspicion = undefined;
                        g.noise_source = undefined;
                        g.suspicion_target = undefined;
                        newEvents.push(`${g.name} was knocked out by the explosion!`);
                    }
                });

                const tileToDestroy = nextState.map[ty]?.[tx];
                const isDestroyableTreasure = tileToDestroy && (
                    tileToDestroy.includes('CASE') ||
                    tileToDestroy.includes('CABINET') ||
                    tileToDestroy.includes('ART_PIECE') ||
                    tileToDestroy.includes('GOLD_BARS') ||
                    tileToDestroy === TileType.TELLER_COUNTER
                ) && !tileToDestroy.includes('ROBBED');

                if (isDestroyableTreasure) {
                    if (tileToDestroy.includes('_ALARMED')) {
                        const planterName = nextState.players[fuse.planter]?.name || "Explosion";
                        triggerLoudAlarm(nextState, planterName, "container", newEvents);
                    }
                    nextState.map[ty][tx] = TileType.FLOOR;
                    const coord = `${tx}-${ty}`;
                    if (nextState.treasures[coord]) {
                        delete nextState.treasures[coord];
                    }
                } else if (tileToDestroy && isDecoration(tileToDestroy)) {
                    nextState.map[ty][tx] = TileType.FLOOR;
                }
            });

        } else {
            remainingFuses.push(fuse);
        }
    }
    nextState.activeFuses = remainingFuses;

    // Process Stun-O-Mat Effects
    if (nextState.stunEffect && nextState.stunEffect.duration > 0) {
        nextState.stunEffect.duration -= 1;
        const stunTiles = nextState.stunEffect.tiles;

        // Knock out any guard in the gas
        for (const guard of nextState.guards) {
            if (stunTiles.has(`${guard.x}-${guard.y}`) && guard.status !== 'knocked_out' && guard.status !== 'guarding_captured_player') {
                guard.status = 'knocked_out';
                guard.knockout_timer = 9999;
                guard.path_to_alarm = undefined;
                guard.path_to_noise = undefined;
                guard.path_to_post = undefined;
                guard.path_to_suspicion = undefined;
                guard.noise_source = undefined;
                guard.suspicion_target = undefined;
                newEvents.push(`${guard.name} was caught in the stun gas!`);
            }
        }

        // Knock out any player in the gas
        for (let i = 0; i < nextState.players.length; i++) {
            const player = nextState.players[i];
            if (stunTiles.has(`${player.x}-${player.y}`) && nextState.playerStatuses[i] !== 'knocked_out' && nextState.playerStatuses[i] !== 'captured') {
                nextState.playerStatuses[i] = 'knocked_out';
                nextState.playerKnockoutTimers[i] = 9999;
                newEvents.push(`${player.name} was caught in the stun gas!`);
            }
        }
    } else {
        nextState.stunEffect = null;
    }

    // Process other timed effects timers
    for (let i = 0; i < nextState.cameras.length; i++) {
        const cam = nextState.cameras[i];
        if (cam.looperTimer && cam.looperTimer > 0) cam.looperTimer--;
    }

    for (let i = 0; i < nextState.laserGrids.length; i++) {
        const grid = nextState.laserGrids[i];
        if (grid.jamTimer && grid.jamTimer > 0) {
            grid.jamTimer--;
        }
    }

    for (let i = 0; i < nextState.pressurePlates.length; i++) {
        const plate = nextState.pressurePlates[i];
        if (plate.foamTimer && plate.foamTimer > 0) {
            plate.foamTimer--;
            if (plate.foamTimer <= 0) {
                const originalTile = nextState.initialMap[plate.y][plate.x];
                if (originalTile) nextState.map[plate.y][plate.x] = originalTile;
            }
        }
    }


    // --- 2. Player Processing Loop ---
    for (let i = 0; i < nextState.players.length; i++) {
        const player = nextState.players[i];

        // --- Process Step Aside ---
        if (player.stepAside) {
            if (player.stepAside.movingToTarget) {
                // Simple one-step move.
                player.x = player.stepAside.target.x;
                player.y = player.stepAside.target.y;
                player.stepAside.movingToTarget = false;
            } else {
                const returnPos = player.stepAside.returnTo;
                const isReturnPosClear = !nextState.players.some((p, idx) => i !== idx && p.x === returnPos.x && p.y === returnPos.y);
                if (isReturnPosClear) {
                    player.x = returnPos.x;
                    player.y = returnPos.y;
                    player.stepAside = null;
                    nextState.playerStatuses[i] = 'executing';
                }
            }
            continue; // Don't process normal plan while stepping aside
        }

        // Skip processing for players who are idle, unable to act, or have finished their plan.
        if (['knocked_out', 'captured', 'frozen'].includes(nextState.playerStatuses[i])) {
            // Still decrement knockout timer if applicable.
            if (nextState.playerStatuses[i] === 'knocked_out') {
                nextState.playerKnockoutTimers[i] -= 1;
                if (nextState.playerKnockoutTimers[i] <= 0) {
                    nextState.playerStatuses[i] = 'executing';
                    newEvents.push(`${player.name} has recovered.`);
                }
            }
            continue;
        }

        // --- Process Reactive Actions First ---
        if (nextState.playerReactiveActionTimers[i] > 0) {
            nextState.playerReactiveActionTimers[i]--;

            const reactiveAction = nextState.playerReactiveActions[i]!;
            const blockedStep = nextState.plan[nextState.executionPlanIndices[i]];

            // Add interaction animation for the reactive action
            if (blockedStep) {
                nextState.activeInteractions.push({ x: blockedStep.target.x, y: blockedStep.target.y, action: reactiveAction, teamMember: i });
            }

            if (nextState.playerReactiveActionTimers[i] <= 0) {
                // Reactive action is complete. Apply its effect.
                if (blockedStep) {
                    const targetPos = blockedStep.target;
                    const tileAtTarget = nextState.map[targetPos.y]?.[targetPos.x];

                    if (reactiveAction === 'open_door' && tileAtTarget === TileType.DOOR_CLOSED) {
                        nextState.map[targetPos.y][targetPos.x] = TileType.DOOR_OPEN;
                        newEvents.push(`${player.name} had to open a closed door.`);
                    } else if (reactiveAction === 'unlock' && (tileAtTarget === TileType.DOOR_LOCKED || tileAtTarget === TileType.DOOR_LOCKED_ALARMED)) {
                        if (tileAtTarget === TileType.DOOR_LOCKED_ALARMED) {
                            triggerLoudAlarm(nextState, player.name, "door", newEvents);
                        }
                        nextState.map[targetPos.y][targetPos.x] = TileType.DOOR_OPEN;
                        newEvents.push(`${player.name} was blocked and had to pick a lock.`);
                    }
                }
                // Clear the reactive state
                nextState.playerReactiveActions[i] = null;
            }
            // Do not process normal plan this tick, player is busy.
            continue;
        }

        const currentPlanIndex = nextState.executionPlanIndices[i];

        // If a player has no more actions, they are idle.
        if (currentPlanIndex === -1) {
            continue;
        }

        // --- Check for Blocked Path Before Processing Normal Action ---
        const currentStep = nextState.plan[currentPlanIndex];
        // Check only on the first tick of an action
        if (currentStep.action === 'move' && nextState.timeForCurrentActions[i] === currentStep.timeCost) {
            const targetPos = currentStep.target;
            const tileAtTarget = nextState.map[targetPos.y][targetPos.x];

            let reactiveAction: ActionType | null = null;
            if (tileAtTarget === TileType.DOOR_CLOSED) {
                reactiveAction = 'open_door';
            } else if (tileAtTarget === TileType.DOOR_LOCKED || tileAtTarget === TileType.DOOR_LOCKED_ALARMED) {
                reactiveAction = 'unlock';
            }

            if (reactiveAction) {
                nextState.playerReactiveActions[i] = reactiveAction;
                let timeCost = 0;
                if (reactiveAction === 'open_door') timeCost = TIME_COST.OPEN_DOOR;
                if (reactiveAction === 'unlock') timeCost = TIME_COST.UNLOCK;

                nextState.playerReactiveActionTimers[i] = timeCost;

                // Start the reactive action immediately this tick
                continue;
            }
        }

        // Decrement the timer for the player's current action.
        nextState.timeForCurrentActions[i] -= 1;

        // If the action is finished, process its completion and find the next action.
        if (nextState.timeForCurrentActions[i] <= 0) {
            const completedStep = currentStep;

            // Apply the effect of the completed action.
            const { x, y } = completedStep.target;
            const tile = nextState.map[y]?.[x];
            const originalTile = nextState.initialMap[y]?.[x];

            switch (completedStep.action) {
                case 'move': {
                    // Check if target is car to bypass collision check
                    const targetTileType = nextState.map[y][x];
                    const isTargetCar = targetTileType === TileType.CAR;

                    const blockingPlayerIndex = isTargetCar ? -1 : nextState.players.findIndex((p, idx) => i !== idx && p.x === x && p.y === y && nextState.playerStatuses[idx] !== 'captured' && !p.stepAside);

                    if (blockingPlayerIndex !== -1) {
                        const blockingPlayer = nextState.players[blockingPlayerIndex];
                        const emptyTile = findEmptyAdjacentTile(blockingPlayer, nextState.map, nextState.players);
                        if (emptyTile && nextState.playerStatuses[blockingPlayerIndex] === 'executing') {
                            blockingPlayer.stepAside = {
                                target: emptyTile,
                                returnTo: { x: blockingPlayer.x, y: blockingPlayer.y },
                                movingToTarget: true,
                            };
                            nextState.playerStatuses[blockingPlayerIndex] = 'stepping_aside';
                            nextState.timeForCurrentActions[i] = 1; // Wait 1 tick for space to clear
                            break;
                        } else {
                            nextState.timeForCurrentActions[i] = 1; // Block for 1 tick
                            nextState.playerStatuses[i] = 'blocked';
                            break;
                        }
                    }

                    nextState.playerStatuses[i] = 'executing';
                    player.x = x;
                    player.y = y;

                    // Immediately check for collision after move
                    // Skip collision with knocked-out guards (their tiles are passable)
                    for (const guard of nextState.guards) {
                        if (player.x === guard.x && player.y === guard.y && guard.status !== 'knocked_out') {
                            if (handleCollision(player, guard, i)) {
                                break; // Stop checking other guards for this player
                            }
                        }
                    }
                    // If player was captured, don't continue their plan
                    if (nextState.playerStatuses[i] === 'captured') break;

                    // Check for traps after moving
                    const playerForTrapCheck = nextState.players[i];
                    const isInfiltrator = (playerForTrapCheck.skills.infiltrator || 0) > 0;

                    // Check for Lasers
                    const isLaser = nextState.laserGrids.some(grid => grid.active && grid.beamsOn && grid.beamTiles.some(t => t.x === x && t.y === y));
                    if (isLaser && !isInfiltrator) {
                        triggerLoudAlarm(nextState, player.name, 'laser beam', newEvents);
                    }

                    // Check for Pressure Plates (as a safety measure, though planning should prevent this)
                    const plate = nextState.pressurePlates.find(p => p.x === x && p.y === y);
                    const currentTileOnMap = nextState.map[y]?.[x];
                    const isArmedPressurePlate = (currentTileOnMap === TileType.PRESSURE_PLATE || currentTileOnMap === TileType.PRESSURE_PLATE_HIDDEN) && plate && !plate.disabled && !plate.foamTimer;

                    if (isArmedPressurePlate && !isInfiltrator) {
                        // Any character stepping on an active plate triggers an alarm.
                        triggerLoudAlarm(nextState, player.name, 'pressure plate', newEvents);
                    }
                    break;
                }
                case 'distract':
                    const distractionNoise = calculateNoiseSpread({ x, y }, nextState.map, DISTRACTION_NOISE_RANGE);
                    mergeNoiseEffect(nextState, distractionNoise, 2, { x, y }, 'stone');
                    newEvents.push(`${player.name} creates a distraction.`);
                    break;
                case 'rob': {
                    const coord = `${x}-${y}`;
                    if (nextState.treasures[coord] && !nextState.treasures[coord].robbed) {
                        const originalObjectTile = nextState.initialMap[y]?.[x];
                        const isOriginallyAlarmed = [
                            TileType.DISPLAY_CASE_ALARMED,
                            TileType.SAFE_ALARMED,
                            TileType.ART_PIECE_ALARMED,
                            TileType.GOLD_BARS_ALARMED,
                            TileType.CABINET_ALARMED,
                            TileType.STATUE_ALARMED
                        ].includes(originalObjectTile);

                        if (isOriginallyAlarmed) {
                            triggerLoudAlarm(nextState, player.name, "treasure", newEvents);
                        }

                        let lootValue = nextState.treasures[coord].value;
                        const isSmashed = [TileType.DISPLAY_CASE_SMASHED, TileType.SAFE_SMASHED, TileType.DOOR_SMASHED].includes(tile);
                        if (isSmashed) {
                            const hasThiefSkill = (player.skills.thief || 0) > 0;
                            if (!hasThiefSkill) {
                                lootValue *= (1 - CASE_SMASH_PENALTY_MAX);
                            }
                        }

                        nextState.stolenValue += lootValue;

                        // Check if treasure contains a key
                        if (nextState.treasures[coord].containsKey) {
                            if (!nextState.playerKeys) nextState.playerKeys = Array(nextState.players.length).fill(0);
                            nextState.playerKeys[i] = (nextState.playerKeys[i] || 0) + 1;
                            newEvents.push(`${player.name} found a key in the safe!`);
                        }

                        nextState.treasures[coord].robbed = true;
                        newEvents.push(`${player.name} secured loot worth $${nextState.treasures[coord].value.toLocaleString()}!`);

                        if (scenario.primaryTarget && scenario.primaryTarget.x === x && scenario.primaryTarget.y === y) {
                            nextState.objectiveStatus.primary = 'success';
                            newEvents.push(`PRIMARY OBJECTIVE SECURED!`);
                        }
                        if (scenario.secondaryTarget && scenario.secondaryTarget.x === x && scenario.secondaryTarget.y === y) {
                            nextState.objectiveStatus.secondary = 'success';
                            newEvents.push(`Secondary objective secured.`);
                        }

                        if (tile === TileType.DISPLAY_CASE_SMASHED || tile === TileType.DISPLAY_CASE_OPENED) nextState.map[y][x] = TileType.DISPLAY_CASE_ROBBED;
                        else if (tile === TileType.SAFE_OPENED || tile === TileType.SAFE_SMASHED) nextState.map[y][x] = TileType.SAFE_ROBBED;
                        else if (tile === TileType.ART_PIECE || tile === TileType.ART_PIECE_ALARMED) nextState.map[y][x] = TileType.ART_PIECE_ROBBED;
                        else if (tile === TileType.GOLD_BARS || tile === TileType.GOLD_BARS_ALARMED) nextState.map[y][x] = TileType.GOLD_BARS_ROBBED;
                        else if (tile === TileType.CABINET_OPEN) nextState.map[y][x] = TileType.CABINET_ROBBED;
                        else if (tile === TileType.STATUE || tile === TileType.STATUE_ALARMED) nextState.map[y][x] = TileType.STATUE_ROBBED;
                        else if (tile === TileType.TELLER_COUNTER) nextState.map[y][x] = TileType.TELLER_COUNTER_ROBBED;
                        else if (tile === TileType.FILING_CABINET) nextState.map[y][x] = TileType.FILING_CABINET_ROBBED;
                    }
                    break;
                }
                case 'pickpocket': {
                    // Can only pickpocket guards who have keys
                    const guard = nextState.guards.find(g => g.x === x && g.y === y);
                    if (guard && guard.hasKey && (!nextState.pickpocketedGuards || !nextState.pickpocketedGuards.has(guard.id))) {
                        if (!nextState.playerKeys) nextState.playerKeys = Array(nextState.players.length).fill(0);
                        if (!nextState.pickpocketedGuards) nextState.pickpocketedGuards = new Set();

                        nextState.playerKeys[i] = (nextState.playerKeys[i] || 0) + 1;
                        nextState.pickpocketedGuards.add(guard.id);
                        newEvents.push(`${player.name} pickpocketed a key from ${guard.name}!`);
                    }
                    break;
                }
                case 'unlock':
                case 'open_door':
                    // Check if player has a pickpocketed key
                    const hasPickpocketedKey = (nextState.playerKeys?.[i] || 0) > 0;

                    if (tile === TileType.DOOR_LOCKED || tile === TileType.DOOR_LOCKED_ALARMED) {
                        if (hasPickpocketedKey) {
                            // Using pickpocketed key - no alarm, instant open, consume key
                            if (!nextState.playerKeys) nextState.playerKeys = Array(nextState.players.length).fill(0);
                            nextState.playerKeys[i]--;
                            newEvents.push(`${player.name} used a pickpocketed key!`);
                        } else {
                            // Normal unlock (lockpicking)
                            if (tile === TileType.DOOR_LOCKED_ALARMED) {
                                triggerLoudAlarm(nextState, player.name, "door", newEvents);
                            }
                        }
                    }
                    nextState.map[y][x] = TileType.DOOR_OPEN;
                    break;
                case 'use_skeleton_key':
                    // Skeleton keys don't disable alarms (unlike pickpocketed keys)
                    if (tile === TileType.DOOR_LOCKED_ALARMED) {
                        triggerLoudAlarm(nextState, player.name, "door", newEvents);
                    }
                    nextState.map[y][x] = TileType.DOOR_OPEN;
                    break;
                case 'smash_door':
                    if (tile === TileType.DOOR_LOCKED_ALARMED) {
                        triggerLoudAlarm(nextState, player.name, "door", newEvents);
                    }
                    // Only play sound if door wasn't already smashed
                    if (tile !== TileType.DOOR_SMASHED) {
                        nextState.map[y][x] = TileType.DOOR_SMASHED;
                        const doorNoise = calculateNoiseSpread({ x, y }, nextState.map, NOISE_RANGE);
                        mergeNoiseEffect(nextState, doorNoise, 1, { x, y }, 'explosion');
                        newEvents.push(`${player.name} smashed a door, creating a racket!`);
                    }
                    break;
                case 'break_window':
                    if (tile === TileType.WINDOW) {
                        nextState.map[y][x] = TileType.WINDOW_BROKEN;
                        const windowNoise = calculateNoiseSpread({ x, y }, nextState.map, NOISE_RANGE);
                        mergeNoiseEffect(nextState, windowNoise, 1, { x, y }, 'explosion');
                        newEvents.push(`${player.name} broke a window!`);
                    }
                    break;
                case 'close_door':
                    nextState.map[y][x] = TileType.DOOR_CLOSED;
                    break;
                case 'smash':
                    if (tile === TileType.DISPLAY_CASE_ALARMED) {
                        triggerLoudAlarm(nextState, player.name, "display case", newEvents);
                    }
                    if (tile === TileType.DISPLAY_CASE || tile === TileType.DISPLAY_CASE_ALARMED) {
                        nextState.map[y][x] = TileType.DISPLAY_CASE_SMASHED;
                        const caseNoise = calculateNoiseSpread({ x, y }, nextState.map, NOISE_RANGE);
                        mergeNoiseEffect(nextState, caseNoise, 1, { x, y }, 'explosion');
                        newEvents.push(`${player.name} smashed a display case, creating a racket!`);
                    }
                    break;
                case 'lockpick_case':
                case 'use_glass_cutter':
                    if (tile === TileType.DISPLAY_CASE_ALARMED && completedStep.action !== 'use_glass_cutter') {
                        triggerLoudAlarm(nextState, player.name, "display case", newEvents);
                    }
                    if (tile === TileType.DISPLAY_CASE || tile === TileType.DISPLAY_CASE_ALARMED) nextState.map[y][x] = TileType.DISPLAY_CASE_OPENED;
                    break;
                case 'close_case':
                    if (originalTile) nextState.map[y][x] = originalTile;
                    break;
                case 'crack':
                case 'use_thermic_lance':
                    if (tile === TileType.SAFE_ALARMED) {
                        triggerLoudAlarm(nextState, player.name, "safe", newEvents);
                    }
                    if (tile === TileType.SAFE || tile === TileType.SAFE_ALARMED || tile === TileType.SAFE_TIMELOCK) nextState.map[y][x] = TileType.SAFE_OPENED;
                    if (tile === TileType.VAULT_DOOR || tile === TileType.VAULT_DOOR_TIMELOCK) nextState.map[y][x] = TileType.DOOR_OPEN;
                    break;
                case 'close_safe':
                    if (originalTile) nextState.map[y][x] = originalTile;
                    break;
                case 'open_cabinet':
                    if (tile === TileType.CABINET_ALARMED) {
                        triggerLoudAlarm(nextState, player.name, "cabinet", newEvents);
                    }
                    if (tile === TileType.CABINET || tile === TileType.CABINET_ALARMED) nextState.map[y][x] = TileType.CABINET_OPEN;
                    break;
                case 'close_cabinet':
                    if (originalTile) nextState.map[y][x] = originalTile;
                    break;
                case 'disable': {
                    const camIndex = nextState.cameras.findIndex(c => c.x === x && c.y === y);
                    if (camIndex > -1) nextState.cameras[camIndex].disabled = true;
                    break;
                }
                case 'disable_alarm':
                    nextState.map[y][x] = TileType.ALARM_BOX_DISABLED;
                    nextState.alarmSystemActive = false;
                    break;
                case 'disable_cameras':
                    nextState.camerasActive = false;
                    nextState.map[y][x] = TileType.CAMERA_CONTROL_PANEL_DISABLED;
                    break;
                case 'plant_dynamite':
                    nextState.activeFuses.push({
                        x,
                        y,
                        timer: completedStep.dynamiteTimer || DYNAMITE_FUSE_TIME,
                        planter: completedStep.teamMember,
                        planterSkills: player.skills,
                    });
                    break;
                case 'disable_lasers': {
                    const gridIndex = nextState.laserGrids.findIndex(g => g.controlPanel.x === x && g.controlPanel.y === y);
                    if (gridIndex > -1) nextState.laserGrids[gridIndex].active = false;
                    nextState.map[y][x] = TileType.LASER_CONTROL_PANEL_DISABLED;
                    break;
                }
                case 'disable_pressure_plates': {
                    nextState.pressurePlates.forEach(p => p.disabled = true);
                    nextState.map[y][x] = TileType.PRESSURE_PLATE_PANEL_DISABLED;
                    nextState.pressurePlates.forEach(p => {
                        if (nextState.map[p.y][p.x] === TileType.PRESSURE_PLATE || nextState.map[p.y][p.x] === TileType.PRESSURE_PLATE_HIDDEN) {
                            nextState.map[p.y][p.x] = TileType.PRESSURE_PLATE_DISABLED;
                        }
                    });
                    break;
                }
                case 'hack': {
                    nextState.map[y][x] = TileType.COMPUTER_TERMINAL_HACKED;
                    const terminal = scenario.hackableTerminals?.find(t => t.x === x && t.y === y);
                    if (terminal) {
                        terminal.cameraIds.forEach(camId => {
                            const camIndex = nextState.cameras.findIndex(c => c.id === camId);
                            if (camIndex > -1) {
                                nextState.cameras[camIndex].disabled = true;
                                newEvents.push(`Camera #${camId} disabled via terminal.`);
                            }
                        });
                    }
                    break;
                }
                case 'use_camera_looper': {
                    const camIndex = nextState.cameras.findIndex(c => c.x === x && c.y === y);
                    if (camIndex > -1) nextState.cameras[camIndex].looperTimer = 15;
                    break;
                }
                case 'use_foam_canister': {
                    const plateIndex = nextState.pressurePlates.findIndex(p => p.x === x && p.y === y);
                    if (plateIndex > -1) nextState.pressurePlates[plateIndex].foamTimer = 60;
                    nextState.map[y][x] = TileType.FOAMED_PRESSURE_PLATE;
                    break;
                }
                case 'use_laser_jammer_short': {
                    const gridIndex = nextState.laserGrids.findIndex(g => g.controlPanel.x === x && g.controlPanel.y === y);
                    if (gridIndex > -1) nextState.laserGrids[gridIndex].jamTimer = 30;
                    nextState.map[y][x] = TileType.LASER_CONTROL_PANEL_JAMMED;
                    break;
                }
                case 'use_laser_jammer_long': {
                    const gridIndex = nextState.laserGrids.findIndex(g => g.controlPanel.x === x && g.controlPanel.y === y);
                    if (gridIndex > -1) nextState.laserGrids[gridIndex].jamTimer = 9999;
                    nextState.map[y][x] = TileType.LASER_CONTROL_PANEL_JAMMED;
                    break;
                }
                case 'knockout': {
                    const targetGuard = nextState.guards.find(g => g.x === x && g.y === y);
                    if (targetGuard && targetGuard.status !== 'knocked_out' && targetGuard.status !== 'guarding_captured_player') {
                        targetGuard.status = 'knocked_out';
                        targetGuard.knockout_timer = 9999;
                        targetGuard.path_to_alarm = undefined;
                        targetGuard.path_to_noise = undefined;
                        targetGuard.path_to_post = undefined;
                        targetGuard.path_to_suspicion = undefined;
                        targetGuard.noise_source = undefined;
                        targetGuard.suspicion_target = undefined;
                        newEvents.push(`${player.name} knocked out ${targetGuard.name}!`);
                    }
                    break;
                }
                case 'use_stun_o_mat': {
                    const stunTiles = new Set<string>();
                    for (let dx = -STUN_O_MAT_RADIUS; dx <= STUN_O_MAT_RADIUS; dx++) {
                        for (let dy = -STUN_O_MAT_RADIUS; dy <= STUN_O_MAT_RADIUS; dy++) {
                            const tx = x + dx;
                            const ty = y + dy;
                            if (tx >= 0 && tx < nextState.map[0].length && ty >= 0 && ty < nextState.map.length) {
                                stunTiles.add(`${tx}-${ty}`);
                            }
                        }
                    }
                    nextState.stunEffect = { x, y, duration: STUN_O_MAT_DURATION, tiles: stunTiles };
                    newEvents.push(`${player.name} deployed a Stun-O-Mat grenade!`);
                    break;
                }
            } // End of switch

            // Find the next step in the plan for this player, if they weren't captured.
            if (nextState.playerStatuses[i] !== 'captured') {
                let nextStepIndex = -1;
                for (let j = currentPlanIndex + 1; j < nextState.plan.length; j++) {
                    if (nextState.plan[j].teamMember === i) {
                        nextStepIndex = j;
                        break;
                    }
                }
                nextState.executionPlanIndices[i] = nextStepIndex;
                if (nextStepIndex !== -1) {
                    nextState.timeForCurrentActions[i] = nextState.plan[nextStepIndex].timeCost;
                }
            }

        } else { // Action is not finished, add animation
            const step = nextState.plan[currentPlanIndex];
            if (step) {
                if (step.action === 'move' && nextState.playerStatuses[i] === 'blocked') {
                    // Don't add a move animation if blocked
                } else {
                    nextState.activeInteractions.push({ x: step.target.x, y: step.target.y, action: step.action, teamMember: i });
                }
            }
        }
    } // End of player processing loop


    // --- 3. Update Security Systems ---
    // Moved before guard updates to ensure vision cones are synced for AI detection
    nextState.monitoredTiles = {};
    if (nextState.camerasActive) {
        for (let i = 0; i < nextState.cameras.length; i++) {
            const cam = nextState.cameras[i];
            if (cam.disabled || cam.looperTimer) continue;
            // Use adjusted elapsedTime (0 for first tick)
            const frameIndex = Math.floor(elapsedTimeSinceStart / cam.period) % cam.pattern.length;
            const pattern = cam.pattern[frameIndex];
            if (pattern) {
                for (let j = 0; j < pattern.length; j++) {
                    const pos = pattern[j];
                    const key = `${pos.x}-${pos.y}`;
                    nextState.monitoredTiles[key] = { status: 'active', orientation: cam.orientation };
                }
            }
        }
    }

    for (let i = 0; i < nextState.laserGrids.length; i++) {
        const grid = nextState.laserGrids[i];
        if (grid.jamTimer && grid.jamTimer > 0) {
            grid.beamsOn = false;
            continue;
        }
        if (grid.timer) {
            const { on, off, offset } = grid.timer;
            const totalCycle = on + off;
            const timeInCycle = (elapsedTimeSinceStart + offset) % totalCycle;
            grid.beamsOn = timeInCycle < on;
        } else {
            grid.beamsOn = grid.active;
        }
    }

    // --- Active Camera Detection Logic ---
    if (nextState.camerasActive) {
        for (const key of Object.keys(nextState.monitoredTiles)) {
            const [cx, cy] = key.split('-').map(Number);
            const playerDetected = nextState.players.find(p =>
                p.x === cx && p.y === cy &&
                nextState.playerStatuses[nextState.players.indexOf(p)] !== 'captured'
            );
            if (playerDetected) {
                triggerLoudAlarm(nextState, playerDetected.name, 'security camera', newEvents);
            }
            if (isEvidenceTile(nextState.map[cy]?.[cx]) || (([TileType.DOOR_LOCKED, TileType.DOOR_LOCKED_ALARMED, TileType.VAULT_DOOR, TileType.VAULT_DOOR_TIMELOCK].includes(nextState.initialMap[cy]?.[cx])) && nextState.map[cy]?.[cx] === TileType.DOOR_OPEN)) {
                triggerLoudAlarm(nextState, 'Security System', 'evidence', newEvents);
            }
        }
    }

    // --- 5. Update Guard State and AI ---
    // Use cached alarm boxes for performance (calculated once at game start)
    const alarmBoxes = nextState.cachedAlarmBoxes || [];
    const timeElapsed = elapsedTimeSinceStart;

    // Use for loop instead of forEach for better performance in hot path
    for (let guardIdx = 0; guardIdx < nextState.guards.length; guardIdx++) {
        const guard = nextState.guards[guardIdx];

        /**
         * Helper to handle guard detection logic.
         * If the alarm system is active, trigger it immediately.
         * If the alarm system is disabled, find the nearest alarm panel and run to it.
         */
        const triggerGuardAlert = (reason: string) => {
            if (nextState.alarmSystemActive) {
                if (nextState.alarmType !== 'loud') {
                    triggerLoudAlarm(nextState, guard.name, reason, newEvents);
                    newEvents.push(`${guard.name} has spotted ${reason}!`);
                }
                guard.status = 'permanently_alerted';
                guard.path_to_alarm = undefined;
                guard.path_to_post = undefined;
                guard.path_to_suspicion = undefined;
                guard.path_to_noise = undefined;
            } else {
                newEvents.push(`${guard.name} spotted ${reason}, but the alarm is disabled! Running to panel!`);
                guard.status = 'running_to_alarm';

                let minPathLength = Infinity;
                let bestPath: { x: number; y: number }[] = [];
                // Use cached alarm boxes if available, otherwise find them
                const targets = (alarmBoxes && alarmBoxes.length > 0) ? alarmBoxes : findAlarmBoxes(nextState.map);

                // Only run to panels that are reachable
                for (const box of targets) {
                    const path = findShortestPath(guard, box, nextState.map, false, [], [], true);
                    if (path.length > 0 && path.length < minPathLength) {
                        minPathLength = path.length;
                        bestPath = path;
                    }
                }

                if (bestPath.length > 0) {
                    guard.path_to_alarm = bestPath;
                } else {
                    // Fallback if no panel is reachable
                    guard.status = 'permanently_alerted';
                    newEvents.push(`${guard.name} checks for an alarm but can't reach any!`);
                }

                // Clear other paths
                guard.path_to_post = undefined;
                guard.path_to_suspicion = undefined;
                guard.path_to_noise = undefined;
            }
        };
        let collisionHandledThisTick = false;
        // Handle knockout status
        if (guard.status === 'knocked_out') {
            if (guard.knockout_timer && guard.knockout_timer > 0) {
                guard.knockout_timer -= 1;
            }
            if (guard.knockout_timer !== undefined && guard.knockout_timer <= 0) {
                guard.status = 'patrolling';
                guard.isDisrupted = true; // Guard is now out of sync with timed patrol
                newEvents.push(`${guard.name} is back on his feet.`);
            }
            continue;
        }

        // Do not process AI for guards guarding a player.
        if (guard.status === 'guarding_captured_player') {
            continue;
        }

        // Handle investigation timers before main state machine
        if (guard.investigation_timer && guard.investigation_timer > 0) {
            guard.investigation_timer--;
            if (guard.investigation_timer <= 0) {
                if (guard.status === 'investigating_suspicion') {
                    // Track the door for closing later (when guard leaves area)
                    if (guard.suspicion_target) {
                        const { x, y } = guard.suspicion_target;
                        if (nextState.map[y]?.[x] === TileType.DOOR_OPEN) {
                            guard.investigated_door = { x, y };
                        }
                    }
                    guard.hasBeenSuspicious = true; // Become permanently more wary
                    guard.suspicion_target = undefined; // Clear the suspicion target so we can detect it again
                }
                // Transition to returning to post
                guard.status = 'returning_to_post';
                const patrolRoute = guard.patrolRoute || [];
                let closestPatrolPointIndex = -1;
                let minDistance = Infinity;

                patrolRoute.forEach((point, index) => {
                    const dist = Math.abs(guard.x - point.x) + Math.abs(guard.y - point.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestPatrolPointIndex = index;
                    }
                });

                if (closestPatrolPointIndex !== -1) {
                    const targetPatrolPoint = patrolRoute[closestPatrolPointIndex];
                    guard.path_to_post = findShortestPath(guard, targetPatrolPoint, nextState.map);
                    guard.resume_patrol_at_index = closestPatrolPointIndex;
                }
            }
            continue; // Guard is paused
        }


        // Handle timed state transitions
        if (guard.status === 'alerted' && guard.alert_timer && guard.alert_timer > 0) {
            guard.alert_timer--;
            // Disable running to alarm routine for now
            /* if (guard.alert_timer <= 0) {
                guard.status = 'running_to_alarm';
                if (alarmBoxes.length > 0) {
                    let minPathLength = Infinity;
                    let bestPath: { x: number; y: number }[] = [];
                    for (const box of alarmBoxes) {
                        const path = findShortestPath(guard, box, nextState.map, false, [], [], true);
                        if (path.length > 0 && path.length < minPathLength) {
                            minPathLength = path.length;
                            bestPath = path;
                        }
                    }
                    guard.path_to_alarm = bestPath;
                }
            } */
            // Just return to patrol if we somehow ended up here
            if (guard.alert_timer <= 0) {
                guard.status = 'patrolling';
            }
            continue; // Guard is paused
        }

        // Handle main AI state machine
        switch (guard.status) {
            case 'patrolling': {
                const vision = calculateGuardVision(guard, nextState.map);
                let spottedEvidence = false;
                let spottedSuspicion = false;
                let suspicionTarget: { x: number; y: number } | null = null;

                // S01 Special: Guard ignores players and evidence (only patrols)
                if (guard.onlyAlertsOnDoorTamper) {
                    // Skip all evidence and player detection for this guard
                } else {
                    // Normal guard behavior

                    // 1. Check for Players in Vision
                    for (const player of nextState.players) {
                        // Skip captured players
                        if (nextState.playerStatuses[nextState.players.indexOf(player)] === 'captured') continue;

                        const playerKey = `${player.x}-${player.y}`;
                        if (vision.has(playerKey)) {
                            // Player spotted!
                            triggerGuardAlert("thief");
                            spottedEvidence = true;
                            break;
                        }
                    }
                    if (guard.status !== 'patrolling') break;

                    // 1b. Check for Knocked Out Guards in Vision
                    for (const otherGuard of nextState.guards) {
                        if (otherGuard.id === guard.id) continue;
                        if (otherGuard.status === 'knocked_out') {
                            if (vision.has(`${otherGuard.x}-${otherGuard.y}`)) {
                                triggerGuardAlert("knocked out guard");
                                spottedEvidence = true;
                                break;
                            }
                        }
                    }
                    if (guard.status !== 'patrolling') break;

                    // 2. Check for Evidence / Suspicious Changes
                    for (const tileKey of vision) {
                        const [vx, vy] = tileKey.split('-').map(Number);
                        const currentTile = nextState.map[vy][vx];
                        const initialTile = nextState.initialMap[vy][vx];

                        if (isEvidenceTile(currentTile)) {
                            spottedEvidence = true;
                            break;
                        }

                        if ([TileType.DOOR_LOCKED, TileType.DOOR_LOCKED_ALARMED, TileType.VAULT_DOOR, TileType.VAULT_DOOR_TIMELOCK].includes(initialTile) && currentTile === TileType.DOOR_OPEN) {
                            spottedEvidence = true;
                            break;
                        }

                        if (!spottedSuspicion && isSuspiciousChange(initialTile, currentTile)) {
                            if (guard.suspicion_target && guard.suspicion_target.x === vx && guard.suspicion_target.y === vy) {
                                continue;
                            }
                            spottedSuspicion = true;
                            suspicionTarget = { x: vx, y: vy };
                        }
                    }
                }

                if (spottedEvidence) {
                    triggerGuardAlert("evidence");
                    break;
                } else if (spottedSuspicion && suspicionTarget) {
                    if (guard.hasBeenSuspicious) {
                        triggerGuardAlert("suspicious activity");
                        break;
                    }

                    guard.status = 'investigating_suspicion';
                    guard.suspicion_target = suspicionTarget;
                    newEvents.push(`${guard.name} is investigating something.`);
                    guard.isDisrupted = true;

                    const targetPos = suspicionTarget;
                    const neighbors = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
                    let investigationSpot: { x: number, y: number } | null = null;
                    let maxDist = -1;

                    for (const move of neighbors) {
                        const nx = targetPos.x + move.dx;
                        const ny = targetPos.y + move.dy;
                        if (nx >= 0 && ny >= 0 && ny < nextState.map.length && nx < nextState.map[0].length && isWalkable(nextState.map[ny][nx])) {
                            const dist = Math.abs(guard.x - nx) + Math.abs(guard.y - ny);
                            if (dist > maxDist) {
                                maxDist = dist;
                                investigationSpot = { x: nx, y: ny };
                            }
                        }
                    }

                    if (investigationSpot) {
                        guard.path_to_suspicion = findShortestPath(guard, investigationSpot, nextState.map);
                    } else {
                        guard.path_to_suspicion = findShortestPath(guard, suspicionTarget, nextState.map);
                    }
                    break;
                }

                if (nextState.noiseEffect && nextState.noiseEffect.source && nextState.noiseEffect.duration > 0 && nextState.noiseEffect.tiles.has(`${guard.x}-${guard.y}`)) {
                    let shouldInvestigate = true;
                    if (nextState.noiseEffect.type === 'stone') {
                        if ((guard.stoneDistractionCount || 0) >= 2) {
                            shouldInvestigate = false;
                            newEvents.push(`${guard.name} ignores the suspicious noise.`);
                        } else {
                            guard.stoneDistractionCount = (guard.stoneDistractionCount || 0) + 1;
                        }
                    }

                    if (shouldInvestigate) {
                        guard.status = 'investigating_noise';
                        guard.noise_source = nextState.noiseEffect.source;
                        guard.path_to_noise = findShortestPath(guard, guard.noise_source, nextState.map);
                        guard.isDisrupted = true;
                        newEvents.push(`${guard.name} heard a noise and is investigating.`);
                        break;
                    }
                }


                if (guard.isStationary) {
                    if (guard.panTimer !== undefined) {
                        guard.panTimer -= 1;
                        if (guard.panTimer <= 0) {
                            guard.panTimer = guard.panPeriod || 3; // Reset timer
                            if (guard.panSequence && guard.panSequence.length > 0) {
                                guard.panIndex = ((guard.panIndex || 0) + 1) % guard.panSequence.length;
                                guard.orientation = guard.panSequence[guard.panIndex];
                            }
                        }
                    }
                } else if (guard.isDisrupted) {
                    if (guard.patrolRoute && guard.patrolRoute.length > 0) {
                        const nextIndex = (guard.patrolIndex + 1) % guard.patrolRoute.length;
                        const nextPos = guard.patrolRoute[nextIndex];
                        if (isWalkable(nextState.map[nextPos.y][nextPos.x])) {
                            const moved = guard.x !== nextPos.x || guard.y !== nextPos.y;
                            guard.x = nextPos.x;
                            guard.y = nextPos.y;
                            guard.patrolIndex = nextIndex;
                            // Track moves for despawn logic
                            if (moved && guard.despawnAfterMoves !== undefined) {
                                guard.moveCounter = (guard.moveCounter || 0) + 1;
                            }
                        }
                    }
                } else if (guard.patrolRoute && guard.patrolRoute.length > 0) {
                    // Use simple incremental patrol to prevent teleporting when timers change (e.g. alarm triggering)
                    // This creates persistent, stateful movement rather than time-derived positioning.
                    if (guard.patrolIndex === undefined) guard.patrolIndex = 0;

                    const nextIndex = (guard.patrolIndex + 1) % guard.patrolRoute.length;
                    const nextPos = guard.patrolRoute[nextIndex];

                    // Force move along the pre-calculated route
                    const moved = guard.x !== nextPos.x || guard.y !== nextPos.y;
                    guard.x = nextPos.x;
                    guard.y = nextPos.y;
                    guard.patrolIndex = nextIndex;

                    // Track moves for despawn logic
                    if (moved && guard.despawnAfterMoves !== undefined) {
                        guard.moveCounter = (guard.moveCounter || 0) + 1;
                    }
                }
                break;
            }
            case 'running_to_alarm': {
                const movesThisTick = 2; // Double speed
                for (let move = 0; move < movesThisTick; move++) {
                    if (!guard.path_to_alarm || guard.path_to_alarm.length === 0) {
                        // Re-activate alarm system if it was disabled
                        nextState.alarmSystemActive = true;
                        triggerLoudAlarm(nextState, guard.name, "alarm panel", newEvents);
                        guard.status = 'permanently_alerted';
                        break;
                    }

                    // Peek at the next tile
                    const nextPosPeek = guard.path_to_alarm[0];
                    const tileAtNextPos = nextState.map[nextPosPeek.y][nextPosPeek.x];

                    if ([TileType.DOOR_LOCKED, TileType.DOOR_LOCKED_ALARMED].includes(tileAtNextPos)) {
                        // Locked door: Unlock it and pause for 1 second (break tick loop)
                        nextState.map[nextPosPeek.y][nextPosPeek.x] = TileType.DOOR_OPEN;
                        newEvents.push(`${guard.name} unlocks a door!`);
                        break; // End move for this tick
                    } else if (tileAtNextPos === TileType.DOOR_CLOSED) {
                        // Closed door (unlocked): Open instantly and continue moving
                        nextState.map[nextPosPeek.y][nextPosPeek.x] = TileType.DOOR_OPEN;
                        newEvents.push(`${guard.name} bursts through a door!`);
                    }

                    // Proceed with movement
                    const nextPos = guard.path_to_alarm.shift();
                    if (!nextPos) break; // Should not happen given peek check

                    const moved = guard.x !== nextPos.x || guard.y !== nextPos.y;
                    guard.x = nextPos.x;
                    guard.y = nextPos.y;
                    // Track moves for despawn logic
                    if (moved && guard.despawnAfterMoves !== undefined) {
                        guard.moveCounter = (guard.moveCounter || 0) + 1;
                    }

                    for (const [pIndex, p] of nextState.players.entries()) {
                        if (p.x === guard.x && p.y === guard.y) {
                            if (handleCollision(p, guard, pIndex)) {
                                collisionHandledThisTick = true;
                                break;
                            }
                        }
                    }

                    if (collisionHandledThisTick) break;
                }
                break;
            }
            case 'permanently_alerted': {
                // Alerted guards move at double speed and aggressively chase any visible non-captured player.
                const movesThisTick = 2;
                for (let move = 0; move < movesThisTick; move++) {
                    // 1. Recalculate vision from current position each sub-step.
                    const alertVision = calculateGuardVision(guard, nextState.map);

                    // 2. Find the closest visible, non-captured player.
                    let chaseTarget: { x: number; y: number } | null = null;
                    let closestDist = Infinity;
                    for (const [pIdx, p] of nextState.players.entries()) {
                        if (nextState.playerStatuses[pIdx] === 'captured') continue;
                        if (alertVision.has(`${p.x}-${p.y}`)) {
                            const d = Math.abs(p.x - guard.x) + Math.abs(p.y - guard.y);
                            if (d < closestDist) {
                                closestDist = d;
                                chaseTarget = { x: p.x, y: p.y };
                            }
                        }
                    }

                    if (chaseTarget) {
                        // Build/refresh path toward the player.
                        guard.path_to_suspicion = findShortestPath(guard, chaseTarget, nextState.map);
                    }

                    // 3. Move along cached path toward target (player or last known position).
                    if (guard.path_to_suspicion && guard.path_to_suspicion.length > 0) {
                        // Peek ahead to handle doors.
                        const peekPos = guard.path_to_suspicion[0];
                        const peekTile = nextState.map[peekPos.y]?.[peekPos.x];
                        if (peekTile && [TileType.DOOR_LOCKED, TileType.DOOR_LOCKED_ALARMED, TileType.DOOR_CLOSED].includes(peekTile)) {
                            nextState.map[peekPos.y][peekPos.x] = TileType.DOOR_OPEN;
                            newEvents.push(`${guard.name} bursts through a door!`);
                            break; // Opening a door costs the sub-step.
                        }

                        const nextPos = guard.path_to_suspicion.shift();
                        if (nextPos) {
                            guard.x = nextPos.x;
                            guard.y = nextPos.y;
                            if (guard.despawnAfterMoves !== undefined) {
                                guard.moveCounter = (guard.moveCounter || 0) + 1;
                            }
                        }
                    } else if (guard.patrolRoute && guard.patrolRoute.length > 0) {
                        // No player in sight and no active path — aggressively patrol to find intruder.
                        if (guard.patrolIndex === undefined) guard.patrolIndex = 0;
                        const nextIndex = (guard.patrolIndex + 1) % guard.patrolRoute.length;
                        const nextPos = guard.patrolRoute[nextIndex];
                        guard.x = nextPos.x;
                        guard.y = nextPos.y;
                        guard.patrolIndex = nextIndex;
                    }

                    // 4. Check collision after each sub-step.
                    let subStepCollision = false;
                    for (const [pIndex, p] of nextState.players.entries()) {
                        if (p.x === guard.x && p.y === guard.y) {
                            if (handleCollision(p, guard, pIndex)) {
                                collisionHandledThisTick = true;
                                subStepCollision = true;
                                break;
                            }
                        }
                    }
                    if (subStepCollision) break;
                }
                break;
            }
            case 'investigating_suspicion': {
                if (guard.path_to_suspicion && guard.path_to_suspicion.length > 0) {
                    const nextPos = guard.path_to_suspicion.shift();
                    if (nextPos) {
                        const moved = guard.x !== nextPos.x || guard.y !== nextPos.y;
                        guard.x = nextPos.x;
                        guard.y = nextPos.y;
                        // Track moves for despawn logic
                        if (moved && guard.despawnAfterMoves !== undefined) {
                            guard.moveCounter = (guard.moveCounter || 0) + 1;
                        }
                    } else {
                        // Safe fallback if shift returns undefined unexpectedly
                        guard.investigation_timer = 2;
                        break;
                    }

                    // Check if guard sees a thief during investigation
                    const vision = calculateGuardVision(guard, nextState.map);
                    let seesThief = false;

                    for (const player of nextState.players) {
                        const playerKey = `${player.x}-${player.y}`;
                        if (vision.has(playerKey)) {
                            seesThief = true;
                            break;
                        }
                    }

                    if (!seesThief) {
                        for (const otherGuard of nextState.guards) {
                            if (otherGuard.id === guard.id) continue;
                            if (otherGuard.status === 'knocked_out') {
                                if (vision.has(`${otherGuard.x}-${otherGuard.y}`)) {
                                    seesThief = true; // Use seesThief logic to trigger alarm
                                    break;
                                }
                            }
                        }
                    }

                    if (seesThief) {
                        triggerGuardAlert("thief");
                        break;
                    }

                    // Check if guard sees additional suspicious activity along the way
                    let seesMoreEvidence = false;

                    for (const tileKey of vision) {
                        const [vx, vy] = tileKey.split('-').map(Number);

                        // Skip the tile we're currently investigating - it's not "additional" evidence
                        if (guard.suspicion_target && guard.suspicion_target.x === vx && guard.suspicion_target.y === vy) {
                            continue;
                        }

                        const currentTile = nextState.map[vy]?.[vx];
                        const initialTile = nextState.initialMap[vy]?.[vx];

                        if (!currentTile || !initialTile) {
                            continue;
                        }

                        if (isEvidenceTile(currentTile) || ([TileType.DOOR_LOCKED, TileType.DOOR_LOCKED_ALARMED, TileType.VAULT_DOOR, TileType.VAULT_DOOR_TIMELOCK].includes(initialTile) && currentTile === TileType.DOOR_OPEN)) {
                            seesMoreEvidence = true;
                            break;
                        }

                        // Check for additional suspicious changes
                        if (isSuspiciousChange(initialTile, currentTile)) {
                            seesMoreEvidence = true;
                            break;
                        }
                    }

                    if (seesMoreEvidence) {
                        triggerGuardAlert("more evidence");
                        // Wait for loop/tick to handle new status
                    }
                } else {
                    guard.investigation_timer = 2; // Pause for 2s
                }
                break;
            }
            case 'investigating_noise': {
                if (guard.path_to_noise && guard.path_to_noise.length > 0) {
                    const nextPos = guard.path_to_noise.shift();
                    if (nextPos) {
                        const moved = guard.x !== nextPos.x || guard.y !== nextPos.y;
                        guard.x = nextPos.x;
                        guard.y = nextPos.y;
                        if (moved && guard.despawnAfterMoves !== undefined) {
                            guard.moveCounter = (guard.moveCounter || 0) + 1;
                        }

                        // Check if guard sees a thief during investigation
                        const vision = calculateGuardVision(guard, nextState.map);
                        let seesThief = false;
                        for (const player of nextState.players) {
                            if (nextState.playerStatuses[nextState.players.indexOf(player)] === 'captured') continue;
                            const playerKey = `${player.x}-${player.y}`;
                            if (vision.has(playerKey)) {
                                seesThief = true;
                                break;
                            }
                        }
                        if (!seesThief) {
                            for (const otherGuard of nextState.guards) {
                                if (otherGuard.id === guard.id) continue;
                                if (otherGuard.status === 'knocked_out') {
                                    if (vision.has(`${otherGuard.x}-${otherGuard.y}`)) {
                                        seesThief = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (seesThief) {
                            triggerGuardAlert("thief");
                            break;
                        }
                    } else {
                        guard.investigation_timer = 2; // Pause for 2s
                    }
                } else {
                    guard.investigation_timer = 2; // Pause for 2s
                }
                break;
            }
            case 'returning_to_post': {
                if (guard.path_to_post && guard.path_to_post.length > 0) {
                    const nextPos = guard.path_to_post.shift();
                    if (nextPos) {
                        const moved = guard.x !== nextPos.x || guard.y !== nextPos.y;
                        guard.x = nextPos.x;
                        guard.y = nextPos.y;
                        // Track moves for despawn logic
                        if (moved && guard.despawnAfterMoves !== undefined) {
                            guard.moveCounter = (guard.moveCounter || 0) + 1;
                        }

                        // Close investigated door immediately when passing it
                        if (guard.investigated_door) {
                            const { x, y } = guard.investigated_door;
                            // Check if guard is technically "at" the door (just moved onto it)
                            // But usually we want to close it after leaving.
                            // The original code checked `guard.x === x && guard.y === y` which means "moved onto door".
                            // If we want to strictly follow "close after him", we should check previous pos?
                            // But staying consistent with existing logic for now, unless it's proven broken.
                            if (guard.x === x && guard.y === y) {
                                if (nextState.map[y]?.[x] === TileType.DOOR_OPEN) {
                                    nextState.map[y][x] = TileType.DOOR_CLOSED;
                                    newEvents.push(`${guard.name} closed the door behind them.`);
                                }
                                guard.investigated_door = undefined;
                            }
                        }

                        // Check if guard sees a thief while returning
                        const vision = calculateGuardVision(guard, nextState.map);
                        let seesThief = false;
                        for (const player of nextState.players) {
                            if (nextState.playerStatuses[nextState.players.indexOf(player)] === 'captured') continue;
                            const playerKey = `${player.x}-${player.y}`;
                            if (vision.has(playerKey)) {
                                seesThief = true;
                                break;
                            }
                        }

                        if (!seesThief) {
                            for (const otherGuard of nextState.guards) {
                                if (otherGuard.id === guard.id) continue;
                                if (otherGuard.status === 'knocked_out') {
                                    if (vision.has(`${otherGuard.x}-${otherGuard.y}`)) {
                                        seesThief = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (seesThief) {
                            triggerGuardAlert("thief");
                            break;
                        }
                        if (guard.path_to_post.length === 0) {
                            if (guard.investigated_door) {
                                guard.investigated_door = undefined;
                            }
                            guard.status = 'patrolling';
                            guard.isDisrupted = true;
                            if (guard.resume_patrol_at_index !== undefined) {
                                guard.patrolIndex = guard.resume_patrol_at_index;
                            }
                        }
                    } else {
                        // Fallback if shift returns undefined unexpectedly
                        guard.status = 'patrolling';
                        guard.isDisrupted = true;
                    }
                } else {
                    guard.status = 'patrolling';
                    guard.isDisrupted = true;
                    if (guard.resume_patrol_at_index !== undefined) {
                        guard.patrolIndex = guard.resume_patrol_at_index;
                    }
                }
                break;
            }
        }

        // Check for collision after any guard move, unless one was already handled mid-run
        if (!collisionHandledThisTick) {
            for (const [pIndex, p] of nextState.players.entries()) {
                if (p.x === guard.x && p.y === guard.y) {
                    if (handleCollision(p, guard, pIndex)) {
                        collisionHandledThisTick = true;
                        break;
                    }
                }
            }
        }

        if (collisionHandledThisTick) {
            // If a collision changed the guard's state, skip orientation logic to avoid errors
            continue;
        }

        // --- Consolidated Guard Orientation Logic ---
        let nextPos: { x: number, y: number } | undefined = undefined;

        switch (guard.status) {
            case 'patrolling':
                if (guard.patrolRoute && guard.patrolRoute.length > 0) {
                    const nextIndex = (guard.patrolIndex + 1) % guard.patrolRoute.length;
                    nextPos = guard.patrolRoute[nextIndex];
                }
                break;
            case 'running_to_alarm':
                if (guard.path_to_alarm && guard.path_to_alarm.length > 0) {
                    nextPos = guard.path_to_alarm[0];
                }
                break;
            case 'investigating_suspicion':
                if (guard.path_to_suspicion && guard.path_to_suspicion.length > 0) {
                    nextPos = guard.path_to_suspicion[0];
                }
                break;
            case 'investigating_noise':
                if (guard.path_to_noise && guard.path_to_noise.length > 0) {
                    nextPos = guard.path_to_noise[0];
                }
                break;
            case 'returning_to_post':
                if (guard.path_to_post && guard.path_to_post.length > 0) {
                    nextPos = guard.path_to_post[0];
                }
                break;
            case 'permanently_alerted':
                // For orientation: face the direction of the active chase path.
                if (guard.path_to_suspicion && guard.path_to_suspicion.length > 0) {
                    nextPos = guard.path_to_suspicion[0];
                }
                break;
        }

        if (nextPos) {
            if (nextPos.x > guard.x) guard.orientation = 'right';
            else if (nextPos.x < guard.x) guard.orientation = 'left';
            else if (nextPos.y > guard.y) guard.orientation = 'down';
            else if (nextPos.y < guard.y) guard.orientation = 'up';
        }
    }


    // --- S01 Special: Guard Despawn Logic ---
    // Remove guards that have exceeded their move counter
    const guardsToRemove: number[] = [];
    nextState.guards.forEach((guard, index) => {
        if (guard.despawnAfterMoves !== undefined && guard.moveCounter !== undefined) {
            if (guard.moveCounter >= guard.despawnAfterMoves) {
                guardsToRemove.push(index);
                newEvents.push(`${guard.name} has left the area.`);
            }
        }
    });
    // Remove guards in reverse order to maintain indices
    for (let i = guardsToRemove.length - 1; i >= 0; i--) {
        nextState.guards.splice(guardsToRemove[i], 1);
    }

    // --- 6. Vision and Detection Logic ---


    // --- 6. Vision and Detection Logic ---
    const allGuardVisionTiles = new Set<string>();
    for (let i = 0; i < nextState.guards.length; i++) {
        const guard = nextState.guards[i];
        const vision = calculateGuardVision(guard, nextState.map);
        for (const tileKey of vision) {
            allGuardVisionTiles.add(tileKey);
        }
    }
    nextState.guardVisionTiles = allGuardVisionTiles;

    // --- 7. Check Win/Loss Conditions ---
    const activePlayers = nextState.players.filter((_, i) => nextState.playerStatuses[i] !== 'captured');
    if (activePlayers.length === 0 && nextState.players.length > 0) {
        nextState.gameOver = true;
        nextState.message = 'All agents have been captured!';
        return { nextState, newEvents };
    }

    const allAtCar = activePlayers.every(p => nextState.map[p.y]?.[p.x] === TileType.CAR);
    if (allAtCar && activePlayers.length > 0) {
        if (!nextState.gameWon && nextState.objectiveStatus.primary === 'pending' && !scenario.primaryTarget) {
            if (nextState.stolenValue > nextState.totalLootValue * 0.75) {
                nextState.objectiveStatus.primary = 'success';
            } else {
                nextState.objectiveStatus.primary = 'failed';
            }
        }
        nextState.gameWon = true;

        // If some players were captured previously, loot is lost even if others reached the car.
        if (activePlayers.length < nextState.players.length) {
            nextState.stolenValue = 0;
            nextState.message = 'Success? You escaped, but because crew members were captured, the payout was lost!';
            newEvents.push("THE LOOT WAS LOST: Crew members were left behind.");
        } else {
            nextState.message = 'Success! You made it to the getaway car with the loot!';
        }
        return { nextState, newEvents };
    }

    return { nextState, newEvents };
};
