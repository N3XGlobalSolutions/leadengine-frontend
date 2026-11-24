import React, { useState, useEffect } from 'react';
import { Bot, User, CheckCheck, Send, Zap, ShieldCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BorderBeam } from './BorderBeam';

interface Message {
    id: number;
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
}

const CONVERSATION_STEPS: Message[] = [
    {
        id: 1,
        sender: 'user',
        text: "Hi! I saw your WhatsApp automation software. We get around 150 leads/day and want to automate qualification.",
        timestamp: "10:14 AM"
    },
    {
        id: 2,
        sender: 'bot',
        text: "Hello! 👋 Great to hear. LeadEngine handles 150+ daily WhatsApp leads effortlessly with 24/7 AI response. What CRM do you use?",
        timestamp: "10:14 AM"
    },
    {
        id: 3,
        sender: 'user',
        text: "We currently use HubSpot and Salesforce.",
        timestamp: "10:15 AM"
    },
    {
        id: 4,
        sender: 'bot',
        text: "Perfect! We feature 1-click sync for HubSpot & Salesforce. 🚀 Based on your volume, LeadEngine can qualify leads instantly and auto-schedule sales calls. Would you like a 10-minute live demo?",
        timestamp: "10:15 AM"
    },
    {
        id: 5,
        sender: 'user',
        text: "Yes, tomorrow at 3 PM works!",
        timestamp: "10:16 AM"
    },
    {
        id: 6,
        sender: 'bot',
        text: "Awesome! Demo confirmed for tomorrow at 3:00 PM EST. Calendar invite sent! 📅 Lead status updated to 'High Intent Qualified (98%)'.",
        timestamp: "10:16 AM"
    }
];

export const HeroChatSimulator: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([CONVERSATION_STEPS[0], CONVERSATION_STEPS[1]]);
    const [currentIndex, setCurrentIndex] = useState(2);
    const [isTyping, setIsTyping] = useState(false);
    const [customInput, setCustomInput] = useState("");
    const [leadScore, setLeadScore] = useState(72);
    const [activeTab, setActiveTab] = useState<'chat' | 'pipeline'>('chat');

    useEffect(() => {
        if (currentIndex < CONVERSATION_STEPS.length) {
            const timer = setTimeout(() => {
                setIsTyping(true);
                setTimeout(() => {
                    setMessages((prev) => [...prev, CONVERSATION_STEPS[currentIndex]]);
                    setIsTyping(false);
                    setCurrentIndex((prev) => prev + 1);
                    setLeadScore((prev) => Math.min(98, prev + 13));
                }, 1200);
            }, 2200);
            return () => clearTimeout(timer);
        }
    }, [currentIndex]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customInput.trim()) return;

        const newMsg: Message = {
            id: Date.now(),
            sender: 'user',
            text: customInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, newMsg]);
        setCustomInput("");
        setIsTyping(true);

        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: `Thanks for testing LeadEngine! ⚡ AI Agent processed your message: "${customInput}" and logged high priority intent.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            setIsTyping(false);
            setLeadScore(99);
        }, 1000);
    };

    const resetSimulation = () => {
        setMessages([CONVERSATION_STEPS[0], CONVERSATION_STEPS[1]]);
        setCurrentIndex(2);
        setLeadScore(72);
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            {/* Live Floating Micro Widgets around the Simulator */}
            <div className="hidden lg:flex absolute -left-12 top-10 z-20 items-center gap-3 p-3.5 rounded-2xl bg-white/90 border border-zinc-200 shadow-xl shadow-zinc-900/5 backdrop-blur-xl animate-float-slow text-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-bold text-black flex items-center gap-1.5">
                        New WhatsApp Lead <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                    </div>
                    <div className="text-zinc-500 font-mono text-[11px]">Score: <span className="text-amber-600 font-bold">98% High Intent</span></div>
                </div>
            </div>

            <div className="hidden lg:flex absolute -right-12 bottom-12 z-20 items-center gap-3 p-3.5 rounded-2xl bg-black text-white border border-black shadow-xl backdrop-blur-xl animate-float-delayed text-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4 fill-black" />
                </div>
                <div>
                    <div className="font-bold text-white flex items-center gap-1">
                        Demo Auto-Scheduled <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-zinc-400 font-mono text-[11px]">Synced to HubSpot CRM</div>
                </div>
            </div>

            {/* Main Simulator Card */}
            <div className="relative w-full rounded-2xl bg-white border border-zinc-200/90 shadow-2xl shadow-zinc-400/20 backdrop-blur-2xl overflow-hidden group">
                <BorderBeam size={300} duration={12} delay={0} colorFrom="#f59e0b" colorTo="#000000" />
                
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-zinc-200/80 bg-zinc-50/90">
                    <div className="flex items-center gap-3">
                        <div className="flex space-x-1.5">
                            <span className="w-3 h-3 rounded-full bg-zinc-300 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-zinc-300 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-zinc-300 inline-block" />
                        </div>
                        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />
                        <div className="flex items-center gap-2 text-sm font-bold text-black">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            LeadEngine WhatsApp Engine Simulator
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="dot" className="hidden sm:inline-flex bg-white text-black border-zinc-300 shadow-xs">
                            Lead Intent: <span className="font-mono font-bold text-amber-600 ml-1">{leadScore}%</span>
                        </Badge>
                        <button
                            onClick={resetSimulation}
                            className="text-xs text-zinc-600 hover:text-black transition-colors bg-white hover:bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 font-medium"
                        >
                            Replay
                        </button>
                    </div>
                </div>

                {/* Sub-Header Toggle Tabs */}
                <div className="flex bg-zinc-100/80 border-b border-zinc-200/80 text-xs px-6 py-2">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-md transition-all font-semibold ${
                            activeTab === 'chat' ? 'bg-black text-white shadow-sm' : 'text-zinc-600 hover:text-black'
                        }`}
                    >
                        <Bot className="w-3.5 h-3.5 text-amber-400" />
                        Live WhatsApp AI Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('pipeline')}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-md transition-all font-semibold ${
                            activeTab === 'pipeline' ? 'bg-black text-white shadow-sm' : 'text-zinc-600 hover:text-black'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Auto CRM Pipeline
                    </button>
                </div>

                {/* Tab 1: Live Chat */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-[380px] bg-zinc-50/50">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-3 animate-fade-in-up ${
                                        msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                            msg.sender === 'user'
                                                ? 'bg-zinc-200 border-zinc-300 text-zinc-800'
                                                : 'bg-black text-white border-black'
                                        }`}
                                    >
                                        {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div
                                        className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                                            msg.sender === 'user'
                                                ? 'bg-white text-zinc-900 border border-zinc-200/90 rounded-tr-none shadow-xs'
                                                : 'bg-black text-white border border-black rounded-tl-none shadow-lg shadow-black/10'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                        <div className="flex items-center justify-end gap-1 mt-2 text-[10px] font-mono text-zinc-400">
                                            <span>{msg.timestamp}</span>
                                            {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-amber-400" />}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex items-center gap-3 animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-black text-white border border-black rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        <span className="ml-2 font-mono text-[11px] text-zinc-300">LeadEngine AI reasoning...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Input Form */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200/80 bg-white flex gap-2">
                            <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder="Type a sample prospect message to test AI..."
                                className="flex-1 bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                            <Button type="submit" variant="default" size="md" className="bg-black text-white hover:bg-zinc-800">
                                <Send className="w-4 h-4 mr-1" /> Send
                            </Button>
                        </form>
                    </div>
                )}

                {/* Tab 2: Auto CRM Pipeline View */}
                {activeTab === 'pipeline' && (
                    <div className="p-6 h-[380px] overflow-y-auto space-y-4 text-xs bg-zinc-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-2">
                                <div className="flex justify-between items-center text-zinc-500 font-medium">
                                    <span>Inbound Lead</span>
                                    <Badge variant="outline">New</Badge>
                                </div>
                                <div className="text-black font-bold text-sm">Enterprise Account</div>
                                <div className="text-zinc-500">Source: WhatsApp Direct</div>
                                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-zinc-500">
                                    <span>Intent Score</span>
                                    <span className="font-mono text-amber-600 font-bold">92%</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-2">
                                <div className="flex justify-between items-center text-zinc-500 font-medium">
                                    <span>AI Qualification</span>
                                    <Badge variant="subtle" className="text-emerald-700 bg-emerald-50 border-emerald-200">Passed</Badge>
                                </div>
                                <div className="text-black font-bold text-sm">B2B SaaS Lead</div>
                                <div className="text-zinc-500">Budget: $10,000+ / mo</div>
                                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-zinc-500">
                                    <span>CRM Sync</span>
                                    <span className="font-mono text-emerald-600 font-bold">HubSpot Active</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-2">
                                <div className="flex justify-between items-center text-zinc-500 font-medium">
                                    <span>Auto Scheduled</span>
                                    <Badge variant="default" className="bg-black text-white font-semibold">Booked</Badge>
                                </div>
                                <div className="text-black font-bold text-sm">Demo Confirmed</div>
                                <div className="text-zinc-500">Tomorrow at 3:00 PM</div>
                                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-zinc-500">
                                    <span>Sales Rep Assigned</span>
                                    <span className="font-mono text-black">Alex Rivera</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs flex items-center justify-between text-zinc-600">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-amber-600" />
                                <div>
                                    <div className="text-black font-bold text-sm">Full Audit Trail & Webhook Sync</div>
                                    <div className="text-zinc-500 text-xs">All conversations logged and synced instantly to DynamoDB & CRM.</div>
                                </div>
                            </div>
                            <Badge variant="outline">Live Webhook</Badge>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
