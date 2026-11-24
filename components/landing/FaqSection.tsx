import React from 'react';
import { Accordion } from '../ui/accordion';
import { Badge } from '../ui/badge';

const FAQ_ITEMS = [
    {
        id: 'faq-1',
        title: "How does LeadEngine connect to our WhatsApp Business account?",
        content: "LeadEngine integrates directly via official WhatsApp Business APIs (Cloud API). Setup takes under 5 minutes without needing code, and supports phone number migration seamlessly."
    },
    {
        id: 'faq-2',
        title: "Can LeadEngine integrate with our CRM like HubSpot or Salesforce?",
        content: "Yes! LeadEngine supports bi-directional sync with HubSpot, Salesforce, Zoho, and custom webhooks. All lead details, scores, and chat logs are auto-synced instantaneously."
    },
    {
        id: 'faq-3',
        title: "Does LeadEngine support custom business knowledge bases?",
        content: "Absolutely. You can upload custom PDFs, website links, or pricing documents. LeadEngine uses Retrieval-Augmented Generation (RAG) to provide exact, context-aware answers to prospect questions."
    },
    {
        id: 'faq-4',
        title: "What happens when a lead requests a human sales agent?",
        content: "LeadEngine instantly detects human escalation intent, alerts your sales reps via instant notification/Slack/WhatsApp, and smoothly hands off the active live chat."
    },
    {
        id: 'faq-5',
        title: "Is there a free trial available?",
        content: "Yes, we offer a 14-day full feature free trial so you can test LeadEngine with your WhatsApp lead workflows with zero risk and no credit card required."
    }
];

export const FaqSection: React.FC = () => {
    return (
        <section id="faq" className="py-24 bg-white relative scroll-mt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                    <Badge variant="dot">GOT QUESTIONS?</Badge>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-black">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-zinc-600 text-sm">
                        Everything you need to know about setting up LeadEngine for your business.
                    </p>
                </div>

                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                    <Accordion items={FAQ_ITEMS} />
                </div>
            </div>
        </section>
    );
};
