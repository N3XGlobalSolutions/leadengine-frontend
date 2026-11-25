import React from 'react';
import type { ChatProgress } from '../../hooks/useChatSession';

interface StepProgressProps {
    progress: ChatProgress;
    className?: string;
}

/** Segments are readable up to this many steps; beyond it a single continuous bar is clearer. */
const MAX_SEGMENTS = 8;

const StepProgress: React.FC<StepProgressProps> = ({ progress, className = '' }) => {
    const { mode, label, current, total, percent, isFinal } = progress;
    const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
    const isSteps = mode === 'steps' && total > 0;
    const useSegments = isSteps && total <= MAX_SEGMENTS;

    const valueText = isSteps
        ? isFinal
            ? `${label}, final step`
            : `${label}, step ${current} of ${total}`
        : `${label}, about ${clampedPercent}% complete`;

    const rightText = isFinal ? 'Final step' : isSteps ? `${clampedPercent}%` : `~${clampedPercent}%`;

    return (
        <div
            className={`w-full ${className}`}
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clampedPercent}
            aria-valuetext={valueText}
        >
            <div className="flex items-baseline justify-between gap-3 text-[15px] leading-snug">
                <p className="min-w-0 truncate">
                    <span className="font-semibold text-chat-ink">{label}</span>
                    {isSteps && (
                        <span className="text-chat-muted">
                            {' · '}Step {current} of {total}
                        </span>
                    )}
                </p>
                <span className="shrink-0 font-medium text-brand-ink">{rightText}</span>
            </div>

            {useSegments ? (
                <div className="mt-2.5 flex gap-2" aria-hidden="true">
                    {Array.from({ length: total }).map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                                i < current ? 'bg-brand' : 'bg-chat-line'
                            }`}
                        />
                    ))}
                </div>
            ) : (
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-chat-line" aria-hidden="true">
                    <div
                        className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
                        style={{ width: `${clampedPercent}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default StepProgress;
