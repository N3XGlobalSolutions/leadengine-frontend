/**
 * Shared UI primitives for the onboarding wizard.
 * Light mode = exact design tokens (#0A0A0A text, #E5E5E5 borders, #111111 primary, 16px cards, 46px inputs).
 * Dark mode = inverted neutral palette. Every component takes `isDark`.
 * Font: 'Plus Jakarta Sans' (class `font-jakarta`), tech tags use 'JetBrains Mono' (class `font-techmono`).
 */
import React from 'react';
import { cn } from '../../../utils/cn';
import type { PreviewPanelProps } from '../../../types/onboarding';

type D = { isDark: boolean };

export const tone = (isDark: boolean) => ({
    text: isDark ? 'text-white' : 'text-[#0A0A0A]',
    muted: isDark ? 'text-neutral-400' : 'text-[#525252]',
    hint: isDark ? 'text-neutral-500' : 'text-[#6B6B6B]',
    border: isDark ? 'border-neutral-800' : 'border-[#E5E5E5]',
    card: isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E5E5E5]',
    subtle: isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]',
    soft: isDark ? 'bg-neutral-950' : 'bg-[#F7F7F7]',
    page: isDark ? 'bg-neutral-950' : 'bg-[#F5F5F5]',
});

/** White card, 16px radius, 24px padding, 18px gap */
export const Card: React.FC<D & { children: React.ReactNode; className?: string; as?: 'section' | 'div' }> = ({ isDark, children, className, as = 'section' }) => {
    const Tag = as;
    return <Tag className={cn('rounded-2xl border p-6 flex flex-col gap-[18px]', tone(isDark).card, className)}>{children}</Tag>;
};

/** Card heading (18px/800) + help text (14px muted). `right` renders on the right (e.g. a Switch). */
export const CardHeader: React.FC<D & { title: React.ReactNode; help?: React.ReactNode; right?: React.ReactNode }> = ({ isDark, title, help, right }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
            <h2 className={cn('m-0 text-[18px] font-extrabold tracking-[-0.02em]', tone(isDark).text)}>{title}</h2>
            {help && <p className={cn('m-0 text-sm leading-[1.55]', tone(isDark).muted)}>{help}</p>}
        </div>
        {right}
    </div>
);

/** Field wrapper: label row + control + hint/error. */
export const Field: React.FC<D & {
    label: React.ReactNode;
    htmlFor?: string;
    required?: boolean;
    optional?: boolean;
    tech?: string;          // small mono tag with the backend field name
    hint?: React.ReactNode;
    error?: string | false | null;
    children: React.ReactNode;
    className?: string;
}> = ({ isDark, label, htmlFor, required, optional, tech, hint, error, children, className }) => (
    <div className={cn('flex flex-col gap-2 min-w-0', className)}>
        <label htmlFor={htmlFor} className={cn('text-[13px] font-bold flex items-center gap-2 flex-wrap', tone(isDark).text)}>
            {label}
            {required && <span className="text-[#B91C1C]">*</span>}
            {optional && <span className={cn('font-medium', tone(isDark).hint)}>optional</span>}
            {tech && <TechTag isDark={isDark}>{tech}</TechTag>}
        </label>
        {children}
        {error ? <p className="m-0 text-[12.5px] font-semibold text-[#B91C1C]" role="alert">{error}</p> : hint ? <Hint isDark={isDark}>{hint}</Hint> : null}
    </div>
);

export const inputClass = (isDark: boolean, opts: { auto?: boolean; invalid?: boolean } = {}) => cn(
    'h-[46px] w-full min-w-0 rounded-[10px] border-[1.5px] px-3.5 text-sm font-medium box-border transition-shadow',
    'focus:outline-none focus:ring-[3px]',
    isDark
        ? 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500 focus:border-white focus:ring-white/15'
        : 'bg-white border-[#E5E5E5] text-[#0A0A0A] placeholder-[#A3A3A3] focus:border-[#111111] focus:ring-black/10',
    opts.auto && (isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-[#F7F7F7] border-[#D4D4D4]'),
    opts.invalid && 'border-[#B91C1C] focus:border-[#B91C1C]',
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & D & { auto?: boolean; invalid?: boolean }>(
    ({ isDark, auto, invalid, className, ...rest }, ref) => (
        <input ref={ref} {...rest} aria-invalid={invalid || undefined} className={cn(inputClass(isDark, { auto, invalid }), className)} />
    ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & D & { invalid?: boolean }>(
    ({ isDark, invalid, className, ...rest }, ref) => (
        <textarea ref={ref} {...rest} aria-invalid={invalid || undefined} className={cn(inputClass(isDark, { invalid }), 'h-auto py-3 leading-[1.6] resize-y', className)} />
    ),
);
Textarea.displayName = 'Textarea';

/** Buttons: primary (black / white in dark), secondary (outlined), ghost. 44px tall, 11px radius, 14px/700. */
export type BtnVariant = 'primary' | 'secondary' | 'ghost';
export const buttonClass = (isDark: boolean, variant: BtnVariant = 'secondary', className?: string) => cn(
    'inline-flex items-center justify-center gap-2 min-h-[44px] px-[18px] rounded-[11px] text-sm font-bold whitespace-nowrap border-[1.5px] border-transparent cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed no-underline',
    variant === 'primary' && (isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-[#111111] text-white hover:bg-black'),
    variant === 'secondary' && (isDark ? 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800' : 'bg-white text-[#0A0A0A] border-[#D4D4D4] hover:bg-[#F7F7F7]'),
    variant === 'ghost' && (isDark ? 'bg-transparent text-white px-2.5 hover:bg-neutral-800' : 'bg-transparent text-black px-2.5 hover:bg-[#F2F2F2]'),
    className,
);
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & D & { variant?: BtnVariant }> = ({ isDark, variant = 'secondary', className, type = 'button', ...rest }) => (
    <button type={type} {...rest} className={buttonClass(isDark, variant, className)} />
);

/** Mono tag showing a backend field name, e.g. <TechTag>botName</TechTag> */
export const TechTag: React.FC<D & { children: React.ReactNode; className?: string }> = ({ isDark, children, className }) => (
    <span className={cn('font-techmono text-[11px] font-medium rounded-md px-1.5 py-0.5', isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-[#F2F2F2] text-[#525252]', className)}>{children}</span>
);

export const Hint: React.FC<D & { children: React.ReactNode; className?: string }> = ({ isDark, children, className }) => (
    <p className={cn('m-0 text-[12.5px] leading-[1.5]', tone(isDark).hint, className)}>{children}</p>
);

/** Small rounded pill (e.g. "5 to 15 questions", "WhatsApp on"). */
export const Pill: React.FC<D & { children: React.ReactNode; className?: string }> = ({ isDark, children, className }) => (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-[9px] py-[3px]', isDark ? 'bg-neutral-800 text-neutral-100' : 'bg-[#F2F2F2] text-[#111111]', className)}>{children}</span>
);

/** 48x28 toggle switch (aria-pressed). */
export const Switch: React.FC<D & { on: boolean; onToggle: () => void; label: string }> = ({ isDark, on, onToggle, label }) => (
    <button
        type="button"
        aria-label={label}
        aria-pressed={on}
        onClick={onToggle}
        className={cn(
            'flex-none w-12 h-7 rounded-[14px] border-none cursor-pointer p-[3px] flex transition-colors',
            on ? (isDark ? 'bg-white justify-end' : 'bg-[#111111] justify-end') : (isDark ? 'bg-neutral-700 justify-start' : 'bg-[#D4D4D4] justify-start'),
        )}
    >
        <span className={cn('w-[22px] h-[22px] rounded-full', on && isDark ? 'bg-black' : 'bg-white')} />
    </button>
);

/** Round check badge (selected state). */
export const CheckDot: React.FC<D & { size?: number }> = ({ isDark, size = 22 }) => (
    <span className={cn('flex-none rounded-full flex items-center justify-center', isDark ? 'bg-white' : 'bg-[#111111]')} style={{ width: size, height: size }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke={isDark ? '#000' : '#fff'} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
    </span>
);

/** Two-column step body: main (flex 1 1 520px) + sticky preview aside (flex 0 1 360px). Wraps on narrow screens. */
export const StepColumns: React.FC<{ main: React.ReactNode; aside: React.ReactNode }> = ({ main, aside }) => (
    <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-5">{main}</div>
        {aside}
    </div>
);

/** Grey "LIVE PREVIEW" aside panel. Put a <PhonePreview/> and optional extra cards inside. */
export const PreviewPanel: React.FC<PreviewPanelProps & D & { ariaLabel?: string }> = ({ isDark, rightLabel, children, ariaLabel = "Live preview of the client's chat page" }) => (
    <aside
        aria-label={ariaLabel}
        className={cn(
            'flex-[0_1_360px] min-w-[min(100%,352px)] w-full lg:sticky lg:top-5 flex flex-col gap-4 p-3 sm:p-5 rounded-[18px] border box-border',
            isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-[#EDEDED] border-[#DDDDDD]',
        )}
    >
        <div className="flex items-center justify-between gap-2.5">
            <span className={cn('text-xs font-extrabold tracking-[0.08em] uppercase', isDark ? 'text-neutral-300' : 'text-[#333333]')}>Live preview</span>
            <span className={cn('text-xs font-semibold', tone(isDark).muted)}>{rightLabel}</span>
        </div>
        {children}
    </aside>
);

/** White info card used inside the preview panel (e.g. link + plan pills, "How this lead is sorted"). */
export const PanelCard: React.FC<D & { children: React.ReactNode; className?: string }> = ({ isDark, children, className }) => (
    <div className={cn('flex flex-col gap-2.5 p-3.5 rounded-[14px] border', tone(isDark).card, className)}>{children}</div>
);

/** Black highlight used in headings: <Mark>new client</Mark> */
export const Mark: React.FC<D & { children: React.ReactNode }> = ({ isDark, children }) => (
    <mark className={cn('px-2.5 rounded-[10px]', isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')}>{children}</mark>
);

/** Inline SVG icons used across the wizard (stroke = currentColor). */
const I = (d: string, sw = 2.2) => ({ size = 16, className }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={d} /></svg>
);
export const Icon = {
    arrowRight: I('M5 12h14M13 6l6 6-6 6'),
    arrowLeft: I('M19 12H5M11 18l-6-6 6-6'),
    check: I('M5 12l5 5 9-10', 2.6),
    plus: I('M12 5v14M5 12h14'),
    x: I('M6 6l12 12M18 6L6 18'),
    chevronDown: I('M6 9l6 6 6-6'),
    chevronUp: I('M18 15l-6-6-6 6'),
    link: I('M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7', 2),
    upload: I('M12 16V4M7 9l5-5 5 5M4 20h16', 2),
    file: I('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6', 2),
    trash: I('M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3', 2),
    edit: I('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', 2),
    copy: I('M9 9h11v11H9zM5 15H4V4h11v1', 2),
    external: I('M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5', 2),
    alert: I('M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 2),
    sparkle: I('M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z', 1.8),
    eyedropper: I('M2 22l1-1h3l9-9M3 21v-3l9-9M15 6l3-3 3 3-3 3M12 9l3 3', 2),
};
