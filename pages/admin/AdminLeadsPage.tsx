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
        disqualified: leads.filter(l => l.status === 'disqualified').length
    };

    // Styles
    const borderClass = isDark ? 'border-slate-700' : 'border-gray-200';
    const bgClass = isDark ? 'bg-slate-800' : 'bg-white';
    const textMain = isDark ? 'text-white' : 'text-gray-900';
    const textSub = isDark ? 'text-slate-400' : 'text-gray-500';
    const hoverClass = isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';

    return (
        <AdminLayout>
            <div className={`flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-8rem)] rounded-xl border overflow-hidden ${borderClass} ${bgClass}`}>

                {/* --- LEFT SIDEBAR: CLIENTS --- */}
                <div className={`w-full lg:w-80 border-b lg:border-b-0 lg:border-r flex flex-col ${borderClass} ${isDark ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                    <div className={`p-3 sm:p-4 border-b ${borderClass}`}>
                        <h2 className={`font-semibold text-sm sm:text-base mb-2 sm:mb-3 ${textMain}`}>Select Client</h2>
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

                    <div className="flex-1 overflow-y-auto max-h-48 lg:max-h-none">
                        {loading ? (
                            <div className={`p-6 sm:p-8 text-center text-xs sm:text-sm ${textSub}`}>Loading...</div>
                        ) : filteredClients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                className={`w-full text-left p-2 sm:p-3 flex items-center gap-2 sm:gap-3 transition-colors border-l-2 ${selectedClient?.id === client.id
                                    ? `bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500`
                                    : `border-transparent ${hoverClass}`
                                    }`}
                            >
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {client.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-xs sm:text-sm truncate ${textMain}`}>{client.name}</div>
                                    <div className={`text-xs ${textSub} truncate`}>/{client.slug}</div>
                                </div>
                                {selectedClient?.id === client.id && <ChevronRight size={16} className="ml-auto text-indigo-500 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- MAIN CONTENT: LEADS --- */}
                <div className="flex-1 flex flex-col min-w-0">
                    {!selectedClient ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8">
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4 ${isDark ? 'bg-slate-800 text-slate-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Layout size={24} className="sm:w-8 sm:h-8" />
                            </div>
                            <h3 className={`text-base sm:text-lg font-medium ${textMain}`}>No Client Selected</h3>
                            <p className={`text-sm ${textSub}`}>Select a client from above to view and manage their leads.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header & Stats */}
                            <div className={`p-3 sm:p-4 lg:p-6 border-b ${borderClass}`}>
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div>
                                        <h2 className={`text-xl sm:text-2xl font-bold ${textMain}`}>{selectedClient.name} Leads</h2>
                                        <p className={`text-xs sm:text-sm ${textSub}`}>Manage leads captured by the AI agent.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        {['new', 'qualified', 'disqualified'].map(s => (
                                            <div key={s} className={`px-2 sm:px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 sm:gap-2 ${borderClass}`}>
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s === 'new' ? 'bg-blue-500' : s === 'qualified' ? 'bg-green-500' : 'bg-red-500'
                                                    }`} />
                                                <span className="capitalize whitespace-nowrap">{s}</span>
                                                <span className={textMain}>{(stats as any)[s]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                    <div className="relative flex-1">
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
                                        <option value="qualified">Qualified</option>
                                        <option value="disqualified">Disqualified</option>
                                    </select>
                                </div>
                            </div>

                            {/* Leads List */}
                            <div className={`flex-1 overflow-y-auto overflow-x-auto ${selectedLead ? 'hidden lg:block' : ''}`}>
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className={`sticky top-0 z-10 font-medium ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-500'} ${borderClass} border-b`}>
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3">Lead Name</th>
                                            <th className="px-3 sm:px-6 py-3">Status</th>
                                            <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Contact</th>
                                            <th className="px-3 sm:px-6 py-3 hidden md:table-cell">Captured</th>
                                            <th className="px-3 sm:px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                                        {leadsLoading ? (
                                            <tr><td colSpan={5} className="p-6 sm:p-8 text-center text-gray-500 text-xs sm:text-sm">Loading leads...</td></tr>
                                        ) : filteredLeads.length === 0 ? (
                                            <tr><td colSpan={5} className="p-6 sm:p-8 text-center text-gray-500 text-xs sm:text-sm">No leads found.</td></tr>
                                        ) : filteredLeads.map(lead => (
                                            <tr key={lead.id} className={`group transition-colors ${hoverClass} ${selectedLead?.id === lead.id ? (isDark ? 'bg-indigo-900/20' : 'bg-indigo-50') : ''}`}>
                                                <td className="px-3 sm:px-6 py-4 font-medium">
                                                    <div className={`text-sm sm:text-base ${textMain}`}>{lead.name}</div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                                        ${lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            lead.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                lead.status === 'disqualified' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                        {lead.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                                                    <div className="space-y-1">
                                                        {(lead as any).email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} /> <span className="truncate max-w-[200px]">{(lead as any).email}</span></div>}
                                                        {(lead as any).phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} /> {(lead as any).phone}</div>}
                                                    </div>
                                                </td>
                                                <td className={`px-3 sm:px-6 py-4 text-xs hidden md:table-cell ${textSub}`}>
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedLead(lead)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs px-2 sm:px-3 py-1.5 border border-indigo-200 rounded hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/30 whitespace-nowrap"
                                                    >
                                                        View
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
                    <div className={`fixed inset-0 lg:relative lg:inset-auto lg:w-[450px] xl:w-[500px] border-l flex flex-col shadow-xl z-50 lg:z-20 ${bgClass} ${borderClass} transition-transform duration-300`}>
                        <div className={`p-4 sm:p-6 border-b flex justify-between items-start ${borderClass}`}>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-lg sm:text-xl font-bold ${textMain} truncate`}>{selectedLead.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs ${textSub}`}>Status:</span>
                                    <select
                                        value={selectedLead.status}
                                        onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                                        className={`text-xs font-medium bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-indigo-500 font-bold`}
                                    >
                                        <option value="new">New</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="disqualified">Disqualified</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className={`${textSub} hover:text-gray-700 flex-shrink-0 ml-2`}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                {/* Contact Info */}
                                <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                                    <h4 className={`text-sm font-semibold mb-3 ${textMain}`}>Contact Information</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className={`text-sm ${textMain} break-all`}>{(selectedLead as any).email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className={`text-sm ${textMain}`}>{(selectedLead as any).phone || 'No phone'}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
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
                                                    <div key={key} className={`flex flex-col sm:flex-row text-sm p-3 ${i % 2 === 0 ? (isDark ? 'bg-slate-800' : 'bg-white') : (isDark ? 'bg-slate-900/30' : 'bg-gray-50')}`}>
                                                        <span className={`sm:w-1/3 font-medium capitalize ${textSub} mb-1 sm:mb-0`}>{displayKey}</span>
                                                        <span className={`sm:w-2/3 ${textMain} break-words`}>{displayValue}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Conversation History */}
                                <div>
                                    <h4 className={`text-sm font-semibold mb-3 ${textMain}`}>Conversation History</h4>
                                    <div className={`rounded-xl border overflow-hidden h-80 sm:h-96 ${borderClass}`}>
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
