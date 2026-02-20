import { api } from './api';
import { Conversation, ChatResponse, Message, MessageRole } from '../types';

export const chatService = {
    // Public/Widget Chat Interaction
    sendMessage: async (payload: {
        query: string;
        tenant_id: string;
        conversation_id?: string | null;
        user_identifier?: string;
    }, apiKey?: string): Promise<ChatResponse> => {
        const headers: any = {};
        if (apiKey) {
            headers['X-API-Key'] = apiKey;
        }

        const res = await api.post<ChatResponse>('/chat', payload, { headers });
        return res.data;
    },

    // Admin / Authorized Methods
    getTenantConversations: async (tenantId: string): Promise<Conversation[]> => {
        const res = await api.get<Conversation[]>(`/chat/tenants/${tenantId}/conversations`);
        return res.data;
    },

    getTenantConversationCount: async (tenantId: string): Promise<number> => {
        const res = await api.get<{ count: number }>(`/chat/tenants/${tenantId}/conversations/count`);
        return res.data.count;
    },

    getConversation: async (conversationId: string): Promise<Conversation> => {
        const res = await api.get<Conversation>(`/chat/conversations/${conversationId}`);
        return res.data;
    },

    getMessages: async (conversationId: string): Promise<Message[]> => {
        // Backend Message model might differ slightly from frontend Message interface.
        // We'll map if necessary.
        // Backend Message: { message_id, conversation_id, role, content, sources, created_at, ... }
        // Frontend Message: { id, role, text, timestamp, ... }

        // Backend Message model might differ slightly from frontend Message interface.
        // We'll map if necessary.
        // Backend Message: { message_id, conversation_id, role, content, sources, created_at, ... }
        // Frontend Message: { id, role, text, timestamp, ... }

        const res = await api.get<any[]>(`/chat/conversations/${conversationId}/messages`);

        return res.data.map(msg => ({
            id: msg.message_id,
            role: msg.role === 'assistant' ? MessageRole.Bot : msg.role, // Map 'assistant' -> 'model'
            text: msg.content,
            timestamp: new Date(msg.created_at),
            isSummary: false, // Backend doesn't persist summary flag explicitly usually
            // sources: msg.sources 
            // We might want to extend frontend Message to support sources?
        }));
    }
};
