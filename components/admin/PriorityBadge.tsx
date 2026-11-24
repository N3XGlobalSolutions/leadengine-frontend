import React from 'react';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

interface PriorityBadgeProps {
    priority: string;
    size?: 'sm' | 'md';
    /**
     * Pass the page's theme. Colours are chosen from this prop instead of Tailwind `dark:` classes,
     * because the admin dark theme is applied site-wide and would otherwise leak onto light-only
     * pages (e.g. the client leads page), giving dark-on-light colours that are hard to read.
     */
    isDark?: boolean;
}

type Tone = { pill: string; dot: string };

const PRIORITY_CONFIG: Record<string, {
    light: Tone;
    dark: Tone;
    icon: React.ElementType;
    label: string;
}> = {
    High: {
        light: { pill: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
        dark: { pill: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', dot: 'bg-emerald-400' },
        icon: TrendingUp,
        label: 'Hot Lead',
    },
    Medium: {
        light: { pill: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
        dark: { pill: 'bg-amber-500/10 border-amber-500/30 text-amber-300', dot: 'bg-amber-400' },
        icon: Minus,
        label: 'Warm Lead',
    },
    Low: {
        light: { pill: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-500' },
        dark: { pill: 'bg-rose-500/10 border-rose-500/30 text-rose-300', dot: 'bg-rose-400' },
        icon: TrendingDown,
        label: 'Cold Lead',
    },
};

/** Accepts "High"/"Medium"/"Low" in any case; unknown values show as Warm Lead (previous behaviour). */
const normalise = (priority: string): string => {
    const p = (priority || '').trim().toLowerCase();
    return p ? p.charAt(0).toUpperCase() + p.slice(1) : '';
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm', isDark = false }) => {
    const config = PRIORITY_CONFIG[normalise(priority)] || PRIORITY_CONFIG.Medium;
    const tone = isDark ? config.dark : config.light;
    const Icon = config.icon;

    if (size === 'sm') {
        return (
            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full border text-xs font-medium ${tone.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tone.dot}`} />
                {config.label}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-lg border text-sm font-semibold ${tone.pill}`}>
            <Icon size={14} className="flex-shrink-0" />
            {config.label}
        </span>
    );
};
