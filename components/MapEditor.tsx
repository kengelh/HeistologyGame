
/**
 * @file MapEditor.tsx
 * @description
 * This component provides a fully integrated map editor for creating and modifying game scenarios.
 * It allows users to "paint" tiles, place and configure security systems (cameras, guards, lasers),
 * and set treasure values. The editor manages its own complex state during an editing session
 * and uses callbacks to save the final result back to the main application's state and database.
 */

// Import React for component creation and hooks like useState, useEffect, useCallback.
import * as React from 'react';

// Import type definitions for all game objects that can be edited.
import { TileType, Camera, Guard, LaserGrid, PressurePlate, TimeLock, Scenario, T } from '../types';

// Import rendering constants.
import { TILE_SIZE, GRID_HEIGHT, GRID_WIDTH } from '../constants';

// Import all necessary icon components for the toolbar and map display.
import { MoneyIcon, CameraIcon, DiamondIcon, KeyIcon, SafeIcon, CarIcon, AlarmIcon, CameraControlIcon, DoorOpenIcon, DoorClosedIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArtPieceIcon, GoldBarsIcon, PatrolIcon, GuardIcon, UndoIcon, LaserPanelIcon, PressurePlateIcon, PressurePlatePanelIcon, TimeLockSafeIcon, TimeLockDoorIcon, CabinetIcon, StaticLockpickIcon, DeskIcon, ColumnIcon, PlantIcon, SculptureIcon, TellerCounterIcon, SofaIcon, FilingCabinetIcon, WaterCoolerIcon, VendingMachineIcon, VelvetRopeIcon, FloorPatternDefs, EraserIcon, LaserBeamIcon, ComputerTerminalIcon, VaultDoorIcon, LooIcon, KitchenIcon, BroomIcon, PrimaryTargetIcon, SecondaryTargetIcon, PlayerIcon, WindowIcon, WindowBrokenIcon } from './Icons';
// Import the new shared Tile component.
import { Tile } from './Tile';

// Import a specialized pathfinding function for calculating guard patrol routes within the editor.
import { findShortestPathForEditor, calculatePatrolRoute } from '../lib/pathfinding';

// Import a utility function to check if a tile is part of the building's interior.
import { isInterior, getTileCategory, findCarPosition, isExteriorTile, isEnclosed, validateCarPlacement } from '../lib/tiles';

/**
 * Defines the props for the integrated MapEditor component.
 * It receives initial data from the main App component and uses callbacks (`onSaveAndClose`, `onCancel`)
 * to communicate the results or user's intent back to the App, which manages the screen flow.
 */
interface MapEditorProps {
    scenario: Scenario;
    onSaveAndClose: (data: { name: string, description: string, map: TileType[][], cameras: Camera[], guards: Guard[], treasures: { [key: string]: number }, laserGrids: LaserGrid[], pressurePlates: PressurePlate[], timeLocks: TimeLock[], speedRunTime: number, primaryTarget?: { x: number, y: number }, secondaryTarget?: { x: number, y: number }, startPositions: { x: number, y: number }[] }) => void; // Callback to save the edited data.
    onCancel: () => void; // Callback to exit the editor without saving.
}

// A simplified camera type for the editor, omitting the 'disabled' property as it's not relevant here.
type EditorCamera = Omit<Camera, 'disabled'>;
// A type to represent a snapshot of the entire editable state, used for the undo history.
type EditorState = { map: TileType[][], cameras: EditorCamera[], guards: Guard[], treasures: { [key: string]: number }, laserGrids: LaserGrid[], pressurePlates: PressurePlate[], timeLocks: TimeLock[], speedRunTime: number, primaryTarget?: { x: number, y: number }, secondaryTarget?: { x: number, y: number }, startPositions: { x: number, y: number }[] };

/**
 * Calculates the surveillance pattern for a camera based on its position and orientation.
 * This is used to show a visual preview of where a placed camera will be looking.
 * @param {number} cx - The camera's x-coordinate.
 * @param {number} cy - The camera's y-coordinate.
 * @param {'up' | 'down' | 'left' | 'right'} orientation - The direction the camera is facing.
 * @param {number} mapWidth - The width of the current map.
 * @param {number} mapHeight - The height of the current map.
 * @returns { {x: number, y: number}[][] } An array of arrays representing the camera's panning pattern.
 */
const getCameraPattern = (cx: number, cy: number, orientation: 'up' | 'down' | 'left' | 'right', mapWidth: number, mapHeight: number): { x: number, y: number }[][] => {
    const pattern: { x: number, y: number }[][] = [];
    let straight: { x: number, y: number }[], left: { x: number, y: number }[], right: { x: number, y: number }[];

    switch (orientation) {
        case 'up':
            straight = [{ x: cx, y: cy - 1 }, { x: cx, y: cy - 2 }]; left = [{ x: cx - 1, y: cy - 1 }]; right = [{ x: cx + 1, y: cy - 1 }]; break;
        case 'down':
            straight = [{ x: cx, y: cy + 1 }, { x: cx, y: cy + 2 }]; left = [{ x: cx + 1, y: cy + 1 }]; right = [{ x: cx - 1, y: cy + 1 }]; break;
        case 'left':
            straight = [{ x: cx - 1, y: cy }, { x: cx - 2, y: cy }]; left = [{ x: cx - 1, y: cy + 1 }]; right = [{ x: cx - 1, y: cy - 1 }]; break;
        case 'right':
            straight = [{ x: cx + 1, y: cy }, { x: cx + 2, y: cy }]; left = [{ x: cx + 1, y: cy - 1 }]; right = [{ x: cx + 1, y: cy - 1 }]; break;
    }

    // A simple 4-step pan pattern: straight, left, straight, right.
    pattern.push(straight); pattern.push(left); pattern.push(straight); pattern.push(right);

    // Filter out any pattern coordinates that are off the map.
    const boundsCheck = (p: { x: number, y: number }) => p.x >= 0 && p.x < mapWidth && p.y >= 0 && p.y < mapHeight;
    return pattern.map(frame => frame.filter(boundsCheck));
};

/**
 * A reusable button for the editor's toolbar, handling its own selected/deselected styles.
 */
const ToolButton: React.FC<{ tool: any; selectedTool: any; onClick: (tool: any) => void; title: string; children: React.ReactNode; }> = ({ tool, selectedTool, onClick, title, children }) => (
    <button
        onClick={() => onClick(tool)}
        className={`group relative h-12 w-12 p-1 border-2 rounded-md transition-all flex items-center justify-center
            ${selectedTool === tool
                ? 'border-yellow-400 scale-105 shadow-lg ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800'
                : 'border-gray-600 hover:border-cyan-400'}`}
        aria-label={title}
    >
        {children}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {title}
        </span>
    </button>
);

/**
 * The main component for the integrated map editor.
 */
export const MapEditor: React.FC<MapEditorProps> = ({ scenario, onSaveAndClose, onCancel }) => {
    // Ref for the scrollable map container
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    // Ref to track if initial camera centering has occurred
    const hasCentered = React.useRef(false);

    // --- State Management ---
    // State for all editable map data.
    const [map, setMap] = React.useState<TileType[][]>([]);
    const [cameras, setCameras] = React.useState<EditorCamera[]>([]);
    const [guards, setGuards] = React.useState<Guard[]>([]);
    const [laserGrids, setLaserGrids] = React.useState<LaserGrid[]>([]);
    const [pressurePlates, setPressurePlates] = React.useState<PressurePlate[]>([]);
    const [timeLocks, setTimeLocks] = React.useState<TimeLock[]>([]);
    const [treasures, setTreasures] = React.useState<{ [key: string]: number }>({});
    const [speedRunTime, setSpeedRunTime] = React.useState<number>(120);
    const [scenarioName, setScenarioName] = React.useState('');
    const [scenarioDescription, setScenarioDescription] = React.useState('');
    const [primaryTarget, setPrimaryTarget] = React.useState<{ x: number, y: number } | undefined>(undefined);
    const [secondaryTarget, setSecondaryTarget] = React.useState<{ x: number, y: number } | undefined>(undefined);
    const [startPositions, setStartPositions] = React.useState<{ x: number, y: number }[]>([]);
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

    // State for the undo history. It stores snapshots of the entire editor state.
    const [history, setHistory] = React.useState<EditorState[]>([]);

    // State for the currently selected tool from the toolbar.
    type SelectedTool = TileType | 'camera_up' | 'camera_down' | 'camera_left' | 'camera_right' | 'treasure_value' | 'guard_patrol' | 'laser_beam' | 'eraser' | 'mark_primary' | 'mark_secondary' | 'start_position';
    const [selectedTool, setSelectedTool] = React.useState<SelectedTool>(TileType.WALL);

    // State for tracking mouse clicks to enable click-and-drag painting.
    const [isMouseDown, setIsMouseDown] = React.useState(false);
    // State for temporarily storing waypoints of a guard patrol as it's being created.
    const [activePatrolWaypoints, setActivePatrolWaypoints] = React.useState<{ x: number, y: number }[]>([]);
    // State for temporarily storing the laser grid being actively drawn.
    const [activeLaserGrid, setActiveLaserGrid] = React.useState<{ controlPanel: { x: number, y: number }, beamTiles: { x: number, y: number }[] } | null>(null);

    // State for the treasure value editing modal.
    const [editingValueTarget, setEditingValueTarget] = React.useState<{ x: number, y: number } | null>(null);
    const [currentEditValue, setCurrentEditValue] = React.useState<string>("");
    const [currentEditHasKey, setCurrentEditHasKey] = React.useState<boolean>(false);

    // State for the laser grid timer editing modal.
    const [editingLaser, setEditingLaser] = React.useState<LaserGrid | null>(null);
    const [isLaserTimed, setIsLaserTimed] = React.useState(false);
    const [laserOnTime, setLaserOnTime] = React.useState("5");
    const [laserOffTime, setLaserOffTime] = React.useState("5");

    // NEW state for the export modal.
    const [isExportModalVisible, setIsExportModalVisible] = React.useState(false);
    const [exportCode, setExportCode] = React.useState('');
    const [copyButtonText, setCopyButtonText] = React.useState('Copy to Clipboard');

    // NEW state for the parameters modal.
    const [isParameterModalVisible, setIsParameterModalVisible] = React.useState(false);
    const [tempName, setTempName] = React.useState('');
    const [tempDescription, setTempDescription] = React.useState('');
    const [tempSpeedRunTime, setTempSpeedRunTime] = React.useState('');


    /**
     * This `useEffect` hook resets the editor's state whenever a new scenario is loaded.
     * This is critical for ensuring that if a user edits one map and then another, the editor
     * starts fresh with the new map's data.
     */
    React.useEffect(() => {
        setMap(JSON.parse(JSON.stringify(scenario.map)));
        setCameras(JSON.parse(JSON.stringify(scenario.cameras)));
        setGuards(JSON.parse(JSON.stringify(scenario.guards || [])));
        setLaserGrids(JSON.parse(JSON.stringify(scenario.laserGrids || [])));
        setPressurePlates(JSON.parse(JSON.stringify(scenario.pressurePlates || [])));
        setTimeLocks(JSON.parse(JSON.stringify(scenario.timeLocks || [])));
        setTreasures(JSON.parse(JSON.stringify(scenario.treasures)));
        setSpeedRunTime(scenario.speedRunTime);
        setScenarioName(scenario.name);
        setScenarioDescription(scenario.description);
        setPrimaryTarget(scenario.primaryTarget);
        setPrimaryTarget(scenario.primaryTarget);
        setSecondaryTarget(scenario.secondaryTarget);

        // Initialize start positions
        if (scenario.startPositions && scenario.startPositions.length > 0) {
            setStartPositions(JSON.parse(JSON.stringify(scenario.startPositions)));
        } else {
            // Default: Try to place left and right of car
            const carPos = findCarPosition(scenario.map);
            if (carPos) {
                const defaults: { x: number, y: number }[] = [];
                // Left of car
                if (carPos.x > 0 && isExteriorTile(scenario.map[carPos.y][carPos.x - 1])) {
                    defaults.push({ x: carPos.x - 1, y: carPos.y });
                }
                // Right of car
                if (carPos.x < scenario.map[0].length - 1 && isExteriorTile(scenario.map[carPos.y][carPos.x + 1])) {
                    defaults.push({ x: carPos.x + 1, y: carPos.y });
                }
                setStartPositions(defaults);
            } else {
                setStartPositions([]);
            }
        }

        setHistory([]); // Clear undo history for the new map.
        hasCentered.current = false;
    }, [scenario]);

    /**
     * Run validation whenever the map changes
     */
    React.useEffect(() => {
        if (map.length > 0) {
            setValidationErrors(validateCarPlacement(map));
        }
    }, [map]);

    /**
     * Auto-center on car when map loads
     */
    React.useEffect(() => {
        if (mapContainerRef.current && map.length > 0 && !hasCentered.current) {
            const carPos = findCarPosition(map);
            if (carPos) {
                const container = mapContainerRef.current;
                const carX = carPos.x * TILE_SIZE;
                const carY = carPos.y * TILE_SIZE;

                // Calculate scroll position to center the car
                const scrollLeft = carX - container.clientWidth / 2 + TILE_SIZE / 2;
                const scrollTop = carY - container.clientHeight / 2 + TILE_SIZE / 2;

                container.scrollTo({
                    left: scrollLeft,
                    top: scrollTop,
                    behavior: 'smooth'
                });
            } else {
                // If no car, center on the middle of the map
                const container = mapContainerRef.current;
                const mapCenterX = (map[0].length * TILE_SIZE) / 2;
                const mapCenterY = (map.length * TILE_SIZE) / 2;

                const scrollLeft = mapCenterX - container.clientWidth / 2;
                const scrollTop = mapCenterY - container.clientHeight / 2;

                container.scrollTo({
                    left: scrollLeft,
                    top: scrollTop,
                    behavior: 'smooth'
                });
            }
            hasCentered.current = true;
        }
    }, [map, mapContainerRef]); // Run when map changes (initial load)

    /**
     * Pushes the current state of all editable data onto the history stack.
     * This is called before any modification to enable the undo functionality.
     */
    const pushToHistory = React.useCallback(() => {
        setHistory(prev => [...prev, {
            map: JSON.parse(JSON.stringify(map)),
            cameras: JSON.parse(JSON.stringify(cameras)),
            guards: JSON.parse(JSON.stringify(guards)),
            treasures: JSON.parse(JSON.stringify(treasures)),
            laserGrids: JSON.parse(JSON.stringify(laserGrids)),
            pressurePlates: JSON.parse(JSON.stringify(pressurePlates)),
            timeLocks: JSON.parse(JSON.stringify(timeLocks)),
            speedRunTime: speedRunTime,
            primaryTarget: primaryTarget,
            secondaryTarget: secondaryTarget,
            startPositions: JSON.parse(JSON.stringify(startPositions)),
        }]);
    }, [map, cameras, guards, treasures, laserGrids, pressurePlates, timeLocks, speedRunTime, primaryTarget, secondaryTarget]);

    /**
     * Reverts the editor state to the most recent state in the history stack.
     */
    const handleUndo = React.useCallback(() => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setMap(lastState.map);
        setCameras(lastState.cameras);
        setGuards(lastState.guards);
        setTreasures(lastState.treasures);
        setLaserGrids(lastState.laserGrids);
        setPressurePlates(lastState.pressurePlates);
        setTimeLocks(lastState.timeLocks);
        setSpeedRunTime(lastState.speedRunTime);
        setPrimaryTarget(lastState.primaryTarget);
        setSecondaryTarget(lastState.secondaryTarget);
        setStartPositions(lastState.startPositions);
        setHistory(history.slice(0, -1)); // Pop the last state from the history.
    }, [history]);

    /**
     * Finalizes the creation of a guard patrol route, calculating the full path and creating a new Guard object.
     * Supports both patrol routes (2+ waypoints) and stationary guards (1 waypoint).
     */
    const finalizeActivePatrol = React.useCallback(() => {
        if (activePatrolWaypoints.length >= 1) {
            pushToHistory(); // Save state before adding the new guard.

            // Ask if guard should carry a key
            const hasKey = window.confirm("Should this guard carry a key that can be pickpocketed?");

            // If only 1 waypoint, create a stationary guard
            if (activePatrolWaypoints.length === 1) {
                const newGuard: Guard = {
                    id: Date.now(),
                    name: `Guard ${guards.length + 1}`,
                    x: activePatrolWaypoints[0].x,
                    y: activePatrolWaypoints[0].y,
                    patrolWaypoints: activePatrolWaypoints,
                    patrolRoute: [],
                    patrolIndex: 0,
                    orientation: 'down',
                    status: 'patrolling',
                    time_to_next_move: 1,
                    isStationary: true,
                    panSequence: ['down', 'left', 'up', 'right'],
                    panIndex: 0,
                    panTimer: 3,
                    hasKey: hasKey || undefined,
                };
                setGuards(prev => [...prev, newGuard]);
            } else {
                // 2+ waypoints = patrol route
                const newGuard: Guard = {
                    id: Date.now(),
                    name: `Guard ${guards.length + 1}`,
                    x: activePatrolWaypoints[0].x,
                    y: activePatrolWaypoints[0].y,
                    patrolWaypoints: activePatrolWaypoints,
                    patrolRoute: calculatePatrolRoute(activePatrolWaypoints, map),
                    patrolIndex: 0,
                    orientation: 'down',
                    status: 'patrolling',
                    time_to_next_move: 1,
                    hasKey: hasKey || undefined,
                };
                setGuards(prev => [...prev, newGuard]);
            }
        }
        setActivePatrolWaypoints([]);
    }, [activePatrolWaypoints, map, pushToHistory, guards.length]);

    /**
     * Finalizes the creation of a laser grid and opens the timer configuration modal.
     */
    const finalizeActiveLaserGrid = React.useCallback(() => {
        if (activeLaserGrid && activeLaserGrid.beamTiles.length > 0) {
            pushToHistory();
            const newGrid: LaserGrid = {
                id: Date.now(),
                controlPanel: activeLaserGrid.controlPanel,
                beamTiles: activeLaserGrid.beamTiles,
            };
            // Remove any old grid that might have existed at this panel.
            setLaserGrids(prev => [...prev.filter(g => g.controlPanel.x !== newGrid.controlPanel.x || g.controlPanel.y !== newGrid.controlPanel.y), newGrid]);
            // Open the modal to configure this new grid.
            setEditingLaser(newGrid);
        }
        setActiveLaserGrid(null);
    }, [activeLaserGrid, pushToHistory]);

    /**
     * Handles selecting a new tool from the toolbar. It finalizes any in-progress creations
     * (like patrols or lasers) before switching tools.
     * @param {SelectedTool} tool - The new tool to be selected.
     */
    const handleToolSelection = (tool: SelectedTool) => {
        finalizeActivePatrol();
        finalizeActiveLaserGrid();
        setSelectedTool(tool);
    };

    /**
     * The core "painting" logic that modifies the grid based on the user's click and the selected tool.
     * This function handles tile placement, camera creation, patrol waypoint setting, and more.
     * @param {number} y - The y-coordinate of the clicked tile.
     * @param {number} x - The x-coordinate of the clicked tile.
     */
    const updateGrid = React.useCallback((y: number, x: number) => {
        const newMap = map.map(row => [...row]);

        // --- Handle special, non-tile-painting tools first ---

        if (selectedTool === 'mark_primary' || selectedTool === 'mark_secondary') {
            const tile = newMap[y][x];
            const isTreasure = tile.includes('DISPLAY_CASE') || tile.includes('SAFE') || tile.includes('ART_PIECE') || tile.includes('GOLD_BARS') || (tile.includes('CABINET') && !tile.includes('FILING') && !tile.includes('BROOM')) || tile === TileType.TELLER_COUNTER || tile.includes('STATUE');
            if (isTreasure) {
                pushToHistory();
                if (selectedTool === 'mark_primary') {
                    if (primaryTarget?.x === x && primaryTarget?.y === y) setPrimaryTarget(undefined);
                    else {
                        setPrimaryTarget({ x, y });
                        if (secondaryTarget?.x === x && secondaryTarget?.y === y) setSecondaryTarget(undefined);
                    }
                } else { // mark_secondary
                    if (secondaryTarget?.x === x && secondaryTarget?.y === y) setSecondaryTarget(undefined);
                    else {
                        setSecondaryTarget({ x, y });
                        if (primaryTarget?.x === x && primaryTarget?.y === y) setPrimaryTarget(undefined);
                    }
                }
            }
            return;
        }

        if (selectedTool === 'start_position') {
            const tile = newMap[y][x];

            // Toggle existing start position
            const existingIndex = startPositions.findIndex(p => p.x === x && p.y === y);
            if (existingIndex !== -1) {
                pushToHistory();
                setStartPositions(prev => prev.filter((_, i) => i !== existingIndex));
                return;
            }

            // Validate placement
            if (!isExteriorTile(tile)) {
                alert("Thieves must start on an exterior tile!");
                return;
            }

            if (isEnclosed({ x, y }, newMap)) {
                alert("Thieves cannot start in an enclosed space!");
                return;
            }

            // Add new start position
            pushToHistory();
            setStartPositions(prev => [...prev, { x, y }]);
            return;
        }

        if (selectedTool === 'eraser') {
            pushToHistory();

            // Check if we are clicking on a start position
            const startPosIndex = startPositions.findIndex(p => p.x === x && p.y === y);
            if (startPosIndex !== -1) {
                setStartPositions(prev => prev.filter((_, i) => i !== startPosIndex));
                return;
            }

            // Check if we are clicking on a guard's head (starting position)
            const guardToDeleteIndex = guards.findIndex(g => g.x === x && g.y === y);
            if (guardToDeleteIndex !== -1) {
                const newGuards = [...guards];
                newGuards.splice(guardToDeleteIndex, 1);
                setGuards(newGuards);
                return;
            }

            let guardErased = false;
            const newGuards = guards.map(guard => {
                if (!guard.patrolWaypoints) return guard;
                const waypointIndex = guard.patrolWaypoints.findIndex(wp => wp.x === x && wp.y === y);
                if (waypointIndex > -1) {
                    guardErased = true;
                    const newWaypoints = guard.patrolWaypoints.filter((_, index) => index !== waypointIndex);
                    // Guards should have at least 2 waypoints, or 1 if stationary. If < 1, delete.
                    if (newWaypoints.length < 1) return null;
                    return { ...guard, patrolWaypoints: newWaypoints, patrolRoute: calculatePatrolRoute(newWaypoints, newMap) };
                }
                return guard;
            }).filter(g => g !== null) as Guard[];
            if (guardErased) {
                setGuards(newGuards);
                return;
            }

            const tile = newMap[y][x];
            const category = getTileCategory(tile);
            if (category === 'onWall' || category === 'onFloor') {
                const baseTile = category === 'onWall' ? TileType.WALL : TileType.FLOOR;
                if (tile === TileType.CAMERA) setCameras(cams => cams.filter(cam => cam.x !== x || cam.y !== y));
                const coord = `${x}-${y}`;
                if (treasures[coord]) { const newTreasures = { ...treasures }; delete newTreasures[coord]; setTreasures(newTreasures); }
                if (tile === TileType.LASER_CONTROL_PANEL) setLaserGrids(grids => grids.filter(g => g.controlPanel.x !== x || g.controlPanel.y !== y));
                if (tile.includes('PLATE')) setPressurePlates(plates => plates.filter(p => p.x !== x || p.y !== y));
                if (tile.includes('TIMELOCK') || tile.includes('VAULT')) setTimeLocks(tls => tls.filter(tl => tl.x !== x || tl.y !== y));
                if (primaryTarget?.x === x && primaryTarget?.y === y) setPrimaryTarget(undefined);
                if (secondaryTarget?.x === x && secondaryTarget?.y === y) setSecondaryTarget(undefined);
                // Remove start position if tile is erased
                setStartPositions(prev => prev.filter(p => p.x !== x || p.y !== y));
                newMap[y][x] = baseTile;
            } else {
                newMap[y][x] = TileType.EXTERIOR;
            }
            setMap(newMap);
            return;
        }

        const isWalkableForPatrol = (tile: TileType) => [TileType.FLOOR, TileType.FLOOR_WOOD, TileType.FLOOR_CEMENT, TileType.FLOOR_MARBLE, TileType.FLOOR_SLATE, TileType.FLOOR_CARPET, TileType.FLOOR_TILES, TileType.DOOR_OPEN, TileType.DOOR_SMASHED, TileType.DOOR_CLOSED, TileType.EXTERIOR].includes(tile);
        if (selectedTool === 'guard_patrol') {
            if (isWalkableForPatrol(newMap[y][x])) setActivePatrolWaypoints(prev => [...prev, { x, y }]);
            return;
        }

        if (selectedTool === 'laser_beam') {
            if (!activeLaserGrid) {
                // Start drawing a new laser grid by clicking on its control panel.
                if (newMap[y][x] === TileType.LASER_CONTROL_PANEL) {
                    const existingGrid = laserGrids.find(g => g.controlPanel.x === x && g.controlPanel.y === y);
                    setActiveLaserGrid({ controlPanel: { x, y }, beamTiles: existingGrid?.beamTiles || [] });
                }
            } else {
                // Finish drawing by clicking the control panel again.
                if (activeLaserGrid.controlPanel.x === x && activeLaserGrid.controlPanel.y === y) {
                    finalizeActiveLaserGrid();
                } else if (newMap[y][x].startsWith('FLOOR')) {
                    const isFirstBeamTile = activeLaserGrid.beamTiles.length === 0;
                    const lastBeam = isFirstBeamTile
                        ? activeLaserGrid.controlPanel
                        : activeLaserGrid.beamTiles[activeLaserGrid.beamTiles.length - 1];

                    // The first beam tile can be placed anywhere on a floor. Subsequent tiles must be adjacent.
                    if (isFirstBeamTile || Math.abs(lastBeam.x - x) + Math.abs(lastBeam.y - y) === 1) {
                        const existingIndex = activeLaserGrid.beamTiles.findIndex(t => t.x === x && t.y === y);
                        if (existingIndex !== -1) {
                            // Clicking an existing tile truncates the beam path back to that point.
                            setActiveLaserGrid(prev => ({ ...prev!, beamTiles: prev!.beamTiles.slice(0, existingIndex + 1) }));
                        } else {
                            // Add a new tile to the beam path.
                            setActiveLaserGrid(prev => ({ ...prev!, beamTiles: [...prev!.beamTiles, { x, y }] }));
                        }
                    }
                }
            }
            return;
        }

        if (selectedTool === 'treasure_value') {
            const tile = newMap[y][x];
            const isTreasure = tile.includes('DISPLAY_CASE') || tile.includes('SAFE') || tile.includes('ART_PIECE') || tile.includes('GOLD_BARS') || (tile.includes('CABINET') && !tile.includes('FILING') && !tile.includes('BROOM')) || tile === TileType.TELLER_COUNTER || tile.includes('STATUE');
            if (isTreasure) {
                const coord = `${x}-${y}`;
                const treasureData = treasures[coord];
                const currentValue = typeof treasureData === 'number' ? treasureData : (treasureData?.value || 1000);
                const hasKey = typeof treasureData === 'object' && treasureData.containsKey;
                setCurrentEditValue(currentValue.toString());
                setCurrentEditHasKey(hasKey || false);
                setEditingValueTarget({ x, y });
            }
            return;
        }

        // --- Generic Tile Placement Logic from here ---
        const isCameraTool = typeof selectedTool === 'string' && selectedTool.startsWith('camera_');
        const tileToPlace = isCameraTool ? TileType.CAMERA : selectedTool as TileType;
        const currentTile = newMap[y][x];

        // Do nothing if trying to place the same tile.
        if (currentTile === tileToPlace) return;

        // --- PLACEMENT RULE ENFORCEMENT ---
        const categoryToPlace = getTileCategory(tileToPlace);
        const currentCategory = getTileCategory(currentTile);

        const isPlacingObject = categoryToPlace === 'onWall' || categoryToPlace === 'onFloor';
        const isCurrentTileObject = currentCategory === 'onWall' || currentCategory === 'onFloor';

        // Allow placing a base tile (wall, floor) over anything to erase.
        if (categoryToPlace === 'base') {
            // This is fine, it's an erase action.
        }
        // Allow placing an object over another object.
        else if (isPlacingObject && isCurrentTileObject) {
            // This is an overwrite, also fine.
        }
        // Standard placement rules for placing an object on a base tile.
        else if (isPlacingObject) {
            if (categoryToPlace === 'onWall') {
                // Wall items can be placed on walls, floors, or exterior.
                if (currentTile !== TileType.WALL && !currentTile.startsWith('FLOOR') && currentTile !== TileType.EXTERIOR) {
                    return;
                }
            } else if (categoryToPlace === 'onFloor') {
                // Floor items can be placed on floors or exterior.
                if (!currentTile.startsWith('FLOOR') && currentTile !== TileType.EXTERIOR) {
                    return;
                }
            }
        }

        // Handle special logic for tools with prompts (like time-locks)
        const isPlacingTimeLock = tileToPlace === TileType.SAFE_TIMELOCK || tileToPlace === TileType.VAULT_DOOR_TIMELOCK;
        if (isPlacingTimeLock) {
            const unlockTimeStr = prompt("Enter unlock time (seconds into heist):", "90");
            const lockTimeStr = prompt("Enter lock time (seconds into heist):", "120");
            const unlockTime = parseInt(unlockTimeStr || "90", 10);
            const lockTime = parseInt(lockTimeStr || "120", 10);

            if (!isNaN(unlockTime) && !isNaN(lockTime) && lockTime > unlockTime) {
                pushToHistory();
                const newTimeLock: TimeLock = { id: Date.now(), x, y, unlockTime, lockTime };
                setTimeLocks(prev => [...prev.filter(tl => tl.x !== x || tl.y !== y), newTimeLock]);
                newMap[y][x] = tileToPlace;
                setMap(newMap);
            }
            return;
        }

        pushToHistory();

        // --- DATA CLEANUP for the replaced tile ---
        if (currentTile === TileType.CAMERA) setCameras(cams => cams.filter(cam => cam.x !== x || cam.y !== y));
        if (currentTile === TileType.LASER_CONTROL_PANEL) setLaserGrids(grids => grids.filter(g => g.controlPanel.x !== x || g.controlPanel.y !== y));
        if (currentTile.includes('PLATE')) setPressurePlates(plates => plates.filter(p => p.x !== x || p.y !== y));
        if (currentTile.includes('TIMELOCK') || currentTile.includes('VAULT')) setTimeLocks(tls => tls.filter(tl => tl.x !== x || tl.y !== y));

        // --- DATA CREATION/MODIFICATION for the new tile ---
        if (isCameraTool) {
            const orientation = selectedTool.split('_')[1] as 'up' | 'down' | 'left' | 'right';
            const newCameras = cameras.filter(cam => cam.x !== x || cam.y !== y);
            const newCamera: EditorCamera = { id: Date.now(), x, y, orientation, pattern: getCameraPattern(x, y, orientation, newMap[0].length, newMap.length), period: 1 };
            setCameras([...newCameras, newCamera]);
        }

        const isPlacingPlate = tileToPlace === TileType.PRESSURE_PLATE || tileToPlace === TileType.PRESSURE_PLATE_HIDDEN;
        if (isPlacingPlate) {
            const newPlate: PressurePlate = { x, y };
            setPressurePlates(prev => [...prev.filter(p => p.x !== x || p.y !== y), newPlate]);
        }

        const coord = `${x}-${y}`;
        const isNowTreasure = tileToPlace.includes('DISPLAY_CASE') || tileToPlace.includes('SAFE') || tileToPlace.includes('ART_PIECE') || tileToPlace.includes('GOLD_BARS') || (tileToPlace.includes('CABINET') && !tileToPlace.includes('FILING') && !tileToPlace.includes('BROOM')) || tileToPlace === TileType.TELLER_COUNTER || tileToPlace.includes('STATUE');
        const wasTreasure = treasures[coord] !== undefined;
        if (isNowTreasure && !wasTreasure) {
            const defaultValue = tileToPlace === TileType.TELLER_COUNTER ? 250 : 1000;
            setTreasures(prev => ({ ...prev, [coord]: defaultValue }));
        } else if (!isNowTreasure && wasTreasure) {
            const newTreasures = { ...treasures };
            delete newTreasures[coord];
            setTreasures(newTreasures);
            if (primaryTarget?.x === x && primaryTarget?.y === y) setPrimaryTarget(undefined);
            if (secondaryTarget?.x === x && secondaryTarget?.y === y) setSecondaryTarget(undefined);
        }

        newMap[y][x] = tileToPlace;
        setMap(newMap);

    }, [map, cameras, treasures, laserGrids, pressurePlates, timeLocks, selectedTool, pushToHistory, activeLaserGrid, finalizeActiveLaserGrid, guards, activePatrolWaypoints, primaryTarget, secondaryTarget]);

    const handleValueEditSave = () => {
        if (!editingValueTarget) return;
        const newValue = parseInt(currentEditValue, 10);
        if (!isNaN(newValue) && newValue >= 0) {
            pushToHistory();
            const coord = `${editingValueTarget.x}-${editingValueTarget.y}`;
            // Save as object if has key, otherwise as number
            if (currentEditHasKey) {
                setTreasures(prev => ({ ...prev, [coord]: { value: newValue, containsKey: true } }));
            } else {
                setTreasures(prev => ({ ...prev, [coord]: newValue }));
            }
        }
        setEditingValueTarget(null);
        setCurrentEditValue("");
        setCurrentEditHasKey(false);
    };

    const handleValueEditCancel = () => {
        setEditingValueTarget(null);
        setCurrentEditValue("");
    };

    const handleLaserEditSave = () => {
        if (!editingLaser) return;
        pushToHistory();
        const on = parseInt(laserOnTime, 10);
        const off = parseInt(laserOffTime, 10);

        let newTimer;
        if (isLaserTimed && !isNaN(on) && on > 0 && !isNaN(off) && off > 0) {
            newTimer = { on, off, offset: 0 };
        }

        setLaserGrids(prev => prev.map(grid =>
            grid.id === editingLaser.id ? { ...grid, timer: newTimer } : grid
        ));

        setEditingLaser(null);
    };

    const handleLaserEditCancel = () => {
        setEditingLaser(null);
    };

    const handleParameterSave = () => {
        const newSpeedRunTime = parseInt(tempSpeedRunTime, 10);
        if (!isNaN(newSpeedRunTime) && newSpeedRunTime > 0) {
            setSpeedRunTime(newSpeedRunTime);
        }
        setScenarioName(tempName);
        setScenarioDescription(tempDescription);
        setIsParameterModalVisible(false);
    };

    const handleMouseDown = (y: number, x: number) => { setIsMouseDown(true); updateGrid(y, x); };
    const handleMouseUp = () => { setIsMouseDown(false); };
    const handleMouseEnter = (y: number, x: number) => { if (isMouseDown && !['guard_patrol', 'treasure_value', 'laser_beam', 'eraser', 'mark_primary', 'mark_secondary', TileType.PRESSURE_PLATE, TileType.PRESSURE_PLATE_HIDDEN, TileType.SAFE_TIMELOCK, TileType.VAULT_DOOR_TIMELOCK].includes(selectedTool as string)) { updateGrid(y, x); } };

    const handleRightClick = (e: React.MouseEvent, y: number, x: number) => {
        e.preventDefault();

        if (selectedTool === 'guard_patrol' && activePatrolWaypoints.length > 0) {
            setActivePatrolWaypoints(prev => prev.slice(0, -1));
            return;
        }

        const tile = map[y][x];
        if (tile === TileType.LASER_CONTROL_PANEL) {
            const gridToEdit = laserGrids.find(g => g.controlPanel.x === x && g.controlPanel.y === y);
            if (gridToEdit) {
                setEditingLaser(gridToEdit);
                setIsLaserTimed(!!gridToEdit.timer);
                setLaserOnTime(gridToEdit.timer?.on.toString() || "5");
                setLaserOffTime(gridToEdit.timer?.off.toString() || "5");
            }
        }
    };

    const getFullScenarioData = (): Scenario => {
        let finalGuards = [...guards];

        if (activePatrolWaypoints.length >= 1) {
            // Handle both stationary (1 waypoint) and patrol (2+ waypoints) guards
            if (activePatrolWaypoints.length === 1) {
                finalGuards.push({
                    id: Date.now(),
                    name: `Guard ${guards.length + 1}`,
                    x: activePatrolWaypoints[0].x,
                    y: activePatrolWaypoints[0].y,
                    patrolWaypoints: activePatrolWaypoints,
                    patrolRoute: [],
                    patrolIndex: 0,
                    orientation: 'down',
                    status: 'patrolling',
                    time_to_next_move: 1,
                    isStationary: true,
                    panSequence: ['down', 'left', 'up', 'right'],
                    panIndex: 0,
                    panTimer: 3,
                });
            } else {
                finalGuards.push({
                    id: Date.now(),
                    name: `Guard ${guards.length + 1}`,
                    x: activePatrolWaypoints[0].x,
                    y: activePatrolWaypoints[0].y,
                    patrolWaypoints: activePatrolWaypoints,
                    patrolRoute: calculatePatrolRoute(activePatrolWaypoints, map),
                    patrolIndex: 0,
                    orientation: 'down',
                    status: 'patrolling',
                    time_to_next_move: 1,
                });
            }
        }

        finalGuards = finalGuards.map(guard => {
            const patrolRoute = (guard.patrolWaypoints && guard.patrolWaypoints.length > 1)
                ? calculatePatrolRoute(guard.patrolWaypoints, map)
                : [];
            return {
                ...guard,
                patrolRoute,
                x: guard.patrolWaypoints?.[0]?.x ?? guard.x,
                y: guard.patrolWaypoints?.[0]?.y ?? guard.y,
            };
        });

        let finalLaserGrids = [...laserGrids];
        if (activeLaserGrid && activeLaserGrid.beamTiles.length > 0) {
            const newGrid: LaserGrid = { id: Date.now(), controlPanel: activeLaserGrid.controlPanel, beamTiles: activeLaserGrid.beamTiles };
            finalLaserGrids = [...finalLaserGrids.filter(g => g.controlPanel.x !== newGrid.controlPanel.x || g.controlPanel.y !== newGrid.controlPanel.y), newGrid];
        }

        return {
            ...scenario,
            name: scenarioName,
            description: scenarioDescription,
            map,
            cameras,
            guards: finalGuards,
            treasures,
            laserGrids: finalLaserGrids,
            pressurePlates,
            timeLocks,
            speedRunTime,
            primaryTarget,
            secondaryTarget,
            startPositions,
        };
    };

    const handleSave = () => {
        const finalData = getFullScenarioData();
        onSaveAndClose({
            name: finalData.name,
            description: finalData.description,
            map: finalData.map,
            cameras: finalData.cameras,
            guards: finalData.guards,
            treasures: finalData.treasures,
            laserGrids: finalData.laserGrids,
            pressurePlates: finalData.pressurePlates,
            timeLocks: finalData.timeLocks,
            speedRunTime: finalData.speedRunTime,
            primaryTarget: finalData.primaryTarget,
            secondaryTarget: finalData.secondaryTarget,
            startPositions: finalData.startPositions,
        });
    };

    const handleExportClick = () => {
        const scenarioToExport = getFullScenarioData();

        const generateCode = (data: Scenario) => {
            const { map: fullMap } = data;

            // Create a reverse mapping from TileType to T aliases
            const tileToAlias: { [key: string]: string } = {};
            for (const [alias, tileType] of Object.entries(T)) {
                tileToAlias[tileType as string] = `T.${alias}`;
            }

            // 1. Find the bounds of non-EXTERIOR tiles
            let minX = GRID_WIDTH, minY = GRID_HEIGHT, maxX = -1, maxY = -1;
            let hasContent = false;
            fullMap.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile !== TileType.EXTERIOR) {
                        hasContent = true;
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                });
            });

            let mapPropertyString: string;

            if (hasContent) {
                // 2. Create the sparse map and offset using T aliases
                const sparseMap = fullMap.slice(minY, maxY + 1).map(row => row.slice(minX, maxX + 1));
                const offset = { x: minX, y: minY };

                const sparseMapString = `[\n` + sparseMap.map(row =>
                    `      [${row.map(tile => tileToAlias[tile] || `TileType.${tile}`).join(', ')}]`
                ).join(',\n') + `\n    ]`;

                mapPropertyString = `"map": createFullMap({\n    data: ${sparseMapString},\n    offset: { x: ${offset.x}, y: ${offset.y} }\n  })`;
            } else {
                // If map is empty, just generate it as a full grid
                const fullMapString = `[\n` + fullMap.map(row =>
                    `    [${row.map(tile => tileToAlias[tile] || `TileType.${tile}`).join(', ')}]`
                ).join(',\n') + `\n  ]`;
                mapPropertyString = `"map": ${fullMapString}`;
            }

            // Build all properties as a formatted object string
            const props: string[] = [];
            props.push(`  "id": "${data.id}"`);
            props.push(`  "name": "${data.name}"`);
            props.push(`  "description": "${data.description.replace(/"/g, '\\"')}"`);
            props.push(`  "initialMessage": "${data.initialMessage?.replace(/"/g, '\\"') || ''}"`);
            props.push(`  "tier": ${data.tier || 0}`);
            props.push(`  "reputationRequired": ${data.reputationRequired || 0}`);
            props.push(`  "reputationRewards": ${JSON.stringify(data.reputationRewards || { base: 10, stealth: 5, speed: 5, fullLoot: 5 })}`);
            props.push(`  "speedRunTime": ${data.speedRunTime || 120}`);
            props.push(`  ${mapPropertyString}`);
            props.push(`  "startPositions": ${JSON.stringify(data.startPositions || [])}`);
            props.push(`  "treasures": ${JSON.stringify(data.treasures || {})}`);
            props.push(`  "cameras": ${JSON.stringify(data.cameras || [], null, 2).split('\n').join('\n  ')}`);
            props.push(`  "guards": ${JSON.stringify(data.guards || [], (key, value) => key === 'patrolRoute' ? undefined : value, 2).split('\n').join('\n  ')}`);

            if (data.laserGrids && data.laserGrids.length > 0) {
                props.push(`  "laserGrids": ${JSON.stringify(data.laserGrids, null, 2).split('\n').join('\n  ')}`);
            }
            if (data.pressurePlates && data.pressurePlates.length > 0) {
                props.push(`  "pressurePlates": ${JSON.stringify(data.pressurePlates, null, 2).split('\n').join('\n  ')}`);
            }
            if (data.timeLocks && data.timeLocks.length > 0) {
                props.push(`  "timeLocks": ${JSON.stringify(data.timeLocks, null, 2).split('\n').join('\n  ')}`);
            }
            if (data.hackableTerminals && data.hackableTerminals.length > 0) {
                props.push(`  "hackableTerminals": ${JSON.stringify(data.hackableTerminals, null, 2).split('\n').join('\n  ')}`);
            }
            if (data.primaryTarget) {
                props.push(`  "primaryTarget": ${JSON.stringify(data.primaryTarget)}`);
            }
            if (data.secondaryTarget) {
                props.push(`  "secondaryTarget": ${JSON.stringify(data.secondaryTarget)}`);
            }

            const scenarioString = `{\n${props.join(',\n')}\n}`;

            const variableName = data.id.replace(/[^a-zA-Z0-9_]/g, '_');

            return `// Copy this code into your scenarios.ts file.
// It relies on the 'createFullMap' helper function in that file.
// Import at the top: import { T } from './types';

const ${variableName}: Scenario = ${scenarioString};`;
        };

        const code = generateCode(scenarioToExport);
        setExportCode(code);
        setIsExportModalVisible(true);
        setCopyButtonText('Copy to Clipboard');
    };

    const handleExportFile = () => {
        const scenarioToExport = getFullScenarioData();
        const { map: fullMap } = scenarioToExport;

        // Compression Logic: Convert to sparse map with T aliases
        let mapDataToExport: any = fullMap;

        // 1. Find the bounds of non-EXTERIOR tiles
        let minX = GRID_WIDTH, minY = GRID_HEIGHT, maxX = -1, maxY = -1;
        let hasContent = false;
        fullMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile !== TileType.EXTERIOR) {
                    hasContent = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            });
        });

        if (hasContent) {
            // Create a reverse mapping from TileType to T aliases
            const tileToAlias: { [key: string]: string } = {};
            for (const [alias, tileType] of Object.entries(T)) {
                tileToAlias[tileType as string] = `T.${alias}`;
            }

            const sparseData: string[][] = [];
            for (let y = minY; y <= maxY; y++) {
                const row: string[] = [];
                for (let x = minX; x <= maxX; x++) {
                    const tile = fullMap[y][x];
                    // Use alias if available (e.g. "T.w"), otherwise raw string
                    row.push(tileToAlias[tile] || tile);
                }
                sparseData.push(row);
            }

            mapDataToExport = {
                data: sparseData,
                offset: { x: minX, y: minY }
            };
        }
        // If empty or all exterior, we could export full map, but let's stick to full map default if content check fails (though effectively handled by loop)
        // If hasContent is false, mapDataToExport remains fullMap (verbose, but correct).

        const exportObj = {
            ...scenarioToExport,
            map: mapDataToExport
        };

        const scenarioString = JSON.stringify(exportObj, (key, value) => {
            if (key === 'patrolRoute') return undefined;
            return value;
        }, 2);

        const blob = new Blob([scenarioString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `${scenarioName.toLowerCase().replace(/[^a-z0-9_]+/g, '_') || 'custom_scenario'}.json`;

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!Array.isArray(map) || map.length === 0 || !Array.isArray(map[0])) {
        return <div className="text-center p-8">Loading Map Editor or map data is invalid.</div>;
    }

    const mapWidth = map[0].length;
    const containerWidth = mapWidth * TILE_SIZE;
    const containerHeight = map.length * TILE_SIZE;
    const terrainTools: { type: TileType; icon: React.ReactNode; name: string }[] = [
        { type: TileType.WALL, icon: <div className="w-8 h-8 bg-gray-700 border-2 border-gray-500 rounded-sm" />, name: 'Wall' },
        { type: TileType.FLOOR, icon: <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-sm" />, name: 'Floor' },
        { type: TileType.EXTERIOR, icon: <div className="w-8 h-8 bg-gray-900 border-2 border-gray-700 rounded-sm" />, name: 'Exterior' },
        { type: TileType.CAR, icon: <CarIcon className="w-8 h-8 text-yellow-400" />, name: 'Getaway Car' },
    ];

    const floorTools: { type: TileType; icon: React.ReactNode; name: string }[] = [
        { type: TileType.FLOOR_WOOD, icon: <div className="w-8 h-8" style={{ backgroundColor: '#6b462a' }} />, name: 'Wood Floor' },
        { type: TileType.FLOOR_CEMENT, icon: <div className="w-8 h-8" style={{ backgroundColor: '#9ca3af' }} />, name: 'Cement Floor' },
        { type: TileType.FLOOR_MARBLE, icon: <div className="w-8 h-8" style={{ backgroundColor: '#e5e7eb' }} />, name: 'Marble Floor' },
        { type: TileType.FLOOR_SLATE, icon: <div className="w-8 h-8" style={{ backgroundColor: '#475569' }} />, name: 'Slate Floor' },
        { type: TileType.FLOOR_CARPET, icon: <div className="w-8 h-8" style={{ backgroundColor: '#6d2828' }} />, name: 'Carpet Floor' },
        { type: TileType.FLOOR_TILES, icon: <div className="w-8 h-8" style={{ backgroundColor: '#d1d5db' }} />, name: 'Tiled Floor' },
    ];

    const furnitureTools: { type: TileType; icon: React.ReactNode; name: string }[] = [
        { type: TileType.DESK, icon: <DeskIcon className="w-8 h-8 text-cyan-400" />, name: 'Desk' },
        { type: TileType.COLUMN, icon: <ColumnIcon className="w-8 h-8 text-cyan-400" />, name: 'Column' },
        { type: TileType.PLANT, icon: <PlantIcon className="w-8 h-8 text-cyan-400" />, name: 'Potted Plant' },
        { type: TileType.SCULPTURE, icon: <SculptureIcon className="w-8 h-8 text-cyan-400" />, name: 'Sculpture / Statue' },
        { type: TileType.SOFA, icon: <SofaIcon className="w-8 h-8 text-cyan-400" />, name: 'Sofa' },
        { type: TileType.FILING_CABINET, icon: <CabinetIcon className="w-8 h-8 text-cyan-400" />, name: 'Filing Cabinet' },
        /* 
        { type: TileType.VENDING_MACHINE, icon: <VendingMachineIcon className="w-8 h-8 text-cyan-400" />, name: 'Vending Machine' },
        { type: TileType.WATER_COOLER, icon: <WaterCoolerIcon className="w-8 h-8 text-cyan-400" />, name: 'Water Cooler' },
        { type: TileType.BROOM_CABINET, icon: <BroomIcon className="w-8 h-8 text-cyan-400" />, name: 'Broom Cabinet' },
        */
    ];

    const specialTools = [
        { id: 'start_position', icon: <PlayerIcon className="w-8 h-8 text-green-400" />, name: 'Thief Start' },
    ];

    const treasureTools: { type: TileType; icon: React.ReactNode; name: string }[] = [
        { type: TileType.TELLER_COUNTER, icon: <TellerCounterIcon className="w-8 h-8 text-amber-400" />, name: 'Teller Counter ($250)' },
        { type: TileType.DISPLAY_CASE, icon: <DiamondIcon className="w-8 h-8 text-amber-400" />, name: 'Display Case' },
        { type: TileType.DISPLAY_CASE_ALARMED, icon: <DiamondIcon className="w-8 h-8 text-red-400" />, name: 'Alarmed Case' },
        { type: TileType.SAFE, icon: <SafeIcon className="w-8 h-8 text-amber-400" />, name: 'Safe' },
        { type: TileType.SAFE_ALARMED, icon: <SafeIcon className="w-8 h-8 text-red-400" />, name: 'Alarmed Safe' },
        { type: TileType.SAFE_TIMELOCK, icon: <TimeLockSafeIcon className="w-8 h-8 text-yellow-400" />, name: 'Time-Lock Safe' },
        { type: TileType.ART_PIECE, icon: <ArtPieceIcon className="w-8 h-8 text-amber-400" />, name: 'Art Piece' },
        { type: TileType.ART_PIECE_ALARMED, icon: <ArtPieceIcon className="w-8 h-8 text-red-400" />, name: 'Alarmed Art' },
        { type: TileType.STATUE, icon: <SculptureIcon className="w-8 h-8 text-amber-400" />, name: 'Statue' },
        { type: TileType.STATUE_ALARMED, icon: <SculptureIcon className="w-8 h-8 text-red-400" />, name: 'Alarmed Statue' },
        { type: TileType.GOLD_BARS, icon: <GoldBarsIcon className="w-8 h-8 text-amber-400" />, name: 'Gold Bars' },
        { type: TileType.GOLD_BARS_ALARMED, icon: <GoldBarsIcon className="w-8 h-8 text-red-400" />, name: 'Alarmed Gold' },
        { type: TileType.CABINET, icon: <CabinetIcon className="w-8 h-8 text-amber-400" />, name: 'Cabinet' },
        { type: TileType.CABINET_ALARMED, icon: <CabinetIcon className="w-8 h-8 text-red-400" />, name: 'Alarmed Cabinet' },
    ];

    const securityTools: { type: SelectedTool; icon: React.ReactNode; name: string }[] = [
        { type: 'camera_up', icon: <div className="relative w-8 h-8"><CameraIcon className="w-full h-full text-yellow-400" /><ArrowUpIcon className="absolute w-5 h-5 text-white bg-black/60 rounded-full p-0.5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>, name: 'Camera (Up)' },
        { type: 'camera_down', icon: <div className="relative w-8 h-8"><CameraIcon className="w-full h-full text-yellow-400" /><ArrowDownIcon className="absolute w-5 h-5 text-white bg-black/60 rounded-full p-0.5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>, name: 'Camera (Down)' },
        { type: 'camera_left', icon: <div className="relative w-8 h-8"><CameraIcon className="w-full h-full text-yellow-400" /><ArrowLeftIcon className="absolute w-5 h-5 text-white bg-black/60 rounded-full p-0.5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>, name: 'Camera (Left)' },
        { type: 'camera_right', icon: <div className="relative w-8 h-8"><CameraIcon className="w-full h-full text-yellow-400" /><ArrowRightIcon className="absolute w-5 h-5 text-white bg-black/60 rounded-full p-0.5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>, name: 'Camera (Right)' },
        { type: TileType.ALARM_BOX, icon: <AlarmIcon className="w-8 h-8 text-red-500" />, name: 'Alarm Panel' },
        { type: TileType.CAMERA_CONTROL_PANEL, icon: <CameraControlIcon className="w-8 h-8 text-yellow-500" />, name: 'Camera Panel' },
        { type: 'guard_patrol', icon: <PatrolIcon className="w-8 h-8 text-red-500" />, name: 'Guard Patrol' },
        { type: TileType.LASER_CONTROL_PANEL, icon: <LaserPanelIcon className="w-8 h-8 text-red-400" />, name: 'Laser Panel' },
        { type: 'laser_beam', icon: <LaserBeamIcon className="w-8 h-8 text-red-400" />, name: 'Draw Laser Beam' },
        { type: TileType.PRESSURE_PLATE_PANEL, icon: <PressurePlatePanelIcon className="w-8 h-8 text-orange-400" />, name: 'Plate Panel' },
        { type: TileType.PRESSURE_PLATE, icon: <PressurePlateIcon className="w-8 h-8 text-orange-400" />, name: 'Pressure Plate' },
        { type: TileType.COMPUTER_TERMINAL, icon: <ComputerTerminalIcon className="w-8 h-8 text-blue-400" />, name: 'Computer Terminal' },
    ];

    const doorTools: { type: TileType, icon: React.ReactNode, name: string }[] = [
        { type: TileType.DOOR_OPEN, icon: <DoorOpenIcon className="w-8 h-8 text-green-400" />, name: 'Door (Open)' },
        { type: TileType.DOOR_CLOSED, icon: <DoorClosedIcon className="w-8 h-8 text-amber-400" />, name: 'Door (Closed)' },
        { type: TileType.DOOR_LOCKED, icon: <StaticLockpickIcon className="w-8 h-8 text-amber-400" />, name: 'Door (Locked)' },
        { type: TileType.DOOR_LOCKED_ALARMED, icon: <StaticLockpickIcon className="w-8 h-8 text-red-400" />, name: 'Door (Locked & Alarmed)' },
        { type: TileType.VAULT_DOOR, icon: <VaultDoorIcon className="w-8 h-8 text-amber-400" />, name: 'Vault Door' },
        { type: TileType.VAULT_DOOR_TIMELOCK, icon: <TimeLockDoorIcon className="w-full h-full p-1 text-yellow-400" />, name: 'Vault Door (Time-Lock)' },
        { type: TileType.WINDOW, icon: <WindowIcon className="w-8 h-8 text-blue-400" />, name: 'Window' },
        { type: TileType.WINDOW_BROKEN, icon: <WindowBrokenIcon className="w-8 h-8 text-gray-400" />, name: 'Broken Window' },
    ];

    const ToolSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
        <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2 border-b border-gray-700 pb-1">{title}</h3>
            <div className="grid grid-cols-5 gap-2">{children}</div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-800 text-white font-mono">
            {/* Left Toolbar */}
            <div className="w-[840px] bg-gray-900 p-4 flex flex-col space-y-4 overflow-y-auto">
                {validationErrors.length > 0 && (
                    <div className="bg-red-900/50 border-2 border-red-500 p-4 rounded-md">
                        <h3 className="text-red-400 font-bold mb-2 flex items-center"><AlarmIcon className="w-5 h-5 mr-2" /> Validation Errors</h3>
                        <ul className="list-disc list-inside text-red-200 text-sm space-y-1">
                            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}
                <ToolSection title="Terrain & Structure">
                    {terrainTools.map(t => <ToolButton key={t.type} tool={t.type} selectedTool={selectedTool} onClick={handleToolSelection} title={t.name}>{t.icon}</ToolButton>)}
                    {specialTools.map((t: any) => <ToolButton key={t.id || t.type} tool={t.id || t.type} selectedTool={selectedTool} onClick={handleToolSelection} title={t.name}>{t.icon}</ToolButton>)}
                </ToolSection>
                <ToolSection title="Flooring">{floorTools.map(t => <ToolButton key={t.type} tool={t.type} selectedTool={selectedTool} onClick={handleToolSelection} title={t.name}>{t.icon}</ToolButton>)}</ToolSection>
                <ToolSection title="Doors">{doorTools.map(t => <ToolButton key={t.type} tool={t.type} selectedTool={selectedTool} onClick={handleToolSelection} title={t.name}>{t.icon}</ToolButton>)}</ToolSection>
                <ToolSection title="Furniture & Obstacles">{furnitureTools.map(t => <ToolButton key={t.type} tool={t.type} selectedTool={selectedTool} onClick={handleToolSelection} title={t.name}>{t.icon}</ToolButton>)}</ToolSection>
            </div>

            {/* Map Area */}
            <div ref={mapContainerRef} className="flex-grow overflow-auto flex items-start justify-center p-4">
                <div className="relative" style={{ width: containerWidth, height: containerHeight }} onMouseLeave={handleMouseUp}>
                    <FloorPatternDefs />
                    {map.map((row, y) => row.map((tile, x) => {
                        const isPrimary = primaryTarget?.x === x && primaryTarget?.y === y;
                        const isSecondary = secondaryTarget?.x === x && secondaryTarget?.y === y;
                        const camera = (tile === TileType.CAMERA || tile === TileType.CAMERA_DISABLED)
                            ? cameras.find(c => c.x === x && c.y === y)
                            : undefined;
                        return (
                            <div key={`${x}-${y}`} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }} className="absolute select-none"
                                onMouseDown={() => handleMouseDown(y, x)} onMouseUp={handleMouseUp} onMouseEnter={() => handleMouseEnter(y, x)} onContextMenu={(e) => handleRightClick(e, y, x)}>
                                <Tile type={tile} alarmSystemActive={true} isPrimaryTarget={isPrimary} isSecondaryTarget={isSecondary} camera={camera} />
                            </div>
                        )
                    }))}
                    {/* Render Treasure Values */}
                    {Object.entries(treasures).map(([key, value]) => {
                        const [x, y] = key.split('-').map(Number);
                        return <div key={`treasure-${key}`} className="absolute flex items-center justify-center pointer-events-none text-xs text-white" style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, textShadow: '1px 1px 2px black' }}>${Number(value) / 1000}k</div>;
                    })}
                    {/* Render Guards */}
                    {guards.map(g => <div key={`guard-${g.id}`} className="absolute pointer-events-none" style={{ left: g.x * TILE_SIZE, top: g.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}><GuardIcon className="w-8 h-8 p-1" /></div>)}
                    {/* Render Start Positions */}
                    {startPositions.map((p, i) => <div key={`start-${i}`} className="absolute pointer-events-none" style={{ left: p.x * TILE_SIZE, top: p.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}><PlayerIcon className={`w-8 h-8 p-1 ${i === 0 ? 'text-green-400' : 'text-blue-400'}`} /></div>)}
                    {/* Render Laser Grids */}
                    {laserGrids.map(grid => grid.beamTiles.map(tile => <div key={`laser-${grid.id}-${tile.x}-${tile.y}`} className="absolute pointer-events-none bg-red-500/30 border-t-2 border-red-400" style={{ left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE + (TILE_SIZE / 2 - 1), width: TILE_SIZE, height: 2 }}></div>))}
                    {/* Render Patrol Routes */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                        {[...guards, ...(activePatrolWaypoints.length > 1 ? [{ id: -1, name: 'new', patrolWaypoints: activePatrolWaypoints, patrolRoute: calculatePatrolRoute(activePatrolWaypoints, map) }] : [])].map((g, i) => (
                            <g key={`route-${g.id}-${i}`}>
                                {calculatePatrolRoute(g.patrolWaypoints || [], map).map((point, pointIndex, arr) => {
                                    if (pointIndex === 0) return null;
                                    const prevPoint = arr[pointIndex - 1];
                                    return <line key={pointIndex} x1={prevPoint.x * TILE_SIZE + TILE_SIZE / 2} y1={prevPoint.y * TILE_SIZE + TILE_SIZE / 2} x2={point.x * TILE_SIZE + TILE_SIZE / 2} y2={point.y * TILE_SIZE + TILE_SIZE / 2} stroke={g.id === -1 ? "#facc15" : "#f87171"} strokeWidth="2" strokeDasharray="4 4" />;
                                })}
                                {g.patrolWaypoints?.map((p, j) => <circle key={`waypoint-${j}`} cx={p.x * TILE_SIZE + TILE_SIZE / 2} cy={p.y * TILE_SIZE + TILE_SIZE / 2} r="5" fill={g.id === -1 ? "#facc15" : "#f87171"} />)}
                            </g>
                        ))}
                        {activeLaserGrid && activeLaserGrid.beamTiles.map((p, i) => <circle key={`laser-dot-${i}`} cx={p.x * TILE_SIZE + TILE_SIZE / 2} cy={p.y * TILE_SIZE + TILE_SIZE / 2} r="5" fill="#ef4444" />)}
                    </svg>
                </div>
            </div>

            {/* Right Toolbar */}
            <div className="w-[840px] bg-gray-900 p-4 flex flex-col space-y-4 overflow-y-auto">
                <div>
                    <h2 className="text-xl font-bold text-cyan-400 mb-2 truncate">{scenarioName}</h2>
                    <button onClick={() => { setTempName(scenarioName); setTempDescription(scenarioDescription); setTempSpeedRunTime(speedRunTime.toString()); setIsParameterModalVisible(true); }} className="w-full px-4 py-2 bg-blue-600/80 border-2 border-blue-400 text-blue-100 rounded-md hover:bg-blue-500 transition-all font-bold">Edit Details</button>
                </div>

                <ToolSection title="Special Tools">
                    <ToolButton tool="eraser" selectedTool={selectedTool} onClick={handleToolSelection} title="Eraser (Erase objects/paths)"><EraserIcon className="w-8 h-8 text-red-400" /></ToolButton>
                    <ToolButton tool="treasure_value" selectedTool={selectedTool} onClick={handleToolSelection} title="Set Treasure Value"><MoneyIcon className="w-8 h-8 text-black-400" /></ToolButton>
                    <ToolButton tool="mark_primary" selectedTool={selectedTool} onClick={handleToolSelection} title="Mark Primary Target"><PrimaryTargetIcon className="w-8 h-8 text-yellow-400" /></ToolButton>
                    <ToolButton tool="mark_secondary" selectedTool={selectedTool} onClick={handleToolSelection} title="Mark Secondary Target"><SecondaryTargetIcon className="w-8 h-8 text-slate-400" /></ToolButton>
                </ToolSection>

                <ToolSection title="Loot & Containers">{treasureTools.map(t => <ToolButton key={t.type} tool={t.type} selectedTool={selectedTool} onClick={handleToolSelection} title={t.name}>{t.icon}</ToolButton>)}</ToolSection>
                <ToolSection title="Security Systems">{securityTools.map(t => <ToolButton key={t.type} tool={t.type} selectedTool={selectedTool} onClick={handleToolSelection} title={t.name}>{t.icon}</ToolButton>)}</ToolSection>

                <div className="mt-auto pt-4 border-t border-gray-700 space-y-2">
                    <button onClick={handleUndo} disabled={history.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600/80 border-2 border-yellow-400 text-yellow-100 rounded-md hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 transition-all font-bold"><UndoIcon className="w-6 h-6" /> Undo</button>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleExportClick} className="w-full px-4 py-2 bg-purple-600/80 border-2 border-purple-400 text-purple-100 rounded-md hover:bg-purple-500 transition-all font-bold">Export Code</button>
                        <button onClick={handleExportFile} className="w-full px-4 py-2 bg-purple-600/80 border-2 border-purple-400 text-purple-100 rounded-md hover:bg-purple-500 transition-all font-bold">Export File</button>
                    </div>
                    <button onClick={handleSave} className="w-full px-4 py-2 bg-green-600/80 border-2 border-green-400 text-green-100 rounded-md hover:bg-green-500 transition-all font-bold">Save & Close</button>
                    <button onClick={onCancel} className="w-full px-4 py-2 bg-red-600/80 border-2 border-red-400 text-red-100 rounded-md hover:bg-red-500 transition-all font-bold">Cancel</button>
                </div>
            </div>

            {/* Modals */}
            {isParameterModalVisible && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-2 border-cyan-500/50 rounded-lg p-6 shadow-2xl shadow-cyan-500/20 w-full max-w-lg">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Edit Scenario Details</h2>
                        <div className="space-y-4">
                            <div><label className="block text-gray-400 mb-1">Scenario Name</label><input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full bg-gray-900 p-2 rounded border border-gray-600 focus:ring-yellow-400" /></div>
                            <div><label className="block text-gray-400 mb-1">Description</label><textarea value={tempDescription} onChange={e => setTempDescription(e.target.value)} className="w-full bg-gray-900 p-2 rounded border border-gray-600 h-24 focus:ring-yellow-400" /></div>
                            <div><label className="block text-gray-400 mb-1">Speed Run Time (seconds)</label><input type="number" value={tempSpeedRunTime} onChange={e => setTempSpeedRunTime(e.target.value)} className="w-full bg-gray-900 p-2 rounded border border-gray-600 focus:ring-yellow-400" /></div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setIsParameterModalVisible(false)} className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500">Cancel</button>
                            <button onClick={handleParameterSave} className="px-4 py-2 bg-green-600 text-green-100 rounded-md hover:bg-green-500">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {editingValueTarget && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-2 border-cyan-500/50 rounded-lg p-6 shadow-2xl shadow-cyan-500/20 w-full max-w-sm">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Set Treasure Value</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Value ($)</label>
                                <input
                                    type="number"
                                    value={currentEditValue}
                                    onChange={e => setCurrentEditValue(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleValueEditSave()}
                                    className="w-full bg-gray-900 p-2 rounded border border-gray-600 text-lg text-center focus:ring-yellow-400"
                                />
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-900/50 rounded border border-gray-700">
                                <input
                                    type="checkbox"
                                    id="treasure-has-key"
                                    checked={currentEditHasKey}
                                    onChange={e => setCurrentEditHasKey(e.target.checked)}
                                    className="w-5 h-5 accent-yellow-500"
                                />
                                <label htmlFor="treasure-has-key" className="text-yellow-300 font-semibold cursor-pointer select-none">
                                    🔑 Contains Key (for pickpocketing)
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={handleValueEditCancel} className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500">Cancel</button>
                            <button onClick={handleValueEditSave} className="px-4 py-2 bg-green-600 text-green-100 rounded-md hover:bg-green-500">Set Value</button>
                        </div>
                    </div>
                </div>
            )}

            {editingLaser && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-2 border-cyan-500/50 rounded-lg p-6 shadow-2xl shadow-cyan-500/20 w-full max-w-sm">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Configure Laser Grid</h2>
                        <div className="space-y-4">
                            <label className="flex items-center gap-2"><input type="checkbox" checked={isLaserTimed} onChange={e => setIsLaserTimed(e.target.checked)} className="w-5 h-5" /> Use On/Off Timer</label>
                            {isLaserTimed && (<>
                                <div><label className="block text-gray-400 mb-1">On Time (seconds)</label><input type="number" value={laserOnTime} onChange={e => setLaserOnTime(e.target.value)} className="w-full bg-gray-900 p-2 rounded" /></div>
                                <div><label className="block text-gray-400 mb-1">Off Time (seconds)</label><input type="number" value={laserOffTime} onChange={e => setLaserOffTime(e.target.value)} className="w-full bg-gray-900 p-2 rounded" /></div>
                            </>)}
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={handleLaserEditCancel} className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500">Cancel</button>
                            <button onClick={handleLaserEditSave} className="px-4 py-2 bg-green-600 text-green-100 rounded-md hover:bg-green-500">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {isExportModalVisible && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-2 border-cyan-500/50 rounded-lg p-6 shadow-2xl shadow-cyan-500/20 w-full max-w-2xl">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Export Scenario Code</h2>
                        <textarea readOnly value={exportCode} className="w-full h-96 bg-gray-900 p-2 rounded border border-gray-600 text-sm font-mono whitespace-pre"></textarea>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => { navigator.clipboard.writeText(exportCode); setCopyButtonText('Copied!'); }} className="px-4 py-2 bg-blue-600 text-blue-100 rounded-md hover:bg-blue-500">{copyButtonText}</button>
                            <button onClick={() => setIsExportModalVisible(false)} className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};