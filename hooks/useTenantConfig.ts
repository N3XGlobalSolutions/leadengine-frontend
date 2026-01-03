import { useState, useEffect } from 'react';
import { TenantConfig } from '../types/config';

export const useTenantConfig = (tenantId?: string) => {
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const fetchConfig = async () => {
            try {
                setLoading(true);
                // Fetch public welcome config from backend
                const response = await fetch(`http://localhost:8000/api/tenants/${tenantId}/welcome`);

                if (!response.ok) {
                    throw new Error('Failed to load client configuration');
                }

                const data = await response.json();

                // Transform backend response to frontend TenantConfig format
                // Backend returns: { welcome_message, branding: { ... } }
                const branding = data.branding || {};

                const transformedConfig: TenantConfig = {
                    companyName: branding.bot_name || 'QBot Client',
                    shortName: branding.bot_name || 'QBot',
                    botName: branding.bot_name || 'AI Assistant',
                    botDisplayName: branding.bot_name || 'AI Assistant',
                    botAvatar: branding.avatar_url,

                    colors: {
                        primary: branding.primary_color?.replace('text-', '').replace('bg-', '') || 'indigo',
                        secondary: branding.secondary_color || 'purple'
                    },

                    welcome: {
                        headline: branding.headline_prefix || 'Welcome to',
                        highlightedHeadline: branding.highlighted_headline || 'QBot',
                        subheadline: branding.sub_headline || 'How can I help you today?',
                        startBtnText: 'Start Conversation',
                        features: branding.key_features || []
                    },

                    leadQualification: {
                        options: {}, // Backend doesn't store global options map yet, individual q's have options
                        questions: branding.qualification_questions?.map((q: any) => ({
                            id: q.id,
                            label: q.question,
                            instruction: q.question,
                            collects: [], // Backend doesn't explicitly send extraction fields yet
                            options: q.quick_replies?.map((qr: any) => qr.text) || []
                        })) || []
                    },

                    messages: {
                        scheduleSuccess: 'Thank you! Our team will be in touch shortly.',
                        maybeLater: 'No problem! Feel free to reach out whenever you are ready.'
                    }
                };

                // Add the actual UUID to the config logic for access
                (transformedConfig as any).id = data.tenant_id;

                setConfig(transformedConfig);
                setError(null);
            } catch (err) {
                console.error('Error fetching tenant config:', err);
                setError('Failed to load configuration');
                setConfig(null);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [tenantId]);

    return { config, id: (config as any)?.id, loading, error };
};
