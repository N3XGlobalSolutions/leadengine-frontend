import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { HelpCircle, AlertTriangle, MessageCircle, ChevronDown, ChevronUp, Mail, Phone, FileText } from 'lucide-react';

export const AdminSupportPage = () => {
    const { isDark } = useAdminTheme();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I add a new client?",
            answer: "Navigate to the Clients page via the sidebar and click on 'Add New Client'. Follow the onboarding wizard to set up the client's profile and initial configuration."
        },
        {
            question: "How can I update the chatbot's knowledge base?",
            answer: "Go to the Client Detail page for the specific client. Under the 'Knowledge Base' tab, you can upload documents or add text snippets for the bot to learn from."
        },
        {
            question: "What happens if the system status is 'Degraded'?",
            answer: "A degraded status usually means higher latency or minor errors. Our team is automatically notified, but you can check the specific error message on the Dashboard for more details."
        },
        {
            question: "Where can I view billing information?",
            answer: "Billing details are available in the Settings page under the 'Billing & Subscription' section."
        }
    ];

    const troubleshootItems = [
        {
            problem: "Chatbot is not responding",
            solution: "1. Check if the client's API key is active.\n2. Verify the system status on the dashboard.\n3. Ensure the client has sufficient credits."
        },
        {
            problem: "Client onboarding failed",
            solution: "1. Check internet connectivity.\n2. Verify all required fields were filled correctly.\n3. Retry the operation after a few minutes."
        },
        {
            problem: "Login issues",
            solution: "ensure you are using the correct credentials. If the problem persists, contact support to reset your password."
        }
    ];

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Support Center</h1>
                    <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Find answers, troubleshoot issues, or get in touch with our team.</p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* FAQ Section */}
                    <section className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex items-center mb-6">
                            <div className={`p-2 rounded-lg mr-4 ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <HelpCircle size={24} />
                            </div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h2>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className={`border rounded-xl overflow-hidden ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{faq.question}</span>
                                        {openFaq === index ?
                                            <ChevronUp size={20} className={isDark ? 'text-slate-400' : 'text-gray-500'} /> :
                                            <ChevronDown size={20} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                                        }
                                    </button>

                                    {openFaq === index && (
                                        <div className={`p-4 pt-0 border-t ${isDark ? 'border-slate-700 text-slate-400' : 'border-gray-100 text-gray-600'}`}>
                                            <p className="mt-4 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Troubleshooting Section */}
                    <section className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex items-center mb-6">
                            <div className={`p-2 rounded-lg mr-4 ${isDark ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Troubleshooting Guide</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {troubleshootItems.map((item, index) => (
                                <div key={index} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>{item.problem}</h3>
                                    <div className={`text-sm whitespace-pre-line ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                        {item.solution}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Contact Support Section */}
                    <section className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex items-center mb-6">
                            <div className={`p-2 rounded-lg mr-4 ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                <MessageCircle size={24} />
                            </div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Contact Support</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className={`flex flex-col items-center p-6 rounded-xl border text-center transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 hover:border-green-500/50' : 'bg-gray-50 border-gray-100 hover:border-green-200'
                                }`}>
                                <Mail size={32} className={`mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
                                <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Us</h3>
                                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Get a response within 24 hours</p>
                                <a href="mailto:admin@n3xglobalsolutions.com" className="text-green-500 hover:text-green-600 font-medium">admin@n3xglobalsolutions.com</a>
                            </div>

                            <div className={`flex flex-col items-center p-6 rounded-xl border text-center transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 hover:border-green-500/50' : 'bg-gray-50 border-gray-100 hover:border-green-200'
                                }`}>
                                <Phone size={32} className={`mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
                                <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Call Us</h3>
                                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Mon-Fri 9am-6pm IST</p>
                                <a href="tel:+919876543210" className="text-green-500 hover:text-green-600 font-medium">+91 9876543210</a>
                            </div>

                            <div className={`flex flex-col items-center p-6 rounded-xl border text-center transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 hover:border-green-500/50' : 'bg-gray-50 border-gray-100 hover:border-green-200'
                                }`}>
                                <FileText size={32} className={`mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
                                <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Documentation</h3>
                                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Browse our detailed guides</p>
                                <a href="/admin/guide" className="text-green-500 hover:text-green-600 font-medium">View Guide</a>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
};
