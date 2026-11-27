/**
 * Step 4 — Questions (manual mode: S1 / S2 / S3 / S3_INTERNATIONAL).
 * Design: spec4.html. Renders only the step body (cards + sample chat preview).
 */
import React, { useState } from 'react';
import { getPlan } from '../../../../types/onboarding';
import type { PreviewMessage, StepProps } from '../../../../types/onboarding';
import type { Question } from '../../../../types/config';
import { cn } from '../../../../utils/cn';
import { Card, Field, Hint, Icon, Input, PreviewPanel, StepColumns, Textarea, buttonClass, tone } from '../ui';
import { PhonePreview } from '../PhonePreview';

/** "or add a common one:" presets — [title, instruction, quick replies] */
const PRESETS: [string, string, string[]][] = [
    ['How they found us', 'Ask how they heard about us.', ['Google', 'Instagram', 'A friend']],
    ['Best time to call', 'Ask when is the best time to call them.', ['Morning', 'Afternoon', 'Evening']],
    ['Returning customer', 'Ask if they have bought from us before.', ['Yes', 'No']],
];

/** Turns an admin instruction ("Ask what budget they have in mind.") into the visitor-facing question for the preview. */
const ask = (t: string): string => {
    const v = (t || '')
        .trim()
        .replace(/^ask (the user |them |the visitor )?/i, '')
        .replace(/\btheir\b/g, 'your')
        .replace(/\bthey have\b/g, 'you have')
        .replace(/\bthey are\b/g, 'you are')
        .replace(/\bthey\b/g, 'you')
        .replace(/\bthem\b/g, 'you')
        .replace(/[.?!]+$/, '');
    return v ? v.charAt(0).toUpperCase() + v.slice(1) + '?' : 'Write what the bot should ask';
};

const isInvalid = (q: Question) => !(q.label || '').trim() || !(q.instruction || '').trim();

/** Next id = q{highest numeric suffix + 1} so ids never collide after removals. */
const nextId = (qs: Question[]): string => {
    const max = qs.reduce((m, q) => {
        const hit = /(\d+)$/.exec(q.id || '');
        return hit ? Math.max(m, parseInt(hit[1], 10)) : m;
    }, 0);
    return `q${max + 1}`;
};

const Chevron: React.FC<{ open: boolean; isDark: boolean }> = ({ open, isDark }) => (
    <span className={cn('flex transition-transform duration-150', open ? 'rotate-90' : 'rotate-0')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#A3A3A3' : '#525252'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
        </svg>
    </span>
);

const LockIcon: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#A3A3A3' : '#6B6B6B'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
    </svg>
);

export const Step4Questions: React.FC<StepProps> = ({ form, updateConfig, showErrors, isDark }) => {
    const t = tone(isDark);
    const plan = getPlan(form.plan);
    const min = plan.minQuestions;
    const max = plan.maxQuestions;
    const questions: Question[] = form.config.leadQualification?.questions ?? [];
    const n = questions.length;
    const firstInvalid = questions.find(isInvalid);

    // One question open at a time (default: the first; the first invalid one when errors show).
    const [openId, setOpenId] = useState<string | null>(() => (showErrors && firstInvalid ? firstInvalid.id : questions[0]?.id ?? null));
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    // When the wizard turns errors on (Next pressed with invalid fields), jump to the first invalid question.
    const [prevShowErrors, setPrevShowErrors] = useState(showErrors);
    if (prevShowErrors !== showErrors) {
        setPrevShowErrors(showErrors);
        if (showErrors && firstInvalid) setOpenId(firstInvalid.id);
    }

    const setQuestions = (next: Question[]) => updateConfig('leadQualification.questions', next);
    const patch = (id: string, fields: Partial<Question>) => setQuestions(questions.map((q) => (q.id === id ? { ...q, ...fields } : q)));

    const add = (label: string, instruction: string, options: string[]) => {
        if (n >= max) return;
        const id = nextId(questions);
        setQuestions([...questions, { id, label, instruction, collects: [], options: [...options] }]);
        setOpenId(id);
    };

    const remove = (id: string) => {
        if (n <= min) return;
        setQuestions(questions.filter((q) => q.id !== id));
        setDrafts((d) => {
            const rest = { ...d };
            delete rest[id];
            return rest;
        });
        if (openId === id) setOpenId(null);
    };

    const addOption = (q: Question) => {
        const v = (drafts[q.id] || '').trim();
        if (!v) return;
        const opts = q.options ?? [];
        if (!opts.some((o) => o.toLowerCase() === v.toLowerCase())) patch(q.id, { options: [...opts, v] });
        setDrafts((d) => ({ ...d, [q.id]: '' }));
    };

    const removeOption = (q: Question, index: number) => patch(q.id, { options: (q.options ?? []).filter((_, i) => i !== index) });

    const canAdd = n < max;
    const atMax = n >= max;
    const canRemove = n > min;
    const ruleLine = min === max
        ? `Starter questions for any business. Edit to fit. Exactly ${min}.`
        : `Starter questions for any business. Edit to fit. ${min} to ${max} questions.`;
    const maxLine = min === max
        ? `${plan.code} always has exactly ${min} questions. Pick S2 or higher for more.`
        : `You’ve reached the ${max}-question limit for this plan.`;
    const have = questions.map((q) => (q.label || '').trim().toLowerCase());
    const ideas = PRESETS.filter(([label]) => !have.includes(label.toLowerCase()));
    const barWidth = max > 0 ? Math.min(100, Math.round((n / max) * 100)) : 0;

    // ---- Sample chat preview ----
    const botName = form.config.botDisplayName?.trim() || form.config.botName?.trim() || 'Assistant';
    const company = form.name.trim();
    const cur = questions.find((q) => q.id === openId) ?? questions[0];
    const messages: PreviewMessage[] = [
        { who: 'bot', text: `Hi! I’m ${botName}${company ? ` from ${company}` : ''}. Before we start, may I know your name?` },
        { who: 'user', text: 'Priya' },
        { who: 'bot', text: 'Thanks, Priya! What’s the best number to reach you on?' },
        { who: 'user', text: '98765 43210' },
        ...(cur ? [{ who: 'bot' as const, text: ask(cur.instruction), chips: cur.options ?? [], focus: true }] : []),
    ];

    const main = (
        <>
            {/* Card 1 — always asked */}
            <Card isDark={isDark} className={cn('gap-3', t.soft)}>
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
                                isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-200' : 'bg-white border-[#E5E5E5] text-[#333333]',
                            )}
                        >
                            <LockIcon isDark={isDark} />
                            {label}
                        </span>
                    ))}
                </div>
            </Card>

            {/* Card 2 — the plan's questions */}
            <Card isDark={isDark}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 flex-[1_1_300px] min-w-0">
                        <h2 className={cn('m-0 text-[18px] font-extrabold tracking-[-0.02em]', t.text)}>Then the bot asks these</h2>
                        <p className={cn('m-0 text-sm leading-[1.55] max-w-[363px]', t.muted)}>{ruleLine}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <span className={cn('text-[13px] font-extrabold text-right', t.text)}>{n} of {max} questions</span>
                        <span aria-hidden="true" className={cn('h-1.5 rounded-[3px] overflow-hidden flex', isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]')}>
                            <span className={cn('block h-1.5 rounded-[3px] transition-[width]', isDark ? 'bg-white' : 'bg-[#111111]')} style={{ width: `${barWidth}%` }} />
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    {questions.map((q, i) => {
                        const open = q.id === openId;
                        const num = i + 1;
                        const title = (q.label || '').trim() || `Question ${num}`;
                        const opts = q.options ?? [];
                        const err = showErrors && isInvalid(q);
                        const missingLabel = showErrors && !(q.label || '').trim();
                        const missingInstr = showErrors && !(q.instruction || '').trim();
                        const idL = `s4-ql-${q.id}`;
                        const idI = `s4-qi-${q.id}`;
                        const idO = `s4-qo-${q.id}`;
                        const numClass = cn(
                            'w-[30px] h-[30px] flex-none rounded-full flex items-center justify-center text-[13px] font-extrabold',
                            open
                                ? (isDark ? 'bg-white text-black' : 'bg-[#111111] text-white')
                                : err
                                    ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                    : (isDark ? 'bg-neutral-800 text-neutral-100' : 'bg-[#F2F2F2] text-[#111111]'),
                        );
                        const summary = err
                            ? `Add ${[missingLabel && 'a title', missingInstr && 'what the bot should ask'].filter(Boolean).join(' and ')}`
                            : ((q.instruction || '').trim() || 'No instruction yet') + (opts.length ? ` · ${opts.length} quick ${opts.length === 1 ? 'reply' : 'replies'}` : '');

                        return (
                            <div
                                key={q.id}
                                className={cn(
                                    'rounded-[14px] overflow-hidden',
                                    open
                                        ? (isDark ? 'border-2 border-white bg-neutral-950' : 'border-2 border-[#111111] bg-[#FAFAFA]')
                                        : (isDark ? 'border border-neutral-800 bg-neutral-900' : 'border border-[#E5E5E5] bg-white'),
                                    err && 'border-[#B91C1C]',
                                )}
                            >
                                {!open && (
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(q.id)}
                                        aria-expanded={false}
                                        className="flex items-center gap-3 w-full min-h-[60px] px-3.5 py-2.5 border-none bg-transparent cursor-pointer text-left"
                                    >
                                        <span className={numClass}>{num}</span>
                                        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                                            <span className={cn('text-[14.5px] font-extrabold', t.text)}>{title}</span>
                                            <span className={cn('text-[12.5px] truncate', err ? 'text-[#B91C1C] font-semibold' : t.hint)}>{summary}</span>
                                        </span>
                                        <Chevron open={false} isDark={isDark} />
                                    </button>
                                )}

                                {open && (
                                    <>
                                        <div className="flex items-center gap-3 min-h-[60px] px-3.5 py-2.5">
                                            <span className={numClass}>{num}</span>
                                            <label className="sr-only" htmlFor={idL}>Question title</label>
                                            <div
                                                className={cn(
                                                    'flex-1 min-w-0 flex items-center gap-2 h-[42px] px-3 rounded-[10px] border-[1.5px] transition-shadow focus-within:ring-[3px]',
                                                    isDark
                                                        ? 'bg-neutral-950 border-neutral-700 focus-within:border-white focus-within:ring-white/15'
                                                        : 'bg-white border-[#E5E5E5] focus-within:border-[#111111] focus-within:ring-black/10',
                                                    missingLabel && 'border-[#B91C1C] focus-within:border-[#B91C1C]',
                                                )}
                                            >
                                                <input
                                                    id={idL}
                                                    value={q.label ?? ''}
                                                    onChange={(e) => patch(q.id, { label: e.target.value })}
                                                    placeholder="Question title, e.g. Budget"
                                                    aria-invalid={missingLabel || undefined}
                                                    className={cn(
                                                        'flex-1 min-w-0 h-[38px] border-none outline-none bg-transparent text-[14.5px] font-extrabold',
                                                        isDark ? 'text-white placeholder-neutral-500' : 'text-[#0A0A0A] placeholder-[#A3A3A3]',
                                                    )}
                                                />
                                                <Icon.edit size={15} className={isDark ? 'text-neutral-400' : 'text-[#6B6B6B]'} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenId(null)}
                                                aria-label="Collapse question"
                                                aria-expanded={true}
                                                className={cn(
                                                    'w-10 h-10 flex-none border-none rounded-[10px] bg-transparent cursor-pointer flex items-center justify-center',
                                                    isDark ? 'hover:bg-neutral-800' : 'hover:bg-[#F2F2F2]',
                                                )}
                                            >
                                                <Chevron open isDark={isDark} />
                                            </button>
                                        </div>

                                        <div className={cn('p-4 flex flex-col gap-3.5 border-t', t.border)}>
                                            {missingLabel && (
                                                <p className="m-0 text-[12.5px] font-semibold text-[#B91C1C]" role="alert">Give this question a title.</p>
                                            )}
                                            <Field
                                                isDark={isDark}
                                                label="What should the bot ask?"
                                                htmlFor={idI}
                                                required
                                                tech="instruction"
                                                hint="Write it as an instruction. The AI turns it into a friendly question."
                                                error={missingInstr && 'Write what the bot should ask.'}
                                            >
                                                <Textarea
                                                    isDark={isDark}
                                                    id={idI}
                                                    rows={2}
                                                    value={q.instruction ?? ''}
                                                    onChange={(e) => patch(q.id, { instruction: e.target.value })}
                                                    placeholder="Example: Ask the user what their monthly budget is."
                                                    invalid={missingInstr}
                                                />
                                            </Field>

                                            <div className="flex flex-col gap-2 min-w-0">
                                                <span className={cn('text-[13px] font-bold flex items-center gap-2 flex-wrap', t.text)}>
                                                    Quick replies <span className={cn('font-medium', t.hint)}>optional</span>
                                                </span>
                                                {opts.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {opts.map((o, oi) => (
                                                            <span
                                                                key={`${o}-${oi}`}
                                                                className={cn(
                                                                    'inline-flex items-center gap-0.5 min-h-[36px] pl-3 pr-1 rounded-full border-[1.5px] text-[13px] font-bold',
                                                                    isDark ? 'border-neutral-700 bg-neutral-900 text-neutral-100' : 'border-[#D4D4D4] bg-white text-[#111111]',
                                                                )}
                                                            >
                                                                {o}
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Remove quick reply ${o}`}
                                                                    onClick={() => removeOption(q, oi)}
                                                                    className={cn(
                                                                        'w-7 h-7 border-none rounded-[14px] bg-transparent cursor-pointer flex items-center justify-center',
                                                                        isDark ? 'text-neutral-100 hover:bg-neutral-800' : 'text-[#111111] hover:bg-[#F2F2F2]',
                                                                    )}
                                                                >
                                                                    <Icon.x size={14} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <label className="sr-only" htmlFor={idO}>New quick reply</label>
                                                    <Input
                                                        isDark={isDark}
                                                        id={idO}
                                                        value={drafts[q.id] ?? ''}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setDrafts((d) => ({ ...d, [q.id]: v }));
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                addOption(q);
                                                            }
                                                        }}
                                                        placeholder="Add a reply, e.g. This week"
                                                    />
                                                    <button type="button" onClick={() => addOption(q)} className={buttonClass(isDark, 'secondary', 'flex-none')}>
                                                        Add
                                                    </button>
                                                </div>
                                            </div>

                                            {canRemove && (
                                                <button
                                                    type="button"
                                                    onClick={() => remove(q.id)}
                                                    className={buttonClass(isDark, 'ghost', 'self-start text-[#B91C1C]')}
                                                >
                                                    Remove this question
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {showErrors && n < min && (
                    <p className="m-0 text-[12.5px] font-semibold text-[#B91C1C]" role="alert">
                        Add at least {min - n} more question{min - n === 1 ? '' : 's'}. This plan needs {min === max ? `exactly ${min}` : `${min} to ${max}`}.
                    </p>
                )}

                {canAdd && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button type="button" onClick={() => add('', '', [])} className={buttonClass(isDark, 'secondary')}>
                            + Add question
                        </button>
                        {ideas.length > 0 && <Hint isDark={isDark}>or add a common one:</Hint>}
                        {ideas.map(([label, instruction, options]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => add(label, instruction, options)}
                                className={cn(
                                    'min-h-[36px] px-3 rounded-full border border-dashed text-[12.5px] font-bold cursor-pointer transition-colors',
                                    isDark ? 'border-neutral-600 bg-neutral-900 text-white hover:bg-neutral-800' : 'border-[#A3A3A3] bg-white text-black hover:bg-[#F7F7F7]',
                                )}
                            >
                                + {label}
                            </button>
                        ))}
                    </div>
                )}

                {atMax && <Hint isDark={isDark} className="font-semibold">{maxLine}</Hint>}
            </Card>
        </>
    );

    const aside = (
        <PreviewPanel isDark={isDark} rightLabel="Sample chat">
            <PhonePreview
                mode="chat"
                companyName={company}
                botDisplayName={botName}
                botAvatar={form.config.botAvatar}
                primary={form.config.colors?.primary || '#111111'}
                secondary={form.config.colors?.secondary || '#737373'}
                messages={messages}
            />
        </PreviewPanel>
    );

    return <StepColumns main={main} aside={aside} />;
};
