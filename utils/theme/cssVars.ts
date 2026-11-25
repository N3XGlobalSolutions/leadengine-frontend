import type { CSSProperties } from 'react';
import { generateTheme, type ThemeTokens } from './generateTheme';

/** CSS custom property for each token. Components read colours ONLY through these (via Tailwind `le-*`). */
export const TOKEN_CSS_VARS: Record<keyof ThemeTokens, string> = {
    accent: '--le-accent',
    accentSoft: '--le-accent-soft',
    link: '--le-link',
    selectedText: '--le-selected-text',
    selectedBg: '--le-selected-bg',
    selectedBorder: '--le-selected-border',
    btnFrom: '--le-btn-from',
    btnTo: '--le-btn-to',
    onBtn: '--le-on-btn',
    bubbleFrom: '--le-bubble-from',
    bubbleTo: '--le-bubble-to',
    onBubble: '--le-on-bubble',
    robotAccFrom: '--le-robot-acc-from',
    robotAccTo: '--le-robot-acc-to',
    tint1: '--le-tint-1',
    tint2: '--le-tint-2',
    border: '--le-border',
    track: '--le-track',
    bg1: '--le-bg-1',
    bg2: '--le-bg-2',
    bg3: '--le-bg-3',
    glow: '--le-glow',
    glow2: '--le-glow-2',
    shadow: '--le-shadow',
};

/** `{ '--le-accent': '#7C5CF0', ... }` — spread onto the widget root's `style`. */
export const themeToCssVars = (tokens: ThemeTokens): CSSProperties => {
    const vars: Record<string, string> = {};
    (Object.keys(TOKEN_CSS_VARS) as Array<keyof ThemeTokens>).forEach((key) => {
        vars[TOKEN_CSS_VARS[key]] = tokens[key];
    });
    return vars as CSSProperties;
};

/** Convenience: theme style for a client's two colours (secondary optional). */
export const getThemeStyle = (primary?: string | null, secondary?: string | null): CSSProperties =>
    themeToCssVars(generateTheme(primary || '', secondary).tokens);
