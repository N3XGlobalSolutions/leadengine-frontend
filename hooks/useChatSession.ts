import { useState, useEffect, useCallback, useMemo } from 'react';
import { Message, MessageRole, SummaryData, type ChatProductCard, type ChatResponse } from '../types';
import { chatService } from '../services/chatService';
import type { BookSlotResponse } from '../services/bookingService';
import { formatBookingDateTime } from '../utils/bookingFormat';
import { formatPhoneIN, normalizePhoneIN } from '../utils/phone';

import { TenantConfig } from '../types/config';
import { getCookie, setCookie } from '../utils/cookies';

const generateSessionId = () => {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

// Storage keys
const getStorageKey = (sessionId: string, key: string) => `qbot_${sessionId}_${key}`;
const getSessionCookieName = (clientSlug: string) => `qbot_session_${clientSlug}`;
const SESSION_EXPIRY_HOURS = 24;

interface QuestionProgress {
    current: number;
    total: number;
    currentStepId: string | null;     // backend current_state of the latest reply
    estimatedProgress: number | null; // S3 Max: 0.0 - 1.0
}

/** What the progress row above the messages shows. */
export interface ChatProgress {
    mode: 'steps' | 'estimate'; // steps: "Step 2 of 5" + segments; estimate (S3 Max): single bar
    label: string;              // "About you", "Budget", "Book a call"
    current: number;            // 1-based step (steps mode; 0 in estimate mode)
    total: number;              // number of steps (steps mode; 0 in estimate mode)
    percent: number;            // 0-100
    isFinal: boolean;           // the booking step: show "Final step" instead of a percentage
}

/** Visitor's name and phone, from the contact form or the backend's lead summary. */
export interface ContactDetails {
    name: string | null;
    phone: string | null; // 10 digits, no country code
}

interface PersistedChatState {
    messages: Message[];
    hasStarted: boolean;
    isChatEnded: boolean;
    leadData: SummaryData | null;
    createdAt: number; // Timestamp when session was created
    conversationId: string | null; // Backend Conversation ID
    contact?: ContactDetails;
    questionProgress?: QuestionProgress;
}

const saveChatState = (sessionId: string, state: PersistedChatState) => {
    try {
        localStorage.setItem(getStorageKey(sessionId, 'chat'), JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save chat state:', e);
    }
};

const loadChatState = (sessionId: string): PersistedChatState | null => {
    try {
        const stored = localStorage.getItem(getStorageKey(sessionId, 'chat'));
        if (stored) {
            const parsed = JSON.parse(stored);

            // Check if session has expired (24 hours)
            const now = Date.now();
            const sessionAge = now - (parsed.createdAt || 0);
            const expiryMs = SESSION_EXPIRY_HOURS * 60 * 60 * 1000;

            if (sessionAge > expiryMs) {
                console.log('Session expired after 24 hours, clearing...');
                clearChatState(sessionId);
                return null;
            }

            // Check if chat has ended - don't restore ended sessions
            if (parsed.isChatEnded) {
                console.log('Previous session ended, clearing for fresh start...');
                clearChatState(sessionId);
                return null;
            }

            // Convert timestamp strings back to Date objects
            if (parsed.messages) {
                parsed.messages = parsed.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
            }
            return parsed;
        }
    } catch (e) {
        console.error('Failed to load chat state:', e);
    }
    return null;
};

const clearChatState = (sessionId: string) => {
    try {
        localStorage.removeItem(getStorageKey(sessionId, 'chat'));
    } catch (e) {
        console.error('Failed to clear chat state:', e);
    }
};

const EMPTY_CONTACT: ContactDetails = { name: null, phone: null };

/** Backend product cards (snake_case) → message cards; undefined when there are none. */
const toProductCards = (products: ChatResponse['products']): ChatProductCard[] | undefined => {
    const cards = (products || [])
        .filter((p) => p && typeof p.title === 'string' && p.title.trim() && typeof p.product_id === 'string')
        .map((p) => ({
            productId: p.product_id,
            title: p.title.trim(),
            description: (p.description || '').trim(),
            imageId: p.image_id || null,
        }));
    return cards.length > 0 ? cards : undefined;
};

/** Backend question labels default to "Question"/"Q1"; those make poor progress labels. */
const isGenericStepLabel = (label?: string) =>
    !label || /^(question|q)\s*\d*$/i.test(label.trim()) || label.trim().length > 28;

/** Case-insensitive summary lookup; values may be plain strings or { label, answer } objects. */
const pickSummaryValue = (data: SummaryData | null, key: string): string | null => {
    if (!data) return null;
    const match = Object.keys(data).find((k) => k.toLowerCase() === key);
    if (!match) return null;
    const value = data[match];
    if (typeof value === 'string') return value.trim() || null;
    const answer = value && typeof value === 'object' ? (value as { answer?: unknown }).answer : undefined;
    return typeof answer === 'string' ? answer.trim() || null : null;
};

export const useChatSession = (config: TenantConfig, clientSlug: string) => {
    const [sessionId, setSessionId] = useState(() => {
        const cookieName = getSessionCookieName(clientSlug);
        const existingSession = getCookie(cookieName);
        if (existingSession) {
            console.log('Resuming existing session:', existingSession);
            return existingSession;
        }
        const newSession = generateSessionId();
        setCookie(cookieName, newSession, 7);
        return newSession;
    });

    // Load persisted state on init
    const [persistedState] = useState(() => loadChatState(sessionId));

    const initialQuestionProgress = (): QuestionProgress => ({
        current: 0,
        total: config?.leadQualification?.questions?.length || 0,
        currentStepId: null,
        estimatedProgress: null,
    });

    const [messages, setMessages] = useState<Message[]>(persistedState?.messages || []);
    const [hasStarted, setHasStarted] = useState(persistedState?.hasStarted || false);
    const [isLoading, setIsLoading] = useState(false);
    const [leadData, setLeadData] = useState<SummaryData | null>(persistedState?.leadData || null);
    const [isChatEnded, setIsChatEnded] = useState(persistedState?.isChatEnded || false);
    const [systemError, setSystemError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(persistedState?.conversationId || null);
    const [contact, setContact] = useState<ContactDetails>(persistedState?.contact || EMPTY_CONTACT);
    // Set once the visitor books a call slot; the page then shows the confirmation screen. Not persisted.
    const [booking, setBooking] = useState<BookSlotResponse | null>(null);
    const [questionProgress, setQuestionProgress] = useState<QuestionProgress>(
        () => persistedState?.questionProgress || initialQuestionProgress()
    );

    // Track when the session was created (for 24h expiry)
    const [sessionCreatedAt, setSessionCreatedAt] = useState(() => persistedState?.createdAt || Date.now());

    // Save state whenever it changes
    useEffect(() => {
        if (hasStarted) {
            saveChatState(sessionId, {
                messages,
                hasStarted,
                isChatEnded,
                leadData,
                createdAt: sessionCreatedAt,
                conversationId,
                contact,
                questionProgress,
            });
        }
    }, [messages, hasStarted, isChatEnded, leadData, sessionId, sessionCreatedAt, conversationId, contact, questionProgress]);

    // Keep the total in sync with the loaded config
    useEffect(() => {
        if (config?.leadQualification?.questions) {
            setQuestionProgress(prev => ({
                ...prev,
                total: prev.total || config.leadQualification.questions.length
            }));
        }
    }, [config]);

    const addMessage = useCallback(
        (role: MessageRole, text: string, options?: Partial<Message>) => {
            const newMessage: Message = {
                id: Date.now().toString() + Math.random().toString(),
                role,
                text,
                timestamp: new Date(),
                ...options,
            };
            setMessages((prev) => [...prev, newMessage]);
            return newMessage;
        },
        []
    );

    const determineQuickReplies = (text: string, currentStepId: string | null): string[] => {
        // Try to match based on current step first (context-aware)
        if (currentStepId && config.leadQualification?.questions) {
            const currentStep = config.leadQualification.questions.find(
                q => q.id === currentStepId
            );

            // Support both direct options (new config) and optionsKey (legacy config)
            if (currentStep) {
                if (currentStep.options && currentStep.options.length > 0) {
                    return currentStep.options;
                }
                if (currentStep.optionsKey) {
                    const options = config.leadQualification.options?.[currentStep.optionsKey as keyof typeof config.leadQualification.options];
                    if (options && options.length > 0) {
                        return options;
                    }
                }
            }
        }

        // Fallback to keyword matching (existing logic)
        const lowerText = text.toLowerCase();
        if (!config.leadQualification?.options) return [];

        if (lowerText.includes('location') || lowerText.includes('area') || lowerText.includes('where')) {
            return config.leadQualification.options?.locations || [];
        }
        if (lowerText.includes('budget') || lowerText.includes('price range')) {
            return config.leadQualification.options?.budgets || [];
        }
        if (lowerText.includes('type') || lowerText.includes('bhk') || lowerText.includes('configuration')) {
            return config.leadQualification.options?.types || [];
        }
        if (lowerText.includes('move-in') || lowerText.includes('timeline') || lowerText.includes('possession')) {
            return config.leadQualification.options?.moveIn || [];
        }
        if (lowerText.includes('loan') || lowerText.includes('financing') || lowerText.includes('funding')) {
            return config.leadQualification.options?.financing || [];
        }
        return [];
    };

    const handleBotResponse = async (userMessageText: string, opts?: { fresh?: boolean }) => {
        if (systemError) return;

        // `fresh` = first message of a brand-new conversation (state from this render is stale)
        const convId = opts?.fresh ? null : conversationId;

        setIsLoading(true);

        try {
            const response = await chatService.sendMessage({
                query: userMessageText,
                tenant_id: clientSlug,
                conversation_id: convId,
                user_identifier: sessionId // Using sessionId as a temporary user identifier
            }, config.apiKey);

            setIsLoading(false);

            // Update Conversation ID if new
            if (response.conversation_id && !convId) {
                setConversationId(response.conversation_id);
            }

            let botText = response.answer;

            // Clean any [STEP:...] tags from the text (legacy cleanup)
            botText = botText.replace(/\[STEP:\w+\]/g, '').trim();

            // S2: Strip conversational_transition from answer to avoid duplication
            const transition = response.conversational_transition || undefined;
            if (transition && botText.startsWith(transition)) {
                botText = botText.slice(transition.length).trim();
            }

            // S2/S3: Detect soft-disqualify state
            const isSoftDQ = response.current_state === 's2_soft_dq' || response.current_state === 's3_soft_dq';

            // TRUST ONLY response.show_actions from the backend.
            // DO NOT fallback to current_state === 'completed' — that would cause
            // every post-completion message (Maybe Later reply, etc.) to show the booking card again.
            const isFirstCompletion = response.show_actions === true;
            // 'chat_ended' is sent by S3 Mapping and S3 Max for all terminal states
            // 'lead_captured' is sent by S1/S2/S3 shared flow
            const isTerminalAction =
                response.suggested_actions?.includes('lead_captured') ||
                response.suggested_actions?.includes('chat_ended');

            // S3_MAX: agentic flow doesn't handle button responses — suppress the booking card entirely
            const isS3Max = config.plan === 'S3_MAX';
            const shouldShowActions = isFirstCompletion && !isSoftDQ && !isS3Max;

            const isSummary = response.summary_data != null && isFirstCompletion;
            const summaryData = response.summary_data || null;
            if (summaryData && isFirstCompletion) {
                setLeadData(summaryData);
            }

            // Update progress from backend
            if (response.estimated_progress !== undefined && response.estimated_progress !== null) {
                // S3 Max: Use dynamic estimated progress (0.0 - 1.0)
                setQuestionProgress(prev => ({
                    ...prev,
                    current: response.current_step_index || prev.current,
                    estimatedProgress: response.estimated_progress!,
                    currentStepId: response.current_state || prev.currentStepId,
                }));
            } else if (response.total_steps !== undefined && response.total_steps > 0) {
                // S1/S2/S3: Use step-based progress
                setQuestionProgress(prev => ({
                    ...prev,
                    current: (response.current_step_index || 0) + 1,
                    total: response.total_steps || prev.total,
                    currentStepId: response.current_state || prev.currentStepId
                }));
            } else if (response.current_state) {
                setQuestionProgress(prev => ({ ...prev, currentStepId: response.current_state! }));
            }

            // Quick replies from backend if provided, otherwise keyword matching
            const replies = response.quick_replies && response.quick_replies.length > 0
                ? response.quick_replies
                : determineQuickReplies(response.answer, response.current_state || '');

            addMessage(MessageRole.Bot, botText, {
                showActions: shouldShowActions,
                isSummary: isSummary,
                summaryData: summaryData,
                conversationalTransition: transition,
                isSoftDQ: isSoftDQ,
                products: toProductCards(response.products),
                currentState: response.current_state || undefined,
                quickReplies: replies.length > 0 ? replies : undefined,
            });

            // End chat input ONLY on first completion or terminal actions (schedule/later)
            if (isFirstCompletion || isTerminalAction) {
                setIsChatEnded(true);
            }

        } catch (error: any) {
            console.error("Chat Error:", error);

            // Handle 404 (Conversation Not Found) - likely stale session ID
            if (error.response?.status === 404 && convId) {
                console.warn("Conversation not found (404), starting new session...");
                setConversationId(null);

                try {
                    // Retry as new conversation
                    const retryResponse = await chatService.sendMessage({
                        query: userMessageText,
                        tenant_id: clientSlug,
                        conversation_id: null, // Force new
                        user_identifier: sessionId
                    }, config.apiKey);

                    setIsLoading(false);
                    if (retryResponse.conversation_id) {
                        setConversationId(retryResponse.conversation_id);
                    }

                    const replies = retryResponse.quick_replies && retryResponse.quick_replies.length > 0
                        ? retryResponse.quick_replies
                        : determineQuickReplies(retryResponse.answer, questionProgress.currentStepId);
                    addMessage(MessageRole.Bot, retryResponse.answer, {
                        products: toProductCards(retryResponse.products),
                        currentState: retryResponse.current_state || undefined,
                        quickReplies: replies.length > 0 ? replies : undefined,
                    });
                    return;

                } catch (retryError) {
                    console.error("Retry failed:", retryError);
                    setSystemError('Failed to start a new conversation.');
                }
            } else {
                setSystemError(error.response?.data?.detail || 'Failed to connect to the chat server.');
            }

            setIsLoading(false);
            if (!convId || error.response?.status !== 404) {
                addMessage(MessageRole.Bot, "I'm having trouble connecting right now. Please try again later.");
            }
        }
    };

    /** Visitor typed a message (welcome screen or chat input). */
    const handleSendMessage = async (text: string) => {
        if (systemError || !text.trim()) return;
        if (!hasStarted) {
            setHasStarted(true);
        }
        addMessage(MessageRole.User, text.trim());
        await handleBotResponse(text.trim());
    };

    /** Visitor tapped a chip under a bot message: the chip shows as checked instead of a user bubble. */
    const handleQuickReply = async (messageId: string, option: string) => {
        if (systemError || isLoading) return;
        setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, selectedReply: option } : msg))
        );
        await handleBotResponse(option);
    };

    /**
     * Contact form card. The backend parses "Name, 9876543210" (name before a 10-digit Indian
     * mobile), so that is what is sent; the bubble shows a friendlier "Name · +91 98765 43210".
     */
    const handleSubmitContact = async (name: string, phone: string) => {
        if (systemError || isLoading) return;
        const cleanName = name.trim().replace(/\s+/g, ' ');
        const digits = normalizePhoneIN(phone);
        setContact({ name: cleanName, phone: digits });
        addMessage(MessageRole.User, `${cleanName} · ${formatPhoneIN(digits)}`);
        await handleBotResponse(`${cleanName}, ${digits}`);
    };

    // Picker booked a slot: record the choice + the backend's confirmation text, then show the success screen
    const handleBookingConfirmed = (result: BookSlotResponse) => {
        const when = formatBookingDateTime(result.booking.start_time, result.booking.timezone);
        addMessage(MessageRole.User, `Book a call on ${when}`);
        addMessage(MessageRole.Bot, result.message);
        setBooking(result);
        setIsChatEnded(true);
    };

    // Fallback (no slots / visitor prefers a callback): the original "team will call you" flow
    const handleBookingSkip = async () => {
        addMessage(MessageRole.User, 'Please have the team call me.');
        await handleBotResponse('Yes, schedule a call');
        setIsChatEnded(true);
    };

    const handleMaybeLater = async () => {
        addMessage(MessageRole.User, 'Maybe later.');
        await handleBotResponse('Maybe later');
        setIsChatEnded(true);
    };

    const handleFeedback = (messageId: string, feedbackType: 'up' | 'down') => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === messageId
                    ? { ...msg, feedback: msg.feedback === feedbackType ? undefined : feedbackType }
                    : msg
            )
        );
        // No feedback API on the backend yet - kept locally only
    };

    const resetConversation = () => {
        setMessages([]);
        setConversationId(null);
        setHasStarted(false);
        setIsChatEnded(false);
        setIsLoading(false);
        setLeadData(null);
        setContact(EMPTY_CONTACT);
        setBooking(null);
        setSystemError(null);
        setQuestionProgress(initialQuestionProgress());
        setSessionCreatedAt(Date.now());
    };

    /** Menu "New chat" / "Start a new chat": fresh conversation, same visitor session. */
    const handleNewChat = () => {
        clearChatState(sessionId);
        resetConversation();
    };

    /** Send `text` as the first message of a brand-new conversation (welcome screen after a finished chat). */
    const handleStartNewChatWith = async (text: string) => {
        if (!text.trim()) return;
        clearChatState(sessionId);
        resetConversation();
        setHasStarted(true);
        addMessage(MessageRole.User, text.trim());
        await handleBotResponse(text.trim(), { fresh: true });
    };

    /** Menu "Clear chat": wipe the stored transcript and start over as a brand-new visitor session. */
    const handleClearChat = () => {
        clearChatState(sessionId);
        const newSession = generateSessionId();
        setCookie(getSessionCookieName(clientSlug), newSession, 7);
        setSessionId(newSession);
        resetConversation();
    };

    const lastBotMessage = useMemo(
        () => [...messages].reverse().find((m) => m.role === MessageRole.Bot) || null,
        [messages]
    );

    const progress = useMemo<ChatProgress | null>(() => {
        if (!hasStarted) return null;
        const { current, total, estimatedProgress, currentStepId } = questionProgress;

        // Booking step: the completion message is showing the slot picker
        if (lastBotMessage?.showActions && !booking) {
            const steps = Math.max(total, 1);
            return { mode: 'steps', label: 'Book a call', current: steps, total: steps, percent: 100, isFinal: true };
        }
        if (isChatEnded) return null;

        if (estimatedProgress !== null) {
            if (estimatedProgress <= 0) return null;
            return {
                mode: 'estimate',
                label: 'Your needs',
                current: 0,
                total: 0,
                percent: Math.min(100, Math.round(estimatedProgress * 100)),
                isFinal: false,
            };
        }

        if (total <= 0 || current <= 0) return null;
        const step = Math.min(current, total);
        let label = 'Your needs';
        if (currentStepId === 'contact') {
            label = 'About you';
        } else {
            const stepLabel = config.leadQualification?.questions?.[step - 1]?.stepLabel;
            if (stepLabel && !isGenericStepLabel(stepLabel)) label = stepLabel.trim();
        }
        return { mode: 'steps', label, current: step, total, percent: Math.round((step / total) * 100), isFinal: false };
    }, [hasStarted, questionProgress, lastBotMessage, booking, isChatEnded, config]);

    const contactDetails = useMemo<ContactDetails>(() => ({
        name: contact.name || pickSummaryValue(leadData, 'name'),
        phone: contact.phone || (() => {
            const fromSummary = pickSummaryValue(leadData, 'phone');
            return fromSummary ? normalizePhoneIN(fromSummary) : null;
        })(),
    }), [contact, leadData]);

    return {
        messages,
        hasStarted,
        isLoading,
        isChatEnded,
        systemError,
        sessionId,
        conversationId,
        progress,
        booking,
        contact: contactDetails,
        summaryData: leadData,
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
    };
};
