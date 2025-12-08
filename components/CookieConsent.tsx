import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { getCookie, setCookie } from '../utils/cookies';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = getCookie('qbot_cookie_consent');
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookie('qbot_cookie_consent', 'true', 365); // Remember for 1 year
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Usually implies strictly necessary cookies only, but for this demo we just hide it
    // In a real app, you might disable analytics scripts here
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up">
      <div className="max-w-4xl mx-auto bg-gray-900/95 backdrop-blur text-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-800 rounded-lg text-blue-400 hidden sm:block">
             <Cookie size={24} />
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">We use cookies</h4>
            <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
              We use cookies to enhance your experience, maintain your chat session, and analyze traffic. 
              By continuing to use our bot, you agree to our use of cookies.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            onClick={handleDecline}
            className="flex-1 sm:flex-none text-xs font-medium text-gray-400 hover:text-white px-4 py-2 transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow transition-colors whitespace-nowrap"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;