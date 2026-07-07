import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Megaphone, Users, Send, AlertTriangle, TrendingUp,
  Play, Pause, Eye, Archive, Trash2, RefreshCw, Search, Filter, Zap
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import {
  Campaign, CampaignStatus, OutboundDashboardStats, CAMPAIGN_STATUS_COLORS
} from '../../../types/outbound';
import {
  getOutboundDashboard, listCampaigns,
  startCampaign, pauseCampaign, resumeCampaign, archiveCampaign, deleteCampaign,
} from '../../../services/outboundService';

export const OutboundDashboardPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

  const [stats, setStats] = useState<OutboundDashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [dashStats, campaignList] = await Promise.all([
        getOutboundDashboard(clientId),
        listCampaigns(clientId, statusFilter || undefined),
      ]);
      setStats(dashStats);
      setCampaigns(campaignList);
    } catch (e) {
      console.error('Failed to fetch outbound data:', e);
    }
    setLoading(false);
  }, [clientId, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh for running campaigns
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === 'RUNNING');
    if (!hasRunning) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [campaigns, fetchData]);

  const handleAction = async (campaignId: string, action: string) => {
    if (!clientId) return;
    setActionLoading(campaignId);
    setError('');
    try {
      switch (action) {
        case 'start':
          await startCampaign(clientId, campaignId);
          setSuccess('Campaign started!');
          break;
        case 'pause':
          await pauseCampaign(clientId, campaignId);
          setSuccess('Campaign paused.');
          break;
        case 'resume':
          await resumeCampaign(clientId, campaignId);
          setSuccess('Campaign resumed!');
          break;
        case 'archive':
          await archiveCampaign(clientId, campaignId);
          setSuccess('Campaign archived.');
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this campaign?')) {
            await deleteCampaign(clientId, campaignId);
            setSuccess('Campaign deleted.');
          }
          break;
      }
      await fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Action failed');
    }
    setActionLoading(null);
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (searchTerm) {
      return c.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const cardClass = `rounded-xl border backdrop-blur-sm ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200'}`;
  const statCards = stats ? [
    { label: 'Total Campaigns', value: stats.total_campaigns, icon: Megaphone, color: 'from-indigo-500 to-purple-600' },
    { label: 'Running', value: stats.running_campaigns, icon: Zap, color: 'from-green-500 to-emerald-600' },
    { label: 'Total Leads', value: stats.total_leads, icon: Users, color: 'from-blue-500 to-cyan-600' },
    { label: 'Messages Sent', value: stats.messages_sent, icon: Send, color: 'from-violet-500 to-fuchsia-600' },
    { label: 'Failed', value: stats.messages_failed, icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
    { label: 'Response Rate', value: `${stats.response_rate}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
  ] : [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/clients/${clientId}`)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Outbound Campaigns
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Create and manage outbound messaging campaigns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className={`p-2.5 rounded-lg border transition-all ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => navigate(`/admin/clients/${clientId}/outbound/campaigns/new`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            <Plus size={18} /> New Campaign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <OutboundTabs />

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className={`${cardClass} p-4 relative overflow-hidden group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${card.color} mb-3`}>
                <card.icon size={18} className="text-white" />
              </div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {card.value}
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className={`${cardClass} p-4 mb-6`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="RUNNING">Running</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Campaign Table */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}`}>
                {['Campaign Name', 'Status', 'Total Leads', 'Sent', 'Failed', 'Created', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} style={{ width: `${50 + Math.random() * 50}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-16 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No campaigns yet</p>
                    <p className="text-sm mt-1">Create your first outbound campaign to get started</p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => {
                  const statusStyle = CAMPAIGN_STATUS_COLORS[c.status];
                  return (
                    <tr
                      key={c.campaign_id}
                      className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}
                      onClick={() => navigate(`/admin/clients/${clientId}/outbound/campaigns/${c.campaign_id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.name}</div>
                        {c.created_by && <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>by {c.created_by}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${c.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                          {c.status}
                        </span>
                      </td>
                      <td className={`px-4 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{c.total_leads.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-green-500 font-medium">{c.sent_count.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-red-500 font-medium">{c.failed_count}</td>
                      <td className={`px-4 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/clients/${clientId}/outbound/campaigns/${c.campaign_id}`)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          {(c.status === 'READY' || c.status === 'DRAFT') && c.total_leads > 0 && (
                            <button
                              onClick={() => handleAction(c.campaign_id, 'start')}
                              disabled={actionLoading === c.campaign_id}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors"
                              title="Start"
                            >
                              <Play size={15} />
                            </button>
                          )}
                          {c.status === 'RUNNING' && (
                            <button
                              onClick={() => handleAction(c.campaign_id, 'pause')}
                              disabled={actionLoading === c.campaign_id}
                              className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-yellow-500 transition-colors"
                              title="Pause"
                            >
                              <Pause size={15} />
                            </button>
                          )}
                          {c.status === 'PAUSED' && (
                            <button
                              onClick={() => handleAction(c.campaign_id, 'resume')}
                              disabled={actionLoading === c.campaign_id}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors"
                              title="Resume"
                            >
                              <Play size={15} />
                            </button>
                          )}
                          {['DRAFT', 'READY', 'COMPLETED', 'FAILED', 'PAUSED'].includes(c.status) && (
                            <button
                              onClick={() => handleAction(c.campaign_id, 'archive')}
                              disabled={actionLoading === c.campaign_id}
                              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}
                              title="Archive"
                            >
                              <Archive size={15} />
                            </button>
                          )}
                          {(c.status === 'DRAFT' || c.status === 'ARCHIVED') && (
                            <button
                              onClick={() => handleAction(c.campaign_id, 'delete')}
                              disabled={actionLoading === c.campaign_id}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
