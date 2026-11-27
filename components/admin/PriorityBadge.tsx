import React from 'react';
import { StatusPill, priorityTone } from './ui/kit';

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

/**
 * "High"/"Medium"/"Low" in any case → Hot / Warm / Cold Lead. "Hot…"/"Cold…" are accepted too;
 * unknown values show as Warm Lead (previous behaviour).
 */
const labelFor = (priority: string): string => {
    const p = (priority || '').trim().toLowerCase();
    if (p === 'high' || p.startsWith('hot')) return 'Hot Lead';
    if (p === 'low' || p.startsWith('cold')) return 'Cold Lead';
    return 'Warm Lead';
};

/** Design priority pill: coloured dot + "Hot Lead" (green) / "Warm Lead" (amber) / "Cold Lead" (grey). */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm', isDark = false }) => {
    const label = labelFor(priority);
    const { tone, dot } = priorityTone(label);

    return (
        <StatusPill isDark={isDark} tone={tone} dot={dot} className={size === 'sm' ? 'h-6' : 'h-7 px-3 text-[12.5px]'}>
            {label}
        </StatusPill>
    );
};
