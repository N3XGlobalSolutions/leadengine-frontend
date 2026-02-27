import React from 'react';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

interface PriorityBadgeProps {
    priority: string;
    size?: 'sm' | 'md';
}

const PRIORITY_CONFIG: Record<string, {
    bg: string;
    text: string;
    icon: React.ElementType;
    dot: string;
    label: string;
}> = {
    High: {
        bg: 'bg-transparent dark:bg-emerald-900/30 border border-emerald-500 dark:border-emerald-700',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: TrendingUp,
        dot: 'bg-emerald-600',
        label: 'Hot Lead',
    },
    Medium: {
        bg: 'bg-transparent dark:bg-amber-900/30 border border-amber-500 dark:border-amber-700',
        text: 'text-amber-700 dark:text-amber-300',
        icon: Minus,
        dot: 'bg-amber-600',
        label: 'Warm Lead',
    },
    Low: {
        bg: 'bg-transparent dark:bg-rose-900/30 border border-rose-500 dark:border-rose-700',
        text: 'text-rose-700 dark:text-rose-300',
        icon: TrendingDown,
        dot: 'bg-rose-600',
        label: 'Cold Lead',
    },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
    const Icon = config.icon;

    if (size === 'sm') {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold ${config.bg} ${config.text}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};
