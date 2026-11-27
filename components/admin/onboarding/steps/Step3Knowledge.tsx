/**
 * Onboarding wizard · Step 3 "Knowledge" (design: spec3.html).
 * Card 1: knowledge document (picked here, uploaded by the wizard via ingestDocument after the client is created).
 * Card 2: lead qualification criteria (required on every plan).
 * Aside: sample chat that answers from the document (or not), plus "How this lead is sorted".
 */
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../../utils/cn';
import type { PreviewMessage, StepProps } from '../../../../types/onboarding';
import { Card, CardHeader, Field, Hint, PanelCard, PreviewPanel, StepColumns, Textarea, buttonClass, tone } from '../ui';
import { PhonePreview } from '../PhonePreview';

const ACCEPT = '.pdf,.docx,.txt,.md';
const ALLOWED_EXT = ['pdf', 'docx', 'txt', 'md'];
const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_MS = 800;
const UPLOAD_STEPS = 5;

/** "Start from an example" presets (spec3 script block). */
const EXAMPLES: { label: string; text: string }[] = [
    { label: 'Clinic', text: 'Warm lead: wants an appointment within the next 2 weeks, has a clear treatment in mind, and shares a phone number.\nCold lead: only asking about prices, no timeline, or lives outside our branch areas.' },
    { label: 'Real estate', text: 'Warm lead: budget given, wants to visit a site within a month, and looking in our project locations.\nCold lead: just browsing, no budget, or wants a location we do not cover.' },
    { label: 'Education', text: 'Warm lead: student or parent asking about a specific course, plans to join this year, and asks about fees or batches.\nCold lead: general questions only, or joining more than a year from now.' },
    { label: 'Retail', text: 'Warm lead: asks for a specific product, wants to buy or visit the store soon, and shares contact details.\nCold lead: only comparing prices with no plan to buy.' },
];

const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');

const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
};

const validateFile = (file: File): string | null => {
    if (!ALLOWED_EXT.includes(extOf(file.name))) return 'This file type isn’t supported. Use a PDF, DOCX, TXT or MD file.';
    if (file.size > MAX_BYTES) return `This file is ${formatSize(file.size)}. The limit is 10 MB.`;
    if (file.size === 0) return 'This file is empty. Choose another one.';
    return null;
};

export const Step3Knowledge: React.FC<StepProps> = ({ form, setForm, file, setFile, showErrors, isDark }) => {
    const t = tone(isDark);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<number | null>(null);
    /** Local "Uploading… N%" animation; null = not animating. A file already set on mount shows directly. */
    const [uploadPct, setUploadPct] = useState<number | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const stopTimer = () => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    useEffect(() => stopTimer, []);

    const acceptFile = (picked: File | null | undefined) => {
        if (!picked) return;
        const err = validateFile(picked);
        if (err) {
            setFileError(err);
            return;
        }
        setFileError(null);
        setFile(picked);
        stopTimer();
        setUploadPct(0);
        let step = 0;
        timerRef.current = window.setInterval(() => {
            step += 1;
            if (step >= UPLOAD_STEPS) {
                stopTimer();
                setUploadPct(null);
            } else {
                setUploadPct(Math.round((step / UPLOAD_STEPS) * 100));
            }
        }, UPLOAD_MS / UPLOAD_STEPS);
    };

    const openPicker = () => inputRef.current?.click();

    const removeFile = () => {
        stopTimer();
        setUploadPct(null);
        setFileError(null);
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        acceptFile(e.target.files?.[0]);
        e.target.value = ''; // allow picking the same file again
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!dragging) setDragging(true);
    };
    const onDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDragging(false);
    };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    const uploading = uploadPct !== null && !!file;
    const hasFile = !!file && !uploading;
    const fileMissingError = form.plan === 'S3_MAX' && showErrors && !file;

    // ---- Lead criteria ----
    const criteria = form.leadQualificationCriteria ?? '';
    const criteriaError = showErrors && !criteria.trim() ? 'Describe what makes a lead warm and what makes it cold.' : null;
    const setCriteria = (value: string) => setForm((prev) => ({ ...prev, leadQualificationCriteria: value }));
    const applyExample = (ex: { label: string; text: string }) => {
        if (criteria === ex.text) return;
        if (criteria.trim() && !window.confirm(`Replace the criteria you wrote with the ${ex.label} example?`)) return;
        setCriteria(ex.text);
    };

    // ---- Preview ----
    const company = form.name.trim() || 'Your Company';
    const display = form.config.botDisplayName?.trim() || form.config.botName?.trim() || 'Assistant';
    const messages: PreviewMessage[] = [
        { who: 'bot', text: `Hi! I’m ${display} from ${company}. How can I help you today?` },
        { who: 'user', text: 'Do you do teeth whitening?' },
        hasFile && file
            ? { who: 'bot', text: 'Yes, we offer teeth whitening. Would you like to book a visit so the dentist can check it suits you?', note: `Answered from ${file.name}`, chips: ['Book a visit', 'Ask something else'] }
            : { who: 'bot', text: 'Let me get our team to confirm that for you. Can I take your name?', note: 'No document yet, so the bot can’t answer this' },
    ];

    const fileInput = (
        <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={onInputChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
        />
    );

    const knowledgeCard = (
        <Card isDark={isDark}>
            <CardHeader
                isDark={isDark}
                title="Teach the bot about the client"
                help="Upload a brochure, price list or FAQ. The bot answers visitors’ questions from it."
            />
            {fileInput}

            {!file && (
                <button
                    type="button"
                    onClick={openPicker}
                    onDragOver={onDragOver}
                    onDragEnter={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    aria-describedby="kb-file-help"
                    className={cn(
                        'flex flex-col items-center gap-2.5 px-5 py-8 rounded-[14px] border-2 border-dashed cursor-pointer transition-colors',
                        'focus:outline-none focus-visible:ring-[3px]',
                        isDark ? 'focus-visible:ring-white/20' : 'focus-visible:ring-black/10',
                        dragging
                            ? (isDark ? 'border-white bg-neutral-800' : 'border-[#111111] bg-[#F2F2F2]')
                            : (isDark ? 'border-neutral-600 bg-neutral-950 hover:border-neutral-400' : 'border-[#A3A3A3] bg-[#FAFAFA] hover:border-[#525252]'),
                        fileError || fileMissingError ? 'border-[#B91C1C]' : null,
                    )}
                >
                    <span className={cn('w-12 h-12 rounded-full flex items-center justify-center', isDark ? 'bg-neutral-800 text-white' : 'bg-[#F2F2F2] text-black')}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                        </svg>
                    </span>
                    <span className={cn('text-[15px] font-extrabold', t.text)}>
                        {dragging ? 'Drop the file to add it' : 'Drop a file here or choose one'}
                    </span>
                    <span id="kb-file-help" className={cn('text-[13px]', t.muted)}>PDF, DOCX, TXT or MD · up to 10 MB</span>
                </button>
            )}

            {uploading && file && (
                <div
                    role="status"
                    className={cn('flex flex-col gap-2.5 p-4 rounded-[14px] border-[1.5px]', isDark ? 'border-neutral-800 bg-neutral-900' : 'border-[#E5E5E5] bg-white')}
                >
                    <span className={cn('flex justify-between gap-2.5 text-sm font-bold min-w-0', t.text)}>
                        <span className="truncate">Uploading {file.name}…</span>
                        <span className={cn('flex-none', t.muted)}>{uploadPct}%</span>
                    </span>
                    <span aria-hidden="true" className={cn('h-1.5 rounded-[3px] overflow-hidden flex', isDark ? 'bg-neutral-800' : 'bg-[#EEEEEE]')}>
                        <span
                            className={cn('block h-1.5 rounded-[3px] transition-[width] duration-150 ease-linear motion-reduce:transition-none', isDark ? 'bg-white' : 'bg-[#0A0A0A]')}
                            style={{ width: `${uploadPct}%` }}
                        />
                    </span>
                </div>
            )}

            {hasFile && file && (
                <div
                    role="status"
                    className={cn('flex flex-col gap-3.5 p-[18px] rounded-[14px] border-[1.5px]', isDark ? 'border-neutral-300 bg-neutral-950' : 'border-[#0A0A0A] bg-[#FAFAFA]')}
                >
                    <div className="flex items-center gap-3">
                        <span className={cn('w-8 h-8 flex-none rounded-full flex items-center justify-center', isDark ? 'bg-white' : 'bg-[#0A0A0A]')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12l5 5 9-10" />
                            </svg>
                        </span>
                        <span className="flex flex-col gap-0.5">
                            <span className={cn('text-[15px] font-extrabold', t.text)}>File uploaded successfully</span>
                            <span className={cn('text-[13px]', t.muted)}>The bot will learn from it as soon as the client is created.</span>
                        </span>
                    </div>
                    <div className={cn('flex flex-wrap items-center gap-3 px-3.5 py-3 rounded-xl border', isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E5E5E5]')}>
                        <span className={cn('w-10 h-10 flex-none rounded-[10px] flex items-center justify-center', isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-[#F2F2F2] text-[#171717]')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" />
                            </svg>
                        </span>
                        <span className="flex-[1_1_160px] flex flex-col gap-0.5 min-w-0">
                            <span className={cn('text-sm font-bold break-words', t.text)}>{file.name}</span>
                            <span className={cn('text-[12.5px]', t.muted)}>
                                {(extOf(file.name) || 'file').toUpperCase()} · {formatSize(file.size)} · Added just now
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={openPicker}
                            aria-label={`Replace ${file.name}`}
                            className={buttonClass(isDark, 'ghost', cn('min-h-[40px]', isDark ? 'text-white' : 'text-[#0A0A0A]'))}
                        >
                            Replace
                        </button>
                        <button
                            type="button"
                            onClick={removeFile}
                            aria-label={`Remove ${file.name}`}
                            className={buttonClass(isDark, 'ghost', cn('min-h-[40px]', isDark ? 'text-[#F87171]' : 'text-[#B91C1C]'))}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}

            {fileError && (
                <p className="m-0 text-[12.5px] font-semibold text-[#B91C1C]" role="alert">{fileError}</p>
            )}

            <p
                className={cn('m-0 text-[12.5px] leading-[1.5] flex gap-2 items-start', fileMissingError ? 'text-[#B91C1C] font-semibold' : t.hint)}
                role={fileMissingError ? 'alert' : undefined}
            >
                <svg className="flex-none mt-px" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 8v5M12 16h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
                <span>Needed on the S3 Max plan. On other plans it’s optional, but the bot gives much better answers with it.</span>
            </p>
        </Card>
    );

    const criteriaCard = (
        <Card isDark={isDark}>
            <CardHeader
                isDark={isDark}
                title="Who is a good lead?"
                help="Describe a warm lead and a cold lead in plain words. The AI uses this to sort every lead it talks to."
            />
            <div className="flex flex-wrap items-center gap-1.5">
                <Hint isDark={isDark}>Start from an example:</Hint>
                {EXAMPLES.map((ex) => {
                    const on = criteria === ex.text;
                    return (
                        <button
                            key={ex.label}
                            type="button"
                            aria-pressed={on}
                            onClick={() => applyExample(ex)}
                            className={cn(
                                'min-h-[36px] px-3.5 rounded-full cursor-pointer text-[13px] font-bold border transition-colors',
                                on
                                    ? (isDark ? 'bg-white text-black border-white' : 'bg-[#111111] text-white border-[#111111]')
                                    : (isDark ? 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800' : 'bg-white text-[#111111] border-[#D4D4D4] hover:bg-[#F7F7F7]'),
                            )}
                        >
                            {ex.label}
                        </button>
                    );
                })}
            </div>
            <Field isDark={isDark} label="Lead qualification criteria" htmlFor="lqc" required tech="leadQualificationCriteria">
                <Textarea
                    id="lqc"
                    isDark={isDark}
                    rows={8}
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                    invalid={!!criteriaError}
                    aria-required="true"
                    aria-describedby="lqc-tip lqc-count"
                    placeholder="e.g. Warm: wants a visit within 2 weeks and shares a phone number. Cold: only asking prices, no timeline."
                />
                <div className="flex justify-between gap-2.5">
                    {criteriaError ? (
                        <p id="lqc-tip" className="m-0 text-[12.5px] font-semibold text-[#B91C1C]" role="alert">{criteriaError}</p>
                    ) : (
                        <p id="lqc-tip" className={cn('m-0 text-[12.5px] leading-[1.5]', t.hint)}>Tip: say what makes a lead warm, and what makes it cold.</p>
                    )}
                    <span id="lqc-count" className={cn('flex-none text-[12.5px] leading-[1.5]', t.hint)}>{criteria.length} characters</span>
                </div>
            </Field>
        </Card>
    );

    const aside = (
        <PreviewPanel isDark={isDark} rightLabel="Sample chat">
            <PhonePreview
                mode="chat"
                companyName={company}
                botDisplayName={display}
                botAvatar={form.config.botAvatar}
                primary={form.config.colors?.primary || '#111111'}
                secondary={form.config.colors?.secondary || '#737373'}
                messages={messages}
            />
            <PanelCard isDark={isDark}>
                <span className={cn('text-xs font-extrabold tracking-[0.06em] uppercase', t.muted)}>How this lead is sorted</span>
                <span className="flex items-center justify-between gap-2.5">
                    <span className={cn('text-[13.5px] font-bold', t.text)}>Priya · whitening this week</span>
                    <span className={cn('text-xs font-extrabold rounded-full px-2.5 py-[3px]', isDark ? 'bg-neutral-700 text-white' : 'bg-[#E5E5E5] text-[#111111]')}>Warm</span>
                </span>
                <Hint isDark={isDark}>Example only. The AI decides using the criteria you write.</Hint>
            </PanelCard>
        </PreviewPanel>
    );

    return <StepColumns main={<>{knowledgeCard}{criteriaCard}</>} aside={aside} />;
};
