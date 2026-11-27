/**
 * Onboarding wizard — Step 1: Business & plan (design: spec1.html).
 * Renders only the step body; the wizard page owns header, stepper and footer.
 * Note: slug / short name / welcome headline auto-derivation from the company name lives in the wizard.
 */
import React, { useState } from 'react';
import { cn } from '../../../../utils/cn';
import { PLANS, getPlan, slugify } from '../../../../types/onboarding';
import type { StepProps } from '../../../../types/onboarding';
import {
    Card, CardHeader, Field, Input, TechTag, Hint, Pill, Switch, CheckDot,
    StepColumns, PreviewPanel, PanelCard, Icon, tone,
} from '../ui';
import { PhonePreview } from '../PhonePreview';

/** While typing, keep one trailing hyphen so "health-first" can be typed; the full slugify runs on blur. */
const slugifyTyping = (v: string): string => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '');

export const Step1Business: React.FC<StepProps> = ({ form, setForm, updateConfig, changePlan, slugStatus, showErrors, isDark }) => {
    const t = tone(isDark);
    const [showToken, setShowToken] = useState(false);

    const host = typeof window !== 'undefined' ? window.location.host : '';
    const cfg = form.config;
    const waOn = !!cfg.whatsapp_enabled;
    const plan = getPlan(form.plan);

    const nameError = showErrors && !form.name.trim() ? 'Enter the company name.' : null;
    const slugMissing = showErrors && !form.slug.trim();
    const slugTaken = !!form.slug && slugStatus === 'taken';

    const slugStatusLine = (() => {
        if (!form.slug) return null;
        switch (slugStatus) {
            case 'free':
                return (
                    <span className={cn('flex items-center gap-1.5 font-semibold', isDark ? 'text-neutral-200' : 'text-[#171717]')}>
                        <Icon.check size={14} />This address is free.
                    </span>
                );
            case 'taken':
                return <span className="font-semibold text-[#B91C1C]">Another client already uses this address. Try a different one.</span>;
            case 'checking':
                return <span className={t.hint}>Checking…</span>;
            case 'error':
                return <span className={t.hint}>Couldn&rsquo;t check right now — you can still continue.</span>;
            default:
                return null;
        }
    })();

    const main = (
        <>
            {/* 1. Who is the client? */}
            <Card isDark={isDark}>
                <CardHeader
                    isDark={isDark}
                    title="Who is the client?"
                    help="Start with the company name. We fill in the short name and the chat page address for you."
                />
                <Field isDark={isDark} label="Company name" htmlFor="ob-company" required error={nameError}>
                    <Input
                        id="ob-company"
                        isDark={isDark}
                        invalid={!!nameError}
                        value={form.name}
                        onChange={(e) => {
                            const value = e.target.value;
                            setForm((p) => ({ ...p, name: value }));
                        }}
                        placeholder="e.g. HealthFirst Clinics"
                        autoComplete="off"
                    />
                </Field>
                <Field
                    isDark={isDark}
                    label="Short name"
                    htmlFor="ob-short"
                    optional
                    hint="Used where space is tight. Filled from the company name — change it if you like."
                >
                    <Input
                        id="ob-short"
                        isDark={isDark}
                        auto={!form.shortNameEdited}
                        value={cfg.shortName ?? ''}
                        onChange={(e) => {
                            updateConfig('shortName', e.target.value);
                            setForm((p) => (p.shortNameEdited ? p : { ...p, shortNameEdited: true }));
                        }}
                        placeholder="e.g. HealthFirst"
                        autoComplete="off"
                    />
                </Field>
                <Field
                    isDark={isDark}
                    label="Chat page address"
                    htmlFor="ob-slug"
                    required
                    tech="slug"
                    error={slugMissing ? 'Enter a chat page address.' : null}
                >
                    <div className="flex items-stretch min-w-0">
                        <span
                            className={cn(
                                'flex items-center min-w-0 max-w-[60%] px-3 border-[1.5px] border-r-0 rounded-l-[10px] text-[13px]',
                                isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-400' : 'bg-[#F7F7F7] border-[#E5E5E5] text-[#525252]',
                            )}
                        >
                            <span className="truncate">{host}/</span>
                        </span>
                        <Input
                            id="ob-slug"
                            isDark={isDark}
                            auto={!form.slugEdited}
                            invalid={slugMissing || slugTaken}
                            className="flex-1 min-w-[120px] rounded-l-none"
                            value={form.slug}
                            onChange={(e) => {
                                const value = slugifyTyping(e.target.value);
                                setForm((p) => ({ ...p, slug: value, slugEdited: true }));
                            }}
                            onBlur={() => {
                                if (form.slug !== slugify(form.slug)) setForm((p) => ({ ...p, slug: slugify(p.slug) }));
                            }}
                            aria-describedby="ob-slug-status"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    <p id="ob-slug-status" aria-live="polite" className="m-0 text-[12.5px] leading-[1.5] empty:hidden">
                        {slugStatusLine}
                    </p>
                </Field>
            </Card>

            {/* 2. Pick a plan */}
            <Card isDark={isDark}>
                <CardHeader isDark={isDark} title="Pick a plan" help="The plan decides how the bot asks its questions in step 4." />
                <div role="radiogroup" aria-label="Plan" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PLANS.map((p) => {
                        const on = form.plan === p.code;
                        return (
                            <button
                                key={p.code}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => { if (!on) changePlan(p.code); }}
                                className={cn(
                                    'flex flex-col items-start gap-2 rounded-[14px] cursor-pointer text-left transition-colors',
                                    'focus:outline-none focus-visible:ring-[3px]',
                                    isDark ? 'focus-visible:ring-white/20' : 'focus-visible:ring-black/10',
                                    on
                                        ? cn('border-2 p-[15px]', isDark ? 'border-white bg-neutral-800' : 'border-[#111111] bg-[#F7F7F7]')
                                        : cn('border p-4', isDark ? 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800/60' : 'border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]'),
                                )}
                            >
                                <span className="flex items-center justify-between gap-2 w-full">
                                    <span className={cn('text-[15px] font-extrabold', t.text)}>{p.name}</span>
                                    {on && <CheckDot isDark={isDark} />}
                                </span>
                                <span className={cn('text-[13px] leading-[1.5] text-left', t.muted)}>{p.desc}</span>
                                <span className="flex flex-wrap gap-1.5 items-center">
                                    <Pill isDark={isDark}>{p.qLabel}</Pill>
                                    <TechTag isDark={isDark}>{p.code}</TechTag>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* 3. WhatsApp messages (optional) */}
            <Card isDark={isDark}>
                <CardHeader
                    isDark={isDark}
                    title={<>WhatsApp messages <span className={cn('text-[13px] font-medium', t.hint)}>optional</span></>}
                    help="Turn on if the client wants leads to get WhatsApp messages. You need their WhatsApp Business API details."
                    right={
                        <Switch
                            isDark={isDark}
                            on={waOn}
                            onToggle={() => updateConfig('whatsapp_enabled', !waOn)}
                            label="Send WhatsApp messages to leads"
                        />
                    }
                />
                {waOn && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                        <Field isDark={isDark} label="Phone number ID" htmlFor="ob-wa-id">
                            <Input
                                id="ob-wa-id"
                                isDark={isDark}
                                value={cfg.whatsapp_phone_number_id ?? ''}
                                onChange={(e) => updateConfig('whatsapp_phone_number_id', e.target.value)}
                                placeholder="e.g. 109283746561928"
                                inputMode="numeric"
                                autoComplete="off"
                            />
                            <TechTag isDark={isDark} className="self-start">whatsapp_phone_number_id</TechTag>
                        </Field>
                        <Field isDark={isDark} label="Access token" htmlFor="ob-wa-token">
                            <div
                                className={cn(
                                    'flex items-center h-[46px] rounded-[10px] border-[1.5px] box-border pr-1 transition-shadow focus-within:ring-[3px]',
                                    isDark
                                        ? 'bg-neutral-950 border-neutral-700 focus-within:border-white focus-within:ring-white/15'
                                        : 'bg-white border-[#E5E5E5] focus-within:border-[#111111] focus-within:ring-black/10',
                                )}
                            >
                                <input
                                    id="ob-wa-token"
                                    type={showToken ? 'text' : 'password'}
                                    value={cfg.whatsapp_access_token ?? ''}
                                    onChange={(e) => updateConfig('whatsapp_access_token', e.target.value)}
                                    placeholder="Paste the permanent token"
                                    autoComplete="new-password"
                                    spellCheck={false}
                                    className={cn(
                                        'flex-1 min-w-0 h-[42px] border-0 bg-transparent px-3.5 text-sm font-medium focus:outline-none',
                                        isDark ? 'text-white placeholder-neutral-500' : 'text-[#0A0A0A] placeholder-[#A3A3A3]',
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken((v) => !v)}
                                    aria-label={showToken ? 'Hide access token' : 'Show access token'}
                                    className={cn(
                                        'flex-none h-9 min-w-[64px] px-3 border-0 rounded-lg text-[13px] font-bold cursor-pointer',
                                        isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-[#F2F2F2] text-[#0A0A0A] hover:bg-[#E9E9E9]',
                                    )}
                                >
                                    {showToken ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <TechTag isDark={isDark} className="self-start">whatsapp_access_token</TechTag>
                        </Field>
                        <Field
                            isDark={isDark}
                            label="Business account ID"
                            htmlFor="ob-wa-waba"
                            optional
                            hint="Needed to send approved WhatsApp templates."
                        >
                            <Input
                                id="ob-wa-waba"
                                isDark={isDark}
                                value={cfg.whatsapp_business_account_id ?? ''}
                                onChange={(e) => updateConfig('whatsapp_business_account_id', e.target.value)}
                                placeholder="e.g. 1565669768915042"
                                inputMode="numeric"
                                autoComplete="off"
                            />
                            <TechTag isDark={isDark} className="self-start">whatsapp_business_account_id</TechTag>
                        </Field>
                    </div>
                )}
            </Card>
        </>
    );

    const companyName = form.name || 'Your Company';
    const welcome = cfg.welcome;

    const aside = (
        <PreviewPanel rightLabel="Chat page" isDark={isDark}>
            <PhonePreview
                mode="welcome"
                companyName={companyName}
                botDisplayName={cfg.botDisplayName}
                botAvatar={cfg.botAvatar}
                primary={cfg.colors?.primary}
                secondary={cfg.colors?.secondary}
                headline={welcome?.headline}
                highlighted={welcome?.highlightedHeadline || companyName}
                subheadline={welcome?.subheadline}
                buttonText={welcome?.startBtnText}
                features={welcome?.features}
            />
            <PanelCard isDark={isDark}>
                <span className={cn('flex items-center gap-2 text-[13px] min-w-0', isDark ? 'text-neutral-300' : 'text-[#333333]')}>
                    <Icon.link size={15} className={cn('flex-none', isDark ? 'text-white' : 'text-black')} />
                    <span className="truncate">
                        {host}/<b className={t.text}>{form.slug || '…'}</b>
                    </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                    <Pill isDark={isDark}>{plan.name}</Pill>
                    <Pill isDark={isDark} className={isDark ? undefined : 'text-[#333333]'}>{waOn ? 'WhatsApp on' : 'WhatsApp off'}</Pill>
                </span>
            </PanelCard>
            <Hint isDark={isDark}>You&rsquo;ll set the bot&rsquo;s name, colours and welcome text in the next step.</Hint>
        </PreviewPanel>
    );

    return <StepColumns main={main} aside={aside} />;
};
