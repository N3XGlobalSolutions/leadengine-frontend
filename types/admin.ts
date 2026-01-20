import { TenantConfig } from './config';

export interface Client {
    id: string;
    name: string;
    slug: string;
    status: 'Active' | 'Inactive' | 'Onboarding' | 'Paused';
    onboardedDate: string;
    totalUsers: number;
    plan: 'Starter' | 'Pro' | 'Enterprise';
    config?: TenantConfig;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateClientInput {
    name: string;
    slug: string;
    plan: 'Starter' | 'Pro' | 'Enterprise';
    config: TenantConfig;
}

export interface PlatformStats {
    total_tenants: number;
    total_users: number;
    total_conversations: number;
    total_leads: number;
    global_conversion_rate: number;
    generated_at: string;
}

export interface DashboardStats {
    totalActiveClients: number;
    totalRevenue: number;
    activeUsers: number;
    growthRate: number;
}

export interface OnboardingData {
    date: string;
    count: number;
}

export interface TenantDocument {
    document_id: string;
    filename: string;
    tenant_id: string;
    status: string;
    uploaded_at?: string;
    document_type?: string;
}

export interface DashboardMetrics {
    conversations: number;
    leads: number;
    documents: number;
    leads_by_status: {
        new: number;
        qualified: number;
        disqualified: number;
    };
    conversion_rate: number;
}

export interface DailyMetric {
    date: string;
    conversations: number;
    leads: number;
    messages: number;
}

export interface DashboardLead {
    id: string;
    name: string;
    status: string;
    created_at: string;
    email?: string;
    phone?: string;
    conversation_id?: string;
    metadata?: Record<string, any>;
}

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down';
    latency_ms: number;
    details: {
        database: string;
        [key: string]: string;
    };
    version: string;
}
