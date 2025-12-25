import React, { useMemo, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { useChatSession } from '../hooks/useChatSession';
import { MessageCircle, Send } from 'lucide-react';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import ChatBubble from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import ActionButtons from '../components/chat/ActionButtons';
import QuickReplies from '../components/chat/QuickReplies';
import CookieConsent from '../components/chat/CookieConsent';
import { ErrorBoundary } from '../components/ErrorBoundary';

const SafeColorMap: Record<string, {
    bgGradient: string;
    iconBg: string;
    loadingDot: string;
    accent: string;
}> = {
    blue: {
        bgGradient: 'from-blue-50/80 via-slate-50 to-gray-50',
        iconBg: 'bg-blue-600',
        loadingDot: 'bg-blue-500',
        accent: 'text-blue-600'
    },
    indigo: {
        bgGradient: 'from-indigo-50/80 via-slate-50 to-gray-50',
        iconBg: 'bg-indigo-600',
        loadingDot: 'bg-indigo-500',
        accent: 'text-indigo-600'
    },
    green: {
        bgGradient: 'from-green-50/80 via-slate-50 to-gray-50',
        iconBg: 'bg-green-600',
        loadingDot: 'bg-green-500',
        accent: 'text-green-600'
    },
    purple: {
        bgGradient: 'from-purple-50/80 via-slate-50 to-gray-50',
        iconBg: 'bg-purple-600',
        loadingDot: 'bg-purple-500',
        accent: 'text-purple-600'
    },
    default: {
        bgGradient: 'from-gray-50 via-slate-50 to-gray-50',
        iconBg: 'bg-gray-700',
        loadingDot: 'bg-gray-500',
        accent: 'text-gray-700'
    }
};

const ChatInterface = ({ clientSlug, config }: { clientSlug: string, config: any }) => {
    // Config is now passed down, so memo creation based on slug is removed/simplified if needed
    // But actually, we already have the config object here.

    // ... existing ChatInterface logic ...
    // Note: The original code used useMemo(()=>getTenantConfig) which returned a static object.
    // Now we pass the object.

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ... (rest of ChatInterface remains mostly same, just remove the fetch) ...

    const {
        messages,
        hasStarted,
        isLoading,
        quickReplies,
        isChatEnded,
        systemError,
        sessionId,
        handleStart,
        handleSendMessage,
        handleScheduleCall,
        handleMaybeLater,
        handleFeedback,
    } = useChatSession(config, clientSlug);

    const themeKey = config.colors.primary in SafeColorMap ? config.colors.primary : 'default';
    const themeClasses = SafeColorMap[themeKey];

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className={`min-h-screen bg-gradient-to-br ${themeClasses.bgGradient} font-sans flex flex-col`}>
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    {/* Left: Company Branding */}
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${themeClasses.iconBg} flex items-center justify-center text-white shadow-md`}>
                            <MessageCircle size={20} />
                        </div>
                        <span className="font-semibold text-gray-900 text-lg tracking-tight">
                            {config.shortName}
                        </span>
                    </div>

                    {/* Right: AI Assistant Badge */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">AI Assistant</p>
                            <p className={`text-sm font-bold ${themeClasses.accent}`}>{config.botDisplayName}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                            <img
                                src={config.botAvatar || "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"}
                                alt={config.botDisplayName}
                                className="w-6 h-6 object-contain"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6 overflow-hidden">
                {systemError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center max-w-md">
                            <p className="font-medium mb-1">Connection Error</p>
                            <p className="text-red-500">{systemError}</p>
                        </div>
                    </div>
                ) : !hasStarted ? (
                    <div className="flex-1 flex items-center justify-center py-8">
                        <WelcomeScreen
                            onStart={handleStart}
                            config={config.welcome}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden py-6">
                        {/* Session ID Badge */}
                        <div className="text-center mb-6">
                            <span className="text-xs text-gray-400 font-medium tracking-wide">
                                SESSION ID: <span className={`${themeClasses.accent} font-semibold`}>{sessionId?.slice(0, 8).toUpperCase()}</span>
                            </span>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {messages.map((msg, idx) => (
                                <div key={msg.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <ChatBubble
                                        message={msg}
                                        botAvatar={config.botAvatar}
                                        botName={config.botDisplayName}
                                        allowFeedback={true}
                                        onFeedback={(type) => handleFeedback(msg.id, type)}
                                    />

                                    {msg.showActions && !isChatEnded && (
                                        <div className="mt-3 pl-11">
                                            <ActionButtons
                                                onSchedule={handleScheduleCall}
                                                onLater={handleMaybeLater}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex items-start gap-3 animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <img
                                            src={config.botAvatar || "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"}
                                            alt={config.botDisplayName}
                                            className="w-5 h-5 object-contain"
                                        />
                                    </div>
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.loadingDot}`} style={{ animationDelay: '0ms' }} />
                                        <span className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.loadingDot}`} style={{ animationDelay: '150ms' }} />
                                        <span className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.loadingDot}`} style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-1" />
                        </div>
                    </div>
                )}
            </main>

            {/* Fixed Bottom Input Area */}
            {hasStarted && !isChatEnded && (
                <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 border-t border-gray-100 z-50">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                        {/* Quick Replies */}
                        {quickReplies.length > 0 && !isLoading && (
                            <div className="mb-3">
                                <QuickReplies
                                    options={quickReplies}
                                    onSelect={handleSendMessage}
                                />
                            </div>
                        )}

                        {/* Input Field */}
                        <div className="relative">
                            <ChatInput
                                onSend={handleSendMessage}
                                disabled={isLoading}
                                placeholder="Type your message here..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Cookie Consent */}
            <CookieConsent />
        </div>
    );
};

export const ChatPage = () => {
    const { clientSlug } = useParams<{ clientSlug: string }>();
    const { config, loading } = useTenantConfig(clientSlug);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!config) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">404 - Tenant Not Found</h1>
                <p className="text-gray-500">The client "{clientSlug}" does not exist.</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <ChatInterface key={clientSlug} clientSlug={clientSlug!} config={config} />
        </ErrorBoundary>
    );
};
