// Import React for component creation and `React.memo` for optimization.
import * as React from 'react';
// Import type definitions to ensure type safety for props and state.
import { TileType, Camera } from '../types';
// Import all necessary icon components.
import { CameraIcon, DiamondIcon, KeyIcon, SafeIcon, CarIcon, PoliceCarIcon, AlarmIcon, CameraControlIcon, DoorOpenIcon, DoorClosedIcon, ArtPieceIcon, GoldBarsIcon, LaserPanelIcon, PressurePlateIcon, PressurePlatePanelIcon, TimeLockSafeIcon, TimeLockDoorIcon, CabinetIcon, StaticLockpickIcon, DeskIcon, ColumnIcon, PlantIcon, SculptureIcon, TellerCounterIcon, SofaIcon, FilingCabinetIcon, WaterCoolerIcon, VendingMachineIcon, VelvetRopeIcon, ComputerTerminalIcon, FoamIcon, JammedPanelIcon, CabinetOpenIcon, VaultDoorIcon, LooIcon, KitchenIcon, BroomIcon, PrimaryTargetIcon, SecondaryTargetIcon, LoopedCameraIcon, WindowIcon, WindowBrokenIcon } from './Icons';
import { getTileCategory } from '../lib/tiles'; // Import the category helper
import { IsoSprite } from './IsoSprite';

export const Tile: React.FC<{ type: TileType; alarmSystemActive: boolean; isPrimaryTarget?: boolean; isSecondaryTarget?: boolean; camera?: Camera; isIsometric?: boolean }> = React.memo(({ type, alarmSystemActive, isPrimaryTarget, isSecondaryTarget, camera, isIsometric }) => {
    const baseStyle = 'w-full h-full flex items-center justify-center transition-all duration-300';
    let specificStyling = '';
    let content: React.ReactNode = null;

    const renderFloorWithPattern = (patternId: string) => (
        <svg className="absolute inset-0 w-full h-full opacity-30">
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    );

    const renderIcon = (type: TileType) => {
        if (isIsometric) {
            switch (type) {
                // --- SECURITY ---
                case TileType.CAMERA: case TileType.CAMERA_DISABLED:
                    return <IsoSprite topColor="#facc15" leftColor="#92400e" rightColor="#b45309" thickness={14} scale={0.25} offsetY={-18} className="z-10" useGradient gradientId={`cam-${type}`} topHighlight="#fef08a" edgeColor="rgba(0,0,0,0.5)" />;
                case TileType.ALARM_BOX: case TileType.ALARM_BOX_DISABLED:
                    return <IsoSprite topColor={type === TileType.ALARM_BOX ? "#ef4444" : "#22c55e"} leftColor="#7f1d1d" rightColor="#991b1b" thickness={10} scale={0.3} offsetY={-14} className="z-10" useGradient gradientId={`alarm-${type}`} />;
                case TileType.LASER_CONTROL_PANEL: case TileType.LASER_CONTROL_PANEL_DISABLED: case TileType.LASER_CONTROL_PANEL_JAMMED:
                    return <IsoSprite topColor="#f87171" leftColor="#450a0a" rightColor="#7f1d1d" thickness={12} scale={0.35} offsetY={-12} className="z-10" useGradient gradientId={`laser-${type}`} topHighlight="#fca5a5" />;
                case TileType.PRESSURE_PLATE_PANEL: case TileType.PRESSURE_PLATE_PANEL_DISABLED:
                    return <IsoSprite topColor="#f97316" leftColor="#431407" rightColor="#7c2d12" thickness={10} scale={0.3} offsetY={-14} className="z-10" useGradient gradientId={`pp-${type}`} />;
                case TileType.CAMERA_CONTROL_PANEL: case TileType.CAMERA_CONTROL_PANEL_DISABLED:
                    return <IsoSprite topColor="#3b82f6" leftColor="#1e3a8a" rightColor="#1d4ed8" thickness={18} scale={0.75} offsetY={-4} className="z-10" useGradient gradientId={`ccp-${type}`} topHighlight="#93c5fd" />;
                case TileType.COMPUTER_TERMINAL: case TileType.COMPUTER_TERMINAL_HACKED:
                    return <IsoSprite topColor={type === TileType.COMPUTER_TERMINAL ? "#60a5fa" : "#4ade80"} leftColor="#1e3a8a" rightColor="#1d4ed8" thickness={20} scale={0.7} offsetY={-2} className="z-10" useGradient gradientId={`term-${type}`} topHighlight={type === TileType.COMPUTER_TERMINAL ? "#bfdbfe" : "#bbf7d0"} />;

                // --- DOORS ---
                case TileType.DOOR_CLOSED:
                    return <IsoSprite topColor="#92400e" leftColor="#451a03" rightColor="#78350f" thickness={30} scale={0.5} offsetY={-6} className="z-10" useGradient gradientId="door-c" topHighlight="#b45309" edgeColor="rgba(0,0,0,0.4)" />;
                case TileType.DOOR_LOCKED: case TileType.DOOR_LOCKED_ALARMED:
                    return <IsoSprite topColor={type === TileType.DOOR_LOCKED_ALARMED ? "#dc2626" : "#78350f"} leftColor="#451a03" rightColor="#78350f" thickness={32} scale={0.5} offsetY={-6} className="z-10" useGradient gradientId={`door-l-${type}`} topHighlight={type === TileType.DOOR_LOCKED_ALARMED ? "#f87171" : "#92400e"} edgeColor={type === TileType.DOOR_LOCKED_ALARMED ? "rgba(220,38,38,0.6)" : "rgba(0,0,0,0.4)"} />;
                case TileType.DOOR_OPEN: case TileType.DOOR_SMASHED:
                    return <IsoSprite topColor={type === TileType.DOOR_OPEN ? "#65a30d" : "#78716c"} leftColor={type === TileType.DOOR_OPEN ? "#365314" : "#44403c"} rightColor={type === TileType.DOOR_OPEN ? "#4d7c0f" : "#57534e"} thickness={4} scale={0.7} offsetY={2} className="z-10" useGradient gradientId={`door-o-${type}`} />;

                // --- WINDOWS ---
                case TileType.WINDOW:
                    return <IsoSprite topColor="#7dd3fc" leftColor="#0c4a6e" rightColor="#075985" thickness={30} scale={0.5} offsetY={-6} className="z-10" useGradient gradientId="window" topHighlight="#bae6fd" opacity={0.85} />;
                case TileType.WINDOW_BROKEN:
                    return <IsoSprite topColor="#78716c" leftColor="#292524" rightColor="#44403c" thickness={28} scale={0.5} offsetY={-6} className="z-10" useGradient gradientId="window-b" />;

                // --- TREASURE CONTAINERS ---
                case TileType.DISPLAY_CASE: case TileType.DISPLAY_CASE_ALARMED:
                    return <IsoSprite topColor={type === TileType.DISPLAY_CASE_ALARMED ? "#fecdd3" : "#cffafe"} leftColor="#155e75" rightColor="#0e7490" thickness={14} scale={0.55} offsetY={0} className="z-10" useGradient gradientId={`dc-${type}`} topHighlight={type === TileType.DISPLAY_CASE_ALARMED ? "#ffe4e6" : "#ecfeff"} opacity={0.85} edgeColor={type === TileType.DISPLAY_CASE_ALARMED ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.3)"} />;
                case TileType.DISPLAY_CASE_SMASHED: case TileType.DISPLAY_CASE_OPENED: case TileType.DISPLAY_CASE_ROBBED:
                    return <IsoSprite topColor={type === TileType.DISPLAY_CASE_ROBBED ? "#86efac" : "#fef08a"} leftColor="#155e75" rightColor="#0e7490" thickness={10} scale={0.55} offsetY={0} className="z-10" useGradient gradientId={`dc-s-${type}`} opacity={0.75} />;

                case TileType.SAFE: case TileType.SAFE_ALARMED: case TileType.SAFE_TIMELOCK:
                    return <IsoSprite topColor="#6b7280" leftColor="#1f2937" rightColor="#374151" thickness={22} scale={0.6} offsetY={0} className="z-10" useGradient gradientId={`safe-${type}`} topHighlight="#9ca3af" edgeColor={type === TileType.SAFE_ALARMED ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.5)"} edgeWidth={1.2} />;
                case TileType.SAFE_OPENED: case TileType.SAFE_SMASHED: case TileType.SAFE_ROBBED:
                    return <IsoSprite topColor={type === TileType.SAFE_ROBBED ? "#4ade80" : "#d4d4d8"} leftColor="#1f2937" rightColor="#374151" thickness={18} scale={0.6} offsetY={0} className="z-10" useGradient gradientId={`safe-o-${type}`} />;

                case TileType.VAULT_DOOR: case TileType.VAULT_DOOR_TIMELOCK:
                    return <IsoSprite topColor="#a8a29e" leftColor="#292524" rightColor="#44403c" thickness={34} scale={0.7} offsetY={-4} className="z-10" useGradient gradientId={`vault-${type}`} topHighlight="#d6d3d1" edgeColor="rgba(0,0,0,0.6)" edgeWidth={1.5} />;

                // --- FURNITURE ---
                case TileType.DESK:
                    return <IsoSprite topColor="#92400e" leftColor="#451a03" rightColor="#78350f" thickness={14} scale={0.75} offsetY={0} className="z-10" useGradient gradientId="desk" topHighlight="#b45309" />;
                case TileType.CABINET: case TileType.CABINET_ALARMED:
                    return <IsoSprite topColor="#a8a29e" leftColor="#44403c" rightColor="#57534e" thickness={22} scale={0.7} offsetY={0} className="z-10" useGradient gradientId={`cab-${type}`} topHighlight="#d6d3d1" edgeColor={type === TileType.CABINET_ALARMED ? "rgba(220,38,38,0.4)" : "rgba(0,0,0,0.3)"} />;
                case TileType.CABINET_OPEN: case TileType.CABINET_ROBBED:
                    return <IsoSprite topColor={type === TileType.CABINET_ROBBED ? "#86efac" : "#fbbf24"} leftColor="#44403c" rightColor="#57534e" thickness={20} scale={0.7} offsetY={0} className="z-10" useGradient gradientId={`cab-o-${type}`} />;
                case TileType.FILING_CABINET:
                    return <IsoSprite topColor="#94a3b8" leftColor="#334155" rightColor="#475569" thickness={24} scale={0.65} offsetY={0} className="z-10" useGradient gradientId="fcab" topHighlight="#cbd5e1" />;
                case TileType.SOFA:
                    return <IsoSprite topColor="#7c3aed" leftColor="#4c1d95" rightColor="#5b21b6" thickness={12} scale={0.8} offsetY={0} className="z-10" useGradient gradientId="sofa" topHighlight="#a78bfa" />;
                case TileType.TELLER_COUNTER: case TileType.TELLER_COUNTER_ROBBED:
                    return <IsoSprite topColor={type === TileType.TELLER_COUNTER_ROBBED ? "#86efac" : "#d97706"} leftColor="#78350f" rightColor="#92400e" thickness={16} scale={0.85} offsetY={0} className="z-10" useGradient gradientId={`tell-${type}`} topHighlight={type === TileType.TELLER_COUNTER_ROBBED ? "#bbf7d0" : "#fbbf24"} />;
                case TileType.COLUMN:
                    return <IsoSprite topColor="#e2e8f0" leftColor="#64748b" rightColor="#94a3b8" thickness={36} scale={0.25} offsetY={0} className="z-10" useGradient gradientId="col" topHighlight="#f1f5f9" />;

                // --- DECORATIVE ---
                case TileType.PLANT:
                    return <IsoSprite topColor="#22c55e" leftColor="#14532d" rightColor="#166534" thickness={18} scale={0.35} offsetY={0} className="z-10" useGradient gradientId="plant" topHighlight="#4ade80" />;
                case TileType.SCULPTURE:
                    return <IsoSprite topColor="#e2e8f0" leftColor="#64748b" rightColor="#94a3b8" thickness={26} scale={0.35} offsetY={0} className="z-10" useGradient gradientId="sculp" topHighlight="#f8fafc" />;
                case TileType.STATUE: case TileType.STATUE_ALARMED: case TileType.STATUE_ROBBED:
                    return <IsoSprite topColor={type === TileType.STATUE_ROBBED ? "#86efac" : "#f1f5f9"} leftColor="#64748b" rightColor="#94a3b8" thickness={28} scale={0.35} offsetY={0} className="z-10" useGradient gradientId={`stat-${type}`} topHighlight={type === TileType.STATUE_ROBBED ? "#bbf7d0" : "#ffffff"} edgeColor={type === TileType.STATUE_ALARMED ? "rgba(220,38,38,0.4)" : "rgba(0,0,0,0.3)"} />;
                case TileType.WATER_COOLER:
                    return <IsoSprite topColor="#e0f2fe" leftColor="#0c4a6e" rightColor="#075985" thickness={22} scale={0.3} offsetY={0} className="z-10" useGradient gradientId="wc" topHighlight="#f0f9ff" />;
                case TileType.VENDING_MACHINE:
                    return <IsoSprite topColor="#818cf8" leftColor="#312e81" rightColor="#3730a3" thickness={28} scale={0.45} offsetY={0} className="z-10" useGradient gradientId="vend" topHighlight="#a5b4fc" />;
                case TileType.VELVET_ROPE:
                    return <IsoSprite topColor="#be123c" leftColor="#4c0519" rightColor="#881337" thickness={10} scale={0.3} offsetY={0} className="z-10" useGradient gradientId="velv" topHighlight="#f43f5e" />;
                case TileType.LOO:
                    return <IsoSprite topColor="#f1f5f9" leftColor="#94a3b8" rightColor="#cbd5e1" thickness={12} scale={0.4} offsetY={0} className="z-10" useGradient gradientId="loo" />;
                case TileType.KITCHEN_UNIT:
                    return <IsoSprite topColor="#e2e8f0" leftColor="#475569" rightColor="#64748b" thickness={16} scale={0.8} offsetY={0} className="z-10" useGradient gradientId="kitchen" topHighlight="#f1f5f9" />;
                case TileType.BROOM_CABINET:
                    return <IsoSprite topColor="#a8a29e" leftColor="#44403c" rightColor="#57534e" thickness={26} scale={0.35} offsetY={0} className="z-10" useGradient gradientId="broom" />;

                // --- TREASURE ITEMS ---
                case TileType.GOLD_BARS: case TileType.GOLD_BARS_ALARMED: case TileType.GOLD_BARS_ROBBED:
                    return <IsoSprite topColor={type === TileType.GOLD_BARS_ROBBED ? "#86efac" : "#fbbf24"} leftColor="#92400e" rightColor="#b45309" thickness={6} scale={0.45} offsetY={2} className="z-10" useGradient gradientId={`gold-${type}`} topHighlight={type === TileType.GOLD_BARS_ROBBED ? "#bbf7d0" : "#fde68a"} edgeColor={type === TileType.GOLD_BARS_ALARMED ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.3)"} />;
                case TileType.ART_PIECE: case TileType.ART_PIECE_ALARMED: case TileType.ART_PIECE_ROBBED:
                    return <IsoSprite topColor={type === TileType.ART_PIECE_ROBBED ? "#86efac" : "#818cf8"} leftColor="#312e81" rightColor="#3730a3" thickness={20} scale={0.15} offsetY={0} className="z-10" useGradient gradientId={`art-${type}`} topHighlight={type === TileType.ART_PIECE_ROBBED ? "#bbf7d0" : "#c7d2fe"} edgeColor={type === TileType.ART_PIECE_ALARMED ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.3)"} />;

                // --- PRESSURE PLATES ---
                case TileType.PRESSURE_PLATE: case TileType.PRESSURE_PLATE_HIDDEN:
                    return <IsoSprite topColor="#f97316" leftColor="#7c2d12" rightColor="#9a3412" thickness={2} scale={0.7} offsetY={4} className="z-10" useGradient gradientId={`pp-t-${type}`} topHighlight="#fdba74" />;
                case TileType.PRESSURE_PLATE_DISABLED:
                    return <IsoSprite topColor="#22c55e" leftColor="#14532d" rightColor="#166534" thickness={2} scale={0.7} offsetY={4} className="z-10" useGradient gradientId="pp-dis" />;
                case TileType.FOAMED_PRESSURE_PLATE:
                    return <IsoSprite topColor="#e2e8f0" leftColor="#94a3b8" rightColor="#cbd5e1" thickness={4} scale={0.7} offsetY={3} className="z-10" useGradient gradientId="pp-foam" topHighlight="#f8fafc" />;

                // --- VEHICLES ---
                case TileType.POLICE_CAR:
                    return <IsoSprite topColor="#3b82f6" leftColor="#1e3a8a" rightColor="#1d4ed8" thickness={14} scale={1.1} offsetY={0} className="z-10" useGradient gradientId="police" topHighlight="#93c5fd" edgeColor="rgba(0,0,0,0.5)" />;
                case TileType.CAR:
                    return <IsoSprite topColor="#fbbf24" leftColor="#78350f" rightColor="#92400e" thickness={14} scale={1.1} offsetY={0} className="z-10" useGradient gradientId="car" topHighlight="#fde68a" edgeColor="rgba(0,0,0,0.4)" />;
            }
        }
        
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
        if (isIsometric && type === TileType.WALL) {
            return <IsoSprite topColor="#94a3b8" leftColor="#334155" rightColor="#475569" thickness={44} className="z-20" useGradient gradientId="wall" topHighlight="#cbd5e1" edgeColor="rgba(0,0,0,0.25)" edgeWidth={0.6} />;
        }

        if (isIsometric && type === TileType.BRICKS) {
            return <IsoSprite topColor="#a8a29e" leftColor="#57534e" rightColor="#78716c" thickness={44} className="z-20" useGradient gradientId="brick" topHighlight="#d6d3d1" edgeColor="rgba(120,80,40,0.3)" edgeWidth={0.8} />;
        }
        
        if (isIsometric) {
            // Different floor types get distinct colors and subtle gradient shading
            switch (type) {
                case TileType.FLOOR:
                case TileType.PRESSURE_PLATE_HIDDEN:
                    return <IsoSprite topColor="#e2e8f0" leftColor="#94a3b8" rightColor="#cbd5e1" thickness={6} className="z-0" scale={1.01} useGradient gradientId="floor" topHighlight="#f1f5f9" edgeColor="rgba(0,0,0,0.1)" edgeWidth={0.5} />;
                case TileType.FLOOR_WOOD:
                    return <IsoSprite topColor="#b45309" leftColor="#78350f" rightColor="#92400e" thickness={6} className="z-0" scale={1.01} useGradient gradientId="fwood" topHighlight="#d97706" edgeColor="rgba(60,30,10,0.2)" edgeWidth={0.5} />;
                case TileType.FLOOR_CEMENT:
                    return <IsoSprite topColor="#a8a29e" leftColor="#78716c" rightColor="#a8a29e" thickness={6} className="z-0" scale={1.01} useGradient gradientId="fcement" topHighlight="#d6d3d1" edgeColor="rgba(0,0,0,0.1)" edgeWidth={0.5} />;
                case TileType.FLOOR_MARBLE:
                    return <IsoSprite topColor="#e2e8f0" leftColor="#94a3b8" rightColor="#cbd5e1" thickness={6} className="z-0" scale={1.01} useGradient gradientId="fmarble" topHighlight="#f8fafc" edgeColor="rgba(0,0,0,0.08)" edgeWidth={0.5} />;
                case TileType.FLOOR_SLATE:
                    return <IsoSprite topColor="#64748b" leftColor="#334155" rightColor="#475569" thickness={6} className="z-0" scale={1.01} useGradient gradientId="fslate" topHighlight="#94a3b8" edgeColor="rgba(0,0,0,0.15)" edgeWidth={0.5} />;
                case TileType.FLOOR_CARPET:
                    return <IsoSprite topColor="#991b1b" leftColor="#7f1d1d" rightColor="#991b1b" thickness={6} className="z-0" scale={1.01} useGradient gradientId="fcarpet" topHighlight="#b91c1c" edgeColor="rgba(80,10,10,0.15)" edgeWidth={0.5} />;
                case TileType.FLOOR_TILES:
                    return <IsoSprite topColor="#d4d4d8" leftColor="#a1a1aa" rightColor="#d4d4d8" thickness={6} className="z-0" scale={1.01} useGradient gradientId="ftiles" topHighlight="#e4e4e7" edgeColor="rgba(0,0,0,0.12)" edgeWidth={0.5} />;
                case TileType.EXTERIOR:
                    return <IsoSprite topColor="#78716c" leftColor="#44403c" rightColor="#57534e" thickness={4} className="z-0" scale={1.01} useGradient gradientId="exterior" topHighlight="#a8a29e" edgeColor="rgba(0,0,0,0.08)" edgeWidth={0.4} />;
                default:
                    return <IsoSprite topColor="#e2e8f0" leftColor="#94a3b8" rightColor="#cbd5e1" thickness={6} className="z-0" scale={1.01} useGradient gradientId="fdefault" topHighlight="#f1f5f9" edgeColor="rgba(0,0,0,0.1)" edgeWidth={0.5} />;
            }
        }
        
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
        <div className={`relative w-full h-full`}>
            {baseLayerJsx}
            {primaryContentJsx && (
                <div className={isIsometric ? 'absolute inset-0' : `${baseStyle} absolute inset-0`}>
                    {primaryContentJsx}
                </div>
            )}
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
