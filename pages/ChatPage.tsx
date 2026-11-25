import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, Loader2, RotateCw, Trash2 } from 'lucide-react';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { useChatSession } from '../hooks/useChatSession';
import { MessageRole } from '../types';
import type { TenantConfig } from '../types/config';
import { getInitials } from '../utils/chatTheme';
import { getThemeStyle } from '../utils/theme/cssVars';
import ChatHeader, { type ChatMenuItem } from '../components/chat/ChatHeader';
import StepProgress from '../components/chat/StepProgress';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import ChatBubble from '../components/chat/ChatBubble';
import QuickReplies from '../components/chat/QuickReplies';
import ContactFormCard from '../components/chat/ContactFormCard';
import ProductCards from '../components/chat/ProductCards';
import TypingIndicator from '../components/chat/TypingIndicator';
import ChatInput from '../components/chat/ChatInput';
import BookingPicker from '../components/chat/BookingPicker';
import BookingSuccess from '../components/chat/BookingSuccess';
import CookieConsent from '../components/chat/CookieConsent';
import { ErrorBoundary } from '../components/ErrorBoundary';

// 'transcript' = the conversation, opened with Back from the booking confirmation
type ChatView = 'welcome' | 'chat' | 'transcript';

/** Visitor's local time of day. */
const getGreeting = (date = new Date()): string => {
    const hour = date.getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
};

const firstNameOf = (name?: string | null): string | null => {
    const first = (name || '').trim().split(/\s+/)[0];
    return first || null;
};

const ChatInterface = ({ tenantId, config }: { tenantId: string; config: TenantConfig }) => {
    const {
        messages,
        hasStarted,
        isLoading,
        isChatEnded,
        systemError,
        conversationId,
        progress,
        booking,
        contact,
        summaryData,
        handleSendMessage,
        handleQuickReply,
        handleSubmitContact,
        handleBookingConfirmed,
        handleBookingSkip,
        handleMaybeLater,
        handleFeedback,
        handleNewChat,
        handleStartNewChatWith,
        handleClearChat,
    } = useChatSession(config, tenantId);

    const [view, setView] = useState<ChatView>(() => (hasStarted ? 'chat' : 'welcome'));
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const themeVars = useMemo(
        () => getThemeStyle(config.colors?.primary, config.colors?.secondary),
        [config.colors?.primary, config.colors?.secondary]
    );
    const companyName = config.shortName || config.companyName || 'LeadEngine';
    const botName = config.botDisplayName || 'Assistant';
    const greeting = useMemo(() => getGreeting(), []);

    // A confirmed booking replaces the conversation with the confirmation screen (Back shows the transcript)
    const screen: 'welcome' | 'chat' | 'success' =
        booking && view !== 'transcript' ? 'success' : view === 'welcome' ? 'welcome' : 'chat';

    // Keep the newest message (or the typing indicator) in view
    useEffect(() => {
        if (screen === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, isLoading, screen]);

    const startFresh = (clear: boolean) => {
        if (clear) handleClearChat();
        else handleNewChat();
        setView('welcome');
    };

    const menuItems: ChatMenuItem[] = [
        { id: 'new', label: 'New chat', icon: RotateCw, onSelect: () => startFresh(false) },
        { id: 'clear', label: 'Clear chat', icon: Trash2, tone: 'danger', onSelect: () => startFresh(true) },
    ];

    const sendFromWelcome = (text: string) => {
        setView('chat');
        // A finished conversation can't take more messages, so a new message starts a new one
        if (hasStarted && isChatEnded) handleStartNewChatWith(text);
        else handleSendMessage(text);
    };

    const firstName = firstNameOf(contact.name);
    // The backend's completion message repeats every answer; the success screen shows those,
    // so the chat shows a short lead-in above the slot picker instead.
    const completionLeadIn = `Thanks${firstName ? `, ${firstName}` : ''}! Want a quick call with our team to go over the details?`;

    const lastMessage = messages[messages.length - 1];
    const isBookingCardShowing = !!(lastMessage?.role === MessageRole.Bot && lastMessage.showActions && !booking);

    // ── Connection error ────────────────────────────────────────────────
    if (systemError) {
        return (
            <div className="font-chat bg-le-page text-le-ink min-h-[100dvh]" style={themeVars}>
                <div className="mx-auto flex min-h-[100dvh] w-full max-w-[640px] flex-col">
                    <ChatHeader
                        variant="brand"
                        title={companyName}
                        initials={getInitials(companyName)}
                        statusText="AI Assistant"
                        menuItems={[]}
                    />
                    <main className="flex flex-1 items-center justify-center px-4">
                        <div className="w-full max-w-sm rounded-[18px] border border-white/95 bg-white/80 p-6 text-center shadow-le-card" role="alert">
                            <p className="text-base font-medium text-le-ink">We couldn't connect</p>
                            <p className="mt-1.5 text-sm text-le-muted">{systemError}</p>
                            <button
                                type="button"
                                onClick={() => startFresh(false)}
                                className="mt-5 h-11 w-full rounded-xl bg-le-btn text-sm font-medium text-le-on-btn transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--le-accent)]"
                            >
                                Start a new chat
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="font-chat bg-le-page text-le-ink" style={themeVars}>
            <div className="mx-auto flex h-[100dvh] w-full max-w-[640px] flex-col">
                {/* ── Welcome ─────────────────────────────────────────── */}
                {screen === 'welcome' && (
                    <>
                        <ChatHeader
                            variant="brand"
                            title={companyName}
                            initials={getInitials(companyName)}
                            statusText="AI Assistant · Online"
                            menuItems={menuItems}
                        />
                        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                            <WelcomeScreen
                                botName={botName}
                                tagline={`your ${companyName} guide`}
                                greeting={greeting}
                                headline="How can I help you today?"
                            />
                        </main>
                        <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
                            {hasStarted && !isChatEnded && messages.length > 0 && (
                                <div className="mb-3 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setView('chat')}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-le-border bg-white/85 px-3.5 text-[13px] text-le-link transition-colors hover:bg-le-selected-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--le-accent)]"
                                    >
                                        Continue your chat
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                            <ChatInput onSend={sendFromWelcome} disabled={isLoading} placeholder="Ask anything..." />
                            {config.privacyPolicyUrl && (
                                <p className="mt-3 text-center text-[11px] text-le-muted">
                                    By chatting you agree to our{' '}
                                    <a
                                        href={config.privacyPolicyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-le-link underline underline-offset-2"
                                    >
                                        Privacy Policy
                                    </a>
                                </p>
                            )}
                        </footer>
                    </>
                )}

                {/* ── Conversation ────────────────────────────────────── */}
                {screen === 'chat' && (
                    <>
                        <ChatHeader
                            variant="centered"
                            title={`${companyName} Assistant`}
                            statusText="Online"
                            onBack={() => setView(booking ? 'chat' : 'welcome')}
                            menuItems={menuItems}
                        />
                        {progress && (
                            <div className="px-5 pb-1 pt-1">
                                <StepProgress progress={progress} />
                            </div>
                        )}

                        <main
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4"
                            aria-live="polite"
                            aria-relevant="additions"
                        >
                            <div className="flex flex-col gap-5">
                                {messages.map((msg, idx) => {
                                    const isBot = msg.role === MessageRole.Bot;
                                    const isLast = idx === messages.length - 1;
                                    const canAnswer = isBot && isLast && !isLoading && !isChatEnded;

                                    const chips = isBot && !msg.showActions ? msg.quickReplies || [] : [];
                                    const showChips = chips.length > 0 && (!!msg.selectedReply || canAnswer);
                                    const showContactForm = canAnswer && msg.currentState === 'contact';
                                    const showBooking = isBot && isLast && !!msg.showActions && !booking;
                                    const textOverride = isBot && msg.showActions && msg.isSummary ? completionLeadIn : undefined;

                                    return (
                                        <ChatBubble
                                            key={msg.id}
                                            message={msg}
                                            textOverride={textOverride}
                                            onFeedback={isBot ? (type) => handleFeedback(msg.id, type) : undefined}
                                        >
                                            {isBot && msg.products && msg.products.length > 0 && (
                                                <ProductCards
                                                    tenantId={tenantId}
                                                    products={msg.products}
                                                    disabled={isLoading || isChatEnded}
                                                    onSelect={(product) => handleSendMessage(`I'm interested in ${product.title}`)}
                                                />
                                            )}
                                            {showChips && (
                                                <QuickReplies
                                                    options={chips}
                                                    selected={msg.selectedReply}
                                                    disabled={!canAnswer}
                                                    onSelect={(option) => handleQuickReply(msg.id, option)}
                                                />
                                            )}
                                            {showContactForm && (
                                                <ContactFormCard
                                                    defaultName={contact.name || undefined}
                                                    defaultPhone={contact.phone || undefined}
                                                    disabled={isLoading}
                                                    onSubmit={handleSubmitContact}
                                                />
                                            )}
                                            {showBooking && (
                                                <BookingPicker
                                                    tenantId={tenantId}
                                                    apiKey={config.apiKey}
                                                    conversationId={conversationId}
                                                    phone={contact.phone}
                                                    onConfirmed={handleBookingConfirmed}
                                                    onSkip={handleBookingSkip}
                                                    onMaybeLater={handleMaybeLater}
                                                />
                                            )}
                                        </ChatBubble>
                                    );
                                })}

                                {isLoading && <TypingIndicator botName={botName} />}
                            </div>
                            <div ref={messagesEndRef} className="h-px" />
                        </main>

                        <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
                            {!isChatEnded ? (
                                <ChatInput
                                    onSend={handleSendMessage}
                                    disabled={isLoading}
                                    placeholder="Type your reply..."
                                    autoFocus
                                />
                            ) : !isBookingCardShowing && !isLoading ? (
                                <button
                                    type="button"
                                    onClick={() => startFresh(false)}
                                    className="h-11 w-full rounded-xl border border-le-border bg-white text-sm font-medium text-le-selected-text transition-colors hover:bg-le-selected-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--le-accent)]"
                                >
                                    Start a new chat
                                </button>
                            ) : null}
                        </footer>
                    </>
                )}

                {/* ── Booking confirmed ──────────────────────────────── */}
                {screen === 'success' && booking && (
                    <>
                        <ChatHeader
                            variant="centered"
                            title={`${companyName} Assistant`}
                            statusText={null}
                            onBack={() => setView('transcript')}
                            menuItems={menuItems}
                        />
                        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                            <BookingSuccess
                                booking={booking.booking}
                                name={contact.name}
                                phone={contact.phone}
                                companyName={companyName}
                                summaryData={summaryData}
                                onStartNewChat={() => startFresh(false)}
                            />
                        </main>
                    </>
                )}
            </div>

            {hasStarted && <CookieConsent />}
        </div>
    );
};

export const ChatPage = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const { config, id, loading } = useTenantConfig(tenantId);

    if (loading) {
        return (
            <div className="font-chat flex min-h-[100dvh] items-center justify-center bg-white text-le-muted" role="status">
                <Loader2 className="h-6 w-6 motion-safe:animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading chat…</span>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="font-chat flex min-h-[100dvh] flex-col items-center justify-center gap-2 bg-white px-6 text-center">
                <h1 className="text-2xl font-medium text-le-ink">Chat not found</h1>
                <p className="text-le-muted">There's no chat at "{tenantId}". Check the link and try again.</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <ChatInterface key={id || tenantId} tenantId={id || tenantId!} config={config} />
        </ErrorBoundary>
    );
};
