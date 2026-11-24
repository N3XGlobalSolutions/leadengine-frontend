import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { motion } from 'framer-motion';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendDirection?: 'up' | 'down';
    color?: string;
    description?: string;
    onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendDirection = 'up', 
    color = "blue",
    description,
    onClick
}) => {
    const { isDark } = useAdminTheme();

    const hoverVariants: Record<string, string> = {
        blue: 'group-hover:bg-blue-500/15 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-500/30',
        sky: 'group-hover:bg-sky-500/15 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:border-sky-500/30',
        emerald: 'group-hover:bg-emerald-500/15 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30',
        teal: 'group-hover:bg-teal-500/15 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-500/30',
        amber: 'group-hover:bg-amber-500/15 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:border-amber-500/30',
        purple: 'group-hover:bg-purple-500/15 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:border-purple-500/30',
        slate: 'group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-900 dark:group-hover:text-white'
    };

    const iconHoverClass = hoverVariants[color] || hoverVariants.blue;

    return (
        <motion.div 
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClick}
            className={`
                relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md
                ${isDark 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-900'
                }
            `}
        >
            {/* Top row: Title & Icon */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {title}
                </span>
                <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${iconHoverClass} ${
                    isDark 
                        ? 'bg-slate-800 text-slate-300 border border-slate-700/60' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}>
                    <Icon size={18} className="stroke-[2.2]" />
                </div>
            </div>

            {/* Middle row: Big Metric Value */}
            <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {value}
                </h3>
            </div>

            {/* Bottom row: Minimal Trend Highlight or Description */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                {trend ? (
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-md text-xs ${
                            trendDirection === 'up' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                            {trendDirection === 'up' ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                            {trend}
                        </span>
                        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>vs last month</span>
                    </div>
                ) : (
                    <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {description || 'Real-time metrics'}
                    </span>
                )}
            </div>
        </motion.div>
    );
};



