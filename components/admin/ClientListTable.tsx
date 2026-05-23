import React, { useState, useEffect, useCallback } from 'react';
import { MoreHorizontal, Search, Star, LayoutDashboard, RefreshCw } from 'lucide-react';
import { Client } from '@/types/admin';
import { getClients, getAllClientConversationCounts } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

interface ClientListTableProps {
    onSpotlight: (client: Client) => void;
}

export const ClientListTable: React.FC<ClientListTableProps> = ({ onSpotlight }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            const data = await getClients();
            setClients(data);
            setLoading(false);

            // Fetch conversation counts after loading clients
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
        }, 1800000); // 30 minutes

        return () => clearInterval(intervalId);
    }, [clients, fetchConversationCounts]);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors ${isDark
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-100'
            }`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>All Clients</h3>
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        className={`pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDark
                            ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                            }`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className={`w-full text-left text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <thead className={`text-xs uppercase font-semibold ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                        <tr>
                            <th className="px-6 py-4">Client Name</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4">Users</th>
                            <th className="px-6 py-4">Onboarded</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className={`px-6 py-8 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Loading clients...</td>
                            </tr>
                        ) : filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <tr key={client.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold mr-3 ${isDark
                                                ? 'bg-indigo-900/50 text-indigo-400'
                                                : 'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.name}</div>
                                                <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{client.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${client.status === 'Active'
                                                ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800')
                                                : client.status === 'Onboarding'
                                                    ? (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-800')
                                                    : (isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-800')}`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.plan}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        <span className="inline-flex items-center gap-1.5">
                                            {countsLoading && <RefreshCw size={12} className="animate-spin text-indigo-500" />}
                                            {conversationCounts[client.id] ?? 0}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.onboardedDate}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => onSpotlight(client)}
                                                className={`p-2 rounded-full transition-colors ${isDark
                                                    ? 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-900/30'
                                                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                                                    }`}
                                                title="Spotlight Client"
                                            >
                                                <Star size={18} />
                                            </button>
                                            <button
                                                onClick={() => window.open(`/${client.id}/dashboard`, '_blank')}
                                                className={`p-2 rounded-full transition-colors ${isDark
                                                    ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700'
                                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                                                    }`}
                                                title="Open Dashboard"
                                            >
                                                <LayoutDashboard size={18} />
                                            </button>
                                            <button className={`p-2 rounded-full transition-colors ${isDark
                                                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                }`}>
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className={`px-6 py-8 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No clients found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
