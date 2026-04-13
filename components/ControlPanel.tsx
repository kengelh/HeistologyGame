/**
 * @file ControlPanel.tsx
 * @description
 * This component serves as the primary user interface for controlling the game.
 * It displays game state information (like score and time), provides action buttons
 * for the player (movement, interaction), and adapts its layout based on the current
 * game phase ('planning' or 'execution'). It is a "controlled component," meaning it
 * receives all its data and behavior via props from the parent `App` component.
 */

// Import React for component creation and state management.
import * as React from 'react';
// Import type definitions for props to ensure type safety.
import type { ActionType, ActionInfo, ConsumableItem, PlanStep, Skill, Player } from '../types';
// Import the new GameContext to consume state.
import { GameContext } from '../App';
// FIX: Import PlayerIcon to use as a fallback for character icons.
import { ActionIcon, PlayerIcon } from './Icons';
import { CONSUMABLE_ITEMS } from '../constants';
import { CharacterIcons } from './CharacterIcons';
import { CHARACTER_COLORS } from '../roster';
import { getSkillAdjustedTime } from '../lib/actions';
import { useTranslation } from '../lib/i18n';

/**
 * A reusable, styled button component specifically designed for the control panel.
 * It encapsulates the complex styling logic and handles its own disabled state appearance,
 * reducing repetitive code in the main component and ensuring a consistent look and feel.
 */
const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode, className?: string, title?: string }> = ({ onClick, disabled, children, className = '', title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    // A complex set of Tailwind CSS classes to style the button.
    // It uses conditional classes to change appearance when disabled, providing clear visual feedback to the user.
    className={`px-2 landscape:px-1 md:px-4 md:landscape:px-4 py-1 landscape:py-0.5 md:py-2 md:landscape:py-2 text-xs landscape:text-[8px] md:text-base md:landscape:text-base font-bold uppercase tracking-widest border-2 rounded-md transition-all duration-200
      ${disabled
        ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed' // Disabled styles
        : `bg-cyan-500 border-cyan-600 text-white hover:bg-cyan-600 dark:bg-cyan-700 dark:border-cyan-500 dark:text-cyan-100 dark:hover:bg-cyan-600 dark:hover:shadow-lg dark:hover:shadow-cyan-500/50 ${className}` // Enabled styles
      }`}
  >
    {children}
  </button>
);


const DirectionalSlot: React.FC<{
  actions: ActionInfo[];
  canMove: boolean;
  onMove: () => void;
  onInteract: (action: ActionType, target?: { x: number; y: number }, targetId?: number | string) => void;
  direction: 'up' | 'down' | 'left' | 'right';
  disabled: boolean;
  pulse?: boolean;
}> = ({ actions, canMove, onMove, onInteract, direction, disabled, pulse }) => {

  const directionLabel = { up: '↑', down: '↓', left: '←', right: '→' }[direction];
  const isVertical = direction === 'up' || direction === 'down';

  const moveButton = (
    <button
      onClick={onMove}
      disabled={disabled || !canMove}
      className={`flex items-center justify-center text-2xl md:text-4xl font-bold rounded-md transition-all relative z-10
        ${isVertical ? 'w-full h-6 landscape:h-[4vh] md:h-12 md:landscape:h-12' : 'h-full w-8 landscape:w-[3vw] md:w-16 md:landscape:w-16'}
        ${canMove ? 'bg-cyan-500 border-2 border-cyan-600 text-white hover:bg-cyan-600 dark:bg-cyan-700 dark:border-cyan-500 dark:hover:bg-cyan-600' : 'bg-gray-200 dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 text-gray-500'}
        ${pulse && canMove ? 'animate-pulse ring-4 ring-cyan-500/50 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : ''}
        disabled:bg-gray-200/50 dark:disabled:bg-gray-700/50 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed`}
    >
      {directionLabel}
    </button>
  );

  const actionSlot = (
    <div className={`grid gap-0.5 landscape:gap-0 md:gap-1 md:landscape:gap-1 p-0.5 landscape:p-0 md:p-1 md:landscape:p-1
      ${isVertical ? 'grid-cols-2 w-full h-6 landscape:h-[3vh] md:h-12 md:landscape:h-12' : 'grid-rows-2 h-full w-8 landscape:w-[2vw] md:w-16 md:landscape:w-16'}`}>
      {/* We always render 2 slots to prevent layout jumping */}
      {[0, 1].map((idx) => {
        const actionInfo = actions[idx];
        if (!actionInfo) return <div key={idx} className="flex-1" />; // Empty slot to maintain layout
        return (
          <button
            key={`${actionInfo.action}-${idx}`}
            onClick={() => onInteract(actionInfo.action, actionInfo.target, actionInfo.targetId)}
            disabled={disabled}
            title={actionInfo.label}
            className="group relative flex-1 flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-cyan-800/80 border-2 border-slate-300 dark:border-cyan-600 rounded-md dark:hover:bg-cyan-700 text-slate-700 dark:text-cyan-100 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            <ActionIcon action={actionInfo.action} className="w-5 h-5" />
            <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {actionInfo.label}
            </div>
          </button>
        );
      })}
    </div>
  );

  const mainClasses = `w-20 landscape:w-[7vw] landscape:min-w-[50px] md:w-32 md:landscape:w-32 h-14 landscape:h-[8vh] landscape:min-h-[40px] md:h-24 md:landscape:h-24 flex bg-slate-100/50 dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-600 rounded-md`;
  let flexDirection = '';
  let children = <></>;

  if (direction === 'up') {
    flexDirection = 'flex-col';
    children = <>{actionSlot}{moveButton}</>;
  } else if (direction === 'down') {
    flexDirection = 'flex-col';
    children = <>{moveButton}{actionSlot}</>;
  } else if (direction === 'left') {
    flexDirection = 'flex-row';
    children = <>{actionSlot}{moveButton}</>;
  } else if (direction === 'right') {
    flexDirection = 'flex-row';
    children = <>{moveButton}{actionSlot}</>;
  }

  return <div className={`${mainClasses} ${flexDirection}`}>{children}</div>;
};

/**
 * A new component to display the plan as a sequence of clickable icons.
 * Clicking an icon rewinds the plan to that point.
 */
const PlanTimeline: React.FC<{
  plan: PlanStep[];
  players: Player[];
  onRewind: (index: number) => void;
  disabled: boolean;
}> = ({ plan, players, onRewind, disabled }) => {
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Effect to automatically scroll the timeline to the end when a new action is added.
  React.useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = timelineRef.current.scrollWidth;
    }
  }, [plan.length]);

  const { t } = useTranslation();

  if (plan.length === 0) {
    return (
      <div className="text-center text-xs md:text-sm text-gray-500 dark:text-gray-400 p-1 md:p-2 h-[40px] landscape:h-[48px] md:h-[68px] flex items-center justify-center">
        {t('ui.begin_planning')}
      </div>
    );
  }

  return (
    <div ref={timelineRef} className="flex items-center gap-1 p-1 md:p-2 bg-black/5 dark:bg-black/30 rounded-md overflow-x-auto border border-gray-300 dark:border-gray-600 h-[40px] landscape:h-[48px] md:h-[68px]">
      {plan.map((step, index) => {
        const player = players[step.teamMember];
        const colorClass = player ? CHARACTER_COLORS[player.name]?.replace('text-', 'border-') || 'border-gray-500' : 'border-gray-500';

        return (
          <button
            key={index}
            onClick={() => onRewind(index)}
            disabled={disabled}
            title={`${t(`action.${step.action}`)} by ${player?.name || 'Unknown'} (${step.timeCost}s)`}
            className={`group relative flex-shrink-0 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-md border-2 transition-all duration-150 hover:scale-110 hover:z-10 disabled:cursor-not-allowed disabled:hover:scale-100 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-cyan-100 ${colorClass}`}
          >
            <ActionIcon action={step.action} className="w-4 h-4 md:w-6 md:h-6" />
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] md:text-[9px] font-bold rounded-full w-3 h-3 md:w-4 md:h-4 flex items-center justify-center shadow-md">
              {index + 1}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Helper function to generate a one-sentence summary of a character's key skills.
const getSkillSummary = (skills: Partial<Record<Skill, number>>, t: any): string => {
  const skillEntries = Object.entries(skills).sort(([, a], [, b]) => b - a);
  if (skillEntries.length === 0) {
    return t('ui.jack_of_all_trades');
  }

  const topSkills = skillEntries.filter(([, level]) => level === 2).map(([skill]) => t(`skill.${skill}`));
  if (topSkills.length > 0) {
    if (topSkills.length === 1) return t('ui.expert_in', { skill: topSkills[0] });
    const lastSkill = topSkills.pop();
    return t('ui.expert_in_multiple', { skills: topSkills.join(', '), lastSkill });
  }

  const goodSkills = skillEntries.filter(([, level]) => level === 1).map(([skill]) => t(`skill.${skill}`));
  if (goodSkills.length > 0) {
    if (goodSkills.length === 1) return t('ui.proficient_in', { skill: goodSkills[0] });
    const lastSkill = goodSkills.pop();
    return t('ui.proficient_in_multiple', { skills: goodSkills.join(', '), lastSkill });
  }

  return t('ui.jack_of_all_trades');
};


/**
 * The main UI component for player controls, game status display, and action selection.
 */
export const ControlPanel: React.FC = () => {
  const context = React.useContext(GameContext);
  const { t } = useTranslation();

  // State for managing the custom "Wait" modal.
  const [isCustomWaitVisible, setIsCustomWaitVisible] = React.useState(false);
  const [customWaitValue, setCustomWaitValue] = React.useState("10");

  // If context is not available yet, render a loading state or nothing.
  if (!context) {
    return (
      <div className="flex flex-col h-full bg-white/50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-cyan-500/30 rounded-lg p-6 shadow-2xl dark:shadow-cyan-500/10 text-slate-700 dark:text-cyan-200 space-y-4">
        Loading...
      </div>
    );
  }

  // Destructure all necessary state and callbacks from the context.
  const {
    gameState,
    projectedGuards,
    adjacentActions,
    possibleMoves,
    activePlayer,
    onMove,
    onInteract,
    onWait,
    onUndo,
    canUndo,
    onExecutePlan,
    onSwitchPlayer,
    onEveryBodyRun,
    isTargeting,
    onCancelTargeting,
    onAbortMission,
    onSavePlan,
    onLoadPlan,
    onRewindPlan,
    planLength,
    campaignState,
    gearCost,
    itemToBuy,
    handleSelectItemToBuy,
    handleConfirmBuyItem,
    handleCancelBuyItem,
    onToggleFreeze,
    currentScenarioTier,
  } = context;

  const {
    stolenValue,
    potentialValue,
    message,
    gameOver,
    gameWon,
    phase,
    plannedTime,
    playerPlannedTimes,
    executionTimer,
    currentPlayer,
    isEscaping,
    players,
    heat,
    playerFreezeCharges,
    playerStatuses,
  } = gameState;

  /**
   * Helper function to format a number of seconds into a MM:SS string for display.
   * @param {number} seconds - The total number of seconds.
   * @returns {string} The formatted time string.
   */
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Handles confirming the custom wait time from the modal. It parses the input,
   * calls the `onWait` callback, and closes the modal.
   */
  const handleConfirmWait = () => {
    const duration = parseInt(customWaitValue, 10);
    if (!isNaN(duration) && duration > 0) {
      onWait(duration);
    }
    setIsCustomWaitVisible(false);
    setCustomWaitValue("10"); // Reset for next time.
  };

  /**
   * Handles canceling the custom wait action, simply closing the modal.
   */
  const handleCancelWait = () => {
    setIsCustomWaitVisible(false);
    setCustomWaitValue("10"); // Reset for next time.
  };

  // A boolean flag to simplify conditional rendering logic throughout the component.
  const isPlanning = phase === 'planning';
  // A flag to determine if the main controls should be disabled (e.g., during execution, game over, or targeting).
  const controlsDisabled = !isPlanning || gameOver || gameWon || isTargeting;

  const actionsUp = adjacentActions.filter(a => a.direction === 'up');
  const actionsDown = adjacentActions.filter(a => a.direction === 'down');
  const actionsLeft = adjacentActions.filter(a => a.direction === 'left');
  const actionsRight = adjacentActions.filter(a => a.direction === 'right');
  const REDUNDANT_ACTIONS: ActionType[] = [
    'open_door', 'close_door', 'unlock', 'lock_door', 'smash_door',
    'open_cabinet', 'close_cabinet'
  ];

  const otherActions = adjacentActions.filter(a =>
    (a.direction === 'center' || a.direction === 'none') &&
    !REDUNDANT_ACTIONS.includes(a.action)
  );

  // FIX: Use PlayerIcon as a fallback to prevent a crash if a character icon is missing.
  const Icon = CharacterIcons[activePlayer.name] || PlayerIcon;
  const colorClass = CHARACTER_COLORS[activePlayer.name] || 'text-white';
  const initials = activePlayer.name.split(' ').map(n => n[0]).join('.').toUpperCase();

  const skillSummary = getSkillSummary(activePlayer.skills, t);

  // FIX: Explicitly type `actionTimings` to fix TypeScript error on line 359.
  const actionTimings: { label: string; action: ActionType }[] = [
    { label: t('action.unlock'), action: 'unlock' },
    { label: t('action.lockpick_case'), action: 'lockpick_case' },
    { label: t('action.smash_door'), action: 'smash_door' },
    { label: t('action.crack'), action: 'crack' },
    { label: t('action.disable_cameras'), action: 'disable_cameras' },
    { label: t('action.rob'), action: 'rob' },
  ];

  const specialActionTimings: { label: string, time: number }[] = [];
  if ((activePlayer.skills.demolitions || 0) > 0) {
    specialActionTimings.push({ label: t('action.plant_dynamite'), time: getSkillAdjustedTime('plant_dynamite', activePlayer) });
  }
  if ((activePlayer.skills.infiltrator || 0) > 0) {
    const laserTime = activePlayer.skills.infiltrator === 2 ? 3 : 5;
    specialActionTimings.push({ label: t('action.cross_laser'), time: laserTime });
  }

  return (
    // Main container for the control panel with consistent styling.
    <div className="flex flex-col h-full bg-white/80 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-cyan-500/30 rounded-lg p-1.5 landscape:p-2 md:p-4 shadow-xl dark:shadow-cyan-500/10 text-slate-700 dark:text-cyan-200 space-y-0.5 landscape:space-y-1 md:space-y-2 backdrop-blur-sm">
      {/* Section 1: Header - Displays current phase and player selection controls. */}
      <div className="text-center flex-shrink-0">
        <h2 className="text-xl md:text-2xl landscape:text-sm font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 landscape:hidden">
          {isPlanning ? t('ui.planning_phase') : t('ui.execution_phase')}
        </h2>
        {/* The player switcher is only shown during the planning phase. */}
        {isPlanning && (
          <>
            <div className="flex justify-center items-center space-x-2 landscape:space-x-1 mt-1 landscape:mt-0">
              <div className="group relative flex flex-col landscape:flex-row items-center cursor-pointer landscape:gap-1">
                <div className="relative w-12 h-12 md:w-16 md:h-16 landscape:w-6 landscape:h-6 md:landscape:w-16 md:landscape:h-16">
                  <Icon className={`${colorClass} w-full h-full`} />
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] md:text-xs md:landscape:text-xs landscape:text-[8px] font-bold rounded-sm px-1 pointer-events-none landscape:hidden md:landscape:block">
                    {initials}
                  </div>
                </div>
                {/* Skills Overview Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-cyan-400 shadow-lg landscape:hidden">
                  <h4 className="font-bold text-base text-cyan-300 mb-1">{activePlayer.name}</h4>
                  <p className="italic text-gray-400 mb-2 text-sm">"{skillSummary}"</p>
                  <div className="border-t border-gray-600 pt-2">
                    <h5 className="font-bold text-cyan-400 mb-1 uppercase">{t('ui.action_times')}:</h5>
                    <ul className="text-sm space-y-0.5">
                      {actionTimings.map(({ label, action }) => (
                        <li key={action} className="flex justify-between">
                          <span>{label}:</span>
                          <span className="font-bold text-yellow-300">{getSkillAdjustedTime(action, activePlayer)}s</span>
                        </li>
                      ))}
                      {specialActionTimings.map(({ label, time }) => (
                        <li key={label} className="flex justify-between">
                          <span>{label}:</span>
                          <span className="font-bold text-yellow-300">{time}s</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-lg landscape:text-xs font-bold text-cyan-700 dark:text-cyan-400">
                ({currentPlayer + 1}/{players.length})
              </p>

              {players.length > 1 &&
                <button onClick={onSwitchPlayer} disabled={controlsDisabled} className="px-3 py-1 landscape:px-1.5 landscape:py-0.5 md:px-3 md:py-1 md:landscape:px-3 md:landscape:py-1 landscape:text-[10px] bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 text-sm md:text-sm md:landscape:text-sm">
                  {t('ui.switch')}
                </button>
              }
              {/* Inline time display for landscape */}
              <span className="hidden landscape:inline text-[10px] text-gray-500 dark:text-gray-400">
                {playerPlannedTimes[currentPlayer]}s
              </span>
            </div>
            {/* Display the total time planned so far for the active player - HIDDEN in landscape */}
            <p className="text-sm text-gray-500 dark:text-gray-400 landscape:hidden">
              {t('ui.player_time')}: <span className="font-bold text-slate-800 dark:text-white">{playerPlannedTimes[currentPlayer]}s</span>
            </p>
          </>
        )}
        <div className="w-full h-px bg-gray-300 dark:bg-cyan-500/50 my-1 landscape:hidden"></div>
      </div>

      {/* A scrollable container for the body of the panel, ensuring it works well on smaller screens. */}
      <div className="flex-grow flex flex-col space-y-2 overflow-y-auto pr-2">
        {/* Section 2: Message Log - HIDDEN in landscape */}
        <div className="flex-shrink-0 bg-black/5 p-1 md:p-2 rounded-md border border-gray-300 dark:bg-black/50 dark:border-gray-600 font-mono text-xs md:text-sm min-h-[40px] md:min-h-[70px] max-h-[60px] md:max-h-full overflow-y-auto landscape:hidden">
          <div className={`${gameWon ? 'text-yellow-600 dark:text-yellow-400' : gameOver ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-400'}`}>
            {message.split('\n').map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">{i === 0 ? `> ${t(line)}` : `  ${t(line)}`}</p>
            ))}
          </div>
        </div>

        {/* Section 3: Status Display - Compact in landscape */}
        <div className="grid grid-cols-2 gap-2 landscape:gap-1 text-center flex-shrink-0">
          <div className="bg-black/5 p-1 md:p-2 landscape:p-0.5 rounded-md border border-gray-300 dark:bg-black/50 dark:border-gray-600">
            <p className="text-[10px] md:text-sm md:landscape:text-sm landscape:text-[8px] uppercase text-gray-500 dark:text-gray-400">{isPlanning ? t('ui.potential_value') : t('ui.stolen_value')}</p>
            <p className="text-lg md:text-xl md:landscape:text-xl landscape:text-sm font-bold text-green-600 dark:text-green-400">${(isPlanning ? Math.floor(potentialValue) : Math.floor(stolenValue)).toLocaleString()}</p>
          </div>
          <div className="bg-black/5 p-1 md:p-2 landscape:p-0.5 rounded-md border border-gray-300 dark:bg-black/50 dark:border-gray-600">
            <p className="text-[10px] md:text-sm md:landscape:text-sm landscape:text-[8px] uppercase text-gray-500 dark:text-gray-400">{isPlanning ? t('ui.total_plan_time') : t('ui.time_left')}</p>
            <p className={`text-lg md:text-xl md:landscape:text-xl landscape:text-sm font-bold ${isPlanning || executionTimer > 30 ? 'text-green-600 dark:text-green-400' : 'text-red-500 animate-pulse'}`}>
              {isPlanning ? `${plannedTime}s` : formatTime(executionTimer)}
            </p>
          </div>
        </div>


        {/* Visual Plan Timeline - HIDDEN in landscape */}
        {isPlanning && (
          <div className="flex-shrink-0 landscape:hidden">
            <h3 className="text-[10px] md:text-md uppercase text-gray-500 dark:text-gray-400 tracking-wider text-center mb-0.5 md:mb-1">{t('ui.plan_timeline')}</h3>
            <PlanTimeline
              plan={gameState.plan}
              players={gameState.players}
              onRewind={onRewindPlan}
              disabled={controlsDisabled}
            />
          </div>
        )}

        {/* Distraction Analysis Section - HIDDEN in landscape */}
        {isPlanning && projectedGuards.map(guard => (
          guard.distractionPath && (
            <div key={`distraction-${guard.id}`} className="bg-black/5 p-2 rounded-md border border-yellow-400 dark:border-yellow-500 text-center flex-shrink-0 landscape:hidden">
              <p className="text-md uppercase text-yellow-500 dark:text-yellow-300 font-bold tracking-wider">{t('ui.distraction_analysis')}</p>
              <p className="text-sm">{t('ui.distraction_analysis_desc', { id: guard.id, start: guard.distractionPath.startTime, end: guard.distractionPath.endTime })}</p>
            </div>
          )
        ))}

        {/* Section 5: Dynamic Directional Controls - Compact T-Shape Layout */}
        <div className="flex flex-col items-center justify-center gap-0.5 md:gap-1 flex-shrink-0 relative">
          {isPlanning && currentScenarioTier === 1 && planLength === 0 && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-max animate-bounce bg-cyan-600 text-white text-[9px] md:text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest z-50 pointer-events-none shadow-lg">
              {t('ui.use_dpad_to_move') || 'Use D-Pad to Move'}
            </div>
          )}
          {/* UP - Centered */}
          <div>
            <DirectionalSlot direction="up" actions={actionsUp} canMove={possibleMoves.up} onMove={() => onMove(0, -1)} onInteract={onInteract} disabled={controlsDisabled} pulse={isPlanning && currentScenarioTier === 1 && planLength === 0} />
          </div>

          {/* LEFT & RIGHT - Adjacent */}
          <div className="flex gap-0.5 md:gap-1">
            <DirectionalSlot direction="left" actions={actionsLeft} canMove={possibleMoves.left} onMove={() => onMove(-1, 0)} onInteract={onInteract} disabled={controlsDisabled} pulse={isPlanning && currentScenarioTier === 1 && planLength === 0} />
            <DirectionalSlot direction="right" actions={actionsRight} canMove={possibleMoves.right} onMove={() => onMove(1, 0)} onInteract={onInteract} disabled={controlsDisabled} pulse={isPlanning && currentScenarioTier === 1 && planLength === 0} />
          </div>

          {/* DOWN - Centered */}
          <div>
            <DirectionalSlot direction="down" actions={actionsDown} canMove={possibleMoves.down} onMove={() => onMove(0, 1)} onInteract={onInteract} disabled={controlsDisabled} pulse={isPlanning && currentScenarioTier === 1 && planLength === 0} />
          </div>
        </div>

        {isPlanning && <div className="w-full h-px bg-gray-300 dark:bg-cyan-500/30 my-1"></div>}

        {/* Black Market Section */}
        {isPlanning && campaignState && currentScenarioTier >= 2 && (
          <div className="bg-black/5 p-2 rounded-md border border-gray-300 dark:bg-black/50 dark:border-gray-600 flex-shrink-0">
            <h3 className="text-md uppercase text-gray-500 dark:text-gray-400 tracking-wider text-center mb-2">{t('ui.black_market')}</h3>
            <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-2">{t('ui.cash')}: <span className="text-green-600 dark:text-green-400 font-bold">${(campaignState.totalCash - gearCost).toLocaleString()}</span></p>
            <div className="grid grid-cols-4 gap-1">
              {Object.values(CONSUMABLE_ITEMS).map(item => {
                const canAfford = (campaignState.totalCash - gearCost) >= item.cost;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItemToBuy(item)}
                    disabled={!canAfford || controlsDisabled}
                    className="group relative flex flex-col items-center justify-center bg-gray-200/50 dark:bg-gray-700/50 p-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100/50 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                  >
                    <ActionIcon action={item.action} className={`w-6 h-6 ${!canAfford ? 'opacity-30' : ''}`} />
                    <span className={`text-xs font-bold ${!canAfford ? 'text-gray-400 dark:text-gray-600' : 'text-yellow-600 dark:text-yellow-400'}`}>${(item.cost / 1000)}k</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <p className="font-bold text-yellow-300">{t(`item.${item.id}.name`)}</p>
                      <p>{t(`item.${item.id}.desc`)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Section 6: Main Action Buttons - This section changes its layout entirely based on game state. */}
        <div className="pt-2 border-t-2 border-gray-300 dark:border-cyan-500/30 flex-shrink-0">
          {gameOver || gameWon ? (
            // --- UI STATE: GAME OVER ---
            // This is now handled by the HeistReport modal. This section remains empty.
            <div className="text-center text-gray-500 dark:text-gray-400 h-24 flex items-center justify-center">
              {t('ui.heist_complete_awaiting')}
            </div>
          ) : isTargeting ? (
            // --- UI STATE: TARGETING MODE ---
            <div className="flex flex-col space-y-1 text-center">
              <p className="text-md text-yellow-500 dark:text-yellow-300 animate-pulse">{t('ui.select_target')}</p>
              <ActionButton onClick={onCancelTargeting} className="w-full !bg-red-600/80 !border-red-500 !text-white dark:!border-red-400 dark:!text-red-100 dark:hover:!bg-red-500">
                {t('ui.cancel')}
              </ActionButton>
            </div>
          ) : isPlanning ? (
            // --- UI STATE: PLANNING PHASE ---
            <div className="flex flex-col space-y-1">
              {/* Container for non-directional actions */}
              <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1">
                {otherActions.length > 0 && otherActions.map((actionInfo) => (
                  <ActionButton key={actionInfo.action} onClick={() => onInteract(actionInfo.action, actionInfo.target, actionInfo.targetId)} disabled={controlsDisabled} className="w-full landscape:text-[9px] landscape:!py-0">
                    {actionInfo.label}
                  </ActionButton>
                ))}
              </div>
              <div className="flex space-x-1">
                <ActionButton onClick={() => onWait(1)} disabled={controlsDisabled} className="w-full landscape:text-[8px] landscape:!py-0 md:text-xs md:landscape:text-xs">{t('ui.wait_1s')}</ActionButton>
                <ActionButton onClick={() => onWait(5)} disabled={controlsDisabled} className="w-full landscape:text-[8px] landscape:!py-0 md:text-xs md:landscape:text-xs">{t('ui.wait_5s')}</ActionButton>
                <ActionButton onClick={() => onWait(10)} disabled={controlsDisabled} className="w-full landscape:text-[8px] landscape:!py-0 md:text-xs md:landscape:text-xs">{t('ui.wait_custom')}</ActionButton>
              </div>
              {/* Undo button - most important, always visible */}
              <ActionButton onClick={onUndo} disabled={controlsDisabled || !canUndo} className="w-full !bg-yellow-500/80 !border-yellow-600 !text-white dark:!bg-yellow-600/80 dark:!border-yellow-400 dark:!text-yellow-100 dark:hover:!bg-yellow-500 landscape:text-[8px] landscape:!py-0">
                {t('ui.undo')}
              </ActionButton>
              {/* Execute Plan button */}
              <ActionButton onClick={onExecutePlan} disabled={isTargeting || planLength === 0} className="w-full !bg-green-600/80 !border-green-500 !text-white dark:!bg-green-600/80 dark:!border-green-400 dark:!text-green-100 dark:hover:!bg-green-500 landscape:text-[9px] landscape:!py-0">
                {t('ui.execute_plan')}
              </ActionButton>
              {/* Save/Load buttons at bottom */}
              <div className="grid grid-cols-2 gap-1">
                <ActionButton onClick={onSavePlan} disabled={controlsDisabled || planLength === 0} className="w-full landscape:text-[8px] landscape:!py-0 md:text-xs md:landscape:text-xs !bg-gray-500 hover:!bg-gray-600 dark:!bg-gray-600/80 !border-gray-600 dark:!border-gray-400 !text-white dark:!text-gray-100 dark:hover:!bg-gray-500">
                  {t('ui.save_to_file')}
                </ActionButton>
                <ActionButton onClick={onLoadPlan} disabled={controlsDisabled} className="w-full landscape:text-[8px] landscape:!py-0 md:text-xs md:landscape:text-xs !bg-gray-500 hover:!bg-gray-600 dark:!bg-gray-600/80 !border-gray-600 dark:!border-gray-400 !text-white dark:!text-gray-100 dark:hover:!bg-gray-500">
                  {t('ui.load_from_file')}
                </ActionButton>
              </div>
            </div>
          ) : (
            // --- UI STATE: EXECUTION PHASE ---
            <div className="flex flex-col space-y-2">
              {!isEscaping && (
                <ActionButton
                  onClick={onEveryBodyRun}
                  className="w-full !bg-red-600/80 !border-red-500 !text-white dark:!bg-red-600/80 dark:!border-red-400 dark:!text-red-100 dark:hover:!bg-red-500 animate-pulse"
                >
                  {t('ui.everybody_run')}
                </ActionButton>
              )}
              <div className={`grid grid-cols-${players.length} gap-2`}>
                {players.map((player, index) => {
                  const isFrozen = playerStatuses[index] === 'frozen';
                  const canFreeze = playerFreezeCharges[index] > 0;
                  const isDisabled = isEscaping || (!isFrozen && !canFreeze) || ['captured', 'knocked_out'].includes(playerStatuses[index]);

                  return (
                    <ActionButton
                      key={index}
                      onClick={() => onToggleFreeze(index)}
                      disabled={isDisabled}
                      className={`!text-sm !py-1 ${isFrozen
                        ? '!bg-green-600/80 !border-green-500 !text-white dark:!bg-green-600/80 dark:!border-green-400 dark:!text-green-100 dark:hover:!bg-green-500'
                        : '!bg-blue-600/80 !border-blue-500 !text-white dark:!bg-blue-600/80 dark:!border-blue-400 dark:!text-blue-100 dark:hover:!bg-blue-500'
                        }`}
                      title={isFrozen ? "Resume this character" : "Pause this character indefinitely. One time use!"}
                    >
                      {isFrozen ? t('ui.unfreeze') : t('ui.freeze')} {player.name.split(' ')[0]} ({playerFreezeCharges[index]})
                    </ActionButton>
                  );
                })}
              </div>
            </div>
          )}

          {/* The "Back to Main Menu" button is available as long as the game isn't over. */}
          {!gameOver && !gameWon && (
            <ActionButton
              onClick={onAbortMission}
              className="w-full mt-2 landscape:mt-0.5 !bg-red-600 hover:!bg-red-700 dark:!bg-red-700/80 !border-red-700 dark:!border-red-500 !text-white dark:!text-red-100 dark:hover:!bg-red-600 landscape:text-[8px] landscape:!py-0"
            >
              {t('ui.abort_mission')}
            </ActionButton>
          )}
        </div>
      </div>

      {/* MODAL for Custom Wait Time */}
      {isCustomWaitVisible && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-cyan-500/50 rounded-lg p-6 shadow-2xl dark:shadow-cyan-500/20 w-full max-w-sm">
            <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">{t('ui.enter_wait_duration')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{t('ui.how_many_seconds')}</p>
            <input
              type="number"
              value={customWaitValue}
              onChange={(e) => setCustomWaitValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmWait(); if (e.key === 'Escape') handleCancelWait(); }}
              autoFocus
              className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded-md p-2 text-slate-800 dark:text-white text-lg font-mono focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:focus:border-yellow-400 outline-none"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={handleCancelWait} className="px-4 py-2 bg-gray-200 dark:bg-gray-600/80 border-2 border-gray-400 dark:border-gray-400 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-bold">
                {t('ui.cancel')}
              </button>
              <button onClick={handleConfirmWait} className="px-4 py-2 bg-green-600 dark:bg-green-600/80 border-2 border-green-700 dark:border-green-400 text-white dark:text-green-100 rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition-all font-bold">
                {t('ui.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL for Buying Items */}
      {itemToBuy && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-cyan-500/50 rounded-lg p-6 shadow-2xl dark:shadow-cyan-500/20 w-full max-w-md">
            <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{t('ui.confirm_purchase')}</h2>
            <div className="flex items-center gap-4 bg-gray-100 dark:bg-black/30 p-4 rounded-md mb-4">
              <div className="w-16 h-16 flex-shrink-0"><ActionIcon action={itemToBuy.action} className="w-full h-full" /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t(`item.${itemToBuy.id}.name`)}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{t(`item.${itemToBuy.id}.desc`)}</p>
              </div>
            </div>
            <p className="text-lg text-center mb-4">Cost: <span className="font-bold text-yellow-600 dark:text-yellow-300">${itemToBuy.cost.toLocaleString()}</span></p>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={handleCancelBuyItem} className="px-4 py-2 bg-gray-200 dark:bg-gray-600/80 border-2 border-gray-400 dark:border-gray-400 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-bold">
                {t('ui.cancel')}
              </button>
              <button onClick={handleConfirmBuyItem} className="px-4 py-2 bg-green-600 dark:bg-green-600/80 border-2 border-green-700 dark:border-green-400 text-white dark:text-green-100 rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition-all font-bold">
                {t('ui.buy_1')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
