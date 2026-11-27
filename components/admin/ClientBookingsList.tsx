import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, ChevronRight, Phone, RefreshCw } from 'lucide-react';
import { bookingService, TenantBooking } from '../../services/bookingService';
import { formatBookingDateTime } from '../../utils/bookingFormat';
import { cn } from '../../utils/cn';
import { Button, Card, Segmented, StatusPill, tone, type PillTone } from './ui/kit';

/**
 * Calls booked by website-chat visitors for one client.
 * Rows open the lead on the client leads page (/:tenantId/leads?leadId=...), which both
 * client admins and platform roles can open (that route isn't role-gated, and the
 * admin leads page doesn't support deep-linking to a lead).
 */

interface ClientBookingsListProps {
    tenantId: string;
    isDark: boolean;
}

type View = 'upcoming' | 'all';

const VIEW_OPTIONS: { value: View; label: string }[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'all', label: 'All' },
];

const isPastBooking = (b: TenantBooking, now: number): boolean => {
    const ref = Date.parse(b.end_time || b.start_time);
    return !Number.isNaN(ref) && ref < now;
};

const statusLabel = (status: string): string => {
    if (!status) return 'Booked';
    const s = status.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Booked (upcoming) green, cancelled red, rescheduled amber, past / anything else grey. */
const statusTone = (status: string, past: boolean): PillTone => {
    const s = (status || 'BOOKED').toUpperCase();
    if (s === 'CANCELLED' || s === 'CANCELED') return 'red';
    if (past) return 'grey';
    if (s === 'BOOKED') return 'green';
    if (s === 'RESCHEDULED') return 'amber';
    return 'grey';
};

export const ClientBookingsList: React.FC<ClientBookingsListProps> = ({ tenantId, isDark }) => {
    const navigate = useNavigate();

    const [view, setView] = useState<View>('upcoming');
    const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
    const [bookings, setBookings] = useState<TenantBooking[]>([]);
    // "now" for the past/upcoming split, captured when the list loads (keeps render pure)
    const [now, setNow] = useState(0);

    const load = useCallback(async (which: View, isCancelled: () => boolean = () => false) => {
        setStatus('loading');
        try {
            const data = await bookingService.getTenantBookings(tenantId, which === 'upcoming');
            if (isCancelled()) return;
            const list = Array.isArray(data) ? data : [];
            // API returns "all" oldest first; show newest first
            setBookings(which === 'all' ? [...list].reverse() : list);
            setNow(Date.now());
            setStatus('ready');
        } catch {
            if (isCancelled()) return;
            setStatus('error');
        }
    }, [tenantId]);

    useEffect(() => {
        let cancelled = false;
        load(view, () => cancelled);
        return () => {
            cancelled = true;
        };
    }, [load, view]);

    const openLead = (b: TenantBooking) => {
        if (!b.lead_id) return;
        navigate(`/${tenantId}/leads?leadId=${encodeURIComponent(b.lead_id)}`);
    };

    const t = tone(isDark);

    let body: React.ReactNode;
    if (status === 'loading') {
        body = (
            <div className="flex flex-col gap-2.5 animate-pulse" aria-busy="true" aria-label="Loading call bookings">
                {[0, 1, 2].map((i) => (
                    <div key={i} className={cn('h-[78px] rounded-xl', t.subtle)} />
                ))}
            </div>
        );
    } else if (status === 'error') {
        body = (
            <div
                role="alert"
                className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-xl border',
                    isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]',
                )}
            >
                <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                    <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> Couldn't load call bookings.
                </span>
                <Button isDark={isDark} variant="secondary" onClick={() => load(view)} className="min-h-[36px] px-3.5 text-[13px] shrink-0">
                    <RefreshCw size={14} aria-hidden="true" /> Retry
                </Button>
            </div>
        );
    } else if (bookings.length === 0) {
        body = (
            <p className={cn('m-0 text-sm text-center py-8 rounded-xl border border-dashed', t.muted, isDark ? 'border-neutral-700' : 'border-[#D4D4D4]')}>
                {view === 'upcoming' ? 'No upcoming calls booked yet.' : 'No calls booked yet.'}
            </p>
        );
    } else {
        body = (
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5 max-h-[28rem] overflow-y-auto pr-1">
                {bookings.map((b) => {
                    const past = isPastBooking(b, now);
                    const isBooked = (b.status || 'BOOKED').toUpperCase() === 'BOOKED';
                    const pillText = past && isBooked ? 'Past' : statusLabel(b.status);
                    const clickable = Boolean(b.lead_id);
                    const name = b.attendee_name || 'Website visitor';
                    const when = formatBookingDateTime(b.start_time, b.timezone);

                    const content = (
                        <>
                            <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                                <span
                                    className={cn('text-sm font-extrabold', t.text)}
                                    title={b.timezone ? `Time shown in ${b.timezone}` : undefined}
                                >
                                    {when}
                                </span>
                                <span className={cn('text-[13.5px] truncate', t.text)}>{name}</span>
                                {b.attendee_phone && (
                                    <span className={cn('flex items-center gap-1.5 text-[12.5px] min-w-0', t.muted)}>
                                        <Phone size={12} className="shrink-0" aria-hidden="true" />
                                        <span className="truncate">{b.attendee_phone}</span>
                                    </span>
                                )}
                            </span>
                            <StatusPill isDark={isDark} tone={statusTone(b.status, past)} className="h-6 text-[11.5px] shrink-0">
                                {pillText}
                            </StatusPill>
                            {clickable && (
                                <ChevronRight size={15} aria-hidden="true" className={cn('shrink-0', t.hint)} />
                            )}
                        </>
                    );

                    const rowBase = cn(
                        'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors',
                        past && 'opacity-60',
                        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-[#FAFAFA] border-[#E5E5E5]',
                    );

                    return (
                        <li key={b.meeting_id}>
                            {clickable ? (
                                <button
                                    type="button"
                                    onClick={() => openLead(b)}
                                    aria-label={`${when}, ${name}${b.attendee_phone ? `, ${b.attendee_phone}` : ''}, ${pillText}. Open lead`}
                                    className={cn(
                                        rowBase,
                                        'cursor-pointer focus:outline-none focus-visible:ring-[3px]',
                                        isDark
                                            ? 'hover:bg-neutral-800/70 hover:border-neutral-700 focus-visible:ring-white/25'
                                            : 'hover:bg-[#F2F2F2] hover:border-[#D4D4D4] focus-visible:ring-black/15',
                                    )}
                                >
                                    {content}
                                </button>
                            ) : (
                                <div className={rowBase}>{content}</div>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <Card isDark={isDark}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <h2 className={cn('m-0 flex items-center gap-2.5 text-[18px] font-extrabold tracking-[-0.02em]', t.text)}>
                        <Calendar size={18} strokeWidth={1.8} aria-hidden="true" /> Call Bookings
                    </h2>
                    <p className={cn('m-0 text-[13px] leading-[1.55]', t.muted)}>Calls booked by visitors in the website chat.</p>
                </div>
                <Segmented<View> isDark={isDark} ariaLabel="Show bookings" value={view} onChange={setView} options={VIEW_OPTIONS} />
            </div>
            {body}
        </Card>
    );
};

export default ClientBookingsList;
