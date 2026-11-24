import React from 'react';
import { MessageSquare, Zap, BarChart3, ShieldCheck, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { BorderBeam } from './BorderBeam';

export const BentoGrid: React.FC = () => {
    return (
        <section id="features" className="py-24 bg-white relative scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <Badge variant="dot" className="bg-amber-50 text-amber-900 border-amber-200">ENGINEERED FOR SCALE</Badge>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black leading-tight">
                        Next-Gen WhatsApp Sales Automation
                    </h2>
                    <p className="text-zinc-600 text-lg">
                        Replace slow manual replies with instant, high-converting AI conversations that book meetings while you sleep.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Bento Tile 1: 24/7 AI Messaging (Large 2 Cols) */}
                    <Card className="md:col-span-2 relative overflow-hidden bg-gradient-to-b from-amber-50/40 via-white to-white border-zinc-200 shadow-sm hover:shadow-2xl hover:border-amber-300 transition-all duration-300 group">
                        <BorderBeam size={200} duration={10} delay={0} colorFrom="#f59e0b" colorTo="#000000" />
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-black group-hover:bg-amber-500 flex items-center justify-center mb-4 text-white shadow-md transition-colors duration-300">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <Badge variant="subtle" className="w-fit mb-2 text-amber-900 bg-amber-50 border-amber-200">Zero Latency</Badge>
                            <CardTitle className="text-2xl group-hover:text-amber-950 transition-colors">24/7 Instant AI Qualification</CardTitle>
                            <CardDescription>
                                Engages inbound leads within 3 seconds of sending a WhatsApp message. Qualifies interest, budget, timeline, and urgency automatically.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-4">
                            {/* Animated High-Contrast Response Speed Widget */}
                            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/90 text-zinc-900 font-mono text-xs space-y-2.5 shadow-xs">
                                <div className="flex justify-between items-center font-sans">
                                    <span className="font-bold text-zinc-800 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                        Average Response Speed
                                    </span>
                                    <span className="font-mono text-amber-600 font-extrabold text-sm">&lt; 1.8s</span>
                                </div>
                                <div className="w-full bg-zinc-200/80 h-2.5 rounded-full overflow-hidden relative">
                                    <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 h-full w-[96%] rounded-full animate-pulse-subtle relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer-text" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bento Tile 2: Instant CRM Sync */}
                    <Card className="md:col-span-1 border-zinc-200 bg-white shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 group">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 group-hover:bg-amber-500 group-hover:text-white border border-zinc-200 flex items-center justify-center mb-4 text-black transition-colors duration-300">
                                <Zap className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl group-hover:text-amber-950 transition-colors">Bi-Directional CRM Sync</CardTitle>
                            <CardDescription>
                                Automatically syncs conversations, contact details, and intent tags to HubSpot, Salesforce, and Zoho.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 pt-2 text-xs font-mono text-zinc-600">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Real-time Webhooks
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bento Tile 3: Real-Time Analytics */}
                    <Card className="md:col-span-1 border-zinc-200 bg-white shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 group-hover:bg-emerald-600 group-hover:text-white border border-zinc-200 flex items-center justify-center mb-4 text-black transition-colors duration-300">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl group-hover:text-emerald-950 transition-colors">Pipeline Intelligence</CardTitle>
                            <CardDescription>
                                Deep analytics on conversation flow, drop-off rates, sentiment analysis, and qualified revenue.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-emerald-600 font-mono">+340%</div>
                            <div className="text-xs text-zinc-500">Avg. Lead Conversion Boost</div>
                        </CardContent>
                    </Card>

                    {/* Bento Tile 4: Custom Knowledge Base */}
                    <Card className="md:col-span-2 border-zinc-200 bg-white shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 group">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 group-hover:bg-amber-500 group-hover:text-white border border-zinc-200 flex items-center justify-center mb-4 text-black transition-colors duration-300">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl group-hover:text-amber-950 transition-colors">Custom Knowledge Base & RAG</CardTitle>
                            <CardDescription>
                                Upload your FAQs, product catalogs, pricing guidelines, and PDFs. LeadEngine answers precise business questions without hallucinating.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2 pt-2">
                            {['PDF Catalog Sync', 'Custom Persona', 'Multi-Language Support', 'Strict Guardrails'].map((tag, i) => (
                                <Badge key={i} variant="outline" className="hover:border-amber-400 hover:bg-amber-50 transition-colors">{tag}</Badge>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Bento Tile 5: Enterprise Security */}
                    <Card className="md:col-span-2 border-zinc-200 bg-gradient-to-b from-white to-zinc-50 shadow-sm hover:shadow-xl transition-all duration-300 group">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-black group-hover:bg-zinc-800 flex items-center justify-center mb-4 text-white shadow-md transition-colors duration-300">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl">Enterprise-Grade Security & Reliability</CardTitle>
                            <CardDescription>
                                Official WhatsApp Business API integrations with end-to-end encryption, SOC-2 readiness, and 99.99% uptime guarantee.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> E2E Encrypted</span>
                                <span>⚡ Official Meta API</span>
                                <span>🛡️ GDPR Compliant</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
};
