import React from 'react';
import { InteractiveWaveCanvas } from './InteractiveWaveCanvas';

export const SpotlightBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-white">
            {/* Live Interactive Wave Ribbon Canvas */}
            <InteractiveWaveCanvas />

            {/* Top Light Ambient Glow */}
            <div 
                className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-amber-100/50 via-amber-50/20 to-transparent rounded-[100%] blur-[120px] opacity-90 animate-pulse-subtle"
            />
            {/* Ambient Glow Center */}
            <div 
                className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-yellow-100/30 rounded-full blur-[130px] animate-float-slow"
            />
            <div 
                className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-orange-100/30 rounded-full blur-[130px] animate-float-delayed"
            />
            {/* Dot Matrix Mask */}
            <div className="absolute inset-0 bg-dot-black opacity-30 mask-radial" />
        </div>
    );
};
