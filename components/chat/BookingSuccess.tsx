import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarPlus, Check, ExternalLink } from 'lucide-react';
import type { CallBooking } from '../../services/bookingService';
import type { SummaryData } from '../../types';
import {
    daysUntil,
    formatDateShort,
    formatSlotTime,
    formatTimezoneAbbr,
    toPlainDateInZone,
} from '../../utils/bookingFormat';
import { buildIcs, downloadIcs } from '../../utils/calendar';
import { formatPhoneIN } from '../../utils/phone';
import { RobotMascot } from './Mascot';

interface BookingSuccessProps {
    booking: CallBooking;
    name?: string | null;
    phone?: string | null;          // 10 digits
    companyName: string;            // used in the .ics title "Call with {companyName}"
    summaryData?: SummaryData | null;
    onStartNewChat: () => void;
}

interface SummaryRow {
    label: string;
    value: string;
}

const MAX_SUMMARY_ROWS = 6;

// Keys that are contact details (shown elsewhere) or internal scoring data, never shown to the visitor
const HIDDEN_KEYS = new Set([
    'name',
    'phone',
    'sessionid',
    'answers',
    'signal_breakdown',
    'avg_signal_score',
    'total_questions',
    'disqualified',
    'lead_priority',
]);

const isHiddenKey = (key: string) => {
    const lower = key.toLowerCase();
    return HIDDEN_KEYS.has(lower) || lower.endsWith('_lead_output') || lower.startsWith('q0');
};

/** "moveIn" / "move_in" -> "Move in" */
const humanizeKey = (key: string): string => {
    const words = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
};

const asText = (value: unknown): string | null => {
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return null;
};

/** Label/value rows for "Shared with our team" from the backend lead summary. */
const getSummaryRows = (data?: SummaryData | null): SummaryRow[] => {
    if (!data) return [];
    const rows: SummaryRow[] = [];

    if (Array.isArray(data.answers)) {
        // S3 Mapping: [{ question, answer }]
        for (const item of data.answers) {
            if (!item || typeof item !== 'object') continue;
            const label = asText(item.question);
            const value = asText(item.answer);
            if (label && value) rows.push({ label, value });
        }
        return rows.slice(0, MAX_SUMMARY_ROWS);
    }

    for (const [key, raw] of Object.entries(data)) {
        if (isHiddenKey(key)) continue;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            // { label, answer }
            const entry = raw as { label?: unknown; answer?: unknown };
            const label = asText(entry.label) || humanizeKey(key);
            const value = asText(entry.answer);
            if (value) rows.push({ label, value });
            continue;
        }
        const value = asText(raw);
        if (value) rows.push({ label: humanizeKey(key), value });
    }
    return rows.slice(0, MAX_SUMMARY_ROWS);
};

const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'call';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

const BookingSuccess: React.FC<BookingSuccessProps> = ({
    booking,
    name,
    phone,
    companyName,
    summaryData,
    onStartNewChat,
}) => {
    const [downloaded, setDownloaded] = useState(false);
    const resetTimerRef = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

    const timezone = booking.timezone;
    const firstName = (name || '').trim().split(/\s+/)[0] || '';
    const tzAbbr = formatTimezoneAbbr(timezone, booking.start_time);
    const phoneText = phone ? formatPhoneIN(phone) : null;

    const durationMinutes = useMemo(() => {
        const ms = new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime();
        return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 60000) : null;
    }, [booking.start_time, booking.end_time]);

    // "today" / "tomorrow" / "on Fri, 27 Nov", relative to today in the booking's timezone
    const whenText = useMemo(() => {
        const days = daysUntil(toPlainDateInZone(booking.start_time, timezone), timezone);
        if (days === 0) return 'today';
        if (days === 1) return 'tomorrow';
        return `on ${formatDateShort(booking.start_time, timezone)}`;
    }, [booking.start_time, timezone]);

    const dateLine = `${formatDateShort(booking.start_time, timezone)} · ${formatSlotTime(booking.start_time, timezone)}${tzAbbr ? ` ${tzAbbr}` : ''}`;
    const detailLine = [durationMinutes ? `${durationMinutes}-min call` : null, phoneText].filter(Boolean).join(' · ');

    const summaryRows = useMemo(() => getSummaryRows(summaryData), [summaryData]);

    const handleAddToCalendar = () => {
        const descriptionLines = [
            durationMinutes ? `A ${durationMinutes}-minute call with ${companyName}.` : `A call with ${companyName}.`,
            phoneText ? `We'll call you on ${phoneText}.` : null,
            booking.meet_link ? `Join: ${booking.meet_link}` : null,
        ].filter(Boolean) as string[];

        const ics = buildIcs({
            uid: booking.meeting_id,
            title: `Call with ${companyName}`,
            description: descriptionLines.join('\n'),
            start: booking.start_time,
            end: booking.end_time,
            url: booking.meet_link || undefined,
        });
        downloadIcs(`call-with-${slugify(companyName)}.ics`, ics);

        setDownloaded(true);
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = window.setTimeout(() => setDownloaded(false), 2500);
    };

    return (
        <div className="flex-1 flex flex-col w-full px-4 sm:px-5 pb-6 motion-safe:animate-fade-in-up">
            {/* Mascot + headline */}
            <div className="flex flex-col items-center text-center pt-2">
                <div className="relative">
                    <div className="absolute inset-4 rounded-full bg-brand/15 blur-2xl" aria-hidden="true" />
                    <RobotMascot size={150} badge="check" className="relative" />
                </div>
                <h2 className="mt-3 text-[28px] leading-tight font-semibold text-chat-ink">
                    {firstName ? `You're all set, ${firstName}` : "You're all set"}
                </h2>
                <p className="mt-1.5 text-[17px] text-chat-muted">Our team will call you {whenText}.</p>
            </div>

            {/* Booked call */}
            <section className="mt-6 bg-white rounded-3xl shadow-chat-card p-5 sm:p-6" aria-label="Your booked call">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-6 h-6 text-brand-ink" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[17px] font-semibold text-chat-ink leading-snug">{dateLine}</p>
                        {detailLine && <p className="text-[15px] text-chat-muted mt-0.5">{detailLine}</p>}
                    </div>
                </div>

                <div className={`mt-5 grid gap-3 ${booking.meet_link ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                        type="button"
                        onClick={handleAddToCalendar}
                        className={`h-14 px-3 flex items-center justify-center gap-2 rounded-2xl bg-brand-grad text-brand-on font-semibold text-[16px] shadow-chat-brand hover:brightness-105 transition ${focusRing}`}
                    >
                        {downloaded ? (
                            <>
                                <Check className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                <span className="truncate">Downloaded</span>
                            </>
                        ) : (
                            <>
                                <CalendarPlus className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                <span className="truncate">Add to calendar</span>
                            </>
                        )}
                    </button>
                    {booking.meet_link && (
                        <a
                            href={booking.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`h-14 px-3 flex items-center justify-center gap-2 rounded-2xl bg-white border border-brand-border text-brand-ink font-semibold text-[16px] hover:bg-brand-soft transition-colors ${focusRing}`}
                        >
                            <ExternalLink className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">Open meeting link</span>
                        </a>
                    )}
                </div>
                <span className="sr-only" aria-live="polite">
                    {downloaded ? 'Calendar file downloaded' : ''}
                </span>
            </section>

            {/* What the team will see */}
            {summaryRows.length > 0 && (
                <section className="mt-4 bg-white rounded-3xl shadow-chat-card px-5 sm:px-6 pt-5 pb-2">
                    <h3 className="text-[17px] font-semibold text-chat-ink pb-3 border-b border-chat-line">
                        Shared with our team
                    </h3>
                    <dl>
                        {summaryRows.map((row, i) => (
                            <div
                                key={`${row.label}-${i}`}
                                className="flex items-start justify-between gap-4 py-3.5 border-b border-chat-line last:border-b-0"
                            >
                                <dt className="text-[15px] text-chat-muted min-w-0">{row.label}</dt>
                                <dd className="text-[15px] text-chat-ink text-right max-w-[60%] break-words">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            <div className="mt-auto pt-8 flex justify-center">
                <button
                    type="button"
                    onClick={onStartNewChat}
                    className={`min-h-[44px] px-4 rounded-xl text-[17px] font-semibold text-brand-ink hover:underline underline-offset-4 ${focusRing}`}
                >
                    Start a new chat
                </button>
            </div>
        </div>
    );
};

export default BookingSuccess;
