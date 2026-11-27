import React from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { InsightCard, InsightSection, InsightText, ObjectionList, NextStep } from './LeadInsightsParts';

interface S2LeadOutput {
    lead_priority: string;
    reasoning_summary: string;
    key_objections: string[];
    recommended_next_step: string;
}

interface S2LeadInsightsProps {
    data: S2LeadOutput;
    isDark?: boolean;
}

export const S2LeadInsights: React.FC<S2LeadInsightsProps> = ({ data, isDark = false }) => (
    <InsightCard
        isDark={isDark}
        icon={<Brain size={18} strokeWidth={2} />}
        title="S2 Lead Intelligence"
        right={<PriorityBadge isDark={isDark} priority={data.lead_priority} size="md" />}
    >
        {/* Reasoning */}
        <InsightSection isDark={isDark} label="Reasoning">
            <InsightText isDark={isDark}>
                {typeof data.reasoning_summary === 'string' ? data.reasoning_summary : String(data.reasoning_summary || '')}
            </InsightText>
        </InsightSection>

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
