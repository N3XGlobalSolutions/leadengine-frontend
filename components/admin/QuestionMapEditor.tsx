/**
 * QuestionMapEditor — Admin UI for defining the S3 Mapping question map.
 *
 * Features:
 * - Up to 30 admin-defined deterministic questions with quick reply options
 * - Per-option signal level: High / Medium / Low / Auto-Exit (Disqualify)
 * - Auto-Exit toggle shows a custom exit message field
 * - Optional inline table per question (e.g. ROI rate grid for Q20)
 *   - Add / remove columns and rows
 *   - Live rendered HTML table preview
 * - Max 30 questions enforced in UI
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { Plus, X, Trash2, ChevronDown, ChevronUp, Table as TableIcon } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
export type SignalLevel = 'high' | 'medium' | 'low' | 'disqualify';

export interface QuestionMapOption {
  text: string;
  signal: SignalLevel;
  exit_message?: string;
}

export interface QuestionMapTable {
  headers: string[];
  rows: string[][];
}

export interface QuestionMapItem {
  id: string;
  question: string;
  quick_replies: QuestionMapOption[];
  table?: QuestionMapTable | null;
  required?: boolean;
}

export interface QuestionMapConfig {
  question_map: QuestionMapItem[];
}

interface QuestionMapEditorProps {
  value: QuestionMapConfig;
  onChange: (updated: QuestionMapConfig) => void;
}

// ── Signal config ──────────────────────────────────────────────────────────────
const SIGNAL_CONFIG: Record<SignalLevel, { label: string; icon: string; classes: { light: string; dark: string } }> = {
  high: {
    label: 'High', icon: '🟢',
    classes: { light: 'bg-green-50 text-green-700 border-green-300', dark: 'bg-green-900/30 text-green-400 border-green-800' }
  },
  medium: {
    label: 'Medium', icon: '🟡',
    classes: { light: 'bg-amber-50 text-amber-700 border-amber-300', dark: 'bg-amber-900/30 text-amber-400 border-amber-800' }
  },
  low: {
    label: 'Low', icon: '🔴',
    classes: { light: 'bg-red-50 text-red-700 border-red-300', dark: 'bg-red-900/30 text-red-400 border-red-800' }
  },
  disqualify: {
    label: 'Auto-Exit', icon: '⛔',
    classes: { light: 'bg-purple-50 text-purple-700 border-purple-300', dark: 'bg-purple-900/30 text-purple-400 border-purple-800' }
  },
};

const MAX_MAPPED_QUESTIONS = 30;

// ── Helpers ────────────────────────────────────────────────────────────────────
const makeId = (index: number) => `Q${index + 1}`;
const defaultOption = (): QuestionMapOption => ({ text: '', signal: 'high' });
const defaultQuestion = (index: number): QuestionMapItem => ({
  id: makeId(index),
  question: '',
  quick_replies: [defaultOption(), defaultOption()],
  table: null,
  required: true,
});
const emptyTable = (): QuestionMapTable => ({
  headers: ['Column 1', 'Column 2'],
  rows: [['', '']],
});

// ── Shared UI Helpers ──────────────────────────────────────────────────────────
const useSharedStyles = () => {
    const { isDark } = useAdminTheme();
    return {
        isDark,
        inputClass: `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
        }`,
        labelClass: `block text-xs font-semibold mb-1.5 tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`,
        cardClass: `rounded-xl border transition-all duration-200 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`,
    };
};

// ── Sub-component: TableBuilder ────────────────────────────────────────────────
interface TableBuilderProps {
  table: QuestionMapTable;
  onChange: (updated: QuestionMapTable) => void;
}

const TableBuilder: React.FC<TableBuilderProps> = ({ table, onChange }) => {
  const { isDark, inputClass } = useSharedStyles();
  const colCount = table.headers.length;

  const updateHeader = (colIdx: number, val: string) => {
    const headers = [...table.headers];
    headers[colIdx] = val;
    onChange({ ...table, headers });
  };

  const addColumn = () => {
    const headers = [...table.headers, `Column ${colCount + 1}`];
    const rows = table.rows.map(r => [...r, '']);
    onChange({ headers, rows });
  };

  const removeColumn = (colIdx: number) => {
    if (colCount <= 1) return;
    const headers = table.headers.filter((_, i) => i !== colIdx);
    const rows = table.rows.map(r => r.filter((_, i) => i !== colIdx));
    onChange({ headers, rows });
  };

  const addRow = () => {
    const rows = [...table.rows, Array(colCount).fill('')];
    onChange({ ...table, rows });
  };

  const removeRow = (rowIdx: number) => {
    onChange({ ...table, rows: table.rows.filter((_, i) => i !== rowIdx) });
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const rows = table.rows.map((r, ri) => {
      if (ri !== rowIdx) return r;
      const row = [...r];
      row[colIdx] = val;
      return row;
    });
    onChange({ ...table, rows });
  };

  const cellClass = `px-2 py-1 border rounded text-xs w-full focus:outline-none transition-colors ${
    isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className="flex flex-col gap-4">
      {/* Header + column controls */}
      <div className="overflow-x-auto pb-2">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="w-8"></th>
              {table.headers.map((h, ci) => (
                <th key={ci} className="p-1 align-bottom font-medium">
                  <div className="flex items-center gap-1">
                    <input
                      className={`${cellClass} font-semibold ${isDark ? 'bg-indigo-900/30 border-indigo-700 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}
                      value={h}
                      placeholder={`Col ${ci + 1}`}
                      onChange={e => updateHeader(ci, e.target.value)}
                    />
                    {colCount > 1 && (
                      <button
                        onClick={() => removeColumn(ci)}
                        title="Remove column"
                        className={`p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-1 align-bottom">
                <button
                  onClick={addColumn}
                  title="Add column"
                  className={`flex items-center gap-1 px-2 py-1 rounded border border-dashed whitespace-nowrap transition-colors ${isDark ? 'border-indigo-700 text-indigo-400 hover:bg-indigo-900/30' : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'}`}
                >
                  <Plus size={14} /> Col
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri}>
                <td className="p-1 text-center align-middle">
                  <button
                    onClick={() => removeRow(ri)}
                    title="Remove row"
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X size={14} />
                  </button>
                </td>
                {table.headers.map((_, ci) => (
                  <td key={ci} className="p-1">
                    <input
                      className={cellClass}
                      value={row[ci] ?? ''}
                      placeholder="—"
                      onChange={e => updateCell(ri, ci, e.target.value)}
                    />
                  </td>
                ))}
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <div>
        <button
          onClick={addRow}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed transition-colors ${isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          <Plus size={14} /> Add row
        </button>
      </div>

      {/* Live preview */}
      {table.rows.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
            Preview (as shown in chat)
          </div>
          <div className={`overflow-x-auto border rounded-lg p-2 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className={isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}>
                  {table.headers.map((h, ci) => (
                    <th key={ci} className={`p-2 border font-bold ${isDark ? 'border-indigo-800' : 'border-indigo-200'}`}>
                      {h || `Col ${ci + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? (isDark ? 'bg-slate-800' : 'bg-white') : (isDark ? 'bg-slate-800/60' : 'bg-gray-50/50')}>
                    {table.headers.map((_, ci) => (
                      <td key={ci} className={`p-2 border ${isDark ? 'border-slate-700 text-slate-300' : 'border-gray-200 text-gray-700'}`}>
                        {row[ci] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const QuestionMapEditor: React.FC<QuestionMapEditorProps> = ({ value, onChange }) => {
  const { isDark, inputClass, labelClass, cardClass } = useSharedStyles();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [tableExpandedIndex, setTableExpandedIndex] = useState<number | null>(null);

  const questions = value.question_map ?? [];

  // Auto-expand the table editor for the first question that already has a table.
  // Only fires once per mount (ref-guarded) so the user keeps manual control after.
  const hasAutoExpandedTable = useRef(false);
  useEffect(() => {
    if (!hasAutoExpandedTable.current && questions.length > 0) {
      const idx = questions.findIndex(q => !!q.table);
      if (idx !== -1) {
        setTableExpandedIndex(idx);
        hasAutoExpandedTable.current = true;
      }
    }
  }, [questions]);

  // ── Mutators ──────────────────────────────────────────────────────────────
  const updateQuestion = (idx: number, updated: QuestionMapItem) => {
    const next = [...questions];
    next[idx] = { ...updated, id: makeId(idx) };
    onChange({ ...value, question_map: next });
  };

  const addQuestion = () => {
    if (questions.length >= MAX_MAPPED_QUESTIONS) return;
    const next = [...questions, defaultQuestion(questions.length)];
    onChange({ ...value, question_map: next });
    setExpandedIndex(next.length - 1);
  };

  const removeQuestion = (idx: number) => {
    const next = questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, id: makeId(i) }));
    onChange({ ...value, question_map: next });
    setExpandedIndex(null);
  };

  const updateOption = (qIdx: number, oIdx: number, updated: QuestionMapOption) => {
    const q = { ...questions[qIdx] };
    const opts = [...q.quick_replies];
    opts[oIdx] = updated;
    q.quick_replies = opts;
    updateQuestion(qIdx, q);
  };

  const addOption = (qIdx: number) => {
    const q = { ...questions[qIdx] };
    q.quick_replies = [...q.quick_replies, defaultOption()];
    updateQuestion(qIdx, q);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const q = { ...questions[qIdx] };
    q.quick_replies = q.quick_replies.filter((_, i) => i !== oIdx);
    updateQuestion(qIdx, q);
  };

  const toggleTable = (qIdx: number) => {
    const q = { ...questions[qIdx] };
    if (q.table) {
      q.table = null;
      setTableExpandedIndex(null);
    } else {
      q.table = emptyTable();
      setTableExpandedIndex(qIdx);
    }
    updateQuestion(qIdx, q);
  };

  const updateTable = (qIdx: number, table: QuestionMapTable) => {
    updateQuestion(qIdx, { ...questions[qIdx], table });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Map Editor</h3>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Up to {MAX_MAPPED_QUESTIONS} deterministic questions. Any question may include an inline table.
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${questions.length >= MAX_MAPPED_QUESTIONS ? (isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-300') : (isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-300')}`}>
          {questions.length} / {MAX_MAPPED_QUESTIONS}
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((q, qIdx) => {
          const isExpanded = expandedIndex === qIdx;
          const isTableExpanded = tableExpandedIndex === qIdx;
          const hasTable = !!q.table;

          return (
            <div key={q.id} className={`${cardClass} overflow-hidden ${isExpanded ? (isDark ? 'ring-2 ring-indigo-500/50 border-indigo-500 shadow-lg' : 'ring-2 ring-indigo-500/20 border-indigo-500 shadow-md') : ''}`}>
              {/* Collapsible header */}
              <div 
                className={`flex items-center gap-3 p-4 cursor-pointer select-none transition-colors ${isExpanded ? (isDark ? 'bg-slate-800 border-b border-slate-700' : 'bg-gray-50 border-b border-gray-200') : (isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50')}`}
                onClick={() => setExpandedIndex(isExpanded ? null : qIdx)}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold shrink-0">
                  {qIdx + 1}
                </div>
                <div className={`flex-1 font-medium truncate ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                  {q.question || <em className="text-gray-400 dark:text-slate-500">Untitled question</em>}
                </div>
                {hasTable && <span title="Has inline table"><TableIcon size={18} className="text-indigo-500 mx-2" /></span>}
                <div className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">
                  {q.quick_replies.length} option{q.quick_replies.length !== 1 ? 's' : ''}
                </div>
                <button
                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2"
                  onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                  title="Remove question"
                >
                  <Trash2 size={16} />
                </button>
                <div className="text-gray-400 ml-1">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Body */}
              {isExpanded && (
                <div className="p-4 sm:p-5 flex flex-col gap-6">
                  
                  {/* Question text */}
                  <div>
                    <label className={labelClass}>Question Text</label>
                    <input
                      className={inputClass}
                      type="text"
                      placeholder="e.g. What is the primary nature of your business activity?"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, { ...q, question: e.target.value })}
                    />
                  </div>

                  {/* Answer options */}
                  <div>
                    <label className={labelClass}>Answer Options & Signal Levels</label>
                    <div className="flex flex-col gap-3">
                      {q.quick_replies.map((opt, oIdx) => {
                        const signalCfg = SIGNAL_CONFIG[opt.signal];
                        return (
                          <div key={oIdx} className="flex flex-col gap-1.5">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <select
                                className={`px-2 py-2 sm:py-1.5 border rounded-lg text-xs font-semibold cursor-pointer outline-none transition-colors shrink-0 ${isDark ? signalCfg.classes.dark : signalCfg.classes.light}`}
                                value={opt.signal}
                                onChange={(e) =>
                                  updateOption(qIdx, oIdx, { ...opt, signal: e.target.value as SignalLevel })
                                }
                              >
                                {(Object.entries(SIGNAL_CONFIG) as [SignalLevel, typeof SIGNAL_CONFIG[SignalLevel]][]).map(([val, cfg]) => (
                                  <option key={val} value={val}>{cfg.icon} {cfg.label}</option>
                                ))}
                              </select>

                              <input
                                className={`${inputClass} flex-1`}
                                type="text"
                                placeholder={`Option ${oIdx + 1} label...`}
                                value={opt.text}
                                onChange={(e) => updateOption(qIdx, oIdx, { ...opt, text: e.target.value })}
                              />

                              {q.quick_replies.length > 1 && (
                                <button
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800"
                                  onClick={() => removeOption(qIdx, oIdx)}
                                  title="Remove option"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>

                            {/* Auto-exit message input */}
                            {opt.signal === 'disqualify' && (
                              <input
                                className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${isDark ? 'bg-purple-900/20 border-purple-800 text-purple-300 placeholder-purple-500 focus:ring-2 focus:ring-purple-500' : 'bg-purple-50 border-purple-300 text-purple-700 placeholder-purple-400 focus:ring-2 focus:ring-purple-500'}`}
                                type="text"
                                placeholder="⛔ Custom exit message shown to user when they choose this option..."
                                value={opt.exit_message ?? ''}
                                onChange={(e) =>
                                  updateOption(qIdx, oIdx, { ...opt, exit_message: e.target.value })
                                }
                              />
                            )}
                          </div>
                        );
                      })}

                      <button
                        className={`self-start flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-dashed transition-colors ${isDark ? 'text-slate-400 border-slate-600 hover:text-slate-300 hover:bg-slate-800' : 'text-gray-600 border-gray-300 hover:text-gray-800 hover:bg-gray-50'}`}
                        onClick={() => addOption(qIdx)}
                      >
                        <Plus size={14} /> Add option
                      </button>
                    </div>
                  </div>

                  {/* Inline Table Section */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/30 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                       <div>
                         <label className={`${labelClass} !mb-0`}>Inline Table</label>
                         <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Display a formatted table before the quick-replies.</p>
                       </div>
                       <button
                         className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded hover:shadow-sm transition-all border ${hasTable ? (isDark ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100') : (isDark ? 'bg-transparent text-slate-300 border-slate-600 hover:bg-slate-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}`}
                         onClick={() => toggleTable(qIdx)}
                       >
                         <TableIcon size={14} />
                         {hasTable ? 'Remove table' : 'Attach a table'}
                       </button>
                    </div>

                    {hasTable && q.table && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <div
                          className="flex items-center justify-between mb-3 cursor-pointer group select-none"
                          onClick={() => setTableExpandedIndex(isTableExpanded ? null : qIdx)}
                        >
                          <span className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isDark ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-indigo-600 group-hover:text-indigo-700'}`}>
                            {isTableExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {isTableExpanded ? 'Hide table editor' : 'Edit table contents'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500 border border-gray-200'}`}>
                            {q.table.headers.length} cols × {q.table.rows.length} rows
                          </span>
                        </div>

                        {isTableExpanded && (
                          <div className={`mt-3 p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <TableBuilder
                              table={q.table}
                              onChange={(updated) => updateTable(qIdx, updated)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add question */}
      <button
        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed font-semibold text-sm transition-all duration-200 ${questions.length >= MAX_MAPPED_QUESTIONS ? (isDark ? 'border-slate-700 text-slate-500 bg-slate-800/30 cursor-not-allowed' : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed') : (isDark ? 'border-indigo-700/50 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500 hover:bg-slate-800' : 'border-indigo-300 text-indigo-600 hover:text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50')}`}
        onClick={addQuestion}
        disabled={questions.length >= MAX_MAPPED_QUESTIONS}
      >
        <Plus size={18} />
        Add Question {questions.length >= MAX_MAPPED_QUESTIONS && '(limit reached)'}
      </button>

      {/* Info box */}
      <div className={`p-4 rounded-xl border text-sm leading-relaxed ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-gray-600'}`}>
        <strong className={isDark ? 'text-white' : 'text-gray-900'}>{questions.length} question{questions.length !== 1 ? 's' : ''}</strong> defined.
        <br/><br/>
        <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
           <li><strong>Signal scoring:</strong> 🟢 High (+3) | 🟡 Medium (+2) | 🔴 Low (+1) | ⛔ Auto-Exit (immediate)</li>
           <li><strong>Tables:</strong> Questions with tables render an HTML table in the chat before the quick-reply options.</li>
        </ul>
      </div>
    </div>
  );
};

export default QuestionMapEditor;
