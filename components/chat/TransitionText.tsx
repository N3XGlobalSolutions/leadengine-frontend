import React, { useState, useEffect } from 'react';

interface TransitionTextProps {
    text: string;
    primaryColor?: string;
}

export const TransitionText: React.FC<TransitionTextProps> = ({
    text,
    primaryColor = '#4F46E5'
}) => {
    const [phase, setPhase] = useState<'dots' | 'text'>('dots');
    const [dotCount, setDotCount] = useState(1);

    useEffect(() => {
        // Animate dots for 800ms then show text
        const dotInterval = setInterval(() => {
            setDotCount(prev => (prev % 3) + 1);
        }, 250);

        const textTimer = setTimeout(() => {
            clearInterval(dotInterval);
            setPhase('text');
        }, 800);

        return () => {
            clearInterval(dotInterval);
            clearTimeout(textTimer);
        };
    }, [text]);

    return (
        <div className="flex items-start gap-2 pl-10 mb-1 animate-in fade-in duration-300">
            <div
                className="px-3 py-1.5 rounded-xl text-sm italic max-w-[80%] transition-all duration-300"
                style={{
                    color: primaryColor,
                    backgroundColor: `${primaryColor}10`,
                    borderLeft: `2px solid ${primaryColor}40`,
                }}
            >
                {phase === 'dots' ? (
                    <span className="inline-flex items-center gap-0.5">
                        <span className="text-lg leading-none">
                            {'.'.repeat(dotCount)}
                        </span>
                    </span>
                ) : (
                    <span className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {text}
                    </span>
                )}
            </div>
        </div>
    );
};
