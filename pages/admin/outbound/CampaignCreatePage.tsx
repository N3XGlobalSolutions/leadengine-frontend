import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Layers, Clock, Timer, Eye, Sparkles } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { CampaignCreate } from '../../../types/outbound';
import { createCampaign } from '../../../services/outboundService';

export const CampaignCreatePage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

  const [form, setForm] = useState<CampaignCreate>({
    name: '',
    message_template: '',
    batch_size: 10,
    message_delay_seconds: 5,
    batch_delay_seconds: 60,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !form.name.trim()) return;

    setSaving(true);
    setError('');
    try {
      const campaign = await createCampaign(clientId, form);
      navigate(`/admin/clients/${clientId}/outbound/campaigns/${campaign.campaign_id}`);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create campaign');
    }
    setSaving(false);
  };

  const renderPreview = () => {
    const rendered = (form.message_template || '')
      .replace(/\{\{name\}\}/g, 'John Doe')
      .replace(/\{\{phone\}\}/g, '+919876543210');
    return rendered || 'Enter a message template above to see the preview...';
  };

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`;
  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
  const cardClass = `rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200'}`;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(`/admin/clients/${clientId}/outbound`)}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create Campaign
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Set up a new outbound messaging campaign
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Name */}
          <div className={`${cardClass} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles size={20} className="text-indigo-500" /> Campaign Details
            </h2>
            <div>
              <label className={labelClass}>Campaign Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Summer Promotion 2025"
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Message Template */}
          <div className={`${cardClass} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Send size={20} className="text-purple-500" /> Message Template
            </h2>
            <div>
              <label className={labelClass}>Template Body</label>
              <textarea
                rows={6}
                value={form.message_template}
                onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                placeholder={`Hello {{name}},\n\nWe are reaching out regarding our latest offer.\n\nWould you like more information?`}
                className={inputClass}
              />
              <div className={`mt-2 flex flex-wrap gap-2`}>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Available variables:</span>
                {['{{name}}', '{{phone}}'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, message_template: form.message_template + v })}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${isDark ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Preview */}
            {form.message_template && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`text-sm flex items-center gap-1.5 font-medium ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                >
                  <Eye size={14} /> {showPreview ? 'Hide' : 'Show'} Preview
                </button>
                {showPreview && (
                  <div className={`mt-3 p-4 rounded-xl border-l-4 border-indigo-500 ${isDark ? 'bg-slate-900/50' : 'bg-indigo-50/50'}`}>
                    <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      Preview (sample data):
                    </p>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                      {renderPreview()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Batch Settings */}
          <div className={`${cardClass} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Layers size={20} className="text-cyan-500" /> Batch Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Layers size={14} /> Batch Size</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.batch_size}
                  onChange={(e) => setForm({ ...form, batch_size: parseInt(e.target.value) || 10 })}
                  className={inputClass}
                />
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Messages per batch (1-100)
                </p>
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Clock size={14} /> Message Delay</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.message_delay_seconds}
                  onChange={(e) => setForm({ ...form, message_delay_seconds: parseInt(e.target.value) || 5 })}
                  className={inputClass}
                />
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Seconds between messages
                </p>
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Timer size={14} /> Batch Delay</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={form.batch_delay_seconds}
                  onChange={(e) => setForm({ ...form, batch_delay_seconds: parseInt(e.target.value) || 60 })}
                  className={inputClass}
                />
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Seconds between batches
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className={`${cardClass} p-6`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Campaign Summary</h3>
            <div className="space-y-3">
              <div className={`flex justify-between text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>Name</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{form.name || '—'}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>Batch Size</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{form.batch_size}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>Msg Delay</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{form.message_delay_seconds}s</span>
              </div>
              <div className={`flex justify-between text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>Batch Delay</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{form.batch_delay_seconds}s</span>
              </div>
              <div className={`flex justify-between text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>Template</span>
                <span className={`font-medium ${form.message_template ? 'text-green-500' : isDark ? 'text-slate-600' : 'text-gray-300'}`}>
                  {form.message_template ? '✓ Set' : '✕ Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className={`${cardClass} p-6`}>
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Next Steps</h3>
            <ol className={`text-xs space-y-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">1</span>
                Create campaign
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">2</span>
                Upload lead file (CSV/XLSX/TXT)
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">3</span>
                Review leads & set template
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">4</span>
                Start campaign
              </li>
            </ol>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};
