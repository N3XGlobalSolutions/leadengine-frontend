import React, { useState, useEffect } from 'react';
import {
    Search, Filter, User, MessageSquare, Phone, Mail, Calendar,
    ArrowRight, X, Layout, ChevronRight, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { getClients, getTenantLeads, updateLeadStatus } from '../../services/adminService';
import { Client, DashboardLead } from '../../types/admin';
import ConversationViewer from '../../components/admin/ConversationViewer';

export const AdminLeadsPage = () => {
    const { isDark } = useAdminTheme();

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [leads, setLeads] = useState<DashboardLead[]>([]);
    const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null);
    const [loading, setLoading] = useState(true);
    const [leadsLoading, setLeadsLoading] = useState(false);

    // Filters
    const [clientSearch, setClientSearch] = useState('');
    const [leadSearch, setLeadSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Initial Load
    useEffect(() => {
        const fetchClients = async () => {
            const data = await getClients();
            setClients(data);
            setLoading(false);
        };
        fetchClients();
    }, []);

    // Load Leads when Client Selected
    useEffect(() => {
        const fetchLeads = async () => {
            if (!selectedClient) return;
            setLeadsLoading(true);
            const data = await getTenantLeads(selectedClient.id);
            setLeads(data);
            setLeadsLoading(false);
        };
        fetchLeads();
    }, [selectedClient]);

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        try {
            await updateLeadStatus(leadId, newStatus);
            // Update local state
            setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            if (selectedLead && selectedLead.id === leadId) {
                setSelectedLead({ ...selectedLead, status: newStatus });
            }
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    // Filter Logic
    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.slug.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
            (l as any).email?.toLowerCase().includes(leadSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        converted: leads.filter(l => l.status === 'converted').length
    };

    // Styles
    const borderClass = isDark ? 'border-slate-700' : 'border-gray-200';
    const bgClass = isDark ? 'bg-slate-800' : 'bg-white';
    const textMain = isDark ? 'text-white' : 'text-gray-900';
    const textSub = isDark ? 'text-slate-400' : 'text-gray-500';
    const hoverClass = isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';

    return (
        <AdminLayout>
            <div className={`flex h-[calc(100vh-8rem)] rounded-xl border overflow-hidden ${borderClass} ${bgClass}`}>

                {/* --- LEFT SIDEBAR: CLIENTS --- */}
                <div className={`w-80 border-r flex flex-col ${borderClass} ${isDark ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                    <div className={`p-4 border-b ${borderClass}`}>
                        <h2 className={`font-semibold mb-3 ${textMain}`}>Select Client</h2>
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSub}`} size={16} />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className={`p-8 text-center text-sm ${textSub}`}>Loading...</div>
                        ) : filteredClients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                className={`w-full text-left p-3 flex items-center gap-3 transition-colors border-l-2 ${selectedClient?.id === client.id
                                    ? `bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500`
                                    : `border-transparent ${hoverClass}`
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {client.name.charAt(0)}
                                </div>
                                <div>
                                    <div className={`font-medium text-sm ${textMain}`}>{client.name}</div>
                                    <div className={`text-xs ${textSub}`}>/{client.slug}</div>
                                </div>
                                {selectedClient?.id === client.id && <ChevronRight size={16} className="ml-auto text-indigo-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- MAIN CONTENT: LEADS --- */}
                <div className="flex-1 flex flex-col min-w-0">
                    {!selectedClient ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800 text-slate-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Layout size={32} />
                            </div>
                            <h3 className={`text-lg font-medium ${textMain}`}>No Client Selected</h3>
                            <p className={textSub}>Select a client from the sidebar to view and manage their leads.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header & Stats */}
                            <div className={`p-6 border-b ${borderClass}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className={`text-2xl font-bold ${textMain}`}>{selectedClient.name} Leads</h2>
                                        <p className={textSub}>Manage leads captured by the AI agent.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['new', 'qualified', 'converted'].map(s => (
                                            <div key={s} className={`px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-2 ${borderClass}`}>
                                                <span className={`w-2 h-2 rounded-full ${s === 'new' ? 'bg-blue-500' : s === 'qualified' ? 'bg-green-500' : 'bg-purple-500'
                                                    }`} />
                                                <span className="capitalize">{s}</span>
                                                <span className={textMain}>{(stats as any)[s]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSub}`} size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search leads by name or email..."
                                            className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                                            value={leadSearch}
                                            onChange={(e) => setLeadSearch(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className={`px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="converted">Converted</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                            </div>

                            {/* Leads List */}
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className={`sticky top-0 z-10 font-medium ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-500'} ${borderClass} border-b`}>
                                        <tr>
                                            <th className="px-6 py-3">Lead Name</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Contact</th>
                                            <th className="px-6 py-3">Captured</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                                        {leadsLoading ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading leads...</td></tr>
                                        ) : filteredLeads.length === 0 ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No leads found.</td></tr>
                                        ) : filteredLeads.map(lead => (
                                            <tr key={lead.id} className={`group transition-colors ${hoverClass} ${selectedLead?.id === lead.id ? (isDark ? 'bg-indigo-900/20' : 'bg-indigo-50') : ''}`}>
                                                <td className="px-6 py-4 font-medium">
                                                    <div className={`text-base ${textMain}`}>{lead.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                                        ${lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            lead.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                lead.status === 'converted' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                        {lead.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {(lead as any).email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} /> {(lead as any).email}</div>}
                                                        {(lead as any).phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} /> {(lead as any).phone}</div>}
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-xs ${textSub}`}>
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedLead(lead)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs px-3 py-1.5 border border-indigo-200 rounded hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* --- RIGHT DRAWER: LEAD DETAILS --- */}
                {selectedLead && (
                    <div className={`w-[450px] border-l flex flex-col shadow-xl absolute right-0 top-0 h-full z-20 ${bgClass} ${borderClass} transition-transform duration-300 transform translate-x-0`}>
                        <div className={`p-6 border-b flex justify-between items-start ${borderClass}`}>
                            <div>
                                <h3 className={`text-xl font-bold ${textMain}`}>{selectedLead.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs ${textSub}`}>Status:</span>
                                    <select
                                        value={selectedLead.status}
                                        onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                                        className={`text-xs font-medium bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-indigo-500 font-bold`}
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="converted">Converted</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className={`${textSub} hover:text-gray-700`}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Contact Info */}
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                                    <h4 className={`text-sm font-semibold mb-3 ${textMain}`}>Contact Information</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-gray-400" />
                                            <span className={`text-sm ${textMain}`}>{(selectedLead as any).email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-gray-400" />
                                            <span className={`text-sm ${textMain}`}>{(selectedLead as any).phone || 'No phone'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span className={`text-sm ${textMain}`}>Captured: {new Date(selectedLead.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata / Form Data */}
                                {(selectedLead as any).metadata && (
                                    <div>
                                        <h4 className={`text-sm font-semibold mb-3 ${textMain}`}>Collected Data</h4>
                                        <div className={`rounded-xl border overflow-hidden ${borderClass}`}>
                                            {Object.entries((selectedLead as any).metadata).map(([key, value], i) => {
                                                // Handle both old format (string) and new format ({label, answer})
                                                let displayKey = key.replace(/_/g, ' ');
                                                let displayValue = '';

                                                if (typeof value === 'object' && value !== null && 'label' in value && 'answer' in value) {
                                                    // New format from state machine
                                                    displayKey = (value as any).label;
                                                    displayValue = (value as any).answer || 'Not provided';
                                                } else {
                                                    // Old format or simple value
                                                    displayValue = typeof value === 'string' ? value : String(value || 'Not provided');
                                                }

                                                return (
                                                    <div key={key} className={`flex text-sm p-3 ${i % 2 === 0 ? (isDark ? 'bg-slate-800' : 'bg-white') : (isDark ? 'bg-slate-900/30' : 'bg-gray-50')}`}>
                                                        <span className={`w-1/3 font-medium capitalize ${textSub}`}>{displayKey}</span>
                                                        <span className={`w-2/3 ${textMain}`}>{displayValue}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Conversation History */}
                                <div>
                                    <h4 className={`text-sm font-semibold mb-3 ${textMain}`}>Conversation History</h4>
                                    <div className={`rounded-xl border overflow-hidden h-96 ${borderClass}`}>
                                        {(selectedLead as any).conversation_id ? (
                                            <ConversationViewer conversationId={(selectedLead as any).conversation_id} />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                No conversation linked.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
