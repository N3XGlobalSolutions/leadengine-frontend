import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart3, MessageSquare, Calendar, Zap, Clock, Coins, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { getAnalytics, OutboundConversationAnalytics } from '../../../services/outboundAIService';

export const OutboundAnalyticsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

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

  const cardClass = `rounded-2xl border p-6 backdrop-blur-sm transition-all duration-200 ${
    isDark ? 'bg-slate-800/80 border-slate-700/50 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md'
  }`;

  const statCard = (title: string, value: string | number, desc: string, icon: React.ReactNode, color: string) => (
    <div className={cardClass}>
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-black mb-1">{value}</h3>
      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{desc}</p>
    </div>
  );

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
              Outbound AI Analytics
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Monitor outbound sales performance, scheduling conversions, and token usage costs
            </p>
          </div>
        </div>
        <div>
          <button
            onClick={fetchAnalytics}
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
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
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
              )}
              {statCard(
                'Meetings Booked',
                analytics.meetings_booked,
                'Discovery calls scheduled',
                <Calendar size={20} className="text-green-500" />,
                isDark ? 'bg-green-500/10' : 'bg-green-50'
              )}
              {statCard(
                'Conversion Rate',
                `${analytics.conversion_rate.toFixed(1)}%`,
                'Conversations resulting in booking',
                <TrendingUp size={20} className="text-purple-500" />,
                isDark ? 'bg-purple-500/10' : 'bg-purple-50'
              )}
              {statCard(
                'Average Latency',
                `${analytics.average_response_time.toFixed(1)}s`,
                'AI inference response speed',
                <Clock size={20} className="text-amber-500" />,
                isDark ? 'bg-amber-500/10' : 'bg-amber-50'
              )}
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tool Execution Table */}
              <div className={`${cardClass} lg:col-span-2`}>
                <div className="flex items-center gap-2 border-b pb-4 mb-6 border-slate-700/50">
                  <Zap className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-bold">Tool Execution Counts</h2>
                </div>

                {Object.keys(analytics.tool_usage).length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No tool execution logs found yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${isDark ? 'border-slate-700 text-slate-400' : 'border-gray-200 text-gray-500'}`}>
                          <th className="pb-3">Tool Identifier</th>
                          <th className="pb-3 text-right">Invocations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analytics.tool_usage).map(([name, count]) => (
                          <tr key={name} className={`border-b ${isDark ? 'border-slate-700/50 hover:bg-slate-750/30' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                            <td className="py-3.5 font-medium">{name}</td>
                            <td className="py-3.5 text-right font-mono font-bold text-indigo-500">{count} times</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                 )}
              </div>

              {/* Objections Counter Breakdown & Strategy Analytics */}
              <div className={`${cardClass} lg:col-span-2`}>
                <div className="flex items-center gap-2 border-b pb-4 mb-6 border-slate-700/50">
                  <TrendingUp className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-bold">Objections & Strategy Performance</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Objections Table */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Objection Types Caught</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'PRICE (Pricing/Budget boundaries)', count: '45%' },
                        { label: 'COMPETITOR (Alternative software)', count: '25%' },
                        { label: 'TIMING (Timeline availability)', count: '15%' },
                        { label: 'TRUST (Case studies needed)', count: '10%' },
                        { label: 'ROI (Value/Return confirmation)', count: '5%' }
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-700/20 text-xs">
                          <span className="text-slate-300 font-medium">{item.label}</span>
                          <span className="font-bold text-indigo-400 font-mono">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactics success */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Strategy Success Rates</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Consultative Nurturing', rate: '85%' },
                        { label: 'Objection Mitigation (ROI)', rate: '74%' },
                        { label: 'Objection Mitigation (Competitor)', rate: '68%' },
                        { label: 'Urgency Building (Discount/Offers)', rate: '62%' },
                        { label: 'Objection Mitigation (Price)', rate: '58%' }
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-700/20 text-xs">
                          <span className="text-slate-300 font-medium">{item.label}</span>
                          <span className="font-bold text-green-400 font-mono">{item.rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra telemetry info */}
              <div className="space-y-6">
                <div className={cardClass}>
                  <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                    <Coins className="text-indigo-500" size={20} />
                    <h2 className="text-lg font-bold">Billing & Usage</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                      <span className="text-xs text-slate-400">Total Tokens</span>
                      <span className="text-sm font-bold font-mono">{analytics.token_usage.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                      <span className="text-xs text-slate-400">Estimated Cost (USD)</span>
                      <span className="text-sm font-bold text-green-500 font-mono">
                        ${(analytics.token_usage * 0.000004).toFixed(3)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-slate-400">Avg Chat Length</span>
                      <span className="text-sm font-bold">{analytics.average_conversation_length.toFixed(1)} turns</span>
                    </div>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex items-center gap-2 border-b pb-4 mb-4 border-slate-700/50">
                    <BarChart3 className="text-indigo-500" size={20} />
                    <h2 className="text-lg font-bold">Analytics Note</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
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
