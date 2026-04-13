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
// Import the new character-specific icons.
import { CharacterIcons } from './CharacterIcons';
// Import the new shared Tile component.
import { Tile } from './Tile';
import { CHARACTER_COLORS } from '../roster';



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
        planningMonitoredTiles,
        projectedGuardVisionTiles,
        detectedHiddenPlates,
        ambiguousActionTargets,
        onMapClick,
        isTargeting,
        validTargets,
        noisePreview
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
    const camerasToRender = phase === 'planning' ? context.projectedCameras : gameState.cameras;
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

    // Calculate the total pixel dimensions of the grid container.
    const containerWidth = mapToRender[0].length * TILE_SIZE;
    const containerHeight = mapToRender.length * TILE_SIZE;

    const activePlayerProjected = projectedPlayers[currentPlayer];
    const playerPixelPos = activePlayerProjected ? {
        x: (activePlayerProjected.x + 0.5) * TILE_SIZE,
        y: (activePlayerProjected.y + 0.5) * TILE_SIZE,
    } : null;


    return (
        // The outermost container provides styling like borders and shadows.
        <div className={`relative bg-blueprint blueprint-grid p-4 border-8 border-slate-800/20 dark:border-white/10 rounded-sm shadow-inner ${explosionEffect && explosionEffect.duration > 0 ? 'screen-rattle' : ''}`}>
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
                                style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
                                className="absolute cursor-pointer"
                                onClick={() => onMapClick(x, y)}
                            >
                                <Tile type={tile} alarmSystemActive={alarmSystemActive} isPrimaryTarget={isPrimary} isSecondaryTarget={isSecondary} camera={camera} />
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
                        <div key={`treasure-val-${key}`} className="absolute pointer-events-none flex items-center justify-center z-20" style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
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
                        style={{
                            left: target.x * TILE_SIZE,
                            top: target.y * TILE_SIZE,
                            width: TILE_SIZE,
                            height: TILE_SIZE,
                        }}
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
                            style={{
                                left: x * TILE_SIZE,
                                top: y * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                            }}
                        />
                    );
                })}

                {/* Layer 3: Render Guard Patrol Routes (only during the Planning Phase). */}
                {phase === 'planning' && guardsToRender.map(guard => (
                    <React.Fragment key={`patrol-route-${guard.id}`}>
                        {guard.patrolRoute.map((point, pointIndex) => {
                            if (pointIndex === 0) return null; // Don't draw a line from the first point.
                            const prevPoint = guard.patrolRoute[pointIndex - 1];
                            const left = Math.min(point.x, prevPoint.x) * TILE_SIZE + TILE_SIZE / 2 - 1;
                            const top = Math.min(point.y, prevPoint.y) * TILE_SIZE + TILE_SIZE / 2 - 1;
                            const width = Math.abs(point.x - prevPoint.x) * TILE_SIZE + 2;
                            const height = Math.abs(point.y - prevPoint.y) * TILE_SIZE + 2;

                            return (
                                <div
                                    key={`path-${guard.id}-${pointIndex}`}
                                    className="absolute pointer-events-none z-10"
                                    style={{ left, top, width, height }}
                                >
                                    <svg width={width} height={height} className="absolute left-0 top-0">
                                        <line
                                            x1={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? 1 : width - 1)}
                                            y1={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? 1 : height - 1)}
                                            x2={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? width - 1 : 1)}
                                            y2={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? height - 1 : 1)}
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

                                const left = Math.min(point.x, prevPoint.x) * TILE_SIZE + TILE_SIZE / 2 - 1;
                                const top = Math.min(point.y, prevPoint.y) * TILE_SIZE + TILE_SIZE / 2 - 1;
                                const width = Math.abs(point.x - prevPoint.x) * TILE_SIZE + 2;
                                const height = Math.abs(point.y - prevPoint.y) * TILE_SIZE + 2;

                                return (
                                    <div
                                        key={`investigation-${guard.id}-${pointIndex}`}
                                        className="absolute pointer-events-none z-11"
                                        style={{ left, top, width, height }}
                                    >
                                        <svg width={width} height={height} className="absolute left-0 top-0">
                                            <line
                                                x1={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? 1 : width - 1)}
                                                y1={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? 1 : height - 1)}
                                                x2={point.x === prevPoint.x ? 1 : (point.x > prevPoint.x ? width - 1 : 1)}
                                                y2={point.y === prevPoint.y ? 1 : (point.y > prevPoint.y ? height - 1 : 1)}
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
                            style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
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
                            style={{
                                left: x * TILE_SIZE,
                                top: y * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                transform: `scale(${0.3 + scale * 0.7})`
                            }}
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
                            style={{
                                left: x * TILE_SIZE,
                                top: y * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                transform: `scale(${0.2 + scale * 0.8})`,
                                opacity: 0.1 + scale * 0.5
                            }}
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
                            style={{
                                left: x * TILE_SIZE,
                                top: y * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                transform: `scale(${0.4 + scale * 1.2})`,
                                filter: 'blur(1px)'
                            }}
                        />
                    );
                })}
                {((phase === 'planning' ? projectedStunEffect : stunEffect))?.duration! > 0 && Array.from((phase === 'planning' ? projectedStunEffect : stunEffect)!.tiles).map((key: string) => {
                    const [x, y] = key.split('-').map(Number);
                    return <div key={`stun-${key}`} className="absolute pointer-events-none z-30 bg-blue-300/40 border border-blue-400/50 rounded-sm animate-pulse" style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }} />;
                })}

                {/* Layer 6: Laser Grids */}
                {laserGridsToRender.map(grid => grid.active && grid.beamsOn && grid.beamTiles.map(tile => (
                    <div key={`laser-beam-${grid.id}-${tile.x}-${tile.y}`} className="absolute pointer-events-none bg-red-500/30 border-t-2 border-red-400 animate-pulse" style={{ left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE + (TILE_SIZE / 2 - 1), width: TILE_SIZE, height: 2 }} />
                )))}

                {/* Layer 7: Detected Hidden Plates */}
                {/* FIX: Explicitly type map key to resolve 'unknown' type error. */}
                {detectedHiddenPlates.size > 0 && Array.from(detectedHiddenPlates).map((key: string) => {
                    const [x, y] = key.split('-').map(Number);
                    return <div key={`detected-plate-${key}`} className="absolute pointer-events-none z-20 border-2 border-dashed border-orange-400 animate-pulse" style={{ left: x * TILE_SIZE + 4, top: y * TILE_SIZE + 4, width: TILE_SIZE - 8, height: TILE_SIZE - 8 }} />;
                })}

                {/* Layer 8 REMOVED: Player Path Preview was here */}

                {/* Layer 9: Players and Guards */}
                {playersToRender.map((player, index) => {
                    const status = playerStatuses[index];
                    const isCurrent = phase === 'planning' && index === currentPlayer;
                    const Icon = CharacterIcons[player.name] || PlayerIcon;
                    const playerColor = CHARACTER_COLORS[player.name] || 'text-white';

                    return (
                        <React.Fragment key={`player-group-${index}`}>
                            {/* Final Position Ghost (Planning Mode only) */}
                            {/* Final Position Ghost (Planning Mode only) - Commented out per user request
                            {phase === 'planning' && context.allPlayersFinalPositions && context.allPlayersFinalPositions[index] && (
                                <div
                                    className="absolute pointer-events-none z-10 opacity-30 scale-90"
                                    style={{
                                        left: context.allPlayersFinalPositions[index].x * TILE_SIZE,
                                        top: context.allPlayersFinalPositions[index].y * TILE_SIZE,
                                        width: TILE_SIZE,
                                        height: TILE_SIZE,
                                        filter: 'grayscale(0.5) contrast(1.2)'
                                    }}
                                >
                                    <Icon className={`${playerColor} w-full h-full`} isActive={true} />
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-800/80 text-[8px] text-white px-1 rounded uppercase tracking-tighter">End</div>
                                </div>
                            )}
                            */}

                            {/* Current Timeline Position */}
                            <div className="absolute transition-all duration-300 pointer-events-none z-20" style={{ left: player.x * TILE_SIZE, top: player.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                                <div className={`w-full h-full relative ${isCurrent ? 'animate-pulse' : ''}`}>
                                    <Icon className={`${playerColor} w-full h-full`} isActive={status !== 'captured' && status !== 'knocked_out'} />
                                    {status === 'knocked_out' && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-1.5 py-0.5 rounded-md border border-blue-400 shadow-sm z-30">
                                            <span className="text-blue-500 text-xs font-bold leading-none">
                                                {(() => {
                                                    const timer = playerKnockoutTimers[index];
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
                {guardsToRender.map(guard => (
                    <div key={`guard-${guard.id}`} className="absolute transition-all duration-300 pointer-events-none z-20" style={{ left: guard.x * TILE_SIZE, top: guard.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                        <div className="w-full h-full relative">
                            <GuardIcon />
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
                    <div className="absolute transition-all duration-300 pointer-events-none z-20" style={{ left: policeCar.x * TILE_SIZE, top: policeCar.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                        <PoliceCarIcon />
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
                        <div key={`interaction-${index}`} className="absolute pointer-events-none z-30" style={{ left: interaction.x * TILE_SIZE, top: interaction.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                            <div className="w-full h-full" style={transformStyle}>
                                <IconComponent />
                            </div>
                        </div>
                    );
                })}
                {projectedActiveFuses.map((fuse, index) => (
                    <div key={`fuse-proj-${index}`} className="absolute pointer-events-none z-30" style={{ left: fuse.x * TILE_SIZE, top: fuse.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                        <PulsatingDynamiteIcon />
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">{fuse.timer}</div>
                    </div>
                ))}
                {activeFuses.map((fuse, index) => (
                    <div key={`fuse-active-${index}`} className="absolute pointer-events-none z-30" style={{ left: fuse.x * TILE_SIZE, top: fuse.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                        <PulsatingDynamiteIcon />
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">{fuse.timer}</div>
                    </div>
                ))}
                {explosionEffect && explosionEffect.duration > 0 && (
                    <div className="absolute pointer-events-none z-40 text-6xl font-black text-white explosion-text" style={{ left: (explosionEffect.x + 0.5) * TILE_SIZE, top: (explosionEffect.y + 0.5) * TILE_SIZE, transform: 'translate(-50%, -50%)', textShadow: '0 0 10px orange, 0 0 20px red' }}>
                        BOOM!
                    </div>
                )}
            </div>
        </div>
    );
};