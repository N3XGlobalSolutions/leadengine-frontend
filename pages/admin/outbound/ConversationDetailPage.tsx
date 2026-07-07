import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Bot, Cpu, HelpCircle, Wrench, ShieldCheck, Clock, Coins, User, Sparkles, TrendingUp, AlertOctagon } from 'lucide-react';
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
  
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom on load
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cardClass = `rounded-2xl border p-5 backdrop-blur-sm ${
    isDark ? 'bg-slate-800/80 border-slate-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'
  }`;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'NEW': return isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700';
      case 'CONTACTED': return isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700';
      case 'ENGAGED': return isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-700';
      case 'QUALIFIED': return isDark ? 'bg-teal-500/15 text-teal-400' : 'bg-teal-50 text-teal-700';
      case 'PRODUCT_DISCUSSION': return isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-700';
      case 'PRICING': return isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700';
      case 'WON': return isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-50 text-green-700';
      case 'LOST': return isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-700';
      default: return isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/clients/${clientId}/outbound/conversations`)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Conversation Details
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Verify prompt contexts, AI outputs, and execution metrics trees
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <OutboundTabs />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages pane */}
          <div className="lg:col-span-2 flex flex-col h-[650px] rounded-2xl border overflow-hidden bg-slate-950/20 border-slate-800">
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="text-indigo-500" size={18} />
                <span className="font-bold text-sm">Conversation Thread</span>
              </div>
            </div>

            {/* Scroll messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                const isAssistant = m.role === 'assistant';
                const isTool = m.role === 'tool';

                if (isTool) {
                  // Render Tool result box
                  const toolUseId = m.metadata?.tool_use_id || '';
                  const success = m.metadata?.success !== false;
                  const payload = JSON.parse(m.content || '{}');
                  
                  return (
                    <div key={m.message_id} className="flex justify-center my-2">
                      <div className={`w-full max-w-lg rounded-xl border p-3.5 text-xs transition-all ${
                        isDark 
                          ? 'bg-slate-900/80 border-slate-800 text-slate-300' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedTool(expandedTool === m.message_id ? null : m.message_id)}>
                          <span className="font-bold flex items-center gap-1">
                            <Wrench size={12} className="text-indigo-400" />
                            Tool Response: {toolUseId.substring(0, 10)}...
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {success ? 'Success' : 'Error'}
                          </span>
                        </div>
                        {expandedTool === m.message_id && (
                          <pre className="mt-3 p-2 bg-black/40 rounded-lg overflow-x-auto text-[10px] text-indigo-300 font-mono whitespace-pre-wrap">
                            {JSON.stringify(payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.message_id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Avatar */}
                    {!isUser && (
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Bot size={18} />
                      </div>
                    )}

                    <div className="max-w-[75%] space-y-1">
                      <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : isDark
                          ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                          : 'bg-white border border-gray-150 text-gray-800 rounded-tl-none'
                      }`}>
                        <p>{m.content}</p>
                        
                        {/* Tool Calls indicators inside assistant message */}
                        {isAssistant && m.tool_calls && m.tool_calls.map((tc, idx) => (
                          <div key={idx} className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                            <Cpu size={12} />
                            <span>Requested Tool: <b>{tc.name}</b></span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Latency and Token Telemetry */}
                      {!isUser && (m.metadata?.latency || m.metadata?.tokens) && (
                        <div className="flex items-center gap-3 px-1 text-[10px] text-slate-400">
                          {m.metadata?.latency && (
                            <span className="flex items-center gap-1"><Clock size={10} /> {m.metadata.latency.toFixed(1)}s</span>
                          )}
                          {m.metadata?.tokens && (
                            <span className="flex items-center gap-1"><Coins size={10} /> {m.metadata.tokens} tokens</span>
                          )}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="h-8 w-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                        <User size={18} />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Diagnostic Panel */}
          <div className="space-y-6">
            {conversation && (
              <div className={cardClass}>
                <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                  <ShieldCheck className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-bold">Session Metrics</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Current Stage</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStageColor(conversation.stage)}`}>
                      {conversation.stage}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Total Messages</span>
                    <span className="text-sm font-bold">{conversation.message_count} messages</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Tokens Consumed</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                      <Coins size={14} className="text-amber-500" />
                      {conversation.token_usage_sum.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Avg Latency</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                      <Clock size={14} className="text-indigo-500" />
                      {conversation.response_count > 0 ? (conversation.response_time_sum / conversation.response_count).toFixed(1) : 0}s
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-400">Campaign ID</span>
                    <span className="text-xs font-mono font-bold">{conversation.campaign_id.substring(0, 15)}...</span>
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
                    <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                      <Sparkles className="text-indigo-500" size={20} />
                      <h2 className="text-lg font-bold">Strategy & Goal Engine</h2>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Active Objective Goal</span>
                        <span className="text-sm font-bold text-indigo-400">{activeGoal}</span>
                      </div>
                      {reasoning && (
                        <>
                          <div>
                            <span className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Selected Tactics Strategy</span>
                            <span className="font-semibold text-white">{reasoning.selected_strategy}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Reasoning Rationale</span>
                            <p className="text-slate-350 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px]">
                              {reasoning.strategy_rationale}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* BANT Lead Qualification Card */}
                  <div className={cardClass}>
                    <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                      <TrendingUp className="text-indigo-500" size={20} />
                      <h2 className="text-lg font-bold">BANT Qualification</h2>
                    </div>
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-450 uppercase text-[10px]">Lead Score Index</span>
                          <span className="font-bold">{qual.lead_score}/100</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${qual.lead_score || 0}%` }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 ${qual.budget_confirmed ? 'border-green-500/25 bg-green-500/5 text-green-400' : 'border-slate-700 text-slate-400'}`}>
                          <span className="text-[10px] uppercase font-semibold">Budget confirmed</span>
                          <span className="font-bold text-xs">{qual.budget_confirmed ? 'YES' : 'PENDING'}</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 ${qual.timeline_confirmed ? 'border-green-500/25 bg-green-500/5 text-green-400' : 'border-slate-700 text-slate-400'}`}>
                          <span className="text-[10px] uppercase font-semibold">Timeline Check</span>
                          <span className="font-bold text-xs">{qual.timeline_confirmed ? 'YES' : 'PENDING'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-slate-450 uppercase text-[10px] mb-1">Decision Maker Probability</span>
                        <span className="font-mono font-bold text-sm">{(qual.decision_maker_probability || 0.0) * 100}% confidence</span>
                      </div>
                    </div>
                  </div>

                  {/* Health Gauge Card */}
                  <div className={cardClass}>
                    <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                      <AlertOctagon className="text-indigo-500" size={20} />
                      <h2 className="text-lg font-bold">Health & Loop Risks</h2>
                    </div>
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-450 uppercase text-[10px]">Turn Risk Score</span>
                          <span className={`font-bold ${health.risk_score > 50 ? 'text-red-400' : 'text-green-400'}`}>{health.risk_score}/100</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${health.risk_score > 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${health.risk_score || 0}%` }}></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-slate-700/30">
                        <span className="text-slate-400">Scheduling Momentum</span>
                        <span className="font-bold text-white">{health.momentum_score}/100</span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-slate-700/30">
                        <span className="text-slate-400">Customer Interest</span>
                        <span className="font-bold text-indigo-400">{health.customer_interest_level}</span>
                      </div>

                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-400">Conversion Chance</span>
                        <span className="font-mono font-bold text-green-400">{(health.conversion_probability || 0.0) * 100}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Persona Card */}
                  <div className={cardClass}>
                    <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                      <User className="text-indigo-500" size={20} />
                      <h2 className="text-lg font-bold">Customer Persona</h2>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 uppercase text-[10px]">Client Role</span>
                        <span className="block font-bold">{persona.role || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[10px]">Company Industry</span>
                        <span className="block font-bold">{persona.industry || 'Unknown'}</span>
                      </div>
                      {objections.length > 0 && (
                        <div>
                          <span className="text-slate-400 uppercase text-[10px] block mb-1">Objections Caught</span>
                          <div className="flex flex-wrap gap-1.5">
                            {objections.map((obj: string) => (
                              <span key={obj} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-wider">
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
              <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                <HelpCircle className="text-indigo-500" size={20} />
                <h2 className="text-lg font-bold">RAG & Product Citations</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open messages containing CPU configurations or tool usages to inspect which vector chunks or product brochure targets the AI retrieved during execution.
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
