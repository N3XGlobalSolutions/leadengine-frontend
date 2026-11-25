import type { CallBooking } from '../services/bookingService';

/**
 * Formatting helpers for call bookings. Times are always shown in the client's calendar
 * timezone (the one the slots were generated in), never the viewer's browser timezone.
 */

const format = (iso: string, options: Intl.DateTimeFormatOptions, locale: string, timeZone?: string): string => {
    const date = new Date(iso);
    try {
        return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
    } catch {
        // Unknown timezone string - fall back to the browser's timezone rather than crashing
        return new Intl.DateTimeFormat(locale, options).format(date);
    }
};

/** "10:30 AM" */
export const formatSlotTime = (iso: string, timeZone?: string): string =>
    format(iso, { hour: 'numeric', minute: '2-digit', hour12: true }, 'en-US', timeZone);

/** "Tue, 25 Nov" */
export const formatBookingDate = (iso: string, timeZone?: string): string =>
    format(iso, { weekday: 'short', day: 'numeric', month: 'short' }, 'en-GB', timeZone);

/** "Tue, 25 Nov · 10:30 AM" */
export const formatBookingDateTime = (iso: string, timeZone?: string): string =>
    `${formatBookingDate(iso, timeZone)} · ${formatSlotTime(iso, timeZone)}`;

/** Parts for a calendar-style date chip from a plain "YYYY-MM-DD" date: { weekday: "Tue", day: "25", month: "Nov" } */
export const plainDateParts = (yyyyMmDd: string): { weekday: string; day: string; month: string } => {
    const noonUtc = `${yyyyMmDd}T12:00:00Z`; // noon avoids any day shift
    return {
        weekday: format(noonUtc, { weekday: 'short' }, 'en-GB', 'UTC'),
        day: format(noonUtc, { day: 'numeric' }, 'en-GB', 'UTC'),
        month: format(noonUtc, { month: 'short' }, 'en-GB', 'UTC'),
    };
};

// ── Visitor chat helpers ───────────────────────────────────────────

const partValue = (
    iso: string,
    options: Intl.DateTimeFormatOptions,
    type: Intl.DateTimeFormatPartTypes,
    locale: string,
    timeZone?: string
): string => {
    const date = new Date(iso);
    let parts: Intl.DateTimeFormatPart[];
    try {
        parts = new Intl.DateTimeFormat(locale, { ...options, timeZone }).formatToParts(date);
    } catch {
        parts = new Intl.DateTimeFormat(locale, options).formatToParts(date);
    }
    return parts.find((p) => p.type === type)?.value || '';
};

/** "Thu, 26 Nov" (en-GB alone drops the comma, so this is assembled from parts). */
export const formatDateShort = (iso: string, timeZone?: string): string => {
    const weekday = partValue(iso, { weekday: 'short' }, 'weekday', 'en-GB', timeZone);
    const day = partValue(iso, { day: 'numeric' }, 'day', 'en-GB', timeZone);
    const month = partValue(iso, { month: 'short' }, 'month', 'en-GB', timeZone);
    return `${weekday}, ${day} ${month}`;
};

/** "Thu, 2:30 PM" — for the picker's confirm button. */
export const formatSlotShort = (iso: string, timeZone?: string): string =>
    `${partValue(iso, { weekday: 'short' }, 'weekday', 'en-GB', timeZone)}, ${formatSlotTime(iso, timeZone)}`;

/**
 * Short timezone name: "IST" for Asia/Kolkata, "EST" for America/New_York, "GST" for Asia/Dubai.
 * en-US only knows US abbreviations (Kolkata comes out "GMT+5:30"), so other locales are tried
 * before falling back to the GMT-offset form. Empty string when no timezone is given.
 */
export const formatTimezoneAbbr = (timeZone?: string, atIso?: string): string => {
    if (!timeZone) return '';
    try {
        new Intl.DateTimeFormat('en-US', { timeZone });
    } catch {
        return timeZone; // unknown zone id: show it as-is rather than the browser's zone
    }
    const at = atIso || new Date().toISOString();
    const nameIn = (locale: string): string =>
        partValue(at, { timeZoneName: 'short' }, 'timeZoneName', locale, timeZone);
    const isOffsetForm = (name: string) => /^(GMT|UTC)[+-]/.test(name);
    const us = nameIn('en-US');
    if (us && !isOffsetForm(us)) return us;
    for (const locale of ['en-IN', 'en-GB']) {
        const name = nameIn(locale);
        if (name && !isOffsetForm(name)) return name;
    }
    return us || timeZone;
};

/** "2026-11-26" for an ISO datetime, as a calendar date in the given timezone. */
export const toPlainDateInZone = (iso: string, timeZone?: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const year = partValue(iso, options, 'year', 'en-CA', timeZone);
    const month = partValue(iso, options, 'month', 'en-CA', timeZone);
    const day = partValue(iso, options, 'day', 'en-CA', timeZone);
    return `${year}-${month}-${day}`;
};

/** Whole days from today (in the timezone) to a plain "YYYY-MM-DD" date: 0 = today, 1 = tomorrow, negative = past. */
export const daysUntil = (yyyyMmDd: string, timeZone?: string): number => {
    const toUtcDay = (plain: string) => {
        const [y, m, d] = plain.split('-').map(Number);
        return Date.UTC(y, m - 1, d);
    };
    const today = toPlainDateInZone(new Date().toISOString(), timeZone);
    return Math.round((toUtcDay(yyyyMmDd) - toUtcDay(today)) / 86_400_000);
};

/** "Today" | "Tomorrow" | "Friday" for a plain "YYYY-MM-DD" date, relative to today in the timezone. */
export const relativeDayLabel = (yyyyMmDd: string, timeZone?: string): string => {
    const days = daysUntil(yyyyMmDd, timeZone);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return format(`${yyyyMmDd}T12:00:00Z`, { weekday: 'long' }, 'en-GB', 'UTC');
};

/** The active booked call stored on a lead (lead.metadata.call_booking), or null. */
export const getCallBooking = (lead: any): CallBooking | null => {
    const booking = lead?.metadata?.call_booking;
    return booking && booking.status === 'BOOKED' && booking.start_time ? (booking as CallBooking) : null;
};
