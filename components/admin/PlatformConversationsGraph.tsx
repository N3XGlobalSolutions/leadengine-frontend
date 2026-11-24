import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MessageCircle, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { getPlatformDailyMetrics, PlatformDailyPoint, PlatformDailySummary } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    isDark: boolean;
}

const CustomTooltip = ({ active, payload, label, isDark }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={`px-4 py-3 rounded-2xl shadow-xl border text-sm font-sans backdrop-blur-xl ${
            isDark
                ? 'bg-slate-900/95 border-slate-800 text-white shadow-slate-950/50'
                : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/50'
        }`}>
            <p className={`text-xs font-semibold mb-2 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
            </p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry.name}:</span>
                    </div>
                    <span className="font-extrabold text-sm">{entry.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

export const PlatformConversationsGraph = () => {
    const [data, setData] = useState<PlatformDailyPoint[]>([]);
    const [summary, setSummary] = useState<PlatformDailySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const { isDark } = useAdminTheme();

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getPlatformDailyMetrics(7);
            if (result) {
                setData(result.data);
                setSummary(result.summary);
                setLastRefreshed(new Date());
            }
        } catch (e) {
            console.error('Failed to load platform metrics:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const cardBase = `rounded-2xl p-4 border transition-all ${
        isDark
            ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
            : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
    }`;

    return (
        <div className={`p-6 sm:p-8 rounded-3xl border transition-all shadow-sm ${
            isDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200/80 text-slate-900'
        }`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold tracking-tight">
                        Platform Volume & Engagement
                    </h3>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Aggregated daily conversation & lead volume across all tenant accounts
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className={`p-2.5 rounded-xl border transition-all ${
                            isDark
                                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
                        }`}
                        title="Refresh Data"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : ''} />
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className={cardBase}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Today</span>
                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                <MessageCircle size={16} />
                            </div>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight">
                            {summary.today_conversations.toLocaleString()}
                        </p>
                        <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Conversations</p>
                    </div>

                    <div className={cardBase}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Today</span>
                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
                                <Target size={16} />
                            </div>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight">
                            {summary.today_leads.toLocaleString()}
                        </p>
                        <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Leads Created</p>
                    </div>

                    <div className={cardBase}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>7-Day Total</span>
                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-800'}`}>
                                <TrendingUp size={16} />
                            </div>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight">
                            {summary.period_conversations.toLocaleString()}
                        </p>
                        <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Convos</p>
                    </div>

                    <div className={cardBase}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>7-Day Total</span>
                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-800'}`}>
                                <Target size={16} />
                            </div>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight">
                            {summary.period_leads.toLocaleString()}
                        </p>
                        <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Leads</p>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="h-[280px] w-full">
                {loading ? (
                    <div className={`h-full flex flex-col items-center justify-center gap-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <RefreshCw size={24} className="animate-spin text-emerald-500" />
                        <span className="text-sm font-medium">Fetching conversation trends...</span>
                    </div>
                ) : data.length === 0 || data.every(d => d.conversations === 0 && d.leads === 0) ? (
                    <div className={`h-full flex flex-col items-center justify-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <MessageCircle size={32} className="opacity-30" />
                        <p className="text-sm font-medium">No conversation metrics recorded for this timeframe</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradConversations" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="4 4" 
                                vertical={false} 
                                stroke={isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'} 
                            />
                            <XAxis
                                dataKey="display"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 500 }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip isDark={isDark} />} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                wrapperStyle={{ paddingBottom: '15px' }}
                                formatter={(value) => <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>}
                            />
                            <Area
                                type="monotone"
                                dataKey="conversations"
                                name="Conversations"
                                stroke="#10b981"
                                strokeWidth={3}
                                fill="url(#gradConversations)"
                                activeDot={{ r: 6, stroke: isDark ? '#0f172a' : '#ffffff', strokeWidth: 2, fill: '#10b981' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                name="Leads"
                                stroke="#0284c7"
                                strokeWidth={3}
                                fill="url(#gradLeads)"
                                activeDot={{ r: 6, stroke: isDark ? '#0f172a' : '#ffffff', strokeWidth: 2, fill: '#0284c7' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Footer timestamp */}
            <p className={`text-xs mt-4 text-right font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Last synced at {lastRefreshed.toLocaleTimeString()}
            </p>
        </div>
    );
};

