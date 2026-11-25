import React, { useId } from 'react';

/**
 * The chat's robot mascot, drawn in SVG so it stays crisp at any size and picks up the
 * client's brand color (ear pods, antenna ball, body dot) from the chat root's CSS vars.
 * Both components are decorative (aria-hidden).
 *
 * Coordinates use a 280 x 320 box: ears span the full width, the antenna ball touches the top,
 * the floor shadow sits at the bottom.
 */

// Fallbacks keep the mascot on-brand-ish if it is ever rendered outside the themed chat root
const BRAND = 'var(--brand, #6D5BF0)';
const brandAlpha = (alpha: number) => `rgb(var(--brand-rgb, 109 91 240) / ${alpha})`;

const OUTLINE = '#E2DEF2';
const LAVENDER = '#DDD8F3';
const CYAN = '#5CD6F5';

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 320;

/** Per-instance SVG ids: several robots can be on one page, and useId's colons break url(#...). */
const useSvgIds = () => {
    const base = useId().replace(/:/g, '');
    return (name: string) => `robot-${base}-${name}`;
};

type IdFn = (name: string) => string;

interface RobotDefsProps {
    id: IdFn;
    withEffects: boolean;
}

const RobotDefs: React.FC<RobotDefsProps> = ({ id, withEffects }) => (
    <defs>
        {/* Glossy white shell: bright top-left, soft lavender toward the edges */}
        <radialGradient id={id('shell')} cx="35%" cy="25%" r="85%">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#FBFAFF" />
            <stop offset="1" stopColor="#E8E5F5" />
        </radialGradient>
        <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#ECE9F7" />
        </linearGradient>
        <linearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2B2843" />
            <stop offset="1" stopColor="#15131F" />
        </linearGradient>
        <linearGradient id={id('eye')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A8EEFF" />
            <stop offset="1" stopColor="#3FC3EE" />
        </linearGradient>
        <linearGradient id={id('ear')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: brandAlpha(0.7) }} />
            <stop offset="1" style={{ stopColor: BRAND }} />
        </linearGradient>
        <radialGradient id={id('ball')} cx="38%" cy="32%" r="70%">
            <stop offset="0" style={{ stopColor: brandAlpha(0.6) }} />
            <stop offset="1" style={{ stopColor: BRAND }} />
        </radialGradient>
        <linearGradient id={id('badge')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#36C977" />
            <stop offset="1" stopColor="#1F9A52" />
        </linearGradient>
        {withEffects && (
            <>
                <filter id={id('glow')} x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
                <filter id={id('lift')} x="-20%" y="-20%" width="140%" height="150%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#4B3FA0" floodOpacity="0.14" />
                </filter>
            </>
        )}
    </defs>
);

interface RobotHeadProps {
    id: IdFn;
    /** Full detail (smile, cheeks, visor streak, eye glow) — off for the tiny avatar. */
    detailed: boolean;
    strokeWidth: number;
}

const EYE_CENTERS = [104, 176];

/** Antenna, ear pods, head shell and visor face. Spans y 1 → 219 of the 280-wide box. */
const RobotHead: React.FC<RobotHeadProps> = ({ id, detailed, strokeWidth }) => (
    <g>
        {/* Antenna stem (the head covers its base) */}
        <line x1="140" y1="36" x2="140" y2="12" stroke={LAVENDER} strokeWidth="4.5" strokeLinecap="round" />

        {/* Ear pods: white capsule with a brand-colored inner pill */}
        {[1, 245].map((x) => (
            <rect key={`ear-${x}`} x={x} y="98" width="34" height="56" rx="17" fill={`url(#${id('shell')})`} stroke={OUTLINE} strokeWidth={strokeWidth} />
        ))}
        {[10.5, 254.5].map((x) => (
            <rect key={`ear-in-${x}`} x={x} y="110" width="15" height="32" rx="7.5" fill={`url(#${id('ear')})`} />
        ))}

        {/* Head shell */}
        <rect
            x="31.5"
            y="31"
            width="217"
            height="188"
            rx="86"
            ry="82"
            fill={`url(#${id('shell')})`}
            stroke={OUTLINE}
            strokeWidth={strokeWidth}
            filter={detailed ? `url(#${id('lift')})` : undefined}
        />

        {/* Antenna base + ball */}
        <ellipse cx="140" cy="33" rx="10" ry="4" fill={LAVENDER} />
        <circle cx="140" cy="10" r="9" fill={`url(#${id('ball')})`} />
        <circle cx="137" cy="7" r="2.6" fill="#FFFFFF" opacity="0.85" />

        {/* Visor */}
        <rect x="56" y="72" width="168" height="105" rx="50" fill={`url(#${id('visor')})`} />
        {detailed && (
            <>
                <rect x="56.75" y="72.75" width="166.5" height="103.5" rx="49.25" fill="none" stroke="#FFFFFF" strokeOpacity="0.07" strokeWidth="1.5" />
                {/* Light streak across the top-left of the visor */}
                <path d="M 82 87 Q 112 76 152 78" fill="none" stroke="#FFFFFF" strokeOpacity="0.26" strokeWidth="4" strokeLinecap="round" />
                {/* Soft cyan glow behind the eyes and smile */}
                <g filter={`url(#${id('glow')})`} opacity="0.7">
                    {EYE_CENTERS.map((cx) => (
                        <rect key={`glow-${cx}`} x={cx - 12.5} y="106" width="25" height="36" rx="12.5" fill={CYAN} />
                    ))}
                    <path d="M 128 156 Q 140 165 152 156" fill="none" stroke={CYAN} strokeWidth="4.5" strokeLinecap="round" />
                </g>
            </>
        )}

        {/* Eyes with a small catch-light */}
        {EYE_CENTERS.map((cx) => (
            <g key={`eye-${cx}`}>
                <rect x={cx - 12.5} y="106" width="25" height="36" rx="12.5" fill={`url(#${id('eye')})`} />
                <circle cx={cx - 4} cy="115" r="3.6" fill="#FFFFFF" opacity="0.9" />
            </g>
        ))}

        {detailed && (
            <>
                {/* Smile */}
                <path d="M 128 156 Q 140 165 152 156" fill="none" stroke={CYAN} strokeWidth="4.5" strokeLinecap="round" />
                {/* Cheeks */}
                <ellipse cx="72" cy="196" rx="12" ry="5.5" fill="#F6A5B9" opacity="0.75" />
                <ellipse cx="208" cy="196" rx="12" ry="5.5" fill="#F6A5B9" opacity="0.75" />
            </>
        )}
    </g>
);

export interface RobotMascotProps {
    /** Rendered width in px (height follows the 280:320 shape). Default 200. */
    size?: number;
    /** "check" adds a green success badge at the lower-right of the head. */
    badge?: 'check' | null;
    /** Gentle floating motion (skipped when the visitor prefers reduced motion). Default true. */
    animated?: boolean;
    className?: string;
}

/** Full-body robot for the welcome and booking-confirmed screens. */
export const RobotMascot: React.FC<RobotMascotProps> = ({ size = 200, badge = null, animated = true, className }) => {
    const id = useSvgIds();
    const height = Math.round((size * VIEW_HEIGHT) / VIEW_WIDTH);

    return (
        <svg
            width={size}
            height={height}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            className={className}
        >
            <RobotDefs id={id} withEffects />

            {/* Floor shadow stays put while the robot floats */}
            <ellipse cx="140" cy="309" rx="78" ry="8" style={{ fill: brandAlpha(0.14) }} />

            <g className={animated ? 'motion-safe:animate-mascot-bob' : undefined}>
                {/* Arms */}
                <rect x="30" y="231" width="28" height="50" rx="14" transform="rotate(14 44 256)" fill={`url(#${id('body')})`} stroke={OUTLINE} strokeWidth="1.5" />
                <rect x="222" y="231" width="28" height="50" rx="14" transform="rotate(-14 236 256)" fill={`url(#${id('body')})`} stroke={OUTLINE} strokeWidth="1.5" />

                {/* Neck */}
                <rect x="121" y="214" width="38" height="16" rx="5" fill={LAVENDER} />

                {/* Body with brand dot */}
                <rect x="70" y="228" width="140" height="64" rx="32" fill={`url(#${id('body')})`} stroke={OUTLINE} strokeWidth="1.5" />
                <circle cx="140" cy="260" r="11" fill={`url(#${id('ball')})`} />
                <circle cx="136.5" cy="256.5" r="3" fill="#FFFFFF" opacity="0.8" />

                <RobotHead id={id} detailed strokeWidth={1.5} />

                {badge === 'check' && (
                    <g transform="translate(230 206)" filter={`url(#${id('lift')})`}>
                        <circle r="40" fill={`url(#${id('badge')})`} stroke="#FFFFFF" strokeWidth="6" />
                        <path d="M -16 1 L -5 12 L 17 -11" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                )}
            </g>
        </svg>
    );
};

export interface RobotAvatarProps {
    /** Rendered width and height in px. Default 32. */
    size?: number;
    className?: string;
}

/** Head-only robot shown beside bot messages and the typing indicator. */
export const RobotAvatar: React.FC<RobotAvatarProps> = ({ size = 32, className }) => {
    const id = useSvgIds();

    return (
        <svg
            width={size}
            height={size}
            // Square crop centred on the head (antenna ball to chin)
            viewBox="0 -30 280 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            className={className}
        >
            <RobotDefs id={id} withEffects={false} />
            {/* Thicker outline so the white shell still separates from the light page at 32px */}
            <RobotHead id={id} detailed={false} strokeWidth={7} />
        </svg>
    );
};

export default RobotMascot;
