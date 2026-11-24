import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock, Globe, Loader2, X } from 'lucide-react';
import {
    bookingService,
    type BookingAvailability,
    type BookSlotResponse,
} from '../../services/bookingService';
import { formatBookingDateTime, formatSlotTime, plainDateParts } from '../../utils/bookingFormat';

interface BookingPickerProps {
    tenantId: string;
    apiKey?: string;
    conversationId: string | null;
    primaryColor: string;
    onConfirmed: (result: BookSlotResponse) => void;
    onSkip: () => void;
    onCancel: () => void;
}

const isHexColor = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

/** Translucent version of the brand color for soft backgrounds/borders. */
const withAlpha = (color: string, alpha: number): string => {
    if (isHexColor(color)) {
        let h = color.replace('#', '');
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        const num = parseInt(h, 16);
        return `rgba(${num >> 16}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }
    // Named colors (e.g. "indigo") - let the browser mix it
    return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
};

/** Visitor-friendly message from an axios error (FastAPI puts it in response.data.detail). */
const getErrorDetail = (error: any, fallback: string): string => {
    const detail = error?.response?.data?.detail;
    return typeof detail === 'string' && detail.trim() ? detail : fallback;
};

// Keyboard-only focus ring; its color comes from an inline `outlineColor` (the brand color)
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const BookingPicker: React.FC<BookingPickerProps> = ({
    tenantId,
    apiKey,
    conversationId,
    primaryColor,
    onConfirmed,
    onSkip,
    onCancel,
}) => {
    const [availability, setAvailability] = useState<BookingAvailability | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(!!conversationId);
    const [availabilityFailed, setAvailabilityFailed] = useState(false);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [bookError, setBookError] = useState<string | null>(null);

    const slotsRequestRef = useRef(0);
    const confirmRef = useRef<HTMLDivElement>(null);

    // ── Load availability on mount ────────────────────────────────────
    useEffect(() => {
        if (!conversationId) {
            // Booking needs a backend conversation - offer the "team will call you" fallback instead
            setAvailabilityLoading(false);
            return;
        }
        let cancelled = false;
        setAvailabilityLoading(true);
        setAvailabilityFailed(false);
        bookingService
            .getAvailability(tenantId, apiKey)
            .then((data) => {
                if (cancelled) return;
                setAvailability(data);
                if (data.dates && data.dates.length > 0) {
                    setSelectedDate(data.dates[0]);
                }
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Failed to load booking availability:', error);
                setAvailabilityFailed(true);
            })
            .finally(() => {
                if (!cancelled) setAvailabilityLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [tenantId, apiKey, conversationId]);

    // ── Load slots for a date (ignores stale responses) ───────────────
    const loadSlots = useCallback(
        async (date: string) => {
            const requestId = ++slotsRequestRef.current;
            setSlotsLoading(true);
            setSlotsError(null);
            setSlots([]);
            try {
                const data = await bookingService.getSlots(tenantId, date, apiKey);
                if (requestId !== slotsRequestRef.current) return;
                setSlots(data.slots || []);
            } catch (error) {
                if (requestId !== slotsRequestRef.current) return;
                console.error('Failed to load booking slots:', error);
                setSlotsError(getErrorDetail(error, "Couldn't load times for this day. Please try again."));
            } finally {
                if (requestId === slotsRequestRef.current) setSlotsLoading(false);
            }
        },
        [tenantId, apiKey]
    );

    useEffect(() => {
        if (selectedDate) loadSlots(selectedDate);
    }, [selectedDate, loadSlots]);

    // Bring the confirm button into view once a time is picked
    useEffect(() => {
        if (selectedSlot) {
            confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedSlot]);

    const handleSelectDate = (date: string) => {
        if (submitting || date === selectedDate) return;
        setSelectedSlot(null);
        setBookError(null);
        setSelectedDate(date);
    };

    const handleSelectSlot = (slot: string) => {
        if (submitting) return;
        setBookError(null);
        setSelectedSlot(slot);
    };

    const handleConfirm = async () => {
        if (!selectedSlot || !conversationId || submitting) return;
        setSubmitting(true);
        setBookError(null);
        try {
            // Pass the slot ISO string back exactly as received
            const result = await bookingService.bookSlot(tenantId, conversationId, selectedSlot, apiKey);
            onConfirmed(result);
        } catch (error: any) {
            console.error('Failed to book slot:', error);
            setBookError(getErrorDetail(error, "Sorry, we couldn't book that time. Please try again."));
            if (error?.response?.status === 409) {
                // Slot was just taken (or a call is already booked) - refresh the times
                setSelectedSlot(null);
                if (selectedDate) loadSlots(selectedDate);
            }
            setSubmitting(false);
        }
    };

    const timezone = availability?.timezone;
    const duration = availability?.meeting_duration;
    const dates = availability?.dates || [];
    const bookingUnavailable =
        !conversationId || availabilityFailed || (!availabilityLoading && availability !== null && dates.length === 0);

    const primarySoft = withAlpha(primaryColor, 0.08);

    return (
        <div
            className="w-full max-w-md min-w-0 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] p-4 sm:p-5 animate-fade-in-up"
            role="region"
            aria-label="Book a call"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-2.5 min-w-0">
                    <div
                        className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: primarySoft, color: primaryColor }}
                    >
                        <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">Pick a time for your call</h3>
                        {duration ? (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {duration}-min call
                            </p>
                        ) : null}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Close booking"
                    className={`p-1.5 -mr-1.5 -mt-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0 ${focusRing}`}
                    style={{ outlineColor: primaryColor }}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {availabilityLoading ? (
                /* Loading skeleton */
                <div aria-busy="true" aria-live="polite">
                    <span className="sr-only">Loading available dates…</span>
                    <div className="flex gap-2 mb-4 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-14 h-[68px] rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : bookingUnavailable ? (
                /* No online booking - fall back to the team calling */
                <div className="text-center py-3">
                    <p className="text-sm text-gray-600 mb-3">Online booking isn't available right now.</p>
                    <button
                        type="button"
                        onClick={onSkip}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all ${focusRing}`}
                        style={{ backgroundColor: primaryColor, outlineColor: primaryColor }}
                    >
                        Have the team call me
                    </button>
                </div>
            ) : (
                <>
                    {/* Date chips - only this row scrolls horizontally */}
                    <div
                        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 pt-1 mb-2 [scrollbar-width:thin]"
                        role="group"
                        aria-label="Choose a date"
                    >
                        {dates.map((date) => {
                            const parts = plainDateParts(date);
                            const selected = date === selectedDate;
                            return (
                                <button
                                    key={date}
                                    type="button"
                                    onClick={() => handleSelectDate(date)}
                                    aria-pressed={selected}
                                    aria-label={`${parts.weekday} ${parts.day} ${parts.month}`}
                                    disabled={submitting}
                                    className={`flex-shrink-0 w-14 py-2 rounded-xl border text-center transition-all disabled:cursor-not-allowed ${focusRing} ${
                                        selected
                                            ? 'text-white shadow-md'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                    style={{
                                        outlineColor: primaryColor,
                                        ...(selected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}),
                                    }}
                                >
                                    <span className={`block text-[10px] font-medium uppercase tracking-wide ${selected ? 'text-white/80' : 'text-gray-400'}`}>
                                        {parts.weekday}
                                    </span>
                                    <span className="block text-base font-bold leading-tight">{parts.day}</span>
                                    <span className={`block text-[10px] font-medium ${selected ? 'text-white/80' : 'text-gray-500'}`}>
                                        {parts.month}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Time slots */}
                    <div className="min-h-[84px]" aria-live="polite" aria-busy={slotsLoading}>
                        {slotsLoading ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                <span className="sr-only">Loading available times…</span>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                                ))}
                            </div>
                        ) : slotsError ? (
                            <div className="text-center py-4">
                                <p className="text-xs text-red-600 mb-2">{slotsError}</p>
                                <button
                                    type="button"
                                    onClick={() => selectedDate && loadSlots(selectedDate)}
                                    className={`text-xs font-medium underline underline-offset-2 rounded ${focusRing}`}
                                    style={{ color: primaryColor, outlineColor: primaryColor }}
                                >
                                    Try again
                                </button>
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-6">
                                No free times left on this day — try another date.
                            </p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="group" aria-label="Choose a time">
                                {slots.map((slot) => {
                                    const selected = slot === selectedSlot;
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => handleSelectSlot(slot)}
                                            aria-pressed={selected}
                                            disabled={submitting}
                                            className={`h-9 px-1 rounded-lg border text-xs font-medium whitespace-nowrap transition-all disabled:cursor-not-allowed ${focusRing} ${
                                                selected
                                                    ? 'text-white shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                            style={{
                                                outlineColor: primaryColor,
                                                ...(selected
                                                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                                                    : {}),
                                            }}
                                        >
                                            {formatSlotTime(slot, timezone)}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {timezone && (
                        <p className="mt-3 text-[11px] text-gray-400 flex items-center gap-1">
                            <Globe className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">Times shown in {timezone}</span>
                        </p>
                    )}

                    {bookError && (
                        <p className="mt-3 text-xs text-red-600" role="alert">
                            {bookError}
                        </p>
                    )}

                    {/* Confirm */}
                    {selectedSlot && (
                        <div ref={confirmRef} className="mt-4">
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={submitting}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-80 disabled:cursor-wait disabled:hover:translate-y-0 ${focusRing}`}
                                style={{ backgroundColor: primaryColor, outlineColor: primaryColor }}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                        Booking…
                                    </>
                                ) : (
                                    <span className="truncate">Confirm {formatBookingDateTime(selectedSlot, timezone)}</span>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Always-available fallback (the unavailable state already shows it as the main button) */}
            {!bookingUnavailable && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={submitting}
                        className={`text-xs text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline rounded transition-colors disabled:opacity-50 ${focusRing}`}
                        style={{ outlineColor: primaryColor }}
                    >
                        Skip — just have the team call me
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookingPicker;
