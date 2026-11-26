import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, Archive, Upload, Users, Send, AlertTriangle, CheckCircle2, Clock, FileText,
  Edit3, Trash2, Download, RefreshCw, History, XCircle, Eye, CheckCheck, MessageSquare, Ban, Target,
  IndianRupee, Hand, FileCheck2, Type,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import {
  Campaign, CampaignStats, CampaignAuditEntry, OutboundLead, CAMPAIGN_STATUS_COLORS, UploadResponse,
  CampaignUpdate, WhatsAppTemplate,
} from '../../../types/outbound';
import {
  getCampaign, getCampaignStats, getCampaignHistory, listCampaignLeads, uploadLeads, updateCampaign,
  startCampaign, pauseCampaign, resumeCampaign, archiveCampaign, downloadInvalidLeads, downloadDuplicateLeads,
  deleteLead, updateLead, bulkDeleteLeads, listWhatsAppTemplates,
} from '../../../services/outboundService';
import { listConversations } from '../../../services/outboundAIService';
import { TemplateParamEditor, fillTemplate, sampleParams } from '../../../components/admin/outbound/TemplateParamEditor';
import { formatINR, formatTokens, formatDateTime } from '../../../utils/outboundFormat';

const LEAD_STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-slate-400',
  QUEUED: 'text-blue-500',
  SENDING: 'text-yellow-500',
  SENT: 'text-green-500',
  DELIVERED: 'text-indigo-500',
  READ: 'text-sky-500',
  FAILED: 'text-red-500',
  SKIPPED: 'text-amber-500',
};
const LEAD_STATUS_LABEL: Record<string, string> = { SKIPPED: 'OPTED OUT' };

export const CampaignDetailPage: React.FC = () => {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [history, setHistory] = useState<CampaignAuditEntry[]>([]);
  const [conversationByLead, setConversationByLead] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'history'>('overview');

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Message editing
  const [editingMessage, setEditingMessage] = useState(false);
  const [draft, setDraft] = useState<CampaignUpdate>({});
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templatesError, setTemplatesError] = useState('');

  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('');
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const fetchData = useCallback(async () => {
    if (!clientId || !campaignId) return;
    try {
      const [c, s, l, h, convs] = await Promise.all([
        getCampaign(clientId, campaignId),
        getCampaignStats(clientId, campaignId),
        listCampaignLeads(clientId, campaignId, { limit: 1000 }),
        getCampaignHistory(clientId, campaignId),
        listConversations(clientId).catch(() => []),
      ]);
      setCampaign(c);
      setStats(s);
      setLeads(l);
      setHistory(h);
      const map: Record<string, string> = {};
      convs.filter((x) => x.campaign_id === campaignId).forEach((x) => { map[x.lead_id] = x.conversation_id; });
      setConversationByLead(map);
    } catch (e) {
      console.error('Failed to load campaign:', e);
    }
    setLoading(false);
  }, [clientId, campaignId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (campaign?.status !== 'RUNNING') return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [campaign?.status, fetchData]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(msg); else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 5000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clientId || !campaignId) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadLeads(clientId, campaignId, file);
      setUploadResult(result);
      showMessage(`Upload complete: ${result.summary.valid} valid leads imported`, 'success');
      await fetchData();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || 'Upload failed', 'error');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'archive') => {
    if (!clientId || !campaignId) return;
    setActionLoading(true);
    try {
      if (action === 'start') { await startCampaign(clientId, campaignId); showMessage('Campaign started. Messages are being sent in the background.', 'success'); }
      if (action === 'pause') { await pauseCampaign(clientId, campaignId); showMessage('Campaign paused.', 'success'); }
      if (action === 'resume') { await resumeCampaign(clientId, campaignId); showMessage('Campaign resumed.', 'success'); }
      if (action === 'archive') { await archiveCampaign(clientId, campaignId); showMessage('Campaign archived.', 'success'); }
      await fetchData();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || 'Action failed', 'error');
    }
    setActionLoading(false);
  };

  const openMessageEditor = async () => {
    if (!campaign || !clientId) return;
    setDraft({
      message_type: campaign.message_type || 'text',
      message_template: campaign.message_template,
      template_name: campaign.template_name || null,
      template_language: campaign.template_language || null,
      template_body: campaign.template_body || '',
      template_params: campaign.template_params || [],
    });
    setEditingMessage(true);
    try {
      const res = await listWhatsAppTemplates(clientId);
      setTemplates(res.templates || []);
      setTemplatesError(res.error || '');
    } catch (e: any) {
      setTemplatesError(e?.response?.data?.detail || 'Could not load templates');
    }
  };

  const draftTemplate = useMemo(
    () => templates.find((t) => t.name === draft.template_name && t.language === draft.template_language) || null,
    [templates, draft.template_name, draft.template_language]
  );

  const saveMessage = async () => {
    if (!clientId || !campaignId) return;
    try {
      await updateCampaign(clientId, campaignId, draft);
      setEditingMessage(false);
      showMessage('Message saved.', 'success');
      await fetchData();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || 'Failed to save', 'error');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!clientId || !campaignId || !confirm('Delete this lead?')) return;
    try { await deleteLead(clientId, campaignId, leadId); await fetchData(); }
    catch { showMessage('Failed to delete lead', 'error'); }
  };

  const handleBulkDelete = async () => {
    if (!clientId || !campaignId || selectedLeads.size === 0) return;
    if (!confirm(`Delete ${selectedLeads.size} leads?`)) return;
    try {
      await bulkDeleteLeads(clientId, campaignId, Array.from(selectedLeads));
      showMessage(`${selectedLeads.size} leads deleted`, 'success');
      setSelectedLeads(new Set());
      await fetchData();
    } catch { showMessage('Bulk delete failed', 'error'); }
  };

  const handleSaveLeadEdit = async (leadId: string) => {
    if (!clientId || !campaignId) return;
    try {
      await updateLead(clientId, campaignId, leadId, { name: editName, phone: editPhone });
      setEditingLead(null);
      await fetchData();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || 'Failed to update', 'error');
    }
  };

  const filteredLeads = leads.filter((l) => {
    const q = leadSearch.toLowerCase();
    const matchesSearch = !q || (l.name || '').toLowerCase().includes(q) || l.phone.includes(leadSearch);
    const matchesStatus = !leadStatusFilter
      || (leadStatusFilter === 'REPLIED' ? !!l.replied_at : l.message_status === leadStatusFilter);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className={`h-8 w-64 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className={`h-24 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!campaign) return <AdminLayout><p>Campaign not found.</p></AdminLayout>;

  const statusStyle = CAMPAIGN_STATUS_COLORS[campaign.status];
  const editable = ['DRAFT', 'READY'].includes(campaign.status);
  const isTemplate = campaign.message_type === 'template';
  const cardClass = `rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200'}`;
  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`;
  const muted = isDark ? 'text-slate-400' : 'text-gray-500';
  const strong = isDark ? 'text-white' : 'text-gray-900';

  const funnel = stats ? [
    { label: 'Total leads', value: stats.total_leads, icon: Users, color: 'text-blue-500', sub: `${stats.pending} pending` },
    { label: 'Sent', value: stats.sent, icon: Send, color: 'text-green-500', sub: 'Accepted by WhatsApp' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCheck, color: 'text-indigo-500', sub: `${stats.delivery_rate}% of sent` },
    { label: 'Read', value: stats.read, icon: Eye, color: 'text-sky-500', sub: `${stats.read_rate}% of delivered` },
    { label: 'Replied', value: stats.response_count, icon: MessageSquare, color: 'text-purple-500', sub: `${stats.response_rate}% of sent` },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-500', sub: 'See reasons in Leads' },
    { label: 'Opted out', value: stats.skipped, icon: Ban, color: 'text-amber-500', sub: 'Not messaged' },
  ] : [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/admin/clients/${clientId}/outbound`)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`text-2xl font-bold ${strong}`}>{campaign.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${campaign.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                {campaign.status}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${isTemplate ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                {isTemplate ? <FileCheck2 size={12} /> : <Type size={12} />} {isTemplate ? 'Template' : 'Free text'}
              </span>
            </div>
            <p className={`text-sm ${muted}`}>
              Created {new Date(campaign.created_at).toLocaleDateString()} {campaign.created_by ? `by ${campaign.created_by}` : ''}
              {campaign.started_at && ` · started ${formatDateTime(campaign.started_at)}`}
              {campaign.completed_at && ` · finished ${formatDateTime(campaign.completed_at)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className={`p-2.5 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}>
            <RefreshCw size={16} />
          </button>
          {(campaign.status === 'READY' || (campaign.status === 'DRAFT' && campaign.total_leads > 0)) && (
            <button onClick={() => handleAction('start')} disabled={actionLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50">
              <Play size={16} /> Start Campaign
            </button>
          )}
          {campaign.status === 'RUNNING' && (
            <button onClick={() => handleAction('pause')} disabled={actionLoading}
              className="px-4 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Pause size={16} /> Pause
            </button>
          )}
          {campaign.status === 'PAUSED' && (
            <button onClick={() => handleAction('resume')} disabled={actionLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Play size={16} /> Resume
            </button>
          )}
          {!['RUNNING', 'ARCHIVED'].includes(campaign.status) && (
            <button onClick={() => handleAction('archive')} disabled={actionLoading}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border ${isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
              <Archive size={16} /> Archive
            </button>
          )}
        </div>
      </div>

      <OutboundTabs />

      {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">{String(error)}</div>}

      {/* Delivery funnel */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {funnel.map((s) => (
            <div key={s.label} className={`${cardClass} p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={s.color} />
                <span className={`text-xs ${muted}`}>{s.label}</span>
              </div>
              <div className={`text-xl font-bold ${strong}`}>{s.value.toLocaleString()}</div>
              <div className={`text-[10px] mt-0.5 ${muted}`}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {stats && ['RUNNING', 'PAUSED'].includes(campaign.status) && (
        <div className={`${cardClass} p-4 mb-6`}>
          <div className="flex justify-between text-sm mb-2">
            <span className={muted}>Sending progress</span>
            <span className={`font-medium ${strong}`}>{stats.progress_percent}% · {stats.pending} left</span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000" style={{ width: `${stats.progress_percent}%` }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`flex border-b mb-6 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        {(['overview', 'leads', 'history'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
              ? 'border-indigo-500 text-indigo-500'
              : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}`}>
            {tab === 'overview' ? 'Overview' : tab === 'leads' ? `Leads (${campaign.total_leads})` : 'Audit History'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI results */}
          {stats && (
            <div className={`${cardClass} p-6 lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Target size={16} className="text-emerald-500" /> AI conversation results
                </h3>
                <Link to={`/admin/clients/${clientId}/outbound/conversations`} className="text-xs text-indigo-500 hover:underline">View conversations →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  ['Conversations', stats.conversations, ''],
                  ['Qualified', stats.qualified, 'text-emerald-500'],
                  ['Not qualified', stats.not_qualified, ''],
                  ['Opted out', stats.opted_out, 'text-red-500'],
                  ['Need follow-up', stats.handoffs, 'text-orange-500'],
                ].map(([label, value, color]) => (
                  <div key={label as string}>
                    <div className={`text-xs ${muted}`}>{label}</div>
                    <div className={`text-xl font-bold ${color || strong}`}>{value as number}</div>
                  </div>
                ))}
                <div>
                  <div className={`text-xs flex items-center gap-1 ${muted}`}><IndianRupee size={11} /> AI cost</div>
                  <div className={`text-xl font-bold ${strong}`}>{formatINR(stats.ai_cost_inr)}</div>
                  <div className={`text-[10px] ${muted}`}>{formatTokens(stats.ai_tokens)} tokens</div>
                </div>
              </div>
              {stats.handoffs > 0 && (
                <p className="mt-3 text-xs flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                  <Hand size={12} /> {stats.handoffs} lead(s) asked for a person or needed help the AI couldn't give.
                </p>
              )}
            </div>
          )}

          {/* Message */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Message</h3>
              {editable && !editingMessage && (
                <button onClick={openMessageEditor} className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </button>
              )}
            </div>

            {editingMessage ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['template', 'text'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setDraft({ ...draft, message_type: type })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${draft.message_type === type ? 'bg-indigo-600 text-white border-indigo-600' : isDark ? 'border-slate-600 text-slate-300' : 'border-gray-200 text-gray-600'}`}>
                      {type === 'template' ? 'Approved template' : 'Free text'}
                    </button>
                  ))}
                </div>
                {draft.message_type === 'template' ? (
                  <>
                    <select
                      value={draftTemplate ? `${draftTemplate.name}|${draftTemplate.language}` : ''}
                      onChange={(e) => {
                        const t = templates.find((x) => `${x.name}|${x.language}` === e.target.value);
                        setDraft({
                          ...draft,
                          template_name: t?.name || null,
                          template_language: t?.language || null,
                          template_body: t?.body || '',
                          template_params: t ? Array.from({ length: t.body_param_count }, (_, i) => (i === 0 ? '{{name}}' : '')) : [],
                        });
                      }}
                      className={inputClass}
                    >
                      <option value="">Select an approved template</option>
                      {templates.map((t) => (
                        <option key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`} disabled={!t.supported}>
                          {t.name} ({t.language}){t.supported ? '' : ' · not supported'}
                        </option>
                      ))}
                    </select>
                    {templatesError && <p className="text-xs text-amber-500">{templatesError}</p>}
                    {draftTemplate && draftTemplate.body_param_count > 0 && (
                      <TemplateParamEditor count={draftTemplate.body_param_count} values={draft.template_params || []}
                        onChange={(values) => setDraft({ ...draft, template_params: values })} />
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-amber-500">Free text only reaches people who messaged you in the last 24 hours.</p>
                    <textarea rows={6} value={draft.message_template || ''} onChange={(e) => setDraft({ ...draft, message_template: e.target.value })} className={inputClass} />
                  </>
                )}
                <div className="flex gap-2">
                  <button onClick={saveMessage} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs">Save</button>
                  <button onClick={() => setEditingMessage(false)} className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
                </div>
              </div>
            ) : isTemplate ? (
              <div className="space-y-2 text-sm">
                <div className={muted}>Template: <span className={`font-mono font-semibold ${strong}`}>{campaign.template_name}</span> ({campaign.template_language})</div>
                <div className={`p-3 rounded-2xl rounded-tl-none whitespace-pre-wrap ${isDark ? 'bg-emerald-900/40 text-emerald-50' : 'bg-emerald-50 text-gray-800 border border-emerald-100'}`}>
                  {fillTemplate(campaign.template_body || '', sampleParams(campaign.template_params || [])) || '—'}
                </div>
                {(campaign.template_params || []).length > 0 && (
                  <div className={`text-xs ${muted}`}>
                    {(campaign.template_params || []).map((p, i) => (
                      <span key={i} className="mr-3"><span className="font-mono text-indigo-500">{`{{${i + 1}}}`}</span> = {p === '{{name}}' ? 'lead name' : p === '{{phone}}' ? 'lead phone' : `“${p}”`}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <pre className={`text-sm whitespace-pre-wrap font-sans ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {campaign.message_template || <span className={muted}>No message set</span>}
                </pre>
                <p className="mt-3 text-xs text-amber-500 flex items-start gap-1.5">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" /> Free text is only delivered to people who messaged you in the last 24 hours.
                </p>
              </>
            )}
          </div>

          {/* Upload */}
          <div className={`${cardClass} p-6`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Lead Upload</h3>
            {editable ? (
              <div>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-all ${isDark ? 'border-slate-600 hover:border-indigo-500/50 hover:bg-slate-900/50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'}`}>
                  <Upload size={24} className={`${uploading ? 'animate-bounce' : ''} ${muted}`} />
                  <span className={`text-sm font-medium ${muted}`}>{uploading ? 'Processing...' : 'Click to upload CSV, XLSX, or TXT'}</span>
                  <span className={`text-xs ${muted}`}>Max 10MB · needs a phone column (name optional)</span>
                </button>
                {uploadResult && (
                  <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Upload Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={muted}>Uploaded: <span className={`font-medium ${strong}`}>{uploadResult.summary.total_uploaded}</span></div>
                      <div className="text-green-500">Valid: <span className="font-medium">{uploadResult.summary.valid}</span></div>
                      <div className="text-red-500">Invalid: <span className="font-medium">{uploadResult.summary.invalid}</span></div>
                      <div className="text-yellow-500">Duplicates: <span className="font-medium">{uploadResult.summary.duplicates}</span></div>
                    </div>
                    {uploadResult.summary.detected_name_column && (
                      <p className={`text-xs mt-2 ${muted}`}>Detected: Name → "{uploadResult.summary.detected_name_column}", Phone → "{uploadResult.summary.detected_phone_column}"</p>
                    )}
                    <div className="flex gap-3 mt-3">
                      {uploadResult.invalid_count > 0 && (
                        <button onClick={() => clientId && campaignId && downloadInvalidLeads(clientId, campaignId)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                          <Download size={12} /> Invalid CSV
                        </button>
                      )}
                      {uploadResult.duplicate_count > 0 && (
                        <button onClick={() => clientId && campaignId && downloadDuplicateLeads(clientId, campaignId)} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                          <Download size={12} /> Duplicates CSV
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`text-sm ${muted}`}>File upload is only available for DRAFT or READY campaigns.</p>
            )}
          </div>

          {/* Configuration */}
          <div className={`${cardClass} p-6 lg:col-span-2`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Sending configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Batch size', campaign.batch_size],
                ['Message delay', `${campaign.message_delay_seconds}s`],
                ['Batch delay', `${campaign.batch_delay_seconds}s`],
                ['Lead file', campaign.original_filename || 'None'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span className={`text-xs ${muted}`}>{label}</span>
                  <p className={`text-sm font-medium mt-0.5 ${strong}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div>
          <div className={`${cardClass} p-4 mb-4`}>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full sm:w-auto">
                <input type="text" placeholder="Search leads..." value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <select value={leadStatusFilter} onChange={(e) => setLeadStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="SENT">Sent</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="READ">Read</option>
                  <option value="REPLIED">Replied</option>
                  <option value="FAILED">Failed</option>
                  <option value="SKIPPED">Opted out</option>
                </select>
              </div>
              {selectedLeads.size > 0 && (
                <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-red-500/20">
                  <Trash2 size={14} /> Delete {selectedLeads.size} selected
                </button>
              )}
            </div>
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}`}>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox"
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={(e) => setSelectedLeads(e.target.checked ? new Set(filteredLeads.map((l) => l.lead_id)) : new Set())}
                        className="rounded" />
                    </th>
                    {['Name', 'Phone', 'Status', 'Updated', 'Actions'].map((h) => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                  {filteredLeads.length === 0 ? (
                    <tr><td colSpan={6} className={`px-4 py-12 text-center ${muted}`}>No leads found. Upload a file to import leads.</td></tr>
                  ) : filteredLeads.map((lead) => {
                    const conversationId = conversationByLead[lead.lead_id];
                    const lastTime = lead.replied_at || lead.read_at || lead.delivered_at || lead.sent_at;
                    return (
                      <tr key={lead.lead_id} className={isDark ? 'hover:bg-slate-700/20' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedLeads.has(lead.lead_id)}
                            onChange={(e) => {
                              const next = new Set(selectedLeads);
                              e.target.checked ? next.add(lead.lead_id) : next.delete(lead.lead_id);
                              setSelectedLeads(next);
                            }} className="rounded" />
                        </td>
                        <td className="px-4 py-3">
                          {editingLead === lead.lead_id
                            ? <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`${inputClass} py-1 px-2`} />
                            : <span className={`text-sm ${strong}`}>{lead.name || '—'}</span>}
                        </td>
                        <td className="px-4 py-3">
                          {editingLead === lead.lead_id
                            ? <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={`${inputClass} py-1 px-2`} />
                            : <span className={`text-sm font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{lead.phone}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-xs font-semibold ${LEAD_STATUS_STYLE[lead.message_status] || muted}`}>
                              {LEAD_STATUS_LABEL[lead.message_status] || lead.message_status}
                            </span>
                            {lead.replied_at && (
                              conversationId ? (
                                <Link to={`/admin/clients/${clientId}/outbound/conversations/${conversationId}`}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold hover:bg-purple-500/20">
                                  <MessageSquare size={10} /> REPLIED · view chat
                                </Link>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                                  <MessageSquare size={10} /> REPLIED
                                </span>
                              )
                            )}
                          </div>
                          {lead.error_reason && <p className="text-[11px] text-red-400 mt-0.5 max-w-[320px]">{lead.error_reason}</p>}
                        </td>
                        <td className={`px-4 py-3 text-xs ${muted}`}>{lastTime ? formatDateTime(lastTime) : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {editingLead === lead.lead_id ? (
                              <>
                                <button onClick={() => handleSaveLeadEdit(lead.lead_id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded"><CheckCircle2 size={14} /></button>
                                <button onClick={() => setEditingLead(null)} className="p-1 text-gray-500 hover:bg-gray-500/10 rounded"><XCircle size={14} /></button>
                              </>
                            ) : editable && (
                              <>
                                <button onClick={() => { setEditingLead(lead.lead_id); setEditName(lead.name || ''); setEditPhone(lead.phone); }}
                                  className={`p-1 rounded ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}><Edit3 size={14} /></button>
                                <button onClick={() => handleDeleteLead(lead.lead_id)} className="p-1 rounded hover:bg-red-500/10 text-red-500"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className={`${cardClass} p-6`}>
          <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            <History size={16} /> Audit Trail
          </h3>
          {history.length === 0 ? (
            <p className={`text-sm ${muted}`}>No audit entries yet.</p>
          ) : (
            <div className="relative">
              <div className={`absolute left-4 top-0 bottom-0 w-px ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.log_id} className="flex gap-4 relative">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      entry.action.includes('STARTED') || entry.action.includes('RESUMED') ? 'bg-green-500/20 text-green-500' :
                      entry.action.includes('PAUSED') ? 'bg-yellow-500/20 text-yellow-500' :
                      entry.action.includes('FAILED') ? 'bg-red-500/20 text-red-500' :
                      entry.action.includes('COMPLETED') ? 'bg-indigo-500/20 text-indigo-500' :
                      isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {entry.action.includes('STARTED') || entry.action.includes('RESUMED') ? <Play size={14} /> :
                        entry.action.includes('PAUSED') ? <Pause size={14} /> :
                        entry.action.includes('IMPORT') ? <Upload size={14} /> :
                        entry.action.includes('FAILED') ? <AlertTriangle size={14} /> :
                        entry.action.includes('COMPLETED') ? <CheckCircle2 size={14} /> :
                        entry.action.includes('CREATED') ? <Clock size={14} /> : <FileText size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${strong}`}>{entry.action.replace(/_/g, ' ')}</span>
                        <span className={`text-xs ${muted}`}>• {new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      <p className={`text-xs mt-0.5 ${muted}`}>{entry.description}</p>
                      {entry.user_name && <p className={`text-xs ${muted}`}>by {entry.user_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};
