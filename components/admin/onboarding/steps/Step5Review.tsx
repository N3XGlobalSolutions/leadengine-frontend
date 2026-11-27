/**
 * Step 5 — Review & create.
 * Body only (the wizard renders header, stepper and the footer with "Create client").
 * Design: spec5.html — readiness card, four summary cards with Edit, and a "Chat flow" aside.
 */
import React from 'react';
import { cn } from '../../../../utils/cn';
import { getPlan, type StepId, type StepProps } from '../../../../types/onboarding';
import { validateStep } from '../../../../utils/onboardingValidation';
import { Button, Card, Icon, StepColumns, tone } from '../ui';

type FlowItem = { title: string; sub?: string; chips?: string[] };
type Problem = { step: StepId | null; message: string };

const FIXABLE_STEPS: StepId[] = [1, 2, 3, 4];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const clean = (arr?: (string | null | undefined)[]) => (arr ?? []).map((s) => (s ?? '').trim()).filter(Boolean);

const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
};

/** First line of the lead criteria, cut to ~120 chars, plus the line count. */
const criteriaPreview = (text: string): { preview: string; lines: number } => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { preview: '', lines: 0 };
    const first = lines[0];
    const cut = first.length > 120 ? first.slice(0, 120).trimEnd() : first;
    const truncated = first.length > 120 || lines.length > 1;
    return { preview: truncated ? `${cut}…` : cut, lines: lines.length };
};

/* ── Small building blocks ─────────────────────────────────────────────── */

const SummaryCard: React.FC<{ isDark: boolean; step: StepId; title: string; onEdit: () => void; children: React.ReactNode }> = ({ isDark, step, title, onEdit, children }) => (
    <Card isDark={isDark} className="gap-1.5">
        <div className="flex items-center justify-between gap-3 pb-1.5">
            <h2 className={cn('m-0 flex items-center gap-2.5 text-[18px] font-extrabold tracking-[-0.02em]', tone(isDark).text)}>
                <span
                    className={cn(
                        'flex-none w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12.5px] font-extrabold',
                        isDark ? 'bg-neutral-800 text-white' : 'bg-[#F2F2F2] text-[#111111]',
                    )}
                >
                    {step}
                </span>
                {title}
            </h2>
            <Button isDark={isDark} variant="ghost" className="min-h-[40px]" onClick={onEdit} aria-label={`Edit ${title}`}>
                Edit
            </Button>
        </div>
        {children}
    </Card>
);

const Row: React.FC<{ isDark: boolean; label: string; children: React.ReactNode }> = ({ isDark, label, children }) => (
    <div
        className={cn(
            'grid grid-cols-[110px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)] gap-3 py-2.5 border-t',
            isDark ? 'border-neutral-800' : 'border-[#EEEEEE]',
        )}
    >
        <dt className={cn('text-[13px] font-semibold', tone(isDark).hint)}>{label}</dt>
        <dd className={cn('m-0 text-sm font-semibold [overflow-wrap:anywhere]', tone(isDark).text)}>{children}</dd>
    </div>
);

const Muted: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
    <span className={cn('font-medium', tone(isDark).hint)}>{children}</span>
);

const Swatch: React.FC<{ isDark: boolean; color: string }> = ({ isDark, color }) => (
    <span
        aria-hidden="true"
        className={cn('inline-block w-[18px] h-[18px] rounded-md align-[-4px] mr-1.5 border', isDark ? 'border-white/20' : 'border-[rgba(15,23,42,0.12)]')}
        style={{ background: color }}
    />
);

/* ── Step 5 ────────────────────────────────────────────────────────────── */

export const Step5Review: React.FC<StepProps> = ({ form, file, slugStatus, goToStep, isDark }) => {
    const t = tone(isDark);
    const cfg = form.config;
    const plan = getPlan(form.plan);
    const planShort = plan.name.split(' · ')[0];

    const questions = (cfg.leadQualification?.questions ?? []).filter((q) => !q.isSystemGenerated);
    const mapQuestions = form.questionMapConfig?.question_map ?? [];

    /* Readiness */
    const allProblems = validateStep(5, form, file, slugStatus);
    const ready = allProblems.length === 0;
    const problems: Problem[] = [];
    if (!ready) {
        const seen = new Set<string>();
        FIXABLE_STEPS.forEach((step) => {
            validateStep(step, form, file, slugStatus).forEach((message) => {
                if (seen.has(message)) return;
                seen.add(message);
                problems.push({ step, message });
            });
        });
        allProblems.forEach((message) => {
            if (!seen.has(message)) {
                seen.add(message);
                problems.push({ step: null, message });
            }
        });
    }

    const questionsLine =
        plan.mode === 'ai'
            ? 'AI writes the questions (3–20 per chat)'
            : plan.mode === 'map'
                ? plural(mapQuestions.length, 'mapped question', 'mapped questions')
                : `${plural(questions.length, 'question', 'questions')} — ${planShort} allows ${plan.minQuestions === plan.maxQuestions ? `exactly ${plan.minQuestions}` : `${plan.minQuestions} to ${plan.maxQuestions}`}`;

    const slugLine: { text: string; warn: boolean } =
        slugStatus === 'free'
            ? { text: 'Chat page address is free', warn: false }
            : slugStatus === 'checking'
                ? { text: 'Checking the chat page address…', warn: false }
                : { text: 'Couldn’t check the address', warn: true };

    const readyItems: { text: string; warn?: boolean }[] = [
        { text: 'All required fields are filled' },
        { text: questionsLine },
        { text: file ? 'Document added for the bot to learn from' : 'No document — optional on this plan' },
        slugLine,
    ];

    /* Step 1 */
    const waId = (cfg.whatsapp_phone_number_id ?? '').trim();
    const whatsapp = cfg.whatsapp_enabled ? (waId ? `On · number ID ending ${waId.slice(-4)}` : 'On') : 'Off';

    /* Step 2 */
    const headline = (cfg.welcome?.headline ?? '').trim();
    const highlighted = (cfg.welcome?.highlightedHeadline ?? '').trim();
    const buttonText = (cfg.welcome?.startBtnText ?? '').trim();
    const tags = clean(cfg.welcome?.features);
    const primary = cfg.colors?.primary || '#111111';
    const secondary = cfg.colors?.secondary || '#737373';

    /* Step 3 */
    const criteria = criteriaPreview(form.leadQualificationCriteria ?? '');

    /* Chat flow (aside) */
    const flow: FlowItem[] = [
        {
            title: 'Welcome screen',
            sub: [[headline, highlighted].filter(Boolean).join(' '), buttonText].filter(Boolean).join(' · '),
        },
        { title: 'Name', sub: 'Asked automatically' },
        { title: 'Phone number', sub: 'Asked automatically' },
    ];
    if (plan.mode === 'manual') {
        questions.forEach((q, i) => {
            const chips = clean(q.options);
            flow.push({ title: q.label?.trim() || `Question ${i + 1}`, sub: chips.length ? '' : 'Visitor types their answer', chips });
        });
        flow.push({ title: 'Lead sorted as warm or cold', sub: 'Using your lead criteria. Your team sees it in Leads.' });
    } else if (plan.mode === 'ai') {
        flow.push({ title: 'Questions that fit each visitor', sub: 'Written by the AI from the document. Between 3 and 20.' });
        flow.push({ title: 'Lead marked Qualified or Disqualified', sub: 'Using your lead criteria. Your team sees it in Leads.' });
    } else {
        mapQuestions.forEach((q, i) => {
            const chips = clean((q.quick_replies ?? []).map((o) => o.text));
            flow.push({
                title: q.question?.trim() || `Question ${i + 1}`,
                sub: q.table ? 'Shows a table first' : chips.length ? '' : 'Visitor types their answer',
                chips,
            });
        });
        flow.push({ title: 'Lead scored from the answers', sub: 'Each answer’s score sorts the lead. Your team sees it in Leads.' });
    }

    const autoItems = (
        <>
            <li className="py-[3px]"><span className={t.hint}>Name (automatic)</span></li>
            <li className="py-[3px]"><span className={t.hint}>Phone number (automatic)</span></li>
        </>
    );

    const main = (
        <>
            {ready ? (
                <section
                    aria-labelledby="review-ready-title"
                    className={cn('rounded-2xl border p-6 flex flex-col gap-2.5', isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-[#FAFAFA] border-[#D4D4D4]')}
                >
                    <h2 id="review-ready-title" className={cn('m-0 text-[18px] font-extrabold tracking-[-0.02em]', isDark ? 'text-white' : 'text-[#111111]')}>
                        Everything looks ready
                    </h2>
                    <ul className="list-none m-0 p-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {readyItems.map((item) => (
                            <li key={item.text} className={cn('flex items-center gap-2 text-sm font-semibold', isDark ? 'text-neutral-100' : 'text-[#111111]')}>
                                {item.warn ? <Icon.alert size={14} className="flex-none" /> : <Icon.check size={14} className="flex-none" />}
                                {item.text}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : (
                <section
                    aria-labelledby="review-problems-title"
                    className={cn('rounded-2xl border p-6 flex flex-col gap-2.5', isDark ? 'bg-red-950/30 border-red-900' : 'bg-[#FEF2F2] border-[#FECACA]')}
                >
                    <h2 id="review-problems-title" className={cn('m-0 text-[18px] font-extrabold tracking-[-0.02em]', isDark ? 'text-red-300' : 'text-[#991B1B]')}>
                        {problems.length === 1 ? '1 thing to fix before you create' : `${problems.length} things to fix before you create`}
                    </h2>
                    <ul className="list-none m-0 p-0 flex flex-col">
                        {problems.map((p, i) => (
                            <li
                                key={`${p.step ?? 0}-${p.message}`}
                                className={cn(
                                    'flex items-center justify-between gap-3 py-1.5',
                                    i > 0 && 'border-t',
                                    isDark ? 'border-red-900/60' : 'border-[#FECACA]',
                                )}
                            >
                                <span className={cn('flex items-start gap-2 text-sm font-semibold min-w-0', t.text)}>
                                    <Icon.alert size={14} className={cn('flex-none mt-[3px]', isDark ? 'text-red-300' : 'text-[#B91C1C]')} />
                                    <span className="[overflow-wrap:anywhere]">{p.message}</span>
                                </span>
                                {p.step !== null && (
                                    <Button
                                        isDark={isDark}
                                        variant="ghost"
                                        className="min-h-[36px] flex-none"
                                        onClick={() => goToStep(p.step as StepId)}
                                        aria-label={`Fix: ${p.message}`}
                                    >
                                        Fix
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <SummaryCard isDark={isDark} step={1} title="Business & plan" onEdit={() => goToStep(1)}>
                <dl className="m-0">
                    <Row isDark={isDark} label="Company">{form.name.trim() || <Muted isDark={isDark}>Not set</Muted>}</Row>
                    <Row isDark={isDark} label="Short name">{cfg.shortName?.trim() || <Muted isDark={isDark}>Not set</Muted>}</Row>
                    <Row isDark={isDark} label="Chat page">
                        {form.slug ? `${window.location.host}/${form.slug}` : <Muted isDark={isDark}>Not set</Muted>}
                    </Row>
                    <Row isDark={isDark} label="Plan">{plan.name}</Row>
                    <Row isDark={isDark} label="WhatsApp">{whatsapp}</Row>
                </dl>
            </SummaryCard>

            <SummaryCard isDark={isDark} step={2} title="Look & welcome" onEdit={() => goToStep(2)}>
                <dl className="m-0">
                    <Row isDark={isDark} label="Bot">
                        {cfg.botName?.trim() || <Muted isDark={isDark}>Not set</Muted>}
                        {cfg.botDisplayName?.trim() && <> <Muted isDark={isDark}>({cfg.botDisplayName.trim()})</Muted></>}
                    </Row>
                    <Row isDark={isDark} label="Colours">
                        <Swatch isDark={isDark} color={primary} />
                        {primary.toUpperCase()}
                        {'  '}
                        <Swatch isDark={isDark} color={secondary} />
                        {secondary.toUpperCase()}
                    </Row>
                    <Row isDark={isDark} label="Headline">
                        {headline || highlighted ? (
                            <>
                                {headline}
                                {headline && highlighted ? ' ' : ''}
                                {highlighted && <span style={isDark ? undefined : { color: primary }}>{highlighted}</span>}
                            </>
                        ) : (
                            <Muted isDark={isDark}>Not set</Muted>
                        )}
                    </Row>
                    <Row isDark={isDark} label="Button">{buttonText || <Muted isDark={isDark}>Not set</Muted>}</Row>
                    <Row isDark={isDark} label="Tags">{tags.length ? tags.join(' · ') : <Muted isDark={isDark}>None</Muted>}</Row>
                </dl>
            </SummaryCard>

            <SummaryCard isDark={isDark} step={3} title="Knowledge" onEdit={() => goToStep(3)}>
                <dl className="m-0">
                    <Row isDark={isDark} label="Document">
                        {file ? `${file.name} · ${formatSize(file.size)}` : <Muted isDark={isDark}>None</Muted>}
                    </Row>
                    <Row isDark={isDark} label="Good lead">
                        {criteria.lines ? (
                            <>
                                {criteria.preview} <Muted isDark={isDark}>({plural(criteria.lines, 'line', 'lines')})</Muted>
                            </>
                        ) : (
                            <Muted isDark={isDark}>Not written yet</Muted>
                        )}
                    </Row>
                </dl>
            </SummaryCard>

            <SummaryCard isDark={isDark} step={4} title="Questions" onEdit={() => goToStep(4)}>
                <ol className={cn('list-decimal mt-1 mb-0 pl-[22px] text-sm font-semibold leading-[1.5]', t.text)}>
                    {autoItems}
                    {plan.mode === 'manual' &&
                        questions.map((q, i) => {
                            const n = clean(q.options).length;
                            return (
                                <li key={q.id || i} className="py-[3px] [overflow-wrap:anywhere]">
                                    {q.label?.trim() || `Question ${i + 1}`}
                                    {n > 0 && ` · ${plural(n, 'quick reply', 'quick replies')}`}
                                </li>
                            );
                        })}
                    {plan.mode === 'ai' && (
                        <li className="py-[3px]">
                            Questions written by the AI <Muted isDark={isDark}>· from the document, 3 to 20 per chat</Muted>
                        </li>
                    )}
                    {plan.mode === 'map' &&
                        mapQuestions.map((q, i) => {
                            const n = clean((q.quick_replies ?? []).map((o) => o.text)).length;
                            return (
                                <li key={q.id || i} className="py-[3px] [overflow-wrap:anywhere]">
                                    {q.question?.trim() || `Question ${i + 1}`}
                                    {` · ${plural(n, 'answer', 'answers')}`}
                                    {q.table && <Muted isDark={isDark}> · has a table</Muted>}
                                </li>
                            );
                        })}
                </ol>
            </SummaryCard>
        </>
    );

    const aside = (
        <aside
            aria-label="Chat flow summary"
            className={cn('flex-[0_1_360px] min-w-[300px] w-full lg:sticky lg:top-5 flex flex-col gap-4 p-5 rounded-[18px] border box-border', t.card)}
        >
            <div className="flex flex-col gap-1">
                <span className={cn('text-xs font-extrabold tracking-[0.08em] uppercase', isDark ? 'text-neutral-300' : 'text-[#333333]')}>Chat flow</span>
                <span className={cn('text-[13px] leading-[1.5]', t.muted)}>What every visitor goes through, from start to finish.</span>
            </div>
            <ol className="list-none m-0 p-0 flex flex-col">
                {flow.map((f, i) => (
                    <li key={`${i}-${f.title}`} className="flex gap-3">
                        <span className="flex flex-col items-center flex-none w-[26px]">
                            <span
                                className={cn(
                                    'flex-none w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-extrabold',
                                    isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white',
                                )}
                            >
                                {i + 1}
                            </span>
                            {i < flow.length - 1 && (
                                <span aria-hidden="true" className={cn('flex-1 w-0.5 min-h-[12px]', isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]')} />
                            )}
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5 pb-4">
                            <span className={cn('text-sm font-bold [overflow-wrap:anywhere]', t.text)}>{f.title}</span>
                            {f.sub && <span className={cn('text-[12.5px] leading-[1.45]', t.muted)}>{f.sub}</span>}
                            {f.chips && f.chips.length > 0 && (
                                <span className="flex flex-wrap gap-1">
                                    {f.chips.map((c, ci) => (
                                        <span
                                            key={`${ci}-${c}`}
                                            className={cn(
                                                'text-[11.5px] font-semibold border rounded-md px-[7px] py-0.5',
                                                isDark ? 'text-neutral-300 border-neutral-700' : 'text-[#333333] border-[#E5E5E5]',
                                            )}
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </span>
                            )}
                        </span>
                    </li>
                ))}
            </ol>
        </aside>
    );

    return <StepColumns main={main} aside={aside} />;
};
