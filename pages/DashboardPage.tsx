import React from 'react';
import { useParams } from 'react-router-dom';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { Users, CheckCircle, Calendar, ArrowUpRight, Clock, MoreHorizontal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', leads: 4 },
    { name: 'Tue', leads: 7 },
    { name: 'Wed', leads: 5 },
    { name: 'Thu', leads: 12 },
    { name: 'Fri', leads: 9 },
    { name: 'Sat', leads: 15 },
    { name: 'Sun', leads: 11 },
];

const recentActivity = [
    { id: 1, name: 'Rahul S.', action: 'Scheduled a call', time: '2 mins ago', status: 'success' },
    { id: 2, name: 'Priya M.', action: 'Qualified lead', time: '15 mins ago', status: 'success' },
    { id: 3, name: 'Amit K.', action: 'Started conversation', time: '1 hour ago', status: 'neutral' },
    { id: 4, name: 'Sneha R.', action: 'requested callback', time: '3 hours ago', status: 'warning' },
];

export const DashboardPage = () => {
    const { clientSlug } = useParams<{ clientSlug: string }>();
    const { config, loading } = useTenantConfig(clientSlug);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!config) {
        return <div className="min-h-screen flex items-center justify-center">Client not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{config.companyName}</h1>
                        <p className="text-gray-500 mt-1">Real-time performance overview</p>
                    </div>
                    <div className="flex gap-3">
                        <select className="bg-white border-none py-2 px-4 rounded-lg text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Total Leads"
                        value="124"
                        trend="+12%"
                        icon={Users}
                        color="indigo"
                    />
                    <StatsCard
                        title="Qualified Leads"
                        value="45"
                        trend="+8%"
                        icon={CheckCircle}
                        color="emerald"
                    />
                    <StatsCard
                        title="Scheduled Calls"
                        value="12"
                        trend="+24%"
                        icon={Calendar}
                        color="blue"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-gray-900">Lead Volume Trend</h3>
                            <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        dy={10}
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
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Column: Lead Quality & Actions */}
                    <div className="space-y-6">
                        {/* Lead Quality Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Lead Quality</h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Qualification Rate</span>
                                <span className="text-lg font-bold text-gray-900">36%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '36%' }}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-emerald-50 rounded-xl">
                                    <p className="text-xs text-emerald-600 font-medium mb-1">Hot Lead</p>
                                    <p className="text-xl font-bold text-gray-900">45</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <p className="text-xs text-red-600 font-medium mb-1">Cold Lead</p>
                                    <p className="text-xl font-bold text-gray-900">79</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all group">
                                    <span className="font-medium text-sm">Copy Chatbot Link</span>
                                    <ArrowUpRight size={16} className="text-gray-400 group-hover:text-indigo-600" />
                                </button>
                                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all group">
                                    <span className="font-medium text-sm">Edit Qualification Questions</span>
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
                <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight size={14} className="mr-1" />
                    <span className="text-xs font-bold">{trend}</span>
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
};
