/**
 * Shared building blocks for the lead-insight cards (S2 / S3 / S3 Max / S3 Mapping) in the v2 black/white design.
 * Every part takes `isDark` from its parent card, which gets it as a prop from the page.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SmallLabel, StatusPill, tone } from './ui/kit';

type D = { isDark: boolean };

/** Divider colour between sections inside a card (design table-row grey). */
const divider = (isDark: boolean) => (isDark ? 'border-neutral-800' : 'border-[#EEEEEE]');

/** Grey inset panel used for the verdict banner and the next step. */
const softPanel = (isDark: boolean) =>
    cn('rounded-xl border', isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-[#F7F7F7] border-[#E5E5E5]');

/** White card (16px radius, #E5E5E5 border): icon tile + 18px/800 title on the left, `right` (priority pill) on the right. */
export const InsightCard: React.FC<D & { icon: React.ReactNode; title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }> = ({
    isDark, icon, title, right, children,
}) => (
    <div className={cn('rounded-2xl border p-5 sm:p-6 flex flex-col gap-[18px] font-jakarta', tone(isDark).card)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <span
                    aria-hidden="true"
                    className={cn('w-10 h-10 flex-none rounded-[10px] border flex items-center justify-center',
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#F2F2F2] border-[#E5E5E5] text-[#0A0A0A]')}
                >
                    {icon}
                </span>
                <h4 className={cn('m-0 text-[18px] leading-tight font-extrabold tracking-[-0.02em]', tone(isDark).text)}>{title}</h4>
            </div>
            {right}
        </div>
        {children}
    </div>
);

/** A labelled section with a hairline divider above it. */
export const InsightSection: React.FC<D & { label: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode }> = ({ isDark, label, icon, children }) => (
    <div className={cn('flex flex-col gap-2.5 border-t pt-[18px]', divider(isDark))}>
        <SmallLabel isDark={isDark} className="inline-flex items-center gap-1.5">
            {icon}
            {label}
        </SmallLabel>
        {children}
    </div>
);

/** Body copy inside a section (reasoning text). */
export const InsightText: React.FC<D & { children: React.ReactNode }> = ({ isDark, children }) => (
    <p className={cn('m-0 text-sm leading-[1.6]', isDark ? 'text-neutral-200' : 'text-[#333333]')}>{children}</p>
);

/** Bulleted objections list (amber dots = warning tone). */
export const ObjectionList: React.FC<D & { items: unknown[] }> = ({ isDark, items }) => (
    <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {items.map((objection, i) => (
            <li key={i} className={cn('flex items-start gap-2.5 text-sm leading-[1.5]', tone(isDark).text)}>
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full mt-[7px] flex-none bg-[#D97706]" />
                {typeof objection === 'string' ? objection : String(objection)}
            </li>
        ))}
    </ul>
);

/** Highlighted "Recommended next step" panel with a black arrow badge. */
export const NextStep: React.FC<D & { children: React.ReactNode }> = ({ isDark, children }) => (
    <div className={cn(softPanel(isDark), 'flex items-start gap-3 p-4')}>
        <span
            aria-hidden="true"
            className={cn('w-8 h-8 flex-none rounded-full flex items-center justify-center', isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')}
        >
            <ArrowRight size={15} strokeWidth={2.4} />
        </span>
        <div className="flex flex-col gap-1 min-w-0 pt-0.5">
            <SmallLabel isDark={isDark}>Recommended Next Step</SmallLabel>
            <p className={cn('m-0 text-sm font-bold leading-[1.5]', tone(isDark).text)}>{children}</p>
        </div>
    </div>
);

export type ScoreLevel = 'high' | 'mid' | 'low';

const FILL: Record<ScoreLevel, { light: string; dark: string }> = {
    high: { light: 'bg-[#0A0A0A]', dark: 'bg-white' },
    mid: { light: 'bg-[#737373]', dark: 'bg-neutral-400' },
    low: { light: 'bg-[#A3A3A3]', dark: 'bg-neutral-600' },
};

/** 8px progress bar on a grey track. Fill is black → grey by level (design chart palette). */
export const ScoreBar: React.FC<D & { percent: number; level?: ScoreLevel; label: string; className?: string }> = ({
    isDark, percent, level = 'high', label, className,
}) => {
    const value = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(value)}
            className={cn('w-full h-2 rounded-full overflow-hidden', isDark ? 'bg-neutral-800' : 'bg-[#EEEEEE]', className)}
        >
            <div
                className={cn('h-full rounded-full transition-all duration-500', isDark ? FILL[level].dark : FILL[level].light)}
                style={{ width: `${value}%` }}
            />
        </div>
    );
};

/** "QUALIFIED_TO CONTINUE" → "Qualified to continue" (design pills use sentence case). */
const sentenceCase = (value: unknown): string => {
    const s = String(value ?? '').replace(/_/g, ' ').trim().toLowerCase();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

/**
 * Verdict banner: Qualified (green) / Disqualified (red) pill + metric on the right, score bar underneath.
 * `verdict` is shown in sentence case ("QUALIFIED" → "Qualified").
 */
export const VerdictBanner: React.FC<D & {
    qualified: boolean;
    verdict: unknown;
    icon: React.ReactNode;
    metric: React.ReactNode;     // e.g. <>Confidence <b>82%</b></>
    percent: number;
    level?: ScoreLevel;
    barLabel: string;
}> = ({ isDark, qualified, verdict, icon, metric, percent, level, barLabel }) => (
    <div className={cn(softPanel(isDark), 'flex flex-col gap-3 p-4')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusPill isDark={isDark} tone={qualified ? 'green' : 'red'}>
                {icon}
                {sentenceCase(verdict)}
            </StatusPill>
            <span className={cn('text-[12.5px] font-semibold', tone(isDark).muted)}>{metric}</span>
        </div>
        <ScoreBar isDark={isDark} percent={percent} level={level} label={barLabel} />
    </div>
);
