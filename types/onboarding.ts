/**
 * Shared contract for the "Add new client" onboarding wizard.
 * Design source: "LeadEngine – Add New Client Flow.html" (5 steps + success screen).
 * DO NOT change names/shapes here without updating every onboarding component.
 */
import type React from 'react';
import type { TenantConfig } from './config';
import type { QuestionMapConfig } from '../components/admin/QuestionMapEditor';
import type { Client } from './admin';

export type PlanCode = 'S1' | 'S2' | 'S3' | 'S3_INTERNATIONAL' | 'S3_MAX' | 'S3_MAPPING';

/** manual = admin writes questions (S1/S2/S3/S3_INTERNATIONAL); ai = S3 Max; map = S3 Mapping */
export type QuestionMode = 'manual' | 'ai' | 'map';

export interface PlanMeta {
    code: PlanCode;
    name: string;        // "S2 · Professional"
    desc: string;        // card description
    qLabel: string;      // pill text e.g. "5 to 15 questions"
    minQuestions: number;
    maxQuestions: number;
    mode: QuestionMode;
}

export const PLANS: PlanMeta[] = [
    { code: 'S1', name: 'S1 · Starter', desc: 'The bot asks 5 questions you write.', qLabel: 'Exactly 5 questions', minQuestions: 5, maxQuestions: 5, mode: 'manual' },
    { code: 'S2', name: 'S2 · Professional', desc: 'Write between 5 and 15 questions.', qLabel: '5 to 15 questions', minQuestions: 5, maxQuestions: 15, mode: 'manual' },
    { code: 'S3', name: 'S3 · Enterprise', desc: 'Up to 30 questions, plus deeper AI lead analysis.', qLabel: '5 to 30 questions', minQuestions: 5, maxQuestions: 30, mode: 'manual' },
    { code: 'S3_INTERNATIONAL', name: 'S3 · International', desc: 'Same as Enterprise, with support for international clients.', qLabel: '5 to 30 questions', minQuestions: 5, maxQuestions: 30, mode: 'manual' },
    { code: 'S3_MAX', name: 'S3 Max · Agentic AI', desc: 'AI writes and adapts the questions from the client’s documents.', qLabel: 'AI writes the questions', minQuestions: 0, maxQuestions: 0, mode: 'ai' },
    { code: 'S3_MAPPING', name: 'S3 Mapping', desc: 'A fixed question map with scored answers and optional tables.', qLabel: 'Up to 30, scored', minQuestions: 1, maxQuestions: 30, mode: 'map' },
];

export const getPlan = (code: PlanCode): PlanMeta => PLANS.find((p) => p.code === code) ?? PLANS[0];

export type StepId = 1 | 2 | 3 | 4 | 5;

export interface StepMeta {
    id: StepId;
    title: string;       // stepper title
    sub: string;         // stepper subtitle
    h1Before: string;    // heading text before the highlighted <mark>
    h1Mark: string;      // highlighted words
    intro: string;       // paragraph under the heading
    nextLabel: string;   // footer primary button ("Next: Look & welcome")
}

export const STEPS: StepMeta[] = [
    { id: 1, title: 'Business & plan', sub: 'Who the client is', h1Before: 'Add a ', h1Mark: 'new client', intro: 'Five short steps. The bot always asks for name and phone first, so you only set up what makes this client different. The draft saves as you go.', nextLabel: 'Next: Look & welcome' },
    { id: 2, title: 'Look & welcome', sub: 'How the chat looks', h1Before: 'How the chat ', h1Mark: 'looks', intro: 'Name the bot, add the client’s colours and write the welcome screen. The preview on the right updates as you type.', nextLabel: 'Next: Knowledge' },
    { id: 3, title: 'Knowledge', sub: 'What the bot knows', h1Before: 'What the bot ', h1Mark: 'knows', intro: 'Give the bot the client’s information, and tell it what a good lead looks like.', nextLabel: 'Next: Questions' },
    { id: 4, title: 'Questions', sub: 'What the bot asks', h1Before: 'What the bot ', h1Mark: 'asks', intro: 'These questions decide if a lead is worth calling back. Keep them short, one thing per question.', nextLabel: 'Next: Review & create' },
    { id: 5, title: 'Review & create', sub: 'Check and go live', h1Before: 'Check and ', h1Mark: 'create', intro: 'One last look. Use Edit to jump back to any step — nothing you’ve entered is lost.', nextLabel: 'Create client' },
];

/** Step 4 intro differs on S3 Max / S3 Mapping */
export const STEP4_INTRO: Record<QuestionMode, string> = {
    manual: STEPS[3].intro,
    ai: 'On S3 Max the AI writes and adapts the questions for you.',
    map: 'On S3 Mapping you build a fixed question map. Each answer carries a score.',
};

/** Whole wizard form. Persisted to the server draft (draftType 'client_creation'). The File is NOT persisted. */
export interface OnboardingForm {
    name: string;                 // company name (required)
    slug: string;                 // url_slug (required, slugified)
    slugEdited: boolean;          // false => slug auto-follows company name
    shortNameEdited: boolean;     // false => config.shortName auto-follows first word of company name
    plan: PlanCode;
    /** botName, botDisplayName, botAvatar, colors, welcome.*, leadQualification.questions, whatsapp_* live here */
    config: TenantConfig;
    leadQualificationCriteria: string;   // required on every plan
    questionMapConfig: QuestionMapConfig; // S3_MAPPING only
}

export type SlugStatus = 'idle' | 'checking' | 'free' | 'taken' | 'error';

/** Props every step component (Step1..Step5 and the three Step 4 variants) receives from the wizard page. */
export interface StepProps {
    form: OnboardingForm;
    setForm: (updater: (prev: OnboardingForm) => OnboardingForm) => void;
    /** Dot-path setter into form.config, e.g. updateConfig('welcome.headline', 'Hi') or updateConfig('colors.primary', '#111') */
    updateConfig: (path: string, value: unknown) => void;
    /** Plan change goes through the wizard (it may ask before trimming questions on downgrade). */
    changePlan: (plan: PlanCode) => void;
    file: File | null;
    setFile: (file: File | null) => void;
    goToStep: (step: StepId) => void;
    slugStatus: SlugStatus;
    /** true after the user pressed Next with invalid fields: show inline errors on required fields */
    showErrors: boolean;
    isDark: boolean;
}

/** Chat bubble model for the phone preview (chat mode). */
export interface PreviewMessage {
    who: 'bot' | 'user';
    text?: string;
    chips?: string[];      // quick replies under a bot bubble
    note?: string;         // small grey note under the bubble
    focus?: boolean;       // ring in primary colour around a bot bubble (the question being edited)
    table?: string[][];    // bot table bubble; first row is the header
}

export interface PhonePreviewProps {
    mode: 'welcome' | 'chat';
    companyName: string;
    botDisplayName: string;
    botAvatar?: string;        // empty => initial letter circle in chat mode
    primary: string;
    secondary: string;
    // welcome mode
    headline?: string;         // "Welcome to"
    highlighted?: string;      // "HealthFirst Clinics" (shown in primary colour)
    subheadline?: string;
    buttonText?: string;
    features?: string[];       // tag pills
    // chat mode
    messages?: PreviewMessage[];
}

/** Grey "Live preview" aside panel wrapping a PhonePreview + optional extra cards. */
export interface PreviewPanelProps {
    rightLabel: string;        // e.g. "Chat page", "Welcome screen", "Sample chat"
    children: React.ReactNode;
}

/** Success screen ("<Company> is live"). */
export interface ClientCreatedProps {
    client: Client;            // returned by createClient(); use client.id for the chat link
    form: OnboardingForm;      // what was submitted (for preview + "what happens now")
    fileName: string | null;   // uploaded document name, if any
    documentFailed: boolean;   // ingestDocument failed => show warning row instead of "Document processing"
    onAddAnother: () => void;
    isDark: boolean;
}

/** Public chat link: the chat route resolves the tenant UUID, NOT the slug. */
export const chatLinkFor = (clientId: string): string => `${window.location.origin}/${clientId}`;

export const slugify = (v: string): string =>
    v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
