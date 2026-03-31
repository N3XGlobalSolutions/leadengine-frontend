/**
 * QuestionMapEditor — Admin UI for defining the S3 Mapping question map.
 *
 * Features:
 * - Up to 20 admin-defined questions with quick reply options
 * - Per-option signal level: High / Medium / Low / Auto-Exit (Disqualify)
 * - Auto-Exit toggle shows a custom exit message field
 * - Max 20 questions enforced in UI
 * - Configurable number of Claude branching questions (0-10)
 */

import React, { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export type SignalLevel = 'high' | 'medium' | 'low' | 'disqualify';

export interface QuestionMapOption {
  text: string;
  signal: SignalLevel;
  exit_message?: string;
}

export interface QuestionMapItem {
  id: string;
  question: string;
  quick_replies: QuestionMapOption[];
  required?: boolean;
}

export interface QuestionMapConfig {
  question_map: QuestionMapItem[];
  max_branching_questions: number;
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

const MAX_MAPPED_QUESTIONS = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────
const makeId = (index: number) => `Q${index + 1}`;

const defaultOption = (): QuestionMapOption => ({ text: '', signal: 'high' });

const defaultQuestion = (index: number): QuestionMapItem => ({
  id: makeId(index),
  question: '',
  quick_replies: [defaultOption(), defaultOption()],
  required: true,
});

// ── Component ──────────────────────────────────────────────────────────────────
const QuestionMapEditor: React.FC<QuestionMapEditorProps> = ({ value, onChange }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const questions = value.question_map ?? [];
  const maxBranching = value.max_branching_questions ?? 10;

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

  // ── Styles (inline for portability) ───────────────────────────────────────
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '4px',
    },
    badge: (count: number) => ({
      background: count >= MAX_MAPPED_QUESTIONS ? '#fef2f2' : '#f0fdf4',
      color: count >= MAX_MAPPED_QUESTIONS ? '#dc2626' : '#16a34a',
      border: `1px solid ${count >= MAX_MAPPED_QUESTIONS ? '#fca5a5' : '#86efac'}`,
      borderRadius: '9999px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: 600,
    }),
    questionCard: (expanded: boolean) => ({
      border: expanded ? '1px solid #6366f1' : '1px solid #e5e7eb',
      borderRadius: '10px',
      overflow: 'hidden',
      background: '#fff',
      boxShadow: expanded ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'all 0.15s ease',
    }),
    questionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      cursor: 'pointer',
      userSelect: 'none' as const,
      background: '#fafafa',
      borderBottom: '1px solid #f3f4f6',
    },
    questionNum: {
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      background: '#6366f1',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 700,
      flexShrink: 0,
    },
    questionTitle: {
      flex: 1,
      fontSize: '14px',
      color: '#374151',
      fontWeight: 500,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    questionBody: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '14px',
    },
    label: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#6b7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#111827',
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.15s',
    },
    optionRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    },
    signalSelect: (signal: SignalLevel) => ({
      padding: '6px 8px',
      border: `1px solid ${SIGNAL_CONFIG[signal].border}`,
      borderRadius: '8px',
      fontSize: '12px',
      color: SIGNAL_CONFIG[signal].color,
      background: SIGNAL_CONFIG[signal].bg,
      fontWeight: 600,
      cursor: 'pointer',
      outline: 'none',
      flexShrink: 0,
    }),
    exitMsgInput: {
      marginTop: '6px',
      width: '100%',
      padding: '6px 10px',
      border: '1px solid #c4b5fd',
      borderRadius: '6px',
      fontSize: '12px',
      color: '#7c3aed',
      background: '#faf5ff',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    addOptionBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      border: '1px dashed #d1d5db',
      borderRadius: '8px',
      background: 'transparent',
      color: '#6b7280',
      fontSize: '13px',
      cursor: 'pointer',
    },
    removeBtn: {
      padding: '4px 8px',
      border: 'none',
      background: 'transparent',
      color: '#9ca3af',
      cursor: 'pointer',
      borderRadius: '6px',
      fontSize: '16px',
      lineHeight: 1,
    },
    addQBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px',
      border: '2px dashed #d1d5db',
      borderRadius: '10px',
      background: 'transparent',
      color: questions.length >= MAX_MAPPED_QUESTIONS ? '#9ca3af' : '#6366f1',
      fontSize: '14px',
      fontWeight: 600,
      cursor: questions.length >= MAX_MAPPED_QUESTIONS ? 'not-allowed' : 'pointer',
      opacity: questions.length >= MAX_MAPPED_QUESTIONS ? 0.5 : 1,
      transition: 'all 0.15s',
    },
    branchingRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: '#f8faff',
      border: '1px solid #e0e7ff',
      borderRadius: '10px',
    },
    branchingLabel: {
      fontSize: '14px',
      color: '#374151',
      fontWeight: 500,
      flex: 1,
    },
    branchingInput: {
      width: '72px',
      padding: '6px 10px',
      border: '1px solid #a5b4fc',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 700,
      color: '#4338ca',
      textAlign: 'center' as const,
      outline: 'none',
    },
    infoBox: {
      fontSize: '12px',
      color: '#6b7280',
      padding: '10px 14px',
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      lineHeight: 1.5,
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            Question Map
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            Define up to {MAX_MAPPED_QUESTIONS} structured questions with signal scoring
          </div>
        </div>
        <span style={styles.badge(questions.length)}>
          {questions.length} / {MAX_MAPPED_QUESTIONS}
        </span>
      </div>

      {/* Questions */}
      {questions.map((q, qIdx) => {
        const isExpanded = expandedIndex === qIdx;
        return (
          <div key={q.id} style={styles.questionCard(isExpanded)}>
            {/* Collapsible header */}
            <div
              style={styles.questionHeader}
              onClick={() => setExpandedIndex(isExpanded ? null : qIdx)}
            >
              <span style={styles.questionNum}>{qIdx + 1}</span>
              <span style={styles.questionTitle}>
                {q.question || <em style={{ color: '#9ca3af' }}>Untitled question</em>}
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {q.quick_replies.length} option{q.quick_replies.length !== 1 ? 's' : ''}
              </span>
              <button
                style={{ ...styles.removeBtn, color: '#ef4444' }}
                onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                title="Remove question"
              >
                ×
              </button>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                {isExpanded ? '▲' : '▼'}
              </span>
            </div>

            {/* Body */}
            {isExpanded && (
              <div style={styles.questionBody}>
                {/* Question text */}
                <div>
                  <div style={styles.label}>Question Text</div>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="What is the primary nature of your business?"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIdx, { ...q, question: e.target.value })}
                  />
                </div>

                {/* Answer options */}
                <div>
                  <div style={styles.label}>Answer Options &amp; Signal Levels</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.quick_replies.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={styles.optionRow}>
                          {/* Signal selector */}
                          <select
                            style={styles.signalSelect(opt.signal)}
                            value={opt.signal}
                            onChange={(e) =>
                              updateOption(qIdx, oIdx, { ...opt, signal: e.target.value as SignalLevel })
                            }
                          >
                            {(Object.entries(SIGNAL_CONFIG) as [SignalLevel, typeof SIGNAL_CONFIG[SignalLevel]][]).map(([val, cfg]) => (
                              <option key={val} value={val}>{cfg.icon} {cfg.label}</option>
                            ))}
                          </select>

                          {/* Option text */}
                          <input
                            style={{ ...styles.input, flex: 1 }}
                            type="text"
                            placeholder={`Option ${oIdx + 1} label...`}
                            value={opt.text}
                            onChange={(e) => updateOption(qIdx, oIdx, { ...opt, text: e.target.value })}
                          />

                          {/* Remove option */}
                          {q.quick_replies.length > 1 && (
                            <button
                              style={styles.removeBtn}
                              onClick={() => removeOption(qIdx, oIdx)}
                              title="Remove option"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Auto-exit message for disqualify */}
                        {opt.signal === 'disqualify' && (
                          <input
                            style={styles.exitMsgInput}
                            type="text"
                            placeholder="⛔ Exit message shown to user..."
                            value={opt.exit_message ?? ''}
                            onChange={(e) =>
                              updateOption(qIdx, oIdx, { ...opt, exit_message: e.target.value })
                            }
                          />
                        )}
                      </div>
                    ))}

                    {/* Add option */}
                    <button style={styles.addOptionBtn} onClick={() => addOption(qIdx)}>
                      + Add option
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add question */}
      <button
        style={styles.addQBtn}
        onClick={addQuestion}
        disabled={questions.length >= MAX_MAPPED_QUESTIONS}
      >
        + Add Question {questions.length >= MAX_MAPPED_QUESTIONS && '(limit reached)'}
      </button>

      {/* Claude branching config */}
      <div style={styles.branchingRow}>
        <div>
          <div style={styles.branchingLabel}>🤖 Claude Branching Questions</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            After all mapped questions, Claude Haiku asks follow-up questions (free text)
          </div>
        </div>
        <input
          style={styles.branchingInput}
          type="number"
          min={0}
          max={10}
          value={maxBranching}
          onChange={(e) => {
            const v = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
            onChange({ ...value, max_branching_questions: v });
          }}
        />
        <span style={{ fontSize: '12px', color: '#6b7280', flexShrink: 0 }}>/ 10 max</span>
      </div>

      {/* Info box */}
      <div style={styles.infoBox}>
        <strong>Total max conversation length:</strong>{' '}
        {questions.length} mapped + {maxBranching} branching ={' '}
        <strong>{questions.length + maxBranching} questions</strong>
        <br />
        Signal scoring: 🟢 High (+3) | 🟡 Medium (+2) | 🔴 Low (+1) | ⛔ Auto-Exit (immediate)
      </div>
    </div>
  );
};

export default QuestionMapEditor;
