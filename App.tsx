/**
 * @file App.tsx
 * @description
 * This is the root component of the heistology application. It serves as the main controller,
 * managing the overall game state, handling all user input, and orchestrating the display of
 * different screens (e.g., main menu, game, map editor). It's the central nervous system of the game.
 */

// Import React hooks for state management (useState, useEffect, useCallback) and DOM references (useRef).
import * as React from 'react';

// Import all UI components that make up the different screens of the application.
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { MapEditor } from './components/MapEditor';
import { ObjectivesTracker } from './components/ObjectivesTracker';
import { Ticker } from './components/Ticker';
import { HeistReport } from './components/HeistReport';
import { Handbook } from './components/Handbook';
import { MapMiniature } from './components/MapMiniature';
import { BugReportButton } from './components/BugReportButton';
import { ImprintModal } from './components/ImprintModal';
import { CookieBanner } from './components/CookieBanner';
import { AbandonmentSurvey } from './components/AbandonmentSurvey';


// Import game balance constants for timings and penalties.
import { TIME_COST, EXECUTION_START_TIME, GRID_WIDTH, GRID_HEIGHT, CONSUMABLE_ITEMS, TILE_SIZE, NOISE_RANGE, GOD_MODE_ENABLED } from './constants';

// Import the default, hard-coded scenarios and their intended display order.
import { scenarios as defaultScenarios, scenarioOrder, ScenarioId } from './scenarios';
import { ROSTER, SKILL_DESCRIPTIONS, CHARACTER_COLORS } from './roster';

// Import all necessary type definitions to ensure type safety across the application.
import { TileType } from './types';
import type { Player, GameState, ActionType, PlanStep, Camera, ActionInfo, Scenario, Guard, LaserGrid, PressurePlate, TimeLock, PlayerStatus, RosterCharacter, Skill, ActiveLaserGrid, CampaignState, ConsumableItem, HeistReportData, GameContextType } from './types';

// Import UI icons for the music toggle button.
import { MusicOnIcon, MusicOffIcon, PlayerIcon, LockIcon, MoneyIcon, ReputationIcon, SunIcon, MoonIcon, GuardIcon, CameraIcon, AlarmIcon, LaserPanelIcon, PressurePlateIcon, TimeLockSafeIcon, ComputerTerminalIcon } from './components/Icons';
import { CharacterIcons } from './components/CharacterIcons';

// Import utility functions for interacting with the browser's IndexedDB for saving/loading custom maps.
import { loadScenarios, saveScenarioToDB, deleteScenarioFromDB, saveCampaignStateToDB, getCampaignStateFromDB, exportCampaignToFile, importCampaignFromFile } from './lib/database';

// Import gameplay logic utility functions for various calculations and state manipulations.
import { isWalkable, expandCompressedMap } from './lib/tiles';
import { findShortestPath, findFastestEscapePath } from './lib/pathfinding';
import { createInitialState, calculatePlanMetrics, getProjectedStateAtTime } from './lib/state';
import { getSkillAdjustedTime, calculateAdjacentActions, getValidTargetsForDistraction, getValidTargetsForStunOMat } from './lib/actions';
import { tick } from './lib/gameLoop';
import { calculateGuardVision } from './lib/guards';
import { deepClone } from './lib/utils';
import { calculateNoiseSpread } from './lib/noise';
import { generateNewspaperReport } from './lib/newspaper';

// Import i18n utilities.
import { useTranslation, t, setLanguage, getLanguage } from './lib/i18n';

// Import analytics utilities.
import { trackScenarioStart, trackScenarioEnd, trackActionPlanned, trackNavigation } from './lib/analytics';

// Create and export the context to be used by child components.
export const GameContext = React.createContext<GameContextType | null>(null);

// Defines mapping from keyboard keys to game actions for shortcuts.
const KEY_ACTION_MAP: Record<string, ActionType> = {
    'p': 'unlock', // Use 'unlock' as the primary for 'p' since it's more common
    's': 'smash',
    'c': 'crack',
    'd': 'plant_dynamite',
    'e': 'disable', // Generic 'e' for all electronic interactions
    'r': 'rob',
    'o': 'open_door',
    't': 'distract',
};

const REPUTATION_TITLES = [
    { threshold: 100, title: "Legend" },
    { threshold: 75, title: "Mastermind" },
    { threshold: 50, title: "Expert" },
    { threshold: 20, title: "Professional" },
    { threshold: 10, title: "Thief" },
    { threshold: 5, title: "Novice" },
    { threshold: 0, title: "Nobody" },
];

const getReputationTitle = (rep: number) => {
    const rank = REPUTATION_TITLES.find(t => rep >= t.threshold);
    return rank ? t(`ui.reputation_titles.${rank.title}`) : t('ui.reputation_titles.Nobody');
};


// --- MAIN APP COMPONENT ---

const App = () => {
    const { t, lang, setLanguage: setI18nLanguage } = useTranslation();

    // Define the possible screens the user can be on. This controls the high-level view.
    type Screen = 'campaignHub' | 'briefing' | 'teamSelector' | 'game' | 'mapEditor';

    // --- State Management ---
    // State for the currently visible screen (e.g., main menu, game session).
    const [screen, setScreen] = React.useState<Screen>('campaignHub');

    // The master state object for the current game session. `null` when not in a game.
    const [gameState, setGameState] = React.useState<GameState | null>(null);

    // The static scenario data for the current game session. `null` when not in a game.
    const [currentScenario, setCurrentScenario] = React.useState<Scenario | null>(null);
    const [scenarios, setScenarios] = React.useState<Record<string, Scenario>>(defaultScenarios);

    // State for managing the map editor. `null` when not editing.
    const [editingScenario, setEditingScenario] = React.useState<Scenario | null>(null);

    // State for tracking the player's overall career progress.
    const [campaignState, setCampaignState] = React.useState<CampaignState | null>(null);

    // State for managing the player's selected team for a heist.
    const [selectedTeam, setSelectedTeam] = React.useState<RosterCharacter[]>([]);

    // State for music playback.
    // const [isMusicPlaying, setIsMusicPlaying] = React.useState(false);
    // const musicRef = React.useRef<HTMLAudioElement | null>(null);

    // State for theme (light/dark mode).
    const [theme, setTheme] = React.useState(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return 'dark';
        }
        return 'light';
    });

    // State for targeting mode during planning.
    const [isTargeting, setIsTargeting] = React.useState<ActionType | null>(null);
    const [validTargets, setValidTargets] = React.useState<{ x: number, y: number }[]>([]);

    // State for the new event ticker
    const [tickerMessages, setTickerMessages] = React.useState<{ id: number, text: string }[]>([]);

    // State for God Mode (dev/testing feature).
    // State for God Mode (dev/testing feature).
    const [isGodMode, setIsGodMode] = React.useState(false);
    const [preGodModeState, setPreGodModeState] = React.useState<CampaignState | null>(null);

    // State for the Heist Report modal
    const [heistReportData, setHeistReportData] = React.useState<HeistReportData | null>(null);
    // NEW: State for the report generation loading screen
    const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);


    // State for Black Market item purchasing modal
    const [itemToBuy, setItemToBuy] = React.useState<ConsumableItem | null>(null);

    // NEW: State for Player Handbook visibility
    const [isHandbookVisible, setIsHandbookVisible] = React.useState(false);
    const [isImprintVisible, setIsImprintVisible] = React.useState(false);
    const [isCookieBannerOpen, setIsCookieBannerOpen] = React.useState(false);
    const [showGodModeModal, setShowGodModeModal] = React.useState(false);

    // State for noise radius preview during planning.
    const [noisePreview, setNoisePreview] = React.useState<Map<string, number> | null>(null);

    // NEW: State for Abort Mission modal visibility
    const [isAbortModalVisible, setIsAbortModalVisible] = React.useState(false);

    // State for hamburger menu visibility
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // NEW: Operations completed message state
    const [showOperationsCompletedMessage, setShowOperationsCompletedMessage] = React.useState(false);

    // NEW: Welcome screen state
    const [showWelcomeScreen, setShowWelcomeScreen] = React.useState(!localStorage.getItem('isRecruited'));

    // NEW: Analytics state
    const [realWorldHeistStartTime, setRealWorldHeistStartTime] = React.useState<number | null>(null);

    // NEW: Recruitment state
    const [isRecruited, setIsRecruited] = React.useState(() => {
        return localStorage.getItem('isRecruited') === 'true';
    });
    // NEW: Track if player ever started a heist (for exit-intent survey)
    const [hasStartedHeist, setHasStartedHeist] = React.useState(false);

    // NEW: Seen mechanics state for tutorials
    const [seenMechanics, setSeenMechanics] = React.useState<Set<string>>(() => {
        const stored = localStorage.getItem('seenMechanics');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });
    // NEW: Tutorial modal state
    const [tutorialQueue, setTutorialQueue] = React.useState<string[]>([]);

    // Refs for tracking plan history to enable undo functionality.
    const planHistory = React.useRef<PlanStep[][]>([]);
    const planFuture = React.useRef<PlanStep[][]>([]);
    // Refs for file input elements
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const campaignFileInputRef = React.useRef<HTMLInputElement>(null);
    const gameBoardContainerRef = React.useRef<HTMLDivElement>(null);
    const planFileInputRef = React.useRef<HTMLInputElement>(null);

    // Ref to store the game state right before execution for the "Try Again (Edit Plan)" feature.
    const preExecutionStateRef = React.useRef<GameState | null>(null);
    const preExecutionPlanHistoryRef = React.useRef<PlanStep[][]>([]);

    /**
     * Effect to track screen navigation in Google Analytics.
     */
    React.useEffect(() => {
        trackNavigation(screen);
    }, [screen]);

    // --- Data Loading and Initialization ---

    /**
     * Effect to apply the theme to the document and save it to local storage.
     */
    React.useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [theme]);


    /**
     * Loads all scenarios (default + custom) and campaign progress from the database on component mount.
     * This `useEffect` hook runs only once when the application starts.
     */
    React.useEffect(() => {
        /*
        // Get a reference to the audio element from the DOM.
        musicRef.current = document.getElementById('background-music') as HTMLAudioElement;

        // Add error handler for audio loading
        if (musicRef.current) {
            musicRef.current.addEventListener('error', (e) => {
                console.error('Audio loading error:', e);
                console.error('Audio error code:', musicRef.current?.error?.code);
                console.error('Audio error message:', musicRef.current?.error?.message);
            });

            musicRef.current.addEventListener('loadeddata', () => {
                console.log('Audio loaded successfully');
            });

            // Set volume to a reasonable level
            musicRef.current.volume = 0.3;
        }
        */

        // Asynchronously load all data.
        const loadData = async () => {
            try {
                const loadedScenarios = await loadScenarios();
                setScenarios(loadedScenarios);

                let campaign = await getCampaignStateFromDB();
                if (!campaign) {
                    // If no campaign exists, create a fresh one.
                    campaign = {
                        id: 'player_career',
                        totalCash: 2000,
                        reputation: 0,
                        unlockedScenarios: [scenarioOrder[0]],
                        completedObjectives: {},
                        capturedCharacters: [],
                    };
                    await saveCampaignStateToDB(campaign);
                } else {
                    // Migration: Ensure first scenario is always unlocked
                    if (scenarioOrder.length > 0 && !campaign.unlockedScenarios.includes(scenarioOrder[0])) {
                        campaign.unlockedScenarios.push(scenarioOrder[0]);
                    }

                    // BAILOUT: If player is stuck with too little cash OR no available crew, give them a grant.
                    const availableCharsCount = ROSTER.filter(c =>
                        c.reputationRequired <= campaign!.reputation &&
                        !(campaign!.capturedCharacters || []).includes(c.name)
                    ).length;

                    if (campaign.totalCash < 500 || availableCharsCount === 0) {
                        console.log('Bailout: Granting cash/releasing crew to stuck player.');
                        campaign.totalCash = Math.max(campaign.totalCash, 2000);
                        campaign.capturedCharacters = [];
                        await saveCampaignStateToDB(campaign);
                    }
                }
                setCampaignState(campaign);
            } catch (error) {
                console.error("Failed to load campaign data, using default state.", error);
                setCampaignState({
                    id: 'player_career_fallback',
                    totalCash: 2000,
                    reputation: 0,
                    unlockedScenarios: [scenarioOrder[0]],
                    completedObjectives: {},
                    capturedCharacters: [],
                });
            }
        };
        loadData();
    }, []);

    /**
     * Effect to automatically center the game board on the team's starting position.
     */
    React.useEffect(() => {
        // This effect runs when the screen changes to 'game' and the necessary elements are ready.
        if (screen === 'game' && currentScenario) {
            // Use a small delay to ensure the DOM is fully rendered and all elements have their final dimensions.
            const timer = setTimeout(() => {
                const scrollContainer = gameBoardContainerRef.current;
                // The grid parent is the element inside GameBoard that contains all the absolutely positioned tiles.
                const gridParent = document.getElementById('game-board-grid-parent');

                if (!scrollContainer || !gridParent) {
                    console.error("Auto-scroll failed: Could not find necessary elements.");
                    return;
                }

                const startPositions = currentScenario.startPositions || [];
                if (startPositions.length === 0) return;

                // Calculate the average (center) coordinate of the starting positions.
                const avgX = startPositions.reduce((sum, pos) => sum + pos.x, 0) / startPositions.length;
                const avgY = startPositions.reduce((sum, pos) => sum + pos.y, 0) / startPositions.length;

                // Get the position of the grid relative to the scroll container's viewport.
                const gridRect = gridParent.getBoundingClientRect();
                const scrollContainerRect = scrollContainer.getBoundingClientRect();

                // Calculate the offset of the grid from the top-left of the scrollable content area.
                // This accounts for any padding or margins and is robust to style changes.
                const gridLeftInScrollContent = (gridRect.left - scrollContainerRect.left) + scrollContainer.scrollLeft;
                const gridTopInScrollContent = (gridRect.top - scrollContainerRect.top) + scrollContainer.scrollTop;

                // Calculate the absolute pixel position of the crew's center point within the entire scrollable content area.
                // We add 0.5 * TILE_SIZE to target the center of the tile, not its top-left corner.
                const targetCenterX = gridLeftInScrollContent + (avgX * TILE_SIZE) + (TILE_SIZE / 2);
                const targetCenterY = gridLeftInScrollContent + (avgY * TILE_SIZE) + (TILE_SIZE / 2);

                // Calculate the desired scroll position to place the target point in the center of the container's visible area.
                const targetScrollLeft = targetCenterX - (scrollContainer.clientWidth / 2);
                const targetScrollTop = targetCenterY - (scrollContainer.clientHeight / 2);

                // Use a smooth scroll for a better user experience.
                scrollContainer.scrollTo({
                    left: targetScrollLeft,
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            }, 500); // 500ms delay to ensure robust layout painting on all devices.

            // Clean up the timer if the component unmounts or dependencies change before it fires.
            return () => clearTimeout(timer);
        }
    }, [screen, currentScenario]); // Depends on the screen and current scenario to trigger correctly.


    // --- Campaign and Heist Progression Logic ---

    /**
     * Generates a heist report and processes the results to update campaign state.
     * This now uses a local, template-based generator instead of an API call.
     * @param {GameState} finalState - The state of the game when it ended.
     */
    const generateAndProcessHeistResults = React.useCallback(async (finalState: GameState) => {
        if (!currentScenario || !campaignState) return;

        setIsGeneratingReport(true);

        // A short delay to make the loading screen feel more substantial.
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            let totalReputationGained = 0;
            let bonusReputationGained = 0;
            let objectivesMessage = "";
            let wasSuccess = finalState.gameWon;
            let cashGained = 0;
            let finalGearCost = 0;
            let crewCut = 0;
            let yourTake = 0;
            let appliedHireCost = 0;

            const alarmTriggered = finalState.objectiveStatus.stealth === 'failed';
            const explosivesDetonated = finalState.explosivesDetonated;
            const wasDoorSmashed = finalState.isDoorSmashed;

            if (wasSuccess) {
                const previouslyCompleted = campaignState.completedObjectives[currentScenario.id] || [];
                const newlyCompleted: string[] = [];
                const missionCompleted = finalState.objectiveStatus.primary === 'success';

                objectivesMessage += missionCompleted ? `• Primary objective MET.\n` : `• Primary objective FAILED.\n`;
                if (missionCompleted && !previouslyCompleted.includes('base')) {
                    totalReputationGained += currentScenario.reputationRewards.base;
                    newlyCompleted.push('base');
                }

                const secondaryCompleted = finalState.objectiveStatus.secondary === 'success';
                if (currentScenario.secondaryTarget) {
                    objectivesMessage += secondaryCompleted ? `• Bonus Target: MET.\n` : `• Bonus Target: FAILED.\n`;
                    if (missionCompleted && secondaryCompleted && !previouslyCompleted.includes('secondary')) {
                        const bonusRep = Math.floor(currentScenario.reputationRewards.base / 2);
                        totalReputationGained += bonusRep;
                        bonusReputationGained = bonusRep;
                        newlyCompleted.push('secondary');
                    }
                }
                if (finalState.stolenValue > (finalState.totalLootValue * 0.95)) {
                    objectivesMessage += `• Full Loot: MET.\n`;
                    if (!previouslyCompleted.includes('fullLoot')) {
                        totalReputationGained += currentScenario.reputationRewards.fullLoot;
                        newlyCompleted.push('fullLoot');
                    }
                }
                if (!alarmTriggered && missionCompleted) {
                    objectivesMessage += `• Stealth: MET.\n`;
                    if (!previouslyCompleted.includes('stealth')) {
                        totalReputationGained += currentScenario.reputationRewards.stealth;
                        newlyCompleted.push('stealth');
                    }
                } else if (missionCompleted) {
                    objectivesMessage += `• Stealth: FAILED.\n`;
                }
                const timeTaken = finalState.initialExecutionTimer - finalState.executionTimer;
                if (timeTaken <= currentScenario.speedRunTime && missionCompleted) {
                    objectivesMessage += `• Speed Run: MET. (${timeTaken}s)\n`;
                    if (!previouslyCompleted.includes('speed')) {
                        totalReputationGained += currentScenario.reputationRewards.speed;
                        newlyCompleted.push('speed');
                    }
                } else if (missionCompleted) {
                    objectivesMessage += `• Speed Run: FAILED. (${timeTaken}s)\n`;
                }

                const totalHireCost = selectedTeam.reduce((sum, char) => sum + char.hireCost, 0);
                finalGearCost = Object.entries(finalState.inventory).reduce((total, [itemId, count]) => {
                    const item = Object.values(CONSUMABLE_ITEMS).find(i => i.id === itemId);
                    return total + (item && typeof count === 'number' && count < 0 ? item.cost * Math.abs(count) : 0);
                }, 0);
                cashGained = Math.floor(finalState.stolenValue);
                const profitForCut = cashGained - finalGearCost;
                if (profitForCut > 0) {
                    crewCut = Math.floor(selectedTeam.reduce((total, member) => total + (profitForCut * (member.share || 0)), 0));
                }

                appliedHireCost = cashGained > 0 ? totalHireCost : 0;
                yourTake = profitForCut - crewCut - appliedHireCost;

                const newCampaignState = deepClone(campaignState);
                newCampaignState.totalCash += yourTake;
                newCampaignState.reputation += totalReputationGained;

                if (isGodMode && preGodModeState) {
                    setPreGodModeState(prev => prev ? {
                        ...prev,
                        totalCash: prev.totalCash + yourTake,
                        reputation: prev.reputation + totalReputationGained
                    } : null);
                }
                newCampaignState.completedObjectives[currentScenario.id] = [...new Set([...previouslyCompleted, ...newlyCompleted])];
                (Object.values(scenarios) as Scenario[]).forEach(s => {
                    if (newCampaignState.unlockedScenarios.includes(s.id)) return;
                    const repMet = newCampaignState.reputation >= s.reputationRequired;
                    let prereqMet = true;
                    if (s.prerequisiteScenarioId) {
                        const completed = newCampaignState.completedObjectives[s.prerequisiteScenarioId] || [];
                        if (!completed.includes('base')) prereqMet = false;
                    }
                    if (repMet && prereqMet) newCampaignState.unlockedScenarios.push(s.id);
                });

                if (finalState.capturedPlayers && finalState.capturedPlayers.length > 0) {
                    if (!newCampaignState.capturedCharacters) newCampaignState.capturedCharacters = [];
                    finalState.capturedPlayers.forEach(name => {
                        if (!newCampaignState.capturedCharacters!.includes(name)) newCampaignState.capturedCharacters!.push(name);
                    });
                }

                // POST-HEIST BAILOUT: If they now have no one to hire for their REP level, release someone.
                const availableCharsCountAfter = ROSTER.filter(c =>
                    c.reputationRequired <= newCampaignState.reputation &&
                    !newCampaignState.capturedCharacters?.includes(c.name)
                ).length;

                if (availableCharsCountAfter === 0 && newCampaignState.capturedCharacters && newCampaignState.capturedCharacters.length > 0) {
                    // Release the two cheapest characters
                    const capturedByCost = [...newCampaignState.capturedCharacters]
                        .map(name => ROSTER.find(c => c.name === name))
                        .filter((c): c is any => !!c)
                        .sort((a, b) => a.hireCost - b.hireCost);

                    if (capturedByCost.length > 0) {
                        const toRelease = capturedByCost.slice(0, 2).map(c => c.name);
                        newCampaignState.capturedCharacters = newCampaignState.capturedCharacters.filter(name => !toRelease.includes(name));
                        objectivesMessage += `\n⚠️ ATTENTION: Some crew members were released from custody to keep operations running!`;
                    }
                }

                setCampaignState(newCampaignState);
                await saveCampaignStateToDB(newCampaignState);
            } else {
                objectivesMessage = `INCIDENT STATUS: Heist FAILED.\nREASON: ${finalState.message}`;
                const newCampaignState = deepClone(campaignState);
                if (finalState.capturedPlayers && finalState.capturedPlayers.length > 0) {
                    if (!newCampaignState.capturedCharacters) newCampaignState.capturedCharacters = [];
                    finalState.capturedPlayers.forEach(name => {
                        if (!newCampaignState.capturedCharacters!.includes(name)) newCampaignState.capturedCharacters!.push(name);
                    });

                    // POST-FAILURE BAILOUT: Ensure they aren't stuck.
                    const availableCharsCountAfter = ROSTER.filter(c =>
                        c.reputationRequired <= newCampaignState.reputation &&
                        !newCampaignState.capturedCharacters?.includes(c.name)
                    ).length;

                    if (availableCharsCountAfter === 0) {
                        newCampaignState.capturedCharacters = [];
                        objectivesMessage += `\n⚠️ BAILED OUT: All crew members released from custody after total failure.`;
                    }

                    setCampaignState(newCampaignState);
                    await saveCampaignStateToDB(newCampaignState);
                }
            }

            // Track scenario completion/failure in analytics
            const timeTaken = finalState.initialExecutionTimer - finalState.executionTimer;
            const realDurationSeconds = realWorldHeistStartTime ? Math.floor((Date.now() - realWorldHeistStartTime) / 1000) : 0;
            trackScenarioEnd(
                currentScenario.id,
                wasSuccess ? 'win' : 'fail',
                finalState.stolenValue,
                timeTaken,
                realDurationSeconds
            );

            const reportInput: HeistReportData = {
                headline: '', article: '',
                scenarioName: currentScenario.name,
                wasSuccess,
                objectivesMessage,
                cashGained,
                totalLootValue: finalState.totalLootValue,
                finalGearCost, crewCut, yourTake,
                totalHireCost: appliedHireCost,
                totalReputationGained, bonusReputationGained,
                capturedPlayers: finalState.capturedPlayers,
                alarmTriggered,
                doorSmashed: wasDoorSmashed,
                explosivesDetonated,
            };

            const { headline, article } = generateNewspaperReport(reportInput);
            setHeistReportData({ ...reportInput, headline, article });

        } finally {
            setIsGeneratingReport(false);
        }
    }, [currentScenario, campaignState, selectedTeam, scenarios, isGodMode, preGodModeState]);


    React.useEffect(() => {
        if (gameState && (gameState.gameWon || gameState.gameOver) && !heistReportData && !isGeneratingReport) {
            generateAndProcessHeistResults(gameState);
        }
    }, [gameState, gameState?.gameWon, gameState?.gameOver, heistReportData, isGeneratingReport, generateAndProcessHeistResults]);


    // --- Game Loop ---

    React.useEffect(() => {
        if (!gameState || gameState.phase !== 'execution' || gameState.gameOver || gameState.gameWon) {
            return;
        }
        const interval = setInterval(() => {
            setGameState(prevState => {
                if (!prevState || !currentScenario) return prevState;
                const { nextState, newEvents } = tick(prevState, currentScenario);

                if (newEvents && newEvents.length > 0) {
                    const newTickerItems = newEvents.map(text => ({ id: Date.now() + Math.random(), text }));
                    setTickerMessages(currentTicker => [...currentTicker, ...newTickerItems]);
                }

                if (nextState.gameOver || nextState.gameWon) {
                    clearInterval(interval);
                }
                return nextState;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState?.phase, gameState?.gameOver, gameState?.gameWon, currentScenario, campaignState]);

    React.useEffect(() => {
        if (tickerMessages.length > 0) {
            const timer = setTimeout(() => {
                setTickerMessages(current => current.slice(1));
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [tickerMessages]);

    // --- Noise Preview Performance Fix ---
    // This effect centralizes the noise preview calculation. It runs only when the plan changes,
    // preventing redundant calculations inside action handlers and eliminating flicker from multiple state updates.
    React.useEffect(() => {
        if (!gameState || !currentScenario || gameState.phase !== 'planning') {
            setNoisePreview(null);
            return;
        }

        const plan = gameState.plan;
        if (plan.length > 0) {
            const lastStep = plan[plan.length - 1];
            const noisyActions: ActionType[] = ['smash', 'smash_door', 'plant_dynamite', 'distract', 'break_window'];

            if (noisyActions.includes(lastStep.action)) {
                // To preview the noise, we need the state of the world *before* this noisy action occurs.
                const tempPlan = plan.slice(0, -1);
                const tempMetrics = calculatePlanMetrics(tempPlan, currentScenario, gameState);
                const timeForProjection = tempMetrics.playerPlannedTimes[lastStep.teamMember];

                const { projectedMap } = getProjectedStateAtTime(tempPlan, currentScenario, gameState.players, timeForProjection);
                const noiseTiles = calculateNoiseSpread(lastStep.target, projectedMap, NOISE_RANGE);
                setNoisePreview(noiseTiles);
            } else {
                setNoisePreview(null);
            }
        } else {
            setNoisePreview(null);
        }
    }, [gameState?.plan, gameState?.phase, currentScenario, gameState?.players]);


    // --- Memoized Callbacks for Performance ---
    const updatePlan = React.useCallback((newPlan: PlanStep[]) => {
        if (!gameState || !currentScenario) return;

        planHistory.current.push(newPlan);
        planFuture.current = [];

        const metrics = calculatePlanMetrics(newPlan, currentScenario, gameState);

        setGameState(prev => prev ? ({ ...prev, plan: newPlan, ...metrics }) : null);

        // Track the last added action if the plan grew
        if (newPlan.length > (gameState.plan?.length || 0)) {
            const lastAction = newPlan[newPlan.length - 1];
            trackActionPlanned(lastAction.action, currentScenario.id);
        }

    }, [gameState, currentScenario]);


    const handleStartHeist = React.useCallback((scenarioId: string, totalHireCost: number) => {
        const scenario = scenarios[scenarioId];
        if (scenario && selectedTeam.length > 0 && campaignState && campaignState.totalCash >= totalHireCost) {
            // FIX: Per user request, do not subtract hire cost at the start of the heist.
            // It will be subtracted from the final take upon successful completion.
            // If the heist fails, the player's account remains identical to what it was before the attempt.

            const players: Player[] = selectedTeam.map((char, index) => {
                const startPos = scenario.startPositions[index] || { x: 1, y: 1 };
                return { name: char.name, skills: char.skills, x: startPos.x, y: startPos.y };
            });

            const initialState = createInitialState(scenario, players);
            setGameState(initialState);
            setCurrentScenario(scenario);
            setScreen('game');
            planHistory.current = [initialState.plan];
            planFuture.current = [];
            setTickerMessages([]);

            // Track scenario start in analytics
            trackScenarioStart(scenarioId, selectedTeam.length);
            setRealWorldHeistStartTime(Date.now());
            setHasStartedHeist(true);
        }
    }, [scenarios, selectedTeam, campaignState, seenMechanics]);

    const checkAndTriggerTutorials = React.useCallback((scenario: Scenario) => {
        const newMechanics: string[] = [];

        // Check for general basics
        if (!seenMechanics.has('basics')) {
            newMechanics.push('basics');
        }

        // Check for guards
        if (scenario.guards.length > 0 && !seenMechanics.has('guards')) {
            newMechanics.push('guards');
        }

        // Check for cameras
        if (scenario.cameras.length > 0 && !seenMechanics.has('cameras')) {
            newMechanics.push('cameras');
        }

        // Check for pressure plates
        if ((scenario.pressurePlates && scenario.pressurePlates.length > 0 || scenario.map.some(row => row.some(t => t === TileType.PRESSURE_PLATE || t === TileType.PRESSURE_PLATE_HIDDEN))) && !seenMechanics.has('pressure_plates')) {
            newMechanics.push('pressure_plates');
        }

        // Check for alarmed doors or objects
        const hasAlarmedThings = scenario.map.some(row => row.some(tile =>
            tile === TileType.DOOR_LOCKED_ALARMED ||
            tile === TileType.DISPLAY_CASE_ALARMED ||
            tile === TileType.SAFE_ALARMED ||
            tile === TileType.ART_PIECE_ALARMED ||
            tile === TileType.STATUE_ALARMED ||
            tile === TileType.GOLD_BARS_ALARMED ||
            tile === TileType.CABINET_ALARMED
        ));

        if (hasAlarmedThings && !seenMechanics.has('alarms')) {
            newMechanics.push('alarms');
        }

        // Check for lasers
        if (scenario.laserGrids && scenario.laserGrids.length > 0 && !seenMechanics.has('lasers')) {
            newMechanics.push('lasers');
        }

        // Check for time locks
        if (scenario.timeLocks && scenario.timeLocks.length > 0 && !seenMechanics.has('time_locks')) {
            newMechanics.push('time_locks');
        }

        // Check for hacking
        if (scenario.hackableTerminals && scenario.hackableTerminals.length > 0 && !seenMechanics.has('hacking')) {
            newMechanics.push('hacking');
        }

        // Check for windows
        if (scenario.map.some(row => row.some(t => t === TileType.WINDOW)) && !seenMechanics.has('windows')) {
            newMechanics.push('windows');
        }

        // Check for consumables (if player has items in inventory)
        if (gameState && Object.values(gameState.inventory).some(count => (count as number) > 0) && !seenMechanics.has('consumables')) {
            newMechanics.push('consumables');
        }

        if (newMechanics.length > 0) {
            // Update seen mechanics instantly
            const updatedSeen = new Set(seenMechanics);
            newMechanics.forEach(m => updatedSeen.add(m));
            setSeenMechanics(updatedSeen);
            localStorage.setItem('seenMechanics', JSON.stringify(Array.from(updatedSeen)));

            // Queue up the tutorials
            setTutorialQueue(prev => [...prev, ...newMechanics]);
        }
    }, [seenMechanics]);

    const handleStartHeistAction = React.useCallback((scenarioId: string, totalHireCost: number) => {
        handleStartHeist(scenarioId, totalHireCost);
        const scenario = scenarios[scenarioId];
        if (scenario) {
            checkAndTriggerTutorials(scenario);
        }
    }, [handleStartHeist, scenarios, checkAndTriggerTutorials]);

    const executeReturnToHub = React.useCallback(() => {
        // Check if we just finished the final scenario
        if (currentScenario?.id === 's06_penthouse' && gameState?.gameWon) {
            setShowOperationsCompletedMessage(true);
        }

        setGameState(null);
        setCurrentScenario(null);
        setScreen('campaignHub');
        setIsTargeting(null);
        setTickerMessages([]);
        setHeistReportData(null);
        setIsGeneratingReport(false);
        setNoisePreview(null);
    }, [currentScenario, gameState]);

    const handleAbortMissionClick = React.useCallback(() => {
        setIsAbortModalVisible(true);
    }, []);

    const handleTryAgainNewPlan = React.useCallback(() => {
        if (!currentScenario || selectedTeam.length === 0) return;

        const players: Player[] = selectedTeam.map((char, index) => {
            const startPos = currentScenario.startPositions[index] || { x: 1, y: 1 };
            return { name: char.name, skills: char.skills, x: startPos.x, y: startPos.y };
        });

        const initialState = createInitialState(currentScenario, players);
        setGameState(initialState);
        planHistory.current = [initialState.plan];
        planFuture.current = [];
        setTickerMessages([]);
        setHeistReportData(null);
        setIsGeneratingReport(false);
        setNoisePreview(null);
    }, [currentScenario, selectedTeam]);

    const handleTryAgainEditPlan = React.useCallback(() => {
        if (!preExecutionStateRef.current) {
            handleTryAgainNewPlan();
            return;
        }

        const restoredState = deepClone(preExecutionStateRef.current);
        setGameState(restoredState);

        planHistory.current = preExecutionPlanHistoryRef.current;
        planFuture.current = [];

        setTickerMessages([]);
        setHeistReportData(null);
        setIsGeneratingReport(false);
        setNoisePreview(null);
    }, [handleTryAgainNewPlan]);

    const handleSelectTeam = React.useCallback((scenarioId: string) => {
        const scenario = scenarios[scenarioId];
        if (scenario) {
            setCurrentScenario(scenario);
            setSelectedTeam([]);
            setScreen('briefing');
        }
    }, [scenarios]);

    const handleEditScenario = React.useCallback((scenarioId: string) => {
        setEditingScenario(scenarios[scenarioId]);
        setScreen('mapEditor');
    }, [scenarios]);

    const handleSaveScenario = React.useCallback(async (editedData: { name: string, description: string, map: TileType[][], cameras: Camera[], guards: Guard[], treasures: { [key: string]: number }, laserGrids: LaserGrid[], pressurePlates: PressurePlate[], timeLocks: TimeLock[], speedRunTime: number, primaryTarget?: { x: number, y: number }, secondaryTarget?: { x: number, y: number } }) => {
        if (editingScenario) {
            const updatedScenario = { ...editingScenario, ...editedData };
            await saveScenarioToDB(updatedScenario);
            const loadedScenarios = await loadScenarios();
            setScenarios(loadedScenarios);
            setEditingScenario(null);
            setScreen('campaignHub');
        }
    }, [editingScenario]);

    const handleCreateNewScenario = React.useCallback(() => {
        const newScenario: Scenario = {
            id: `custom_${Date.now()}`,
            name: "New Custom Heist",
            description: "A brand new challenge awaits.",
            initialMessage: "Time to get to work.",
            map: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(TileType.EXTERIOR)),
            cameras: [],
            guards: [],
            laserGrids: [],
            pressurePlates: [],
            timeLocks: [],
            startPositions: [{ x: 5, y: 5 }, { x: 6, y: 5 }],
            treasures: {},
            tier: 0,
            reputationRequired: 0,
            reputationRewards: { base: 10, stealth: 5, speed: 5, fullLoot: 5 },
            speedRunTime: 120,
        };
        setEditingScenario(newScenario);
        setScreen('mapEditor');
    }, []);

    const handleDeleteScenario = React.useCallback(async (id: string) => {
        if (window.confirm(`Are you sure you want to delete "${scenarios[id].name}"?`)) {
            await deleteScenarioFromDB(id);
            const loadedScenarios = await loadScenarios();
            setScenarios(loadedScenarios);
        }
    }, [scenarios]);

    const handleThemeToggle = React.useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    /*
    const handleMusicToggle = React.useCallback(() => {
        if (!musicRef.current) {
            console.error('Music ref is null');
            return;
        }

        console.log('Music toggle clicked. Current state:', isMusicPlaying);
        console.log('Audio element:', musicRef.current);
        console.log('Audio ready state:', musicRef.current.readyState);
        console.log('Audio paused:', musicRef.current.paused);

        if (isMusicPlaying) {
            musicRef.current.pause();
            setIsMusicPlaying(false);
            console.log('Music paused');
        } else {
            // Reset to beginning if needed
            if (musicRef.current.ended) {
                musicRef.current.currentTime = 0;
            }

            const playPromise = musicRef.current.play();
            console.log('Play promise:', playPromise);

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Music started playing successfully');
                    setIsMusicPlaying(true);
                }).catch(error => {
                    console.error("Audio playback failed:", error);
                    console.error("Error name:", error.name);
                    console.error("Error message:", error.message);
                    setIsMusicPlaying(false);
                });
            } else {
                // Old browsers might not return a promise
                setIsMusicPlaying(true);
            }
        }
    }, [isMusicPlaying]);
    */

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleResetCampaign = async () => {
        if (confirm("Are you sure you want to RESET your entire campaign? This will wipe all progress and reputation.")) {
            const newCampaign: CampaignState = {
                id: 'player_career',
                totalCash: 1000,
                reputation: 0,
                unlockedScenarios: [scenarioOrder[0]],
                completedObjectives: {},
            };
            await saveCampaignStateToDB(newCampaign);
            setCampaignState(newCampaign);
            window.location.reload();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('Failed to read file content.');
                }
                const importedScenario: Partial<Scenario> = JSON.parse(text);

                console.log("Imported JSON:", importedScenario);

                const missingFields = [];
                if (!importedScenario.id) missingFields.push('id');
                if (!importedScenario.name) missingFields.push('name');
                if (!importedScenario.map) missingFields.push('map');

                if (missingFields.length > 0) {
                    console.error("Missing fields:", missingFields);
                    alert(`Invalid scenario file. Missing required fields: ${missingFields.join(', ')}.`);
                    return;
                }

                // Check for compressed map format
                if (!Array.isArray(importedScenario.map) && (importedScenario.map as any).data && (importedScenario.map as any).offset) {
                    try {
                        console.log("Detected compressed map format. Expanding...");
                        importedScenario.map = expandCompressedMap(importedScenario.map as any);
                    } catch (err) {
                        console.error("Failed to expand map", err);
                        alert("Failed to expand compressed map data.");
                        return;
                    }
                }

                let finalScenario = importedScenario as Scenario;

                // Check if scenario already exists
                if (scenarios[finalScenario.id]) {
                    if (window.confirm(`A scenario with ID "${finalScenario.id}" already exists. Do you want to overwrite it?`)) {
                        // Overwrite: do nothing, just proceed to save
                    } else {
                        const oldId = finalScenario.id;
                        finalScenario.id = `${finalScenario.id}_imported_${Date.now()}`;
                        alert(`Scenario imported with new ID: "${finalScenario.id}" to avoid overwriting "${oldId}".`);
                    }
                }

                // Ensure basic properties
                finalScenario.tier = finalScenario.tier || 0;
                finalScenario.reputationRequired = finalScenario.reputationRequired || 0;

                await saveScenarioToDB(finalScenario);

                const updatedScenarios = await loadScenarios();
                setScenarios(updatedScenarios);

                alert(`Successfully imported scenario: "${finalScenario.name}"`);

            } catch (error) {
                console.error("Error importing scenario:", error);
                alert(`Failed to import scenario. Make sure it's a valid JSON file. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleSaveCampaignToFile = React.useCallback(() => {
        if (!campaignState) {
            alert('No campaign data to save.');
            return;
        }

        try {
            exportCampaignToFile(campaignState);
            alert('Campaign saved successfully!');
        } catch (error) {
            console.error('Error saving campaign:', error);
            alert(`Failed to save campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [campaignState]);

    const handleLoadCampaignClick = React.useCallback(() => {
        campaignFileInputRef.current?.click();
    }, []);

    const handleCampaignFileChange = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('Failed to read file content.');
                }

                const importedCampaign = await importCampaignFromFile(text);

                // Save to database and update state
                await saveCampaignStateToDB(importedCampaign);
                setCampaignState(importedCampaign);

                // Reload scenarios in case campaign unlocked new ones
                const updatedScenarios = await loadScenarios();
                setScenarios(updatedScenarios);

                alert('Campaign loaded successfully!');
            } catch (error) {
                console.error('Error loading campaign:', error);
                alert(`Failed to load campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    }, []);

    const handleSelectItemToBuy = React.useCallback((item: ConsumableItem) => {
        setItemToBuy(item);
    }, []);

    const handleCancelBuyItem = React.useCallback(() => {
        setItemToBuy(null);
    }, []);

    const handleConfirmBuyItem = React.useCallback(() => {
        if (!itemToBuy || !gameState) return;

        const newInventory = { ...gameState.inventory };
        newInventory[itemToBuy.id] = (newInventory[itemToBuy.id] || 0) + 1;

        setGameState(prev => prev ? ({ ...prev, inventory: newInventory }) : null);

        setItemToBuy(null);
    }, [itemToBuy, gameState]);

    const gearCost = React.useMemo(() => {
        if (!gameState) return 0;
        let totalCost = 0;
        for (const itemId in gameState.inventory) {
            const count = gameState.inventory[itemId];
            if (count > 0) {
                const item = Object.values(CONSUMABLE_ITEMS).find(i => i.id === itemId);
                if (item) {
                    totalCost += count * item.cost;
                }
            }
        }
        return totalCost;
    }, [gameState?.inventory]);

    // --- Game Action Handlers (Passed to ControlPanel via Context) ---

    const handleMove = React.useCallback((dx: number, dy: number) => {
        if (!gameState || gameState.phase !== 'planning' || !currentScenario) return;
        const timeForProjection = gameState.playerPlannedTimes[gameState.currentPlayer];
        const { projectedPlayers, projectedMap, projectedLaserGrids, projectedPressurePlates } = getProjectedStateAtTime(gameState.plan, currentScenario, gameState.players, timeForProjection);
        const player = projectedPlayers[gameState.currentPlayer];
        const newX = player.x + dx;
        const newY = player.y + dy;

        if (newY < 0 || newY >= projectedMap.length || newX < 0 || newX >= projectedMap[0].length) return;

        const targetTile = projectedMap[newY][newX];
        const isTargetWalkable = isWalkable(targetTile);
        const isTargetCar = targetTile === TileType.CAR;
        const isOccupied = !isTargetCar && projectedPlayers.some(p => p.x === newX && p.y === newY);

        const isLaser = projectedLaserGrids.some(grid => grid.active && grid.beamsOn && grid.beamTiles.some(t => t.x === newX && t.y === newY));
        const plate = projectedPressurePlates.find(p => p.x === newX && p.y === newY);
        const isArmedPressurePlate = (targetTile === TileType.PRESSURE_PLATE || targetTile === TileType.PRESSURE_PLATE_HIDDEN) && plate && !plate.disabled && !plate.foamTimer;

        const isInfiltrator = (player.skills.infiltrator || 0) > 0;

        // A move is valid if the target is walkable, not occupied by another player, and not an active pressure plate.
        // Infiltrators can step on pressure plates (and lasers) undetected.
        if (isTargetWalkable && !isOccupied && (!isArmedPressurePlate || isInfiltrator)) {
            let timeCost = TIME_COST.MOVE;

            // If moving onto a laser, check for Infiltrator skill to adjust time.
            if (isLaser) {
                const skillLevel = player.skills.infiltrator || 0;
                if (skillLevel === 1) {
                    timeCost = 5; // Level 1 Infiltrator takes 5 seconds.
                } else if (skillLevel >= 2) {
                    timeCost = 3; // Level 2 Infiltrator takes 3 seconds.
                }
                // For non-infiltrators, timeCost remains the default move time. The alarm is handled in the tick function.
            }
            // If moving onto a pressure plate, Infiltrators take extra time to be careful.
            else if (isArmedPressurePlate && isInfiltrator) {
                const skillLevel = player.skills.infiltrator || 0;
                timeCost = skillLevel >= 2 ? 3 : 5;
            }

            const newStep: PlanStep = {
                action: 'move',
                teamMember: gameState.currentPlayer,
                target: { x: newX, y: newY },
                timeCost: timeCost
            };
            updatePlan([...gameState.plan, newStep]);
        }
    }, [gameState, currentScenario, updatePlan]);

    const handleInteract = React.useCallback((action: ActionType, target?: { x: number, y: number }, targetId?: number | string) => {
        if (!gameState || !currentScenario) return;

        const timeForProjection = gameState.playerPlannedTimes[gameState.currentPlayer];
        const { projectedPlayers } = getProjectedStateAtTime(gameState.plan, currentScenario, gameState.players, timeForProjection);
        const player = projectedPlayers[gameState.currentPlayer];

        if (action === 'plant_dynamite' && target) {
            const newStep: PlanStep = {
                action: 'plant_dynamite',
                teamMember: gameState.currentPlayer,
                target: target,
                timeCost: getSkillAdjustedTime('plant_dynamite', player),
                dynamiteTimer: 11 // Use constant for fuse time
            };
            updatePlan([...gameState.plan, newStep]);
            return;
        }

        if (action === 'distract' && !target) {
            setIsTargeting('distract');
            const validTargets = getValidTargetsForDistraction(player, getProjectedStateAtTime(gameState.plan, currentScenario, gameState.players, timeForProjection).projectedMap);
            setValidTargets(validTargets);
            return;
        }

        if (action === 'use_stun_o_mat' && !target) {
            setIsTargeting('use_stun_o_mat');
            const { projectedMap } = getProjectedStateAtTime(gameState.plan, currentScenario, gameState.players, timeForProjection);
            const validTargets = getValidTargetsForStunOMat(player, projectedMap);
            setValidTargets(validTargets);
            return;
        }

        if (!target) return;

        const { projectedPlayers: projectedPlayersForCost, projectedPlayerKeys } = getProjectedStateAtTime(gameState.plan, currentScenario, gameState.players, timeForProjection);

        const newStep: PlanStep = {
            action,
            teamMember: gameState.currentPlayer,
            target: target,
            targetId: targetId,
            timeCost: getSkillAdjustedTime(
                action,
                player,
                { ...gameState, playerKeys: projectedPlayerKeys }, // Pass projected keys to correctly calculate time reduction
                target,
                gameState.currentPlayer
            ),
        };
        updatePlan([...gameState.plan, newStep]);

    }, [gameState, currentScenario, updatePlan]);

    const handleTargetSelection = React.useCallback((x: number, y: number) => {
        if (!isTargeting || !gameState || !validTargets.some(t => t.x === x && t.y === y)) return;
        handleInteract(isTargeting, { x, y });
        setIsTargeting(null);
        setValidTargets([]);
    }, [isTargeting, gameState, validTargets, handleInteract]);

    const handleCancelTargeting = React.useCallback(() => {
        setIsTargeting(null);
        setValidTargets([]);
    }, []);

    const handleWait = React.useCallback((duration: number) => {
        if (!gameState) return;
        const { projectedPlayers } = getProjectedStateAtTime(gameState.plan, currentScenario!, gameState.players, gameState.playerPlannedTimes[gameState.currentPlayer]);
        const player = projectedPlayers[gameState.currentPlayer];
        const newStep: PlanStep = {
            action: 'wait', teamMember: gameState.currentPlayer,
            target: { x: player.x, y: player.y }, timeCost: duration
        };
        updatePlan([...gameState.plan, newStep]);
    }, [gameState, currentScenario, updatePlan]);

    const handleUndo = React.useCallback(() => {
        if (!currentScenario || !gameState) return;

        // Per-player undo: Find the last action for the current player
        const lastPlayerActionIndex = [...gameState.plan].reverse().findIndex(step => step.teamMember === gameState.currentPlayer);

        if (lastPlayerActionIndex === -1) {
            // If no actions for current player, fallback to global undo if history exists
            if (planHistory.current.length > 1) {
                planFuture.current.unshift(planHistory.current.pop()!);
                const newPlan = planHistory.current[planHistory.current.length - 1];
                const metrics = calculatePlanMetrics(newPlan, currentScenario, gameState);
                setGameState(prev => prev ? ({ ...prev, plan: newPlan, ...metrics }) : null);
            }
            return;
        }

        const actualIndex = gameState.plan.length - 1 - lastPlayerActionIndex;
        const newPlan = [...gameState.plan];
        newPlan.splice(actualIndex, 1);

        updatePlan(newPlan);
    }, [currentScenario, gameState, updatePlan]);

    const handleRewindPlan = React.useCallback((stepIndex: number) => {
        if (!gameState) return;
        const newPlan = gameState.plan.slice(0, stepIndex + 1);
        updatePlan(newPlan);
    }, [gameState, updatePlan]);

    const handleSwitchPlayer = React.useCallback(() => {
        if (!gameState) return;
        setGameState(prev => prev ? ({ ...prev, currentPlayer: (prev.currentPlayer + 1) % prev.players.length }) : null);
    }, [gameState]);

    const handleToggleGodMode = React.useCallback(() => {
        if (!isGodMode) {
            // Turning ON: Show modal to confirm and save
            setShowGodModeModal(true);
        } else {
            // Turning OFF: Restore previous state immediately
            setIsGodMode(false);
            if (preGodModeState) {
                setCampaignState(deepClone(preGodModeState));
                setPreGodModeState(null);
            }
        }
    }, [isGodMode, preGodModeState]);

    const handleConfirmGodMode = React.useCallback(() => {
        if (campaignState) {
            // 1. Save CURRENT (clean) state to disk (uses new default naming convention)
            exportCampaignToFile(campaignState);

            // 2. Activate God Mode in memory
            setPreGodModeState(deepClone(campaignState));
            const godModeState = {
                ...campaignState,
                totalCash: 1000000,
                reputation: 1000
            };
            setCampaignState(godModeState);
            setIsGodMode(true);
        }
        setShowGodModeModal(false);
    }, [campaignState]);

    const handleExecutePlan = React.useCallback(() => {
        if (!gameState) return;

        // Only check for gear cost if campaign state exists AND we're in campaign mode
        // In god mode or direct scenario testing, skip the gear cost check
        if (campaignState && !isGodMode) {
            const currentGearCost = gearCost;
            if (campaignState.totalCash < currentGearCost) {
                setGameState(prev => prev ? ({ ...prev, message: `Not enough cash for gear! Need $${currentGearCost.toLocaleString()}.` }) : null);
                return;
            }
        }

        preExecutionStateRef.current = deepClone(gameState);
        preExecutionPlanHistoryRef.current = deepClone(planHistory.current);

        const executionPlanIndices = gameState.players.map((_, i) => gameState.plan.findIndex(step => step.teamMember === i));
        const timeForCurrentActions = executionPlanIndices.map(index => index > -1 ? gameState.plan[index].timeCost : 0);

        // Reset guard investigation states from planning phase
        const resetGuards = gameState.guards.map(guard => ({
            ...guard,
            hasBeenSuspicious: false,
            suspicion_target: undefined,
            distractionPath: undefined
        }));

        setGameState(prev => prev ? ({
            ...prev,
            phase: 'execution',
            message: 'The heist is on! Good luck.',
            executionPlanIndices,
            timeForCurrentActions,
            isDoorSmashed: prev.plan.some(s => s.action === 'smash_door'),
            guards: resetGuards
        }) : null);
    }, [gameState, campaignState, gearCost, isGodMode]);

    const handleEveryBodyRun = React.useCallback(() => {
        if (!gameState || !currentScenario) {
            console.log('[EveryBodyRun] Failed: No game state or scenario');
            return;
        }
        let carPos: { x: number, y: number } | null = null;
        for (let y = 0; y < gameState.map.length; y++) {
            for (let x = 0; x < gameState.map[y].length; x++) {
                if (gameState.map[y][x] === TileType.CAR) { carPos = { x, y }; break; }
            }
            if (carPos) break;
        }
        if (!carPos) {
            console.log('[EveryBodyRun] Failed: No car found on map');
            setGameState(prev => prev ? ({ ...prev, message: 'Error: No getaway car found!' }) : null);
            return;
        }

        let newPlan: PlanStep[] = [];
        let newPlayerPlannedTimes = [...gameState.playerPlannedTimes];

        console.log('[EveryBodyRun] Processing players:', gameState.players.map((p, i) => ({
            name: p.name,
            status: gameState.playerStatuses[i],
            pos: { x: p.x, y: p.y }
        })));

        // Create a temporary map to track state changes during the escape planning
        // (e.g. if Player 1 smashes a door, Player 2 sees it as smashed)
        const escapeMap = gameState.map.map(row => [...row]);

        gameState.players.forEach((player, i) => {
            // Skip captured or knocked-out players
            if (gameState.playerStatuses[i] === 'captured' || gameState.playerStatuses[i] === 'knocked_out') {
                console.log(`[EveryBodyRun] Skipping ${player.name}: ${gameState.playerStatuses[i]}`);
                return;
            }

            // Recalculate path based on the *current* escape map state.
            // This allows the second player to take advantage of doors opened by the first player.
            const path = findFastestEscapePath(player, carPos!, escapeMap);
            console.log(`[EveryBodyRun] ${player.name} path to car (${carPos!.x}, ${carPos!.y}):`, path.length, 'steps');

            const playerSteps: PlanStep[] = [];

            path.forEach(pos => {
                const tile = escapeMap[pos.y][pos.x];

                if (tile === TileType.DOOR_CLOSED) {
                    const openStep: PlanStep = { action: 'open_door', teamMember: i, target: pos, timeCost: TIME_COST.OPEN_DOOR };
                    playerSteps.push(openStep);
                    escapeMap[pos.y][pos.x] = TileType.DOOR_OPEN; // Update map so others know it's open
                } else if (tile === TileType.DOOR_LOCKED || tile === TileType.DOOR_LOCKED_ALARMED) {
                    const smashStep: PlanStep = { action: 'smash_door', teamMember: i, target: pos, timeCost: TIME_COST.SMASH_DOOR };
                    playerSteps.push(smashStep);
                    escapeMap[pos.y][pos.x] = TileType.DOOR_SMASHED; // Update map so others know it's smashed
                } else if (tile === TileType.WINDOW) {
                    const breakStep: PlanStep = { action: 'break_window', teamMember: i, target: pos, timeCost: TIME_COST.SMASH_DOOR }; // Assuming break window has cost
                    playerSteps.push(breakStep);
                    escapeMap[pos.y][pos.x] = TileType.WINDOW_BROKEN;
                }

                const moveStep: PlanStep = { action: 'move', teamMember: i, target: pos, timeCost: TIME_COST.MOVE };
                playerSteps.push(moveStep);
            });

            newPlan.push(...playerSteps);
            newPlayerPlannedTimes[i] += playerSteps.reduce((acc, step) => acc + step.timeCost, 0);
        });

        console.log('[EveryBodyRun] Total escape plan steps:', newPlan.length);

        // If no active players can escape, don't activate escape mode
        if (newPlan.length === 0) {
            console.log('[EveryBodyRun] Failed: No active players can create escape plan');
            setGameState(prev => prev ? ({ ...prev, message: 'No active crew members can escape!' }) : null);
            return;
        }

        const executionPlanIndices = gameState.players.map((_, i) => newPlan.findIndex(step => step.teamMember === i));
        const timeForCurrentActions = executionPlanIndices.map(index => index > -1 ? newPlan[index].timeCost : 0);
        const newPlannedTime = Math.max(...newPlayerPlannedTimes);

        console.log('[EveryBodyRun] Success! Activating escape mode with plan:', {
            planLength: newPlan.length,
            plannedTime: newPlannedTime,
            executionPlanIndices
        });

        setGameState(prev => prev ? ({
            ...prev,
            plan: newPlan,
            playerPlannedTimes: newPlayerPlannedTimes,
            plannedTime: newPlannedTime,
            isEscaping: true,
            phase: 'execution',
            message: 'The plan is out the window! Get to the car!',
            executionPlanIndices,
            timeForCurrentActions,
        }) : null);
    }, [gameState, currentScenario]);

    const handleSavePlan = () => {
        if (!gameState || !currentScenario) return;
        const planJSON = JSON.stringify(gameState.plan, null, 2);
        const blob = new Blob([planJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan_${currentScenario.id}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setGameState(prev => prev ? ({ ...prev, message: "Plan saved to file." }) : null);
    };

    const handleLoadPlan = () => {
        if (!gameState || !currentScenario) return;
        planFileInputRef.current?.click();
    };

    const handlePlanFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('Failed to read file.');

                const loadedPlan: PlanStep[] = JSON.parse(text);

                // Basic validation
                if (!Array.isArray(loadedPlan)) throw new Error('Invalid plan format: not an array');
                if (loadedPlan.length > 0 && (!loadedPlan[0].action || loadedPlan[0].teamMember === undefined)) {
                    throw new Error('Invalid plan format: missing required fields');
                }

                updatePlan(loadedPlan);
                setGameState(prev => prev ? ({ ...prev, message: "Plan loaded from file." }) : null);
            } catch (error) {
                console.error("Error loading plan:", error);
                setGameState(prev => prev ? ({ ...prev, message: "Error loading plan file." }) : null);
                alert(`Failed to load plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleToggleFreeze = React.useCallback((playerIndex: number) => {
        if (!gameState || gameState.phase !== 'execution') return;

        setGameState(prev => {
            if (!prev) return null;

            const currentStatus = prev.playerStatuses[playerIndex];
            const newStatuses = [...prev.playerStatuses];

            if (currentStatus === 'frozen') {
                newStatuses[playerIndex] = 'executing';
                return { ...prev, playerStatuses: newStatuses };
            }

            if (currentStatus === 'executing' && prev.playerFreezeCharges[playerIndex] > 0) {
                const newCharges = [...prev.playerFreezeCharges];
                newCharges[playerIndex]--;
                newStatuses[playerIndex] = 'frozen';
                return { ...prev, playerStatuses: newStatuses, playerFreezeCharges: newCharges };
            }

            return prev;
        });
    }, [gameState]);

    const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
        if (screen !== 'game' || !gameState || gameState.phase !== 'planning' || isTargeting) {
            return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) {
            return;
        }

        let actionHandled = false;
        switch (e.key) {
            case 'ArrowUp': handleMove(0, -1); actionHandled = true; break;
            case 'ArrowDown': handleMove(0, 1); actionHandled = true; break;
            case 'ArrowLeft': handleMove(-1, 0); actionHandled = true; break;
            case 'ArrowRight': handleMove(1, 0); actionHandled = true; break;
            default: {
                const actionType = KEY_ACTION_MAP[e.key.toLowerCase()];
                if (actionType && currentScenario) {
                    const { projectedInventory } = calculatePlanMetrics(gameState.plan, currentScenario, gameState);
                    const adjacentActions = calculateAdjacentActions(gameState, currentScenario, projectedInventory);
                    const actionToTrigger = adjacentActions.find(a => {
                        if (actionType === 'unlock') return ['unlock', 'lockpick_case'].includes(a.action);
                        if (actionType === 'smash') return ['smash', 'smash_door'].includes(a.action);
                        if (actionType === 'open_door') return ['open_door', 'close_door'].includes(a.action);
                        if (actionType === 'disable') return ['disable', 'disable_alarm', 'disable_cameras', 'disable_lasers', 'disable_pressure_plates'].includes(a.action);
                        return a.action === actionType;
                    });

                    if (actionToTrigger) {
                        handleInteract(actionToTrigger.action, actionToTrigger.target);
                        actionHandled = true;
                    }
                }
            }
        }

        if (actionHandled) {
            e.preventDefault();
        }
    }, [screen, gameState, isTargeting, handleMove, handleInteract, currentScenario]);

    React.useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Close hamburger menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen) {
                const target = event.target as HTMLElement;
                // Check if click is outside the menu
                if (!target.closest('.hamburger-menu-container')) {
                    setIsMenuOpen(false);
                }
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);


    // --- Memoized Derived State for Context ---

    const timeForProjection = gameState ? gameState.playerPlannedTimes[gameState.currentPlayer] : 0;

    // Memoize projection to avoid expensive recalculation on every render
    // Move this OUT of contextValue so it's a valid top-level hook
    // PERFORMANCE: Only recompute when plan, players, or time actually changes
    const projection = React.useMemo(() => {
        if (!gameState || !currentScenario) return null;
        try {
            return getProjectedStateAtTime(gameState.plan, currentScenario, gameState.players, timeForProjection);
        } catch (e) {
            console.error('[projection] Error in getProjectedStateAtTime:', e);
            return null;
        }
    }, [gameState?.plan, currentScenario, gameState?.players, timeForProjection]);

    // Calculate final positions of all players to show as ghosts in planning mode
    // PERFORMANCE: Only recompute when plan or player times change
    const allPlayersFinalPositions = React.useMemo(() => {
        if (!gameState || !currentScenario) return [];
        try {
            const maxTime = Math.max(...gameState.playerPlannedTimes, 1);
            const finalProj = getProjectedStateAtTime(gameState.plan, currentScenario, gameState.players, maxTime);
            if (!finalProj || !finalProj.projectedPlayers) {
                console.error('[allPlayersFinalPositions] getProjectedStateAtTime returned invalid result:', finalProj);
                return [];
            }
            return finalProj.projectedPlayers;
        } catch (e) {
            console.error('[allPlayersFinalPositions] Error in getProjectedStateAtTime:', e);
            return [];
        }
    }, [gameState, currentScenario]);

    const contextValue = React.useMemo(() => {
        if (!gameState || !currentScenario || !projection) return null;

        const { projectedMap, projectedPlayers, projectedCameras, projectedCamerasActive, projectedGuards, projectedLaserGrids, projectedPressurePlates, projectedActiveFuses, projectedStunEffect, detectedHiddenPlates, projectedPlayerKeys, projectedPickpocketedGuards } = projection;

        const usedItems: Record<string, number> = {};
        gameState.plan.forEach(step => {
            const itemInfo = Object.values(CONSUMABLE_ITEMS).find(i => i.action === step.action);
            if (itemInfo) {
                usedItems[itemInfo.id] = (usedItems[itemInfo.id] || 0) + 1;
            }
        });
        const availableInventory: Record<string, number> = {};
        Object.keys(CONSUMABLE_ITEMS).forEach(itemId => {
            availableInventory[itemId] = (gameState.inventory[itemId] || 0) - (usedItems[itemId] || 0);
        });

        // Create a projected game state that includes pickpocketed keys
        const projectedGameState: GameState = {
            ...gameState,
            map: projectedMap,
            players: projectedPlayers,
            guards: projectedGuards,
            playerKeys: projectedPlayerKeys,
            pickpocketedGuards: projectedPickpocketedGuards,
        };

        const adjacentActions = calculateAdjacentActions(projectedGameState, currentScenario, availableInventory);

        const planningMonitoredTiles: GameState['monitoredTiles'] = {};
        if (projectedCamerasActive) {
            projectedCameras.forEach(cam => {
                if (cam.disabled || cam.looperTimer) return;
                const time = timeForProjection;
                // NEW: Sensor Interference - hide vision after duration
                if (cam.hideInPlanningAfter !== undefined && time > cam.hideInPlanningAfter) return;

                const frameIndex = Math.floor(time / cam.period) % cam.pattern.length;
                cam.pattern[frameIndex]?.forEach(pos => {
                    planningMonitoredTiles[`${pos.x}-${pos.y}`] = { status: 'potential', orientation: cam.orientation };
                });
            });
        }

        const projectedGuardVisionTiles = new Set<string>();
        projectedGuards.forEach(guard => {
            // NEW: If patrol is hidden, vision only works at 5-second 'pings' in planning
            if (guard.hidePatrolInPlanning && timeForProjection % 5 !== 0) return;
            calculateGuardVision(guard, projectedMap).forEach(tile => projectedGuardVisionTiles.add(tile));
        });

        const actionTargetMap = new Map<ActionType, { x: number, y: number }[]>();
        for (const action of adjacentActions) {
            if (action.target) {
                if (!actionTargetMap.has(action.action)) {
                    actionTargetMap.set(action.action, []);
                }
                actionTargetMap.get(action.action)!.push(action.target);
            }
        }
        const ambiguousActionTargets = new Map<ActionType, { x: number, y: number }[]>();
        for (const [action, targets] of actionTargetMap.entries()) {
            if (targets.length > 1) {
                ambiguousActionTargets.set(action, targets);
            }
        }

        const activePlayer = projectedPlayers[gameState.currentPlayer];
        const checkMove = (dx: number, dy: number) => {
            const x = activePlayer.x + dx;
            const y = activePlayer.y + dy;
            if (y < 0 || y >= projectedMap.length || x < 0 || x >= projectedMap[0].length) return false;

            const targetTile = projectedMap[y][x];
            const isTargetWalkable = isWalkable(targetTile);
            const isTargetCar = targetTile === TileType.CAR;
            const isOccupied = !isTargetCar && projectedPlayers.some(p => p.x === x && p.y === y);

            const plate = projectedPressurePlates.find(p => p.x === x && p.y === y);
            const isArmedPressurePlate = (targetTile === TileType.PRESSURE_PLATE || targetTile === TileType.PRESSURE_PLATE_HIDDEN) && plate && !plate.disabled && !plate.foamTimer;

            // A move is valid if it's walkable, not occupied, and not an armed pressure plate. Lasers don't block movement.
            return isTargetWalkable && !isOccupied && !isArmedPressurePlate;
        };

        const possibleMoves = {
            up: checkMove(0, -1),
            down: checkMove(0, 1),
            left: checkMove(-1, 0),
            right: checkMove(1, 0),
        };


        return {
            gameState,
            projectedMap,
            projectedPlayers,
            projectedCameras,
            projectedCamerasActive,
            projectedGuards,
            projectedLaserGrids,
            projectedActiveFuses,
            projectedStunEffect,
            detectedHiddenPlates,
            planningMonitoredTiles,
            projectedGuardVisionTiles,
            activePlayer,
            allPlayersFinalPositions,
            ambiguousActionTargets,
            possibleMoves,
            onMapClick: handleTargetSelection,
            isTargeting: !!isTargeting,
            validTargets,
            noisePreview,
            adjacentActions,
            onMove: handleMove,
            onInteract: handleInteract,
            onWait: handleWait,
            onUndo: handleUndo,
            canUndo: planHistory.current.length > 1,
            onExecutePlan: handleExecutePlan,
            onSwitchPlayer: handleSwitchPlayer,
            onEveryBodyRun: handleEveryBodyRun,
            onCancelTargeting: handleCancelTargeting,
            onAbortMission: handleAbortMissionClick,
            onSavePlan: handleSavePlan,
            onLoadPlan: handleLoadPlan,
            onToggleFreeze: handleToggleFreeze,
            onRewindPlan: handleRewindPlan,
            planLength: gameState.plan.length,
            campaignState,
            gearCost,
            itemToBuy,
            handleSelectItemToBuy,
            handleConfirmBuyItem,
            handleCancelBuyItem,
            currentScenarioTier: currentScenario.tier,
            currentScenario,
        };
    }, [gameState, currentScenario, isTargeting, validTargets, handleMove, handleInteract, handleWait, handleUndo, handleSwitchPlayer, handleExecutePlan, handleEveryBodyRun, handleTargetSelection, handleCancelTargeting, handleAbortMissionClick, handleToggleFreeze, campaignState, gearCost, itemToBuy, handleSelectItemToBuy, handleConfirmBuyItem, handleCancelBuyItem, noisePreview, handleRewindPlan, projection, timeForProjection, allPlayersFinalPositions]);

    // --- UI Rendering ---

    const renderWelcomeScreen = () => {
        if (!showWelcomeScreen) return null;

        return (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 md:p-4 overflow-hidden bg-slate-950/40 backdrop-blur-sm">
                {/* Backdrop Texture */}
                <div className="absolute inset-0 z-0 bg-manila opacity-40 dark:opacity-20 pointer-events-none" />

                <div className="max-w-xl w-full max-h-[92dvh] overflow-y-auto bg-parchment dark:bg-slate-900 border-4 border-slate-900 dark:border-slate-800 rounded-sm p-5 md:p-12 text-center relative z-10 animate-scale-in flex flex-col shadow-[15px_15px_0px_rgba(0,0,0,0.2)] dark:shadow-[15px_15px_0px_rgba(30,41,59,0.5)]">
                    {/* Inner Texture */}
                    <div className="absolute inset-0 z-0 bg-manila opacity-20 pointer-events-none" />
                    <div className="absolute inset-0 z-0 bg-white/40 dark:hidden mix-blend-overlay pointer-events-none" />

                    <div className="relative z-10">
                        <div className="mb-3 md:mb-6 relative">
                            <h1 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter border-b-4 md:border-b-8 border-slate-900 dark:border-white/10 pb-2 mb-2 italic">
                                {t('ui.welcome_title')}
                            </h1>
                            <p className="text-evidence font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
                                Operational Command // Authorization Required
                            </p>
                        </div>

                        <div className="bg-slate-900/5 dark:bg-cyan-500/10 py-2 md:py-4 px-4 md:px-6 rounded-lg mb-3 md:mb-8 border-2 border-slate-900/10 dark:border-cyan-500/20 transform rotate-1">
                            <h2 className="text-slate-700 dark:text-cyan-400 font-handwriting text-base md:text-xl">
                                {t('ui.welcome_tagline')}
                            </h2>
                        </div>

                        <p className="text-slate-800 dark:text-slate-300 text-sm md:text-lg leading-relaxed mb-4 md:mb-10 font-medium px-2 md:px-4 font-typewriter">
                            {t('ui.welcome_summary')}
                        </p>

                        <button
                            onClick={() => {
                                setShowWelcomeScreen(false);
                                if (!isRecruited) {
                                    setIsRecruited(true);
                                    localStorage.setItem('isRecruited', 'true');
                                }
                            }}
                            className="w-full mb-4 md:mb-8 flex justify-center"
                        >
                            <div className="btn-stamp bg-evidence text-white border-evidence hover:bg-red-800 py-3 md:py-6 text-sm md:text-xl font-black uppercase tracking-[0.3em] shadow-lg w-full max-w-sm">
                                {t('ui.begin_operations')}
                            </div>
                        </button>

                        <div className="flex items-center justify-center gap-3 text-slate-500 dark:text-white/20 text-[9px] font-mono tracking-widest uppercase">
                            <span>{t('ui.game_version')}</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            <span>{t('ui.welcome_subtitle')}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderOperationsCompletedModal = () => {
        if (!showOperationsCompletedMessage) return null;

        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <div className="max-w-xl w-full max-h-[92dvh] overflow-y-auto bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-5 md:p-10 animate-scale-in text-center shadow-[0_0_100px_rgba(6,182,212,0.3)]">
                    <div className="text-4xl md:text-6xl mb-3 md:mb-6">🏆</div>
                    <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight mb-3 md:mb-4">
                        {t('ui.operations_completed.title')}
                    </h2>
                    <div className="space-y-3 md:space-y-4 text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-5 md:mb-8">
                        <p>
                            {t('ui.operations_completed.text1')}
                        </p>
                        {t('ui.operations_completed.text2')}
                        <p>
                            {t('ui.operations_completed.text3')}
                        </p>
                        <p className="text-cyan-400 font-bold italic">
                            {t('ui.operations_completed.footer')}
                            <br />K.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowOperationsCompletedMessage(false)}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-3 md:py-4 rounded-2xl uppercase tracking-[0.2em] text-sm transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
                    >
                        {t('ui.return_to_hub')}
                    </button>
                </div>
            </div>
        );
    };

    const renderRecruitmentModal = () => {
        if (isRecruited || showWelcomeScreen) return null;

        const handleRecruited = () => {
            setIsRecruited(true);
            localStorage.setItem('isRecruited', 'true');
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-y-auto">
                <div className="max-w-3xl w-full bg-slate-900 border-2 border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.2)] animate-scale-in my-8">
                    {/* Header Image Section */}
                    <div className="relative h-72 overflow-hidden">
                        <img
                            src="crime_coordinator_recruitment.png"
                            alt="Heistology Recruitment"
                            className="w-full h-full object-cover opacity-90 scale-105 hover:scale-100 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                        <div className="absolute bottom-8 left-10">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">{t('ui.recruitment.opening')}</span>
                                <span className="text-cyan-400/80 text-xs font-bold uppercase tracking-widest">{t('ui.recruitment.heistology_inc')}</span>
                            </div>
                            <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
                                {t('ui.recruitment.title_p1')} <span className="text-cyan-400">{t('ui.recruitment.title_p2')}</span>
                            </h2>
                            <p className="text-cyan-200/60 text-sm font-medium tracking-wide uppercase mt-1">{t('ui.recruitment.ref')}</p>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mt-3 border-t border-white/10 pt-3 inline-block">A Tactical Heist Planning Game</p>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        {/* Who We Are */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-cyan-500/50"></span>
                                {t('ui.recruitment.who_we_are_title')}
                            </h3>
                            <p className="text-slate-300 leading-relaxed font-medium">
                                {t('ui.recruitment.who_we_are_text')}
                            </p>
                        </div>

                        {/* Match Criteria */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-cyan-500/50"></span>
                                {t('ui.recruitment.match_criteria_title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                    <p className="text-slate-400 text-xs leading-relaxed">{t('ui.recruitment.match_1')}</p>
                                </div>
                                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                    <p className="text-slate-400 text-xs leading-relaxed">{t('ui.recruitment.match_2')}</p>
                                </div>
                                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                    <p className="text-slate-400 text-xs leading-relaxed">{t('ui.recruitment.match_3')}</p>
                                </div>
                                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                    <p className="text-slate-400 text-xs leading-relaxed">{t('ui.recruitment.match_4')}</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleRecruited}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-2xl uppercase tracking-widest text-sm transition-all border border-white/10 hover:border-cyan-500/50"
                            >
                                {t('ui.easy_apply')}
                            </button>
                            <button
                                onClick={handleRecruited}
                                className="flex-[1.5] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 px-6 rounded-2xl uppercase tracking-[0.2em] text-sm transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                            >
                                {t('ui.offer_no_refuse')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTutorialModal = () => {
        const currentTutorial = tutorialQueue[0];
        if (!currentTutorial) return null;

        const tutorialContent: Record<string, { title: string, description: string, icon: string, color?: string }> = {
            'guards': {
                title: t('ui.features.guards.name'),
                description: t('ui.features.guards.desc'),
                icon: '👮',
                color: 'blue'
            },
            'cameras': {
                title: t('ui.features.cameras.name'),
                description: t('ui.features.cameras.desc'),
                icon: '📹',
                color: 'blue'
            },
            'pressure_plates': {
                title: t('ui.features.pressure_plates.name'),
                description: t('ui.features.pressure_plates.desc'),
                icon: '📐',
                color: 'blue'
            },
            'alarms': {
                title: t('ui.features.alarms.name'),
                description: t('ui.features.alarms.desc'),
                icon: '🚨',
                color: 'red'
            },
            'lasers': {
                title: t('ui.features.lasers.name'),
                description: t('ui.features.lasers.desc'),
                icon: '⚡',
                color: 'blue'
            },
            'time_locks': {
                title: t('ui.features.time_locks.name'),
                description: t('ui.features.time_locks.desc'),
                icon: '🕒',
                color: 'blue'
            },
            'hacking': {
                title: t('ui.features.hacking.name'),
                description: t('ui.features.hacking.desc'),
                icon: '💻',
                color: 'cyan'
            },
            'windows': {
                title: t('ui.features.glass.name'),
                description: t('ui.features.glass.desc'),
                icon: '🪟',
                color: 'blue'
            },
            'consumables': {
                title: t('item.consumables.title'),
                description: t('item.consumables.desc'),
                icon: '🎒',
                color: 'cyan'
            },
            'basics': {
                title: t('ui.tutorial.basics.title'),
                description: t('ui.tutorial.basics.desc'),
                icon: '📋',
                color: 'cyan'
            }
        };

        const content = tutorialContent[currentTutorial];
        if (!content) return null;

        const handleDismiss = () => {
            setTutorialQueue(prev => prev.slice(1));
        };

        const colorClasses: Record<string, string> = {
            blue: 'border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.2)] text-blue-400',
            red: 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] text-red-500',
            cyan: 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)] text-cyan-400',
            yellow: 'border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.2)] text-yellow-500'
        };

        const btnClasses: Record<string, string> = {
            blue: 'bg-blue-600 hover:bg-blue-500 text-white',
            red: 'bg-red-600 hover:bg-red-500 text-white',
            cyan: 'bg-cyan-600 hover:bg-cyan-500 text-white',
            yellow: 'bg-yellow-600 hover:bg-yellow-500 text-gray-950'
        };

        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 md:p-4">
                <div className="max-w-md w-full max-h-[90dvh] overflow-y-auto bg-parchment dark:bg-slate-900 border-4 border-slate-900 dark:border-slate-800 rounded-sm p-4 md:p-10 animate-scale-in relative shadow-[20px_20px_0px_rgba(0,0,0,0.2)] dark:shadow-[20px_20px_0px_rgba(30,41,59,0.5)]">
                    {/* Background Detail */}
                    <div className="absolute inset-0 z-0 bg-manila opacity-20 pointer-events-none" />
                    <div className="absolute -top-10 -right-10 text-9xl opacity-10 pointer-events-none transform rotate-12 z-0">{content.icon}</div>

                    <div className="relative z-10">
                        <div className="text-4xl md:text-6xl mb-3 md:mb-6">{content.icon}</div>

                        <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight mb-2 md:mb-4 leading-none text-slate-900 dark:text-white">
                            <span className="text-[10px] block opacity-60 mb-1 md:mb-2 tracking-[0.4em]">{t('ui.asset_intel_acquired')}</span>
                            {content.title}
                        </h3>

                        <p className="text-slate-800 dark:text-slate-300 leading-relaxed font-medium mb-4 md:mb-10 text-sm md:text-lg font-typewriter">
                            {content.description}
                        </p>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDismiss}
                                className="btn-stamp bg-ink text-white border-ink hover:bg-blue-800 flex-1 py-3 md:py-4 text-sm md:text-base font-black uppercase tracking-[0.2em] shadow-lg"
                            >
                                {t('ui.understood')}
                            </button>
                        </div>

                        {tutorialQueue.length > 1 && (
                            <div className="mt-4 md:mt-6 text-center">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black font-mono">
                                    + {t('ui.more_updates', { count: tutorialQueue.length - 1 })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHeader = () => {
        const logoLetters = 'HEISTOLOGY'.split('');

        const getGlowStyle = (index: number, currentTheme: string): React.CSSProperties => {
            const isEscap = index < 5;
            const color = isEscap ? '#1d4ed8' : '#991b1b'; // ink-700, evidence-red

            return {
                color: color,
                fontSize: `${window.innerWidth < 768 ? 1.25 : 2.25 - (Math.abs(index - 4.5) / 4.5) * 0.5}rem`,
                textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.1)',
                display: 'inline-block',
                transform: `rotate(${Math.sin(index) * 2}deg)`,
            };
        };

        return (
            <header className="flex flex-col landscape:flex-row md:flex-row justify-between items-center landscape:h-[6vh] landscape:min-h-[32px] pb-1 landscape:pb-0 md:pb-4 mb-1 landscape:mb-0 md:mb-4 border-b landscape:border-b md:border-b-2 border-gray-200 dark:border-cyan-500/30 flex-shrink-0 px-2 md:px-4 gap-1 landscape:gap-1 md:gap-0 overflow-visible">
                <h1 className="font-extrabold uppercase tracking-widest flex items-baseline landscape:text-sm">
                    {logoLetters.map((letter, index) => (
                        <span key={index} style={getGlowStyle(index, theme)} className="transition-colors duration-300">
                            {letter}
                        </span>
                    ))}
                </h1>
                <div className="flex items-center gap-2 landscape:gap-1 md:gap-6 flex-wrap justify-center landscape:text-xs">
                    {campaignState && (
                        <div className="flex items-center gap-3 md:gap-6 text-sm md:text-xl">
                            <div className="flex items-center gap-1 md:gap-2" title="Total Cash">
                                <MoneyIcon className="w-5 h-5 md:w-7 md:h-7 text-green-500 dark:text-green-400" />
                                <span className="font-bold text-green-600 dark:text-green-300 font-mono">${campaignState.totalCash.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2" title="Reputation">
                                <ReputationIcon className="w-5 h-5 md:w-7 md:h-7 text-yellow-500 dark:text-yellow-400" />
                                <span className="font-bold text-yellow-600 dark:text-yellow-300">{campaignState.reputation} <span className="hidden md:inline text-sm font-normal text-yellow-800 dark:text-yellow-200">({getReputationTitle(campaignState.reputation)})</span></span>
                            </div>
                        </div>
                    )}
                    {GOD_MODE_ENABLED === 1 && (
                        <button
                            onClick={handleToggleGodMode}
                            title="Toggle God Mode (Unlock all heists)"
                            className={`px-3 py-1 rounded-md text-sm font-bold border-2 transition-colors ${isGodMode
                                ? 'bg-yellow-400 border-yellow-300 text-black shadow-lg shadow-yellow-400/50'
                                : 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            GOD MODE: {isGodMode ? 'ON' : 'OFF'}
                        </button>
                    )}
                    <button onClick={handleThemeToggle} className="p-2 landscape:p-1 rounded-full hover:bg-slate-900/10 dark:hover:bg-cyan-500/20 transition-colors" title="Toggle Theme">
                        {theme === 'light'
                            ? <MoonIcon className="w-8 h-8 landscape:w-5 landscape:h-5 text-slate-700" />
                            : <SunIcon className="w-8 h-8 landscape:w-5 landscape:h-5 text-yellow-500" />
                        }
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setI18nLanguage(lang === 'en' ? 'de' : 'en')}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-bold text-xs"
                            title={t('ui.language')}
                        >
                            {lang === 'en' ? '🇬🇧' : '🇩🇪'} {lang.toUpperCase()}
                        </button>
                    </div>

                    <button
                        onClick={() => setIsHandbookVisible(true)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-cyan-500/20 transition-colors"
                        title="Open Handbook"
                    >
                        <span className="text-2xl" role="img" aria-label="handbook">📖</span>
                    </button>

                    <div className="relative hamburger-menu-container">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-cyan-500/20 transition-colors"
                            title="System Menu"
                        >
                            <span className="text-2xl leading-none">☰</span>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-manila dark:bg-gray-800 rounded-sm shadow-xl border-4 border-slate-900/10 dark:border-cyan-600 z-[300] font-typewriter">
                                <div className="py-1">
                                    <button
                                        onClick={() => { handleSaveCampaignToFile(); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-900 transition-colors font-bold"
                                    >
                                        💾 {t('ui.menu.save_campaign')}
                                    </button>
                                    <button
                                        onClick={() => { handleLoadCampaignClick(); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors font-bold"
                                    >
                                        📂 {t('ui.menu.load_campaign')}
                                    </button>
                                    <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>
                                    <button
                                        onClick={() => { handleImportClick(); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors font-bold"
                                    >
                                        📥 {t('ui.menu.import_scenario')}
                                    </button>
                                    <button
                                        onClick={handleCreateNewScenario}
                                        className="w-full text-left px-4 py-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 transition-colors font-bold"
                                    >
                                        ✨ {t('ui.menu.create_scenario')}
                                    </button>
                                    <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>
                                    <button
                                        onClick={() => { handleResetCampaign(); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-bold"
                                    >
                                        ⚠️ {t('ui.menu.reset_campaign')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('isRecruited');
                                            localStorage.removeItem('seenMechanics');
                                            window.location.reload();
                                        }}
                                        className="w-full text-left px-4 py-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors font-bold"
                                    >
                                        🔄 {t('ui.menu.reset_intro')}
                                    </button>
                                    <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>
                                    <button
                                        onClick={() => { setIsImprintVisible(true); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors font-bold text-xs"
                                    >
                                        ⚖️ {t('ui.imprint')}
                                    </button>
                                    <button
                                        onClick={() => { setIsCookieBannerOpen(true); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors font-bold text-xs"
                                    >
                                        🍪 {t('cookies.title')}
                                    </button>
                                    <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>
                                    <a
                                        href="https://paypal.me/kengelh"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center gap-3 px-4 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors font-black"
                                    >
                                        <span>☕</span>
                                        <span>{t('ui.menu.buy_coffee')}</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        );
    };

    const renderGodModeModal = () => {
        if (!showGodModeModal) return null;

        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 border-2 border-yellow-500 rounded-2xl p-5 md:p-8 max-w-lg w-full shadow-2xl flex flex-col items-center text-center">
                    <h2 className="text-xl md:text-3xl font-black text-yellow-500 uppercase tracking-widest mb-3 md:mb-4">God Mode Activation</h2>
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-5 md:mb-8 text-sm md:text-lg leading-relaxed">
                        Activating God Mode will save your current campaign state to a separate file so you don't lose your progress.
                    </p>
                    <div className="flex gap-3 md:gap-4 w-full">
                        <button
                            onClick={() => setShowGodModeModal(false)}
                            className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-black uppercase tracking-widest text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmGodMode}
                            className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-yellow-500/10 dark:bg-yellow-500/20 border-2 border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-xl hover:bg-yellow-500 hover:text-white dark:hover:text-black transition-all font-black uppercase tracking-widest text-sm"
                        >
                            Confirm & Save
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderImprintModal = () => {
        if (!isImprintVisible) return null;
        return <ImprintModal onClose={() => setIsImprintVisible(false)} />;
    };

    const renderCampaignHub = () => {
        if (!campaignState) return (
            <div className="flex flex-col h-screen items-center justify-center bg-parchment dark:bg-slate-950 font-typewriter p-8 text-center">
                <div className="absolute inset-0 bg-manila opacity-20 pointer-events-none" />
                <div className="relative z-10 space-y-8 max-w-md">
                    <div className="text-6xl animate-pulse">📁</div>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-slate-800 dark:text-white">
                        {t('ui.loading_campaign')}...
                    </h1>
                    <p className="text-slate-500 text-sm italic">Synchronizing field intelligence and operative status.</p>

                    <div className="pt-12 border-t border-slate-200 dark:border-white/10">
                        <p className="text-xs text-slate-400 mb-4 uppercase tracking-widest">Taking too long?</p>
                        <button
                            onClick={() => { if (confirm('This will wipe your current mission progress and reset the career. Continue?')) { localStorage.clear(); window.location.reload(); } }}
                            className="text-[10px] font-bold text-slate-400 hover:text-evidence transition-colors uppercase underline px-4 py-2"
                        >
                            Force Reset Operations (Wipe Data)
                        </button>
                    </div>
                </div>
            </div>
        );

        // FIX: Cast Object.values to Scenario[] to fix type inference issues in chained methods.
        const unlockedScenarios = (Object.values(scenarios) as Scenario[])
            .filter((scenario) =>
                isGodMode ||
                scenario.tier === 0 || // Always show custom/user-created scenarios
                campaignState.unlockedScenarios.includes(scenario.id)
            )
            .sort((a, b) => {
                if (a.tier === 0 && b.tier !== 0) return 1;
                if (b.tier === 0 && a.tier !== 0) return -1;
                if (a.tier === 0 && b.tier === 0) return a.name.localeCompare(b.name);
                return a.reputationRequired - b.reputationRequired;
            });

        // FIX: Cast Object.values to Scenario[] to fix type inference issues in chained methods.
        const lockedOfficialScenarios = (Object.values(scenarios) as Scenario[])
            .filter((scenario) =>
                !campaignState.unlockedScenarios.includes(scenario.id) &&
                scenario.tier > 0 // Exclude custom scenarios
            )
            .sort((a, b) => a.reputationRequired - b.reputationRequired);

        const highestUnlockedTier = unlockedScenarios
            .filter(s => s.tier > 0)
            .reduce((maxTier, s) => Math.max(maxTier, s.tier), 0);

        let numberOfUnlockCardsToShow = 1;
        if (highestUnlockedTier >= 3) {
            numberOfUnlockCardsToShow = 3;
        } else if (highestUnlockedTier >= 2) {
            numberOfUnlockCardsToShow = 2;
        }

        const nextUnlocks = lockedOfficialScenarios.slice(0, numberOfUnlockCardsToShow);

        const firstUnfinishedId = unlockedScenarios.find(s => !campaignState.completedObjectives[s.id] || campaignState.completedObjectives[s.id].length === 0)?.id;

        return (
            <div className="flex flex-col h-screen font-typewriter relative overflow-hidden bg-parchment dark:bg-slate-950 text-slate-800 dark:text-gray-200">
                {/* Manila Folder Texture Overlay */}
                <div className="absolute inset-0 z-0 bg-manila opacity-50 dark:opacity-20 pointer-events-none" />
                <div className="absolute inset-0 z-0 bg-slate-50/20 dark:bg-slate-950/80 backdrop-blur-[1px]" />
                <div className="absolute top-10 right-10 z-0 coffee-stain opacity-30 w-[400px] h-[400px] pointer-events-none" style={{ transform: 'rotate(15deg)', mixBlendMode: 'multiply' }} />

                <div className="p-4 flex flex-col h-full relative z-10">
                    {renderHeader()}
                    <main className="flex-grow overflow-y-auto pr-1 md:pr-2 bg-transparent backdrop-blur-sm rounded-3xl p-3 md:p-6 border-x border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-8 border-b border-white/10 pb-4 md:pb-6 gap-2 md:gap-0">
                            <div>
                                <h1 className="text-[8px] md:text-[10px] xl:text-xs font-black text-cyan-500 uppercase tracking-[0.5em] mb-1 md:mb-2">{t('ui.operational_command')}</h1>
                                <h2 className="text-2xl md:text-5xl xl:text-6xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('ui.available_jobs').split(' ')[0]} <span className="text-cyan-500">{t('ui.available_jobs').split(' ')[1]}</span></h2>
                            </div>
                            <div className="flex gap-3 items-center relative">
                                {/* Hidden file inputs */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json,application/json"
                                    style={{ display: 'none' }}
                                />
                                <input
                                    type="file"
                                    ref={campaignFileInputRef}
                                    onChange={handleCampaignFileChange}
                                    accept=".json,application/json"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        {unlockedScenarios.length === 1 && unlockedScenarios[0].id === 's00_tutorial' && (
                            <div className="mb-8 p-6 bg-cyan-500/10 border-2 border-dashed border-cyan-500/30 rounded-2xl flex items-center gap-6 animate-fade-in">
                                <div className="text-4xl">👋</div>
                                <div>
                                    <h3 className="text-cyan-500 font-black uppercase tracking-widest text-lg mb-1">{t('ui.hq.welcome_tip_title')}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{t('ui.hq.welcome_tip_desc')}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-8 pb-32">
                            {unlockedScenarios.map((scenario) => {
                                const id = scenario.id;
                                const totalPossibleRep = scenario.reputationRewards.base + scenario.reputationRewards.stealth + scenario.reputationRewards.speed + scenario.reputationRewards.fullLoot + (scenario.secondaryTarget ? Math.floor(scenario.reputationRewards.base / 2) : 0);
                                const isPriority = id === firstUnfinishedId;
                                const isCompleted = campaignState.completedObjectives[id] && campaignState.completedObjectives[id].length > 0;

                                return (
                                    <div key={id} className={`bg-white/10 dark:bg-white/5 backdrop-blur-md border ${isPriority ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] ring-2 ring-cyan-500/20' : 'border-white/10'} rounded-2xl p-4 md:p-6 transition-all duration-300 flex flex-col hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] group relative overflow-hidden h-full`}>
                                        {isPriority && !isCompleted && (
                                            <div className="absolute top-4 right-4 bg-cyan-500 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-[0.2em] shadow-lg animate-pulse z-20">
                                                NEXT PRIORITY
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-2 md:mb-4">
                                            <div className="flex flex-col gap-1">
                                                <h4 className={`text-lg md:text-2xl xl:text-3xl font-black ${isPriority ? 'text-white' : 'text-slate-800 dark:text-cyan-100'} uppercase tracking-tighter leading-tight`}>
                                                    {scenario.tier > 0 ? t(`scenario.${scenario.id}.name`) : scenario.name}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {scenario.id === 's00_tutorial' && <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Training</span>}
                                                    {!isCompleted && <span className="bg-cyan-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-cyan-500/20">NEW JOB</span>}
                                                    {isCompleted && <span className="bg-green-500/20 text-green-500 border border-green-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">COMPLETED</span>}
                                                </div>
                                            </div>
                                            {scenario.tier === 0 && <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full uppercase font-bold tracking-widest">Custom</span>}
                                        </div>

                                        <p className="text-sm md:text-base xl:text-lg text-slate-600 dark:text-slate-400 flex-grow leading-relaxed font-medium mb-6 md:mb-8 italic border-l-2 border-cyan-500/30 pl-4">
                                            {scenario.tier > 0 ? t(`scenario.${scenario.id}.desc`) : scenario.description}
                                        </p>

                                        <div className="mt-auto space-y-4 md:space-y-6">
                                            <div className="flex justify-between items-center text-yellow-600 dark:text-yellow-400 font-bold bg-black/10 p-3 rounded-xl border border-white/5 text-sm">
                                                <span className="flex items-center gap-2"><ReputationIcon className="w-5 h-5" />{t('ui.max_potential')}:</span>
                                                <span className="text-xl font-mono">{totalPossibleRep} RP</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSelectTeam(id)}
                                                    className={`flex-1 px-6 py-4 text-xs md:text-base font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${isPriority ? 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_5px_15px_rgba(6,182,212,0.4)]' : 'bg-slate-700 hover:bg-slate-600'} text-white active:scale-95 flex items-center justify-center gap-3`}
                                                >
                                                    {t('ui.plan_heist')}
                                                    <span className={`text-xl transition-transform group-hover:translate-x-1 ${isPriority ? 'animate-bounce-x' : ''}`}>→</span>
                                                </button>
                                                <button onClick={() => handleEditScenario(id)} className="p-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors" title="Edit Blueprint">✏️</button>
                                                {scenario.tier === 0 && (
                                                    <button onClick={() => handleDeleteScenario(id)} className="p-4 bg-red-900/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-900/20 transition-colors">🗑️</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {!isGodMode && nextUnlocks.map((scenario) => (
                                <div key={`locked-${scenario.id}`} className="bg-white/5 backdrop-blur-md border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center group transition-all">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <LockIcon className="w-10 h-10 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('ui.job_restricted')}</h4>
                                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-500 font-medium">{t('ui.build_reputation')}</p>
                                    <div className="mt-8 bg-cyan-500/10 border border-cyan-500/20 px-6 py-3 rounded-xl">
                                        <span className="text-[10px] uppercase text-cyan-500/60 font-black tracking-[0.2em] block mb-1">{t('ui.reputation_required')}</span>
                                        <div className="flex items-center justify-center gap-3">
                                            <ReputationIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                                            <span className="text-3xl font-black text-yellow-700 dark:text-yellow-400">{scenario.reputationRequired}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
                <BugReportButton gameContext={{ screen: 'campaignHub' }} />
            </div>
        );
    };

    const renderBriefing = () => {
        if (!currentScenario) return null;

        const securityAssets = [
            { name: t('ui.features.guards.name'), count: currentScenario.guards?.length || 0, icon: GuardIcon, color: 'text-red-500' },
            { name: t('ui.features.cameras.name'), count: currentScenario.cameras?.length || 0, icon: CameraIcon, color: 'text-blue-500' },
            { name: t('ui.features.lasers.name'), count: currentScenario.laserGrids?.length || 0, icon: LaserPanelIcon, color: 'text-red-500' },
            { name: t('ui.features.pressure_plates.name'), count: currentScenario.pressurePlates?.length || 0, icon: PressurePlateIcon, color: 'text-blue-500' },
            { name: t('ui.features.time_locks.name'), count: currentScenario.timeLocks?.length || 0, icon: TimeLockSafeIcon, color: 'text-blue-500' },
            { name: t('ui.features.hacking.name'), count: (currentScenario.hackableTerminals || []).length, icon: ComputerTerminalIcon, color: 'text-cyan-500' }
        ].filter(asset => asset.count > 0);

        const newFeaturesMetadata = seenMechanics.has('all') ? [] : [
            (currentScenario.guards?.length || 0) > 0 && !seenMechanics.has('guards') && { name: t('ui.features.guards.name'), description: t('ui.features.guards.desc') },
            (currentScenario.cameras?.length || 0) > 0 && !seenMechanics.has('cameras') && { name: t('ui.features.cameras.name'), description: t('ui.features.cameras.desc') },
            (currentScenario.laserGrids?.length || 0) > 0 && !seenMechanics.has('lasers') && { name: t('ui.features.lasers.name'), description: t('ui.features.lasers.desc') },
            (currentScenario.pressurePlates?.length || 0) > 0 && !seenMechanics.has('pressure_plates') && { name: t('ui.features.pressure_plates.name'), description: t('ui.features.pressure_plates.desc') },
            (currentScenario.timeLocks && currentScenario.timeLocks.length > 0) && !seenMechanics.has('time_locks') && { name: t('ui.features.time_locks.name'), description: t('ui.features.time_locks.desc') },
            (currentScenario.hackableTerminals && currentScenario.hackableTerminals.length > 0) && !seenMechanics.has('hacking') && { name: t('ui.features.hacking.name'), description: t('ui.features.hacking.desc') }
        ].filter(Boolean) as { name: string, description: string }[];

        return (
            <div className="flex flex-col h-screen font-typewriter relative overflow-hidden bg-parchment dark:bg-slate-950">
                {/* Manila Folder Background */}
                <div className="absolute inset-0 z-0 bg-manila opacity-60 dark:opacity-20 pointer-events-none" />
                <div className="absolute inset-0 z-0 bg-white/40 dark:bg-slate-950/80 backdrop-blur-[1px]" />
                <div className="absolute bottom-10 left-10 z-0 coffee-stain opacity-30 w-[300px] h-[300px] pointer-events-none" style={{ transform: 'rotate(-20deg)', mixBlendMode: 'multiply' }} />

                <div className="p-1 md:p-4 flex flex-col h-full relative z-10 flex-grow overflow-hidden">
                    {renderHeader()}
                    <main className="flex-grow flex flex-col items-center justify-start p-2 md:p-4 overflow-y-auto pb-32 md:pb-24">
                        <div className="max-w-5xl w-full bg-slate-50 shadow-inner rounded-sm overflow-visible animate-scale-in relative z-10 border-2 md:border-8 border-slate-900/10">
                            {/* Ultra-Compact Single-Line Header */}
                            <div className="bg-slate-900/5 px-2 py-1 md:px-4 md:py-2 border-b border-slate-900/10 flex flex-wrap items-center gap-2 md:gap-4">
                                <h1 className="text-sm md:text-2xl xl:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                                    {t('ui.mission_briefing')}
                                </h1>
                                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                    <div className="bg-ink/5 border border-ink/20 px-2 py-0.5 md:px-3 md:py-1 rounded-sm">
                                        <span className="text-slate-900 font-black text-[10px] md:text-sm uppercase tracking-tighter">{currentScenario.tier > 0 ? t(`scenario.${currentScenario.id}.name`) : currentScenario.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Optimized Layout: Map -> Assets -> Text -> Objectives */}
                            <div className="p-2 md:p-6 flex flex-col md:flex-row gap-2 md:gap-6">
                                {/* Left Column (Desktop) / Top (Mobile) */}
                                <div className="md:w-5/12 flex-shrink-0 flex flex-col gap-2 md:gap-4">
                                    {/* Map */}
                                    <div className="flex justify-center md:justify-start">
                                        <div className="p-1 bg-blueprint rounded-sm border-2 md:border-4 border-slate-900/10 shadow-inner overflow-hidden inline-block md:block md:w-full">
                                            <div className="hidden md:block">
                                                <MapMiniature scenario={currentScenario} width={350} height={240} />
                                            </div>
                                            <div className="md:hidden">
                                                <MapMiniature scenario={currentScenario} width={280} height={180} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Assets (Below Map, compact row) */}
                                    <div className="flex flex-wrap gap-1 md:gap-2 justify-center md:justify-start bg-slate-900/5 p-2 md:p-3 rounded-sm border border-slate-900/10 shadow-inner">
                                        {securityAssets.map(asset => {
                                            const Icon = asset.icon;
                                            return (
                                                <div key={asset.name} className="flex items-center gap-1.5 bg-white px-2 py-1 md:px-3 md:py-1.5 rounded-sm border border-slate-900/5 shadow-sm">
                                                    <div className="w-3 h-3 md:w-5 md:h-5 flex-shrink-0">
                                                        <Icon className={asset.count > 0 ? (asset.color || 'text-slate-900') : 'text-slate-300'} />
                                                    </div>
                                                    <span className="text-slate-900 font-black text-xs md:text-sm leading-none pt-0.5">{asset.count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Column (Desktop) / Bottom (Mobile) */}
                                <div className="flex-grow flex flex-col gap-2 md:gap-4 h-full">
                                    {/* Welcome Text - Expanded to fill more space if needed */}
                                    <div className="bg-slate-900/5 p-4 md:p-6 border-l-4 border-ink shadow-sm relative overflow-hidden flex-shrink-0">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <span className="font-typewriter text-6xl">"</span>
                                        </div>
                                        <p className="text-slate-800 font-handwriting text-base md:text-lg xl:text-2xl leading-relaxed tracking-wide">
                                            "{currentScenario.tier > 0 ? t(`scenario.${currentScenario.id}.desc`) : currentScenario.description}"
                                        </p>
                                    </div>

                                    {/* Objectives Grid - Now fills remaining space with larger touch targets */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-auto flex-grow">
                                        {/* Primary */}
                                        <div className="flex flex-col gap-3 bg-slate-900/5 p-4 md:p-6 xl:p-8 border-2 border-slate-900/5 hover:border-ink/20 transition-colors rounded-sm h-full justify-center">
                                            <div className="flex items-center gap-3 md:gap-4 mb-1">
                                                <div className="bg-ink text-white font-black w-10 h-10 md:w-12 md:h-12 rounded-sm flex items-center justify-center text-base md:text-lg shadow-sm flex-shrink-0">01</div>
                                                <h4 className="text-slate-900 font-black uppercase tracking-tight text-base md:text-xl xl:text-2xl leading-none">{t('ui.primary_extraction')}</h4>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-500 text-sm md:text-base xl:text-lg leading-relaxed font-medium pl-1">
                                                {t('ui.primary_extraction_desc')}
                                            </p>
                                        </div>
                                        {/* Secondary */}
                                        <div className="flex flex-col gap-3 bg-slate-900/5 p-4 md:p-6 xl:p-8 border-2 border-slate-900/5 hover:border-slate-400/40 transition-colors rounded-sm h-full justify-center">
                                            <div className="flex items-center gap-3 md:gap-4 mb-1">
                                                <div className="bg-slate-400 text-white font-black w-10 h-10 md:w-12 md:h-12 rounded-sm flex items-center justify-center text-base md:text-lg shadow-sm flex-shrink-0">02</div>
                                                <h4 className="text-slate-900 font-black uppercase tracking-tight text-base md:text-xl xl:text-2xl leading-none">{t('ui.timeline_bonus')}</h4>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-500 text-sm md:text-base xl:text-lg leading-relaxed font-medium pl-1">
                                                {t('ui.timeline_bonus_desc', { time: currentScenario.speedRunTime })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Action Buttons - Fixed bottom right, above footer on all screen sizes */}
                    <div className="fixed bottom-4 right-0 left-0 md:left-auto flex gap-1 md:gap-2 justify-end bg-slate-50 p-2 md:p-4 border-t-2 md:border-t-4 border-slate-900/20 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-lg md:rounded-tl-lg md:max-w-md">
                        <button onClick={() => setScreen('campaignHub')} className="btn-stamp text-slate-500 border-slate-500 hover:text-slate-700 text-[10px] md:text-base py-1.5 md:py-3 px-2 md:px-6">{t('ui.cancel_operations')}</button>
                        <button
                            onClick={() => setScreen('teamSelector')}
                            className="btn-stamp bg-ink text-white border-ink hover:bg-blue-800 py-1.5 md:py-4 px-3 md:px-10 text-[10px] md:text-base font-black"
                        >
                            {t('ui.proceed_to_crew_selection')}
                        </button>
                    </div>
                </div>
                <BugReportButton gameContext={{ screen: 'briefing', scenarioId: currentScenario?.id }} />
            </div >
        );
    };


    const renderTeamSelector = () => {
        if (!currentScenario || !campaignState) return null;

        const maxTeamSize = currentScenario.startPositions.length;
        const totalHireCost = selectedTeam.reduce((sum, char) => sum + char.hireCost, 0);
        const remainingCash = campaignState.totalCash - totalHireCost;

        const fullRoster = ROSTER;

        // Robust lookup helper logic
        const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const getCharColor = (name: string) => {
            if (!name) return 'text-slate-900';
            const slug = normalize(name);
            const first = normalize(name.split(' ')[0]);
            return CHARACTER_COLORS[name] ||
                Object.entries(CHARACTER_COLORS).find(([k]) => normalize(k) === slug)?.[1] ||
                Object.entries(CHARACTER_COLORS).find(([k]) => normalize(k) === first)?.[1] ||
                'text-slate-900';
        };

        const getCharIcon = (name: string) => {
            if (!name) return PlayerIcon;
            const slug = normalize(name);
            const first = normalize(name.split(' ')[0]);
            return CharacterIcons[name] ||
                Object.entries(CharacterIcons).find(([k]) => normalize(k) === slug)?.[1] ||
                Object.entries(CharacterIcons).find(([k]) => normalize(k) === first)?.[1] ||
                PlayerIcon;
        };

        const toggleTeamMember = (char: RosterCharacter) => {
            setSelectedTeam(prev => {
                const isSelected = prev.some(c => c.name === char.name);
                if (isSelected) {
                    return prev.filter(c => c.name !== char.name);
                } else {
                    const hasReputation = char.reputationRequired <= campaignState.reputation;
                    if (prev.length < maxTeamSize && hasReputation && char.hireCost <= (campaignState.totalCash - prev.reduce((s, c) => s + c.hireCost, 0))) {
                        return [...prev, char];
                    }
                    return prev;
                }
            });
        };

        return (
            <div className="flex flex-col h-screen font-typewriter relative overflow-hidden bg-parchment dark:bg-slate-950">
                {/* Background Textures */}
                <div className="absolute inset-0 z-0 bg-manila opacity-50 dark:opacity-20 pointer-events-none" />
                <div className="absolute top-1/4 right-1/4 z-0 coffee-stain opacity-30 w-[400px] h-[400px] pointer-events-none" style={{ transform: 'rotate(45deg)', mixBlendMode: 'multiply' }} />

                <div className="p-4 flex flex-col h-full relative z-10 flex-grow overflow-hidden">
                    {renderHeader()}
                    <main className="flex-grow flex flex-col items-center justify-start p-2 md:p-4 overflow-y-auto pb-32 md:pb-24">
                        <div className="w-full max-w-6xl bg-slate-50 shadow-inner rounded-sm p-2 md:p-4 lg:p-8 border-4 md:border-8 border-slate-900/10">
                            {/* Single-Line Header: Title + Budget Equation */}
                            <div className="flex items-center justify-between gap-2 mb-2 md:mb-3 border-b border-slate-900/10 pb-1 md:pb-2">
                                <h2 className="text-sm md:text-xl xl:text-2xl font-black text-slate-900 uppercase tracking-tighter whitespace-nowrap">{t('ui.assemble_crew')}</h2>
                                <p className="text-[9px] md:text-xs text-slate-500 font-handwriting whitespace-nowrap">{t(currentScenario.name)} (Max {maxTeamSize})</p>
                                <div className="flex gap-1 md:gap-2 text-[9px] md:text-sm items-center font-mono whitespace-nowrap">
                                    <span className="text-ink font-bold">${campaignState.totalCash.toLocaleString()}</span>
                                    <span className="text-slate-400">-</span>
                                    <span className="text-evidence font-bold">${totalHireCost.toLocaleString()}</span>
                                    <span className="text-slate-400">=</span>
                                    <span className={`font-black ${remainingCash < 0 ? 'text-evidence' : 'text-ink'}`}>${remainingCash.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-h-[35vh] md:max-h-[50vh] overflow-y-auto pr-2 md:pr-4 mb-4 md:mb-8">
                                {fullRoster
                                    .filter(char => isGodMode || char.reputationRequired <= campaignState.reputation)
                                    .map(char => {
                                        const isSelected = selectedTeam.some(c => c.name === char.name);
                                        const isCaptured = !isGodMode && campaignState.capturedCharacters?.includes(char.name);
                                        const isAffordableNow = char.hireCost <= remainingCash;
                                        const hasReputation = isGodMode || char.reputationRequired <= campaignState.reputation;
                                        const isFull = selectedTeam.length >= maxTeamSize;
                                        const canSelect = !isSelected && !isFull && isAffordableNow && hasReputation && !isCaptured;

                                        let cannotSelectReason = '';
                                        if (!isSelected) {
                                            if (!hasReputation) cannotSelectReason = t('ui.requires_rp', { count: char.reputationRequired });
                                            else if (isFull) cannotSelectReason = t('ui.team_full');
                                            else if (!isAffordableNow) cannotSelectReason = t('ui.too_expensive');
                                        }

                                        return (
                                            <div
                                                key={char.name}
                                                onClick={() => (isSelected || canSelect) && toggleTeamMember(char)}
                                                className={`relative p-2 md:p-4 border-2 md:border-4 rounded-sm transition-all duration-200 flex flex-col bg-white shadow-sm ${isSelected ? 'border-ink scale-[1.02] z-10' :
                                                    canSelect ? `border-slate-900/10 hover:border-ink/50 cursor-pointer ${selectedTeam.length === 0 ? 'ring-2 ring-cyan-400 ring-offset-2 animate-pulse-subtle' : ''}` :
                                                        isCaptured ? 'border-evidence outline-double outline-2 outline-evidence/20 opacity-60' :
                                                            'border-slate-900/5 opacity-40'
                                                    }`}
                                            >
                                                {/* Compact 2-row layout: Row 1: Portrait + Name + Tier | Row 2: Cost + Skills */}
                                                <div className="flex items-center gap-2 mb-1 md:mb-2">
                                                    <div className={`w-6 h-6 md:w-8 md:h-8 ${isSelected || canSelect ? getCharColor(char.name) : 'text-slate-400 opacity-50'} transition-all flex-shrink-0`}>
                                                        {(() => {
                                                            const CardIcon = getCharIcon(char.name);
                                                            return <CardIcon className="w-full h-full" isActive={isSelected || canSelect} />;
                                                        })()}
                                                    </div>
                                                    <h3 className={`text-sm md:text-lg font-black uppercase tracking-tighter flex-grow ${isSelected || canSelect ? 'text-slate-900' : 'text-slate-400'}`}>{char.name}</h3>
                                                    <span className="text-[8px] md:text-[10px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded-sm uppercase">{t('ui.tier', { count: char.tier })}</span>
                                                </div>
                                                <p className="text-[10px] md:text-sm text-ink font-bold font-mono">${char.hireCost.toLocaleString()} ({Math.round(char.share * 100)}%)</p>
                                                <ul className="mt-1 md:mt-2 text-[9px] md:text-xs xl:text-sm space-y-0.5 md:space-y-1 text-slate-500 uppercase font-black">
                                                    {Object.entries(char.skills).map(([skill, level]) => (
                                                        <li key={skill} className="flex justify-between items-center bg-slate-900/5 p-0.5 px-1 md:p-1 md:px-2 rounded-sm" title={t(SKILL_DESCRIPTIONS[skill as Skill])}>
                                                            <span className="opacity-70">{t(`skill.${skill}`)}</span>
                                                            <span className="text-ink text-sm md:text-base xl:text-xl tracking-widest leading-none pb-1 group-hover:drop-shadow-sm transition-all">{'★'.repeat(level as number)}{'☆'.repeat(2 - (level as number))}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {/* Bio - hidden on very small screens */}
                                                <p className="hidden sm:block mt-2 md:mt-4 pt-1 md:pt-2 border-t border-slate-900/5 text-[9px] md:text-xs text-slate-500 font-handwriting leading-snug line-clamp-2">
                                                    "{t(char.bio)}"
                                                </p>
                                                {!canSelect && !isSelected && (
                                                    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center rounded-sm">
                                                        {isCaptured ? (
                                                            <div className="bg-evidence text-white px-6 py-2 rounded-sm transform rotate-[-15deg] border-4 border-white shadow-2xl flex flex-col items-center btn-stamp">
                                                                <span className="font-black text-2xl uppercase tracking-tighter leading-none">{t('ui.arrested')}</span>
                                                                <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-1">Custody</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-white bg-slate-900/80 px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-widest text-center shadow-lg">{cannotSelectReason}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                { /* Next Reputation Locked Card */}
                                {(() => {
                                    const lockedByRep = fullRoster.filter(char => char.reputationRequired > campaignState.reputation);
                                    if (lockedByRep.length === 0) return null;

                                    const nextRepLevel = Math.min(...lockedByRep.map(c => c.reputationRequired));
                                    const nextLevelCount = lockedByRep.filter(c => c.reputationRequired === nextRepLevel).length;

                                    return (
                                        <div className="bg-slate-900/5 border-4 border-dashed rounded-sm p-8 flex flex-col items-center justify-center text-center border-slate-300">
                                            <LockIcon className="w-12 h-12 text-slate-300 mb-4" />
                                            <h4 className="text-lg font-black text-slate-400 uppercase tracking-tighter mb-2">{t('ui.restricted_access')}</h4>
                                            <div className="text-xs text-slate-500 uppercase font-black flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-ink">{nextLevelCount}</span>
                                                    <span>{t('ui.additional_thieves', { count: '', total: lockedByRep.length }).replace('  ', ' ')}</span>
                                                </div>
                                                <span className="flex items-center gap-1 bg-ink text-white px-3 py-1 rounded-sm">
                                                    <ReputationIcon className="w-3 h-3" />
                                                    {nextRepLevel} Required
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Selected Team Display - Compact on mobile */}
                            <div className="mt-3 md:mt-6 flex justify-center md:justify-end items-center px-2 md:px-6">
                                <div className="w-full md:w-auto">
                                    <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] md:tracking-[0.2em] text-center md:text-right mb-1 md:mb-2">{t('ui.selected_team')}</h3>
                                    <div className="flex items-center justify-center md:justify-end gap-2 md:gap-6 min-h-[2rem] md:min-h-[3rem] flex-wrap">
                                        {selectedTeam.map((char, index) => {
                                            const Icon = getCharIcon(char.name);
                                            return (
                                                <div key={char.name} className="flex items-center gap-1 md:gap-2 group" title={char.name}>
                                                    <div className="w-6 h-6 md:w-10 md:h-10 transition-all">
                                                        <Icon className={`w-full h-full ${getCharColor(char.name)}`} isActive={true} />
                                                    </div>
                                                    <span className={`font-black uppercase text-[10px] md:text-sm ${getCharColor(char.name)}`}>{char.name.split(' ')[0]}</span>
                                                </div>
                                            );
                                        })}
                                        {selectedTeam.length === 0 && <span className="text-slate-400 font-handwriting text-sm md:text-lg italic opacity-50">Empty Roster...</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Fixed bottom right on all resolutions */}
                            <div className="fixed bottom-4 right-0 left-0 md:left-auto flex gap-2 justify-end bg-slate-50 p-2 md:p-4 border-t-2 md:border-t-4 border-slate-900/20 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-lg md:rounded-tl-lg md:max-w-md">
                                <button onClick={() => setScreen('campaignHub')} className="btn-stamp text-slate-500 border-slate-500 hover:text-slate-700 text-xs md:text-base py-2 md:py-3 px-3 md:px-6">{t('ui.return_to_hub')}</button>
                                <button
                                    onClick={() => handleStartHeistAction(currentScenario.id, totalHireCost)}
                                    disabled={selectedTeam.length === 0 || remainingCash < 0}
                                    className="btn-stamp bg-evidence text-white border-evidence hover:bg-red-800 py-2 md:py-4 px-4 md:px-10 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-xs md:text-base font-black"
                                >
                                    {t('ui.start_heist')}
                                </button>
                            </div>
                        </div>
                    </main>
                    {renderRecruitmentModal()}
                    {renderTutorialModal()}
                    <BugReportButton gameContext={{ screen: 'teamSelector', scenarioId: currentScenario?.id, teamSize: selectedTeam.length }} />
                </div >
            </div >
        );
    };

    const renderGame = () => {
        if (!gameState || !contextValue) return <div>Loading...</div>;
        return (
            <GameContext.Provider value={contextValue}>
                <div className="flex flex-col h-screen bg-parchment dark:bg-slate-950 font-typewriter relative overflow-hidden">
                    {/* Manila Folder Texture Overlay for the whole screen */}
                    <div className="absolute inset-0 z-0 bg-manila opacity-30 dark:opacity-10 pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full">
                        {renderHeader()}
                        <main className="flex flex-row flex-grow gap-1 md:gap-2 lg:gap-4 min-h-0 p-1 md:p-2 lg:p-4 relative">
                            <div ref={gameBoardContainerRef} className="flex-grow min-w-0 w-[55%] md:w-[60%] lg:w-[65%] min-h-[200px] overflow-auto relative flex justify-start items-start p-0.5 md:p-1 lg:p-2">
                                <div className="relative w-fit h-fit flex-shrink-0 mx-auto my-auto p-1 md:p-4 lg:p-8">
                                    <GameBoard />
                                    {currentScenario && <ObjectivesTracker scenario={currentScenario} gameState={gameState} />}
                                </div>
                            </div>

                            <div className="w-[45%] md:w-[40%] lg:w-[35%] max-w-[200px] md:max-w-[450px] lg:max-w-[550px] flex-shrink-0 h-full overflow-y-auto">
                                <ControlPanel />
                            </div>
                        </main>
                        {gameState.phase === 'execution' && <Ticker messages={tickerMessages} />}
                        {gameState.alarmType === 'loud' && (
                            <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500/30 opacity-70 alarm-light-red" />
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500/30 opacity-70 alarm-light-blue" />
                            </div>
                        )}
                        {/* Modals and Overlays */}
                        {(isGeneratingReport || heistReportData) && <HeistReport isGenerating={isGeneratingReport} data={heistReportData} onReturnToHub={executeReturnToHub} onTryAgainNewPlan={handleTryAgainNewPlan} onTryAgainEditPlan={handleTryAgainEditPlan} />}
                        {/* Hidden input for loading plans */}
                        <input
                            type="file"
                            ref={planFileInputRef}
                            onChange={handlePlanFileChange}
                            accept=".json,application/json"
                            style={{ display: 'none' }}
                        />
                        {isAbortModalVisible && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-cyan-500/50 rounded-lg p-4 md:p-6 shadow-2xl dark:shadow-cyan-500/20 w-full max-w-md max-h-[90dvh] overflow-y-auto">
                                    <h2 className="text-lg md:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2 md:mb-4">Abort Mission?</h2>
                                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-6">This will end the current heist. What would you like to do?</p>
                                    <div className="flex flex-col space-y-2">
                                        {preExecutionStateRef.current && (
                                            <button
                                                onClick={() => { setIsAbortModalVisible(false); handleTryAgainEditPlan(); }}
                                                className="w-full px-3 md:px-4 py-2 text-sm md:text-base font-bold uppercase tracking-widest border-2 rounded-md transition-all duration-200 bg-blue-700 dark:bg-blue-800 border-blue-900 dark:border-blue-600 text-blue-100 dark:text-blue-200 hover:bg-blue-600 dark:hover:bg-blue-700"
                                            >
                                                Restart (Edit Plan)
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setIsAbortModalVisible(false); handleTryAgainNewPlan(); }}
                                            className="w-full px-3 md:px-4 py-2 text-sm md:text-base font-bold uppercase tracking-widest border-2 rounded-md transition-all duration-200 bg-blue-700 dark:bg-blue-800 border-blue-900 dark:border-blue-600 text-blue-100 dark:text-blue-200 hover:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            Restart (New Plan)
                                        </button>
                                        <button
                                            onClick={() => { setIsAbortModalVisible(false); executeReturnToHub(); }}
                                            className="w-full px-3 md:px-4 py-2 text-sm md:text-base font-bold uppercase tracking-widest border-2 rounded-md transition-all duration-200 bg-gray-700 dark:bg-gray-800 border-gray-900 dark:border-black text-gray-100 dark:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-700"
                                        >
                                            Return to Hub
                                        </button>
                                    </div>
                                    <div className="flex justify-end mt-3 md:mt-6">
                                        <button
                                            onClick={() => setIsAbortModalVisible(false)}
                                            className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-200 dark:bg-gray-600/80 border-2 border-gray-400 dark:border-gray-400 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-bold text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </GameContext.Provider>
        );
    };

    // The main render function for the App, which uses a switch statement to show the correct screen.
    const renderAppContent = () => {
        const content = (() => {
            switch (screen) {
                case 'game':
                    return renderGame();
                case 'mapEditor':
                    return editingScenario ? <MapEditor scenario={editingScenario} onSaveAndClose={handleSaveScenario} onCancel={() => setScreen('campaignHub')} /> : renderCampaignHub();
                case 'briefing':
                    return renderBriefing();
                case 'teamSelector':
                    return renderTeamSelector();
                case 'campaignHub':
                default:
                    return renderCampaignHub();
            }
        })();

        return (
            <div className="relative h-screen w-full overflow-hidden">
                {content}

                {/* Portrait Mode Warning Overlay — only shown during the game (planning/execution phases) */}
                <div className={`fixed inset-0 z-[1000] bg-white dark:bg-black flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 pointer-events-auto ${screen === 'game' ? 'hidden portrait:flex lg:hidden' : 'hidden'}`}>
                    <div className="relative mb-12">
                        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                        <div className="text-7xl mb-6 text-cyan-400 animate-[spin_3s_linear_infinite] relative">⟳</div>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] leading-relaxed mb-4 text-black dark:text-white">
                        {t('ui.rotate_device')}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-sm font-typewriter text-sm md:text-lg uppercase tracking-widest">
                        {t('ui.rotate_device_desc') || 'Tactical operations require landscape orientation for optimal coordination.'}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div id="app-root" className="h-full w-full">
            <h1 className="sr-only">Heistology - Tactical Heist Planning Simulator</h1>
            {renderAppContent()}
            {renderOperationsCompletedModal()}
            {renderWelcomeScreen()}
            {/* {renderRecruitmentModal()} // Job Ad commented out per user request */}
            {renderTutorialModal()}
            <AbandonmentSurvey hasStartedHeist={hasStartedHeist} />
            {isHandbookVisible && <Handbook onClose={() => setIsHandbookVisible(false)} />}
            {renderGodModeModal()}
            {renderImprintModal()}
            <CookieBanner forceOpen={isCookieBannerOpen} onClose={() => setIsCookieBannerOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-[40] text-[8px] md:text-[10px] text-slate-500/60 dark:text-slate-600/60 font-mono pointer-events-auto flex gap-1 md:gap-2 select-none items-center justify-center bg-slate-100/30 dark:bg-black/30 px-1 md:px-2 py-0.5 backdrop-blur-[1px]">
                <span className="hidden md:inline">Heistology (c) 2026 hello@heistology.com {t('ui.game_version')}</span>
                <span className="md:hidden">© 2026</span>
                <span className="opacity-50">|</span>
                <button
                    onClick={() => setIsImprintVisible(true)}
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted underline-offset-2 transition-colors cursor-pointer"
                >
                    {t('ui.imprint')}
                </button>
                <span className="opacity-50">|</span>
                <button
                    onClick={() => setIsCookieBannerOpen(true)}
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted underline-offset-2 transition-colors cursor-pointer"
                >
                    {t('cookies.title')}
                </button>
            </div>
        </div>
    );
};

export default App;