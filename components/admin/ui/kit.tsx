/**
 * Admin design kit (v2 "LeadEngine" black/white design).
 * Light mode = exact design tokens; dark mode = inverted neutral palette. Every component takes `isDark`.
 * Re-exports the onboarding primitives so pages import everything from one place.
 */
import React from 'react';
import { cn } from '../../../utils/cn';
import { tone, Icon } from '../onboarding/ui';

export {
    Card, CardHeader, Field, Input, Textarea, Button, buttonClass, inputClass, TechTag, Hint, Pill, Switch,
    CheckDot, Mark, Icon, tone, PanelCard,
} from '../onboarding/ui';
export type { BtnVariant } from '../onboarding/ui';

type D = { isDark: boolean };

/* ── Page layout ─────────────────────────────────────────────────────────── */

/** Centered page body: max 1160px, 24px vertical gap, Plus Jakarta Sans. AdminLayout supplies the outer padding. */
export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn('w-full max-w-[1160px] mx-auto flex flex-col gap-6 font-jakarta', className)}>{children}</div>
);

/** Small uppercase eyebrow pill above a page title, e.g. "Tenant Management". */
export const Eyebrow: React.FC<D & { children: React.ReactNode; icon?: React.ReactNode }> = ({ isDark, children, icon }) => (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[0.08em] uppercase rounded-full px-3 py-[5px]',
        isDark ? 'bg-neutral-800 text-white' : 'bg-[#F2F2F2] text-black')}>
        {icon}{children}
    </span>
);

/**
 * Page header: eyebrow row (+ optional badge), 38px/800 title (use <Mark> for the highlighted word),
 * 16px description, actions on the right.
 */
export const PageHeader: React.FC<D & {
    eyebrow?: React.ReactNode;
    eyebrowIcon?: React.ReactNode;
    badge?: React.ReactNode;          // e.g. <StatusPill tone="out">5 total</StatusPill>
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}> = ({ isDark, eyebrow, eyebrowIcon, badge, title, description, actions }) => (
    <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5 items-start min-w-0">
            {(eyebrow || badge) && (
                <span className="flex flex-wrap items-center gap-2 mb-2.5">
                    {eyebrow && <Eyebrow isDark={isDark} icon={eyebrowIcon}>{eyebrow}</Eyebrow>}
                    {badge}
                </span>
            )}
            <h1 className={cn('m-0 text-[30px] sm:text-[38px] leading-[1.1] font-extrabold tracking-[-0.035em]', tone(isDark).text)}>{title}</h1>
            {description && <p className={cn('m-0 text-base leading-[1.55] max-w-[640px]', tone(isDark).muted)}>{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
);

/* ── Pills / badges ──────────────────────────────────────────────────────── */

export type PillTone = 'green' | 'amber' | 'red' | 'orange' | 'purple' | 'grey' | 'on' | 'out' | 'soft';

const PILL_TONES: Record<PillTone, { light: string; dark: string }> = {
    green: { light: 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]', dark: 'bg-green-500/10 text-green-300 border border-green-500/30' },
    amber: { light: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]', dark: 'bg-amber-500/10 text-amber-300 border border-amber-500/30' },
    red: { light: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]', dark: 'bg-red-500/10 text-red-300 border border-red-500/30' },
    orange: { light: 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]', dark: 'bg-orange-500/10 text-orange-300 border border-orange-500/30' },
    purple: { light: 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]', dark: 'bg-purple-500/10 text-purple-300 border border-purple-500/30' },
    grey: { light: 'bg-[#F2F2F2] text-[#404040] border border-[#E5E5E5]', dark: 'bg-neutral-800 text-neutral-300 border border-neutral-700' },
    on: { light: 'bg-[#0A0A0A] text-white', dark: 'bg-white text-black' },
    out: { light: 'bg-white text-[#333333] border border-[#D4D4D4]', dark: 'bg-transparent text-neutral-200 border border-neutral-700' },
    soft: { light: 'bg-[#F2F2F2] text-[#333333]', dark: 'bg-neutral-800 text-neutral-200' },
};

/** 26px rounded pill (design `.pill`). */
export const StatusPill: React.FC<D & { tone: PillTone; children: React.ReactNode; className?: string; dot?: string }> = ({ isDark, tone: t, children, className, dot }) => (
    <span className={cn('inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full text-xs font-bold whitespace-nowrap', isDark ? PILL_TONES[t].dark : PILL_TONES[t].light, className)}>
        {dot && <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: dot }} />}
        {children}
    </span>
);

/** Client/tenant status → tone (design: Active green, Onboarding amber, Paused orange, Inactive red). */
export const clientStatusTone = (status?: string): PillTone =>
    ({ active: 'green', onboarding: 'amber', paused: 'orange', inactive: 'red' } as Record<string, PillTone>)[(status || '').toLowerCase()] ?? 'grey';

/** Lead status → tone (Qualified green, Disqualified red, New grey). */
export const leadStatusTone = (status?: string): PillTone =>
    ({ qualified: 'green', disqualified: 'red', new: 'grey' } as Record<string, PillTone>)[(status || '').toLowerCase()] ?? 'grey';

/** Lead priority → tone + dot colour (Hot green, Warm amber, Cold grey). Accepts "hot", "Hot Lead", "HOT"… */
export const priorityTone = (priority?: string): { tone: PillTone; dot: string } => {
    const p = (priority || '').toLowerCase();
    if (p.includes('hot')) return { tone: 'green', dot: '#16A34A' };
    if (p.includes('warm')) return { tone: 'amber', dot: '#D97706' };
    return { tone: 'grey', dot: '#737373' };
};

/* ── Filters & controls ──────────────────────────────────────────────────── */

/** Rounded filter chip (38px). Selected = black. Optional count bubble. */
export const FilterChip: React.FC<D & { selected: boolean; onClick: () => void; children: React.ReactNode; count?: number | string }> = ({ isDark, selected, onClick, children, count }) => (
    <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={onClick}
        className={cn('inline-flex items-center gap-2 min-h-[38px] px-3.5 rounded-full cursor-pointer text-[13px] font-bold border transition-colors',
            selected
                ? (isDark ? 'bg-white text-black border-white' : 'bg-[#0A0A0A] text-white border-[#0A0A0A]')
                : (isDark ? 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800' : 'bg-white text-[#333333] border-[#E5E5E5] hover:bg-[#F7F7F7]'))}
    >
        {children}
        {count !== undefined && (
            <span className={cn('text-[11.5px] px-[7px] py-px rounded-full',
                selected ? (isDark ? 'bg-black/15 text-black' : 'bg-white/20 text-white') : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-[#F2F2F2] text-[#525252]'))}>{count}</span>
        )}
    </button>
);

/** Segmented control on a grey track (e.g. Grid | List). */
export function Segmented<T extends string>({ isDark, value, onChange, options, ariaLabel }: D & {
    value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; ariaLabel: string;
}) {
    return (
        <div role="tablist" aria-label={ariaLabel} className={cn('flex gap-1 p-1 rounded-[10px]', isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]')}>
            {options.map((o) => {
                const on = o.value === value;
                return (
                    <button key={o.value} type="button" role="tab" aria-selected={on} onClick={() => onChange(o.value)}
                        className={cn('inline-flex items-center gap-1.5 min-h-[32px] px-3 rounded-lg border-none cursor-pointer text-[12.5px] font-bold',
                            on ? (isDark ? 'bg-neutral-950 text-white shadow-sm' : 'bg-white text-[#0A0A0A] shadow-[0_1px_2px_rgba(0,0,0,.12)]') : (isDark ? 'bg-transparent text-neutral-400' : 'bg-transparent text-[#525252]'))}>
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** 40px search box with magnifier icon. */
export const SearchField: React.FC<D & {
    value: string; onChange: (v: string) => void; placeholder?: string; label: string; className?: string; id?: string;
}> = ({ isDark, value, onChange, placeholder, label, className, id }) => {
    const autoId = React.useId();
    const inputId = id || autoId;
    return (
        <div className={cn('flex items-center gap-2 h-10 px-3 rounded-[10px] border-[1.5px] focus-within:ring-[3px]',
            isDark ? 'border-neutral-700 bg-neutral-950 focus-within:border-white focus-within:ring-white/15' : 'border-[#E5E5E5] bg-white focus-within:border-[#111111] focus-within:ring-black/10', className)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={tone(isDark).hint}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <label className="sr-only" htmlFor={inputId}>{label}</label>
            <input id={inputId} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                className={cn('flex-1 min-w-0 border-none outline-none bg-transparent text-[13.5px] font-medium', isDark ? 'text-white placeholder-neutral-500' : 'text-[#0A0A0A] placeholder-[#A3A3A3]')} />
        </div>
    );
};

/** Native select styled like the design `.sel` (42px, chevron). Pass size="sm" for the 36px variant. */
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & D & { size?: 'md' | 'sm' }> = ({ isDark, size = 'md', className, children, ...rest }) => (
    <select
        {...rest}
        className={cn('appearance-none rounded-[10px] border-[1.5px] pl-3 pr-9 font-semibold cursor-pointer bg-no-repeat focus:outline-none focus:ring-[3px]',
            size === 'sm' ? 'h-9 text-[12.5px]' : 'h-[42px] text-[13.5px]',
            isDark ? 'bg-neutral-950 border-neutral-700 text-white focus:ring-white/15' : 'bg-white border-[#E5E5E5] text-[#0A0A0A] focus:border-[#111111] focus:ring-black/10',
            className)}
        style={{
            backgroundImage: `linear-gradient(45deg,transparent 50%,${isDark ? '#a3a3a3' : '#525252'} 50%),linear-gradient(135deg,${isDark ? '#a3a3a3' : '#525252'} 50%,transparent 50%)`,
            backgroundPosition: 'calc(100% - 18px) 50%, calc(100% - 13px) 50%',
            backgroundSize: '5px 5px, 5px 5px',
            ...(rest.style || {}),
        }}
    >
        {children}
    </select>
);

/** 40x40 bordered icon button (design `.ib`). */
export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & D & { label: string; size?: number }> = ({ isDark, label, size = 40, className, type = 'button', children, ...rest }) => (
    <button type={type} aria-label={label} title={label} {...rest}
        className={cn('flex-none rounded-[10px] border flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50',
            isDark ? 'border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800' : 'border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-[#F7F7F7]', className)}
        style={{ width: size, height: size }}>
        {children}
    </button>
);

/** Small uppercase label (design `.lab`). */
export const SmallLabel: React.FC<D & { children: React.ReactNode; className?: string }> = ({ isDark, children, className }) => (
    <span className={cn('text-[11.5px] font-bold tracking-[0.08em] uppercase', tone(isDark).hint, className)}>{children}</span>
);

/** Mono text (slugs, ids). */
export const Mono: React.FC<D & { children: React.ReactNode; className?: string }> = ({ isDark, children, className }) => (
    <span className={cn('font-techmono text-xs', tone(isDark).muted, className)}>{children}</span>
);

/** Square initials tile (40px default, 34px in tables). */
export const InitialTile: React.FC<D & { name?: string; size?: number; round?: boolean }> = ({ isDark, name, size = 40, round }) => (
    <span className={cn('flex-none flex items-center justify-center font-extrabold border', round ? 'rounded-full' : 'rounded-[10px]',
        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#F2F2F2] border-[#E5E5E5] text-[#0A0A0A]')}
        style={{ width: size, height: size, fontSize: size <= 34 ? 13 : 15 }}>
        {(name || '?').trim().charAt(0).toUpperCase() || '?'}
    </span>
);

/* ── Tables ──────────────────────────────────────────────────────────────── */

/** White card with no padding that holds a horizontally scrollable table. */
export const TableCard: React.FC<D & { children: React.ReactNode; footer?: React.ReactNode; className?: string }> = ({ isDark, children, footer, className }) => (
    <section className={cn('rounded-2xl border overflow-hidden', tone(isDark).card, className)}>
        <div className="overflow-x-auto">{children}</div>
        {footer && <div className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t text-[12.5px] font-semibold', tone(isDark).border, tone(isDark).muted)}>{footer}</div>}
    </section>
);

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>
);

export const Th: React.FC<D & React.ThHTMLAttributes<HTMLTableCellElement>> = ({ isDark, className, ...rest }) => (
    <th {...rest} className={cn('text-left text-xs font-bold tracking-[0.04em] uppercase px-4 py-3 border-b whitespace-nowrap', tone(isDark).hint, tone(isDark).border, className)} />
);

export const Td: React.FC<D & React.TdHTMLAttributes<HTMLTableCellElement>> = ({ isDark, className, ...rest }) => (
    <td {...rest} className={cn('px-4 py-3.5 border-b align-middle', isDark ? 'border-neutral-800 text-white' : 'border-[#EEEEEE] text-[#0A0A0A]', className)} />
);

/** Row hover + last-row border removal: put on <tr>. */
export const trClass = (isDark: boolean, clickable = false) =>
    cn('[&:last-child>td]:border-b-0', clickable && 'cursor-pointer', clickable && (isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-[#FAFAFA]'));

/* ── States ──────────────────────────────────────────────────────────────── */

export const EmptyState: React.FC<D & { title: string; description?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }> = ({ isDark, title, description, action, icon }) => (
    <div className={cn('flex flex-col items-center justify-center text-center gap-2 py-14 px-6 rounded-2xl border border-dashed', isDark ? 'border-neutral-700' : 'border-[#D4D4D4]')}>
        {icon && <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-1', isDark ? 'bg-neutral-800 text-white' : 'bg-[#F2F2F2] text-[#0A0A0A]')}>{icon}</span>}
        <p className={cn('m-0 text-[15px] font-extrabold', tone(isDark).text)}>{title}</p>
        {description && <p className={cn('m-0 text-sm max-w-[420px]', tone(isDark).muted)}>{description}</p>}
        {action && <div className="mt-2">{action}</div>}
    </div>
);

/** Plain list footer "SHOWING ALL N OF M CLIENTS" style text. */
export const ListFooterText: React.FC<D & { children: React.ReactNode }> = ({ isDark, children }) => (
    <span className={cn('text-[11.5px] font-bold tracking-[0.08em] uppercase', tone(isDark).hint)}>{children}</span>
);

export const Kit = { Icon };
