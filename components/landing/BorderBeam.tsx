import React from 'react';
import { cn } from '../../utils/cn';

interface BorderBeamProps {
    className?: string;
    size?: number;
    duration?: number;
    delay?: number;
    colorFrom?: string;
    colorTo?: string;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
    className,
    size = 250,
    duration = 8,
    delay = 0,
    colorFrom = "#000000",
    colorTo = "#a1a1aa",
}) => {
    return (
        <div
            style={
                {
                    "--size": size,
                    "--duration": duration,
                    "--delay": `${delay}s`,
                    "--color-from": colorFrom,
                    "--color-to": colorTo,
                } as React.CSSProperties
            }
            className={cn(
                "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
                className
            )}
        >
            <div
                className="absolute aspect-square w-[calc(var(--size)*1px)] animate-border-beam [offset-path:rect(0_auto_auto_0_round_inherit)]"
                style={{
                    background: `linear-gradient(to right, var(--color-from), var(--color-to), transparent)`,
                    animationDelay: `calc(var(--delay))`,
                }}
            />
        </div>
    );
};
