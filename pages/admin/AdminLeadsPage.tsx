import React, { useState, useEffect } from 'react';
import {
    Search, Filter, User, MessageSquare, Phone, Mail, Calendar,
    ArrowRight, X, Layout, ChevronRight, CheckCircle, Clock, AlertTriangle, RefreshCw,
    CalendarCheck, PhoneCall, Video
} from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { getClients, getTenantLeads, updateLeadStatus, exportLeads } from '../../services/adminService';
import { Client, DashboardLead } from '../../types/admin';
import { exportLeadsToCSV } from '../../utils/csvExport';
import { getCallBooking, formatBookingDateTime, formatSlotTime } from '../../utils/bookingFormat';
import type { CallBooking } from '../../services/bookingService';
import ConversationViewer from '../../components/admin/ConversationViewer';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { S2LeadInsights } from '../../components/admin/S2LeadInsights';
import { S3LeadInsights } from '../../components/admin/S3LeadInsights';
import { S3MaxLeadInsights } from '../../components/admin/S3MaxLeadInsights';
import { S3MappingLeadInsights } from '../../components/admin/S3MappingLeadInsights';

// ── Booked-call display helpers (lead.metadata.call_booking) ──────────────
// Times are always shown in the booking's own timezone. Formatting is wrapped so a
// malformed timestamp can never crash the whole leads page.
const formatCallStart = (booking: CallBooking): string => {
    try {
        return formatBookingDateTime(booking.start_time, booking.timezone);
    } catch {
        return booking.start_time;
    }
};

/** "Tue, 25 Nov · 10:30 AM – 11:00 AM" */
const formatCallRange = (booking: CallBooking): string => {
    const start = formatCallStart(booking);
    if (!booking.end_time) return start;
    try {
        return `${start} – ${formatSlotTime(booking.end_time, booking.timezone)}`;
    } catch {
        return start;
    }
};

/** Only http(s) links are rendered as clickable meeting links. */
const safeMeetLink = (link?: string | null): string | null =>
    link && /^https?:\/\//i.test(link) ? link : null;

/** Compact pill shown under the lead's name in the table when a call is booked. */
const CallBookingPill = ({ lead, isDark }: { lead: unknown; isDark: boolean }) => {
    const booking = getCallBooking(lead);
    if (!booking) return null;
    const when = formatCallStart(booking);
    return (
        <div
            className={`mt-1 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4 ${
                isDark
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
            title={`Call booked: ${when}${booking.timezone ? ` (${booking.timezone})` : ''}`}
        >
            <CalendarCheck size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate whitespace-nowrap">Call · {when}</span>
        </div>
    );
};

/** "Call booked" block (or "call requested" note) for the lead detail drawer header. */
const CallBookingSummary = ({ lead, isDark, textMain, textSub }: { lead: any; isDark: boolean; textMain: string; textSub: string }) => {
    const booking = getCallBooking(lead);
    if (booking) {
        const meetLink = safeMeetLink(booking.meet_link);
        return (
            <div className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50/80 border-emerald-200/80'
            }`}>
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                }`}>
                    <CalendarCheck size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        Call booked
                    </span>
                    <span className={`text-sm font-extrabold block break-words ${textMain}`}>{formatCallRange(booking)}</span>
                    {booking.timezone && (
                        <span className={`text-xs block break-all ${textSub}`}>{booking.timezone}</span>
                    )}
                    {meetLink && (
                        <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                isDark ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            <Video size={14} aria-hidden="true" />
                            Join meeting
                        </a>
                    )}
                </div>
            </div>
        );
    }
    if (lead?.metadata?.call_requested === true) {
        return (
            <div className={`mb-5 flex items-center gap-2 text-xs font-medium ${textSub}`}>
                <PhoneCall size={14} className="shrink-0" aria-hidden="true" />
                <span>Call requested — no time booked yet</span>
            </div>
        );
    }
    return null;
};

export const AdminLeadsPage = () => {
    const { isDark } = useAdminTheme();

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [leads, setLeads] = useState<DashboardLead[]>([]);
    const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null);
    const [loading, setLoading] = useState(true);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');
    const [drawerWidth, setDrawerWidth] = useState(600);

    // Reset tab when lead changes
    useEffect(() => {
        if (selectedLead) setActiveTab('overview');
    }, [selectedLead]);

    // Filters
    const [clientSearch, setClientSearch] = useState('');
    const [leadSearch, setLeadSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');

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
    const handleExport = () => {
        if (!selectedClient) return;
        try {
            exportLeadsToCSV(filteredLeads, selectedClient.name);
        }
        catch (e) {
            console.log("Failed to export", e);
        }
    }
    const cleanDisplayValue = (value: string): string => {
        return value
            .replace(/\*\*/g, '')         // Remove markdown bold
            .replace(/\*/g, '')           // Remove remaining asterisks
            .replace(/["'`]/g, '')        // Remove quotes
            .replace(/[.,!?;:]+$/g, '')   // Remove ending punctuation
            .replace(/\s+/g, ' ')
            .trim();
    };

    const filteredLeads = leads
        .filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                (l as any).email?.toLowerCase().includes(leadSearch.toLowerCase());
            const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

            const leadPriority = ((l as any).metadata?.s3_mapping_lead_output?.lead_priority ||
                (l as any).metadata?.s3_max_lead_output?.lead_priority ||
                (l as any).metadata?.s3_lead_output?.lead_priority ||
                (l as any).metadata?.s2_lead_output?.lead_priority ||
                (l as any).metadata?._s3_priority ||
                (l as any).metadata?._s2_priority)?.toLowerCase();
            const matchesPriority = priorityFilter === 'all' || leadPriority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
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

    // Dynamic Avatar Accent Color based on company initial
    const getAvatarColor = (name: string) => {
        const charCode = name.charCodeAt(0) || 0;
        const colors = [
            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
            'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
            'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
            'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
            'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        ];
        return colors[charCode % colors.length];
    };

    return (
        <AdminLayout>
            <div className={`flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-8rem)] rounded-3xl border overflow-hidden ${borderClass} ${bgClass}`}>

                {/* --- LEFT SIDEBAR: SELECT CLIENT --- */}
                <div className={`w-full lg:w-80 border-b lg:border-b-0 lg:border-r flex flex-col ${borderClass} ${isDark ? 'bg-slate-900/60' : 'bg-slate-50/70'}`}>
                    <div className={`p-4 sm:p-5 border-b ${borderClass}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Select Client</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                            }`}>
                                {filteredClients.length}
                            </span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                className={`w-full pl-10 pr-4 py-2.5 rounded-full text-xs font-normal border focus:outline-none focus:ring-2 transition-all ${
                                    isDark
                                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-700'
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-slate-300'
                                }`}
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-56 lg:max-h-none p-2 sm:p-3 space-y-1.5 custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-xs font-medium text-slate-400">Loading clients...</div>
                        ) : filteredClients.length === 0 ? (
                            <div className="p-8 text-center text-xs font-medium text-slate-400">No clients match search.</div>
                        ) : filteredClients.map(client => {
                            const isSelected = selectedClient?.id === client.id;
                            return (
                                <button
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all border group ${
                                        isSelected
                                            ? (isDark ? 'bg-slate-800 border-slate-700 text-white shadow-md' : 'bg-slate-950 border-slate-900 text-white shadow-md')
                                            : (isDark ? 'border-transparent hover:bg-slate-800/50 text-slate-200' : 'border-transparent hover:bg-white hover:border-slate-200/80 text-slate-900 hover:shadow-sm')
                                    }`}
                                >
                                    {/* Company Avatar Badge */}
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                        isSelected
                                            ? 'bg-white/20 text-white border-white/30'
                                            : getAvatarColor(client.name)
                                    }`}>
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-medium text-sm tracking-tight truncate ${
                                            isSelected ? 'text-white' : (isDark ? 'text-white' : 'text-slate-900')
                                        }`}>
                                            {client.name}
                                        </div>
                                        <div className={`text-xs font-normal tracking-tight truncate mt-0.5 ${
                                            isSelected ? 'text-slate-300' : (isDark ? 'text-slate-400' : 'text-slate-500')
                                        }`}>
                                            /{client.slug}
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className={`flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                                        isSelected ? 'text-white' : (isDark ? 'text-slate-500' : 'text-slate-400')
                                    }`} />
                                </button>
                            );
                        })}
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
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                                        <button
                                            onClick={async () => {
                                                if (!selectedClient) return;
                                                setLeadsLoading(true);
                                                const data = await getTenantLeads(selectedClient.id);
                                                setLeads(data);
                                                setLeadsLoading(false);
                                            }}
                                            disabled={leadsLoading}
                                            className={`p-2 rounded-lg border transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                                            title="Refresh Leads"
                                        >
                                            <RefreshCw size={16} className={`${leadsLoading ? 'animate-spin' : ''}`} />
                                        </button>
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
                                    <div className="flex gap-2">
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
                                        <select
                                            className={`px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                                            value={priorityFilter}
                                            onChange={(e) => setPriorityFilter(e.target.value)}
                                        >
                                            <option value="all">All Priorities</option>
                                            <option value="high">Hot Lead</option>
                                            <option value="medium">Warm Lead</option>
                                            <option value="low">Cold Lead</option>
                                        </select>
                                        <select
                                            className={`px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                                            value={dateSort}
                                            onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                        </select>
                                        <div>
                                            <button
                                                onClick={handleExport}
                                                className="flex items-center gap-2 bg-black text-white px-4 py-1.5
                                                    rounded-lg hover:bg-neutral-800 transition-all duration-200
                                                    shadow-md active:bg-neutral-500">
                                                {/* Download Icon */}
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className="w-5 h-5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 16V4m0 12l-4-4m4 4l4-4M4 20h16"
                                                    />
                                                </svg>

                                                <span className='text-sm font-bold'>Export CSV</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Leads List */}
                            <div className={`flex-1 overflow-y-auto overflow-x-auto ${selectedLead ? 'hidden lg:block' : ''}`}>
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className={`sticky top-0 z-10 font-medium ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-500'} ${borderClass} border-b`}>
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3">Lead Name</th>
                                            <th className="px-3 sm:px-6 py-3">Status</th>
                                            <th className="px-3 sm:px-6 py-3 hidden lg:table-cell">Priority</th>
                                            <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Contact</th>
                                            <th className="px-3 sm:px-6 py-3 hidden md:table-cell">Captured</th>
                                            <th className="px-3 sm:px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                                        {leadsLoading ? (
                                            <tr><td colSpan={6} className="p-6 sm:p-8 text-center text-gray-500 text-xs sm:text-sm">Loading leads...</td></tr>
                                        ) : filteredLeads.length === 0 ? (
                                            <tr><td colSpan={6} className="p-6 sm:p-8 text-center text-gray-500 text-xs sm:text-sm">No leads found.</td></tr>
                                        ) : filteredLeads.map(lead => (
                                            <tr key={lead.id} className={`group transition-colors ${hoverClass} ${selectedLead?.id === lead.id ? (isDark ? 'bg-indigo-900/20' : 'bg-indigo-50') : ''}`}>
                                                <td className="px-3 sm:px-6 py-4 font-medium">
                                                    <div className={`text-sm sm:text-base ${textMain}`}>{lead.name}</div>
                                                    <CallBookingPill lead={lead} isDark={isDark} />
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
                                                <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                                    {(lead as any).metadata?.s3_mapping_lead_output?.lead_priority ? (
                                                        <PriorityBadge isDark={isDark} priority={(lead as any).metadata.s3_mapping_lead_output.lead_priority} />
                                                    ) : (lead as any).metadata?.s3_max_lead_output?.lead_priority ? (
                                                        <PriorityBadge isDark={isDark} priority={(lead as any).metadata.s3_max_lead_output.lead_priority} />
                                                    ) : (lead as any).metadata?.s3_lead_output?.lead_priority ? (
                                                        <PriorityBadge isDark={isDark} priority={(lead as any).metadata.s3_lead_output.lead_priority} />
                                                    ) : (lead as any).metadata?.s2_lead_output?.lead_priority ? (
                                                        <PriorityBadge isDark={isDark} priority={(lead as any).metadata.s2_lead_output.lead_priority} />
                                                    ) : (
                                                        <span className={`text-xs ${textSub}`}>—</span>
                                                    )}
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
                    <>
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedLead(null)} />
                        <div
                            className={`fixed inset-y-0 right-0 w-full sm:w-auto border-l shadow-2xl z-50 flex flex-col ${bgClass} ${borderClass}`}
                            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 640 ? `${drawerWidth}px` : '100%' }}
                        >
                            {/* Resize Handle */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/50 active:bg-indigo-500 z-50 transition-colors"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    const startX = e.clientX;
                                    const startWidth = drawerWidth;

                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                        const delta = startX - moveEvent.clientX;
                                        const newWidth = startWidth + delta;
                                        const maxWidth = window.innerWidth / 2;
                                        const minWidth = 400;
                                        setDrawerWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
                                    };

                                    const onMouseUp = () => {
                                        document.removeEventListener('mousemove', onMouseMove);
                                        document.removeEventListener('mouseup', onMouseUp);
                                        document.body.style.cursor = '';
                                    };

                                    document.body.style.cursor = 'ew-resize';
                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                }}
                            />

                            {/* Header */}
                            <div className={`flex-shrink-0 p-6 border-b ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200/80 bg-white/90'} backdrop-blur-xl sticky top-0 z-10`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                        {/* Avatar Box for Lead */}
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl border shadow-md shrink-0 ${
                                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-950 border-slate-900 text-white'
                                        }`}>
                                            {selectedLead.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-2xl font-extrabold tracking-tight ${textMain} truncate`}>{selectedLead.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                                                    selectedLead.status === 'qualified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                                    selectedLead.status === 'disqualified' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                                                    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        selectedLead.status === 'qualified' ? 'bg-emerald-500' :
                                                        selectedLead.status === 'disqualified' ? 'bg-rose-500' : 'bg-blue-500'
                                                    }`} />
                                                    <select
                                                        value={selectedLead.status}
                                                        onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                                                        className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-xs font-bold uppercase tracking-wider"
                                                    >
                                                        <option value="new" className="text-slate-900 bg-white">New</option>
                                                        <option value="qualified" className="text-slate-900 bg-white">Qualified</option>
                                                        <option value="disqualified" className="text-slate-900 bg-white">Disqualified</option>
                                                    </select>
                                                </div>

                                                {(selectedLead as any).metadata?.s3_mapping_lead_output?.lead_priority ? (
                                                    <PriorityBadge isDark={isDark} priority={(selectedLead as any).metadata.s3_mapping_lead_output.lead_priority} />
                                                ) : (selectedLead as any).metadata?.s3_max_lead_output?.lead_priority ? (
                                                    <PriorityBadge isDark={isDark} priority={(selectedLead as any).metadata.s3_max_lead_output.lead_priority} />
                                                ) : (selectedLead as any).metadata?.s3_lead_output?.lead_priority ? (
                                                    <PriorityBadge isDark={isDark} priority={(selectedLead as any).metadata.s3_lead_output.lead_priority} />
                                                ) : (selectedLead as any).metadata?.s2_lead_output?.lead_priority && (
                                                    <PriorityBadge isDark={isDark} priority={(selectedLead as any).metadata.s2_lead_output.lead_priority} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedLead(null)}
                                        className={`p-2 rounded-xl border transition-all ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Booked call (website chat) */}
                                <CallBookingSummary lead={selectedLead} isDark={isDark} textMain={textMain} textSub={textSub} />

                                {/* Tabs Switcher */}
                                <div className={`p-1 rounded-2xl flex items-center gap-1 border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all
                                            ${activeTab === 'overview'
                                                ? (isDark ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80')
                                                : `${textSub} hover:text-slate-900 dark:hover:text-white`}`}
                                    >
                                        <Layout size={15} />
                                        <span>Overview</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('chat')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all
                                            ${activeTab === 'chat'
                                                ? (isDark ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80')
                                                : `${textSub} hover:text-slate-900 dark:hover:text-white`}`}
                                    >
                                        <MessageSquare size={15} />
                                        <span>Conversation</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {activeTab === 'overview' ? (
                                    <div className="p-6 space-y-6">

                                        {/* 1. Lead Intelligence */}
                                        {(selectedLead as any).metadata?.s3_mapping_lead_output && (
                                            <section className="animate-fade-in-up">
                                                <S3MappingLeadInsights data={(selectedLead as any).metadata.s3_mapping_lead_output} isDark={isDark} />
                                            </section>
                                        )}
                                        {(selectedLead as any).metadata?.s3_max_lead_output && (
                                            <section className="animate-fade-in-up">
                                                <S3MaxLeadInsights data={(selectedLead as any).metadata.s3_max_lead_output} isDark={isDark} />
                                            </section>
                                        )}
                                        {(selectedLead as any).metadata?.s3_lead_output && !(selectedLead as any).metadata?.s3_max_lead_output && (
                                            <section className="animate-fade-in-up">
                                                <S3LeadInsights data={(selectedLead as any).metadata.s3_lead_output} isDark={isDark} />
                                            </section>
                                        )}

                                        {/* 2. Executive Contact Details Grid */}
                                        <section className={`p-5 rounded-3xl border shadow-sm transition-all ${
                                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                                        }`}>
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                                <User size={14} className="text-slate-500" />
                                                <span>Contact Details</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className={`p-4 rounded-2xl border transition-all ${
                                                    isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-100'
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                            <Phone size={17} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                                                            <span className={`text-sm font-extrabold ${textMain}`}>{(selectedLead as any).phone || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`p-4 rounded-2xl border transition-all ${
                                                    isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-100'
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
                                                            <Mail size={17} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                                                            <span className={`text-sm font-extrabold truncate block ${textMain}`}>{(selectedLead as any).email || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`p-4 rounded-2xl border sm:col-span-2 transition-all ${
                                                    isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-100'
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                                            <Calendar size={17} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lead Captured On</span>
                                                            <span className={`text-sm font-extrabold ${textMain}`}>{new Date(selectedLead.created_at).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* 3. Executive Captured Data Cards */}
                                        {(selectedLead as any).metadata && (() => {
                                            const isS3Mapping = !!(selectedLead as any).metadata?.s3_mapping_lead_output;
                                            const hiddenKeys = new Set([
                                                's3_mapping_lead_output', 's2_lead_output', 's3_lead_output', 's3_max_lead_output', 'email',
                                                // shown in the "Call booked" block in the drawer header instead
                                                'call_booking', 'call_requested',
                                                ...(isS3Mapping ? ['lead_priority', 'source'] : []),
                                            ]);
                                            const visibleEntries = Object.entries((selectedLead as any).metadata)
                                                .filter(([key]) => !hiddenKeys.has(key));
                                            if (visibleEntries.length === 0) return null;
                                            return (
                                                <section className={`p-5 rounded-3xl border shadow-sm transition-all ${
                                                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                                                }`}>
                                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                        <span>Captured Requirements & Responses</span>
                                                    </h4>

                                                    <div className="space-y-3">
                                                        {visibleEntries
                                                            .sort(([, valueA], [, valueB]) => {
                                                                const orderA =
                                                                    typeof valueA === 'object' &&
                                                                        valueA !== null &&
                                                                        'order' in valueA
                                                                        ? (valueA as any).order
                                                                        : 999;

                                                                const orderB =
                                                                    typeof valueB === 'object' &&
                                                                        valueB !== null &&
                                                                        'order' in valueB
                                                                        ? (valueB as any).order
                                                                        : 999;

                                                                return orderA - orderB;
                                                            })
                                                            .map(([key, value]) => {
                                                                let displayKey = key.replace(/_/g, ' ');
                                                                let displayValue = '';

                                                                if (
                                                                    typeof value === 'object' &&
                                                                    value !== null &&
                                                                    'label' in value &&
                                                                    'answer' in value
                                                                ) {
                                                                    displayKey = (value as any).label;
                                                                    displayValue = (value as any).answer || '—';
                                                                } else {
                                                                    displayValue =
                                                                        typeof value === 'string'
                                                                            ? value
                                                                            : String(value || '—');
                                                                }

                                                                displayValue = cleanDisplayValue(displayValue);

                                                                return (
                                                                    <div
                                                                        key={key}
                                                                        className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                                                                            isDark
                                                                                ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                                                                                : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                                                                        }`}
                                                                    >
                                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-1">
                                                                            {displayKey}
                                                                        </span>

                                                                        <span className={`text-sm font-extrabold text-right max-w-[65%] break-words px-3 py-1.5 rounded-xl border ${
                                                                            isDark 
                                                                                ? 'bg-slate-800/80 border-slate-700 text-white' 
                                                                                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                                                                        }`}>
                                                                            {displayValue}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </section>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col">
                                        <div className="flex-1 min-h-0 bg-gray-50 dark:bg-slate-900/50">
                                            {(selectedLead as any).conversation_id ? (
                                                <ConversationViewer conversationId={(selectedLead as any).conversation_id} />
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                                    <MessageSquare size={48} className="mb-4 opacity-20" />
                                                    <p>No conversation transcript available.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};
