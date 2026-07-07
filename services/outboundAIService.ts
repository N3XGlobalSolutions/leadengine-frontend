/**
 * Outbound AI Sales Agent API service.
 * Connects to the backend /api/outbound/ai endpoints.
 */

import { api } from './api';

export interface OutboundAISettings {
  tenant_id: string;
  ai_name: string;
  business_summary: string;
  sales_tone: string;
  conversation_style: string;
  target_audience: string;
  primary_language: string;
  max_response_length: number;
  enable_scheduling: boolean;
  enable_product_search: boolean;
  enable_knowledge_search: boolean;
}

export interface OutboundCalendarSettings {
  tenant_id: string;
  google_client_id: string | null;
  google_client_secret: string | null;
  google_refresh_token: string | null;
  calendar_id: string;
  timezone: string;
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  meeting_duration: number;
  buffer: number;
}

export interface OutboundProduct {
  product_id: string;
  tenant_id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  currency: string;
  images: string[];
  gallery: string[];
  videos: string[];
  features: string[];
  benefits: string[];
  specifications: Record<string, string>;
  category: string;
  tags: string[];
  brochure_pdf: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  search_keywords: string[];
}

export interface OutboundConversation {
  conversation_id: string;
  tenant_id: string;
  lead_id: string;
  campaign_id: string;
  started_at: string;
  last_message_at: string;
  stage: string;
  status: string;
  message_count: number;
  response_time_sum: number;
  response_count: number;
  token_usage_sum: number;
}

export interface OutboundAIMessage {
  message_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  tool_calls: Array<{ name: string; tool_use_id: string; input: any }> | null;
  prompt_version: string | null;
  metadata: {
    tokens?: number;
    latency?: number;
    cost?: number;
    sources?: string[];
    tool_use_id?: string;
    success?: boolean;
  };
}

export interface OutboundConversationAnalytics {
  tenant_id: string;
  total_conversations: number;
  meetings_booked: number;
  products_shared: number;
  knowledge_searches: number;
  tool_usage: Record<string, number>;
  average_response_time: number;
  average_conversation_length: number;
  token_usage: number;
  conversion_rate: number;
}

// ── 1. AI Settings ────────────────────────────────────────────────────

export const getAISettings = async (tenantId: string): Promise<OutboundAISettings> => {
  const res = await api.get(`/outbound/ai/${tenantId}/settings/ai`);
  return res.data;
};

export const updateAISettings = async (tenantId: string, data: Partial<OutboundAISettings>): Promise<OutboundAISettings> => {
  const res = await api.post(`/outbound/ai/${tenantId}/settings/ai`, data);
  return res.data;
};

// ── 2. Calendar Settings ──────────────────────────────────────────────

export const getCalendarSettings = async (tenantId: string): Promise<OutboundCalendarSettings> => {
  const res = await api.get(`/outbound/ai/${tenantId}/settings/calendar`);
  return res.data;
};

export const updateCalendarSettings = async (tenantId: string, data: Partial<OutboundCalendarSettings>): Promise<OutboundCalendarSettings> => {
  const res = await api.post(`/outbound/ai/${tenantId}/settings/calendar`, data);
  return res.data;
};

export const testCalendarConnection = async (tenantId: string): Promise<{ connected: boolean }> => {
  const res = await api.post(`/outbound/ai/${tenantId}/settings/calendar/test`);
  return res.data;
};

// ── 3. Product CRUD ───────────────────────────────────────────────────

export const listProducts = async (tenantId: string): Promise<OutboundProduct[]> => {
  const res = await api.get(`/outbound/ai/${tenantId}/products`);
  return res.data;
};

export const createProduct = async (tenantId: string, data: Partial<OutboundProduct>): Promise<OutboundProduct> => {
  const res = await api.post(`/outbound/ai/${tenantId}/products`, data);
  return res.data;
};

export const updateProduct = async (tenantId: string, productId: string, data: Partial<OutboundProduct>): Promise<OutboundProduct> => {
  const res = await api.put(`/outbound/ai/${tenantId}/products/${productId}`, data);
  return res.data;
};

export const deleteProduct = async (tenantId: string, productId: string): Promise<void> => {
  await api.delete(`/outbound/ai/${tenantId}/products/${productId}`);
};

// ── 4. Conversations Monitoring ───────────────────────────────────────

export const listConversations = async (tenantId: string): Promise<OutboundConversation[]> => {
  const res = await api.get(`/outbound/ai/${tenantId}/conversations`);
  return res.data;
};

export const getConversation = async (tenantId: string, conversationId: string): Promise<OutboundConversation> => {
  const res = await api.get(`/outbound/ai/${tenantId}/conversations/${conversationId}`);
  return res.data;
};

export const getConversationMessages = async (tenantId: string, conversationId: string): Promise<OutboundAIMessage[]> => {
  const res = await api.get(`/outbound/ai/${tenantId}/conversations/${conversationId}/messages`);
  return res.data;
};

export const getConversationMemory = async (tenantId: string, conversationId: string): Promise<any> => {
  const res = await api.get(`/outbound/ai/${tenantId}/conversations/${conversationId}/memory`);
  return res.data;
};

// ── 5. Analytics ──────────────────────────────────────────────────────

export const getAnalytics = async (tenantId: string): Promise<OutboundConversationAnalytics> => {
  const res = await api.get(`/outbound/ai/${tenantId}/analytics`);
  return res.data;
};
