// Import React for component creation and `React.memo` for optimization.
import * as React from 'react';
// Import type definitions to ensure type safety for props and state.
import { TileType, ActionType } from '../types';
import type { Player, PlayerStatus, ActiveInteraction, Camera, GameState, Guard, ActiveLaserGrid } from '../types';
// Import constants for rendering, like the size of a tile.
import { TILE_SIZE, NOISE_RANGE, DYNAMITE_BLAST_RADIUS } from '../constants';
// Import all necessary icon components.
import { CameraIcon, DiamondIcon, KeyIcon, PlayerIcon, SafeIcon, CarIcon, PoliceCarIcon, SmashAnimationIcon, RobAnimationIcon, LockpickAnimationIcon, AlarmIcon, CameraControlIcon, DoorOpenIcon, DoorClosedIcon, ArtPieceIcon, GoldBarsIcon, GuardIcon, LaserPanelIcon, PressurePlateIcon, PressurePlatePanelIcon, TimeLockSafeIcon, TimeLockDoorIcon, DistractionAnimationIcon, CabinetIcon, DizzyStarsIcon, StaticLockpickIcon, DeskIcon, ColumnIcon, PlantIcon, SculptureIcon, TellerCounterIcon, SofaIcon, FilingCabinetIcon, WaterCoolerIcon, VendingMachineIcon, VelvetRopeIcon, FloorPatternDefs, ComputerTerminalIcon, FoamIcon, JammedPanelIcon, LoopedCameraIcon, ThermicLanceAnimationIcon, CabinetOpenIcon, DynamiteIcon, TicTocIcon, PulsatingDynamiteIcon, PrimaryTargetIcon, SecondaryTargetIcon, PanelManipulationAnimationIcon, InfiltratorWalkAnimationIcon, WaitAnimationIcon } from './Icons';
// Import a utility function to determine which tiles can be highlighted by vision overlays.
import { isVisionHighlightable } from '../lib/tiles';
// Import the new GameContext to consume state.
import { GameContext } from '../App';
import { CharacterIcons } from './CharacterIcons';
// Import the new shared Tile component.
import { Tile } from './Tile';
import { IsoSprite } from './IsoSprite';
import { CHARACTER_COLORS } from '../roster';

// Helper to map text colors to chunky 3D block colors
const getPawnColors = (colorClass: string) => {
    if (colorClass.includes('orange')) return { top: '#fb923c', dark: '#c2410c', light: '#ea580c' };
    if (colorClass.includes('red')) return { top: '#f87171', dark: '#dc2626', light: '#ef4444' };
    if (colorClass.includes('sky')) return { top: '#38bdf8', dark: '#0284c7', light: '#0ea5e9' };
    if (colorClass.includes('pink')) return { top: '#f472b6', dark: '#db2777', light: '#ec4899' };
    if (colorClass.includes('emerald')) return { top: '#34d399', dark: '#059669', light: '#10b981' };
    if (colorClass.includes('yellow')) return { top: '#facc15', dark: '#ca8a04', light: '#eab308' };
    if (colorClass.includes('blue')) return { top: '#60a5fa', dark: '#2563eb', light: '#3b82f6' };
    if (colorClass.includes('teal')) return { top: '#2dd4bf', dark: '#0d9488', light: '#14b8a6' };
    if (colorClass.includes('indigo')) return { top: '#818cf8', dark: '#4f46e5', light: '#6366f1' };
    if (colorClass.includes('fuchsia')) return { top: '#e879f9', dark: '#c026d3', light: '#d946ef' };
    if (colorClass.includes('rose')) return { top: '#fb7185', dark: '#e11d48', light: '#f43f5e' };
    if (colorClass.includes('slate')) return { top: '#94a3b8', dark: '#475569', light: '#64748b' };
    if (colorClass.includes('cyan')) return { top: '#22d3ee', dark: '#0891b2', light: '#06b6d4' };
    if (colorClass.includes('lime')) return { top: '#a3e635', dark: '#65a30d', light: '#84cc16' };
    if (colorClass.includes('amber')) return { top: '#fbbf24', dark: '#b45309', light: '#d97706' };
    return { top: '#9ca3af', dark: '#4b5563', light: '#6b7280' };
};



/**
 * The main component responsible for rendering the entire game board, including tiles,
 * players, cameras, and various overlays. It layers multiple pieces of information
 * to create a rich, informative display for the player.
 */
export const GameBoard: React.FC = () => {
    const context = React.useContext(GameContext);

    // If the context is not yet available (e.g., during initial render), render nothing.
    if (!context) return null;

    // Destructure all necessary state and callbacks from the context.
    const {
        gameState,
        currentScenario,
        projectedMap,
        projectedPlayers,
        projectedGuards,
        projectedLaserGrids,
        projectedActiveFuses,
        projectedStunEffect,
        projectedCameras,
        planningMonitoredTiles,
        projectedGuardVisionTiles,
        detectedHiddenPlates,
        ambiguousActionTargets,
        onMapClick,
        isTargeting,
        validTargets,
        noisePreview,
        isIsometric,
    } = context;

    const {
        phase,
        currentPlayer,
        players,
        playerStatuses,
        activeInteractions,
        alarmSystemActive,
        cameras,
        treasures,
        noiseEffect,
        explosionEffect,
        blastEffect,
        activeFuses,
        activeLances,
        policeCar,
        stunEffect,
        playerKnockoutTimers,
    } = gameState;

    // Determine which state to render based on the current game phase.
    const mapToRender = phase === 'planning' ? projectedMap : gameState.map;
    const playersToRender = phase === 'planning' ? projectedPlayers : gameState.players;
    const guardsToRender = phase === 'planning' ? projectedGuards : gameState.guards;
    const laserGridsToRender = phase === 'planning' ? projectedLaserGrids : gameState.laserGrids;
    const camerasToRender = phase === 'planning' ? projectedCameras : gameState.cameras;
    const monitoredTilesToRender = phase === 'planning' ? planningMonitoredTiles : gameState.monitoredTiles;
    const guardVisionToRender = phase === 'planning' ? projectedGuardVisionTiles : gameState.guardVisionTiles;

    // Robustness check: If map data is invalid, don't attempt to render.
    if (!mapToRender || mapToRender.length === 0 || !Array.isArray(mapToRender[0]) || !currentScenario) {
        return (
            <div className="text-center text-red-500 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Error: Failed to load map data.
            </div>
        );
    }

    const ISO_W = 80;
    const ISO_H = 40;

    // Calculate the total pixel dimensions of the grid container.
    const mapWidthTiles = mapToRender[0]?.length || 20;
    const mapHeightTiles = mapToRender.length || 20;
    
    // In 2D: width = cols * 40, height = rows * 40
    // In Iso: diamond width total = (cols + rows) * (ISO_W / 2). Height = (cols + rows) * (ISO_H / 2)
    const containerWidth = isIsometric 
        ? (mapWidthTiles + mapHeightTiles) * (ISO_W / 2) 
        : mapWidthTiles * TILE_SIZE;
        
    const containerHeight = isIsometric 
        ? (mapWidthTiles + mapHeightTiles) * (ISO_H / 2) + 200 // padding for top extrusions
        : mapHeightTiles * TILE_SIZE;

    // Helper to abstract 2D vs 2.5D coordinates
    const getPos = (x: number | undefined, y: number | undefined, layerOffset = 0) => {
        if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
            return { left: 0, top: 0, width: 0, height: 0, zIndex: 0 };
        }
        if (!isIsometric) {
            return {
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                zIndex: layerOffset // in 2D we just use standard fixed layers
            };
        }
        
        // Iso Projection
        // We shift the entire diamond right so x=0, y=Max doesn't go off screen.
        const offsetX = mapHeightTiles * (ISO_W / 2);
        const offsetY = 100; // Push down to leave room for tall walls at y=0, x=0
        
        return {
            left: (x - y) * (ISO_W / 2) + offsetX - (ISO_W / 2),
            top: (x + y) * (ISO_H / 2) + offsetY,
            width: ISO_W,
            height: ISO_H,
            // Magic sorting: Lower Y + X means "further back" (closer to top of screen).
            // Multiply by 10 to give space for layers.
            zIndex: Math.floor(x + y) * 10 + layerOffset 
        };
    };

    const activePlayerProjected = projectedPlayers[currentPlayer];
    const playerPixelPos = activePlayerProjected ? {
        x: isIsometric ? getPos(activePlayerProjected.x, activePlayerProjected.y).left + (ISO_W/2) : (activePlayerProjected.x + 0.5) * TILE_SIZE,
        y: isIsometric ? getPos(activePlayerProjected.x, activePlayerProjected.y).top + (ISO_H/2) : (activePlayerProjected.y + 0.5) * TILE_SIZE,
    } : null;


    return (
        // The outermost container provides styling like borders and shadows.
        <div className={`relative bg-blueprint blueprint-grid p-4 border-8 border-slate-800/20 dark:border-white/10 rounded-sm shadow-inner ${explosionEffect && explosionEffect.duration > 0 ? 'screen-rattle' : ''} ${isIsometric ? 'is-isometric' : ''}`}>
            {/* This container holds all the grid elements and is sized to fit the map perfectly. */}
            <div id="game-board-grid-parent" className="relative" style={{ width: containerWidth, height: containerHeight }}>
                <FloorPatternDefs />
                {/* Layer 1: Render the base map grid by iterating through the 2D map array. */}
                {/* Each tile is positioned absolutely based on its x/y index. */}
                {mapToRender.map((row, y) =>
                    row.map((tile, x) => {
                        const isPrimary = currentScenario.primaryTarget?.x === x && currentScenario.primaryTarget?.y === y;
                        const isSecondary = currentScenario.secondaryTarget?.x === x && currentScenario.secondaryTarget?.y === y;
                        const camera = (tile === TileType.CAMERA || tile === TileType.CAMERA_DISABLED)
                            ? camerasToRender.find(c => c.x === x && c.y === y)
                            : undefined;
                        return (
                            <div
                                key={`${x}-${y}`}
                                style={getPos(x, y)}
                                className="absolute cursor-pointer"
                                onClick={() => onMapClick(x, y)}
                            >
                                <Tile type={tile} alarmSystemActive={alarmSystemActive} isPrimaryTarget={isPrimary} isSecondaryTarget={isSecondary} camera={camera} isIsometric={isIsometric} />
                            </div>
                        )
                    })
                )}

                {/* Layer: Treasure Values (Planning Mode Only) */}
                {phase === 'planning' && Object.entries(currentScenario.treasures).map(([key, treasure]) => {
                    const [x, y] = key.split('-').map(Number);
                    const val = typeof treasure === 'number' ? treasure : (treasure as { value: number }).value;
                    const text = val >= 1000 ? `$${val / 1000}k` : `$${val}`;
                    return (
                        <div key={`treasure-val-${key}`} className="absolute pointer-events-none flex items-center justify-center z-20" style={getPos(x, y)}>
                            <span className="bg-slate-900/80 dark:bg-black/60 text-yellow-400 text-[10px] font-black px-1 py-0.5 rounded shadow-lg border border-white/10 backdrop-blur-[1px] leading-none">
                                {text}
                            </span>
                        </div>
                    );
                })}

                {/* NEW Layer: Render Targeting Overlay */}
                {isTargeting && validTargets.map(target => (
                    <div
                        key={`target-${target.x}-${target.y}`}
                        className="absolute pointer-events-none z-20"
                        style={getPos(target.x, target.y)}
                    >
                        <div className="w-full h-full bg-yellow-400/50 border-2 border-yellow-300 rounded-md animate-pulse"></div>
                    </div>
                ))}

                {/* Layer 2: Render the Guard Vision Overlay. */}
                {/* FIX: Explicitly type Array.from to fix 'unknown' type error on 'key'. */}
                {guardVisionToRender && Array.from<string>(guardVisionToRender).map(key => {
                    const [x, y] = key.split('-').map(Number);
                    const tileOnMap = mapToRender[y]?.[x];
                    if (!tileOnMap || !isVisionHighlightable(tileOnMap)) {
                        return null;
                    }
                    return (
                        <div
                            key={`guard-vision-${key}`}
                            className="absolute pointer-events-none z-4 bg-yellow-500/40"
                            style={getPos(x, y)}
                        />
                    );
                })}

                {/* Layer 3: Render Guard Patrol Routes (only during the Planning Phase). */}
                {phase === 'planning' && guardsToRender.map(guard => !guard ? null : (
                    <React.Fragment key={`patrol-route-${guard.id}`}>
                            {guard.patrolRoute.map((point, pointIndex) => {
                            if (pointIndex === 0) return null; // Don't draw a line from the first point.
                            const prevPoint = guard.patrolRoute[pointIndex - 1];
                            const p1 = getPos(point.x, point.y, 10);
                        const p2 = getPos(prevPoint.x, prevPoint.y, 10);
                        
                        let lineStyle: Record<string, number | string> = {};
                        if (!isIsometric) {
                            const left = Math.min(point.x, prevPoint.x) * TILE_SIZE + TILE_SIZE / 2 - 1;
                            const top = Math.min(point.y, prevPoint.y) * TILE_SIZE + TILE_SIZE / 2 - 1;
                            const width = Math.abs(point.x - prevPoint.x) * TILE_SIZE + 2;
                            const height = Math.abs(point.y - prevPoint.y) * TILE_SIZE + 2;
                            lineStyle = { left, top, width, height, zIndex: 10 };
                        } else {
                            // In isometric, just draw a dot at the footprint center to keep it simple
                            lineStyle = { left: p1.left + ISO_W/2 - 4, top: p1.top + ISO_H/2 - 4, width: 8, height: 8, zIndex: p1.zIndex, borderRadius: "50%" };
                        }

                            return (
                                <div
                                    key={`path-${guard.id}-${pointIndex}`}
                                    className="absolute pointer-events-none z-10"
                                    style={lineStyle}
                                >
                                    <svg width={lineStyle.width} height={lineStyle.height} className="absolute left-0 top-0">
                                        <line
                                            x1={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? 1 : (lineStyle.width || 2) - 1)}
                                            y1={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? 1 : (lineStyle.height || 2) - 1)}
                                            x2={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? (lineStyle.width || 2) - 1 : 1)}
                                            y2={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? (lineStyle.height || 2) - 1 : 1)}
                                            stroke="rgba(255, 100, 100, 0.4)"
                                            strokeWidth="2"
                                            strokeDasharray="4, 4"
                                        />
                                    </svg>
                                </div>
                            );
                        })}

                        {/* Render Investigation/Distraction Path if it exists */}
                        {guard.distractionPath && guard.distractionPath.path && (() => {
                            // Only show investigation path if current time is past detection time
                            const currentTime = phase === 'planning'
                                ? gameState.playerPlannedTimes[currentPlayer]
                                : gameState.executionTimer;
                            if (currentTime < guard.distractionPath.startTime) {
                                return null; // Guard hasn't detected it yet
                            }

                            return guard.distractionPath.path.map((point, pointIndex) => {
                                if (pointIndex === 0) return null;
                                const prevPoint = guard.distractionPath!.path[pointIndex - 1];

                                // Skip drawing lines between identical points (happens during pause)
                                if (point.x === prevPoint.x && point.y === prevPoint.y) return null;

                                const p1 = getPos(point.x, point.y, 10);
                        const p2 = getPos(prevPoint.x, prevPoint.y, 10);
                        
                        let lineStyle = {};
                        if (!isIsometric) {
                            const left = Math.min(point.x, prevPoint.x) * TILE_SIZE + TILE_SIZE / 2 - 1;
                            const top = Math.min(point.y, prevPoint.y) * TILE_SIZE + TILE_SIZE / 2 - 1;
                            const width = Math.abs(point.x - prevPoint.x) * TILE_SIZE + 2;
                            const height = Math.abs(point.y - prevPoint.y) * TILE_SIZE + 2;
                            lineStyle = { left, top, width, height, zIndex: 10 };
                        } else {
                            // In isometric, just draw a dot at the footprint center to keep it simple
                            lineStyle = { left: p1.left + ISO_W/2 - 4, top: p1.top + ISO_H/2 - 4, width: 8, height: 8, zIndex: p1.zIndex, borderRadius: "50%" };
                        }

                                return (
                                    <div
                                        key={`investigation-${guard.id}-${pointIndex}`}
                                        className="absolute pointer-events-none z-11"
                                        style={lineStyle}
                                    >
                                        <svg width={lineStyle.width} height={lineStyle.height} className="absolute left-0 top-0">
                                            <line
                                                x1={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? 1 : (lineStyle.width || 2) - 1)}
                                                y1={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? 1 : (lineStyle.height || 2) - 1)}
                                                x2={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? (lineStyle.width || 2) - 1 : 1)}
                                                y2={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? (lineStyle.height || 2) - 1 : 1)}
                                                stroke="rgba(255, 165, 0, 0.7)"
                                                strokeWidth="3"
                                                strokeDasharray="6, 3"
                                            />
                                        </svg>
                                    </div>
                                );
                            });
                        })()}
                    </React.Fragment>
                ))}

                {/* Layer 4: Camera Vision Overlay */}
                {/* FIX: Explicitly type map parameters to resolve 'unknown' type error. */}
                {Object.entries(monitoredTilesToRender).map(([key, value]: [string, { status: 'active' | 'potential' }]) => {
                    const [x, y] = key.split('-').map(Number);
                    const tileOnMap = mapToRender[y]?.[x];
                    if (!tileOnMap || !isVisionHighlightable(tileOnMap)) {
                        return null;
                    }
                    return (
                        <div
                            key={`camera-vision-${key}`}
                            className={`absolute pointer-events-none z-3 ${value.status === 'potential' ? 'bg-yellow-500/10' : 'bg-yellow-500/30'}`}
                            style={getPos(x, y)}
                        />
                    );
                })}

                {/* Layer 5: Noise/Blast/Explosion Previews and Effects */}
                {/* FIX: Explicitly type map key to resolve 'unknown' type error. */}
                {/* FIX: Handle noisePreview as a Map<string, number> for correct iteration and distance-based scaling. */}
                {noisePreview && Array.from(noisePreview.entries()).map(([key, dist]) => {
                    const [x, y] = key.split('-').map(Number);
                    const scale = 1 - (dist / (NOISE_RANGE + 1));
                    return (
                        <div
                            key={`noise-preview-${key}`}
                            className="absolute pointer-events-none z-20 bg-blue-400/20 rounded-full animate-pulse flex items-center justify-center outline outline-1 outline-blue-400/30"
                            style={{ ...getPos(x, y), transform: `scale(${0.3 + scale * 0.7})` }}
                        />
                    );
                })}
                {/* FIX: Handle noiseEffect.tiles as a Map<string, number> for correct iteration and distance-based scaling. */}
                {noiseEffect && noiseEffect.duration > 0 && Array.from(noiseEffect.tiles.entries()).map(([key, dist]) => {
                    const [x, y] = key.split('-').map(Number);
                    const scale = 1 - (dist / (NOISE_RANGE + 1));
                    return (
                        <div
                            key={`noise-${key}`}
                            className="absolute pointer-events-none z-20 bg-blue-500/30 rounded-full animate-[ping_1.5s_ease-out_infinite] border border-blue-400/50"
                            style={{ ...getPos(x, y), transform: `scale(${0.2 + scale * 0.8})`,
                                opacity: 0.1 + scale * 0.5 }}
                        />
                    );
                })}
                {/* FIX: Handle blastEffect.tiles as a Map<string, number> for correct iteration and distance-based scaling. */}
                {blastEffect && blastEffect.duration > 0 && Array.from(blastEffect.tiles.entries()).map(([key, dist]) => {
                    const [x, y] = key.split('-').map(Number);
                    const scale = 1 - (dist / (DYNAMITE_BLAST_RADIUS + 1));
                    return (
                        <div
                            key={`blast-${key}`}
                            className="absolute pointer-events-none z-30 bg-orange-600/60 rounded-full animate-[ping_0.6s_ease-out_infinite] border-2 border-yellow-500/50"
                            style={{ ...getPos(x, y), transform: `scale(${0.4 + scale * 1.2})`,
                                filter: 'blur(1px)' }}
                        />
                    );
                })}
                {((phase === 'planning' ? projectedStunEffect : stunEffect))?.duration! > 0 && Array.from((phase === 'planning' ? projectedStunEffect : stunEffect)!.tiles).map((key: string) => {
                    const [x, y] = key.split('-').map(Number);
                    return <div key={`stun-${key}`} className="absolute pointer-events-none z-30 bg-blue-300/40 border border-blue-400/50 rounded-sm animate-pulse" style={getPos(x, y)} />;
                })}

                {/* Layer 6: Laser Grids */}
                {laserGridsToRender.map(grid => grid.active && grid.beamsOn && grid.beamTiles.map(tile => (
                    <div key={`laser-beam-${grid.id}-${tile.x}-${tile.y}`} className="absolute pointer-events-none bg-red-500/30 border-t-2 border-red-400 animate-pulse" style={{ ...getPos(tile.x, tile.y), height: 2 }} />
                )))}

                {/* Layer 7: Detected Hidden Plates */}
                {/* FIX: Explicitly type map key to resolve 'unknown' type error. */}
                {detectedHiddenPlates.size > 0 && Array.from(detectedHiddenPlates).map((key: string) => {
                    const [x, y] = key.split('-').map(Number);
                    return <div key={`detected-plate-${key}`} className="absolute pointer-events-none z-20 border-2 border-dashed border-orange-400 animate-pulse" style={{ ...getPos(x, y), height: (isIsometric ? ISO_H : TILE_SIZE) - 8 }} />;
                })}

                {/* Layer 8 REMOVED: Player Path Preview was here */}

                {/* Layer 9: Players and Guards */}
                {playersToRender.map((player, index) => {
                    if (!player) return null;
                    const status = playerStatuses[index];
                    const isCurrent = phase === 'planning' && index === currentPlayer;
                    const Icon = CharacterIcons[player.name] || PlayerIcon;
                    const playerColor = CHARACTER_COLORS[player.name] || 'text-white';

                    return (
                        <React.Fragment key={`player-group-${index}`}>
                            {/* Current Position */}
                            <div
                                className={`absolute transition-all duration-300 pointer-events-none z-20 ${isCurrent ? 'animate-bounce-subtle' : ''}`}
                                style={getPos(player.x, player.y)}
                            >
                                <div className="w-full h-full relative">
                                    {isIsometric ? (
                                        <IsoSprite topColor="#3b82f6" leftColor="#1e40af" rightColor="#2563eb" thickness={24} scale={0.4} />
                                    ) : (
                                        <Icon className={`w-full h-full ${playerColor}`} isActive={true} />
                                    )}
                                    {/* isCurrent && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center">
                                            <div className="bg-ink text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest whitespace-nowrap shadow-lg">ACTIVE</div>
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-ink"></div>
                                        </div>
                                    ) */}
                                    {status === 'knocked_out' && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-1.5 py-0.5 rounded-md border border-blue-400 shadow-sm z-30">
                                            <span className="text-blue-500 text-xs font-bold leading-none">
                                                {(() => {
                                                    const timer = playerKnockoutTimers[index] || 0;
                                                    const ticks = 9999 - timer;
                                                    if (ticks === 2) return 'zZz';
                                                    if (ticks === 3) return 'zzZ';
                                                    return 'Zzz';
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                    {status === 'captured' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-red-500 text-3xl font-bold">X</div>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                {guardsToRender.map(guard => !guard ? null : (
                    <div key={`guard-${guard.id}`} className="absolute transition-all duration-300 pointer-events-none z-20" style={getPos(guard.x, guard.y)}>
                        <div className={`w-full h-full relative`}>
                            {isIsometric ? (
                                <IsoSprite topColor="#ef4444" leftColor="#b91c1c" rightColor="#dc2626" thickness={24} scale={0.4} />
                            ) : (
                                <GuardIcon />
                            )}
                            {guard.status === 'knocked_out' && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-1.5 py-0.5 rounded-md border border-blue-400 shadow-sm z-30">
                                    <span className="text-blue-500 text-xs font-bold leading-none">
                                        {(() => {
                                            const timer = guard.knockout_timer || 0;
                                            const ticks = 9999 - timer;
                                            if (ticks === 2) return 'zZz';
                                            if (ticks === 3) return 'zzZ';
                                            return 'Zzz';
                                        })()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {policeCar && (
                    <div className="absolute transition-all duration-300 pointer-events-none z-20" style={getPos(policeCar.x, policeCar.y)}>
                        <div className={`w-full h-full relative`}>
                            {isIsometric ? (
                                <IsoSprite topColor="#3b82f6" leftColor="#1e3a8a" rightColor="#2563eb" thickness={20} scale={1.2} />
                            ) : (
                                <PoliceCarIcon />
                            )}
                        </div>
                    </div>
                )}

                {/* Layer 10: Active Interactions & Effects */}
                {activeInteractions.map((interaction, index) => {
                    let IconComponent: React.FC<any> | null = null;
                    let transformStyle = {};
                    const player = playersToRender[interaction.teamMember];

                    switch (interaction.action) {
                        case 'unlock': case 'lockpick_case': case 'crack': case 'disable': case 'disable_alarm': case 'disable_cameras': case 'disable_lasers': case 'disable_pressure_plates': case 'hack':
                        case 'use_skeleton_key': case 'use_camera_looper': case 'use_glass_cutter': case 'use_laser_jammer_short': case 'use_laser_jammer_long': {
                            IconComponent = LockpickAnimationIcon;
                            // FIX: Center the icon on the target tile (the door) instead of offsetting it towards the player.
                            // The icon container is already positioned at interaction.x/y.
                            transformStyle = { transform: `scale(0.8)` };
                            break;
                        }
                        case 'smash': case 'smash_door': IconComponent = SmashAnimationIcon; break;
                        case 'rob': IconComponent = RobAnimationIcon; break;
                        case 'distract': IconComponent = DistractionAnimationIcon; break;
                        case 'wait': IconComponent = WaitAnimationIcon; break;
                        case 'use_thermic_lance': IconComponent = ThermicLanceAnimationIcon; break;
                        case 'plant_dynamite': IconComponent = TicTocIcon; break;
                        case 'open_door': case 'close_door': case 'open_cabinet': case 'close_cabinet': case 'close_case': case 'close_safe': IconComponent = PanelManipulationAnimationIcon; break;
                        default: break;
                    }
                    if (!IconComponent) return null;
                    return (
                        <div key={`interaction-${index}`} className="absolute pointer-events-none z-30" style={{ ...getPos(interaction.x, interaction.y) }}>
                            <div className="w-full h-full" style={transformStyle}>
                                <div style={{ transform: isIsometric ? 'translateZ(25px)' : 'none' }} className="w-full h-full">
                                    <IconComponent />
                                </div>
                            </div>
                        </div>
                    );
                })}
                {projectedActiveFuses.map((fuse, index) => (
                    <div key={`fuse-proj-${index}`} className="absolute pointer-events-none z-30" style={{ ...getPos(fuse.x, fuse.y) }}>
                        <div style={{ transform: isIsometric ? 'translateZ(10px)' : 'none' }} className="w-full h-full relative">
                            <PulsatingDynamiteIcon />
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">{fuse.timer}</div>
                        </div>
                    </div>
                ))}
                {activeFuses.map((fuse, index) => (
                    <div key={`fuse-active-${index}`} className="absolute pointer-events-none z-30" style={{ ...getPos(fuse.x, fuse.y) }}>
                        <div style={{ transform: isIsometric ? 'translateZ(10px)' : 'none' }} className="w-full h-full relative">
                            <PulsatingDynamiteIcon />
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">{fuse.timer}</div>
                        </div>
                    </div>
                ))}
                {explosionEffect && explosionEffect.duration > 0 && (
                    <div className="absolute pointer-events-none z-40 text-6xl font-black text-white explosion-text" style={{ 
                        left: isIsometric ? getPos(explosionEffect.x, explosionEffect.y).left + ISO_W/2 : (explosionEffect.x + 0.5) * TILE_SIZE, 
                        top: isIsometric ? getPos(explosionEffect.x, explosionEffect.y).top + ISO_H/2 : (explosionEffect.y + 0.5) * TILE_SIZE, 
                        transform: 'translate(-50%, -50%)', 
                        textShadow: '0 0 10px orange, 0 0 20px red' 
                    }}>
                        BOOM!
                    </div>
                )}
            </div>
        </div>
    );
};