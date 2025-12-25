import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { brandConfig } from '../../config';

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
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 w-full max-w-2xl mx-auto">
      <div className="mb-8 relative group cursor-pointer" onClick={onStart}>
        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full shadow-2xl flex items-center justify-center relative z-10 border-4 border-white transition-transform duration-300 group-hover:scale-105">
          {/* If we wanted an avatar here, we'd need it in the config or passed as a separate prop. 
               For now, use a default or the icon if branding isn't fully passed for this specific spot, 
               but typically config.features or similar is what we have. 
               Let's assume the user might punt on the avatar in the welcome config for now 
               or we might need to update the prop type if we want `botAvatar` here too.
               Looking at WelcomeScreenProps, it only has `config: { headline... }`.
               The previous code used `brandConfig.botAvatar`.
               Let's use a generic icon if not present, or better, let's update ChatPage to pass botAvatar too if needed.
               However, strictly following the interface defined:
           */}
          <div className="text-blue-500">
            <Sparkles size={64} />
          </div>
          <div className="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-white animate-pulse"></div>
        </div>
        {/* Decorative blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-400 rounded-full blur-3xl opacity-20 -z-10 group-hover:opacity-30 transition-opacity"></div>
        <div className="absolute top-0 right-0 w-8 h-8 text-yellow-400 animate-bounce delay-75">
          <Sparkles size={24} />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
        {config.headline} <span className="text-blue-600">{config.highlightedHeadline}</span>
      </h1>

      <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-8">
        {config.subheadline}
      </p>

      <button
        onClick={onStart}
        className="bg-gray-900 hover:bg-black text-white text-base font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 group"
      >
        <span>{config.startBtnText}</span>
        <div className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
          <MessageSquare size={18} />
        </div>
      </button>

      <div className="mt-12 flex items-center justify-center gap-6 text-xs text-gray-400 uppercase tracking-widest font-medium opacity-70 flex-wrap">
        {config.features.map((feature, index) => (
          <React.Fragment key={index}>
            <span>{feature}</span>
            {index < config.features.length - 1 && (
              <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:inline-block"></span>
            )}
          </React.Fragment>
        ))}
      </div>

      <p className="mt-16 text-[10px] text-gray-300 max-w-xs mx-auto leading-tight">
        Disclaimer: This is an AI-powered assistant. While we strive for accuracy, please verify all details with our sales representatives.
      </p>
    </div>
  );
};

export default WelcomeScreen;