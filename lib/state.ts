/**
 * @file state.ts
 * @description
 * This file contains core functions for managing and calculating game state.
 * It includes functions to create the initial game state from a scenario,
 * calculate metrics for a given plan (like total time and potential value),
 * and project the state of the world into the future based on a plan.
 */

import { GameState, PlanStep, Scenario, TileType, Player, Camera, Guard, ActiveLaserGrid, PressurePlate, TimeLock } from '../types';
import { EXECUTION_START_TIME, CASE_SMASH_PENALTY_MIN, CASE_SMASH_PENALTY_MAX, TIME_COST, CONSUMABLE_ITEMS, NOISE_RANGE, DYNAMITE_BLAST_RADIUS, STUN_O_MAT_RADIUS, STUN_O_MAT_DURATION } from '../constants';
import { calculatePatrolRoute, findShortestPath } from './pathfinding';
import { calculateNoiseSpread } from './noise';
import { isWalkable, isEvidenceTile, isSuspiciousChange, isObstacleForLoS } from './tiles';
import { calculateGuardVision, canGuardSeeTile } from './guards';

/**
 * Creates the initial `GameState` object for a new game session from a given scenario.
 * It sets up all the dynamic state properties and pre-calculates necessary data, like guard patrol routes.
 * The function signature is updated to accept a 'players' array and dynamically initialize player-related state.
 * @param {Scenario} scenario - The scenario data to load.
 * @param {Player[]} players - The array of player characters for this session.
 * @returns {GameState} The fully initialized game state object, ready for the planning phase.
 */
export function createInitialState(scenario: Scenario, players: Player[]): GameState {
    // Deep copy guards from the scenario and ensure their starting position is correct.
    const guards: Guard[] = (scenario.guards || []).map(g => {
        const guardCopy = JSON.parse(JSON.stringify(g)); // Deep copy to be safe

        const isStationary = !guardCopy.patrolWaypoints || guardCopy.patrolWaypoints.length < 2;

        if (isStationary) {
            guardCopy.isStationary = true;
            guardCopy.panPeriod = guardCopy.panPeriod || 3;
            guardCopy.panTimer = guardCopy.panPeriod; // Initial pan time
            guardCopy.panIndex = 0;

            const possibleOrientations: ('up' | 'down' | 'left' | 'right')[] = ['up', 'right', 'down', 'left'];
            guardCopy.panSequence = possibleOrientations.filter(orientation => {
                let checkX = guardCopy.x;
                let checkY = guardCopy.y;
                if (orientation === 'up') checkY--;
                else if (orientation === 'down') checkY++;
                else if (orientation === 'left') checkX--;
                else if (orientation === 'right') checkX++;
                const tile = scenario.map[checkY]?.[checkX];
                return tile !== undefined && isWalkable(tile); // Check if they are not staring at a wall
            });

            if (guardCopy.panSequence.length > 0) {
                guardCopy.orientation = guardCopy.panSequence[0];
            }
        } else {
            // If patrolRoute is missing but waypoints exist, calculate it.
            if ((!guardCopy.patrolRoute || guardCopy.patrolRoute.length === 0) && guardCopy.patrolWaypoints) {
                guardCopy.patrolRoute = calculatePatrolRoute(guardCopy.patrolWaypoints, scenario.map);
            }

            // Ensure the guard's starting position is the first point of their patrol route.
            if (guardCopy.patrolRoute && guardCopy.patrolRoute.length > 0) {
                guardCopy.x = guardCopy.patrolRoute[0].x;
                guardCopy.y = guardCopy.patrolRoute[0].y;

                // Sync initial orientation with projected first move
                if (guardCopy.patrolRoute.length > 1) {
                    const nextPos = guardCopy.patrolRoute[1];
                    const currentPos = guardCopy.patrolRoute[0];
                    if (nextPos.x > currentPos.x) guardCopy.orientation = 'right';
                    else if (nextPos.x < currentPos.x) guardCopy.orientation = 'left';
                    else if (nextPos.y > currentPos.y) guardCopy.orientation = 'down';
                    else if (nextPos.y < currentPos.y) guardCopy.orientation = 'up';
                }
            }
        }

        // NEW: Initialize advanced AI state
        guardCopy.stoneDistractionCount = 0;
        guardCopy.isPermanentlySuspicious = false;
        guardCopy.isDoingWiderScan = false;

        return guardCopy;
    });

    // Initialize the dynamic state for laser grids.
    const laserGrids: ActiveLaserGrid[] = (scenario.laserGrids || []).map(grid => {
        let beamsOn = true;
        // If it's a timed grid, calculate if the beams are on at time 0.
        if (grid.timer) {
            const { on, off, offset } = grid.timer;
            const totalCycle = on + off;
            const timeInCycle = (0 + offset) % totalCycle;
            beamsOn = timeInCycle < on;
        }
        return {
            ...grid,
            active: true, // All grids start as active.
            beamsOn: beamsOn,
        };
    });

    const pressurePlates: PressurePlate[] = scenario.pressurePlates ? scenario.pressurePlates.map(p => ({ ...p })) : [];
    const timeLocks: TimeLock[] = scenario.timeLocks ? scenario.timeLocks.map(tl => ({ ...tl })) : [];

    const totalLootValue = Object.values(scenario.treasures).reduce<number>((sum, treasure) => {
        const value = typeof treasure === 'number' ? treasure : treasure.value;
        return sum + value;
    }, 0);

    const initialInventory: Record<string, number> = {};
    Object.keys(CONSUMABLE_ITEMS).forEach(key => {
        initialInventory[key] = 0;
    });

    return {
        map: scenario.map.map(row => [...row]),
        initialMap: scenario.map.map(row => [...row]),
        players: players.map(p => ({ ...p })),
        guards: guards,
        cameras: scenario.cameras.map(c => ({ ...c })),
        laserGrids: laserGrids,
        pressurePlates: pressurePlates,
        timeLocks: timeLocks,
        treasures: Object.fromEntries(
            Object.entries(scenario.treasures).map(([key, treasure]) => {
                const value = typeof treasure === 'number' ? treasure : treasure.value;
                const containsKey = typeof treasure === 'object' && treasure.containsKey;
                return [key, { value, robbed: false, containsKey }];
            })
        ),
        policeCar: null,
        inventory: initialInventory,
        currentPlayer: 0,
        stolenValue: 0,
        potentialValue: 0,
        totalLootValue,
        message: scenario.initialMessage,
        gameOver: false,
        gameWon: false,
        // Pickpocket Mechanic
        playerKeys: Array(players.length).fill(0),
        pickpocketedGuards: new Set(),
        // Performance cache - calculate alarm boxes once
        cachedAlarmBoxes: (() => {
            const boxes: { x: number; y: number }[] = [];
            scenario.map.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile === TileType.ALARM_BOX) {
                        boxes.push({ x, y });
                    }
                });
            });
            return boxes;
        })(),
        // FIX: Initialize missing GameState properties.
        capturedPlayers: [],
        phase: 'planning',
        plan: [],
        plannedTime: 0,
        playerPlannedTimes: Array(players.length).fill(0),
        executionTimer: EXECUTION_START_TIME,
        initialExecutionTimer: EXECUTION_START_TIME,
        executionPlanIndices: Array(players.length).fill(-1),
        timeForCurrentActions: Array(players.length).fill(0),
        playerStatuses: Array(players.length).fill('executing'),
        playerKnockoutTimers: Array(players.length).fill(0),
        playerFreezeCharges: Array(players.length).fill(1),
        activeInteractions: [],
        activeFuses: [],
        activeLances: [],
        alarmSystemActive: true,
        camerasActive: true,
        monitoredTiles: {},
        guardVisionTiles: new Set(),
        isDoorSmashed: false,
        // FIX: Initialize missing GameState properties.
        explosivesDetonated: false,
        alarmType: 'none',
        isEscaping: false,
        noiseEffect: null,
        explosionEffect: null,
        blastEffect: null,
        heat: 0,
        objectiveStatus: {
            stealth: 'pending',
            speed: 'pending',
            primary: 'pending',
            secondary: 'pending',
        },
        playerReactiveActions: Array(players.length).fill(null),
        playerReactiveActionTimers: Array(players.length).fill(0),
    };
}

/**
 * Calculates key metrics for a given plan, such as total time, potential value, and whether any doors were smashed.
 * This function is used to update the UI display during the planning phase.
 * The function signature is updated to accept the full gameState to handle dynamic player counts and inventory.
 * @param {PlanStep[]} plan - The current heist plan.
 * @param {Scenario} scenario - The static data for the current level.
 * @param {GameState} gameState - The current game state, used for initial inventory and player count.
 * @returns An object containing the calculated metrics.
 */
// FIX: Update function signature to accept gameState
export function calculatePlanMetrics(plan: PlanStep[], scenario: Scenario, gameState: GameState): {
    potentialValue: number;
    plannedTime: number;
    isDoorSmashed: boolean;
    playerPlannedTimes: number[];
    projectedInventory: Record<string, number>;
} {
    let newPotentialValue = 0;
    let newIsDoorSmashed = false;
    const playerPlannedTimes: number[] = Array(gameState.players.length).fill(0);
    const projectedInventory = { ...gameState.inventory };

    // A temporary state to track how treasures are opened, to calculate value penalties for smashing.
    const tempTreasureState: { [coord: string]: 'intact' | 'smashed' | 'picked' | 'robbed' | 'cut' | 'blown' } = {};

    for (const step of plan) {
        if (playerPlannedTimes[step.teamMember] !== undefined) {
            playerPlannedTimes[step.teamMember] += step.timeCost;
        }
        const { x, y } = step.target;
        const coord = `${x}-${y}`;

        if (step.action === 'smash_door') newIsDoorSmashed = true;

        // Project inventory consumption
        const itemUsed = Object.values(CONSUMABLE_ITEMS).find(item => item.action === step.action);
        if (itemUsed) {
            // This logic is for projection of usage, not buying. It correctly reduces the count.
            projectedInventory[itemUsed.id] = (projectedInventory[itemUsed.id] || 0) - 1;
        }

        if (scenario.treasures[coord]) {
            if (step.action === 'smash') tempTreasureState[coord] = 'smashed';
            if (step.action === 'lockpick_case') tempTreasureState[coord] = 'picked';
            if (step.action === 'use_glass_cutter') tempTreasureState[coord] = 'cut';
            // Approximate effect of dynamite for value calculation
            if (step.action === 'plant_dynamite') tempTreasureState[coord] = 'blown';
        }

        if (step.action === 'rob' && tempTreasureState[coord] !== 'robbed') {
            const treasureData = scenario.treasures[coord];
            const baseValue = typeof treasureData === 'number' ? treasureData : (treasureData?.value || 0);
            let finalValue = baseValue;

            // Apply a value penalty if the container was smashed and player is not a thief
            if (tempTreasureState[coord] === 'smashed') {
                const hasThiefSkill = (gameState.players[step.teamMember].skills.thief || 0) > 0;
                if (!hasThiefSkill) {
                    finalValue *= (1 - CASE_SMASH_PENALTY_MAX);
                }
            } else if (tempTreasureState[coord] === 'blown') {
                // Simplified penalty for planning phase, assuming mid-level skill
                finalValue *= 0.75;
            }

            newPotentialValue += finalValue;
            tempTreasureState[coord] = 'robbed';
        }
    }

    // The total plan time is determined by the player whose plan takes the longest.
    const newPlannedTime = playerPlannedTimes.length > 0 ? Math.max(...playerPlannedTimes) : 0;

    return {
        potentialValue: newPotentialValue,
        plannedTime: newPlannedTime,
        isDoorSmashed: newIsDoorSmashed,
        playerPlannedTimes: playerPlannedTimes,
        projectedInventory,
    };
};

/**
 * Simulates the execution of a plan up to a specific point in time and returns the resulting state of the world.
 * This is the core function for providing the "preview" in the planning phase, showing the player
 * where guards will be, what doors will be open, etc., at the time of their next action.
 * The function signature is updated to accept a 'players' array to dynamically handle player counts.
 * @param {PlanStep[]} plan - The current heist plan.
 * @param {Scenario} scenario - The static data for the current level.
 * @param {Player[]} players - The initial player objects for the session.
 * @param {number} time - The point in time to project the state to.
 * @returns An object containing the projected state of the map, players, and security systems.
 */
export function getProjectedStateAtTime(plan: PlanStep[], scenario: Scenario, players: Player[], time: number): {
    projectedMap: TileType[][],
    projectedPlayers: Player[],
    projectedCameras: Camera[],
    projectedCamerasActive: boolean,
    projectedGuards: Guard[],
    projectedLaserGrids: ActiveLaserGrid[],
    projectedPressurePlates: PressurePlate[],
    projectedActiveFuses: { x: number, y: number, timer: number, blastRadius: Set<string> }[],
    projectedStunEffect: { x: number, y: number, duration: number, tiles: Set<string> } | null,
    detectedHiddenPlates: Set<string>,
    projectedPlayerKeys: number[],
    projectedPickpocketedGuards: Set<number>
} {
    // Start with fresh copies of the initial scenario data.
    const projectedMap = scenario.map.map(row => [...row]);
    const projectedPlayers: Player[] = players.map(p => ({ ...p }));
    let projectedCameras: Camera[] = scenario.cameras.map(c => ({ ...c }));
    let projectedCamerasActive = true;
    let projectedLaserGrids: ActiveLaserGrid[] = (scenario.laserGrids || []).map(grid => ({
        ...grid,
        active: true,
        beamsOn: true,
    }));
    let projectedPressurePlates: PressurePlate[] = (scenario.pressurePlates || []).map(p => ({ ...p }));
    // Augment the plan with calculated start and end times for each step to make simulation easier.
    const currentPlayerTimes: number[] = Array(players.length).fill(0);
    const projectedFuses: { x: number, y: number, explosionTime: number, timer: number }[] = [];
    const projectedStuns: { x: number, y: number, startTime: number, endTime: number, tiles: Set<string> }[] = [];
    const projectedLances: { x: number, y: number, openTime: number }[] = [];
    let projectedAlarmSystemActive = true; // Alarm system is active by default in scenarios
    const tileChangeTimes = new Map<string, number>();

    // Create a timed plan to know WHEN each step starts and ends.
    const timedPlan = plan.map(step => {
        const startTime = currentPlayerTimes[step.teamMember];
        const endTime = startTime + step.timeCost;
        currentPlayerTimes[step.teamMember] = endTime; // Update player's current time for subsequent steps

        if (step.action === 'plant_dynamite') {
            projectedFuses.push({ x: step.target.x, y: step.target.y, timer: step.dynamiteTimer || 10, explosionTime: endTime + (step.dynamiteTimer || 10) });
        }
        if (step.action === 'use_stun_o_mat') {
            const stunTiles = new Set<string>();
            for (let dx = -STUN_O_MAT_RADIUS; dx <= STUN_O_MAT_RADIUS; dx++) {
                for (let dy = -STUN_O_MAT_RADIUS; dy <= STUN_O_MAT_RADIUS; dy++) {
                    const tx = step.target.x + dx;
                    const ty = step.target.y + dy;
                    if (tx >= 0 && tx < projectedMap[0].length && ty >= 0 && ty < projectedMap.length) {
                        stunTiles.add(`${tx}-${ty}`);
                    }
                }
            }
            projectedStuns.push({ x: step.target.x, y: step.target.y, startTime: endTime, endTime: endTime + STUN_O_MAT_DURATION, tiles: stunTiles });
        }
        if (step.action === 'use_thermic_lance') {
            projectedLances.push({ x: step.target.x, y: step.target.y, openTime: endTime });
        }
        return { ...step, startTime, endTime };
    }).sort((a, b) => a.endTime - b.endTime);

    // Process timed events like explosions first to set the base map state.
    for (const fuse of projectedFuses) {
        if (fuse.explosionTime <= time) {
            const tile = projectedMap[fuse.y][fuse.x];
            if (tile === TileType.SAFE || tile === TileType.SAFE_ALARMED || tile === TileType.SAFE_TIMELOCK) {
                projectedMap[fuse.y][fuse.x] = TileType.SAFE_SMASHED;
                tileChangeTimes.set(`${fuse.x}-${fuse.y}`, fuse.explosionTime);
            }
            if (tile === TileType.VAULT_DOOR || tile === TileType.VAULT_DOOR_TIMELOCK) {
                projectedMap[fuse.y][fuse.x] = TileType.DOOR_SMASHED;
                tileChangeTimes.set(`${fuse.x}-${fuse.y}`, fuse.explosionTime);
            }
        }
    }

    for (const lance of projectedLances) {
        if (lance.openTime <= time) {
            const tile = projectedMap[lance.y][lance.x];
            if (tile === TileType.SAFE || tile === TileType.SAFE_ALARMED) {
                projectedMap[lance.y][lance.x] = TileType.SAFE_OPENED;
                tileChangeTimes.set(`${lance.x}-${lance.y}`, lance.openTime);
            }
        }
    }

    // Apply the effects of all actions that have *finished* by the target time.
    const completedSteps = timedPlan.filter(step => step.endTime <= time);

    for (const step of completedSteps) {
        const { x, y } = step.target;
        const tile = projectedMap[y]?.[x];
        const originalTile = scenario.map[y]?.[x];

        const oldTile = projectedMap[y]?.[x];

        // This switch statement simulates the effect of each completed action on the map and security systems.
        switch (step.action) {
            case 'move': projectedPlayers[step.teamMember].x = x; projectedPlayers[step.teamMember].y = y; break;
            case 'unlock': case 'open_door': case 'use_skeleton_key': projectedMap[y][x] = TileType.DOOR_OPEN; break;
            case 'smash_door': projectedMap[y][x] = TileType.DOOR_SMASHED; break;
            case 'close_door': projectedMap[y][x] = TileType.DOOR_CLOSED; break;
            case 'smash': if (tile === TileType.DISPLAY_CASE || tile === TileType.DISPLAY_CASE_ALARMED) projectedMap[y][x] = TileType.DISPLAY_CASE_SMASHED; break;
            case 'lockpick_case': case 'use_glass_cutter': if (tile === TileType.DISPLAY_CASE || tile === TileType.DISPLAY_CASE_ALARMED) projectedMap[y][x] = TileType.DISPLAY_CASE_OPENED; break;
            case 'close_case': if (tile === TileType.DISPLAY_CASE_OPENED || tile === TileType.DISPLAY_CASE_SMASHED || tile === TileType.DISPLAY_CASE_ROBBED) projectedMap[y][x] = originalTile; break;
            case 'crack':
                if (tile === TileType.SAFE || tile === TileType.SAFE_ALARMED || tile === TileType.SAFE_TIMELOCK) projectedMap[y][x] = TileType.SAFE_OPENED;
                if (tile === TileType.VAULT_DOOR || tile === TileType.VAULT_DOOR_TIMELOCK) projectedMap[y][x] = TileType.DOOR_OPEN;
                break;
            case 'close_safe': if (tile === TileType.SAFE_OPENED || tile === TileType.SAFE_SMASHED || tile === TileType.SAFE_ROBBED) projectedMap[y][x] = originalTile; break;
            case 'open_cabinet': if (tile === TileType.CABINET || tile === TileType.CABINET_ALARMED) projectedMap[y][x] = TileType.CABINET_OPEN; break;
            case 'close_cabinet': if (tile === TileType.CABINET_OPEN || tile === TileType.CABINET_ROBBED) projectedMap[y][x] = originalTile; break;
            case 'rob':
                if (tile === TileType.DISPLAY_CASE_SMASHED || tile === TileType.DISPLAY_CASE_OPENED) projectedMap[y][x] = TileType.DISPLAY_CASE_ROBBED;
                else if (tile === TileType.SAFE_OPENED || tile === TileType.SAFE_SMASHED) projectedMap[y][x] = TileType.SAFE_ROBBED;
                else if (tile === TileType.ART_PIECE || tile === TileType.ART_PIECE_ALARMED) projectedMap[y][x] = TileType.ART_PIECE_ROBBED;
                else if (tile === TileType.GOLD_BARS || tile === TileType.GOLD_BARS_ALARMED) projectedMap[y][x] = TileType.GOLD_BARS_ROBBED;
                else if (tile === TileType.CABINET_OPEN) projectedMap[y][x] = TileType.CABINET_ROBBED;
                else if (tile === TileType.STATUE || tile === TileType.STATUE_ALARMED) projectedMap[y][x] = TileType.STATUE_ROBBED;
                else if (tile === TileType.TELLER_COUNTER) projectedMap[y][x] = TileType.TELLER_COUNTER_ROBBED;
                break;
            case 'disable': { const camIndex = projectedCameras.findIndex(c => c.x === x && c.y === y); if (camIndex > -1) projectedCameras[camIndex].disabled = true; break; }
            case 'disable_alarm': projectedMap[y][x] = TileType.ALARM_BOX_DISABLED; projectedAlarmSystemActive = false; break;
            case 'disable_cameras': projectedCamerasActive = false; projectedMap[y][x] = TileType.CAMERA_CONTROL_PANEL_DISABLED; break;
            case 'disable_lasers': { const grid = projectedLaserGrids.find(g => g.controlPanel.x === x && g.controlPanel.y === y); if (grid) grid.active = false; projectedMap[y][x] = TileType.LASER_CONTROL_PANEL_DISABLED; break; }
            case 'disable_pressure_plates': {
                projectedPressurePlates.forEach(p => p.disabled = true);
                projectedMap[y][x] = TileType.PRESSURE_PLATE_PANEL_DISABLED;
                projectedPressurePlates.forEach(p => { if (projectedMap[p.y][p.x] === TileType.PRESSURE_PLATE || projectedMap[p.y][p.x] === TileType.PRESSURE_PLATE_HIDDEN) projectedMap[p.y][p.x] = TileType.PRESSURE_PLATE_DISABLED; });
                break;
            }
            case 'hack': {
                projectedMap[y][x] = TileType.COMPUTER_TERMINAL_HACKED;
                const terminal = scenario.hackableTerminals?.find(t => t.x === x && t.y === y);
                if (terminal) {
                    terminal.cameraIds.forEach(camId => {
                        const camIndex = projectedCameras.findIndex(c => c.id === camId);
                        if (camIndex > -1) {
                            projectedCameras[camIndex].disabled = true;
                        }
                    });
                }
                break;
            }
            // Consumable projections
            case 'use_camera_looper': { const cam = projectedCameras.find(c => c.x === x && c.y === y); if (cam) cam.looperTimer = 15; break; }
            case 'use_foam_canister': { const plate = projectedPressurePlates.find(p => p.x === x && p.y === y); if (plate) plate.foamTimer = 60; projectedMap[y][x] = TileType.FOAMED_PRESSURE_PLATE; break; }
            case 'use_laser_jammer_short': { const grid = projectedLaserGrids.find(g => g.controlPanel.x === x && g.controlPanel.y === y); if (grid) grid.jamTimer = 30; projectedMap[y][x] = TileType.LASER_CONTROL_PANEL_JAMMED; break; }
            case 'use_laser_jammer_long': { const grid = projectedLaserGrids.find(g => g.controlPanel.x === x && g.controlPanel.y === y); if (grid) grid.jamTimer = 9999; projectedMap[y][x] = TileType.LASER_CONTROL_PANEL_JAMMED; break; }
            case 'break_window': projectedMap[y][x] = TileType.WINDOW_BROKEN; break;
        }

        if (projectedMap[y]?.[x] !== oldTile) {
            tileChangeTimes.set(`${x}-${y}`, step.endTime);
        }
    }

    // Detect if any hidden pressure plates would be visible to players at the projected time.
    const detectedHiddenPlates = new Set<string>();

    projectedPressurePlates.forEach(plate => {
        if (projectedMap[plate.y]?.[plate.x] === TileType.PRESSURE_PLATE_HIDDEN && !plate.disabled) {
            const isAdjacent = projectedPlayers.some(p => (p.skills.electronics || 0) >= 2 && Math.abs(p.x - plate.x) <= 1 && Math.abs(p.y - plate.y) <= 1 && (p.x !== plate.x || p.y !== plate.y));
            if (isAdjacent) {
                detectedHiddenPlates.add(`${plate.x}-${plate.y}`);
            }
        }
    });

    // Project the state of timed lasers at the target time.
    projectedLaserGrids.forEach(grid => {
        if (grid.jamTimer && grid.jamTimer > 0) {
            grid.beamsOn = false;
            return;
        }
        if (grid.timer) {
            const { on, off, offset } = grid.timer;
            const totalCycle = on + off;
            const timeInCycle = (time + offset) % totalCycle;
            grid.beamsOn = timeInCycle < on;
        } else {
            grid.beamsOn = grid.active;
        }
    });

    const projectedGuards: (Guard | undefined)[] = (scenario.guards || [])
        .filter(g => !g.hiddenInPlanning) // NEW: Hide guards completely if flagged
        .map(g => {
            // Use a deep copy to avoid modifying the original scenario object in memory
            const guardCopy: Guard = JSON.parse(JSON.stringify(g));
            if (guardCopy.isStationary) {
                // Position is fixed for stationary guards in projection
                return guardCopy;
            } else if ((!guardCopy.patrolRoute || guardCopy.patrolRoute.length === 0) && guardCopy.patrolWaypoints) {
                guardCopy.patrolRoute = calculatePatrolRoute(guardCopy.patrolWaypoints, scenario.map);
            }

            return guardCopy;
        });

    // Process knockout actions on guards
    for (const step of completedSteps) {
        if (step.action === 'knockout') {
            const { x, y } = step.target;
            const guardAtTarget = projectedGuards.find(g => g && g.x === x && g.y === y);
            if (guardAtTarget) {
                guardAtTarget.status = 'knocked_out';
                guardAtTarget.knockout_timer = 999999; // Permanent knockout
            }
        }
    }

    // Process pickpocket actions to track keys in projection
    const projectedPlayerKeys = Array(players.length).fill(0);
    const projectedPickpocketedGuards = new Set<number>();

    for (const step of completedSteps) {
        if (step.action === 'pickpocket') {
            const { x, y } = step.target;

            // Try to find guard by ID first (robust against movement)
            let guardAtTarget: Guard | undefined;
            if (step.targetId !== undefined) {
                // Check both projected guards and base scenario guards to be safe
                // We prefer scenario guards for static property lookup like 'hasKey'
                const scenarioGuard = (scenario.guards || []).find(g => g.id === step.targetId);
                if (scenarioGuard) {
                    guardAtTarget = scenarioGuard;
                } else {
                    guardAtTarget = projectedGuards.find(g => g && g.id === step.targetId);
                }
            }

            // Fallback to position check (legacy or if ID missing)
            if (!guardAtTarget) {
                guardAtTarget = projectedGuards.find(g => g && g.x === x && g.y === y);
            }

            if (guardAtTarget && guardAtTarget.hasKey && !projectedPickpocketedGuards.has(guardAtTarget.id)) {
                projectedPlayerKeys[step.teamMember] = (projectedPlayerKeys[step.teamMember] || 0) + 1;
                projectedPickpocketedGuards.add(guardAtTarget.id);
            }
        } else if ((step.action === 'unlock' || step.action === 'smash_door') && projectedPlayerKeys[step.teamMember] > 0) {
            // Consuming a key reduces unlock time, so we must account for its usage
            // Note: Depending on implementation of 'smash_door', it might not necessarily use a key, but 'unlock' definitely does if the time cost was reduced. 
            // Ideally we should check if the key was *actually* used for this step (e.g. by checking timeCost), 
            // but for now we assume if they have a key and unlock/smash, they use it if the cost implies it.
            // Actually, the simplest logic requested is "each stolen key can only be used once".
            // So if we 'unlock' and we have a key, we use it.
            projectedPlayerKeys[step.teamMember] -= 1;
        }
    }


    const distractedGuardIds = new Set<number>();
    const investigatingGuardIds = new Set<number>();

    // Pre-calculate guard knockout status strictly from patrol routes and direct actions.
    // This ensures knocked-out guards don't plot distraction/investigation paths later.
    projectedGuards.forEach(guard => {
        if (!guard) return;

        // 1. Direct knockout actions (Melee)
        for (const step of completedSteps) {
            if (step.action === 'knockout') {
                let posAtActionTime = { x: guard.x, y: guard.y };
                if (guard.patrolRoute && guard.patrolRoute.length > 0 && !guard.isStationary) {
                    const totalPatrolTime = guard.patrolRoute.length * TIME_COST.MOVE;
                    posAtActionTime = guard.patrolRoute[Math.floor((step.endTime % totalPatrolTime) / TIME_COST.MOVE)];
                }

                if (posAtActionTime.x === step.target.x && posAtActionTime.y === step.target.y) {
                    guard.status = 'knocked_out';
                    guard.knockout_timer = 9999 - (time - step.endTime);
                    return;
                }
            }
        }

        // 2. Stun gas contact on patrol
        for (const stun of projectedStuns) {
            const simEnd = Math.min(time, stun.endTime);
            for (let t = stun.startTime; t <= simEnd; t++) {
                let posAtT = { x: guard.x, y: guard.y };
                if (guard.patrolRoute && guard.patrolRoute.length > 0 && !guard.isStationary) {
                    const totalPatrolTime = guard.patrolRoute.length * TIME_COST.MOVE;
                    posAtT = guard.patrolRoute[Math.floor((t % totalPatrolTime) / TIME_COST.MOVE)];
                }
                if (stun.tiles.has(`${posAtT.x}-${posAtT.y}`)) {
                    guard.status = 'knocked_out';
                    guard.knockout_timer = 9999 - (time - t);
                    return;
                }
            }
        }
    });

    // NEW: Project guard distractions
    for (const step of timedPlan) {
        if (step.action === 'distract' && step.endTime <= time) {
            const noiseSource = step.target;
            const noisyTiles = calculateNoiseSpread(noiseSource, projectedMap, NOISE_RANGE);

            let closestGuard: Guard | null = null;
            let minDistance = Infinity;

            projectedGuards.forEach(guard => {
                if (!guard) return;
                // If this guard is already being modeled for a distraction, skip.
                if (distractedGuardIds.has(guard.id)) return;
                // Skip knocked out guards
                if (guard.status === 'knocked_out' || (guard.knockout_timer && guard.knockout_timer > 0)) return;

                // Calculate guard position at the time of the noise
                let guardPosAtNoiseTime = { x: guard.x, y: guard.y };
                if (guard.patrolRoute && guard.patrolRoute.length > 0 && !guard.isStationary) {
                    const totalPatrolTime = guard.patrolRoute.length * TIME_COST.MOVE;
                    const timeIntoPatrol = step.endTime % totalPatrolTime;
                    const patrolIndex = Math.floor(timeIntoPatrol / TIME_COST.MOVE);
                    guardPosAtNoiseTime = guard.patrolRoute[patrolIndex];
                }

                if (noisyTiles.has(`${guardPosAtNoiseTime.x}-${guardPosAtNoiseTime.y}`)) {
                    const distance = Math.abs(guardPosAtNoiseTime.x - noiseSource.x) + Math.abs(guardPosAtNoiseTime.y - noiseSource.y);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestGuard = guard;
                    }
                }
            });

            if (closestGuard) {
                const guard = closestGuard;
                distractedGuardIds.add(guard.id); // Mark this guard as handled for this projection.

                // Calculate guard position again for the final selection
                let guardPosAtNoiseTime = { x: guard.x, y: guard.y };
                if (guard.patrolRoute && guard.patrolRoute.length > 0 && !guard.isStationary) {
                    const totalPatrolTime = guard.patrolRoute.length * TIME_COST.MOVE;
                    const timeIntoPatrol = step.endTime % totalPatrolTime;
                    const patrolIndex = Math.floor(timeIntoPatrol / TIME_COST.MOVE);
                    guardPosAtNoiseTime = guard.patrolRoute[patrolIndex];
                }

                const pathToNoise = findShortestPath(guardPosAtNoiseTime, noiseSource, projectedMap);
                const investigationTime = 2; // Guard pauses for 2 seconds.

                // Determine where the guard should return to
                let closestPatrolPoint = { x: guard.x, y: guard.y };
                let closestPatrolPointIndex = 0;
                if (guard.patrolRoute && guard.patrolRoute.length > 0) {
                    let minReturnDistance = Infinity;
                    guard.patrolRoute.forEach((point, index) => {
                        const distance = Math.abs(noiseSource.x - point.x) + Math.abs(noiseSource.y - point.y);
                        if (distance < minReturnDistance) {
                            minReturnDistance = distance;
                            closestPatrolPoint = point;
                            closestPatrolPointIndex = index;
                        }
                    });
                }

                // Store where to resume patrol
                guard.resume_patrol_at_index = closestPatrolPointIndex;

                const pathBackToPost = findShortestPath(noiseSource, closestPatrolPoint, projectedMap);

                const distractionStartTime = step.endTime;
                const distractionEndTime = distractionStartTime + pathToNoise.length + investigationTime + pathBackToPost.length;

                // Create look-around sequence for distraction
                // Determine arrival orientation
                let arrivalOrientation: 'up' | 'down' | 'left' | 'right' = 'down';
                if (pathToNoise.length > 0) {
                    const lastStep = pathToNoise[pathToNoise.length - 1];
                    const prevStep = pathToNoise.length > 1 ? pathToNoise[pathToNoise.length - 2] : guardPosAtNoiseTime;
                    if (lastStep.x > prevStep.x) arrivalOrientation = 'right';
                    else if (lastStep.x < prevStep.x) arrivalOrientation = 'left';
                    else if (lastStep.y > prevStep.y) arrivalOrientation = 'down';
                    else if (lastStep.y < prevStep.y) arrivalOrientation = 'up';
                } else {
                    arrivalOrientation = guard.orientation || 'down';
                }

                const lookAroundSequence: { x: number, y: number, orientation: 'up' | 'down' | 'left' | 'right' }[] = [];
                const orientations: ('up' | 'down' | 'left' | 'right')[] = ['up', 'right', 'down', 'left'];
                let currentDirIdx = orientations.indexOf(arrivalOrientation);

                for (let k = 0; k < investigationTime; k++) {
                    currentDirIdx = (currentDirIdx + 1) % 4; // Rotate 90 degrees each second
                    lookAroundSequence.push({ ...noiseSource, orientation: orientations[currentDirIdx] });
                }

                // Create a full path for visualization
                const fullDistractionPath = [guardPosAtNoiseTime, ...pathToNoise, ...lookAroundSequence, ...pathBackToPost];

                // Store distraction end time for patrol resumption
                guard.distractionEndTime = distractionEndTime;

                guard.distractionPath = {
                    path: fullDistractionPath,
                    startTime: distractionStartTime,
                    endTime: distractionEndTime,
                };
            }
        }
    }

    // NEW: Project guard investigations of suspicious activity
    // Process steps in order and check for suspicious changes after each
    for (const step of timedPlan) {
        if (step.endTime > time) continue; // Only process completed steps

        // Check if this step created suspicious changes
        const suspiciousTiles: { x: number, y: number, type: 'evidence' | 'suspicious' }[] = [];

        // Check the tile that was acted upon
        const { x, y } = step.target;
        const currentTile = projectedMap[y]?.[x];
        const initialTile = scenario.map[y]?.[x];

        if (currentTile && initialTile) {
            // Check for evidence (immediate alarm)
            if (isEvidenceTile(currentTile)) {
                suspiciousTiles.push({ x, y, type: 'evidence' });
            }
            // Check for locked door opened (evidence)
            else if ((initialTile === TileType.DOOR_LOCKED || initialTile === TileType.DOOR_LOCKED_ALARMED) && currentTile === TileType.DOOR_OPEN) {
                suspiciousTiles.push({ x, y, type: 'evidence' });
            }
            // Check for suspicious changes (investigation)
            else if (isSuspiciousChange(initialTile, currentTile)) {
                suspiciousTiles.push({ x, y, type: 'suspicious' });
            }
        }

        // For each suspicious tile, find guards who will see it
        for (const suspTile of suspiciousTiles) {
            let closestGuard: Guard | null = null;
            let minDistance = Infinity;
            let detectionTime = Infinity;

            projectedGuards.forEach(guard => {
                if (!guard) return;
                // Skip if guard is already investigating or distracted
                if (investigatingGuardIds.has(guard.id) || distractedGuardIds.has(guard.id)) return;
                // Skip knocked out guards
                if (guard.status === 'knocked_out' || guard.knockout_timer) return;

                // Check if guard will see this suspicious tile during their patrol
                // Simulate up to 30 seconds of patrol after the action
                const maxSimulationTime = 30;
                let foundVision = false;
                let firstVisionTime = Infinity;
                let guardPosWhenSeen = { x: guard.x, y: guard.y };

                if (guard.patrolRoute && guard.patrolRoute.length > 0 && !guard.isStationary) {
                    for (let t = 0; t <= maxSimulationTime; t++) {
                        const checkTime = step.endTime + t;
                        const timeIntoPatrol = checkTime % (guard.patrolRoute.length * TIME_COST.MOVE);
                        const patrolIndex = Math.floor(timeIntoPatrol / TIME_COST.MOVE);
                        const guardPos = guard.patrolRoute[patrolIndex];

                        // Infer guard orientation based on patrol movement
                        let simulatedOrientation = guard.orientation;
                        const nextPatrolIndex = (patrolIndex + 1) % guard.patrolRoute.length;
                        const nextPos = guard.patrolRoute[nextPatrolIndex];

                        // Match execution logic: Orientation relies on the NEXT destination
                        if (nextPos.x > guardPos.x) simulatedOrientation = 'right';
                        else if (nextPos.x < guardPos.x) simulatedOrientation = 'left';
                        else if (nextPos.y > guardPos.y) simulatedOrientation = 'down';
                        else if (nextPos.y < guardPos.y) simulatedOrientation = 'up';

                        // Time-aware vision override: Don't see through doors that aren't open yet at checkTime
                        const isObstacleOverride = (vx: number, vy: number, tType: TileType) => {
                            if (!isObstacleForLoS(tType)) {
                                const initial = scenario.map[vy]?.[vx];
                                if (initial && isObstacleForLoS(initial)) {
                                    const changeTime = tileChangeTimes.get(`${vx}-${vy}`) || 0;
                                    if (changeTime > checkTime) return true;
                                }
                            }
                            return isObstacleForLoS(tType);
                        };

                        const tempGuard = { ...guard, ...guardPos, orientation: simulatedOrientation };

                        // Can guard see the suspicious tile?
                        if (canGuardSeeTile(tempGuard, suspTile.x, suspTile.y, projectedMap, isObstacleOverride)) {
                            foundVision = true;
                            firstVisionTime = checkTime;
                            guardPosWhenSeen = guardPos;
                            (guard as any)._detectionOrientation = simulatedOrientation; // Store for correct detection inference
                            break;
                        }
                    }
                } else if (guard.isStationary) {
                    // Update guard orientation based on panned cycle at the check point
                    const panPeriod = guard.panPeriod || 3;
                    const totalCycle = (guard.panSequence?.length || 1) * panPeriod;
                    const timeInCycle = step.endTime % totalCycle;
                    const panIndex = Math.floor(timeInCycle / panPeriod);
                    const pannedOrientation = guard.panSequence?.[panIndex] || guard.orientation;

                    const tempGuard = { ...guard, orientation: pannedOrientation };
                    const checkTime = step.endTime;

                    // Time-aware vision override for stationary guards
                    const isObstacleOverride = (vx: number, vy: number, tType: TileType) => {
                        if (!isObstacleForLoS(tType)) {
                            const initial = scenario.map[vy]?.[vx];
                            if (initial && isObstacleForLoS(initial)) {
                                const changeTime = tileChangeTimes.get(`${vx}-${vy}`) || 0;
                                if (changeTime > checkTime) return true;
                            }
                        }
                        return isObstacleForLoS(tType);
                    };

                    if (canGuardSeeTile(tempGuard, suspTile.x, suspTile.y, projectedMap, isObstacleOverride)) {
                        foundVision = true;
                        firstVisionTime = step.endTime;
                        guardPosWhenSeen = { x: guard.x, y: guard.y };
                    }
                }

                if (foundVision) {
                    const distance = Math.abs(guardPosWhenSeen.x - suspTile.x) + Math.abs(guardPosWhenSeen.y - suspTile.y);
                    // Prefer guards who see it sooner, or if same time, closer guards
                    if (firstVisionTime < detectionTime || (firstVisionTime === detectionTime && distance < minDistance)) {
                        minDistance = distance;
                        detectionTime = firstVisionTime;
                        closestGuard = guard;
                        // Store the position where guard first sees it
                        (guard as any)._detectionPos = guardPosWhenSeen;
                        (guard as any)._detectionTime = firstVisionTime;
                    }
                }
            });

            if (closestGuard) {
                const guard = closestGuard;
                investigatingGuardIds.add(guard.id); // Mark as investigating

                // Get guard position when they first see the suspicious tile
                const guardPosAtDetection = (guard as any)._detectionPos || { x: guard.x, y: guard.y };
                const detectionStartTime = (guard as any)._detectionTime || step.endTime;

                const pathToSuspicion = findShortestPath(guardPosAtDetection, suspTile, projectedMap);
                const investigationTime = 3; // Guard investigates for 3 seconds

                // Check if guard will see more evidence during the investigation path
                let willSoundAlarm = false;
                if (suspTile.type === 'evidence') {
                    willSoundAlarm = true; // Evidence always triggers alarm
                } else {
                    // Check along the path for more evidence
                    for (const pathPos of pathToSuspicion) {
                        const pathTile = projectedMap[pathPos.y]?.[pathPos.x];
                        const pathInitialTile = scenario.map[pathPos.y]?.[pathPos.x];
                        if (pathTile && isEvidenceTile(pathTile)) {
                            willSoundAlarm = true;
                            break;
                        }
                        // Check for locked door opened
                        if (pathInitialTile && (pathInitialTile === TileType.DOOR_LOCKED || pathInitialTile === TileType.DOOR_LOCKED_ALARMED) && pathTile === TileType.DOOR_OPEN) {
                            willSoundAlarm = true;
                            break;
                        }
                        // Check for additional suspicious changes
                        if (pathInitialTile && isSuspiciousChange(pathInitialTile, pathTile)) {
                            willSoundAlarm = true;
                            break;
                        }
                    }
                }

                // Find closest patrol point to return to
                let closestPatrolPoint = guardPosAtDetection;
                if (guard.patrolRoute && guard.patrolRoute.length > 0) {
                    let minReturnDistance = Infinity;
                    guard.patrolRoute.forEach(point => {
                        const distance = Math.abs(suspTile.x - point.x) + Math.abs(suspTile.y - point.y);
                        if (distance < minReturnDistance) {
                            minReturnDistance = distance;
                            closestPatrolPoint = point;
                        }
                    });
                }

                // ALARM OVERRIDE: If evidence is spotted and alarm is disabled, run to panel instead
                if (willSoundAlarm && !projectedAlarmSystemActive) {
                    const alarmBoxes: { x: number, y: number }[] = [];
                    scenario.map.forEach((row, ry) => row.forEach((t, rx) => {
                        if (t === TileType.ALARM_BOX) alarmBoxes.push({ x: rx, y: ry });
                    }));

                    let closestBox = alarmBoxes[0];
                    let minBoxDist = Infinity;
                    alarmBoxes.forEach(box => {
                        const dist = Math.abs(guardPosAtDetection.x - box.x) + Math.abs(guardPosAtDetection.y - box.y);
                        if (dist < minBoxDist) {
                            minBoxDist = dist;
                            closestBox = box;
                        }
                    });

                    if (closestBox) {
                        const pathToAlarm = findShortestPath(guardPosAtDetection, closestBox, projectedMap, false, [], [], true);
                        // Guard already at or adjacent to alarm panel, or has valid path
                        const isAdjacentToAlarm = Math.abs(guardPosAtDetection.x - closestBox.x) <= 1 && Math.abs(guardPosAtDetection.y - closestBox.y) <= 1;
                        if (pathToAlarm.length > 0 || isAdjacentToAlarm) {
                            const dashPath: { x: number, y: number, orientation?: 'up' | 'down' | 'left' | 'right' }[] = [];

                            // If guard is already at/adjacent to the alarm, add their current position as the first point
                            if (pathToAlarm.length === 0) {
                                dashPath.push({ x: guardPosAtDetection.x, y: guardPosAtDetection.y });
                            } else {
                                // Move at double speed (2 tiles per tick)
                                for (let i = 0; i < pathToAlarm.length; i += 2) {
                                    dashPath.push(pathToAlarm[i]);
                                }
                            }
                            if (dashPath[dashPath.length - 1].x !== closestBox.x || dashPath[dashPath.length - 1].y !== closestBox.y) {
                                dashPath.push({ x: closestBox.x, y: closestBox.y });
                            }

                            guard.distractionPath = {
                                path: dashPath,
                                startTime: detectionStartTime,
                                endTime: detectionStartTime + dashPath.length
                            };
                            continue; // Correctly skip the rest of the loop iteration (standard investigation)
                        }
                    }
                }

                // FIX: Determine where the guard actually stands to investigate.
                // If they can't reach the tile (e.g. seeing through a window), they investigate from their last reachable position.
                let investigationStandPos = { x: suspTile.x, y: suspTile.y }; // Ensure strictly {x,y} to avoid type mismatch
                if (pathToSuspicion.length > 0) {
                    investigationStandPos = pathToSuspicion[pathToSuspicion.length - 1];
                } else {
                    // Path is empty, meaning either they are already there OR they can't reach it.
                    // We assume they look from where they first saw it.
                    investigationStandPos = { x: guardPosAtDetection.x, y: guardPosAtDetection.y };
                }

                const pathBackToPost = findShortestPath(investigationStandPos, closestPatrolPoint, projectedMap);

                const investigationStartTime = detectionStartTime;
                const investigationEndTime = investigationStartTime + pathToSuspicion.length + investigationTime + pathBackToPost.length;

                // Determine arrival orientation
                let arrivalOrientation: 'up' | 'down' | 'left' | 'right' = 'down';
                if (pathToSuspicion.length > 0) {
                    const lastStep = pathToSuspicion[pathToSuspicion.length - 1];
                    const prevStep = pathToSuspicion.length > 1 ? pathToSuspicion[pathToSuspicion.length - 2] : guardPosAtDetection;
                    if (lastStep.x > prevStep.x) arrivalOrientation = 'right';
                    else if (lastStep.x < prevStep.x) arrivalOrientation = 'left';
                    else if (lastStep.y > prevStep.y) arrivalOrientation = 'down';
                    else if (lastStep.y < prevStep.y) arrivalOrientation = 'up';
                } else {
                    // If already there, use current guard orientation or default
                    arrivalOrientation = guard.orientation || 'down';
                }

                // Create look-around sequence anchored at the actual standing position
                const lookAroundSequence: { x: number, y: number, orientation: 'up' | 'down' | 'left' | 'right' }[] = [];
                const orientations: ('up' | 'down' | 'left' | 'right')[] = ['up', 'right', 'down', 'left'];
                let currentDirIdx = orientations.indexOf(arrivalOrientation);

                for (let k = 0; k < investigationTime; k++) {
                    currentDirIdx = (currentDirIdx + 1) % 4; // Rotate 90 degrees each second
                    lookAroundSequence.push({ ...investigationStandPos, orientation: orientations[currentDirIdx] });
                }

                // Create investigation path
                const fullInvestigationPath = [
                    guardPosAtDetection,
                    ...pathToSuspicion,
                    ...lookAroundSequence,
                    ...pathBackToPost
                ];

                // Store investigation path
                guard.distractionPath = {
                    path: fullInvestigationPath,
                    startTime: investigationStartTime,
                    endTime: investigationEndTime,
                };

                // Mark guard as alerted if they will sound alarm
                if (willSoundAlarm) {
                    guard.hasBeenSuspicious = true;
                }

                // Logic to close door in projection
                // If the suspicious tile was an opened door, the guard will close it when returning
                // Store this info directly on the guard object so it persists after investigation ends
                if (
                    (suspTile.type === 'evidence' || suspTile.type === 'suspicious') &&
                    (scenario.map[suspTile.y]?.[suspTile.x] === TileType.DOOR_LOCKED || scenario.map[suspTile.y]?.[suspTile.x] === TileType.DOOR_LOCKED_ALARMED || scenario.map[suspTile.y]?.[suspTile.x] === TileType.DOOR_CLOSED) &&
                    projectedMap[suspTile.y]?.[suspTile.x] === TileType.DOOR_OPEN
                ) {
                    // Calculate when the guard closes the door (when they step onto it during return)
                    const doorCloseTime = investigationStartTime + pathToSuspicion.length + investigationTime;

                    // Store door metadata directly on guard object (not in distractionPath which gets cleared)
                    if (!guard.closedDoors) guard.closedDoors = [];
                    guard.closedDoors.push({
                        x: suspTile.x,
                        y: suspTile.y,
                        closeTime: doorCloseTime
                    });
                }
            }
        }
    }

    const projectedActiveFuses: { x: number, y: number, timer: number, blastRadius: Set<string> }[] = [];
    for (const step of timedPlan) {
        if (step.action === 'plant_dynamite') {
            const plantTime = step.endTime;
            const explosionTime = plantTime + (step.dynamiteTimer || 10);
            if (time >= plantTime && time < explosionTime) {
                const blastRadius = calculateNoiseSpread({ x: step.target.x, y: step.target.y }, projectedMap, DYNAMITE_BLAST_RADIUS);
                projectedActiveFuses.push({
                    x: step.target.x,
                    y: step.target.y,
                    timer: explosionTime - time,
                    blastRadius
                });
            }
        }
    }

    projectedGuards.forEach(guard => {
        if (!guard) return;

        // Don't move guards who have been knocked out
        if (guard.status === 'knocked_out' || (guard.knockout_timer && guard.knockout_timer > 0)) {
            return;
        }

        // EFFECTIVE TIME for limited intel: If patrol is hidden, position only updates every 5 seconds
        let effectiveTime = time;
        if (guard.hidePatrolInPlanning) {
            effectiveTime = Math.floor(time / 5) * 5;
        }

        if (guard.isStationary && !guard.distractionPath) {
            // Position is fixed for stationary guards who aren't investigating something
            if (guard.panSequence && guard.panSequence.length > 0) {
                const panPeriod = guard.panPeriod || 3;
                const totalCycle = guard.panSequence.length * panPeriod;
                const timeInCycle = effectiveTime % totalCycle;
                const panIndex = Math.floor(timeInCycle / panPeriod);
                guard.orientation = guard.panSequence[panIndex];
            }
            return;
        }

        // If the guard is distracted/investigating and the effective time is within the investigation window, 
        // project their position along the distraction path.
        if (guard.distractionPath && effectiveTime >= guard.distractionPath.startTime && effectiveTime <= guard.distractionPath.endTime) {
            // Safety check: ensure path array is not empty to prevent undefined access
            if (!guard.distractionPath.path || guard.distractionPath.path.length === 0) {
                guard.distractionPath = undefined;
            } else {
                const timeIntoDistraction = effectiveTime - guard.distractionPath.startTime;
                const pathIndex = Math.min(timeIntoDistraction, guard.distractionPath.path.length - 1);
                const currentPos = guard.distractionPath.path[pathIndex];

                // Apply position
                guard.x = currentPos.x;
                guard.y = currentPos.y;

                // Apply orientation if explicit, otherwise infer
                if (currentPos.orientation) {
                    guard.orientation = currentPos.orientation;
                } else {
                    const nextPos = guard.distractionPath.path[Math.min(pathIndex + 1, guard.distractionPath.path.length - 1)];
                    if (nextPos.x > currentPos.x) guard.orientation = 'right';
                    else if (nextPos.x < currentPos.x) guard.orientation = 'left';
                    else if (nextPos.y > currentPos.y) guard.orientation = 'down';
                    else if (nextPos.y < currentPos.y) guard.orientation = 'up';
                }
            }

        } else { // Otherwise, project their position along their normal patrol route.
            // Clear distractionPath if investigation has ended
            if (guard.distractionPath && effectiveTime > guard.distractionPath.endTime) {
                guard.distractionPath = undefined;
            }

            if (guard.patrolRoute && guard.patrolRoute.length > 0) {
                const timePerStep = TIME_COST.MOVE;
                const totalPatrolTime = guard.patrolRoute.length * timePerStep;

                // NEW: Use resume_patrol_at_index relative to distractionEndTime if available
                // This prevents "teleporting" back to the original schedule.
                let timeIntoPatrol: number;

                if (guard.distractionEndTime !== undefined && effectiveTime > guard.distractionEndTime && guard.resume_patrol_at_index !== undefined) {
                    // Logic: Guard starts walking from 'resume_patrol_at_index' at 'distractionEndTime'
                    const timeSinceResume = effectiveTime - guard.distractionEndTime;
                    const startStepTime = guard.resume_patrol_at_index * timePerStep;
                    timeIntoPatrol = (startStepTime + timeSinceResume) % totalPatrolTime;
                } else {
                    // Default Logic for uninterrupted guards
                    timeIntoPatrol = effectiveTime % totalPatrolTime;
                }

                const patrolIndex = Math.floor(timeIntoPatrol / timePerStep);

                const currentPos = guard.patrolRoute[patrolIndex];
                const nextPatrolIndex = (patrolIndex + 1) % guard.patrolRoute.length;
                const nextPos = guard.patrolRoute[nextPatrolIndex];

                guard.x = currentPos.x;
                guard.y = currentPos.y;

                if (nextPos.x > currentPos.x) guard.orientation = 'right';
                else if (nextPos.x < currentPos.x) guard.orientation = 'left';
                else if (nextPos.y > currentPos.y) guard.orientation = 'down';
                else if (nextPos.y < currentPos.y) guard.orientation = 'up';
            }
        }
    });

    // Final Knockout Pass: Check for gas contact even while distracted, and fix positions for all KO'd guards
    projectedGuards.forEach(guard => {
        if (!guard) return;

        // 1. Check direct knockout actions
        for (const step of completedSteps) {
            if (step.action === 'knockout') {
                // Determine guard position at the time of the knockout action
                let posAtActionTime = { x: guard.x, y: guard.y };
                if (guard.distractionPath && step.endTime >= guard.distractionPath.startTime && step.endTime <= guard.distractionPath.endTime && guard.distractionPath.path && guard.distractionPath.path.length > 0) {
                    posAtActionTime = guard.distractionPath.path[Math.min(step.endTime - guard.distractionPath.startTime, guard.distractionPath.path.length - 1)];
                } else if (guard.patrolRoute && guard.patrolRoute.length > 0 && !guard.isStationary) {
                    const totalPatrolTime = guard.patrolRoute.length * TIME_COST.MOVE;
                    posAtActionTime = guard.patrolRoute[Math.floor((step.endTime % totalPatrolTime) / TIME_COST.MOVE)];
                }

                if (posAtActionTime.x === step.target.x && posAtActionTime.y === step.target.y) {
                    guard.status = 'knocked_out';
                    guard.knockout_timer = 9999 - (time - step.endTime);
                    guard.x = posAtActionTime.x;
                    guard.y = posAtActionTime.y;
                    guard.distractionPath = undefined; // Force stop
                    return; // Guard is out
                }
            }
        }

        // 2. Check stun gas clouds
        for (const stun of projectedStuns) {
            // A stun affects anyone in it during its duration [startTime, endTime]
            const simStart = stun.startTime;
            const simEnd = Math.min(time, stun.endTime);

            for (let t = simStart; t <= simEnd; t++) {
                let posAtT = { x: guard.x, y: guard.y };
                if (guard.distractionPath && t >= guard.distractionPath.startTime && t <= guard.distractionPath.endTime && guard.distractionPath.path && guard.distractionPath.path.length > 0) {
                    posAtT = guard.distractionPath.path[Math.min(t - guard.distractionPath.startTime, guard.distractionPath.path.length - 1)];
                } else if (guard.patrolRoute && guard.patrolRoute.length > 0 && !guard.isStationary) {
                    const totalPatrolTime = guard.patrolRoute.length * TIME_COST.MOVE;
                    posAtT = guard.patrolRoute[Math.floor((t % totalPatrolTime) / TIME_COST.MOVE)];
                }

                if (stun.tiles.has(`${posAtT.x}-${posAtT.y}`)) {
                    guard.status = 'knocked_out';
                    guard.knockout_timer = 9999 - (time - t);
                    guard.x = posAtT.x;
                    guard.y = posAtT.y;
                    guard.distractionPath = undefined; // Force stop
                    return; // Guard is out
                }
            }
        }
    });

    // 3. New: Check if any active guard sees a knocked out colleague
    projectedGuards.forEach(guard => {
        if (!guard || guard.status === 'knocked_out' || (guard.knockout_timer && guard.knockout_timer > 0)) return;

        // Efficiently check if this guard sees any knocked out colleague
        for (const otherGuard of projectedGuards) {
            if (!otherGuard) continue; // Safety check
            if (otherGuard.id === guard.id) continue;
            if (otherGuard.status === 'knocked_out' || (otherGuard.knockout_timer && otherGuard.knockout_timer > 0)) {
                if (canGuardSeeTile(guard, otherGuard.x, otherGuard.y, projectedMap)) {
                    guard.status = 'permanently_alerted';
                    break;
                }
            }
        }
    });

    let projectedStunEffect: { x: number, y: number, duration: number, tiles: Set<string> } | null = null;
    projectedStuns.forEach(stun => {
        if (time >= stun.startTime && time < stun.endTime) {
            projectedStunEffect = { x: stun.x, y: stun.y, duration: stun.endTime - time, tiles: stun.tiles };
        }
    });

    // Apply door closures from all guards
    // Guards close doors after investigations, but players can reopen them
    // Only apply closures if no player action has reopened the door after the guard closed it
    projectedGuards.forEach(guard => {
        if (!guard || !guard.closedDoors) return;

        for (const doorInfo of guard.closedDoors) {
            if (time >= doorInfo.closeTime) {
                // Check if any player action reopened this door after the guard closed it
                let playerReopenedDoor = false;

                for (const step of timedPlan) {
                    // Check if this step targets the same door and completes after the guard closes it
                    if (step.target.x === doorInfo.x && step.target.y === doorInfo.y &&
                        step.endTime > doorInfo.closeTime && step.endTime <= time) {
                        // Check if it's a door-opening action
                        if (step.action === 'open_door' || step.action === 'unlock' ||
                            step.action === 'smash_door' || step.action === 'use_skeleton_key') {
                            playerReopenedDoor = true;
                            break;
                        }
                    }
                }

                // Only close the door if players haven't reopened it after the guard
                if (!playerReopenedDoor) {
                    // The door should be closed at this time
                    if (projectedMap[doorInfo.y]?.[doorInfo.x] === TileType.DOOR_OPEN) {
                        projectedMap[doorInfo.y][doorInfo.x] = TileType.DOOR_CLOSED;
                    }
                }
            }
        }
    });

    // Final pass to hide patrol routes for limited intel
    projectedGuards.forEach(g => {
        if (g && g.hidePatrolInPlanning) {
            g.patrolRoute = [];
        }
    });

    return {
        projectedMap,
        projectedPlayers,
        projectedCameras,
        projectedCamerasActive,
        projectedGuards: projectedGuards.filter((g): g is Guard => g !== undefined),
        projectedLaserGrids,
        projectedPressurePlates,
        projectedActiveFuses,
        projectedStunEffect,
        detectedHiddenPlates,
        projectedPlayerKeys,
        projectedPickpocketedGuards,
    };
}