import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle, MessageSquare, ArrowUpRight, MoreHorizontal, Clock, ChevronRight, LogOut, TrendingUp, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardMetrics, getDailyMetrics, getRecentLeads, getClientById, getTenantLeads } from '../services/adminService';
import { DashboardMetrics, DailyMetric, DashboardLead, Client } from '../types/admin';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { SkeletonDashboard } from '../components/admin/SkeletonLoader';

// Branded Header Component
const DashboardHeader = ({ companyName, dateRange, setDateRange, onLogout }: any) => {
    return (
        <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 shadow-xl overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                        <Sparkles className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                            {companyName}
                        </h1>
                        <p className="text-indigo-100 mt-1 text-sm sm:text-base font-medium">
                            Real-time Performance Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white/20 backdrop-blur-md border border-white/30 py-2.5 px-4 rounded-xl text-sm font-medium text-white shadow-lg hover:bg-white/30 transition-all cursor-pointer flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                        <option value="7" className="text-gray-900">Last 7 Days</option>
                        <option value="30" className="text-gray-900">Last 30 Days</option>
                    </select>
                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium rounded-xl hover:bg-red-500 hover:border-red-400 transition-all shadow-lg group flex-1 sm:flex-none text-sm"
                    >
                        <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

// Branded Footer Component
const DashboardFooter = ({ companyName }: { companyName: string }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl overflow-hidden mt-8">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZG90cykiLz48L3N2Zz4=')] opacity-50"></div>

            <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 backdrop-blur-sm rounded-lg border border-indigo-400/30">
                        <Sparkles className="text-indigo-400" size={20} />
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-white font-bold text-lg">{companyName}</p>
                        <p className="text-gray-400 text-sm">Powered by QBot AI</p>
                    </div>
                </div>

                <div className="text-center sm:text-right">
                    <p className="text-gray-400 text-sm">
                        © {currentYear} {companyName}. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        Intelligent Lead Qualification System
                        <br />
                        Version 1.3.0
                    </p>
                </div>
            </div>
        </footer>
    );
};

export const DashboardPage = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const { logout } = useAdminAuth();

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

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    if (loading) {
        return <SkeletonDashboard />;
    }

    if (!client || !metrics || !client.config) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
                    <p className="text-gray-900 font-semibold text-lg">Client or Data not found</p>
                </div>
            </div>
        );
    }

    const config = client.config;
    const companyName = config.companyName || client.name;
    const isS2orS3 = client.plan === 'S2' || client.plan === 'S3' || client.plan === 'S3_MAX';

    // Priority breakdown from AI metadata (S2/S3)
    const getPriority = (lead: DashboardLead) =>
        (lead.metadata?.s3_max_lead_output?.lead_priority ||
            lead.metadata?.s3_lead_output?.lead_priority ||
            lead.metadata?.s2_lead_output?.lead_priority ||
            lead.metadata?._s3_priority ||
            lead.metadata?._s2_priority || '').toLowerCase();

    const hotLeadsCount = isS2orS3 ? allLeads.filter(l => getPriority(l) === 'high').length : metrics.leads_by_status.qualified;
    const warmLeadsCount = isS2orS3 ? allLeads.filter(l => getPriority(l) === 'medium').length : 0;
    const coldLeadsCount = isS2orS3 ? allLeads.filter(l => getPriority(l) === 'low').length : metrics.leads_by_status.new + metrics.leads_by_status.disqualified;

    // Qualification rate
    const hotLeads = metrics.leads_by_status.qualified;
    const coldLeads = metrics.leads_by_status.new + metrics.leads_by_status.disqualified;
    const totalLeads = metrics.leads || 1;
    const qualRate = Math.round((hotLeads / totalLeads) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Branded Header */}
                <DashboardHeader
                    companyName={companyName}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    onLogout={handleLogout}
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Total Conversations"
                        value={metrics.conversations}
                        icon={MessageSquare}
                        color="blue"
                        gradient="from-blue-500 to-cyan-500"
                    />
                    <StatsCard
                        title="Total Leads"
                        value={metrics.leads}
                        icon={Users}
                        color="indigo"
                        gradient="from-indigo-500 to-purple-500"
                    />
                    <StatsCard
                        title="Qualified Leads"
                        value={metrics.leads_by_status.qualified}
                        subtitle={`${qualRate}% Rate`}
                        icon={CheckCircle}
                        color="emerald"
                        gradient="from-emerald-500 to-teal-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="text-indigo-600" size={20} />
                                    <h3 className="font-bold text-gray-900 text-lg">Lead Volume Trend</h3>
                                </div>
                                <button className="text-gray-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyMetrics}>
                                        <defs>
                                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                                            dy={10}
                                            tickFormatter={(value) => value.slice(5)}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="leads"
                                            stroke="#6366F1"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorLeads)"
                                            name="Leads"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 text-lg">Recent Leads</h3>
                                <button
                                    onClick={() => navigate(`/${tenantId}/leads`)}
                                    className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-300 group"
                                >
                                    <span>View All Leads</span>
                                    <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {recentLeads.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8">No recent leads found.</p>
                                ) : (
                                    recentLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            onClick={() => navigate(`/${tenantId}/leads?leadId=${lead.id}`)}
                                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all cursor-pointer group border border-transparent hover:border-indigo-200 hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                                                    <Users size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                                                    <p className="text-xs text-gray-600 capitalize font-medium">{lead.status} Lead</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 group-hover:text-indigo-600 font-medium">
                                                <Clock size={12} className="mr-1" />
                                                {new Date(lead.created_at).toLocaleDateString()}
                                                <ChevronRight size={16} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Lead Quality & Actions */}
                    <div className="space-y-6">
                        {/* Lead Quality Card */}
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-shadow duration-300">
                            <h3 className="font-bold text-gray-900 mb-6 text-lg">Lead Quality</h3>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-600 font-medium">Qualification Rate</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{qualRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                    style={{ width: `${qualRate}%` }}
                                ></div>
                            </div>

                            {isS2orS3 ? (
                                // S2/S3: Status row + AI priority breakdown
                                <div className="space-y-4">
                                    {/* Row 1: Qualified / Disqualified */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow">
                                            <p className="text-xs text-emerald-700 font-bold mb-1 uppercase tracking-wide">Qualified</p>
                                            <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{metrics.leads_by_status.qualified}</p>
                                        </div>
                                        <div className="p-3.5 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 hover:shadow-md transition-shadow">
                                            <p className="text-xs text-red-700 font-bold mb-1 uppercase tracking-wide">Disqualified</p>
                                            <p className="text-2xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{metrics.leads_by_status.disqualified}</p>
                                        </div>
                                    </div>

                                    {/* Divider + AI label */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-px bg-gray-200" />
                                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest whitespace-nowrap">AI Priority</span>
                                        <div className="flex-1 h-px bg-gray-200" />
                                    </div>

                                    {/* Row 2: Hot / Warm / Cold */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-3 bg-transparent rounded-xl border border-emerald-500 hover:shadow-md transition-shadow text-center">
                                            <p className="text-xs text-emerald-700 font-bold mb-1 uppercase tracking-wide">Hot</p>
                                            <p className="text-2xl font-black text-emerald-700">{hotLeadsCount}</p>
                                            <p className="text-[10px] text-emerald-600 mt-0.5">leads</p>
                                        </div>
                                        <div className="p-3 bg-transparent rounded-xl border border-amber-500 hover:shadow-md transition-shadow text-center">
                                            <p className="text-xs text-amber-700 font-bold mb-1 uppercase tracking-wide">Warm</p>
                                            <p className="text-2xl font-black text-amber-700">{warmLeadsCount}</p>
                                            <p className="text-[10px] text-amber-600 mt-0.5">leads</p>
                                        </div>
                                        <div className="p-3 bg-transparent rounded-xl border border-rose-500 hover:shadow-md transition-shadow text-center">
                                            <p className="text-xs text-rose-700 font-bold mb-1 uppercase tracking-wide">Cold</p>
                                            <p className="text-2xl font-black text-rose-700">{coldLeadsCount}</p>
                                            <p className="text-[10px] text-rose-600 mt-0.5">leads</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // S1: Original two-column Hot / Cold
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-lg transition-shadow">
                                        <p className="text-xs text-emerald-700 font-bold mb-2 uppercase tracking-wide">Hot Leads</p>
                                        <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{hotLeads}</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 hover:shadow-lg transition-shadow">
                                        <p className="text-xs text-red-700 font-bold mb-2 uppercase tracking-wide">Cold Leads</p>
                                        <p className="text-2xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{coldLeads}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-shadow duration-300">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/${tenantId}`;
                                        navigator.clipboard.writeText(url);
                                        alert('Chatbot link copied to clipboard!');
                                    }}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 hover:text-indigo-900 transition-all group shadow-sm hover:shadow-md"
                                >
                                    <span className="font-semibold text-sm">Copy Chatbot Link</span>
                                    <ArrowUpRight size={18} className="text-indigo-500 group-hover:text-indigo-700 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branded Footer */}
                <DashboardFooter companyName={companyName} />
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, subtitle, icon: Icon, color, gradient }: any) => {
    const colorStyles: Record<string, string> = {
        indigo: 'from-indigo-500 to-purple-500',
        emerald: 'from-emerald-500 to-teal-500',
        blue: 'from-blue-500 to-cyan-500',
    };

    return (
        <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/50 transition-all hover:shadow-2xl hover:scale-105 duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3.5 rounded-xl bg-gradient-to-br ${gradient || colorStyles[color]} shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={26} className="text-white" />
                </div>
            </div>
            <div>
                <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</p>
                <h3 className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">{value}</h3>
                {subtitle && (
                    <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
                )}
            </div>
        </div>
    );
};
