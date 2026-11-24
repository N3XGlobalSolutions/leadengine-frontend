import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'glow';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 select-none rounded-full";
        
        const variants = {
            default: "bg-black text-white hover:bg-zinc-800 active:scale-[0.98] shadow-lg shadow-black/10",
            glow: "relative bg-black text-white hover:bg-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.35)] transform hover:-translate-y-0.5 border border-black",
            outline: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 hover:border-zinc-400 shadow-sm",
            secondary: "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 hover:border-zinc-300",
            ghost: "text-zinc-600 hover:text-black hover:bg-zinc-100",
        };

        const sizes = {
            sm: "text-xs px-3.5 py-1.5 gap-1.5",
            md: "text-sm px-5 py-2.5 gap-2",
            lg: "text-base px-7 py-3.5 gap-2.5 font-semibold",
            icon: "h-10 w-10 p-0",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
