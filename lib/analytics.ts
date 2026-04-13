/**
 * @file analytics.ts
 * @description
 * This file provides a centralized utility for sending events to Google Analytics 4 (GA4).
 * It uses the globally available `gtag` function defined in `index.html`.
 */

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        goatcounter?: {
            count: (params: { path: string; title: string; event: boolean }) => void;
        };
    }
}

import { isAnalyticsAllowed } from './cookieConsent';

/**
 * Sends a custom event to Google Analytics.
 * @param eventName - The name of the event (e.g., 'scenario_start').
 * @param params - Optional parameters to include with the event.
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    // CRITICAL: Check cookie consent before sending any analytics data
    if (!isAnalyticsAllowed()) {
        if (import.meta.env.DEV) {
            console.log(`[Analytics] Blocked (no consent): ${eventName}:`, params);
        }
        return;
    }

    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    } else {
        // In development or if GA is blocked, just log to console.
        if (import.meta.env.DEV) {
            console.log(`[Analytics] ${eventName}:`, params);
        }
    }
};

/**
 * Tracks when a user starts a specific heist scenario.
 */
export const trackScenarioStart = (scenarioId: string, crewSize: number) => {
    trackEvent('scenario_start', {
        scenario_id: scenarioId,
        crew_size: crewSize,
        timestamp: Date.now(),
    });
};

/**
 * Tracks when a user completes or fails a heist scenario.
 */
export const trackScenarioEnd = (
    scenarioId: string,
    result: 'win' | 'fail',
    stolenValue: number,
    gameTimeTaken: number,
    realDurationSeconds: number
) => {
    trackEvent('scenario_end', {
        scenario_id: scenarioId,
        result: result,
        stolen_value: stolenValue,
        game_duration_seconds: gameTimeTaken,
        real_duration_seconds: realDurationSeconds,
    });
};

/**
 * Tracks individual actions planned by the user.
 * This helps understand which abilities (lockpick, smash, hack) are used most.
 */
export const trackActionPlanned = (actionType: string, scenarioId: string) => {
    trackEvent('action_planned', {
        action_type: actionType,
        scenario_id: scenarioId,
    });
};

/**
 * Tracks high-level navigation between screens in the app.
 */
export const trackNavigation = (screenName: string) => {
    // 1. Track in Google Analytics (requires cookie consent)
    trackEvent('page_view', {
        page_title: screenName,
        page_location: window.location.href,
        page_path: `/${screenName}`
    });

    // 2. Track in GoatCounter (Privacy-friendly, doesn't use cookies)
    // We manually trigger this for SPA navigation since GoatCounter only tracks on initial load by default.
    // We add a retry mechanism to ensure the script is loaded before we try to track.
    const trackGoatCounter = (retries = 0) => {
        if (typeof window !== 'undefined' && window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({
                path: `/${screenName}`,
                title: screenName,
                event: false,
            });
            if (import.meta.env.DEV) {
                console.log(`[Analytics] GoatCounter tracked: /${screenName}`);
            }
        } else if (retries < 10) {
            // Retry every 500ms for up to 5 seconds
            setTimeout(() => trackGoatCounter(retries + 1), 500);
        } else {
            if (import.meta.env.DEV) {
                console.warn(`[Analytics] GoatCounter script not found after retries.`);
            }
        }
    };

    trackGoatCounter();
};
