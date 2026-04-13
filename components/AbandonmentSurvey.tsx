/**
 * @file components/AbandonmentSurvey.tsx
 * @description
 * An exit-intent survey that triggers when a user attempts to leave the page
 * before starting a heist. Helps identify friction points in the early game.
 */

import * as React from 'react';
import { useTranslation } from '../lib/i18n';
import { sendSurveyFeedback } from '../lib/sentry';

interface AbandonmentSurveyProps {
    /** Whether the user has ever started a heist in this session */
    hasStartedHeist: boolean;
}

export function AbandonmentSurvey({ hasStartedHeist }: AbandonmentSurveyProps) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = React.useState(false);
    const [hasBeenShown, setHasBeenShown] = React.useState(() => {
        return localStorage.getItem('abandonmentSurveyShown') === 'true';
    });
    const [selectedReason, setSelectedReason] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [submitError, setSubmitError] = React.useState(false);

    React.useEffect(() => {
        // Debug mode / Testing via URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug_survey')) {
            setIsVisible(true);
            return;
        }

        // Reset survey state via URL
        if (urlParams.has('reset_survey')) {
            localStorage.removeItem('abandonmentSurveyShown');
            setHasBeenShown(false);
        }

        // Only track exit intent if they haven't started a heist and haven't seen the survey yet
        if (hasStartedHeist || hasBeenShown) return;

        const handleMouseOut = (e: MouseEvent) => {
            // Trigger if mouse moves above the viewport (towards tabs/close button)
            // e.relatedTarget is null when the mouse leaves the window
            if (!e.relatedTarget && e.clientY <= 20) {
                setIsVisible(true);
                setHasBeenShown(true);
                localStorage.setItem('abandonmentSurveyShown', 'true');
            }
        };

        document.addEventListener('mouseout', handleMouseOut);
        return () => document.removeEventListener('mouseout', handleMouseOut);
    }, [hasStartedHeist, hasBeenShown]);

    const handleSubmit = async () => {
        if (!selectedReason) return;

        setIsSubmitting(true);
        setSubmitError(false);
        try {
            await sendSurveyFeedback({
                name: 'Exit Survey',
                email: 'anonymous@survey.local',
                type: 'survey',
                subject: 'User Abandoned Prior to Heist',
                message: `Reason: ${selectedReason}`,
                gameContext: { screen: 'AbandonmentSurvey' }
            });
            setIsSubmitted(true);
            setTimeout(() => setIsVisible(false), 2000);
        } catch (error) {
            console.error('Failed to send exit survey:', error);
            setSubmitError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible) return null;

    const reasons = t('survey.abandonment.reasons') as unknown as string[];

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-8 max-w-md w-full max-h-[92dvh] overflow-y-auto shadow-2xl border-4 border-red-500/50 animate-scale-in text-center">

                {isSubmitted ? (
                    <div className="py-4 md:py-8">
                        <div className="text-4xl md:text-6xl mb-3 md:mb-4">🙌</div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                            {t('survey.abandonment.thanks')}
                        </h2>
                    </div>
                ) : (
                    <>
                        <div className="text-4xl md:text-5xl mb-3 md:mb-6">🕵️‍♂️</div>
                        <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 md:mb-2">
                            {t('survey.abandonment.title')}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4 md:mb-8">
                            {t('survey.abandonment.subtitle')}
                        </p>

                        <div className="grid grid-cols-1 gap-1.5 md:gap-2 mb-4 md:mb-8">
                            {reasons.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setSelectedReason(reason)}
                                    className={`py-2 md:py-3 px-3 md:px-4 rounded-xl text-xs font-bold uppercase transition-all border-2 text-left ${selectedReason === reason
                                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 md:gap-4">
                            <button
                                onClick={() => setIsVisible(false)}
                                className="flex-1 py-3 md:py-4 px-4 md:px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800"
                            >
                                {t('survey.abandonment.close')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedReason || isSubmitting}
                                className="flex-[2] py-3 md:py-4 px-4 md:px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500 hover:bg-red-400 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white shadow-xl shadow-red-500/20 transition-all"
                            >
                                {isSubmitting ? '...' : t('survey.abandonment.submit')}
                            </button>
                        </div>
                        {submitError && (
                            <p className="mt-3 text-[10px] text-red-500 text-center font-medium">
                                Submission failed — please try again or close.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
