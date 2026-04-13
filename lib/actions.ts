/**
 * @file actions.ts
 * @description
 * This file contains utility functions related to player actions. It handles calculating
 * the time cost of actions based on player skills, generating user-friendly labels for UI buttons,
 * and determining the set of available actions for a player at a given position and time.
 */

import { Player, ActionType, ActionInfo, Camera, TileType, GameState, Scenario } from '../types';
import { TIME_COST, ACTION_SKILL_MAP, DYNAMITE_FUSE_TIME } from '../constants';
import { getProjectedStateAtTime } from './state';
import { getLineOfSight } from './pathfinding';
import { calculateGuardVision } from './guards';
import { t } from './i18n';

/**
 * A mapping from ActionType to the corresponding key in the TIME_COST constant object.
 * This decouples the action's type from the name of its time cost constant.
 */
const ACTION_TO_TIMECOST_KEY: Partial<Record<ActionType, keyof typeof TIME_COST>> = {
  smash: 'SMASH_CASE', lockpick_case: 'LOCKPICK_CASE', crack: 'CRACK', unlock: 'UNLOCK',
  disable: 'DISABLE', rob: 'ROB', smash_door: 'SMASH_DOOR', open_door: 'OPEN_DOOR',
  close_door: 'CLOSE_DOOR', lock_door: 'LOCK_DOOR', disable_alarm: 'DISABLE_ALARM', disable_cameras: 'DISABLE_CAMERAS',
  disable_lasers: 'DISABLE_LASERS', disable_pressure_plates: 'DISABLE_PRESSURE_PLATES',
  distract: 'DISTRACT', open_cabinet: 'OPEN_CABINET', close_cabinet: 'CLOSE_CABINET',
  close_case: 'CLOSE_CASE', close_safe: 'CLOSE_SAFE', plant_dynamite: 'PLANT_DYNAMITE',
  hack: 'HACK', knockout: 'KNOCKOUT',
  break_window: 'BREAK_WINDOW',
  use_skeleton_key: 'USE_SKELETON_KEY',
  use_camera_looper: 'USE_CAMERA_LOOPER',
  use_foam_canister: 'USE_FOAM_CANISTER',
  use_glass_cutter: 'USE_GLASS_CUTTER',
  use_thermic_lance: 'USE_THERMIC_LANCE',
  use_laser_jammer_short: 'USE_LASER_JAMMER_SHORT',
  use_laser_jammer_long: 'USE_LASER_JAMMER_LONG',
  use_stun_o_mat: 'USE_STUN_O_MAT',
};

/**
 * Calculates the time cost of an action, adjusted for the player's skills.
 * Higher skill levels reduce the time required for associated actions.
 * @param {ActionType} action - The action being performed.
 * @param {Player} player - The player performing the action.
 * @param {GameState} gameState - Optional game state for checking player keys.
 * @param {object} target - Optional target coordinates for the action.
 * @param {number} playerIndex - Optional player index for checking keys.
 * @returns {number} The skill-adjusted time cost in seconds.
 */
export const getSkillAdjustedTime = (
  action: ActionType,
  player: Player,
  gameState?: GameState,
  target?: { x: number; y: number },
  playerIndex?: number
): number => {
  // Pickpocket: Check if player has a pickpocketed key for unlocking doors
  if (action === 'unlock' && gameState && playerIndex !== undefined) {
    const hasKey = (gameState.playerKeys?.[playerIndex] || 0) > 0;
    if (hasKey) {
      return 1; // Pickpocketed key allows instant (1 second) unlock
    }
  }

  if (action === 'lock_door') {
    const skillLevel = player.skills.lockpicking || 0;
    if (skillLevel >= 2) return Math.max(1, Math.floor(TIME_COST.LOCK_DOOR * 0.5));
    if (skillLevel >= 1) return Math.max(1, Math.floor(TIME_COST.LOCK_DOOR * 0.7));
    return 99; // Should be unreachable
  }
  // Custom logic for dynamite planting time removed - now base time 10 with 30%/50% reduction below

  const timeCostKey = ACTION_TO_TIMECOST_KEY[action];

  // Fallback for actions not in the map, like 'move' or 'wait'
  if (!timeCostKey) {
    const actionName = action.toUpperCase() as keyof typeof TIME_COST;
    if (TIME_COST[actionName]) {
      return TIME_COST[actionName];
    }
    return 0;
  }

  const baseTime = TIME_COST[timeCostKey];
  if (!baseTime) return 0;

  const skillName = ACTION_SKILL_MAP[action];
  if (skillName) {
    const skillLevel = player.skills[skillName] || 0;

    // Safeguard: Actions requiring skills return high cost if skill is missing
    if (skillLevel === 0) {
      // Exception: 'unlock' is allowed with 0 skill if player has a key (handled at top of function)
      // But for 'lockpick_case', 'unlock', or other skill-gated actions, we return a high cost
      if (action === 'lockpick_case' || action === 'unlock' || action === 'crack' || action === 'hack' || action === 'plant_dynamite') {
        return 999;
      }
    }

    // Level 1: at least 30% reduction (takes 70% of time)
    // Level 2: 50% reduction (takes 50% of time)
    if (skillLevel === 2) return Math.max(1, Math.floor(baseTime * 0.5));
    if (skillLevel === 1) return Math.max(1, Math.floor(baseTime * 0.7));
  }
  return baseTime;
};


/**
 * Generates a user-friendly label for an action button, including its calculated time cost.
 * @param {ActionType} action - The action to label.
 * @param {Player} player - The player who would perform the action.
 * @param {GameState} gameState - Optional game state for checking player keys.
 * @param {object} target - Optional target coordinates for the action.
 * @param {number} playerIndex - Optional player index for checking keys.
 * @returns {string} A descriptive string for the UI (e.g., "Pick Lock (10s)").
 */
export const getActionLabel = (
  action: ActionType,
  player: Player,
  gameState?: GameState,
  target?: { x: number; y: number },
  playerIndex?: number
): string => {
  const time = getSkillAdjustedTime(action, player, gameState, target, playerIndex);
  const timeStr = `(${time}s)`;

  // Pickpocket: Add key indicator for unlock action
  const keyCount = gameState && playerIndex !== undefined ? (gameState.playerKeys?.[playerIndex] || 0) : 0;
  const hasKey = action === 'unlock' && keyCount > 0;
  const keyIndicator = hasKey ? ` 🔑×${keyCount}` : '';

  switch (action) {
    case 'unlock': return `Pick Lock ${timeStr}${keyIndicator}`;
    case 'smash': return `Smash Case ${timeStr}`;
    case 'lockpick_case': return `Pick Lock ${timeStr}`;
    case 'smash_door': return `Smash Door ${timeStr}`;
    case 'crack': return `Crack Safe ${timeStr}`;
    case 'plant_dynamite': return `Plant Charge ${timeStr}`;
    case 'disable': return `Disable Cam ${timeStr}`;
    case 'disable_alarm': return `Disable Alarm ${timeStr}`;
    case 'disable_cameras': return `Disable Cameras ${timeStr}`;
    case 'disable_lasers': return `Disable Lasers ${timeStr}`;
    case 'disable_pressure_plates': return `Disable Plates ${timeStr}`;
    case 'rob': return `Rob ${timeStr}`;
    case 'open_door': return `Open Door ${timeStr}`;
    case 'close_door': return `Close Door ${timeStr}`;
    case 'lock_door': return `Lock Door ${timeStr}`;
    case 'distract': return t('ui.actions.distract', { time: timeStr });
    case 'open_cabinet': return `Open Cabinet ${timeStr}`;
    case 'close_cabinet': return `Close Cabinet ${timeStr}`;
    case 'close_case': return `Close Case ${timeStr}`;
    case 'close_safe': return `Close Safe ${timeStr}`;
    case 'hack': return `Hack Terminal ${timeStr}`;
    case 'break_window': return `Break Window ${timeStr}`;
    case 'pickpocket': return `Pickpocket ${timeStr}`;
    case 'use_skeleton_key': return `Use Key ${timeStr}`;
    case 'use_camera_looper': return `Use Looper ${timeStr}`;
    case 'use_foam_canister': return `Use Foam ${timeStr}`;
    case 'use_glass_cutter': return `Use Cutter ${timeStr}`;
    case 'use_thermic_lance': return `Use Lance ${timeStr}`;
    case 'use_laser_jammer_short': return `Jam Lasers (30s) ${timeStr}`;
    case 'use_laser_jammer_long': return `Jam Lasers (Perm) ${timeStr}`;
    case 'use_stun_o_mat': return `Use Stun-O-Mat ${timeStr}`;
    case 'knockout': return `Knockout (Instant)`;
    default: return 'Interact';
  }
};

/**
 * Calculates all valid target tiles for a 'distract' (throw stone) action.
 * A target is valid if it's within range, has a clear line of sight, and is a floor/exterior tile.
 * @param {Player} player - The player performing the action.
 * @param {TileType[][]} map - The current map grid.
 * @returns An array of valid target coordinates.
 */
export const getValidTargetsForDistraction = (player: Player, map: TileType[][]): { x: number, y: number }[] => {
  const DISTRACTION_RANGE = 7;
  const validTargets: { x: number, y: number }[] = [];
  const { x, y } = player;

  for (let dy = -DISTRACTION_RANGE; dy <= DISTRACTION_RANGE; dy++) {
    for (let dx = -DISTRACTION_RANGE; dx <= DISTRACTION_RANGE; dx++) {
      const tx = x + dx;
      const ty = y + dy;

      // Use Manhattan distance for range check.
      if (Math.abs(dx) + Math.abs(dy) > DISTRACTION_RANGE) continue;

      // Check map boundaries.
      if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) continue;

      const targetTile = map[ty][tx];
      const isDistractionTarget = targetTile === TileType.FLOOR || targetTile === TileType.EXTERIOR;

      if (isDistractionTarget) {
        // Check for a clear line of sight from the player to the target.
        if (getLineOfSight(player, { x: tx, y: ty }, map)) {
          validTargets.push({ x: tx, y: ty });
        }
      }
    }
  }
  return validTargets;
};

/**
 * Calculates all valid target guards for the Stun-O-Mat.
 * A guard is a valid target if they're within 10 tiles range, not knocked out,
 * and have a clear line of sight (no walls or closed doors).
 * @param {Player} player - The player performing the action.
 * @param {TileType[][]} map - The current map grid.
 * @param {Guard[]} guards - Array of all guards.
 * @returns An array of valid target guard coordinates.
 */
export const getValidTargetsForStunOMat = (
  player: Player,
  map: TileType[][],
): { x: number, y: number }[] => {
  const STUN_RANGE = 10;
  const validTargets: { x: number, y: number }[] = [];
  const { x, y } = player;

  for (let dy = -STUN_RANGE; dy <= STUN_RANGE; dy++) {
    for (let dx = -STUN_RANGE; dx <= STUN_RANGE; dx++) {
      const tx = x + dx;
      const ty = y + dy;

      // Use Manhattan distance for range check
      if (Math.abs(dx) + Math.abs(dy) > STUN_RANGE) continue;

      // Check map boundaries
      if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) continue;

      // Any tile within line of sight is a valid target for the grenade
      if (getLineOfSight(player, { x: tx, y: ty }, map)) {
        validTargets.push({ x: tx, y: ty });
      }
    }
  }

  return validTargets;
};

/**
 * Calculates all available actions for the current player based on their projected position and the state of adjacent tiles.
 * This is a critical function for populating the action buttons in the ControlPanel during the planning phase.
 * @param {GameState} gameState - The current game state.
 * @param {Scenario} currentScenario - The static data for the current level.
 * @param {Record<string, number>} inventory - The current projected inventory available for use.
 * @returns {ActionInfo[]} An array of available actions with their labels and targets.
 */
// FIX: Update function signature to accept inventory
export const calculateAdjacentActions = (gameState: GameState, currentScenario: Scenario, inventory: Record<string, number>): ActionInfo[] => {
  if (gameState.phase !== 'planning') return [];
  const { currentPlayer, plan, playerPlannedTimes, players } = gameState;

  // Project the state to the time when the player's next action will begin.
  const currentViewTime = playerPlannedTimes[currentPlayer];
  const { projectedMap, projectedPlayers, projectedCameras, projectedCamerasActive, projectedLaserGrids, projectedGuards } = getProjectedStateAtTime(plan, currentScenario, players, currentViewTime);

  const player = projectedPlayers[currentPlayer];
  const { x, y } = player;
  const actions: ActionInfo[] = [];

  // Check for adjacent guards for pickpocketing
  if ((player.skills.thief || 0) > 0) {
    const adjacentOffsets = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    for (const offset of adjacentOffsets) {
      const tx = x + offset.dx;
      const ty = y + offset.dy;
      // Can only pickpocket guards who have keys
      const guard = projectedGuards.find(g => g.x === tx && g.y === ty);

      if (guard && guard.hasKey && !gameState.pickpocketedGuards?.has(guard.id)) {
        let direction: ActionInfo['direction'] = 'center';
        if (offset.dx === 1) direction = 'right';
        else if (offset.dx === -1) direction = 'left';
        else if (offset.dy === 1) direction = 'down';
        else if (offset.dy === -1) direction = 'up';

        actions.push({
          action: 'pickpocket',
          label: getActionLabel('pickpocket', player),
          target: { x: tx, y: ty },
          targetId: guard.id,
          direction
        });
      }
    }
  }

  // Helper function to check a single tile for possible interactions.
  const checkTile = (tx: number, ty: number) => {
    const tile = projectedMap[ty]?.[tx];
    if (!tile) return;
    const playerForAction = projectedPlayers[currentPlayer];
    let actionInfo: Partial<ActionInfo> = {};

    const dx = tx - x;
    const dy = ty - y;
    let direction: ActionInfo['direction'] = 'center';
    if (dx === 1) direction = 'right';
    else if (dx === -1) direction = 'left';
    else if (dy === 1) direction = 'down';
    else if (dy === -1) direction = 'up';

    // Get the original tile to check for time-lock properties from the base scenario data.
    const originalTile = currentScenario.map[ty]?.[tx];
    const timeLock = (originalTile === TileType.SAFE_TIMELOCK || originalTile === TileType.VAULT_DOOR_TIMELOCK)
      ? currentScenario.timeLocks?.find(tl => tl.x === tx && tl.y === ty && currentViewTime >= tl.unlockTime && currentViewTime <= tl.lockTime)
      : undefined;

    // A large switch statement determines actions based on the tile type.
    switch (tile) {
      case TileType.DOOR_LOCKED:
      case TileType.DOOR_LOCKED_ALARMED:
        // Only allow picking if they have the skill OR a pickpocketed key
        const hasLockpickSkill = (playerForAction.skills.lockpicking || 0) > 0;
        const hasKey = (gameState.playerKeys?.[currentPlayer] || 0) > 0;

        if (hasLockpickSkill || hasKey) {
          actions.push({ action: 'unlock', label: getActionLabel('unlock', playerForAction, gameState, { x: tx, y: ty }, currentPlayer), target: { x: tx, y: ty }, direction, ...actionInfo });
        }
        actions.push({ action: 'smash_door', label: getActionLabel('smash_door', playerForAction, gameState, { x: tx, y: ty }, currentPlayer), target: { x: tx, y: ty }, direction });
        if (inventory.skeletonKey > 0) actions.push({ action: 'use_skeleton_key', label: getActionLabel('use_skeleton_key', playerForAction, gameState, { x: tx, y: ty }, currentPlayer), target: { x: tx, y: ty }, direction });
        break;
      case TileType.DOOR_CLOSED:
        actions.push({ action: 'open_door', label: getActionLabel('open_door', playerForAction), target: { x: tx, y: ty }, direction });
        if ((playerForAction.skills.lockpicking || 0) > 0) {
          actions.push({ action: 'lock_door', label: getActionLabel('lock_door', playerForAction), target: { x: tx, y: ty }, direction });
        }
        break;
      case TileType.DOOR_OPEN:
        actions.push({ action: 'close_door', label: getActionLabel('close_door', playerForAction), target: { x: tx, y: ty }, direction });
        if ((playerForAction.skills.lockpicking || 0) > 0) {
          actions.push({ action: 'lock_door', label: getActionLabel('lock_door', playerForAction), target: { x: tx, y: ty }, direction });
        }
        break;
      case TileType.DISPLAY_CASE:
      case TileType.DISPLAY_CASE_ALARMED:
        actions.push({ action: 'smash', label: getActionLabel('smash', playerForAction), target: { x: tx, y: ty }, direction });
        if ((playerForAction.skills.lockpicking || 0) > 0) {
          actions.push({ action: 'lockpick_case', label: getActionLabel('lockpick_case', playerForAction), target: { x: tx, y: ty }, direction });
        }
        if (inventory.glassCutter > 0) actions.push({ action: 'use_glass_cutter', label: getActionLabel('use_glass_cutter', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.DISPLAY_CASE_SMASHED:
      case TileType.DISPLAY_CASE_OPENED:
        actions.push({ action: 'rob', label: getActionLabel('rob', playerForAction), target: { x: tx, y: ty }, direction });
        actions.push({ action: 'close_case', label: getActionLabel('close_case', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.DISPLAY_CASE_ROBBED:
        actions.push({ action: 'close_case', label: getActionLabel('close_case', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.ART_PIECE:
      case TileType.ART_PIECE_ALARMED:
      case TileType.GOLD_BARS:
      case TileType.GOLD_BARS_ALARMED:
      case TileType.STATUE:
      case TileType.STATUE_ALARMED:
        actions.push({ action: 'rob', label: getActionLabel('rob', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.SAFE_TIMELOCK:
      case TileType.VAULT_DOOR_TIMELOCK:
        if (!timeLock) break; // Window closed!
      // Fall through
      case TileType.SAFE:
      case TileType.SAFE_ALARMED:
      case TileType.VAULT_DOOR:
        if (timeLock) {
          actionInfo.timeLock = { unlockTime: timeLock.unlockTime, lockTime: timeLock.lockTime };
        }

        // Safe cracking requires the safecracker skill
        if ((playerForAction.skills.safecracker || 0) > 0) {
          if (tile === TileType.VAULT_DOOR_TIMELOCK || tile === TileType.VAULT_DOOR) {
            actions.push({ action: 'crack', label: `Drill Vault (${getSkillAdjustedTime('crack', playerForAction)}s)`, target: { x: tx, y: ty }, direction, ...actionInfo });
          } else {
            actions.push({ action: 'crack', label: getActionLabel('crack', playerForAction), target: { x: tx, y: ty }, direction, ...actionInfo });
          }
        }

        // Planting dynamite requires the demolitions skill
        if ((playerForAction.skills.demolitions || 0) > 0) {
          actions.push({ action: 'plant_dynamite', label: getActionLabel('plant_dynamite', playerForAction), target: { x: tx, y: ty }, direction, ...actionInfo });

          if (inventory.thermicLance > 0 && tile !== TileType.SAFE_TIMELOCK && tile !== TileType.VAULT_DOOR_TIMELOCK) {
            actions.push({ action: 'use_thermic_lance', label: getActionLabel('use_thermic_lance', playerForAction), target: { x: tx, y: ty }, direction });
          }
        }
        break;
      case TileType.CABINET:
      case TileType.CABINET_ALARMED:
      case TileType.CABINET_OPEN:
      case TileType.CABINET_ROBBED:
      case TileType.ART_PIECE:
      case TileType.ART_PIECE_ALARMED:
      case TileType.GOLD_BARS:
      case TileType.GOLD_BARS_ALARMED:
      case TileType.STATUE:
      case TileType.STATUE_ALARMED:
      case TileType.SCULPTURE:
      case TileType.DESK:
      case TileType.TELLER_COUNTER:
      case TileType.FILING_CABINET:
      case TileType.SOFA:
      case TileType.COLUMN:
      case TileType.PLANT:
        if (tile === TileType.CABINET || tile === TileType.CABINET_ALARMED) {
          actions.push({ action: 'open_cabinet', label: getActionLabel('open_cabinet', playerForAction), target: { x: tx, y: ty }, direction });
        } else if (tile === TileType.CABINET_OPEN) {
          actions.push({ action: 'rob', label: getActionLabel('rob', playerForAction), target: { x: tx, y: ty }, direction });
          actions.push({ action: 'close_cabinet', label: getActionLabel('close_cabinet', playerForAction), target: { x: tx, y: ty }, direction });
        } else if (tile === TileType.CABINET_ROBBED) {
          actions.push({ action: 'close_cabinet', label: getActionLabel('close_cabinet', playerForAction), target: { x: tx, y: ty }, direction });
        } else {
          // Only allow robbing if there is actual treasure at this tile
          const hasTreasure = !!currentScenario.treasures[`${tx}-${ty}`];
          if (hasTreasure) {
            actions.push({ action: 'rob', label: getActionLabel('rob', playerForAction), target: { x: tx, y: ty }, direction });
          }
        }
        break;
      case TileType.SAFE_OPENED:
      case TileType.SAFE_SMASHED:
        actions.push({ action: 'rob', label: getActionLabel('rob', playerForAction), target: { x: tx, y: ty }, direction });
        actions.push({ action: 'close_safe', label: getActionLabel('close_safe', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.SAFE_ROBBED:
        actions.push({ action: 'close_safe', label: getActionLabel('close_safe', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.ALARM_BOX:
        actions.push({ action: 'disable_alarm', label: getActionLabel('disable_alarm', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.CAMERA:
        if ((playerForAction.skills.electronics || 0) > 0) {
          actions.push({ action: 'disable', label: getActionLabel('disable', playerForAction), target: { x: tx, y: ty }, direction });
        }
        if (inventory.cameraLooper > 0) actions.push({ action: 'use_camera_looper', label: getActionLabel('use_camera_looper', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.CAMERA_CONTROL_PANEL:
        actions.push({ action: 'disable_cameras', label: getActionLabel('disable_cameras', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.LASER_CONTROL_PANEL:
        actions.push({ action: 'disable_lasers', label: getActionLabel('disable_lasers', playerForAction), target: { x: tx, y: ty }, direction });
        if (inventory.laserJammerShort > 0) actions.push({ action: 'use_laser_jammer_short', label: getActionLabel('use_laser_jammer_short', playerForAction), target: { x: tx, y: ty }, direction });
        if (inventory.laserJammerLong > 0) actions.push({ action: 'use_laser_jammer_long', label: getActionLabel('use_laser_jammer_long', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.PRESSURE_PLATE_PANEL:
        actions.push({ action: 'disable_pressure_plates', label: getActionLabel('disable_pressure_plates', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.PRESSURE_PLATE:
      case TileType.PRESSURE_PLATE_HIDDEN:
        if (inventory.foamCanister > 0) actions.push({ action: 'use_foam_canister', label: getActionLabel('use_foam_canister', playerForAction), target: { x: tx, y: ty }, direction });
        break;
      case TileType.COMPUTER_TERMINAL:
        if ((playerForAction.skills.electronics || 0) > 0) {
          actions.push({ action: 'hack', label: getActionLabel('hack', playerForAction), target: { x: tx, y: ty }, direction });
        }
        break;
      case TileType.WINDOW:
        actions.push({ action: 'break_window', label: getActionLabel('break_window', playerForAction), target: { x: tx, y: ty }, direction });
        break;
    }
  };

  // Check tiles around the player
  checkTile(x, y - 1); // Up
  checkTile(x, y + 1); // Down
  checkTile(x - 1, y); // Left
  checkTile(x, y);     // Center (for things like robbing an item you are standing on)
  checkTile(x + 1, y); // Right

  // Check for guards in adjacent tiles for knockout action
  const adjacentPositions = [
    { x: x - 1, y: y, direction: 'left' as const },
    { x: x + 1, y: y, direction: 'right' as const },
    { x: x, y: y - 1, direction: 'up' as const },
    { x: x, y: y + 1, direction: 'down' as const }
  ];

  for (const pos of adjacentPositions) {
    // Find guard at this position
    const guard = projectedGuards.find(g => g.x === pos.x && g.y === pos.y);
    if (guard && guard.status !== 'knocked_out' && guard.status !== 'guarding_captured_player') {
      // Check if player is in guard's vision
      const guardVision = calculateGuardVision(guard, projectedMap);
      const playerKey = `${player.x}-${player.y}`;
      if (!guardVision.has(playerKey)) {
        // Player is adjacent but not in vision - can knockout
        actions.push({
          action: 'knockout',
          label: getActionLabel('knockout', projectedPlayers[currentPlayer]),
          target: { x: pos.x, y: pos.y },
          direction: pos.direction
        });
      }
    }
  }

  // Add 'distract' as a general action, not tied to an adjacent tile.
  actions.push({ action: 'distract', label: getActionLabel('distract', projectedPlayers[currentPlayer]), direction: 'none' });

  // Add 'use_stun_o_mat' if the player has it in inventory
  if (inventory.stunOMat > 0) {
    actions.push({ action: 'use_stun_o_mat', label: getActionLabel('use_stun_o_mat', projectedPlayers[currentPlayer]), direction: 'none' });
  }

  return actions;
};
