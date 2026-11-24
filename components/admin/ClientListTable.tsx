import React, { useState, useEffect, useCallback } from 'react';
import { Search, Star, LayoutDashboard, RefreshCw, ChevronLeft, ChevronRight, UserCheck, ExternalLink, ShieldCheck } from 'lucide-react';
import { Client } from '@/types/admin';
import { getClients, getAllClientConversationCounts } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { motion } from 'framer-motion';

interface ClientListTableProps {
    onSpotlight: (client: Client) => void;
}

export const ClientListTable: React.FC<ClientListTableProps> = ({ onSpotlight }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [conversationCounts, setConversationCounts] = useState<Record<string, number>>({});
    const [countsLoading, setCountsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { isDark } = useAdminTheme();

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

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            const data = await getClients();
            setClients(data);
            setLoading(false);

            if (data.length > 0) {
                const clientIds = data.map(c => c.id);
                await fetchConversationCounts(clientIds);
            }
        };
        fetchClients();
    }, [fetchConversationCounts]);

    useEffect(() => {
        if (clients.length === 0) return;
        const clientIds = clients.map(c => c.id);
        const intervalId = setInterval(() => {
            fetchConversationCounts(clientIds);
        }, 1800000);
        return () => clearInterval(intervalId);
    }, [clients, fetchConversationCounts]);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.plan?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className={`rounded-3xl border shadow-sm overflow-hidden transition-all ${
            isDark 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-white border-slate-200/80 text-slate-900'
        }`}>
            {/* Table Header Controls */}
            <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
                <div>
                    <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-extrabold tracking-tight">Client Directory</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isDark 
                                ? 'bg-slate-800 text-slate-300 border-slate-700' 
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                            {filteredClients.length} tenants
                        </span>
                    </div>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Manage multi-tenant WhatsApp automation accounts and active integrations
                    </p>
                </div>

                {/* Search Bar & Refresh Button */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
                        <input
                            type="text"
                            placeholder="Filter by client name, slug, or plan..."
                            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 transition-all ${
                                isDark
                                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-slate-300'
                            }`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <button
                        onClick={() => fetchConversationCounts(clients.map(c => c.id))}
                        disabled={countsLoading}
                        className={`p-2.5 rounded-xl border transition-all ${
                            isDark 
                                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                        title="Refresh Convo Counts"
                    >
                        <RefreshCw size={16} className={countsLoading ? 'animate-spin text-emerald-500' : ''} />
                    </button>
                </div>
            </div>

            {/* Shadcn UI Table Element */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                            isDark 
                                ? 'bg-slate-950/60 border-slate-800 text-slate-400' 
                                : 'bg-slate-50/70 border-slate-200/80 text-slate-500'
                        }`}>
                            <th className="py-3.5 px-6">Client / Tenant</th>
                            <th className="py-3.5 px-6">Status</th>
                            <th className="py-3.5 px-6">Subscription Plan</th>
                            <th className="py-3.5 px-6">Convo Volume</th>
                            <th className="py-3.5 px-6">Onboarded</th>
                            <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <RefreshCw size={20} className="animate-spin text-emerald-500" />
                                        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading client directory...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedClients.length > 0 ? (
                            paginatedClients.map((client) => (
                                <tr key={client.id} className={`group transition-colors ${
                                    isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                                }`}>
                                    {/* Client Name & Avatar */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-sm ${
                                                isDark 
                                                    ? 'bg-slate-800 border-slate-700 text-white' 
                                                    : 'bg-slate-900 border-slate-800 text-white'
                                            }`}>
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-sm flex items-center gap-1.5">
                                                    <span>{client.name}</span>
                                                    {client.status === 'Active' && (
                                                        <ShieldCheck size={14} className="text-emerald-500" />
                                                    )}
                                                </div>
                                                <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {client.slug}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status Badge */}
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                            client.status === 'Active'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : client.status === 'Onboarding'
                                                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}>
                                            {client.status}
                                        </span>
                                    </td>

                                    {/* Plan Pill */}
                                    <td className="py-4 px-6">
                                        <span className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold border ${
                                            isDark 
                                                ? 'bg-slate-800/80 border-slate-700 text-slate-300' 
                                                : 'bg-slate-100 border-slate-200 text-slate-700'
                                        }`}>
                                            {client.plan || 'Standard'}
                                        </span>
                                    </td>

                                    {/* Convo Volume */}
                                    <td className="py-4 px-6 font-bold">
                                        <div className="flex items-center gap-1.5">
                                            {countsLoading && <RefreshCw size={12} className="animate-spin text-emerald-500" />}
                                            <span className="text-sm">{(conversationCounts[client.id] ?? 0).toLocaleString()}</span>
                                            <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>convos</span>
                                        </div>
                                    </td>

                                    {/* Onboarded Date */}
                                    <td className={`py-4 px-6 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {client.onboardedDate || '2026-01-15'}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => window.open(`/${client.id}/dashboard`, '_blank')}
                                                className={`p-2 rounded-lg border transition-all ${
                                                    isDark 
                                                        ? 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' 
                                                        : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                                }`}
                                                title="Open Tenant Dashboard"
                                            >
                                                <ExternalLink size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className={`py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    No clients match your filter query.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Table Footer Pagination */}
            <div className={`p-4 px-6 border-t flex items-center justify-between text-xs font-medium ${
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}>
                <span>
                    Showing {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            isDark 
                                ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="px-2 font-mono font-bold">{currentPage} / {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            isDark 
                                ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

