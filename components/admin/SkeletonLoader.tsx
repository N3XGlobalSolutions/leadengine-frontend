import React from 'react';

/*
 * Loading skeletons (v2 black/white design): neutral grey blocks on white 16px-radius cards.
 * Light: blocks #EAEAEA, soft surfaces #F2F2F2. Dark: blocks neutral-700, soft surfaces neutral-800 on neutral-900 cards.
 * SkeletonClientsGrid / SkeletonClientDetail take `isDark`; SkeletonDashboard / SkeletonStatsCard follow the global
 * theme via Tailwind `dark:` (AdminThemeProvider toggles the `dark` class on <html>). SkeletonLeadsTable is light-only,
 * matching the client All Leads page.
 */

// Base pulsing shimmer block (follows the global theme class)
const Shimmer = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-[#EAEAEA] dark:bg-neutral-700 rounded-lg ${className ?? ''}`} />
);

const DASH_CARD = 'bg-white border border-[#E5E5E5] rounded-2xl dark:bg-neutral-900 dark:border-neutral-800';

// Single stats card skeleton
export const SkeletonStatsCard = () => (
    <div className={`${DASH_CARD} p-[22px] flex items-center gap-[18px]`}>
        <Shimmer className="h-[52px] w-[52px] rounded-[14px] flex-none" />
        <div className="flex flex-col gap-2.5 min-w-0 flex-1">
            <Shimmer className="h-3 w-28 rounded-md" />
            <Shimmer className="h-8 w-14" />
            <Shimmer className="h-2.5 w-20 rounded-md" />
        </div>
    </div>
);

// Full dashboard page skeleton
export const SkeletonDashboard = () => (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-neutral-950 font-jakarta">
        {/* Top bar */}
        <div className="min-h-[64px] flex items-center justify-between gap-3 px-4 sm:px-8 py-2.5 border-b bg-white border-[#E5E5E5] dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-3">
                <Shimmer className="h-[34px] w-[34px] rounded-[10px]" />
                <Shimmer className="h-4 w-44 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
                <Shimmer className="h-10 w-10 rounded-[10px]" />
                <Shimmer className="h-10 w-24 rounded-[11px]" />
            </div>
        </div>

        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-8 pt-8 pb-10 flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2.5">
                    <Shimmer className="h-[26px] w-32 rounded-full mb-2.5" />
                    <Shimmer className="h-10 w-64 sm:w-80 rounded-[10px]" />
                </div>
                <Shimmer className="h-11 w-36 rounded-[10px]" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
            </div>

            {/* Chart + right column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 flex flex-col gap-5 min-w-0">
                    <div className={`${DASH_CARD} p-6 flex flex-col gap-3.5`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-2">
                                <Shimmer className="h-5 w-44" />
                                <Shimmer className="h-3 w-32 rounded-md" />
                            </div>
                            <Shimmer className="h-9 w-9 rounded-[10px]" />
                        </div>
                        <div className="animate-pulse h-[300px] w-full rounded-xl bg-[#F2F2F2] dark:bg-neutral-800" />
                    </div>
                    <div className={`${DASH_CARD} p-6 flex flex-col gap-[18px]`}>
                        <div className="flex justify-between items-center gap-3">
                            <Shimmer className="h-5 w-36" />
                            <Shimmer className="h-[38px] w-32 rounded-[11px]" />
                        </div>
                        <div className="flex flex-col gap-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-[#EEEEEE] bg-white dark:border-neutral-800 dark:bg-neutral-900 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="h-[38px] w-[38px] rounded-full bg-[#EAEAEA] dark:bg-neutral-700" />
                                        <div className="flex flex-col gap-2">
                                            <div className="h-3.5 w-28 rounded bg-[#EAEAEA] dark:bg-neutral-700" />
                                            <div className="h-2.5 w-16 rounded bg-[#F2F2F2] dark:bg-neutral-800" />
                                        </div>
                                    </div>
                                    <div className="h-3 w-20 rounded bg-[#F2F2F2] dark:bg-neutral-800" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-5 min-w-0">
                    <div className={`${DASH_CARD} p-6 flex flex-col gap-4`}>
                        <Shimmer className="h-5 w-32" />
                        <div className="flex flex-col gap-2.5 p-4 rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] dark:border-neutral-800 dark:bg-neutral-950">
                            <div className="flex items-center justify-between">
                                <Shimmer className="h-3 w-28 rounded-md" />
                                <Shimmer className="h-7 w-12" />
                            </div>
                            <Shimmer className="h-2 w-full rounded-full" />
                            <Shimmer className="h-2.5 w-24 rounded-md" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="animate-pulse h-[76px] rounded-xl bg-[#F2F2F2] dark:bg-neutral-800" />
                            <div className="animate-pulse h-[76px] rounded-xl bg-[#F2F2F2] dark:bg-neutral-800" />
                        </div>
                        <Shimmer className="h-2 w-full rounded-full" />
                        <div className="grid grid-cols-3 gap-2.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="animate-pulse h-[68px] rounded-xl bg-[#F2F2F2] dark:bg-neutral-800" />
                            ))}
                        </div>
                    </div>
                    <div className={`${DASH_CARD} p-6 flex flex-col gap-4`}>
                        <Shimmer className="h-5 w-36" />
                        <div className="animate-pulse h-12 w-full rounded-xl bg-[#F2F2F2] dark:bg-neutral-800" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Table row skeleton for leads page
export const SkeletonTableRow = () => (
    <tr className="animate-pulse border-b border-[#EEEEEE] last:border-b-0">
        <td className="pl-6 pr-4 py-3.5">
            <div className="flex items-center gap-3">
                <div className="h-[34px] w-[34px] flex-none rounded-full bg-[#EAEAEA]" />
                <div className="h-4 bg-[#EAEAEA] rounded w-28" />
            </div>
        </td>
        <td className="px-4 py-3.5">
            <div className="h-[26px] bg-[#F2F2F2] rounded-full w-24" />
        </td>
        <td className="px-4 py-3.5 hidden lg:table-cell">
            <div className="h-[26px] bg-[#F2F2F2] rounded-full w-20" />
        </td>
        <td className="px-4 py-3.5 hidden sm:table-cell">
            <div className="h-3 bg-[#EAEAEA] rounded w-28" />
        </td>
        <td className="px-4 py-3.5 hidden md:table-cell">
            <div className="h-3 bg-[#EAEAEA] rounded w-20" />
        </td>
        <td className="px-4 py-3.5">
            <div className="h-8 w-8 ml-auto rounded-[10px] bg-[#F2F2F2]" />
        </td>
    </tr>
);

// Full leads table skeleton
export const SkeletonLeadsTable = ({ rows = 8 }: { rows?: number }) => (
    <div className="min-h-screen bg-[#F5F5F5] font-jakarta flex flex-col">
        {/* Top bar */}
        <div className="min-h-[64px] flex items-center gap-3 px-4 sm:px-8 py-2.5 border-b border-[#E5E5E5] bg-white animate-pulse">
            <div className="h-[34px] w-[34px] rounded-[10px] bg-[#EAEAEA]" />
            <div className="h-4 w-40 rounded-md bg-[#EAEAEA]" />
        </div>

        <div className="w-full max-w-[1180px] mx-auto flex-1 flex flex-col gap-5 px-4 sm:px-8 pt-8 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-2.5 animate-pulse">
                <div className="h-[26px] w-40 rounded-full bg-[#F2F2F2] mb-2.5" />
                <div className="h-10 w-56 rounded-[10px] bg-[#EAEAEA]" />
                <div className="h-4 w-72 max-w-full rounded-md bg-[#F2F2F2]" />
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-[#E5E5E5] flex flex-col overflow-hidden">
                {/* Toolbar skeleton */}
                <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 animate-pulse">
                    <div className="flex flex-wrap gap-2">
                        <div className="h-10 w-[200px] bg-[#F2F2F2] rounded-[10px]" />
                        <div className="h-10 w-32 bg-[#F2F2F2] rounded-[10px]" />
                        <div className="h-10 w-32 bg-[#F2F2F2] rounded-[10px]" />
                        <div className="h-10 w-28 bg-[#F2F2F2] rounded-[10px]" />
                        <div className="h-10 w-28 bg-[#EAEAEA] rounded-[11px]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-[34px] w-[34px] bg-[#F2F2F2] rounded-[10px]" />
                        <div className="h-8 w-40 bg-[#F2F2F2] rounded-full" />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border-t border-[#E5E5E5]">
                    <table className="w-full text-left text-sm min-w-[600px] border-collapse">
                        <thead>
                            <tr>
                                {['Lead Name', 'Status', 'Priority', 'Contact', 'Captured', ''].map((h, i) => (
                                    <th
                                        key={h || 'action'}
                                        className={`${i === 0 ? 'pl-6 pr-4' : 'px-4'} py-3 border-b border-[#E5E5E5] text-xs font-bold tracking-[0.04em] uppercase text-[#6B6B6B] whitespace-nowrap ${i === 2 ? 'hidden lg:table-cell' : ''} ${i === 3 ? 'hidden sm:table-cell' : ''} ${i === 4 ? 'hidden md:table-cell' : ''}`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(rows)].map((_, i) => <SkeletonTableRow key={i} />)}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-[#E5E5E5] bg-[#FAFAFA] animate-pulse">
                    <div className="h-3.5 w-32 rounded bg-[#EAEAEA]" />
                    <div className="flex items-center gap-1.5">
                        <div className="h-8 w-8 rounded-lg bg-[#EAEAEA]" />
                        <div className="h-8 w-8 rounded-lg bg-[#EAEAEA]" />
                        <div className="h-8 w-8 rounded-lg bg-[#EAEAEA]" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/* Prop-driven palette for the admin skeletons that receive `isDark`. */
const palette = (isDark?: boolean) => ({
    block: isDark ? 'bg-neutral-700' : 'bg-[#EAEAEA]',
    soft: isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]',
    card: isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E5E5E5]',
    border: isDark ? 'border-neutral-800' : 'border-[#E5E5E5]',
});

// Card skeleton for a single client in the clients grid
const SkeletonClientCard = ({ isDark }: { isDark?: boolean }) => {
    const p = palette(isDark);
    return (
        <div className={`p-5 rounded-2xl border animate-pulse flex flex-col gap-4 ${p.card}`}>
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 flex-none rounded-[10px] ${p.block}`} />
                <div className="flex flex-col gap-2 min-w-0">
                    <div className={`h-4 w-32 rounded ${p.block}`} />
                    <div className={`h-3 w-20 rounded ${p.soft}`} />
                </div>
            </div>
            <div className="flex gap-2">
                <div className={`h-[26px] w-[72px] rounded-full ${p.soft}`} />
                <div className={`h-[26px] w-14 rounded-full ${p.soft}`} />
            </div>
            <div className={`flex gap-4 pt-3.5 border-t ${p.border}`}>
                <div className={`h-3.5 w-20 rounded ${p.soft}`} />
                <div className={`h-3.5 w-24 rounded ${p.soft}`} />
            </div>
        </div>
    );
};

// Grid skeleton for the clients list page (renders inside AdminLayout)
export const SkeletonClientsGrid = ({ isDark, count = 6 }: { isDark?: boolean; count?: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => <SkeletonClientCard key={i} isDark={isDark} />)}
    </div>
);

// Full client detail page skeleton (renders inside AdminLayout)
export const SkeletonClientDetail = ({ isDark }: { isDark?: boolean }) => {
    const p = palette(isDark);

    return (
        <div className="animate-pulse flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-2.5">
                    <div className={`h-[26px] w-32 rounded-full mb-2.5 ${p.soft}`} />
                    <div className={`h-10 w-56 rounded-[10px] ${p.block}`} />
                    <div className={`h-3.5 w-64 max-w-full rounded ${p.soft}`} />
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <div className={`h-11 w-40 rounded-[11px] ${p.soft}`} />
                    <div className={`h-11 w-32 rounded-[11px] ${p.soft}`} />
                    <div className={`h-11 w-32 rounded-[11px] ${p.block}`} />
                </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-1 p-1 rounded-[10px] self-start max-w-full overflow-hidden ${p.soft}`}>
                {[...Array(7)].map((_, i) => (
                    <div key={i} className={`h-8 rounded-lg ${i === 0 ? `w-24 ${isDark ? 'bg-neutral-950' : 'bg-white'}` : `w-20 ${p.block} opacity-50`}`} />
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-6 rounded-2xl border flex flex-col gap-[18px] ${p.card}`}>
                    <div className={`h-5 w-44 rounded ${p.block}`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className={`h-3.5 w-24 rounded ${p.block}`} />
                                <div className={`h-[46px] w-full rounded-[10px] ${p.soft}`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border flex flex-col gap-5 ${p.card}`}>
                    <div className={`h-5 w-32 rounded ${p.block}`} />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className={`h-3.5 w-20 rounded ${p.block}`} />
                            <div className={`h-10 w-full rounded-[10px] ${p.soft}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
