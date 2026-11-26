import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Layers, Clock, Timer, Megaphone, CheckCircle2, AlertTriangle, RefreshCw, FileCheck2, Type } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { CampaignCreate, WhatsAppTemplate } from '../../../types/outbound';
import { createCampaign, listWhatsAppTemplates } from '../../../services/outboundService';
import { TemplateParamEditor, fillTemplate, sampleParams } from '../../../components/admin/outbound/TemplateParamEditor';

export const CampaignCreatePage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();

  const [form, setForm] = useState<CampaignCreate>({
    name: '',
    message_type: 'template',
    message_template: '',
    template_name: null,
    template_language: null,
    template_body: '',
    template_params: [],
    batch_size: 10,
    message_delay_seconds: 5,
    batch_delay_seconds: 60,
  });
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templatesError, setTemplatesError] = useState('');
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTemplates = async () => {
    if (!clientId) return;
    setTemplatesLoading(true);
    setTemplatesError('');
    try {
      const res = await listWhatsAppTemplates(clientId);
      setTemplates(res.templates || []);
      if (res.error) setTemplatesError(res.error);
    } catch (e: any) {
      setTemplatesError(e?.response?.data?.detail || 'Could not load WhatsApp templates');
    }
    setTemplatesLoading(false);
  };

  useEffect(() => { loadTemplates(); }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = useMemo(
    () => templates.find((t) => t.name === form.template_name && t.language === form.template_language) || null,
    [templates, form.template_name, form.template_language]
  );

  const chooseTemplate = (key: string) => {
    const t = templates.find((x) => `${x.name}|${x.language}` === key);
    if (!t) {
      setForm({ ...form, template_name: null, template_language: null, template_body: '', template_params: [] });
      return;
    }
    setForm({
      ...form,
      template_name: t.name,
      template_language: t.language,
      template_body: t.body,
      template_params: Array.from({ length: t.body_param_count }, (_, i) => (i === 0 ? '{{name}}' : '')),
    });
  };

  const isTemplate = form.message_type === 'template';
  const paramsComplete = !isTemplate || (form.template_params || []).every((p) => p.trim());
  const canSubmit = form.name.trim() && (isTemplate ? !!selected && paramsComplete : (form.message_template || '').trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !canSubmit) return;
    setSaving(true);
    setError('');
    try {
      const payload: CampaignCreate = isTemplate
        ? { ...form, message_template: '' }
        : { ...form, template_name: null, template_language: null, template_body: '', template_params: [] };
      const campaign = await createCampaign(clientId, payload);
      navigate(`/admin/clients/${clientId}/outbound/campaigns/${campaign.campaign_id}`);
    } catch (e: any) {
      setError(e?.response?.data?.detail?.[0]?.msg || e?.response?.data?.detail || 'Failed to create campaign');
    }
    setSaving(false);
  };

  const preview = isTemplate
    ? (selected ? fillTemplate(selected.body, sampleParams(form.template_params || [])) : '')
    : (form.message_template || '').replace(/\{\{name\}\}/g, 'Priya').replace(/\{\{phone\}\}/g, '+919876543210');

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`;
  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
  const cardClass = `rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200'}`;
  const muted = isDark ? 'text-slate-400' : 'text-gray-500';

  const typeButton = (type: 'template' | 'text', icon: React.ReactNode, title: string, desc: string) => (
    <button
      type="button"
      onClick={() => setForm({ ...form, message_type: type })}
      className={`flex-1 text-left p-4 rounded-xl border-2 transition-all ${
        form.message_type === type
          ? 'border-indigo-500 bg-indigo-500/5'
          : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`flex items-center gap-2 font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{icon} {title}</div>
      <p className={`text-xs mt-1 ${muted}`}>{desc}</p>
    </button>
  );

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(`/admin/clients/${clientId}/outbound`)}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Campaign</h1>
          <p className={`text-sm ${muted}`}>Send a WhatsApp message to a list of leads; the AI handles their replies</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{String(error)}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`${cardClass} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Megaphone size={20} className="text-indigo-500" /> Campaign Details
            </h2>
            <label className={labelClass}>Campaign Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., B.Ed admissions follow-up – Nov"
              className={inputClass}
              required
            />
          </div>

          <div className={`${cardClass} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Send size={20} className="text-purple-500" /> Message
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {typeButton('template', <FileCheck2 size={16} className="text-emerald-500" />, 'Approved template (recommended)',
                'Reaches every lead, including people who never messaged you.')}
              {typeButton('text', <Type size={16} className="text-amber-500" />, 'Free text',
                'Only delivered to people who messaged you in the last 24 hours.')}
            </div>

            {isTemplate ? (
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={labelClass}>WhatsApp template *</label>
                    <select
                      value={selected ? `${selected.name}|${selected.language}` : ''}
                      onChange={(e) => chooseTemplate(e.target.value)}
                      className={inputClass}
                      disabled={templatesLoading}
                    >
                      <option value="">{templatesLoading ? 'Loading approved templates...' : 'Select an approved template'}</option>
                      {templates.map((t) => (
                        <option key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`} disabled={!t.supported}>
                          {t.name} ({t.language}) · {t.category}{t.supported ? '' : ' · not supported'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={loadTemplates} title="Reload templates"
                    className={`p-3 rounded-xl border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <RefreshCw size={16} className={templatesLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                {templatesError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>{templatesError}</span>
                  </div>
                )}
                {!templatesLoading && !templatesError && templates.length === 0 && (
                  <p className={`text-xs ${muted}`}>No approved templates found. Create one in WhatsApp Manager and wait for approval.</p>
                )}
                {selected && selected.body_param_count > 0 && (
                  <TemplateParamEditor
                    count={selected.body_param_count}
                    values={form.template_params || []}
                    onChange={(values) => setForm({ ...form, template_params: values })}
                  />
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>WhatsApp only delivers free text to people who messaged your business number in the last 24 hours. For new leads, use an approved template.</span>
                </div>
                <label className={labelClass}>Message text *</label>
                <textarea
                  rows={6}
                  value={form.message_template}
                  onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                  placeholder={`Hello {{name}},\n\nThanks for your enquiry. Would you like more details?`}
                  className={inputClass}
                />
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <span className={`text-xs ${muted}`}>Insert:</span>
                  {['{{name}}', '{{phone}}'].map((v) => (
                    <button key={v} type="button"
                      onClick={() => setForm({ ...form, message_template: (form.message_template || '') + v })}
                      className={`px-2 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {preview && (
              <div className="mt-5">
                <p className={`text-xs font-medium mb-2 ${muted}`}>Preview (sample lead “Priya”)</p>
                <div className={`max-w-md p-3 rounded-2xl rounded-tl-none text-sm whitespace-pre-wrap shadow-sm ${isDark ? 'bg-emerald-900/40 text-emerald-50' : 'bg-emerald-50 text-gray-800 border border-emerald-100'}`}>
                  {selected?.header_text && <div className="font-semibold mb-1">{selected.header_text}</div>}
                  {preview}
                  {selected?.footer && <div className={`text-xs mt-2 ${muted}`}>{selected.footer}</div>}
                  {selected && selected.buttons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.buttons.map((b) => <span key={b} className="px-2 py-1 rounded-lg bg-white/70 dark:bg-white/10 text-xs font-semibold text-sky-600">{b}</span>)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={`${cardClass} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Layers size={20} className="text-cyan-500" /> Sending Speed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                ['batch_size', 'Batch size', <Layers size={14} />, 1, 100, 'Messages per batch'],
                ['message_delay_seconds', 'Message delay', <Clock size={14} />, 1, 60, 'Seconds between messages'],
                ['batch_delay_seconds', 'Batch delay', <Timer size={14} />, 10, 600, 'Seconds between batches'],
              ] as const).map(([key, label, icon, min, max, hint]) => (
                <div key={key}>
                  <label className={labelClass}><span className="flex items-center gap-1.5">{icon} {label}</span></label>
                  <input
                    type="number" min={min} max={max}
                    value={form[key] as number}
                    onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) || min })}
                    className={inputClass}
                  />
                  <p className={`text-xs mt-1.5 ${muted}`}>{hint} ({min}-{max})</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${cardClass} p-6`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Summary</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Name', form.name || '—'],
                ['Message type', isTemplate ? 'Approved template' : 'Free text'],
                ['Template', isTemplate ? (selected ? `${selected.name} (${selected.language})` : 'Not selected') : '—'],
                ['Speed', `${form.batch_size}/batch · ${form.message_delay_seconds}s · ${form.batch_delay_seconds}s`],
              ].map(([label, value]) => (
                <div key={label} className={`flex justify-between gap-3 ${muted}`}>
                  <span>{label}</span>
                  <span className={`font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                </div>
              ))}
              <div className={`flex justify-between ${muted}`}>
                <span>Ready</span>
                <span className={`font-medium ${canSubmit ? 'text-green-500' : 'text-amber-500'}`}>
                  {canSubmit ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={14} /> Yes</span> : 'Complete the message'}
                </span>
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-6`}>
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Next steps</h3>
            <ol className={`text-xs space-y-2 ${muted}`}>
              {['Create the campaign', 'Upload your lead file (CSV/XLSX/TXT)', 'Review leads', 'Start: replies are handled by the AI'].map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};
