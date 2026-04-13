/**
 * @file HeistReport.tsx
 * @description
 * This component renders a stylized, newspaper-themed modal to display the results
 * of a completed or failed heist. It provides a much more engaging and thematic
 * summary than a simple text log.
 */
import * as React from 'react';
import type { HeistReportData } from '../types';
import { useTranslation } from '../lib/i18n';

interface HeistReportProps {
    isGenerating: boolean;
    data: HeistReportData | null;
    onReturnToHub: () => void;
    onTryAgainNewPlan: () => void;
    onTryAgainEditPlan: () => void;
}

const LoadingScreen: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-gray-900/80 z-[100] flex items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] font-mono">
                    {t('ui.compiling_report')}
                    <span className="animate-[pulse_1.5s_ease-in-out_infinite]">...</span>
                </h1>
                <div className="mt-3 md:mt-4 text-base md:text-lg text-yellow-300 font-mono typing-cursor">{t('ui.finalizing_details')}</div>
            </div>
        </div>
    );
};


export const HeistReport: React.FC<HeistReportProps> = ({ isGenerating, data, onReturnToHub, onTryAgainNewPlan, onTryAgainEditPlan }) => {
    const { t } = useTranslation();
    if (isGenerating && !data) {
        return <LoadingScreen />;
    }

    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/85 z-[100] flex items-center justify-center animate-[fade-in_0.5s_ease-out] p-3 md:p-4 font-typewriter">
            <div className="bg-manila dark:bg-slate-800 text-gray-900 dark:text-gray-100 w-full max-w-2xl p-4 md:p-10 border-4 md:border-8 border-slate-900/10 dark:border-slate-600 shadow-2xl max-h-[92dvh] overflow-y-auto relative">
                {/* Coffee Stain detail */}
                <div className="absolute top-4 right-4 coffee-stain w-32 h-32 opacity-20 transform -rotate-12 pointer-events-none" />

                <div className="text-center border-b-2 md:border-b-4 border-slate-900/20 pb-3 md:pb-4 mb-4 md:mb-6">
                    <h1 className="text-xl md:text-3xl font-black leading-tight uppercase tracking-tight">{data.headline}</h1>
                    <p className="italic font-handwriting text-ink dark:text-cyan-400 mt-1 md:mt-2 text-base md:text-lg">{data.scenarioName}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-4 md:mb-8">
                    {/* Main Article: Takes 2 columns */}
                    <div className="md:col-span-2">
                        <div className="text-gray-800 dark:text-gray-300 leading-relaxed text-sm md:text-lg whitespace-pre-wrap">
                            {data.article}
                        </div>
                    </div>

                    {/* Sidebar: Debrief and Payout */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/5 p-4 rounded-sm border-2 border-slate-900/10">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-slate-500">{t('ui.mission_log')}</h2>
                            <ul className="text-xs space-y-3">
                                {data.objectivesMessage.split('\n').filter(line => line.length > 0).map((line, index) => {
                                    const success = line.includes('MET') || (line.includes('Primary') && data.wasSuccess);
                                    const failed = line.includes('FAILED');
                                    const cleanLine = line.replace(/• |MET\.|FAILED\./g, '').trim();
                                    return (
                                        <li key={index} className={`flex items-start gap-2 ${success ? 'text-green-700' : ''} ${failed ? 'text-red-700' : ''}`}>
                                            <span className="shrink-0">{success ? '✓' : failed ? '✗' : '•'}</span>
                                            <span className={failed ? 'line-through opacity-70' : ''}>{cleanLine}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {data.wasSuccess && (
                            <div className="bg-ink/5 p-4 border-4 border-ink/20 rounded-sm">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-3 text-ink">{t('ui.financials')}</h2>
                                <div className="text-[11px] space-y-1">
                                    <div className="flex justify-between"><span>{t('ui.loot')}:</span> <span className="font-bold">+${data.cashGained.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>{t('ui.gear')}:</span> <span className="text-evidence">-${data.finalGearCost.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>{t('ui.crew')}:</span> <span className="text-evidence">-${data.crewCut.toLocaleString()}</span></div>
                                    <div className="flex justify-between font-bold text-sm border-t-2 border-ink/20 pt-2 mt-2"><span>{t('ui.net')}:</span> <span className="text-green-800">${data.yourTake.toLocaleString()}</span></div>
                                </div>
                                <div className="mt-4 text-center text-xs font-bold border-t-2 border-ink/10 pt-2">
                                    {t('ui.rep')}: <span className="text-ink">+{data.totalReputationGained}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Captured Crew Members */}
                {data.capturedPlayers.length > 0 && (
                    <div className="mt-6 border-4 border-evidence/30 p-4 bg-evidence/5 text-center">
                        <h3 className="font-bold text-evidence uppercase tracking-widest text-sm mb-1">{t('ui.captured_crew')}:</h3>
                        <p className="font-bold text-lg text-slate-800">{data.capturedPlayers.join(', ')}</p>
                    </div>
                )}

                <div className="mt-4 md:mt-8 flex flex-wrap justify-center items-center gap-3 md:gap-6">
                    <button onClick={onReturnToHub} className="btn-stamp text-slate-700 border-slate-700 hover:text-slate-900 py-2 text-xs md:text-sm">
                        {t('ui.return_to_hub')}
                    </button>
                    <button onClick={onTryAgainNewPlan} className="btn-stamp text-ink border-ink hover:text-blue-900 py-2 text-xs md:text-sm">
                        {t('ui.restart_new_plan')}
                    </button>
                    <button onClick={onTryAgainEditPlan} className="btn-stamp text-ink border-ink hover:text-blue-900 py-2 text-xs md:text-sm">
                        {t('ui.restart_edit_plan')}
                    </button>
                </div>
            </div>
        </div>
    );
};
