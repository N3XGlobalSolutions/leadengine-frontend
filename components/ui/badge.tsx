import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'dot' | 'subtle';
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    className,
    variant = 'default',
    children,
    ...props
}) => {
    const variants = {
        default: "bg-black text-white border border-black",
        outline: "border border-zinc-300 text-zinc-700 bg-white shadow-xs",
        subtle: "bg-zinc-100 text-zinc-900 border border-zinc-200/80",
        dot: "bg-zinc-100 text-zinc-900 border border-zinc-300/80 pl-2.5 pr-3.5 py-1 shadow-xs",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                variants[variant],
                className
            )}
            {...props}
        >
            {variant === 'dot' && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                </span>
            )}
            {children}
        </div>
    );
};
