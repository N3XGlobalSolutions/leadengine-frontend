import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { cn } from '../../utils/cn';
import { tone } from './ui/kit';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendDirection?: 'up' | 'down';
    description?: string;
    onClick?: () => void;
}

/** KPI card (design: 18px padding, uppercase two-line label, 36px icon tile, 30px value, trend pill footer). */
export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    trendDirection = 'up',
    description,
    onClick,
}) => {
    const { isDark } = useAdminTheme();
    const t = tone(isDark);
    const Arrow = trendDirection === 'up' ? ArrowUpRight : ArrowDownRight;

    const body = (
        <>
            <div className="flex justify-between items-start gap-2 min-h-[36px] w-full">
                {/* Two-word titles break onto two lines like the design ("Total / Clients"). */}
                <span className={cn('text-[11.5px] font-bold tracking-[0.08em] uppercase leading-[1.4] whitespace-pre-line', t.hint)}>
                    {title.split(' ').join('\n')}
                </span>
                <span className={cn('w-9 h-9 flex-none rounded-[10px] border flex items-center justify-center',
                    isDark ? 'border-neutral-700 text-white' : 'border-[#E5E5E5] text-[#0A0A0A]')}>
                    <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
            </div>
            <span className={cn('text-[30px] font-extrabold tracking-[-0.03em] leading-none', t.text)}>{value}</span>
            <div className={cn('flex items-center justify-between gap-1.5 pt-3 border-t w-full', isDark ? 'border-neutral-800' : 'border-[#EEEEEE]')}>
                {trend ? (
                    <>
                        <span className={cn('inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11.5px] font-bold whitespace-nowrap',
                            isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-[#F2F2F2] text-[#333333]')}>
                            <Arrow size={11} strokeWidth={2.4} aria-hidden="true" />
                            {trend}
                        </span>
                        <span className={cn('text-[11.5px] whitespace-nowrap', t.hint)}>vs last month</span>
                    </>
                ) : (
                    <span className={cn('text-[11.5px]', t.hint)}>{description || 'Real-time metrics'}</span>
                )}
            </div>
        </>
    );

    const base = cn('rounded-2xl border p-[18px] flex flex-col items-start gap-3.5 min-w-0 text-left', t.card);

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(base, 'w-full cursor-pointer transition-colors focus:outline-none focus-visible:ring-[3px]',
                    isDark
                        ? 'hover:border-neutral-600 hover:bg-neutral-800/40 focus-visible:ring-white/20'
                        : 'hover:border-[#D4D4D4] hover:bg-[#FAFAFA] focus-visible:ring-black/15')}
            >
                {body}
            </button>
        );
    }

    return <div className={base}>{body}</div>;
};
