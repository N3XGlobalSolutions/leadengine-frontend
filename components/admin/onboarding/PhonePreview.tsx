/**
 * Phone mockup for the onboarding wizard's "Live preview" panel.
 * Pure presentational and always light: it shows what the client's visitors will see.
 *
 * Frame: black bezel (max 312px) around a 292.5 x 633 screen. The screen content is laid out
 * at real phone size (390 x 844) and scaled to 0.75 from the top-left corner.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import type { PhonePreviewProps, PreviewMessage } from '../../../types/onboarding';

const DEFAULT_PRIMARY = '#111111';
const DEFAULT_SECONDARY = '#737373';

/** `color` at ~22% opacity (the design appends hex alpha "38"); non-hex colours go through color-mix. */
const withAlpha38 = (color: string): string => {
    const c = color.trim();
    if (/^#[0-9a-f]{6}$/i.test(c)) return `${c}38`;
    if (/^#[0-9a-f]{3}$/i.test(c)) return `#${c.slice(1).split('').map((ch) => ch + ch).join('')}38`;
    return `color-mix(in srgb, ${c} 22%, transparent)`;
};

const initialsOf = (company: string): string =>
    company.trim().split(/\s+/).map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase() || 'AI';

const initialOf = (name: string): string => (name.trim().charAt(0) || 'A').toUpperCase();

/* Robot animations (copied from the design) */
const ROBOT_CSS =
    '@keyframes rbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
    '@keyframes rbBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}' +
    '.rb-float{animation:rbFloat 4.5s ease-in-out infinite}' +
    '.rb-eye{transform-box:fill-box;transform-origin:center;animation:rbBlink 5s infinite}' +
    '@media (prefers-reduced-motion: reduce){.rb-float,.rb-eye{animation:none}}';

const SPARKLE = 'M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z';

/* ───────────────────────────── shared bits ───────────────────────────── */

const Kebab: React.FC = () => (
    <span aria-hidden="true" className="w-11 h-11 rounded-full bg-[rgba(255,255,255,.7)] border border-[#EEEEEE] flex items-center justify-center box-border flex-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#525252">
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
        </svg>
    </span>
);

const StatusLine: React.FC<{ label: string }> = ({ label }) => (
    <span className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#111111] flex-none" />
        {label}
    </span>
);

/* ───────────────────────────── welcome mode ───────────────────────────── */

/** Robot mascot from the design. Gradient ids are made unique per instance. */
const WelcomeRobot: React.FC = () => {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const head = `rbHead-${uid}`;
    const visor = `rbVisor-${uid}`;
    const eye = `rbEye-${uid}`;
    const acc = `rbAcc-${uid}`;
    return (
        <svg width="196" height="196" viewBox="0 0 200 200" role="img" aria-label="AI assistant robot" className="relative" style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={head} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#EBEBEB" /></linearGradient>
                <linearGradient id={visor} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2E2E2E" /><stop offset="1" stopColor="#0F0F0F" /></linearGradient>
                <linearGradient id={eye} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#CFCFCF" /></linearGradient>
                <linearGradient id={acc} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#737373" /><stop offset="1" stopColor="#111111" /></linearGradient>
            </defs>
            <ellipse cx="100" cy="193" rx="42" ry="4.5" fill="#111111" opacity=".12" />
            <g className="rb-float">
                <path d="M100 41V28" stroke="#D4D4D4" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="22" r="10" fill="#111111" opacity=".10" />
                <circle cx="100" cy="22" r="6" fill={`url(#${acc})`} />
                <circle cx="98" cy="20" r="1.8" fill="#FFFFFF" opacity=".85" />
                <rect x="24" y="78" width="20" height="30" rx="10" fill="#FFFFFF" stroke="#E2E2E2" strokeWidth="1.5" />
                <rect x="29" y="84" width="10" height="18" rx="5" fill={`url(#${acc})`} />
                <rect x="156" y="78" width="20" height="30" rx="10" fill="#FFFFFF" stroke="#E2E2E2" strokeWidth="1.5" />
                <rect x="161" y="84" width="10" height="18" rx="5" fill={`url(#${acc})`} />
                <rect x="40" y="40" width="120" height="104" rx="44" fill={`url(#${head})`} stroke="#E2E2E2" strokeWidth="1.5" />
                <path d="M60 58Q72 48 90 47" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                <rect x="54" y="63" width="92" height="58" rx="27" fill={`url(#${visor})`} />
                <path d="M66 72Q82 67 104 67" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity=".16" />
                <rect className="rb-eye" x="73" y="82" width="14" height="19" rx="7" fill={`url(#${eye})`} />
                <rect className="rb-eye" x="113" y="82" width="14" height="19" rx="7" fill={`url(#${eye})`} />
                <circle cx="77.5" cy="87" r="2" fill="#FFFFFF" opacity=".9" />
                <circle cx="117.5" cy="87" r="2" fill="#FFFFFF" opacity=".9" />
                <path d="M93 109Q100 114 107 109" fill="none" stroke="#E5E5E5" strokeWidth="2.4" strokeLinecap="round" />
                <rect x="89" y="143" width="22" height="7" rx="3.5" fill="#E2E2E2" />
                <rect x="44" y="152" width="14" height="25" rx="7" fill={`url(#${head})`} stroke="#E2E2E2" strokeWidth="1.5" transform="rotate(16 51 154)" />
                <rect x="142" y="152" width="14" height="25" rx="7" fill={`url(#${head})`} stroke="#E2E2E2" strokeWidth="1.5" transform="rotate(-16 149 154)" />
                <rect x="62" y="149" width="76" height="34" rx="17" fill={`url(#${head})`} stroke="#E2E2E2" strokeWidth="1.5" />
                <circle cx="100" cy="166" r="6" fill={`url(#${acc})`} />
                <circle cx="98.5" cy="164.5" r="2" fill="#FFFFFF" opacity=".8" />
            </g>
        </svg>
    );
};

interface WelcomeProps {
    company: string;
    display: string;
    primary: string;
    secondary: string;
    headline: string;
    highlighted: string;
    sub: string;
    button: string;
    tags: string[];
}

const WelcomeScreen: React.FC<WelcomeProps> = ({ company, display, primary, secondary, headline, highlighted, sub, button, tags }) => (
    <>
        <style>{ROBOT_CSS}</style>
        <header className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 flex-none rounded-xl bg-white border border-[#E8E8E8] text-[#1C1C1C] flex items-center justify-center font-semibold text-[13px] tracking-[.4px]">
                    {initialsOf(company)}
                </div>
                <div className="flex flex-col gap-px min-w-0">
                    <span className="text-base font-medium truncate">{company}</span>
                    <StatusLine label="AI Assistant · Online" />
                </div>
            </div>
            <Kebab />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className="relative w-[250px] h-[240px] flex items-center justify-center">
                <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(closest-side, ${withAlpha38(secondary)}, rgba(0,0,0,.04) 55%, rgba(255,255,255,0))` }}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="absolute left-[26px] top-12 opacity-70">
                    <path d={SPARKLE} fill="#A3A3A3" />
                </svg>
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" className="absolute left-[220px] top-[150px] opacity-[.45]">
                    <path d={SPARKLE} fill="#A3A3A3" />
                </svg>
                <div className="absolute top-[18px] -right-[22px] z-[1] bg-white border border-[#EEEEEE] shadow-[0_4px_14px_rgba(0,0,0,.06)] rounded-[14px_14px_14px_4px] px-3 py-[7px] text-xs text-[#1C1C1C] whitespace-nowrap">
                    Hi, I&apos;m {display}
                </div>
                <WelcomeRobot />
            </div>
            <p className="mt-3.5 mb-1 mx-0 text-[18px] text-[#6B6B6B] font-light text-center">
                {headline} <span className="font-medium" style={{ color: primary }}>{highlighted}</span>
            </p>
            <p className="m-0 text-2xl font-medium tracking-[-.2px] text-center leading-[1.25]">{sub}</p>
        </div>

        {tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-1">
                {tags.map((t, i) => (
                    <span key={`${t}-${i}`} className="h-7 rounded-full px-3 bg-[rgba(255,255,255,.85)] border border-[#E8E8E8] text-[#6B6B6B] text-xs flex items-center">
                        {t}
                    </span>
                ))}
            </div>
        )}

        <span className="h-[52px] rounded-full text-white text-[15px] font-medium flex items-center justify-center gap-2 mt-3" style={{ background: primary }}>
            {button}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
        </span>
        <p className="mt-3 mb-0 mx-0 text-center text-[11px] text-[#6B6B6B]">
            By chatting you agree to our <span className="underline text-[#1C1C1C]">Privacy Policy</span>
        </p>
    </>
);

/* ───────────────────────────── chat mode ───────────────────────────── */

/** Small robot head shown beside bot messages (from the design). */
const MiniBot: React.FC = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="flex-none">
        <path d="M16 5.5v3" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="4" r="2" fill="#111111" />
        <rect x="2.5" y="14.5" width="3.5" height="7" rx="1.75" fill="#525252" />
        <rect x="26" y="14.5" width="3.5" height="7" rx="1.75" fill="#525252" />
        <rect x="5" y="8.5" width="22" height="20" rx="8.5" fill="#FFFFFF" stroke="#E2E2E2" />
        <rect x="8" y="12.5" width="16" height="11" rx="5.5" fill="#161616" />
        <rect x="11" y="15.2" width="3" height="5" rx="1.5" fill="#E5E5E5" />
        <rect x="18" y="15.2" width="3" height="5" rx="1.5" fill="#E5E5E5" />
    </svg>
);

/** Header avatar: the bot picture if set (and it loads), else the initial letter on the primary colour. */
const BotAvatar: React.FC<{ src: string; name: string; primary: string }> = ({ src, name, primary }) => {
    const [failed, setFailed] = useState(false);
    if (src && !failed) {
        return <img src={src} alt="" aria-hidden="true" onError={() => setFailed(true)} className="w-[34px] h-[34px] rounded-full flex-none object-cover bg-white border border-[#EEEEEE]" />;
    }
    return (
        <span aria-hidden="true" className="w-[34px] h-[34px] rounded-[17px] flex-none flex items-center justify-center text-white font-extrabold text-sm" style={{ background: primary }}>
            {initialOf(name)}
        </span>
    );
};

const BOT_BUBBLE = 'max-w-[268px] px-3.5 py-[11px] rounded-[6px_18px_18px_18px] bg-[rgba(255,255,255,.95)] border border-[#EAEAEA] text-[#1C1C1C] text-sm leading-[1.5] whitespace-pre-line break-words';
const USER_BUBBLE = 'max-w-[250px] px-3.5 py-[11px] rounded-[18px_6px_18px_18px] text-white text-sm leading-[1.5] whitespace-pre-line break-words';

const TableBubble: React.FC<{ rows: string[][] }> = ({ rows }) => (
    <div className="max-w-[268px] rounded-[14px] overflow-hidden border border-[#EAEAEA] bg-white text-[13px]">
        {rows.map((row, i) => (
            <div key={i} className={i === 0 ? 'flex font-semibold bg-[#F2F2F2] text-[#1C1C1C]' : 'flex border-t border-[#EEEEEE] text-[#333333]'}>
                {row.map((cell, j) => (
                    <span key={j} className="flex-[1_1_0] min-w-0 px-2.5 py-2 break-words">{cell}</span>
                ))}
            </div>
        ))}
    </div>
);

const BotMessage: React.FC<{ m: PreviewMessage; primary: string }> = ({ m, primary }) => {
    const hasTable = !!m.table && m.table.length > 0;
    const hasChips = !!m.chips && m.chips.length > 0;
    // Plain text messages always show a bubble; table-only / chips-only messages don't add an empty one.
    const showText = !!m.text || (!hasTable && !hasChips);
    return (
        <div className="flex gap-2.5 items-start flex-none" data-focus={m.focus ? 'true' : undefined}>
            <MiniBot />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                {hasTable && <TableBubble rows={m.table!} />}
                {showText && (
                    <div className={BOT_BUBBLE} style={m.focus ? { boxShadow: `0 0 0 2px ${primary}` } : undefined}>
                        {m.text}
                    </div>
                )}
                {m.note && <span className="text-xs text-[#6B6B6B] pl-0.5">{m.note}</span>}
                {hasChips && (
                    <div className="flex flex-wrap gap-2">
                        {m.chips!.map((c, i) => (
                            <span key={`${c}-${i}`} className="h-9 rounded-full px-3.5 bg-[rgba(255,255,255,.9)] border border-[#E5E5E5] text-[#1C1C1C] text-[13px] flex items-center">
                                {c}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const UserMessage: React.FC<{ text: string; primary: string }> = ({ text, primary }) => (
    <div className="flex justify-end flex-none">
        <div className={USER_BUBBLE} style={{ background: primary }}>{text}</div>
    </div>
);

const ChatScreen: React.FC<{ display: string; avatar: string; primary: string; messages: PreviewMessage[] }> = ({ display, avatar, primary, messages }) => {
    const listRef = useRef<HTMLDivElement>(null);
    // Content key so a new array with the same messages (rebuilt every render) doesn't re-scroll.
    const msgKey = JSON.stringify(messages);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        // Bring the focused message (the question being edited) into view, else go to the latest message.
        // Scroll the list itself (not scrollIntoView) so the admin page never jumps.
        const focused = list.querySelector<HTMLElement>('[data-focus="true"]');
        if (focused) {
            const top = focused.offsetTop;
            const bottom = top + focused.offsetHeight;
            if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
                list.scrollTop = Math.max(0, bottom - list.clientHeight);
            }
        } else {
            list.scrollTop = list.scrollHeight;
        }
    }, [msgKey]);

    return (
        <>
            <header className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span aria-hidden="true" className="w-11 h-11 rounded-full bg-[rgba(255,255,255,.7)] border border-[#EEEEEE] flex items-center justify-center box-border flex-none">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </span>
                    <BotAvatar key={avatar} src={avatar} name={display} primary={primary} />
                    <div className="flex flex-col gap-px min-w-0">
                        <span className="text-base font-medium truncate">{display}</span>
                        <StatusLine label="Online" />
                    </div>
                </div>
                <Kebab />
            </header>

            <div
                ref={listRef}
                className="relative flex-1 flex flex-col justify-start gap-3.5 mt-[22px] min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {messages.map((m, i) =>
                    m.who === 'user' ? <UserMessage key={i} text={m.text ?? ''} primary={primary} /> : <BotMessage key={i} m={m} primary={primary} />,
                )}
            </div>

            <div className="rounded-full pl-1 pr-1.5 py-1.5 flex items-center gap-0.5 mt-3 bg-[rgba(255,255,255,.85)] border border-[#EEEEEE] shadow-[0_2px_14px_rgba(0,0,0,.04)]">
                <span aria-hidden="true" className="w-10 h-10 flex items-center justify-center text-[#525252] flex-none">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
                <span className="flex-1 min-w-0 text-[15px] text-[#8A8A8A]">Type your reply…</span>
                <span aria-hidden="true" className="w-10 h-10 flex items-center justify-center text-[#525252] flex-none">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>
                </span>
                <span className="w-10 h-10 rounded-full flex items-center justify-center flex-none" style={{ background: primary }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                    </svg>
                </span>
            </div>
        </>
    );
};

/* ───────────────────────────── frame ───────────────────────────── */

export const PhonePreview: React.FC<PhonePreviewProps> = ({
    mode,
    companyName,
    botDisplayName,
    botAvatar,
    primary,
    secondary,
    headline,
    highlighted,
    subheadline,
    buttonText,
    features,
    messages,
}) => {
    const P = primary?.trim() || DEFAULT_PRIMARY;
    const S = secondary?.trim() || DEFAULT_SECONDARY;
    const company = companyName?.trim() || 'Your Company';
    const display = botDisplayName?.trim() || 'Assistant';

    return (
        <div className="w-full max-w-[312px] mx-auto rounded-[40px] p-[9px] bg-[#0A0A0A] box-border">
            <div className="w-[292.5px] h-[633px] rounded-[32px] overflow-hidden mx-auto bg-white">
                <div className="w-[390px] h-[844px] scale-75 origin-top-left box-border pt-[54px] px-5 pb-[34px] flex flex-col font-chat font-normal text-[#1C1C1C] bg-[linear-gradient(170deg,#F1F1F1_0%,#FAFAFA_50%,#FFFFFF_100%)] overflow-hidden text-left">
                    {mode === 'welcome' ? (
                        <WelcomeScreen
                            company={company}
                            display={display}
                            primary={P}
                            secondary={S}
                            headline={headline ?? ''}
                            highlighted={highlighted?.trim() || company}
                            sub={subheadline?.trim() || 'How can I help you today?'}
                            button={buttonText?.trim() || 'Start Conversation'}
                            tags={(features ?? []).map((f) => f.trim()).filter(Boolean)}
                        />
                    ) : (
                        <ChatScreen display={display} avatar={botAvatar?.trim() ?? ''} primary={P} messages={messages ?? []} />
                    )}
                </div>
            </div>
        </div>
    );
};
