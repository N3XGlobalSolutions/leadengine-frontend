import React from 'react';
import { Route, CheckCircle2, XCircle, AlertTriangle, ListChecks, Activity } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { cn } from '../../utils/cn';
import { SmallLabel, StatusPill, tone } from './ui/kit';
import type { PillTone } from './ui/kit';
import { InsightCard, InsightSection, VerdictBanner } from './LeadInsightsParts';

interface S3MappingAnswer {
    id?: string;
    question?: string;
    answer?: string;
    signal?: string;
}

interface S3MappingLeadOutput {
    lead_priority?: string;
    avg_signal_score?: number;
    name?: string;
    phone?: string;
    total_questions?: number;
    answers?: S3MappingAnswer[];
    signal_breakdown?: {
        high?: number;
        medium?: number;
        low?: number;
    };
    disqualified?: boolean;
}

interface S3MappingLeadInsightsProps {
    data: S3MappingLeadOutput | null | undefined;
    isDark?: boolean;
}

/** Answer signal → pill tone (high green, medium amber, low red, disqualify purple). */
const SIGNAL_TONE: Record<string, PillTone> = { high: 'green', medium: 'amber', low: 'red', disqualify: 'purple' };

export const S3MappingLeadInsights: React.FC<S3MappingLeadInsightsProps> = ({ data, isDark = false }) => {
    // Defensive: if data is missing or incomplete, render nothing
    if (!data || typeof data !== 'object') return null;

    const isDisqualified = !!data.disqualified;
    const VerdictIcon = isDisqualified ? XCircle : CheckCircle2;

    const avgScore = (() => {
        // Re-compute from signal_breakdown to avoid DynamoDB Decimal → float deserialization issue
        const bd = data.signal_breakdown;
        if (bd && typeof bd === 'object') {
            const high = Number(bd.high ?? 0);
            const medium = Number(bd.medium ?? 0);
            const low = Number(bd.low ?? 0);
            const total = high + medium + low;
            if (total > 0) return Math.round(((high * 3 + medium * 2 + low * 1) / total) * 100) / 100;
        }
        // Fallback to field value if breakdown is missing
        return typeof data.avg_signal_score === 'number' ? data.avg_signal_score : 0;
    })();
    const scorePercent = Math.round((avgScore / 3) * 100);
    const leadPriority = data.lead_priority || 'MEDIUM';
    const answers = Array.isArray(data.answers) ? data.answers : [];
    const breakdown = data.signal_breakdown && typeof data.signal_breakdown === 'object' ? data.signal_breakdown : {};

    const signalTiles: { label: string; value: number; dot: string }[] = [
        { label: 'High', value: breakdown.high ?? 0, dot: '#16A34A' },
        { label: 'Medium', value: breakdown.medium ?? 0, dot: '#D97706' },
        { label: 'Low', value: breakdown.low ?? 0, dot: '#DC2626' },
    ];

    return (
        <InsightCard
            isDark={isDark}
            icon={<Route size={18} strokeWidth={2} />}
            title="S3 Mapping Intelligence"
            right={<PriorityBadge isDark={isDark} priority={leadPriority} size="md" />}
        >
            {/* Verdict Banner */}
            <VerdictBanner
                isDark={isDark}
                qualified={!isDisqualified}
                verdict={isDisqualified ? 'DISQUALIFIED' : 'QUALIFIED TO CONTINUE'}
                icon={<VerdictIcon size={14} strokeWidth={2.4} aria-hidden="true" />}
                metric={<>Avg Signal: <span className={cn('font-extrabold', tone(isDark).text)}>{avgScore.toFixed(1)}</span> / 3.0</>}
                percent={scorePercent}
                level={isDisqualified ? 'low' : (scorePercent > 66 ? 'high' : scorePercent > 33 ? 'mid' : 'low')}
                barLabel="Average signal score"
            />

            {/* Signal Breakdown */}
            {Object.keys(breakdown).length > 0 && (
                <InsightSection isDark={isDark} label="Signal Insights" icon={<Activity size={12} aria-hidden="true" />}>
                    <div className="grid grid-cols-3 gap-2.5">
                        {signalTiles.map((t) => (
                            <div
                                key={t.label}
                                className={cn('flex flex-col gap-1.5 rounded-xl border px-3 py-2.5', isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-[#F7F7F7] border-[#E5E5E5]')}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: t.dot }} />
                                    <SmallLabel isDark={isDark}>{t.label}</SmallLabel>
                                </span>
                                <span className={cn('text-[22px] leading-none font-extrabold tracking-[-0.02em] tabular-nums', tone(isDark).text)}>{t.value}</span>
                            </div>
                        ))}
                    </div>
                </InsightSection>
            )}

            {/* Deterministic Answers */}
            {answers.length > 0 && (
                <InsightSection isDark={isDark} label="Collected Map Data" icon={<ListChecks size={12} aria-hidden="true" />}>
                    <ul className="m-0 p-0 list-none flex flex-col">
                        {answers.map((answerObj, i) => {
                            if (!answerObj || typeof answerObj !== 'object') return null;
                            const sigStatus = String(answerObj.signal || '');

                            const questionText = typeof answerObj.question === 'string' ? answerObj.question : '';
                            const answerText = answerObj.answer !== null && answerObj.answer !== undefined
                                ? String(answerObj.answer)
                                : '—';

                            return (
                                <li
                                    key={i}
                                    className={cn('flex flex-col gap-1 py-2.5 border-b first:pt-0 last:pb-0 last:border-b-0', isDark ? 'border-neutral-800' : 'border-[#EEEEEE]')}
                                >
                                    {questionText && <span className={cn('text-[12.5px] leading-[1.45]', tone(isDark).muted)}>{questionText}</span>}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={cn('text-sm font-bold', tone(isDark).text)}>{answerText}</span>
                                        {sigStatus && (
                                            <StatusPill
                                                isDark={isDark}
                                                tone={SIGNAL_TONE[sigStatus] ?? 'grey'}
                                                className="h-[22px] px-2 text-[10.5px] uppercase tracking-[0.06em]"
                                            >
                                                {sigStatus}
                                            </StatusPill>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </InsightSection>
            )}

            {/* Auto Disqualification Alert */}
            {isDisqualified && (
                <div className={cn('flex items-start gap-3 rounded-xl border p-4', isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-[#FEF2F2] border-[#FECACA]')}>
                    <AlertTriangle size={16} className={cn('flex-none mt-px', isDark ? 'text-red-300' : 'text-[#B91C1C]')} aria-hidden="true" />
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className={cn('text-[11.5px] font-bold tracking-[0.08em] uppercase', isDark ? 'text-red-300' : 'text-[#991B1B]')}>
                            Auto-Exit Triggered
                        </span>
                        <p className={cn('m-0 text-sm font-semibold leading-[1.5]', isDark ? 'text-red-200' : 'text-[#7F1D1D]')}>
                            Conversation was terminated immediately due to an exclusionary answer choice.
                        </p>
                    </div>
                </div>
            )}
        </InsightCard>
    );
};
