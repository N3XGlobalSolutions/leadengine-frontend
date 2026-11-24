import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertCircle, 
    Lock, 
    Mail, 
    ArrowRight, 
    Loader2, 
    ShieldCheck, 
    Zap, 
    Bot, 
    Eye, 
    EyeOff, 
    Activity, 
    CheckCircle2
} from 'lucide-react';
import { UserRole } from '../types/auth';
import { BorderBeam } from '../components/landing/BorderBeam';
import { SpotlightBackground } from '../components/landing/SpotlightBackground';

export const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            const token = localStorage.getItem('access_token');
            if (token) {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                
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
                setError('Invalid email or password. Please check your credentials.');
            } else {
                setError('Unable to connect to the authentication server. Please try again.');
            }
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans text-slate-900 selection:bg-amber-500 selection:text-white">
            {/* Ambient Background Canvas & Soft Amber Spotlights */}
            <SpotlightBackground />

            {/* Soft Warm Background Accents */}
            <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[140px] pointer-events-none animate-pulse-subtle" />
            <div className="absolute bottom-10 right-1/3 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[140px] pointer-events-none animate-pulse-subtle" style={{ animationDelay: '2s' }} />

            {/* Main Portal Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] bg-white/90 backdrop-blur-2xl overflow-hidden relative z-10"
            >
                {/* Border Beam Glow Animation */}
                <BorderBeam size={350} duration={12} colorFrom="#f59e0b" colorTo="#71717a" />

                {/* Left Side: Dark Enterprise Showcase Panel (Desktop Only) */}
                <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-zinc-950 via-slate-900 to-black p-10 flex-col justify-between relative border-r border-zinc-800 text-white overflow-hidden">
                    {/* Subtle Top Ambient Glow inside Card */}
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Top Branding */}
                    <div className="relative z-10 mb-6">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 rounded-2xl bg-white text-black shadow-lg shadow-black/20 border border-white/20">
                                <Bot size={28} className="text-black" strokeWidth={2.2} />
                            </div>
                            <div>
                                <span className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                    LeadEngine
                                </span>
                                <p className="text-xs text-zinc-400 font-medium">Enterprise AI Automation Portal</p>
                            </div>
                        </div>
                    </div>

                    {/* Middle Feature Highlights */}
                    <div className="relative z-10 space-y-4 my-auto">
                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-colors backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Smart Lead Qualification</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5">Instant WhatsApp conversation routing & CRM sync.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-colors backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
                                    <Activity size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Real-Time Insights</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5">Live conversion analytics & campaign monitoring.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-colors backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Multi-Tenant Isolation</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5">Role-based access control with end-to-end security.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Security Footer */}
                    <div className="relative z-10 border-t border-zinc-800/80 pt-6 mt-6 flex items-center justify-between text-xs text-zinc-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-amber-400" />
                            <span>LeadEngine Platform v1.3.0</span>
                        </div>
                        <span>TLS 1.3 Encryption</span>
                    </div>
                </div>

                {/* Right Side: Clean Light Form Section */}
                <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center relative bg-white">
                    {/* Header */}
                    <div className="mb-8">
                        {/* Mobile Brand Logo */}
                        <div className="flex lg:hidden items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-white text-black border border-slate-200 shadow-md">
                                <Bot size={24} className="text-black" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight">LeadEngine Admin</span>
                        </div>

                        <div className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
                            Platform Administration
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Sign in with your administrative credentials to manage clients and leads.
                        </p>
                    </div>

                    {/* Animated Error Alert */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-sm"
                            >
                                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-red-900">Authentication Failed</p>
                                    <p className="text-xs text-red-700 mt-0.5">{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium hover:border-slate-300"
                                    placeholder="admin@company.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Password
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium hover:border-slate-300"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                                w-full py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center mt-6 relative overflow-hidden group shadow-lg shadow-zinc-950/15
                                ${isSubmitting 
                                    ? 'bg-zinc-800 text-zinc-300 cursor-wait' 
                                    : 'bg-zinc-900 hover:bg-black text-white hover:shadow-xl'
                                }
                            `}
                        >
                            {/* Button Shine Overlay */}
                            {!isSubmitting && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            )}

                            <span className="relative flex items-center gap-2 text-sm font-bold">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin text-amber-400" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} className="text-amber-400" />
                                        <span>Sign In Securely</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </form>

                    {/* Bottom Helper Info */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-2">
                            <Lock size={13} className="text-amber-500" />
                            <span>Protected by Enterprise SSL</span>
                        </div>
                        <p className="text-slate-400">
                            LeadEngine Platform © {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};



