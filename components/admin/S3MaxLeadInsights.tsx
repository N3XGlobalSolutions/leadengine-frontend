import React from 'react';
import { Brain, AlertTriangle, ArrowRight, Target, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

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
    const cardBg = isDark ? 'bg-slate-800/50' : 'bg-gradient-to-br from-cyan-50/50 to-blue-50/30';
    const borderColor = isDark ? 'border-cyan-500/20' : 'border-cyan-200/60';
    const textMain = isDark ? 'text-white' : 'text-gray-900';
    const textSub = isDark ? 'text-slate-300' : 'text-gray-700';
    const sectionBg = isDark ? 'bg-slate-900/40' : 'bg-white/70';

    const isQualified = data.verdict === 'QUALIFIED';
    const VerdictIcon = isQualified ? CheckCircle2 : XCircle;
    const verdictColor = isQualified
        ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
        : (isDark ? 'text-red-400' : 'text-red-600');
    const verdictBg = isQualified
        ? (isDark ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
        : (isDark ? 'bg-red-900/20 border-red-500/20' : 'bg-red-50 border-red-200');

    const scorePercent = Math.round(data.qualification_score || 0);

    return (
        <div className={`rounded-xl border ${borderColor} ${cardBg} p-4 space-y-4`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                        <Brain size={16} className="text-cyan-500" />
                    </div>
                    <h4 className={`text-sm font-semibold ${textMain}`}>S3 Max AI Intelligence</h4>
                </div>
                <PriorityBadge priority={data.lead_priority} size="md" />
            </div>

            {/* Verdict Banner */}
            <div className={`rounded-lg border ${verdictBg} p-3 flex items-center gap-3`}>
                <VerdictIcon size={20} className={verdictColor} />
                <div>
                    <span className={`text-sm font-bold ${verdictColor}`}>
                        {data.verdict}
                    </span>
                    <span className={`text-xs ml-2 ${textSub}`}>
                        Confidence: {scorePercent}%
                    </span>
                </div>
                {/* Score bar */}
                <div className="flex-1 ml-2">
                    <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                                isQualified ? 'bg-emerald-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${scorePercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Reasoning */}
            <div className={`rounded-lg ${sectionBg} p-3`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-xs font-medium uppercase tracking-wider ${textSub}`}>AI Reasoning</span>
                </div>
                <p className={`text-sm leading-relaxed ${textMain}`}>
                    {typeof data.reasoning_summary === 'string' ? data.reasoning_summary : String(data.reasoning_summary || '')}
                </p>
            </div>

            {/* Dimension Scores */}
            {data.dimension_scores && Object.keys(data.dimension_scores).length > 0 && (
                <div className={`rounded-lg ${sectionBg} p-3`}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <BarChart3 size={12} className="text-cyan-500" />
                        <span className={`text-xs font-medium uppercase tracking-wider ${textSub}`}>Dimension Analysis</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 items-center">
                        {Object.entries(data.dimension_scores).map(([dim, info]) => (
                            <React.Fragment key={dim}>
                                <span className={`text-xs font-medium whitespace-nowrap capitalize ${textMain}`}>
                                    {dim.replace(/_/g, ' ')}
                                </span>
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    <div
                                        className={`h-2 rounded-full ${
                                            info.score >= 70 ? 'bg-emerald-500' :
                                            info.score >= 40 ? 'bg-amber-400' : 'bg-red-400'
                                        }`}
                                        style={{ width: `${info.score}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-bold w-8 text-right ${textMain}`}>{info.score}%</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Key Objections */}
            {data.key_objections && Array.isArray(data.key_objections) && data.key_objections.length > 0 && (
                <div className={`rounded-lg ${sectionBg} p-3`}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <span className={`text-xs font-medium uppercase tracking-wider ${textSub}`}>Key Objections</span>
                    </div>
                    <ul className="space-y-1.5">
                        {data.key_objections.map((objection, i) => (
                            <li key={i} className={`flex items-start gap-2 text-sm ${textMain}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                {typeof objection === 'string' ? objection : String(objection)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommended Next Step */}
            <div className={`rounded-lg border ${isDark ? 'border-emerald-500/20 bg-emerald-900/10' : 'border-emerald-200 bg-emerald-50/50'} p-3`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <ArrowRight size={12} className="text-emerald-500" />
                    <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        Recommended Next Step
                    </span>
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                    {typeof data.recommended_next_step === 'string' ? data.recommended_next_step : String(data.recommended_next_step || '')}
                </p>
            </div>
        </div>
    );
};
