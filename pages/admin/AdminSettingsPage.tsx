import React, { useState } from 'react';
import { User, Lock, Bell, Moon, Sun, Save, Shield, Mail } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export const AdminSettingsPage = () => {
    const { user } = useAdminAuth();
    const { isDark, toggleTheme } = useAdminTheme();

    // Mock States for form inputs
    const [fullName, setFullName] = useState(user?.full_name || 'Admin User');
    const [email, setEmail] = useState(user?.email || 'admin@example.com');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock save
        alert('Settings saved successfully!');
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto px-3 sm:px-4">
                <div className="mb-6 sm:mb-8">
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
                    <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage your account preferences and system settings.</p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    {/* Profile Section */}
                    <section className={`rounded-lg sm:rounded-xl border p-4 sm:p-6 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <User size={20} />
                            </div>
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Information</h2>
                        </div>

                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDark
                                        ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className={`absolute left-3 top-3.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full pl-10 p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDark
                                            ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500'
                                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-end">
                                <button type="submit" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto">
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Appearance Section */}
                    <section className={`rounded-lg sm:rounded-xl border p-4 sm:p-6 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                {isDark ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Appearance</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</p>
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Adjust the appearance of the admin panel to reduce eye strain.</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </section>

                    {/* Notifications Section */}
                    <section className={`rounded-lg sm:rounded-xl border p-4 sm:p-6 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <Bell size={20} />
                            </div>
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and alerts via email.' },
                                { id: 'push', label: 'Push Notifications', desc: 'Get real-time browser alerts for new leads.' },
                                { id: 'marketing', label: 'Marketing Updates', desc: 'Receive news about new features and promotions.' }
                            ].map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-2">
                                    <div className="flex-1">
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                                        <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications({ ...notifications, [item.id]: !notifications[item.id as keyof typeof notifications] })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[item.id as keyof typeof notifications] ? 'bg-indigo-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[item.id as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Security Section (Mock) */}
                    <section className={`rounded-lg sm:rounded-xl border p-4 sm:p-6 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Shield size={20} />
                            </div>
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Security</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Password</p>
                                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Last changed 3 months ago</p>
                            </div>
                            <button className={`px-4 py-2 rounded-lg border font-medium transition-colors w-full sm:w-auto text-sm ${isDark
                                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}>
                                Change Password
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
};
