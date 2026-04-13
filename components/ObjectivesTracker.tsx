import * as React from 'react';
import { Scenario, GameState } from '../types';
import { useTranslation } from '../lib/i18n';

interface ObjectivesTrackerProps {
    scenario: Scenario | null;
    gameState: GameState;
}

const ObjectiveItem: React.FC<{ label: string; status: 'pending' | 'success' | 'failed' }> = ({ label, status }) => {
    const color = status === 'success' ? 'text-green-500 dark:text-green-400' : status === 'failed' ? 'text-red-600 dark:text-red-500' : 'text-gray-500 dark:text-gray-300';
    const textDecoration = status === 'failed' ? 'line-through' : 'none';

    return (
        <li className={`flex items-center gap-2 transition-colors duration-500 ${color}`} style={{ textDecoration }}>
            {status === 'success' ? <span className="text-green-500 dark:text-green-400">✓</span> : status === 'failed' ? <span className="text-red-600 dark:text-red-500">✗</span> : <span className="text-gray-600 dark:text-gray-500">•</span>}
            <span>{label}</span>
        </li>
    );
};

export const ObjectivesTracker: React.FC<ObjectivesTrackerProps> = ({ scenario, gameState }) => {
    const { t } = useTranslation();
    if (!scenario || !gameState) return null;

    const { objectiveStatus, gameWon, gameOver, stolenValue, totalLootValue } = gameState;

    const missionCompleted = objectiveStatus.primary === 'success';

    let stealthStatus: 'pending' | 'success' | 'failed' = objectiveStatus.stealth;
    if (gameWon) {
        stealthStatus = objectiveStatus.stealth === 'pending' && missionCompleted ? 'success' : 'failed';
    }

    let speedStatus: 'pending' | 'success' | 'failed' = objectiveStatus.speed;
    if (gameWon) {
        speedStatus = objectiveStatus.speed === 'pending' && missionCompleted ? 'success' : 'failed';
    }

    return (
        <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 rounded-lg border-2 border-gray-300 dark:border-cyan-500/30 font-mono text-sm shadow-lg dark:shadow-cyan-500/10 z-30">
            <h3 className="text-md font-bold text-cyan-700 dark:text-cyan-300 mb-2 uppercase tracking-wider border-b border-gray-300 dark:border-cyan-500/30 pb-1">{t('ui.objectives')}</h3>
            <ul className="space-y-1">
                {scenario.primaryTarget ? (
                    <ObjectiveItem label={t('ui.secure_primary_target')} status={objectiveStatus.primary} />
                ) : (
                    <ObjectiveItem label={t('ui.complete_mission_75')} status={objectiveStatus.primary} />
                )}
                {scenario.secondaryTarget && (
                    <ObjectiveItem label={t('ui.secure_secondary_target')} status={objectiveStatus.secondary} />
                )}
                <ObjectiveItem label={t('ui.stealth_no_alarms')} status={stealthStatus} />
                <ObjectiveItem label={t('ui.speed_objective', { time: scenario.speedRunTime })} status={speedStatus} />
                <ObjectiveItem label={t('ui.full_loot_95')} status={stolenValue > totalLootValue * 0.95 ? 'success' : (gameOver || gameWon) ? 'failed' : 'pending'} />
            </ul>
        </div>
    );
};