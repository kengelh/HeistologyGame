/**
 * @file rooms.ts
 * @description
 * This file contains utility functions for identifying "rooms" on the map. A room is defined
 * as a set of connected, walkable interior tiles. This is useful for AI behaviors, like
 * searching for points of interest within the current room.
 */

import { TileType } from '../types';

/**
 * Determines if a tile type is considered part of a room's interior space for the purpose of flood-fill algorithms.
 * @param {TileType} tile - The tile type to check.
 * @returns {boolean} True if the tile is part of a room's accessible space.
 */
const isRoomTile = (tile: TileType): boolean => {
    switch(tile) {
        case TileType.FLOOR:
        case TileType.FLOOR_WOOD:
        case TileType.FLOOR_CEMENT:
        case TileType.FLOOR_MARBLE:
        case TileType.FLOOR_SLATE:
        case TileType.FLOOR_CARPET:
        case TileType.FLOOR_TILES:
        case TileType.DOOR_OPEN:
        case TileType.DOOR_SMASHED:
        // NOTE: Closed and locked doors are considered barriers and define the edge of a room.
        case TileType.DISPLAY_CASE:
        case TileType.DISPLAY_CASE_ALARMED:
        case TileType.DISPLAY_CASE_SMASHED:
        case TileType.DISPLAY_CASE_OPENED:
        case TileType.DISPLAY_CASE_ROBBED:
        case TileType.SAFE:
        case TileType.SAFE_ALARMED:
        case TileType.SAFE_OPENED:
        case TileType.SAFE_ROBBED:
        case TileType.SAFE_SMASHED:
        case TileType.ART_PIECE:
        case TileType.ART_PIECE_ALARMED:
        case TileType.ART_PIECE_ROBBED:
        case TileType.GOLD_BARS:
        case TileType.GOLD_BARS_ALARMED:
        case TileType.GOLD_BARS_ROBBED:
        case TileType.CABINET:
        case TileType.CABINET_OPEN:
        case TileType.CABINET_ROBBED:
        case TileType.CABINET_ALARMED:
        case TileType.STATUE:
        case TileType.STATUE_ROBBED:
        case TileType.STATUE_ALARMED:
            return true;
        default:
            return false;
    }
};

/**
 * Finds all connected tiles that form a "room" from a starting point using a flood-fill (BFS) algorithm.
 * It traverses through open doors but stops at closed/locked doors and walls, effectively defining
 * the boundaries of a single room.
 * @param {{ x: number; y: number }} startPos - A coordinate within the room to start the search from.
 * @param {TileType[][]} map - The game map.
 * @returns {Set<string>} A Set of coordinate strings ("x-y") for all tiles belonging to the room.
 */
export const findRoom = (startPos: { x: number; y: number }, map: TileType[][]): Set<string> => {
    const roomTiles = new Set<string>();
    const queue = [startPos];
    const visited = new Set<string>([`${startPos.x}-${startPos.y}`]);
    
    // Boundary check for the starting position.
    if (!map[startPos.y]?.[startPos.x]) {
        return roomTiles;
    }

    // The starting tile itself must be a valid room tile to begin the search.
    if(isRoomTile(map[startPos.y][startPos.x])) {
        roomTiles.add(`${startPos.x}-${startPos.y}`);
    } else {
        // If the start tile isn't a room tile (e.g., a wall), we can't find a room from it.
        return roomTiles;
    }


    while (queue.length > 0) {
        const { x, y } = queue.shift()!;
        
        const neighbors = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

        for (const move of neighbors) {
            const nx = x + move.dx;
            const ny = y + move.dy;
            const key = `${nx}-${ny}`;

            // Check boundaries and if the neighbor has been visited.
            if (nx >= 0 && nx < map[0].length && ny >= 0 && ny < map.length && !visited.has(key)) {
                const tile = map[ny][nx];
                // If the neighbor is a valid room tile, add it to the set and the queue to explore from it.
                if (isRoomTile(tile)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                    roomTiles.add(key);
                }
            }
        }
    }
    return roomTiles;
};