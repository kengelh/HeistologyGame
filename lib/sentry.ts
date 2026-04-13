/**
 * @file lib/sentry.ts
 * @description
 * Sentry configuration for bug tracking and error monitoring.
 * This file initializes Sentry dynamically based on user consent.
 */

import { isAnalyticsAllowed } from './cookieConsent';

let isInitialized = false;

/**
 * Initialize Sentry for error tracking and user feedback.
 */
export async function initSentry() {
    // Check if analytics/error tracking is allowed
    if (!isAnalyticsAllowed()) {
        console.log("Sentry initialization skipped based on user tracking preferences.");
        return;
    }

    if (isInitialized) return;

    // Only initialize if DSN is provided
    const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";

    if (!SENTRY_DSN) {
        console.log("Sentry DSN not configured. Skipping Sentry initialization.");
        return;
    }

    try {
        const Sentry = await import("@sentry/react");

        Sentry.init({
            dsn: SENTRY_DSN,
            environment: import.meta.env.MODE,
            sendDefaultPii: true,
            sampleRate: 1.0,
            tracesSampleRate: 0.1,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    maskAllText: false,
                    blockAllMedia: false,
                }),
                Sentry.feedbackIntegration({
                    autoInject: false,
                }),
            ],
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            debug: import.meta.env.MODE === 'development',
        });

        isInitialized = true;
        console.log('✅ Sentry initialized successfully.');
    } catch (e) {
        console.error('❌ Failed to initialize Sentry:', e);
    }
}

/**
 * Manually capture an error or message
 */
export async function captureError(error: Error | string, context?: Record<string, any>) {
    if (!isAnalyticsAllowed()) return;

    try {
        const Sentry = await import("@sentry/react");
        if (typeof error === 'string') {
            Sentry.captureMessage(error, {
                level: 'error',
                extra: context,
            });
        } else {
            Sentry.captureException(error, {
                extra: context,
            });
        }
    } catch (e) {
        console.error('Failed to capture error in Sentry:', e);
    }
}

/**
 * Add context about the current game state
 */
export async function setGameContext(context: Record<string, any>) {
    if (!isAnalyticsAllowed()) return;

    try {
        const Sentry = await import("@sentry/react");
        Sentry.setContext("game", context);
    } catch (e) {
        // Silent fail for context
    }
}

/**
 * Send user feedback directly
 */
export async function sendUserFeedback(data: {
    name: string;
    email: string;
    message: string;
    subject: string;
    type: string;
    gameContext?: any;
}) {
    if (!isAnalyticsAllowed()) {
        console.warn("Feedback submission blocked by privacy settings.");
        return;
    }

    try {
        const Sentry = await import("@sentry/react");

        const headline = `[${data.type}]: ${data.subject || 'No Subject'}`;
        const eventId = Sentry.captureMessage(headline, {
            level: data.type === 'bug' ? 'error' : 'info',
            tags: {
                type: 'user_feedback',
                feedback_type: data.type,
                source: 'bug_report_button',
                user_name: data.name || 'Anonymous',
            },
            contexts: {
                feedback_details: {
                    type: data.type,
                    subject: data.subject,
                    message: data.message,
                },
                game: data.gameContext || {},
            },
        });

        if (typeof (Sentry as any).sendFeedback === 'function') {
            await (Sentry as any).sendFeedback({
                name: data.name || 'Anonymous',
                email: data.email || 'not-provided@example.com',
                message: `[${data.type}] ${data.subject}\n\n${data.message}`,
                associatedEventId: eventId,
            });
        }
    } catch (e) {
        console.error('Failed to send feedback to Sentry:', e);
        throw e;
    }
}

/**
 * Send survey or explicit opt-in feedback — NOT gated by cookie consent.
 * The user is actively choosing to submit this data, so consent is implied by the action.
 * Falls back gracefully if Sentry is unavailable.
 */
export async function sendSurveyFeedback(data: {
    name: string;
    email: string;
    message: string;
    subject: string;
    type: string;
    gameContext?: any;
}): Promise<void> {
    const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";

    if (!SENTRY_DSN) {
        console.warn('Survey feedback: Sentry DSN not configured, cannot send.');
        return;
    }

    try {
        // Dynamically import Sentry — it may not be initialized yet (user declined cookies)
        const Sentry = await import("@sentry/react");

        // If Sentry hasn't been initialized yet, initialize it minimally just for this submission
        if (!isInitialized) {
            Sentry.init({
                dsn: SENTRY_DSN,
                environment: import.meta.env.MODE,
                // Minimal init: no replay, no tracing, just event capture
                integrations: [],
                sampleRate: 1.0,
                tracesSampleRate: 0,
            });
            isInitialized = true;
            console.log('✅ Sentry initialized for survey feedback.');
        }

        const headline = `[survey]: ${data.subject}`;
        const eventId = Sentry.captureMessage(headline, {
            level: 'info',
            tags: {
                type: 'survey_feedback',
                feedback_type: data.type,
                source: 'abandonment_survey',
            },
            contexts: {
                survey: {
                    message: data.message,
                    subject: data.subject,
                },
                game: data.gameContext || {},
            },
        });

        // Use Sentry's User Feedback API if available
        if (typeof (Sentry as any).sendFeedback === 'function') {
            await (Sentry as any).sendFeedback({
                name: data.name || 'Survey Respondent',
                email: data.email || 'survey@heistology.com',
                message: `[survey] ${data.subject}\n\n${data.message}`,
                associatedEventId: eventId,
            });
        }

        console.log('✅ Survey feedback sent successfully.');
    } catch (e) {
        console.error('❌ Failed to send survey feedback:', e);
        throw e;
    }
}
