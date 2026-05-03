import * as React from 'react';

export interface IsoSpriteProps {
    topColor: string;
    leftColor: string;
    rightColor: string;
    thickness: number; // The Z-height extrusion
    isoWidth?: number; // Base width of the tile (e.g. 40 or 80)
    isoHeight?: number; // Base height of the tile (e.g. 20 or 40)
    scale?: number; // Optional scaling for objects smaller than a full tile
    offsetX?: number;
    offsetY?: number;
    className?: string;
    showBorders?: boolean;
    opacity?: number;
    /** Optional SVG pattern/detail to render on top face */
    topPattern?: React.ReactNode;
    /** Optional SVG detail to render on left face */
    leftDetail?: React.ReactNode;
    /** Optional SVG detail to render on right face */
    rightDetail?: React.ReactNode;
    /** Use gradient shading for more realistic look */
    useGradient?: boolean;
    /** Unique ID for gradient defs (must be unique per instance if using gradients) */
    gradientId?: string;
    /** Top highlight color for gradient effect */
    topHighlight?: string;
    /** Border/edge color override */
    edgeColor?: string;
    /** Edge stroke width */
    edgeWidth?: number;
}

export const IsoSprite: React.FC<IsoSpriteProps> = ({
    topColor,
    leftColor,
    rightColor,
    thickness,
    isoWidth = 80,
    isoHeight = 40,
    scale = 1.0,
    offsetX = 0,
    offsetY = 0,
    className = '',
    showBorders = true,
    opacity,
    topPattern,
    leftDetail,
    rightDetail,
    useGradient = false,
    gradientId,
    topHighlight,
    edgeColor,
    edgeWidth,
}) => {
    // Total geometric bounds of the SVG
    const svgWidth = isoWidth;
    const svgHeight = isoHeight + thickness;

    const hw = isoWidth / 2;
    const hh = isoHeight / 2;
    const z = thickness;

    // Apply scaling relative to the center of the base
    const scaledHW = hw * scale;
    const scaledHH = hh * scale;

    // Center coordinates (the center of the footprint diamond)
    const cx = hw + offsetX;
    const cy = svgHeight - hh + offsetY;

    // Base coordinates
    const baseTopX = cx;
    const baseTopY = cy - scaledHH;
    const baseRightX = cx + scaledHW;
    const baseRightY = cy;
    const baseBottomX = cx;
    const baseBottomY = cy + scaledHH;
    const baseLeftX = cx - scaledHW;
    const baseLeftY = cy;

    // Extruded (Top) coordinates
    const topTopX = baseTopX;
    const topTopY = baseTopY - z;
    const topRightX = baseRightX;
    const topRightY = baseRightY - z;
    const topBottomX = baseBottomX;
    const topBottomY = baseBottomY - z;
    const topLeftX = baseLeftX;
    const topLeftY = baseLeftY - z;

    // Polygons
    const topFace = `${topTopX},${topTopY} ${topRightX},${topRightY} ${topBottomX},${topBottomY} ${topLeftX},${topLeftY}`;
    const leftFace = `${topLeftX},${topLeftY} ${topBottomX},${topBottomY} ${baseBottomX},${baseBottomY} ${baseLeftX},${baseLeftY}`;
    const rightFace = `${topBottomX},${topBottomY} ${topRightX},${topRightY} ${baseRightX},${baseRightY} ${baseBottomX},${baseBottomY}`;

    const strokeColor = edgeColor || (showBorders ? 'rgba(0,0,0,0.35)' : 'none');
    const strokeW = edgeWidth ?? (showBorders ? 0.8 : 0);

    const strokeProps = {
        stroke: strokeColor,
        strokeWidth: strokeW,
        strokeLinejoin: 'round' as const,
    };

    const gId = gradientId || `iso-${Math.random().toString(36).substr(2, 6)}`;

    return (
        <svg 
            className={`absolute pointer-events-none ${className}`} 
            style={{ width: `${svgWidth}px`, height: `${svgHeight}px`, bottom: 0, left: 0, opacity }}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {useGradient && (
                <defs>
                    <linearGradient id={`${gId}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={topHighlight || topColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={topColor} stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id={`${gId}-left`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={leftColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={leftColor} stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id={`${gId}-right`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={rightColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={rightColor} stopOpacity="0.75" />
                    </linearGradient>
                </defs>
            )}

            {/* Left Face */}
            <polygon 
                points={leftFace} 
                fill={useGradient ? `url(#${gId}-left)` : leftColor} 
                {...strokeProps} 
            />
            {leftDetail && (
                <g clipPath={`polygon(${leftFace})`}>
                    {leftDetail}
                </g>
            )}

            {/* Right Face */}
            <polygon 
                points={rightFace} 
                fill={useGradient ? `url(#${gId}-right)` : rightColor} 
                {...strokeProps} 
            />
            {rightDetail && (
                <g clipPath={`polygon(${rightFace})`}>
                    {rightDetail}
                </g>
            )}

            {/* Top Face */}
            <polygon 
                points={topFace} 
                fill={useGradient ? `url(#${gId}-top)` : topColor} 
                {...strokeProps} 
            />
            {topPattern && (
                <g clipPath={`polygon(${topFace})`}>
                    {topPattern}
                </g>
            )}

            {/* Subtle top edge highlight */}
            {useGradient && (
                <line 
                    x1={topLeftX} y1={topLeftY} 
                    x2={topTopX} y2={topTopY}
                    stroke="rgba(255,255,255,0.25)" 
                    strokeWidth="1" 
                />
            )}
        </svg>
    );
};
