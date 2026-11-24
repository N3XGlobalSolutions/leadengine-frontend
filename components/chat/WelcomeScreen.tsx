import React from 'react';
import { ArrowRight, Bot } from 'lucide-react';
import OrbitingCirclesGlobe from '../ui/orbiting-circles-02';

interface WelcomeScreenProps {
  onStart: () => void;
  config: {
    headline: string;
    highlightedHeadline: string;
    subheadline: string;
    startBtnText: string;
    features: string[];
  };
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, config }) => {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-between min-h-[calc(100vh-90px)] w-full text-center px-4 sm:px-8 pt-4 pb-0 overflow-hidden select-none bg-white">
      
      {/* Foreground Hero Content */}
      <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto my-auto pt-4 sm:pt-6">
        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/95 backdrop-blur-xl text-xs font-bold text-slate-800 shadow-sm mb-6 sm:mb-8">
          <span className="flex items-center gap-1.5">
            <Bot size={15} className="text-indigo-600" />
            LeadEngine AI Assistant • Online
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-3 sm:mb-4">
          {config.headline}{' '}
          <span className="text-indigo-600 block sm:inline">
            {config.highlightedHeadline}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-slate-600 text-sm sm:text-lg font-medium max-w-md mx-auto leading-relaxed mb-6 sm:mb-8">
          {config.subheadline}
        </p>

        {/* Action Button */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 bg-slate-900 text-white font-extrabold text-sm sm:text-base px-8 sm:px-9 py-3.5 sm:py-4 rounded-full shadow-xl hover:bg-indigo-600 hover:scale-[1.04] active:scale-[0.98] transition-all duration-300 pointer-events-auto"
        >
          <span>{config.startBtnText}</span>
          <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
            <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs font-bold text-slate-700 flex-wrap max-w-xl mt-6 sm:mt-10">
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Orbiting Circles Globe Animation (Anchored at very bottom of screen) */}
      <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none z-0 opacity-95">
        <OrbitingCirclesGlobe />
      </div>

      {/* Ambient Soft Glow at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 w-[580px] h-[580px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none z-0" />
    </div>
  );
};

export default WelcomeScreen;