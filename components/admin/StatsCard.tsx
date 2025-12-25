import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendDirection?: 'up' | 'down';
    color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendDirection, color = "blue" }) => {
    const { isDark } = useAdminTheme();

    const colorClasses: Record<string, { light: string; dark: string }> = {
        blue: { light: 'bg-blue-50 text-blue-600', dark: 'bg-blue-900/30 text-blue-400' },
        indigo: { light: 'bg-indigo-50 text-indigo-600', dark: 'bg-indigo-900/30 text-indigo-400' },
        emerald: { light: 'bg-emerald-50 text-emerald-600', dark: 'bg-emerald-900/30 text-emerald-400' },
        purple: { light: 'bg-purple-50 text-purple-600', dark: 'bg-purple-900/30 text-purple-400' },
    };

    const iconColor = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`p-4 rounded-xl shadow-sm border flex items-center justify-between hover:shadow-md transition-all ${isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-gray-100'
            }`}>
            <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
                {trend && (
                    <div className={`flex items-center mt-2 text-sm ${trendDirection === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        <span>{trendDirection === 'up' ? '↑' : '↓'} {trend}</span>
                        <span className={`ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>vs last month</span>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-full ${isDark ? iconColor.dark : iconColor.light}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};
