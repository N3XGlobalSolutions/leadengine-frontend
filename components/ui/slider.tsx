import React from 'react';
import { cn } from '../../utils/cn';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    valueDisplay?: string;
}

export const Slider: React.FC<SliderProps> = ({
    className,
    label,
    valueDisplay,
    min = 0,
    max = 100,
    value,
    onChange,
    ...props
}) => {
    return (
        <div className="w-full space-y-2">
            {(label || valueDisplay) && (
                <div className="flex justify-between items-center text-sm">
                    {label && <span className="font-semibold text-zinc-900">{label}</span>}
                    {valueDisplay && <span className="font-mono text-black bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-300 text-xs font-semibold">{valueDisplay}</span>}
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={onChange}
                className={cn(
                    "w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black focus:outline-none",
                    className
                )}
                {...props}
            />
        </div>
    );
};
