import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, Calendar, ChevronRight, Pause, Play, RefreshCw, Building2, LayoutGrid, ListFilter, X } from 'lucide-react';
import { Client } from '@/types/admin';
import { getClientsPaginated, getAllClientConversationCounts } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SkeletonClientsGrid } from '../../components/admin/SkeletonLoader';

export const AdminClientsPage: React.FC = () => {
    const { isDark } = useAdminTheme();
    const { user } = useAdminAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [totalClients, setTotalClients] = useState<number>(0);
    const [serverPlanCounts, setServerPlanCounts] = useState<Record<string, number>>({});
    
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [planFilter, setPlanFilter] = useState<string>('all');
    const [sortOption, setSortOption] = useState<string>('newest');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [conversationCounts, setConversationCounts] = useState<Record<string, number>>({});
    const [countsLoading, setCountsLoading] = useState(false);

    const observerTargetRef = useRef<HTMLDivElement>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Aggregate plan counts using server totals if available, else fallback to loaded
    const planCounts = {
        all: serverPlanCounts['all'] ?? totalClients ?? clients.length,
        S1: serverPlanCounts['S1'] ?? clients.filter(c => c.plan === 'S1').length,
        S2: serverPlanCounts['S2'] ?? clients.filter(c => c.plan === 'S2').length,
        S3: serverPlanCounts['S3'] ?? clients.filter(c => c.plan === 'S3').length,
        S3_MAX: serverPlanCounts['S3_MAX'] ?? clients.filter(c => c.plan === 'S3_MAX').length,
        S3_MAPPING: serverPlanCounts['S3_MAPPING'] ?? clients.filter(c => c.plan === 'S3_MAPPING').length,
    };

    // Function to fetch conversation counts incrementally for loaded clients
    const fetchConversationCounts = useCallback(async (clientIds: string[]) => {
        if (!clientIds || clientIds.length === 0) return;
        setCountsLoading(true);
        try {
            const counts = await getAllClientConversationCounts(clientIds);
            setConversationCounts(prev => ({ ...prev, ...counts }));
        } catch (e) {
            console.error('Error fetching conversation counts:', e);
        } finally {
            setCountsLoading(false);
        }
    }, []);

    // Load initial page of clients whenever filters change
    const loadInitialClients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getClientsPaginated({
                limit: 24,
                cursor: null,
                search: debouncedSearch,
                status: statusFilter,
                plan: planFilter,
                sort: sortOption,
            });
            setClients(res.clients);
            setNextCursor(res.nextCursor);
            setTotalClients(res.total);
            if (res.planCounts) {
                setServerPlanCounts(res.planCounts);
            }

            if (res.clients.length > 0) {
                const ids = res.clients.map(c => c.id);
                fetchConversationCounts(ids);
            }
        } catch (e) {
            console.error('Error loading initial clients:', e);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, planFilter, sortOption, fetchConversationCounts]);

    // Load more clients (Infinite Scroll batch)
    const loadMoreClients = useCallback(async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await getClientsPaginated({
                limit: 24,
                cursor: nextCursor,
                search: debouncedSearch,
                status: statusFilter,
                plan: planFilter,
                sort: sortOption,
            });
            
            setClients(prev => [...prev, ...res.clients]);
            setNextCursor(res.nextCursor);
            if (res.total) setTotalClients(res.total);
            if (res.planCounts) setServerPlanCounts(res.planCounts);

            if (res.clients.length > 0) {
                const ids = res.clients.map(c => c.id);
                fetchConversationCounts(ids);
            }
        } catch (e) {
            console.error('Error loading more clients:', e);
        } finally {
            setLoadingMore(false);
        }
    }, [nextCursor, loadingMore, debouncedSearch, statusFilter, planFilter, sortOption, fetchConversationCounts]);

    // Initial trigger on filter change
    useEffect(() => {
        loadInitialClients();
    }, [loadInitialClients]);

    // IntersectionObserver for YouTube-style infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && nextCursor && !loadingMore && !loading) {
                    loadMoreClients();
                }
            },
            { threshold: 0.1, rootMargin: '300px' }
        );

        const currentTarget = observerTargetRef.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [nextCursor, loadingMore, loading, loadMoreClients]);

    // Periodically refresh conversation counts for loaded clients
    useEffect(() => {
        if (clients.length === 0) return;

        const clientIds = clients.map(c => c.id);
        const intervalId = setInterval(() => {
            fetchConversationCounts(clientIds);
        }, 1800000);

        return () => clearInterval(intervalId);
    }, [clients, fetchConversationCounts]);

    // Client-side date range filtering if specified
    const filteredClients = clients.filter(client => {
        let matchesDateRange = true;
        const clientDateStr = client.onboardedDate || client.createdAt;
        if (clientDateStr) {
            const clientMs = new Date(clientDateStr).getTime();
            if (startDate) {
                const startMs = new Date(startDate).getTime();
                if (clientMs < startMs) matchesDateRange = false;
            }
            if (endDate) {
                const endMs = new Date(endDate + 'T23:59:59').getTime();
                if (clientMs > endMs) matchesDateRange = false;
            }
        }
        return matchesDateRange;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Onboarding':
                return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
            case 'Paused':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

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
            <div className="space-y-6 pb-8">
                {/* Header Banner - Black & White Theme */}
                <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all ${
                    isDark 
                        ? 'bg-slate-900 border-slate-800 text-white' 
                        : 'bg-white border-slate-200/80 text-slate-900'
                }`}>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                isDark 
                                    ? 'bg-slate-800 text-slate-200 border-slate-700' 
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}>
                                <Building2 size={13} />
                                Tenant Management
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}>
                                {totalClients || filteredClients.length} total
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Client Directory</h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Manage client configurations, multi-tenant permissions, and automated WhatsApp integrations.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => loadInitialClients()}
                            disabled={loading}
                            className={`p-3.5 rounded-xl border transition-all flex items-center justify-center ${
                                isDark 
                                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                            }`}
                            title="Refresh Clients List"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin text-slate-900 dark:text-white' : ''} />
                        </button>
                        {user?.role !== 'sales_team' && (
                            <Link 
                                to="/admin/clients/new" 
                                className="flex-1 md:flex-initial px-6 py-3.5 bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl font-bold text-sm shadow-md border border-slate-800 dark:border-white transition-all flex items-center justify-center gap-2 group"
                            >
                                <Plus size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span>Add New Client</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters Section */}
                <div className={`p-5 rounded-3xl border shadow-sm transition-all ${
                    isDark 
                        ? 'bg-slate-900 border-slate-800' 
                        : 'bg-white border-slate-200/80'
                }`}>
                    {/* Top Row: Plan Filter Pills (Left) & Layout View Switcher (Right) */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Plan Filter Capsule Pills with Count Badges */}
                        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                            {[
                                { id: 'all', label: 'All Plans', count: planCounts['all'] },
                                { id: 'S1', label: 'S1', count: planCounts['S1'] },
                                { id: 'S2', label: 'S2', count: planCounts['S2'] },
                                { id: 'S3', label: 'S3', count: planCounts['S3'] },
                                { id: 'S3_MAX', label: 'S3 MAX', count: planCounts['S3_MAX'] },
                                { id: 'S3_MAPPING', label: 'S3 MAPPING', count: planCounts['S3_MAPPING'] },
                            ].map(plan => {
                                const isActive = planFilter === plan.id;
                                return (
                                    <button
                                        key={plan.id}
                                        onClick={() => setPlanFilter(plan.id)}
                                        className={`px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-all shrink-0 ${
                                            isActive
                                                ? (isDark ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-slate-950 text-white font-bold shadow-sm')
                                                : (isDark ? 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')
                                        }`}
                                    >
                                        <span className="tracking-tight">{plan.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            isActive
                                                ? (isDark ? 'bg-slate-200 text-slate-900' : 'bg-zinc-800 text-zinc-200')
                                                : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                                        }`}>
                                            {plan.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Layout View Switcher Segmented Control */}
                        <div className={`p-1 rounded-full flex items-center gap-1 border shrink-0 ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100/90 border-slate-200/80'
                        }`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? (isDark ? 'bg-slate-800 text-white font-bold shadow-sm border border-slate-700' : 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200/80')
                                        : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                                }`}
                            >
                                <LayoutGrid size={15} />
                                <span>Grid</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'list'
                                        ? (isDark ? 'bg-slate-800 text-white font-bold shadow-sm border border-slate-700' : 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200/80')
                                        : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                                }`}
                            >
                                <ListFilter size={15} />
                                <span>List</span>
                            </button>
                        </div>
                    </div>

                    <div className={`border-b my-3.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                    {/* Bottom Row: Search Box & Status Filter Pills */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} size={17} />
                            <input
                                type="text"
                                placeholder="Search by client name, slug, or ID..."
                                className={`w-full pl-11 pr-4 py-2.5 border rounded-full text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                                    isDark
                                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-700'
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-slate-300'
                                }`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
                            {[
                                { id: 'all', label: 'All Statuses' },
                                { id: 'Active', label: 'Active' },
                                { id: 'Onboarding', label: 'Onboarding' },
                                { id: 'Paused', label: 'Paused' },
                                { id: 'Inactive', label: 'Inactive' },
                            ].map(status => {
                                const isActive = statusFilter === status.id;
                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => setStatusFilter(status.id)}
                                        className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shrink-0 ${
                                            isActive
                                                ? (isDark ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-slate-950 text-white font-bold shadow-sm')
                                                : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70')
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range & Sort Order */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Calendar size={14} className="text-slate-400" />
                                <span>Date Range:</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-400">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 transition-all ${
                                        isDark
                                            ? 'bg-slate-950 border-slate-800 text-white focus:ring-slate-700'
                                            : 'bg-white border-slate-200 text-slate-800 focus:ring-slate-300 shadow-sm'
                                    }`}
                                />
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-400">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 transition-all ${
                                        isDark
                                            ? 'bg-slate-950 border-slate-800 text-white focus:ring-slate-700'
                                            : 'bg-white border-slate-200 text-slate-800 focus:ring-slate-300 shadow-sm'
                                    }`}
                                />
                            </div>

                            {(startDate || endDate) && (
                                <button
                                    onClick={() => {
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1"
                                >
                                    <X size={13} />
                                    <span>Reset Dates</span>
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                                    isDark
                                        ? 'bg-slate-950 border-slate-800 text-white focus:ring-slate-700'
                                        : 'bg-white border-slate-200 text-slate-900 focus:ring-slate-300 shadow-sm'
                                }`}
                            >
                                <option value="newest">Newest First (Date ↓)</option>
                                <option value="oldest">Oldest First (Date ↑)</option>
                                <option value="a-z">Name (A - Z)</option>
                                <option value="z-a">Name (Z - A)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Clients Grid or List View */}
                {loading ? (
                    <SkeletonClientsGrid isDark={isDark} count={6} />
                ) : filteredClients.length === 0 ? (
                    <div className={`text-center py-16 rounded-3xl border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                    }`}>
                        <p className="text-sm font-medium">No clients found matching your filter criteria.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className={`rounded-3xl border overflow-hidden shadow-sm transition-all ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
                    }`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                                        isDark ? 'border-slate-800 text-slate-400 bg-slate-950/60' : 'border-slate-100 text-slate-500 bg-slate-50/80'
                                    }`}>
                                        <th className="py-3.5 px-6">Client Name</th>
                                        <th className="py-3.5 px-4">Status</th>
                                        <th className="py-3.5 px-4">Subscription Plan</th>
                                        <th className="py-3.5 px-4">Users</th>
                                        <th className="py-3.5 px-4">Onboarded</th>
                                        <th className="py-3.5 px-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y text-xs font-medium ${
                                    isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-100 text-slate-700'
                                }`}>
                                    {filteredClients.map((client) => {
                                        const isS3Max = client.plan === 'S3_MAX';
                                        const isS3Mapping = client.plan === 'S3_MAPPING';
                                        return (
                                            <tr 
                                                key={client.id}
                                                className={`transition-colors ${
                                                    isS3Max
                                                        ? (isDark ? 'bg-amber-500/[0.04] hover:bg-amber-500/10' : 'bg-amber-50/40 hover:bg-amber-50/80')
                                                        : isS3Mapping
                                                        ? (isDark ? 'bg-sky-500/[0.04] hover:bg-sky-500/10' : 'bg-sky-50/40 hover:bg-sky-50/80')
                                                        : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80')
                                                }`}
                                            >
                                                <td className="py-3.5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold border shadow-sm ${getAvatarColor(client.name)}`}>
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className={`font-extrabold text-sm flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                <span>{client.name}</span>
                                                            </div>
                                                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight">/{client.slug}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(client.status)}`}>
                                                        {client.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                                        isS3Max
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                            : isS3Mapping
                                                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                                                            : (isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700')
                                                    }`}>
                                                        {client.plan === 'S3_MAX' ? 'S3 MAX' : client.plan === 'S3_MAPPING' ? 'S3 MAPPING' : client.plan}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-sm text-slate-700 dark:text-slate-300">
                                                    {(conversationCounts[client.id] ?? 0).toLocaleString()} users
                                                </td>
                                                <td className="py-3.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    {client.onboardedDate || '2026-01-15'}
                                                </td>
                                                <td className="py-3.5 px-6 text-right">
                                                    <Link 
                                                        to={`/admin/clients/${client.id}`}
                                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                            isS3Max
                                                                ? 'bg-amber-500 text-white hover:bg-amber-600 border-amber-600 shadow-sm'
                                                                : isS3Mapping
                                                                ? 'bg-sky-600 text-white hover:bg-sky-700 border-sky-700 shadow-sm'
                                                                : (isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200')
                                                        }`}
                                                    >
                                                        <span>View Tenant</span>
                                                        <ChevronRight size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                        {filteredClients.map((client) => {
                            const isS3Max = client.plan === 'S3_MAX';
                            const isS3Mapping = client.plan === 'S3_MAPPING';

                            return (
                                <Link
                                    key={client.id}
                                    to={`/admin/clients/${client.id}`}
                                    className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${
                                        isS3Max
                                            ? (isDark 
                                                ? 'bg-slate-900 border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-500/5' 
                                                : 'bg-gradient-to-b from-amber-50/50 via-white to-white border-amber-400 hover:border-amber-500 shadow-lg shadow-amber-500/10')
                                            : isS3Mapping
                                            ? (isDark 
                                                ? 'bg-slate-900 border-sky-500/50 hover:border-sky-400 shadow-lg shadow-sky-500/5' 
                                                : 'bg-gradient-to-b from-sky-50/50 via-white to-white border-sky-400 hover:border-sky-500 shadow-lg shadow-sky-500/10')
                                            : (isDark 
                                                ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                                                : 'bg-white border-slate-200/90 hover:border-slate-300')
                                    } ${isDark ? 'text-white' : 'text-slate-900'}`}
                                >
                                    {isS3Max && (
                                        <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-md border border-amber-300/40">
                                            <span>S3 MAX PLATFORM</span>
                                        </div>
                                    )}

                                    {isS3Mapping && (
                                        <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-sky-500 via-blue-600 to-sky-500 text-white shadow-md border border-sky-300/40">
                                            <span>S3 MAPPING ENGINE</span>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black border shadow-sm transition-transform duration-300 group-hover:scale-105 ${getAvatarColor(client.name)}`}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-lg flex items-center gap-1.5 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        <span>{client.name}</span>
                                                    </h3>
                                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight mt-0.5">
                                                        /{client.slug}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                                                isS3Max 
                                                    ? 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' 
                                                    : isS3Mapping
                                                    ? 'bg-sky-500/10 text-sky-600 group-hover:bg-sky-500 group-hover:text-white'
                                                    : (isDark ? 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700' : 'bg-slate-100 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-200')
                                            }`}>
                                                <ChevronRight className="transition-transform duration-200 group-hover:translate-x-0.5" size={16} />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mb-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(client.status)}`}>
                                                {client.status === 'Paused' && <Pause size={11} className="mr-1" />}
                                                {client.status === 'Active' && <Play size={11} className="mr-1" />}
                                                {client.status}
                                            </span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                                isS3Max
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                    : isS3Mapping
                                                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                                                    : (isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700')
                                            }`}>
                                                {client.plan === 'S3_MAX' ? 'S3 MAX' : client.plan === 'S3_MAPPING' ? 'S3 MAPPING' : client.plan}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                                            {countsLoading ? (
                                                <RefreshCw size={15} className="animate-spin text-slate-900 dark:text-white" />
                                            ) : (
                                                <Users size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                                            )}
                                            <span>{(conversationCounts[client.id] ?? 0).toLocaleString()} users</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <Calendar size={16} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                                            <span>{client.onboardedDate || '2026-01-15'}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Infinite Scroll Bottom Trigger & Loading Indicator */}
                <div ref={observerTargetRef} className="py-8 flex flex-col items-center justify-center text-slate-500 font-medium text-sm">
                    {loadingMore ? (
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300">
                            <RefreshCw size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
                            <span>Loading more clients...</span>
                        </div>
                    ) : !nextCursor && clients.length > 0 && !loading ? (
                        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                            Showing all {clients.length} of {totalClients || clients.length} clients
                        </div>
                    ) : null}
                </div>
            </div>
        </AdminLayout>
    );
};
