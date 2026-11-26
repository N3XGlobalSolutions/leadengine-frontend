import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Bot, User, Wrench, Clock, Coins, RefreshCw, Target, IndianRupee, ClipboardList,
  ShieldAlert, Hand, Image as ImageIcon, FileText, MessageSquare, Megaphone, BookOpen,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import {
  getConversation, getConversationMessages, getConversationMemory, getPricing,
  OutboundConversation, OutboundAIMessage, LeadProfile, PricingInfo,
} from '../../../services/outboundAIService';
import { getCampaign } from '../../../services/outboundService';
import {
  formatINR, formatUSD, formatTokens, formatDateTime, humanize, leadStatusClass, leadStatusLabel,
  scoreColor, toolLabel, OBJECTION_LABELS,
} from '../../../utils/outboundFormat';

export const ConversationDetailPage: React.FC = () => {
  const { clientId, conversationId } = useParams<{ clientId: string; conversationId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<OutboundConversation | null>(null);
  const [messages, setMessages] = useState<OutboundAIMessage[]>([]);
  const [memory, setMemory] = useState<any>(null);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clientId || !conversationId) return;
    setLoading(true);
    try {
      const [meta, chatHistory, memProfile, price] = await Promise.all([
        getConversation(clientId, conversationId),
        getConversationMessages(clientId, conversationId),
        getConversationMemory(clientId, conversationId).catch(() => null),
        getPricing(clientId).catch(() => null),
      ]);
      setConversation(meta);
      setMessages(chatHistory);
      setMemory(memProfile);
      setPricing(price);
      getCampaign(clientId, meta.campaign_id).then((c) => setCampaignName(c.name)).catch(() => setCampaignName(''));
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    }
    setLoading(false);
  }, [clientId, conversationId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const rate = pricing?.usd_inr_rate || 0;
  const inr = (usd?: number) => formatINR((usd || 0) * rate);
  const card = `rounded-2xl border p-5 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`;
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-slate-900';
  const divider = isDark ? 'border-slate-800' : 'border-slate-100';
  const profile: LeadProfile = memory?.preferences?.lead_profile || {};
  const collected = Object.entries(profile.collected || {});
  const score = conversation?.lead_score ?? profile.score ?? null;
  const objections = conversation?.objections?.length ? conversation.objections : (profile.objections || []);

  const row = (label: string, value: React.ReactNode) => (
    <div className={`flex justify-between items-center py-2 border-b last:border-b-0 text-sm ${divider}`}>
      <span className={muted}>{label}</span>
      <span className={`font-semibold text-right ${strong}`}>{value}</span>
    </div>
  );

  const toolSummary = (payload: any): string => {
    if (!payload || typeof payload !== 'object') return '';
    if (payload.success === false) return payload.error || 'Failed';
    if (Array.isArray(payload.results)) return `${payload.results.length} result${payload.results.length === 1 ? '' : 's'}`;
    if (Array.isArray(payload.products)) return `${payload.products.length} products`;
    if (payload.images_queued) return `${payload.images_queued} photo(s) of ${payload.product_name}`;
    if (payload.product?.name) return payload.product.name;
    if (payload.product_name) return payload.product_name;
    return 'Done';
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/clients/${clientId}/outbound/conversations`)}
            className={`p-2.5 rounded-xl border transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight flex flex-wrap items-center gap-3 ${strong}`}>
              {conversation?.lead_name || 'Conversation'}
              {conversation && (
                <span className={`inline-flex px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase ${leadStatusClass(conversation.lead_status, isDark)}`}>
                  {leadStatusLabel(conversation.lead_status)}
                </span>
              )}
            </h1>
            <p className={`text-sm font-medium ${muted}`}>
              <span className="font-mono">{conversation?.lead_phone || '—'}</span>
              {campaignName && <> · Campaign: <Link to={`/admin/clients/${clientId}/outbound/campaigns/${conversation?.campaign_id}`} className="text-indigo-500 hover:underline">{campaignName}</Link></>}
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className={`p-2.5 rounded-xl border flex items-center gap-2 self-start md:self-auto ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="text-xs font-bold">Refresh</span>
        </button>
      </div>

      <OutboundTabs />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Chat thread */}
        <div className={`lg:col-span-2 flex flex-col h-[720px] rounded-3xl border overflow-hidden ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className={`font-extrabold text-sm ${strong}`}>WhatsApp conversation</h3>
                <p className={`text-xs ${muted}`}>{messages.filter((m) => m.role !== 'tool').length} messages · stage {conversation ? humanize(conversation.stage.toLowerCase()) : '—'}</p>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[64, 56, 72].map((w, i) => (
                  <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                    <div className={`h-14 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ width: `${w * 4}px` }} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className={`text-sm text-center py-20 ${muted}`}>No messages yet.</p>
            ) : messages.map((m) => {
              if (m.role === 'tool') {
                let payload: any = {};
                try { payload = JSON.parse(m.content || '{}'); } catch { payload = { content: m.content }; }
                const success = m.metadata?.success !== false;
                return (
                  <div key={m.message_id} className="flex justify-center">
                    <div className={`w-full max-w-lg rounded-xl border px-3 py-2 text-xs ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <button className="w-full flex justify-between items-center gap-2" onClick={() => setExpandedTool(expandedTool === m.message_id ? null : m.message_id)}>
                        <span className="flex items-center gap-2 font-semibold">
                          <Wrench size={12} className="text-indigo-500" /> Tool result: {toolSummary(payload)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                          {success ? 'OK' : 'Error'}
                        </span>
                      </button>
                      {expandedTool === m.message_id && (
                        <pre className={`mt-2 p-2 rounded-lg overflow-x-auto text-[11px] font-mono whitespace-pre-wrap ${isDark ? 'bg-black/60 text-indigo-300' : 'bg-slate-900 text-indigo-200'}`}>
                          {JSON.stringify(payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              }

              const isCustomer = m.role === 'user';
              const isToolCallStub = m.role === 'assistant' && m.tool_calls?.length && !m.content;
              if (isToolCallStub) {
                return (
                  <div key={m.message_id} className="flex justify-center">
                    <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                      AI used: {m.tool_calls!.map((tc) => toolLabel(tc.name)).join(', ')}
                    </span>
                  </div>
                );
              }

              const md = m.metadata || {};
              return (
                <div key={m.message_id} className={`flex gap-2.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                  {isCustomer && (
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      <User size={16} />
                    </div>
                  )}
                  <div className="max-w-[80%] space-y-1">
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isCustomer
                        ? isDark ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                        : 'bg-emerald-600 text-white rounded-tr-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {!isCustomer && md.media && md.media.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {md.media.map((media, i) => (
                            <a key={i} href={media.link} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25">
                              {media.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                              {media.type === 'image' ? 'Photo sent' : 'Brochure sent'}{media.caption ? `: ${media.caption}` : ''}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] font-semibold ${isCustomer ? '' : 'justify-end'} ${muted}`}>
                      <span>{new Date(m.timestamp).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {!isCustomer && md.latency !== undefined && <span className="flex items-center gap-1"><Clock size={10} /> {Number(md.latency).toFixed(1)}s</span>}
                      {!isCustomer && md.tokens_input !== undefined && (
                        <span className="flex items-center gap-1" title="Input / output tokens">
                          <Coins size={10} /> {formatTokens(md.tokens_input)} in · {formatTokens(md.tokens_output)} out
                          {(md.tokens_cache_read || 0) > 0 && <> · {formatTokens(md.tokens_cache_read)} cached</>}
                        </span>
                      )}
                      {!isCustomer && md.tokens_input === undefined && md.tokens !== undefined && <span className="flex items-center gap-1"><Coins size={10} /> {formatTokens(md.tokens)} tokens</span>}
                      {!isCustomer && md.cost_usd !== undefined && rate > 0 && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><IndianRupee size={10} />{inr(md.cost_usd).replace('₹', '')}</span>}
                      {!isCustomer && md.tools && md.tools.length > 0 && <span className="flex items-center gap-1"><Wrench size={10} /> {md.tools.map(toolLabel).join(', ')}</span>}
                      {!isCustomer && (md.knowledge_hits || 0) > 0 && <span className="flex items-center gap-1"><BookOpen size={10} /> {md.knowledge_hits} KB</span>}
                    </div>
                  </div>
                  {!isCustomer && (
                    <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1">
                      <Bot size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-6">
          {loading && !conversation ? (
            <div className="space-y-6 animate-pulse">
              <div className={`h-56 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
              <div className={`h-56 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
            </div>
          ) : conversation && (
            <>
              {/* Lead qualification (real) */}
              <div className={card}>
                <div className={`flex items-center gap-2 border-b pb-3 mb-4 ${divider}`}>
                  <Target size={18} className="text-emerald-500" />
                  <h2 className={`text-base font-extrabold ${strong}`}>Lead qualification</h2>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-bold uppercase ${muted}`}>Lead score</span>
                    <span className={`font-black font-mono ${strong}`}>{score === null ? 'Not scored yet' : `${score}/100`}</span>
                  </div>
                  <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${score || 0}%` }} />
                  </div>
                  {(conversation.lead_score_reason || profile.score_reason) && (
                    <p className={`text-xs mt-2 leading-relaxed ${muted}`}>{conversation.lead_score_reason || profile.score_reason}</p>
                  )}
                </div>

                <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${muted}`}>
                  <ClipboardList size={12} /> Details collected
                </h3>
                {collected.length === 0 ? (
                  <p className={`text-xs mb-3 ${muted}`}>Nothing collected yet.</p>
                ) : (
                  <div className={`rounded-xl border mb-3 ${divider}`}>
                    {collected.map(([key, value]) => (
                      <div key={key} className={`flex justify-between gap-3 px-3 py-2 border-b last:border-b-0 text-xs ${divider}`}>
                        <span className={muted}>{humanize(key)}</span>
                        <span className={`font-semibold text-right ${strong}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {objections.length > 0 && (
                  <div className="mb-3">
                    <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${muted}`}>
                      <ShieldAlert size={12} /> Objections
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {objections.map((o) => (
                        <span key={o} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                          {OBJECTION_LABELS[o] || o}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {conversation.handoff_requested && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold">
                    <Hand size={14} /> Customer asked for a person, or the AI couldn't help. Follow up manually.
                  </div>
                )}
                <p className={`text-[11px] mt-3 ${muted}`}>Status and score are the AI's evaluation against your Prompt / Instructions, based on what the customer actually said.</p>
              </div>

              {/* AI usage & cost */}
              <div className={card}>
                <div className={`flex items-center gap-2 border-b pb-3 mb-3 ${divider}`}>
                  <IndianRupee size={18} className="text-emerald-500" />
                  <h2 className={`text-base font-extrabold ${strong}`}>AI usage & cost</h2>
                </div>
                <div className="mb-3">
                  <div className={`text-3xl font-black ${strong}`}>{rate ? inr(conversation.cost_usd) : '—'}</div>
                  <div className={`text-xs ${muted}`}>{formatUSD(conversation.cost_usd)} for this conversation</div>
                </div>
                {row('AI replies', conversation.response_count)}
                {row('LLM calls', conversation.llm_calls)}
                {row('Input tokens', formatTokens(conversation.tokens_input))}
                {row('Output tokens', formatTokens(conversation.tokens_output))}
                {row('Cached tokens', formatTokens(conversation.tokens_cache_read))}
                {row('Knowledge search tokens', formatTokens(conversation.tokens_embedding))}
                {row('Avg reply time', `${conversation.response_count ? (conversation.response_time_sum / conversation.response_count).toFixed(1) : 0}s`)}
                {conversation.token_usage_sum > conversation.tokens_input + conversation.tokens_output + conversation.tokens_cache_read + conversation.tokens_cache_write && (
                  <p className={`text-[11px] mt-2 ${muted}`}>
                    Includes {formatTokens(conversation.token_usage_sum - conversation.tokens_input - conversation.tokens_output - conversation.tokens_cache_read - conversation.tokens_cache_write)} tokens from before detailed tracking (not priced).
                  </p>
                )}
              </div>

              {/* Conversation info */}
              <div className={card}>
                <div className={`flex items-center gap-2 border-b pb-3 mb-3 ${divider}`}>
                  <Megaphone size={18} className="text-indigo-500" />
                  <h2 className={`text-base font-extrabold ${strong}`}>Conversation</h2>
                </div>
                {row('Started', formatDateTime(conversation.started_at))}
                {row('Last message', formatDateTime(conversation.last_message_at))}
                {row('Customer messages', conversation.customer_message_count)}
                {row('Stage', humanize(conversation.stage.toLowerCase()))}
                {memory?.interested_products?.length > 0 && row('Interested in', memory.interested_products.join(', '))}
                {Object.keys(conversation.tool_counts || {}).length > 0 && row('Tools used', Object.entries(conversation.tool_counts).map(([k, v]) => `${toolLabel(k)} ×${v}`).join(', '))}
                {memory?.conversation_summary && (
                  <div className="mt-3">
                    <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${muted}`}>AI summary of earlier messages</h3>
                    <p className={`text-xs leading-relaxed ${muted}`}>{memory.conversation_summary}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
