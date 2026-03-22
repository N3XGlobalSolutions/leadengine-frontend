import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AlertCircle, Sparkles, Lock, Mail, ArrowRight, Loader2, User as UserIcon, Building, ShieldCheck, Zap, Bot } from 'lucide-react';
import { UserRole } from '../types/auth';


export const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAdminAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            // Alternative: Decode token locally to get immediate role/tenant info for redirection
            const token = localStorage.getItem('access_token');
            if (token) {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                // Verify role
                if (payload.role === UserRole.PLATFORM_ADMIN || payload.role === UserRole.SALES_TEAM) {
                    navigate('/admin/clients');
                } else if (payload.tenant_id) {
                    navigate(`/${payload.tenant_id}/dashboard`);
                } else {
                    navigate('/admin');
                }
            } else {
                throw new Error("No token received");
            }

        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError('Unable to connect to the server. Please try again later.');
            }
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden font-sans">
            {/* Enhanced Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-600/20 via-purple-900/10 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

            {/* Animated Gradient Orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gradient-to-tl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-[480px] z-10 relative px-4">

                {/* Card Container */}
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl shadow-2xl shadow-indigo-500/10 p-10 transform transition-all hover:shadow-indigo-500/20 duration-500">

                    {/* QBot Logo & Branding */}
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center mb-6">
                            {/* QBot Logo */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                                <div className="relative p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl border border-indigo-400/30 shadow-xl">
                                    <Bot size={40} className="text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        {/* QBot Brand Name */}
                        <div className="mb-4">
                            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 tracking-tight">
                                QBot
                            </h1>
                            <div className="flex items-center justify-center gap-2 text-indigo-300/80 text-sm font-medium">
                                <Zap size={14} className="text-indigo-400" />
                                <span>AI-Powered Lead Qualification</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Sign in to access your intelligent dashboard
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-start animate-fade-in backdrop-blur-sm">
                            <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div className="space-y-2 animate-fade-in-up">
                            <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wide">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all text-sm hover:border-slate-600 font-medium"
                                    placeholder="you@company.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Password</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all text-sm hover:border-slate-600 font-medium"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                                w-full py-4 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center mt-6 relative overflow-hidden group
                                ${isSubmitting
                                    ? 'bg-indigo-600/50 text-white/50 cursor-wait'
                                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 active:translate-y-0'
                                }
                            `}
                        >
                            {/* Button shine effect */}
                            {!isSubmitting && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            )}

                            <span className="relative flex items-center">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-2" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} className="mr-2" />
                                        Sign In Securely
                                        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles size={14} className="text-indigo-400" />
                            <p className="text-xs font-semibold text-indigo-300">
                                Powered by QBot AI Platform
                            </p>
                        </div>
                        <p className="text-xs text-slate-500">
                            Secure access. Authorized personnel only.
                        </p>
                    </div>
                </div>

                {/* Version Badge */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600 font-medium">
                        Version 1.3.0 · Intelligent Lead Management System
                    </p>
                </div>
            </div>
        </div >
    );
};

