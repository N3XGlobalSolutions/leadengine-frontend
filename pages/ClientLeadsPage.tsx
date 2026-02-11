import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search, User, MessageSquare, Phone, Mail, Calendar,
    ArrowLeft, X, Layout, ChevronRight, CheckCircle, Clock, Filter
} from 'lucide-react';
import { getTenantLeads, getClientById, updateLeadStatus } from '../services/adminService';
import { DashboardLead, Client } from '../types/admin';
import ConversationViewer from '../components/admin/ConversationViewer';
import { PriorityBadge } from '../components/admin/PriorityBadge';
import { S2LeadInsights } from '../components/admin/S2LeadInsights';

export const ClientLeadsPage = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [client, setClient] = useState<Client | null>(null);
    const [leads, setLeads] = useState<DashboardLead[]>([]);
    const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [leadSearch, setLeadSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Load Client & Leads
    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            setLoading(true);
            try {
                const [clientData, leadsData] = await Promise.all([
                    getClientById(tenantId),
                    getTenantLeads(tenantId)
                ]);
                setClient(clientData);
                setLeads(leadsData);

                // Check for leadId in URL to open details automatically
                const leadIdFromUrl = searchParams.get('leadId');
                if (leadIdFromUrl) {
                    const leadToSelect = leadsData.find(l => l.id === leadIdFromUrl);
                    if (leadToSelect) {
                        setSelectedLead(leadToSelect);
                    }
                }

            } catch (err) {
                console.error("Failed to fetch leads data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId]);

    // Handle selection and URL update
    const handleSelectLead = (lead: DashboardLead | null) => {
        setSelectedLead(lead);
        if (lead) {
            setSearchParams({ leadId: lead.id });
        } else {
            setSearchParams({});
        }
    };

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
    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
            (l as any).email?.toLowerCase().includes(leadSearch.toLowerCase()) ||
            (l as any).phone?.includes(leadSearch);
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!client) return <div className="text-center p-10">Client not found</div>;

    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        disqualified: leads.filter(l => l.status === 'disqualified').length
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-3 sm:p-4 lg:p-6 relative flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4 sm:space-y-6">

                {/* Header */}
                <header className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate(`/${tenantId}/dashboard`)}
                        className="p-2 hover:bg-white rounded-full transition-colors flex-shrink-0"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Leads</h1>
                        <p className="text-gray-500 text-xs sm:text-sm">Manage and view details for {client.name}</p>
                    </div>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-0 relative">

                    {/* LEADS LIST CARD */}
                    <div className={`flex-1 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${selectedLead ? 'hidden lg:flex lg:w-1/2' : 'w-full'}`}>

                        {/* Toolbar */}
                        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search leads..."
                                        className="pl-9 pr-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                                        value={leadSearch}
                                        onChange={(e) => setLeadSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="new">New</option>
                                    <option value="qualified">Qualified</option>
                                    <option value="disqualified">Disqualified</option>
                                </select>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {['new', 'qualified', 'disqualified'].map(s => (
                                    <div key={s} className="px-2 sm:px-3 py-1 rounded-lg border border-gray-100 text-xs font-medium flex items-center gap-1 sm:gap-2 bg-gray-50">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s === 'new' ? 'bg-blue-500' : s === 'qualified' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="capitalize text-gray-600 whitespace-nowrap">{s}: {(stats as any)[s]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead className="sticky top-0 z-10 bg-gray-50 font-medium text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3">Lead Name</th>
                                        <th className="px-3 sm:px-6 py-3">Status</th>
                                        <th className="px-3 sm:px-6 py-3 hidden lg:table-cell">Priority</th>
                                        <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Contact</th>
                                        <th className="px-3 sm:px-6 py-3 hidden md:table-cell">Captured</th>
                                        <th className="px-3 sm:px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredLeads.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No leads found.</td></tr>
                                    ) : filteredLeads.map(lead => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => handleSelectLead(lead)}
                                            className={`group transition-colors cursor-pointer hover:bg-gray-50 ${selectedLead?.id === lead.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
                                        >
                                            <td className="px-3 sm:px-6 py-4 font-medium">
                                                <div className="text-gray-900">{lead.name}</div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4">
                                                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                                    ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                        lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                                            lead.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                                {(lead as any).metadata?.s2_lead_output?.lead_priority ? (
                                                    <PriorityBadge priority={(lead as any).metadata.s2_lead_output.lead_priority} />
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                                                <div className="space-y-1">
                                                    {(lead as any).email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} /> <span className="truncate max-w-[200px]">{(lead as any).email}</span></div>}
                                                    {(lead as any).phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} /> {(lead as any).phone}</div>}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 text-xs text-gray-500 hidden md:table-cell">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 text-right">
                                                <ChevronRight size={16} className={`text-gray-300 group-hover:text-indigo-600 transition-colors ${selectedLead?.id === lead.id ? 'text-indigo-600' : ''}`} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* DETAILS DRAWER / PANEL */}
                    {selectedLead && (
                        <div className="fixed inset-0 lg:relative lg:inset-auto lg:w-1/2 xl:w-[450px] bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden z-50 lg:z-auto animate-in slide-in-from-right duration-300">
                            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{selectedLead.name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-500">Status:</span>
                                        <select
                                            value={selectedLead.status}
                                            onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                                            className="text-xs font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-indigo-600 uppercase tracking-wide hover:text-indigo-800 transition-colors"
                                        >
                                            <option value="new">New</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="disqualified">Disqualified</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={() => handleSelectLead(null)} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                                {/* Contact Info */}
                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-700 break-all">{(selectedLead as any).email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-700">{(selectedLead as any).phone || 'No phone'}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">Captured: {new Date(selectedLead.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata */}
                                {(selectedLead as any).metadata && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Collected Data</h4>
                                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                                            {Object.entries((selectedLead as any).metadata)
                                                .filter(([key]) => key !== 's2_lead_output')
                                                .map(([key, value], i) => {
                                                    let displayKey = key.replace(/_/g, ' ');
                                                    let displayValue = '';
                                                    if (typeof value === 'object' && value !== null && 'label' in value && 'answer' in value) {
                                                        displayKey = (value as any).label;
                                                        displayValue = (value as any).answer || 'Not provided';
                                                    } else {
                                                        displayValue = typeof value === 'string' ? value : String(value || 'Not provided');
                                                    }

                                                    return (
                                                        <div key={key} className={`flex flex-col sm:flex-row text-sm p-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                            <span className="sm:w-1/3 font-medium text-gray-500 capitalize mb-1 sm:mb-0">{displayKey}</span>
                                                            <span className="sm:w-2/3 text-gray-900 break-words">{displayValue}</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}

                                {/* S2 Lead Intelligence */}
                                {(selectedLead as any).metadata?.s2_lead_output && (
                                    <S2LeadInsights data={(selectedLead as any).metadata.s2_lead_output} />
                                )}

                                {/* Conversation History */}
                                <div className="flex-1 flex flex-col min-h-[300px]">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Conversation History</h4>
                                    <div className="rounded-xl border border-gray-200 overflow-hidden flex-1 h-[300px] sm:h-[400px]">
                                        {(selectedLead as any).conversation_id ? (
                                            <ConversationViewer
                                                conversationId={(selectedLead as any).conversation_id}
                                                config={client.config}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-sm bg-gray-50">
                                                No conversation linked.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
