import React from 'react';
import { Brain, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

interface S3LeadOutput {
    lead_priority: string;
    reasoning_summary: string;
    key_objections: string[];
    recommended_next_step: string;
}

interface S3LeadInsightsProps {
    data: S3LeadOutput;
    isDark?: boolean;
}

export const S3LeadInsights: React.FC<S3LeadInsightsProps> = ({ data, isDark = false }) => {
    const cardBg = isDark ? 'bg-slate-800/50' : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/30';
    const borderColor = isDark ? 'border-indigo-500/20' : 'border-indigo-200/60';
    const textMain = isDark ? 'text-white' : 'text-gray-900';
    const textSub = isDark ? 'text-slate-400' : 'text-gray-600';
    const sectionBg = isDark ? 'bg-slate-900/40' : 'bg-white/70';

    return (
        <div className={`rounded-xl border ${borderColor} ${cardBg} p-4 space-y-4`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                        <Brain size={16} className="text-indigo-500" />
                    </div>
                    <h4 className={`text-sm font-semibold ${textMain}`}>S3 Lead Intelligence</h4>
                </div>
                <PriorityBadge priority={data.lead_priority} size="md" />
            </div>

            {/* Reasoning */}
            <div className={`rounded-lg ${sectionBg} p-3`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={12} className="text-indigo-500" />
                    <span className={`text-xs font-medium uppercase tracking-wider ${textSub}`}>Reasoning</span>
                </div>
                <p className={`text-sm leading-relaxed ${textMain}`}>
                    {typeof data.reasoning_summary === 'string' ? data.reasoning_summary : String(data.reasoning_summary || '')}
                </p>
            </div>

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
