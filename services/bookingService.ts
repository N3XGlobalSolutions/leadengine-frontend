import { api } from './api';

/**
 * Inbound (website chat) call-booking settings, set on the client's inbound bot Settings tab.
 * Independent of the outbound/WhatsApp calendar.
 */
export interface InboundBookingSettings {
    tenant_id?: string;
    enabled: boolean;               // false = chat skips the calendar and the team calls the visitor
    timezone: string;               // IANA, e.g. "Asia/Kolkata" (default)
    working_days: string[];         // lowercase: "monday" ... "sunday"
    working_hours_start: string;    // "HH:MM" 24h, e.g. "09:00"
    working_hours_end: string;      // "HH:MM" 24h, e.g. "18:00" (must be after start)
    meeting_duration: number;       // minutes, 5–480
    buffer: number;                 // minutes kept free before/after each booked call, 0–240
    booking_days_ahead: number;     // 1–90
}

/** Dates a website-chat visitor can book (YYYY-MM-DD, in the client's timezone). */
export interface BookingAvailability {
    enabled: boolean;          // false = online booking turned off (dates will be empty)
    timezone: string;          // IANA timezone of the client's calendar, e.g. "Asia/Kolkata"
    meeting_duration: number;  // minutes
    days_ahead: number;
    dates: string[];           // "2026-11-25", working days only
}

/** Free slots for one date. Each slot is an ISO datetime with offset, e.g. "2026-11-25T10:30:00+05:30". */
export interface BookingSlots {
    date: string;
    timezone: string;
    meeting_duration: number;
    slots: string[];
}

/** Stored on the lead as lead.metadata.call_booking */
export interface CallBooking {
    meeting_id: string;
    start_time: string;
    end_time: string;
    timezone: string;
    meet_link?: string | null;
    status: string;            // "BOOKED"
    source?: string;           // "website_chat"
    booked_at?: string;
}

export interface BookSlotResponse {
    booking: CallBooking;
    message: string;           // confirmation text to show as the bot's reply
}

/** A call booked by a website-chat visitor, as listed for the client. */
export interface TenantBooking {
    meeting_id: string;
    lead_id: string;
    conversation_id: string;
    start_time: string;
    end_time: string;
    timezone: string;
    attendee_name: string;
    attendee_phone: string;
    meet_link?: string | null;
    status: string;
    source: 'website_chat' | 'outbound' | string;
}

const widgetHeaders = (apiKey?: string) => (apiKey ? { 'X-API-Key': apiKey } : {});

export const bookingService = {
    // ── Public (chat widget) ──────────────────────────────────────────
    getAvailability: async (tenantId: string, apiKey?: string): Promise<BookingAvailability> => {
        const res = await api.get<BookingAvailability>('/chat/booking/availability', {
            params: { tenant_id: tenantId },
            headers: widgetHeaders(apiKey),
        });
        return res.data;
    },

    getSlots: async (tenantId: string, date: string, apiKey?: string): Promise<BookingSlots> => {
        const res = await api.get<BookingSlots>('/chat/booking/slots', {
            params: { tenant_id: tenantId, date },
            headers: widgetHeaders(apiKey),
        });
        return res.data;
    },

    /** Errors: 409 = slot just taken or already booked (detail has a visitor-friendly message). */
    bookSlot: async (
        tenantId: string,
        conversationId: string,
        startTime: string,
        apiKey?: string
    ): Promise<BookSlotResponse> => {
        const res = await api.post<BookSlotResponse>(
            '/chat/booking/book',
            { tenant_id: tenantId, conversation_id: conversationId, start_time: startTime },
            { headers: widgetHeaders(apiKey) }
        );
        return res.data;
    },

    // ── Authenticated (dashboard / client settings) ───────────────────
    getBookingSettings: async (tenantId: string): Promise<InboundBookingSettings> => {
        const res = await api.get<InboundBookingSettings>(`/tenants/${tenantId}/booking-settings`);
        return res.data;
    },

    /** Errors: 400 with a readable `detail` when a value is invalid (e.g. end time before start). */
    updateBookingSettings: async (
        tenantId: string,
        settings: Omit<InboundBookingSettings, 'tenant_id'>
    ): Promise<InboundBookingSettings> => {
        const res = await api.put<InboundBookingSettings>(`/tenants/${tenantId}/booking-settings`, settings);
        return res.data;
    },

    /** Upcoming bookings soonest first; with upcomingOnly=false, all bookings (past included), oldest first. */
    getTenantBookings: async (tenantId: string, upcomingOnly: boolean = true): Promise<TenantBooking[]> => {
        const res = await api.get<TenantBooking[]>(`/tenants/${tenantId}/bookings`, {
            params: { upcoming_only: upcomingOnly },
        });
        return res.data;
    },
};
