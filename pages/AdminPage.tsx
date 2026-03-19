import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Activity, TrendingUp, MessageCircle, Target } from 'lucide-react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { StatsCard } from '../components/admin/StatsCard';
import { ClientOnboardingGraph } from '../components/admin/ClientOnboardingGraph';
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
    const { isDark } = useAdminTheme();

    useEffect(() => {
        const fetchStats = async () => {
            const [data, pStats, health] = await Promise.all([
                getDashboardStats(),
                getPlatformStats(),
                getSystemHealth(),
            ]);
            setStats(data);
            setPlatformStats(pStats);
            setSystemHealth(health);
        };
        fetchStats();
    }, []);

    return (
        <AdminLayout>
            {/* Stats Grid & Add Client Action */}
            <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border transition-colors ${isDark
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-gray-50/50 border-gray-100/50'
                }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <StatsCard
                        title="Total Clients"
                        value={platformStats?.total_tenants.toString() || "..."}
                        icon={Users}
                        trend="Live"
                        trendDirection="up"
                        color="indigo"
                    />
                    <StatsCard
                        title="Active Users"
                        value={platformStats?.total_users.toString() || "..."}
                        icon={Activity}
                        trend="Live"
                        trendDirection="up"
                        color="blue"
                    />
                    <StatsCard
                        title="Conversations"
                        value={platformStats?.total_conversations.toLocaleString() || "..."}
                        icon={MessageCircle}
                        trend="Total"
                        trendDirection="up"
                        color="emerald"
                    />
                    <StatsCard
                        title="Total Leads"
                        value={platformStats?.total_leads.toLocaleString() || "..."}
                        icon={Target}
                        trend="Total"
                        trendDirection="up"
                        color="purple"
                    />
                    <StatsCard
                        title="Conversion Rate"
                        value={`${platformStats?.global_conversion_rate}%` || "..."}
                        icon={TrendingUp}
                        color="orange"
                    />
                </div>

                {user?.role !== 'sales_team' && (
                    <button
                        onClick={() => navigate('/admin/clients/new')}
                        className={`w-full p-3 sm:p-4 rounded-xl shadow-lg border flex items-center justify-center transition-all hover:scale-[1.01] hover:shadow-xl group ${isDark
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-900/30'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-200'
                            }`}>
                        <div className="bg-white/20 p-2 rounded-full mr-3 group-hover:bg-white/30 transition-colors">
                            <Users size={20} className="text-white" />
                        </div>
                        <span className="text-base sm:text-lg font-bold tracking-wide">Add New Client</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Onboarding Graph - Spans 2 columns */}
                <div className="lg:col-span-2">
                    <ClientOnboardingGraph />
                </div>

                {/* Recent Activity / Spotlight / Ads - Spans 1 column */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between">
                    <div>
                        <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">Pro Tips</h3>
                        <p className="text-indigo-100 mb-6 text-sm sm:text-base">Learn how to maximize your client retention with our new guide.</p>
                        <button
                            onClick={() => navigate('/admin/guide')}
                            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors shadow-sm text-sm sm:text-base">
                            Read Guide
                        </button>
                    </div>
                    <div className="mt-8 pt-8 border-t border-indigo-500/30">
                        <p className="text-lg sm:text-xl text-indigo-100 font-bold mb-3">System Status</p>

                        {systemHealth ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`h-3 w-3 rounded-full animate-pulse mr-2 ${systemHealth.status === 'healthy' ? 'bg-green-400' :
                                            systemHealth.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-500'
                                            }`} />
                                        <span className={`font-medium text-sm sm:text-base ${systemHealth.status === 'healthy' ? 'text-green-300' :
                                            systemHealth.status === 'degraded' ? 'text-yellow-300' : 'text-red-300'
                                            }`}>
                                            {systemHealth.status === 'healthy' ? 'All systems operational' :
                                                systemHealth.status === 'degraded' ? 'Performance Degraded' : 'System Outage'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-indigo-200 mono">{systemHealth.latency_ms}ms</span>
                                </div>

                                {systemHealth.status !== 'healthy' && (
                                    <div className="text-xs bg-red-500/20 p-2 rounded text-red-200">
                                        DB: {systemHealth.details?.database || 'Unknown error'}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center mt-2 animate-pulse">
                                <div className="h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
                                <span className="text-gray-400 text-sm">Checking status...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <ClientListTable onSpotlight={setSpotlightClient} />
            </div>

            {/* Spotlight Modal */}
            <ClientSpotlight
                client={spotlightClient}
                onClose={() => setSpotlightClient(null)}
            />
        </AdminLayout>
    );
};
