import { Client, DashboardStats, OnboardingData, CreateClientInput } from '@/types/admin';

const API_BASE = 'http://localhost:3001/api';

// --- MOCK STATS (Still Mocked) ---
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
    { date: 'Week 4', count: 20 },
];

// --- API Service Functions ---

export const getDashboardStats = async (): Promise<DashboardStats> => {
    // Keeping this mocked for now as we don't have a real DB trace yet
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_STATS;
};

export const getClients = async (): Promise<Client[]> => {
    try {
        const res = await fetch(`${API_BASE}/admin/clients`);
        if (!res.ok) throw new Error('Failed to fetch clients');
        return await res.json();
    } catch (e) {
        console.error("Error fetching clients:", e);
        return [];
    }
};

export const getClientById = async (id: string): Promise<Client | null> => {
    // This is less efficient (fetch all), but fine for MVP
    const clients = await getClients();
    return clients.find(c => c.id === id) || null;
};

export const updateClient = async (client: Client): Promise<Client> => {
    // Note: Backend 'POST' currently handles create-or-update mostly for the list logic?
    // Actually the backend POST is primarily for Create. We didn't impl separate Update or PUT.
    // For now, let's keep this as a "Soft" Mock until we enhance backend PUT.
    // Ideally we should implement PUT /api/admin/clients/:id
    console.warn("Update Client not fully implemented on backend yet");
    return client;
};

export const deleteClient = async (id: string): Promise<void> => {
    console.warn("Delete Client not fully implemented on backend yet");
    // TODO: Implement DELETE /api/admin/clients/:id
};

export const toggleClientPause = async (id: string): Promise<Client> => {
    // TODO: Implement Status Toggle API
    throw new Error('Toggle Pause not implemented yet');
};

export const createClient = async (clientData: CreateClientInput): Promise<Client> => {
    const newClientPayload = {
        ...clientData,
        id: crypto.randomUUID(), // Valid ID generation
        status: 'Active', // Default to Active for now so it works immediately
        onboardedDate: new Date().toISOString().split('T')[0],
        totalUsers: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };

    const res = await fetch(`${API_BASE}/admin/clients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClientPayload)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create client');
    }

    const createdClient = await res.json();
    console.log('➕ Client created:', createdClient.name);
    return createdClient;
};

export const getOnboardingData = async (range: '7d' | '30d' = '7d'): Promise<OnboardingData[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return range === '7d' ? MOCK_ONBOARDING_DATA_7_DAYS : MOCK_ONBOARDING_DATA_30_DAYS;
};
