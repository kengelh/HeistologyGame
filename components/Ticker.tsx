import * as React from 'react';

interface TickerProps {
    messages: { id: number, text: string }[];
}

export const Ticker: React.FC<TickerProps> = ({ messages }) => {
    if (messages.length === 0) {
        return null;
    }

    // Join all current messages into a single string for the marquee effect.
    // A separator is added to create space between different event messages.
    const tickerText = messages.map(msg => msg.text).join(' ••• ');

    return (
        <div className="fixed bottom-4 left-0 w-full overflow-hidden bg-white/80 dark:bg-black/80 border-t border-b border-cyan-600/50 dark:border-cyan-400/50 py-2 z-50 pointer-events-none font-mono backdrop-blur-sm">
            <div className="inline-block whitespace-nowrap pl-full animate-[marquee_30s_linear_infinite] text-cyan-800 dark:text-yellow-300 font-bold text-lg">
                {tickerText}
            </div>
        </div>
    );
};
