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

import React, { useState } from 'react';

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
const SIGNAL_CONFIG: Record<SignalLevel, { label: string; color: string; bg: string; border: string; icon: string }> = {
  high:        { label: 'High',      color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '🟢' },
  medium:      { label: 'Medium',    color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: '🟡' },
  low:         { label: 'Low',       color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: '🔴' },
  disqualify:  { label: 'Auto-Exit', color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd', icon: '⛔' },
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

// ── Sub-component: TableBuilder ────────────────────────────────────────────────
interface TableBuilderProps {
  table: QuestionMapTable;
  onChange: (updated: QuestionMapTable) => void;
}

const TableBuilder: React.FC<TableBuilderProps> = ({ table, onChange }) => {
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

  const cellStyle: React.CSSProperties = {
    padding: '4px 6px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header + column controls */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '24px' }} />
              {table.headers.map((h, ci) => (
                <th key={ci} style={{ padding: '4px', verticalAlign: 'bottom' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      style={{ ...cellStyle, fontWeight: 700, background: '#f0fdf4', borderColor: '#86efac' }}
                      value={h}
                      placeholder={`Col ${ci + 1}`}
                      onChange={e => updateHeader(ci, e.target.value)}
                    />
                    {colCount > 1 && (
                      <button
                        onClick={() => removeColumn(ci)}
                        title="Remove column"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px', flexShrink: 0 }}
                      >×</button>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ padding: '4px' }}>
                <button
                  onClick={addColumn}
                  title="Add column"
                  style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '6px', cursor: 'pointer', color: '#6366f1', fontSize: '12px', padding: '2px 8px', whiteSpace: 'nowrap' }}
                >+ col</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri}>
                <td style={{ padding: '4px', textAlign: 'center' }}>
                  <button
                    onClick={() => removeRow(ri)}
                    title="Remove row"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}
                  >×</button>
                </td>
                {table.headers.map((_, ci) => (
                  <td key={ci} style={{ padding: '4px' }}>
                    <input
                      style={cellStyle}
                      value={row[ci] ?? ''}
                      placeholder="—"
                      onChange={e => updateCell(ri, ci, e.target.value)}
                    />
                  </td>
                ))}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <button
        onClick={addRow}
        style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #d1d5db', borderRadius: '6px', cursor: 'pointer', color: '#6b7280', fontSize: '12px', padding: '4px 12px' }}
      >+ Add row</button>

      {/* Live preview */}
      {table.rows.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Preview (as shown in chat)
          </div>
          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', background: '#f9fafb' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
              <thead>
                <tr style={{ background: '#eff6ff' }}>
                  {table.headers.map((h, ci) => (
                    <th key={ci} style={{ padding: '6px 10px', border: '1px solid #bfdbfe', textAlign: 'left', fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap' }}>{h || `Col ${ci + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8faff' }}>
                    {table.headers.map((_, ci) => (
                      <td key={ci} style={{ padding: '5px 10px', border: '1px solid #e5e7eb', color: '#374151' }}>{row[ci] || '—'}</td>
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [tableExpandedIndex, setTableExpandedIndex] = useState<number | null>(null);

  const questions = value.question_map ?? [];

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

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    container: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' },
    badge: (n: number) => ({
      background: n >= MAX_MAPPED_QUESTIONS ? '#fef2f2' : '#f0fdf4',
      color: n >= MAX_MAPPED_QUESTIONS ? '#dc2626' : '#16a34a',
      border: `1px solid ${n >= MAX_MAPPED_QUESTIONS ? '#fca5a5' : '#86efac'}`,
      borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600,
    }),
    card: (expanded: boolean) => ({
      border: expanded ? '1px solid #6366f1' : '1px solid #e5e7eb',
      borderRadius: '10px', overflow: 'hidden', background: '#fff',
      boxShadow: expanded ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'all 0.15s ease',
    }),
    qHeader: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', cursor: 'pointer', userSelect: 'none' as const,
      background: '#fafafa', borderBottom: '1px solid #f3f4f6',
    },
    qNum: {
      width: '28px', height: '28px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', borderRadius: '50%', background: '#6366f1',
      color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0,
    },
    qTitle: {
      flex: 1, fontSize: '14px', color: '#374151', fontWeight: 500,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
    },
    body: { padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '14px' },
    label: {
      fontSize: '12px', fontWeight: 600, color: '#6b7280',
      textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px',
    },
    input: {
      width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
      borderRadius: '8px', fontSize: '14px', color: '#111827',
      outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
    },
    optionRow: { display: 'flex', alignItems: 'flex-start', gap: '8px' },
    signalSelect: (signal: SignalLevel) => ({
      padding: '6px 8px', border: `1px solid ${SIGNAL_CONFIG[signal].border}`,
      borderRadius: '8px', fontSize: '12px', color: SIGNAL_CONFIG[signal].color,
      background: SIGNAL_CONFIG[signal].bg, fontWeight: 600,
      cursor: 'pointer', outline: 'none', flexShrink: 0,
    }),
    exitMsgInput: {
      marginTop: '6px', width: '100%', padding: '6px 10px',
      border: '1px solid #c4b5fd', borderRadius: '6px', fontSize: '12px',
      color: '#7c3aed', background: '#faf5ff', outline: 'none',
      boxSizing: 'border-box' as const,
    },
    addOptionBtn: {
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '6px 12px', border: '1px dashed #d1d5db', borderRadius: '8px',
      background: 'transparent', color: '#6b7280', fontSize: '13px', cursor: 'pointer',
    },
    removeBtn: {
      padding: '4px 8px', border: 'none', background: 'transparent',
      color: '#9ca3af', cursor: 'pointer', borderRadius: '6px',
      fontSize: '16px', lineHeight: 1,
    },
    addQBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      padding: '12px', border: '2px dashed #d1d5db', borderRadius: '10px',
      background: 'transparent',
      color: questions.length >= MAX_MAPPED_QUESTIONS ? '#9ca3af' : '#6366f1',
      fontSize: '14px', fontWeight: 600,
      cursor: questions.length >= MAX_MAPPED_QUESTIONS ? 'not-allowed' : 'pointer',
      opacity: questions.length >= MAX_MAPPED_QUESTIONS ? 0.5 : 1,
    },
    tableToggle: (hasTable: boolean) => ({
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 12px', border: `1px solid ${hasTable ? '#bfdbfe' : '#d1d5db'}`,
      borderRadius: '8px', background: hasTable ? '#eff6ff' : 'transparent',
      cursor: 'pointer', fontSize: '13px', color: hasTable ? '#1d4ed8' : '#6b7280',
      fontWeight: hasTable ? 600 : 400,
    }),
    infoBox: {
      fontSize: '12px', color: '#6b7280', padding: '10px 14px',
      background: '#f9fafb', border: '1px solid #e5e7eb',
      borderRadius: '8px', lineHeight: 1.5,
    },
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Question Map</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            Up to {MAX_MAPPED_QUESTIONS} deterministic questions — any question may include an inline table
          </div>
        </div>
        <span style={s.badge(questions.length)}>{questions.length} / {MAX_MAPPED_QUESTIONS}</span>
      </div>

      {/* Questions */}
      {questions.map((q, qIdx) => {
        const isExpanded = expandedIndex === qIdx;
        const isTableExpanded = tableExpandedIndex === qIdx;
        const hasTable = !!q.table;

        return (
          <div key={q.id} style={s.card(isExpanded)}>
            {/* Collapsible header */}
            <div style={s.qHeader} onClick={() => setExpandedIndex(isExpanded ? null : qIdx)}>
              <span style={s.qNum}>{qIdx + 1}</span>
              <span style={s.qTitle}>
                {q.question || <em style={{ color: '#9ca3af' }}>Untitled question</em>}
              </span>
              {hasTable && <span title="Has inline table" style={{ fontSize: '14px' }}>📊</span>}
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {q.quick_replies.length} option{q.quick_replies.length !== 1 ? 's' : ''}
              </span>
              <button
                style={{ ...s.removeBtn, color: '#ef4444' }}
                onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                title="Remove question"
              >×</button>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Body */}
            {isExpanded && (
              <div style={s.body}>

                {/* Question text */}
                <div>
                  <div style={s.label}>Question Text</div>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="e.g. What is the primary nature of your business activity?"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIdx, { ...q, question: e.target.value })}
                  />
                </div>

                {/* Answer options */}
                <div>
                  <div style={s.label}>Answer Options &amp; Signal Levels</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.quick_replies.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={s.optionRow}>
                          <select
                            style={s.signalSelect(opt.signal)}
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
                            style={{ ...s.input, flex: 1 }}
                            type="text"
                            placeholder={`Option ${oIdx + 1} label...`}
                            value={opt.text}
                            onChange={(e) => updateOption(qIdx, oIdx, { ...opt, text: e.target.value })}
                          />

                          {q.quick_replies.length > 1 && (
                            <button
                              style={s.removeBtn}
                              onClick={() => removeOption(qIdx, oIdx)}
                              title="Remove option"
                            >×</button>
                          )}
                        </div>

                        {/* Auto-exit message input */}
                        {opt.signal === 'disqualify' && (
                          <input
                            style={s.exitMsgInput}
                            type="text"
                            placeholder="⛔ Custom exit message shown to user when they choose this option..."
                            value={opt.exit_message ?? ''}
                            onChange={(e) =>
                              updateOption(qIdx, oIdx, { ...opt, exit_message: e.target.value })
                            }
                          />
                        )}
                      </div>
                    ))}

                    <button style={s.addOptionBtn} onClick={() => addOption(qIdx)}>
                      + Add option
                    </button>
                  </div>
                </div>

                {/* Inline Table Section */}
                <div>
                  <div style={s.label}>Inline Table (optional)</div>
                  <button
                    style={s.tableToggle(hasTable)}
                    onClick={() => toggleTable(qIdx)}
                  >
                    <span>📊</span>
                    {hasTable ? 'Remove table' : 'Attach a table to this question'}
                  </button>

                  {hasTable && q.table && (
                    <div style={{ marginTop: '10px' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: '8px', cursor: 'pointer',
                        }}
                        onClick={() => setTableExpandedIndex(isTableExpanded ? null : qIdx)}
                      >
                        <span style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
                          {isTableExpanded ? '▲ Hide table editor' : '▼ Edit table'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          {q.table.headers.length} cols × {q.table.rows.length} rows
                        </span>
                      </div>

                      {isTableExpanded && (
                        <TableBuilder
                          table={q.table}
                          onChange={(updated) => updateTable(qIdx, updated)}
                        />
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        );
      })}

      {/* Add question */}
      <button
        style={s.addQBtn}
        onClick={addQuestion}
        disabled={questions.length >= MAX_MAPPED_QUESTIONS}
      >
        + Add Question {questions.length >= MAX_MAPPED_QUESTIONS && '(limit reached)'}
      </button>

      {/* Info box */}
      <div style={s.infoBox}>
        <strong>{questions.length} question{questions.length !== 1 ? 's' : ''}</strong> defined.
        {' '}Signal scoring: 🟢 High (+3) | 🟡 Medium (+2) | 🔴 Low (+1) | ⛔ Auto-Exit (immediate){' '}
        | 📊 Questions with tables render an HTML table in the chat before the quick-reply options.
      </div>
    </div>
  );
};

export default QuestionMapEditor;
