/**
 * DraftRecoveryModal — Shown when an unsaved draft is detected on page load.
 *
 * Offers the user two choices:
 * - Resume: Populate form with saved draft data
 * - Discard: Delete draft and start with a fresh form
 *
 * Follows the same visual style as the downgrade modal in AddClientPage.
 */

import React from 'react';
import { FileText, RotateCcw, Trash2, Clock } from 'lucide-react';

interface DraftRecoveryModalProps {
    isOpen: boolean;
    onResume: () => void;
    onDiscard: () => void;
    lastSavedAt: string;
    isDark: boolean;
}

export const DraftRecoveryModal: React.FC<DraftRecoveryModalProps> = ({
    isOpen,
    onResume,
    onDiscard,
    lastSavedAt,
    isDark,
}) => {
    if (!isOpen) return null;

    const formatTimestamp = (iso: string): string => {
        try {
            const date = new Date(iso);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'unknown';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className={`w-full max-w-md rounded-2xl shadow-2xl border ${
                    isDark
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-gray-200'
                }`}
            >
                {/* Header with icon */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isDark
                                    ? 'bg-indigo-500/20 text-indigo-400'
                                    : 'bg-indigo-50 text-indigo-600'
                            }`}
                        >
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3
                                className={`text-lg font-semibold ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}
                            >
                                Unsaved Draft Found
                            </h3>
                            <div
                                className={`flex items-center gap-1.5 text-xs mt-0.5 ${
                                    isDark ? 'text-slate-400' : 'text-gray-500'
                                }`}
                            >
                                <Clock size={12} />
                                <span>Last saved {formatTimestamp(lastSavedAt)}</span>
                            </div>
                        </div>
                    </div>

                    <p
                        className={`text-sm leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                        }`}
                    >
                        You have an unsaved draft from a previous session.
                        Would you like to resume where you left off, or start fresh?
                    </p>
                </div>

                {/* Actions */}
                <div
                    className={`flex gap-3 px-6 py-4 border-t ${
                        isDark ? 'border-slate-700' : 'border-gray-100'
                    }`}
                >
                    <button
                        onClick={onDiscard}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isDark
                                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                        <Trash2 size={16} />
                        Discard Draft
                    </button>
                    <button
                        onClick={onResume}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/25"
                    >
                        <RotateCcw size={16} />
                        Resume Draft
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DraftRecoveryModal;
