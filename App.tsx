import React, { useEffect, useRef } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';
import ActionButtons from './components/ActionButtons';
import QuickReplies from './components/QuickReplies';
import CookieConsent from './components/CookieConsent';
import { MessageRole } from './types';
import { Building2, AlertTriangle } from 'lucide-react';
import { brandConfig } from './config';
import { useChatSession } from './hooks/useChatSession';
import { ErrorBoundary } from './components/ErrorBoundary';

function ChatApp() {
  const {
    messages,
    hasStarted,
    isLoading,
    leadData,
    quickReplies,
    isChatEnded,
    systemError,
    sessionId,
    handleStart,
    handleSendMessage,
    handleScheduleCall,
    handleMaybeLater,
    handleFeedback,
  } = useChatSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, hasStarted, isLoading, quickReplies, systemError]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.location.reload()}
            >
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Building2 size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">
                {brandConfig.shortName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  AI Assistant
                </span>
                <span className="text-sm font-bold text-indigo-600">
                  {brandConfig.botDisplayName}
                </span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border-2 border-indigo-100 shadow-sm">
                <img
                  src={brandConfig.botAvatar}
                  alt={brandConfig.botName}
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50/50">
        {/* Error Banner */}
        {systemError && (
          <div className="bg-red-50 border-b border-red-200 p-4 sticky top-0 z-50 animate-fade-in-up">
            <div className="max-w-4xl mx-auto flex items-center gap-3 text-red-700">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">System Unavailable</p>
                <p className="text-xs text-red-600 opacity-90">{systemError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto w-full custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 min-h-full flex flex-col">
            {!hasStarted && messages.length === 0 ? (
              systemError ? (
                // If error exists on load, show empty state or simple message instead of welcome screen interactive elements
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                  <AlertTriangle size={48} className="mb-4 text-red-300" />
                  <p>Service is currently offline.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center min-h-[60vh] animate-fade-in">
                  <WelcomeScreen onStart={handleStart} />
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col justify-end pb-4 space-y-6">
                <div className="text-center text-xs text-gray-400 my-4 uppercase tracking-widest font-medium">
                  Session ID:{' '}
                  <span className="font-mono text-gray-300">{sessionId.split('_')[1]}</span>
                </div>

                {messages.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <ChatBubble
                      message={msg}
                      onFeedback={(type) => handleFeedback(msg.id, type)}
                      allowFeedback={
                        msg.isSummary || (msg.role === MessageRole.Bot && !!leadData)
                      }
                    />
                    {msg.showActions && !systemError && (
                      <ActionButtons onSchedule={handleScheduleCall} onLater={handleMaybeLater} />
                    )}
                  </React.Fragment>
                ))}

                {isLoading && (
                  <div className="flex w-full justify-start animate-fade-in-up">
                    <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="w-full bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 sm:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-30">
          <div className="max-w-4xl mx-auto">
            {/* Hide Quick Replies if chat ended OR system error */}
            {!isChatEnded && !systemError && (
              <QuickReplies options={quickReplies} onSelect={handleSendMessage} />
            )}

            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading || isChatEnded || !!systemError}
              placeholder={
                systemError
                  ? 'Chat unavailable due to system error'
                  : isChatEnded
                    ? 'Conversation ended'
                    : 'Type your message here...'
              }
            />
          </div>
        </div>

        {/* Cookie Consent Banner */}
        <CookieConsent />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ChatApp />
    </ErrorBoundary>
  );
}