/**
 * TypeScript types for the Outbound Campaign Module.
 */

// ── Campaign ─────────────────────────────────────────────────────────

export type CampaignStatus =
  | 'DRAFT'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export interface Campaign {
  campaign_id: string;
  tenant_id: string;
  name: string;
  status: CampaignStatus;
  /** 'template' = approved WhatsApp template (reaches anyone); 'text' = free text (24h window only) */
  message_type: CampaignMessageType;
  message_template: string;
  template_name?: string | null;
  template_language?: string | null;
  template_body?: string;
  template_params?: string[];
  batch_size: number;
  message_delay_seconds: number;
  batch_delay_seconds: number;
  total_leads: number;
  sent_count: number;
  failed_count: number;
  delivered_count: number;
  read_count: number;
  response_count: number;
  skipped_count: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  s3_file_key?: string;
  original_filename?: string;
}

export type CampaignMessageType = 'text' | 'template';

export interface CampaignCreate {
  name: string;
  message_type?: CampaignMessageType;
  message_template?: string;
  template_name?: string | null;
  template_language?: string | null;
  template_body?: string;
  template_params?: string[];
  batch_size?: number;
  message_delay_seconds?: number;
  batch_delay_seconds?: number;
}

export interface CampaignUpdate {
  name?: string;
  message_type?: CampaignMessageType;
  message_template?: string;
  template_name?: string | null;
  template_language?: string | null;
  template_body?: string;
  template_params?: string[];
  batch_size?: number;
  message_delay_seconds?: number;
  batch_delay_seconds?: number;
}

// ── Dashboard Stats ──────────────────────────────────────────────────

export interface OutboundDashboardStats {
  total_campaigns: number;
  running_campaigns: number;
  total_leads: number;
  messages_sent: number;
  messages_failed: number;
  messages_delivered: number;
  messages_read: number;
  replies: number;
  skipped_opted_out: number;
  delivery_rate: number;
  read_rate: number;
  response_rate: number;
}

// ── WhatsApp templates ───────────────────────────────────────────────

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  body: string;
  header_text: string;
  header_format: string | null;
  footer: string;
  buttons: string[];
  body_param_count: number;
  header_param_count: number;
  supported: boolean;
  unsupported_reason: string;
}

export interface WhatsAppTemplateList {
  templates: WhatsAppTemplate[];
  error?: string;
}

// ── Outbound Lead ────────────────────────────────────────────────────

export type OutboundLeadStatus = 'VALID' | 'INVALID' | 'DUPLICATE';

export type MessageStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'SKIPPED';

export interface OutboundLead {
  lead_id: string;
  campaign_id: string;
  tenant_id: string;
  name?: string;
  phone: string;
  raw_phone?: string;
  status: OutboundLeadStatus;
  message_status: MessageStatus;
  error_reason?: string;
  retry_count: number;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
}

export interface OutboundLeadUpdate {
  name?: string;
  phone?: string;
}

// ── Upload Summary ───────────────────────────────────────────────────

export interface UploadSummary {
  total_uploaded: number;
  valid: number;
  invalid: number;
  duplicates: number;
  detected_name_column?: string;
  detected_phone_column?: string;
  s3_file_key?: string;
  original_filename?: string;
}

export interface UploadResponse {
  summary: UploadSummary;
  invalid_count: number;
  duplicate_count: number;
}

// ── Campaign Stats ───────────────────────────────────────────────────

export interface CampaignStats {
  campaign_id: string;
  status: CampaignStatus;
  message_type: CampaignMessageType;
  total_leads: number;
  sent: number;
  failed: number;
  skipped: number;
  delivered: number;
  read: number;
  response_count: number;
  pending: number;
  progress_percent: number;
  delivery_rate: number;
  read_rate: number;
  response_rate: number;
  conversations: number;
  qualified: number;
  not_qualified: number;
  opted_out: number;
  handoffs: number;
  ai_tokens: number;
  ai_cost_usd: number;
  ai_cost_inr: number;
}

// ── Campaign Audit ───────────────────────────────────────────────────

export type CampaignAuditAction =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_UPDATED'
  | 'LEADS_IMPORTED'
  | 'LEADS_DELETED'
  | 'LEAD_EDITED'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_PAUSED'
  | 'CAMPAIGN_RESUMED'
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_FAILED'
  | 'CAMPAIGN_ARCHIVED'
  | 'CAMPAIGN_DELETED';

export interface CampaignAuditEntry {
  log_id: string;
  campaign_id: string;
  tenant_id: string;
  action: CampaignAuditAction;
  user_id?: string;
  user_name?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ── Status helpers ───────────────────────────────────────────────────

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-300', dot: 'bg-gray-400' },
  READY: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  RUNNING: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  PAUSED: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  COMPLETED: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  FAILED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  ARCHIVED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
};

export const MESSAGE_STATUS_COLORS: Record<MessageStatus, string> = {
  PENDING: 'text-gray-500',
  QUEUED: 'text-blue-500',
  SENDING: 'text-yellow-500',
  SENT: 'text-green-500',
  DELIVERED: 'text-indigo-500',
  READ: 'text-sky-500',
  FAILED: 'text-red-500',
  SKIPPED: 'text-amber-500',
};
