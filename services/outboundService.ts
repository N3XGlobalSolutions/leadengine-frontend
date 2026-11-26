/**
 * Outbound Campaign API service.
 * Mirrors the backend /api/outbound endpoints.
 */

import { api } from './api';
import {
  Campaign,
  CampaignCreate,
  CampaignUpdate,
  CampaignStats,
  CampaignAuditEntry,
  OutboundDashboardStats,
  OutboundLead,
  OutboundLeadUpdate,
  UploadResponse,
  WhatsAppTemplateList,
} from '@/types/outbound';

// ═══════════════════════════════════════════════════════════════════════
// WhatsApp templates
// ═══════════════════════════════════════════════════════════════════════

export const listWhatsAppTemplates = async (tenantId: string): Promise<WhatsAppTemplateList> => {
  const res = await api.get(`/outbound/${tenantId}/whatsapp/templates`);
  return res.data;
};

// ═══════════════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════════════

export const getOutboundDashboard = async (tenantId: string): Promise<OutboundDashboardStats> => {
  const res = await api.get(`/outbound/${tenantId}/dashboard`);
  return res.data;
};

// ═══════════════════════════════════════════════════════════════════════
// Campaign CRUD
// ═══════════════════════════════════════════════════════════════════════

export const createCampaign = async (tenantId: string, data: CampaignCreate): Promise<Campaign> => {
  const res = await api.post(`/outbound/${tenantId}/campaigns`, data);
  return res.data;
};

export const listCampaigns = async (tenantId: string, status?: string): Promise<Campaign[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const res = await api.get(`/outbound/${tenantId}/campaigns`, { params });
  return res.data;
};

export const getCampaign = async (tenantId: string, campaignId: string): Promise<Campaign> => {
  const res = await api.get(`/outbound/${tenantId}/campaigns/${campaignId}`);
  return res.data;
};

export const updateCampaign = async (
  tenantId: string,
  campaignId: string,
  data: CampaignUpdate
): Promise<Campaign> => {
  const res = await api.put(`/outbound/${tenantId}/campaigns/${campaignId}`, data);
  return res.data;
};

export const deleteCampaign = async (tenantId: string, campaignId: string): Promise<void> => {
  await api.delete(`/outbound/${tenantId}/campaigns/${campaignId}`);
};

// ═══════════════════════════════════════════════════════════════════════
// Lead Upload & Management
// ═══════════════════════════════════════════════════════════════════════

export const uploadLeads = async (
  tenantId: string,
  campaignId: string,
  file: File
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/outbound/${tenantId}/campaigns/${campaignId}/upload`, formData);
  return res.data;
};

export const listCampaignLeads = async (
  tenantId: string,
  campaignId: string,
  params?: { status?: string; search?: string; skip?: number; limit?: number }
): Promise<OutboundLead[]> => {
  const res = await api.get(`/outbound/${tenantId}/campaigns/${campaignId}/leads`, { params });
  return res.data;
};

export const updateLead = async (
  tenantId: string,
  campaignId: string,
  leadId: string,
  data: OutboundLeadUpdate
): Promise<OutboundLead> => {
  const res = await api.put(`/outbound/${tenantId}/campaigns/${campaignId}/leads/${leadId}`, data);
  return res.data;
};

export const deleteLead = async (
  tenantId: string,
  campaignId: string,
  leadId: string
): Promise<void> => {
  await api.delete(`/outbound/${tenantId}/campaigns/${campaignId}/leads/${leadId}`);
};

export const bulkDeleteLeads = async (
  tenantId: string,
  campaignId: string,
  leadIds: string[]
): Promise<{ deleted: number }> => {
  const res = await api.post(`/outbound/${tenantId}/campaigns/${campaignId}/leads/bulk-delete`, leadIds);
  return res.data;
};

export const downloadInvalidLeads = async (tenantId: string, campaignId: string): Promise<void> => {
  const res = await api.get(`/outbound/${tenantId}/campaigns/${campaignId}/invalid-leads`, {
    responseType: 'blob',
  });
  _downloadBlob(res.data, 'invalid_leads.csv');
};

export const downloadDuplicateLeads = async (tenantId: string, campaignId: string): Promise<void> => {
  const res = await api.get(`/outbound/${tenantId}/campaigns/${campaignId}/duplicate-leads`, {
    responseType: 'blob',
  });
  _downloadBlob(res.data, 'duplicate_leads.csv');
};

// ═══════════════════════════════════════════════════════════════════════
// Campaign Actions
// ═══════════════════════════════════════════════════════════════════════

export const startCampaign = async (tenantId: string, campaignId: string): Promise<Campaign> => {
  const res = await api.post(`/outbound/${tenantId}/campaigns/${campaignId}/start`);
  return res.data;
};

export const pauseCampaign = async (tenantId: string, campaignId: string): Promise<Campaign> => {
  const res = await api.post(`/outbound/${tenantId}/campaigns/${campaignId}/pause`);
  return res.data;
};

export const resumeCampaign = async (tenantId: string, campaignId: string): Promise<Campaign> => {
  const res = await api.post(`/outbound/${tenantId}/campaigns/${campaignId}/resume`);
  return res.data;
};

export const archiveCampaign = async (tenantId: string, campaignId: string): Promise<Campaign> => {
  const res = await api.post(`/outbound/${tenantId}/campaigns/${campaignId}/archive`);
  return res.data;
};

// ═══════════════════════════════════════════════════════════════════════
// Campaign Monitoring & History
// ═══════════════════════════════════════════════════════════════════════

export const getCampaignStats = async (
  tenantId: string,
  campaignId: string
): Promise<CampaignStats> => {
  const res = await api.get(`/outbound/${tenantId}/campaigns/${campaignId}/stats`);
  return res.data;
};

export const getCampaignHistory = async (
  tenantId: string,
  campaignId: string
): Promise<CampaignAuditEntry[]> => {
  const res = await api.get(`/outbound/${tenantId}/campaigns/${campaignId}/history`);
  return res.data;
};

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function _downloadBlob(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
