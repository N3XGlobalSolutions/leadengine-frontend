import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { StatsCard } from '../components/admin/StatsCard';
import { ClientOnboardingGraph } from '../components/admin/ClientOnboardingGraph';
import { ClientListTable } from '../components/admin/ClientListTable';
import { ClientSpotlight } from '../components/admin/ClientSpotlight';
import { getDashboardStats } from '../services/adminService';
import { DashboardStats, Client } from '@/types/admin';
import { useAdminTheme } from '../contexts/AdminThemeContext';

import { useNavigate } from 'react-router-dom';

export const AdminPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [spotlightClient, setSpotlightClient] = useState<Client | null>(null);
    const { isDark } = useAdminTheme();

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getDashboardStats();
            setStats(data);
        };
        fetchStats();
    }, []);

    return (
        <AdminLayout>
            {/* Stats Grid & Add Client Action */}
            <div className={`mb-8 p-4 rounded-2xl border transition-colors ${isDark
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-gray-50/50 border-gray-100/50'
                }`}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <StatsCard
                        title="Total Clients"
                        value={stats?.totalActiveClients.toString() || "..."}
                        icon={Users}
                        trend="12%"
                        trendDirection="up"
                        color="indigo"
                    />
                    <StatsCard
                        title="Total Revenue"
                        value={`$${stats?.totalRevenue.toLocaleString()}` || "..."}
                        icon={DollarSign}
                        trend="8%"
                        trendDirection="up"
                        color="emerald"
                    />
                    <StatsCard
                        title="Active Users"
                        value={stats?.activeUsers.toLocaleString() || "..."}
                        icon={Activity}
                        trend="5%"
                        trendDirection="down"
                        color="blue"
                    />
                    <StatsCard
                        title="Growth Rate"
                        value={`${stats?.growthRate}%` || "..."}
                        icon={TrendingUp}
                        color="purple"
                    />
                </div>

                <button
                    onClick={() => navigate('/admin/clients/new')}
                    className={`w-full p-4 rounded-xl shadow-lg border flex items-center justify-center transition-all hover:scale-[1.01] hover:shadow-xl group ${isDark
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-900/30'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-200'
                        }`}>
                    <div className="bg-white/20 p-2 rounded-full mr-3 group-hover:bg-white/30 transition-colors">
                        <Users size={20} className="text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-wide">Add New Client</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Onboarding Graph - Spans 2 columns */}
                <div className="lg:col-span-2">
                    <ClientOnboardingGraph />
                </div>

                {/* Recent Activity / Spotlight / Ads - Spans 1 column */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between">
                    <div>
                        <h3 className="text-white text-2xl font-bold mb-2">Pro Tips</h3>
                        <p className="text-indigo-100 mb-6">Learn how to maximize your client retention with our new guide.</p>
                        <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors shadow-sm">
                            Read Guide
                        </button>
                    </div>
                    <div className="mt-8 pt-8 border-t border-indigo-500/30">
                        <p className="text-xl text-indigo-100 font-bold">System Status</p>
                        <div className="flex items-center mt-2">
                            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                            <span className="font-medium text-green-300">All systems operational</span>
                        </div>
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
