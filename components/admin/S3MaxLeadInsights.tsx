import React from 'react';
import { Brain, AlertTriangle, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { cn } from '../../utils/cn';
import { tone } from './ui/kit';
import { InsightCard, InsightSection, InsightText, ObjectionList, NextStep, ScoreBar, VerdictBanner } from './LeadInsightsParts';

interface DimensionScore {
    score: number;
    notes: string;
}

interface S3MaxLeadOutput {
    verdict: string;
    lead_priority: string;
    reasoning_summary: string;
    key_objections: string[];
    recommended_next_step: string;
    qualification_score: number;
    dimension_scores?: Record<string, DimensionScore>;
}

interface S3MaxLeadInsightsProps {
    data: S3MaxLeadOutput;
    isDark?: boolean;
}

export const S3MaxLeadInsights: React.FC<S3MaxLeadInsightsProps> = ({ data, isDark = false }) => {
    const isQualified = data.verdict === 'QUALIFIED';
    const VerdictIcon = isQualified ? CheckCircle2 : XCircle;

    const scorePercent = Math.round(data.qualification_score || 0);

    return (
        <InsightCard
            isDark={isDark}
            icon={<Brain size={18} strokeWidth={2} />}
            title="S3 Max AI Intelligence"
            right={<PriorityBadge isDark={isDark} priority={data.lead_priority} size="md" />}
        >
            {/* Verdict Banner */}
            <VerdictBanner
                isDark={isDark}
                qualified={isQualified}
                verdict={data.verdict}
                icon={<VerdictIcon size={14} strokeWidth={2.4} aria-hidden="true" />}
                metric={<>Confidence: <span className={cn('font-extrabold', tone(isDark).text)}>{scorePercent}%</span></>}
                percent={scorePercent}
                barLabel="Qualification confidence"
            />

            {/* Reasoning */}
            <InsightSection isDark={isDark} label="AI Reasoning">
                <InsightText isDark={isDark}>
                    {typeof data.reasoning_summary === 'string' ? data.reasoning_summary : String(data.reasoning_summary || '')}
                </InsightText>
            </InsightSection>

            {/* Dimension Scores */}
            {data.dimension_scores && Object.keys(data.dimension_scores).length > 0 && (
                <InsightSection isDark={isDark} label="Dimension Analysis" icon={<BarChart3 size={12} aria-hidden="true" />}>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 items-center">
                        {Object.entries(data.dimension_scores).map(([dim, info]) => (
                            <React.Fragment key={dim}>
                                <span className={cn('text-[13px] font-semibold whitespace-nowrap capitalize', tone(isDark).text)}>
                                    {dim.replace(/_/g, ' ')}
                                </span>
                                <ScoreBar
                                    isDark={isDark}
                                    percent={info.score}
                                    level={info.score >= 70 ? 'high' : info.score >= 40 ? 'mid' : 'low'}
                                    label={dim.replace(/_/g, ' ')}
                                />
                                <span className={cn('text-[12.5px] font-extrabold w-10 text-right tabular-nums', tone(isDark).text)}>{info.score}%</span>
                            </React.Fragment>
                        ))}
                    </div>
                </InsightSection>
            )}

            {/* Key Objections */}
            {data.key_objections && Array.isArray(data.key_objections) && data.key_objections.length > 0 && (
                <InsightSection isDark={isDark} label="Key Objections" icon={<AlertTriangle size={12} className="text-[#D97706]" aria-hidden="true" />}>
                    <ObjectionList isDark={isDark} items={data.key_objections} />
                </InsightSection>
            )}

            {/* Recommended Next Step */}
            <NextStep isDark={isDark}>
                {typeof data.recommended_next_step === 'string' ? data.recommended_next_step : String(data.recommended_next_step || '')}
            </NextStep>
        </InsightCard>
    );
};
