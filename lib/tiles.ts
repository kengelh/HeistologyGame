/**
 * @file tiles.ts
 * @description
 * This file centralizes the logic for defining the properties and behaviors of different tile types.
 * Instead of scattering `if/else` or `switch` statements about tile properties throughout the codebase,
 * this file provides simple, reusable functions (e.g., `isWalkable`, `isObstacleForLoS`)
 * that act as a single source of truth for tile behavior.
 */

import { TileType, T } from '../types';
import { GRID_HEIGHT, GRID_WIDTH } from '../constants';

/**
 * The default properties for a tile. If a tile type is not explicitly defined in `tileData`,
 * it will fall back to these values.
 */
const defaultProps = {
    isWalkable: false, // Can players or guards move onto this tile?
    isObstacleForLoS: true, // Does this tile block line of sight?
    blocksSound: true, // Does this tile block sound propagation?
    isEvidence: false, // Is this tile considered "evidence" if a guard sees it (e.g., a smashed case)?
    isWalkableForEscape: false, // Is this tile walkable during a "Go Go Go" escape plan (includes doors that can be smashed)?
};

/**
 * A record mapping specific `TileType` enums to their behavioral properties.
 * Only tiles that deviate from the `defaultProps` need to be listed here.
 */
const tileData: Partial<Record<TileType, Partial<typeof defaultProps>>> = {
    [TileType.FLOOR]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.FLOOR_WOOD]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.FLOOR_CEMENT]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.FLOOR_MARBLE]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.FLOOR_SLATE]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.FLOOR_CARPET]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.FLOOR_TILES]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.EXTERIOR]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.DOOR_OPEN]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.DOOR_SMASHED]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isEvidence: true, isWalkableForEscape: true },
    [TileType.CAR]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.PRESSURE_PLATE]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.PRESSURE_PLATE_HIDDEN]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.PRESSURE_PLATE_DISABLED]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },
    [TileType.FOAMED_PRESSURE_PLATE]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isEvidence: true, isWalkableForEscape: true },
    [TileType.VELVET_ROPE]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isWalkableForEscape: true },

    // Windows block sound but allow vision. Broken windows allow both sound and vision.
    [TileType.WINDOW]: { isObstacleForLoS: false, blocksSound: true, isWalkableForEscape: true },
    [TileType.WINDOW_BROKEN]: { isWalkable: true, isObstacleForLoS: false, blocksSound: false, isEvidence: true, isWalkableForEscape: true },

    // Doors are not walkable by default but are considered walkable for escape pathfinding (as they can be smashed).
    [TileType.DOOR_CLOSED]: { isObstacleForLoS: true, isWalkableForEscape: true },
    [TileType.DOOR_LOCKED]: { isObstacleForLoS: true, isWalkableForEscape: true },
    [TileType.DOOR_LOCKED_ALARMED]: { isObstacleForLoS: true, isWalkableForEscape: true },
    [TileType.VAULT_DOOR]: { isObstacleForLoS: true, isWalkableForEscape: true },
    [TileType.VAULT_DOOR_TIMELOCK]: { isObstacleForLoS: true, isWalkableForEscape: true },

    // Tiles that are considered evidence for guards.
    [TileType.DISPLAY_CASE_SMASHED]: { isEvidence: true },
    [TileType.DISPLAY_CASE_ROBBED]: { isEvidence: true },
    [TileType.SAFE_OPENED]: { isEvidence: true },
    [TileType.SAFE_ROBBED]: { isEvidence: true },
    [TileType.SAFE_SMASHED]: { isEvidence: true },
    [TileType.ART_PIECE_ROBBED]: { isEvidence: true },
    [TileType.GOLD_BARS_ROBBED]: { isEvidence: true },
    [TileType.CABINET_OPEN]: { isEvidence: true },
    [TileType.CABINET_ROBBED]: { isEvidence: true },
    [TileType.LASER_CONTROL_PANEL_JAMMED]: { isEvidence: true },
    [TileType.STATUE_ROBBED]: { isEvidence: true },

    // These tiles block line of sight but don't have other special properties from this list.
    [TileType.DISPLAY_CASE_OPENED]: { isObstacleForLoS: true },
    [TileType.LOO]: { isObstacleForLoS: true },
    [TileType.KITCHEN_UNIT]: { isObstacleForLoS: true },
    [TileType.BROOM_CABINET]: { isObstacleForLoS: true },
};

/**
 * A helper function to get the complete set of properties for any given tile type.
 * @param {TileType} tile - The tile type to get properties for.
 * @returns The complete properties object for the tile.
 */
const getTileProps = (tile: TileType) => ({
    ...defaultProps,
    ...(tileData[tile] ?? {}),
});

/** Checks if a tile can be moved onto during normal gameplay. */
export const isWalkable = (tile: TileType) => getTileProps(tile).isWalkable;

/** Checks if a tile blocks line of sight for guards and players. */
export const isObstacleForLoS = (tile: TileType) => getTileProps(tile).isObstacleForLoS;

/** Checks if a tile blocks sound propagation. Windows block sound but not vision. */
export const blocksSound = (tile: TileType) => getTileProps(tile).blocksSound;

/** Checks if a tile's state is considered "evidence" of wrongdoing if spotted by a guard. */
export const isEvidenceTile = (tile: TileType) => getTileProps(tile).isEvidence;

/** Checks if a tile can be pathed through during an emergency escape (includes doors that can be smashed). */
export const isWalkableForEscape = (tile: TileType) => getTileProps(tile).isWalkableForEscape;

/**
 * Checks if a tile should be highlighted by a vision overlay (camera or guard).
 * We typically only want to highlight open, walkable spaces to keep the UI clean.
 * @param {TileType} tile - The tile type to check.
 * @returns {boolean} True if the tile should be highlighted by vision cones.
 */
export const isVisionHighlightable = (tile: TileType): boolean => {
    switch (tile) {
        case TileType.FLOOR:
        case TileType.FLOOR_WOOD:
        case TileType.FLOOR_CEMENT:
        case TileType.FLOOR_MARBLE:
        case TileType.FLOOR_SLATE:
        case TileType.FLOOR_CARPET:
        case TileType.FLOOR_TILES:
        case TileType.EXTERIOR:
        case TileType.DOOR_OPEN:
        case TileType.DOOR_SMASHED:
        case TileType.CAR:
        case TileType.POLICE_CAR:
        case TileType.PRESSURE_PLATE:
        case TileType.PRESSURE_PLATE_DISABLED:
        case TileType.PRESSURE_PLATE_HIDDEN:
        case TileType.FOAMED_PRESSURE_PLATE:
        case TileType.VELVET_ROPE:
        case TileType.WINDOW:
        case TileType.WINDOW_BROKEN:
            return true;
        default:
            return false;
    }
};



/**
 * Checks if a tile is considered part of the building's interior.
 * This is useful for editor placement rules (e.g., placing safes adjacent to an interior space).
 * @param {TileType | undefined} tile - The tile type to check.
 * @returns {boolean} True if the tile is an interior tile.
 */
export const isInterior = (tile: TileType | undefined): boolean => {
    if (!tile) return false;
    return tile !== TileType.WALL && tile !== TileType.BRICKS && tile !== TileType.EXTERIOR;
};

/**
 * Checks if a change from an initial tile state to a current tile state is suspicious enough to alert a guard.
 * This checks for non-evidence changes like a door being opened. Evidence is checked separately.
 * @param {TileType} initialTile - The state of the tile at the start of the heist.
 * @param {TileType} currentTile - The current state of the tile.
 * @returns {boolean} True if the change is suspicious.
 */
export const isSuspiciousChange = (initialTile: TileType, currentTile: TileType): boolean => {
    // If the tile hasn't changed, it's not suspicious.
    if (initialTile === currentTile) {
        return false;
    }

    // A CLOSED/LOCKED door that is now open is suspicious
    const wasDoor = initialTile === TileType.DOOR_CLOSED || initialTile === TileType.DOOR_LOCKED || initialTile === TileType.DOOR_LOCKED_ALARMED || initialTile === TileType.VAULT_DOOR || initialTile === TileType.VAULT_DOOR_TIMELOCK;
    if (wasDoor && currentTile === TileType.DOOR_OPEN) {
        return true;
    }

    // A door that was open and is now closed is also suspicious.
    if (initialTile === TileType.DOOR_OPEN && currentTile === TileType.DOOR_CLOSED) {
        return true;
    }

    return false;
};

/**
 * Checks if a tile is a decorative, non-structural object.
 * @param {TileType} tile - The tile to check.
 * @returns {boolean} True if the tile is a decoration.
 */
export const isDecoration = (tile: TileType): boolean => {
    return [
        TileType.DESK,
        TileType.COLUMN,
        TileType.PLANT,
        TileType.SCULPTURE,
        TileType.TELLER_COUNTER,
        TileType.TELLER_COUNTER_ROBBED,
        TileType.SOFA,
        TileType.SOFA_ROBBED,
        TileType.FILING_CABINET,
        TileType.FILING_CABINET_ROBBED,
        TileType.WATER_COOLER,
        TileType.WATER_COOLER_ROBBED,
        TileType.VENDING_MACHINE,
        TileType.VENDING_MACHINE_ROBBED,
        TileType.VELVET_ROPE,
        TileType.LOO,
        TileType.LOO_ROBBED,
        TileType.KITCHEN_UNIT,
        TileType.KITCHEN_UNIT_ROBBED,
        TileType.BROOM_CABINET,
        TileType.BROOM_CABINET_ROBBED,
        TileType.DESK_ROBBED,
        TileType.COLUMN_ROBBED,
        TileType.PLANT_ROBBED,
        TileType.SCULPTURE_ROBBED,
    ].includes(tile);
};

// --- Refactored Tile Categorization for Map Editor ---

const onWallTiles: TileType[] = [
    TileType.DOOR_LOCKED,
    TileType.DOOR_LOCKED_ALARMED,
    TileType.DOOR_OPEN,
    TileType.DOOR_CLOSED,
    TileType.DOOR_SMASHED,
    TileType.WINDOW,
    TileType.WINDOW_BROKEN,
    TileType.VAULT_DOOR,
    TileType.VAULT_DOOR_TIMELOCK,
    TileType.ART_PIECE,
    TileType.ART_PIECE_ALARMED,
    TileType.ART_PIECE_ROBBED,
    // --- Moved from onFloorTiles to fix rendering on walls ---
    TileType.CAMERA,
    TileType.CAMERA_DISABLED,
    TileType.ALARM_BOX,
    TileType.ALARM_BOX_DISABLED,
    TileType.CAMERA_CONTROL_PANEL,
    TileType.CAMERA_CONTROL_PANEL_DISABLED,
    TileType.LASER_CONTROL_PANEL,
    TileType.LASER_CONTROL_PANEL_DISABLED,
    TileType.LASER_CONTROL_PANEL_JAMMED,
    TileType.PRESSURE_PLATE_PANEL,
    TileType.PRESSURE_PLATE_PANEL_DISABLED,
    TileType.COMPUTER_TERMINAL,
    TileType.COMPUTER_TERMINAL_HACKED,
];

// NOTE: For rendering purposes, some items conceptually on walls (like cameras and panels)
// are categorized as 'onWall'. This ensures they render with a visible wall background.
// The MapEditor component contains special placement logic to allow these on walls OR floors.
const onFloorTiles: TileType[] = [
    // --- Original on-floor items ---
    TileType.DISPLAY_CASE,
    TileType.DISPLAY_CASE_SMASHED,
    TileType.DISPLAY_CASE_OPENED,
    TileType.DISPLAY_CASE_ROBBED,
    TileType.DISPLAY_CASE_ALARMED,
    TileType.SAFE,
    TileType.SAFE_OPENED,
    TileType.SAFE_ROBBED,
    TileType.SAFE_ALARMED,
    TileType.SAFE_TIMELOCK,
    TileType.SAFE_SMASHED,
    TileType.STATUE,
    TileType.STATUE_ROBBED,
    TileType.STATUE_ALARMED,
    TileType.GOLD_BARS,
    TileType.GOLD_BARS_ROBBED,
    TileType.GOLD_BARS_ALARMED,
    TileType.CABINET,
    TileType.CABINET_OPEN,
    TileType.CABINET_ROBBED,
    TileType.CABINET_ALARMED,
    TileType.PRESSURE_PLATE,
    TileType.PRESSURE_PLATE_DISABLED,
    TileType.PRESSURE_PLATE_HIDDEN,
    TileType.FOAMED_PRESSURE_PLATE,
    TileType.CAR, // Car is technically on floor (exterior)
    TileType.POLICE_CAR,

    // Furniture
    TileType.DESK,
    TileType.COLUMN,
    TileType.PLANT,
    TileType.SCULPTURE,
    TileType.TELLER_COUNTER,
    TileType.SOFA,
    TileType.FILING_CABINET,
    TileType.WATER_COOLER,
    TileType.VENDING_MACHINE,
    TileType.VELVET_ROPE,
    TileType.LOO,
    TileType.KITCHEN_UNIT,
    TileType.BROOM_CABINET,
    TileType.TELLER_COUNTER_ROBBED,
    TileType.DESK_ROBBED,
    TileType.SCULPTURE_ROBBED,
    TileType.PLANT_ROBBED,
    TileType.COLUMN_ROBBED,
    TileType.SOFA_ROBBED,
    TileType.FILING_CABINET_ROBBED,
    TileType.WATER_COOLER_ROBBED,
    TileType.VENDING_MACHINE_ROBBED,
    TileType.LOO_ROBBED,
    TileType.KITCHEN_UNIT_ROBBED,
    TileType.BROOM_CABINET_ROBBED,
];

/**
 * Categorizes a tile for the map editor's rendering and eraser logic.
 * @param {TileType} tile - The tile to categorize.
 * @returns {'onWall' | 'onFloor' | 'base'} The category of the tile.
 */
export const getTileCategory = (tile: TileType): 'onWall' | 'onFloor' | 'base' => {
    if (onWallTiles.includes(tile)) {
        return 'onWall';
    }
    if (onFloorTiles.includes(tile)) {
        return 'onFloor';
    }
    return 'base';
};

/**
 * Check if a tile is an exterior tile (outside the building)
 */
export const isExteriorTile = (tile: TileType): boolean => {
    return tile === TileType.EXTERIOR || tile === TileType.CAR;
};

/**
 * Check if a position is enclosed (no path to exterior)
 * Uses flood fill to check if position can reach an exterior tile
 */
export const isEnclosed = (pos: { x: number, y: number }, map: TileType[][]): boolean => {
    const visited = new Set<string>();
    const queue: { x: number, y: number }[] = [pos];

    while (queue.length > 0) {
        const current = queue.shift()!;
        const key = `${current.x}-${current.y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        const tile = map[current.y]?.[current.x];
        if (!tile) continue;

        // Found exterior - not enclosed!
        if (isExteriorTile(tile)) {
            return false;
        }

        // Only continue through walkable tiles
        if (!isWalkable(tile)) continue;

        // Check neighbors
        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (const neighbor of neighbors) {
            if (neighbor.x >= 0 && neighbor.y >= 0 &&
                neighbor.y < map.length && neighbor.x < map[0].length) {
                queue.push(neighbor);
            }
        }
    }

    // Didn't find exterior - enclosed!
    return true;
};

/**
 * Find the nearest door to a position
 */
export const findNearestDoor = (pos: { x: number, y: number }, map: TileType[][]): { x: number, y: number, distance: number } | null => {
    let nearestDoor: { x: number, y: number, distance: number } | null = null;
    let minDistance = Infinity;

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const tile = map[y][x];
            if (tile === TileType.DOOR_CLOSED || tile === TileType.DOOR_LOCKED ||
                tile === TileType.DOOR_LOCKED_ALARMED || tile === TileType.DOOR_OPEN) {
                const distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestDoor = { x, y, distance };
                }
            }
        }
    }

    return nearestDoor;
};

/**
 * Find car position in map
 */
export const findCarPosition = (map: TileType[][]): { x: number, y: number } | null => {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === TileType.CAR) {
                return { x, y };
            }
        }
    }
    return null;
};

/**
 * Validate car placement rules
 * 1. Car must be 3-4 tiles from nearest door
 * 2. Car must be on exterior tile
 * 3. Car must not be enclosed
 */
export const validateCarPlacement = (map: TileType[][]): string[] => {
    const errors: string[] = [];
    const carPos = findCarPosition(map);

    if (!carPos) {
        errors.push("No getaway car placed.");
        return errors;
    }

    // Check if on exterior (already checked by findCarPosition implicitly if we assume car tile IS exterior, but let's check the tile type underneath if we had layers, but here map[y][x] IS the tile)
    // Actually map[y][x] is TileType.CAR. isExteriorTile(TileType.CAR) returns true.
    // So this check is always true if carPos exists.
    // But we should check if it's placed on what WAS an exterior tile? 
    // The editor replaces the tile with CAR.
    // So we can't check what was there before.
    // But we can check if it's "enclosed" which covers the "accessible" part.

    if (isEnclosed(carPos, map)) {
        errors.push("Car is enclosed and cannot reach the exit.");
    }

    const nearestDoor = findNearestDoor(carPos, map);
    if (!nearestDoor) {
        errors.push("No door found in the map.");
    } else {
        if (nearestDoor.distance < 3 || nearestDoor.distance > 4) {
            errors.push(`Car is ${nearestDoor.distance} tiles from entrance. Must be 3-4 tiles away.`);
        }
    }

    return errors;
};

/**
 * Expands a compressed/sparse map definition (using shorthand codes from T) into a full TileType grid.
 * Handles both "T.x" style strings and simple "x" keys, as well as falling back to full TileType enum strings.
 */
export const expandCompressedMap = (compressed: { data: string[][], offset: { x: number, y: number } }): TileType[][] => {
    // Default to EXTERIOR (T.x)
    const fullMap = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(TileType.EXTERIOR));
    const { data, offset } = compressed;

    // Create reverse mapping for T (alias -> TileType)
    const aliasToTile: Record<string, TileType> = {};
    Object.entries(T).forEach(([alias, type]) => {
        aliasToTile[alias] = type;
    });

    for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[0].length; x++) {
            if ((y + offset.y < GRID_HEIGHT) && (x + offset.x < GRID_WIDTH)) {
                const rawCode = data[y][x];
                // Strip "T." prefix if present strictly for matching, though we might use rawCode if not found
                const code = rawCode.startsWith('T.') ? rawCode.substring(2) : rawCode;

                // Lookup alias, or fallback to raw string (in case it's already a full TileType string)
                const tile = aliasToTile[code] || (rawCode as TileType);

                fullMap[y + offset.y][x + offset.x] = tile;
            }
        }
    }
    return fullMap;
};