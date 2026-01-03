import React, { useRef, useEffect } from 'react';
import { Bell, Check, Clock, Info, AlertTriangle } from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

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
        message: 'Q-Bot system maintenance scheduled for tonight.',
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
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose, onMarkAllRead }) => {
    const { isDark } = useAdminTheme();
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border overflow-hidden z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
                }`}
            style={{ top: '100%', right: '1rem' }}
        >
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                <button
                    onClick={onMarkAllRead}
                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                >
                    Mark all as read
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((notif) => (
                    <div
                        key={notif.id}
                        className={`p-4 border-b last:border-0 hover:bg-opacity-50 transition-colors ${isDark
                                ? 'border-slate-700 hover:bg-slate-700/50'
                                : 'border-gray-50 hover:bg-gray-50'
                            } ${!notif.read ? (isDark ? 'bg-slate-700/30' : 'bg-indigo-50/30') : ''}`}
                    >
                        <div className="flex gap-3">
                            <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                    notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {notif.type === 'success' ? <Check size={14} /> :
                                    notif.type === 'warning' ? <AlertTriangle size={14} /> :
                                        <Info size={14} />}
                            </div>
                            <div>
                                <h4 className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                                    {notif.title}
                                </h4>
                                <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {notif.message}
                                </p>
                                <div className="flex items-center text-xs text-gray-400">
                                    <Clock size={10} className="mr-1" />
                                    {notif.time}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`p-3 text-center border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                <button className={`text-sm font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                    View All Notifications
                </button>
            </div>
        </div>
    );
};
