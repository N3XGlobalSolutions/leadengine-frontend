import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, ArrowRight } from 'lucide-react';

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

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, config }) => {
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 md:px-8 py-10 w-full animate-fade-in">
      
      {/* Glassmorphic Hero Card */}
      <div className="w-full max-w-lg bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-all">
        
        {/* Subtle inner background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        
        {/* AI Readiness Indicator */}
        <div className="mb-8 relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center cursor-pointer group" onClick={onStart}>
          <div className="absolute inset-0 bg-indigo-50 rounded-full animate-pulse opacity-50 scale-110"></div>
          <div className="w-full h-full bg-white rounded-full shadow-lg flex items-center justify-center relative z-10 border border-indigo-50/50 transition-transform duration-500 group-hover:scale-105 group-hover:shadow-indigo-100/50">
            <div className="text-indigo-600 transition-colors duration-300 group-hover:text-indigo-500">
              <Sparkles size={42} strokeWidth={1.5} />
            </div>
            {/* Status dot */}
            <div className="absolute bottom-2 right-2 flex items-center justify-center">
              <div className="absolute w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white relative z-10"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight leading-tight">
          {config.headline} <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {config.highlightedHeadline}
          </span>
        </h1>

        <p className="text-slate-500 text-[15px] sm:text-base max-w-sm mx-auto leading-relaxed mb-6">
          {config.subheadline}
        </p>

        {/* Call to action */}
        <div className="relative flex flex-col items-center justify-center pt-14">
          {/* Greeting Tooltip */}
          <div className={`absolute top-0 transition-all duration-500 transform ${showGreeting ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl relative text-sm font-medium border border-slate-700">
              👋 Hi, how can I help you today?
              {/* Tooltip triangle */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45 transform"></div>
            </div>
          </div>

          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center gap-3 bg-slate-900 text-white font-medium px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-black hover:-translate-y-0.5 transition-all w-full sm:w-auto overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10">{config.startBtnText}</span>
            <div className="relative z-10 bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
              <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Feature tags */}
      <div className="mt-8 flex items-center justify-center gap-x-6 gap-y-3 text-[11px] text-slate-400 font-semibold uppercase tracking-widest flex-wrap max-w-lg">
        {config.features.map((feature, index) => (
          <React.Fragment key={index}>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span>
              {feature}
            </span>
          </React.Fragment>
        ))}
      </div>

      <p className="mt-12 text-[10px] text-slate-400/80 max-w-xs mx-auto leading-tight text-center">
        Powered by AI Assistant. Details may require verification with human experts.
      </p>
    </div>
  );
};

export default WelcomeScreen;