import React, { useRef, useEffect, useState } from 'react';
import { Check, Clock, Info, AlertTriangle } from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { cn } from '../../utils/cn';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'success',
        title: 'New Client Onboarded',
        message: 'TechCorp Solutions has successfully completed onboarding.',
        time: '5 mins ago',
        read: false
    },
    {
        id: '2',
        type: 'warning',
        title: 'Subscription Expiring',
        message: 'Global trade Co. subscription expires in 3 days.',
        time: '2 hours ago',
        read: false
    },
    {
        id: '3',
        type: 'info',
        title: 'System Update',
        message: 'LeadEngine system maintenance scheduled for tonight.',
        time: '5 hours ago',
        read: true
    },
    {
        id: '4',
        type: 'success',
        title: 'Lead Goal Reached',
        message: 'You have reached 1000 total leads this month!',
        time: '1 day ago',
        read: true
    }
];

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onMarkAllRead: () => void;
    /** Element (e.g. the bell button's wrapper) whose clicks shouldn't count as "outside", so the toggle doesn't close-then-reopen. */
    anchorRef?: React.RefObject<HTMLElement | null>;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose, onMarkAllRead, anchorRef }) => {
    const { isDark } = useAdminTheme();
    const popoverRef = useRef<HTMLDivElement>(null);
    const [allRead, setAllRead] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (anchorRef?.current?.contains(target)) return;
            if (popoverRef.current && !popoverRef.current.contains(target)) {
                onClose();
            }
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen, onClose, anchorRef]);

    if (!isOpen) return null;

    const handleMarkAllRead = () => {
        setAllRead(true);
        onMarkAllRead();
    };

    const iconTone = (type: Notification['type']) => {
        if (type === 'success') return isDark ? 'bg-green-950 text-green-300 border-green-900' : 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]';
        if (type === 'warning') return isDark ? 'bg-amber-950 text-amber-300 border-amber-900' : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
        return isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-[#F2F2F2] text-[#404040] border-[#E5E5E5]';
    };

    return (
        <div
            ref={popoverRef}
            role="dialog"
            aria-label="Notifications"
            className={cn(
                'absolute right-0 top-full mt-2 w-[360px] rounded-2xl border overflow-hidden z-50 font-jakarta text-left',
                'max-sm:fixed max-sm:inset-x-4 max-sm:top-[72px] max-sm:mt-0 max-sm:w-auto',
                'shadow-[0_18px_40px_-12px_rgba(0,0,0,0.18)]',
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E5E5E5]',
            )}
        >
            <div className={cn('px-5 py-4 border-b flex justify-between items-center gap-3', isDark ? 'border-neutral-800' : 'border-[#E5E5E5]')}>
                <h3 className={cn('m-0 text-[15px] font-extrabold tracking-[-0.01em]', isDark ? 'text-white' : 'text-[#0A0A0A]')}>Notifications</h3>
                <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className={cn(
                        'text-[12.5px] font-bold underline-offset-2 hover:underline rounded focus:outline-none focus-visible:ring-[3px]',
                        isDark ? 'text-white focus-visible:ring-white/20' : 'text-[#0A0A0A] focus-visible:ring-black/10',
                    )}
                >
                    Mark all as read
                </button>
            </div>

            <ul className="m-0 p-0 list-none max-h-96 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((notif) => {
                    const unread = !notif.read && !allRead;
                    return (
                        <li
                            key={notif.id}
                            className={cn(
                                'px-5 py-4 border-b last:border-0 transition-colors',
                                isDark ? 'border-neutral-800 hover:bg-neutral-800/60' : 'border-[#EEEEEE] hover:bg-[#F7F7F7]',
                                unread && (isDark ? 'bg-neutral-800/40' : 'bg-[#FAFAFA]'),
                            )}
                        >
                            <div className="flex gap-3">
                                <div className={cn('mt-0.5 w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0', iconTone(notif.type))}>
                                    {notif.type === 'success' ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> :
                                        notif.type === 'warning' ? <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" /> :
                                            <Info size={14} strokeWidth={2.2} aria-hidden="true" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className={cn('m-0 text-[13.5px] leading-snug', unread ? 'font-extrabold' : 'font-bold', isDark ? 'text-white' : 'text-[#0A0A0A]')}>
                                            {notif.title}
                                        </h4>
                                        {unread && (
                                            <span className={cn('mt-1.5 w-[7px] h-[7px] rounded flex-none', isDark ? 'bg-white' : 'bg-[#0A0A0A]')}>
                                                <span className="sr-only">Unread</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn('m-0 mb-2 text-[12.5px] leading-[1.5]', isDark ? 'text-neutral-400' : 'text-[#525252]')}>
                                        {notif.message}
                                    </p>
                                    <div className={cn('flex items-center text-xs font-medium', isDark ? 'text-neutral-500' : 'text-[#6B6B6B]')}>
                                        <Clock size={11} className="mr-1" aria-hidden="true" />
                                        {notif.time}
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div className={cn('p-2 border-t', isDark ? 'border-neutral-800' : 'border-[#E5E5E5]')}>
                <button
                    type="button"
                    className={cn(
                        'w-full min-h-10 rounded-[10px] text-[13px] font-bold transition-colors focus:outline-none focus-visible:ring-[3px]',
                        isDark ? 'text-white hover:bg-neutral-800 focus-visible:ring-white/20' : 'text-[#0A0A0A] hover:bg-[#F2F2F2] focus-visible:ring-black/10',
                    )}
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
};
