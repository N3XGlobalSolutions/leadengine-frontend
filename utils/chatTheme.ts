import type { CSSProperties } from 'react';

/**
 * Brand theme for the visitor chat. Each client's primary color (hex or a named color like
 * "blue") becomes a set of CSS custom properties on the chat root. The Tailwind tokens
 * `brand`, `brand-ink`, `brand-soft`, `brand-border`, `brand-on`, `bg-brand-grad` and `bg-chat-bg`
 * (see tailwind.config.cjs) read these, so chat components never handle raw colors.
 */

const NAMED_COLORS: Record<string, string> = {
    blue: '#2563EB',
    indigo: '#4F46E5',
    violet: '#7C3AED',
    purple: '#7C3AED',
    green: '#16A34A',
    emerald: '#059669',
    teal: '#0D9488',
    cyan: '#0891B2',
    sky: '#0284C7',
    red: '#DC2626',
    rose: '#E11D48',
    pink: '#DB2777',
    orange: '#EA580C',
    amber: '#D97706',
    black: '#18181B',
    slate: '#334155',
    gray: '#4B5563',
};

export const DEFAULT_BRAND_COLOR = '#4F46E5';

type RGB = [number, number, number];

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

const parseHex = (value: string): RGB | null => {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
    if (!match) return null;
    let hex = match[1];
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const toHex = (rgb: RGB): string =>
    '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** Linear blend: t = 0 gives `a`, t = 1 gives `b`. */
const mix = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];

const luminance = (rgb: RGB): number => {
    const [r, g, b] = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: RGB, b: RGB): number => {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** A hex color for any configured value: hex as-is, known names mapped, anything else the default. */
export const resolveBrandColor = (color?: string | null): string => {
    if (!color) return DEFAULT_BRAND_COLOR;
    const value = color.trim();
    if (parseHex(value)) return value.startsWith('#') ? value : `#${value}`;
    return NAMED_COLORS[value.toLowerCase()] || DEFAULT_BRAND_COLOR;
};

/** CSS custom properties to spread onto the chat root element's `style`. */
export const getChatThemeVars = (primaryColor?: string | null): CSSProperties => {
    const base = parseHex(resolveBrandColor(primaryColor)) as RGB;

    // Brand-colored text on white must stay readable (WCAG AA 4.5:1), so darken until it is
    let ink = mix(base, BLACK, 0.12);
    for (let i = 0; i < 12 && contrast(ink, WHITE) < 4.5; i++) ink = mix(ink, BLACK, 0.12);

    // Text on brand-filled buttons: white unless the brand is too light for it
    const onBrand = contrast(WHITE, base) >= 3 ? '#FFFFFF' : '#1C1B2E';

    return {
        '--brand': toHex(base),
        '--brand-rgb': base.map((v) => Math.round(v)).join(' '),
        '--brand-ink': toHex(ink),
        '--brand-soft': toHex(mix(base, WHITE, 0.9)),
        '--brand-border': toHex(mix(base, WHITE, 0.72)),
        '--on-brand': onBrand,
        '--brand-grad': `linear-gradient(135deg, ${toHex(mix(base, WHITE, 0.14))} 0%, ${toHex(mix(base, BLACK, 0.1))} 100%)`,
        '--chat-bg': `linear-gradient(180deg, ${toHex(mix(base, WHITE, 0.915))} 0%, ${toHex(mix(base, WHITE, 0.96))} 55%, ${toHex(mix(base, WHITE, 0.935))} 100%)`,
    } as CSSProperties;
};

/** "NP" for "Nuke Pc", "SH" for "Sky Habitat Homes", "L" for "LeadEngine". */
export const getInitials = (name?: string | null): string => {
    const words = (name || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};
