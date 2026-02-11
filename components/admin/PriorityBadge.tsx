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
}> = {
    High: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: TrendingUp,
        dot: 'bg-emerald-500',
    },
    Medium: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        icon: Minus,
        dot: 'bg-amber-500',
    },
    Low: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        icon: TrendingDown,
        dot: 'bg-red-500',
    },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
    const Icon = config.icon;

    if (size === 'sm') {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {priority}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold ${config.bg} ${config.text}`}>
            <Icon size={14} />
            {priority} Priority
        </span>
    );
};
