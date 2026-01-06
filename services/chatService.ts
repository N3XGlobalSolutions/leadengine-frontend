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

    getConversation: async (conversationId: string): Promise<Conversation> => {
        const res = await api.get<Conversation>(`/chat/conversations/${conversationId}`);
        return res.data;
    },

    getMessages: async (conversationId: string): Promise<Message[]> => {
        // Backend Message model might differ slightly from frontend Message interface.
        // We'll map if necessary.
        // Backend Message: { message_id, conversation_id, role, content, sources, created_at, ... }
        // Frontend Message: { id, role, text, timestamp, ... }

        // Check for mock conversation IDs
        if (conversationId.startsWith('mock-conversation-')) {
            await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay

            const now = new Date();
            const mockMsgs: Message[] = [];

            if (conversationId === 'mock-conversation-1') {
                mockMsgs.push(
                    { id: 'm1', role: MessageRole.User, text: 'Hi, I saw your ad about the enterprise plan.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), isSummary: false },
                    { id: 'm2', role: MessageRole.Bot, text: 'Hello! I\'d be happy to help you with our enterprise plan. What specific features are you interested in?', timestamp: new Date(now.getTime() - 1000 * 60 * 59), isSummary: false },
                    { id: 'm3', role: MessageRole.User, text: 'We need SSO and advanced analytics.', timestamp: new Date(now.getTime() - 1000 * 60 * 58), isSummary: false },
                    { id: 'm4', role: MessageRole.Bot, text: 'Great! Our Enterprise plan includes both SSO (Okta, Google, Azure AD) and our full Analytics Suite. How many users would you be onboarding?', timestamp: new Date(now.getTime() - 1000 * 60 * 57), isSummary: false },
                    { id: 'm5', role: MessageRole.User, text: 'About 150 users.', timestamp: new Date(now.getTime() - 1000 * 60 * 56), isSummary: false }
                );
            } else if (conversationId === 'mock-conversation-2') {
                mockMsgs.push(
                    { id: 'm2-1', role: MessageRole.User, text: 'Do you offer a free trial?', timestamp: new Date(now.getTime() - 1000 * 60 * 30), isSummary: false },
                    { id: 'm2-2', role: MessageRole.Bot, text: 'Yes, we offer a 14-day free trial on all plans, no credit card required. would you like to sign up?', timestamp: new Date(now.getTime() - 1000 * 60 * 29), isSummary: false },
                    { id: 'm2-3', role: MessageRole.User, text: 'Yes, please.', timestamp: new Date(now.getTime() - 1000 * 60 * 28), isSummary: false }
                );
            } else {
                mockMsgs.push(
                    { id: 'm3-1', role: MessageRole.User, text: 'I have a question about billing.', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), isSummary: false },
                    { id: 'm3-2', role: MessageRole.Bot, text: 'I can help with that. What is your question?', timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), isSummary: false }
                );
            }
            return mockMsgs;
        }

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
