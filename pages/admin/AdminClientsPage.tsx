import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Building2, Users, Calendar, ChevronRight, Pause, Play, RefreshCw, Sparkles } from 'lucide-react';
import { Client } from '@/types/admin';
import { getClients, getAllClientConversationCounts } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

export const AdminClientsPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [conversationCounts, setConversationCounts] = useState<Record<string, number>>({});
    const [countsLoading, setCountsLoading] = useState(false);
    const { isDark } = useAdminTheme();

    // Function to fetch conversation counts
    const fetchConversationCounts = useCallback(async (clientIds: string[]) => {
        if (clientIds.length === 0) return;
        setCountsLoading(true);
        try {
            const counts = await getAllClientConversationCounts(clientIds);
            setConversationCounts(counts);
        } catch (e) {
            console.error('Error fetching conversation counts:', e);
        } finally {
            setCountsLoading(false);
        }
    }, []);

    // Initial load of clients
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            const data = await getClients();
            setClients(data);
            setLoading(false);

            // Fetch conversation counts for all clients after loading clients
            if (data.length > 0) {
                const clientIds = data.map(c => c.id);
                await fetchConversationCounts(clientIds);
            }
        };
        fetchClients();
    }, [fetchConversationCounts]);

    // Real-time update: refresh conversation counts every 30 seconds
    useEffect(() => {
        if (clients.length === 0) return;

        const clientIds = clients.map(c => c.id);
        const intervalId = setInterval(() => {
            fetchConversationCounts(clientIds);
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [clients, fetchConversationCounts]);

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        const colors: Record<string, { light: string; dark: string }> = {
            Active: { light: 'bg-green-100 text-green-800', dark: 'bg-green-900/50 text-green-400' },
            Inactive: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-700 text-gray-400' },
            Onboarding: { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900/50 text-blue-400' },
            Paused: { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900/50 text-yellow-400' },
        };
        return colors[status] || colors.Inactive;
    };

    const getPlanColor = (plan: string) => {
        const colors: Record<string, { light: string; dark: string }> = {
            S3: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900/50 text-purple-400' },
            S2: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900/50 text-indigo-400' },
            S1: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-700 text-gray-400' },
        };
        return colors[plan] || colors.S1;
    };

    const isS2OrHigher = (plan: string) => plan === 'S2' || plan === 'S3';

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Clients</h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Manage all your client configurations and settings
                    </p>
                </div>
                <Link to="/admin/clients/new" className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:scale-105">
                    <Plus size={20} className="mr-2" />
                    Add New Client
                </Link>
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-xl border mb-6 flex flex-col md:flex-row gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                }`}>
                <div className="relative flex-1">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search clients by name or slug..."
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark
                            ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                            }`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={`flex rounded-lg p-1 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    {['all', 'Active', 'Inactive', 'Onboarding', 'Paused'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === status
                                ? (isDark ? 'bg-slate-600 text-white' : 'bg-white text-gray-900 shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')
                                }`}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clients Grid */}
            {loading ? (
                <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Loading clients...
                </div>
            ) : filteredClients.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    No clients found matching your search.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => (
                        <Link
                            key={client.id}
                            to={`/admin/clients/${client.id}`}
                            className={`group p-5 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1 ${isDark
                                ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50'
                                : 'bg-white border-gray-200 hover:border-indigo-300'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {client.name}
                                        </h3>
                                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                            /{client.slug}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-indigo-400' : 'text-indigo-600'
                                    }`} size={20} />
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? getStatusColor(client.status).dark : getStatusColor(client.status).light
                                    }`}>
                                    {client.status === 'Paused' && <Pause size={12} className="mr-1" />}
                                    {client.status === 'Active' && <Play size={12} className="mr-1" />}
                                    {client.status}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? getPlanColor(client.plan).dark : getPlanColor(client.plan).light
                                    }`}>
                                    {client.plan}
                                </span>
                                {isS2OrHigher(client.plan) && (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                        <Sparkles size={10} /> S2 Features
                                    </span>
                                )}
                            </div>

                            <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                <div className="flex items-center gap-1">
                                    {countsLoading ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <Users size={14} />
                                    )}
                                    <span>{conversationCounts[client.id] ?? 0} users</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>{client.onboardedDate}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
};
