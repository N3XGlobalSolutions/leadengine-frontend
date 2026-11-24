import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Search, Filter, RefreshCw, ChevronRight, Hash, Clock, Coins } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { listConversations, OutboundConversation } from '../../../services/outboundAIService';

export const ConversationsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { user } = useAdminAuth();

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

  const cardClass = `rounded-2xl border transition-all duration-200 ${
    isDark
      ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl'
      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
  }`;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
  }`;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'NEW':
        return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CONTACTED':
        return isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ENGAGED':
        return isDark ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200';
      case 'QUALIFIED':
        return isDark ? 'bg-teal-500/15 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200';
      case 'PRODUCT_DISCUSSION':
        return isDark ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PRICING':
      case 'NEGOTIATION':
        return isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEETING_REQUESTED':
      case 'MEETING_BOOKED':
        return isDark ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'WON':
        return isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOST':
        return isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200';
      default:
        return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filter conversations
  const filtered = conversations.filter((c) => {
    if (stageFilter && c.stage !== stageFilter) {
      return false;
    }
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
            onClick={() => {
              if (user?.role === 'client_admin') {
                navigate(`/${clientId}/dashboard`);
              } else {
                navigate(`/admin/clients/${clientId}`);
              }
            }}
            className={`p-2.5 rounded-xl border transition-colors ${
              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600 shadow-sm'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Outbound Conversations
            </h1>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Track real-time replies, stages progress, and active sales loops
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600 shadow-sm'
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
            <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
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
              <Filter size={16} className={`absolute left-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
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
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border border-dashed ${isDark ? 'border-slate-800 text-slate-400 bg-slate-900/40' : 'border-slate-300 text-slate-500 bg-slate-50/50'}`}>
          <MessageSquare className="mx-auto mb-4 text-indigo-500" size={48} />
          <h3 className={`font-extrabold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>No Conversations Active</h3>
          <p className={`text-sm mt-1 max-w-sm mx-auto font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Conversations will populate here once a lead replies to an outbound campaign template message.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const avgLatency = c.response_count > 0 ? (c.response_time_sum / c.response_count) : 0.0;
            return (
              <div
                key={c.conversation_id}
                onClick={() => navigate(`/admin/clients/${clientId}/outbound/conversations/${c.conversation_id}`)}
                className={`group rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all duration-200 ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-white shadow-md'
                    : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-lg text-slate-900'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 mt-1 shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-base flex flex-wrap items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>Conversation ID: {c.conversation_id.substring(0, 8)}...</span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${getStageColor(c.stage)}`}>
                        {c.stage}
                      </span>
                    </h3>
                    <p className={`text-xs mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Lead ID: <span className="font-mono">{c.lead_id.substring(0, 8)}...</span> | Campaign: <span className="font-mono">{c.campaign_id.substring(0, 8)}...</span>
                    </p>
                    <div className={`flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <span className="flex items-center gap-1.5">
                        <Hash size={14} className="text-indigo-500" /> {c.message_count} messages
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-500" /> Avg Latency: {avgLatency.toFixed(1)}s
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Coins size={14} className="text-emerald-500" /> Tokens: {c.token_usage_sum.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between border-t md:border-t-0 pt-4 md:pt-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="text-right mr-4 hidden md:block">
                    <span className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Last Active
                    </span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {new Date(c.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" size={20} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};
