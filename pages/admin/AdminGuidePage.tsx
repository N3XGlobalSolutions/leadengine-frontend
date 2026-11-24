import React from 'react';
import { BookOpen, Activity, Users, Settings, Shield, Zap, FileText, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export const AdminGuidePage = () => {
    const { isDark } = useAdminTheme();

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-3 mb-4 mt-8">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <Icon size={24} />
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
        </div>
    );

    const SubHeading = ({ title }: { title: string }) => (
        <h3 className={`text-xl font-semibold mb-3 mt-6 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{title}</h3>
    );

    const Paragraph = ({ children }: { children: React.ReactNode }) => (
        <p className={`mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{children}</p>
    );

    const ListItem = ({ children }: { children: React.ReactNode }) => (
        <li className={`flex items-start gap-2 mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            <ChevronRight size={16} className="mt-1 flex-shrink-0 text-indigo-500" />
            <span>{children}</span>
        </li>
    );

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto pb-8 sm:pb-12 px-3 sm:px-4">
                {/* Header */}
                <div className={`mb-6 sm:mb-10 text-center p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl ${isDark
                    ? 'bg-gradient-to-r from-indigo-900 to-purple-900'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-700'
                    } text-white shadow-xl`}>
                    <BookOpen size={36} className="mx-auto mb-3 sm:mb-4 opacity-80 sm:w-12 sm:h-12" />
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 tracking-tight">Platform Admin Documentation</h1>
                    <p className="text-base sm:text-lg lg:text-xl text-indigo-100 max-w-2xl mx-auto px-2">
                        Your comprehensive guide to mastering the LeadEngine Administration Platform.
                        Learn how to onboard clients, manage AI configurations, and drive platform growth.
                    </p>
                </div>

                <div className={`p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>

                    {/* Introduction */}
                    <SectionTitle icon={Zap} title="Getting Started" />
                    <Paragraph>
                        Welcome to the LeadEngine Admin Dashboard. This platform is designed to give you complete control over your AI chatbot fleet.
                        As an administrator, you act as the architect for all client interactions, managing everything from basic branding
                        to complex AI behavioral instructions.
                    </Paragraph>
                    <Paragraph>
                        This guide will walk you through the essential workflows required to maintain a healthy, growing SaaS platform.
                    </Paragraph>

                    <hr className={`my-8 ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />

                    {/* Dashboard & Analytics */}
                    <SectionTitle icon={Activity} title="Mastering the Dashboard" />
                    <Paragraph>
                        The Dashboard is your command center. It provides real-time visibility into the health of your entire platform.
                        Understanding these metrics is crucial for identifying trends and intervening when necessary.
                    </Paragraph>

                    <SubHeading title="Key Metrics Explained" />
                    <ul className="mb-6">
                        <ListItem><strong>Total Clients:</strong> The heartbeat of your business. Watch the "Growth Rate" indicator to track your monthly acquisition velocity.</ListItem>
                        <ListItem><strong>Total Revenue:</strong> Aggregate value of all active subscriptions (Starter, Pro, Enterprise).</ListItem>
                        <ListItem><strong>Active Users:</strong> Measures end-user engagement across all client chatbots. High activity usually correlates with high client retention.</ListItem>
                    </ul>

                    <SubHeading title="System Heath Monitoring" />
                    <Paragraph>
                        The "System Status" indicator on the dashboard monitors the backend API latency and database connectivity.
                        Green indicates optimal performance. If this turns yellow or red, check the "Settings" &gt; "Logs" (if enabled) or contact technical support immediately.
                    </Paragraph>

                    <hr className={`my-8 ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />

                    {/* Client Management */}
                    <SectionTitle icon={Users} title="Client Lifecycle Management" />

                    <SubHeading title="1. Onboarding a New Client" />
                    <Paragraph>
                        The "Add New Client" wizard is designed to streamline the provisioning process. When onboarding a new tenant:
                    </Paragraph>
                    <ul className="mb-6">
                        <ListItem><strong>Slug Generation:</strong> Ensure the URL slug is unique and brand-consistent (e.g., "tech-corp"). This becomes their public chat link.</ListItem>
                        <ListItem><strong>Plan Selection:</strong> Choose <em>Starter</em> for small businesses (basic bot), <em>Pro</em> for custom qualification logic, or <em>Enterprise</em> for dedicated support.</ListItem>
                        <ListItem><strong>Initial Config:</strong> Pre-fill the "Welcome Message" with a generic greeting that the client can later customize.</ListItem>
                    </ul>

                    <SubHeading title="2. Branding & Personalization" />
                    <Paragraph>
                        Clients pay for a solution that looks like <em>theirs</em>. Use the <strong>Branding Tab</strong> in the Client Detail view to:
                    </Paragraph>
                    <ul className="mb-6">
                        <ListItem>Upload high-res logos (Avatar URL) to build trust.</ListItem>
                        <ListItem>Set "Primary Colors" that match the client's website palette exactly.</ListItem>
                        <ListItem>Customize the "Tone of Voice" (Professional, Friendly, Urgent) to match their industry.</ListItem>
                    </ul>

                    <hr className={`my-8 ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />

                    {/* AI & RAG */}
                    <SectionTitle icon={FileText} title="AI Configuration & Knowledge Base" />
                    <Paragraph>
                        This is the core differentiator of LeadEngine. You are not just selling a chat widget; you are selling an intelligent agent.
                    </Paragraph>

                    <SubHeading title="Knowledge Base Setup (RAG)" />
                    <Paragraph>
                        Retrieval-Augmented Generation (RAG) allows the bot to answer questions based on specific documents rather than general training data.
                    </Paragraph>
                    <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-indigo-900/30 border border-indigo-800' : 'bg-indigo-50 border border-indigo-100'}`}>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>Pro Tip: Document Preparation</h4>
                        <p className={`text-sm ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>
                            Before uploading PDFs, ensure they are text-searchable (OCR) and structured with clear headings.
                            The AI performs significantly better when ingesting well-formatted FAQs or policy documents.
                        </p>
                    </div>

                    <SubHeading title="Lead Qualification Logic" />
                    <Paragraph>
                        In the <strong>Qualifications Tab</strong>, you can define the "Sales Funnel" for the bot.
                    </Paragraph>
                    <ul className="mb-6">
                        <ListItem><strong>Questions:</strong> Create up to 5 sequential questions. Keep them short and open-ended.</ListItem>
                        <ListItem><strong>Quick Replies:</strong> Provide buttons for common answers (e.g., "Budget: &lt;$5k", "$5k-$10k") to increase conversion rates.</ListItem>
                    </ul>

                    <hr className={`my-8 ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />

                    {/* Administration */}
                    <SectionTitle icon={Settings} title="Platform Administration" />
                    <Paragraph>
                        Maintain the security and usability of your own admin environment.
                    </Paragraph>
                    <ul className="mb-6">
                        <ListItem><strong>Themes:</strong> Use "Dark Mode" during low-light sessions to reduce eye strain. The setting is persisted across sessions.</ListItem>
                        <ListItem><strong>Notifications:</strong> Enable "Push Notifications" to receive instant alerts when a high-value Lead is captured by any client bot.</ListItem>
                    </ul>

                    <SectionTitle icon={Shield} title="Best Practices for Retention" />
                    <Paragraph>
                        Retaining clients is cheaper than acquiring new ones. Follow these principles:
                    </Paragraph>
                    <ol className={`list-decimal pl-5 space-y-2 mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        <li className="pl-2"><strong>Regular Reviews:</strong> Check client "Dashboard" analytics weekly. If "Conversations" drop, reach out with optimization tips.</li>
                        <li className="pl-2"><strong>Knowledge Updates:</strong> Periodically ask detailed clients for updated internal docs to refresh their bot's knowledge base.</li>
                        <li className="pl-2"><strong>Response Time:</strong> Monitor the "Recent Activity" feed. If bots are failing to answer, refine the system prompt immediately.</li>
                    </ol>

                </div>
            </div>
        </AdminLayout>
    );
};
