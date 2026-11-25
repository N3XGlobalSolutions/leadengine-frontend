/**
 * Client brand theming for the LeadEngine chat widget.
 *
 * generateTheme(primary, secondary?) turns the two colours a client picks in the admin panel
 * into the full token set the widget reads through CSS variables (see ./cssVars.ts).
 * Pure, deterministic and fast (a few dozen colour conversions, well under 5 ms).
 *
 * All colour maths is done in OKLCH (culori). Whenever a lightness is changed, the hue is
 * kept and culori's CSS Color 4 gamut mapping keeps as much chroma as sRGB allows.
 *
 * Readability guarantees (checked by ./readability.ts and the unit tests):
 *  1. Text on buttons and bubbles: white or #14232C, whichever contrasts more with the primary;
 *     every gradient stop reaches 4.5:1 (the gradient moves in 0.02 lightness steps until it does).
 *  2. btn-to / bubble-to sit 0.08–0.12 lightness away from btn-from / bubble-from.
 *  3. link and selected-text reach 4.5:1 on white, every background wash and selected-bg.
 *  4. accent reaches 3:1 against white and the progress track.
 *  5. Icons coloured by tokens use accent / link / selected-text / on-btn, so they inherit 1-4.
 *  6. Tints stay light and calm: chroma ≤ 0.05, fixed lightness bands.
 */
import { converter, formatHex, parse, toGamut, wcagContrast, differenceEuclidean } from 'culori';

// ── Public types ────────────────────────────────────────────────────────

export interface ThemeTokens {
    accent: string;
    accentSoft: string;
    link: string;
    selectedText: string;
    selectedBg: string;
    selectedBorder: string;
    btnFrom: string;
    btnTo: string;
    onBtn: string;
    bubbleFrom: string;
    bubbleTo: string;
    onBubble: string;
    robotAccFrom: string;
    robotAccTo: string;
    tint1: string;
    tint2: string;
    border: string;
    track: string;
    bg1: string;
    bg2: string;
    bg3: string;
    glow: string;   // rgba()
    glow2: string;  // rgba()
    shadow: string; // rgba()
}

export type ThemeWarningCode =
    | 'primary-invalid'
    | 'primary-near-black'
    | 'primary-near-white'
    | 'primary-neutral'
    | 'secondary-invalid'
    | 'secondary-generated'
    | 'secondary-same'
    | 'secondary-near-white'
    | 'secondary-near-black'
    | 'colours-clash'
    | 'dark-text-pale'
    | 'dark-text'
    | 'fill-adjusted'
    | 'accent-deepened'
    | 'accent-from-secondary';

export interface ThemeWarning {
    code: ThemeWarningCode;
    message: string; // plain English, shown to the client in the admin panel
}

export interface GeneratedTheme {
    tokens: ThemeTokens;
    warnings: ThemeWarning[];
}

// ── Fixed colours (never themed) ────────────────────────────────────────

export const DEFAULT_PRIMARY = '#7C5CF0';
export const DEFAULT_SECONDARY = '#A28DF9';
export const ON_LIGHT_TEXT = '#14232C'; // text on pale buttons/bubbles
export const ON_DARK_TEXT = '#FFFFFF';
export const FIXED_COLORS = {
    text: '#1C1B26',
    muted: '#6E6A80',
    success: '#22A55B',
    danger: '#B4283C',
    star: '#F5A524',
    white: '#FFFFFF',
} as const;

export const MIN_TEXT_CONTRAST = 4.5;
export const MIN_UI_CONTRAST = 3;

// ── Tuning (lightness bands from the approved designs + readability rules) ──

const NEAR_BLACK_L = 0.2;
const NEAR_WHITE_L = 0.97;
const NEUTRAL_CHROMA = 0.03;   // below this a colour reads as grey
const SAME_COLOUR_DE = 0.02;   // OKLab distance under which two colours count as the same
const CLASH_MIN_CHROMA = 0.08;
const CLASH_MIN_HUE_GAP = 100; // degrees
const CLASH_CHROMA_FACTOR = 0.6; // secondary chroma kept on large areas for clashing pairs

const FILL_MAX_CENTRE_L = 0.88; // buttons/bubbles never wash out to near-white
const BTN_SPREAD = 0.1;
const BUBBLE_SPREAD = 0.09;
export const RULE2_MIN_SPREAD = 0.08;
export const RULE2_MAX_SPREAD = 0.12;
const PALE_L = 0.75;            // primaries lighter than this get dark text and deeper derived shades
const PALE_CHROMA_BOOST = 1.5;  // deep shades of a pale colour carry a little more chroma (capped)
const PALE_CHROMA_CAP = 0.12;
const STEP = 0.02;

const L_SELECTED_BG = 0.97;
const L_TINT = 0.945;
const L_BORDER = 0.91;
const L_TRACK = 0.9;
const L_SELECTED_BORDER = 0.82;
const L_BG1 = 0.96;
const L_BG2 = 0.98;
const L_BG3 = 0.975;
const LINK_TARGET_L = 0.48;
const SELECTED_TEXT_TARGET_L = 0.42;

// ── Colour helpers ──────────────────────────────────────────────────────

interface Lch {
    l: number;
    c: number;
    h: number;
}

const toOklch = converter('oklch');
const toRgbGamut = toGamut('rgb', 'oklch');
const deltaE = differenceEuclidean('oklab');

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const normHue = (h: number) => ((h % 360) + 360) % 360;
const hueDistance = (a: number, b: number) => {
    const d = Math.abs(normHue(a) - normHue(b));
    return d > 180 ? 360 - d : d;
};

/** sRGB hex for an OKLCH colour (gamut-mapped: lightness and hue kept, chroma reduced only as needed). */
const hex = (x: Lch): string =>
    formatHex(toRgbGamut({ mode: 'oklch', l: clamp(x.l, 0, 1), c: Math.max(0, x.c), h: normHue(x.h) })).toUpperCase();

/** rgba() string for an OKLCH colour at the given alpha. */
const rgba = (x: Lch, alpha: number): string => {
    const rgb = toRgbGamut({ mode: 'oklch', l: clamp(x.l, 0, 1), c: Math.max(0, x.c), h: normHue(x.h) });
    const to255 = (v: number) => Math.round(clamp(v, 0, 1) * 255);
    return `rgba(${to255(rgb.r)},${to255(rgb.g)},${to255(rgb.b)},${alpha.toFixed(2)})`;
};

export const contrastRatio = (a: string, b: string): number => wcagContrast(a, b);

/** OKLCH lightness of a hex colour. */
export const lightnessOf = (hexValue: string): number => toOklch(hexValue)?.l ?? 0;

const readColour = (input: unknown): Lch | null => {
    if (typeof input !== 'string' || !input.trim()) return null;
    const parsed = parse(input.trim());
    if (!parsed) return null;
    const o = toOklch(parsed);
    if (!o || !Number.isFinite(o.l)) return null;
    const c = Number.isFinite(o.c) ? o.c : 0;
    const h = Number.isFinite(o.h) ? (o.h as number) : 0; // achromatic colours have no hue
    return { l: o.l, c, h };
};

const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Lower (direction -1) or raise (+1) lightness in STEP increments until `passes` holds. */
const adjustLightness = (start: Lch, direction: -1 | 1, passes: (hexValue: string) => boolean): Lch => {
    let current = { ...start };
    for (let i = 0; i < 60; i++) {
        if (passes(hex(current))) return current;
        const next = current.l + direction * STEP;
        if (next < 0.05 || next > 0.99) break;
        current = { ...current, l: next };
    }
    return current;
};

// ── Generator ───────────────────────────────────────────────────────────

export const generateTheme = (primary: string, secondary?: string | null): GeneratedTheme => {
    const warnings: ThemeWarning[] = [];
    const warn = (code: ThemeWarningCode, message: string) => warnings.push({ code, message });

    // Primary ------------------------------------------------------------
    const parsedPrimary = readColour(primary);
    if (!parsedPrimary) {
        const fallback = generateTheme(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
        return {
            tokens: fallback.tokens,
            warnings: [
                {
                    code: 'primary-invalid',
                    message: `We couldn't read "${String(primary ?? '')}" as a colour, so the default purple theme is used.`,
                },
            ],
        };
    }

    const P: Lch = { ...parsedPrimary };
    if (P.l < NEAR_BLACK_L) {
        P.l = NEAR_BLACK_L;
        warn('primary-near-black', 'Your primary is almost black, so a soft near-black is used.');
    } else if (P.l > NEAR_WHITE_L) {
        P.l = NEAR_WHITE_L;
        warn('primary-near-white', 'Your primary is almost white, so a soft near-white is used.');
    }
    const primaryNeutral = P.c < NEUTRAL_CHROMA;
    if (primaryNeutral) P.c = Math.min(P.c, NEUTRAL_CHROMA);

    // Secondary ----------------------------------------------------------
    let S: Lch | null = null;
    if (!isBlank(secondary)) {
        S = readColour(secondary);
        if (!S) {
            warn('secondary-invalid', `We couldn't read "${String(secondary)}" as a colour, so a matching secondary was generated.`);
        } else if (deltaE({ mode: 'oklch', ...S }, { mode: 'oklch', ...P }) < SAME_COLOUR_DE) {
            S = null;
            warn('secondary-same', 'Your two colours are the same, so a matching secondary was generated.');
        }
    } else {
        warn('secondary-generated', 'No secondary colour was chosen, so a matching one was generated from your primary.');
    }
    if (!S) {
        S = { l: clamp(P.l + 0.12, 0.62, 0.9), c: Math.min(P.c, 0.16), h: normHue(P.h + 25) };
    }
    const secondaryNeutral = S.c < NEUTRAL_CHROMA;
    if (secondaryNeutral && S.l > 0.9) {
        S = { ...S, l: 0.85 };
        warn('secondary-near-white', 'Your secondary is almost white, so decorations use a soft grey instead.');
    } else if (secondaryNeutral && S.l < 0.3) {
        S = { ...S, l: 0.6 };
        warn('secondary-near-black', 'Your secondary is almost black, so decorations use a mid grey instead.');
    }

    const clash =
        P.c >= CLASH_MIN_CHROMA && S.c >= CLASH_MIN_CHROMA && hueDistance(P.h, S.h) >= CLASH_MIN_HUE_GAP;
    const SLarge: Lch = clash ? { ...S, c: S.c * CLASH_CHROMA_FACTOR } : S;
    if (clash) {
        warn('colours-clash', 'Your two colours clash strongly, so the secondary is softened on large areas.');
    }

    // Tints & washes -----------------------------------------------------
    // A grey primary takes its (very faint) tint from a colourful secondary, else stays pure grey.
    const tintHue = primaryNeutral ? S.h : P.h;
    const tintChroma = primaryNeutral ? (secondaryNeutral ? 0 : 0.01) : P.c;

    const selectedBg = hex({ l: L_SELECTED_BG, c: Math.min(0.035, (tintChroma > 0 ? 0.008 : 0) + tintChroma * 0.1), h: tintHue });
    const selectedBorder = hex({ l: L_SELECTED_BORDER, c: Math.min(0.05, tintChroma * 0.46), h: tintHue });
    const tint1 = hex({ l: L_TINT, c: Math.min(0.045, tintChroma * 0.22), h: tintHue });
    const tint2 = hex({ l: L_TINT, c: Math.min(0.045, SLarge.c * 0.22), h: SLarge.h });
    const border = hex({ l: L_BORDER, c: Math.min(0.04, (tintChroma > 0 ? 0.008 : 0) + tintChroma * 0.1), h: tintHue });
    const track = hex({ l: L_TRACK, c: Math.min(0.03, (tintChroma > 0 ? 0.006 : 0) + tintChroma * 0.08), h: tintHue });
    const bg1 = hex({ l: L_BG1, c: Math.min(0.024, (tintChroma > 0 ? 0.006 : 0) + tintChroma * 0.08), h: tintHue });
    const bg2 = hex({ l: L_BG2, c: Math.min(0.012, (tintChroma > 0 ? 0.003 : 0) + tintChroma * 0.03), h: tintHue });
    const bg3 = hex({ l: L_BG3, c: Math.min(0.03, SLarge.c * 0.15), h: SLarge.h });

    // Rules 1 + 2: buttons and bubbles ------------------------------------
    const primaryHex = hex(P);
    const onBtn =
        contrastRatio(ON_DARK_TEXT, primaryHex) >= contrastRatio(ON_LIGHT_TEXT, primaryHex) ? ON_DARK_TEXT : ON_LIGHT_TEXT;
    const whiteText = onBtn === ON_DARK_TEXT;

    /**
     * Two stops `spread` apart in lightness around `centre`. Fitting a very saturated stop into
     * sRGB can nudge its lightness, so the gap is measured on the final hex values and widened
     * (up to RULE2_MAX_SPREAD) until it lands inside the rule-2 band.
     */
    const stopsAround = (centre: number, spread: number) => {
        let gap = spread;
        let from = '';
        let to = '';
        for (let i = 0; i < 8; i++) {
            from = hex({ l: centre + gap / 2, c: P.c, h: P.h }); // lighter stop (top-left)
            to = hex({ l: centre - gap / 2, c: P.c, h: P.h });   // deeper stop (bottom-right)
            const measured = lightnessOf(from) - lightnessOf(to);
            if (measured >= RULE2_MIN_SPREAD + 0.003 || gap >= RULE2_MAX_SPREAD) break;
            gap = Math.min(RULE2_MAX_SPREAD, gap + 0.01);
        }
        return { from, to };
    };

    const fillRamp = (spread: number) => {
        let centre = Math.min(P.l, FILL_MAX_CENTRE_L);
        let stops = stopsAround(centre, spread);
        for (let i = 0; i < 60; i++) {
            if (contrastRatio(onBtn, stops.from) >= MIN_TEXT_CONTRAST && contrastRatio(onBtn, stops.to) >= MIN_TEXT_CONTRAST) break;
            centre += whiteText ? -STEP : STEP;
            stops = stopsAround(centre, spread);
        }
        return { ...stops, centre };
    };
    const btn = fillRamp(BTN_SPREAD);
    const bubble = fillRamp(BUBBLE_SPREAD);

    if (!whiteText) {
        if (P.l >= PALE_L) {
            warn('dark-text-pale', 'Your primary is very light, so buttons and message bubbles use dark text for readability.');
        } else {
            warn('dark-text', "White text isn't readable enough on your primary, so buttons and message bubbles use dark text.");
        }
    }
    if (Math.abs(btn.centre - Math.min(P.l, FILL_MAX_CENTRE_L)) >= 0.04) {
        warn(
            'fill-adjusted',
            `Buttons and message bubbles use a slightly ${whiteText ? 'deeper' : 'lighter'} shade of your primary so their text stays readable.`
        );
    }

    // Deep shades derived from a pale primary (accent, link, selected text) keep its hue but carry
    // a little more chroma, so they read as the brand instead of a greyish version of it.
    const deepChroma = P.l > PALE_L && !primaryNeutral ? Math.min(P.c * PALE_CHROMA_BOOST, PALE_CHROMA_CAP) : P.c;

    // Rule 4: accent (progress bar, small indicators) -----------------------
    let accentBase: Lch = { ...P, c: deepChroma };
    if (primaryNeutral && P.l >= 0.3 && !secondaryNeutral) {
        accentBase = { l: S.l, c: S.c, h: S.h };
        warn('accent-from-secondary', 'Your primary is grey, so your secondary colour is used for the progress bar and accents.');
    } else if (primaryNeutral && secondaryNeutral) {
        warn('primary-neutral', 'Your colours are greys, so the chatbot uses a neutral grey look.');
    }
    const accentL = adjustLightness(
        accentBase,
        -1,
        (h) => contrastRatio(h, FIXED_COLORS.white) >= MIN_UI_CONTRAST && contrastRatio(h, track) >= MIN_UI_CONTRAST
    );
    const accent = hex(accentL);
    if (accentBase.l - accentL.l >= 0.04) {
        warn('accent-deepened', 'Your colour is light, so the progress bar and small accents use a deeper shade of it.');
    }

    // Rule 3: link and selected text ------------------------------------------
    const readableOnAll = (backgrounds: string[]) => (h: string) =>
        backgrounds.every((bg) => contrastRatio(h, bg) >= MIN_TEXT_CONTRAST);
    const textBackgrounds = [FIXED_COLORS.white, bg1, bg2, bg3, selectedBg];

    const link = hex(adjustLightness({ l: Math.min(P.l, LINK_TARGET_L), c: deepChroma, h: P.h }, -1, readableOnAll(textBackgrounds)));
    const selectedText = hex(
        adjustLightness(
            { l: Math.max(0.1, Math.min(P.l - 0.07, SELECTED_TEXT_TARGET_L)), c: deepChroma, h: P.h },
            -1,
            readableOnAll(textBackgrounds)
        )
    );

    // Decoration (secondary-led) --------------------------------------------
    const accentSoft = hex(S);
    const robotAccFrom = hex({ l: Math.min(S.l + 0.04, 0.93), c: S.c, h: S.h });
    const robotAccTo = primaryHex;
    const glow = rgba(SLarge, clamp(0.2 + (S.l - 0.7) * 0.6, 0.2, 0.35));
    const glow2 = rgba(P, clamp(0.08 + (P.l - 0.65) * 0.8, 0.06, 0.25));
    const shadow = rgba({ l: 0.32, c: Math.min(0.09, P.c * 0.45), h: P.h }, 0.05);

    return {
        tokens: {
            accent,
            accentSoft,
            link,
            selectedText,
            selectedBg,
            selectedBorder,
            btnFrom: btn.from,
            btnTo: btn.to,
            onBtn,
            bubbleFrom: bubble.from,
            bubbleTo: bubble.to,
            onBubble: onBtn,
            robotAccFrom,
            robotAccTo,
            tint1,
            tint2,
            border,
            track,
            bg1,
            bg2,
            bg3,
            glow,
            glow2,
            shadow,
        },
        warnings,
    };
};
