/**
 * "Add new client" onboarding wizard (5 steps + success screen).
 * Owns the form state, draft autosave/recovery, slug availability check, validation,
 * the page chrome (top bar, header, stepper, footer) and the createClient submit.
 * Step bodies live in components/admin/onboarding/steps/*.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DraftRecoveryModal } from '../../components/admin/DraftRecoveryModal';
import { useDraftAutosave } from '../../hooks/useDraftAutosave';
import { createClient, ingestDocument } from '../../services/adminService';
import { api } from '../../services/api';
import { DEFAULT_TENANT_CONFIG, type Question, type TenantConfig } from '../../types/config';
import type { Client } from '../../types/admin';
import type { QuestionMapConfig } from '../../components/admin/QuestionMapEditor';
import {
    PLANS, STEPS, STEP4_INTRO, getPlan, slugify,
    type OnboardingForm, type PlanCode, type SlugStatus, type StepId, type StepProps,
} from '../../types/onboarding';
import { firstInvalidStep, validateStep } from '../../utils/onboardingValidation';
import { cn } from '../../utils/cn';
import { tone } from '../../components/admin/onboarding/ui';
import {
    ConfirmDialog, DraftPill, ErrorBanner, PlanChip, WizardFooter, WizardHeader, WizardStepper,
} from '../../components/admin/onboarding/WizardChrome';
import { Step1Business } from '../../components/admin/onboarding/steps/Step1Business';
import { Step2Look } from '../../components/admin/onboarding/steps/Step2Look';
import { Step3Knowledge } from '../../components/admin/onboarding/steps/Step3Knowledge';
import { Step4Questions } from '../../components/admin/onboarding/steps/Step4Questions';
import { Step4S3Max } from '../../components/admin/onboarding/steps/Step4S3Max';
import { Step4S3Mapping } from '../../components/admin/onboarding/steps/Step4S3Mapping';
import { Step5Review } from '../../components/admin/onboarding/steps/Step5Review';
import { ClientCreated } from '../../components/admin/onboarding/ClientCreated';

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

const makeInitialConfig = (): TenantConfig => {
    const config: TenantConfig = JSON.parse(JSON.stringify(DEFAULT_TENANT_CONFIG));
    config.colors = { primary: '#111111', secondary: '#737373' };
    config.botAvatar = '';
    config.welcome.highlightedHeadline = '';
    return config;
};

const makeInitialForm = (): OnboardingForm => ({
    name: '',
    slug: '',
    slugEdited: false,
    shortNameEdited: false,
    plan: 'S2',
    config: makeInitialConfig(),
    leadQualificationCriteria: '',
    questionMapConfig: { question_map: [] },
});

/** Baseline for the draft hook: a pristine form is never saved (currentStep is ignored by the hook). */
const INITIAL_DRAFT_PAYLOAD = { form: makeInitialForm() };

const firstWord = (name: string) => name.trim().split(/\s+/)[0] || '';

/** Keep short name / slug / highlighted headline following the company name until the admin edits them. */
const applyNameAutofill = (prev: OnboardingForm, next: OnboardingForm): OnboardingForm => {
    // Compare trimmed: Step2Look pre-fills the headline with the trimmed name.
    const headline = (next.config.welcome.highlightedHeadline ?? '').trim();
    const followHeadline = headline === '' || headline === prev.name.trim();
    return {
        ...next,
        slug: next.slugEdited ? next.slug : slugify(next.name),
        config: {
            ...next.config,
            shortName: next.shortNameEdited ? next.config.shortName : firstWord(next.name),
            welcome: followHeadline ? { ...next.config.welcome, highlightedHeadline: next.name } : next.config.welcome,
        },
    };
};

const blankQuestion = (id: string): Question => ({ id, label: '', instruction: '', collects: [], options: [] });

/** Pad with empty questions up to `count`, using unused ids q1..qN. */
const padQuestions = (questions: Question[], count: number): Question[] => {
    const used = new Set(questions.map((q) => q.id));
    const out = [...questions];
    let k = 1;
    while (out.length < count) {
        while (used.has(`q${k}`)) k += 1;
        used.add(`q${k}`);
        out.push(blankQuestion(`q${k}`));
    }
    return out;
};

const withQuestions = (form: OnboardingForm, questions: Question[]): OnboardingForm => ({
    ...form,
    config: { ...form.config, leadQualification: { ...form.config.leadQualification, questions } },
});

/** '#abc' / 'abcdef' → '#AABBCC'; anything else (old page allowed free text) → fallback. Backend requires #RRGGBB. */
const hexOr = (v: unknown, fallback: string): string => {
    const s = typeof v === 'string' ? v.trim().replace(/^#/, '') : '';
    if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toUpperCase()}`;
    if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s.split('').map((ch) => ch + ch).join('').toUpperCase()}`;
    return fallback;
};

/** Old AddClientPage could save duplicate ids (q{length+1} after a removal); give duplicates unused ids. */
const dedupeQuestionIds = (questions: Question[]): Question[] => {
    const taken = new Set(questions.map((q) => q.id));
    const seen = new Set<string>();
    let k = 1;
    return questions.map((q) => {
        if (q.id && !seen.has(q.id)) {
            seen.add(q.id);
            return q;
        }
        while (taken.has(`q${k}`)) k += 1;
        const id = `q${k}`;
        taken.add(id);
        seen.add(id);
        return { ...q, id };
    });
};

/** Merge a (possibly partial / older) saved config over today's defaults so nothing is undefined. */
const mergeConfig = (saved: unknown): TenantConfig => {
    const base = makeInitialConfig();
    if (!saved || typeof saved !== 'object') return base;
    const c = saved as Partial<TenantConfig>;
    return {
        ...base,
        ...c,
        colors: {
            primary: hexOr(c.colors?.primary, base.colors.primary),
            secondary: hexOr(c.colors?.secondary, base.colors.secondary),
        },
        welcome: { ...base.welcome, ...(c.welcome ?? {}) },
        leadQualification: {
            ...base.leadQualification,
            ...(c.leadQualification ?? {}),
            questions: Array.isArray(c.leadQualification?.questions)
                ? dedupeQuestionIds(c.leadQualification!.questions)
                : base.leadQualification.questions,
        },
        messages: { ...base.messages, ...(c.messages ?? {}) },
    };
};

const isPlanCode = (v: unknown): v is PlanCode => PLANS.some((p) => p.code === v);

const clampStep = (n: unknown): StepId => {
    const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 1;
    return Math.min(5, Math.max(1, v)) as StepId;
};

const asQuestionMap = (v: unknown): QuestionMapConfig =>
    v && typeof v === 'object' && Array.isArray((v as QuestionMapConfig).question_map)
        ? { ...(v as QuestionMapConfig) }
        : { question_map: [] };

/** Old AddClientPage steps (1-6) → wizard steps (1-5). */
const OLD_STEP_MAP: Record<number, StepId> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 5 };

/** Read a server draft in either the new `{ form, currentStep }` shape or the old AddClientPage shape. */
const restoreDraft = (data: Record<string, unknown> | undefined | null): { form: OnboardingForm; step: StepId } | null => {
    if (!data || typeof data !== 'object') return null;
    const fresh = makeInitialForm();

    if (data.form && typeof data.form === 'object') {
        const f = data.form as Partial<OnboardingForm>;
        return {
            form: {
                ...fresh,
                ...f,
                name: typeof f.name === 'string' ? f.name : '',
                slug: typeof f.slug === 'string' ? f.slug : '',
                slugEdited: !!f.slugEdited,
                shortNameEdited: !!f.shortNameEdited,
                plan: isPlanCode(f.plan) ? f.plan : fresh.plan,
                config: mergeConfig(f.config),
                leadQualificationCriteria: typeof f.leadQualificationCriteria === 'string' ? f.leadQualificationCriteria : '',
                questionMapConfig: asQuestionMap(f.questionMapConfig),
            },
            step: clampStep(data.currentStep),
        };
    }

    if (data.formData && typeof data.formData === 'object') {
        const fd = data.formData as { name?: unknown; slug?: unknown; plan?: unknown; config?: unknown };
        const oldStep = typeof data.currentStep === 'number' ? Math.round(data.currentStep) : 1;
        const name = typeof fd.name === 'string' ? fd.name : '';
        const slug = typeof fd.slug === 'string' ? fd.slug : '';
        const config = mergeConfig(fd.config);
        return {
            form: {
                ...fresh,
                name,
                slug,
                // Old page always derived the slug from the name; only a hand-edited slug differs.
                slugEdited: slug !== '' && slug !== slugify(name),
                // Old page never auto-filled the short name, so a non-empty one was typed by hand.
                shortNameEdited: typeof config.shortName === 'string' && config.shortName.trim() !== '',
                plan: isPlanCode(fd.plan) ? fd.plan : fresh.plan,
                config,
                leadQualificationCriteria: typeof data.leadQualificationCriteria === 'string' ? data.leadQualificationCriteria : '',
                questionMapConfig: asQuestionMap(data.questionMapConfig),
            },
            step: OLD_STEP_MAP[oldStep] ?? 1,
        };
    }
    return null;
};

/** Pull a readable reason out of an axios-style error, if the API sent one. */
const apiErrorDetail = (e: unknown): string => {
    const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        const msgs = detail.map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : '')).filter(Boolean);
        if (msgs.length) return msgs.join('; ');
    }
    return '';
};

const scrollToTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
};

interface CreatedState {
    client: Client;
    form: OnboardingForm;
    fileName: string | null;
    documentFailed: boolean;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const OnboardingWizardPage: React.FC = () => {
    const navigate = useNavigate();
    const { isDark } = useAdminTheme();
    const t = tone(isDark);

    const [form, setFormState] = useState<OnboardingForm>(makeInitialForm);
    const [step, setStep] = useState<StepId>(1);
    const [file, setFile] = useState<File | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
    const [pendingPlan, setPendingPlan] = useState<PlanCode | null>(null);
    const [saving, setSaving] = useState(false);
    const [savingLater, setSavingLater] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [created, setCreated] = useState<CreatedState | null>(null);

    // --- Draft autosave ------------------------------------------------------
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftReady, setDraftReady] = useState(false);

    const draftPayload = useMemo(() => ({ form, currentStep: step }), [form, step]);
    const { saveStatus, lastSavedAt, loadedDraft, loadDraft, deleteDraft, forceSave } = useDraftAutosave(draftPayload, {
        enabled: draftReady,
        draftType: 'client_creation',
        initialValue: INITIAL_DRAFT_PAYLOAD,
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const draft = await loadDraft();
            if (cancelled) return;
            if (draft) setShowDraftModal(true);
            else setDraftReady(true);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleResumeDraft = () => {
        const restored = restoreDraft(loadedDraft?.draft_data);
        if (restored) {
            setFormState(restored.form);
            setStep(restored.step);
        }
        setShowDraftModal(false);
        // Delay enabling autosave so the just-restored data isn't immediately re-saved
        setTimeout(() => setDraftReady(true), 1000);
    };

    const handleDiscardDraft = async () => {
        await deleteDraft();
        setShowDraftModal(false);
        setDraftReady(true);
    };

    // --- Form setters ----------------------------------------------------------
    const setForm = useCallback<StepProps['setForm']>((updater) => {
        setFormState((prev) => {
            const next = updater(prev);
            return next !== prev && next.name !== prev.name ? applyNameAutofill(prev, next) : next;
        });
    }, []);

    const updateConfig = useCallback<StepProps['updateConfig']>((path, value) => {
        const keys = path.split('.').filter(Boolean);
        if (!keys.length) return;
        setForm((prev) => {
            const config = { ...prev.config } as unknown as Record<string, unknown>;
            let cur = config;
            for (let i = 0; i < keys.length - 1; i += 1) {
                const child = cur[keys[i]];
                const copy = Array.isArray(child) ? [...child] : { ...((child as Record<string, unknown>) ?? {}) };
                cur[keys[i]] = copy;
                cur = copy as Record<string, unknown>;
            }
            cur[keys[keys.length - 1]] = value;
            return { ...prev, config: config as unknown as TenantConfig };
        });
    }, [setForm]);

    // --- Plan change (may trim / pad questions) -------------------------------
    const applyPlan = useCallback((plan: PlanCode) => {
        setForm((prev) => {
            const meta = getPlan(plan);
            if (meta.mode !== 'manual') return { ...prev, plan };
            const qs = prev.config.leadQualification.questions;
            if (qs.length > meta.maxQuestions) return withQuestions({ ...prev, plan }, qs.slice(0, meta.maxQuestions));
            if (qs.length < meta.minQuestions) return withQuestions({ ...prev, plan }, padQuestions(qs, meta.minQuestions));
            return { ...prev, plan };
        });
    }, [setForm]);

    const changePlan = useCallback<StepProps['changePlan']>((plan) => {
        const meta = getPlan(plan);
        if (meta.mode === 'manual' && form.config.leadQualification.questions.length > meta.maxQuestions) {
            setPendingPlan(plan);
            return;
        }
        applyPlan(plan);
    }, [applyPlan, form.config.leadQualification.questions.length]);

    const confirmPlanChange = () => {
        if (pendingPlan) applyPlan(pendingPlan);
        setPendingPlan(null);
    };
    const cancelPlanChange = useCallback(() => setPendingPlan(null), []);

    // --- Slug availability (debounced) -----------------------------------------
    useEffect(() => {
        const slug = slugify(form.slug);
        if (!slug) {
            setSlugStatus('idle');
            return;
        }
        setSlugStatus('checking');
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                // Not getClientsPaginated: it swallows request errors and returns an empty list, which would read as "free".
                const res = await api.get('/tenants/tenants/summary', { params: { search: slug, limit: 100 } });
                if (cancelled) return;
                const data: unknown = res.data;
                const items: unknown = Array.isArray(data) ? data : (data as { items?: unknown } | null)?.items;
                if (!Array.isArray(items)) throw new Error('Unexpected tenant summary response');
                const taken = items.some((it) => String((it as { slug?: unknown } | null)?.slug ?? '').toLowerCase() === slug);
                setSlugStatus(taken ? 'taken' : 'free');
            } catch {
                if (!cancelled) setSlugStatus('error');
            }
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [form.slug]);

    // --- Navigation --------------------------------------------------------------
    const stepErrors = useCallback((s: StepId) => validateStep(s, form, file, slugStatus), [form, file, slugStatus]);

    /** Earlier steps are always reachable; a later step only when every step before it is valid. */
    const canGoTo = useCallback((target: StepId) => {
        if (target <= step) return true;
        for (let s = 1; s < target; s += 1) {
            if (stepErrors(s as StepId).length) return false;
        }
        return true;
    }, [step, stepErrors]);

    const goToStep = useCallback<StepProps['goToStep']>((target) => {
        if (target === step) return;
        if (canGoTo(target)) {
            setStep(target);
            setShowErrors(false);
        } else {
            setStep(firstInvalidStep(form, file, slugStatus) ?? step);
            setShowErrors(true);
        }
        setSubmitError('');
        scrollToTop();
    }, [step, canGoTo, form, file, slugStatus]);

    const handleNext = () => {
        if (stepErrors(step).length) {
            setShowErrors(true);
            return;
        }
        setStep((Math.min(step + 1, 5)) as StepId);
        setShowErrors(false);
        setSubmitError('');
        scrollToTop();
    };

    const handleBack = () => {
        setStep((Math.max(step - 1, 1)) as StepId);
        setShowErrors(false);
        setSubmitError('');
        scrollToTop();
    };

    const handleSaveLater = async () => {
        setSavingLater(true);
        setSubmitError('');
        let saved = false;
        try {
            saved = await forceSave(draftPayload);
        } finally {
            setSavingLater(false);
        }
        if (saved) {
            navigate('/admin/clients');
        } else {
            // Stay on the page so nothing is lost
            setSubmitError("Couldn't save the draft. Check your connection and try again — your work is still here.");
        }
    };

    // --- Submit ----------------------------------------------------------------------
    const handleCreate = async () => {
        const bad = firstInvalidStep(form, file, slugStatus);
        if (bad) {
            setStep(bad);
            setShowErrors(true);
            scrollToTop();
            return;
        }

        setSaving(true);
        setSubmitError('');
        setDraftReady(false); // stop autosave (cancels any pending debounce) while creating

        try {
            // Built inside the try so a malformed (e.g. restored) item can't leave the page stuck in "Creating…".
            const name = form.name.trim();
            const c = form.config;
            const questions = c.leadQualification.questions.map((q) => ({
                ...q,
                label: (q.label ?? '').trim(),
                instruction: (q.instruction ?? '').trim(),
                options: (q.options ?? []).map((o) => o.trim()).filter(Boolean),
            }));
            const questionMap = form.questionMapConfig.question_map.map((item) => ({
                ...item,
                question: (item.question ?? '').trim(),
                quick_replies: (item.quick_replies ?? []).filter((o) => (o.text ?? '').trim().length > 0),
            }));

            const client = await createClient({
                name,
                slug: slugify(form.slug),
                plan: form.plan,
                config: {
                    ...c,
                    companyName: name,
                    shortName: c.shortName || name,
                    botName: c.botName.trim(),
                    // Empty avatar is fine: the chat UI renders its own mascot and the admin preview shows the initial.
                    botAvatar: (c.botAvatar || '').trim(),
                    welcome: {
                        ...c.welcome,
                        highlightedHeadline: (c.welcome.highlightedHeadline ?? '').trim() || name,
                        features: (c.welcome.features ?? []).map((f) => f.trim()).filter(Boolean),
                    },
                    leadQualification: { ...c.leadQualification, questions },
                    lead_qualification_criteria: form.leadQualificationCriteria || undefined,
                    ...(form.plan === 'S3_MAPPING' ? { question_map: questionMap } : {}),
                },
            });

            await deleteDraft();

            let documentFailed = false;
            if (file) {
                try {
                    await ingestDocument(client.id, file);
                } catch (docErr) {
                    console.error('Failed to upload document', docErr);
                    documentFailed = true;
                }
            }

            setCreated({ client, form, fileName: file?.name ?? null, documentFailed });
            setShowErrors(false);
            scrollToTop();
        } catch (e) {
            console.error('Failed to create client', e);
            const detail = apiErrorDetail(e);
            setSubmitError(detail ? `Couldn’t create the client: ${detail}` : 'Couldn’t create the client. Please try again.');
            setDraftReady(true);
        } finally {
            setSaving(false);
        }
    };

    const handleAddAnother = () => {
        setFormState(makeInitialForm());
        setStep(1);
        setFile(null);
        setShowErrors(false);
        setSubmitError('');
        setPendingPlan(null);
        setSlugStatus('idle');
        setCreated(null);
        setDraftReady(true);
        scrollToTop();
    };

    // --- Render --------------------------------------------------------------------------
    const plan = getPlan(form.plan);
    const meta = STEPS[step - 1];
    const intro = step === 4 ? STEP4_INTRO[plan.mode] : meta.intro;
    const errors = showErrors ? stepErrors(step) : [];

    const stepProps: StepProps = {
        form, setForm, updateConfig, changePlan, file, setFile, goToStep, slugStatus, showErrors, isDark,
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1Business {...stepProps} />;
            case 2: return <Step2Look {...stepProps} />;
            case 3: return <Step3Knowledge {...stepProps} />;
            case 4:
                if (plan.mode === 'ai') return <Step4S3Max {...stepProps} />;
                if (plan.mode === 'map') return <Step4S3Mapping {...stepProps} />;
                return <Step4Questions {...stepProps} />;
            case 5: return <Step5Review {...stepProps} />;
            default: return null;
        }
    };

    const pendingMeta = pendingPlan ? getPlan(pendingPlan) : null;
    const pendingRemoved = pendingMeta ? form.config.leadQualification.questions.slice(pendingMeta.maxQuestions) : [];

    return (
        <AdminLayout
            breadcrumb={[
                { label: 'Clients', to: '/admin/clients' },
                { label: created ? (created.client.name || created.form.name) : 'Add new client' },
            ]}
            headerRight={created ? undefined : <DraftPill isDark={isDark} status={saveStatus} lastSavedAt={lastSavedAt} />}
        >
            {/* AdminLayout draws the top bar, page background and the 28/32/64 padding */}
            <div className={cn('w-full max-w-[1160px] mx-auto box-border flex flex-col gap-6 font-jakarta antialiased', t.text)}>
                {created ? (
                    <ClientCreated
                        client={created.client}
                        form={created.form}
                        fileName={created.fileName}
                        documentFailed={created.documentFailed}
                        onAddAnother={handleAddAnother}
                        isDark={isDark}
                    />
                ) : (
                    <>
                        <WizardHeader
                            isDark={isDark}
                            step={step}
                            intro={intro}
                            right={step === 4 && plan.mode === 'manual'
                                ? <PlanChip isDark={isDark} planName={plan.name} onChange={() => goToStep(1)} />
                                : undefined}
                        />

                        <WizardStepper isDark={isDark} current={step} canGoTo={canGoTo} onGo={goToStep} />

                        {renderStep()}

                        {errors.length > 0 && (
                            <ErrorBanner
                                isDark={isDark}
                                title={step === 5 ? 'A few things need fixing before you can create the client:' : 'A few things need fixing before you go on:'}
                                messages={errors}
                            />
                        )}
                        {submitError && <ErrorBanner isDark={isDark} title={submitError} />}

                        <WizardFooter
                            isDark={isDark}
                            step={step}
                            nextLabel={meta.nextLabel}
                            onBack={handleBack}
                            onNext={handleNext}
                            onSaveLater={handleSaveLater}
                            savingLater={savingLater}
                            onCreate={handleCreate}
                            creating={saving}
                        />
                    </>
                )}
            </div>

            <ConfirmDialog
                isDark={isDark}
                open={!!pendingMeta}
                title={pendingMeta ? `Switch to ${pendingMeta.name}?` : ''}
                confirmLabel={`Remove ${pendingRemoved.length} and switch`}
                cancelLabel="Keep current plan"
                onConfirm={confirmPlanChange}
                onCancel={cancelPlanChange}
            >
                {pendingMeta && (
                    <>
                        <p className="m-0">
                            {pendingMeta.name} allows {pendingMeta.minQuestions === pendingMeta.maxQuestions ? 'exactly' : 'at most'} {pendingMeta.maxQuestions} questions.
                            {' '}Your last {pendingRemoved.length === 1 ? 'question' : `${pendingRemoved.length} questions`} will be removed:
                        </p>
                        <ul className="mt-2 mb-0 pl-4 list-disc">
                            {pendingRemoved.map((q, i) => (
                                <li key={q.id}>{q.label.trim() || `Question ${pendingMeta.maxQuestions + i + 1}`}</li>
                            ))}
                        </ul>
                    </>
                )}
            </ConfirmDialog>

            <DraftRecoveryModal
                isOpen={showDraftModal}
                onResume={handleResumeDraft}
                onDiscard={handleDiscardDraft}
                lastSavedAt={loadedDraft?.updated_at || ''}
                isDark={isDark}
                variant="onboarding"
            />
        </AdminLayout>
    );
};
