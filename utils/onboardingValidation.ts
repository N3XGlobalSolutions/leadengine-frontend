/**
 * Validation for the 5-step "Add new client" onboarding wizard.
 * Every function returns plain-English messages; an empty array means the step is valid.
 */
import { getPlan, slugify, type OnboardingForm, type SlugStatus, type StepId } from '../types/onboarding';

/** "2" / "2 and 4" / "1, 3 and 5" */
const listNumbers = (nums: number[]): string =>
    nums.length <= 1 ? `${nums[0] ?? ''}` : `${nums.slice(0, -1).join(', ')} and ${nums[nums.length - 1]}`;

/** "question 2" / "questions 2 and 4" */
const questionRef = (nums: number[]): string => `${nums.length === 1 ? 'question' : 'questions'} ${listNumbers(nums)}`;

const isBlank = (v: unknown): boolean => typeof v !== 'string' || v.trim().length === 0;

const validateBusiness = (form: OnboardingForm, slugStatus: SlugStatus): string[] => {
    const errors: string[] = [];
    if (form.name.trim().length < 2) errors.push('Enter the company name (at least 2 characters).');
    // Backend (TenantConfig.url_slug) accepts 3–50 characters.
    const slugLength = slugify(form.slug).length;
    if (slugLength < 3) {
        errors.push('Enter a chat page address with at least 3 letters or numbers.');
    } else if (slugLength > 50) {
        errors.push('Keep the chat page address to 50 characters or fewer.');
    } else if (slugStatus === 'taken') {
        errors.push('That chat page address is already taken. Pick a different one.');
    }
    return errors;
};

const validateLook = (form: OnboardingForm): string[] => {
    const errors: string[] = [];
    // Backend (TenantConfig.bot_name) accepts 2–50 characters; the wizard sends it trimmed.
    const botName = typeof form.config.botName === 'string' ? form.config.botName.trim() : '';
    if (botName.length < 2) errors.push('Give the bot a name (at least 2 characters).');
    else if (botName.length > 50) errors.push('Keep the bot name to 50 characters or fewer.');
    if (isBlank(form.config.welcome?.highlightedHeadline)) errors.push('Fill in the highlighted words of the welcome headline.');
    return errors;
};

const validateKnowledge = (form: OnboardingForm, file: File | null): string[] => {
    const errors: string[] = [];
    if (isBlank(form.leadQualificationCriteria)) errors.push('Describe who is a good lead (lead qualification criteria).');
    if (form.plan === 'S3_MAX' && !file) errors.push('S3 Max needs a document. Upload the client’s information so the AI knows what to ask.');
    return errors;
};

const validateQuestions = (form: OnboardingForm): string[] => {
    const plan = getPlan(form.plan);
    const errors: string[] = [];

    if (plan.mode === 'ai') return errors;

    if (plan.mode === 'map') {
        const items = form.questionMapConfig?.question_map ?? [];
        if (items.length < 1) {
            errors.push('Add at least one question to the question map.');
            return errors;
        }
        if (items.length > plan.maxQuestions) {
            errors.push(`${plan.name} allows up to ${plan.maxQuestions} questions — you have ${items.length}.`);
        }
        const noText: number[] = [];
        const noAnswers: number[] = [];
        items.forEach((item, i) => {
            if (isBlank(item.question)) noText.push(i + 1);
            if (!(item.quick_replies ?? []).some((o) => !isBlank(o.text))) noAnswers.push(i + 1);
        });
        if (noText.length) errors.push(`Write the question text for ${questionRef(noText)}.`);
        if (noAnswers.length) errors.push(`Add at least one answer to ${questionRef(noAnswers)}.`);
        return errors;
    }

    // manual (S1 / S2 / S3 / S3_INTERNATIONAL)
    const questions = form.config.leadQualification?.questions ?? [];
    const n = questions.length;
    const { minQuestions: min, maxQuestions: max } = plan;
    if (n < min || n > max) {
        errors.push(min === max
            ? `${plan.name} needs exactly ${min} questions — you have ${n}.`
            : `${plan.name} needs ${min} to ${max} questions — you have ${n}.`);
    }
    const noTitle: number[] = [];
    const noInstruction: number[] = [];
    questions.forEach((q, i) => {
        if (isBlank(q.label)) noTitle.push(i + 1);
        if (isBlank(q.instruction)) noInstruction.push(i + 1);
    });
    if (noTitle.length) errors.push(`Give ${questionRef(noTitle)} a title.`);
    if (noInstruction.length) errors.push(`Write what the bot should ask in ${questionRef(noInstruction)}.`);
    return errors;
};

/** Messages for one step (empty array = valid). Step 5 is the union of steps 1–4. */
export function validateStep(step: StepId, form: OnboardingForm, file: File | null, slugStatus: SlugStatus): string[] {
    switch (step) {
        case 1: return validateBusiness(form, slugStatus);
        case 2: return validateLook(form);
        case 3: return validateKnowledge(form, file);
        case 4: return validateQuestions(form);
        case 5: return [
            ...validateBusiness(form, slugStatus),
            ...validateLook(form),
            ...validateKnowledge(form, file),
            ...validateQuestions(form),
        ];
        default: return [];
    }
}

/** First of steps 1–4 that has errors, or null when everything is ready to create. */
export function firstInvalidStep(form: OnboardingForm, file: File | null, slugStatus: SlugStatus): StepId | null {
    const steps: StepId[] = [1, 2, 3, 4];
    return steps.find((s) => validateStep(s, form, file, slugStatus).length > 0) ?? null;
}
