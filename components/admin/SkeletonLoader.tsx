import React from 'react';

// Base pulsing shimmer block
const Shimmer = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

// Single stats card skeleton
export const SkeletonStatsCard = () => (
    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/50">
        <div className="flex justify-between items-start mb-4">
            <Shimmer className="h-12 w-12 rounded-xl" />
        </div>
        <Shimmer className="h-3 w-24 mb-3" />
        <Shimmer className="h-9 w-16 mb-2" />
        <Shimmer className="h-2 w-12" />
    </div>
);

// Full dashboard page skeleton
export const SkeletonDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-indigo-600/60 via-purple-600/60 to-indigo-700/60 rounded-2xl p-6 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-14 bg-white/30 rounded-xl" />
                        <div className="space-y-2">
                            <div className="h-7 w-48 bg-white/30 rounded-lg" />
                            <div className="h-4 w-36 bg-white/20 rounded-lg" />
                        </div>
                    </div>
                    <div className="h-10 w-36 bg-white/20 rounded-xl" />
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
            </div>

            {/* Chart + right column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/70 rounded-2xl shadow-xl border border-white/50 p-6">
                        <Shimmer className="h-5 w-40 mb-6" />
                        <Shimmer className="h-[300px] w-full rounded-xl" />
                    </div>
                    <div className="bg-white/70 rounded-2xl shadow-xl border border-white/50 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <Shimmer className="h-5 w-32" />
                            <Shimmer className="h-9 w-32 rounded-xl" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                                        <div className="space-y-2">
                                            <div className="h-3.5 w-28 bg-gray-200 rounded" />
                                            <div className="h-2.5 w-16 bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-3 w-20 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/70 rounded-2xl shadow-xl border border-white/50 p-6">
                        <Shimmer className="h-5 w-28 mb-6" />
                        <div className="space-y-4">
                            <Shimmer className="h-3 w-full" />
                            <Shimmer className="h-3 w-full rounded-full" />
                            <div className="grid grid-cols-2 gap-3">
                                <Shimmer className="h-16 rounded-xl" />
                                <Shimmer className="h-16 rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/70 rounded-2xl shadow-xl border border-white/50 p-6">
                        <Shimmer className="h-5 w-32 mb-4" />
                        <Shimmer className="h-12 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Table row skeleton for leads page
export const SkeletonTableRow = () => (
    <tr className="animate-pulse border-b border-gray-50">
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-32" />
        </td>
        <td className="px-6 py-4">
            <div className="h-5 bg-gray-200 rounded-full w-20" />
        </td>
        <td className="px-6 py-4 hidden lg:table-cell">
            <div className="h-5 bg-gray-200 rounded-full w-16" />
        </td>
        <td className="px-6 py-4 hidden sm:table-cell">
            <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-200 rounded w-28" />
            </div>
        </td>
        <td className="px-6 py-4 hidden md:table-cell">
            <div className="h-3 bg-gray-200 rounded w-24" />
        </td>
        <td className="px-6 py-4" />
    </tr>
);

// Full leads table skeleton
export const SkeletonLeadsTable = ({ rows = 8 }: { rows?: number }) => (
    <div className="min-h-screen bg-gray-50/50 p-3 sm:p-4 lg:p-6 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 animate-pulse">
                <div className="h-9 w-9 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                    <div className="h-6 w-28 bg-gray-200 rounded" />
                    <div className="h-3.5 w-48 bg-gray-200 rounded" />
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                {/* Toolbar skeleton */}
                <div className="p-4 border-b border-gray-100 flex gap-3 animate-pulse">
                    <div className="h-9 w-64 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-36 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-36 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-32 bg-gray-200 rounded-lg" />
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Lead Name', 'Status', 'Priority', 'Contact', 'Captured', ''].map(h => (
                                    <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(rows)].map((_, i) => <SkeletonTableRow key={i} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);

// Card skeleton for a single client in the clients grid
const SkeletonClientCard = ({ isDark }: { isDark?: boolean }) => (
    <div className={`p-5 rounded-xl border animate-pulse ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                <div className="space-y-2">
                    <div className={`h-4 w-32 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                    <div className={`h-3 w-20 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                </div>
            </div>
        </div>
        <div className="flex gap-2 mb-4">
            <div className={`h-6 w-16 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
            <div className={`h-6 w-10 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
        </div>
        <div className="flex gap-4">
            <div className={`h-3.5 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
            <div className={`h-3.5 w-20 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
        </div>
    </div>
);

// Grid skeleton for the clients list page (renders inside AdminLayout)
export const SkeletonClientsGrid = ({ isDark, count = 6 }: { isDark?: boolean; count?: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => <SkeletonClientCard key={i} isDark={isDark} />)}
    </div>
);

// Full client detail page skeleton (renders inside AdminLayout)
export const SkeletonClientDetail = ({ isDark }: { isDark?: boolean }) => {
    const bg = isDark ? 'bg-slate-700' : 'bg-gray-200';
    const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className={`h-9 w-9 rounded-lg ${bg}`} />
                    <div className="space-y-2">
                        <div className={`h-7 w-48 rounded ${bg}`} />
                        <div className={`h-3.5 w-64 rounded ${bg}`} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className={`h-9 w-9 rounded-lg ${bg}`} />
                    <div className={`h-9 w-24 rounded-lg ${bg}`} />
                    <div className={`h-9 w-20 rounded-lg ${bg}`} />
                    <div className={`h-9 w-16 rounded-lg ${bg}`} />
                </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-1 border-b mb-6 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                {[...Array(7)].map((_, i) => (
                    <div key={i} className={`h-10 rounded-t-lg px-6 ${bg} ${i === 0 ? 'w-24 opacity-100' : 'w-20 opacity-40'}`} />
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-6 rounded-xl border space-y-4 ${card}`}>
                    <div className={`h-5 w-44 rounded ${bg}`} />
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className={`h-3.5 w-24 rounded ${bg}`} />
                                <div className={`h-10 w-full rounded-lg ${bg}`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`p-6 rounded-xl border space-y-5 ${card}`}>
                    <div className={`h-5 w-32 rounded ${bg}`} />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className={`h-3.5 w-20 rounded ${bg}`} />
                            <div className={`h-10 w-full rounded-lg ${bg}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
