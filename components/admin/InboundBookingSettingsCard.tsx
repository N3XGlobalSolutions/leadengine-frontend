import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CalendarClock, CheckCircle, Loader2, RefreshCw, Save } from 'lucide-react';
import { bookingService, InboundBookingSettings } from '../../services/bookingService';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

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

const errorDetail = (err: any, fallback: string): string => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const msgs = detail.map((d: any) => (typeof d === 'string' ? d : d?.msg)).filter(Boolean);
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
        } catch (err: any) {
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
        } catch (err: any) {
            setSaveMessage({ type: 'error', text: errorDetail(err, "Couldn't save booking settings. Please try again.") });
        } finally {
            setSaving(false);
        }
    };

    // --- Styles (match AdminClientDetailPage) ---
    const cardClass = `p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
    const inputClass = `w-full px-3 sm:px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:cursor-not-allowed ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 [color-scheme:dark]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`;
    const labelClass = `block text-xs sm:text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
    const hintClass = `text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`;
    const fieldErrorClass = `text-xs mt-1.5 flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`;

    const header = (
        <div className="mb-5">
            <h2 className={`text-lg font-semibold mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <CalendarClock size={20} /> Call Booking
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                When a visitor clicks 'Yes, schedule a call', they pick one of these slots in the chat.
            </p>
        </div>
    );

    if (status === 'loading') {
        const bar = isDark ? 'bg-slate-700' : 'bg-gray-100';
        return (
            <div className={cardClass} aria-busy="true" aria-label="Loading call booking settings">
                {header}
                <div className="animate-pulse space-y-5">
                    <div className={`h-6 w-72 max-w-full rounded ${bar}`} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`h-16 rounded-lg ${bar}`} />
                        <div className={`h-16 rounded-lg ${bar}`} />
                        <div className={`h-16 rounded-lg ${bar}`} />
                        <div className={`h-16 rounded-lg ${bar}`} />
                    </div>
                    <div className={`h-10 w-48 rounded-lg ${bar}`} />
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={cardClass}>
                {header}
                <div
                    role="alert"
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}
                >
                    <span className="flex items-center gap-2 text-sm">
                        <AlertCircle size={16} className="shrink-0" /> {loadError || "Couldn't load call booking settings."}
                    </span>
                    <button
                        type="button"
                        onClick={() => load()}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors shrink-0 ${isDark ? 'border-slate-600 bg-slate-800 text-white hover:bg-slate-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    const fieldsDisabled = !form.enabled || readOnly;

    return (
        <div className={cardClass}>
            {header}

            {/* Enabled toggle */}
            <div className="flex items-center justify-between gap-4">
                <label htmlFor={`booking-enabled-${tenantId}`} className={`text-sm font-medium cursor-pointer ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                    Let visitors book a call slot in the chat
                </label>
                <button
                    id={`booking-enabled-${tenantId}`}
                    type="button"
                    role="switch"
                    aria-checked={form.enabled}
                    disabled={readOnly}
                    onClick={() => update('enabled', !form.enabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'focus-visible:ring-offset-slate-800' : 'focus-visible:ring-offset-white'} ${form.enabled ? 'bg-indigo-600' : isDark ? 'bg-slate-600' : 'bg-gray-300'}`}
                >
                    <span
                        aria-hidden="true"
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                    />
                </button>
            </div>
            {!form.enabled && (
                <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Visitors will be told the team will call them.
                </p>
            )}

            <fieldset
                disabled={fieldsDisabled}
                className={`mt-6 space-y-6 transition-opacity ${!form.enabled ? 'opacity-50' : ''}`}
            >
                <legend className="sr-only">Bookable slots</legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timezone */}
                    <div>
                        <label htmlFor={`booking-tz-${tenantId}`} className={labelClass}>Timezone</label>
                        <select
                            id={`booking-tz-${tenantId}`}
                            value={form.timezone}
                            onChange={(e) => update('timezone', e.target.value)}
                            className={inputClass}
                        >
                            {timezoneOptions.map((tz) => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                        <p className={hintClass}>Slots are shown to visitors in this timezone.</p>
                    </div>

                    {/* Call length */}
                    <div>
                        <label htmlFor={`booking-duration-${tenantId}`} className={labelClass}>Call length</label>
                        <select
                            id={`booking-duration-${tenantId}`}
                            value={form.meeting_duration}
                            onChange={(e) => update('meeting_duration', Number(e.target.value))}
                            className={inputClass}
                        >
                            {durationOptions.map((d) => (
                                <option key={d} value={d}>{d} minutes</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Working days */}
                <div>
                    <span id={`booking-days-${tenantId}`} className={labelClass}>Working days</span>
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
                                    className={`min-w-[3.25rem] px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed ${
                                        selected
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : isDark
                                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                    {daysError && (
                        <p className={fieldErrorClass}><AlertCircle size={12} /> {daysError}</p>
                    )}
                </div>

                {/* Working hours */}
                <div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor={`booking-start-${tenantId}`} className={labelClass}>Working hours start</label>
                            <input
                                id={`booking-start-${tenantId}`}
                                type="time"
                                value={form.working_hours_start}
                                onChange={(e) => update('working_hours_start', e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor={`booking-end-${tenantId}`} className={labelClass}>Working hours end</label>
                            <input
                                id={`booking-end-${tenantId}`}
                                type="time"
                                value={form.working_hours_end}
                                onChange={(e) => update('working_hours_end', e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                    </div>
                    {hoursError && (
                        <p className={fieldErrorClass}><AlertCircle size={12} /> {hoursError}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Buffer */}
                    <div>
                        <label htmlFor={`booking-buffer-${tenantId}`} className={labelClass}>Gap between calls (minutes)</label>
                        <input
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
                            className={inputClass}
                        />
                        <p className={hintClass}>Kept free before and after each booked call.</p>
                    </div>

                    {/* Booking window */}
                    <div>
                        <label htmlFor={`booking-window-${tenantId}`} className={labelClass}>Booking window (days)</label>
                        <input
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
                            className={inputClass}
                        />
                        <p className={hintClass}>How many days ahead visitors can book.</p>
                    </div>
                </div>

                {/* Live preview */}
                {form.enabled && !hoursError && (
                    slots.length > 0 ? (
                        <p className={`text-sm p-3 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            Visitors will see <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{slots.length} {slots.length === 1 ? 'slot' : 'slots'} per day</span>: {slotPreview}
                        </p>
                    ) : (
                        <p
                            role="status"
                            className={`text-sm p-3 rounded-lg border flex items-start gap-2 ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                        >
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                No slots fit: a {form.meeting_duration}-minute call doesn't fit between {formatMinutes(startMin ?? 0)} and {formatMinutes(endMin ?? 0)}. Visitors won't be able to book.
                            </span>
                        </p>
                    )
                )}
            </fieldset>

            {/* Save */}
            <div className={`mt-6 pt-5 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                {readOnly ? (
                    <p className={hintClass}>View only - your role can't change booking settings.</p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                                {saving ? (
                                    <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save size={16} className="mr-2" /> Save booking settings</>
                                )}
                            </button>
                            {isDirty && !saving && saveMessage?.type !== 'error' && (
                                <span className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Unsaved changes</span>
                            )}
                            <span aria-live="polite" className="inline-flex">
                                {saveMessage && (
                                    <span
                                        className={`inline-flex items-center gap-1.5 text-sm ${
                                            saveMessage.type === 'success'
                                                ? isDark ? 'text-green-400' : 'text-green-600'
                                                : isDark ? 'text-red-400' : 'text-red-600'
                                        }`}
                                    >
                                        {saveMessage.type === 'success' ? <CheckCircle size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                                        {saveMessage.text}
                                    </span>
                                )}
                            </span>
                        </div>
                        <p className={`${hintClass} mt-2`}>Saved separately from the rest of this page.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default InboundBookingSettingsCard;
