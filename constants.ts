/**
 * @file constants.ts
 * @description
 * This file centralizes all the "magic numbers" and configuration values for the game.
 * By keeping them in one place, it's easy to tweak game balance and mechanics without
 * searching through the entire codebase. This is a critical file for managing the game's difficulty and feel.
 */

// Import type definitions to ensure that mappings are type-safe.
import { TileType, ActionType, Skill, ConsumableItem } from './types';
import type { Player, Camera } from './types';

// --- Rendering Constants ---

/**
 * The maximum dimensions of the grid.
 * Reusable for: Map generation, boundary checks, rendering loops.
 */
export const GRID_WIDTH = 96;
export const GRID_HEIGHT = 64;

// --- Dev Utilities ---
export const GOD_MODE_ENABLED: number = 1; // 0 = false, 1 = true


/**
 * The size of each tile in pixels. This value is used for all rendering calculations
 * in the UI to determine the position and size of tiles, players, and other objects.
 * Changing this will scale the entire game board visually.
 */
export const TILE_SIZE = 40; // in pixels


// --- Game Balance: Action Timings ---

/**
 * An object containing the base time costs for various player actions, measured in seconds.
 * These are the default durations before any player skills are applied.
 * This is the primary object for balancing the time management aspect of the game.
 */
export const TIME_COST = {
    MOVE: 1,                      // Moving one tile.
    SMASH_CASE: 4,                // Smashing a display case (fast but noisy and less valuable).
    LOCKPICK_CASE: 8,             // Lockpicking a display case (slow but quiet and preserves value).
    CRACK: 20,                    // Cracking a safe is a long, high-skill action.
    UNLOCK: 12,                   // Picking a standard door lock.
    DISABLE: 2,                   // Disabling a single camera locally.
    ROB: 4,                       // The act of taking the treasure after a container is open.
    SMASH_DOOR: 4,                // Forcefully smashing a door open.
    OPEN_DOOR: 1,                 // Opening an unlocked door.
    CLOSE_DOOR: 1,                // Closing a door.
    LOCK_DOOR: 3,                 // Locking a door (base time for level 1 locksmith)
    DISABLE_ALARM: 10,             // Disabling the main alarm panel.
    DISABLE_CAMERAS: 10,           // Disabling the main camera control panel.
    DISABLE_LASERS: 10,            // Disabling a laser control panel.
    DISABLE_PRESSURE_PLATES: 10,   // Disarming the central pressure plate panel.
    DISTRACT: 1,                  // Throwing a stone to create a noise distraction.
    OPEN_CABINET: 2,              // Opening an unlocked cabinet.
    CLOSE_CABINET: 1,             // Closing a cabinet.
    CLOSE_CASE: 1,                // Closing an opened display case.
    CLOSE_SAFE: 3,                // Closing a cracked safe.
    PLANT_DYNAMITE: 10,           // Planting dynamite on a safe. Base time, skill reduces it.
    HACK: 10,                     // Hacking a computer terminal.
    KNOCKOUT: 0,                  // Knocking out a guard (instant action).
    PICKPOCKET: 0,                // Pickpocketing a key from a guard (instant action).
    BREAK_WINDOW: 4,              // Breaking a window.

    // --- Consumable Item Actions ---
    USE_SKELETON_KEY: 1,
    USE_CAMERA_LOOPER: 3,
    USE_FOAM_CANISTER: 2,
    USE_GLASS_CUTTER: 3,
    USE_THERMIC_LANCE: 4,
    USE_LASER_JAMMER_SHORT: 10,
    USE_LASER_JAMMER_LONG: 20,
    USE_STUN_O_MAT: 2,            // Shooting the Stun-O-Mat gun.
};

/**
 * A mapping between specific actions and the skills that can affect their performance (i.e., reduce their time cost).
 * This provides a direct link between a player's abilities and the time it takes to do things.
 * The core of the skill system relies on this map.
 * Used in: `lib/actions.ts` to calculate skill-adjusted time costs.
 */
export const ACTION_SKILL_MAP: Partial<Record<ActionType, Skill>> = {
    unlock: 'lockpicking',
    lock_door: 'lockpicking',
    lockpick_case: 'lockpicking',
    crack: 'safecracker',
    smash: 'thief',
    smash_door: 'thief',
    plant_dynamite: 'demolitions',
    disable: 'electronics',
    disable_alarm: 'electronics',
    disable_cameras: 'electronics',
    disable_lasers: 'electronics',
    disable_pressure_plates: 'electronics',
    hack: 'electronics',
    rob: 'thief',
    pickpocket: 'thief',
    knockout: 'infiltrator',
    // Consumable skill mappings
    use_skeleton_key: 'lockpicking',
    use_camera_looper: 'electronics',
    use_foam_canister: 'infiltrator',
    use_glass_cutter: 'lockpicking',
    use_thermic_lance: 'demolitions',
    use_laser_jammer_short: 'electronics',
    use_laser_jammer_long: 'electronics',
    use_stun_o_mat: 'infiltrator',
};

// --- Game Balance: Consumable Items ---

export const CONSUMABLE_ITEMS: Record<string, ConsumableItem> = {
    skeletonKey: {
        id: 'skeletonKey',
        name: 'Skeleton Key',
        description: 'A fragile, precision-milled lockpick that can instantly open any standard locked door. It shatters after a single use.',
        cost: 1800,
        action: 'use_skeleton_key',
    },
    cameraLooper: {
        id: 'cameraLooper',
        name: 'Camera Looper',
        description: 'A transmitter that broadcasts a 15-second video loop, blinding a camera. The device then fries itself, leaving no trace.',
        cost: 3500,
        action: 'use_camera_looper',
    },
    foamCanister: {
        id: 'foamCanister',
        name: 'Sure-Step Foam',
        description: 'Sprays a quick-hardening, pressure-absorbent foam onto a pressure plate, rendering it inert for 60 seconds.',
        cost: 4000,
        action: 'use_foam_canister',
    },
    glassCutter: {
        id: 'glassCutter',
        name: 'Glass Cutter',
        description: 'Silently and quickly opens one display case, preserving the full value of the loot inside.',
        cost: 2500,
        action: 'use_glass_cutter',
    },
    thermicLance: {
        id: 'thermicLance',
        name: 'Thermic Lance Charge',
        description: 'A single-use charge that silently burns open a standard safe. Faster than safecracking but consumes the item.',
        cost: 6000,
        action: 'use_thermic_lance',
    },
    laserJammerShort: {
        id: 'laserJammerShort',
        name: 'Laser Jammer (Short)',
        description: 'Takes 10 seconds to install on a laser panel, disabling the associated grid for 30 seconds.',
        cost: 5000,
        action: 'use_laser_jammer_short',
    },
    laserJammerLong: {
        id: 'laserJammerLong',
        name: 'Laser Jammer (Long)',
        description: 'A more advanced jammer. Takes 20 seconds to install, but disables the laser grid for the rest of the heist.',
        cost: 10000,
        action: 'use_laser_jammer_long',
    },
    stunOMat: {
        id: 'stunOMat',
        name: 'Stun-O-Mat',
        description: 'A powerful stun grenade that creates a 3x3 cloud of tranquilizer gas. Anyone caught in the cloud is knocked out for the rest of the turn. The gas ignores walls and closed doors. Single use.',
        cost: 7500,
        action: 'use_stun_o_mat',
    }
};


// --- Game Balance: Execution Phase ---

/**
 * The starting time for the execution phase countdown timer, in seconds.
 * This is a major factor in the game's overall difficulty.
 */
export const EXECUTION_START_TIME = 180; // 3 minutes

/**
 * The range of percentage value loss when a display case is smashed instead of picked.
 * A random value between these two will be chosen to add some variability.
 * This creates a risk/reward trade-off: smashing is faster but yields less money.
 */
export const CASE_SMASH_PENALTY_MIN = 0.05; // 5% value loss minimum
export const CASE_SMASH_PENALTY_MAX = 0.15; // 15% value loss maximum

// --- Game Balance: Noise Mechanics ---

/**
 * The maximum distance (in tiles) that a general noise event can travel.
 * Used for both guard hearing checks and visual feedback.
 */
export const NOISE_RANGE = 7;

/**
 * The range for a thrown stone distraction, creating a small 3x3-like area of effect.
 */
export const DISTRACTION_NOISE_RANGE = 1;

/**
 * The default duration (in seconds) that the visual ripple effect for a noise event remains on screen.
 */
export const NOISE_VISUAL_DURATION = 3;

/**
 * The default fuse time in seconds for dynamite if not specified by the player.
 */
export const DYNAMITE_FUSE_TIME = 11;

/**
 * The radius of a dynamite explosion, affecting players and creating noise.
 */
export const DYNAMITE_BLAST_RADIUS = 5;

/**
 * The properties of the Stun-O-Mat grenade.
 */
export const STUN_O_MAT_RADIUS = 1; // 1 tile in each direction = 3x3 area
export const STUN_O_MAT_DURATION = 2; // Active for 2 seconds