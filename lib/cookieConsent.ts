/**
 * @file lib/cookieConsent.ts
 * @description
 * Utility to check cookie consent status.
 */

export interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
}

export const getCookieConsent = (): CookiePreferences => {
    try {
        const saved = localStorage.getItem('cookieConsent');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure we return a valid CookiePreferences object even if the stored format is old
            if (parsed && typeof parsed === 'object') {
                return {
                    necessary: true, // Always true
                    analytics: !!parsed.analytics,
                };
            } else if (typeof parsed === 'boolean') {
                // Handle legacy format where it might have been just a boolean
                return {
                    necessary: true,
                    analytics: parsed,
                };
            }
        }
    } catch (e) {
        console.error('Error parsing cookie consent:', e);
    }

    // Default: only necessary cookies
    return {
        necessary: true,
        analytics: false,
    };
};

export const isAnalyticsAllowed = (): boolean => {
    return getCookieConsent().analytics;
};
