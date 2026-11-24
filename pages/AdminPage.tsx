import React, { useEffect, useState } from 'react';
import { 
    Users, 
    DollarSign, 
    Activity, 
    TrendingUp, 
    MessageCircle, 
    Target, 
    Plus, 
    BookOpen, 
    RefreshCw, 
    Server, 
    CheckCircle2, 
    AlertTriangle, 
    ArrowRight,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../components/admin/AdminLayout';
import { StatsCard } from '../components/admin/StatsCard';
import { ClientOnboardingGraph } from '../components/admin/ClientOnboardingGraph';
import { PlatformConversationsGraph } from '../components/admin/PlatformConversationsGraph';
import { ClientListTable } from '../components/admin/ClientListTable';
import { ClientSpotlight } from '../components/admin/ClientSpotlight';
import { getDashboardStats, getSystemHealth, getPlatformStats } from '../services/adminService';
import { DashboardStats, Client, SystemHealth, PlatformStats } from '@/types/admin';
import { useAdminTheme } from '../contexts/AdminThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export const AdminPage = () => {
    const navigate = useNavigate();
    const { user } = useAdminAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
    const [spotlightClient, setSpotlightClient] = useState<Client | null>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { isDark } = useAdminTheme();

    const fetchAllData = async () => {
        setIsRefreshing(true);
        try {
            const [data, pStats, health] = await Promise.all([
                getDashboardStats(),
                getPlatformStats(),
                getSystemHealth(),
            ]);
            setStats(data);
            setPlatformStats(pStats);
            setSystemHealth(health);
        } catch (error) {
            console.error("Failed to refresh dashboard stats:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-8 pb-8">
                {/* Executive Header Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`p-6 sm:p-8 rounded-3xl border shadow-sm relative overflow-hidden ${
                        isDark 
                            ? 'bg-slate-900 border-slate-800 text-white' 
                            : 'bg-white border-slate-200/80 text-slate-900'
                    }`}
                >
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                    isDark 
                                        ? 'bg-slate-800 text-slate-200 border-slate-700' 
                                        : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}>
                                    <Zap size={12} className="fill-current" />
                                    Executive Command Center
                                </span>
                                {systemHealth && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                                        systemHealth.status === 'healthy' 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    }`}>
                                        {systemHealth.status === 'healthy' ? 'Operational' : 'Degraded'}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Overview & Analytics
                            </h1>
                            <p className={`text-sm sm:text-base mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Real-time performance metrics and multi-tenant client activity across LeadEngine.
                            </p>
                        </div>

                        {/* Top Action Bar */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={fetchAllData}
                                disabled={isRefreshing}
                                className={`p-3.5 rounded-xl border flex items-center justify-center transition-all ${
                                    isDark 
                                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200' 
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                                }`}
                                title="Refresh Analytics"
                            >
                                <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-slate-900 dark:text-white' : ''} />
                            </motion.button>

                            {user?.role !== 'sales_team' && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/admin/clients/new')}
                                    className="flex-1 md:flex-initial px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-sm shadow-md flex items-center justify-center gap-2 group transition-all border border-slate-800 dark:border-white"
                                >
                                    <Plus size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                                    <span>Add New Client</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* 5-Column Stats Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
                >
                    <StatsCard
                        title="Total Clients"
                        value={platformStats?.total_tenants.toString() || "..."}
                        icon={Users}
                        trend="+12%"
                        trendDirection="up"
                        color="blue"
                        onClick={() => navigate('/admin/clients')}
                    />
                    <StatsCard
                        title="Active Users"
                        value={platformStats?.total_users.toString() || "..."}
                        icon={Activity}
                        trend="Live"
                        trendDirection="up"
                        color="sky"
                        onClick={() => navigate('/admin/users')}
                    />
                    <StatsCard
                        title="Conversations"
                        value={platformStats?.total_conversations.toLocaleString() || "..."}
                        icon={MessageCircle}
                        trend="+18%"
                        trendDirection="up"
                        color="emerald"
                    />
                    <StatsCard
                        title="Total Leads"
                        value={platformStats?.total_leads.toLocaleString() || "..."}
                        icon={Target}
                        trend="+24%"
                        trendDirection="up"
                        color="teal"
                        onClick={() => navigate('/admin/leads')}
                    />
                    <StatsCard
                        title="Conversion Rate"
                        value={platformStats?.global_conversion_rate ? `${platformStats.global_conversion_rate}%` : "..."}
                        icon={TrendingUp}
                        trend="Top 5%"
                        trendDirection="up"
                        color="amber"
                    />
                </motion.div>

                {/* Middle Analytics Section: Onboarding Graph & System Health Hub */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Onboarding Graph (Spans 8 cols) */}
                    <div className="lg:col-span-8 flex flex-col">
                        <ClientOnboardingGraph />
                    </div>

                    {/* Platform Knowledge & System Health Hub (Spans 4 cols) - Minimal Warm Sand & Charcoal Theme */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className={`lg:col-span-4 rounded-3xl p-6 sm:p-8 border shadow-md flex flex-col justify-between transition-all relative overflow-hidden ${
                            isDark 
                                ? 'bg-zinc-950 border-stone-800 text-stone-100' 
                                : 'bg-[#fafaf9] border-stone-200/90 text-stone-900'
                        }`}
                    >
                        {/* Subtle Background Glow Accent */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Top Section: Platform Knowledge Header */}
                        <div className="relative z-10 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl border ${
                                        isDark 
                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                            : 'bg-amber-100/60 border-amber-200 text-amber-800'
                                    }`}>
                                        <BookOpen size={20} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-amber-400/90' : 'text-amber-700'}`}>
                                            Knowledge Hub
                                        </span>
                                        <h3 className="text-lg font-black tracking-tight mt-0.5">
                                            Platform Guide
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                Master automated WhatsApp AI lead qualification, tenant provisioning, and campaign analytics workflows.
                            </p>

                            {/* Knowledge Action Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => navigate('/admin/guide')}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs border flex items-center justify-between group transition-all shadow-sm ${
                                    isDark
                                        ? 'bg-stone-100 hover:bg-white text-stone-900 border-stone-200'
                                        : 'bg-stone-900 hover:bg-black text-amber-400 border-stone-800'
                                }`}
                            >
                                <span>Explore Admin Guide</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>

                        {/* Middle: Quick Link Shortcuts */}
                        <div className="relative z-10 my-6 pt-5 border-t border-stone-200/60 dark:border-stone-800/80 grid grid-cols-2 gap-2.5">
                            <button
                                onClick={() => navigate('/admin/support')}
                                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                                    isDark 
                                        ? 'bg-stone-900/60 border-stone-800 hover:border-amber-500/30 text-stone-300 hover:text-white' 
                                        : 'bg-white border-stone-200/80 hover:border-amber-500/40 text-stone-700 hover:text-stone-900 shadow-sm'
                                }`}
                            >
                                Contact Support
                            </button>
                            <button
                                onClick={() => navigate('/admin/audit-logs')}
                                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                                    isDark 
                                        ? 'bg-stone-900/60 border-stone-800 hover:border-amber-500/30 text-stone-300 hover:text-white' 
                                        : 'bg-white border-stone-200/80 hover:border-amber-500/40 text-stone-700 hover:text-stone-900 shadow-sm'
                                }`}
                            >
                                Audit Logs
                            </button>
                        </div>

                        {/* Bottom: Live System Infrastructure Status */}
                        <div className="relative z-10 pt-5 border-t border-stone-200/60 dark:border-stone-800/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Server size={16} className={isDark ? 'text-amber-400/80' : 'text-amber-700'} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                        System Infrastructure
                                    </span>
                                </div>
                                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                    isDark ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-stone-200/60 border-stone-300/60 text-stone-800'
                                }`}>
                                    {systemHealth ? `${systemHealth.latency_ms}ms` : '---'}
                                </span>
                            </div>

                            {systemHealth ? (
                                <div className="space-y-2">
                                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                                        isDark ? 'bg-stone-900/70 border-stone-800' : 'bg-white border-stone-200/80 shadow-sm'
                                    }`}>
                                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                                            {systemHealth.status === 'healthy' ? 'All Systems Operational' :
                                             systemHealth.status === 'degraded' ? 'Degraded Performance' : 'System Outage'}
                                        </span>
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    </div>

                                    {systemHealth.status !== 'healthy' && (
                                        <div className="text-xs bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium">
                                            <AlertTriangle size={14} className="shrink-0" />
                                            <span>DB: {systemHealth.details?.database || 'Unresponsive'}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`py-2 text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                    <span>Monitoring system health...</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Full-Width Platform Conversations Graph */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <PlatformConversationsGraph />
                </motion.div>

                {/* Client List Management Table */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <ClientListTable onSpotlight={setSpotlightClient} />
                </motion.div>

                {/* Client Spotlight Modal */}
                <ClientSpotlight
                    client={spotlightClient}
                    onClose={() => setSpotlightClient(null)}
                />
            </div>
        </AdminLayout>
    );
};

