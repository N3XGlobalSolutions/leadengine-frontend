import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getOnboardingData } from '../../services/adminService';
import { OnboardingData } from '../../types/admin';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export const ClientOnboardingGraph = () => {
    const [data, setData] = useState<OnboardingData[]>([]);
    const [range, setRange] = useState<'7d' | '30d'>('7d');
    const [loading, setLoading] = useState(true);
    const { isDark } = useAdminTheme();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getOnboardingData(range);
            setData(result);
            setLoading(false);
        };
        fetchData();
    }, [range]);

    return (
        <div className={`p-6 rounded-xl shadow-sm border transition-colors ${isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-gray-100'
            }`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Client Onboarding Trends</h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>New clients added over time</p>
                </div>
                <div className={`flex rounded-lg p-1 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => setRange('7d')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${range === '7d'
                                ? (isDark ? 'bg-slate-600 shadow-sm text-white' : 'bg-white shadow-sm text-gray-900')
                                : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')
                            }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setRange('30d')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${range === '30d'
                                ? (isDark ? 'bg-slate-600 shadow-sm text-white' : 'bg-white shadow-sm text-gray-900')
                                : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')
                            }`}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                {loading ? (
                    <div className={`h-full w-full flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Loading graph...</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E5E7EB'} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                    color: isDark ? '#F1F5F9' : '#111827'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#4F46E5"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
