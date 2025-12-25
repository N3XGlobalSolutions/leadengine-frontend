import { useState, useEffect } from 'react';
import { TenantConfig } from '../types/config';

export const useTenantConfig = (slug?: string) => {
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:3001/api/clients/${slug}`);
                if (!response.ok) {
                    throw new Error('Failed to load client configuration');
                }
                const data = await response.json();
                setConfig(data);
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
    }, [slug]);

    return { config, loading, error };
};
