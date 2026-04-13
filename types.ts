/**
 * @file types.ts
 * @description
 * This file serves as the central repository for all type definitions and interfaces used
 * throughout the application. It establishes the data structures for the game world, characters,
 * actions, and overall state, ensuring type safety and providing a clear data dictionary.
 */

/**
 * Represents the persistent state of a player's career.
 * This is stored in the database to track progress between game sessions.
 */
export interface CampaignState {
  id: 'player_career'; // A fixed key for the single DB record
  totalCash: number;
  reputation: number;
  unlockedScenarios: string[]; // Array of scenario IDs
  // Tracks completed objectives per scenario to prevent re-earning reputation.
  completedObjectives: Record<string, string[]>; // e.g. { 's01_starterJob': ['base', 'stealth'] }
  // Difficulty mode
  difficulty?: 'easy' | 'permadeath'; // Easy = current behavior, Permadeath = captured thieves permanently unavailable
  deadCharacters?: string[]; // Character IDs that died in permadeath mode
  capturedCharacters?: string[]; // Character names/IDs that were captured and are now unavailable
}

/**
 * Represents the data needed to render the end-of-heist newspaper report.
 */
export interface HeistReportData {
  headline: string;
  scenarioName: string;
  wasSuccess: boolean;
  objectivesMessage: string;
  cashGained: number;
  totalLootValue: number;
  finalGearCost: number;
  crewCut: number;
  yourTake: number;
  totalHireCost: number;
  totalReputationGained: number;
  bonusReputationGained: number; // For secondary objective
  article: string; // The full, dynamically generated newspaper article.
  capturedPlayers: string[]; // List of names of captured players.
  // FIX: Add missing properties to HeistReportData to match usage in App.tsx
  alarmTriggered: boolean;
  doorSmashed: boolean;
  explosivesDetonated: boolean;
}


/**
 * Enum representing all possible types of tiles on the game map.
 * Each value corresponds to a specific visual representation and a set of behaviors (e.g., walkability, line of sight).
 * This is a foundational enum for defining the game world's structure.
 */
export enum TileType {
  // --- Structural Tiles ---
  WALL = 'WALL', // An impassable wall tile.
  BRICKS = 'BRICKS', // A wall tile with a brick pattern.
  WINDOW = 'WINDOW', // A window that blocks sound but not vision, can be broken
  WINDOW_BROKEN = 'WINDOW_BROKEN', // A broken window that allows both sound and vision

  // --- Floor Tiles ---
  FLOOR = 'FLOOR', // Standard walkable area inside the building.
  EXTERIOR = 'EXTERIOR', // Area outside the building, generally walkable and where the getaway car is located.
  DESK = 'DESK', // A desk that acts as an obstacle.
  COLUMN = 'COLUMN', // A column that acts as an obstacle.
  PLANT = 'PLANT', // A decorative plant that acts as an obstacle.
  SCULPTURE = 'SCULPTURE', // A sculpture or statue that acts as an obstacle.
  TELLER_COUNTER = 'TELLER_COUNTER', // A long teller counter that acts as an obstacle.

  // --- More Furniture / Obstacles ---
  SOFA = 'SOFA',
  FILING_CABINET = 'FILING_CABINET',
  WATER_COOLER = 'WATER_COOLER',
  VENDING_MACHINE = 'VENDING_MACHINE',
  VELVET_ROPE = 'VELVET_ROPE',
  LOO = 'LOO',
  KITCHEN_UNIT = 'KITCHEN_UNIT',
  BROOM_CABINET = 'BROOM_CABINET',

  // --- New Floor Types ---
  FLOOR_WOOD = 'FLOOR_WOOD',
  FLOOR_CEMENT = 'FLOOR_CEMENT',
  FLOOR_MARBLE = 'FLOOR_MARBLE',
  FLOOR_SLATE = 'FLOOR_SLATE',
  FLOOR_CARPET = 'FLOOR_CARPET',
  FLOOR_TILES = 'FLOOR_TILES',

  // --- Door variants ---
  DOOR_LOCKED = 'DOOR_LOCKED', // A door that requires an 'unlock' (lockpicking) or 'smash_door' action to pass.
  DOOR_LOCKED_ALARMED = 'DOOR_LOCKED_ALARMED', // A locked door connected to the main alarm system.
  DOOR_OPEN = 'DOOR_OPEN', // An open, walkable doorway. Does not block line of sight.
  DOOR_CLOSED = 'DOOR_CLOSED', // A closed but unlocked door. Can be opened with the 'open_door' action. Blocks line of sight.
  DOOR_SMASHED = 'DOOR_SMASHED', // A door that has been forcefully opened. Walkable, but creates evidence that guards can spot.
  VAULT_DOOR = 'VAULT_DOOR', // A heavy vault door requiring the 'crack' action.

  // --- Treasure container variants: Display Case ---
  DISPLAY_CASE = 'DISPLAY_CASE', // A standard treasure container. Can be smashed or lockpicked.
  DISPLAY_CASE_SMASHED = 'DISPLAY_CASE_SMASHED', // State after being smashed. Ready to be robbed but may yield less value. Creates evidence.
  DISPLAY_CASE_OPENED = 'DISPLAY_CASE_OPENED', // State after being successfully lockpicked. Ready to be robbed.
  DISPLAY_CASE_ROBBED = 'DISPLAY_CASE_ROBBED', // State after treasure has been taken. Is considered evidence.
  DISPLAY_CASE_ALARMED = 'DISPLAY_CASE_ALARMED', // A display case connected to the main alarm system. Tampering with it triggers the alarm if active.

  // --- Treasure container variants: Safe ---
  SAFE = 'SAFE', // A high-value treasure container requiring the 'crack' action.
  SAFE_OPENED = 'SAFE_OPENED', // State after being cracked. Ready to be robbed.
  SAFE_ROBBED = 'SAFE_ROBBED', // State after treasure has been taken. Is considered evidence.
  SAFE_ALARMED = 'SAFE_ALARMED', // A safe connected to the alarm system.
  SAFE_TIMELOCK = 'SAFE_TIMELOCK', // A safe that can only be opened during a specific time window.
  SAFE_SMASHED = 'SAFE_SMASHED', // State after being blown up with dynamite. Ready to be robbed.

  // --- Treasure container variants: Art Piece ---
  ART_PIECE = 'ART_PIECE', // A treasure that can be stolen directly from a wall or pedestal.
  ART_PIECE_ROBBED = 'ART_PIECE_ROBBED', // State after art has been stolen.
  ART_PIECE_ALARMED = 'ART_PIECE_ALARMED', // Art piece connected to the alarm system.

  // --- NEW Treasure container variants: Statue ---
  STATUE = 'STATUE',
  STATUE_ROBBED = 'STATUE_ROBBED',
  STATUE_ALARMED = 'STATUE_ALARMED',

  // --- Treasure container variants: Gold Bars ---
  GOLD_BARS = 'GOLD_BARS', // A stack of gold bars, typically high-value.
  GOLD_BARS_ROBBED = 'GOLD_BARS_ROBBED', // State after gold has been stolen.
  GOLD_BARS_ALARMED = 'GOLD_BARS_ALARMED', // Gold bars connected to the alarm system.

  // --- Treasure container variants: Unlocked Cabinet ---
  CABINET = 'CABINET', // A simple cabinet that can be opened without special skills.
  CABINET_OPEN = 'CABINET_OPEN', // State after being opened.
  CABINET_ROBBED = 'CABINET_ROBBED', // State after being robbed.
  CABINET_ALARMED = 'CABINET_ALARMED', // A cabinet connected to the alarm system.
  TELLER_COUNTER_ROBBED = 'TELLER_COUNTER_ROBBED',

  // --- Robbed Decor States ---
  DESK_ROBBED = 'DESK_ROBBED',
  COLUMN_ROBBED = 'COLUMN_ROBBED',
  PLANT_ROBBED = 'PLANT_ROBBED',
  SCULPTURE_ROBBED = 'SCULPTURE_ROBBED',
  SOFA_ROBBED = 'SOFA_ROBBED',
  WATER_COOLER_ROBBED = 'WATER_COOLER_ROBBED',
  VENDING_MACHINE_ROBBED = 'VENDING_MACHINE_ROBBED',
  LOO_ROBBED = 'LOO_ROBBED',
  KITCHEN_UNIT_ROBBED = 'KITCHEN_UNIT_ROBBED',
  BROOM_CABINET_ROBBED = 'BROOM_CABINET_ROBBED',
  FILING_CABINET_ROBBED = 'FILING_CABINET_ROBBED',

  // --- Security System Control Panels (typically placed on WALL tiles) ---
  CAMERA = 'CAMERA', // Represents the physical location of a security camera on a wall. Players can interact with this to disable it locally.
  CAMERA_DISABLED = 'CAMERA_DISABLED', // A camera that has been disabled. It no longer projects a vision cone.
  ALARM_BOX = 'ALARM_BOX', // The central control for the silent alarm system. Disabling this prevents alarms on treasures from triggering.
  ALARM_BOX_DISABLED = 'ALARM_BOX_DISABLED', // The state of the alarm box after being disabled.
  CAMERA_CONTROL_PANEL = 'CAMERA_CONTROL_PANEL', // The central control for all cameras. Disabling this turns off the entire camera system.
  CAMERA_CONTROL_PANEL_DISABLED = 'CAMERA_CONTROL_PANEL_DISABLED', // Disabled camera system panel.
  LASER_CONTROL_PANEL = 'LASER_CONTROL_PANEL', // The control panel for a laser grid.
  LASER_CONTROL_PANEL_DISABLED = 'LASER_CONTROL_PANEL_DISABLED', // Disabled laser grid panel.
  LASER_CONTROL_PANEL_JAMMED = 'LASER_CONTROL_PANEL_JAMMED', // A panel that has a jammer on it.
  PRESSURE_PLATE_PANEL = 'PRESSURE_PLATE_PANEL', // The control panel for all pressure plates.
  PRESSURE_PLATE_PANEL_DISABLED = 'PRESSURE_PLATE_PANEL_DISABLED', // Disabled pressure plate panel.
  COMPUTER_TERMINAL = 'COMPUTER_TERMINAL', // A terminal that can be hacked to disable specific security devices.
  COMPUTER_TERMINAL_HACKED = 'COMPUTER_TERMINAL_HACKED', // A terminal that has been successfully hacked.

  // --- Environmental Traps (typically on FLOOR tiles) ---
  PRESSURE_PLATE = 'PRESSURE_PLATE', // A visible, armed pressure plate.
  PRESSURE_PLATE_DISABLED = 'PRESSURE_PLATE_DISABLED', // A disarmed pressure plate.
  PRESSURE_PLATE_HIDDEN = 'PRESSURE_PLATE_HIDDEN', // An armed pressure plate that is not initially visible to players.
  FOAMED_PRESSURE_PLATE = 'FOAMED_PRESSURE_PLATE', // A plate temporarily disabled by foam.

  // --- Vehicle Tiles ---
  CAR = 'CAR', // The getaway vehicle. The objective for winning the game is for all active players to reach this tile.
  POLICE_CAR = 'POLICE_CAR', // Appears when time runs out, purely for visual effect to signify a loss.

  // --- Time-Locked Objects ---
  VAULT_DOOR_TIMELOCK = 'VAULT_DOOR_TIMELOCK', // A vault door that can only be opened during a specific time window.
}

/**
 * Defines the set of specialized skills a player character can have.
 * These skills typically affect the time it takes to perform related actions.
 */
export type Skill = 'lockpicking' | 'safecracker' | 'demolitions' | 'electronics' | 'infiltrator' | 'thief' | 'passive';

/**
 * Represents a character from the roster before the game starts.
 * It's a subset of the `Player` interface.
 */
export interface RosterCharacter {
  name: string;
  skills: Partial<Record<Skill, number>>;
  hireCost: number;   // Cost to add them to your active crew
  tier: number;       // What tier they belong to
  reputationRequired: number;
  share: number;      // Percentage of heist earnings taken as a cut
  bio: string;        // A short backstory for the character.
}

/**
 * Represents a single player character in the game.
 * This interface holds all static and dynamic data for a player.
 */
export interface Player {
  name: string; // The player's display name.
  skills: Partial<Record<Skill, number>>; // A map of skills to skill levels (e.g., { lockpicking: 2 }). A higher level means faster actions.
  x: number; // The player's current X coordinate on the grid. This is updated during the execution phase.
  y: number; // The player's current Y coordinate on the grid. This is updated during the execution phase.
  /**
   * Used during the execution phase to handle players needing to move out of each other's way.
   * If Player A needs to move to Player B's tile, Player B gets a temporary `stepAside` plan.
   * A player will move to a temporary `target` spot, wait, and then `returnTo` their original position once the path is clear.
   */
  stepAside?: {
    target: { x: number, y: number };
    returnTo: { x: number, y: number };
    movingToTarget: boolean; // Tracks if they are moving to the temporary spot or waiting to return.
  } | null;
  /**
   * A transient flag used during a single tick of the game loop.
   * If true, it indicates this player's action for the tick has already been resolved (e.g., as part of a swap with another player)
   * and their normal action processing should be skipped to prevent double-moves.
   */
  processedThisTick?: boolean;
}

/**
 * Defines all possible actions a player can perform during the planning phase.
 */
export type ActionType = 'move' | 'unlock' | 'smash' | 'crack' | 'disable' | 'rob' | 'smash_door' | 'lockpick_case' | 'wait' | 'disable_alarm' | 'disable_cameras' | 'open_door' | 'close_door' | 'lock_door' | 'disable_lasers' | 'disable_pressure_plates' | 'distract' | 'open_cabinet' | 'close_cabinet' | 'close_case' | 'close_safe' | 'plant_dynamite' | 'hack' | 'knockout' | 'pickpocket' | 'break_window' | 'none'
  // Consumable item actions
  | 'use_skeleton_key' | 'use_camera_looper' | 'use_foam_canister' | 'use_glass_cutter' | 'use_thermic_lance' | 'use_laser_jammer_short' | 'use_laser_jammer_long' | 'use_stun_o_mat';

/**
 * A structure to hold an action and its user-friendly label for display in the UI.
 * Used for dynamically generating and displaying action buttons in the control panel.
 */
export interface ActionInfo {
  action: ActionType; // The internal action type.
  label: string;      // The text to display on the button (e.g., "Pick Lock (10s)").
  target?: { x: number, y: number }; // The coordinate of the tile this action applies to.
  targetId?: number | string; // Optional: The ID of the target entity (e.g. guard ID)
  timeLock?: { unlockTime: number; lockTime: number }; // Optional: The time lock schedule for this action, for display purposes.
  direction?: 'up' | 'down' | 'left' | 'right' | 'center' | 'none';
}

/**
 * Represents a single step in the heist plan.
 * The entire plan is an array of these objects, forming a sequence of actions for both players.
 */
export interface PlanStep {
  action: ActionType; // The type of action to perform (e.g., 'move', 'rob').
  teamMember: number; // Which player performs the action (index in the players array).
  target: { x: number, y: number }; // The grid coordinate for the action's target. For 'move', this is the destination. For 'rob', it's the treasure's location.
  targetId?: number | string; // Optional: The ID of the target entity (e.g. guard ID)
  timeCost: number; // How many seconds this action takes, adjusted for skills.
  dynamiteTimer?: number; // Optional: fuse duration for dynamite.
}

/**
 * Represents the status of a player during the execution phase.
 * This controls player behavior and visual state during the heist.
 */
export type PlayerStatus = 'executing' | 'blocked' | 'stepping_aside' | 'knocked_out' | 'captured' | 'frozen';

/**
 * Represents an interaction animation that is currently active on the map.
 * Used to render visual feedback for ongoing actions during the execution phase.
 */
export interface ActiveInteraction {
  x: number; // X coordinate of the interaction.
  y: number; // Y coordinate of the interaction.
  action: ActionType; // The type of action, used to determine which animation icon to show.
  teamMember: number; // Which player is performing the action.
}

/**
 * Represents a security camera in the game.
 */
export interface Camera {
  id: number; // Unique identifier for the camera.
  x: number; // X coordinate on the grid (always on a WALL tile).
  y: number; // Y coordinate on the grid (always on a WALL tile).
  /** 
   * An array of arrays of coordinates, representing its surveillance pattern over time.
   * `[[{x:1,y:1}], [{x:2,y:2}]]` means it looks at (1,1) in frame 1, then (2,2) in frame 2.
   * This allows for cameras that pan back and forth.
   */
  pattern: { x: number, y: number }[][];
  period: number; // Seconds per step in its surveillance pattern. A period of 1 means it changes view every second.
  orientation: 'up' | 'down' | 'left' | 'right'; // The direction the camera is facing, which determines its vision cone shape.
  disabled?: boolean; // Whether the camera has been disabled by a player.
  looperTimer?: number; // Timer for how long a camera looper is active.
  hideInPlanningAfter?: number; // NEW: If set, camera vision is hidden in planning after this time.
}

/**
 * Represents the current state of a patrolling guard during the execution phase.
 * This is a state machine that dictates the guard's behavior.
 */
export type GuardStatus =
  'patrolling' |          // Following the predefined patrol route.
  'alerted' |             // Has seen evidence. Pauses briefly, then becomes permanently alerted.
  'running_to_alarm' |    // Actively moving towards the nearest alarm panel after spotting evidence.
  'knocked_out' |         // Temporarily unconscious.
  'investigating_noise' | // Heard a noise and is moving to check it out.
  'permanently_alerted' | // No longer follows patrol route; moves faster, wider vision, more erratic.
  'chasing_player' |      // Has seen a player and is actively pursuing them.
  'guarding_captured_player' | // Has captured a player and is now immobile, guarding them.
  'returning_to_post' |   // Moving back to original patrol position after a false alarm.
  'investigating_suspicion' | // Saw a minor change (e.g., open door) and is checking it out.
  'calling_backup';       // Saw a player from a distance. Pauses for one tick to alert another guard.

/**
 * Represents a single guard NPC in the game.
 */
export interface Guard {
  id: number; // Unique identifier for the guard.
  name: string; // The guard's display name.
  x: number; // The guard's current X coordinate.
  y: number; // The guard's current Y coordinate.
  patrolRoute: { x: number; y: number }[]; // The precise, tile-by-tile path the guard follows. This is calculated from `patrolWaypoints`.
  patrolWaypoints?: { x: number; y: number }[]; // The key points of a patrol, defined in the map editor. Used to generate `patrolRoute`.
  patrolIndex: number; // The guard's current position within the `patrolRoute` array.
  orientation: 'up' | 'down' | 'left' | 'right'; // The direction the guard is facing.
  status: GuardStatus; // The guard's current behavioral state.
  path_to_alarm?: { x: number; y: number }[]; // A dynamically calculated path to an alarm panel when alerted.
  path_to_noise?: { x: number; y: number }[]; // A dynamically calculated path to a noise source.
  path_to_interest?: { x: number; y: number }[]; // A dynamically calculated path for the 'permanently_alerted' state.
  path_to_player?: { x: number; y: number }[]; // A dynamically calculated path to a targeted player.
  path_to_post?: { x: number; y: number }[]; // A dynamically calculated path to return to the original position.
  path_to_suspicion?: { x: number; y: number }[]; // A dynamically calculated path to a suspicious location.
  targetPlayerIndex?: number; // The index of the player the guard is currently chasing.
  noise_source?: { x: number; y: number }; // The original location of a noise the guard is investigating.
  suspicion_target?: { x: number; y: number }; // The location of a minor disturbance.
  time_to_next_move: number; // Countdown for movement, used when not on a fixed patrol (e.g., investigating).
  knockout_timer?: number; // Countdown for how long the guard remains knocked out.
  alert_timer?: number; // Countdown for pausing briefly when first alerted.
  investigation_timer?: number; // Countdown for pausing at a noise location to "look around".
  suspicion_timer?: number; // Countdown for pausing at a suspicious location.
  isDisrupted?: boolean; // Flag to indicate if the guard is off their timed patrol route (e.g., after investigating noise).
  pre_investigation_pos?: { x: number, y: number }; // Where the guard was before investigating.
  pre_investigation_patrol_index?: number; // The patrol index before investigating.
  // FIX: Add missing property for guard patrol resumption logic.
  resume_patrol_at_index?: number; // The index of the patrol route to resume at after an interruption.
  // NEW: For planning phase visualization
  distractionEndTime?: number; // Time when distraction explicitly ends (for resuming patrol correctly)
  distractionPath?: {
    path: { x: number; y: number; orientation?: 'up' | 'down' | 'left' | 'right' }[];
    startTime: number;
    endTime: number;
  };
  // NEW: For advanced AI
  stoneDistractionCount?: number; // How many times they've been fooled by a stone.
  hasBeenSuspicious?: boolean; // If true, any new suspicious event triggers alarm.
  isDoingWiderScan?: boolean; // Flag for the multi-stage door investigation.
  noise_source_type?: 'stone' | 'explosion'; // To differentiate noise sources.
  // Stationary Guard AI
  isStationary?: boolean;
  panTimer?: number;
  panIndex?: number;
  panSequence?: ('up' | 'down' | 'left' | 'right')[];
  panPeriod?: number; // Time in seconds between rotations
  // Track door investigated for closing after leaving area
  investigated_door?: { x: number; y: number };
  // S01 Special Guard Behavior
  onlyAlertsOnDoorTamper?: boolean; // If true, only reacts to specific door being tampered
  despawnAfterMoves?: number; // Number of moves after which the guard despawns
  moveCounter?: number; // Tracks how many moves the guard has made
  // Pickpocket Mechanic
  hasKey?: boolean; // If true, this guard carries a key that can be pickpocketed
  // Door closing tracking for planning view
  closedDoors?: { x: number; y: number; closeTime: number }[]; // Doors this guard will close during investigations
  // LIMITED INTEL
  hiddenInPlanning?: boolean; // NEW: If true, guard is hidden in planning phase.
  hidePatrolInPlanning?: boolean; // NEW: If true, patrol route is hidden and guard appears stationary in planning.
}

/**
 * Represents a set of laser beams linked to a control panel.
 */
export interface LaserGrid {
  id: number; // Unique identifier, linked to a LaserControlPanel.
  controlPanel: { x: number; y: number }; // Coordinates of the LASER_CONTROL_PANEL tile.
  beamTiles: { x: number; y: number }[]; // Coordinates of all tiles covered by this grid's beams.
  timer?: { on: number; off: number; offset: number }; // Optional timing for cycling on/off. 'on'/'off' in seconds, 'offset' to desynchronize grids.
}

/**
 * Represents the dynamic state of a laser grid during the execution phase.
 */
export interface ActiveLaserGrid extends LaserGrid {
  active: boolean;  // Whether the system is powered on (can be disabled at the panel).
  beamsOn: boolean; // Whether the beams are currently visible and dangerous (for timed grids).
  jamTimer?: number; // Timer for how long a laser jammer is active.
}

/**
 * Represents a pressure plate trap. The logic is stored here, while the visual is a TileType.
 */
export interface PressurePlate {
  x: number; // The plate's x-coordinate.
  y: number; // The plate's y-coordinate.
  disabled?: boolean; // to track state during execution (e.g., after being triggered or disarmed).
  foamTimer?: number; // Timer for how long foam is active.
}

/**
 * Represents a time-locked object's schedule.
 */
export interface TimeLock {
  id: number; // Unique ID for the time lock.
  x: number; // The object's x-coordinate.
  y: number; // The object's y-coordinate.
  unlockTime: number; // Time in seconds into the execution phase when it unlocks.
  lockTime: number;   // Time in seconds into the execution phase when it locks again.
}

/**
 * Represents a hackable computer terminal.
 */
export interface HackableTerminal {
  x: number;
  y: number;
  cameraIds: number[]; // IDs of cameras this terminal controls
}

/**
 * Represents a purchasable one-use item from the Black Market.
 */
export interface ConsumableItem {
  id: keyof GameState['inventory']; // e.g., 'skeletonKey'
  name: string;
  description: string;
  cost: number;
  action: ActionType;
}


/**
 * The master state object for the entire game.
 * It holds all the data needed to render the current state of the game world and UI.
 * This is the "single source of truth" for the application during a game session.
 */
export interface GameState {
  // --- Core World State ---
  map: TileType[][]; // 2D array representing the game map. This is mutated during the execution phase.
  initialMap: TileType[][]; // A snapshot of the map at the start of execution. Used to check for changes (e.g., for evidence).
  players: Player[]; // Array containing the player objects. Their positions are updated during execution.
  guards: Guard[]; // Array of all guard objects for the level. Their state is updated every tick.
  cameras: Camera[]; // Array of all camera objects. Their 'disabled' state can change.
  laserGrids: ActiveLaserGrid[]; // All laser grids and their current on/off state.
  pressurePlates: PressurePlate[]; // All pressure plates and their current disabled/enabled state.
  timeLocks: TimeLock[]; // All time-locked objects and their schedules.
  treasures: { [key: string]: { value: number, robbed: boolean, containsKey?: boolean } }; // A map of treasure coordinates ("x-y") to their value, status, and optional key.
  policeCar: { x: number; y: number } | null; // The dynamic police car object.
  inventory: Record<string, number>; // Team's shared inventory of consumable items.

  // --- UI and Player Control State ---
  currentPlayer: number; // Index of the player currently being controlled in the planning phase.
  message: string; // The message displayed in the control panel's log (e.g., "Moved to 5,5", "Guard heard a noise!").
  gameOver: boolean; // Flag for whether the game has ended in a loss.
  gameWon: boolean; // Flag for whether the game has ended in a win.
  capturedPlayers: string[]; // List of names of captured players.

  // --- Two-phase Gameplay State ---
  phase: 'planning' | 'execution'; // The current phase of the game, controlling which UI and logic is active.
  plan: PlanStep[]; // The array of actions that constitutes the heist plan. This is built during the planning phase.
  plannedTime: number; // The total time the plan is expected to take (the longer of the two player's plans).
  playerPlannedTimes: number[]; // The total time planned for each individual player.

  // --- Execution Phase State ---
  executionTimer: number; // Countdown timer for the execution phase (in seconds).
  initialExecutionTimer: number; // The starting time for the execution phase, used for patrol calculations.
  executionPlanIndices: number[]; // Tracks which step of the `plan` array each player is currently executing.
  timeForCurrentActions: number[]; // How much time is left for each player's current action. When it reaches 0, the action is complete.
  playerStatuses: PlayerStatus[]; // The current status of each player (e.g., 'blocked', 'knocked_out').
  playerKnockoutTimers: number[]; // Countdown timers for players who have been knocked out.
  playerFreezeCharges: number[]; // Number of "Freeze!" charges remaining for each player.
  activeInteractions: ActiveInteraction[]; // List of currently happening interactions for animation purposes.
  activeFuses: {
    x: number;
    y: number;
    timer: number;
    planter: number;
    planterSkills: Partial<Record<Skill, number>>;
  }[];
  activeLances: {
    x: number;
    y: number;
    timer: number;
  }[];
  objectiveStatus: {
    stealth: 'pending' | 'failed';
    speed: 'pending' | 'failed';
    primary: 'pending' | 'success' | 'failed';
    secondary: 'pending' | 'success' | 'failed';
  };
  playerReactiveActions: (ActionType | null)[];
  playerReactiveActionTimers: number[];

  // --- Security System State ---
  alarmSystemActive: boolean; // Whether the silent alarm system is active. Can be disabled at the ALARM_BOX.
  camerasActive: boolean; // Whether the camera system as a whole is active. Can be disabled at the CAMERA_CONTROL_PANEL.
  monitoredTiles: { [key: string]: { status: 'active' | 'potential'; orientation: 'up' | 'down' | 'left' | 'right' } }; // Map of "x-y" coordinates to tiles currently being watched by cameras.
  guardVisionTiles: Set<string>; // Set of "x-y" coordinate strings for tiles currently visible to any guard.

  // --- Other Mechanic States ---
  stolenValue: number; // The total value of loot stolen so far during the execution phase.
  potentialValue: number; // The potential value of loot based on the current plan, shown during the planning phase.
  totalLootValue: number; // The total possible loot value for the scenario.
  isDoorSmashed: boolean; // A flag set during planning if any door is smashed. This applies a penalty to the execution timer.
  explosivesDetonated: boolean; // A flag set if dynamite is used, for the end report.
  alarmType: 'none' | 'silent' | 'loud';
  isEscaping: boolean; // A flag for when the player has triggered the "Go Go Go!" mechanic, aborting the plan to escape.
  noiseEffect?: { tiles: Map<string, number>, duration: number, source?: { x: number, y: number }, type?: 'stone' | 'explosion' } | null; // For visualizing noise on the map.
  explosionEffect?: { x: number; y: number; duration: number } | null; // For "BOOM!" text and screen shake.
  blastEffect?: { tiles: Map<string, number>, duration: number } | null; // For visualizing dynamite blast radius.
  stunEffect?: { x: number; y: number; duration: number; tiles: Set<string> } | null; // For visualizing stun-o-mat grenade effect.
  heat: number;
  // Pickpocket Mechanic
  playerKeys?: number[]; // Number of pickpocketed keys each player has (single-use, consumable)
  pickpocketedGuards?: Set<number>; // Set of guard IDs that have been pickpocketed
  // Performance cache
  cachedAlarmBoxes?: { x: number; y: number }[]; // Cached alarm box locations
}

/**
 * Represents a complete, loadable scenario or level.
 * This interface encapsulates all the initial data needed to start a game.
 */
export interface Scenario {
  id: string; // Unique identifier for the scenario (e.g., 'jewelryShop').
  name: string; // Display name of the scenario (e.g., "The Diamond Palace").
  description: string; // A short description for the scenario selection screen.
  initialMessage: string; // The first message to display when the scenario starts.
  map: TileType[][]; // The initial map layout.
  cameras: Camera[]; // The initial camera setup.
  guards: Guard[]; // The initial guard setup.
  laserGrids?: LaserGrid[]; // The initial laser grid setup.
  pressurePlates?: PressurePlate[]; // The initial pressure plate setup.
  timeLocks?: TimeLock[]; // The initial time lock setup.
  hackableTerminals?: HackableTerminal[]; // The initial hackable terminal setup.
  startPositions: { x: number, y: number }[]; // The initial player start positions.
  treasures: { [key: string]: number | { value: number, containsKey?: boolean } }; // A map of treasure coordinates ("x-y") to their base values or objects with optional keys.
  tier: number; // The progression tier of the scenario (1, 2, 3, etc.).
  reputationRequired: number;
  reputationRewards: {
    base: number;
    stealth: number;
    speed: number;
    fullLoot: number;
  };
  speedRunTime: number; // Target time in seconds for the speed bonus.
  primaryTarget?: { x: number, y: number };
  secondaryTarget?: { x: number, y: number };
  // Narrative
  briefing?: string; // Mission briefing text shown before heist starts
  prerequisiteScenarioId?: string; // Optional: ID of a scenario that must be completed (primary objective) to unlock this one.
}

// --- GAME CONTEXT for Prop Drilling Elimination ---
export interface GameContextType {
  gameState: GameState;
  // Projected states for planning phase
  projectedMap: TileType[][];
  projectedPlayers: Player[];
  projectedCameras: Camera[];
  projectedCamerasActive: boolean;
  projectedGuards: Guard[];
  projectedLaserGrids: ActiveLaserGrid[];
  projectedActiveFuses: { x: number, y: number, timer: number, blastRadius: Map<string, number> }[];
  projectedStunEffect: { x: number, y: number, duration: number, tiles: Set<string> } | null;
  detectedHiddenPlates: Set<string>;
  projectedPlayerKeys: number[];
  projectedPickpocketedGuards: Set<number>;
  planningMonitoredTiles: GameState['monitoredTiles'];
  projectedGuardVisionTiles: Set<string>;
  // Data for UI enhancements
  activePlayer: Player;
  allPlayersFinalPositions: Player[];
  ambiguousActionTargets: Map<ActionType, { x: number, y: number }[]>;
  possibleMoves: { up: boolean, down: boolean, left: boolean, right: boolean };
  // Callbacks for GameBoard
  onMapClick: (x: number, y: number) => void;
  isTargeting: boolean;
  validTargets: { x: number, y: number }[];
  noisePreview: Map<string, number> | null;
  // Callbacks & data for ControlPanel
  adjacentActions: ActionInfo[];
  onMove: (dx: number, dy: number) => void;
  onInteract: (action: ActionType, target?: { x: number, y: number }, targetId?: number | string) => void;
  onWait: (duration: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  onExecutePlan: () => void;
  onSwitchPlayer: () => void;
  onEveryBodyRun: () => void;
  onCancelTargeting: () => void;
  onAbortMission: () => void;
  onSavePlan: () => void;
  onLoadPlan: () => void;
  onToggleFreeze: (playerIndex: number) => void;
  onRewindPlan: (stepIndex: number) => void;
  planLength: number;
  // FIX: Add missing properties for Black Market and campaign state
  campaignState: CampaignState | null;
  gearCost: number;
  itemToBuy: ConsumableItem | null;
  handleSelectItemToBuy: (item: ConsumableItem) => void;
  handleConfirmBuyItem: () => void;
  handleCancelBuyItem: () => void;
  // NEW: Pass scenario tier
  currentScenarioTier: number;
  // FIX: Add missing property for GameBoard context
  currentScenario: Scenario | null;
}

export const T = {
  x: TileType.EXTERIOR,
  w: TileType.WALL,
  bricks: TileType.BRICKS,
  f: TileType.FLOOR,
  fm: TileType.FLOOR_MARBLE,
  fc: TileType.FLOOR_CEMENT,
  fw: TileType.FLOOR_WOOD,
  ft: TileType.FLOOR_TILES,
  fs: TileType.FLOOR_SLATE,
  fca: TileType.FLOOR_CARPET,
  dc: TileType.DOOR_CLOSED,
  dl: TileType.DOOR_LOCKED,
  dla: TileType.DOOR_LOCKED_ALARMED,
  do: TileType.DOOR_OPEN,
  vd: TileType.VAULT_DOOR,
  vdt: TileType.VAULT_DOOR_TIMELOCK,
  pp: TileType.PRESSURE_PLATE,
  pph: TileType.PRESSURE_PLATE_HIDDEN,
  ppp: TileType.PRESSURE_PLATE_PANEL,
  ab: TileType.ALARM_BOX,
  cm: TileType.CAMERA,
  ccp: TileType.CAMERA_CONTROL_PANEL,
  lcp: TileType.LASER_CONTROL_PANEL,
  s: TileType.SAFE,
  sa: TileType.SAFE_ALARMED,
  st: TileType.SAFE_TIMELOCK,
  gb: TileType.GOLD_BARS,
  gba: TileType.GOLD_BARS_ALARMED,
  ap: TileType.ART_PIECE,
  apa: TileType.ART_PIECE_ALARMED,
  stat: TileType.STATUE,
  stata: TileType.STATUE_ALARMED,
  sc: TileType.SCULPTURE,
  dic: TileType.DISPLAY_CASE,
  dica: TileType.DISPLAY_CASE_ALARMED,
  col: TileType.COLUMN,
  ct: TileType.COMPUTER_TERMINAL,
  cab: TileType.CABINET,
  caba: TileType.CABINET_ALARMED,
  desk: TileType.DESK,
  plant: TileType.PLANT,
  sofa: TileType.SOFA,
  loo: TileType.LOO,
  wc: TileType.WATER_COOLER,
  car: TileType.CAR,
  tc: TileType.TELLER_COUNTER,
  fcab: TileType.FILING_CABINET,
  vm: TileType.VENDING_MACHINE,
  ku: TileType.KITCHEN_UNIT,
  bc: TileType.BROOM_CABINET,
} as const;