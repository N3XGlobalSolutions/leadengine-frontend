import { contrastRatio, FIXED_COLORS, MIN_TEXT_CONTRAST, MIN_UI_CONTRAST, type ThemeTokens } from './generateTheme';

/** One foreground/background pairing the widget actually renders. */
export interface ReadabilityCheck {
    id: string;
    label: string;          // plain English for the admin report
    foreground: string;
    background: string;
    ratio: number;          // WCAG 2.x contrast ratio, 2 decimals
    required: number;       // 4.5 for text, 3 for non-text UI
    kind: 'text' | 'ui';
    pass: boolean;
}

/** Every text and UI colour pairing in the widget, checked against WCAG 2.x thresholds. */
export const checkReadability = (t: ThemeTokens): ReadabilityCheck[] => {
    const { text, muted, white } = FIXED_COLORS;
    const pairs: Array<[id: string, label: string, fg: string, bg: string, kind: 'text' | 'ui']> = [
        ['btn-text-from', 'Button text (light end)', t.onBtn, t.btnFrom, 'text'],
        ['btn-text-to', 'Button text (deep end)', t.onBtn, t.btnTo, 'text'],
        ['bubble-text-from', 'Your-message text (light end)', t.onBubble, t.bubbleFrom, 'text'],
        ['bubble-text-to', 'Your-message text (deep end)', t.onBubble, t.bubbleTo, 'text'],
        ['link-white', 'Links & chips on white', t.link, white, 'text'],
        ['link-bg1', 'Links on page background (top)', t.link, t.bg1, 'text'],
        ['link-bg2', 'Links on page background (middle)', t.link, t.bg2, 'text'],
        ['link-bg3', 'Links on page background (bottom)', t.link, t.bg3, 'text'],
        ['link-selected', 'Labels on selected items', t.link, t.selectedBg, 'text'],
        ['selected-white', 'Selected / outline-button text on white', t.selectedText, white, 'text'],
        ['selected-bg2', 'Selected text on page background', t.selectedText, t.bg2, 'text'],
        ['selected-selbg', 'Selected chip / day / time text', t.selectedText, t.selectedBg, 'text'],
        ['body-white', 'Body text on cards', text, white, 'text'],
        ['body-bg1', 'Body text on page background (top)', text, t.bg1, 'text'],
        ['body-bg3', 'Body text on page background (bottom)', text, t.bg3, 'text'],
        ['muted-white', 'Secondary text on cards', muted, white, 'text'],
        ['muted-bg1', 'Secondary text on page background (top)', muted, t.bg1, 'text'],
        ['muted-bg2', 'Secondary text on page background (middle)', muted, t.bg2, 'text'],
        ['muted-bg3', 'Secondary text on page background (bottom)', muted, t.bg3, 'text'],
        ['muted-selbg', 'Secondary text on selected items', muted, t.selectedBg, 'text'],
        ['accent-white', 'Progress bar & icons on white', t.accent, white, 'ui'],
        ['accent-track', 'Progress bar on its track', t.accent, t.track, 'ui'],
        ['send-icon', 'Send-button icon', t.onBtn, t.btnTo, 'ui'],
    ];

    return pairs.map(([id, label, foreground, background, kind]) => {
        const ratio = Math.round(contrastRatio(foreground, background) * 100) / 100;
        const required = kind === 'text' ? MIN_TEXT_CONTRAST : MIN_UI_CONTRAST;
        return { id, label, foreground, background, ratio, required, kind, pass: ratio >= required };
    });
};
