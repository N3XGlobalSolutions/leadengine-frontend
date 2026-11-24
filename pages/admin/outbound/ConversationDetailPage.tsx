import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Bot, Cpu, HelpCircle, Wrench, ShieldCheck, Clock, Coins, User, TrendingUp, AlertOctagon, CheckCheck, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { getConversation, getConversationMessages, getConversationMemory, OutboundConversation, OutboundAIMessage } from '../../../services/outboundAIService';

export const ConversationDetailPage: React.FC = () => {
  const { clientId, conversationId } = useParams<{ clientId: string; conversationId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

  const [conversation, setConversation] = useState<OutboundConversation | null>(null);
  const [messages, setMessages] = useState<OutboundAIMessage[]>([]);
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  


  const fetchData = useCallback(async () => {
    if (!clientId || !conversationId) return;
    setLoading(true);
    try {
      const [meta, chatHistory, memProfile] = await Promise.all([
        getConversation(clientId, conversationId),
        getConversationMessages(clientId, conversationId),
        getConversationMemory(clientId, conversationId),
      ]);
      setConversation(meta);
      setMessages(chatHistory);
      setMemory(memProfile);
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    }
    setLoading(false);
  }, [clientId, conversationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const cardClass = `rounded-2xl border p-5 transition-all duration-200 ${
    isDark ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
  }`;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'NEW': return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CONTACTED': return isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ENGAGED': return isDark ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200';
      case 'QUALIFIED': return isDark ? 'bg-teal-500/15 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200';
      case 'PRODUCT_DISCUSSION': return isDark ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PRICING': return isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'WON': return isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOST': return isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200';
      default: return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/clients/${clientId}/outbound/conversations`)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600 shadow-sm'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Conversation Details
            </h1>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Verify prompt contexts, AI outputs, and execution metrics trees
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 self-start md:self-auto ${
            isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600 shadow-sm'
          }`}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="text-xs font-bold">Refresh Log</span>
        </button>
      </div>

      {/* Tabs */}
      <OutboundTabs />

      {/* Layout Shell Rendered Immediately (Prevents Jarring Blinking Flash) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Messages Pane - Sized to end level with RAG Citations */}
        <div className={`lg:col-span-2 flex flex-col h-[630px] rounded-3xl border overflow-hidden shadow-xl transition-all ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Header Bar */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <span>Live Chat Thread</span>
                  {conversation && (
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStageColor(conversation.stage)}`}>
                      {conversation.stage}
                    </span>
                  )}
                </h3>
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Conversation ID: <span className="font-mono">{conversationId?.substring(0, 12)}...</span>
                </p>
              </div>
            </div>
          </div>

          {/* Messages Scroll View / Skeleton Loader */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              /* Smooth Skeleton lines instead of jarring blink */
              <div className="space-y-4 animate-pulse">
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="w-64 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="w-56 h-12 rounded-2xl bg-indigo-200/50 dark:bg-indigo-950/50" />
                  <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                </div>
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="w-72 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                const isAssistant = m.role === 'assistant';
                const isTool = m.role === 'tool';

                if (isTool) {
                  const toolUseId = m.metadata?.tool_use_id || '';
                  const success = m.metadata?.success !== false;
                  let payload = {};
                  try {
                    payload = JSON.parse(m.content || '{}');
                  } catch (e) {
                    payload = { content: m.content };
                  }
                  
                  return (
                    <div key={m.message_id} className="flex justify-center my-3 transition-all duration-300">
                      <div className={`w-full max-w-lg rounded-2xl border p-4 text-xs transition-all ${
                        isDark 
                          ? 'bg-slate-900/90 border-slate-800 text-slate-200 shadow-md' 
                          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                      }`}>
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedTool(expandedTool === m.message_id ? null : m.message_id)}>
                          <span className="font-extrabold flex items-center gap-2">
                            <Wrench size={14} className="text-indigo-600 dark:text-indigo-400" />
                            Tool Execution: <span className="font-mono text-xs">{toolUseId.substring(0, 12)}...</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          }`}>
                            {success ? 'Success' : 'Error'}
                          </span>
                        </div>
                        {expandedTool === m.message_id && (
                          <pre className={`mt-3 p-3 rounded-xl overflow-x-auto text-[11px] font-mono whitespace-pre-wrap ${
                            isDark ? 'bg-black/80 text-indigo-300 border border-slate-800' : 'bg-slate-900 text-indigo-200'
                          }`}>
                            {JSON.stringify(payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.message_id} className={`flex gap-3 transition-all duration-300 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Avatar */}
                    {!isUser && (
                      <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md mt-1">
                        <Bot size={18} />
                      </div>
                    )}

                    <div className="max-w-[80%] space-y-1.5">
                      <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm font-medium ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : isDark
                          ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        
                        {/* Tool Calls indicators inside assistant message */}
                        {isAssistant && m.tool_calls && m.tool_calls.map((tc, idx) => (
                          <div key={idx} className={`mt-3 flex items-center gap-2 text-xs font-semibold p-2.5 rounded-xl border ${
                            isDark ? 'text-indigo-400 bg-slate-950/80 border-slate-800' : 'text-indigo-700 bg-indigo-50/80 border-indigo-200'
                          }`}>
                            <Cpu size={14} className="shrink-0" />
                            <span>Inbound Action: <b className="font-extrabold">{tc.name}</b></span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Latency and Token Telemetry */}
                      {!isUser && (m.metadata?.latency || m.metadata?.tokens) && (
                        <div className={`flex items-center gap-3 px-1 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {m.metadata?.latency && (
                            <span className="flex items-center gap-1"><Clock size={11} className="text-amber-500" /> {m.metadata.latency.toFixed(1)}s</span>
                          )}
                          {m.metadata?.tokens && (
                            <span className="flex items-center gap-1"><Coins size={11} className="text-emerald-500" /> {m.metadata.tokens} tokens</span>
                          )}
                        </div>
                      )}

                      {isUser && (
                        <div className="flex justify-end items-center gap-1 text-[10px] text-indigo-300 dark:text-indigo-400 font-bold px-1">
                          <CheckCheck size={13} className="text-white dark:text-indigo-400" />
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md mt-1">
                        <User size={18} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Sync Footer */}
          <div className={`p-3 border-t text-center text-xs font-bold shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Outbound Stream Log Sync</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Panel */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : (
            <>
              {conversation && (
                <div className={cardClass}>
                  <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Session Metrics</h2>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Current Stage</span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold uppercase border ${getStageColor(conversation.stage)}`}>
                        {conversation.stage}
                      </span>
                    </div>

                    <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Messages</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{conversation.message_count} messages</span>
                    </div>

                    <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tokens Consumed</span>
                      <span className="text-sm font-bold flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                        <Coins size={14} className="text-emerald-500" />
                        {conversation.token_usage_sum.toLocaleString()}
                      </span>
                    </div>

                    <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Avg Latency</span>
                      <span className="text-sm font-bold flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400">
                        <Clock size={14} className="text-amber-500" />
                        {conversation.response_count > 0 ? (conversation.response_time_sum / conversation.response_count).toFixed(1) : 0}s
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Campaign ID</span>
                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{conversation.campaign_id.substring(0, 15)}...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Enterprise Strategy Layer */}
              {memory?.preferences?.enterprise && (() => {
                const ent = memory.preferences.enterprise;
                const persona = ent.persona || {};
                const qual = ent.qualification || {};
                const health = ent.health || {};
                const activeGoal = ent.active_goal || 'COLD_OUTREACH';
                const objections = ent.detected_objections || [];
                
                let reasoning = null;
                if (ent.last_reasoning) {
                  try {
                    reasoning = JSON.parse(ent.last_reasoning);
                  } catch(e) {}
                }

                return (
                  <>
                    {/* Sales Strategy Card */}
                    <div className={cardClass}>
                      <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <Bot className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Strategy & Goal Engine</h2>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className={`block uppercase tracking-wider text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Objective Goal</span>
                          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{activeGoal}</span>
                        </div>
                        {reasoning && (
                          <>
                            <div>
                              <span className={`block uppercase tracking-wider text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Selected Tactics Strategy</span>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{reasoning.selected_strategy}</span>
                            </div>
                            <div>
                              <span className={`block uppercase tracking-wider text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Reasoning Rationale</span>
                              <p className={`p-3 rounded-xl border font-mono text-[11px] leading-relaxed ${
                                isDark ? 'bg-black/80 border-slate-800 text-indigo-300' : 'bg-indigo-50/50 border-indigo-100 text-indigo-950'
                              }`}>
                                {reasoning.strategy_rationale}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* BANT Lead Qualification Card */}
                    <div className={cardClass}>
                      <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>BANT Qualification</h2>
                      </div>
                      <div className="space-y-4 text-xs">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`uppercase text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Lead Score Index</span>
                            <span className={`font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{qual.lead_score}/100</span>
                          </div>
                          <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div className="bg-indigo-600 h-full transition-all duration-500 rounded-full" style={{ width: `${qual.lead_score || 0}%` }}></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                            qual.budget_confirmed
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                          }`}>
                            <span className="text-[10px] uppercase font-bold">Budget confirmed</span>
                            <span className="font-extrabold text-xs">{qual.budget_confirmed ? 'YES' : 'PENDING'}</span>
                          </div>
                          <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                            qual.timeline_confirmed
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                          }`}>
                            <span className="text-[10px] uppercase font-bold">Timeline Check</span>
                            <span className="font-extrabold text-xs">{qual.timeline_confirmed ? 'YES' : 'PENDING'}</span>
                          </div>
                        </div>

                        <div>
                          <span className={`block uppercase text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Decision Maker Probability</span>
                          <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{(qual.decision_maker_probability || 0.0) * 100}% confidence</span>
                        </div>
                      </div>
                    </div>

                    {/* Health Gauge Card */}
                    <div className={cardClass}>
                      <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <AlertOctagon className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Health & Loop Risks</h2>
                      </div>
                      <div className="space-y-4 text-xs">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`uppercase text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Turn Risk Score</span>
                            <span className={`font-extrabold font-mono ${health.risk_score > 50 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{health.risk_score}/100</span>
                          </div>
                          <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div className={`h-full transition-all duration-500 rounded-full ${health.risk_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${health.risk_score || 0}%` }}></div>
                          </div>
                        </div>

                        <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Scheduling Momentum</span>
                          <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{health.momentum_score}/100</span>
                        </div>

                        <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Customer Interest</span>
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{health.customer_interest_level}</span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Conversion Chance</span>
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{(health.conversion_probability || 0.0) * 100}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Persona Card */}
                    <div className={cardClass}>
                      <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <User className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Customer Persona</h2>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className={`uppercase text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Client Role</span>
                          <span className={`block font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{persona.role || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className={`uppercase text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Company Industry</span>
                          <span className={`block font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{persona.industry || 'Unknown'}</span>
                        </div>
                        {objections.length > 0 && (
                          <div>
                            <span className={`uppercase text-[10px] font-bold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Objections Caught</span>
                            <div className="flex flex-wrap gap-1.5">
                              {objections.map((obj: string) => (
                                <span key={obj} className="px-2.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase tracking-wider">
                                  {obj}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className={cardClass}>
                <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <HelpCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>RAG & Product Citations</h2>
                </div>
                <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Open messages containing CPU configurations or tool usages to inspect which vector chunks or product brochure targets the AI retrieved during execution.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
