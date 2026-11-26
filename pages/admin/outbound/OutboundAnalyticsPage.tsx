import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, IndianRupee, Coins, Database, MessageSquare, Clock, Zap,
  Target, ShieldAlert, Info, ArrowUpDown, Megaphone,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { getAnalytics, OutboundConversationAnalytics, AnalyticsConversationRow } from '../../../services/outboundAIService';
import {
  formatINR, formatUSD, formatTokens, formatPercent, timeAgo, leadStatusClass, leadStatusLabel,
  scoreColor, toolLabel, OBJECTION_LABELS,
} from '../../../utils/outboundFormat';

type SortKey = 'cost_inr' | 'tokens' | 'last_message_at' | 'lead_score' | 'ai_replies';

export const OutboundAnalyticsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { user } = useAdminAuth();

  const [analytics, setAnalytics] = useState<OutboundConversationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [sortKey, setSortKey] = useState<SortKey>('cost_inr');
  const [search, setSearch] = useState('');

  const fetchAnalytics = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError('');
    try {
      setAnalytics(await getAnalytics(clientId, days));
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load analytics');
    }
    setLoading(false);
  }, [clientId, days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const card = `rounded-2xl border p-5 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`;
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-slate-900';
  const divider = isDark ? 'border-slate-800' : 'border-slate-100';

  const rows = useMemo(() => {
    if (!analytics) return [];
    const q = search.trim().toLowerCase();
    const tokens = (r: AnalyticsConversationRow) => r.tokens_input + r.tokens_output + r.tokens_cache_read;
    return analytics.conversations
      .filter((r) => !q || r.lead_name.toLowerCase().includes(q) || r.lead_phone.includes(q) || r.campaign_name.toLowerCase().includes(q))
      .sort((a, b) => {
        switch (sortKey) {
          case 'tokens': return tokens(b) - tokens(a);
          case 'last_message_at': return b.last_message_at.localeCompare(a.last_message_at);
          case 'lead_score': return (b.lead_score ?? -1) - (a.lead_score ?? -1);
          case 'ai_replies': return b.ai_replies - a.ai_replies;
          default: return b.cost_inr - a.cost_inr;
        }
      });
  }, [analytics, search, sortKey]);

  const chartData = useMemo(() => (analytics?.daily || []).map((d) => ({
    ...d,
    label: new Date(d.day + 'T00:00:00').toLocaleDateString([], { day: 'numeric', month: 'short' }),
  })), [analytics]);

  const kpi = (title: string, value: string, sub: React.ReactNode, icon: React.ReactNode, tint: string) => (
    <div className={card}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${muted}`}>{title}</span>
        <div className={`p-2 rounded-xl border ${tint}`}>{icon}</div>
      </div>
      <div className={`text-2xl font-black tracking-tight ${strong}`}>{value}</div>
      <div className={`text-xs font-medium mt-1 ${muted}`}>{sub}</div>
    </div>
  );

  const sortButton = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      className={`inline-flex items-center gap-1 ${sortKey === key ? 'text-indigo-500' : ''}`}
    >
      {label} <ArrowUpDown size={11} />
    </button>
  );

  const t = analytics?.totals;
  const p = analytics?.pricing;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user?.role === 'client_admin' ? `/${clientId}/dashboard` : `/admin/clients/${clientId}`)}
            className={`p-2 rounded-xl border transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${strong}`}>AI Analytics</h1>
            <p className={`text-sm font-medium ${muted}`}>
              Real token usage and cost of the WhatsApp AI, per day and per conversation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className={`p-2.5 rounded-xl border ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <OutboundTabs />

      {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}

      {loading && !analytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`h-28 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />)}
        </div>
      ) : analytics && t && p && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpi('Total AI cost', formatINR(t.cost_inr), <>{formatUSD(t.cost_usd)} · {t.llm_calls.toLocaleString()} LLM calls</>,
              <IndianRupee size={18} className="text-emerald-500" />, isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}
            {kpi('Tokens used', formatTokens(t.tokens_total),
              <>{formatTokens(t.tokens_input)} input · {formatTokens(t.tokens_output)} output</>,
              <Coins size={18} className="text-indigo-500" />, isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}
            {kpi('Cached tokens', formatTokens(t.tokens_cache_read),
              p.prompt_caching_supported ? <>{formatPercent(t.cache_hit_rate)} of input served from cache</> : <>Not supported by {p.llm_model}</>,
              <Database size={18} className="text-sky-500" />, isDark ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-200')}
            {kpi('Avg cost / conversation', formatINR(t.avg_cost_per_conversation_inr),
              <>{formatINR(t.avg_cost_per_reply_inr)} per AI reply · {formatTokens(Math.round(t.avg_tokens_per_reply))} tokens/reply</>,
              <Target size={18} className="text-amber-500" />, isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')}
            {kpi('Conversations', t.conversations.toLocaleString(), <>{t.active_last_24h} active in the last 24h</>,
              <MessageSquare size={18} className="text-blue-500" />, isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200')}
            {kpi('AI replies', t.ai_replies.toLocaleString(), <>{t.customer_messages.toLocaleString()} customer messages</>,
              <Zap size={18} className="text-purple-500" />, isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200')}
            {kpi('Avg reply time', `${t.avg_response_time.toFixed(1)}s`, <>From customer message to AI reply</>,
              <Clock size={18} className="text-orange-500" />, isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200')}
            {kpi('Knowledge search tokens', formatTokens(t.tokens_embedding), <>Embeddings · {formatINR(t.tokens_embedding / 1000 * p.inr_per_1k.embedding)}</>,
              <Database size={18} className="text-teal-500" />, isDark ? 'bg-teal-500/10 border-teal-500/20' : 'bg-teal-50 border-teal-200')}
          </div>

          {t.tokens_untracked > 0 && (
            <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <Info size={14} className="mt-0.5 shrink-0" />
              {formatTokens(t.tokens_untracked)} tokens were used before detailed tracking was added. They have no input/output split, so they're not included in the costs above.
            </div>
          )}

          {/* Daily chart */}
          <div className={card}>
            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${divider}`}>
              <h2 className={`text-base font-extrabold ${strong}`}>Daily usage and cost</h2>
              <span className={`text-xs ${muted}`}>Tokens (bars) · Cost in ₹ (line)</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} interval="preserveStartEnd" />
                  <YAxis yAxisId="tokens" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => formatTokens(v)} width={48} />
                  <YAxis yAxisId="cost" orientation="right" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => `₹${Number(v).toFixed(1)}`} width={52} />
                  <Tooltip
                    contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: 12, fontSize: 12 }}
                    formatter={(value: any, name: any) => name === 'Cost (₹)' ? [formatINR(Number(value)), name] : [formatTokens(Number(value)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="tokens" dataKey="tokens_input" name="Input tokens" stackId="t" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar yAxisId="tokens" dataKey="tokens_output" name="Output tokens" stackId="t" fill="#a855f7" />
                  <Bar yAxisId="tokens" dataKey="tokens_cache_read" name="Cached tokens" stackId="t" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="cost" type="monotone" dataKey="cost_inr" name="Cost (₹)" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leads, objections, tools */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={card}>
              <h2 className={`text-base font-extrabold border-b pb-3 mb-4 ${divider} ${strong}`}>Lead outcomes</h2>
              <div className="space-y-2.5 text-sm">
                {[
                  ['Qualified', analytics.leads.qualified, 'bg-emerald-500'],
                  ['In progress', analytics.leads.in_progress, 'bg-blue-500'],
                  ['Not qualified', analytics.leads.not_qualified, 'bg-slate-400'],
                  ['Opted out', analytics.leads.opted_out, 'bg-red-500'],
                ].map(([label, value, color]) => {
                  const total = Math.max(1, t.conversations);
                  return (
                    <div key={label as string}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className={muted}>{label}</span>
                        <span className={strong}>{value as number}</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className={`h-full ${color}`} style={{ width: `${((value as number) / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`grid grid-cols-2 gap-3 mt-5 pt-4 border-t text-xs ${divider}`}>
                <div><div className={muted}>Qualification rate</div><div className={`text-lg font-black ${strong}`}>{formatPercent(analytics.leads.qualification_rate)}</div></div>
                <div><div className={muted}>Avg lead score</div><div className={`text-lg font-black ${strong}`}>{analytics.leads.avg_score === null ? '—' : Math.round(analytics.leads.avg_score)}</div></div>
                <div><div className={muted}>Asked for a human</div><div className={`text-lg font-black ${strong}`}>{analytics.leads.handoffs}</div></div>
                <div><div className={muted}>Meetings booked</div><div className={`text-lg font-black ${strong}`}>{analytics.leads.meetings_booked}</div></div>
              </div>
              <p className={`text-[11px] mt-3 ${muted}`}>Status and score are the AI's evaluation against your Prompt / Instructions.</p>
            </div>

            <div className={card}>
              <h2 className={`text-base font-extrabold border-b pb-3 mb-4 flex items-center gap-2 ${divider} ${strong}`}>
                <ShieldAlert size={16} className="text-amber-500" /> Objections raised
              </h2>
              {Object.keys(analytics.objections).length === 0 ? (
                <p className={`text-sm py-6 text-center ${muted}`}>No objections detected yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(analytics.objections).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                    <div key={key} className={`flex justify-between items-center py-2 border-b text-sm ${divider}`}>
                      <span className={`font-semibold ${strong}`}>{OBJECTION_LABELS[key] || key}</span>
                      <span className="font-mono font-bold text-amber-500">{count}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className={`text-[11px] mt-3 ${muted}`}>Counted once per conversation, as detected by the AI.</p>
            </div>

            <div className={card}>
              <h2 className={`text-base font-extrabold border-b pb-3 mb-4 flex items-center gap-2 ${divider} ${strong}`}>
                <Zap size={16} className="text-indigo-500" /> Tools used
              </h2>
              {Object.keys(analytics.tools).length === 0 ? (
                <p className={`text-sm py-6 text-center ${muted}`}>No tools used yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(analytics.tools).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                    <div key={name} className={`flex justify-between items-center py-2 border-b text-sm ${divider}`}>
                      <span className={`font-semibold ${strong}`}>{toolLabel(name)}</span>
                      <span className="font-mono font-bold text-indigo-500">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Campaign breakdown */}
          {analytics.campaigns.length > 0 && (
            <div className={card}>
              <h2 className={`text-base font-extrabold border-b pb-3 mb-4 flex items-center gap-2 ${divider} ${strong}`}>
                <Megaphone size={16} className="text-purple-500" /> AI cost by campaign
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left text-xs uppercase tracking-wider ${muted}`}>
                      <th className="pb-2 font-bold">Campaign</th>
                      <th className="pb-2 font-bold text-right">Conversations</th>
                      <th className="pb-2 font-bold text-right">Qualified</th>
                      <th className="pb-2 font-bold text-right">Tokens</th>
                      <th className="pb-2 font-bold text-right">AI cost</th>
                      <th className="pb-2 font-bold text-right">Per conversation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.campaigns.map((c) => (
                      <tr key={c.campaign_id} className={`border-t ${divider}`}>
                        <td className={`py-2.5 font-semibold ${strong}`}>{c.campaign_name}</td>
                        <td className="py-2.5 text-right font-mono">{c.conversations}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-500">{c.qualified}</td>
                        <td className="py-2.5 text-right font-mono">{formatTokens(c.tokens)}</td>
                        <td className="py-2.5 text-right font-mono font-bold">{formatINR(c.cost_inr)}</td>
                        <td className={`py-2.5 text-right font-mono ${muted}`}>{formatINR(c.conversations ? c.cost_inr / c.conversations : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-conversation table */}
          <div className={card}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4 ${divider}`}>
              <h2 className={`text-base font-extrabold ${strong}`}>Token usage per conversation</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or campaign..."
                className={`px-3 py-2 rounded-xl border text-sm w-full sm:w-72 ${isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
            {rows.length === 0 ? (
              <p className={`text-sm py-10 text-center ${muted}`}>No conversations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[980px]">
                  <thead>
                    <tr className={`text-left text-[11px] uppercase tracking-wider ${muted}`}>
                      <th className="pb-2 font-bold">Lead</th>
                      <th className="pb-2 font-bold">Campaign</th>
                      <th className="pb-2 font-bold">Status</th>
                      <th className="pb-2 font-bold">{sortButton('lead_score', 'Score')}</th>
                      <th className="pb-2 font-bold text-right">{sortButton('ai_replies', 'Replies')}</th>
                      <th className="pb-2 font-bold text-right">Input</th>
                      <th className="pb-2 font-bold text-right">Output</th>
                      <th className="pb-2 font-bold text-right">Cached</th>
                      <th className="pb-2 font-bold text-right">{sortButton('tokens', 'Total')}</th>
                      <th className="pb-2 font-bold text-right">{sortButton('cost_inr', 'Cost')}</th>
                      <th className="pb-2 font-bold text-right">{sortButton('last_message_at', 'Last active')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const total = r.tokens_input + r.tokens_output + r.tokens_cache_read;
                      return (
                        <tr
                          key={r.conversation_id}
                          onClick={() => navigate(`/admin/clients/${clientId}/outbound/conversations/${r.conversation_id}`)}
                          className={`border-t cursor-pointer transition-colors ${divider} ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="py-2.5">
                            <div className={`font-semibold ${strong}`}>{r.lead_name || 'Unknown lead'}</div>
                            <div className={`text-xs font-mono ${muted}`}>{r.lead_phone || '—'}</div>
                          </td>
                          <td className={`py-2.5 text-xs ${muted}`}>{r.campaign_name}</td>
                          <td className="py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${leadStatusClass(r.lead_status, isDark)}`}>
                              {leadStatusLabel(r.lead_status)}
                            </span>
                          </td>
                          <td className="py-2.5">
                            {r.lead_score === null ? <span className={muted}>—</span> : (
                              <div className="flex items-center gap-2">
                                <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                  <div className={`h-full ${scoreColor(r.lead_score)}`} style={{ width: `${r.lead_score}%` }} />
                                </div>
                                <span className="font-mono text-xs font-bold">{r.lead_score}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono">{r.ai_replies}</td>
                          <td className="py-2.5 text-right font-mono">{formatTokens(r.tokens_input)}</td>
                          <td className="py-2.5 text-right font-mono">{formatTokens(r.tokens_output)}</td>
                          <td className="py-2.5 text-right font-mono">{formatTokens(r.tokens_cache_read)}</td>
                          <td className="py-2.5 text-right font-mono font-semibold">
                            {formatTokens(total)}
                            {r.tokens_untracked > 0 && <div className={`text-[10px] ${muted}`}>+{formatTokens(r.tokens_untracked)} untracked</div>}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(r.cost_inr)}</td>
                          <td className={`py-2.5 text-right text-xs ${muted}`}>{timeAgo(r.last_message_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className={card}>
            <h2 className={`text-base font-extrabold border-b pb-3 mb-4 flex items-center gap-2 ${divider} ${strong}`}>
              <Info size={16} className="text-indigo-500" /> How cost is calculated
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <table className="w-full">
                <thead>
                  <tr className={`text-left text-[11px] uppercase tracking-wider ${muted}`}>
                    <th className="pb-2 font-bold">Per 1,000 tokens</th>
                    <th className="pb-2 font-bold text-right">USD</th>
                    <th className="pb-2 font-bold text-right">INR</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['Input', 'input'], ['Output', 'output'], ['Cached input', 'cache_read'], ['Knowledge search (embeddings)', 'embedding'],
                  ] as const).map(([label, key]) => (
                    <tr key={key} className={`border-t ${divider}`}>
                      <td className={`py-2 ${strong}`}>{label}</td>
                      <td className="py-2 text-right font-mono">${p.usd_per_1k[key]}</td>
                      <td className="py-2 text-right font-mono">₹{p.inr_per_1k[key].toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={`space-y-2 text-xs leading-relaxed ${muted}`}>
                <p><span className={`font-semibold ${strong}`}>Model:</span> {p.llm_model} (replies) and {p.embedding_model} (knowledge search).</p>
                <p><span className={`font-semibold ${strong}`}>Prices:</span> {p.source}.</p>
                <p><span className={`font-semibold ${strong}`}>Exchange rate:</span> 1 USD = ₹{p.usd_inr_rate} (reference rate of {p.usd_inr_rate_date}).</p>
                <p><span className={`font-semibold ${strong}`}>Token counts</span> come from Bedrock's usage report on every call, so they match AWS billing.</p>
                <p>{p.note}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
