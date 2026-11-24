import { Client, DashboardStats, OnboardingData, CreateClientInput, TenantDocument, DashboardMetrics, DailyMetric, DashboardLead, SystemHealth, PlatformStats, AuditLog } from '@/types/admin';
import { api } from './api';
import { TenantConfig } from '@/types/config';
import { chatService } from './chatService';

// --- MOCK STATS (Backend doesn't have stats yet) ---
const MOCK_STATS: DashboardStats = {
    totalActiveClients: 124,
    totalRevenue: 45200,
    activeUsers: 3450,
    growthRate: 12.5
};

const MOCK_ONBOARDING_DATA_7_DAYS: OnboardingData[] = [
    { date: 'Mon', count: 2 },
    { date: 'Tue', count: 4 },
    { date: 'Wed', count: 1 },
    { date: 'Thu', count: 5 },
    { date: 'Fri', count: 3 },
    { date: 'Sat', count: 1 },
    { date: 'Sun', count: 0 },
];

const MOCK_ONBOARDING_DATA_30_DAYS: OnboardingData[] = [
    { date: 'Week 1', count: 12 },
    { date: 'Week 2', count: 15 },
    { date: 'Week 3', count: 8 },
    { date: 'Week 3', count: 8 },
    { date: 'Week 4', count: 20 },
];

const MOCK_LEADS: DashboardLead[] = [
    {
        id: 'mock-lead-1',
        name: 'Sarah Johnson',
        status: 'qualified',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        email: 'sarah.j@example.com',
        phone: '+1 (555) 123-4567',
        conversation_id: 'mock-conversation-1',
        metadata: {
            role: 'Marketing Manager',
            company_size: '50-200',
            budget: '$5k-10k'
        }
    },
    {
        id: 'mock-lead-2',
        name: 'Michael Chen',
        status: 'new',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        email: 'm.chen@techstart.io',
        phone: '+1 (555) 987-6543',
        conversation_id: 'mock-conversation-2',
        metadata: {
            interest: 'Enterprise Plan',
            timeline: 'Immediate'
        }
    },
    {
        id: 'mock-lead-3',
        name: 'Emma Davis',
        status: 'converted',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        email: 'emma.davis@designco.com',
        phone: '+1 (555) 456-7890',
        conversation_id: 'mock-conversation-3',
        metadata: {
            package: 'Pro',
            onboarding_scheduled: 'true'
        }
    },
    {
        id: 'mock-lead-4',
        name: 'James Wilson',
        status: 'lost',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
        email: 'j.wilson@nomad.com',
        conversation_id: 'mock-conversation-4',
        metadata: {
            reason: 'Budget constraints'
        }
    }
];

// Helper to map Backend Tenant -> Frontend Client 
const mapTenantToClient = (tenant: any): Client => {
    // Backend returns config with flat fields (snake_case) 
    const backendConfig = tenant.config || {};
    const planMap: Record<string, 'S1' | 'S2' | 'S3' | 'S3_INTERNATIONAL' | 'S3_MAX' | 'S3_MAPPING'> ={ 
            'S1': 'S1',
            'S2': 'S2', 
            'S3': 'S3', 
            'S3_INTERNATIONAL': 'S3_INTERNATIONAL', 
            'S3_MAX': 'S3_MAX', 
            'S3_MAPPING': 'S3_MAPPING' 
        };
    // Transform to Frontend TenantConfig (nested, camelCase)
    const frontendConfig: TenantConfig = {
        companyName: backendConfig.company_name || tenant.name,
        shortName: backendConfig.bot_name || tenant.name,
        botName: backendConfig.bot_name || 'LeadEngine',
        botDisplayName: backendConfig.bot_displayName || backendConfig.bot_name || 'Assistant',
        botAvatar: backendConfig.avatar_url || '',

        colors: {
            primary: backendConfig.primary_color || '#4F46E5',
            secondary: backendConfig.secondary_color || '#6366F1'
        },
        welcome: {
            headline: backendConfig.headline_prefix || 'Welcome to',
            highlightedHeadline: backendConfig.highlighted_headline || 'LeadEngine',
            subheadline: backendConfig.sub_headline || 'How can I help you today?',
            startBtnText: 'Start Conversation',
            features: backendConfig.key_features || []
        },
        leadQualification: {
            options: {},
            questions: backendConfig.qualification_questions?.map((q: any) => ({
                id: q.id, 
                label: q.label || q.question,
                instruction: q.instruction || q.question, 
                collects: q.collects || [],
                options: q.quick_replies?.map((qr: any) => qr.text) || []
            })) || []
        },
        messages: {
            scheduleSuccess: 'Thank you! Our team will be in touch shortly.',
            maybeLater: 'No problem! Feel free to reach out whenever you are ready.'
        },
        welcome_message: backendConfig.welcome_message || "Hello! How can I help you today?",
        language: backendConfig.language || "en", tone: backendConfig.tone || "professional",
        company_context: backendConfig.company_context || "",
        client_domain: backendConfig.client_domain || "",
        guardrails: backendConfig.guardrails || [], max_conversation_length: backendConfig.max_conversation_length || 50, lead_trigger_count: backendConfig.lead_trigger_count || 5, lead_form_enabled: backendConfig.lead_form_enabled ?? true,
        lead_form_fields: backendConfig.lead_form_fields || ["name", "phone"],
        lead_qualification_criteria: backendConfig.lead_qualification_criteria, question_map: backendConfig.question_map,
        whatsapp_enabled: backendConfig.whatsapp_enabled ?? false,
        whatsapp_access_token: backendConfig.whatsapp_access_token || '',
        whatsapp_phone_number_id: backendConfig.whatsapp_phone_number_id || '',
    };
    return {
        id: tenant.tenant_id, name: tenant.name, slug: backendConfig.url_slug || tenant.tenant_id, status: tenant.status || (tenant.is_active ? 'Active' : 'Inactive'), //Use backend status if available 
        onboardedDate: tenant.created_at ? new Date(tenant.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], totalUsers: 0, plan: (planMap[backendConfig.plan] || 'S1') as 'S1' | 'S2' | 'S3' | 'S3_MAX' | 'S3_MAPPING', config: frontendConfig, createdBy: tenant.created_by
    };
};

const mapTenantSummaryToClient = (tenant: any): Client => {

    const frontendConfig: TenantConfig = {
        companyName: tenant.name,
        shortName: tenant.name,
        botName: "LeadEngine",
        botDisplayName: "Assistant",
        botAvatar: "",

        colors: {
            primary: "#4F46E5",
            secondary: "#6366F1"
        },

        welcome: {
            headline: "Welcome to",
            highlightedHeadline: tenant.name,
            subheadline: "How can I help you today?",
            startBtnText: "Start Conversation",
            features: []
        },

        leadQualification: {
            options: {},
            questions: []
        },

        messages: {
            scheduleSuccess: "",
            maybeLater: ""
        },

        welcome_message: "",
        language: "en",
        tone: "professional",
        company_context: "",
        guardrails: [],
        max_conversation_length: 50,
        lead_trigger_count: 5,
        lead_form_enabled: true,
        lead_form_fields: [],
        lead_qualification_criteria: "",
        question_map: null,
    };

    return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,

        onboardedDate: tenant.onboardedDate
            ? new Date(tenant.onboardedDate)
                .toISOString()
                .split('T')[0]
            : new Date().toISOString().split('T')[0],

        totalUsers: tenant.totalUsers || 0,

        plan: (tenant.plan || 'S1') as
            | 'S1'
            | 'S2'
            | 'S3'
            | 'S3_MAX'
            | 'S3_MAPPING',

        config: frontendConfig,

        createdBy: tenant.createdBy
    };
};
// --- Platform Stats ---
export const getPlatformStats = async (): Promise<PlatformStats | null> => {
    try {
        const res = await api.get('/analytics/platform');
        return res.data.data;
    } catch (e) {
        console.error("Error fetching platform stats:", e);
        return null;
    }
};

export interface PlatformDailyPoint {
    date: string;
    display: string;
    conversations: number;
    leads: number;
    messages: number;
}

export interface PlatformDailySummary {
    today_conversations: number;
    today_leads: number;
    period_conversations: number;
    period_leads: number;
}

export const getPlatformDailyMetrics = async (days: number = 7): Promise<{
    data: PlatformDailyPoint[];
    summary: PlatformDailySummary;
} | null> => {
    try {
        const res = await api.get('/analytics/platform-daily', { params: { days } });
        return { data: res.data.data, summary: res.data.summary };
    } catch (e) {
        console.error("Error fetching platform daily metrics:", e);
        return null;
    }
};


export const getDashboardStats = async (): Promise<DashboardStats> => {
    const platformStats = await getPlatformStats();

    // Default fallback if API fails
    if (!platformStats) {
        return MOCK_STATS;
    }

    return {
        totalActiveClients: platformStats.total_tenants,
        totalRevenue: 45200, // Still mocked as requested
        activeUsers: platformStats.total_users,
        growthRate: platformStats.global_conversion_rate // Use conversion rate instead of growth
    };
};
//stop

export interface PaginatedClientsParams {
    limit?: number;
    cursor?: string | null;
    search?: string;
    status?: string;
    plan?: string;
    sort?: string;
}

export interface PaginatedClientsResponse {
    clients: Client[];
    nextCursor: string | null;
    total: number;
    planCounts?: Record<string, number>;
}

export const getClientsPaginated = async (params: PaginatedClientsParams = {}): Promise<PaginatedClientsResponse> => {
    try {
        const { limit = 24, cursor, search, status, plan, sort } = params;
        const queryParams: Record<string, any> = { limit };
        if (cursor) queryParams.cursor = cursor;
        if (search && search.trim()) queryParams.search = search.trim();
        if (status && status !== 'all') queryParams.status = status;
        if (plan && plan !== 'all') queryParams.plan = plan;
        if (sort) queryParams.sort = sort;

        const res = await api.get('/tenants/tenants/summary', { params: queryParams });
        const data = res.data;

        let rawItems: any[] = [];
        let nextCursor: string | null = null;
        let total = 0;
        let planCounts: Record<string, number> | undefined = undefined;

        if (Array.isArray(data)) {
            rawItems = data;
            total = data.length;
        } else if (data && typeof data === 'object') {
            rawItems = data.items || [];
            nextCursor = data.nextCursor || null;
            total = data.total ?? rawItems.length;
            planCounts = data.planCounts;
        }

        const clients = rawItems.map((t: any) => {
            try {
                return mapTenantSummaryToClient(t);
            } catch (err) {
                console.error('Failed to map tenant:', t, err);
                return null;
            }
        }).filter((c): c is Client => c !== null);

        return {
            clients,
            nextCursor,
            total,
            planCounts,
        };
    } catch (e) {
        console.error("Error fetching paginated clients:", e);
        return {
            clients: [],
            nextCursor: null,
            total: 0,
        };
    }
};

export const getClients = async (): Promise<Client[]> => {
    const response = await getClientsPaginated({ limit: 100 });
    return response.clients;
};

export const getClientById = async (id: string): Promise<Client | null> => {
    try {
        const res = await api.get(`/tenants/${id}`);
        return mapTenantToClient(res.data);
    } catch (e) {
        console.error(`Error fetching client ${id}:`, e);
        return null;
    }
};

// --- Conversation Count Functions ---
/**
 * Get the number of conversations (users) for a specific client.
 * Uses the native backend count endpoint for an exact count without pagination limits.
 */
export const getClientConversationCount = async (clientId: string): Promise<number> => {
    try {
        return await chatService.getTenantConversationCount(clientId);
    } catch (e) {
        console.error(`Error fetching conversation count for client ${clientId}:`, e);
        return 0;
    }
};

export const getAllClientConversationCounts = async (clientIds: string[]): Promise<Record<string, number>> => {
    if (!clientIds || clientIds.length === 0) return {};

    // 1. Try single bulk call first for maximum performance
    try {
        const bulkCounts = await chatService.getBulkTenantConversationCounts(clientIds);
        if (bulkCounts && Object.keys(bulkCounts).length > 0) {
            return bulkCounts;
        }
    } catch (e) {
        console.warn('Bulk conversation count fetch failed, falling back to parallel requests:', e);
    }

    // 2. Parallel fallback with 2-second timeout per item so UI never hangs
    const counts: Record<string, number> = {};
    const fetchWithTimeout = async (id: string) => {
        try {
            const countPromise = getClientConversationCount(id);
            const timeoutPromise = new Promise<number>((res) => setTimeout(() => res(0), 2000));
            return await Promise.race([countPromise, timeoutPromise]);
        } catch {
            return 0;
        }
    };

    const results = await Promise.all(clientIds.map(id => fetchWithTimeout(id)));
    clientIds.forEach((id, index) => {
        counts[id] = results[index] || 0;
    });

    return counts;
};

// ... (existing imports/code up to updateClient)

export const updateClient = async (client: Client): Promise<Client> => {
    // Map Frontend Client -> Backend TenantUpdate
    // Structure: { name, config: { ... } }

    // We reverse the mapping logic from mapTenantToClient
    const backendConfig = {
        plan: client.plan,
        url_slug: client.slug,

        // Bot Branding
        company_name: client.config?.companyName,
        bot_name: client.config?.botName,
        avatar_url: client.config?.botAvatar,
        primary_color: client.config?.colors?.primary,
        secondary_color: client.config?.colors?.secondary,

        // Welcome
        headline_prefix: client.config?.welcome?.headline,
        highlighted_headline: client.config?.welcome?.highlightedHeadline,
        sub_headline: client.config?.welcome?.subheadline,
        key_features: client.config?.welcome?.features,

        // Qualifications — S3_MAX and S3_MAPPING use different qualification mechanisms
        qualification_questions: (client.plan === 'S3_MAX' || client.plan === 'S3_MAPPING')
            ? []
            : client.config?.leadQualification?.questions?.map(q => ({
                id: q.id,
                label: q.label,
                instruction: q.instruction,
                collects: q.collects || [],
                quick_replies: q.options?.map((opt, idx) => ({
                    id: String(idx + 1),
                    text: opt,
                    value: opt
                })) || [],
                required: true
            })) || [],

        language: client.config?.language || "en",
        tone: client.config?.tone || "professional",
        welcome_message: client.config?.welcome_message,
        company_context: client.config?.company_context,
        client_domain: client.config?.client_domain,
        guardrails: client.config?.guardrails,
        max_conversation_length: client.config?.max_conversation_length,
        lead_trigger_count: client.config?.lead_trigger_count,
        lead_form_enabled: client.config?.lead_form_enabled,
        lead_form_fields: client.config?.lead_form_fields,
        lead_qualification_criteria: client.config?.lead_qualification_criteria,
        question_map: client.config?.question_map,
        whatsapp_enabled: client.config?.whatsapp_enabled,
        whatsapp_access_token: client.config?.whatsapp_access_token,
        whatsapp_phone_number_id: client.config?.whatsapp_phone_number_id,
    };

    const payload = {
        name: client.name,
        status: client.status, // Send strict status
        is_active: client.status !== 'Inactive', // Basic status mapping (legacy)
        config: backendConfig
    };

    const res = await api.put(`/tenants/${client.id}`, payload);
    return mapTenantToClient(res.data);
};

export const deleteClient = async (id: string): Promise<void> => {
    await api.delete(`/tenants/${id}`);
};

export const toggleClientPause = async (id: string): Promise<Client> => {
    const client = await getClientById(id);
    if (!client) throw new Error("Client not found");

    // Toggle between Active and Paused
    // If currently Active (or Onboarding), switch to Paused
    // If Paused, switch to Active
    const newStatus = client.status === 'Paused' ? 'Active' : 'Paused';

    const res = await api.put(`/tenants/${id}`, {
        status: newStatus
    });

    return mapTenantToClient(res.data);
};

export const createClient = async (clientData: CreateClientInput): Promise<Client> => {
    // Map Frontend Input -> Backend TenantCreate
    const backendPayload = {
        name: clientData.name,
        config: {
            plan: clientData.plan,
            url_slug: clientData.slug,
            company_name: clientData.config.companyName,
            bot_name: clientData.config.botName,
            avatar_url: clientData.config.botAvatar,
            primary_color: clientData.config.colors.primary,
            secondary_color: clientData.config.colors.secondary,

            headline_prefix: clientData.config.welcome.headline,
            highlighted_headline: clientData.config.welcome.highlightedHeadline,
            sub_headline: clientData.config.welcome.subheadline,
            key_features: clientData.config.welcome.features,

            // S3_MAX and S3_MAPPING use different qualification mechanisms
            qualification_questions: (clientData.plan === 'S3_MAX' || clientData.plan === 'S3_MAPPING')
                ? []
                : clientData.config.leadQualification.questions.map(q => ({
                    id: q.id,
                    label: q.label,
                    instruction: q.instruction,
                    collects: q.collects || [],
                    quick_replies: q.options?.map((opt, idx) => ({
                        id: String(idx + 1),
                        text: opt,
                        value: opt
                    })) || [],
                    required: true
                })),

            welcome_message: `${clientData.config.welcome.headline} ${clientData.config.welcome.highlightedHeadline}`,
            language: "en",
            tone: "professional",
            lead_qualification_criteria: clientData.config.lead_qualification_criteria,
            question_map: clientData.config.question_map,
            whatsapp_enabled: clientData.config.whatsapp_enabled,
            whatsapp_access_token: clientData.config.whatsapp_access_token,
            whatsapp_phone_number_id: clientData.config.whatsapp_phone_number_id,
        }
    };

    const res = await api.post('/tenants', backendPayload);
    const createdTenant = res.data;
    console.log('➕ Client created:', createdTenant.name);

    return mapTenantToClient(createdTenant);
};

export const ingestDocument = async (tenantId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    // Don't manually set Content-Type - let axios set it with the correct boundary
    await api.post('/documents/ingest', formData, {
        headers: {
            'X-Tenant-ID': tenantId
        }
    });
};

export const getTenantDocuments = async (tenantId: string): Promise<TenantDocument[]> => {
    try {
        console.log('📄 Fetching documents for tenant:', tenantId);
        const res = await api.get(`/documents/tenants/${tenantId}`);
        console.log('📄 Documents API response:', res.data);
        console.log('📄 Number of documents:', Array.isArray(res.data) ? res.data.length : 'Not an array');
        return res.data;
    } catch (e) {
        console.error("Error fetching documents:", e);
        return [];
    }
};

export const deleteDocument = async (documentId: string, tenantId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`, {
        headers: {
            'X-Tenant-ID': tenantId
        }
    });
};

export const getOnboardingData = async (range: '7d' | '30d' = '7d'): Promise<OnboardingData[]> => {
    return range === '7d' ? MOCK_ONBOARDING_DATA_7_DAYS : MOCK_ONBOARDING_DATA_30_DAYS;
};

export const getDashboardMetrics = async (tenantId: string): Promise<DashboardMetrics | null> => {
    try {
        const res = await api.get('/analytics/dashboard', {
            params: { tenant_id: tenantId }
        });
        return res.data.data;
    } catch (e) {
        console.error("Error fetching dashboard metrics:", e);
        return null;
    }
};

export const getDailyMetrics = async (tenantId: string, days: number = 7): Promise<DailyMetric[]> => {
    try {
        const res = await api.get('/analytics/daily', {
            params: { tenant_id: tenantId, days }
        });
        return res.data.data;
    } catch (e) {
        console.error("Error fetching daily metrics:", e);
        return [];
    }
};

export const getRecentLeads = async (tenantId: string): Promise<DashboardLead[]> => {
    try {
        const res = await api.get(`/leads/tenants/${tenantId}/all`, {
            params: { limit: 5 }
        });
        // Map backend Lead to DashboardLead
        return res.data.map((lead: any) => ({
            id: lead.lead_id,
            name: lead.name || 'Anonymous',
            status: lead.status, // e.g. 'new', 'qualified'
            created_at: lead.created_at
        }));
    } catch (e) {
        console.error("Error fetching recent leads:", e);
        return [];
    }
};

// --- API Key ---
export const generateApiKey = async (tenantId: string): Promise<string> => {
    try {
        const res = await api.post(`/tenants/${tenantId}/generate-api-key`);
        return res.data.api_key;
    } catch (e) {
        console.error("Error generating API key:", e);
        throw e;
    }
};

// --- System Health ---
export const getSystemHealth = async (): Promise<SystemHealth> => {
    try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const healthUrl = baseUrl.replace(/\/api$/, '') + '/health';
        const response = await fetch(healthUrl);
        if (!response.ok) throw new Error('Health check failed');
        return await response.json();
    } catch (error) {
        console.error("Health check error:", error);
        return {
            status: 'down',
            latency_ms: 0,
            details: { database: 'disconnected' },
            version: 'unknown'
        };
    }
};
// --- User Management ---
import { User, UserRole, UserRegister } from '@/types/auth';

export const getUsers = async (): Promise<User[]> => {
    try {
        const res = await api.get('/users');
        return res.data;
    } catch (e) {
        console.error("Error fetching users:", e);
        return [];
    }
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
    const res = await api.put(`/users/${userId}`, data);
    return res.data;
};

export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    await api.post(`/users/${userId}/reset-password`, newPassword, {
        headers: { 'Content-Type': 'text/plain' }
    });
};

export const deleteUser = async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
};

export const createUser = async (userData: UserRegister): Promise<User> => {
    const res = await api.post('/users', userData);
    return res.data;
};

// --- Lead Management ---
export const getTenantLeads = async (tenantId: string, status?: string): Promise<DashboardLead[]> => {
    try {
        const params: any = {};
        if (status && status !== 'all') params.status = status;

        const res = await api.get(`/leads/tenants/${tenantId}/all`, { params });

        return res.data.map((lead: any) => ({
            id: lead.lead_id,
            name: lead.name || 'Anonymous',
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
            created_at: lead.created_at,
            conversation_id: lead.conversation_id,
            metadata: lead.metadata
        }));
    } catch (e) {
        console.error("Error fetching tenant leads:", e);
        return [];
    }
};

export const getLeadById = async (leadId: string): Promise<any | null> => {
    try {
        const res = await api.get(`/leads/${leadId}`);
        return res.data;
    } catch (e) {
        console.error(`Error fetching lead ${leadId}:`, e);
        return null;
    }
};

export const exportLeads = async (
  tenantId: string
, clientName: string): Promise<void> => {

  try {

    const res = await api.get(
      `/leads/tenants/${tenantId}/export`,
      {
        responseType: "blob",
      }
    );

    const downloadUrl =
      window.URL.createObjectURL(
        new Blob([res.data])
      );

    const a =
      document.createElement("a");

    a.href = downloadUrl;

    a.download = `${clientName}leads.csv`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {

    console.error(
      "Export failed:",
      error
    );

    throw error;
  }
};

export const updateLeadStatus = async (leadId: string, status: string): Promise<any> => {
    const res = await api.patch(`/leads/${leadId}/status`, null, {
        params: { new_status: status }
    });
    return res.data;
};

// --- Audit Logs ---
export const getAuditLogs = async (skip: number = 0, limit: number = 100, startDate?: string, endDate?: string): Promise<AuditLog[]> => {
    try {
        const params: any = { skip, limit };
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const res = await api.get('/audit-logs', { params });
        return res.data;
    } catch (e) {
        console.error("Error fetching audit logs:", e);
        return [];
    }
};

// --- Draft Autosave ---
import { DraftResponse, DraftType } from '@/types/draft';

export const getLatestClientDraft = async (draftType: DraftType = 'client_creation'): Promise<DraftResponse | null> => {
    try {
        const res = await api.get('/admin/client-drafts/latest', {
            params: { draft_type: draftType }
        });
        return res.data;
    } catch (e: any) {
        if (e.response?.status === 404) return null;
        console.error("Error fetching draft:", e);
        return null;
    }
};

export const createClientDraft = async (draftData: Record<string, any>, draftType: DraftType = 'client_creation'): Promise<DraftResponse | null> => {
    try {
        const res = await api.post('/admin/client-drafts', {
            draft_type: draftType,
            draft_data: draftData,
        });
        return res.data;
    } catch (e) {
        console.error("Error creating draft:", e);
        return null;
    }
};

export const updateClientDraft = async (draftData: Record<string, any>, draftType: DraftType = 'client_creation'): Promise<DraftResponse | null> => {
    try {
        const res = await api.patch('/admin/client-drafts', {
            draft_data: draftData,
        }, {
            params: { draft_type: draftType }
        });
        return res.data;
    } catch (e) {
        console.error("Error updating draft:", e);
        return null;
    }
};

export const deleteClientDraft = async (draftType: DraftType = 'client_creation'): Promise<void> => {
    try {
        await api.delete('/admin/client-drafts', {
            params: { draft_type: draftType }
        });
    } catch (e) {
        console.error("Error deleting draft:", e);
    }
};

