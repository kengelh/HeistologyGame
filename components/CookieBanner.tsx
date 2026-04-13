/**
 * @file CookieBanner.tsx
 * @description
 * GDPR-compliant cookie consent banner with customization options.
 * Stores user preferences in localStorage.
 */
import * as React from 'react';
import { useTranslation } from '../lib/i18n';
import { CookiePreferences } from '../lib/cookieConsent';
import { initSentry } from '../lib/sentry';

interface CookieBannerProps {
    onPreferencesChange?: (preferences: CookiePreferences) => void;
    forceOpen?: boolean;
    onClose?: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onPreferencesChange, forceOpen, onClose }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);
    const [preferences, setPreferences] = React.useState<CookiePreferences>({
        necessary: true, // Always true, can't be disabled
        analytics: false,
    });

    React.useEffect(() => {
        if (forceOpen) {
            setIsVisible(true);
        }
    }, [forceOpen]);

    React.useEffect(() => {
        // Check if user has already made a choice
        const savedConsent = localStorage.getItem('cookieConsent');
        if (!savedConsent) {
            setIsVisible(true);
        } else {
            // Load saved preferences
            try {
                const savedPreferences = JSON.parse(savedConsent);
                setPreferences(savedPreferences);

                // If preferences are already saved, make sure GA and Sentry respect them immediately
                if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('consent', 'update', {
                        'analytics_storage': savedPreferences.analytics ? 'granted' : 'denied',
                        'functionality_storage': savedPreferences.analytics ? 'granted' : 'denied',
                        'personalization_storage': savedPreferences.analytics ? 'granted' : 'denied',
                        'ad_storage': savedPreferences.analytics ? 'granted' : 'denied'
                    });
                }

                // Re-initialize Sentry if allowed
                if (savedPreferences.analytics) {
                    initSentry();
                }

                onPreferencesChange?.(savedPreferences);
            } catch (e) {
                setIsVisible(true);
            }
        }
    }, [onPreferencesChange]);

    const savePreferences = (prefs: CookiePreferences) => {
        localStorage.setItem('cookieConsent', JSON.stringify(prefs));
        setPreferences(prefs);

        // Update Google Analytics consent
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'analytics_storage': prefs.analytics ? 'granted' : 'denied',
                'functionality_storage': prefs.analytics ? 'granted' : 'denied',
                'personalization_storage': prefs.analytics ? 'granted' : 'denied',
                'ad_storage': prefs.analytics ? 'granted' : 'denied'
            });
        }

        // Re-initialize Sentry if allowed (or at least acknowledge change)
        if (prefs.analytics) {
            initSentry();
        }

        onPreferencesChange?.(prefs);
        if (onClose) {
            onClose();
        }
        setIsVisible(false);
    };

    const handleAcceptAll = () => {
        const allAccepted: CookiePreferences = {
            necessary: true,
            analytics: true,
        };
        savePreferences(allAccepted);
    };

    const handleRejectAll = () => {
        const onlyNecessary: CookiePreferences = {
            necessary: true,
            analytics: false,
        };
        savePreferences(onlyNecessary);
    };

    const handleSaveCustom = () => {
        savePreferences(preferences);
    };

    const handleToggle = (key: keyof CookiePreferences) => {
        if (key === 'necessary') return; // Can't disable necessary cookies
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-[200] p-4 md:p-6 animate-[slide-up_0.4s_ease-out]"
            style={{ fontFamily: "'Outfit', sans-serif" }}
        >
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative bg-[#05070a]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(0, 140, 255, 0.15) 0%, transparent 60%)',
                    }}
                >
                    {/* Main Content */}
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4">
                            {/* Cookie Icon */}
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#008cff] to-[#0066cc] rounded-xl flex items-center justify-center text-2xl shadow-lg">
                                🍪
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-white mb-2">{t('cookies.title')}</h2>
                                <p className="text-[#94a3b8] text-sm leading-relaxed mb-4">
                                    {t('cookies.description')}
                                </p>

                                {/* Detailed Settings */}
                                {showDetails && (
                                    <div className="space-y-3 mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                        {/* Necessary Cookies */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-white font-semibold text-sm mb-1">{t('cookies.necessary.title')}</h3>
                                                <p className="text-[#94a3b8] text-xs">
                                                    {t('cookies.necessary.description')}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-6 bg-[#008cff] rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-50">
                                                    <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Analytics Cookies */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-white font-semibold text-sm mb-1">{t('cookies.analytics.title')}</h3>
                                                <p className="text-[#94a3b8] text-xs">
                                                    {t('cookies.analytics.description')}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() => handleToggle('analytics')}
                                                    className={`w-12 h-6 rounded-full flex items-center transition-all ${preferences.analytics
                                                        ? 'bg-[#008cff] justify-end'
                                                        : 'bg-white/20 justify-start'
                                                        } px-1`}
                                                    aria-label="Toggle analytics cookies"
                                                >
                                                    <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                                                </button>
                                            </div>
                                        </div>


                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={handleAcceptAll}
                                        className="px-6 py-2.5 bg-gradient-to-r from-[#008cff] to-[#0066cc] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#008cff]/30 transition-all hover:scale-105 text-sm"
                                    >
                                        {t('cookies.accept_all')}
                                    </button>

                                    <button
                                        onClick={handleRejectAll}
                                        className="px-6 py-2.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm"
                                    >
                                        {t('cookies.reject_all')}
                                    </button>

                                    {showDetails ? (
                                        <button
                                            onClick={handleSaveCustom}
                                            className="px-6 py-2.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm"
                                        >
                                            {t('cookies.save_selection')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowDetails(true)}
                                            className="px-6 py-2.5 text-[#008cff] font-semibold hover:text-[#0099ff] transition-all text-sm underline"
                                        >
                                            {t('cookies.customize')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative gradient line */}
                    <div className="h-1 bg-gradient-to-r from-transparent via-[#008cff] to-transparent"></div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};
