import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { MessageSquare, Target, TrendingUp, RefreshCw, LucideIcon } from 'lucide-react';
import { getPlatformDailyMetrics, PlatformDailyPoint, PlatformDailySummary } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { cn } from '../../utils/cn';
import { Card, IconButton, tone } from './ui/kit';

interface VolumeTooltipProps {
    active?: boolean;
    payload?: ReadonlyArray<{ dataKey?: string | number; name?: string | number; value?: number | string; color?: string }>;
    label?: string | number;
    isDark: boolean;
}

/** White tooltip card (neutral-900 in dark). */
const VolumeTooltip = ({ active, payload, label, isDark }: VolumeTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={cn('px-3.5 py-2.5 rounded-xl border font-jakarta min-w-[160px] shadow-[0_8px_24px_rgba(0,0,0,.08)]',
            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-[#E5E5E5] text-[#0A0A0A]')}>
            <p className={cn('m-0 mb-1.5 text-[11.5px] font-bold tracking-[0.08em] uppercase', tone(isDark).hint)}>{label}</p>
            {payload.map(entry => (
                <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4 text-[13px] leading-6">
                    <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                        <span className={tone(isDark).muted}>{entry.name}</span>
                    </span>
                    <span className="font-extrabold">{Number(entry.value ?? 0).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

/** Summary tile: "Today / 7-Day Total" label + icon, 26px value, caption. */
const SummaryTile: React.FC<{ isDark: boolean; label: string; value: number; caption: string; icon: LucideIcon }> = ({ isDark, label, value, caption, icon: Icon }) => (
    <div className={cn('flex flex-col gap-1.5 p-4 rounded-xl border min-w-0',
        isDark ? 'border-neutral-800 bg-neutral-950' : 'border-[#E5E5E5] bg-[#FAFAFA]')}>
        <div className="flex items-center justify-between gap-2">
            <span className={cn('text-[12.5px]', tone(isDark).hint)}>{label}</span>
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" className={isDark ? 'text-neutral-400' : 'text-[#525252]'} />
        </div>
        <span className={cn('text-[26px] font-extrabold tracking-[-0.02em] leading-tight', tone(isDark).text)}>{value.toLocaleString()}</span>
        <span className={cn('text-xs', tone(isDark).hint)}>{caption}</span>
    </div>
);

export const PlatformConversationsGraph = () => {
    const [data, setData] = useState<PlatformDailyPoint[]>([]);
    const [summary, setSummary] = useState<PlatformDailySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const { isDark } = useAdminTheme();
    const t = tone(isDark);

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

    const ink = isDark ? '#FFFFFF' : '#0A0A0A';
    const leadsColor = isDark ? '#A3A3A3' : '#8A8A8A';
    const grid = isDark ? '#262626' : '#EEEEEE';
    const tick = isDark ? '#737373' : '#6B6B6B';
    const isEmpty = data.length === 0 || data.every(d => d.conversations === 0 && d.leads === 0);
    const rangeLabel = data.length > 0 ? `${data[0].display} to ${data[data.length - 1].display}` : 'the last 7 days';

    return (
        <Card isDark={isDark}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <h2 className={cn('m-0 text-lg font-extrabold tracking-[-0.02em]', t.text)}>Platform Volume &amp; Engagement</h2>
                    <p className={cn('m-0 text-[13px] leading-[1.55]', t.muted)}>
                        Aggregated daily conversation &amp; lead volume across all tenant accounts
                    </p>
                </div>
                <IconButton isDark={isDark} label="Refresh platform metrics" onClick={fetchData} disabled={loading}>
                    <RefreshCw size={16} strokeWidth={2} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
                </IconButton>
            </div>

            {/* KPI Summary Tiles */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryTile isDark={isDark} label="Today" value={summary.today_conversations} caption="Conversations" icon={MessageSquare} />
                    <SummaryTile isDark={isDark} label="Today" value={summary.today_leads} caption="Leads Created" icon={Target} />
                    <SummaryTile isDark={isDark} label="7-Day Total" value={summary.period_conversations} caption="Total Convos" icon={TrendingUp} />
                    <SummaryTile isDark={isDark} label="7-Day Total" value={summary.period_leads} caption="Total Leads" icon={Target} />
                </div>
            )}

            {/* Legend */}
            {!loading && !isEmpty && (
                <div className={cn('flex justify-end flex-wrap gap-4 text-[12.5px]', isDark ? 'text-neutral-300' : 'text-[#333333]')}>
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-[2.5px]" style={{ background: ink }} aria-hidden="true" />
                        Conversations
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-0 border-t-[2.5px] border-dashed" style={{ borderColor: leadsColor }} aria-hidden="true" />
                        Leads
                    </span>
                </div>
            )}

            {/* Chart */}
            <figure className="m-0 h-[260px] w-full" aria-label={`Daily conversations and leads, ${rangeLabel}`}>
                {loading ? (
                    <div className={cn('h-full flex flex-col items-center justify-center gap-3', t.hint)}>
                        <RefreshCw size={22} className="animate-spin" aria-hidden="true" />
                        <span className="text-sm font-medium">Fetching conversation trends...</span>
                    </div>
                ) : isEmpty ? (
                    <div className={cn('h-full flex flex-col items-center justify-center gap-2', t.hint)}>
                        <MessageSquare size={30} className="opacity-40" aria-hidden="true" />
                        <p className="m-0 text-sm font-medium">No conversation metrics recorded for this timeframe</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 14, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke={grid} />
                            <XAxis
                                dataKey="display"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tick, fontSize: 12 }}
                                dy={8}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tick, fontSize: 12 }}
                                allowDecimals={false}
                                width={40}
                            />
                            <Tooltip cursor={{ stroke: grid, strokeWidth: 1 }} content={<VolumeTooltip isDark={isDark} />} />
                            <Area
                                type="monotone"
                                dataKey="conversations"
                                name="Conversations"
                                stroke={ink}
                                strokeWidth={2.5}
                                fill={ink}
                                fillOpacity={0.08}
                                activeDot={{ r: 5, stroke: isDark ? '#171717' : '#FFFFFF', strokeWidth: 2, fill: ink }}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                name="Leads"
                                stroke={leadsColor}
                                strokeWidth={2.5}
                                strokeDasharray="6 4"
                                fill={leadsColor}
                                fillOpacity={0.1}
                                activeDot={{ r: 5, stroke: isDark ? '#171717' : '#FFFFFF', strokeWidth: 2, fill: leadsColor }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </figure>

            {/* Footer timestamp */}
            <p className={cn('m-0 text-[12.5px] leading-[1.5] text-right', t.hint)}>
                Last synced at {lastRefreshed.toLocaleTimeString()}
            </p>
        </Card>
    );
};
