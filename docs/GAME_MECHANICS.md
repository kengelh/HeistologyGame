
# Heistology: The Official Rulebook & Mechanics Reference

This document serves as the definitive guide to the internal mechanics of **Heistology**. It details the rules governing the simulation, AI behaviors, time costs, and interaction logic. It is intended for developers and designers to understand exactly *how* the game works under the hood.

---

## 1. The Core Loop: Planning & Execution

The game operates in two distinct phases.

### Phase 1: Planning (Turn-Based Strategy)
*   **State**: The game world is frozen at `time = 0`.
*   **Interaction**: The player switches between crew members and queues up a sequence of actions (`PlanStep`).
*   **The Timeline**: 
    *   Each action has a specific **Time Cost** (in seconds).
    *   The timeline is strictly linear for each character.
    *   **Wait Action**: Players can insert `Wait` steps to synchronize timing (e.g., waiting for a camera to turn or a time-lock to open).
*   **Projection**: The game engine simulates the future state of the world based on the current plan. When looking at the map, the player sees the state of guards, cameras, and doors at the *exact moment* the currently selected action would end.
*   **Undo/Redo**: Actions can be removed from the end of the stack without penalty.

### Phase 2: Execution (Real-Time Simulation)
*   **State**: The game runs a simulation loop, ticking 1 time per second.
*   **Interaction**: Player control is removed. The only interaction is **"Everybody Run!"** (Panic Button).
*   **Synchronization**: All characters execute their plans simultaneously.
*   **Deviation**: Events can cause a character to deviate from their plan:
    *   **Blocked**: If a planned move is blocked by another character or a locked door (that wasn't planned for), the character waits/retries or performs a reactive action.
    *   **Reactive Actions**: If a character tries to move through a door that is unexpectedly closed/locked, they will automatically insert an `Open Door` or `Unlock` action if capable, delaying their subsequent steps.
    *   **Captured/Knocked Out**: If incapacitated, the plan is halted.

---

## 2. Map Architecture & Tiles

The world is a grid of `TileType` enums. Each tile has specific properties defined in `lib/tiles.ts`.

### 2.1. Terrain Categories
*   **Walkable**: Players and Guards can move here.
    *   `FLOOR` (various styles), `EXTERIOR`, `DOOR_OPEN`, `DOOR_SMASHED`.
    *   **Special Exception**: `CAR` tiles are walkable. **Crucially**, the `CAR` tile ignores player-collision checks. Multiple players can occupy the getaway car simultaneously.
*   **Obstacles**: Block movement and Line of Sight (LoS).
    *   `WALL`, `DOOR_CLOSED`, `DOOR_LOCKED`, `DOOR_LOCKED_ALARMED`, `VAULT_DOOR`.
    *   **Furniture**: `DESK`, `PLANT`, `SOFA`, etc., act as obstacles.
*   **Transparent Obstacles**: Block movement but allow LoS.
    *   *Currently none implemented (e.g., glass walls), but supported by the LoS logic.*
*   **Evidence Tiles**: If a guard sees these, they become **Alerted**.
    *   `DOOR_SMASHED`, `DISPLAY_CASE_SMASHED`, `SAFE_SMASHED`.
    *   `*_ROBBED` variants (empty pedestals).
    *   `CABINET_OPEN` (if originally closed).
    *   `FOAMED_PRESSURE_PLATE`.
    *   `LASER_CONTROL_PANEL_JAMMED`.
    *   `COMPUTER_TERMINAL_HACKED`.
    *   **Stun Gas**: The visible green cloud from a Stun-O-Mat.
    *   **Corpses**: While not a tile, a `Knocked Out` guard is also considered evidence.

---

## 3. Security Systems

### 3.1. Cameras
*   **Behavior**: Cameras cycle through a pre-defined list of "frames" (`pattern`). Each frame is a set of tiles it watches.
*   **Vision**: A yellow overlay indicates watched tiles.
*   **Trigger**: If a player occupies a watched tile at the end of a tick, the **Camera Alarm** triggers.
*   **Countermeasures**:
    *   **Disable (Local)**: Even if they are adjacent to the camera unit (on the wall), players cannot `disable` them.
    *   **Disable (Central)**: Disabling the `CAMERA_CONTROL_PANEL` turns off *all* cameras.
    *   **Hack (Remote)**: Hacking a `COMPUTER_TERMINAL` disables specific linked cameras.
    *   **Loop (Item)**: A `Camera Looper` freezes a camera's vision for 15 seconds.

### 3.2. Guards (AI & Behavior)
Guards are complex state machines defined in `lib/gameLoop.ts`.

*   **Vision**:
    *   **Normal**: 5 tile range, cone shape based on orientation.
    *   **Alerted**: 7 tile range, slightly wider cone.
    *   **LoS**: Blocked by Walls and Closed Doors.

*   **States**:
    1.  **`patrolling`**: Moving along a fixed `patrolRoute`.
    2.  **`investigating_suspicion`**:
        *   **Trigger**: Seeing a non-evidence change (e.g., an open door that was closed in `initialMap`).
        *   **Behavior**: Walk over the tile to the connecting room. Scan room for 2s. In case of open door: Close the door on the way back to the closest fpatrol route field .
        *   **"Fool Me Once" Rule**: Every guard tracks `hasBeenSuspicious`. If a guard sees a *second* suspicious thing later, they skip investigation and go straight to `alerted`.
    3.  **`investigating_noise`**:
        *   **Trigger**: Hearing a noise (Stone, Smash, Explosion).
        *   **Behavior**: Walk to the noise source. rotate view 2s.
        *   **Distraction Limit**: Guards track `stoneDistractionCount`. If distracted by a stone >= 2 times, they ignore future stones.
    4.  **`alerted`**:
        *   **Trigger**: Seeing a player or **Evidence** (smashed glass, body).
        *   **Behavior**: Pause 2s (shock). Then transition to `running_to_alarm`.
    5.  **`running_to_alarm`**:
        *   **Behavior**: Run at **2x speed** (2 moves per tick) to the nearest `ALARM_BOX`.
        *   **Action**: Upon arrival, trigger **Loud Alarm**.
        *   **Pathing**: Will smash through closed doors if necessary.
    6.  **`returning_to_post`**:
        *   **Behavior**: After investigating (and finding nothing), walk back to the nearest point on the original patrol route.
    7.  **`guarding_captured_player`**:
        *   **Behavior**: Stands still over a captured player. Effectively removed from play.

*   **Collision Logic**:
    *   If a Player and Guard move to the same tile:
    *   **50% Chance**: Player is **Captured** (Game Over for that player).
    *   **50% Chance**: Guard is **Knocked Out** (Unconscious for 5-15s).
    *   *Note: This RNG check happens instantly.*
    *   **Infiltrator Bonus**: Infiltrators have a better surprise factor, often knocking out guards faster (higher KO chance or reduced timers, depending on scenario).

### 3.3. Pickpocketing & Keys
*   **Thief Exclusive**: Only characters with the `thief` skill can perform the `pickpocket` action on a guard.
*   **Mechanic**: Success extracts a **Player Key** from the guard (if they have one).
*   **Usage**: Each key is single-use. It allows for an `unlock` action to be performed in **1 second** and makes **Zero Noise**, even on alarmed doors.
*   **Strategic Value**: Ideal for bypassing high-security checkpoints without disabling the alarm panel.

### 3.3. Lasers
*   **Trigger**: Entering a tile with an active laser beam triggers a **Loud Alarm**.
*   **Timing**: Can be configured with On/Off intervals (e.g., 3s on, 2s off).
*   **Infiltrator Skill**:
    *   Level 0: Cannot pass without alarm.
    *   Level 1: Can pass, costs 5s per tile.
    *   Level 2: Can pass, costs 3s per tile.
*   **Countermeasures**:
    *   `disable_lasers` at `LASER_CONTROL_PANEL`.
    *   `use_laser_jammer` (Item) on panel.

### 3.4. Pressure Plates
*   **Trigger**: Stepping on an active plate triggers a **Loud Alarm**.
*   **Hidden Plates**: Some plates are invisible until a player with `Electronics (Lvl 2)` is adjacent.
*   **Infiltrator Skill**: Like lasers, Infiltrators can bypass pressure plates undetected. It takes them longer to navigate carefully (5s at Level 1, 3s at Level 2).
*   **Countermeasures**:
    *   `disable_pressure_plates` at `PRESSURE_PLATE_PANEL`.
    *   `use_foam_canister` (Item): Disables a specific plate for 60s.

### 3.5. Alarms
*   **Silent Alarm**: Default state. Triggering cameras or seeing evidence usually alerts guards to run for a box.
*   **Loud Alarm**:
    *   **Triggered By**: Lasers, Pressure Plates, Guard using Alarm Box, Smashing an Alarmed Door/Case, using Dynamite.
    *   **Effect**: The `executionTimer` is immediately set to **30 seconds** (unless it was already lower). Police arrival is imminent.
    *   **Objectives**: Fails the "Stealth" objective.

### 3.6. Time Locks
*   **Mechanic**: Safes or Vault Doors that are only interactable during a specific window (e.g., `90s - 150s`).
*   **Outside Window**: Cannot be picked or cracked. Must be blown up or drilled with a Thermic Lance (destroys loot value/makes noise).

---

## 4. Player Skills & Actions

### 4.1. Base Time Costs
(Defined in `constants.ts`)

| Action | Base Time (s) | Relevant Skill |
| :--- | :--- | :--- |
| Move | 1 | - |
| Unlock Door | 12 | Lockpicking |
| Lock Door | 3 | Lockpicking |
| Open/Close Door | 1 | - |
| Smash Door | 4 | Thief |
| Smash Case | 4 | Thief |
| Pick Case Lock | 8 | Lockpicking |
| Crack Safe | 20 | Safecracker |
| Rob (Loot) | 4 | Thief |
| Disable Camera | 2 | Electronics |
| Disable Panel | 7 | Electronics |
| Hack Terminal | 10 | Electronics |
| Distract (Stone) | 1 | - |
| Plant Dynamite | 10 | Demolitions |
| Pickpocket | 6 | Thief |
| **Infiltrator Move** | 5 / 3 | Infiltrator (Laser tiles only) |
| Use Stun-O-Mat | 2 | - |

### 4.2. Skill Modifiers
(Defined in `lib/actions.ts`)
*   **Level 1**: Reduces base time by ~2 seconds.
*   **Level 2**: Reduces base time by ~4 seconds (min time usually 1s).
*   **Special Effects**:
    *   **Electronics Lvl 2**: Reveals Hidden Pressure Plates.
    *   **Demolitions Lvl 2**: Reduces Dynamite plant time to 5s (from 10s).
    *   **Lockpicking Lvl 2**: Locks doors in 1s.
    *   **Thief (Passive)**: **No Loot Penalty**. Usually, smashing a case or safe reduces loot value by 50-80%. Thieves ignore this penalty, finding the valuables even in the wreckage. Also increases **smash speed** for doors and cases.
    *   **Infiltrator (Passive)**: Laser Bypassing. Can move through active laser grids without triggering alarms.

---

## 5. Winning & Losing

### 5.1. Win Condition
*   All **Active** (non-captured) players must be standing on a `TileType.CAR` tile when the `executionTimer` > 0.
*   *Exception*: If time runs out, any player *at* the car escapes. Anyone not at the car is captured. If at least one person escapes, it is a partial win.

### 5.2. Loss Condition
*   All players are **Captured**.
*   Timer reaches 0 and **no** players are at the car.

---

## 6. Known Inconsistencies (Code vs. Design)

*   **Guard Vision**: The code uses a hardcoded 5-tile range for patrolling and 7 for alerted. Some documentation might suggest different values, but `lib/guards.ts` is the authority.
*   **Noise Range**: `NOISE_RANGE` is 7 tiles. Dynamite is `2 * NOISE_RANGE` (14 tiles).
*   **Wait Action**: The UI allows waiting, but the logic handles it as a specialized `PlanStep` that just burns time. It does not actively "hide" the player.
*   **Car Collision**: As noted, `TileType.CAR` is the only tile where player collision logic is explicitly bypassed in `lib/gameLoop.ts`.
*   **Stationary Guards**: Guards defined with only 1 waypoint are treated as stationary. The code manually rotates them (`panSequence`) but does not move them.

