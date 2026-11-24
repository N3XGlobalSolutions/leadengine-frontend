import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { OutboundTabs } from '../../../components/admin/outbound/OutboundTabs';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { getCalendarSettings, updateCalendarSettings, testCalendarConnection, OutboundCalendarSettings } from '../../../services/outboundAIService';

export const CalendarSettingsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { user } = useAdminAuth();

  const [settings, setSettings] = useState<OutboundCalendarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await getCalendarSettings(clientId);
      setSettings(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load calendar settings');
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
    setTestResult(null);
    try {
      await updateCalendarSettings(clientId, settings);
      setSuccess('Calendar settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update calendar settings');
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    if (!clientId) return;
    setTesting(true);
    setError('');
    setSuccess('');
    setTestResult(null);
    try {
      const res = await testCalendarConnection(clientId);
      if (res.connected) {
        setTestResult('success');
        setSuccess('OAuth connection tested successfully. Google Calendar is fully operational!');
      } else {
        setTestResult('failed');
        setError('Connection failed. Please verify your Client ID, Secret, and Refresh Token.');
      }
    } catch (e: any) {
      setTestResult('failed');
      setError(e?.response?.data?.detail || 'Connection test failed with API error.');
    }
    setTesting(false);
  };

  const handleDayToggle = (day: string) => {
    if (!settings) return;
    const days = [...settings.working_days];
    const index = days.indexOf(day);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    setSettings({ ...settings, working_days: days });
  };

  const handleChange = (key: keyof OutboundCalendarSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
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

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
              Calendar Integration
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Synchronize booking accounts, define working availability limits, and test API credentials
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
            {/* Credentials Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className={cardClass}>
                <div className="flex items-center gap-2 border-b pb-4 mb-6 border-slate-700/50">
                  <KeyRound className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-bold">Google API OAuth Credentials</h2>
                </div>

                <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  To enable automated scheduling, configure Google Calendar API OAuth details.
                  Ensure you request offline scopes to obtain a persistent refresh token.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Google Client ID</label>
                    <input
                      type="text"
                      value={settings.google_client_id || ''}
                      onChange={(e) => handleChange('google_client_id', e.target.value)}
                      className={inputClass}
                      placeholder="12345-abc.apps.googleusercontent.com"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Google Client Secret</label>
                    <input
                      type="password"
                      value={settings.google_client_secret || ''}
                      onChange={(e) => handleChange('google_client_secret', e.target.value)}
                      className={inputClass}
                      placeholder="••••••••••••••••••••••••"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>OAuth Refresh Token</label>
                    <input
                      type="password"
                      value={settings.google_refresh_token || ''}
                      onChange={(e) => handleChange('google_refresh_token', e.target.value)}
                      className={inputClass}
                      placeholder="••••••••••••••••••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Calendar ID</label>
                      <input
                        type="text"
                        value={settings.calendar_id}
                        onChange={(e) => handleChange('calendar_id', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Account Timezone</label>
                      <input
                        type="text"
                        value={settings.timezone}
                        onChange={(e) => handleChange('timezone', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Asia/Kolkata, America/New_York"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability and limits */}
            <div className="space-y-6">
              <div className={cardClass}>
                <div className="flex items-center gap-2 border-b pb-4 mb-6 border-slate-700/50">
                  <Calendar className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-bold">Agent Availability Settings</h2>
                </div>

                <div>
                  <label className={labelClass}>Working Days</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {weekDays.map((day) => {
                      const selected = settings.working_days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                            selected
                              ? 'bg-indigo-600 text-white'
                              : isDark
                              ? 'bg-slate-700 text-slate-400 hover:bg-slate-650'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-250'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className={labelClass}>Hours Start</label>
                    <input
                      type="text"
                      value={settings.working_hours_start}
                      onChange={(e) => handleChange('working_hours_start', e.target.value)}
                      className={inputClass}
                      placeholder="09:00"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Hours End</label>
                    <input
                      type="text"
                      value={settings.working_hours_end}
                      onChange={(e) => handleChange('working_hours_end', e.target.value)}
                      className={inputClass}
                      placeholder="17:00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-700/50 pt-6">
                  <div>
                    <label className={labelClass}>Duration (min)</label>
                    <input
                      type="number"
                      value={settings.meeting_duration}
                      onChange={(e) => handleChange('meeting_duration', parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Buffer (min)</label>
                    <input
                      type="number"
                      value={settings.buffer}
                      onChange={(e) => handleChange('buffer', parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={saving || testing}
                  className={`flex items-center gap-2 w-full justify-center px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm bg-white'
                  }`}
                >
                  <KeyRound size={16} />
                  {testing ? 'Testing connection...' : 'Test OAuth Connection'}
                </button>

                <button
                  type="submit"
                  disabled={saving || testing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Save size={18} />
                  {saving ? 'Saving changes...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </form>
        )
      )}
    </AdminLayout>
  );
};
