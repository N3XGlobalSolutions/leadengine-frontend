/**
 * Step 4 on S3 Mapping — fixed question map with scored answers and optional tables.
 * Design: spec8.html. Data: form.questionMapConfig.question_map (same semantics as the old QuestionMapEditor:
 * ids Q1..Qn renumbered on every change, max 30, exit_message used when an answer ends the chat).
 */
import React, { useId, useRef, useState } from 'react';
import { cn } from '../../../../utils/cn';
import type { PreviewMessage, StepProps } from '../../../../types/onboarding';
import type { QuestionMapItem, QuestionMapOption, QuestionMapTable, SignalLevel } from '../../QuestionMapEditor';
import { Card, Field, Input, Hint, TechTag, Switch, StepColumns, PreviewPanel, PanelCard, Icon, buttonClass, inputClass, tone } from '../ui';
import { PhonePreview } from '../PhonePreview';

const MAX_MAPPED = 30;

const makeId = (i: number) => `Q${i + 1}`;
const renumber = (qs: QuestionMapItem[]) => qs.map((q, i) => (q.id === makeId(i) ? q : { ...q, id: makeId(i) }));
const newAnswer = (): QuestionMapOption => ({ text: '', signal: 'medium' });
const newQuestion = (i: number): QuestionMapItem => ({ id: makeId(i), question: '', quick_replies: [newAnswer()], table: null, required: true });
const newTable = (): QuestionMapTable => ({ headers: ['Column 1', 'Column 2', 'Column 3'], rows: [['', '', '']] });
/** Restored drafts may miss fields (question, quick_replies, answer text, table parts): fill them so nothing crashes. */
const normalise = (q: QuestionMapItem): QuestionMapItem => ({
    ...q,
    question: typeof q?.question === 'string' ? q.question : '',
    quick_replies: Array.isArray(q?.quick_replies)
        ? q.quick_replies.map((o) => ({ ...o, text: typeof o?.text === 'string' ? o.text : '', signal: asSignal(o?.signal ?? '') }))
        : [],
    table: q?.table && Array.isArray(q.table.headers)
        ? { headers: q.table.headers, rows: Array.isArray(q.table.rows) ? q.table.rows.map((r) => (Array.isArray(r) ? r : [])) : [] }
        : null,
});

/** Score labels shown to the admin (backend signal in brackets). */
const SIGNALS: { value: SignalLevel; label: string }[] = [
    { value: 'high', label: 'Good sign' },
    { value: 'medium', label: 'Neutral' },
    { value: 'low', label: 'Bad sign' },
    { value: 'disqualify', label: 'Ends the chat' },
];
const SIGNAL_LABEL: Record<SignalLevel, string> = { high: 'Good sign', medium: 'Neutral', low: 'Bad sign', disqualify: 'Ends the chat' };
const asSignal = (s: string): SignalLevel => (s in SIGNAL_LABEL ? (s as SignalLevel) : 'medium');

type Tone = { bg: string; text: string; border?: string };
const SIGNAL_STYLE: Record<SignalLevel, { light: Tone; dark: Tone }> = {
    high: { light: { bg: 'bg-[#111111]', text: 'text-white' }, dark: { bg: 'bg-white', text: 'text-black' } },
    medium: { light: { bg: 'bg-[#F2F2F2]', text: 'text-[#333333]' }, dark: { bg: 'bg-neutral-800', text: 'text-neutral-200' } },
    low: { light: { bg: 'bg-white', text: 'text-[#111111]', border: 'border-[#111111]' }, dark: { bg: 'bg-transparent', text: 'text-white', border: 'border-white' } },
    disqualify: { light: { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' }, dark: { bg: 'bg-red-950/60', text: 'text-red-300' } },
};
const signalTone = (s: SignalLevel, isDark: boolean): Tone => SIGNAL_STYLE[s][isDark ? 'dark' : 'light'];

const LockIcon: React.FC = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
    </svg>
);

export const Step4S3Mapping: React.FC<StepProps> = ({ form, setForm, showErrors, isDark }) => {
    const t = tone(isDark);
    const uid = useId();
    const questions: QuestionMapItem[] = (form.questionMapConfig?.question_map ?? []).map(normalise);
    const n = questions.length;
    const atMax = n >= MAX_MAPPED;

    // One question open at a time (accordion). Index-based: ids are renumbered Q1..Qn.
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const open = openIdx !== null && openIdx < n ? openIdx : null;
    // Tables switched off are kept here so switching back on restores them (within this session).
    const tableStash = useRef<Record<number, QuestionMapTable>>({});

    // ── Mutators (always derive from the latest form state) ─────────────────────
    const updateMap = (fn: (cur: QuestionMapItem[]) => QuestionMapItem[]) =>
        setForm((p) => ({
            ...p,
            questionMapConfig: { ...p.questionMapConfig, question_map: renumber(fn((p.questionMapConfig?.question_map ?? []).map(normalise))) },
        }));
    const updateQ = (i: number, fn: (q: QuestionMapItem) => QuestionMapItem) =>
        updateMap((cur) => cur.map((q, k) => (k === i ? fn(q) : q)));
    const updateAnswer = (i: number, j: number, patch: Partial<QuestionMapOption>) =>
        updateQ(i, (q) => ({ ...q, quick_replies: q.quick_replies.map((o, k) => (k === j ? { ...o, ...patch } : o)) }));
    const updateTable = (i: number, fn: (tb: QuestionMapTable) => QuestionMapTable) =>
        updateQ(i, (q) => (q.table ? { ...q, table: fn(q.table) } : q));

    const addQuestion = () => {
        if (atMax) return;
        updateMap((cur) => (cur.length >= MAX_MAPPED ? cur : [...cur, newQuestion(cur.length)]));
        setOpenIdx(n);
    };
    const removeQuestion = (i: number) => {
        updateMap((cur) => cur.filter((_, k) => k !== i));
        tableStash.current = {};
        setOpenIdx(null);
    };
    const toggleTable = (i: number) =>
        updateQ(i, (q) => {
            if (q.table) {
                tableStash.current[i] = q.table;
                return { ...q, table: null };
            }
            return { ...q, table: tableStash.current[i] ?? newTable() };
        });

    // ── Validation (inline, after Next was pressed) ─────────────────────────────
    const questionError = (q: QuestionMapItem) => (showErrors && !q.question.trim() ? 'Write the question the bot should ask.' : null);
    const answersError = (q: QuestionMapItem) => (showErrors && !q.quick_replies.some((o) => o.text.trim()) ? 'Add at least 1 answer.' : null);
    const errText = isDark ? 'text-red-400' : 'text-[#B91C1C]';

    // ── Preview (open question, or the first one) ───────────────────────────────
    const cur = (open !== null ? questions[open] : undefined) ?? questions[0];
    const filled = cur ? cur.quick_replies.filter((o) => o.text.trim()) : [];
    const messages: PreviewMessage[] = cur
        ? [
            { who: 'bot', text: 'Thanks, Priya! A few quick questions.' },
            ...(cur.table
                ? [{ who: 'bot' as const, table: [cur.table.headers, ...cur.table.rows.map((r) => cur.table!.headers.map((_, ci) => r[ci] ?? ''))] }]
                : []),
            { who: 'bot', text: cur.question.trim() || 'Untitled question', chips: filled.map((o) => o.text), focus: true, note: 'Asked word for word' },
        ]
        : [];

    const main = (
        <>
            {/* 1. Asked first, automatically */}
            <Card isDark={isDark} className={cn('gap-3', isDark ? 'bg-neutral-900/50' : 'bg-[#F7F7F7]')}>
                <div className="flex flex-col gap-1">
                    <h2 className={cn('m-0 text-base font-extrabold tracking-[-0.02em]', t.text)}>Asked first, automatically</h2>
                    <p className={cn('m-0 text-sm leading-[1.55]', t.muted)}>Every chat starts with these two. You don’t need to add them.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {['Name', 'Phone number'].map((label) => (
                        <span
                            key={label}
                            className={cn(
                                'inline-flex items-center gap-2 min-h-[40px] px-3.5 rounded-[10px] border text-[13.5px] font-bold',
                                isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-200' : 'bg-white border-[#E5E5E5] text-[#333333]',
                            )}
                        >
                            <span className={isDark ? 'text-neutral-500' : 'text-[#6B6B6B]'}><LockIcon /></span>
                            {label}
                        </span>
                    ))}
                </div>
            </Card>

            {/* 2. Question map */}
            <Card isDark={isDark}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 flex-[1_1_300px] min-w-0">
                        <h2 className={cn('m-0 text-[18px] font-extrabold tracking-[-0.02em]', t.text)}>Question map</h2>
                        <p className={cn('m-0 text-sm leading-[1.55]', t.muted)}>
                            The bot asks these word for word, in order. Give each answer a score so leads are sorted automatically. Add at least 1.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <span className={cn('text-[13px] font-extrabold text-right', t.text)}>{n} of {MAX_MAPPED} questions</span>
                        <span aria-hidden="true" className={cn('h-1.5 rounded-[3px] overflow-hidden flex', isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]')}>
                            <span className={cn('block h-1.5 rounded-[3px] transition-[width]', isDark ? 'bg-white' : 'bg-[#111111]')} style={{ width: `${Math.round((n / MAX_MAPPED) * 100)}%` }} />
                        </span>
                    </div>
                </div>

                {n === 0 ? (
                    <div
                        className={cn(
                            'flex flex-col items-center gap-1 rounded-[14px] border-[1.5px] border-dashed px-6 py-7 text-center',
                            showErrors ? 'border-[#B91C1C]' : isDark ? 'border-neutral-700' : 'border-[#D4D4D4]',
                        )}
                    >
                        <span className={cn('text-[14.5px] font-extrabold', t.text)}>No questions yet</span>
                        <Hint isDark={isDark}>Add the first question the bot should ask, word for word.</Hint>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {questions.map((q, i) => {
                            const isOpen = open === i;
                            const qErr = questionError(q);
                            const aErr = answersError(q);
                            const count = q.quick_replies.length;
                            const panelId = `${uid}-panel-${i}`;
                            const cols = q.table?.headers.length ?? 0;
                            return (
                                <div
                                    key={`q-${i}`}
                                    className={cn(
                                        'rounded-[14px] overflow-hidden',
                                        isOpen
                                            ? isDark ? 'border-2 border-white bg-neutral-950' : 'border-2 border-[#111111] bg-[#FAFAFA]'
                                            : isDark ? 'border border-neutral-800 bg-neutral-900' : 'border border-[#E5E5E5] bg-white',
                                        !isOpen && (qErr || aErr) && 'border-[#B91C1C]',
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenIdx(isOpen ? null : i)}
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        className="flex items-center gap-3 w-full min-h-[60px] px-3.5 py-2.5 border-none bg-transparent cursor-pointer text-left"
                                    >
                                        <span
                                            className={cn(
                                                'w-[30px] h-[30px] flex-none rounded-full flex items-center justify-center text-[13px] font-extrabold',
                                                isOpen
                                                    ? isDark ? 'bg-white text-black' : 'bg-[#111111] text-white'
                                                    : isDark ? 'bg-neutral-800 text-white' : 'bg-[#F2F2F2] text-[#111111]',
                                            )}
                                        >
                                            {i + 1}
                                        </span>
                                        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                                            <span className={cn('text-[14.5px] font-extrabold break-words', t.text)}>{q.question.trim() || 'Untitled question'}</span>
                                            <span className={cn('text-[12.5px]', t.hint)}>
                                                {count} {count === 1 ? 'answer' : 'answers'}
                                                {q.table ? ' · has a table' : ''}
                                                {(qErr || aErr) && <span className={cn('font-semibold', errText)}> · {qErr ? 'question missing' : 'no answers'}</span>}
                                            </span>
                                        </span>
                                        <span className={cn('flex transition-transform duration-150', isOpen && 'rotate-90', isDark ? 'text-neutral-400' : 'text-[#525252]')}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M9 6l6 6-6 6" />
                                            </svg>
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div id={panelId} className={cn('p-4 flex flex-col gap-4 border-t', t.border)}>
                                            {/* Question text */}
                                            <Field isDark={isDark} label="Question" htmlFor={`${uid}-q${i}`} required tech="question" error={qErr}>
                                                <Input
                                                    isDark={isDark}
                                                    id={`${uid}-q${i}`}
                                                    value={q.question}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        updateQ(i, (x) => ({ ...x, question: v }));
                                                    }}
                                                    placeholder="Untitled question"
                                                    invalid={!!qErr}
                                                />
                                            </Field>

                                            {/* Answers and their score */}
                                            <div className="flex flex-col gap-2 min-w-0">
                                                <span className={cn('text-[13px] font-bold flex items-center gap-2 flex-wrap', t.text)}>
                                                    Answers and their score
                                                    <TechTag isDark={isDark}>quick_replies · signal</TechTag>
                                                </span>
                                                {q.quick_replies.map((o, j) => {
                                                    const sig = asSignal(o.signal);
                                                    const st = signalTone(sig, isDark);
                                                    const aId = `${uid}-a${i}-${j}`;
                                                    const sId = `${uid}-s${i}-${j}`;
                                                    return (
                                                        <div key={j} className="flex flex-col gap-1.5">
                                                            <div className="flex gap-2 items-center">
                                                                <label className="sr-only" htmlFor={aId}>Answer {j + 1}</label>
                                                                <Input
                                                                    isDark={isDark}
                                                                    id={aId}
                                                                    value={o.text}
                                                                    onChange={(e) => updateAnswer(i, j, { text: e.target.value })}
                                                                    placeholder={`Answer ${j + 1}`}
                                                                    invalid={!!aErr}
                                                                />
                                                                <label className="sr-only" htmlFor={sId}>Score for answer {j + 1}</label>
                                                                <div className={cn('relative flex-none w-[150px]', st.text)}>
                                                                    <select
                                                                        id={sId}
                                                                        value={sig}
                                                                        onChange={(e) => updateAnswer(i, j, { signal: e.target.value as SignalLevel })}
                                                                        className={cn(inputClass(isDark), 'appearance-none pr-8 font-bold cursor-pointer', st.bg, st.text, st.border)}
                                                                    >
                                                                        {SIGNALS.map((s) => (
                                                                            <option key={s.value} value={s.value} className={isDark ? 'bg-neutral-900 text-white' : 'bg-white text-[#0A0A0A]'}>
                                                                                {s.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex">
                                                                        <Icon.chevronDown size={14} />
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Remove answer ${j + 1}`}
                                                                    onClick={() => updateQ(i, (x) => (x.quick_replies.length > 1 ? { ...x, quick_replies: x.quick_replies.filter((_, k) => k !== j) } : x))}
                                                                    disabled={count <= 1}
                                                                    className={cn(
                                                                        'w-10 h-10 flex-none border-none rounded-[10px] bg-transparent cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed',
                                                                        isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-[#6B6B6B] hover:bg-[#F2F2F2]',
                                                                    )}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                        <path d="M6 6l12 12M18 6L6 18" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            {sig === 'disqualify' && (
                                                                <Input
                                                                    isDark={isDark}
                                                                    aria-label="Message shown when the chat ends"
                                                                    value={o.exit_message ?? ''}
                                                                    onChange={(e) => updateAnswer(i, j, { exit_message: e.target.value })}
                                                                    placeholder="Message shown before the chat ends, e.g. No problem, message us anytime."
                                                                    className={isDark ? 'bg-red-950/40 border-red-900' : 'bg-[#FEF2F2] border-[#FECACA]'}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {aErr && <p role="alert" className="m-0 text-[12.5px] font-semibold text-[#B91C1C]">{aErr}</p>}
                                                <button
                                                    type="button"
                                                    onClick={() => updateQ(i, (x) => ({ ...x, quick_replies: [...x.quick_replies, newAnswer()] }))}
                                                    className={buttonClass(isDark, 'ghost', 'self-start')}
                                                >
                                                    + Add answer
                                                </button>
                                            </div>

                                            {/* Optional table */}
                                            <div className={cn('flex flex-col gap-2.5 p-3.5 rounded-xl border', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-[#F7F7F7] border-[#E5E5E5]')}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="flex flex-col gap-0.5">
                                                        <span className={cn('text-[13px] font-bold flex items-center gap-2 flex-wrap', t.text)}>
                                                            Show a table first <span className={cn('font-medium', t.hint)}>optional</span>
                                                        </span>
                                                        <Hint isDark={isDark}>Useful for packages or price lists the visitor picks from.</Hint>
                                                    </span>
                                                    <Switch isDark={isDark} on={!!q.table} onToggle={() => toggleTable(i)} label="Show a table before the answers" />
                                                </div>
                                                {q.table && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="overflow-x-auto">
                                                            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(84px, 1fr)) 40px` }}>
                                                                {q.table.headers.map((h, ci) => (
                                                                    <div key={`h-${ci}`} className="relative min-w-0">
                                                                        <Input
                                                                            isDark={isDark}
                                                                            aria-label={`Header ${ci + 1}`}
                                                                            value={h}
                                                                            onChange={(e) => {
                                                                                const v = e.target.value;
                                                                                updateTable(i, (tb) => ({ ...tb, headers: tb.headers.map((x, k) => (k === ci ? v : x)) }));
                                                                            }}
                                                                            className={cn('h-10 text-[13px] font-extrabold', cols > 1 && 'pr-8', isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]')}
                                                                        />
                                                                        {cols > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                aria-label={`Remove column ${ci + 1}`}
                                                                                onClick={() =>
                                                                                    updateTable(i, (tb) => ({
                                                                                        headers: tb.headers.filter((_, k) => k !== ci),
                                                                                        rows: tb.rows.map((r) => r.filter((_, k) => k !== ci)),
                                                                                    }))
                                                                                }
                                                                                className={cn(
                                                                                    'absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center',
                                                                                    isDark ? 'text-neutral-400 hover:bg-neutral-700' : 'text-[#6B6B6B] hover:bg-[#E5E5E5]',
                                                                                )}
                                                                            >
                                                                                <Icon.x size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <span aria-hidden="true" />
                                                                {q.table.rows.map((r, ri) => (
                                                                    <React.Fragment key={`r-${ri}`}>
                                                                        {q.table!.headers.map((_, ci) => (
                                                                            <Input
                                                                                key={`c-${ri}-${ci}`}
                                                                                isDark={isDark}
                                                                                aria-label={`Row ${ri + 1}, column ${ci + 1}`}
                                                                                value={r[ci] ?? ''}
                                                                                onChange={(e) => {
                                                                                    const v = e.target.value;
                                                                                    updateTable(i, (tb) => ({
                                                                                        ...tb,
                                                                                        rows: tb.rows.map((row, a) => (a === ri ? tb.headers.map((__, b) => (b === ci ? v : row[b] ?? '')) : row)),
                                                                                    }));
                                                                                }}
                                                                                className="h-10 text-[13px]"
                                                                            />
                                                                        ))}
                                                                        <button
                                                                            type="button"
                                                                            aria-label={`Remove row ${ri + 1}`}
                                                                            onClick={() => updateTable(i, (tb) => ({ ...tb, rows: tb.rows.filter((_, a) => a !== ri) }))}
                                                                            className={cn(
                                                                                'w-10 h-10 border-none rounded-[10px] bg-transparent cursor-pointer flex items-center justify-center',
                                                                                isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-[#6B6B6B] hover:bg-[#E5E5E5]',
                                                                            )}
                                                                        >
                                                                            <Icon.x size={14} />
                                                                        </button>
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateTable(i, (tb) => ({ ...tb, rows: [...tb.rows, tb.headers.map(() => '')] }))}
                                                                className={buttonClass(isDark, 'ghost')}
                                                            >
                                                                + Add row
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateTable(i, (tb) => ({
                                                                        headers: [...tb.headers, `Column ${tb.headers.length + 1}`],
                                                                        rows: tb.rows.map((r) => [...tb.headers.map((_, k) => r[k] ?? ''), '']),
                                                                    }))
                                                                }
                                                                className={buttonClass(isDark, 'ghost')}
                                                            >
                                                                + Add column
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(i)}
                                                className={buttonClass(isDark, 'ghost', cn('self-start', isDark ? 'text-red-400' : 'text-[#B91C1C]'))}
                                            >
                                                Remove this question
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {showErrors && n === 0 && <p role="alert" className="m-0 text-[12.5px] font-semibold text-[#B91C1C]">Add at least 1 question.</p>}

                <button type="button" onClick={addQuestion} disabled={atMax} className={buttonClass(isDark, 'secondary', 'self-start')}>
                    {atMax ? `Limit reached (${MAX_MAPPED})` : '+ Add question'}
                </button>
            </Card>
        </>
    );

    const aside = (
        <PreviewPanel isDark={isDark} rightLabel="Sample chat">
            <PhonePreview
                mode="chat"
                companyName={form.name || form.config.companyName}
                botDisplayName={form.config.botDisplayName}
                botAvatar={form.config.botAvatar}
                primary={form.config.colors.primary}
                secondary={form.config.colors.secondary}
                messages={messages}
            />
            <PanelCard isDark={isDark} className="gap-2">
                <span className={cn('text-xs font-extrabold tracking-[0.06em] uppercase', t.muted)}>Scores · only your team sees these</span>
                {filled.length === 0 ? (
                    <Hint isDark={isDark}>Scores show here as you add answers.</Hint>
                ) : (
                    filled.map((o, k) => {
                        const sig = asSignal(o.signal);
                        const st = signalTone(sig, isDark);
                        return (
                            <span key={k} className={cn('flex items-center justify-between gap-2.5 text-[13px] font-semibold', t.text)}>
                                <span className="min-w-0 break-words">{o.text}</span>
                                <span className={cn('flex-none text-xs font-extrabold rounded-full px-2.5 py-[3px] whitespace-nowrap', st.bg, st.text, st.border && cn('border-[1.5px]', st.border))}>
                                    {SIGNAL_LABEL[sig]}
                                </span>
                            </span>
                        );
                    })
                )}
            </PanelCard>
        </PreviewPanel>
    );

    return <StepColumns main={main} aside={aside} />;
};
