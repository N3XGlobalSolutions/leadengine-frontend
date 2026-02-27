import React, { useState } from 'react';
import { LayoutDashboard, Users, User as UserIcon, Settings, LogOut, Bell, Sun, Moon, HelpCircle, Building2, AlertCircle } from 'lucide-react';
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

    // Mock state for read status
    const [unreadCount, setUnreadCount] = useState(2);

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

    const navLinkClass = (path: string) => {
        const active = isActive(path);
        if (active) {
            return isDark
                ? 'text-indigo-400 bg-indigo-900/50'
                : 'text-indigo-600 bg-indigo-50';
        }
        return isDark
            ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
    };

    return (
        <div className={`flex min-h-screen transition-colors duration-200 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            <aside className={`w-64 fixed h-full z-10 hidden md:flex flex-col transition-colors duration-200 ${isDark
                ? 'bg-slate-800 border-r border-slate-700'
                : 'bg-white border-r border-gray-200'
                }`}>
                <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">Q</span>
                        </div>
                        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Q-Bot Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link to="/admin" className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${navLinkClass('/admin')}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/clients" className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${navLinkClass('/admin/clients')}`}>
                        <Building2 size={20} />
                        <span>Clients</span>
                    </Link>
                    <Link to="/admin/leads" className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${navLinkClass('/admin/leads')}`}>
                        <Users size={20} />
                        <span>Leads</span>
                    </Link>
                    <Link to="/admin/users" className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${navLinkClass('/admin/users')}`}>
                        <UserIcon size={20} />
                        <span>Users</span>
                    </Link>
                    <Link to="/admin/settings" className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${navLinkClass('/admin/settings')}`}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                    <Link to="/admin/support" className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors mb-2 ${navLinkClass('/admin/support')}`}>
                        <HelpCircle size={20} />
                        <span>Support</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center space-x-3 px-4 py-3 w-full transition-colors ${isDark
                            ? 'text-slate-400 hover:text-red-400'
                            : 'text-gray-500 hover:text-red-600'
                            }`}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                    {user && (
                        <div className={`mt-2 px-4 text-xs text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            Logged in as {user.full_name}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64">
                <header className={`h-16 sticky top-0 z-20 px-8 flex items-center justify-between transition-colors duration-200 ${isDark
                    ? 'bg-slate-800 border-b border-slate-700'
                    : 'bg-white border-b border-gray-200'
                    }`}>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {location.pathname.includes('/settings') ? 'Settings' :
                            location.pathname.includes('/clients') ? 'Clients' : 'Dashboard'}
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
