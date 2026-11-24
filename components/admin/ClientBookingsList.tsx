import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarCheck, ChevronRight, Phone, RefreshCw } from 'lucide-react';
import { bookingService, TenantBooking } from '../../services/bookingService';
import { formatBookingDateTime } from '../../utils/bookingFormat';

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

const isPastBooking = (b: TenantBooking, now: number): boolean => {
    const ref = Date.parse(b.end_time || b.start_time);
    return !Number.isNaN(ref) && ref < now;
};

const statusLabel = (status: string): string => {
    if (!status) return 'Booked';
    const s = status.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const ClientBookingsList: React.FC<ClientBookingsListProps> = ({ tenantId, isDark }) => {
    const navigate = useNavigate();

    const [view, setView] = useState<View>('upcoming');
    const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
    const [bookings, setBookings] = useState<TenantBooking[]>([]);

    const load = useCallback(async (which: View, isCancelled: () => boolean = () => false) => {
        setStatus('loading');
        try {
            const data = await bookingService.getTenantBookings(tenantId, which === 'upcoming');
            if (isCancelled()) return;
            const list = Array.isArray(data) ? data : [];
            // API returns "all" oldest first; show newest first
            setBookings(which === 'all' ? [...list].reverse() : list);
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

    const cardClass = `p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
    const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';
    const now = Date.now();

    const segmentButton = (value: View, label: string) => {
        const active = view === value;
        return (
            <button
                type="button"
                aria-pressed={active}
                onClick={() => setView(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active
                        ? isDark
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-white text-gray-900 shadow-sm'
                        : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-gray-500 hover:text-gray-900'
                }`}
            >
                {label}
            </button>
        );
    };

    let body: React.ReactNode;
    if (status === 'loading') {
        body = (
            <div className="space-y-2.5 animate-pulse" aria-busy="true" aria-label="Loading call bookings">
                {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-[68px] rounded-lg ${isDark ? 'bg-slate-700/60' : 'bg-gray-100'}`} />
                ))}
            </div>
        );
    } else if (status === 'error') {
        body = (
            <div
                role="alert"
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}
            >
                <span className="flex items-center gap-2 text-sm">
                    <AlertCircle size={16} className="shrink-0" /> Couldn't load call bookings.
                </span>
                <button
                    type="button"
                    onClick={() => load(view)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors shrink-0 ${isDark ? 'border-slate-600 bg-slate-800 text-white hover:bg-slate-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    } else if (bookings.length === 0) {
        body = (
            <p className={`text-sm text-center py-8 ${mutedText}`}>
                {view === 'upcoming' ? 'No upcoming calls booked yet.' : 'No calls booked yet.'}
            </p>
        );
    } else {
        body = (
            <ul className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
                {bookings.map((b) => {
                    const past = isPastBooking(b, now);
                    const isBooked = (b.status || 'BOOKED').toUpperCase() === 'BOOKED';
                    const pillText = past && isBooked ? 'Past' : statusLabel(b.status);
                    const pillClass = past || !isBooked
                        ? isDark
                            ? 'bg-slate-700/60 border-slate-600 text-slate-300'
                            : 'bg-gray-100 border-gray-200 text-gray-600'
                        : isDark
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700';
                    const clickable = Boolean(b.lead_id);
                    const name = b.attendee_name || 'Website visitor';
                    const when = formatBookingDateTime(b.start_time, b.timezone);

                    const content = (
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p
                                    className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                                    title={b.timezone ? `Time shown in ${b.timezone}` : undefined}
                                >
                                    {when}
                                </p>
                                <p className={`text-sm font-medium truncate mt-0.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                    {name}
                                </p>
                                {b.attendee_phone && (
                                    <p className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${mutedText}`}>
                                        <Phone size={12} className="shrink-0" aria-hidden="true" />
                                        <span className="truncate">{b.attendee_phone}</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${pillClass}`}>
                                    {pillText}
                                </span>
                                {clickable && (
                                    <ChevronRight size={16} aria-hidden="true" className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                                )}
                            </div>
                        </div>
                    );

                    const rowBase = `w-full text-left p-3 rounded-lg border transition-colors ${past ? 'opacity-60' : ''} ${
                        isDark ? 'bg-slate-900/40 border-slate-700' : 'bg-gray-50 border-gray-100'
                    }`;

                    return (
                        <li key={b.meeting_id}>
                            {clickable ? (
                                <button
                                    type="button"
                                    onClick={() => openLead(b)}
                                    aria-label={`${when}, ${name}${b.attendee_phone ? `, ${b.attendee_phone}` : ''}, ${pillText}. Open lead`}
                                    className={`${rowBase} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                        isDark ? 'hover:bg-slate-700/60 hover:border-slate-600' : 'hover:bg-indigo-50/60 hover:border-indigo-200'
                                    }`}
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
        <div className={cardClass}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <CalendarCheck size={20} /> Call Bookings
                    </h2>
                    <p className={`text-sm mt-1 ${mutedText}`}>Calls booked by visitors in the website chat.</p>
                </div>
                <div
                    role="group"
                    aria-label="Show bookings"
                    className={`inline-flex self-start p-1 rounded-lg border shrink-0 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-100 border-gray-200'}`}
                >
                    {segmentButton('upcoming', 'Upcoming')}
                    {segmentButton('all', 'All')}
                </div>
            </div>
            {body}
        </div>
    );
};

export default ClientBookingsList;
