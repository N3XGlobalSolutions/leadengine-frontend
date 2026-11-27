/**
 * Step 4 on S3 Max ("What the bot asks"): nothing to configure — the AI writes the questions.
 * Shows a readiness checklist (document + lead criteria), how each chat runs, and a sample chat preview.
 * Design: spec7.html.
 */
import React from 'react';
import { cn } from '../../../../utils/cn';
import type { PreviewMessage, StepProps } from '../../../../types/onboarding';
import { Button, Card, Hint, Icon, PanelCard, PreviewPanel, StepColumns, tone } from '../ui';
import { PhonePreview } from '../PhonePreview';

/** Sample chat from the design (the greeting is cut off at the top, as in the spec). */
const SAMPLE_CHAT: PreviewMessage[] = [
    { who: 'user', text: 'Priya' },
    { who: 'bot', text: 'Thanks, Priya! What’s the best number to reach you on?' },
    { who: 'user', text: '98765 43210' },
    { who: 'bot', text: 'What brings you in today — pain, a check-up, or something cosmetic?', note: 'Written by the AI' },
    { who: 'user', text: 'My tooth hurts when I drink something cold' },
    {
        who: 'bot',
        text: 'Sorry to hear that. How long has it been bothering you?',
        chips: ['A few days', 'A few weeks', 'Months'],
        focus: true,
        note: 'Next question adapts to the answer',
    },
];

const CHAT_STEPS: { title: string; sub: string }[] = [
    { title: 'Asks name and phone', sub: 'Same as every plan.' },
    { title: 'Asks questions that fit each visitor', sub: 'Written by the AI from the document. Between 3 and 20.' },
    { title: 'Marks the lead', sub: 'Qualified or Disqualified, using your lead criteria.' },
];

/** 26px round badge: black check (ok) or red "!" (missing). */
const StatusDot: React.FC<{ ok: boolean; isDark: boolean }> = ({ ok, isDark }) =>
    ok ? (
        <span
            aria-hidden="true"
            className={cn(
                'w-[26px] h-[26px] flex-none rounded-full flex items-center justify-center',
                isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white',
            )}
        >
            <Icon.check size={14} />
        </span>
    ) : (
        <span
            aria-hidden="true"
            className="w-[26px] h-[26px] flex-none rounded-full bg-[#B91C1C] text-white text-sm font-extrabold flex items-center justify-center"
        >
            !
        </span>
    );

/** Red "missing" checklist row with a fix button. */
const MissingRow: React.FC<{
    isDark: boolean;
    title: string;
    detail: string;
    action: string;
    onAction: () => void;
    className?: string;
}> = ({ isDark, title, detail, action, onAction, className }) => (
    <div
        className={cn(
            'flex flex-wrap items-center gap-3 px-4 py-3.5',
            isDark ? 'bg-red-950/40' : 'bg-[#FEF2F2]',
            className,
        )}
    >
        <StatusDot ok={false} isDark={isDark} />
        <span className="flex-[1_1_200px] min-w-0 flex flex-col gap-0.5">
            <span className={cn('text-sm font-bold', isDark ? 'text-red-400' : 'text-[#B91C1C]')}>{title}</span>
            <span className={cn('text-[13px]', tone(isDark).muted)}>{detail}</span>
        </span>
        <Button isDark={isDark} variant="secondary" onClick={onAction}>
            {action}
        </Button>
    </div>
);

export const Step4S3Max: React.FC<StepProps> = ({ form, file, goToStep, isDark }) => {
    const t = tone(isDark);
    const hasDoc = !!file;
    const hasCriteria = form.leadQualificationCriteria.trim().length > 0;
    const rowDivider = isDark ? 'border-t border-neutral-800' : 'border-t border-[#EEEEEE]';

    const companyName = form.name || form.config.companyName || '';
    const botDisplayName = form.config.botDisplayName || form.config.botName || 'Assistant';

    const main = (
        <Card isDark={isDark} className="gap-[22px]">
            <div className="flex flex-col gap-1.5">
                <h2 className={cn('m-0 text-[22px] font-extrabold tracking-[-0.02em]', t.text)}>Nothing to set up here</h2>
                <p className={cn('m-0 text-sm leading-[1.55]', t.muted)}>
                    On S3 Max, the AI asks the questions for you. Just check that it has what it needs.
                </p>
            </div>

            {/* Readiness checklist */}
            <div className={cn('flex flex-col border rounded-xl overflow-hidden', t.border)}>
                {hasDoc ? (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <StatusDot ok isDark={isDark} />
                        <span className={cn('flex-1 text-sm font-bold', t.text)}>Document uploaded</span>
                        <span className={cn('text-[13px] truncate max-w-[55%]', t.muted)} title={file?.name}>
                            {file?.name}
                        </span>
                    </div>
                ) : (
                    <MissingRow
                        isDark={isDark}
                        title="Document missing"
                        detail="S3 Max needs one to know what to ask."
                        action="Add document"
                        onAction={() => goToStep(3)}
                    />
                )}

                {hasCriteria ? (
                    <div className={cn('flex items-center gap-3 px-4 py-3.5', rowDivider)}>
                        <StatusDot ok isDark={isDark} />
                        <span className={cn('flex-1 text-sm font-bold', t.text)}>Lead criteria written</span>
                        <button
                            type="button"
                            onClick={() => goToStep(3)}
                            aria-label="Edit lead criteria"
                            className={cn(
                                'bg-transparent border-none p-0 cursor-pointer text-[13px] font-bold underline',
                                t.text,
                            )}
                        >
                            Edit
                        </button>
                    </div>
                ) : (
                    <MissingRow
                        isDark={isDark}
                        title="Lead criteria missing"
                        detail="S3 Max uses them to mark each lead Qualified or Disqualified."
                        action="Write criteria"
                        onAction={() => goToStep(3)}
                        className={rowDivider}
                    />
                )}
            </div>

            {/* What happens in each chat */}
            <div className="flex flex-col gap-3">
                <span className={cn('text-xs font-extrabold tracking-[0.06em] uppercase', t.muted)}>What happens in each chat</span>
                <ol className="list-none m-0 p-0 flex flex-col gap-3.5">
                    {CHAT_STEPS.map((s, i) => (
                        <li key={s.title} className="flex gap-3 items-start">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'w-[26px] h-[26px] flex-none rounded-full text-xs font-extrabold flex items-center justify-center',
                                    isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white',
                                )}
                            >
                                {i + 1}
                            </span>
                            <span className="flex flex-col gap-0.5 min-w-0">
                                <span className={cn('text-sm font-bold', t.text)}>{s.title}</span>
                                <span className={cn('text-[13px]', t.muted)}>{s.sub}</span>
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </Card>
    );

    const aside = (
        <PreviewPanel isDark={isDark} rightLabel="Sample chat">
            <PhonePreview
                mode="chat"
                companyName={companyName}
                botDisplayName={botDisplayName}
                botAvatar={form.config.botAvatar}
                primary={form.config.colors?.primary || '#111111'}
                secondary={form.config.colors?.secondary || '#737373'}
                messages={SAMPLE_CHAT}
            />
            <PanelCard isDark={isDark} className="flex-row items-center justify-between">
                <span className={cn('text-[13.5px] font-bold', t.text)}>After the chat, the AI marks</span>
                <span
                    className={cn(
                        'text-xs font-extrabold rounded-full px-2.5 py-[3px]',
                        isDark ? 'bg-neutral-700 text-white' : 'bg-[#E5E5E5] text-[#111111]',
                    )}
                >
                    Qualified
                </span>
            </PanelCard>
            <Hint isDark={isDark}>Example chat. Real questions depend on the document and each visitor’s answers.</Hint>
        </PreviewPanel>
    );

    return <StepColumns main={main} aside={aside} />;
};
