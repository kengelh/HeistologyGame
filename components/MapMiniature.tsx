import * as React from 'react';
import { Tile } from './Tile';
import { TileType, Scenario } from '../types';
import { TILE_SIZE } from '../constants';
import { FloorPatternDefs } from './Icons';

interface MapMiniatureProps {
    scenario: Scenario;
    width?: number;
    height?: number;
}

/**
 * Renders a scaled-down, non-interactive version of the scenario map.
 * Used for briefings and menu screens.
 */
export const MapMiniature: React.FC<MapMiniatureProps> = ({ scenario, width = 300, height = 200 }) => {
    const { map, startPositions, cameras } = scenario;

    if (!map || map.length === 0 || !map[0]) {
        return (
            <div className="w-full h-full bg-slate-900 border-2 border-slate-700 rounded-xl flex items-center justify-center text-red-500 font-mono text-xs p-4 text-center">
                NO MAP DATA AVAILABLE
            </div>
        );
    }
    let minX = map[0].length;
    let maxX = 0;
    let minY = map.length;
    let maxY = 0;
    let hasContents = false;

    map.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile !== TileType.EXTERIOR) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                hasContents = true;
            }
        });
    });

    // Add 1 tile padding for aesthetics, if possible
    if (hasContents) {
        minX = Math.max(0, minX - 1);
        maxX = Math.min(map[0].length - 1, maxX + 1);
        minY = Math.max(0, minY - 1);
        maxY = Math.min(map.length - 1, maxY + 1);
    } else {
        minX = 0;
        maxX = map[0].length - 1;
        minY = 0;
        maxY = map.length - 1;
    }

    const croppedWidth = (maxX - minX + 1) * TILE_SIZE;
    const croppedHeight = (maxY - minY + 1) * TILE_SIZE;

    // Calculate the necessary scale to fit the CROPPED map into the desired dimensions
    const scaleX = width / croppedWidth;
    const scaleY = height / croppedHeight;
    const scale = Math.min(scaleX, scaleY, 0.8); // Cap at 0.8x scale (increased from 0.5x)

    const mapWidth = map[0].length * TILE_SIZE;
    const mapHeight = map.length * TILE_SIZE;

    // Calculate translation to center the cropped area in the container
    const translateX = (width - croppedWidth * scale) / 2 - (minX * TILE_SIZE * scale);
    const translateY = (height - croppedHeight * scale) / 2 - (minY * TILE_SIZE * scale);

    return (
        <div
            className="relative bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-inner"
            style={{ width, height }}
        >
            <div
                className="absolute origin-top-left"
                style={{
                    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                    width: mapWidth,
                    height: mapHeight
                }}
            >
                <FloorPatternDefs />
                {map.map((row, y) => (
                    row.map((tile, x) => {
                        // Only render tiles within our bounding box to effectively "crop" the map
                        if (x < minX || x > maxX || y < minY || y > maxY) return null;

                        const isPrimary = scenario.primaryTarget?.x === x && scenario.primaryTarget?.y === y;
                        const isSecondary = scenario.secondaryTarget?.x === x && scenario.secondaryTarget?.y === y;
                        const camera = (tile === TileType.CAMERA || tile === TileType.CAMERA_DISABLED)
                            ? cameras.find(c => c.x === x && c.y === y)
                            : undefined;

                        return (
                            <div
                                key={`${x}-${y}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: x * TILE_SIZE,
                                    top: y * TILE_SIZE,
                                    width: TILE_SIZE,
                                    height: TILE_SIZE
                                }}
                            >
                                <Tile
                                    type={tile}
                                    alarmSystemActive={false}
                                    isPrimaryTarget={isPrimary}
                                    isSecondaryTarget={isSecondary}
                                    camera={camera}
                                />
                            </div>
                        );
                    })
                ))}

                {/* Starting Positions */}
                {startPositions.map((pos, i) => (
                    <div
                        key={`start-${i}`}
                        className="absolute w-6 h-6 bg-cyan-500/50 border-2 border-cyan-400 rounded-full z-10 animate-pulse flex items-center justify-center"
                        style={{
                            left: pos.x * TILE_SIZE + TILE_SIZE / 2 - 12,
                            top: pos.y * TILE_SIZE + TILE_SIZE / 2 - 12
                        }}
                    >
                        <span className="text-white text-[10px] font-black">S</span>
                    </div>
                ))}
            </div>

            {/* Blueprint Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent)] transition-opacity duration-1000"></div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(60,200,250,0.05)_50%),linear-gradient(90deg,rgba(18,24,38,0)_50%,rgba(60,200,250,0.05)_50%)] bg-[length:10px_10px]"></div>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]"></div>

            {/* Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-scan pointer-events-none"></div>

            {/* Intel Labels */}
            <div className="absolute bottom-2 left-3 flex gap-4 pointer-events-none opacity-50">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-[8px] text-white font-bold uppercase tracking-tighter">Primary Asset</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-[8px] text-white font-bold uppercase tracking-tighter">Insertion Point</span>
                </div>
            </div>

            <div className="absolute top-2 right-3 pointer-events-none opacity-50">
                <span className="text-[8px] text-cyan-400 font-mono">SATELLITE_FEED_LIVE // 24.082 // 12.119</span>
            </div>
        </div>
    );
};
