/**
 * @file noise.ts
 * @description
 * This file contains the logic for calculating how noise propagates across the map.
 * This is used for player distractions and noisy actions like smashing doors.
 */

import { TileType } from '../types';
import { blocksSound } from './tiles';

/**
 * Calculates the spread of noise from a source point using a Breadth-First Search (BFS) algorithm.
 * Noise spreads through non-obstructing tiles (like floors and open doors) up to a certain range.
 * It is blocked by walls and closed doors.
 * @param {{ x: number; y: number }} startPos - The coordinate source of the noise.
 * @param {TileType[][]} map - The current game map.
 * @param {number} range - The maximum distance (in tiles) the noise can travel.
 * @param {boolean} ignoreObstacles - Optional. If true, noise will travel through walls and doors.
 * @returns {Map<string, number>} A Map of coordinate strings ("x-y") to their distance from the source for all tiles affected by the noise.
 */
export const calculateNoiseSpread = (startPos: { x: number; y: number }, map: TileType[][], range: number, ignoreObstacles: boolean = false): Map<string, number> => {
    const noisyTiles = new Map<string, number>();
    // The queue for the BFS, storing position and current distance from the source.
    const queue: { x: number; y: number; dist: number }[] = [{ ...startPos, dist: 0 }];
    const visited = new Set<string>([`${startPos.x}-${startPos.y}`]);

    // The source itself is always noisy.
    noisyTiles.set(`${startPos.x}-${startPos.y}`, 0);

    while (queue.length > 0) {
        const { x, y, dist } = queue.shift()!;

        // Stop spreading from this path if the maximum range has been reached.
        if (dist >= range) {
            continue;
        }

        const neighbors = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

        for (const move of neighbors) {
            const nx = x + move.dx;
            const ny = y + move.dy;
            const key = `${nx}-${ny}`;

            // Check map boundaries and if the tile has already been visited.
            if (nx >= 0 && nx < map[0].length && ny >= 0 && ny < map.length && !visited.has(key)) {
                visited.add(key);
                const tile = map[ny][nx];

                // Sound is blocked by tiles that block sound propagation (e.g., walls, closed doors).
                // If ignoreObstacles is true, we keep adding to noisyTiles regardless of blocksSound.
                if (ignoreObstacles || !blocksSound(tile)) {
                    noisyTiles.set(key, dist + 1);
                    queue.push({ x: nx, y: ny, dist: dist + 1 });
                }
            }
        }
    }
    return noisyTiles;
};
