import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { getAuditLogs } from '@/services/adminService';
import { AuditLog } from '@/types/admin';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
    PageContainer, PageHeader, SearchField, TableCard, Table, Th, Td, trClass, Button, Mark, tone,
} from '../../components/admin/ui/kit';
import { cn } from '../../utils/cn';

/* Small inline icons matching the design (12px, stroke = currentColor). */
const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
);
const UserIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 12 0v1" /></svg>
);
const BuildingIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none"><path d="M3 21h18M5 21V8l7-4 7 4v13" /></svg>
);

export default function AdminAuditLogsPage() {
    const { isDark } = useAdminTheme();
    const t = tone(isDark);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const limit = 50;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAuditLogs(page * limit, limit, startDate, endDate);
            setLogs(data);
        } catch {
            setError('Failed to fetch audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when paging / date range change (unchanged behaviour)
    }, [page, startDate, endDate]);

    const filteredLogs = logs.filter(log =>
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.tenant_id && log.tenant_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    /**
     * Action pill colours (design): CREATED = solid black, UPDATED = white outlined,
     * everything else (e.g. USER_LOGIN) = soft grey. Destructive / failure actions keep a status colour.
     */
    const getActionColor = (action: string) => {
        if (action.includes('DELETED')) return isDark ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
        if (action.includes('ERROR') || action.includes('FAILED')) return isDark ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' : 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]';
        if (action.includes('CREATED')) return isDark ? 'bg-white text-black border-white' : 'bg-[#0A0A0A] text-white border-[#0A0A0A]';
        if (action.includes('UPDATED')) return isDark ? 'bg-transparent text-white border-neutral-600' : 'bg-white text-[#0A0A0A] border-[#D4D4D4]';
        return isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-[#F2F2F2] text-[#333333] border-[#E5E5E5]';
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    };

    const dateInputClass = cn(
        'h-[42px] rounded-[10px] border-[1.5px] px-2.5 text-[13.5px] font-semibold focus:outline-none focus:ring-[3px]',
        isDark
            ? 'bg-neutral-950 border-neutral-700 text-white [color-scheme:dark] focus:border-white focus:ring-white/15'
            : 'bg-white border-[#E5E5E5] text-[#0A0A0A] focus:border-[#111111] focus:ring-black/10',
    );
    const pagerBtn = 'min-h-[36px] px-3 rounded-[10px] text-[13px]';

    return (
        <AdminLayout breadcrumb={[{ label: 'Platform' }, { label: 'Audit Logs' }]}>
            <PageContainer>
                <PageHeader
                    isDark={isDark}
                    eyebrow="Platform"
                    eyebrowIcon={<Activity size={12} strokeWidth={2.4} aria-hidden="true" />}
                    title={<>System <Mark isDark={isDark}>Audit Logs</Mark></>}
                    description="Comprehensive record of all system-wide administrative actions."
                    actions={
                        <Button isDark={isDark} variant="secondary" onClick={fetchLogs} disabled={loading}>
                            <RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </Button>
                    }
                />

                {error && (
                    <div role="alert" className={cn('flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-semibold',
                        isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]')}>
                        <AlertCircle size={18} aria-hidden="true" className="flex-none" />
                        <p className="m-0">{error}</p>
                    </div>
                )}

                {/* Filters */}
                <section className={cn('rounded-2xl border p-3.5 flex flex-row flex-wrap items-center gap-3', t.card)}>
                    <SearchField
                        isDark={isDark}
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Filter visible logs..."
                        label="Filter logs"
                        className="h-[42px] flex-[1_1_280px]"
                    />
                    <span className="flex items-center gap-2">
                        <label htmlFor="audit-from" className={cn('text-[13px]', t.muted)}>From</label>
                        <input
                            id="audit-from"
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                            className={dateInputClass}
                        />
                    </span>
                    <span className="flex items-center gap-2">
                        <label htmlFor="audit-to" className={cn('text-[13px]', t.muted)}>To</label>
                        <input
                            id="audit-to"
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                            className={dateInputClass}
                        />
                    </span>
                </section>

                {/* Table */}
                <TableCard
                    isDark={isDark}
                    footer={
                        <>
                            <span>Showing page {page + 1} • {logs.length} logs</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    isDark={isDark}
                                    variant="secondary"
                                    className={pagerBtn}
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0 || loading}
                                >
                                    Previous
                                </Button>
                                <Button
                                    isDark={isDark}
                                    variant="secondary"
                                    className={pagerBtn}
                                    onClick={() => setPage(page + 1)}
                                    disabled={logs.length < limit || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    }
                >
                    <Table className="min-w-[800px]">
                        <thead>
                            <tr>
                                <Th isDark={isDark}>Timestamp</Th>
                                <Th isDark={isDark}>Action</Th>
                                <Th isDark={isDark}>User</Th>
                                <Th isDark={isDark}>Tenant Scope</Th>
                                <Th isDark={isDark}>Description</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && logs.length === 0 ? (
                                <tr className={trClass(isDark)}>
                                    <Td isDark={isDark} colSpan={5} className="py-14 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3" role="status">
                                            <RefreshCw className={cn('animate-spin', t.text)} size={28} aria-hidden="true" />
                                            <p className={cn('m-0 text-sm', t.muted)}>Loading system logs...</p>
                                        </div>
                                    </Td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr className={trClass(isDark)}>
                                    <Td isDark={isDark} colSpan={5} className={cn('py-14 text-center text-sm', t.muted)}>
                                        No audit logs found matching your criteria.
                                    </Td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const { date, time } = formatDate(log.created_at);
                                    return (
                                        <tr key={log.log_id} className={cn(trClass(isDark), isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-[#FAFAFA]')}>
                                            <Td isDark={isDark} className="whitespace-nowrap">
                                                <span className="flex flex-col gap-[3px]">
                                                    <span className="font-bold">{date}</span>
                                                    <span className={cn('flex items-center gap-[5px] text-xs', t.hint)}>
                                                        <ClockIcon /> {time}
                                                    </span>
                                                </span>
                                            </Td>
                                            <Td isDark={isDark} className="whitespace-nowrap">
                                                <span className={cn('inline-flex items-center font-techmono text-[11px] px-2 py-[3px] rounded-full border', getActionColor(log.action))}>
                                                    {log.action}
                                                </span>
                                            </Td>
                                            <Td isDark={isDark}>
                                                <span className="flex flex-col gap-[3px]">
                                                    <span className="font-bold">{log.user_name}</span>
                                                    <span className={cn('flex items-center gap-[5px] text-xs', t.hint)}>
                                                        <UserIcon /> {log.user_role}
                                                    </span>
                                                </span>
                                            </Td>
                                            <Td isDark={isDark} className="whitespace-nowrap">
                                                {log.tenant_id ? (
                                                    <span className={cn('inline-flex items-center gap-1.5 font-techmono text-xs', t.muted)}>
                                                        <BuildingIcon /> {log.tenant_id}
                                                    </span>
                                                ) : (
                                                    <span className={cn('italic', isDark ? 'text-neutral-500' : 'text-[#8A8A8A]')}>System Wide</span>
                                                )}
                                            </Td>
                                            <Td isDark={isDark} className="max-w-[220px]">
                                                <span className="flex flex-col gap-[3px]">
                                                    <span>{log.description}</span>
                                                    <span className={cn('font-techmono text-[11px]', t.muted)}>ID: {log.log_id.split('-')[0]}</span>
                                                </span>
                                            </Td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </Table>
                </TableCard>
            </PageContainer>
        </AdminLayout>
    );
}
