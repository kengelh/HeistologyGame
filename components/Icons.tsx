// Import React to define components.
import * as React from 'react';
import { ActionType } from '../types';

// This file contains a collection of SVG icons used throughout the application.
// Each icon is a stateless React Functional Component (FC) for easy use and styling.
// Centralizing icons here makes them easy to find, update, and reuse.
// The `className` prop is passed to the SVG element, allowing for styling with Tailwind CSS from the parent component.

// --- SVG PATTERN DEFINITIONS for Floors ---
// This component should be rendered once in the parent component to make the patterns available by ID.
export const FloorPatternDefs: React.FC = () => (
    <svg width="0" height="0" className="absolute">
        <defs>
            <pattern id="wood" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
                <rect width="40" height="40" fill="#6b462a" />
                <line x1="0" y1="0" x2="0" y2="40" stroke="#49301d" strokeWidth="10" />
                <line x1="20" y1="0" x2="20" y2="40" stroke="#5a3d25" strokeWidth="10" />
            </pattern>
            <pattern id="cement" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#9ca3af" />
                <circle cx="5" cy="5" r="1" fill="#808791" />
                <circle cx="15" cy="15" r="1.5" fill="#89919b" />
                <circle cx="10" cy="10" r="0.5" fill="#aab2bd" />
            </pattern>
            <pattern id="marble" patternUnits="userSpaceOnUse" width="50" height="50">
                <rect width="50" height="50" fill="#e5e7eb" />
                <path d="M0 25 C 10 10, 40 40, 50 25" stroke="#cbd5e1" fill="none" strokeWidth="2" opacity="0.6" />
                <path d="M0 5 C 20 20, 30 -5, 50 10" stroke="#94a3b8" fill="none" strokeWidth="1" opacity="0.5" />
                <path d="M0 45 C 15 55, 35 35, 50 40" stroke="#94a3b8" fill="none" strokeWidth="1.5" opacity="0.7" />
            </pattern>
            <pattern id="slate" patternUnits="userSpaceOnUse" width="40" height="40">
                <rect width="40" height="40" fill="#475569" />
                <rect x="0" y="0" width="20" height="20" fill="#404c5c" />
                <rect x="20" y="20" width="20" height="20" fill="#404c5c" />
            </pattern>
            <pattern id="carpet" patternUnits="userSpaceOnUse" width="10" height="10">
                <rect width="10" height="10" fill="#6d2828" />
                <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke="#5a2121" strokeWidth="1" />
            </pattern>
            <pattern id="tiles" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#e5e7eb" />
                <rect width="10" height="10" fill="#f3f4f6" />
                <rect x="10" y="10" width="10" height="10" fill="#f3f4f6" />
            </pattern>
            <pattern id="brick" patternUnits="userSpaceOnUse" width="40" height="24">
                <rect width="40" height="24" fill="#8b1d1d" />
                {/* Horizontal mortar */}
                <line x1="0" y1="12" x2="40" y2="12" stroke="#5a1212" strokeWidth="2" opacity="0.6" />
                <line x1="0" y1="24" x2="40" y2="24" stroke="#5a1212" strokeWidth="2" opacity="0.6" />
                {/* Vertical mortar Row 1 */}
                <line x1="20" y1="0" x2="20" y2="12" stroke="#5a1212" strokeWidth="2" opacity="0.6" />
                {/* Vertical mortar Row 2 */}
                <line x1="0" y1="12" x2="0" y2="24" stroke="#5a1212" strokeWidth="2" opacity="0.6" />
                <line x1="40" y1="12" x2="40" y2="24" stroke="#5a1212" strokeWidth="2" opacity="0.6" />
                {/* Subtle highlight for brick depth */}
                <rect x="2" y="2" width="16" height="8" fill="#a52a2a" opacity="0.2" rx="1" />
                <rect x="22" y="2" width="16" height="8" fill="#a52a2a" opacity="0.2" rx="1" />
                <rect x="2" y="14" width="16" height="8" fill="#a52a2a" opacity="0.2" rx="1" />
                <rect x="22" y="14" width="16" height="8" fill="#a52a2a" opacity="0.2" rx="1" />
            </pattern>
            <pattern id="wall-hatch" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                <rect width="10" height="10" fill="#1e293b" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#334155" strokeWidth="2" />
            </pattern>
        </defs>
    </svg>
);

// Icon for a diamond, representing treasure in a display case.
export const DiamondIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 15 10-15-10-5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 7l10 15 10-15" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22V7" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 7h20" />
    </svg>
);

// Icon for a video camera, representing a security camera.
export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
);

// Icon for a key, used on locked doors.
export const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="#FFA500">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 14.5l-3-3m0 0l-3 3m3-3v10a2 2 0 01-2 2h-1a2 2 0 01-2-2v-2m4-4h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
);

// Icon for a safe, representing a high-value treasure container.
export const SafeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 492 492" fill="currentColor">
        <path d="M421.063 0H70.5C31.597 0 0 31.597 0 70.5v350.563C0 459.966 31.597 491.563 70.5 491.563h350.563c38.903 0 70.5-31.597 70.5-70.5V70.5C491.563 31.597 459.966 0 421.063 0zM70.5 461.563c-22.319 0-40.5-18.181-40.5-40.5V70.5c0-22.319 18.181-40.5 40.5-40.5h20v60h-20c-8.284 0-15 6.716-15 15s6.716 15 15 15h20v90h-20c-8.284 0-15 6.716-15 15s6.716 15 15 15h20v90h-20c-8.284 0-15 6.716-15 15s6.716 15 15 15h20v60H70.5zM245.781 382.049c-75.979 0-137.988-61.998-137.988-137.988s61.998-137.988 137.988-137.988s137.988 61.998 137.988 137.988-61.998 137.988-137.988 137.988zm175.282 79.514h-20v-60h20c8.284 0 15-6.716 15-15s-6.716-15-15-15h-20v-90h20c8.284 0 15-6.716 15-15s-6.716-15-15-15h-20v-90h20c8.284 0 15-6.716 15-15s-6.716-15-15-15h-20v-60h20c22.319 0 40.5 18.181 40.5 40.5v350.563c0 22.319-18.181 40.5-40.5 40.5zM245.781 136.073c-58.495 0-107.988 42.536-107.988 97.988s49.493 97.988 107.988 97.988c58.495 0 107.988-42.536 107.988-97.988s-49.493-97.988-107.988-97.988zm0 165.976c-41.979 0-77.988-33.518-77.988-67.988s36.009-67.988 77.988-67.988s77.988 33.518 77.988 67.988-36.009 67.988-77.988 67.988zm15-73.738v-12.25h-30v12.25h-20.488v30h20.488v19.75h30v-19.75h28.026v-30H260.781z" />
    </svg>
);

// Generic clock icon for composing with other icons.
// The style prop allows for absolute positioning within a relative parent.
// FIX: Export ClockIcon for use in ControlPanel
export const ClockIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Icon for a time-locked safe. It layers a clock icon over the safe icon.
export const TimeLockSafeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <SafeIcon className="w-full h-full" />
        <ClockIcon className="absolute w-2/3 h-2/3 text-yellow-400 opacity-90" />
    </div>
);

// NEW: A dedicated Vault Door icon
export const VaultDoorIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="8" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" strokeWidth="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4M12 20v-2M18 12h2M4 12h2M16.95 7.05l1.414-1.414M5.636 18.364l1.414-1.414M18.364 18.364l-1.414-1.414M7.05 7.05l-1.414-1.414" />
    </svg>
);


// Icon for a time-locked vault door. It layers a clock icon over the new VaultDoorIcon.
export const TimeLockDoorIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <VaultDoorIcon className="w-full h-full" />
        <ClockIcon className="absolute w-2/3 h-2/3 text-yellow-400 opacity-90" />
    </div>
);


// Generic Player Icon Fallback.
// The `isActive` prop controls its opacity, and `className` controls color.
// Generic Player Icon Fallback.
// The `isActive` prop controls its opacity, and `className` controls color.
export const PlayerIcon: React.FC<{ isActive?: boolean, className?: string }> = ({ isActive = true, className = '' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="currentColor"
        className={`w-full h-full transition-opacity duration-300 ${!isActive ? 'opacity-10' : ''} ${className}`}
    >
        <g>
            <path d="M336.406 166.563c-10.891 1.75-72.609 12.094-76.5 12.094-3.906 0-3.906 0-3.906 0s0 0-3.906 0-65.609-10.344-76.5-12.094c-18.719-3.031-34.344 2.266-39.813 4.531-22.969 9.531-15.25 31.813-10.156 40.063c7.047 11.344 33.781 41.125 60.125 44.609c34.344 4.516 64-21.172 70.25-21.172c6.234 0 35.906 25.688 70.25 21.172c26.344-3.484 53.094-33.266 60.125-44.609c5.094-8.25 12.813-30.531-10.156-40.063C370.734 168.828 355.125 163.531 336.406 166.563z M184.656 220.984c-11.094-10.734-9.25-21.516 3.688-22.391c12.969-0.906 34.813 4.5 35.172 11.656C224.438 228.156 195.75 231.75 184.656 220.984z M327.344 220.984c-11.109 10.766-39.797 7.172-38.859-10.734c0.359-7.156 22.203-12.563 35.141-11.656C336.594 199.469 338.438 210.25 327.344 220.984z" />
            <path d="M402.75 115.906c0-5.031-5.219-15.094-14.578-17.125C374.656 19.156 296.563 0 256 0S137.344 19.156 123.813 98.781c-9.375 2.031-14.563 12.094-14.563 17.125c0 5.047 0 33.25 0 33.25h293.5C402.75 149.156 402.75 120.953 402.75 115.906z" />
            <path d="M356.719 382.234c0-20.203-6.281-42.297-26.234-42.297H181.5c-19.938 0-26.234 22.094-26.234 42.297c0 4.797-93.359 28.828-93.359 82.656c0 12.516 30.422 47.109 193.031 47.109h2.109c162.625 0 193.047-34.594 193.047-47.109C450.094 411.063 356.719 387.031 356.719 382.234z" />
        </g>
    </svg>
);

// Guard Icon. Colored red specifically to be an antagonist.
export const GuardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={`w-full h-full text-red-500 ${className}`} style={{ color: '#ef4444' }}>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="m17.148 31.169-6.852 7.831 6.852-7.831c-.09 0-.18.01-.27.03-5.404 1.319-10.879 4.007-10.879 8.05V44h36V39.25c0-4.043-5.475-6.731-10.879-8.05-.09-.022-.18-.032-.27-.031L24 39l-6.852-7.831ZM35 37.333c0 0-1.333-.666-2-1.333-.667.667-2 1.333-2 1.333 0 0 .698 2.667 2 2.667 1.302 0 2-2.667 2-2.667ZM25.5 29h-3c-.552 0-1 .448-1 1v1.586c0 .265.105.52.293.707L22.5 33l-1 3.5 2.5 5 2.5-5-1-4 .447-.224c.339-.17.553-.516.553-.895V30c0-.552-.448-1-1-1Zm-10.5-11v-3h2v3c0 3.866 3.134 7 7 7s7-3.134 7-7v-3h2v3c0 4.97-4.029 9-9 9s-9-4.03-9-9ZM13.688 12c-.076-.12-.154-.24-.232-.361-1.416-2.2-2.456-3.824-2.456-5.542 0-.8.52-1.474 1.209-2.007C14.769 2.107 24 1 24 1s9.231 1.107 11.791 3.088c.689.534 1.209 1.208 1.209 2.008 0 1.898-1.174 3.479-2.058 4.873H13.688ZM22 8c0-1.105.895-2 2-2s2 .895 2 2-1.105 2-2 2-2-.895-2-2Zm-7.979 6.41c.046-.238.263-.41.517-.41h18.923c.254 0 .471.173.517.41l.003.005.003.006.002.008.003.014a2.06 2.06 0 0 1 .01 0c.01.033.015.074.016.12.002.143-.01.337-.064.567-.109.463-.381 1.052-1.004 1.625C31.697 17.995 29.161 19 24 19s-7.697-1.005-8.931-2.14c-.623-.574-.895-1.163-1.004-1.626-.054-.23-.066-.424-.064-.567 0-.046.005-.087.016-.12a2.06 2.06 0 0 1 .01 0l.003-.014.002-.008.003-.006.002-.004Z" />
    </svg>
);

// Icon for the guard patrol tool in the map editor.
export const PatrolIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 48 48" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="m17.148 31.169-6.852 7.831 6.852-7.831c-.09 0-.18.01-.27.03-5.404 1.319-10.879 4.007-10.879 8.05V44h36V39.25c0-4.043-5.475-6.731-10.879-8.05-.09-.022-.18-.032-.27-.031L24 39l-6.852-7.831ZM35 37.333c0 0-1.333-.666-2-1.333-.667.667-2 1.333-2 1.333 0 0 .698 2.667 2 2.667 1.302 0 2-2.667 2-2.667ZM25.5 29h-3c-.552 0-1 .448-1 1v1.586c0 .265.105.52.293.707L22.5 33l-1 3.5 2.5 5 2.5-5-1-4 .447-.224c.339-.17.553-.516.553-.895V30c0-.552-.448-1-1-1Zm-10.5-11v-3h2v3c0 3.866 3.134 7 7 7s7-3.134 7-7v-3h2v3c0 4.97-4.029 9-9 9s-9-4.03-9-9ZM13.688 12c-.076-.12-.154-.24-.232-.361-1.416-2.2-2.456-3.824-2.456-5.542 0-.8.52-1.474 1.209-2.007C14.769 2.107 24 1 24 1s9.231 1.107 11.791 3.088c.689.534 1.209 1.208 1.209 2.008 0 1.898-1.174 3.479-2.058 4.873H13.688ZM22 8c0-1.105.895-2 2-2s2 .895 2 2-1.105 2-2 2-2-.895-2-2Zm-7.979 6.41c.046-.238.263-.41.517-.41h18.923c.254 0 .471.173.517.41l.003.005.003.006.002.008.003.014a2.06 2.06 0 0 1 .01 0c.01.033.015.074.016.12.002.143-.01.337-.064.567-.109.463-.381 1.052-1.004 1.625C31.697 17.995 29.161 19 24 19s-7.697-1.005-8.931-2.14c-.623-.574-.895-1.163-1.004-1.626-.054-.23-.066-.424-.064-.567 0-.046.005-.087.016-.12a2.06 2.06 0 0 1 .01 0l.003-.014.002-.008.003-.006.002-.004Z" />
    </svg>
);

// Icon for the getaway car.
export const CarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
    </svg>
);

// Police car icon, used for the game over state. Includes a simple pulsing blue light for animation.
export const PoliceCarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        {/* Car Body (white) */}
        <path fill="#FFFFFF" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        {/* Red Light (left side) */}
        <path className="police-light-red" d="M8.5 2h3v2h-3z" />
        {/* Blue Light (right side) */}
        <path className="police-light-blue" d="M12.5 2h3v2h-3z" />
    </svg>
);

// Alarm box icon.
// The `disabled` prop conditionally renders a strike-through line to show it has been deactivated.
export const AlarmIcon: React.FC<{ className?: string, disabled?: boolean }> = ({ className, disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        {disabled && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" />}
    </svg>
);

// Camera control panel icon.
// Also uses the `disabled` prop to render a strike-through line.
export const CameraControlIcon: React.FC<{ className?: string, disabled?: boolean }> = ({ className, disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {/* Monitor Frame */}
        <rect x="3" y="3" width="18" height="14" rx="2" strokeWidth={2} />
        {/* Stand */}
        <path d="M8 21h8" strokeWidth={2} strokeLinecap="round" />
        <path d="M12 17v4" strokeWidth={2} />
        {/* Screen Content (Eye) */}
        {!disabled && <path d="M12 7c-2.5 0-4.5 1.5-5.5 3 1 1.5 3 3 5.5 3s4.5-1.5 5.5-3c-1-1.5-3-3-5.5-3z" strokeWidth={1.5} fill="none" />}
        {!disabled && <circle cx="12" cy="10" r="1" fill="currentColor" />}

        {disabled && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 19L19 5" className="text-red-500" />}
    </svg>
);

// Laser grid control panel icon.
// Also uses the `disabled` prop to render a strike-through line.
export const LaserPanelIcon: React.FC<{ className?: string, disabled?: boolean }> = ({ className, disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
        <circle cx="12" cy="12" r="3" className={disabled ? "fill-gray-500" : "fill-red-600"} stroke="none" />
        {!disabled && <circle cx="12" cy="12" r="6" stroke="red" strokeWidth={1} strokeDasharray="2 2" className="animate-pulse" />}
        {disabled && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" />}
    </svg>
);

// Pressure plate icon.
export const PressurePlateIcon: React.FC<{ className?: string, disabled?: boolean }> = ({ className, disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="5" y="5" width="14" height="14" rx="1" strokeWidth={2} className={disabled ? "stroke-gray-600" : "stroke-current"} />
        {!disabled && <circle cx="12" cy="12" r="2.5" className="fill-current" />}
    </svg>
);

// Pressure plate control panel icon.
export const PressurePlatePanelIcon: React.FC<{ className?: string, disabled?: boolean }> = ({ className, disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
        {/* Simplified shoe sole */}
        <path d="M12 8 C 10 8, 10 10, 10 12 L 10 15 C 10 17, 11 18, 12 18 C 13 18, 14 17, 14 15 L 14 12 C 14 10, 14 8, 12 8" strokeWidth={1.5} strokeLinecap="round" fill={disabled ? "none" : "currentColor"} className={disabled ? "text-gray-400" : "text-orange-500"} />
        <path d="M10 12 h4" strokeWidth={1} stroke="currentColor" />
        {disabled && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" />}
    </svg>
);

// NEW: Icon for hackable computer terminals.
export const ComputerTerminalIcon: React.FC<{ className?: string, disabled?: boolean }> = ({ className, disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        {disabled && (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 20L20 4" />
            </>
        )}
    </svg>
);

// --- Animation Icons for Active Interactions ---
// These are used during the execution phase to show an action is in progress.

// Animation icon for smashing actions. The `animate-ping` class creates an expanding ring effect.
export const SmashAnimationIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full text-yellow-400 animate-ping opacity-75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.451-1.451L12 18.75l1.938-.648a2.25 2.25 0 011.451-1.451L17.25 15l.648 1.938a2.25 2.25 0 011.451 1.451L21 18.75l-1.938.648a2.25 2.25 0 01-1.451 1.451z" />
    </svg>
);

// Animation icon for robbing actions. The `animate-pulse` class creates a gentle fading effect.
export const RobAnimationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full text-green-400 animate-pulse ${className}`}
    >
        <path
            d="M12 3V9M12 3L9.5 5.5M12 3L14.5 5.5M5.82333 9.00037C6.2383 9.36683 6.5 9.90285 6.5 10.5C6.5 11.6046 5.60457 12.5 4.5 12.5C3.90285 12.5 3.36683 12.2383 3.00037 11.8233M5.82333 9.00037C5.94144 9 6.06676 9 6.2 9H8M5.82333 9.00037C4.94852 9.00308 4.46895 9.02593 4.09202 9.21799C3.71569 9.40973 3.40973 9.71569 3.21799 10.092C3.02593 10.469 3.00308 10.9485 3.00037 11.8233M3.00037 11.8233C3 11.9414 3 12.0668 3 12.2V17.8C3 17.9332 3 18.0586 3.00037 18.1767M3.00037 18.1767C3.36683 17.7617 3.90285 17.5 4.5 17.5C5.60457 17.5 6.5 18.3954 6.5 19.5C6.5 20.0971 6.2383 20.6332 5.82333 20.9996M3.00037 18.1767C3.00308 19.0515 3.02593 19.5311 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.46895 20.9741 4.94852 20.9969 5.82333 20.9996M5.82333 20.9996C5.94144 21 6.06676 21 6.2 21H17.8C17.9332 21 18.0586 21 18.1767 20.9996M21 18.1771C20.6335 17.7619 20.0973 17.5 19.5 17.5C18.3954 17.5 17.5 18.3954 17.5 19.5C17.5 20.0971 17.7617 20.6332 18.1767 20.9996M21 18.1771C21.0004 18.0589 21 17.9334 21 17.8V12.2C21 12.0668 21 11.9414 20.9996 11.8233M21 18.1771C20.9973 19.0516 20.974 19.5311 20.782 19.908C20.5903 20.2843 20.2843 20.5903 19.908 20.782C19.5311 20.9741 19.0515 20.9969 18.1767 20.9996M20.9996 11.8233C20.6332 12.2383 20.0971 12.5 19.5 12.5C18.3954 12.5 17.5 11.6046 17.5 10.5C17.5 9.90285 17.7617 9.36683 18.1767 9.00037M20.9996 11.8233C20.9969 10.9485 20.9741 10.469 20.782 10.092C20.5903 9.71569 20.2843 9.40973 19.908 9.21799C19.5311 9.02593 19.0515 9.00308 18.1767 9.00037M18.1767 9.00037C18.0586 9 17.9332 9 17.8 9H16M14 15C14 16.1046 13.1046 17 12 17C10.8954 17 10 16.1046 10 15C10 13.8954 10.8954 13 12 13C13.1046 13 14 13.8954 14 15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Animation icon for technical actions like lockpicking or disabling electronics. The `animate-spin` class creates a rotating effect.
export const LockpickAnimationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} text-cyan-400 animate-spin`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
);

// New static icon based on the lockpick animation for locked doors.
// FIX: Add style prop to allow for inline styling like filters.
export const StaticLockpickIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
);

// Animation icon for the distraction action.
export const DistractionAnimationIcon: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-gray-400 animate-ping opacity-75"></div>
    </div>
);

// NEW: Icon for wait action
export const HourglassIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 1920 1920" fill="currentColor">
        <path d="M1072.588 960c0 167.266 96.226 245.308 189.29 320.64 116.555 94.532 247.793 200.922 261.346 526.419H396.07c13.553-325.497 144.79-431.887 261.345-526.419 93.064-75.332 189.29-153.374 189.29-320.64s-96.226-245.308-189.29-320.64C540.86 544.828 409.623 438.438 396.07 112.941h1127.153c-13.553 325.497-144.791 431.887-261.346 526.419-93.064 75.332-189.29 153.374-189.29 320.64m260.443-232.998c135.529-109.891 304.263-246.663 304.263-670.531V0H282v56.47c0 423.869 168.734 560.64 304.264 670.532 88.771 72.057 147.5 119.605 147.5 232.998 0 113.393-58.729 160.941-147.5 232.998C450.734 1302.889 282 1439.66 282 1863.529V1920h1355.294v-56.47c0-423.869-168.734-560.64-304.263-670.532-88.772-72.057-147.502-119.605-147.502-232.998 0-113.393 58.73-160.941 147.502-232.998M933.84 1274.665l-169.638 137.676c-74.315 60.197-138.353 112.037-172.687 225.317h736.264c-34.334-113.28-98.372-165.12-172.687-225.317l-169.638-137.676c-15.021-12.197-36.593-12.197-51.614 0" fillRule="evenodd" />
    </svg>
);

export const WaitAnimationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <HourglassIcon className={`${className} tic-toc`} />
);


// Icon representing an open door.
export const DoorOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 494.239 494.238" className={className}>
        <g>
            <path d="M199.725,0v36.025H85.211v421.66l114.514,0.094v36.459l209.085-37.555l0.216-418.867L199.725,0z M234.404,230.574 c7.022,0,12.715,7.408,12.715,16.545c0,9.139-5.692,16.545-12.715,16.545s-12.715-7.406-12.715-16.545 C221.688,237.982,227.382,230.574,234.404,230.574z M119.211,423.713V70.025h80.514v353.753L119.211,423.713z"></path>
        </g>
    </svg>
);

// Icon representing a closed door.
export const DoorClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" viewBox="0 0 479 479" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M71.553,0v478.085l335.561,0.581V0H71.553z M103.109,446.583V31.558h272.445v56.813h-10.781V42.086H113.893v394.468 h250.881V390.27h10.781v56.785L103.109,446.583z M364.773,137.459h10.781V341.18h-10.781V137.459z M165.787,239.32 c0,9.148-7.418,16.566-16.568,16.566c-9.15,0-16.568-7.418-16.568-16.566c0-9.15,7.418-16.568,16.568-16.568 C158.369,222.752,165.787,230.17,165.787,239.32z" />
    </svg>
);


// Icons for camera orientation selection in the map editor.
export const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);

export const ArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

// Icon for a piece of art (e.g., a painting).
export const ArtPieceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 15 15" fill="currentColor">
        <path d="M10.71,4L7.85,1.15C7.6555,0.9539,7.339,0.9526,7.1429,1.1471C7.1419,1.1481,7.141,1.149,7.14,1.15L4.29,4H1.5 C1.2239,4,1,4.2239,1,4.5v9C1,13.7761,1.2239,14,1.5,14h12c0.2761,0,0.5-0.2239,0.5-0.5v-9C14,4.2239,13.7761,4,13.5,4H10.71z M7.5,2.21L9.29,4H5.71L7.5,2.21z M13,13H2V5h11V13z M5,8C4.4477,8,4,7.5523,4,7s0.4477-1,1-1s1,0.4477,1,1S5.5523,8,5,8z M12,12 H4.5L6,9l1.25,2.5L9.5,7L12,12z" />
    </svg>
);

// Icon for a stack of gold bars.
export const GoldBarsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 8h16v2H4zM5 11h14v2H5zM6 14h12v2H6z" />
        <path opacity=".6" d="M3 7.5l1-1.5h16l1 1.5zM3.5 10.5l1-1.5h15l1 1.5zM4.5 13.5l1-1.5h13l1 1.5z" />
    </svg>
);

// Icon for a simple cabinet.
export const CabinetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M24 1.25h-16c-1.518 0.002-2.748 1.232-2.75 2.75v24c0.002 1.518 1.232 2.748 2.75 2.75h16c1.518-0.002 2.748-1.232 2.75-2.75v-24c-0.002-1.518-1.232-2.748-2.75-2.75h-0zM8 2.75h16c0.69 0.001 1.249 0.56 1.25 1.25v11.25h-18.5v-11.25c0.001-0.69 0.56-1.249 1.25-1.25h-0zM24 29.25h-16c-0.69-0.001-1.249-0.56-1.25-1.25v-11.25h18.5v11.25c-0.001 0.69-0.56 1.249-1.25 1.25h-0zM12.5 10.714c0.414-0 0.75-0.336 0.75-0.75v0-1.178h5.5v1.178c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-1.928c-0-0.414-0.336-0.75-0.75-0.75h-7c-0.414 0-0.75 0.336-0.75 0.75v0 1.928c0 0.414 0.336 0.75 0.75 0.75v0zM19.5 21.285h-7c-0.414 0-0.75 0.336-0.75 0.75v0 1.93c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-1.18h5.5v1.18c0 0.414 0.336 0.75 0.75 0.75s0.75-0.336 0.75-0.75v0-1.93c-0-0.414-0.336-0.75-0.75-0.75v0z"></path>
    </svg>
);

export const CabinetOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        {/* Main frame */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
        {/* Closed drawer */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 16h14" />
        {/* Ajar drawer */}
        <g transform="skewY(-5) translate(0, 1)">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h14" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h1" />
        </g>
    </svg>
);

// Icon for money, used in the map editor to set treasure values.
export const MoneyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0c-1.657 0-3-.895-3-2s1.343-2 3-2 3-.895 3-2-1.343-2-3-2m0 0c-1.11 0-2.08-.402-2.599-1M12 8V7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
    </svg>
);

// Icon to indicate that background music is currently playing.
export const MusicOnIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

// Icon to indicate that background music is muted.
export const MusicOffIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l-4-4m0 4l4-4" />
    </svg>
);

// Icon for the "Undo" button.
export const UndoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8A5 5 0 009 5H7" />
    </svg>
);

// NEW: Icon for the eraser tool in the map editor.
export const EraserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25l-2.25 2.25-2.25-2.25-2.25 2.25-2.25-2.25-2.25 2.25-2.25-2.25-2.25 2.25V9.75l2.25-2.25 2.25 2.25 2.25-2.25 2.25 2.25 2.25-2.25 2.25 2.25 2.25-2.25v4.5zM19.5 9.75v-3a1.5 1.5 0 00-1.5-1.5h-12a1.5 1.5 0 00-1.5 1.5v3" />
    </svg>
);


// Icon for a locked scenario.
export const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-3.75 5.25a3.75 3.75 0 017.5 0v3h-7.5v-3z" clipRule="evenodd" />
    </svg>
);

// Icon for unconscious characters, featuring animated spinning stars.
export const DizzyStarsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative w-full h-full ${className}`}>
        {/* Star 1 */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="none" className="w-4 h-4 text-yellow-300 absolute top-0 left-1/2 dizzy-star">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        {/* Star 2 */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="none" className="w-3 h-3 text-yellow-300 absolute top-1/2 left-0 dizzy-star" style={{ animationDelay: '0.5s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        {/* Star 3 */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="none" className="w-4 h-4 text-yellow-300 absolute top-1/2 right-0 dizzy-star" style={{ animationDelay: '1s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    </div>
);

// Icon for Reputation Points.
export const ReputationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

// NEW: Icons for primary/secondary targets
// FIX: Add style prop to PrimaryTargetIcon to resolve TypeScript error.
export const PrimaryTargetIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

// FIX: Add style prop to SecondaryTargetIcon to resolve TypeScript error.
export const SecondaryTargetIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);


// Icon for a desk (matching user-provided sketch: thick top, left leg, right drawer unit).
export const DeskIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        {/* Tabletop */}
        <path d="M1 6h22v2.5H1V6z" />
        {/* Left leg */}
        <path d="M3 8.5h1.5V20H3V8.5z" />
        {/* Right drawer unit */}
        <path d="M14 8.5h9V20h-9V8.5z" />
        {/* Drawer separations & handles (using background color/white for visibility) */}
        <path fill="white" opacity="0.4" d="M14 12.5h9v0.5h-9v-0.5z M14 16.5h9v0.5h-9v-0.5z" />
        <ellipse cx="18.5" cy="10.5" rx="1.5" ry="0.6" fill="white" />
        <ellipse cx="18.5" cy="14.5" rx="1.5" ry="0.6" fill="white" />
        <ellipse cx="18.5" cy="18.5" rx="1.5" ry="0.6" fill="white" />
    </svg>
);

// Icon for a column (top-down view).
export const ColumnIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r={6} />
    </svg>
);

// --- NEW FURNITURE ICONS ---

// Icon for a potted plant.
export const PlantIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M5.859,8.341a5.876,5.876,0,0,0,5.283.117A9,9,0,0,0,11,10v2H6a1,1,0,0,0-1,1v3a1,1,0,0,0,1,1H7v5a1,1,0,0,0,1,1h8a1,1,0,0,0,1-1V17h1a1,1,0,0,0,1-1V13a1,1,0,0,0-1-1H13V10a7.008,7.008,0,0,1,7-7,1,1,0,0,0,0-2,8.993,8.993,0,0,0-7.642,4.27C11.415,3.55,9.155,1,4,1A1,1,0,0,0,3,2C3,2.187,3.033,6.594,5.859,8.341ZM15,21H9V17h6Zm2-6H7V14H17ZM10.756,6.471c-1.635.677-2.924.736-3.841.172-1.154-.711-1.646-2.383-1.826-3.6C8.8,3.375,10.238,5.366,10.756,6.471Z" />
    </svg>
);

// Icon for a sculpture/statue.
export const SculptureIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 299 299">
        <path d="M220.871,158.855l-48.058-12.013v-5.751c4.737-3.676,9.169-8.444,13.143-14.249c1.199-1.749,2.322-3.563,3.38-5.415
	c4.525,3.402,10.145,5.419,16.227,5.419c14.925,0,27.066-12.142,27.066-27.064c0-7.075-2.732-13.522-7.191-18.349
	c3.27-4.474,5.207-9.98,5.207-15.935c0-12.988-9.199-23.866-21.422-26.47c0.05-0.672,0.084-1.353,0.084-2.039
	c0-14.924-12.142-27.065-27.064-27.065c-3.795,0-7.409,0.788-10.689,2.204C166.699,4.826,158.403,0,148.996,0
	c-9.406,0-17.704,4.826-22.556,12.129c-3.282-1.416-6.895-2.204-10.689-2.204c-14.925,0-27.066,12.142-27.066,27.065
	c0,0.687,0.034,1.367,0.086,2.039c-12.224,2.604-21.422,13.481-21.422,26.47c0,5.692,1.771,10.976,4.782,15.339
	c-4.795,4.885-7.76,11.574-7.76,18.944c0,14.923,12.142,27.064,27.066,27.064c6.398,0,12.276-2.235,16.915-5.96
	c1.146,2.04,2.368,4.035,3.685,5.956c3.975,5.805,8.405,10.573,13.141,14.249v5.751L77.12,158.855
	c-2.778,0.696-5.123,2.559-6.429,5.11c-1.305,2.552-1.443,5.542-0.378,8.204l27.787,69.469c1.508,3.768,5.157,6.238,9.215,6.238
	h31.757v29.275h-22.826c-5.48,0-9.924,4.443-9.924,9.924c0,5.48,4.443,9.924,9.924,9.924h65.499c5.48,0,9.924-4.443,9.924-9.924
	c0-5.48-4.443-9.924-9.924-9.924H158.92v-29.275h31.758c4.059,0,7.707-2.471,9.215-6.238l27.787-69.469
	c1.063-2.662,0.927-5.652-0.38-8.204C225.996,161.414,223.651,159.552,220.871,158.855z M205.563,106.999
	c-3.979,0-7.217-3.238-7.217-7.217c0-3.98,3.238-7.217,7.217-7.217c3.981,0,7.218,3.237,7.218,7.217
	C212.78,103.761,209.544,106.999,205.563,106.999z M203.578,72.716c-3.979,0-7.217-3.237-7.217-7.217
	c0-3.979,3.238-7.217,7.217-7.217c3.98,0,7.217,3.238,7.217,7.217C210.795,69.479,207.558,72.716,203.578,72.716z M182.242,29.773
	c3.979,0,7.218,3.236,7.218,7.217c0,3.979-3.238,7.217-7.218,7.217c-3.98,0-7.217-3.237-7.217-7.217
	C175.025,33.01,178.262,29.773,182.242,29.773z M148.996,19.85c3.98,0,7.217,3.236,7.217,7.216s-3.236,7.218-7.217,7.218
	c-3.979,0-7.218-3.238-7.218-7.218S145.017,19.85,148.996,19.85z M115.751,29.773c3.979,0,7.217,3.236,7.217,7.217
	c0,3.979-3.238,7.217-7.217,7.217s-7.217-3.237-7.217-7.217C108.534,33.01,111.772,29.773,115.751,29.773z M94.413,58.282
	c3.98,0,7.219,3.238,7.219,7.217c0,3.979-3.238,7.217-7.219,7.217c-3.979,0-7.217-3.237-7.217-7.217
	C87.196,61.521,90.435,58.282,94.413,58.282z M91.438,106.999c-3.981,0-7.218-3.238-7.218-7.217c0-3.98,3.236-7.217,7.218-7.217
	c3.979,0,7.217,3.237,7.217,7.217C98.654,103.761,95.416,106.999,91.438,106.999z M118.23,85.685
	c0-16.965,13.802-30.766,30.766-30.766c16.965,0,30.765,13.801,30.765,30.766c0,18.537-15.502,44.327-30.765,44.327
	C133.734,130.012,118.23,104.222,118.23,85.685z M183.959,228.029h-69.925l-21.071-52.676l44.547-11.136
	c4.418-1.105,7.517-5.074,7.517-9.628v-4.984c1.316,0.154,2.641,0.254,3.97,0.254c1.33,0,2.652-0.1,3.971-0.254v4.984
	c0,4.554,3.099,8.523,7.517,9.628l44.545,11.136L183.959,228.029z" />
    </svg>
);

// Icon for a bank teller counter (uses the updated Desk design).
export const TellerCounterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <DeskIcon className={className} />
);

// Icon for a sofa/armchair (exact user-provided SVG definition).
export const SofaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5.55556 18H18.4444C20.4081 18 22 16.4081 22 14.4444V12C22 10.8954 21.1046 10 20 10C18.8954 10 18 10.8954 18 12V13.2C18 13.6418 17.6418 14 17.2 14H6.8C6.35817 14 6 13.6418 6 13.2V12C6 10.8954 5.10457 10 4 10C2.89543 10 2 10.8954 2 12V14.4444C2 16.4081 3.59188 18 5.55556 18Z" stroke="currentColor" strokeWidth="1" />
        <path d="M20 10C20 9.07069 20 8.60603 19.9231 8.21964C19.6075 6.63288 18.3671 5.39249 16.7804 5.07686C16.394 5 15.9293 5 15 5H9C8.07069 5 7.60603 5 7.21964 5.07686C5.63288 5.39249 4.39249 6.63288 4.07686 8.21964C4 8.60603 4 9.07069 4 10" stroke="currentColor" strokeWidth="1" />
        <path d="M20 19V18M4 19V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Icon for a filing cabinet.
export const FilingCabinetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h14M5 16h14" />
        <circle cx="18" cy="7" r="1" fill="currentColor" />
        <circle cx="18" cy="13" r="1" fill="currentColor" />
    </svg>
);

// Icon for a water cooler.
export const WaterCoolerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM8 14h8v8H8v-8z" />
    </svg>
);

// Icon for a vending machine.
export const VendingMachineIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm2 2v8h8V4H8zm-1 9h10v2H7v-2zm0 3h10v2H7v-2z" />
    </svg>
);

// Icon for a velvet rope stanchion.
export const VelvetRopeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M4 12c3-4 6 4 9 0s6-4 9 0" />
    </svg>
);

// --- NEW DECORATION ICONS ---
export const LooIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" viewBox="-12.35 0 122.88 122.88" version="1.1" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M21.58,24.97c0-1.01,0.82-1.82,1.82-1.82c1.01,0,1.82,0.82,1.82,1.82v33.33c0,1.01-0.82,1.82-1.82,1.82H1.82 C0.82,60.13,0,59.31,0,58.31V3.92c0-1.07,0.44-2.05,1.15-2.77l0.01-0.01C1.88,0.44,2.85,0,3.93,0H21.3c1.07,0,2.06,0.44,2.77,1.16 l0,0c0.71,0.71,1.15,1.69,1.15,2.77v4.62c0,1.01-0.82,1.82-1.82,1.82c-1.01,0-1.82-0.82-1.82-1.82V3.92c0-0.07-0.03-0.14-0.08-0.2 l0,0l0,0c-0.05-0.05-0.12-0.08-0.2-0.08H3.93c-0.08,0-0.15,0.03-0.2,0.08L3.72,3.73c-0.05,0.05-0.08,0.12-0.08,0.2v52.56h17.94 V24.97L21.58,24.97z M21.57,99.88L0.21,59.15c-0.46-0.89-0.12-1.98,0.77-2.45c0.27-0.14,0.56-0.21,0.84-0.21v-0.01h94.53 c1.01,0,1.82,0.82,1.82,1.82c0,0.07,0,0.14-0.01,0.21c-0.51,21.74-11.17,27.86-20.14,33c-5.24,3.01-9.83,5.64-10.69,11.21 l-0.01,0.05c-0.33,2.18-0.15,4.68,0.54,7.51c0.72,2.95,1.99,6.27,3.84,9.96c0.45,0.9,0.08,1.99-0.82,2.44 c-0.26,0.13-0.54,0.19-0.81,0.19l-57.06,0c-1.01,0-1.82-0.82-1.82-1.82c0-0.35,0.1-0.68,0.28-0.96L21.57,99.88L21.57,99.88z M4.83,60.13l20.39,38.89c0.26,0.5,0.28,1.11,0.01,1.65l-9.28,18.57h51.24c-1.3-2.89-2.25-5.59-2.86-8.09 c-0.81-3.32-1.01-6.29-0.61-8.91l0.01-0.06c1.13-7.3,6.43-10.34,12.48-13.81c7.92-4.54,17.29-9.92,18.26-28.23H4.83L4.83,60.13z M23.61,101.68c-1.01,0-1.82-0.82-1.82-1.82c0-1.01,0.82-1.82,1.82-1.82H43.5c1.01,0,1.82,0.82,1.82,1.82 c0,1.01-0.82,1.82-1.82,1.82H23.61L23.61,101.68z M25.21,58.58c-0.15,0.99-1.08,1.68-2.07,1.53c-0.99-0.15-1.68-1.08-1.53-2.07 c0.29-1.88,0.76-3.58,1.42-5.07c0.69-1.55,1.58-2.86,2.67-3.93c3.54-3.46,8.04-3.38,12.34-3.3c0.38,0.01,0.75,0.01,1.72,0.01 l38.96,0c9.24-0.06,19.48-0.13,19.43,13c0,1-0.81,1.81-1.81,1.81s-1.81-0.81-1.81-1.81c0.04-9.48-8.28-9.42-15.78-9.37 c-1.13,0.01-1.1,0.02-1.77,0.02H39.77l-1.78-0.03c-3.56-0.06-7.29-0.13-9.75,2.28c-0.77,0.75-1.39,1.68-1.89,2.79 C25.83,55.6,25.45,56.98,25.21,58.58L25.21,58.58z M15.33,11.17c2.83,0,5.12,2.29,5.12,5.12c0,2.83-2.29,5.12-5.12,5.12 c-2.83,0-5.12-2.29-5.12-5.12C10.21,13.46,12.51,11.17,15.33,11.17L15.33,11.17z M20.45,18.11c-1.01,0-1.82-0.82-1.82-1.82 c0-1.01,0.82-1.82,1.82-1.82h12.28c1.01,0,1.82,0.82,1.82,1.82c0,1.01-0.82,1.82-1.82,1.82H20.45L20.45,18.11z" />
    </svg>
);

export const KitchenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" className="text-gray-400" />
        <circle cx="8" cy="8" r="2.5" className="text-cyan-600" />
        <circle cx="16" cy="8" r="2.5" className="text-cyan-600" />
        <circle cx="8" cy="16" r="2.5" className="text-cyan-600" />
        <circle cx="16" cy="16" r="2.5" className="text-cyan-600" />
    </svg>
);


export const BroomIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {/* Handle */}
        <line x1="12" y1="2" x2="12" y2="14" strokeLinecap="round" />
        {/* Bristles */}
        <path d="M8 14h8l1 8H7l1-8z" fill="currentColor" className="opacity-50" />
    </svg>
);

export const WindowIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
        <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
        <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="16" cy="8" r="1" fill="currentColor" opacity="0.3" />
    </svg>
);

export const WindowBrokenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
        <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
        {/* Crack lines */}
        <line x1="6" y1="6" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
        <line x1="14" y1="6" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6" y1="6" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
        <line x1="14" y1="6" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6" y1="18" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
        <line x1="14" y1="18" x2="18" y2="14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);


// --- NEW CONSUMABLE ITEM ICONS ---

export const SkeletonKeyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM9.5 8.5a1 1 0 112 0 1 1 0 01-2 0zm3.5 1a1 1 0 110-2 1 1 0 010 2z" />
        <path d="M11 14v8h2v-8h-2z" />
        <path d="M10 20h4v1h-4z" />
        <path d="M10 17h4v1h-4z" />
    </svg>
);

export const LoopedCameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" />
    </svg>
);

export const CameraLooperIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <CameraIcon className="w-full h-full opacity-70" />
        <LoopedCameraIcon className="absolute w-5 h-5" />
    </div>
);

export const FoamCanisterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 5V3h4v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0" />
    </svg>
);

export const FoamIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5,13c-0.2,0-0.4,0-0.6-0.1C18.8,11.5,17.2,11,15,11c-2.3,0-4,0.8-4.9,1.9c-0.3-0.1-0.5-0.1-0.8-0.1 c-1.5,0-2.8,0.6-3.8,1.5C5.1,14.2,4.6,14,4,14c-1.7,0-3,1.3-3,3s1.3,3,3,3h16.5c1.4,0,2.5-1.1,2.5-2.5S21.9,13,20.5,13z" />
    </svg>
);

export const GlassCutterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M12 20v2M22 12h-2M4 12H2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.5 15.5 5.5 5.5M3 21l7-7" />
    </svg>
);

export const ThermicLanceAnimationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-full h-full text-orange-400 ${className}`}>
        <g className="animate-[spin_1.5s_linear_infinite]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
        </g>
        <g className="animate-[ping_1.5s_ease-out_infinite]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
        </g>
    </svg>
);

export const DynamiteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 470 470" className={className}>
        <g>
            <path d="M408.23,346.461h-13.951c13.122-11.336,21.451-28.077,21.451-46.737c0-34.06-27.71-61.77-61.77-61.77h-17.465H133.514 c-31.53,0-57.593,23.736-61.308,54.27h-9.937c-4.142,0-7.5,3.358-7.5,7.5s3.358,7.5,7.5,7.5h9.937 c2.074,17.045,11.103,31.972,24.173,41.833c-5.616-1.681-11.56-2.596-17.716-2.596c-31.483,0-57.517,23.736-61.227,54.27H7.5 c-4.142,0-7.5,3.358-7.5,7.5s3.358,7.5,7.5,7.5h9.936C21.147,446.264,47.18,470,78.664,470c23.615,0,44.173-13.295,54.587-32.78 c10.402,19.485,30.936,32.78,54.523,32.78c0.019,0,220.456,0,220.456,0C442.29,470,470,442.29,470,408.23 S442.29,346.461,408.23,346.461z M408.23,455H228.056c13.144-11.336,21.488-28.091,21.488-46.769 c0-18.678-8.345-35.433-21.489-46.77h125.262c0.213,0.018,0.426,0.032,0.643,0.032c0.429,0,0.853-0.024,1.28-0.032h52.989 c25.789,0,46.77,20.981,46.77,46.77S434.019,455,408.23,455z M78.664,455c-23.2,0-42.495-17.035-46.09-39.27h46.162 c4.142,0,7.5-3.358,7.5-7.5s-3.358-7.5-7.5-7.5H32.574c3.595-22.235,22.89-39.27,46.09-39.27c23.271,0,42.625,17.035,46.231,39.27 h-8.356c-4.142,0-7.5,3.358-7.5,7.5s3.358,7.5,7.5,7.5h8.356C121.289,437.965,101.935,455,78.664,455z M133.504,292.224h-46.16 c3.6-22.234,22.923-39.268,46.157-39.27c25.797,0.005,46.773,20.984,46.773,46.77c0,25.353-20.282,46.044-45.471,46.737h-1.299 c-0.147,0-0.29,0.014-0.435,0.022c-23.041-0.212-42.148-17.163-45.726-39.259h46.16c4.142,0,7.5-3.358,7.5-7.5 S137.646,292.224,133.504,292.224z M400.73,299.724c0,25.359-20.292,46.055-45.49,46.737H187.784c-0.019,0-13.96,0-13.96,0 c13.122-11.336,21.451-28.077,21.451-46.737c0-18.678-8.345-35.433-21.488-46.77H353.96 C379.75,252.954,400.73,273.935,400.73,299.724z M187.774,400.73h-46.16c3.6-22.232,22.919-39.265,46.151-39.27 c25.804,0.005,46.78,20.984,46.78,46.77c0,25.782-20.971,46.759-46.751,46.769c-23.259-0.003-42.58-17.036-46.18-39.269h46.16 c4.142,0,7.5-3.358,7.5-7.5S191.916,400.73,187.774,400.73z M133.504,361.494c0.436,0,0.866-0.024,1.299-0.033h12.689 c-5.774,4.98-10.624,11.001-14.242,17.78c-4.264-7.978-10.225-14.919-17.406-20.333 C121.443,360.582,127.368,361.494,133.504,361.494z" />
            <path d="M141.004,215.454v-97.359h187.991v97.359c0,4.142,3.358,7.5,7.5,7.5s7.5-3.358,7.5-7.5V110.595c0-4.142-3.358-7.5-7.5-7.5 H242.5V75h-15v28.095h-93.996c-4.142,0-7.5,3.358-7.5,7.5v104.859c0,4.142,3.358,7.5,7.5,7.5S141.004,219.596,141.004,215.454z" />
            <path d="M163.504,148.095h142.991c4.142,0,7.5-3.358,7.5-7.5s-3.358-7.5-7.5-7.5H163.504c-4.142,0-7.5,3.358-7.5,7.5 S159.362,148.095,163.504,148.095z" />
            <path d="M250,75c4.142,0,7.5-3.358,7.5-7.5V45h24.144c12.407,0,22.5-10.094,22.5-22.5S294.051,0,281.644,0h-93.288 c-12.407,0-22.5,10.094,22.5,22.5s10.093,22.5,22.5,22.5H212.5v22.5c0,4.142,3.358,7.5,7.5,7.5h7.5h15H250z M180.856,22.5 c0-4.135,3.365-7.5,7.5-7.5h93.288c4.135,0,7.5,3.365,7.5,7.5s-3.365,7.5-7.5,7.5H250c-4.142,0-7.5,3.358-7.5,7.5V60h-15V37.5 c0-4.142-3.358-7.5-7.5-7.5h-31.644C184.221,30,180.856,26.635,180.856,22.5z" />
        </g>
    </svg>
);

export const PulsatingDynamiteIcon: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center">
        <DynamiteIcon className="w-8 h-8 text-red-500 animate-pulse" />
    </div>
);

export const JammedPanelIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <LaserPanelIcon className="w-full h-full opacity-70" />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l-8 8m0-8l8 8" />
        </svg>
    </div>
);

// FIX: Add LaserBeamIcon for Map Editor
export const LaserBeamIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M7.5 16.5l-3.75-3.75L7.5 9m9 7.5l3.75-3.75L16.5 9" />
    </svg>
);

// --- NEW ACTIVITY ICONS ---

const PanelManipulationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" viewBox="0 0 479 479" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M202.685,111.416c18.908-11.438,28.885-33.287,25.135-55.067l-4.03-23.403c-3.27-19.024-19.762-32.922-39.065-32.922 c-5.792,0-10.489,4.698-10.489,10.49v48.273c0,8.766-7.105,15.871-15.872,15.871h-36.51c-8.767,0-15.87-7.105-15.87-15.871V10.513 c0-5.792-4.697-10.49-10.491-10.49c-19.296,0-35.796,13.899-39.064,32.922l-4.031,23.403c-3.75,21.78,6.227,43.63,25.135,55.067 l20.624,12.478v229.323l-20.624,12.478c-18.908,11.438-28.885,33.288-25.135,55.068l4.031,23.403 c3.268,19.024,19.76,32.922,39.064,32.922c5.793,0,10.491-4.698,10.491-10.491v-48.273c0-8.767,7.104-15.872,15.87-15.872h36.51 c8.767,0,15.872,7.105,15.872,15.872v48.273c0,5.793,4.697,10.491,10.489,10.491c19.304,0,35.796-13.898,39.065-32.922l4.03-23.403 c3.75-21.78-6.227-43.629-25.135-55.068l-20.624-12.478V123.894L202.685,111.416z" />
        <path d="M409.568,233.702h-42.185V87.408c7.337-2.811,12.593-9.815,12.593-18.138V0h-56.984v69.269 c0,8.324,5.248,15.32,12.587,18.138v146.295h-42.187c-8.781,0-15.902,7.121-15.902,15.902c0,8.783,7.121,15.902,15.902,15.902 h3.517v175.15c0,20.118,16.314,36.432,36.432,36.432h39.795c20.118,0,36.432-16.314,36.432-36.432v-175.15 c8.781,0,15.902-7.119,15.902-15.902C425.471,240.823,418.35,233.702,409.568,233.702z M333.427,416.259 c0,4.395-3.556,7.951-7.951,7.951c-4.395,0-7.951-3.556-7.951-7.951V305.604c0-4.395,3.556-7.951,7.951-7.951 c4.395,0,7.951,3.556,7.951,7.951V416.259z M359.432,416.259c0,4.395-3.557,7.951-7.951,7.951c-4.395,0-7.951-3.556-7.951-7.951 v-69.494v-41.161c0-4.395,3.556-7.951,7.951-7.951c4.394,0,7.951,3.556,7.951,7.951v41.161V416.259z M385.435,416.259 c0,4.395-3.556,7.951-7.951,7.951c-4.395,0-7.951-3.556-7.951-7.951V305.604c0-4.395,3.556-7.951,7.951-7.951 c4.395,0,7.951,3.556,7.951,7.951V416.259z" />
    </svg>
);

export const PanelManipulationAnimationIcon: React.FC = () => (
    <PanelManipulationIcon className="w-full h-full text-green-400 animate-pulse" />
);

const InfiltratorWalkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M1.221 28.025l0-0h-0zM29.977 6.142c-0.645 0-1.167 0.523-1.167 1.167 0 0.131 0.022 0.256 0.061 0.373-1.668 0.652-1.334 3.814-1.096 6.786-0.935 0.84-2.005 0.732-2.951-0.51-0.118-3.108-0.909-7.165 0.579-8.373-0.013 0.071-0.021 0.143-0.021 0.218 0 0.645 0.523 1.167 1.167 1.167s1.167-0.523 1.167-1.167c0-0.645-0.523-1.167-1.167-1.167-0.447 0-0.836 0.252-1.032 0.621-2.31 0.365-1.593 4.532-1.376 7.961-0.11 1.808-0.538 3.444-1.185 4.836-0.501-3.708-2.678-7.067-4.693-8.758-3.902-3.274-9.376-2.96-13.18 0.429s-3.976 9.618-0.608 13.39c0.531 0.529 1.141 0.941 1.8 1.24-2.423 0.999-4.281 2.333-5.055 3.669h20.072c6.113 0 8.38-6.077 7.17-12.98-0.206-2.8-0.624-5.931 0.567-7.054 0.212 0.294 0.557 0.486 0.948 0.486 0.645 0 1.167-0.523 1.167-1.167s-0.523-1.167-1.167-1.167z" />
    </svg>
);

export const InfiltratorWalkAnimationIcon: React.FC = () => (
    <InfiltratorWalkIcon className="w-full h-full text-green-400 animate-pulse" />
);


// FIX: Add static icons for ActionIcon component
const HammerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg fill="currentColor" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M28.394 7.296l-4.254-0.64 1.241-1.64-5.146-3.928-1.308 1.728c-2.13-1.258-4.321-1.802-5.939-1.636l0 0.001c-0.231 0.022-0.45 0.078-0.656 0.129-0.646 0.162-1.148 0.459-1.465 0.877l5.412 4.129-1.207 1.595 1.017 0.776c-5.472 6.732-11.742 12.501-15.269 20.272l3.1 2.346c6.645-5.773 10.208-12.942 15.337-20.201l0.962 0.734 1.241-1.64 1.773 3.919 2.659 2.011c3.267-1.373 4.722-3.803 5.163-6.824l-2.659-2.012z"></path>
    </svg>
);

const RobIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 3V9M12 3L9.5 5.5M12 3L14.5 5.5M5.82333 9.00037C6.2383 9.36683 6.5 9.90285 6.5 10.5C6.5 11.6046 5.60457 12.5 4.5 12.5C3.90285 12.5 3.36683 12.2383 3.00037 11.8233M5.82333 9.00037C5.94144 9 6.06676 9 6.2 9H8M5.82333 9.00037C4.94852 9.00308 4.46895 9.02593 4.09202 9.21799C3.71569 9.40973 3.40973 9.71569 3.21799 10.092C3.02593 10.469 3.00308 10.9485 3.00037 11.8233M3.00037 11.8233C3 11.9414 3 12.0668 3 12.2V17.8C3 17.9332 3 18.0586 3.00037 18.1767M3.00037 18.1767C3.36683 17.7617 3.90285 17.5 4.5 17.5C5.60457 17.5 6.5 18.3954 6.5 19.5C6.5 20.0971 6.2383 20.6332 5.82333 20.9996M3.00037 18.1767C3.00308 19.0515 3.02593 19.5311 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.46895 20.9741 4.94852 20.9969 5.82333 20.9996M5.82333 20.9996C5.94144 21 6.06676 21 6.2 21H17.8C17.9332 21 18.0586 21 18.1767 20.9996M21 18.1771C20.6335 17.7619 20.0973 17.5 19.5 17.5C18.3954 17.5 17.5 18.3954 17.5 19.5C17.5 20.0971 17.7617 20.6332 18.1767 20.9996M21 18.1771C21.0004 18.0589 21 17.9334 21 17.8V12.2C21 12.0668 21 11.9414 20.9996 11.8233M21 18.1771C20.9973 19.0516 20.974 19.5311 20.782 19.908C20.5903 20.2843 20.2843 20.5903 19.908 20.782C19.5311 20.9741 19.0515 20.9969 18.1767 20.9996M20.9996 11.8233C20.6332 12.2383 20.0971 12.5 19.5 12.5C18.3954 12.5 17.5 11.6046 17.5 10.5C17.5 9.90285 17.7617 9.36683 18.1767 9.00037M20.9996 11.8233C20.9969 10.9485 20.9741 10.469 20.782 10.092C20.5903 9.71569 20.2843 9.40973 19.908 9.21799C19.5311 9.02593 19.0515 9.00308 18.1767 9.00037M18.1767 9.00037C18.0586 9 17.9332 9 17.8 9H16M14 15C14 16.1046 13.1046 17 12 17C10.8954 17 10 16.1046 10 15C10 13.8954 10.8954 13 12 13C13.1046 13 14 13.8954 14 15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const DistractionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <circle cx="12" cy="12" r="1" />
        <path strokeLinecap="round" d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" />
        <path strokeLinecap="round" d="M18.5 12a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z" />
    </svg>
);

const ThermicLanceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <g>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
        </g>
        <g>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
        </g>
    </svg>
);

const HandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M13.5001 3.75C13.9143 3.75 14.2501 4.08579 14.2501 4.5V7.5V12.75H15.7501V7.5C15.7501 7.08579 16.0858 6.75 16.5001 6.75C16.9143 6.75 17.2501 7.08579 17.2501 7.5V15C17.2501 17.8995 14.8996 20.25 12.0001 20.25V21.75C15.728 21.75 18.7501 18.7279 18.7501 15V7.5C18.7501 6.25736 17.7427 5.25 16.5001 5.25C16.2371 5.25 15.9846 5.29512 15.7501 5.37803V4.5C15.7501 3.25736 14.7427 2.25 13.5001 2.25C12.4625 2.25 11.5889 2.95235 11.3289 3.90757C11.0724 3.80589 10.7927 3.75 10.5001 3.75C9.25742 3.75 8.25006 4.75736 8.25006 6V12.5344L7.77377 11.5689L7.77221 11.5657C7.21726 10.4539 5.86607 10.0024 4.75422 10.5574C3.65214 11.1075 3.1989 12.4399 3.7315 13.546L5.03741 16.7808L5.06205 16.8354C6.16787 19.047 7.45919 20.2994 8.73651 20.9857C10.0096 21.6696 11.194 21.75 12.0001 21.75V20.25C11.3061 20.25 10.4069 20.1803 9.44641 19.6643C8.49439 19.1528 7.40758 18.1618 6.41695 16.191L5.11239 12.9597L5.08798 12.9055C4.903 12.5349 5.05349 12.0845 5.4241 11.8995C5.79428 11.7147 6.24405 11.8646 6.42944 12.2343L8.32743 16.0818L9.75004 15.75V14.25H9.75006V6C9.75006 5.58579 10.0858 5.25 10.5001 5.25C10.9143 5.25 11.2501 5.58579 11.2501 6V12.75H12.7501V6V4.5C12.7501 4.08579 13.0858 3.75 13.5001 3.75Z" />
    </svg>
);

const GreenHandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <HandIcon className={`${className} text-green-500`} />
);

const RedHandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <HandIcon className={`${className} text-red-500`} />
);

// Icon for pickpocket action - hand grabbing a key
export const PickpocketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Hand */}
        <path fillRule="evenodd" clipRule="evenodd" d="M13.5001 3.75C13.9143 3.75 14.2501 4.08579 14.2501 4.5V7.5V12.75H15.7501V7.5C15.7501 7.08579 16.0858 6.75 16.5001 6.75C16.9143 6.75 17.2501 7.08579 17.2501 7.5V15C17.2501 17.8995 14.8996 20.25 12.0001 20.25V21.75C15.728 21.75 18.7501 18.7279 18.7501 15V7.5C18.7501 6.25736 17.7427 5.25 16.5001 5.25C16.2371 5.25 15.9846 5.29512 15.7501 5.37803V4.5C15.7501 3.25736 14.7427 2.25 13.5001 2.25C12.4625 2.25 11.5889 2.95235 11.3289 3.90757C11.0724 3.80589 10.7927 3.75 10.5001 3.75C9.25742 3.75 8.25006 4.75736 8.25006 6V12.5344L7.77377 11.5689L7.77221 11.5657C7.21726 10.4539 5.86607 10.0024 4.75422 10.5574C3.65214 11.1075 3.1989 12.4399 3.7315 13.546L5.03741 16.7808L5.06205 16.8354C6.16787 19.047 7.45919 20.2994 8.73651 20.9857C10.0096 21.6696 11.194 21.75 12.0001 21.75V20.25C11.3061 20.25 10.4069 20.1803 9.44641 19.6643C8.49439 19.1528 7.40758 18.1618 6.41695 16.191L5.11239 12.9597L5.08798 12.9055C4.903 12.5349 5.05349 12.0845 5.4241 11.8995C5.79428 11.7147 6.24405 11.8646 6.42944 12.2343L8.32743 16.0818L9.75004 15.75V14.25H9.75006V6C9.75006 5.58579 10.0858 5.25 10.5001 5.25C10.9143 5.25 11.2501 5.58579 11.2501 6V12.75H12.7501V6V4.5C12.7501 4.08579 13.0858 3.75 13.5001 3.75Z" />
        {/* Key overlay */}
        <circle cx="18" cy="6" r="4" fill="#FFA500" opacity="0.9" />
        <rect x="17" y="3" width="2" height="6" fill="#FFA500" opacity="0.9" />
        <circle cx="18" cy="4.5" r="0.8" fill="#000" />
    </svg>
);

export const TicTocIcon: React.FC<{ className?: string }> = ({ className }) => {
    const [text, setText] = React.useState('TIC');

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setText(currentText => (currentText === 'TIC' ? 'TOC' : 'TIC'));
        }, 500); // Toggles every half a second
        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    return (
        <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
            <div className="absolute tic-toc bg-red-700 text-white text-[10px] rounded px-2 py-0.5 shadow-lg z-20 font-mono border-2 border-black">
                {text}
            </div>
        </div>
    );
};


// FIX: Add ActionIcon for ControlPanel
export const ActionIcon: React.FC<{ action: ActionType, className?: string }> = ({ action, className }) => {
    switch (action) {
        case 'unlock':
        case 'lockpick_case':
        case 'crack':
            return <StaticLockpickIcon className={className} />;
        case 'smash':
        case 'smash_door':

            return <HammerIcon className={`${className} text-red-500`} />;
        case 'disable':
            return <StaticLockpickIcon className={className} />;
        case 'rob':
            return <RobIcon className={className} />;
        case 'wait':
            return <HourglassIcon className={className} />;
        case 'disable_alarm':
            return <AlarmIcon className={className} />;
        case 'disable_cameras':
            return <CameraControlIcon className={className} />;
        case 'disable_lasers':
            return <LaserPanelIcon className={className} />;
        case 'disable_pressure_plates':
            return <PressurePlatePanelIcon className={className} />;
        case 'open_door':
        case 'open_cabinet':
            return <GreenHandIcon className={className} />;
        case 'close_door':
        case 'close_cabinet':
        case 'close_case':
        case 'close_safe':
            return <RedHandIcon className={className} />;
        case 'lock_door':
            return <StaticLockpickIcon className={`${className} text-red-500`} />;
        case 'distract':
            return <DistractionIcon className={className} />;
        case 'plant_dynamite':
            return <DynamiteIcon className={className} />;
        case 'hack':
            return <ComputerTerminalIcon className={className} />;
        case 'use_skeleton_key':
            return <SkeletonKeyIcon className={className} />;
        case 'use_camera_looper':
            return <CameraLooperIcon className={className} />;
        case 'use_foam_canister':
            return <FoamCanisterIcon className={className} />;
        case 'use_glass_cutter':
            return <GlassCutterIcon className={className} />;
        case 'use_thermic_lance':
            return <ThermicLanceIcon className={className} />;
        case 'use_laser_jammer_short':
        case 'use_laser_jammer_long':
            return <JammedPanelIcon className={className} />;
        case 'knockout':
            // No interaction animation for knockout - dizzy stars appear on guard after knockout
            return null;
        case 'pickpocket':
            return <PickpocketIcon className={className} />;
        case 'none':
        default:
            return null;
    }
};

// FIX: Fix SunIcon and add MoonIcon for App
export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);