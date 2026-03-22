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
        <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm ${isDark
            ? 'bg-slate-800 border-slate-700 text-white'
            : 'bg-white border-gray-100 text-gray-900'
            }`}>
            <p className={`font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{entry.name}:</span>
                    <span className="font-bold">{entry.value.toLocaleString()}</span>
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

    const cardBase = `rounded-xl p-4 border flex items-center gap-3 ${isDark
        ? 'bg-slate-700/50 border-slate-600'
        : 'bg-gray-50 border-gray-100'}`;

    return (
        <div className={`p-6 rounded-xl shadow-sm border transition-colors ${isDark
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-100'
            }`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Platform Conversations
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Total conversations &amp; leads across all clients
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className={`p-2 rounded-lg border transition-colors ${isDark
                            ? 'border-slate-600 hover:bg-slate-700 text-slate-400'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                            }`}
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className={cardBase}>
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                            <MessageCircle size={18} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Today</p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {summary.today_conversations.toLocaleString()}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Conversations</p>
                        </div>
                    </div>
                    <div className={cardBase}>
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                            <Target size={18} className="text-indigo-500" />
                        </div>
                        <div>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Today</p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {summary.today_leads.toLocaleString()}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Leads</p>
                        </div>
                    </div>
                    <div className={cardBase}>
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                            <TrendingUp size={18} className="text-blue-500" />
                        </div>
                        <div>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>7 Days</p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {summary.period_conversations.toLocaleString()}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Total Convos</p>
                        </div>
                    </div>
                    <div className={cardBase}>
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/40' : 'bg-purple-50'}`}>
                            <Target size={18} className="text-purple-500" />
                        </div>
                        <div>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>7 Days</p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {summary.period_leads.toLocaleString()}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Total Leads</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="h-[260px] w-full">
                {loading ? (
                    <div className={`h-full flex flex-col items-center justify-center gap-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        <RefreshCw size={24} className="animate-spin" />
                        <span className="text-sm">Loading platform data...</span>
                    </div>
                ) : data.length === 0 || data.every(d => d.conversations === 0 && d.leads === 0) ? (
                    <div className={`h-full flex flex-col items-center justify-center gap-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        <MessageCircle size={32} className="opacity-30" />
                        <p className="text-sm">No conversation data yet for this period</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradConversations" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E5E7EB'} />
                            <XAxis
                                dataKey="display"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip isDark={isDark} />} />
                            <Legend
                                formatter={(value) => <span style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}>{value}</span>}
                            />
                            <Area
                                type="monotone"
                                dataKey="conversations"
                                name="Conversations"
                                stroke="#10B981"
                                strokeWidth={2.5}
                                fill="url(#gradConversations)"
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                name="Leads"
                                stroke="#6366F1"
                                strokeWidth={2.5}
                                fill="url(#gradLeads)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Footer timestamp */}
            <p className={`text-xs mt-3 text-right ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>
                Updated {lastRefreshed.toLocaleTimeString()}
            </p>
        </div>
    );
};
