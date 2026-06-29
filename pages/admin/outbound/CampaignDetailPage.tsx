import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, Archive, Upload, Users, Send, AlertTriangle,
  CheckCircle2, Clock, FileText, Edit3, Trash2, Download, RefreshCw,
  Eye, Sparkles, History, XCircle, BarChart3
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import {
  Campaign, CampaignStats, CampaignAuditEntry, OutboundLead,
  CAMPAIGN_STATUS_COLORS, UploadResponse, CampaignUpdate, MessageStatus
} from '../../../types/outbound';
import {
  getCampaign, getCampaignStats, getCampaignHistory,
  listCampaignLeads, uploadLeads, updateCampaign,
  startCampaign, pauseCampaign, resumeCampaign, archiveCampaign,
  downloadInvalidLeads, downloadDuplicateLeads,
  deleteLead, updateLead, bulkDeleteLeads,
} from '../../../services/outboundService';

export const CampaignDetailPage: React.FC = () => {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [history, setHistory] = useState<CampaignAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'history'>('overview');

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Template editing
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [templateDraft, setTemplateDraft] = useState('');

  // Lead selection for bulk actions
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('');

  // Inline lead editing
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const fetchData = useCallback(async () => {
    if (!clientId || !campaignId) return;
    try {
      const [c, s, l, h] = await Promise.all([
        getCampaign(clientId, campaignId),
        getCampaignStats(clientId, campaignId),
        listCampaignLeads(clientId, campaignId, { limit: 500 }),
        getCampaignHistory(clientId, campaignId),
      ]);
      setCampaign(c);
      setStats(s);
      setLeads(l);
      setHistory(h);
    } catch (e) {
      console.error('Failed to load campaign:', e);
    }
    setLoading(false);
  }, [clientId, campaignId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh when running
  useEffect(() => {
    if (campaign?.status !== 'RUNNING') return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [campaign?.status, fetchData]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
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

  const handleAction = async (action: string) => {
    if (!clientId || !campaignId) return;
    setActionLoading(true);
    try {
      switch (action) {
        case 'start': await startCampaign(clientId, campaignId); showMessage('Campaign started!', 'success'); break;
        case 'pause': await pauseCampaign(clientId, campaignId); showMessage('Campaign paused.', 'success'); break;
        case 'resume': await resumeCampaign(clientId, campaignId); showMessage('Campaign resumed!', 'success'); break;
        case 'archive': await archiveCampaign(clientId, campaignId); showMessage('Campaign archived.', 'success'); break;
      }
      await fetchData();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || 'Action failed', 'error');
    }
    setActionLoading(false);
  };

  const handleSaveTemplate = async () => {
    if (!clientId || !campaignId) return;
    try {
      await updateCampaign(clientId, campaignId, { message_template: templateDraft });
      setEditingTemplate(false);
      showMessage('Template saved!', 'success');
      await fetchData();
    } catch (err: any) {
      showMessage(err?.response?.data?.detail || 'Failed to save', 'error');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!clientId || !campaignId || !confirm('Delete this lead?')) return;
    try {
      await deleteLead(clientId, campaignId, leadId);
      await fetchData();
    } catch (err: any) {
      showMessage('Failed to delete lead', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!clientId || !campaignId || selectedLeads.size === 0) return;
    if (!confirm(`Delete ${selectedLeads.size} leads?`)) return;
    try {
      await bulkDeleteLeads(clientId, campaignId, Array.from(selectedLeads));
      setSelectedLeads(new Set());
      showMessage(`${selectedLeads.size} leads deleted`, 'success');
      await fetchData();
    } catch (err: any) {
      showMessage('Bulk delete failed', 'error');
    }
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

  const filteredLeads = leads.filter(l => {
    const matchesSearch = !leadSearch ||
      (l.name || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone.includes(leadSearch);
    const matchesStatus = !leadStatusFilter || l.message_status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className={`h-8 w-64 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className={`h-24 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!campaign) return <AdminLayout><p>Campaign not found.</p></AdminLayout>;

  const statusStyle = CAMPAIGN_STATUS_COLORS[campaign.status];
  const cardClass = `rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200'}`;
  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`;

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
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{campaign.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${campaign.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                {campaign.status}
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Created {new Date(campaign.created_at).toLocaleDateString()} {campaign.created_by ? `by ${campaign.created_by}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className={`p-2.5 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}>
            <RefreshCw size={16} />
          </button>
          {(campaign.status === 'READY' || (campaign.status === 'DRAFT' && campaign.total_leads > 0)) && (
            <button onClick={() => handleAction('start')} disabled={actionLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-green-500/25">
              <Play size={16} /> Start Campaign
            </button>
          )}
          {campaign.status === 'RUNNING' && (
            <button onClick={() => handleAction('pause')} disabled={actionLoading}
              className="px-4 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-medium flex items-center gap-2">
              <Pause size={16} /> Pause
            </button>
          )}
          {campaign.status === 'PAUSED' && (
            <button onClick={() => handleAction('resume')} disabled={actionLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium flex items-center gap-2">
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

      {/* Messages */}
      {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'Total Leads', value: stats.total_leads, icon: Users, color: 'text-blue-500' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-gray-500' },
            { label: 'Sent', value: stats.sent, icon: Send, color: 'text-green-500' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'text-indigo-500' },
            { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-500' },
            { label: 'Responses', value: stats.response_count, icon: BarChart3, color: 'text-purple-500' },
            { label: 'Progress', value: `${stats.progress_percent}%`, icon: Sparkles, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className={`${cardClass} p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={s.color} />
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {stats && campaign.status === 'RUNNING' && (
        <div className={`${cardClass} p-4 mb-6`}>
          <div className="flex justify-between text-sm mb-2">
            <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Campaign Progress</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.progress_percent}%</span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out"
              style={{ width: `${stats.progress_percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`flex border-b mb-6 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        {(['overview', 'leads', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
              ? 'border-indigo-500 text-indigo-500'
              : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'leads' ? `Leads (${campaign.total_leads})` : 'Audit History'}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Message Template</h3>
              {['DRAFT', 'READY'].includes(campaign.status) && (
                <button onClick={() => { setEditingTemplate(true); setTemplateDraft(campaign.message_template); }}
                  className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </button>
              )}
            </div>
            {editingTemplate ? (
              <div className="space-y-3">
                <textarea rows={6} value={templateDraft} onChange={e => setTemplateDraft(e.target.value)} className={inputClass} />
                <div className="flex gap-2">
                  <button onClick={handleSaveTemplate} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs">Save</button>
                  <button onClick={() => setEditingTemplate(false)} className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
                </div>
              </div>
            ) : (
              <pre className={`text-sm whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {campaign.message_template || <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>No template set</span>}
              </pre>
            )}
          </div>

          {/* Upload */}
          <div className={`${cardClass} p-6`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Lead Upload</h3>
            {['DRAFT', 'READY'].includes(campaign.status) ? (
              <div>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-all ${isDark ? 'border-slate-600 hover:border-indigo-500/50 hover:bg-slate-900/50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'}`}>
                  <Upload size={24} className={`${uploading ? 'animate-bounce' : ''} ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {uploading ? 'Processing...' : 'Click to upload CSV, XLSX, or TXT'}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Max 10MB</span>
                </button>

                {uploadResult && (
                  <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Upload Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={isDark ? 'text-slate-400' : 'text-gray-500'}>Uploaded: <span className="font-medium text-white">{uploadResult.summary.total_uploaded}</span></div>
                      <div className="text-green-500">Valid: <span className="font-medium">{uploadResult.summary.valid}</span></div>
                      <div className="text-red-500">Invalid: <span className="font-medium">{uploadResult.summary.invalid}</span></div>
                      <div className="text-yellow-500">Duplicates: <span className="font-medium">{uploadResult.summary.duplicates}</span></div>
                    </div>
                    {uploadResult.summary.detected_name_column && (
                      <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        Detected: Name → "{uploadResult.summary.detected_name_column}", Phone → "{uploadResult.summary.detected_phone_column}"
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {uploadResult.invalid_count > 0 && (
                        <button onClick={() => clientId && campaignId && downloadInvalidLeads(clientId, campaignId)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                          <Download size={12} /> Invalid CSV
                        </button>
                      )}
                      {uploadResult.duplicate_count > 0 && (
                        <button onClick={() => clientId && campaignId && downloadDuplicateLeads(clientId, campaignId)}
                          className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                          <Download size={12} /> Duplicates CSV
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                File upload is only available for DRAFT or READY campaigns.
              </p>
            )}
          </div>

          {/* Config */}
          <div className={`${cardClass} p-6 lg:col-span-2`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Batch Size', value: campaign.batch_size },
                { label: 'Message Delay', value: `${campaign.message_delay_seconds}s` },
                { label: 'Batch Delay', value: `${campaign.batch_delay_seconds}s` },
                { label: 'File', value: campaign.original_filename || 'None' },
              ].map(item => (
                <div key={item.label}>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.label}</span>
                  <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Leads */}
      {activeTab === 'leads' && (
        <div>
          {/* Lead Controls */}
          <div className={`${cardClass} p-4 mb-4`}>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full sm:w-auto">
                <input type="text" placeholder="Search leads..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
              {selectedLeads.size > 0 && (
                <button onClick={handleBulkDelete}
                  className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-red-500/20">
                  <Trash2 size={14} /> Delete {selectedLeads.size} selected
                </button>
              )}
            </div>
          </div>

          {/* Lead Table */}
          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}`}>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox"
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={e => {
                          if (e.target.checked) setSelectedLeads(new Set(filteredLeads.map(l => l.lead_id)));
                          else setSelectedLeads(new Set());
                        }}
                        className="rounded"
                      />
                    </th>
                    {['Name', 'Phone', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`px-4 py-12 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        No leads found. Upload a file to import leads.
                      </td>
                    </tr>
                  ) : filteredLeads.map(lead => (
                    <tr key={lead.lead_id} className={`${isDark ? 'hover:bg-slate-700/20' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedLeads.has(lead.lead_id)}
                          onChange={e => {
                            const next = new Set(selectedLeads);
                            e.target.checked ? next.add(lead.lead_id) : next.delete(lead.lead_id);
                            setSelectedLeads(next);
                          }} className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        {editingLead === lead.lead_id ? (
                          <input value={editName} onChange={e => setEditName(e.target.value)} className={`${inputClass} py-1 px-2`} />
                        ) : (
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.name || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingLead === lead.lead_id ? (
                          <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className={`${inputClass} py-1 px-2`} />
                        ) : (
                          <span className={`text-sm font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{lead.phone}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${
                          lead.message_status === 'SENT' ? 'text-green-500' :
                          lead.message_status === 'FAILED' ? 'text-red-500' :
                          lead.message_status === 'SENDING' ? 'text-yellow-500' :
                          lead.message_status === 'DELIVERED' ? 'text-indigo-500' :
                          isDark ? 'text-slate-500' : 'text-gray-400'
                        }`}>{lead.message_status}</span>
                        {lead.error_reason && <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[200px]">{lead.error_reason}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {editingLead === lead.lead_id ? (
                            <>
                              <button onClick={() => handleSaveLeadEdit(lead.lead_id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                <CheckCircle2 size={14} />
                              </button>
                              <button onClick={() => setEditingLead(null)} className="p-1 text-gray-500 hover:bg-gray-500/10 rounded">
                                <XCircle size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              {['DRAFT', 'READY'].includes(campaign.status) && (
                                <button onClick={() => { setEditingLead(lead.lead_id); setEditName(lead.name || ''); setEditPhone(lead.phone); }}
                                  className={`p-1 rounded ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                  <Edit3 size={14} />
                                </button>
                              )}
                              {['DRAFT', 'READY'].includes(campaign.status) && (
                                <button onClick={() => handleDeleteLead(lead.lead_id)}
                                  className="p-1 rounded hover:bg-red-500/10 text-red-500">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: History */}
      {activeTab === 'history' && (
        <div className={`${cardClass} p-6`}>
          <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            <History size={16} /> Audit Trail
          </h3>
          {history.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No audit entries yet.</p>
          ) : (
            <div className="relative">
              <div className={`absolute left-4 top-0 bottom-0 w-px ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
              <div className="space-y-4">
                {history.map(entry => (
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
                       <FileText size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>•</span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{entry.description}</p>
                      {entry.user_name && <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>by {entry.user_name}</p>}
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
