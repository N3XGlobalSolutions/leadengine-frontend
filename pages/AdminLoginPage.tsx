import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AlertCircle, Sparkles } from 'lucide-react';

export const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/admin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (email === 'admin@qbot.com' && password === 'password') {
                await login(email);
                navigate(from, { replace: true });
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (err) {
            setError('Invalid email or password');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a1628] relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10"></div>

            {/* Animated background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            <div className="w-full max-w-sm z-10 relative px-4">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="text-blue-500">
                        <Sparkles size={24} />
                    </div>
                    <span className="text-blue-500 font-bold text-lg tracking-tight">Q-Bot Admin</span>
                </div>

                {/* Heading */}
                <h1 className="text-4xl font-bold text-white mb-8">Sign in</h1>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center">
                        <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                            placeholder="your@email.com"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                            placeholder="••••••"
                        />
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <label htmlFor="remember" className="text-sm text-slate-400">Remember me</label>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`
                            w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 border
                            ${isSubmitting
                                ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                                : 'bg-white text-slate-900 border-white hover:bg-slate-100 hover:shadow-lg hover:shadow-white/10'
                            }
                        `}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin mr-2"></div>
                                Signing in...
                            </span>
                        ) : (
                            'Sign in'
                        )}
                    </button>
                </form>

                {/* Forgot Password */}
                <div className="text-center mt-5">
                    <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                        Forgot your password?
                    </a>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-700"></div>
                    <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                {/* Footer */}
                <div className="text-center mt-10">
                    <p className="text-xs text-slate-600">
                        Protected by Q-Bot Secure Auth &bull; v1.3.0
                    </p>
                </div>
            </div>
        </div>
    );
};
