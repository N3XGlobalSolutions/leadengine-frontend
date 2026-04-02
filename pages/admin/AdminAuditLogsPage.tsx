import React, { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, AlertCircle, Clock, Hash, MapPin, Building, Shield } from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { getAuditLogs } from '@/services/adminService';
import { AuditLog } from '@/types/admin';
import { AdminLayout } from '../../components/admin/AdminLayout';

export default function AdminAuditLogsPage() {
    const { isDark } = useAdminTheme();
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
        } catch (err) {
            setError('Failed to fetch audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, startDate, endDate]);

    const filteredLogs = logs.filter(log =>
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.tenant_id && log.tenant_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getActionColor = (action: string) => {
        if (action.includes('DELETED')) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (action.includes('CREATED')) return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (action.includes('UPDATED')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        if (action.includes('ERROR') || action.includes('FAILED')) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        return isDark ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-indigo-600 bg-indigo-50 border-indigo-100';
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    };

    return (
        <AdminLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Activity className={isDark ? "text-indigo-400" : "text-indigo-600"} />
                        System Audit Logs
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Comprehensive record of all system-wide administrative actions.
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Controls */}
            <div className={`p-4 rounded-xl border mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
                        <input
                            type="text"
                            placeholder="Filter visible logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark
                                    ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                }`}
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>From</span>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                                className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>To</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                                className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Timestamp</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Action</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>User</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Tenant Scope</th>
                                <th className={`p-3 sm:p-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Description</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <RefreshCw className={`animate-spin mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} size={32} />
                                            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Loading system logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const { date, time } = formatDate(log.created_at);
                                    return (
                                        <tr key={log.log_id} className={`border-b last:border-0 hover:bg-opacity-50 transition-all ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{date}</span>
                                                    <span className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        <Clock size={12} /> {time}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{log.user_name}</span>
                                                    <span className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        <Shield size={12} /> {log.user_role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {log.tenant_id ? (
                                                    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                                        <Building size={14} /> {log.tenant_id}
                                                    </span>
                                                ) : (
                                                    <span className={isDark ? 'text-slate-500 italic' : 'text-gray-400 italic'}>System Wide</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>{log.description}</p>
                                                <p className={`text-xs mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>ID: {log.log_id.split('-')[0]}</p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Showing page {page + 1} • {logs.length} logs
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0 || loading}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={logs.length < limit || loading}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </AdminLayout>
    );
}
