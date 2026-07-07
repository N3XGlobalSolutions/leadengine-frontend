import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Search, Filter, RefreshCw, ChevronRight, Hash, Clock, Coins } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { listConversations, OutboundConversation } from '../../../services/outboundAIService';

export const ConversationsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

  const [conversations, setConversations] = useState<OutboundConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await listConversations(clientId);
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const cardClass = `rounded-xl border backdrop-blur-sm transition-colors duration-200 ${
    isDark ? 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 text-white' : 'bg-white border-gray-200 hover:shadow-md text-gray-900'
  }`;

  const inputClass = `w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'NEW':
        return isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700';
      case 'CONTACTED':
        return isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700';
      case 'ENGAGED':
        return isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-700';
      case 'QUALIFIED':
        return isDark ? 'bg-teal-500/15 text-teal-400' : 'bg-teal-50 text-teal-700';
      case 'PRODUCT_DISCUSSION':
        return isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-700';
      case 'PRICING':
      case 'NEGOTIATION':
        return isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700';
      case 'MEETING_REQUESTED':
      case 'MEETING_BOOKED':
        return isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-700';
      case 'WON':
        return isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-50 text-green-700';
      case 'LOST':
        return isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-700';
      default:
        return isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700';
    }
  };

  // Filter conversations
  const filtered = conversations.filter((c) => {
    // Stage Filter
    if (stageFilter && c.stage !== stageFilter) {
      return false;
    }
    // Search Term (ID or general details)
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.conversation_id.toLowerCase().includes(q) ||
        c.lead_id.toLowerCase().includes(q) ||
        c.stage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/clients/${clientId}`)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Outbound Conversations
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Track real-time replies, stages progress, and active sales loops
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            disabled={loading}
            className={`p-2 rounded-lg border transition-colors ${
              isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
            }`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <OutboundTabs />

      {/* Filters */}
      <div className={`${cardClass} p-4 mb-6`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search conversations by ID or Lead ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Filter size={16} className={`absolute left-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className={`${inputClass} pl-10 pr-8`}
              >
                <option value="">All Stages</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="ENGAGED">Engaged</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PRODUCT_DISCUSSION">Product Discussion</option>
                <option value="PRICING">Pricing</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="MEETING_BOOKED">Meeting Booked</option>
                <option value="FOLLOW_UP">Follow Up</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border border-dashed ${isDark ? 'border-slate-700 text-slate-400 bg-slate-800/10' : 'border-gray-300 text-gray-400 bg-gray-50/50'}`}>
          <MessageSquare className="mx-auto mb-4 text-slate-500" size={48} />
          <h3 className="font-bold text-lg">No Conversations Active</h3>
          <p className="text-sm mt-1 max-w-sm mx-auto">Conversations will populate here once a lead replies to an outbound campaign template message.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const avgLatency = c.response_count > 0 ? (c.response_time_sum / c.response_count) : 0.0;
            return (
              <div
                key={c.conversation_id}
                onClick={() => navigate(`/admin/clients/${clientId}/outbound/conversations/${c.conversation_id}`)}
                className={`${cardClass} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-indigo-500/50`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 mt-1">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span>Conversation ID: {c.conversation_id.substring(0, 8)}...</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStageColor(c.stage)}`}>
                        {c.stage}
                      </span>
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Lead ID: {c.lead_id.substring(0, 8)}... | Campaign: {c.campaign_id.substring(0, 8)}...
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Hash size={13} /> {c.message_count} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> Avg Latency: {avgLatency.toFixed(1)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins size={13} /> Tokens: {c.token_usage_sum.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-700/50">
                  <div className="text-right mr-4 hidden md:block">
                    <span className={`block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      Last Active
                    </span>
                    <span className="text-sm font-bold">
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {new Date(c.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className="text-slate-500 group-hover:text-indigo-400 transition-colors" size={20} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};
