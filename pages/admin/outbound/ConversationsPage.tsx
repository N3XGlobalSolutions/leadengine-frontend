import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Search, RefreshCw, ChevronRight, Coins, Hand, Bot } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { listConversations, getPricing, OutboundConversation } from '../../../services/outboundAIService';
import {
  formatINR, formatTokens, timeAgo, leadStatusClass, leadStatusLabel, scoreColor, LEAD_STATUS_META,
} from '../../../utils/outboundFormat';

type SortKey = 'recent' | 'score' | 'cost';

export const ConversationsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { user } = useAdminAuth();

  const [conversations, setConversations] = useState<OutboundConversation[]>([]);
  const [rate, setRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const fetchConversations = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [data, pricing] = await Promise.all([listConversations(clientId), getPricing(clientId).catch(() => null)]);
      setConversations(data);
      setRate(pricing?.usd_inr_rate || 0);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: conversations.length };
    conversations.forEach((x) => { c[x.lead_status] = (c[x.lead_status] || 0) + 1; });
    return c;
  }, [conversations]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return conversations
      .filter((c) => !statusFilter || c.lead_status === statusFilter)
      .filter((c) => !q
        || (c.lead_name || '').toLowerCase().includes(q)
        || (c.lead_phone || '').includes(q)
        || (c.last_customer_message || '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortKey === 'score') return (b.lead_score ?? -1) - (a.lead_score ?? -1);
        if (sortKey === 'cost') return b.cost_usd - a.cost_usd;
        return b.last_message_at.localeCompare(a.last_message_at);
      });
  }, [conversations, statusFilter, searchTerm, sortKey]);

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-slate-900';
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

  const chip = (key: string, label: string) => {
    const active = (statusFilter || 'ALL') === key;
    return (
      <button
        key={key}
        onClick={() => setStatusFilter(key === 'ALL' ? '' : key)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
          active
            ? 'bg-indigo-600 text-white border-indigo-600'
            : isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
        }`}
      >
        {label} <span className="opacity-70">{counts[key] || 0}</span>
      </button>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user?.role === 'client_admin' ? `/${clientId}/dashboard` : `/admin/clients/${clientId}`)}
            className={`p-2.5 rounded-xl border transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${strong}`}>Conversations</h1>
            <p className={`text-sm font-medium ${muted}`}>Leads who replied to a campaign, with the AI's qualification and cost</p>
          </div>
        </div>
        <button
          onClick={fetchConversations}
          disabled={loading}
          className={`p-2.5 rounded-xl border self-start md:self-auto ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <OutboundTabs />

      <div className={`rounded-2xl border p-4 mb-6 space-y-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`} />
            <input
              type="text"
              placeholder="Search by name, phone or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={`${inputClass} sm:w-48`}>
            <option value="recent">Most recent</option>
            <option value="score">Highest score</option>
            <option value="cost">Highest AI cost</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {chip('ALL', 'All')}
          {Object.entries(LEAD_STATUS_META).map(([key, meta]) => chip(key, meta.label))}
        </div>
      </div>

      {loading && conversations.length === 0 ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className={`h-24 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-300 bg-slate-50/50'}`}>
          <MessageSquare className="mx-auto mb-4 text-indigo-500" size={44} />
          <h3 className={`font-extrabold text-lg ${strong}`}>{conversations.length ? 'No matching conversations' : 'No conversations yet'}</h3>
          <p className={`text-sm mt-1 max-w-sm mx-auto ${muted}`}>
            Conversations appear here when a lead replies to a campaign message.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.conversation_id}
              onClick={() => navigate(`/admin/clients/${clientId}/outbound/conversations/${c.conversation_id}`)}
              className={`group rounded-2xl border p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer transition-all ${
                isDark ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                  {(c.lead_name || '?').trim().charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-extrabold ${strong}`}>{c.lead_name || 'Unknown lead'}</span>
                    <span className={`text-xs font-mono ${muted}`}>{c.lead_phone}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${leadStatusClass(c.lead_status, isDark)}`}>
                      {leadStatusLabel(c.lead_status)}
                    </span>
                    {c.handoff_requested && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase">
                        <Hand size={10} /> Needs follow-up
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 truncate ${muted}`}>
                    {c.last_customer_message ? `“${c.last_customer_message}”` : 'No customer message yet'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 md:gap-6 text-xs shrink-0">
                <div className="w-24">
                  <div className={`font-bold uppercase tracking-wider text-[10px] mb-1 ${muted}`}>Score</div>
                  {c.lead_score === null ? <span className={muted}>—</span> : (
                    <div className="flex items-center gap-1.5">
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className={`h-full ${scoreColor(c.lead_score)}`} style={{ width: `${c.lead_score}%` }} />
                      </div>
                      <span className={`font-mono font-bold ${strong}`}>{c.lead_score}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className={`font-bold uppercase tracking-wider text-[10px] mb-1 ${muted}`}>Replies</div>
                  <span className={`flex items-center gap-1 font-semibold ${strong}`}><Bot size={12} /> {c.response_count}</span>
                </div>
                <div>
                  <div className={`font-bold uppercase tracking-wider text-[10px] mb-1 ${muted}`}>AI cost</div>
                  <span className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {rate ? formatINR(c.cost_usd * rate) : '—'}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] ${muted}`}><Coins size={10} /> {formatTokens(c.tokens_input + c.tokens_output + c.tokens_cache_read)}</span>
                </div>
                <div className="text-right hidden sm:block">
                  <div className={`font-bold uppercase tracking-wider text-[10px] mb-1 ${muted}`}>Last active</div>
                  <span className={`font-semibold ${strong}`}>{timeAgo(c.last_message_at)}</span>
                </div>
                <ChevronRight className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
