import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AlertCircle, Sparkles, Lock, Mail, ArrowRight, Loader2, User as UserIcon, Building, ShieldCheck } from 'lucide-react';
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

                if (payload.role === UserRole.PLATFORM_ADMIN || payload.role === UserRole.AOB_ADMIN) {
                    navigate('/admin');
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
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>

            {/* Animated Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] animate-pulse delay-700"></div>

            <div className="w-full max-w-[420px] z-10 relative px-4">

                {/* Card Container */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] duration-500">


                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                                <Sparkles size={24} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Sign in to access your Q-Bot dashboard
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl flex items-start animate-fade-in">
                            <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-1.5 animate-fade-in-up">
                            <label className="text-xs font-medium text-slate-300 ml-1">Work Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-sm"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-medium text-slate-300">Password</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                                w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center mt-2
                                ${isSubmitting
                                    ? 'bg-blue-600/50 text-white/50 cursor-wait'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin mr-2" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer - Private System Notice */}
                    <div className="mt-8 text-center pt-4 border-t border-slate-800/50">
                        <p className="text-xs text-slate-500">
                            Private System. Access restricted to authorized personnel.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
};
