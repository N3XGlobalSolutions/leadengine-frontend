import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Calendar, ChevronRight, RefreshCw, LayoutGrid, List, X } from 'lucide-react';
import { Client } from '@/types/admin';
import { getClientsPaginated, getAllClientConversationCounts } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SkeletonClientsGrid } from '../../components/admin/SkeletonLoader';
import {
    PageContainer, PageHeader, StatusPill, clientStatusTone, FilterChip, Segmented, SearchField, Select,
    IconButton, SmallLabel, Mono, InitialTile, TableCard, Table, Th, Td, trClass, EmptyState, ListFooterText,
    Card, Mark, buttonClass, tone,
} from '../../components/admin/ui/kit';
import { cn } from '../../utils/cn';

/** Plan code → display label (matches previous behaviour: S3_MAX / S3_MAPPING get spaces, others shown as-is). */
const planLabel = (plan: string) => (plan === 'S3_MAX' ? 'S3 MAX' : plan === 'S3_MAPPING' ? 'S3 MAPPING' : plan);

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
        // The server's planCounts has no S3_INTERNATIONAL bucket yet: only count from the loaded list when it
        // is the complete, unfiltered (or S3_INTERNATIONAL-filtered) result, otherwise hide the count.
        S3_INTERNATIONAL: serverPlanCounts['S3_INTERNATIONAL']
            ?? (!loading && !nextCursor && statusFilter === 'all' && !debouncedSearch && (planFilter === 'all' || planFilter === 'S3_INTERNATIONAL')
                ? clients.filter(c => c.plan === 'S3_INTERNATIONAL').length
                : undefined),
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

    const t = tone(isDark);

    const planOptions: { id: string; label: string; count?: number }[] = [
        { id: 'all', label: 'All Plans', count: planCounts.all },
        { id: 'S1', label: 'S1', count: planCounts.S1 },
        { id: 'S2', label: 'S2', count: planCounts.S2 },
        { id: 'S3', label: 'S3', count: planCounts.S3 },
        { id: 'S3_INTERNATIONAL', label: 'S3 INTERNATIONAL', count: planCounts.S3_INTERNATIONAL },
        { id: 'S3_MAX', label: 'S3 MAX', count: planCounts.S3_MAX },
        { id: 'S3_MAPPING', label: 'S3 MAPPING', count: planCounts.S3_MAPPING },
    ];

    const statusOptions = [
        { id: 'all', label: 'All Statuses' },
        { id: 'Active', label: 'Active' },
        { id: 'Onboarding', label: 'Onboarding' },
        { id: 'Paused', label: 'Paused' },
        { id: 'Inactive', label: 'Inactive' },
    ];

    const dividerBorder = isDark ? 'border-neutral-800' : 'border-[#EEEEEE]';
    const iconMuted = isDark ? 'text-neutral-400' : 'text-[#525252]';
    const dateInputClass = cn(
        'h-9 px-2.5 rounded-[10px] border-[1.5px] text-[12.5px] font-semibold cursor-pointer focus:outline-none focus:ring-[3px]',
        isDark
            ? 'bg-neutral-950 border-neutral-700 text-white focus:border-white focus:ring-white/15 [color-scheme:dark]'
            : 'bg-white border-[#E5E5E5] text-[#0A0A0A] focus:border-[#111111] focus:ring-black/10',
    );

    const usersLabel = (client: Client) => `${(conversationCounts[client.id] ?? 0).toLocaleString()} users`;
    const dateLabel = (client: Client) => client.onboardedDate || '—';

    return (
        <AdminLayout breadcrumb={[{ label: 'Operations' }, { label: 'Clients' }]}>
            <PageContainer>
                {/* Header */}
                <PageHeader
                    isDark={isDark}
                    eyebrow="Tenant Management"
                    eyebrowIcon={
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" /></svg>
                    }
                    badge={<StatusPill isDark={isDark} tone="out">{totalClients || filteredClients.length} total</StatusPill>}
                    title={<>Client <Mark isDark={isDark}>Directory</Mark></>}
                    description="Manage client configurations, multi-tenant permissions, and automated WhatsApp integrations."
                    actions={
                        <>
                            <IconButton
                                isDark={isDark}
                                label="Refresh clients list"
                                size={44}
                                onClick={() => loadInitialClients()}
                                disabled={loading}
                            >
                                <RefreshCw size={16} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
                            </IconButton>
                            {user?.role !== 'sales_team' && (
                                <Link to="/admin/clients/new" className={buttonClass(isDark, 'primary')}>
                                    <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                                    Add New Client
                                </Link>
                            )}
                        </>
                    }
                />

                {/* Filters */}
                <Card isDark={isDark} className="gap-4 p-[18px]">
                    {/* Plan chips + Grid/List toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div role="tablist" aria-label="Plan" className="flex flex-wrap gap-1.5">
                            {planOptions.map(plan => (
                                <FilterChip
                                    key={plan.id}
                                    isDark={isDark}
                                    selected={planFilter === plan.id}
                                    onClick={() => setPlanFilter(plan.id)}
                                    count={plan.count}
                                >
                                    {plan.label}
                                </FilterChip>
                            ))}
                        </div>
                        <Segmented
                            isDark={isDark}
                            ariaLabel="View"
                            value={viewMode}
                            onChange={setViewMode}
                            options={[
                                { value: 'grid', label: <><LayoutGrid size={14} strokeWidth={2} aria-hidden="true" />Grid</> },
                                { value: 'list', label: <><List size={14} strokeWidth={2} aria-hidden="true" />List</> },
                            ]}
                        />
                    </div>

                    {/* Search + status chips */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <SearchField
                            isDark={isDark}
                            label="Search clients"
                            placeholder="Search by client name, slug, or ID..."
                            value={searchTerm}
                            onChange={setSearchTerm}
                            className="flex-[1_1_260px]"
                        />
                        <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1.5">
                            {statusOptions.map(status => (
                                <FilterChip
                                    key={status.id}
                                    isDark={isDark}
                                    selected={statusFilter === status.id}
                                    onClick={() => setStatusFilter(status.id)}
                                >
                                    {status.label}
                                </FilterChip>
                            ))}
                        </div>
                    </div>

                    {/* Date range + sort */}
                    <div className={cn('flex flex-wrap items-center justify-between gap-2.5 pt-3.5 border-t', dividerBorder)}>
                        <span className="flex flex-wrap items-center gap-2">
                            <SmallLabel isDark={isDark} className="flex items-center gap-1.5">
                                <Calendar size={15} strokeWidth={1.8} className={iconMuted} aria-hidden="true" />
                                Date range:
                            </SmallLabel>
                            <label htmlFor="clients-date-from" className={cn('text-[12.5px]', t.muted)}>
                                From<span className="sr-only"> date</span>
                            </label>
                            <input
                                id="clients-date-from"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={dateInputClass}
                            />
                            <label htmlFor="clients-date-to" className={cn('text-[12.5px]', t.muted)}>
                                To<span className="sr-only"> date</span>
                            </label>
                            <input
                                id="clients-date-to"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={dateInputClass}
                            />
                            {(startDate || endDate) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    className={buttonClass(isDark, 'ghost', 'min-h-[36px] text-[12.5px] gap-1')}
                                >
                                    <X size={13} aria-hidden="true" />
                                    Reset dates
                                </button>
                            )}
                        </span>
                        <span className="flex items-center gap-2">
                            <label htmlFor="clients-sort"><SmallLabel isDark={isDark}>Sort:</SmallLabel></label>
                            <Select
                                id="clients-sort"
                                isDark={isDark}
                                size="sm"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="newest">Newest First (Date ↓)</option>
                                <option value="oldest">Oldest First (Date ↑)</option>
                                <option value="a-z">Name (A - Z)</option>
                                <option value="z-a">Name (Z - A)</option>
                            </Select>
                        </span>
                    </div>
                </Card>

                {/* Clients grid / list */}
                {loading ? (
                    <SkeletonClientsGrid isDark={isDark} count={6} />
                ) : filteredClients.length === 0 ? (
                    <EmptyState
                        isDark={isDark}
                        title="No clients found"
                        description="No clients found matching your filter criteria."
                    />
                ) : viewMode === 'list' ? (
                    <TableCard isDark={isDark}>
                        <Table>
                            <thead>
                                <tr>
                                    <Th isDark={isDark}>Client Name</Th>
                                    <Th isDark={isDark}>Status</Th>
                                    <Th isDark={isDark}>Subscription Plan</Th>
                                    <Th isDark={isDark}>Users</Th>
                                    <Th isDark={isDark}>Onboarded</Th>
                                    <Th isDark={isDark} className="text-right">Action</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => {
                                    const isS3Max = client.plan === 'S3_MAX';
                                    return (
                                        <tr
                                            key={client.id}
                                            className={cn(
                                                trClass(isDark),
                                                'transition-colors',
                                                isS3Max
                                                    ? (isDark ? 'bg-neutral-800/40' : 'bg-[#FAFAFA]')
                                                    : (isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-[#FAFAFA]'),
                                            )}
                                        >
                                            <Td isDark={isDark}>
                                                <span className="flex items-center gap-3">
                                                    <InitialTile isDark={isDark} name={client.name} size={34} />
                                                    <span className="flex flex-col gap-px min-w-0">
                                                        <span className="font-bold">{client.name}</span>
                                                        <Mono isDark={isDark}>/{client.slug}</Mono>
                                                    </span>
                                                </span>
                                            </Td>
                                            <Td isDark={isDark}>
                                                <StatusPill isDark={isDark} tone={clientStatusTone(client.status)}>{client.status}</StatusPill>
                                            </Td>
                                            <Td isDark={isDark}>
                                                <StatusPill isDark={isDark} tone="soft">{planLabel(client.plan)}</StatusPill>
                                            </Td>
                                            <Td isDark={isDark} className="font-bold whitespace-nowrap">{usersLabel(client)}</Td>
                                            <Td isDark={isDark} className="font-semibold whitespace-nowrap">{dateLabel(client)}</Td>
                                            <Td isDark={isDark} className="text-right">
                                                <Link
                                                    to={`/admin/clients/${client.id}`}
                                                    className={buttonClass(isDark, isS3Max ? 'primary' : 'secondary', 'min-h-[38px] px-3 text-[13px]')}
                                                >
                                                    View Tenant
                                                    <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
                                                </Link>
                                            </Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </TableCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {filteredClients.map((client) => {
                            const isS3Max = client.plan === 'S3_MAX';
                            const isS3Mapping = client.plan === 'S3_MAPPING';

                            return (
                                <Link
                                    key={client.id}
                                    to={`/admin/clients/${client.id}`}
                                    className={cn(
                                        'group relative flex flex-col gap-3.5 rounded-2xl no-underline transition-colors',
                                        'focus-visible:outline-none focus-visible:ring-[3px]',
                                        isDark ? 'bg-neutral-900 text-white focus-visible:ring-white/20' : 'bg-white text-[#0A0A0A] focus-visible:ring-black/15',
                                        isS3Max
                                            ? cn('border-2 p-[19px]', isDark ? 'border-white' : 'border-[#0A0A0A]')
                                            : cn('border p-5', isDark ? 'border-neutral-800 hover:border-neutral-600' : 'border-[#E5E5E5] hover:border-[#D4D4D4]'),
                                    )}
                                >
                                    {isS3Max && (
                                        <span className={cn(
                                            'absolute -top-[11px] right-4 text-[10.5px] font-extrabold tracking-[0.06em] px-2.5 py-1 rounded-full',
                                            isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white',
                                        )}>
                                            S3 MAX PLATFORM
                                        </span>
                                    )}
                                    {isS3Mapping && (
                                        <span className={cn(
                                            'absolute -top-[11px] right-4 text-[10.5px] font-extrabold tracking-[0.06em] px-2.5 py-[3px] rounded-full border',
                                            isDark ? 'bg-neutral-900 text-white border-neutral-600' : 'bg-white text-[#0A0A0A] border-[#0A0A0A]',
                                        )}>
                                            S3 MAPPING ENGINE
                                        </span>
                                    )}

                                    <div className="flex items-start gap-3">
                                        <InitialTile isDark={isDark} name={client.name} size={40} />
                                        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                                            <span className="text-base font-extrabold break-words">{client.name}</span>
                                            <Mono isDark={isDark} className="truncate">/{client.slug}</Mono>
                                        </span>
                                        <span className={cn(
                                            'w-7 h-7 flex-none rounded-full border flex items-center justify-center transition-colors',
                                            isDark ? 'border-neutral-700 group-hover:bg-neutral-800' : 'border-[#E5E5E5] group-hover:bg-[#F2F2F2]',
                                        )}>
                                            <ChevronRight size={14} strokeWidth={2.2} className={iconMuted} aria-hidden="true" />
                                        </span>
                                    </div>

                                    <span className="flex flex-wrap gap-1.5">
                                        <StatusPill isDark={isDark} tone={clientStatusTone(client.status)}>{client.status}</StatusPill>
                                        <StatusPill isDark={isDark} tone="soft">{planLabel(client.plan)}</StatusPill>
                                    </span>

                                    <span className={cn(
                                        'mt-auto flex justify-between gap-3 pt-3 border-t text-[13px]',
                                        dividerBorder,
                                        isDark ? 'text-neutral-300' : 'text-[#333333]',
                                    )}>
                                        <span className="flex items-center gap-1.5">
                                            {countsLoading ? (
                                                <RefreshCw size={15} strokeWidth={1.8} className={cn('animate-spin', iconMuted)} aria-hidden="true" />
                                            ) : (
                                                <Users size={15} strokeWidth={1.8} className={iconMuted} aria-hidden="true" />
                                            )}
                                            {usersLabel(client)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={15} strokeWidth={1.8} className={iconMuted} aria-hidden="true" />
                                            {dateLabel(client)}
                                        </span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Infinite scroll trigger + footer */}
                <div ref={observerTargetRef} className="min-h-[20px] flex flex-col items-center justify-center">
                    {loadingMore ? (
                        <span
                            role="status"
                            className={cn(
                                'inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-semibold',
                                t.card,
                                t.muted,
                            )}
                        >
                            <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                            Loading more clients...
                        </span>
                    ) : !nextCursor && clients.length > 0 && !loading ? (
                        <p className="m-0 text-center">
                            <ListFooterText isDark={isDark}>
                                Showing all {clients.length} of {totalClients || clients.length} clients
                            </ListFooterText>
                        </p>
                    ) : null}
                </div>
            </PageContainer>
        </AdminLayout>
    );
};
