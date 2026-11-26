import React from 'react';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';

/** Fill {{1}}, {{2}}... in a template body. */
export const fillTemplate = (body: string, params: string[]): string =>
  (body || '').replace(/\{\{(\d+)\}\}/g, (match, n) => {
    const value = params[parseInt(n, 10) - 1];
    return value ? value : match;
  });

/** Sample values used for the preview. */
export const sampleParams = (params: string[]): string[] =>
  params.map((p) => (p || '').replace(/\{\{name\}\}/g, 'Priya').replace(/\{\{phone\}\}/g, '+919876543210'));

interface Props {
  count: number;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

/** Map each template variable to the lead's name, phone or fixed text. */
export const TemplateParamEditor: React.FC<Props> = ({ count, values, onChange, disabled }) => {
  const { isDark } = useAdminTheme();
  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`;

  const setValue = (index: number, value: string) => {
    const next = Array.from({ length: count }, (_, i) => values[i] || '');
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Fill the template variables</p>
      {Array.from({ length: count }, (_, i) => {
        const value = values[i] || '';
        const mode = value === '{{name}}' ? 'name' : value === '{{phone}}' ? 'phone' : 'custom';
        return (
          <div key={i} className="grid grid-cols-[3rem_9rem_1fr] gap-2 items-center">
            <span className="font-mono text-xs font-bold text-indigo-500">{`{{${i + 1}}}`}</span>
            <select
              value={mode}
              disabled={disabled}
              onChange={(e) => setValue(i, e.target.value === 'name' ? '{{name}}' : e.target.value === 'phone' ? '{{phone}}' : '')}
              className={inputClass}
            >
              <option value="name">Lead name</option>
              <option value="phone">Lead phone</option>
              <option value="custom">Fixed text</option>
            </select>
            {mode === 'custom' ? (
              <input
                value={value}
                disabled={disabled}
                onChange={(e) => setValue(i, e.target.value)}
                placeholder="Text for every lead"
                className={inputClass}
              />
            ) : (
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {mode === 'name' ? 'Uses each lead’s name (“there” if missing)' : 'Uses each lead’s phone number'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
