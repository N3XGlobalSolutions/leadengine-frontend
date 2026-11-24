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

/** The active booked call stored on a lead (lead.metadata.call_booking), or null. */
export const getCallBooking = (lead: any): CallBooking | null => {
    const booking = lead?.metadata?.call_booking;
    return booking && booking.status === 'BOOKED' && booking.start_time ? (booking as CallBooking) : null;
};
