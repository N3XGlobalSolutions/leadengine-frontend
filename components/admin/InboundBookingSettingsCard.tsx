import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CalendarClock, CheckCircle, Loader2, RefreshCw, Save } from 'lucide-react';
import { bookingService, InboundBookingSettings } from '../../services/bookingService';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { cn } from '../../utils/cn';
import { Button, Card, CardHeader, Field, Hint, Input, Select, StatusPill, tone } from './ui/kit';

/**
 * Inbound (website chat) call-booking settings for one client.
 * Stored through its own API, so it has its own Save button - the page's
 * global "Save Changes" does not include these values.
 */

interface InboundBookingSettingsCardProps {
    tenantId: string;
    isDark: boolean;
}

type BookingForm = Omit<InboundBookingSettings, 'tenant_id'>;

// Backend defaults when a client has never saved booking settings
const DEFAULTS: BookingForm = {
    enabled: true,
    timezone: 'Asia/Kolkata',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    meeting_duration: 30,
    buffer: 0,
    booking_days_ahead: 14,
};

const WEEK_DAYS: { value: string; label: string }[] = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
];

const TIMEZONES: { value: string; label: string }[] = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore' },
    { value: 'Asia/Riyadh', label: 'Asia/Riyadh (Saudi Arabia)' },
    { value: 'Europe/London', label: 'Europe/London (UK)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (Central Europe)' },
    { value: 'America/New_York', label: 'America/New_York (US Eastern)' },
    { value: 'America/Chicago', label: 'America/Chicago (US Central)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney' },
    { value: 'UTC', label: 'UTC' },
];

const DURATIONS = [15, 20, 30, 45, 60, 90];

const BUFFER_MIN = 0;
const BUFFER_MAX = 240;
const DAYS_AHEAD_MIN = 1;
const DAYS_AHEAD_MAX = 90;

/** "HH:MM" (or "HH:MM:SS") -> minutes since midnight, or null if invalid */
const toMinutes = (value: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})/.exec(value || '');
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
};

/** minutes since midnight -> "9:30 AM" */
const formatMinutes = (total: number): string => {
    const h24 = Math.floor(total / 60) % 24;
    const m = total % 60;
    const period = h24 < 12 ? 'AM' : 'PM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

/** Parse a raw number-input string and clamp it; empty/invalid falls back. Never returns NaN. */
const clampInt = (raw: string, min: number, max: number, fallback: number): number => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
};

/** Fill gaps in an API response so the form always has usable values. */
const normalize = (s: Partial<InboundBookingSettings> | null | undefined): BookingForm => {
    const days = Array.isArray(s?.working_days)
        ? s!.working_days.map((d) => String(d).toLowerCase()).filter((d) => WEEK_DAYS.some((w) => w.value === d))
        : DEFAULTS.working_days;
    const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
    return {
        enabled: typeof s?.enabled === 'boolean' ? s.enabled : DEFAULTS.enabled,
        timezone: s?.timezone || DEFAULTS.timezone,
        working_days: days,
        working_hours_start: (s?.working_hours_start || DEFAULTS.working_hours_start).slice(0, 5),
        working_hours_end: (s?.working_hours_end || DEFAULTS.working_hours_end).slice(0, 5),
        meeting_duration: num(s?.meeting_duration, DEFAULTS.meeting_duration),
        buffer: num(s?.buffer, DEFAULTS.buffer),
        booking_days_ahead: num(s?.booking_days_ahead, DEFAULTS.booking_days_ahead),
    };
};

const errorDetail = (err: unknown, fallback: string): string => {
    const detail = (err as { response?: { data?: { detail?: unknown } } } | null)?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const msgs = detail.map((d: unknown) => (typeof d === 'string' ? d : (d as { msg?: string } | null)?.msg)).filter(Boolean);
        if (msgs.length) return msgs.join('. ');
    }
    return fallback;
};

export const InboundBookingSettingsCard: React.FC<InboundBookingSettingsCardProps> = ({ tenantId, isDark }) => {
    const { user } = useAdminAuth();
    const readOnly = user?.role === 'sales_team';

    const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
    const [loadError, setLoadError] = useState('');
    const [saved, setSaved] = useState<BookingForm>(DEFAULTS); // last values confirmed by the server
    const [form, setForm] = useState<BookingForm>(DEFAULTS);
    // Raw strings for number inputs so clearing a field never produces NaN
    const [bufferRaw, setBufferRaw] = useState(String(DEFAULTS.buffer));
    const [daysAheadRaw, setDaysAheadRaw] = useState(String(DEFAULTS.booking_days_ahead));

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const applyLoaded = (settings: BookingForm) => {
        setSaved(settings);
        setForm(settings);
        setBufferRaw(String(settings.buffer));
        setDaysAheadRaw(String(settings.booking_days_ahead));
    };

    const load = useCallback(async (isCancelled: () => boolean = () => false) => {
        setStatus('loading');
        setLoadError('');
        try {
            const data = await bookingService.getBookingSettings(tenantId);
            if (isCancelled()) return;
            applyLoaded(normalize(data));
            setStatus('ready');
        } catch (err) {
            if (isCancelled()) return;
            setLoadError(errorDetail(err, "Couldn't load call booking settings."));
            setStatus('error');
        }
    }, [tenantId]);

    useEffect(() => {
        let cancelled = false;
        setSaveMessage(null);
        load(() => cancelled);
        return () => {
            cancelled = true;
        };
    }, [load]);

    useEffect(() => () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
    }, []);

    const update = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setSaveMessage(null);
    };

    const toggleDay = (day: string) => {
        setForm((prev) => {
            const has = prev.working_days.includes(day);
            const next = has ? prev.working_days.filter((d) => d !== day) : [...prev.working_days, day];
            // keep Mon..Sun order
            next.sort((a, b) => WEEK_DAYS.findIndex((w) => w.value === a) - WEEK_DAYS.findIndex((w) => w.value === b));
            return { ...prev, working_days: next };
        });
        setSaveMessage(null);
    };

    const commitBuffer = () => {
        const value = clampInt(bufferRaw, BUFFER_MIN, BUFFER_MAX, form.buffer);
        setBufferRaw(String(value));
        setForm((prev) => ({ ...prev, buffer: value }));
        return value;
    };

    const commitDaysAhead = () => {
        const value = clampInt(daysAheadRaw, DAYS_AHEAD_MIN, DAYS_AHEAD_MAX, form.booking_days_ahead);
        setDaysAheadRaw(String(value));
        setForm((prev) => ({ ...prev, booking_days_ahead: value }));
        return value;
    };

    // --- Derived values ---
    const startMin = toMinutes(form.working_hours_start);
    const endMin = toMinutes(form.working_hours_end);
    const hoursError =
        startMin === null || endMin === null
            ? 'Enter a start and end time.'
            : endMin <= startMin
                ? 'Working hours end must be after start.'
                : '';
    const daysError = form.working_days.length === 0 ? 'Pick at least one working day.' : '';

    const slots = useMemo(() => {
        if (startMin === null || endMin === null || endMin <= startMin || form.meeting_duration <= 0) return [];
        const result: number[] = [];
        for (let t = startMin; t + form.meeting_duration <= endMin; t += form.meeting_duration) {
            result.push(t);
        }
        return result;
    }, [startMin, endMin, form.meeting_duration]);

    const slotPreview = useMemo(() => {
        if (slots.length === 0) return '';
        const labels = slots.map(formatMinutes);
        if (labels.length <= 4) return labels.join(', ');
        return `${labels.slice(0, 3).join(', ')} … ${labels[labels.length - 1]}`;
    }, [slots]);

    const timezoneOptions = useMemo(() => {
        if (!form.timezone || TIMEZONES.some((tz) => tz.value === form.timezone)) return TIMEZONES;
        return [{ value: form.timezone, label: form.timezone }, ...TIMEZONES];
    }, [form.timezone]);

    const durationOptions = useMemo(() => {
        if (DURATIONS.includes(form.meeting_duration)) return DURATIONS;
        return [...DURATIONS, form.meeting_duration].sort((a, b) => a - b);
    }, [form.meeting_duration]);

    const isDirty = useMemo(() => {
        const current = {
            ...form,
            buffer: clampInt(bufferRaw, BUFFER_MIN, BUFFER_MAX, form.buffer),
            booking_days_ahead: clampInt(daysAheadRaw, DAYS_AHEAD_MIN, DAYS_AHEAD_MAX, form.booking_days_ahead),
        };
        return JSON.stringify(current) !== JSON.stringify(saved);
    }, [form, bufferRaw, daysAheadRaw, saved]);

    // --- Save ---
    const handleSave = async () => {
        if (readOnly || saving) return;
        if (hideTimer.current) clearTimeout(hideTimer.current);

        const buffer = commitBuffer();
        const bookingDaysAhead = commitDaysAhead();

        const problem = daysError || hoursError;
        if (problem) {
            setSaveMessage({ type: 'error', text: problem });
            return;
        }

        const payload: BookingForm = {
            ...form,
            buffer,
            booking_days_ahead: bookingDaysAhead,
        };

        setSaving(true);
        setSaveMessage(null);
        try {
            const result = await bookingService.updateBookingSettings(tenantId, payload);
            applyLoaded(normalize(result ?? payload));
            setSaveMessage({ type: 'success', text: 'Booking settings saved' });
            hideTimer.current = setTimeout(() => setSaveMessage(null), 3000);
        } catch (err) {
            setSaveMessage({ type: 'error', text: errorDetail(err, "Couldn't save booking settings. Please try again.") });
        } finally {
            setSaving(false);
        }
    };

    // --- Styles (v2 black/white design) ---
    const t = tone(isDark);
    const fieldInput = cn('disabled:cursor-not-allowed', isDark && '[color-scheme:dark]');
    const fieldSelect = 'w-full h-[46px] text-sm font-medium disabled:cursor-not-allowed';
    const fieldErrorClass = cn('m-0 mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold', isDark ? 'text-red-400' : 'text-[#B91C1C]');
    const focusRing = cn('focus:outline-none focus-visible:ring-[3px]', isDark ? 'focus-visible:ring-white/25' : 'focus-visible:ring-black/15');

    const header = (
        <CardHeader
            isDark={isDark}
            title={
                <span className="inline-flex items-center gap-2.5">
                    <CalendarClock size={18} strokeWidth={1.8} aria-hidden="true" /> Call Booking
                </span>
            }
            help="When a visitor clicks 'Yes, schedule a call', they pick one of these slots in the chat."
        />
    );

    if (status === 'loading') {
        return (
            <Card isDark={isDark}>
                {header}
                <div className="animate-pulse flex flex-col gap-[18px]" aria-busy="true" aria-label="Loading call booking settings">
                    <div className={cn('h-[60px] rounded-xl', t.subtle)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className={cn('h-[74px] rounded-xl', t.subtle)} />
                        <div className={cn('h-[74px] rounded-xl', t.subtle)} />
                        <div className={cn('h-[74px] rounded-xl', t.subtle)} />
                        <div className={cn('h-[74px] rounded-xl', t.subtle)} />
                    </div>
                    <div className={cn('h-11 w-56 max-w-full rounded-[11px]', t.subtle)} />
                </div>
            </Card>
        );
    }

    if (status === 'error') {
        return (
            <Card isDark={isDark}>
                {header}
                <div
                    role="alert"
                    className={cn(
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-xl border',
                        isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]',
                    )}
                >
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                        <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {loadError || "Couldn't load call booking settings."}
                    </span>
                    <Button isDark={isDark} variant="secondary" onClick={() => load()} className="min-h-[36px] px-3.5 text-[13px] shrink-0">
                        <RefreshCw size={14} aria-hidden="true" /> Retry
                    </Button>
                </div>
            </Card>
        );
    }

    const fieldsDisabled = !form.enabled || readOnly;

    return (
        <Card isDark={isDark}>
            {header}

            {/* Enabled toggle */}
            <div
                className={cn(
                    'flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border',
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-[#FAFAFA] border-[#E5E5E5]',
                )}
            >
                <div className="flex flex-col gap-0.5 min-w-0">
                    <label htmlFor={`booking-enabled-${tenantId}`} className={cn('text-sm font-bold cursor-pointer', t.text)}>
                        Let visitors book a call slot in the chat
                    </label>
                    {!form.enabled && (
                        <p className={cn('m-0 text-[12.5px] leading-[1.5]', t.muted)}>
                            Visitors will be told the team will call them.
                        </p>
                    )}
                </div>
                <button
                    id={`booking-enabled-${tenantId}`}
                    type="button"
                    role="switch"
                    aria-checked={form.enabled}
                    disabled={readOnly}
                    onClick={() => update('enabled', !form.enabled)}
                    className={cn(
                        'flex-none w-12 h-7 rounded-[14px] border-none cursor-pointer p-[3px] flex transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                        focusRing,
                        form.enabled
                            ? (isDark ? 'bg-white justify-end' : 'bg-[#111111] justify-end')
                            : (isDark ? 'bg-neutral-700 justify-start' : 'bg-[#D4D4D4] justify-start'),
                    )}
                >
                    <span aria-hidden="true" className={cn('w-[22px] h-[22px] rounded-full shadow-sm', form.enabled && isDark ? 'bg-black' : 'bg-white')} />
                </button>
            </div>

            <fieldset
                disabled={fieldsDisabled}
                className={cn('m-0 p-0 border-0 min-w-0 flex flex-col gap-[18px] transition-opacity', !form.enabled && 'opacity-50')}
            >
                <legend className="sr-only">Bookable slots</legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Timezone */}
                    <Field isDark={isDark} label="Timezone" htmlFor={`booking-tz-${tenantId}`} hint="Slots are shown to visitors in this timezone.">
                        <Select
                            isDark={isDark}
                            id={`booking-tz-${tenantId}`}
                            value={form.timezone}
                            onChange={(e) => update('timezone', e.target.value)}
                            className={fieldSelect}
                        >
                            {timezoneOptions.map((tz) => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </Select>
                    </Field>

                    {/* Call length */}
                    <Field isDark={isDark} label="Call length" htmlFor={`booking-duration-${tenantId}`}>
                        <Select
                            isDark={isDark}
                            id={`booking-duration-${tenantId}`}
                            value={form.meeting_duration}
                            onChange={(e) => update('meeting_duration', Number(e.target.value))}
                            className={fieldSelect}
                        >
                            {durationOptions.map((d) => (
                                <option key={d} value={d}>{d} minutes</option>
                            ))}
                        </Select>
                    </Field>
                </div>

                {/* Working days */}
                <div className="flex flex-col gap-2 min-w-0">
                    <span id={`booking-days-${tenantId}`} className={cn('text-[13px] font-bold', t.text)}>Working days</span>
                    <div role="group" aria-labelledby={`booking-days-${tenantId}`} className="flex flex-wrap gap-2">
                        {WEEK_DAYS.map((day) => {
                            const selected = form.working_days.includes(day.value);
                            return (
                                <button
                                    key={day.value}
                                    type="button"
                                    aria-pressed={selected}
                                    aria-label={day.value.charAt(0).toUpperCase() + day.value.slice(1)}
                                    onClick={() => toggleDay(day.value)}
                                    className={cn(
                                        'inline-flex items-center justify-center min-w-[56px] min-h-[38px] px-3.5 rounded-full border text-[13px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed',
                                        focusRing,
                                        selected
                                            ? (isDark ? 'bg-white text-black border-white' : 'bg-[#0A0A0A] text-white border-[#0A0A0A]')
                                            : (isDark ? 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800' : 'bg-white text-[#333333] border-[#E5E5E5] hover:bg-[#F7F7F7]'),
                                    )}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                    {daysError && (
                        <p className={fieldErrorClass}><AlertCircle size={13} aria-hidden="true" /> {daysError}</p>
                    )}
                </div>

                {/* Working hours */}
                <div className="min-w-0">
                    <div className="grid grid-cols-2 gap-3.5">
                        <Field isDark={isDark} label="Working hours start" htmlFor={`booking-start-${tenantId}`}>
                            <Input
                                isDark={isDark}
                                id={`booking-start-${tenantId}`}
                                type="time"
                                value={form.working_hours_start}
                                onChange={(e) => update('working_hours_start', e.target.value)}
                                className={fieldInput}
                                invalid={Boolean(hoursError)}
                                required
                            />
                        </Field>
                        <Field isDark={isDark} label="Working hours end" htmlFor={`booking-end-${tenantId}`}>
                            <Input
                                isDark={isDark}
                                id={`booking-end-${tenantId}`}
                                type="time"
                                value={form.working_hours_end}
                                onChange={(e) => update('working_hours_end', e.target.value)}
                                className={fieldInput}
                                invalid={Boolean(hoursError)}
                                required
                            />
                        </Field>
                    </div>
                    {hoursError && (
                        <p className={fieldErrorClass}><AlertCircle size={13} aria-hidden="true" /> {hoursError}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Buffer */}
                    <Field isDark={isDark} label="Gap between calls (minutes)" htmlFor={`booking-buffer-${tenantId}`} hint="Kept free before and after each booked call.">
                        <Input
                            isDark={isDark}
                            id={`booking-buffer-${tenantId}`}
                            type="number"
                            inputMode="numeric"
                            min={BUFFER_MIN}
                            max={BUFFER_MAX}
                            step={5}
                            value={bufferRaw}
                            onChange={(e) => {
                                setBufferRaw(e.target.value);
                                setSaveMessage(null);
                            }}
                            onBlur={commitBuffer}
                            className={fieldInput}
                        />
                    </Field>

                    {/* Booking window */}
                    <Field isDark={isDark} label="Booking window (days)" htmlFor={`booking-window-${tenantId}`} hint="How many days ahead visitors can book.">
                        <Input
                            isDark={isDark}
                            id={`booking-window-${tenantId}`}
                            type="number"
                            inputMode="numeric"
                            min={DAYS_AHEAD_MIN}
                            max={DAYS_AHEAD_MAX}
                            step={1}
                            value={daysAheadRaw}
                            onChange={(e) => {
                                setDaysAheadRaw(e.target.value);
                                setSaveMessage(null);
                            }}
                            onBlur={commitDaysAhead}
                            className={fieldInput}
                        />
                    </Field>
                </div>

                {/* Live preview */}
                {form.enabled && !hoursError && (
                    slots.length > 0 ? (
                        <p
                            className={cn(
                                'm-0 text-[13.5px] leading-[1.55] px-4 py-3 rounded-xl border',
                                isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#525252]',
                            )}
                        >
                            Visitors will see <span className={cn('font-bold', t.text)}>{slots.length} {slots.length === 1 ? 'slot' : 'slots'} per day</span>: {slotPreview}
                        </p>
                    ) : (
                        <p
                            role="status"
                            className={cn(
                                'm-0 text-[13.5px] leading-[1.55] px-4 py-3 rounded-xl border flex items-start gap-2',
                                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]',
                            )}
                        >
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>
                                No slots fit: a {form.meeting_duration}-minute call doesn't fit between {formatMinutes(startMin ?? 0)} and {formatMinutes(endMin ?? 0)}. Visitors won't be able to book.
                            </span>
                        </p>
                    )
                )}
            </fieldset>

            {/* Save */}
            <div className={cn('pt-[18px] border-t', isDark ? 'border-neutral-800' : 'border-[#EEEEEE]')}>
                {readOnly ? (
                    <Hint isDark={isDark}>View only - your role can't change booking settings.</Hint>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <Button isDark={isDark} variant="primary" onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Saving...</>
                                ) : (
                                    <><Save size={16} aria-hidden="true" /> Save booking settings</>
                                )}
                            </Button>
                            {isDirty && !saving && saveMessage?.type !== 'error' && (
                                <StatusPill isDark={isDark} tone="amber" className="h-6 text-[11.5px]">Unsaved changes</StatusPill>
                            )}
                            <span aria-live="polite" className="inline-flex">
                                {saveMessage && (
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 text-[13.5px] font-semibold',
                                            saveMessage.type === 'success'
                                                ? (isDark ? 'text-green-300' : 'text-[#166534]')
                                                : (isDark ? 'text-red-300' : 'text-[#B91C1C]'),
                                        )}
                                    >
                                        {saveMessage.type === 'success'
                                            ? <CheckCircle size={16} className="shrink-0" aria-hidden="true" />
                                            : <AlertCircle size={16} className="shrink-0" aria-hidden="true" />}
                                        {saveMessage.text}
                                    </span>
                                )}
                            </span>
                        </div>
                        <Hint isDark={isDark}>Saved separately from the rest of this page.</Hint>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default InboundBookingSettingsCard;
