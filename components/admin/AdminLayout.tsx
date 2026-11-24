import React, { useState } from 'react';
import { 
    LayoutDashboard, Users, User as UserIcon, Settings, LogOut, Bell, Sun, Moon, 
    HelpCircle, Building2, AlertCircle, FileText, Megaphone, Cpu, Package, Calendar, 
    MessageSquare, BarChart3, ChevronRight, ChevronLeft, Bot, Pin
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { NotificationPopover } from './NotificationPopover';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { logout, user, sessionExpired } = useAdminAuth();
    const { isDark, toggleTheme } = useAdminTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);

    // Sidebar Pin / Hover Expand State
    const [isPinned, setIsPinned] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const isExpanded = isPinned || isHovered;

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

    return (
        <div className={`flex min-h-screen transition-colors duration-200 font-sans selection:bg-amber-500 selection:text-white ${
            isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
        }`}>
            {/* Sidebar - QuickDine Inspired with Robot Logo & Hover Expand / Pin Toggle */}
            <aside 
                onMouseEnter={() => !isPinned && setIsHovered(true)}
                onMouseLeave={() => !isPinned && setIsHovered(false)}
                className={`fixed top-0 left-0 h-full z-30 hidden md:flex flex-col transition-all duration-300 ease-in-out ${
                    isExpanded ? 'w-64 shadow-2xl md:shadow-none' : 'w-20'
                } ${
                    isDark ? 'bg-slate-900 border-r border-slate-800/80' : 'bg-white border-r border-slate-200/90'
                }`}
            >
                {/* Brand Header */}
                <div className={`h-16 border-b flex items-center shrink-0 transition-all ${
                    isExpanded ? 'px-4 justify-between' : 'justify-center px-2'
                } ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                    {isExpanded ? (
                        <>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {/* Robot Logo */}
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform duration-200 hover:scale-105 ${
                                    isDark 
                                        ? 'bg-white text-black border-white/20' 
                                        : 'bg-slate-950 text-white border-slate-800'
                                }`}>
                                    <Bot size={22} strokeWidth={2.3} />
                                </div>
                                <span className={`text-lg font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    LeadEngine
                                </span>
                            </div>

                            {/* Arrow Pin/Unpin Toggle Button */}
                            <button
                                onClick={() => setIsPinned(!isPinned)}
                                className={`p-2 rounded-xl border transition-all shrink-0 ${
                                    isPinned 
                                        ? (isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900')
                                        : (isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-800')
                                }`}
                                title={isPinned ? "Unpin sidebar (Expand on hover only)" : "Pin sidebar open"}
                            >
                                <ChevronLeft size={16} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : (
                        /* Collapsed Header Mode: Clean Robot Logo centered with pin click tooltip */
                        <button
                            onClick={() => setIsPinned(true)}
                            className={`group relative h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm transition-all hover:scale-105 ${
                                isDark 
                                    ? 'bg-white text-black border-white/20 hover:bg-slate-100' 
                                    : 'bg-slate-950 text-white border-slate-800 hover:bg-slate-900'
                            }`}
                            title="Click to pin sidebar open"
                        >
                            <Bot size={22} strokeWidth={2.3} className="group-hover:opacity-0 transition-opacity" />
                            <ChevronRight size={20} strokeWidth={2.5} className="absolute opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
                        </button>
                    )}
                </div>

                {/* Categorized Navigation List */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-6">
                    {user?.role === 'client_admin' ? (
                        <>
                            {/* Section: OVERVIEW */}
                            <div>
                                {isExpanded && (
                                    <div className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Overview
                                    </div>
                                )}
                                <Link 
                                    to={`/${user.tenant_id}/dashboard`} 
                                    className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                        isActive(`/${user.tenant_id}/dashboard`)
                                            ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                            : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                    }`}
                                    title={!isExpanded ? "Dashboard" : undefined}
                                >
                                    {isActive(`/${user.tenant_id}/dashboard`) && (
                                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                    )}
                                    <div className="flex items-center gap-3">
                                        <LayoutDashboard size={20} className="stroke-[2] shrink-0" />
                                        {isExpanded && <span className="tracking-tight">Dashboard</span>}
                                    </div>
                                </Link>
                            </div>

                            {/* Section: OPERATIONS */}
                            <div>
                                {isExpanded && (
                                    <div className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Operations
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Link 
                                        to={`/admin/clients/${user.tenant_id}/outbound`} 
                                        className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                            isActive(`/admin/clients/${user.tenant_id}/outbound`)
                                                ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                        }`}
                                        title={!isExpanded ? "Campaigns" : undefined}
                                    >
                                        {isActive(`/admin/clients/${user.tenant_id}/outbound`) && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Megaphone size={20} className="stroke-[2] shrink-0" />
                                            {isExpanded && <span className="tracking-tight">Campaigns</span>}
                                        </div>
                                    </Link>

                                    <Link 
                                        to={`/admin/clients/${user.tenant_id}/outbound/conversations`} 
                                        className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                            isActive(`/admin/clients/${user.tenant_id}/outbound/conversations`)
                                                ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                        }`}
                                        title={!isExpanded ? "Conversations" : undefined}
                                    >
                                        {isActive(`/admin/clients/${user.tenant_id}/outbound/conversations`) && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <MessageSquare size={20} className="stroke-[2] shrink-0" />
                                            {isExpanded && <span className="tracking-tight">Conversations</span>}
                                        </div>
                                    </Link>

                                    <Link 
                                        to={`/admin/clients/${user.tenant_id}/outbound/ai-settings`} 
                                        className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                            isActive(`/admin/clients/${user.tenant_id}/outbound/ai-settings`)
                                                ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                        }`}
                                        title={!isExpanded ? "AI Settings" : undefined}
                                    >
                                        {isActive(`/admin/clients/${user.tenant_id}/outbound/ai-settings`) && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Cpu size={20} className="stroke-[2] shrink-0" />
                                            {isExpanded && <span className="tracking-tight">AI Settings</span>}
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Section: OVERVIEW */}
                            <div>
                                {isExpanded && (
                                    <div className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Overview
                                    </div>
                                )}
                                <Link 
                                    to="/admin" 
                                    className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                        isActive('/admin') && location.pathname === '/admin'
                                            ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                            : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                    }`}
                                    title={!isExpanded ? "Dashboard" : undefined}
                                >
                                    {isActive('/admin') && location.pathname === '/admin' && (
                                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                    )}
                                    <div className="flex items-center gap-3">
                                        <LayoutDashboard size={20} className="stroke-[2] shrink-0" />
                                        {isExpanded && <span className="tracking-tight">Dashboard</span>}
                                    </div>
                                </Link>
                            </div>

                            {/* Section: OPERATIONS */}
                            <div>
                                {isExpanded && (
                                    <div className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Operations
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Link 
                                        to="/admin/clients" 
                                        className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                            isActive('/admin/clients')
                                                ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                        }`}
                                        title={!isExpanded ? "Clients" : undefined}
                                    >
                                        {isActive('/admin/clients') && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Building2 size={20} className="stroke-[2] shrink-0" />
                                            {isExpanded && <span className="tracking-tight">Clients</span>}
                                        </div>
                                    </Link>

                                    <Link 
                                        to="/admin/leads" 
                                        className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                            isActive('/admin/leads')
                                                ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                        }`}
                                        title={!isExpanded ? "Leads" : undefined}
                                    >
                                        {isActive('/admin/leads') && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Users size={20} className="stroke-[2] shrink-0" />
                                            {isExpanded && <span className="tracking-tight">Leads</span>}
                                        </div>
                                    </Link>

                                    {user?.role !== 'sales_team' && (
                                        <Link 
                                            to="/admin/users" 
                                            className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                                isActive('/admin/users')
                                                    ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                    : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                            }`}
                                            title={!isExpanded ? "Users" : undefined}
                                        >
                                            {isActive('/admin/users') && (
                                                <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                            )}
                                            <div className="flex items-center gap-3">
                                                <UserIcon size={20} className="stroke-[2] shrink-0" />
                                                {isExpanded && <span className="tracking-tight">Users</span>}
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Section: PLATFORM */}
                            <div>
                                {isExpanded && (
                                    <div className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Platform
                                    </div>
                                )}
                                <div className="space-y-1">
                                    {user?.role === 'platform_admin' && (
                                        <Link 
                                            to="/admin/audit-logs" 
                                            className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                                isActive('/admin/audit-logs')
                                                    ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                    : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                            }`}
                                            title={!isExpanded ? "Audit Logs" : undefined}
                                        >
                                            {isActive('/admin/audit-logs') && (
                                                <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                            )}
                                            <div className="flex items-center gap-3">
                                                <FileText size={20} className="stroke-[2] shrink-0" />
                                                {isExpanded && <span className="tracking-tight">Audit Logs</span>}
                                            </div>
                                        </Link>
                                    )}

                                    <Link 
                                        to="/admin/settings" 
                                        className={`relative flex items-center ${isExpanded ? 'justify-between px-3.5' : 'justify-center'} py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                            isActive('/admin/settings')
                                                ? (isDark ? 'bg-blue-950/70 text-blue-400 font-bold border border-blue-800/60' : 'bg-blue-50 text-blue-600 font-bold border border-blue-200/80')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                                        }`}
                                        title={!isExpanded ? "Settings" : undefined}
                                    >
                                        {isActive('/admin/settings') && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-blue-600 rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Settings size={20} className="stroke-[2] shrink-0" />
                                            {isExpanded && <span className="tracking-tight">Settings</span>}
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </nav>

                {/* Bottom Profile & System Footer */}
                <div className={`p-3.5 border-t space-y-2.5 shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    {isExpanded && (
                        <div className={`text-[11px] font-bold uppercase tracking-wider px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            System
                        </div>
                    )}

                    {/* Profile Card */}
                    <div className={`p-3 rounded-2xl border flex items-center ${isExpanded ? 'gap-3' : 'justify-center'} ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
                    }`}>
                        <div className="h-9 w-9 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0 border border-slate-700">
                            {user?.full_name?.substring(0, 2).toUpperCase() || 'ER'}
                        </div>
                        {isExpanded && (
                            <div className="overflow-hidden">
                                <div className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {user?.full_name || 'Elena Rostova'}
                                </div>
                                <div className={`text-xs font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {user?.role === 'platform_admin' ? 'Owner / Admin' : user?.role === 'sales_team' ? 'Sales Manager' : 'Account Admin'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sign Out Button */}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${isExpanded ? 'gap-2.5 px-3' : 'justify-center px-0'} py-2 rounded-xl text-sm font-semibold transition-colors ${
                            isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={!isExpanded ? "Sign Out" : undefined}
                    >
                        <LogOut size={18} strokeWidth={2} className="shrink-0" />
                        {isExpanded && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Layout Adjuster */}
            <main className={`flex-1 transition-all duration-300 ease-in-out ${
                isPinned ? 'md:ml-64' : 'md:ml-20'
            }`}>
                <header className={`h-16 sticky top-0 z-20 px-8 flex items-center justify-between transition-colors duration-200 ${isDark
                    ? 'bg-slate-800 border-b border-slate-700'
                    : 'bg-white border-b border-gray-200'
                    }`}>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {location.pathname.includes('/settings') ? 'Settings' :
                            location.pathname.includes('/outbound') ? 'Bots & Campaigns' :
                            location.pathname.includes('/clients') ? 'Clients' : 
                            location.pathname.includes('/audit-logs') ? 'Audit Logs' : 'Dashboard'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-colors ${isDark
                                ? 'text-yellow-400 hover:bg-slate-700'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className={`p-2 rounded-full transition-colors relative ${isDark
                                    ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                                )}
                            </button>

                            <NotificationPopover
                                isOpen={isNotifOpen}
                                onClose={() => setIsNotifOpen(false)}
                                onMarkAllRead={() => setUnreadCount(0)}
                            />
                        </div>

                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border ${isDark
                            ? 'bg-indigo-900 text-indigo-300 border-indigo-700'
                            : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                            }`}>
                            {user?.full_name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                {/* Session Expired Warning Banner */}
                {sessionExpired && (
                    <div className="sticky top-16 z-30 w-full bg-amber-500 text-amber-950 px-6 py-2.5 flex items-center justify-between gap-4 shadow-md">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span>Your session has expired. You can keep working, but please save your changes and log in again to continue.</span>
                        </div>
                        <button
                            onClick={() => { logout(); navigate('/admin/login'); }}
                            className="text-xs font-bold underline whitespace-nowrap hover:opacity-75 transition-opacity"
                        >
                            Log In Again
                        </button>
                    </div>
                )}

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
