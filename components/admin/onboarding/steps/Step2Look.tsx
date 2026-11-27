/**
 * Step 2 ("How the chat looks"): bot name + picture, brand colours, welcome screen.
 * The phone preview on the right is fed live from the form.
 * Design: spec2.html.
 */
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../../utils/cn';
import type { StepProps } from '../../../../types/onboarding';
import { Card, CardHeader, Field, Hint, Icon, Input, PreviewPanel, StepColumns, TechTag, tone } from '../ui';
import { PhonePreview } from '../PhonePreview';

type ColourKey = 'primary' | 'secondary';

const FALLBACK_COLOUR: Record<ColourKey, string> = { primary: '#111111', secondary: '#737373' };
const MAX_TAGS = 6;
const MAX_RECENT = 4;

/** 'abc' | '#abc' | '#AABBCC' → '#AABBCC'. Anything else → null. */
const normaliseHex = (raw: string | null | undefined): string | null => {
    const v = (raw ?? '').trim().replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{6}$/.test(v)) return `#${v}`;
    if (/^[0-9A-F]{3}$/.test(v)) return `#${v.split('').map((c) => c + c).join('')}`;
    return null;
};

/** EyeDropper API (Chromium only) — not in TS's DOM lib yet. */
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };
const getEyeDropper = (): EyeDropperCtor | undefined =>
    typeof window === 'undefined' ? undefined : (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;

const COLOUR_META: Record<ColourKey, { title: string; word: string; quick: [string, string][]; use: string }> = {
    primary: {
        title: 'Main colour',
        word: 'main',
        quick: [['#000000', 'Black'], ['#262626', 'Charcoal'], ['#525252', 'Grey']],
        use: 'Used for buttons, the visitor’s messages and the highlighted headline.',
    },
    secondary: {
        title: 'Second colour',
        word: 'second',
        quick: [['#737373', 'Mid grey'], ['#A3A3A3', 'Grey'], ['#D4D4D4', 'Light grey']],
        use: 'Used for the soft background and the feature tags.',
    },
};

interface ColourRowProps {
    isDark: boolean;
    colourKey: ColourKey;
    /** current colour, normalised '#RRGGBB' */
    hex: string;
    recent: string[];
    /** while dragging in the native picker */
    onLive: (hex: string) => void;
    /** a final pick: saved and remembered as recently used */
    onCommit: (hex: string) => void;
}

/** One brand colour: picker square, "#" code box, optional eyedropper, recent & quick swatches, usage line. */
const ColourRow: React.FC<ColourRowProps> = ({ isDark, colourKey, hex, recent, onLive, onCommit }) => {
    const meta = COLOUR_META[colourKey];
    const t = tone(isDark);
    const Word = meta.word.charAt(0).toUpperCase() + meta.word.slice(1);

    // Code box keeps its own text while typing; it re-syncs whenever the saved colour changes.
    const [code, setCode] = useState(hex.slice(1));
    const [syncedHex, setSyncedHex] = useState(hex);
    if (hex !== syncedHex) {
        setSyncedHex(hex);
        setCode(hex.slice(1));
    }

    // Native `change` fires once when the picker closes → remember the colour as recent.
    const pickerRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const el = pickerRef.current;
        if (!el) return;
        const onClose = () => {
            const h = normaliseHex(el.value);
            if (h) onCommit(h);
        };
        el.addEventListener('change', onClose);
        return () => el.removeEventListener('change', onClose);
    }, [onCommit]);

    const onCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
        setCode(v);
        if (v.length === 6 && `#${v}` !== hex) onCommit(`#${v}`);
    };
    /** On blur / Enter: accept 3 or 6 digits, otherwise go back to the last valid colour. */
    const settleCode = () => {
        const h = normaliseHex(code);
        if (!h) {
            setCode(hex.slice(1));
            return;
        }
        setCode(h.slice(1));
        if (h !== hex) onCommit(h);
    };

    const EyeDropper = getEyeDropper();
    const pickFromScreen = async () => {
        if (!EyeDropper) return;
        try {
            const res = await new EyeDropper().open();
            const h = normaliseHex(res.sRGBHex);
            if (h) onCommit(h);
        } catch {
            /* user pressed Esc */
        }
    };

    const shownRecent = recent.filter((h) => h !== hex).slice(0, MAX_RECENT);
    const swatches: [string, string][] = [
        ...shownRecent.map((h): [string, string] => [h, `Recently used ${h}`]),
        ...meta.quick.filter(([h]) => !shownRecent.includes(h)),
    ];

    return (
        <div className={cn('flex flex-col gap-2 min-w-0 p-4 rounded-[14px] border', isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-[#FAFAFA] border-[#E5E5E5]')}>
            <span className={cn('text-[13px] font-bold flex items-center gap-2 flex-wrap', t.text)}>
                {meta.title} <TechTag isDark={isDark}>colors.{colourKey}</TechTag>
            </span>

            <div className="flex flex-wrap items-center gap-3">
                <label
                    className={cn(
                        'relative flex-none w-14 h-14 rounded-[14px] cursor-pointer overflow-hidden border border-black/[0.18]',
                        'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
                        isDark ? 'focus-within:outline-white' : 'focus-within:outline-[#111111]',
                    )}
                    style={{ background: hex, boxShadow: `inset 0 0 0 3px ${isDark ? '#171717' : '#FFFFFF'}` }}
                >
                    <span className="sr-only">Open colour picker for the {meta.word} colour</span>
                    <input
                        ref={pickerRef}
                        type="color"
                        value={hex.toLowerCase()}
                        onChange={(e) => {
                            const h = normaliseHex(e.target.value);
                            if (h) onLive(h);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer border-none p-0"
                    />
                    <span aria-hidden="true" className="absolute right-1 bottom-1 w-5 h-5 rounded-md bg-white flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.25)] pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 22l1-1h3l9-9M3 21v-3l9-9M15 6l3 3M13.5 4.5l6 6M18 2l4 4" />
                        </svg>
                    </span>
                </label>

                <div
                    className={cn(
                        'flex items-center gap-1 h-[46px] w-[140px] px-3 rounded-[10px] border-[1.5px] box-border transition-shadow focus-within:ring-[3px]',
                        isDark
                            ? 'bg-neutral-950 border-neutral-700 focus-within:border-white focus-within:ring-white/15'
                            : 'bg-white border-[#E5E5E5] focus-within:border-[#111111] focus-within:ring-black/10',
                    )}
                >
                    <span aria-hidden="true" className={cn('font-techmono text-sm font-semibold', t.hint)}>#</span>
                    <input
                        aria-label={`${Word} colour code`}
                        value={code}
                        onChange={onCodeChange}
                        onBlur={settleCode}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                settleCode();
                            }
                        }}
                        maxLength={7}
                        spellCheck={false}
                        autoComplete="off"
                        className={cn('flex-1 min-w-0 h-10 border-none outline-none bg-transparent font-techmono text-sm font-semibold uppercase', t.text)}
                    />
                </div>

                {EyeDropper && (
                    <button
                        type="button"
                        onClick={pickFromScreen}
                        aria-label={`Pick from screen: ${meta.word} colour`}
                        className={cn(
                            'inline-flex items-center gap-2 h-[46px] px-3.5 rounded-[10px] border-[1.5px] text-[13px] font-bold cursor-pointer transition-colors',
                            isDark
                                ? 'bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800'
                                : 'bg-white border-[#E5E5E5] text-[#0A0A0A] hover:bg-[#F7F7F7]',
                        )}
                    >
                        <Icon.eyedropper size={16} />
                        Pick from screen
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className={cn('min-w-[90px] text-[12.5px] leading-[1.5]', t.hint)}>{shownRecent.length ? 'Recent & quick' : 'Quick picks'}</span>
                {swatches.map(([h, name]) => {
                    const on = h === hex;
                    return (
                        <button
                            key={h}
                            type="button"
                            aria-label={name}
                            aria-pressed={on}
                            onClick={() => onCommit(h)}
                            className="w-[34px] h-[34px] rounded-[10px] cursor-pointer box-border"
                            style={{
                                background: h,
                                border: on ? `3px solid ${isDark ? '#0A0A0A' : '#FFFFFF'}` : '1px solid rgba(0,0,0,0.15)',
                                boxShadow: on ? `0 0 0 2px ${isDark ? '#FFFFFF' : '#0A0A0A'}` : undefined,
                            }}
                        />
                    );
                })}
            </div>

            <Hint isDark={isDark}>{meta.use}</Hint>
        </div>
    );
};

export const Step2Look: React.FC<StepProps> = ({ form, updateConfig, showErrors, isDark }) => {
    const t = tone(isDark);
    const cfg = form.config;

    const botName = cfg.botName ?? '';
    const display = cfg.botDisplayName ?? '';
    const avatar = (cfg.botAvatar ?? '').trim();
    const primary = normaliseHex(cfg.colors?.primary) ?? FALLBACK_COLOUR.primary;
    const secondary = normaliseHex(cfg.colors?.secondary) ?? FALLBACK_COLOUR.secondary;
    const headline = cfg.welcome?.headline ?? '';
    const highlighted = cfg.welcome?.highlightedHeadline ?? '';
    const subheadline = cfg.welcome?.subheadline ?? '';
    const buttonText = cfg.welcome?.startBtnText ?? '';
    const tags = (cfg.welcome?.features ?? []).filter((x) => typeof x === 'string' && x.trim() !== '');

    const botNameError = showErrors && !botName.trim() ? 'Add a bot name.' : null;
    const headError = showErrors && !highlighted.trim() ? 'Add the highlighted words.' : null;

    // Like the design: the highlighted words start as the company name until someone types their own.
    const headlineSettled = useRef(false);
    useEffect(() => {
        if (headlineSettled.current) return;
        if (highlighted.trim()) {
            headlineSettled.current = true;
        } else if (form.name.trim()) {
            headlineSettled.current = true;
            updateConfig('welcome.highlightedHeadline', form.name.trim());
        }
    }, [highlighted, form.name, updateConfig]);

    // ── Picture ──
    const [brokenAvatar, setBrokenAvatar] = useState<string | null>(null);
    const showAvatarImg = avatar !== '' && brokenAvatar !== avatar;
    const initial = ((display || botName || 'A').trim().charAt(0) || 'A').toUpperCase();

    // ── Colours ── (recent picks live only while the step is open; seeded with the starting colours)
    const [recent, setRecent] = useState<Record<ColourKey, string[]>>(() => ({ primary: [primary], secondary: [secondary] }));
    const setColourLive = (key: ColourKey, h: string) => updateConfig(`colors.${key}`, h);
    const keepColour = (key: ColourKey, h: string) => {
        updateConfig(`colors.${key}`, h);
        setRecent((prev) => ({ ...prev, [key]: [h, ...prev[key].filter((x) => x !== h)].slice(0, MAX_RECENT) }));
    };

    // ── Tags ──
    const [draft, setDraft] = useState('');
    const [tagNote, setTagNote] = useState('');
    const tagsFull = tags.length >= MAX_TAGS;
    const addTag = () => {
        const v = draft.trim().replace(/\s+/g, ' ');
        if (!v) return;
        if (tagsFull) {
            setTagNote(`You can add up to ${MAX_TAGS} tags.`);
            return;
        }
        if (tags.some((x) => x.trim().toLowerCase() === v.toLowerCase())) {
            setTagNote('That tag is already added.');
            return;
        }
        updateConfig('welcome.features', [...tags, v]);
        setDraft('');
        setTagNote('');
    };
    const removeTag = (index: number) => {
        updateConfig('welcome.features', tags.filter((_, i) => i !== index));
        setTagNote('');
    };

    const boxClass = cn(
        'rounded-[10px] border-[1.5px] box-border transition-shadow focus-within:ring-[3px]',
        isDark
            ? 'bg-neutral-950 border-neutral-700 focus-within:border-white focus-within:ring-white/15'
            : 'bg-white border-[#E5E5E5] focus-within:border-[#111111] focus-within:ring-black/10',
    );
    const labelClass = cn('text-[13px] font-bold flex items-center gap-2 flex-wrap', t.text);

    const main = (
        <>
            <Card isDark={isDark}>
                <CardHeader isDark={isDark} title="The bot’s name and picture" help="Visitors see the display name and picture at the top of the chat." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field isDark={isDark} label="Bot name" htmlFor="s2-bn" required tech="botName" error={botNameError}>
                        <Input
                            isDark={isDark}
                            id="s2-bn"
                            value={botName}
                            onChange={(e) => updateConfig('botName', e.target.value)}
                            placeholder="e.g. HealthFirst Assistant"
                            invalid={!!botNameError}
                        />
                    </Field>
                    <Field isDark={isDark} label="Display name" htmlFor="s2-dn" tech="botDisplayName">
                        <Input isDark={isDark} id="s2-dn" value={display} onChange={(e) => updateConfig('botDisplayName', e.target.value)} placeholder="e.g. Asha" />
                    </Field>
                </div>
                <Field
                    isDark={isDark}
                    label="Picture link"
                    htmlFor="s2-av"
                    optional
                    tech="botAvatar"
                    hint={
                        avatar && !showAvatarImg
                            ? 'This picture didn’t load, so the first letter is shown. Check the link.'
                            : 'Leave empty to show the first letter of the display name, like the circle here.'
                    }
                >
                    <div className="flex items-center gap-3">
                        <span
                            aria-hidden="true"
                            className={cn(
                                'w-[34px] h-[34px] rounded-full flex-none flex items-center justify-center overflow-hidden text-white font-extrabold text-sm',
                                showAvatarImg && (isDark ? 'border border-neutral-700' : 'border border-[#E5E5E5]'),
                            )}
                            style={{ background: showAvatarImg ? '#FFFFFF' : primary }}
                        >
                            {showAvatarImg ? (
                                <img key={avatar} src={avatar} alt="" className="w-full h-full object-cover" onError={() => setBrokenAvatar(avatar)} />
                            ) : (
                                initial
                            )}
                        </span>
                        <Input
                            isDark={isDark}
                            id="s2-av"
                            type="url"
                            inputMode="url"
                            value={cfg.botAvatar ?? ''}
                            onChange={(e) => updateConfig('botAvatar', e.target.value)}
                            placeholder="https://…/logo.png"
                        />
                    </div>
                </Field>
            </Card>

            <Card isDark={isDark}>
                <CardHeader
                    isDark={isDark}
                    title="Brand colours"
                    help="Click a colour square to open the picker. Any colour works: drag to choose it, use the eyedropper to copy it from the client’s logo or website on screen, or type the code."
                />
                {(['primary', 'secondary'] as const).map((key) => (
                    <ColourRow
                        key={key}
                        isDark={isDark}
                        colourKey={key}
                        hex={key === 'primary' ? primary : secondary}
                        recent={recent[key]}
                        onLive={(h) => setColourLive(key, h)}
                        onCommit={(h) => keepColour(key, h)}
                    />
                ))}
            </Card>

            <Card isDark={isDark}>
                <CardHeader isDark={isDark} title="Welcome screen" help="The first thing visitors see. Check it in the preview as you type." />

                <div className="flex flex-col gap-2 min-w-0">
                    <span className={labelClass}>
                        Headline <span className="text-[#B91C1C]">*</span>
                    </span>
                    <div className={cn('flex items-stretch h-12 overflow-hidden', boxClass, headError && 'border-[#B91C1C] focus-within:border-[#B91C1C]')}>
                        <label className="sr-only" htmlFor="s2-hp">Headline start</label>
                        <input
                            id="s2-hp"
                            value={headline}
                            onChange={(e) => updateConfig('welcome.headline', e.target.value)}
                            placeholder="Welcome to"
                            className={cn(
                                'flex-none w-[130px] border-0 border-r-[1.5px] px-3.5 text-[15px] font-medium outline-none',
                                isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-300 placeholder-neutral-500' : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#525252] placeholder-[#A3A3A3]',
                            )}
                        />
                        <label className="sr-only" htmlFor="s2-hh">Highlighted words</label>
                        <input
                            id="s2-hh"
                            value={highlighted}
                            onChange={(e) => updateConfig('welcome.highlightedHeadline', e.target.value)}
                            placeholder="Your Company"
                            aria-invalid={!!headError || undefined}
                            className={cn(
                                'flex-1 min-w-0 border-none px-3.5 text-[15px] font-extrabold outline-none',
                                isDark ? 'bg-neutral-950 text-white placeholder-neutral-500' : 'bg-white text-[#0A0A0A] placeholder-[#A3A3A3]',
                            )}
                        />
                    </div>
                    {headError ? (
                        <p className="m-0 text-[12.5px] font-semibold text-[#B91C1C]" role="alert">{headError}</p>
                    ) : (
                        <Hint isDark={isDark}>The bold part is shown in the main colour.</Hint>
                    )}
                </div>

                <Field isDark={isDark} label="Short description" htmlFor="s2-sh">
                    <Input isDark={isDark} id="s2-sh" value={subheadline} onChange={(e) => updateConfig('welcome.subheadline', e.target.value)} placeholder="How can I help you today?" />
                </Field>

                <Field isDark={isDark} label="Button text" htmlFor="s2-sb">
                    <Input isDark={isDark} id="s2-sb" value={buttonText} onChange={(e) => updateConfig('welcome.startBtnText', e.target.value)} placeholder="Start Conversation" />
                </Field>

                <div className="flex flex-col gap-2 min-w-0">
                    <label className={labelClass} htmlFor="s2-nt">
                        Tags <span className={cn('font-medium', t.hint)}>optional</span>
                    </label>
                    <div className={cn('flex flex-wrap items-center gap-1.5 min-h-12 px-2 py-1.5', boxClass)}>
                        {tags.map((tag, i) => (
                            <span
                                key={`${tag}-${i}`}
                                className={cn(
                                    'inline-flex items-center gap-0.5 h-8 pl-3 pr-1 rounded-lg text-[13px] font-bold',
                                    isDark ? 'bg-neutral-800 text-neutral-100' : 'bg-[#F2F2F2] text-[#111111]',
                                )}
                            >
                                {tag}
                                <button
                                    type="button"
                                    aria-label={`Remove tag ${tag}`}
                                    onClick={() => removeTag(i)}
                                    className={cn(
                                        'w-[26px] h-[26px] border-none rounded-md bg-transparent cursor-pointer flex items-center justify-center transition-colors',
                                        isDark ? 'text-neutral-400 hover:bg-neutral-700 hover:text-white' : 'text-[#525252] hover:bg-[#E5E5E5] hover:text-[#0A0A0A]',
                                    )}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M6 6l12 12M18 6L6 18" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                        <input
                            id="s2-nt"
                            value={draft}
                            onChange={(e) => {
                                setDraft(e.target.value);
                                if (tagNote) setTagNote('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    addTag();
                                }
                            }}
                            disabled={tagsFull}
                            maxLength={40}
                            placeholder={tagsFull ? `${MAX_TAGS} tags is the most` : 'Type a tag and press Enter'}
                            className={cn(
                                'flex-[1_1_160px] min-w-[140px] h-[34px] border-none px-1.5 bg-transparent text-sm font-medium outline-none disabled:cursor-not-allowed',
                                isDark ? 'text-white placeholder-neutral-500' : 'text-[#0A0A0A] placeholder-[#A3A3A3]',
                            )}
                        />
                        {draft.trim() !== '' && !tagsFull && (
                            <button
                                type="button"
                                onClick={addTag}
                                className={cn(
                                    'inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[13px] font-bold cursor-pointer transition-colors',
                                    isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-[#111111] text-white hover:bg-black',
                                )}
                            >
                                <Icon.plus size={14} />
                                Add
                            </button>
                        )}
                    </div>
                    <div aria-live="polite">
                        {(tagNote || tagsFull) && <Hint isDark={isDark}>{tagNote || `That’s the most (${MAX_TAGS}). Remove a tag to add another.`}</Hint>}
                    </div>
                </div>
            </Card>
        </>
    );

    const aside = (
        <PreviewPanel isDark={isDark} rightLabel="Welcome screen">
            <PhonePreview
                mode="welcome"
                companyName={form.name}
                botDisplayName={display || botName}
                botAvatar={avatar}
                primary={primary}
                secondary={secondary}
                headline={headline}
                highlighted={highlighted || form.name}
                subheadline={subheadline}
                buttonText={buttonText}
                features={tags}
            />
            <Hint isDark={isDark}>Every change shows here straight away. This is exactly what visitors see when they open the chat page.</Hint>
        </PreviewPanel>
    );

    return <StepColumns main={main} aside={aside} />;
};
