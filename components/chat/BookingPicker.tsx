import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock, Loader2 } from 'lucide-react';
import {
    bookingService,
    type BookingAvailability,
    type BookSlotResponse,
} from '../../services/bookingService';
import {
    daysUntil,
    formatSlotShort,
    formatSlotTime,
    formatTimezoneAbbr,
    plainDateParts,
    relativeDayLabel,
} from '../../utils/bookingFormat';
import { formatPhoneIN } from '../../utils/phone';

interface BookingPickerProps {
    tenantId: string;
    apiKey?: string;
    conversationId: string | null;
    phone?: string | null;      // 10 digits; footer "We'll call +91 98765 43210"
    onConfirmed: (result: BookSlotResponse) => void;
    onSkip: () => void;         // "Have the team call me instead"
    onMaybeLater: () => void;   // "Maybe later"
}

/** Visitor-friendly message from an axios error (FastAPI puts it in response.data.detail). */
type ApiError = { response?: { status?: number; data?: { detail?: unknown } } };

const getErrorDetail = (error: unknown, fallback: string): string => {
    const detail = (error as ApiError | undefined)?.response?.data?.detail;
    return typeof detail === 'string' && detail.trim() ? detail : fallback;
};

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-le-accent';
// Inside the horizontally scrolling date row an outside outline would be clipped, so draw it inset
const insetFocusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-le-accent';

const cellBase = 'border transition-colors disabled:cursor-not-allowed';
// Cells are only disabled while a booking is in flight (never "taken"), so no strike-through here
const cellIdle =
    'bg-white border-le-field text-le-ink enabled:hover:border-le-selected-border disabled:bg-le-disabled disabled:text-le-faint';
const cellSelected = 'bg-le-selected-bg border-le-selected-border text-le-selected-text';

const textButton = `inline-flex items-center justify-center min-h-[44px] px-2 rounded-lg text-[13px] font-medium text-le-muted hover:text-le-ink underline-offset-2 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

const SlotSkeleton: React.FC<{ count: number }> = ({ count }) => (
    <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-[38px] rounded-[10px] bg-le-disabled motion-safe:animate-pulse" />
        ))}
    </div>
);

const BookingPicker: React.FC<BookingPickerProps> = ({
    tenantId,
    apiKey,
    conversationId,
    phone,
    onConfirmed,
    onSkip,
    onMaybeLater,
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
    const confirmRef = useRef<HTMLButtonElement>(null);

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
        } catch (error) {
            console.error('Failed to book slot:', error);
            setBookError(getErrorDetail(error, "Sorry, we couldn't book that time. Please try again."));
            if ((error as ApiError | undefined)?.response?.status === 409) {
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

    const tzAbbr = formatTimezoneAbbr(timezone, selectedSlot || slots[0]);
    const phoneText = phone ? formatPhoneIN(phone) : null;
    const footerParts = [tzAbbr ? `Times in ${tzAbbr}` : null, phoneText ? `We'll call ${phoneText}` : null].filter(Boolean);

    return (
        <div
            className="flex w-full min-w-0 flex-col gap-3 rounded-[18px] border border-white/95 bg-white/80 p-[14px] shadow-le-card motion-safe:animate-fade-in-up"
            role="region"
            aria-label="Book a call"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-le-ink leading-snug">
                    <CalendarDays className="w-[18px] h-[18px] text-le-accent flex-shrink-0" strokeWidth={1.6} aria-hidden="true" />
                    Pick a slot
                </h3>
                {duration ? (
                    <span className="flex items-center gap-1 text-xs text-le-muted flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden="true" />
                        {duration} min
                    </span>
                ) : null}
            </div>

            {availabilityLoading ? (
                /* Loading skeleton */
                <div aria-busy="true" aria-live="polite">
                    <span className="sr-only">Loading available dates…</span>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-[50px] rounded-xl bg-le-disabled motion-safe:animate-pulse" />
                        ))}
                    </div>
                    <SlotSkeleton count={6} />
                </div>
            ) : bookingUnavailable ? (
                /* No online booking - fall back to the team calling */
                <div className="text-center">
                    <p className="text-sm text-le-muted mb-3">Online booking isn't available right now.</p>
                    <button
                        type="button"
                        onClick={onSkip}
                        className={`w-full h-11 flex items-center justify-center rounded-xl bg-le-btn text-le-on-btn font-medium text-sm hover:brightness-105 transition ${focusRing}`}
                    >
                        Have the team call me
                    </button>
                    <button type="button" onClick={onMaybeLater} className={`${textButton} mt-2`}>
                        Maybe later
                    </button>
                </div>
            ) : (
                <>
                    {/* Date cells: three per row, the row scrolls sideways when there are more */}
                    <div
                        className="flex gap-2 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        role="group"
                        aria-label="Choose a date"
                    >
                        {dates.map((date) => {
                            const parts = plainDateParts(date);
                            const selected = date === selectedDate;
                            // Past a week, the month says more than a repeated weekday name
                            const topLine = daysUntil(date, timezone) < 7 ? relativeDayLabel(date, timezone) : parts.month;
                            return (
                                <button
                                    key={date}
                                    type="button"
                                    onClick={() => handleSelectDate(date)}
                                    aria-pressed={selected}
                                    aria-label={`${topLine}, ${parts.weekday} ${parts.day} ${parts.month}`}
                                    disabled={submitting}
                                    className={`flex flex-shrink-0 basis-[calc((100%_-_1rem)_/_3)] snap-start flex-col items-center gap-px rounded-xl py-[7px] px-1 text-center ${cellBase} ${insetFocusRing} ${
                                        selected ? cellSelected : cellIdle
                                    }`}
                                >
                                    <span className={`block max-w-full text-[11px] leading-tight truncate ${selected ? 'text-le-link' : 'text-le-muted'}`}>
                                        {topLine}
                                    </span>
                                    <span className="block text-sm font-medium leading-[1.3]">
                                        {parts.weekday} {parts.day}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Time slots */}
                    <div className="min-h-[84px]" aria-live="polite" aria-busy={slotsLoading}>
                        {slotsLoading ? (
                            <>
                                <span className="sr-only">Loading available times…</span>
                                <SlotSkeleton count={6} />
                            </>
                        ) : slotsError ? (
                            <div className="text-center py-2">
                                <p className="text-[13px] text-le-danger mb-1">{slotsError}</p>
                                <button
                                    type="button"
                                    onClick={() => selectedDate && loadSlots(selectedDate)}
                                    className={`inline-flex items-center min-h-[44px] px-2 rounded-lg text-[13px] font-medium text-le-link underline underline-offset-2 ${focusRing}`}
                                >
                                    Try again
                                </button>
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="text-[13px] text-le-muted text-center py-6">
                                No free times left on this day — try another date.
                            </p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose a time">
                                {slots.map((slot) => {
                                    const selected = slot === selectedSlot;
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => handleSelectSlot(slot)}
                                            aria-pressed={selected}
                                            disabled={submitting}
                                            className={`h-[38px] px-1 rounded-[10px] text-[13px] whitespace-nowrap ${cellBase} ${focusRing} ${
                                                selected ? `${cellSelected} font-medium` : cellIdle
                                            }`}
                                        >
                                            {formatSlotTime(slot, timezone)}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {bookError && (
                        <p className="text-[13px] text-le-danger text-center" role="alert">
                            {bookError}
                        </p>
                    )}

                    {/* Confirm */}
                    <button
                        ref={confirmRef}
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedSlot || submitting}
                        className={`w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-le-btn text-le-on-btn font-medium text-sm transition ${
                            submitting
                                ? 'opacity-90 cursor-wait'
                                : selectedSlot
                                  ? 'hover:brightness-105'
                                  : 'opacity-50 cursor-not-allowed'
                        } ${focusRing}`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />
                                Booking…
                            </>
                        ) : selectedSlot ? (
                            <span className="truncate">Confirm {formatSlotShort(selectedSlot, timezone)}</span>
                        ) : (
                            'Choose a time'
                        )}
                    </button>

                    {footerParts.length > 0 && (
                        <p className="text-xs text-le-muted text-center">{footerParts.join(' · ')}</p>
                    )}

                    {/* Alternatives to picking a slot */}
                    <div className="pt-1 border-t border-le-field flex flex-wrap items-center justify-center gap-x-3">
                        <button type="button" onClick={onSkip} disabled={submitting} className={textButton}>
                            Have the team call me instead
                        </button>
                        <span className="text-le-faint" aria-hidden="true">·</span>
                        <button type="button" onClick={onMaybeLater} disabled={submitting} className={textButton}>
                            Maybe later
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default BookingPicker;
