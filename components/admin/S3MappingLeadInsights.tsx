import React from 'react';
import { Route, CheckCircle2, XCircle, AlertTriangle, ListChecks, Activity } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

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

export const S3MappingLeadInsights: React.FC<S3MappingLeadInsightsProps> = ({ data, isDark = false }) => {
    // Defensive: if data is missing or incomplete, render nothing
    if (!data || typeof data !== 'object') return null;

    const cardBg = isDark ? 'bg-slate-800/50' : 'bg-gradient-to-br from-indigo-50/50 to-blue-50/30';
    const borderColor = isDark ? 'border-indigo-500/20' : 'border-indigo-200/60';
    const textMain = isDark ? 'text-white' : 'text-gray-900';
    const textSub = isDark ? 'text-slate-300' : 'text-gray-700';
    const sectionBg = isDark ? 'bg-slate-900/40' : 'bg-white/70';

    const isDisqualified = !!data.disqualified;
    const VerdictIcon = isDisqualified ? XCircle : CheckCircle2;
    const verdictColor = isDisqualified
        ? (isDark ? 'text-red-400' : 'text-red-600')
        : (isDark ? 'text-emerald-400' : 'text-emerald-600');
    const verdictBg = isDisqualified
        ? (isDark ? 'bg-red-900/20 border-red-500/20' : 'bg-red-50 border-red-200')
        : (isDark ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200');

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

    return (
        <div className={`rounded-xl border ${borderColor} ${cardBg} p-4 space-y-4`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                        <Route size={16} className="text-indigo-500" />
                    </div>
                    <h4 className={`text-sm font-semibold ${textMain}`}>S3 Mapping Intelligence</h4>
                </div>
                <PriorityBadge priority={leadPriority} size="md" />
            </div>

            {/* Verdict Banner */}
            <div className={`rounded-lg border ${verdictBg} p-3 flex items-center gap-3`}>
                <VerdictIcon size={20} className={verdictColor} />
                <div>
                    <span className={`text-sm font-bold ${verdictColor}`}>
                        {isDisqualified ? 'DISQUALIFIED' : 'QUALIFIED TO CONTINUE'}
                    </span>
                    <span className={`text-xs ml-2 ${textSub}`}>
                        Avg Signal: {avgScore.toFixed(1)} / 3.0
                    </span>
                </div>
                {/* Score bar */}
                <div className="flex-1 ml-2">
                    <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                                isDisqualified ? 'bg-red-400' : (scorePercent > 66 ? 'bg-emerald-500' : scorePercent > 33 ? 'bg-amber-400' : 'bg-red-400')
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, scorePercent))}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Signal Breakdown */}
            {Object.keys(breakdown).length > 0 && (
                <div className={`rounded-lg ${sectionBg} p-3`}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Activity size={12} className="text-indigo-500" />
                        <span className={`text-xs font-medium uppercase tracking-wider ${textSub}`}>Signal Insights</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className={`flex flex-col items-center justify-center p-2 rounded-md ${isDark ? 'bg-emerald-900/10 border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-100'}`}>
                            <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{breakdown.high ?? 0}</span>
                            <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>High</span>
                        </div>
                        <div className={`flex flex-col items-center justify-center p-2 rounded-md ${isDark ? 'bg-amber-900/10 border border-amber-500/10' : 'bg-amber-50 border border-amber-100'}`}>
                            <span className={`text-lg font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{breakdown.medium ?? 0}</span>
                            <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-amber-500' : 'text-amber-700'}`}>Medium</span>
                        </div>
                        <div className={`flex flex-col items-center justify-center p-2 rounded-md ${isDark ? 'bg-red-900/10 border border-red-500/10' : 'bg-red-50 border border-red-100'}`}>
                            <span className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{breakdown.low ?? 0}</span>
                            <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-red-500' : 'text-red-700'}`}>Low</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Deterministic Answers */}
            {answers.length > 0 && (
                <div className={`rounded-lg ${sectionBg} p-3`}>
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <ListChecks size={12} className="text-indigo-500" />
                        <span className={`text-xs font-medium uppercase tracking-wider ${textSub}`}>Collected Map Data</span>
                    </div>
                    <ul className="space-y-3">
                        {answers.map((answerObj, i) => {
                            if (!answerObj || typeof answerObj !== 'object') return null;
                            const sigStatus = String(answerObj.signal || '');
                            let sigColor = isDark ? 'text-gray-400' : 'text-gray-500';
                            let sigBg = 'bg-transparent';

                            if (sigStatus === 'high') { sigColor = isDark ? 'text-emerald-400' : 'text-emerald-600'; sigBg = isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'; }
                            if (sigStatus === 'medium') { sigColor = isDark ? 'text-amber-400' : 'text-amber-600'; sigBg = isDark ? 'bg-amber-500/10' : 'bg-amber-50'; }
                            if (sigStatus === 'low') { sigColor = isDark ? 'text-red-400' : 'text-red-500'; sigBg = isDark ? 'bg-red-500/10' : 'bg-red-50'; }
                            if (sigStatus === 'disqualify') { sigColor = isDark ? 'text-purple-400' : 'text-purple-600'; sigBg = isDark ? 'bg-purple-500/10' : 'bg-purple-50'; }

                            const questionText = typeof answerObj.question === 'string' ? answerObj.question : '';
                            const answerText = answerObj.answer !== null && answerObj.answer !== undefined
                                ? String(answerObj.answer)
                                : '—';

                            return (
                                <li key={i} className="flex flex-col gap-1">
                                    {questionText && <span className={`text-xs ${textSub}`}>{questionText}</span>}
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${textMain}`}>{answerText}</span>
                                        {sigStatus && (
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${sigColor} ${sigBg}`}>
                                                {sigStatus}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Auto Disqualification Alert */}
            {isDisqualified && (
                <div className={`rounded-lg border ${isDark ? 'border-red-500/20 bg-red-900/10' : 'border-red-200 bg-red-50/50'} p-3`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle size={12} className="text-red-500" />
                        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                            Auto-Exit Triggered
                        </span>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                        Conversation was terminated immediately due to an exclusionary answer choice.
                    </p>
                </div>
            )}
        </div>
    );
};
