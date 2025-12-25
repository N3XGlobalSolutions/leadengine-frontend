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
