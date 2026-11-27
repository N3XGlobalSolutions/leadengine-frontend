import React, { useEffect, useRef, useState } from 'react';
import {
    LayoutDashboard, Users, User as UserIcon, Settings, LogOut, Bell, Sun, Moon,
    Building2, AlertCircle, FileText, Megaphone, Cpu, MessageSquare,
    ChevronRight, ChevronLeft, Bot, Menu, X, type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { cn } from '../../utils/cn';
import { NotificationPopover } from './NotificationPopover';

export interface AdminBreadcrumb {
    label: string;
    to?: string;
}

export interface AdminLayoutProps {
    children: React.ReactNode;
    /** Top-bar breadcrumb, e.g. [{label:'Clients', to:'/admin/clients'}, {label: client.name}]. Defaults from the route. */
    breadcrumb?: AdminBreadcrumb[];
    /** Extra content at the right of the top bar, before the theme/bell/avatar buttons (e.g. a "Draft saved" pill). */
    headerRight?: React.ReactNode;
    /** Skip the default page padding (page draws edge-to-edge). */
    flush?: boolean;
}

const CLIENTS_CRUMB: AdminBreadcrumb = { label: 'Clients', to: '/admin/clients' };

const SIMPLE_CRUMBS: Record<string, AdminBreadcrumb[]> = {
    '/admin': [{ label: 'Overview' }, { label: 'Dashboard' }],
    '/admin/clients': [{ label: 'Operations' }, { label: 'Clients' }],
    '/admin/clients/new': [CLIENTS_CRUMB, { label: 'Add new client' }],
    '/admin/leads': [{ label: 'Operations' }, { label: 'Leads' }],
    '/admin/users': [{ label: 'Operations' }, { label: 'Users' }],
    '/admin/audit-logs': [{ label: 'Platform' }, { label: 'Audit Logs' }],
    '/admin/settings': [{ label: 'Platform' }, { label: 'Settings' }],
    '/admin/guide': [{ label: 'Platform' }, { label: 'Guide' }],
    '/admin/support': [{ label: 'Platform' }, { label: 'Support' }],
};

/** Breadcrumb derived from the route when a page doesn't pass one. */
const defaultBreadcrumb = (pathname: string, isClientAdmin: boolean): AdminBreadcrumb[] => {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (SIMPLE_CRUMBS[path]) return SIMPLE_CRUMBS[path];

    const outbound = path.match(/^\/admin\/clients\/[^/]+\/outbound(\/.*)?$/);
    if (outbound) {
        if (isClientAdmin) {
            // Client admins can't browse the clients list — mirror their sidebar instead.
            const sub = outbound[1] || '';
            const label = sub.startsWith('/conversations') ? 'Conversations' : sub.startsWith('/ai-settings') ? 'AI Settings' : 'Campaigns';
            return [{ label: 'Operations' }, { label }];
        }
        return [CLIENTS_CRUMB, { label: 'Bots & Campaigns' }];
    }
    if (/^\/admin\/clients\/[^/]+$/.test(path)) return [CLIENTS_CRUMB, { label: 'Client details' }];
    if (/^\/[^/]+\/leads$/.test(path)) return [{ label: 'Operations' }, { label: 'Leads' }];
    return [{ label: 'Overview' }, { label: 'Dashboard' }];
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, breadcrumb, headerRight, flush }) => {
    const { logout, user, sessionExpired } = useAdminAuth();
    const { isDark, toggleTheme } = useAdminTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);
    const notifRef = useRef<HTMLDivElement>(null);

    // Sidebar Pin / Hover Expand State
    const [isPinned, setIsPinned] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const isExpanded = isPinned || isHovered;

    // Mobile drawer: remembers the path it was opened on, so any navigation closes it.
    const [mobileNavPath, setMobileNavPath] = useState<string | null>(null);
    const isMobileNavOpen = mobileNavPath === location.pathname;
    const closeMobileNav = () => setMobileNavPath(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const drawerCloseRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isMobileNavOpen) return;
        const menuButton = menuButtonRef.current;
        drawerCloseRef.current?.focus();
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNavPath(null); };
        const desktop = window.matchMedia('(min-width: 768px)');
        const onDesktop = (e: MediaQueryListEvent) => { if (e.matches) setMobileNavPath(null); };
        window.addEventListener('keydown', onKey);
        desktop.addEventListener('change', onDesktop);
        return () => {
            window.removeEventListener('keydown', onKey);
            desktop.removeEventListener('change', onDesktop);
            document.body.style.overflow = prevOverflow;
            menuButton?.focus();
        };
    }, [isMobileNavOpen]);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    const crumbs = breadcrumb && breadcrumb.length > 0
        ? breadcrumb
        : defaultBreadcrumb(location.pathname, user?.role === 'client_admin');

    // ---- Sidebar pieces (shared by the desktop sidebar and the mobile drawer) ----

    const sectionLabel = (label: string, expanded: boolean) => expanded && (
        <div className={`text-[11px] font-bold uppercase tracking-[0.08em] px-3.5 mb-1.5 text-[#8C8C8C]`}>
            {label}
        </div>
    );

    const navLink = (to: string, label: string, IconCmp: LucideIcon, active: boolean, expanded: boolean, onNavigate?: () => void) => (
        <Link
            to={to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            aria-label={!expanded ? label : undefined}
            className={`relative flex items-center ${expanded ? 'justify-between px-3.5' : 'justify-center'} min-h-[42px] rounded-[10px] text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                active
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-[#B3B3B3] font-medium hover:bg-white/5 hover:text-white'
            }`}
            title={!expanded ? label : undefined}
        >
            {active && (
                <span className="absolute left-0 top-[9px] bottom-[9px] w-[3px] bg-white rounded-sm" />
            )}
            <div className="flex items-center gap-3">
                <IconCmp size={20} className="stroke-[2] shrink-0" />
                {expanded && <span className="tracking-tight">{label}</span>}
            </div>
        </Link>
    );

    const renderNav = (expanded: boolean, onNavigate?: () => void) => {
        if (user?.role === 'client_admin') {
            const outboundBase = `/admin/clients/${user.tenant_id}/outbound`;
            const onConversations = isActive(`${outboundBase}/conversations`);
            const onAiSettings = isActive(`${outboundBase}/ai-settings`);
            return (
                <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-6">
                    {/* Section: OVERVIEW */}
                    <div>
                        {sectionLabel('Overview', expanded)}
                        {navLink(`/${user.tenant_id}/dashboard`, 'Dashboard', LayoutDashboard, isActive(`/${user.tenant_id}/dashboard`), expanded, onNavigate)}
                    </div>

                    {/* Section: OPERATIONS */}
                    <div>
                        {sectionLabel('Operations', expanded)}
                        <div className="space-y-1">
                            {navLink(outboundBase, 'Campaigns', Megaphone, isActive(outboundBase) && !onConversations && !onAiSettings, expanded, onNavigate)}
                            {navLink(`${outboundBase}/conversations`, 'Conversations', MessageSquare, onConversations, expanded, onNavigate)}
                            {navLink(`${outboundBase}/ai-settings`, 'AI Settings', Cpu, onAiSettings, expanded, onNavigate)}
                        </div>
                    </div>
                </nav>
            );
        }
        return (
            <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-6">
                {/* Section: OVERVIEW */}
                <div>
                    {sectionLabel('Overview', expanded)}
                    {navLink('/admin', 'Dashboard', LayoutDashboard, isActive('/admin'), expanded, onNavigate)}
                </div>

                {/* Section: OPERATIONS */}
                <div>
                    {sectionLabel('Operations', expanded)}
                    <div className="space-y-1">
                        {navLink('/admin/clients', 'Clients', Building2, isActive('/admin/clients'), expanded, onNavigate)}
                        {navLink('/admin/leads', 'Leads', Users, isActive('/admin/leads'), expanded, onNavigate)}
                        {user?.role !== 'sales_team' && navLink('/admin/users', 'Users', UserIcon, isActive('/admin/users'), expanded, onNavigate)}
                    </div>
                </div>

                {/* Section: PLATFORM */}
                <div>
                    {sectionLabel('Platform', expanded)}
                    <div className="space-y-1">
                        {user?.role === 'platform_admin' && navLink('/admin/audit-logs', 'Audit Logs', FileText, isActive('/admin/audit-logs'), expanded, onNavigate)}
                        {navLink('/admin/settings', 'Settings', Settings, isActive('/admin/settings'), expanded, onNavigate)}
                    </div>
                </div>
            </nav>
        );
    };

    const renderFooter = (expanded: boolean) => (
        <div className={`p-3.5 space-y-2 shrink-0`}>
            {expanded && (
                <div className={`text-[11px] font-bold uppercase tracking-[0.08em] px-3.5 text-[#8C8C8C]`}>
                    System
                </div>
            )}

            {/* Profile Card */}
            <div className={`p-3 rounded-xl border flex items-center ${expanded ? 'gap-3' : 'justify-center'} bg-[#171717] border-[#262626]`}>
                <div className="h-[34px] w-[34px] rounded-full bg-white text-[#0A0A0A] font-extrabold text-xs flex items-center justify-center shrink-0">
                    {user?.full_name?.substring(0, 2).toUpperCase() || 'ER'}
                </div>
                {expanded && (
                    <div className="overflow-hidden">
                        <div className={`font-bold text-[13px] truncate text-white`}>
                            {user?.full_name || 'Elena Rostova'}
                        </div>
                        <div className={`text-xs font-medium truncate text-[#A3A3A3]`}>
                            {user?.role === 'platform_admin' ? 'Owner / Admin' : user?.role === 'sales_team' ? 'Sales Manager' : 'Account Admin'}
                        </div>
                    </div>
                )}
            </div>

            {/* Sign Out Button */}
            <button
                type="button"
                onClick={handleLogout}
                aria-label={!expanded ? 'Sign Out' : undefined}
                className={`w-full flex items-center ${expanded ? 'gap-2.5 px-3' : 'justify-center px-0'} min-h-[42px] rounded-[10px] text-sm font-medium transition-colors text-[#B3B3B3] hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                title={!expanded ? "Sign Out" : undefined}
            >
                <LogOut size={18} strokeWidth={2} className="shrink-0" />
                {expanded && <span>Sign Out</span>}
            </button>
        </div>
    );

    // ---- Top bar styles ----
    const barButton = cn(
        'w-10 h-10 rounded-[10px] border-0 bg-transparent flex items-center justify-center cursor-pointer transition-colors shrink-0',
        'focus:outline-none focus-visible:ring-[3px]',
        isDark ? 'text-white hover:bg-neutral-800 focus-visible:ring-white/20' : 'text-[#0A0A0A] hover:bg-[#F2F2F2] focus-visible:ring-black/10',
    );

    return (
        <div className={cn(
            'flex min-h-screen transition-colors duration-200 font-sans',
            isDark ? 'bg-neutral-950 text-white selection:bg-white selection:text-black' : 'bg-[#F5F5F5] text-[#0A0A0A] selection:bg-black selection:text-white',
        )}>
            {/* Sidebar - QuickDine Inspired with Robot Logo & Hover Expand / Pin Toggle */}
            <aside
                onMouseEnter={() => !isPinned && setIsHovered(true)}
                onMouseLeave={() => !isPinned && setIsHovered(false)}
                className={`fixed top-0 left-0 h-full z-30 hidden md:flex flex-col font-jakarta transition-all duration-300 ease-in-out ${
                    isExpanded ? 'w-64 shadow-2xl md:shadow-none' : 'w-20'
                } bg-[#0A0A0A] border-r border-[#1F1F1F]`}
            >
                {/* Brand Header */}
                <div className={`h-16 border-b flex items-center shrink-0 transition-all ${
                    isExpanded ? 'px-4 justify-between' : 'justify-center px-2'
                } border-[#1F1F1F]`}>
                    {isExpanded ? (
                        <>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {/* Robot Logo */}
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform duration-200 hover:scale-105 bg-white text-[#0A0A0A] border-white/20">
                                    <Bot size={22} strokeWidth={2.3} />
                                </div>
                                <span className={`text-[17px] font-extrabold tracking-[-0.02em] truncate text-white`}>
                                    LeadEngine
                                </span>
                            </div>

                            {/* Arrow Pin/Unpin Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setIsPinned(!isPinned)}
                                className={`p-2 rounded-xl border transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                                    isPinned
                                        ? 'bg-[#171717] border-[#333333] text-[#D4D4D4] hover:text-white'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                }`}
                                title={isPinned ? "Unpin sidebar (Expand on hover only)" : "Pin sidebar open"}
                                aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
                            >
                                <ChevronLeft size={16} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : (
                        /* Collapsed Header Mode: Clean Robot Logo centered with pin click tooltip */
                        <button
                            type="button"
                            onClick={() => setIsPinned(true)}
                            className="group relative h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm transition-all hover:scale-105 bg-white text-[#0A0A0A] border-white/20 hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                            title="Click to pin sidebar open"
                            aria-label="Pin sidebar open"
                        >
                            <Bot size={22} strokeWidth={2.3} className="group-hover:opacity-0 transition-opacity" />
                            <ChevronRight size={20} strokeWidth={2.5} className="absolute opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
                        </button>
                    )}
                </div>

                {/* Categorized Navigation List */}
                {renderNav(isExpanded)}

                {/* Bottom Profile & System Footer */}
                {renderFooter(isExpanded)}
            </aside>

            {/* Mobile navigation drawer (same black sidebar, always expanded) */}
            {isMobileNavOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={closeMobileNav} />
                    <aside
                        id="admin-mobile-nav"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation"
                        className="relative h-full w-64 max-w-[85vw] flex flex-col font-jakarta bg-[#0A0A0A] border-r border-[#1F1F1F] shadow-2xl"
                    >
                        <div className="h-16 border-b border-[#1F1F1F] flex items-center justify-between px-4 shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm bg-white text-[#0A0A0A] border-white/20">
                                    <Bot size={22} strokeWidth={2.3} />
                                </div>
                                <span className="text-[17px] font-extrabold tracking-[-0.02em] truncate text-white">LeadEngine</span>
                            </div>
                            <button
                                ref={drawerCloseRef}
                                type="button"
                                onClick={closeMobileNav}
                                aria-label="Close navigation"
                                className="p-2 rounded-xl border bg-[#171717] border-[#333333] text-[#D4D4D4] hover:text-white shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                        {renderNav(true, closeMobileNav)}
                        {renderFooter(true)}
                    </aside>
                </div>
            )}

            {/* Main Content Layout Adjuster */}
            <main className={cn(
                'flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out',
                isPinned ? 'md:ml-64' : 'md:ml-20',
            )}>
                <div className="sticky top-0 z-20">
                    {/* Top bar: breadcrumb left; page slot, theme, notifications, avatar right */}
                    <header className={cn(
                        'min-h-16 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-8 py-2.5 box-border border-b font-jakarta transition-colors duration-200',
                        isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-[#E5E5E5] text-[#0A0A0A]',
                    )}>
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                ref={menuButtonRef}
                                type="button"
                                onClick={() => setMobileNavPath(location.pathname)}
                                aria-label="Open navigation"
                                aria-expanded={isMobileNavOpen}
                                aria-controls="admin-mobile-nav"
                                className={cn(barButton, 'md:hidden -ml-2')}
                            >
                                <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
                            </button>

                            <nav aria-label="Breadcrumb" className="min-w-0">
                                <ol className="m-0 p-0 list-none flex items-center gap-2 text-sm min-w-0">
                                    {crumbs.map((c, i) => {
                                        const last = i === crumbs.length - 1;
                                        return (
                                            <li key={`${i}-${c.label}`} className={cn('flex items-center gap-2', last ? 'min-w-0' : 'shrink-0')}>
                                                {i > 0 && <span aria-hidden="true" className={isDark ? 'text-neutral-500' : 'text-[#6B6B6B]'}>/</span>}
                                                {last ? (
                                                    <span aria-current="page" className={cn('font-bold truncate', isDark ? 'text-white' : 'text-[#0A0A0A]')}>{c.label}</span>
                                                ) : c.to ? (
                                                    <Link
                                                        to={c.to}
                                                        className={cn(
                                                            'font-semibold no-underline hover:underline underline-offset-2 rounded focus:outline-none focus-visible:ring-[3px]',
                                                            isDark ? 'text-neutral-400 hover:text-white focus-visible:ring-white/20' : 'text-[#6B6B6B] hover:text-[#0A0A0A] focus-visible:ring-black/10',
                                                        )}
                                                    >
                                                        {c.label}
                                                    </Link>
                                                ) : (
                                                    <span className={cn('font-semibold', isDark ? 'text-neutral-400' : 'text-[#6B6B6B]')}>{c.label}</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </nav>
                        </div>

                        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                            {headerRight}

                            {/* Theme Toggle */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label="Switch theme"
                                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                className={barButton}
                            >
                                {isDark ? <Moon size={18} strokeWidth={1.8} aria-hidden="true" /> : <Sun size={18} strokeWidth={1.8} aria-hidden="true" />}
                            </button>

                            {/* Notifications */}
                            <div ref={notifRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                                    aria-haspopup="dialog"
                                    aria-expanded={isNotifOpen}
                                    className={cn(barButton, 'relative')}
                                >
                                    <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
                                    {unreadCount > 0 && (
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'absolute top-[9px] right-[10px] w-[7px] h-[7px] rounded border-[1.5px]',
                                                isDark ? 'bg-white border-neutral-900' : 'bg-[#0A0A0A] border-white',
                                            )}
                                        />
                                    )}
                                </button>

                                <NotificationPopover
                                    isOpen={isNotifOpen}
                                    onClose={() => setIsNotifOpen(false)}
                                    onMarkAllRead={() => setUnreadCount(0)}
                                    anchorRef={notifRef}
                                />
                            </div>

                            {/* Avatar */}
                            <span
                                title={user?.full_name || undefined}
                                className={cn(
                                    'w-[34px] h-[34px] rounded-full text-[13px] font-extrabold flex items-center justify-center shrink-0 ml-1',
                                    isDark ? 'bg-white text-[#0A0A0A]' : 'bg-[#0A0A0A] text-white',
                                )}
                            >
                                {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                    </header>

                    {/* Session Expired Warning Banner */}
                    {sessionExpired && (
                        <div
                            role="alert"
                            className={cn(
                                'w-full px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b font-jakarta',
                                isDark ? 'bg-amber-950 text-amber-200 border-amber-900' : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
                            )}
                        >
                            <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                                <AlertCircle size={16} className="flex-shrink-0" aria-hidden="true" />
                                <span>Your session has expired. You can keep working, but please save your changes and log in again to continue.</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-[13px] font-bold underline underline-offset-2 whitespace-nowrap hover:opacity-75 transition-opacity rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                            >
                                Log In Again
                            </button>
                        </div>
                    )}
                </div>

                <div className={cn('flex-1', !flush && 'px-4 sm:px-8 pt-7 pb-16')}>
                    {children}
                </div>
            </main>
        </div>
    );
};
