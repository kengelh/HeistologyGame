/**
 * @file pathfinding.ts
 * @description
 * This file contains pathfinding and line-of-sight algorithms, which are essential for
 * AI movement (guards), player-generated escape plans, and visibility checks.
 */

import { TileType, ActiveLaserGrid } from '../types';
// Import tile property utility functions to determine walkability and obstacles.
import { isWalkable, isObstacleForLoS, isWalkableForEscape } from './tiles';
import { TIME_COST } from '../constants';

/**
 * Finds the shortest path between two points on the map using a Breadth-First Search (BFS) algorithm.
 * BFS is suitable here because all moves have an equal cost (1), so the first path found is guaranteed to be one of the shortest.
 * If the `end` tile is not walkable, this function will find the shortest path to a valid, walkable tile adjacent to `end`.
 * @param {{ x: number; y: number }} start - The starting coordinate.
 * @param {{ x: number; y: number }} end - The target coordinate.
 * @param {TileType[][]} map - The current game map grid.
 * @param {boolean} [isEscaping=false] - A flag that changes which tiles are considered walkable (e.g., allows pathing through doors that can be smashed).
 * @param {{ x: number; y: number }[]} [obstacles=[]] - An array of coordinates to treat as temporarily unwalkable (e.g., the other player's position).
 * @param {ActiveLaserGrid[]} [laserGrids=[]] - The current state of all laser grids, to treat active beams as obstacles.
 * @param {boolean} [canOpenDoorsForAlarm=false] - A flag for guard AI, allowing them to pathfind through any door when running to an alarm.
 * @returns {{ x: number; y: number }[]} An array of coordinates representing the path from start to end (exclusive of start), or an empty array if no path is found.
 */
export const findShortestPath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    map: TileType[][],
    isEscaping = false,
    obstacles: { x: number; y: number }[] = [],
    laserGrids: ActiveLaserGrid[] = [],
    canOpenDoorsForAlarm = false
): { x: number; y: number }[] => {
    const queue: { x: number; y: number }[] = [start];
    const visited = new Set<string>([`${start.x}-${start.y}`]);
    const parentMap = new Map<string, { x: number; y: number }>();
    const moves = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

    const isWalkableForGuardAlarm = (tile: TileType | undefined): boolean => !!tile && (isWalkable(tile) || tile.includes('DOOR'));

    // --- Determine valid target(s) for the BFS ---
    const potentialTargets: { x: number, y: number }[] = [];
    const endTile = map[end.y]?.[end.x];
    let isEndWalkable = false;

    if (endTile) {
        const walkableCheck = canOpenDoorsForAlarm ? isWalkableForGuardAlarm(endTile) : (isEscaping ? isWalkableForEscape(endTile) : isWalkable(endTile));
        const isObstacle = obstacles.some(o => o.x === end.x && o.y === end.y);
        const isLaser = laserGrids.some(grid => grid.active && grid.beamsOn && grid.beamTiles.some(t => t.x === end.x && t.y === end.y));
        isEndWalkable = walkableCheck && !isObstacle && !isLaser;
    }

    if (isEndWalkable) {
        potentialTargets.push(end);
    } else {
        // End is not walkable, find adjacent walkable tiles as potential targets.
        for (const move of moves) {
            const adjPos = { x: end.x + move.dx, y: end.y + move.dy };

            if (adjPos.y < 0 || adjPos.y >= map.length || adjPos.x < 0 || adjPos.x >= map[0].length) continue;

            const tile = map[adjPos.y][adjPos.x];
            const walkableCheck = canOpenDoorsForAlarm ? isWalkableForGuardAlarm(tile) : (isEscaping ? isWalkableForEscape(tile) : isWalkable(tile));
            const isObstacle = obstacles.some(o => o.x === adjPos.x && o.y === adjPos.y);
            const isLaser = laserGrids.some(grid => grid.active && grid.beamsOn && grid.beamTiles.some(t => t.x === adjPos.x && t.y === adjPos.y));

            if (walkableCheck && !isObstacle && !isLaser) {
                potentialTargets.push(adjPos);
            }
        }
    }

    if (potentialTargets.length === 0) {
        return []; // No path possible if there are no valid targets.
    }

    const potentialTargetKeys = new Set(potentialTargets.map(p => `${p.x}-${p.y}`));
    let foundTarget: { x: number; y: number } | null = null;

    // --- Breadth-First Search ---
    let iterations = 0;
    while (queue.length > 0) {
        iterations++;
        if (iterations > 5000) {
            console.warn("Pathfinding BFS exceeded iteration limit, aborting.");
            break;
        }
        const pos = queue.shift()!;
        const posKey = `${pos.x}-${pos.y}`;

        // If we've reached any of the potential targets, we're done.
        if (potentialTargetKeys.has(posKey)) {
            foundTarget = pos;
            break;
        }

        // Explore neighbors.
        for (const move of moves) {
            const nextPos = { x: pos.x + move.dx, y: pos.y + move.dy };
            const nextPosKey = `${nextPos.x}-${nextPos.y}`;

            if (nextPos.y < 0 || nextPos.y >= map.length || nextPos.x < 0 || nextPos.x >= map[0].length) continue;
            if (visited.has(nextPosKey)) continue;

            const tile = map[nextPos.y][nextPos.x];
            const walkableCheck = canOpenDoorsForAlarm ? isWalkableForGuardAlarm(tile) : (isEscaping ? isWalkableForEscape(tile) : isWalkable(tile));
            const isObstacle = obstacles.some(o => o.x === nextPos.x && o.y === nextPos.y);
            const isLaser = laserGrids.some(grid => grid.active && grid.beamsOn && grid.beamTiles.some(t => t.x === nextPos.x && t.y === nextPos.y));

            if (walkableCheck && !isObstacle && !isLaser) {
                visited.add(nextPosKey);
                parentMap.set(nextPosKey, pos);
                queue.push(nextPos);
            }
        }
    }

    if (!foundTarget) {
        return [];
    }

    // --- Reconstruct Path ---
    const path: { x: number; y: number }[] = [];
    let current = foundTarget;
    while (current.x !== start.x || current.y !== start.y) {
        path.unshift(current);
        const parent = parentMap.get(`${current.x}-${current.y}`);
        if (!parent) return [];
        current = parent;
    }
    return path;
};

/**
 * A variant of `findShortestPath` specifically for the Map Editor.
 * It uses a different definition of "walkable" suitable for planning guard patrol routes,
 * allowing paths to go through closed doors.
 * @param {{ x: number; y: number }} start - The starting coordinate.
 * @param {{ x: number; y: number }} end - The target coordinate.
 * @param {TileType[][]} map - The current game map grid.
 * @returns {{ x: number; y: number }[]} An array of coordinates for the path, or an empty array if none is found.
 */
export const findShortestPathForEditor = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    map: TileType[][]
): { x: number; y: number }[] => {
    // In the editor, guards can be routed through closed doors, as players can open them.
    const isWalkableForEditor = (tile: TileType): boolean => {
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
            case TileType.DOOR_CLOSED:
            case TileType.DOOR_LOCKED:
            case TileType.DOOR_LOCKED_ALARMED:
            case TileType.CAR:
            case TileType.PRESSURE_PLATE:
            case TileType.PRESSURE_PLATE_DISABLED:
            case TileType.PRESSURE_PLATE_HIDDEN:
            case TileType.VELVET_ROPE:
                return true;
            default:
                return false;
        }
    };

    const queue: { x: number; y: number }[] = [start];
    const visited = new Set<string>([`${start.x}-${start.y}`]);
    const parentMap = new Map<string, { x: number; y: number }>();
    const moves = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    let pathFound = false;
    while (queue.length > 0) {
        const pos = queue.shift()!;
        if (pos.x === end.x && pos.y === end.y) {
            pathFound = true;
            break;
        }
        for (const move of moves) {
            const nextPos = { x: pos.x + move.dx, y: pos.y + move.dy };
            const nextPosKey = `${nextPos.x}-${nextPos.y}`;
            if (nextPos.y < 0 || nextPos.y >= map.length || nextPos.x < 0 || nextPos.x >= map[0].length) continue;
            if (visited.has(nextPosKey)) continue;
            if (isWalkableForEditor(map[nextPos.y][nextPos.x])) {
                visited.add(nextPosKey);
                parentMap.set(nextPosKey, pos);
                queue.push(nextPos);
            }
        }
    }
    if (!pathFound) return [];
    const path: { x: number; y: number }[] = [];
    let current = end;
    while (current.x !== start.x || current.y !== start.y) {
        path.unshift(current);
        const parent = parentMap.get(`${current.x}-${current.y}`);
        if (!parent) return [];
        current = parent;
    }
    return path;
};

/**
 * Implements Bresenham's line algorithm to find all integer grid coordinates that lie on a line between two points.
 * This is the foundation for the line-of-sight calculation.
 * @param {number} x0 - Starting x-coordinate.
 * @param {number} y0 - Starting y-coordinate.
 * @param {number} x1 - Ending x-coordinate.
 * @param {number} y1 - Ending y-coordinate.
 * @returns {{ x: number; y: number }[]} An array of all {x, y} points on the line.
 */
export const bresenhamLine = (x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let iterations = 0;
    if (Number.isNaN(x0) || Number.isNaN(y0) || Number.isNaN(x1) || Number.isNaN(y1)) {
        return [];
    }
    while (iterations < 1000) {
        points.push({ x: x0, y: y0 });
        if ((x0 === x1) && (y0 === y1)) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
        iterations++;
    }
    return points;
};

/**
 * Determines if there is a clear line of sight between two points, without any blocking obstacles.
 * It does this by tracing a line between the points and checking each tile on that line.
 * @param {{ x: number; y: number }} start - The starting coordinate.
 * @param {{ x: number; y: number }} end - The target coordinate.
 * @param {TileType[][]} map - The current game map grid.
 * @returns {boolean} `true` if line of sight is clear, `false` otherwise.
 */
export const getLineOfSight = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    map: TileType[][],
    isObstacleOverride?: (x: number, y: number, tile: TileType) => boolean
): boolean => {
    const line = bresenhamLine(start.x, start.y, end.x, end.y);
    // We don't check the start and end tiles themselves for being obstacles.
    for (let i = 1; i < line.length - 1; i++) {
        const pos = line[i];
        const tile = map[pos.y]?.[pos.x];
        if (!tile || (isObstacleOverride ? isObstacleOverride(pos.x, pos.y, tile) : isObstacleForLoS(tile))) {
            return false; // Obstacle found, no line of sight.
        }
    }
    return true; // No obstacles found.
};

/** Helper function to generate a full patrol route from a set of waypoints, adding pauses for door interactions. */
export const calculatePatrolRoute = (waypoints: { x: number, y: number }[], map: TileType[][]): { x: number, y: number }[] => {
    if (!waypoints || waypoints.length < 2) return [];

    const startPoint = waypoints[0];
    const endPoint = waypoints[waypoints.length - 1];
    const isCircular = waypoints.length > 2 && startPoint.x === endPoint.x && startPoint.y === endPoint.y;

    // 1. Generate the complete, simple path for the entire tour (A->B->C... ->A)
    const pathSegments: { x: number, y: number }[][] = [];
    const waypointsToUse = isCircular ? waypoints : [...waypoints];

    for (let i = 0; i < waypointsToUse.length - 1; i++) {
        pathSegments.push(findShortestPathForEditor(waypointsToUse[i], waypointsToUse[i + 1], map));
    }

    if (!isCircular) {
        const returnWaypoints = [...waypoints].reverse();
        for (let i = 0; i < returnWaypoints.length - 1; i++) {
            pathSegments.push(findShortestPathForEditor(returnWaypoints[i], returnWaypoints[i + 1], map));
        }
    }

    let simplePath: { x: number, y: number }[] = [startPoint];
    for (const segment of pathSegments) {
        simplePath.push(...segment);
    }

    // The simple path is a full loop (e.g., A..B..C..B..A), so remove the final duplicated start point.
    if (simplePath.length > 1) {
        simplePath.pop();
    }

    // 2. Post-process the simple path to inject pauses for doors.
    const finalPath: { x: number, y: number }[] = [];
    for (let i = 0; i < simplePath.length; i++) {
        const currentPos = simplePath[i];
        const prevPos = i > 0 ? simplePath[i - 1] : simplePath[simplePath.length - 1]; // Wrap around for the first step

        // If moving TO a closed door, add a 1s pause at the previous position to "open" it.
        if (map[currentPos.y][currentPos.x] === TileType.DOOR_CLOSED) {
            finalPath.push(prevPos);
        }

        finalPath.push(currentPos);

        // If moving FROM a closed door, add a 1s pause at the current position to "close" it.
        if (map[currentPos.y][currentPos.x] === TileType.DOOR_CLOSED) {
            finalPath.push(currentPos);
        }
    }

    return finalPath;
};

/**
 * Finds the fastest path for escaping, considering that smashing doors takes significantly more time than walking.
 * Uses Dijkstra's algorithm to allow for weighted edges (tiles with different time costs).
 * @param {start} {{ x: number; y: number }} - The starting coordinate.
 * @param {end} {{ x: number; y: number }} - The target coordinate.
 * @param {map} {TileType[][]} - The current game map grid.
 * @returns {{ x: number; y: number }[]} An array of coordinates representing the fastest path.
 */
export const findFastestEscapePath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    map: TileType[][]
): { x: number; y: number }[] => {
    const rows = map.length;
    const cols = map[0].length;

    // Helper to calculate cost to enter a tile
    const getCost = (tile: TileType): number => {
        // If it's a door we need to smash
        if (tile === TileType.DOOR_LOCKED || tile === TileType.DOOR_LOCKED_ALARMED) {
            return TIME_COST.MOVE + TIME_COST.SMASH_DOOR;
        }
        // If it's a closed but unlocked door, it's faster
        if (tile === TileType.DOOR_CLOSED) {
            return TIME_COST.MOVE + TIME_COST.OPEN_DOOR;
        }
        // If it's a window we need to break
        if (tile === TileType.WINDOW) {
            return TIME_COST.MOVE + TIME_COST.SMASH_DOOR; // Assume breaking window is similar cost or use distinct cost if available
        }
        // Base move cost for floor and other walkable tiles
        return TIME_COST.MOVE;
    };

    const dist = new Map<string, number>();
    const prev = new Map<string, { x: number; y: number }>();
    const pq: { x: number; y: number; p: number }[] = []; // Array used as Priority Queue

    const startKey = `${start.x}-${start.y}`;
    dist.set(startKey, 0);
    pq.push({ ...start, p: 0 });

    const directions = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

    while (pq.length > 0) {
        // Simple O(N) sort to simulate priority queue pop. Efficient enough for this map size.
        pq.sort((a, b) => b.p - a.p);
        const curr = pq.pop()!;
        const currKey = `${curr.x}-${curr.y}`;

        // Optimization: if we found a shorter path to this node already, skip
        if (curr.p > (dist.get(currKey) ?? Infinity)) continue;

        // Early exit if we reached the target
        if (curr.x === end.x && curr.y === end.y) break;

        for (const dir of directions) {
            const next = { x: curr.x + dir.dx, y: curr.y + dir.dy };
            const nextKey = `${next.x}-${next.y}`;

            if (next.y < 0 || next.y >= rows || next.x < 0 || next.x >= cols) continue;

            const tile = map[next.y][next.x];

            // Check walkability for escape scenario (allows smashing doors/windows)
            if (!isWalkableForEscape(tile)) continue;

            const newDist = (dist.get(currKey) ?? Infinity) + getCost(tile);

            if (newDist < (dist.get(nextKey) ?? Infinity)) {
                dist.set(nextKey, newDist);
                prev.set(nextKey, curr);
                pq.push({ ...next, p: newDist });
            }
        }
    }

    // Reconstruct path
    const path: { x: number; y: number }[] = [];
    let curr: { x: number; y: number } | undefined = end;

    // Check if target was actually reached
    if (!prev.has(`${end.x}-${end.y}`) && (start.x !== end.x || start.y !== end.y)) {
        // Fallback to BFS if weighted path fails for some reason (though unlikely if reachable)
        return findShortestPath(start, end, map, true);
    }

    while (curr && (curr.x !== start.x || curr.y !== start.y)) {
        path.unshift(curr);
        curr = prev.get(`${curr.x}-${curr.y}`);
    }

    return path;
};
