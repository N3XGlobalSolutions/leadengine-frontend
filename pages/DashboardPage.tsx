import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Users, CheckCircle, MessageSquare, ArrowUpRight, MoreHorizontal, Clock, ChevronRight, LogOut, TrendingUp, Bot,
    Send, Cpu, Sun, Moon, Calendar, Phone, Video, Link2, Copy, type LucideIcon,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardMetrics, getDailyMetrics, getRecentLeads, getClientById, getTenantLeads } from '../services/adminService';
import { DashboardMetrics, DailyMetric, DashboardLead, Client } from '../types/admin';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAdminTheme } from '../contexts/AdminThemeContext';
import { bookingService, TenantBooking } from '../services/bookingService';
import { formatBookingDateTime } from '../utils/bookingFormat';
import { cn } from '../utils/cn';
import {
    Card, Button, IconButton, Select, PageHeader, Mark, SmallLabel, Icon, tone, leadStatusTone, type PillTone,
} from '../components/admin/ui/kit';

const MAX_UPCOMING_CALLS = 6;

/* ── Small local helpers (client-facing dashboard has its own chrome, no AdminLayout) ───────── */

/** Visible keyboard focus ring (design: 2px ink outline, 2px offset). */
const focusRing = (isDark: boolean) => cn(
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    isDark ? 'focus-visible:ring-white focus-visible:ring-offset-neutral-900' : 'focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-white',
);

/** Bordered list row (design `.hov` rows). */
const rowClass = (isDark: boolean, interactive = true) => cn(
    'flex items-center gap-3 rounded-xl border no-underline transition-colors',
    isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-[#EEEEEE] text-[#0A0A0A]',
    interactive && (isDark ? 'hover:bg-neutral-800/60 hover:border-neutral-700' : 'hover:bg-[#FAFAFA] hover:border-[#D4D4D4]'),
    interactive && focusRing(isDark),
);

/** Same pill classes as the kit StatusPill, at the 22px size the design uses inside headings / rows. */
const PILL_SM: Record<PillTone, { light: string; dark: string }> = {
    green: { light: 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]', dark: 'bg-green-500/10 text-green-300 border border-green-500/30' },
    amber: { light: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]', dark: 'bg-amber-500/10 text-amber-300 border border-amber-500/30' },
    red: { light: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]', dark: 'bg-red-500/10 text-red-300 border border-red-500/30' },
    orange: { light: 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]', dark: 'bg-orange-500/10 text-orange-300 border border-orange-500/30' },
    purple: { light: 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]', dark: 'bg-purple-500/10 text-purple-300 border border-purple-500/30' },
    grey: { light: 'bg-[#F2F2F2] text-[#404040] border border-[#E5E5E5]', dark: 'bg-neutral-800 text-neutral-300 border border-neutral-700' },
    on: { light: 'bg-[#0A0A0A] text-white', dark: 'bg-white text-black' },
    out: { light: 'bg-white text-[#333333] border border-[#D4D4D4]', dark: 'bg-transparent text-neutral-200 border border-neutral-700' },
    soft: { light: 'bg-[#F2F2F2] text-[#333333]', dark: 'bg-neutral-800 text-neutral-200' },
};
const SmallPill: React.FC<{ isDark: boolean; tone: PillTone; children: React.ReactNode; className?: string }> = ({ isDark, tone: t, children, className }) => (
    <span className={cn('inline-flex items-center h-[22px] px-2.5 rounded-full text-[11.5px] font-bold whitespace-nowrap', isDark ? PILL_SM[t].dark : PILL_SM[t].light, className)}>
        {children}
    </span>
);

/** Card heading (design `.h2`, 18px/800). */
const h2Class = (isDark: boolean) => cn('m-0 flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.02em]', tone(isDark).text);

/** Coloured stat tiles used in the Lead Quality card (Qualified / Disqualified / Hot / Warm / Cold). */
type TileTone = 'green' | 'red' | 'amber' | 'grey';
const TILE: Record<TileTone, { light: string; dark: string; dot: string }> = {
    green: { light: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]', dark: 'border-green-500/30 bg-green-500/10 text-green-300', dot: '#16A34A' },
    red: { light: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]', dark: 'border-red-500/30 bg-red-500/10 text-red-300', dot: '#DC2626' },
    amber: { light: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]', dark: 'border-amber-500/30 bg-amber-500/10 text-amber-300', dot: '#F59E0B' },
    grey: { light: 'border-[#E5E5E5] bg-[#FAFAFA] text-[#404040]', dark: 'border-neutral-700 bg-neutral-800/60 text-neutral-300', dot: '#A3A3A3' },
};

const StatTile: React.FC<{
    isDark: boolean;
    tone: TileTone;
    label: string;
    value: number;
    marker?: React.ReactNode;   // defaults to a coloured dot
    sub?: string;
    centered?: boolean;
}> = ({ isDark, tone: t, label, value, marker, sub, centered }) => (
    <div className={cn('flex flex-col gap-1.5 rounded-xl border-[1.5px] min-w-0', centered ? 'items-center px-2 py-3.5 gap-1' : 'px-4 py-3.5', isDark ? TILE[t].dark : TILE[t].light)}>
        <span className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.06em] uppercase">
            {marker ?? <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: TILE[t].dot }} />}
            {label}
        </span>
        <span className="text-[28px] font-extrabold leading-[1.1] tabular-nums">{value}</span>
        {sub && <span className="text-xs">{sub}</span>}
    </div>
);

/** KPI card: black 52px icon tile + label / value / sub line. */
const KpiCard: React.FC<{ isDark: boolean; icon: LucideIcon; label: string; value: number; sub: React.ReactNode }> = ({ isDark, icon: KpiIcon, label, value, sub }) => (
    <section className={cn(
        'rounded-2xl border flex flex-row items-center gap-[18px] p-[22px] transition-[box-shadow,transform] duration-150 hover:-translate-y-px',
        isDark ? 'bg-neutral-900 border-neutral-800 hover:shadow-[0_6px_18px_rgba(0,0,0,.4)]' : 'bg-white border-[#E5E5E5] hover:shadow-[0_6px_18px_rgba(0,0,0,.06)]',
    )}>
        <span className={cn('w-[52px] h-[52px] flex-none rounded-[14px] flex items-center justify-center', isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')}>
            <KpiIcon size={22} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-1.5 min-w-0">
            <SmallLabel isDark={isDark}>{label}</SmallLabel>
            <span className={cn('text-[34px] font-extrabold tracking-[-0.03em] leading-none tabular-nums', tone(isDark).text)}>{value}</span>
            {sub}
        </span>
    </section>
);

/** Inbound / Outbound action row (54px, grey icon tile, trailing icon). Renders a router Link when `to` is set. */
const ActionRow: React.FC<{
    isDark: boolean;
    icon: LucideIcon;
    label: string;
    trailing: LucideIcon;
    to?: string;
    onClick?: () => void;
}> = ({ isDark, icon: RowIcon, label, trailing: Trailing, to, onClick }) => {
    const className = cn(
        rowClass(isDark),
        'w-full min-h-[54px] pl-2 pr-3 text-left text-[13.5px] font-bold cursor-pointer',
        isDark ? 'border-neutral-800' : 'border-[#E5E5E5]',
    );
    const content = (
        <>
            <span className={cn('w-9 h-9 flex-none rounded-[10px] flex items-center justify-center', isDark ? 'bg-neutral-800 text-white' : 'bg-[#F2F2F2] text-[#0A0A0A]')}>
                <RowIcon size={17} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">{label}</span>
            <Trailing size={15} strokeWidth={2.2} aria-hidden="true" className={isDark ? 'text-neutral-500' : 'text-[#8A8A8A]'} />
        </>
    );
    return to
        ? <Link to={to} className={className}>{content}</Link>
        : <button type="button" onClick={onClick} className={className}>{content}</button>;
};

/** Dashed empty / info box (design: Upcoming Calls empty state). */
const DashedNote: React.FC<{ isDark: boolean; icon?: React.ReactNode; children: React.ReactNode }> = ({ isDark, icon, children }) => (
    <div className={cn('flex flex-col items-center gap-2.5 px-3 py-[22px] rounded-xl border-[1.5px] border-dashed text-center',
        isDark ? 'border-neutral-700 bg-neutral-950/40' : 'border-[#E5E5E5] bg-[#FAFAFA]')}>
        {icon && (
            <span className={cn('w-11 h-11 rounded-full border flex items-center justify-center',
                isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-400' : 'bg-white border-[#E5E5E5] text-[#6B6B6B]')}>
                {icon}
            </span>
        )}
        <span className={cn('text-[13.5px]', tone(isDark).muted)}>{children}</span>
    </div>
);

/* ── Top bar + footer ──────────────────────────────────────────────────────── */

const DashboardTopBar: React.FC<{ isDark: boolean; companyName: string; onToggleTheme: () => void; onLogout: () => void }> = ({ isDark, companyName, onToggleTheme, onLogout }) => {
    const t = tone(isDark);
    return (
        <header className={cn('min-h-[64px] flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-2.5 border-b',
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E5E5E5]')}>
            <div className="flex items-center gap-3 min-w-0">
                <span className={cn('w-[34px] h-[34px] flex-none rounded-[10px] flex items-center justify-center', isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')}>
                    <Bot size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 text-sm min-w-0', t.hint)}>
                    <span className={cn('font-semibold truncate', t.muted)}>{companyName}</span>
                    <span aria-hidden="true">/</span>
                    <span aria-current="page" className={cn('font-bold', t.text)}>Dashboard</span>
                </nav>
            </div>
            <div className="flex items-center gap-2">
                <IconButton
                    isDark={isDark}
                    label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    onClick={onToggleTheme}
                    className={cn('border-transparent bg-transparent', focusRing(isDark))}
                >
                    {isDark ? <Sun size={18} strokeWidth={1.9} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.9} aria-hidden="true" />}
                </IconButton>
                <Button isDark={isDark} variant="secondary" onClick={onLogout} className={cn('min-h-[40px]', focusRing(isDark))}>
                    <LogOut size={16} aria-hidden="true" />
                    Logout
                </Button>
            </div>
        </header>
    );
};

const DashboardFooter: React.FC<{ isDark: boolean; companyName: string }> = ({ isDark, companyName }) => {
    const currentYear = new Date().getFullYear();
    const t = tone(isDark);
    return (
        <footer className={cn('flex flex-wrap items-center justify-between gap-4 px-6 py-[22px] rounded-2xl border', t.card)}>
            <div className="flex items-center gap-3 min-w-0">
                <span className={cn('w-10 h-10 flex-none rounded-[10px] flex items-center justify-center', isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')}>
                    <Bot size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-0.5 min-w-0">
                    <span className={cn('text-[15px] font-extrabold', t.text)}>{companyName}</span>
                    <span className={cn('text-[12.5px]', t.hint)}>Powered by LeadEngine AI</span>
                </span>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-0.5 text-left sm:text-right">
                <span className={cn('text-[13px]', isDark ? 'text-neutral-300' : 'text-[#333333]')}>
                    © {currentYear} {companyName}. All rights reserved.
                </span>
                <span className={cn('text-xs', t.hint)}>Intelligent Lead Qualification System · Version 1.3.0</span>
            </div>
        </footer>
    );
};

/* ── Loading skeleton (same layout as the page) ────────────────────────────── */

const DashboardSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const block = cn('animate-pulse rounded-lg', isDark ? 'bg-neutral-800' : 'bg-[#EDEDED]');
    const card = cn('rounded-2xl border p-6', tone(isDark).card);
    return (
        <div className={cn('min-h-screen font-jakarta', tone(isDark).page)} aria-busy="true">
            <span role="status" className="sr-only">Loading dashboard…</span>
            <div className={cn('min-h-[64px] flex items-center justify-between gap-3 px-4 sm:px-8 py-2.5 border-b', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E5E5E5]')}>
                <div className="flex items-center gap-3">
                    <div className={cn(block, 'w-[34px] h-[34px] rounded-[10px]')} />
                    <div className={cn(block, 'w-44 h-4')} />
                </div>
                <div className={cn(block, 'w-28 h-10 rounded-[11px]')} />
            </div>
            <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-8 pt-8 pb-10 flex flex-col gap-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-3">
                        <div className={cn(block, 'w-60 h-6 rounded-full')} />
                        <div className={cn(block, 'w-80 max-w-full h-10')} />
                    </div>
                    <div className={cn(block, 'w-40 h-11 rounded-[10px]')} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={cn(card, 'flex items-center gap-[18px] p-[22px]')}>
                            <div className={cn(block, 'w-[52px] h-[52px] flex-none rounded-[14px]')} />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className={cn(block, 'w-28 h-3')} />
                                <div className={cn(block, 'w-16 h-8')} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className={cn(card, 'lg:col-span-2 flex flex-col gap-4')}>
                        <div className={cn(block, 'w-48 h-5')} />
                        <div className={cn(block, 'h-[300px] w-full rounded-xl')} />
                    </div>
                    <div className={cn(card, 'flex flex-col gap-4')}>
                        <div className={cn(block, 'w-32 h-5')} />
                        <div className={cn(block, 'h-24 rounded-xl')} />
                        <div className="grid grid-cols-2 gap-3">
                            <div className={cn(block, 'h-20 rounded-xl')} />
                            <div className={cn(block, 'h-20 rounded-xl')} />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className={cn(card, 'lg:col-span-2 flex flex-col gap-2')}>
                        <div className={cn(block, 'w-40 h-5 mb-2')} />
                        {[0, 1, 2, 3, 4].map((i) => <div key={i} className={cn(block, 'h-[62px] rounded-xl')} />)}
                    </div>
                    <div className={cn(card, 'flex flex-col gap-3')}>
                        <div className={cn(block, 'w-36 h-5')} />
                        <div className={cn(block, 'h-28 rounded-xl')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Page ──────────────────────────────────────────────────────────────────── */

export const DashboardPage = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const { logout } = useAdminAuth();
    const { isDark, toggleTheme } = useAdminTheme();

    const [client, setClient] = useState<Client | null>(null);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [recentLeads, setRecentLeads] = useState<DashboardLead[]>([]);
    const [allLeads, setAllLeads] = useState<DashboardLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7');

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            setLoading(true);
            try {
                // Run all fetches in parallel — getTenantLeads is included speculatively
                // so S2/S3 users don't pay an extra sequential round-trip
                const [clientData, metricsData, dailyData, leadsData, allLeadsData] = await Promise.all([
                    getClientById(tenantId),
                    getDashboardMetrics(tenantId),
                    getDailyMetrics(tenantId, parseInt(dateRange)),
                    getRecentLeads(tenantId),
                    getTenantLeads(tenantId),
                ]);
                setClient(clientData);
                setMetrics(metricsData);
                setDailyMetrics(dailyData);
                setRecentLeads(leadsData);
                setAllLeads(allLeadsData);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId, dateRange]);

    // Upcoming booked calls (website chat + WhatsApp agent). Fetched separately so a
    // failure here never blocks or breaks the rest of the dashboard.
    const [bookings, setBookings] = useState<TenantBooking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [bookingsError, setBookingsError] = useState(false);

    useEffect(() => {
        if (!tenantId) return;
        let cancelled = false;
        const fetchBookings = async () => {
            setBookingsLoading(true);
            setBookingsError(false);
            try {
                const data = await bookingService.getTenantBookings(tenantId);
                if (!cancelled) setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch upcoming calls", err);
                if (!cancelled) {
                    setBookings([]);
                    setBookingsError(true);
                }
            } finally {
                if (!cancelled) setBookingsLoading(false);
            }
        };
        fetchBookings();
        return () => {
            cancelled = true;
        };
    }, [tenantId]);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const t = tone(isDark);

    if (loading) {
        return <DashboardSkeleton isDark={isDark} />;
    }

    if (!client || !metrics || !client.config) {
        return (
            <div className={cn('min-h-screen flex items-center justify-center p-4 font-jakarta', t.page)}>
                <div className={cn('text-center px-8 py-7 rounded-2xl border', t.card)}>
                    <p className={cn('m-0 text-lg font-extrabold', t.text)}>Client or Data not found</p>
                </div>
            </div>
        );
    }

    const config = client.config;
    const companyName = config.companyName || client.name;
    const isS2orS3 = client.plan === 'S2' || client.plan === 'S3' || client.plan === 'S3_INTERNATIONAL' || client.plan === 'S3_MAX';

    // Priority breakdown from AI metadata (S2/S3)
    const getPriority = (lead: DashboardLead) =>
        (lead.metadata?.s3_max_lead_output?.lead_priority ||
            lead.metadata?.s3_international_lead_output?.lead_priority ||
            lead.metadata?.s3_lead_output?.lead_priority ||
            lead.metadata?.s2_lead_output?.lead_priority ||
            lead.metadata?._s3_priority ||
            lead.metadata?._s2_priority || '').toLowerCase();

    const hotLeadsCount = isS2orS3 ? allLeads.filter(l => getPriority(l) === 'high').length : metrics.leads_by_status.qualified;
    const warmLeadsCount = isS2orS3 ? allLeads.filter(l => getPriority(l) === 'medium').length : 0;
    const coldLeadsCount = isS2orS3 ? allLeads.filter(l => getPriority(l) === 'low').length : metrics.leads_by_status.new + metrics.leads_by_status.disqualified;
    const priorityTotal = hotLeadsCount + warmLeadsCount + coldLeadsCount;
    const priorityPct = (n: number) => (priorityTotal ? (n / priorityTotal) * 100 : 0);

    // Qualification rate
    const hotLeads = metrics.leads_by_status.qualified;
    const coldLeads = metrics.leads_by_status.new + metrics.leads_by_status.disqualified;
    const totalLeads = metrics.leads || 1;
    const qualRate = Math.round((hotLeads / totalLeads) * 100);

    // Leads inside the selected date range (sum of the daily series shown in the chart)
    const periodLeads = dailyMetrics.reduce((sum, d) => sum + (Number(d.leads) || 0), 0);

    // Chart palette: ink line + soft fill (white series in dark mode)
    const chartInk = isDark ? '#FFFFFF' : '#0A0A0A';
    const chartSurface = isDark ? '#171717' : '#FFFFFF';
    const chartGrid = isDark ? '#262626' : '#EEEEEE';
    const chartTick = isDark ? '#A3A3A3' : '#8A8A8A';

    const copyWidgetLink = () => {
        const url = `${window.location.origin}/${tenantId}`;
        navigator.clipboard.writeText(url);
        alert('Chatbot link copied to clipboard!');
    };

    return (
        <div className={cn('min-h-screen font-jakarta antialiased transition-colors duration-300', t.page, t.text)}>
            <DashboardTopBar isDark={isDark} companyName={companyName} onToggleTheme={toggleTheme} onLogout={handleLogout} />

            <main className="w-full max-w-[1180px] mx-auto px-4 sm:px-8 pt-8 pb-10 flex flex-col gap-5">
                {/* Header */}
                <PageHeader
                    isDark={isDark}
                    eyebrow="Real-time Performance Dashboard"
                    eyebrowIcon={<span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-[#16A34A] shadow-[0_0_0_3px_rgba(22,163,74,.2)]" />}
                    title={<Mark isDark={isDark}>{companyName}</Mark>}
                    actions={
                        <>
                            <label className="sr-only" htmlFor="client-dashboard-range">Date range</label>
                            <Select
                                id="client-dashboard-range"
                                isDark={isDark}
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="h-11"
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                            </Select>
                        </>
                    }
                />

                {/* KPI cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <KpiCard
                        isDark={isDark}
                        icon={MessageSquare}
                        label="Total Conversations"
                        value={metrics.conversations}
                        sub={<span className={cn('text-[12.5px] leading-[22px]', t.hint)}>All time</span>}
                    />
                    <KpiCard
                        isDark={isDark}
                        icon={Users}
                        label="Total Leads"
                        value={metrics.leads}
                        sub={<span className={cn('text-[12.5px] leading-[22px]', t.hint)}>All time</span>}
                    />
                    <KpiCard
                        isDark={isDark}
                        icon={CheckCircle}
                        label="Qualified Leads"
                        value={metrics.leads_by_status.qualified}
                        sub={<SmallPill isDark={isDark} tone="soft" className="self-start">{qualRate}% Rate</SmallPill>}
                    />
                </div>

                {/* Chart + Lead Quality */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                    <Card isDark={isDark} className="lg:col-span-2 min-w-0 gap-3.5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-1 min-w-0">
                                <h2 className={h2Class(isDark)}>
                                    <TrendingUp size={18} strokeWidth={2} aria-hidden="true" />
                                    Lead Volume Trend
                                </h2>
                                <p className={cn('m-0 text-[13px] leading-[1.55]', t.muted)}>
                                    <b className={t.text}>{periodLeads} {periodLeads === 1 ? 'lead' : 'leads'}</b> in the last {dateRange} days
                                </p>
                            </div>
                            <IconButton isDark={isDark} label="More options" size={36} className={focusRing(isDark)}>
                                <MoreHorizontal size={18} strokeWidth={2.5} aria-hidden="true" className={t.muted} />
                            </IconButton>
                        </div>
                        <div className="relative flex-1 min-h-[300px] w-full">
                            <div className="absolute inset-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyMetrics} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="clientLeadVolumeFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={chartInk} stopOpacity={isDark ? 0.18 : 0.14} />
                                                <stop offset="100%" stopColor={chartInk} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartGrid} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: chartTick, fontSize: 12 }}
                                            dy={10}
                                            tickFormatter={(value) => value.slice(5)}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                            tick={{ fill: chartTick, fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: chartInk, strokeDasharray: '4 5', strokeOpacity: 0.35 }}
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: 'none',
                                                padding: '10px 14px',
                                                backgroundColor: isDark ? '#FFFFFF' : '#0A0A0A',
                                                boxShadow: '0 6px 18px rgba(0,0,0,.12)',
                                            }}
                                            labelStyle={{ color: isDark ? '#525252' : '#BDBDBD', fontSize: 12, marginBottom: 4 }}
                                            itemStyle={{ color: isDark ? '#0A0A0A' : '#FFFFFF', fontSize: 14, fontWeight: 700, padding: 0 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="leads"
                                            stroke={chartInk}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#clientLeadVolumeFill)"
                                            name="Leads"
                                            dot={{ r: 4, fill: chartSurface, stroke: chartInk, strokeWidth: 2.5 }}
                                            activeDot={{ r: 6, fill: chartSurface, stroke: chartInk, strokeWidth: 3 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    <Card isDark={isDark} className="min-w-0 gap-4">
                        <h2 className={h2Class(isDark)}>Lead Quality</h2>

                        <div className={cn('flex flex-col gap-2.5 p-4 rounded-xl border', isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-[#FAFAFA] border-[#EEEEEE]')}>
                            <div className="flex items-baseline justify-between gap-3">
                                <span className={cn('text-[13.5px] font-semibold', t.muted)}>Qualification Rate</span>
                                <span className={cn('text-[28px] font-extrabold tracking-[-0.02em] tabular-nums', t.text)}>{qualRate}%</span>
                            </div>
                            <span aria-hidden="true" className={cn('h-2 rounded overflow-hidden flex', isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]')}>
                                <span className="bg-[#16A34A] transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, qualRate)}%` }} />
                            </span>
                            <span className={cn('text-xs', t.hint)}>
                                {hotLeads} of {metrics.leads} {metrics.leads === 1 ? 'lead' : 'leads'} qualified
                            </span>
                        </div>

                        {isS2orS3 ? (
                            // S2/S3: Status row + AI priority breakdown
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <StatTile isDark={isDark} tone="green" label="Qualified" value={metrics.leads_by_status.qualified} marker={<Icon.check size={13} />} />
                                    <StatTile isDark={isDark} tone="red" label="Disqualified" value={metrics.leads_by_status.disqualified} marker={<Icon.x size={13} />} />
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <span className={cn('flex-1 h-px', isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]')} />
                                    <SmallLabel isDark={isDark}>AI Priority</SmallLabel>
                                    <span className={cn('flex-1 h-px', isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]')} />
                                </div>

                                <span aria-hidden="true" className={cn('h-2 rounded overflow-hidden flex gap-0.5', priorityTotal === 0 && (isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]'))}>
                                    {hotLeadsCount > 0 && <span style={{ width: `${priorityPct(hotLeadsCount)}%`, background: TILE.green.dot }} />}
                                    {warmLeadsCount > 0 && <span style={{ width: `${priorityPct(warmLeadsCount)}%`, background: TILE.amber.dot }} />}
                                    {coldLeadsCount > 0 && <span style={{ width: `${priorityPct(coldLeadsCount)}%`, background: TILE.grey.dot }} />}
                                </span>

                                <div className="grid grid-cols-3 gap-2.5">
                                    <StatTile isDark={isDark} tone="green" label="Hot" value={hotLeadsCount} sub="leads" centered />
                                    <StatTile isDark={isDark} tone="amber" label="Warm" value={warmLeadsCount} sub="leads" centered />
                                    <StatTile isDark={isDark} tone="grey" label="Cold" value={coldLeadsCount} sub="leads" centered />
                                </div>
                            </>
                        ) : (
                            // S1: Original two-column Hot / Cold
                            <div className="grid grid-cols-2 gap-3">
                                <StatTile isDark={isDark} tone="green" label="Hot Leads" value={hotLeads} />
                                <StatTile isDark={isDark} tone="grey" label="Cold Leads" value={coldLeads} />
                            </div>
                        )}
                    </Card>
                </div>

                {/* Recent Leads + side column */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    <Card isDark={isDark} className="lg:col-span-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className={h2Class(isDark)}>
                                Recent Leads
                                {recentLeads.length > 0 && <SmallPill isDark={isDark} tone="soft">{recentLeads.length}</SmallPill>}
                            </h2>
                            <Link
                                to={`/${tenantId}/leads`}
                                className={cn(
                                    'inline-flex items-center justify-center gap-2 min-h-[38px] px-3.5 rounded-[11px] text-[13px] font-bold whitespace-nowrap no-underline transition-colors',
                                    isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-[#111111] text-white hover:bg-black hover:text-white',
                                    focusRing(isDark),
                                )}
                            >
                                View All Leads
                                <ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" />
                            </Link>
                        </div>
                        {recentLeads.length === 0 ? (
                            <DashedNote isDark={isDark} icon={<Users size={18} strokeWidth={1.8} aria-hidden="true" />}>No recent leads found.</DashedNote>
                        ) : (
                            <ul className="list-none m-0 p-0 flex flex-col gap-2">
                                {recentLeads.map((lead) => (
                                    <li key={lead.id}>
                                        <Link to={`/${tenantId}/leads?leadId=${lead.id}`} className={cn(rowClass(isDark), 'px-3.5 py-3')}>
                                            <span className={cn('w-[38px] h-[38px] flex-none rounded-full flex items-center justify-center text-sm font-extrabold', isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white')}>
                                                {(lead.name || '?').trim().charAt(0).toUpperCase() || '?'}
                                            </span>
                                            <span className="flex-1 min-w-0 flex flex-wrap items-center gap-2.5">
                                                <span className="text-[14.5px] font-bold truncate max-w-full">{lead.name}</span>
                                                <SmallPill isDark={isDark} tone={leadStatusTone(lead.status)} className="capitalize">{lead.status} Lead</SmallPill>
                                            </span>
                                            <span className={cn('flex items-center gap-1.5 text-[12.5px] whitespace-nowrap tabular-nums', t.hint)}>
                                                <Clock size={13} strokeWidth={2} aria-hidden="true" className={isDark ? 'text-neutral-500' : 'text-[#8A8A8A]'} />
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </span>
                                            <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" className={cn('flex-none', isDark ? 'text-neutral-500' : 'text-[#8A8A8A]')} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <div className="min-w-0 flex flex-col gap-5">
                        {/* Upcoming Calls */}
                        <Card isDark={isDark} className="gap-3">
                            <h2 className={h2Class(isDark)}>
                                <Calendar size={18} strokeWidth={1.9} aria-hidden="true" />
                                Upcoming Calls
                                {!bookingsLoading && !bookingsError && bookings.length > 0 && (
                                    <SmallPill isDark={isDark} tone="soft">
                                        <span aria-hidden="true">{bookings.length}</span>
                                        <span className="sr-only">{`${bookings.length} upcoming ${bookings.length === 1 ? 'call' : 'calls'}`}</span>
                                    </SmallPill>
                                )}
                            </h2>

                            {bookingsLoading ? (
                                <div className="flex flex-col gap-2" aria-busy="true">
                                    {[0, 1].map((i) => (
                                        <div key={i} className={cn('h-[76px] rounded-xl animate-pulse', isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]')} />
                                    ))}
                                </div>
                            ) : bookingsError ? (
                                <DashedNote isDark={isDark} icon={<Phone size={18} strokeWidth={1.8} aria-hidden="true" />}>Couldn't load upcoming calls.</DashedNote>
                            ) : bookings.length === 0 ? (
                                <DashedNote isDark={isDark} icon={<Phone size={18} strokeWidth={1.8} aria-hidden="true" />}>No upcoming calls booked yet.</DashedNote>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {bookings.slice(0, MAX_UPCOMING_CALLS).map((booking) => {
                                        const openLead = booking.lead_id
                                            ? () => navigate(`/${tenantId}/leads?leadId=${booking.lead_id}`)
                                            : undefined;
                                        return (
                                            <div
                                                key={booking.meeting_id}
                                                onClick={openLead}
                                                onKeyDown={openLead ? (e) => {
                                                    if (e.target !== e.currentTarget) return;
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        openLead();
                                                    }
                                                } : undefined}
                                                role={openLead ? 'button' : undefined}
                                                tabIndex={openLead ? 0 : undefined}
                                                className={cn(rowClass(isDark, !!openLead), 'items-start px-3.5 py-3', openLead && 'cursor-pointer')}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={cn('m-0 text-sm font-bold', t.text)}
                                                        title={booking.timezone ? `Time shown in ${booking.timezone}` : undefined}
                                                    >
                                                        {formatBookingDateTime(booking.start_time, booking.timezone)}
                                                    </p>
                                                    <p className={cn('m-0 mt-0.5 text-[13.5px] font-medium truncate', t.muted)}>
                                                        {booking.attendee_name || 'Website visitor'}
                                                    </p>
                                                    {booking.attendee_phone && (
                                                        <p className={cn('m-0 mt-0.5 flex items-center gap-1 text-xs font-medium', t.hint)}>
                                                            <Phone size={12} className="shrink-0" aria-hidden="true" />
                                                            <span className="truncate">{booking.attendee_phone}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                {booking.meet_link && (
                                                    <a
                                                        href={booking.meet_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={cn(
                                                            'shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-bold no-underline transition-colors',
                                                            isDark ? 'bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800' : 'bg-white border-[#D4D4D4] text-[#0A0A0A] hover:bg-[#F7F7F7] hover:text-[#0A0A0A]',
                                                            focusRing(isDark),
                                                        )}
                                                    >
                                                        <Video size={12} aria-hidden="true" />
                                                        Join
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {bookings.length > MAX_UPCOMING_CALLS && (
                                        <p className={cn('m-0 pt-1 text-xs font-semibold text-center', t.hint)}>
                                            +{bookings.length - MAX_UPCOMING_CALLS} more
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Inbound Bot System */}
                        <Card isDark={isDark} className="gap-2.5">
                            <h2 className={cn(h2Class(isDark), 'pb-1')}>Inbound Bot System</h2>
                            <ActionRow isDark={isDark} icon={Link2} label="Copy Chatbot Widget Link" trailing={Copy} onClick={copyWidgetLink} />
                            <ActionRow isDark={isDark} icon={Bot} label="Configure Inbound Bot" trailing={ChevronRight} to={`/admin/clients/${tenantId}`} />
                            <ActionRow isDark={isDark} icon={Calendar} label="Call Booking Slots" trailing={ChevronRight} to={`/admin/clients/${tenantId}?tab=settings`} />
                        </Card>

                        {/* Outbound Bot System */}
                        <Card isDark={isDark} className="gap-2.5">
                            <h2 className={cn(h2Class(isDark), 'pb-1')}>Outbound Bot System</h2>
                            <ActionRow isDark={isDark} icon={Cpu} label="Configure Outbound Bot" trailing={ChevronRight} to={`/admin/clients/${tenantId}/outbound/ai-settings`} />
                            <ActionRow isDark={isDark} icon={Send} label="Manage Outbound Campaigns" trailing={ChevronRight} to={`/admin/clients/${tenantId}/outbound`} />
                        </Card>
                    </div>
                </div>

                <DashboardFooter isDark={isDark} companyName={companyName} />
            </main>
        </div>
    );
};
