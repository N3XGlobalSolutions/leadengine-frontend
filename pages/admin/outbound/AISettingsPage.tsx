import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Bot, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { getAISettings, updateAISettings, OutboundAISettings } from '../../../services/outboundAIService';

const MAX_INSTRUCTIONS_LENGTH = 6000;

const INSTRUCTIONS_PLACEHOLDER = `Example:
You are Priya from ABC Academy, following up with people who enquired about our teacher-training courses.

Conversation flow:
1. Greet them by name and ask which course they are interested in (B.Ed, D.El.Ed or Montessori).
2. Ask for their highest qualification.
3. Ask whether they prefer online or offline classes, and their city.
4. Ask when they would like to start.

Qualification: the lead is qualified if they are a graduate and want to start within 3 months.
If qualified, offer a call with a counsellor. If not, thank them and say the team will keep them posted.

Rules: don't quote fees; say a counsellor will share the fee details.`;

export const AISettingsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { user } = useAdminAuth();

  const [settings, setSettings] = useState<OutboundAISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await getAISettings(clientId);
      // Existing clients only have the old business summary: start the new
      // Prompt / Instructions field from it so nothing they wrote is lost.
      setSettings({
        ...data,
        agent_instructions: data.agent_instructions || data.business_summary || '',
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load AI settings');
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !settings) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateAISettings(clientId, settings);
      setSuccess('Outbound AI settings updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update AI settings');
    }
    setSaving(false);
  };

  const handleToggle = (key: keyof OutboundAISettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleChange = (key: keyof OutboundAISettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const cardClass = `rounded-2xl border p-6 backdrop-blur-sm ${
    isDark ? 'bg-slate-800/80 border-slate-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'
  }`;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-2 ${
    isDark ? 'text-slate-400' : 'text-gray-500'
  }`;

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
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Outbound AI Settings
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Configure voice identity, tone parameters, and capability modules
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <OutboundTabs />

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        settings && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle panels: settings fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className={cardClass}>
                <div className="flex items-center gap-2 border-b pb-4 mb-6 border-slate-700/50">
                  <Bot className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-bold">Agent Persona Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Agent Name</label>
                    <input
                      type="text"
                      required
                      value={settings.ai_name}
                      onChange={(e) => handleChange('ai_name', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Sarah Jennings"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Primary Language</label>
                    <select
                      value={settings.primary_language}
                      onChange={(e) => handleChange('primary_language', e.target.value)}
                      className={inputClass}
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="pt">Portuguese</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Sales Tone</label>
                    <select
                      value={settings.sales_tone}
                      onChange={(e) => handleChange('sales_tone', e.target.value)}
                      className={inputClass}
                    >
                      <option value="Professional and informative">Professional and informative</option>
                      <option value="Friendly, conversational and warm">Friendly, conversational and warm</option>
                      <option value="Direct, assertive and value-driven">Direct, assertive and value-driven</option>
                      <option value="Consultative, analytical and helper-driven">Consultative, analytical and helper-driven</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Conversation Style</label>
                    <input
                      type="text"
                      value={settings.conversation_style}
                      onChange={(e) => handleChange('conversation_style', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Natural text flow with occasional emoji"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className={labelClass}>Target Audience Profile</label>
                  <input
                    type="text"
                    value={settings.target_audience}
                    onChange={(e) => handleChange('target_audience', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Small business owners seeking CRM solutions"
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <label className={labelClass}>Prompt / Instructions</label>
                    <span className={`text-[10px] ${
                      (settings.agent_instructions?.length || 0) > MAX_INSTRUCTIONS_LENGTH * 0.9
                        ? 'text-amber-500'
                        : 'text-slate-400'
                    }`}>
                      {settings.agent_instructions?.length || 0} / {MAX_INSTRUCTIONS_LENGTH}
                    </span>
                  </div>
                  <textarea
                    rows={14}
                    required
                    maxLength={MAX_INSTRUCTIONS_LENGTH}
                    value={settings.agent_instructions || ''}
                    onChange={(e) => handleChange('agent_instructions', e.target.value)}
                    className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
                    placeholder={INSTRUCTIONS_PLACEHOLDER}
                  />
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    The main instruction for the WhatsApp AI: who it is, the conversation flow, which questions to
                    ask and how to qualify a lead. Company facts are answered from your uploaded knowledge base, and
                    products or meetings are only looked up when the customer asks for them. Shorter, clear
                    instructions use fewer tokens per message.
                  </p>
                </div>
              </div>
            </div>

            {/* Right panel: toggles and bounds */}
            <div className="space-y-6">
              {/* Toggles */}
              <div className={cardClass}>
                <div className="flex items-center gap-2 border-b pb-4 mb-6 border-slate-700/50">
                  <Bot className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-bold">Capabilities & Limits</h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Meeting Scheduling</h3>
                      <p className="text-xs text-slate-400">Allow agent to check and book slots</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('enable_scheduling')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.enable_scheduling ? 'bg-indigo-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          settings.enable_scheduling ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Product Search</h3>
                      <p className="text-xs text-slate-400">Allow agent to query catalog inventory</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('enable_product_search')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.enable_product_search ? 'bg-indigo-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          settings.enable_product_search ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Document RAG Search</h3>
                      <p className="text-xs text-slate-400">Search company files for grounding answers</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('enable_knowledge_search')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.enable_knowledge_search ? 'bg-indigo-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          settings.enable_knowledge_search ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-700/50 pt-6">
                  <label className={labelClass}>Maximum Response Length</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={50}
                      max={1500}
                      value={settings.max_response_length}
                      onChange={(e) => handleChange('max_response_length', parseInt(e.target.value))}
                      className={inputClass}
                    />
                    <span className="text-xs text-slate-400">characters</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Prevents AI from generating overly long paragraphs in WhatsApp chats. Recommended limit: 400-600.
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20"
              >
                <Save size={18} />
                {saving ? 'Saving changes...' : 'Save AI Configuration'}
              </button>
            </div>
          </form>
        )
      )}
    </AdminLayout>
  );
};
