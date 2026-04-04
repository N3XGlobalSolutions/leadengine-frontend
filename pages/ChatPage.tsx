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

// Utility to check if a color is a hex code
const isHexColor = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

// Utility to darken a hex color (for gradients/hover states)
const adjustColor = (hex: string, percent: number): string => {
    if (!isHexColor(hex)) return hex;
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
};

// Create a lighter version of a color for backgrounds
const lightenColor = (hex: string): string => adjustColor(hex, 80);

// Generate theme styles from primary color (either hex or named)
const getThemeStyles = (primaryColor: string, secondaryColor: string) => {
    const isHex = isHexColor(primaryColor);

        if (isHex) {
        // We will tone it down aggressively for the glass outer background
        return {
            bgGradientStyle: {
                background: `radial-gradient(circle at top left, ${lightenColor(primaryColor)}33, transparent 40%),
                             radial-gradient(circle at bottom right, ${primaryColor}22, transparent 40%),
                             #f8fafc`
            },
            iconBgStyle: { backgroundColor: primaryColor },
            loadingDotStyle: { backgroundColor: primaryColor },
            accentStyle: { color: primaryColor },
            progressBarStyle: {
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor || adjustColor(primaryColor, -20)})`
            },
            // Fallback classes (won't be used when isHex is true)
            bgGradient: '',
            iconBg: '',
            loadingDot: '',
            accent: '',
            isCustom: true
        };
    }

    // Fallback to named color classes
    const colorMap: Record<string, { bgGradient: string; iconBg: string; loadingDot: string; accent: string }> = {
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
        }
    };

    const theme = colorMap[primaryColor] || colorMap['indigo'];
    return {
        ...theme,
        bgGradientStyle: {},
        iconBgStyle: {},
        loadingDotStyle: {},
        accentStyle: {},
        progressBarStyle: {},
        isCustom: false
    };
};

const ChatInterface = ({ tenantId, config }: { tenantId: string, config: any }) => {
    // Config is now passed down.

    // ... existing ChatInterface logic ...

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        hasStarted,
        isLoading,
        quickReplies,
        isChatEnded,
        systemError,
        sessionId,
        questionProgress,  // ⭐ NEW: Get progress tracking
        handleStart,
        handleSendMessage,
        handleScheduleCall,
        handleMaybeLater,
        handleFeedback,
    } = useChatSession(config, tenantId);

    const themeStyles = useMemo(() => getThemeStyles(
        config.colors?.primary || '#4F46E5',
        config.colors?.secondary || '#6366F1'
    ), [config.colors?.primary, config.colors?.secondary]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div
            className={`min-h-[100dvh] font-sans flex flex-col ${!themeStyles.isCustom ? `bg-gradient-to-br ${themeStyles.bgGradient}` : ''}`}
            style={themeStyles.isCustom ? themeStyles.bgGradientStyle : undefined}
        >
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-100 shadow-sm relative">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                        {/* Left: Company Branding */}
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${!themeStyles.isCustom ? themeStyles.iconBg : ''}`}
                                style={themeStyles.isCustom ? themeStyles.iconBgStyle : undefined}
                            >
                                <MessageCircle size={20} strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-gray-800 text-lg tracking-tight">
                                {config.shortName}
                            </span>
                        </div>

                        {/* Right: AI Assistant Badge */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">AI Assistant</p>
                                <p
                                    className={`text-sm font-bold ${!themeStyles.isCustom ? themeStyles.accent : ''}`}
                                    style={themeStyles.isCustom ? themeStyles.accentStyle : undefined}
                                >{config.botDisplayName}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
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
                                SESSION ID: {' '}
                                <span className={`font-semibold ${!themeStyles.isCustom ? themeStyles.accent : ''}`} style={themeStyles.isCustom ? themeStyles.accentStyle : undefined}>
                                    {sessionId?.slice(0, 8).toUpperCase()}
                                </span>
                            </span>
                        </div>

                        {/* ⭐ Progress Indicator */}
                        {/* S3 Max: Dynamic estimated progress (no fixed total) */}
                        {questionProgress.estimatedProgress !== null && !isChatEnded && questionProgress.estimatedProgress > 0 && (
                            <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Qualification Progress
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Estimated ~{Math.round(questionProgress.estimatedProgress * 100)}% Complete
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full transition-all duration-700 ease-out"
                                        style={{
                                            width: `${Math.min(questionProgress.estimatedProgress * 100, 100)}%`,
                                            ...themeStyles.progressBarStyle
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        {/* S1/S2/S3: Step-based progress (has fixed total) */}
                        {questionProgress.estimatedProgress === null && questionProgress.total > 0 && !isChatEnded && questionProgress.current > 0 && (
                            <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Question {questionProgress.current} of {questionProgress.total}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {Math.round((questionProgress.current / questionProgress.total) * 100)}% Complete
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${(questionProgress.current / questionProgress.total) * 100}%`,
                                            ...themeStyles.progressBarStyle
                                        }}
                                    />
                                </div>
                            </div>
                        )}

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

                                    {msg.showActions && idx === messages.length - 1 && (
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
                                        <span
                                            className={`w-2 h-2 rounded-full animate-bounce ${!themeStyles.isCustom ? themeStyles.loadingDot : ''}`}
                                            style={{ animationDelay: '0ms', ...(themeStyles.isCustom ? themeStyles.loadingDotStyle : {}) }}
                                        />
                                        <span
                                            className={`w-2 h-2 rounded-full animate-bounce ${!themeStyles.isCustom ? themeStyles.loadingDot : ''}`}
                                            style={{ animationDelay: '150ms', ...(themeStyles.isCustom ? themeStyles.loadingDotStyle : {}) }}
                                        />
                                        <span
                                            className={`w-2 h-2 rounded-full animate-bounce ${!themeStyles.isCustom ? themeStyles.loadingDot : ''}`}
                                            style={{ animationDelay: '300ms', ...(themeStyles.isCustom ? themeStyles.loadingDotStyle : {}) }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-1" />
                        </div>
                    </div>
                )
                }
            </main >

            {/* Fixed Bottom Input Area */}
            {
                hasStarted && !isChatEnded && (
                    <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/90 pb-4 pt-2 z-50">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                            {/* Quick Replies */}
                            {quickReplies.length > 0 && !isLoading && (
                                <div className="mb-3">
                                    <QuickReplies
                                        options={quickReplies}
                                        onSelect={handleSendMessage}
                                        primaryColor={config.colors?.primary}
                                        secondaryColor={config.colors?.secondary}
                                    />
                                </div>
                            )}

                            {/* Input Field */}
                            <div className="relative">
                                <ChatInput
                                    onSend={handleSendMessage}
                                    disabled={isLoading}
                                    placeholder="Type your message here..."
                                    primaryColor={config.colors?.primary}
                                    secondaryColor={config.colors?.secondary}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Cookie Consent */}
            {hasStarted && <CookieConsent />}
        </div>
    );
};

export const ChatPage = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const { config, id, loading } = useTenantConfig(tenantId);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!config) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">404 - Tenant Not Found</h1>
                <p className="text-gray-500">The tenant "{tenantId}" does not exist.</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <ChatInterface key={id || tenantId} tenantId={id || tenantId!} config={config} />
        </ErrorBoundary>
    );
};
