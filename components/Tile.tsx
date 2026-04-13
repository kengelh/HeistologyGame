// Import React for component creation and `React.memo` for optimization.
import * as React from 'react';
// Import type definitions to ensure type safety for props and state.
import { TileType, Camera } from '../types';
// Import all necessary icon components.
import { CameraIcon, DiamondIcon, KeyIcon, SafeIcon, CarIcon, PoliceCarIcon, AlarmIcon, CameraControlIcon, DoorOpenIcon, DoorClosedIcon, ArtPieceIcon, GoldBarsIcon, LaserPanelIcon, PressurePlateIcon, PressurePlatePanelIcon, TimeLockSafeIcon, TimeLockDoorIcon, CabinetIcon, StaticLockpickIcon, DeskIcon, ColumnIcon, PlantIcon, SculptureIcon, TellerCounterIcon, SofaIcon, FilingCabinetIcon, WaterCoolerIcon, VendingMachineIcon, VelvetRopeIcon, ComputerTerminalIcon, FoamIcon, JammedPanelIcon, CabinetOpenIcon, VaultDoorIcon, LooIcon, KitchenIcon, BroomIcon, PrimaryTargetIcon, SecondaryTargetIcon, LoopedCameraIcon, WindowIcon, WindowBrokenIcon } from './Icons';
import { getTileCategory } from '../lib/tiles'; // Import the category helper

/**
 * A memoized component to render a single tile on the map.
 * `React.memo` is a higher-order component that prevents a component from re-rendering if its props have not changed.
 * This is a CRUCIAL performance optimization for any grid-based application.
 */
export const Tile: React.FC<{ type: TileType; alarmSystemActive: boolean; isPrimaryTarget?: boolean; isSecondaryTarget?: boolean; camera?: Camera }> = React.memo(({ type, alarmSystemActive, isPrimaryTarget, isSecondaryTarget, camera }) => {
    const baseStyle = 'w-full h-full flex items-center justify-center transition-all duration-300';

    const renderIcon = (type: TileType) => {
        // This switch statement ONLY returns the icon/content for a tile, without any background.
        switch (type) {
            case TileType.CAMERA:
            case TileType.CAMERA_DISABLED: {
                const getRotation = (orientation: 'up' | 'down' | 'left' | 'right' | undefined) => {
                    if (!orientation) return 'rotate(0deg)';
                    switch (orientation) {
                        case 'up': return 'rotate(-90deg)';
                        case 'down': return 'rotate(90deg)';
                        case 'left': return 'rotate(180deg)';
                        case 'right': return 'rotate(0deg)';
                        default: return 'rotate(0deg)';
                    }
                };

                const isDisabled = type === TileType.CAMERA_DISABLED || (camera?.disabled);
                const looperActive = camera?.looperTimer && camera.looperTimer > 0;

                return (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div style={{ transform: getRotation(camera?.orientation) }}>
                            <CameraIcon className={`w-8 h-8 p-1 ${looperActive ? 'text-purple-400' : isDisabled ? 'text-green-500' : 'text-yellow-500'}`} />
                        </div>
                        {looperActive && <LoopedCameraIcon className="absolute w-5 h-5 text-white animate-spin" />}
                    </div>
                );
            }
            case TileType.DOOR_LOCKED:
                return (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <DoorClosedIcon className="w-8 h-8 text-orange-500" />
                        <StaticLockpickIcon className="absolute w-5 h-5 text-black" style={{ filter: 'drop-shadow(0 0 1px white)' }} />
                    </div>
                );
            case TileType.DOOR_LOCKED_ALARMED:
                return (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-sm"></div>
                        <DoorClosedIcon className="w-8 h-8 text-red-500" />
                        <StaticLockpickIcon className="absolute w-5 h-5 text-white" style={{ filter: 'drop-shadow(0 0 3px black)' }} />
                    </div>
                );
            case TileType.DOOR_OPEN:
                return <DoorOpenIcon className="w-8 h-8 text-green-500" />;
            case TileType.DOOR_CLOSED:
                return <DoorClosedIcon className="w-8 h-8 text-orange-500" />;
            case TileType.DOOR_SMASHED:
                return <DoorOpenIcon className="w-8 h-8 text-orange-800" />;
            case TileType.WINDOW:
                return <WindowIcon className="w-full h-full text-blue-400" />;
            case TileType.WINDOW_BROKEN:
                return <WindowBrokenIcon className="w-full h-full text-orange-800" />;
            case TileType.DISPLAY_CASE:
            case TileType.DISPLAY_CASE_ALARMED:
                return (
                    <div className={`relative w-full h-full border-2 ${type === TileType.DISPLAY_CASE_ALARMED && alarmSystemActive ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-cyan-500'} flex items-center justify-center`}>
                        {type === TileType.DISPLAY_CASE_ALARMED && alarmSystemActive && <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-sm pointer-events-none"></div>}
                        <DiamondIcon className={`w-5 h-5 ${type === TileType.DISPLAY_CASE_ALARMED ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`} />
                    </div>
                );
            case TileType.DISPLAY_CASE_SMASHED:
            case TileType.DISPLAY_CASE_OPENED:
            case TileType.DISPLAY_CASE_ROBBED:
                const colorMap = {
                    [TileType.DISPLAY_CASE_SMASHED]: { border: 'border-yellow-500', icon: 'text-yellow-700 dark:text-yellow-600 opacity-50' },
                    [TileType.DISPLAY_CASE_OPENED]: { border: 'border-cyan-500', icon: 'text-cyan-900 dark:text-cyan-800' },
                    [TileType.DISPLAY_CASE_ROBBED]: { border: 'border-green-500', icon: 'text-green-700 dark:text-green-600 opacity-50' },
                };
                return <div className={`w-full h-full border-2 ${colorMap[type].border} flex items-center justify-center`}><DiamondIcon className={`w-5 h-5 ${colorMap[type].icon}`} /></div>;
            case TileType.SAFE:
            case TileType.SAFE_ALARMED:
                return (
                    <div className={`relative w-full h-full border-2 ${type === TileType.SAFE_ALARMED && alarmSystemActive ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-gray-500 dark:border-gray-400'} flex items-center justify-center`}>
                        {type === TileType.SAFE_ALARMED && alarmSystemActive && <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-sm pointer-events-none"></div>}
                        <SafeIcon className={`w-6 h-6 ${type === TileType.SAFE_ALARMED ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`} />
                    </div>
                );
            case TileType.SAFE_OPENED:
            case TileType.SAFE_SMASHED:
            case TileType.SAFE_ROBBED:
                const safeColorMap = {
                    [TileType.SAFE_OPENED]: { border: 'border-yellow-600 dark:border-yellow-400', icon: 'text-yellow-800 dark:text-yellow-400' },
                    [TileType.SAFE_SMASHED]: { border: 'border-yellow-500', icon: 'text-yellow-700 dark:text-yellow-600 opacity-50' },
                    [TileType.SAFE_ROBBED]: { border: 'border-green-600 dark:border-green-400', icon: 'text-green-800 dark:text-green-400' },
                }
                return <div className={`w-full h-full border-2 ${safeColorMap[type].border} flex items-center justify-center`}><SafeIcon className={`w-6 h-6 ${safeColorMap[type].icon}`} /></div>;
            case TileType.SAFE_TIMELOCK:
                return <div className={`w-full h-full border-2 ${alarmSystemActive ? 'border-yellow-500 shadow-lg shadow-yellow-500/50' : 'border-gray-500 dark:border-gray-400'} flex items-center justify-center`}><TimeLockSafeIcon className="w-6 h-6" /></div>;
            case TileType.VAULT_DOOR:
                return <VaultDoorIcon className="w-8 h-8 text-amber-700 dark:text-amber-300" />;
            case TileType.VAULT_DOOR_TIMELOCK:
                return <TimeLockDoorIcon className="w-full h-full p-1" />;
            case TileType.ALARM_BOX:
                return <AlarmIcon className="w-8 h-8 text-red-500" />;
            case TileType.ALARM_BOX_DISABLED:
                return <AlarmIcon className="w-8 h-8 text-green-500" disabled />;
            case TileType.CAMERA_CONTROL_PANEL:
                return <CameraControlIcon className="w-8 h-8 text-yellow-500" />;
            case TileType.CAMERA_CONTROL_PANEL_DISABLED:
                return <CameraControlIcon className="w-8 h-8 text-green-500" disabled />;
            case TileType.LASER_CONTROL_PANEL:
                return <LaserPanelIcon className="w-8 h-8 text-red-400" />;
            case TileType.LASER_CONTROL_PANEL_DISABLED:
                return <LaserPanelIcon className="w-8 h-8 text-green-500" disabled />;
            case TileType.LASER_CONTROL_PANEL_JAMMED:
                return <JammedPanelIcon className="w-8 h-8 text-purple-400" />;
            case TileType.PRESSURE_PLATE_PANEL:
                return <PressurePlatePanelIcon className="w-8 h-8 text-orange-400" />;
            case TileType.PRESSURE_PLATE_PANEL_DISABLED:
                return <PressurePlatePanelIcon className="w-8 h-8 text-green-500" disabled />;
            case TileType.COMPUTER_TERMINAL:
                return <ComputerTerminalIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />;
            case TileType.COMPUTER_TERMINAL_HACKED:
                return <ComputerTerminalIcon className="w-8 h-8 text-green-500" disabled />;
            case TileType.ART_PIECE:
            case TileType.ART_PIECE_ALARMED:
                return (
                    <div className={`relative w-full h-full border-2 ${type === TileType.ART_PIECE_ALARMED && alarmSystemActive ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-indigo-400'} flex items-center justify-center`}>
                        {type === TileType.ART_PIECE_ALARMED && alarmSystemActive && <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-sm pointer-events-none"></div>}
                        <ArtPieceIcon className={`w-8 h-8 ${type === TileType.ART_PIECE_ALARMED ? 'text-red-800 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`} />
                    </div>
                );
            case TileType.ART_PIECE_ROBBED:
                return <div className="w-full h-full border-2 border-green-500 flex items-center justify-center"><ArtPieceIcon className="w-8 h-8 text-green-700 dark:text-green-600 opacity-50" /></div>;
            case TileType.GOLD_BARS:
            case TileType.GOLD_BARS_ALARMED:
                return (
                    <div className={`relative w-full h-full border-2 ${type === TileType.GOLD_BARS_ALARMED && alarmSystemActive ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-yellow-500'} flex items-center justify-center`}>
                        {type === TileType.GOLD_BARS_ALARMED && alarmSystemActive && <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-sm pointer-events-none"></div>}
                        <GoldBarsIcon className={`w-7 h-7 ${type === TileType.GOLD_BARS_ALARMED ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`} />
                    </div>
                );
            case TileType.GOLD_BARS_ROBBED:
                return <div className="w-full h-full border-2 border-green-500 flex items-center justify-center"><GoldBarsIcon className="w-7 h-7 text-green-700 dark:text-green-600 opacity-50" /></div>;
            case TileType.CABINET:
            case TileType.CABINET_ALARMED:
                return (
                    <div className={`relative w-full h-full border-2 ${type === TileType.CABINET_ALARMED && alarmSystemActive ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-gray-400'} flex items-center justify-center`}>
                        {type === TileType.CABINET_ALARMED && alarmSystemActive && <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-sm pointer-events-none"></div>}
                        <CabinetIcon className={`w-6 h-6 ${type === TileType.CABINET_ALARMED ? 'text-red-600 dark:text-red-300' : 'text-amber-600 dark:text-amber-300'}`} />
                    </div>
                );
            case TileType.CABINET_OPEN:
                return <div className="w-full h-full border-2 border-yellow-500 flex items-center justify-center"><CabinetOpenIcon className="w-6 h-6 text-yellow-800 dark:text-yellow-200" /></div>;
            case TileType.CABINET_ROBBED:
                return <div className="w-full h-full border-2 border-green-500 flex items-center justify-center"><CabinetIcon className="w-6 h-6 text-green-700 dark:text-green-600 opacity-50" /></div>;
            case TileType.FILING_CABINET:
                return <CabinetIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />;
            case TileType.STATUE:
            case TileType.STATUE_ALARMED:
                return (
                    <div className={`relative w-full h-full border-2 ${type === TileType.STATUE_ALARMED && alarmSystemActive ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-transparent'} flex items-center justify-center`}>
                        {type === TileType.STATUE_ALARMED && alarmSystemActive && <div className="absolute inset-0 border-2 border-red-500 animate-pulse rounded-sm pointer-events-none"></div>}
                        <SculptureIcon className={`w-8 h-8 ${type === TileType.STATUE_ALARMED ? 'text-red-800 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`} />
                    </div>
                );
            case TileType.STATUE_ROBBED:
                return <div className="w-full h-full border-2 border-green-500 flex items-center justify-center"><SculptureIcon className="w-8 h-8 text-green-700 dark:text-green-600 opacity-50" /></div>;
            case TileType.PRESSURE_PLATE:
                return <PressurePlateIcon className="w-6 h-6 text-orange-500 dark:text-orange-400" />;
            case TileType.PRESSURE_PLATE_DISABLED:
                return <PressurePlateIcon className="w-6 h-6 text-green-500" disabled />;
            case TileType.FOAMED_PRESSURE_PLATE:
                return <FoamIcon className="w-8 h-8 text-gray-500 dark:text-gray-300 opacity-80" />;
            case TileType.CAR:
                return <CarIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />;
            case TileType.POLICE_CAR:
                return <PoliceCarIcon className="w-8 h-8" />;
            case TileType.DESK:
                return <DeskIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />;
            case TileType.COLUMN:
                return <ColumnIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />;
            case TileType.PLANT:
                return <PlantIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />;
            case TileType.SCULPTURE:
                return <SculptureIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />;
            case TileType.TELLER_COUNTER:
                return <div className="w-full h-full flex items-center justify-center"><TellerCounterIcon className="w-10 h-10 text-amber-600 dark:text-amber-400" /></div>;
            case TileType.TELLER_COUNTER_ROBBED:
                return <div className="w-full h-full border-2 border-green-500 flex items-center justify-center"><TellerCounterIcon className="w-10 h-10 text-green-700 dark:text-green-600 opacity-50" /></div>;
            case TileType.SOFA:
                return <SofaIcon className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />;

            case TileType.WATER_COOLER:
                return <WaterCoolerIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />;
            case TileType.VENDING_MACHINE:
                return <VendingMachineIcon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />;
            case TileType.VELVET_ROPE:
                return <VelvetRopeIcon className="w-10 h-10 text-cyan-600 dark:text-cyan-400 opacity-70" />;
            case TileType.LOO:
                return <LooIcon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />;
            case TileType.KITCHEN_UNIT:
                return <KitchenIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />;
            case TileType.BROOM_CABINET:
                return <BroomIcon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />;
            default:
                return null;
        }
    };

    const renderBackground = (type: TileType) => {
        const renderFloorWithPattern = (patternId: string) => (
            <svg width="100%" height="100%"><rect width="100%" height="100%" fill={`url(#${patternId})`} /></svg>
        );

        let specificStyling = '';
        let content = null;
        switch (type) {
            case TileType.WALL:
                specificStyling = 'bg-[#5e6675] dark:bg-[#3d4452] border-[0.5px] border-[#cbd5e1]/20 shadow-[0_0_0_1.5px_#5e6675] dark:shadow-[0_0_0_1.5px_#3d4452] !transition-none z-[1]';
                break;
            case TileType.BRICKS:
                content = renderFloorWithPattern('brick');
                specificStyling = 'border-2 border-slate-900/40 dark:border-red-950 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]';
                break;
            case TileType.FLOOR:
            case TileType.PRESSURE_PLATE_HIDDEN:
                specificStyling = 'bg-slate-200 dark:bg-gray-800 border border-slate-300/50 dark:border-gray-700/50'; break;
            case TileType.EXTERIOR:
                specificStyling = 'bg-slate-300 dark:bg-gray-900'; break;
            case TileType.FLOOR_WOOD: specificStyling = 'bg-slate-200 dark:bg-gray-800 border border-slate-300/50 dark:border-gray-700/50'; content = renderFloorWithPattern('wood'); break;
            case TileType.FLOOR_CEMENT: specificStyling = 'bg-slate-200 dark:bg-gray-800 border border-slate-300/50 dark:border-gray-700/50'; content = renderFloorWithPattern('cement'); break;
            case TileType.FLOOR_MARBLE: specificStyling = 'bg-slate-200 dark:bg-gray-800 border border-slate-300/50 dark:border-gray-700/50'; content = renderFloorWithPattern('marble'); break;
            case TileType.FLOOR_SLATE: specificStyling = 'bg-slate-200 dark:bg-gray-800 border border-slate-300/50 dark:border-gray-700/50'; content = renderFloorWithPattern('slate'); break;
            case TileType.FLOOR_CARPET: specificStyling = 'bg-slate-200 dark:bg-gray-800 border border-slate-300/50 dark:border-gray-700/50'; content = renderFloorWithPattern('carpet'); break;
            case TileType.FLOOR_TILES: specificStyling = 'bg-slate-200 dark:bg-gray-800 border border-slate-300/50 dark:border-gray-700/50'; content = renderFloorWithPattern('tiles'); break;
            default:
                // Fallback for unknown base tiles
                return <div className={`${baseStyle} bg-purple-500`}></div>;
        }
        return <div className={`${baseStyle} ${specificStyling}`}>{content}</div>;
    }

    const category = getTileCategory(type);
    let baseType: TileType | null = null;

    const terrainAndFlooring = [TileType.WALL, TileType.BRICKS, TileType.FLOOR, TileType.EXTERIOR, TileType.FLOOR_WOOD, TileType.FLOOR_CEMENT, TileType.FLOOR_MARBLE, TileType.FLOOR_SLATE, TileType.FLOOR_CARPET, TileType.FLOOR_TILES];

    // Determine if this tile is an "object" that needs a base layer rendered under it.
    if (!terrainAndFlooring.includes(type)) {
        if (category === 'onWall') {
            // Check Map layout to decide which base to use
            // For now, let's default back to WALL if we don't have access to the full map here,
            // OR we can try to guess.
            // Actually Tile component doesn't know its neighbor, but it usually renders 
            // over whatever we pass as baseType. 
            // Let's stick with WALL as the "structural" background for doors/cameras for now,
            // unless we want to change it.
            baseType = TileType.WALL;
        } else if (type === TileType.CAR || type === TileType.POLICE_CAR) {
            baseType = TileType.EXTERIOR;
        } else { // 'onFloor' objects and any other edge cases
            baseType = TileType.FLOOR;
        }
    }

    // Get the JSX for the tile's primary content (either its background or its icon).
    const primaryContentJsx = baseType ? renderIcon(type) : renderBackground(type);
    // Get the JSX for the base tile, if one is needed.
    const baseLayerJsx = baseType ? renderBackground(baseType) : null;

    return (
        <div className="relative w-full h-full">
            {baseLayerJsx}
            {primaryContentJsx && <div className={`${baseStyle} absolute inset-0`}>{primaryContentJsx}</div>}
            {isPrimaryTarget && (
                <PrimaryTargetIcon
                    className="absolute top-0 right-0 w-4 h-4 text-yellow-400"
                    style={{ filter: 'drop-shadow(0 0 3px black) drop-shadow(0 0 5px #fef08a)' }}
                />
            )}
            {isSecondaryTarget && (
                <SecondaryTargetIcon
                    className="absolute top-0 right-0 w-4 h-4 text-slate-300"
                    style={{ filter: 'drop-shadow(0 0 3px black) drop-shadow(0 0 4px #94a3b8)' }}
                />
            )}
        </div>
    );
});
Tile.displayName = 'Tile';
