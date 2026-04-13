/**
 * @file components/BugReportButton.tsx
 * @description
 * An enhanced feedback and bug reporting button that allows users to categorize
 * their messages and provide descriptive subjects for better tracking in Sentry.
 * Named "User Feedback" as per user request.
 */

import * as React from 'react';
import { sendUserFeedback } from '../lib/sentry';

// Import the user-provided icon
import userFeedbackIcon from '../assets/user-feedback-icon.png';

interface BugReportButtonProps {
    /** Optional additional context to include with bug reports */
    gameContext?: Record<string, any>;
}

type MessageType = 'bug' | 'feature' | 'comment' | 'question';

const TYPE_LABELS: Record<MessageType, string> = {
    bug: 'Bug Report',
    feature: 'Feature Request',
    comment: 'Comment / Feedback',
    question: 'Question',
};

/**
 * Enhanced User Feedback Button Component
 * Uses Tailwind CSS for premium styling and theme support.
 */
export function BugReportButton({ gameContext }: BugReportButtonProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        type: 'bug' as MessageType,
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitSuccess, setSubmitSuccess] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            console.log('📤 Submitting feedback to Sentry...');

            await sendUserFeedback({
                name: formData.name,
                email: formData.email,
                type: formData.type,
                subject: formData.subject,
                message: formData.message,
                gameContext: gameContext
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitSuccess(false);
                setFormData({
                    name: '',
                    email: '',
                    type: 'bug',
                    subject: '',
                    message: ''
                });
            }, 2500);

        } catch (error) {
            console.error('❌ Failed to submit feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Feedback Button - Compact size */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg hover:shadow-red-500/40 transition-all duration-300 hover:scale-110 z-[999]"
                title="Send Feedback"
            >
                <img
                    src={userFeedbackIcon}
                    alt="Feedback"
                    className="w-4 h-4 object-contain dark:invert"
                />
            </button>

            {/* Feedback Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {submitSuccess ? (
                            <div className="py-12 text-center">
                                <div className="text-6xl mb-4 animate-bounce">✨</div>
                                <h2 className="text-2xl font-black text-green-500 dark:text-green-400 uppercase tracking-tight mb-2">Thank You!</h2>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Your message has been safely delivered to our headquarters.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                            <img
                                                src={userFeedbackIcon}
                                                alt=""
                                                className="w-6 h-6 object-contain dark:invert"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">User Feedback</h2>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-3xl font-light"
                                    >
                                        ×
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Your Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white"
                                                placeholder="Anonymous"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Email (Optional)</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white"
                                                placeholder="thief@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Message Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(Object.entries(TYPE_LABELS) as [MessageType, string][]).map(([value, label]) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: value })}
                                                    className={`py-2.5 px-4 rounded-xl text-xs font-bold uppercase transition-all border-2 ${formData.type === value
                                                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Subject</label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white"
                                            placeholder="What's this about?"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Message</label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                            rows={4}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white resize-none"
                                            placeholder="Details please..."
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 font-mono"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !formData.message.trim() || !formData.subject.trim()}
                                            className="flex-[2] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest bg-red-500 hover:bg-red-400 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white shadow-xl shadow-red-500/20 transition-all font-mono"
                                        >
                                            {isSubmitting ? 'Transmitting...' : 'Send Feedback'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
