import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getClients } from '../../services/adminService';
import { OnboardingData } from '../../types/admin';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { cn } from '../../utils/cn';
import { Card, tone } from './ui/kit';

type GrowthPoint = OnboardingData & { fullDate: string };

interface GrowthTooltipProps {
    active?: boolean;
    payload?: ReadonlyArray<{ value?: number | string }>;
    label?: string | number;
    isDark: boolean;
}

/** White tooltip card (neutral-900 in dark). */
const GrowthTooltip = ({ active, payload, label, isDark }: GrowthTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={cn('px-3.5 py-2.5 rounded-xl border font-jakarta shadow-[0_8px_24px_rgba(0,0,0,.08)]',
            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-[#E5E5E5] text-[#0A0A0A]')}>
            <p className={cn('m-0 mb-1 text-[11.5px] font-bold tracking-[0.08em] uppercase', tone(isDark).hint)}>{label}</p>
            <div className="flex items-center gap-2 text-[13px]">
                <span className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-white' : 'bg-[#0A0A0A]')} />
                <span className={tone(isDark).muted}>New clients</span>
                <span className="font-extrabold">{payload[0]?.value}</span>
            </div>
        </div>
    );
};

const PERIODS: { value: '7d' | '30d'; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
];

export const ClientOnboardingGraph: React.FC<{ className?: string }> = ({ className }) => {
    const [data, setData] = useState<GrowthPoint[]>([]);
    const [range, setRange] = useState<'7d' | '30d'>('7d');
    const [loading, setLoading] = useState(true);
    const { isDark } = useAdminTheme();
    const t = tone(isDark);

    useEffect(() => {
        const calculateOnboardingStats = async () => {
            setLoading(true);
            try {
                const clients = await getClients();
                const days = range === '7d' ? 7 : 30;
                const stats: Record<string, number> = {};
                const chartData: GrowthPoint[] = [];
                const today = new Date();

                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];

                    const displayLabel = range === '7d'
                        ? d.toLocaleDateString('en-US', { weekday: 'short' })
                        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    stats[dateStr] = 0;
                    chartData.push({ date: displayLabel, count: 0, fullDate: dateStr });
                }

                clients.forEach(client => {
                    const onboardingDate = client.onboardedDate;
                    if (Object.prototype.hasOwnProperty.call(stats, onboardingDate)) {
                        stats[onboardingDate]++;
                        const dataPoint = chartData.find(p => p.fullDate === onboardingDate);
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
    const days = range === '7d' ? 7 : 30;

    const ink = isDark ? '#FFFFFF' : '#0A0A0A';
    const grid = isDark ? '#262626' : '#EEEEEE';
    const tick = isDark ? '#737373' : '#6B6B6B';

    return (
        <Card isDark={isDark} className={cn('min-w-0', className)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <h2 className={cn('m-0 text-lg font-extrabold tracking-[-0.02em] flex items-center gap-2.5', t.text)}>
                        Client Growth
                        <span className={cn('inline-flex items-center h-[22px] px-2.5 rounded-full text-[11.5px] font-bold whitespace-nowrap',
                            isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-[#F2F2F2] text-[#333333]')}>
                            +{totalPeriodCount} added
                        </span>
                    </h2>
                    <p className={cn('m-0 text-[13px] leading-[1.55]', t.muted)}>Onboarding trajectory across the selected period</p>
                </div>

                <div role="tablist" aria-label="Period" className={cn('flex gap-1 p-1 rounded-[10px]', isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]')}>
                    {PERIODS.map(p => {
                        const on = range === p.value;
                        return (
                            <button
                                key={p.value}
                                type="button"
                                role="tab"
                                aria-selected={on}
                                onClick={() => setRange(p.value)}
                                className={cn('min-h-[32px] px-3 rounded-lg border-none cursor-pointer text-[12.5px] font-bold transition-colors focus:outline-none focus-visible:ring-2',
                                    isDark ? 'focus-visible:ring-white/40' : 'focus-visible:ring-black/30',
                                    on
                                        ? (isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')
                                        : (isDark ? 'bg-transparent text-neutral-400 hover:text-white' : 'bg-transparent text-[#525252] hover:text-[#0A0A0A]'))}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <figure
                className="m-0 h-[280px] w-full"
                aria-label={`Client growth: ${totalPeriodCount === 0 ? 'no' : totalPeriodCount} new client${totalPeriodCount === 1 ? '' : 's'} in the last ${days} days`}
            >
                {loading ? (
                    <div className={cn('h-full w-full flex items-center justify-center text-sm font-medium', t.hint)}>
                        Loading graph data...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke={grid} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tick, fontSize: 11 }}
                                dy={8}
                                minTickGap={12}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tick, fontSize: 11 }}
                                allowDecimals={false}
                                domain={[0, (dataMax: number) => Math.max(4, dataMax)]}
                                width={40}
                            />
                            <Tooltip cursor={{ stroke: grid, strokeWidth: 1 }} content={<GrowthTooltip isDark={isDark} />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="New clients"
                                stroke={ink}
                                strokeWidth={2.5}
                                fill={ink}
                                fillOpacity={0.06}
                                activeDot={{ r: 5, stroke: isDark ? '#171717' : '#FFFFFF', strokeWidth: 2, fill: ink }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </figure>
        </Card>
    );
};
