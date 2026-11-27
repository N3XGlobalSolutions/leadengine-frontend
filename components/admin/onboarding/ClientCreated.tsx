/**
 * Success screen shown after the wizard creates a client ("<Company> is live").
 * Design: spec6.html. Rendered inside the wizard page's <main>; the page owns AdminLayout + top bar.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { chatLinkFor, type ClientCreatedProps } from '../../../types/onboarding';
import { Button, Card, Icon, Mark, PreviewPanel, StepColumns, buttonClass, tone } from './ui';
import { PhonePreview } from './PhonePreview';

/** Copy text to the clipboard; falls back to a hidden textarea + execCommand on insecure origins / old browsers. */
const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        /* fall through to the textarea fallback */
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
};

type RowKind = 'done' | 'pending' | 'warn' | 'off';

interface NextRow {
    key: string;
    kind: RowKind;
    title: string;
    desc: string;
}

const ClockIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

const MinusIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
        <path d="M6 12h12" />
    </svg>
);

const RowIcon: React.FC<{ kind: RowKind; isDark: boolean }> = ({ kind, isDark }) => {
    const warn = kind === 'warn';
    return (
        <span
            className={cn(
                'w-7 h-7 flex-none rounded-full flex items-center justify-center',
                warn
                    ? (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-[#FEF3C7] text-[#B45309]')
                    : (isDark ? 'bg-neutral-800' : 'bg-[#F2F2F2]'),
                !warn && (kind === 'off'
                    ? (isDark ? 'text-neutral-500' : 'text-[#6B6B6B]')
                    : (isDark ? 'text-white' : 'text-[#171717]')),
            )}
        >
            {kind === 'done' && <Icon.check size={14} />}
            {kind === 'pending' && <ClockIcon />}
            {kind === 'warn' && <Icon.alert size={14} />}
            {kind === 'off' && <MinusIcon />}
        </span>
    );
};

export const ClientCreated: React.FC<ClientCreatedProps> = ({ client, form, fileName, documentFailed, onAddAnother, isDark }) => {
    const t = tone(isDark);
    const link = chatLinkFor(client.id);
    const companyName = client.name || form.name;
    const c = form.config;

    const [copied, setCopied] = useState(false);
    const timerRef = useRef<number | null>(null);
    const linkTextRef = useRef<HTMLSpanElement>(null);

    useEffect(() => () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    }, []);

    const handleCopy = useCallback(async () => {
        const ok = await copyToClipboard(link);
        if (ok) {
            setCopied(true);
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => setCopied(false), 2000);
            return;
        }
        // Copy blocked: select the link so the user can copy it by hand.
        const node = linkTextRef.current;
        const selection = window.getSelection();
        if (node && selection) {
            const range = document.createRange();
            range.selectNodeContents(node);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, [link]);

    const documentRow: NextRow = fileName && !documentFailed
        ? { key: 'doc', kind: 'pending', title: 'Document processing', desc: `The bot will answer from ${fileName} in a few minutes. You can add more files on the client page.` }
        : documentFailed
            ? { key: 'doc', kind: 'warn', title: 'Document upload failed', desc: `Upload ${fileName || 'the document'} again from the client page.` }
            : { key: 'doc', kind: 'off', title: 'No document yet', desc: 'Add one from the client page so the bot can answer questions.' };

    const whatsappRow: NextRow = c.whatsapp_enabled
        ? { key: 'wa', kind: 'done', title: 'WhatsApp messages on', desc: 'Leads get WhatsApp messages from the client’s number.' }
        : { key: 'wa', kind: 'off', title: 'WhatsApp messages off', desc: 'Turn it on later from the client page.' };

    const rows: NextRow[] = [
        { key: 'chat', kind: 'done', title: 'Chat page is live', desc: 'Visitors can start chatting straight away.' },
        documentRow,
        whatsappRow,
    ];

    const main = (
        <>
            <Card isDark={isDark} className="gap-5 p-8">
                <span
                    className={cn(
                        'w-14 h-14 rounded-full border-[1.5px] flex items-center justify-center',
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#F2F2F2] border-[#D4D4D4] text-[#171717]',
                    )}
                >
                    <Icon.check size={26} />
                </span>

                <div className="flex flex-col gap-2">
                    <h1 className={cn('m-0 text-[38px] leading-[1.1] font-extrabold tracking-[-0.035em]', t.text)}>
                        {companyName} is <Mark isDark={isDark}>live</Mark>
                    </h1>
                    <p className={cn('m-0 text-[15px] leading-[1.55]', t.muted)}>
                        Share the chat page with the client. Leads from it show up in Leads, sorted warm and cold.
                    </p>
                </div>

                <div
                    className={cn(
                        'flex flex-wrap items-center gap-2 py-1.5 pr-1.5 pl-4 rounded-xl border-[1.5px]',
                        isDark ? 'bg-neutral-950 border-neutral-700' : 'bg-[#F7F7F7] border-[#D4D4D4]',
                    )}
                >
                    <span className={cn('flex-[1_1_240px] min-w-0 flex items-center gap-2 text-sm font-bold', t.text)}>
                        <span className={cn('flex-none flex', t.muted)}><Icon.link size={16} /></span>
                        <span ref={linkTextRef} className="min-w-0 [overflow-wrap:anywhere]">{link}</span>
                    </span>
                    <Button isDark={isDark} variant="primary" onClick={handleCopy} className="min-w-[108px]">
                        {copied ? 'Copied!' : 'Copy link'}
                    </Button>
                    <span className="sr-only" role="status" aria-live="polite">{copied ? 'Chat link copied to clipboard' : ''}</span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <a className={buttonClass(isDark, 'secondary')} href={link} target="_blank" rel="noopener noreferrer">
                        Open chat page<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <Link className={buttonClass(isDark, 'secondary')} to={`/admin/clients/${client.id}`}>
                        Go to client details
                    </Link>
                    <Button isDark={isDark} variant="ghost" onClick={onAddAnother}>
                        + Add another client
                    </Button>
                </div>
            </Card>

            <Card isDark={isDark} className="gap-1">
                <h2 className={cn('m-0 pb-2 text-[18px] font-extrabold tracking-[-0.02em]', t.text)}>What happens now</h2>
                <ul className="list-none m-0 p-0">
                    {rows.map((row) => (
                        <li key={row.key} className={cn('flex items-start gap-3 py-3.5 border-t', isDark ? 'border-neutral-800' : 'border-[#EEEEEE]')}>
                            <RowIcon kind={row.kind} isDark={isDark} />
                            <span className="flex flex-col gap-0.5 min-w-0">
                                <span className={cn('text-sm font-bold', t.text)}>{row.title}</span>
                                <span className={cn('text-[13px] [overflow-wrap:anywhere]', t.muted)}>{row.desc}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </Card>
        </>
    );

    const aside = (
        <PreviewPanel isDark={isDark} rightLabel="As visitors see it">
            <PhonePreview
                mode="welcome"
                companyName={c.companyName || form.name}
                botDisplayName={c.botDisplayName}
                botAvatar={c.botAvatar}
                primary={c.colors?.primary}
                secondary={c.colors?.secondary}
                headline={c.welcome?.headline}
                highlighted={c.welcome?.highlightedHeadline || form.name}
                subheadline={c.welcome?.subheadline}
                buttonText={c.welcome?.startBtnText}
                features={c.welcome?.features}
            />
        </PreviewPanel>
    );

    return <StepColumns main={main} aside={aside} />;
};
