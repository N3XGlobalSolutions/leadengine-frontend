import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap, BarChart3, ArrowRight, MessageSquare } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-x-hidden">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 group cursor-default">
                            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all duration-300 group-hover:rotate-3">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                QBOT
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin/login')}
                                className="hidden md:block px-6 py-2.5 rounded-full text-gray-600 font-medium hover:text-indigo-600 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/admin/login')}
                                className="px-6 py-2.5 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-grow">
                <div className="relative pt-20 pb-32 lg:pt-32 lg:pb-48">
                    {/* Background Blobs */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
                        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-indigo-100 text-indigo-700 font-medium text-sm mb-8 backdrop-blur-sm shadow-sm animate-fade-in-up">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            Waitlist 2.0 is now open
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1]">
                            Automate Your Sales <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-x">
                                With Intelligent AI
                            </span>
                        </h1>

                        <p className="mt-6 max-w-2xl mx-auto text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed font-light">
                            Engage leads 24/7, qualify prospects instantly, and schedule meetings automatically.
                            <span className="block mt-2 font-normal text-gray-900">The future of sales automation is here.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                            <button
                                onClick={() => navigate('/admin/login')}
                                className="group px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                            >
                                Start Your Free Trial
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => window.open('#', '_blank')} // Placeholder demo link
                                className="px-8 py-4 rounded-full bg-white text-gray-700 font-semibold text-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
                            >
                                Watch Demo
                            </button>
                        </div>

                        {/* Social Proof / Trust Badges (Placeholder) */}
                        <div className="mt-16 pt-8 border-t border-gray-200/60 max-w-4xl mx-auto">
                            <p className="text-sm font-medium text-gray-500 mb-6 uppercase tracking-wider">Trusted by forward-thinking companies</p>
                            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                <div className="text-xl font-bold font-serif flex items-center gap-1"><div className="w-6 h-6 bg-gray-800 rounded-full"></div>ACME Corp</div>
                                <div className="text-xl font-bold font-mono flex items-center gap-1"><div className="w-6 h-6 bg-gray-800 rotate-45"></div>TechFlow</div>
                                <div className="text-xl font-bold font-sans italic flex items-center gap-1"><div className="w-6 h-6 bg-gray-800 rounded-md"></div>GlobalSoft</div>
                                <div className="text-xl font-bold font-serif flex items-center gap-1"><div className="w-6 h-6 bg-gray-800 rounded-sm"></div>Nexus</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="py-32 bg-white relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Everything you need to scale</h2>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">Powerful features built to help you capture, qualify, and convert more leads without lifting a finger.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                            {[
                                {
                                    icon: <MessageSquare className="w-7 h-7 text-white" />,
                                    title: "24/7 Engagement",
                                    desc: "Never miss a lead. Our AI responds instantly to every inquiry, day or night, ensuring 100% response rate.",
                                    color: "from-blue-500 to-cyan-500",
                                    delay: "0"
                                },
                                {
                                    icon: <Zap className="w-7 h-7 text-white" />,
                                    title: "Instant Qualification",
                                    desc: "Automatically filter leads based on budget, timeline, and needs. Only talk to prospects who are ready to buy.",
                                    color: "from-purple-500 to-pink-500",
                                    delay: "100"
                                },
                                {
                                    icon: <BarChart3 className="w-7 h-7 text-white" />,
                                    title: "Real-time Analytics",
                                    desc: "Track conversion rates, conversation quality, and pipeline growth with our beautiful, real-time dashboard.",
                                    color: "from-orange-500 to-red-500",
                                    delay: "200"
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="group p-10 rounded-3xl bg-gray-50 border border-gray-100/50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 transition-all duration-300">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-xl shadow-gray-200 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* CTA Section */}
            <div className="bg-gray-900 py-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl opacity-50"></div>

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to transform your sales?</h2>
                    <p className="text-xl text-gray-400 mb-12">Join hundreds of companies using QBOT to automate their lead generation and qualification.</p>
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="px-10 py-5 rounded-full bg-white text-gray-900 font-bold text-xl hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                    >
                        Get Started for Free
                    </button>
                    <p className="mt-6 text-sm text-gray-500">No credit card required • 14-day free trial</p>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-950 text-white py-16 border-t border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">QBOT</span>
                        </div>
                        <p className="text-gray-400 max-w-xs leading-relaxed">
                            Empowering businesses with intelligent conversational AI to capture, qualify, and convert more leads effectively.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6">Product</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Integration</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6">Company</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
                    <div>© {new Date().getFullYear()} QBOT AI. All rights reserved.</div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};
