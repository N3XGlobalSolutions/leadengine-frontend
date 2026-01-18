import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle, MessageSquare, ArrowUpRight, MoreHorizontal, Clock, ChevronRight, LogOut } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardMetrics, getDailyMetrics, getRecentLeads, getClientById } from '../services/adminService';
import { DashboardMetrics, DailyMetric, DashboardLead, Client } from '../types/admin';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export const DashboardPage = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const { logout } = useAdminAuth();

    const [client, setClient] = useState<Client | null>(null);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [recentLeads, setRecentLeads] = useState<DashboardLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7');

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            setLoading(true);
            try {
                const [clientData, metricsData, dailyData, leadsData] = await Promise.all([
                    getClientById(tenantId),
                    getDashboardMetrics(tenantId),
                    getDailyMetrics(tenantId, parseInt(dateRange)),
                    getRecentLeads(tenantId)
                ]);
                setClient(clientData);
                setMetrics(metricsData);
                setDailyMetrics(dailyData);
                setRecentLeads(leadsData);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId, dateRange]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!client || !metrics || !client.config) {
        return <div className="min-h-screen flex items-center justify-center">Client or Data not found</div>;
    }

    const config = client.config;
    const hotLeads = metrics.leads_by_status.qualified + metrics.leads_by_status.converted;
    const coldLeads = metrics.leads_by_status.new + metrics.leads_by_status.contacted + metrics.leads_by_status.lost;
    const totalLeads = metrics.leads || 1; // Avoid div by zero
    const qualRate = Math.round((hotLeads / totalLeads) * 100);

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{config.companyName || client.name}</h1>
                        <p className="text-gray-500 mt-1">Real-time performance overview</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-white border-none py-2 px-4 rounded-lg text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                        </select>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/admin/login');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all shadow-sm group"
                        >
                            <LogOut size={16} className="group-hover:stroke-red-600" />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Total Conversations"
                        value={metrics.conversations}
                        trend="--"
                        icon={MessageSquare}
                        color="blue"
                    />
                    <StatsCard
                        title="Total Leads"
                        value={metrics.leads}
                        trend="--"
                        icon={Users}
                        color="indigo"
                    />
                    <StatsCard
                        title="Qualified Leads"
                        value={metrics.leads_by_status.qualified}
                        trend={`${qualRate}% Rate`}
                        icon={CheckCircle}
                        color="emerald"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-gray-900">Lead Volume Trend</h3>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyMetrics}>
                                        <defs>
                                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            dy={10}
                                            tickFormatter={(value) => value.slice(5)} // Show MM-DD
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="leads"
                                            stroke="#4F46E5"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorLeads)"
                                            name="Leads"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-900">Recent Leads</h3>
                                <button
                                    onClick={() => navigate(`/${tenantId}/leads`)}
                                    className="relative flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-200 group"
                                >
                                    <span>View All Leads</span>
                                    <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {recentLeads.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No recent leads found.</p>
                                ) : (
                                    recentLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            onClick={() => navigate(`/${tenantId}/leads?leadId=${lead.id}`)}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{lead.status} Lead</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-400 group-hover:text-indigo-500">
                                                <Clock size={12} className="mr-1" />
                                                {new Date(lead.created_at).toLocaleDateString()}
                                                <ChevronRight size={14} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Lead Quality</h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Qualification Rate</span>
                                <span className="text-lg font-bold text-gray-900">{qualRate}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${qualRate}%` }}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-emerald-50 rounded-xl">
                                    <p className="text-xs text-emerald-600 font-medium mb-1">Hot Lead</p>
                                    <p className="text-xl font-bold text-gray-900">{hotLeads}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <p className="text-xs text-red-600 font-medium mb-1">Cold Lead</p>
                                    <p className="text-xl font-bold text-gray-900">{coldLeads}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/${tenantId}`;
                                        navigator.clipboard.writeText(url);
                                        alert('Copied to clipboard!');
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all group"
                                >
                                    <span className="font-medium text-sm">Copy Chatbot Link</span>
                                    <ArrowUpRight size={16} className="text-gray-400 group-hover:text-indigo-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, trend, icon: Icon, color }: any) => {
    const colorStyles = {
        indigo: 'text-indigo-600 bg-indigo-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        blue: 'text-blue-600 bg-blue-50',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorStyles[color as keyof typeof colorStyles]}`}>
                    <Icon size={24} />
                </div>
                {/* <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight size={14} className="mr-1" />
                    <span className="text-xs font-bold">{trend}</span>
                </div> */}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
};
