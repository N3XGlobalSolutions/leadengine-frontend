import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getClients } from '../../services/adminService';
import { OnboardingData } from '../../types/admin';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { TrendingUp, Users } from 'lucide-react';

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
            <p className={`text-xs font-semibold mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
            </p>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium">New Clients:</span>
                <span className="font-extrabold text-base">{payload[0]?.value}</span>
            </div>
        </div>
    );
};

export const ClientOnboardingGraph = () => {
    const [data, setData] = useState<OnboardingData[]>([]);
    const [range, setRange] = useState<'7d' | '30d'>('7d');
    const [loading, setLoading] = useState(true);
    const { isDark } = useAdminTheme();

    useEffect(() => {
        const calculateOnboardingStats = async () => {
            setLoading(true);
            try {
                const clients = await getClients();
                const days = range === '7d' ? 7 : 30;
                const stats: Record<string, number> = {};
                const chartData: OnboardingData[] = [];
                const today = new Date();

                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];

                    const displayLabel = range === '7d'
                        ? d.toLocaleDateString('en-US', { weekday: 'short' })
                        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    stats[dateStr] = 0;
                    chartData.push({ date: displayLabel, count: 0, _fullDate: dateStr } as any);
                }

                clients.forEach(client => {
                    const onboardingDate = client.onboardedDate;
                    if (stats.hasOwnProperty(onboardingDate)) {
                        stats[onboardingDate]++;
                        const dataPoint = chartData.find((p: any) => p._fullDate === onboardingDate);
                        if (dataPoint) dataPoint.count++;
                    }
                });

                setData(chartData);
            } catch (error) {
                console.error("Failed to calculate onboarding stats:", error);
            } finally {
                setLoading(false);
            }
        };

        calculateOnboardingStats();
    }, [range]);

    const totalPeriodCount = data.reduce((acc, curr) => acc + (curr.count || 0), 0);

    return (
        <div className={`p-6 sm:p-8 rounded-3xl border transition-all shadow-sm ${
            isDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200/80 text-slate-900'
        }`}>
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold tracking-tight">Client Growth</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            +{totalPeriodCount} added
                        </span>
                    </div>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Onboarding trajectory across the selected period
                    </p>
                </div>

                {/* Range Toggle Buttons */}
                <div className={`flex rounded-xl p-1 border ${
                    isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-100 border-slate-200/80'
                }`}>
                    <button
                        onClick={() => setRange('7d')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            range === '7d'
                                ? (isDark ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                        }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setRange('30d')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            range === '30d'
                                ? (isDark ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                        }`}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[280px] w-full mt-2">
                {loading ? (
                    <div className={`h-full w-full flex items-center justify-center text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Loading graph data...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOnboarding" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isDark ? '#38bdf8' : '#0284c7'} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={isDark ? '#38bdf8' : '#0284c7'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="4 4" 
                                vertical={false} 
                                stroke={isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'} 
                            />
                            <XAxis
                                dataKey="date"
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
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke={isDark ? '#38bdf8' : '#0284c7'}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorOnboarding)"
                                activeDot={{ r: 6, stroke: isDark ? '#0f172a' : '#ffffff', strokeWidth: 2, fill: isDark ? '#38bdf8' : '#0284c7' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

