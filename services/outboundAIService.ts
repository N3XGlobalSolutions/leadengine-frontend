/**
 * Outbound AI Sales Agent API service.
 * Connects to the backend /api/outbound/ai endpoints.
 */

import { api } from './api';

export interface OutboundAISettings {
  tenant_id: string;
  ai_name: string;
  /** Prompt / Instructions: the main instruction for the WhatsApp AI (role, flow, questions, qualification). */
  agent_instructions: string;
  /** Legacy "Business summary / Sales Context"; used by the AI only when agent_instructions is empty. */
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
  tokens_input: number;
  tokens_output: number;
  tokens_cache_read: number;
  tokens_cache_write: number;
  tokens_embedding: number;
  llm_calls: number;
  cost_usd: number;
  tool_counts: Record<string, number>;
  lead_name: string;
  lead_phone: string;
  lead_status: LeadStatus;
  lead_score: number | null;
  lead_score_reason: string;
  objections: string[];
  handoff_requested: boolean;
  customer_message_count: number;
  last_customer_message: string;
}

export type LeadStatus = 'IN_PROGRESS' | 'QUALIFIED' | 'NOT_QUALIFIED' | 'OPTED_OUT';

export interface LeadProfile {
  collected?: Record<string, string>;
  status?: LeadStatus;
  score?: number;
  score_reason?: string;
  objections?: string[];
  handoff_requested?: boolean;
  updated_at?: string;
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
    tokens_input?: number;
    tokens_output?: number;
    tokens_cache_read?: number;
    tokens_cache_write?: number;
    tokens_embedding?: number;
    llm_calls?: number;
    cost_usd?: number;
    latency?: number;
    tools?: string[];
    knowledge_hits?: number;
    media?: Array<{ type: string; caption?: string; link?: string }>;
    tool_use_id?: string;
    success?: boolean;
  };
}

export interface PricingInfo {
  llm_model: string;
  embedding_model: string;
  usd_per_1k: { input: number; output: number; cache_read: number; cache_write: number; embedding: number };
  inr_per_1k: { input: number; output: number; cache_read: number; cache_write: number; embedding: number };
  usd_inr_rate: number;
  usd_inr_rate_date: string;
  source: string;
  prompt_caching_supported: boolean;
  note: string;
}

export interface AnalyticsTotals {
  conversations: number;
  active_last_24h: number;
  customer_messages: number;
  ai_replies: number;
  llm_calls: number;
  tokens_input: number;
  tokens_output: number;
  tokens_cache_read: number;
  tokens_cache_write: number;
  tokens_embedding: number;
  tokens_untracked: number;
  tokens_total: number;
  cost_usd: number;
  cost_inr: number;
  avg_cost_per_conversation_inr: number;
  avg_cost_per_reply_inr: number;
  avg_tokens_per_reply: number;
  avg_response_time: number;
  cache_hit_rate: number;
}

export interface AnalyticsDailyRow {
  day: string;
  tokens_input: number;
  tokens_output: number;
  tokens_cache_read: number;
  tokens_embedding: number;
  llm_calls: number;
  replies: number;
  customer_messages: number;
  cost_usd: number;
  cost_inr: number;
}

export interface AnalyticsConversationRow {
  conversation_id: string;
  lead_name: string;
  lead_phone: string;
  campaign_id: string;
  campaign_name: string;
  stage: string;
  lead_status: LeadStatus;
  lead_score: number | null;
  customer_messages: number;
  ai_replies: number;
  llm_calls: number;
  tokens_input: number;
  tokens_output: number;
  tokens_cache_read: number;
  tokens_embedding: number;
  tokens_untracked: number;
  cost_usd: number;
  cost_inr: number;
  avg_response_time: number;
  last_message_at: string;
}

export interface OutboundConversationAnalytics {
  tenant_id: string;
  generated_at: string;
  period_days: number;
  pricing: PricingInfo;
  totals: AnalyticsTotals;
  leads: {
    in_progress: number;
    qualified: number;
    not_qualified: number;
    opted_out: number;
    handoffs: number;
    meetings_booked: number;
    qualification_rate: number;
    scored_leads: number;
    avg_score: number | null;
  };
  stages: Record<string, number>;
  objections: Record<string, number>;
  tools: Record<string, number>;
  campaigns: Array<{ campaign_id: string; campaign_name: string; conversations: number; qualified: number; tokens: number; cost_usd: number; cost_inr: number }>;
  daily: AnalyticsDailyRow[];
  conversations: AnalyticsConversationRow[];
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

export const getConversationMessages = async (tenantId: string, conversationId: string, limit = 300): Promise<OutboundAIMessage[]> => {
  const res = await api.get(`/outbound/ai/${tenantId}/conversations/${conversationId}/messages`, { params: { limit } });
  return res.data;
};

export const getConversationMemory = async (tenantId: string, conversationId: string): Promise<any> => {
  const res = await api.get(`/outbound/ai/${tenantId}/conversations/${conversationId}/memory`);
  return res.data;
};

// ── 5. Analytics ──────────────────────────────────────────────────────

export const getPricing = async (tenantId: string): Promise<PricingInfo> => {
  const res = await api.get(`/outbound/ai/${tenantId}/pricing`);
  return res.data;
};

export const getAnalytics = async (tenantId: string, days = 30): Promise<OutboundConversationAnalytics> => {
  const res = await api.get(`/outbound/ai/${tenantId}/analytics`, { params: { days } });
  return res.data;
};
