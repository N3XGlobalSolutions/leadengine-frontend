import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { Client } from '@/types/admin';
import { getClients, getAllClientConversationCounts } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { cn } from '../../utils/cn';
import {
    tone, SearchField, IconButton, InitialTile, Mono, StatusPill, clientStatusTone,
    Table, Th, Td, trClass,
} from './ui/kit';

interface ClientListTableProps {
    onSpotlight: (client: Client) => void;
}

// `onSpotlight` is part of the public API (AdminPage passes it) but no row action opens the spotlight yet.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ClientListTable: React.FC<ClientListTableProps> = ({ onSpotlight }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [conversationCounts, setConversationCounts] = useState<Record<string, number>>({});
    const [countsLoading, setCountsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { isDark } = useAdminTheme();
    const t = tone(isDark);

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

    const pagerBtn = (disabled: boolean) => cn(
        'w-8 h-8 flex-none rounded-[10px] border-none flex items-center justify-center bg-transparent transition-colors focus:outline-none focus-visible:ring-2',
        isDark ? 'focus-visible:ring-white/40' : 'focus-visible:ring-black/30',
        disabled
            ? (isDark ? 'text-neutral-600 cursor-not-allowed' : 'text-[#A3A3A3] cursor-not-allowed')
            : (isDark ? 'text-white cursor-pointer hover:bg-neutral-800' : 'text-[#0A0A0A] cursor-pointer hover:bg-[#F2F2F2]'),
    );

    return (
        <section className={cn('rounded-2xl border overflow-hidden', t.card)} aria-labelledby="client-directory-title">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
                <div className="flex flex-col gap-1 min-w-0">
                    <h2 id="client-directory-title" className={cn('m-0 text-lg font-extrabold tracking-[-0.02em] flex items-center gap-2.5', t.text)}>
                        Client Directory
                        <span className={cn('inline-flex items-center h-[22px] px-2.5 rounded-full text-[11.5px] font-bold whitespace-nowrap',
                            isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-[#F2F2F2] text-[#333333]')}>
                            {filteredClients.length} tenants
                        </span>
                    </h2>
                    <p className={cn('m-0 text-[13px] leading-[1.55]', t.muted)}>
                        Manage multi-tenant WhatsApp automation accounts and active integrations
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SearchField
                        isDark={isDark}
                        label="Filter clients"
                        placeholder="Filter by client name, slug, or plan..."
                        value={searchTerm}
                        onChange={(v) => {
                            setSearchTerm(v);
                            setCurrentPage(1);
                        }}
                        className="flex-1 sm:flex-none sm:w-[260px]"
                    />
                    <IconButton
                        isDark={isDark}
                        label="Refresh conversation counts"
                        onClick={() => fetchConversationCounts(clients.map(c => c.id))}
                        disabled={countsLoading}
                    >
                        <RefreshCw size={16} strokeWidth={2} aria-hidden="true" className={countsLoading ? 'animate-spin' : ''} />
                    </IconButton>
                </div>
            </div>

            {/* Table */}
            <div className={cn('overflow-x-auto border-t', t.border)}>
                <Table>
                    <thead>
                        <tr>
                            <Th isDark={isDark}>Client / Tenant</Th>
                            <Th isDark={isDark}>Status</Th>
                            <Th isDark={isDark}>Subscription Plan</Th>
                            <Th isDark={isDark}>Convo Volume</Th>
                            <Th isDark={isDark}>Onboarded</Th>
                            <Th isDark={isDark}>Actions</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className={trClass(isDark)}>
                                <Td isDark={isDark} colSpan={6} className="py-12 text-center">
                                    <span className={cn('inline-flex flex-col items-center justify-center gap-2 font-medium', t.hint)}>
                                        <RefreshCw size={20} className="animate-spin" aria-hidden="true" />
                                        Loading client directory...
                                    </span>
                                </Td>
                            </tr>
                        ) : paginatedClients.length > 0 ? (
                            paginatedClients.map((client) => (
                                <tr key={client.id} className={trClass(isDark)}>
                                    {/* Client name + avatar tile */}
                                    <Td isDark={isDark}>
                                        <span className="flex items-center gap-3">
                                            <InitialTile isDark={isDark} name={client.name} size={34} />
                                            <span className="flex flex-col gap-px min-w-0">
                                                <span className="font-bold flex items-center gap-1.5">
                                                    {client.name}
                                                    {client.status === 'Active' && (
                                                        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" className={isDark ? 'text-neutral-400' : 'text-[#525252]'} />
                                                    )}
                                                </span>
                                                <Mono isDark={isDark}>{client.slug}</Mono>
                                            </span>
                                        </span>
                                    </Td>

                                    {/* Status */}
                                    <Td isDark={isDark}>
                                        <StatusPill isDark={isDark} tone={clientStatusTone(client.status)}>{client.status}</StatusPill>
                                    </Td>

                                    {/* Plan */}
                                    <Td isDark={isDark}>
                                        <span className={cn('font-techmono text-xs px-2 py-[3px] rounded-md border whitespace-nowrap',
                                            isDark ? 'border-neutral-700 bg-neutral-950 text-white' : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#0A0A0A]')}>
                                            {client.plan || 'Standard'}
                                        </span>
                                    </Td>

                                    {/* Convo volume */}
                                    <Td isDark={isDark} className="whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5">
                                            {countsLoading && <RefreshCw size={12} className={cn('animate-spin', t.hint)} aria-hidden="true" />}
                                            <b>{(conversationCounts[client.id] ?? 0).toLocaleString()}</b>
                                            <span className={cn('text-xs', t.hint)}>convos</span>
                                        </span>
                                    </Td>

                                    {/* Onboarded date */}
                                    <Td isDark={isDark} className={cn('font-techmono text-xs whitespace-nowrap', isDark ? 'text-neutral-400' : 'text-[#525252]')}>
                                        {client.onboardedDate || '—'}
                                    </Td>

                                    {/* Actions */}
                                    <Td isDark={isDark}>
                                        <IconButton
                                            isDark={isDark}
                                            size={34}
                                            label={`Open ${client.name} tenant dashboard in a new tab`}
                                            onClick={() => window.open(`/${client.id}/dashboard`, '_blank')}
                                        >
                                            <ExternalLink size={15} strokeWidth={2} aria-hidden="true" />
                                        </IconButton>
                                    </Td>
                                </tr>
                            ))
                        ) : (
                            <tr className={trClass(isDark)}>
                                <Td isDark={isDark} colSpan={6} className={cn('py-12 text-center', t.hint)}>
                                    No clients match your filter query.
                                </Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Footer pagination */}
            <div className={cn('flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t text-[13px]', t.border, t.hint)}>
                <span>
                    Showing {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
                </span>

                <span className="flex items-center gap-2.5">
                    <button
                        type="button"
                        aria-label="Previous page"
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className={pagerBtn(currentPage === 1)}
                    >
                        <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <b className={t.text} aria-live="polite">{currentPage} / {totalPages}</b>
                    <button
                        type="button"
                        aria-label="Next page"
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={pagerBtn(currentPage === totalPages)}
                    >
                        <ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
                    </button>
                </span>
            </div>
        </section>
    );
};
