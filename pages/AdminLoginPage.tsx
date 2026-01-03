import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AlertCircle, Sparkles, Lock, Mail, ArrowRight, Loader2, User as UserIcon, Building, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types/auth';

export const AdminLoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT_ADMIN);
    const [tenantId, setTenantId] = useState('');

    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register } = useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/admin';

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setPassword('');
        // Keep email/name if useful, or clear them
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isLogin) {
                await login(email, password);

                // Get the updated user state directly or decode token content to decide where to go
                // Since login() updates context, we might need to rely on the return value or a fresh check
                // For simplicity, let's assume login() throws if failed, and if success, we access current user info.
                // However, state updates are async. A better approach is to check the response of login if we modified authService to return user.

                // Alternative: Decode token locally to get immediate role/tenant info for redirection
                const token = localStorage.getItem('access_token');
                // We need to decode to get payload quickly
                const base64Url = token!.split('.')[1];
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
                    // Fallback
                    navigate('/admin');
                }

            } else {
                // ... registration logic ... (keep as is)
                // Validation: Tenant ID required for non-platform admins
                if (selectedRole !== UserRole.PLATFORM_ADMIN && !tenantId.trim()) {
                    throw { response: { status: 422, data: { detail: "Tenant ID is required for this role." } } };
                }

                await register({
                    email,
                    password,
                    full_name: fullName,
                    role: selectedRole,
                    tenant_id: selectedRole === UserRole.PLATFORM_ADMIN ? null : tenantId
                });

                // After register, auto-login happens in context (check AdminAuthContext)
                // We should also duplicate the redirect logic or rely on the user to click login?
                // Actually AdminAuthContext.register() calls login().
                // So we can assume successful login and redirect similarly.

                if (selectedRole === UserRole.PLATFORM_ADMIN || selectedRole === UserRole.AOB_ADMIN) {
                    navigate('/admin');
                } else {
                    // If we just registered with a tenantId, go there
                    navigate(`/${tenantId}/dashboard`);
                }
            }

        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('Invalid email or password. Please try again.');
            } else if (err.response?.status === 400) {
                // Often used for "User already exists" in registration
                setError(err.response.data.detail || 'Invalid request. User might already exist.');
            } else if (err.response?.status === 422) {
                setError(err.response.data?.detail || 'Please check your inputs (Password min 8 chars).');
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
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {isLogin
                                ? 'Sign in to access your Q-Bot dashboard'
                                : 'Join Q-Bot to start managing your AI assistants'
                            }
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

                        {/* Registration Extra Fields */}
                        {!isLogin && (
                            <>
                                {/* Full Name */}
                                <div className="space-y-1.5 animate-fade-in-up">
                                    <label className="text-xs font-medium text-slate-300 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <UserIcon size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="block w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-sm"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                                    <label className="text-xs font-medium text-slate-300 ml-1">Role</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <ShieldCheck size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                            className="block w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-sm appearance-none"
                                        >
                                            <option value={UserRole.CLIENT_ADMIN}>Client Admin</option>
                                            <option value={UserRole.CLIENT_AGENT}>Client Agent</option>
                                            <option value={UserRole.AOB_ADMIN}>AOB Admin</option>
                                            <option value={UserRole.PLATFORM_ADMIN}>Platform Admin</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Tenant ID (Conditional) */}
                                {selectedRole !== UserRole.PLATFORM_ADMIN && (
                                    <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                                        <label className="text-xs font-medium text-slate-300 ml-1">Tenant ID</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Building size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={tenantId}
                                                onChange={(e) => setTenantId(e.target.value)}
                                                className="block w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-sm"
                                                placeholder="UUID or Tenant Identifier"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 ml-1">
                                            Required for non-platform admins.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Email Input */}
                        <div className={`space-y-1.5 ${!isLogin ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: isLogin ? '0ms' : '150ms' }}>
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
                        <div className={`space-y-1.5 ${!isLogin ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: isLogin ? '0ms' : '200ms' }}>
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-medium text-slate-300">Password</label>
                                {isLogin && (
                                    <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
                                )}
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
                                    {isLogin ? 'Authenticating...' : 'Creating Account...'}
                                </>
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer / Switch Mode */}
                    <div className="mt-8 text-center pt-4 border-t border-slate-800/50">
                        <p className="text-sm text-slate-400">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={toggleMode}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline focus:outline-none"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
