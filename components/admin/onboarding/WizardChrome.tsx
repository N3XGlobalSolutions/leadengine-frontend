/**
 * Page chrome for the onboarding wizard (everything outside the step body):
 * draft pill, step header, stepper, footer, error banner and confirm dialog.
 * The top bar itself (breadcrumb "Clients / Add new client" + the draft pill slot) is drawn by AdminLayout.
 * Design: spec1.html / spec5.html (header, <ol> stepper, footer card).
 */
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { STEPS, type StepId } from '../../../types/onboarding';
import type { DraftSaveStatus } from '../../../types/draft';
import { Button, Icon, Mark, buttonClass, tone } from './ui';

type D = { isDark: boolean };

/** Small spinning ring (stroke = currentColor). */
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('animate-spin', className)}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** "Draft saved · 1:25 PM" pill, passed to AdminLayout's `headerRight`. Renders an empty span when idle. */
export const DraftPill: React.FC<D & { status: DraftSaveStatus; lastSavedAt: Date | null }> = ({ isDark, status, lastSavedAt }) => {
    if (status === 'idle') return <span />;
    const label = status === 'saving'
        ? 'Saving…'
        : status === 'error'
            ? 'Couldn’t save draft'
            : `Draft saved${lastSavedAt ? ` · ${formatTime(lastSavedAt)}` : ''}`;
    return (
        <span
            role="status"
            aria-live="polite"
            className={cn(
                'inline-flex items-center gap-2 text-[12.5px] font-semibold rounded-full border px-3 py-[5px]',
                isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-[#F2F2F2] border-[#D4D4D4] text-[#171717]',
                status === 'error' && (isDark ? 'text-red-300' : 'text-[#B91C1C]'),
            )}
        >
            {status === 'saving'
                ? <Spinner size={12} />
                : <span className={cn('w-[7px] h-[7px] rounded', status === 'error' ? 'bg-[#B91C1C]' : isDark ? 'bg-neutral-100' : 'bg-[#171717]')} />}
            {label}
        </span>
    );
};

/** "Step N of 5" pill, 38px h1 with highlighted words, intro paragraph, optional right slot. */
export const WizardHeader: React.FC<D & { step: StepId; intro: string; right?: React.ReactNode }> = ({ isDark, step, intro, right }) => {
    const t = tone(isDark);
    const meta = STEPS[step - 1];
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2.5 items-start min-w-0">
                <span className={cn(
                    'text-xs font-extrabold tracking-[0.08em] uppercase rounded-full px-3 py-[5px]',
                    isDark ? 'bg-neutral-800 text-white' : 'bg-[#F2F2F2] text-black',
                )}>
                    Step {step} of {STEPS.length}
                </span>
                <h1 className={cn('m-0 text-[30px] sm:text-[38px] leading-[1.1] font-extrabold tracking-[-0.035em]', t.text)}>
                    {meta.h1Before}<Mark isDark={isDark}>{meta.h1Mark}</Mark>
                </h1>
                <p className={cn('m-0 text-base leading-[1.55] max-w-[640px]', t.muted)}>{intro}</p>
            </div>
            {right}
        </div>
    );
};

/** "Plan: S2 · Professional  Change" pill shown in the step 4 header (manual plans). */
export const PlanChip: React.FC<D & { planName: string; onChange: () => void }> = ({ isDark, planName, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        aria-label={`Plan: ${planName}. Change plan`}
        className={cn(
            'inline-flex items-center gap-2 min-h-10 px-3.5 rounded-full border text-[13px] font-bold cursor-pointer transition-colors',
            isDark ? 'bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800' : 'bg-white border-[#E5E5E5] text-[#0A0A0A] hover:bg-[#F7F7F7]',
        )}
    >
        Plan: {planName}
        <span className={cn('underline-offset-2 hover:underline', isDark ? 'text-white' : 'text-black')}>Change</span>
    </button>
);

/** Stepper card: 4px bars, numbered circles; done = check, current = outlined. */
export const WizardStepper: React.FC<D & {
    current: StepId;
    canGoTo: (step: StepId) => boolean;
    onGo: (step: StepId) => void;
}> = ({ isDark, current, canGoTo, onGo }) => {
    const t = tone(isDark);
    return (
        <ol aria-label="Steps" className={cn('list-none m-0 px-5 py-[18px] flex flex-wrap gap-x-5 gap-y-4 rounded-2xl border', t.card)}>
            {STEPS.map((s) => {
                const state = s.id < current ? 'done' : s.id === current ? 'current' : 'todo';
                const enabled = s.id === current || canGoTo(s.id);
                return (
                    <li key={s.id} aria-current={state === 'current' ? 'step' : undefined} className="flex-[1_1_150px] flex flex-col gap-2.5">
                        <span
                            aria-hidden="true"
                            className={cn(
                                'h-1 rounded-sm',
                                state === 'done' && (isDark ? 'bg-white' : 'bg-[#111111]'),
                                state === 'current' && (isDark ? 'bg-neutral-500' : 'bg-[#A3A3A3]'),
                                state === 'todo' && (isDark ? 'bg-neutral-800' : 'bg-[#E5E5E5]'),
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => { if (s.id !== current) onGo(s.id); }}
                            disabled={!enabled}
                            title={!enabled ? 'Finish the earlier steps first' : undefined}
                            aria-label={`Step ${s.id}: ${s.title}${state === 'done' ? ' (done)' : ''}`}
                            className={cn(
                                'flex items-center gap-2.5 text-left bg-transparent border-0 p-0 rounded-lg',
                                'focus:outline-none focus-visible:ring-[3px]',
                                isDark ? 'focus-visible:ring-white/20' : 'focus-visible:ring-black/10',
                                s.id === current ? 'cursor-default' : 'cursor-pointer disabled:cursor-not-allowed',
                            )}
                        >
                            {state === 'done' ? (
                                <span className={cn('w-[30px] h-[30px] rounded-full flex-none flex items-center justify-center', isDark ? 'bg-white' : 'bg-[#111111]')}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#000000' : '#FFFFFF'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                                </span>
                            ) : state === 'current' ? (
                                <span className={cn(
                                    'w-[30px] h-[30px] rounded-full flex-none box-border border-2 text-[13px] font-extrabold flex items-center justify-center',
                                    isDark ? 'bg-neutral-900 border-white text-white' : 'bg-white border-[#111111] text-black',
                                )}>{s.id}</span>
                            ) : (
                                <span className={cn(
                                    'w-[30px] h-[30px] rounded-full flex-none text-[13px] font-bold flex items-center justify-center',
                                    isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-[#F2F2F2] text-[#6B6B6B]',
                                )}>{s.id}</span>
                            )}
                            <span className="flex flex-col gap-px">
                                <span className={cn(
                                    'text-sm',
                                    state === 'done' && cn('font-bold', t.text),
                                    state === 'current' && cn('font-extrabold', isDark ? 'text-white' : 'text-black'),
                                    state === 'todo' && cn('font-semibold', t.muted),
                                )}>{s.title}</span>
                                <span className={cn('text-xs', t.hint)}>{s.sub}</span>
                            </span>
                        </button>
                    </li>
                );
            })}
        </ol>
    );
};

/** Footer card. Steps 1–4: Cancel/Back · Save & finish later · Next. Step 5: Back · note · Create client. */
export const WizardFooter: React.FC<D & {
    step: StepId;
    nextLabel: string;
    onBack: () => void;
    onNext: () => void;
    onSaveLater: () => void;
    savingLater: boolean;
    onCreate: () => void;
    creating: boolean;
}> = ({ isDark, step, nextLabel, onBack, onNext, onSaveLater, savingLater, onCreate, creating }) => {
    const t = tone(isDark);
    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl border', t.card)}>
            {step === 1 ? (
                <Link to="/admin/clients" className={buttonClass(isDark, 'secondary')}>Cancel</Link>
            ) : (
                <Button isDark={isDark} variant="secondary" onClick={onBack} disabled={creating}>
                    <Icon.arrowLeft size={16} />Back
                </Button>
            )}
            {step === 5 ? (
                <div className="flex flex-wrap items-center gap-3">
                    <span className={cn('text-[12.5px] leading-[1.5]', t.hint)}>The chat page goes live as soon as you create the client.</span>
                    <Button isDark={isDark} variant="primary" onClick={onCreate} disabled={creating} aria-busy={creating || undefined} className="min-h-12 px-[22px]">
                        {creating ? <>Creating…<Spinner size={16} /></> : <>{nextLabel}<Icon.check size={16} /></>}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button isDark={isDark} variant="ghost" onClick={onSaveLater} disabled={savingLater}>
                        {savingLater && <Spinner size={14} />}Save &amp; finish later
                    </Button>
                    <Button isDark={isDark} variant="primary" onClick={onNext}>
                        {nextLabel}<Icon.arrowRight size={16} />
                    </Button>
                </div>
            )}
        </div>
    );
};

/** Red alert card listing what still needs fixing (or a single failure message). */
export const ErrorBanner: React.FC<D & { title: string; messages?: string[]; className?: string }> = ({ isDark, title, messages, className }) => (
    <div
        role="alert"
        className={cn(
            'flex items-start gap-3 rounded-2xl border px-5 py-4',
            isDark ? 'bg-red-950/40 border-red-900 text-red-200' : 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]',
            className,
        )}
    >
        <span className={cn('flex-none mt-0.5', isDark ? 'text-red-300' : 'text-[#B91C1C]')}><Icon.alert size={18} /></span>
        <div className="flex flex-col gap-1.5 min-w-0">
            <p className={cn('m-0 text-sm font-bold', isDark ? 'text-red-300' : 'text-[#B91C1C]')}>{title}</p>
            {messages && messages.length > 0 && (
                <ul className="m-0 pl-4 list-disc flex flex-col gap-0.5 text-[13.5px] leading-[1.55]">
                    {messages.map((m) => <li key={m}>{m}</li>)}
                </ul>
            )}
        </div>
    </div>
);

/** Small modal (black/white design) used to confirm destructive choices, e.g. trimming questions on a plan change. */
export const ConfirmDialog: React.FC<D & {
    open: boolean;
    title: string;
    children: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isDark, open, title, children, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel }) => {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const t = tone(isDark);

    useEffect(() => {
        if (!open) return;
        cancelRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-jakarta" onClick={onCancel}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="wizard-confirm-title"
                onClick={(e) => e.stopPropagation()}
                className={cn('w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl', t.card)}
            >
                <div className="flex items-start gap-3">
                    <span className={cn('flex-none w-10 h-10 rounded-full flex items-center justify-center', t.subtle, t.text)}><Icon.alert size={18} /></span>
                    <div className="flex flex-col gap-1.5 min-w-0">
                        <h2 id="wizard-confirm-title" className={cn('m-0 text-[18px] font-extrabold tracking-[-0.02em]', t.text)}>{title}</h2>
                        <div className={cn('text-sm leading-[1.55]', t.muted)}>{children}</div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2.5">
                    <button ref={cancelRef} type="button" onClick={onCancel} className={buttonClass(isDark, 'secondary')}>{cancelLabel}</button>
                    <Button isDark={isDark} variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
                </div>
            </div>
        </div>
    );
};
