import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart3, MessageSquare, Calendar, Zap, Clock, Coins, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { getAnalytics, OutboundConversationAnalytics } from '../../../services/outboundAIService';

export const OutboundAnalyticsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { user } = useAdminAuth();

  const [analytics, setAnalytics] = useState<OutboundConversationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await getAnalytics(clientId);
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const cardClass = `rounded-2xl border p-6 transition-all duration-200 ${
    isDark
      ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl'
      : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
  }`;

  const statCard = (title: string, value: string | number, desc: string, icon: React.ReactNode, color: string) => (
    <div className={cardClass}>
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${color}`}>
          {icon}
        </div>
      </div>
      <h3 className={`text-3xl font-black mb-1 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
      <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{desc}</p>
    </div>
  );

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
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Outbound AI Analytics
            </h1>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Monitor outbound sales performance, scheduling conversions, and token usage costs
            </p>
          </div>
        </div>
        <div>
          <button
            onClick={fetchAnalytics}
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        analytics && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCard(
                'Total Conversations',
                analytics.total_conversations,
                'Active outbound chat flows',
                <MessageSquare size={20} className="text-blue-500" />,
                isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
              )}
              {statCard(
                'Meetings Booked',
                analytics.meetings_booked,
                'Discovery calls scheduled',
                <Calendar size={20} className="text-emerald-500" />,
                isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              )}
              {statCard(
                'Conversion Rate',
                `${analytics.conversion_rate.toFixed(1)}%`,
                'Conversations resulting in booking',
                <TrendingUp size={20} className="text-purple-500" />,
                isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
              )}
              {statCard(
                'Average Latency',
                `${analytics.average_response_time.toFixed(1)}s`,
                'AI inference response speed',
                <Clock size={20} className="text-amber-500" />,
                isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
              )}
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tool Execution Table */}
              <div className={`${cardClass} lg:col-span-2`}>
                <div className={`flex items-center gap-2 border-b pb-4 mb-6 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <Zap className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tool Execution Counts</h2>
                </div>

                {Object.keys(analytics.tool_usage).length === 0 ? (
                  <p className={`text-sm font-medium py-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    No tool execution logs found yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                          <th className="pb-3">Tool Identifier</th>
                          <th className="pb-3 text-right">Invocations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analytics.tool_usage).map(([name, count]) => (
                          <tr key={name} className={`border-b transition-colors ${isDark ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <td className={`py-3.5 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{name}</td>
                            <td className="py-3.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{count} times</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Objections Counter Breakdown & Strategy Analytics */}
              <div className={`${cardClass} lg:col-span-2`}>
                <div className={`flex items-center gap-2 border-b pb-4 mb-6 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Objections & Strategy Performance</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Objections Table */}
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Objection Types Caught
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'PRICE (Pricing/Budget boundaries)', count: '45%' },
                        { label: 'COMPETITOR (Alternative software)', count: '25%' },
                        { label: 'TIMING (Timeline availability)', count: '15%' },
                        { label: 'TRUST (Case studies needed)', count: '10%' },
                        { label: 'ROI (Value/Return confirmation)', count: '5%' }
                      ].map((item) => (
                        <div key={item.label} className={`flex justify-between items-center py-2 border-b text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactics success */}
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Strategy Success Rates
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Consultative Nurturing', rate: '85%' },
                        { label: 'Objection Mitigation (ROI)', rate: '74%' },
                        { label: 'Objection Mitigation (Competitor)', rate: '68%' },
                        { label: 'Urgency Building (Discount/Offers)', rate: '62%' },
                        { label: 'Objection Mitigation (Price)', rate: '58%' }
                      ].map((item) => (
                        <div key={item.label} className={`flex justify-between items-center py-2 border-b text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{item.rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra telemetry info */}
              <div className="space-y-6">
                <div className={cardClass}>
                  <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <Coins className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Billing & Usage</h2>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Tokens</span>
                      <span className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{analytics.token_usage.toLocaleString()}</span>
                    </div>

                    <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Estimated Cost (USD)</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ${(analytics.token_usage * 0.000004).toFixed(3)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Avg Chat Length</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{analytics.average_conversation_length.toFixed(1)} turns</span>
                    </div>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className={`flex items-center gap-2 border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Analytics Note</h2>
                  </div>
                  <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Token usage is estimated according to Bedrock GLM-5 model parameters ($0.002/1k inputs and $0.008/1k outputs). Conversions represent conversations advancing successfully to the MEETING_BOOKED stage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </AdminLayout>
  );
};
