import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Check, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { SpotlightBackground } from '../components/landing/SpotlightBackground';
import { HeroChatSimulator } from '../components/landing/HeroChatSimulator';
import { BentoGrid } from '../components/landing/BentoGrid';
import { RoiCalculator } from '../components/landing/RoiCalculator';
import { LogoMarquee } from '../components/landing/LogoMarquee';
import { FaqSection } from '../components/landing/FaqSection';
import { PricingSection } from '../components/landing/PricingSection';
import { BorderBeam } from '../components/landing/BorderBeam';

const HERO_PHRASES = [
    "Automating WhatsApp Sales",
    "Qualifying Prospects 24/7",
    "Auto-Booking Sales Demos",
    "Syncing HubSpot CRM Data"
];

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

    // Cycling Hero Phrases for Live Animation
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
        }, 3200);
        return () => clearInterval(interval);
    }, []);

    const handleGetStarted = () => {
        navigate('/admin/login');
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const currentPhrase = HERO_PHRASES[currentPhraseIndex];

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
            {/* Ambient Background Spotlight & Grid */}
            <SpotlightBackground />

            {/* Ultra-Elegant Floating Glassmorphic Navbar */}
            <div className="sticky top-5 z-50 px-4 max-w-5xl mx-auto">
                <header className="bg-white/80 backdrop-blur-2xl border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-6 py-3 transition-all duration-300">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="bg-black text-white p-2 rounded-xl shadow-md shadow-black/10 transition-transform hover:scale-105">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black tracking-wider text-black">LeadEngine</span>
                                <span className="text-[9px] font-mono text-amber-600 font-bold tracking-widest uppercase">AI AGENT</span>
                            </div>
                        </div>

                        {/* Center Navigation Links */}
                        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-600">
                            <button
                                onClick={() => scrollToSection('features')}
                                className="relative py-1 hover:text-black transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-amber-500 after:transition-all"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection('simulator')}
                                className="relative py-1 hover:text-black transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-amber-500 after:transition-all"
                            >
                                Live Simulator
                            </button>
                            <button
                                onClick={() => scrollToSection('calculator')}
                                className="relative py-1 hover:text-black transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-amber-500 after:transition-all"
                            >
                                ROI Calculator
                            </button>
                            <button
                                onClick={() => scrollToSection('pricing')}
                                className="relative py-1 hover:text-black transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-amber-500 after:transition-all"
                            >
                                Pricing
                            </button>
                            <button
                                onClick={() => scrollToSection('faq')}
                                className="relative py-1 hover:text-black transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-amber-500 after:transition-all"
                            >
                                FAQ
                            </button>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleGetStarted}
                                size="sm"
                                className="hidden sm:inline-flex text-xs text-zinc-700 hover:text-black"
                            >
                                Sign In
                            </Button>
                            <Button
                                variant="glow"
                                onClick={handleGetStarted}
                                size="sm"
                                className="text-xs bg-black text-white hover:bg-zinc-900 border-black"
                            >
                                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </header>
            </div>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">

                    {/* Tight & Cohesive 3-Line Dynamic Hero Title */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-zinc-950 mb-6 leading-[1.08] max-w-5xl mx-auto">
                        <div>Welcome to LeadEngine AI</div>
                        <div className="h-[1.18em] flex items-center justify-center">
                            <span className="shimmer-ray-box rounded-lg">
                                <span key={currentPhraseIndex} className="text-gold-gradient font-extrabold animate-fade-in inline-block pb-1.5">
                                    {HERO_PHRASES[currentPhraseIndex]}
                                </span>
                            </span>
                        </div>
                        <div>
                            With <span className="shimmer-ray-box rounded-lg"><span className="text-gold-gradient font-extrabold pb-1 inline-block">Intelligent AI</span></span>
                        </div>
                    </h1>

                    {/* Hero Subtitle */}
                    <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-zinc-600 mb-10 leading-relaxed font-normal">
                        Engage 100% of WhatsApp inquiries in under 3 seconds. Qualify prospects, answer questions with custom RAG, and auto-book sales calls.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Button
                            variant="glow"
                            size="lg"
                            onClick={handleGetStarted}
                            className="w-full sm:w-auto font-bold text-base bg-black text-white hover:bg-zinc-900 shadow-xl shadow-amber-500/10"
                        >
                            Start 14-Day Free Trial <ArrowRight className="w-5 h-5 ml-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => scrollToSection('simulator')}
                            className="w-full sm:w-auto font-semibold hover:border-amber-400"
                        >
                            Test Live Simulator <ChevronRight className="w-4 h-4 ml-1 text-amber-500" />
                        </Button>
                    </div>

                    {/* Key Value Checklist */}
                    <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-600 font-mono mb-16">
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> 5-Min Meta API Setup</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-amber-500" /> HubSpot & Salesforce Sync</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-orange-500" /> No Credit Card Required</span>
                    </div>

                    {/* Animated Hero Component: Live Chat Simulator Container */}
                    <div id="simulator" className="mt-8 animate-fade-in-up scroll-mt-28">
                        <HeroChatSimulator />
                    </div>
                </section>

                {/* Logo Marquee */}
                <LogoMarquee />

                {/* Bento Grid Feature Showcase */}
                <BentoGrid />

                {/* Interactive ROI Calculator */}
                <RoiCalculator onCtaClick={handleGetStarted} />

                {/* FAQ Section */}
                <FaqSection />

                {/* Pricing Cards Section */}
                <PricingSection onSelectPlan={handleGetStarted} />

                {/* Final Call To Action */}
                <section className="py-24 bg-white relative border-t border-zinc-200">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <Card className="bg-gradient-to-b from-amber-50/40 via-white to-white border-zinc-200 p-12 relative overflow-hidden shadow-xl">
                            <BorderBeam size={250} duration={8} delay={0} colorFrom="#f59e0b" colorTo="#000000" />
                            <div className="relative z-10 space-y-6">
                                <Badge variant="dot" className="bg-amber-100 text-amber-900 border-amber-200">READY TO SCALE?</Badge>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">
                                    Transform Your WhatsApp Pipeline Today
                                </h2>
                                <p className="text-zinc-600 text-lg max-w-xl mx-auto">
                                    Join forward-thinking companies using LeadEngine to capture, qualify, and convert more leads effectively.
                                </p>
                                <div className="pt-4">
                                    <Button
                                        variant="glow"
                                        size="lg"
                                        onClick={handleGetStarted}
                                        className="font-bold text-lg px-9 py-4 bg-black text-white hover:bg-zinc-900"
                                    >
                                        Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500 font-mono">14-day free trial • Cancel anytime • Zero credit card required</p>
                            </div>
                        </Card>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-50 text-zinc-600 py-16 border-t border-zinc-200 text-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-black text-white p-2 rounded-lg">
                                <Bot className="w-4 h-4" />
                            </div>
                            <span className="text-lg font-bold text-black tracking-wider">LeadEngine AI</span>
                        </div>
                        <p className="text-zinc-500 max-w-xs leading-relaxed text-xs">
                            Empowering enterprise sales teams with intelligent conversational WhatsApp AI automation.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-black mb-4 text-xs font-mono uppercase tracking-wider">Platform</h4>
                        <ul className="space-y-2.5 text-xs text-zinc-600">
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-amber-600 transition-colors">WhatsApp Automation</button></li>
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-amber-600 transition-colors">CRM Integrations</button></li>
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-amber-600 transition-colors">Knowledge Base (RAG)</button></li>
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-amber-600 transition-colors">Enterprise Security</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-black mb-4 text-xs font-mono uppercase tracking-wider">Company</h4>
                        <ul className="space-y-2.5 text-xs text-zinc-600">
                            <li><button onClick={() => scrollToSection('faq')} className="hover:text-amber-600 transition-colors">About Us</button></li>
                            <li><button onClick={() => scrollToSection('faq')} className="hover:text-amber-600 transition-colors">Documentation</button></li>
                            <li><button onClick={() => scrollToSection('faq')} className="hover:text-amber-600 transition-colors">Privacy Policy</button></li>
                            <li><button onClick={() => scrollToSection('faq')} className="hover:text-amber-600 transition-colors">Terms of Service</button></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500 font-mono">
                    <div>© {new Date().getFullYear()} LeadEngine AI. All rights reserved.</div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-amber-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-amber-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-amber-600 transition-colors">Security</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
