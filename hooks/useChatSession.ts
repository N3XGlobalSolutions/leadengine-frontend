import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageRole, SummaryData } from '../types';
import { chatService } from '../services/chatService';

import { TenantConfig } from '../types/config';
import { getCookie, setCookie } from '../utils/cookies';

const generateSessionId = () => {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

// Storage keys
const getStorageKey = (sessionId: string, key: string) => `qbot_${sessionId}_${key}`;
const SESSION_EXPIRY_HOURS = 24;

interface PersistedChatState {
    messages: Message[];
    hasStarted: boolean;
    isChatEnded: boolean;
    leadData: SummaryData | null;
    createdAt: number; // Timestamp when session was created
    conversationId: string | null; // Backend Conversation ID
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

export const useChatSession = (config: TenantConfig, clientSlug: string) => {
    const [sessionId] = useState(() => {
        const cookieName = `qbot_session_${clientSlug}`;
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

    const [messages, setMessages] = useState<Message[]>(persistedState?.messages || []);
    const [hasStarted, setHasStarted] = useState(persistedState?.hasStarted || false);
    const [isLoading, setIsLoading] = useState(false);
    const [leadData, setLeadData] = useState<SummaryData | null>(persistedState?.leadData || null);
    const [quickReplies, setQuickReplies] = useState<string[]>([]);
    const [isChatEnded, setIsChatEnded] = useState(persistedState?.isChatEnded || false);
    const [systemError, setSystemError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(persistedState?.conversationId || null);

    // ⭐ NEW: Question progress tracking
    const [questionProgress, setQuestionProgress] = useState<{
        current: number;
        total: number;
        currentStepId: string | null;
    }>({
        current: 0,
        total: 0,
        currentStepId: null
    });

    // Track when the session was created (for 24h expiry)
    const [sessionCreatedAt] = useState(() => persistedState?.createdAt || Date.now());

    // Save state whenever it changes
    useEffect(() => {
        if (hasStarted) {
            saveChatState(sessionId, {
                messages,
                hasStarted,
                isChatEnded,
                leadData,
                createdAt: sessionCreatedAt,
                conversationId
            });
        }
    }, [messages, hasStarted, isChatEnded, leadData, sessionId, sessionCreatedAt, conversationId]);

    // ⭐ NEW: Initialize total questions from config
    useEffect(() => {
        if (config?.leadQualification?.questions) {
            setQuestionProgress(prev => ({
                ...prev,
                total: config.leadQualification.questions.length
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
        // ⭐ NEW: Try to match based on current step first (context-aware)
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

    const handleBotResponse = async (userMessageText: string) => {
        if (systemError) return;

        setIsLoading(true);
        setQuickReplies([]);

        try {
            // Call Chat Service
            const response = await chatService.sendMessage({
                query: userMessageText,
                tenant_id: clientSlug, // clientSlug is used as tenant_id usually, or we should pass actual ID if different
                conversation_id: conversationId,
                user_identifier: sessionId // Using sessionId as a temporary user identifier
            }, config.apiKey); // Pass API Key if available in config

            setIsLoading(false);

            // Update Conversation ID if new
            if (response.conversation_id && !conversationId) {
                setConversationId(response.conversation_id);
            }

            // Check for JSON summary in response - Multiple strategies
            let botText = response.answer;
            let summaryData: any = null;
            let isSummary = false;

            // Helper: Sanitize JSON by removing trailing commas (common LLM error)
            const sanitizeJson = (jsonStr: string): string => {
                // Remove trailing commas before closing braces/brackets
                let sanitized = jsonStr.replace(/,\s*}/g, '}');
                sanitized = sanitized.replace(/,\s*]/g, ']');
                return sanitized;
            };

            // Strategy 1: Try markdown code block wrapped JSON (```json ... ```)
            let jsonMatch = response.answer.match(/```json\n([\s\S]*?)\n```/);

            // Strategy 2: Try bare JSON object (no markdown wrapper)
            if (!jsonMatch) {
                // Look for a JSON object that starts with { and has "summary" and "message" keys
                const bareJsonMatch = response.answer.match(/\{\s*"summary"\s*:\s*\{[\s\S]*?\},\s*"message"\s*:\s*"[\s\S]*?"\s*\}/);
                if (bareJsonMatch) {
                    jsonMatch = [bareJsonMatch[0], bareJsonMatch[0]]; // Simulate match format
                }
            }

            // Strategy 3: Try to extract JSON from text that might have prefix/suffix
            if (!jsonMatch) {
                // Find any valid JSON object in the response
                const jsonObjectMatch = response.answer.match(/(\{[\s\S]*?\})\s*$/);
                if (jsonObjectMatch) {
                    try {
                        const sanitized = sanitizeJson(jsonObjectMatch[1]);
                        const testParse = JSON.parse(sanitized);
                        if (testParse.summary && testParse.message) {
                            jsonMatch = [jsonObjectMatch[0], jsonObjectMatch[1]];
                        }
                    } catch (e) {
                        // Not valid JSON, continue
                    }
                }
            }

            if (jsonMatch) {
                try {
                    // Apply sanitization before parsing
                    const jsonString = sanitizeJson(jsonMatch[1].trim());
                    const parsed = JSON.parse(jsonString);
                    if (parsed.summary && parsed.message) {
                        botText = parsed.message;
                        summaryData = parsed.summary;
                        isSummary = true;
                        console.log('✅ Successfully parsed summary JSON:', summaryData);
                        // Trigger lead capture actions
                        if (!response.suggested_actions) {
                            response.suggested_actions = [];
                        }
                        response.suggested_actions.push('lead_captured');
                    }
                } catch (e) {
                    console.error("Failed to parse summary JSON:", e);
                    console.error("Failed JSON string:", jsonMatch[1]);
                }
            }

            // ⭐ Extract step ID and update progress (Run this BEFORE modifying botText or adding message)
            let currentStepId = questionProgress.currentStepId;
            const stepMatch = response.answer.match(/\[STEP:(\w+)\]/);

            if (stepMatch && stepMatch[1]) {
                const stepId = stepMatch[1];
                currentStepId = stepId; // Update local var for immediate use

                const stepIndex = config.leadQualification?.questions.findIndex(
                    q => q.id === stepId
                );

                if (stepIndex !== undefined && stepIndex !== -1) {
                    // Update progress asynchronously
                    setQuestionProgress(prev => ({
                        ...prev,
                        current: stepIndex + 1,
                        currentStepId: stepId
                    }));
                }
            }

            // ⭐ Clean the bot text for display (Remove [STEP:...] tags)
            botText = botText.replace(/\[STEP:\w+\]/g, '').trim();

            // ⭐ Check for lead_captured action to auto-trigger action buttons
            const isLeadCaptured = response.suggested_actions?.includes('lead_captured') || isSummary;

            addMessage(MessageRole.Bot, botText, {
                showActions: isLeadCaptured,  // Auto-trigger action buttons when lead is captured
                isSummary: isSummary,
                summaryData: summaryData
                // sources: response.sources
            });

            // If lead captured, log for verification
            if (isLeadCaptured) {
                console.log('✅ Lead captured! Summary should be in the message above.');
            }



            // Determine quick replies based on active step (preferred) or keywords (fallback)
            const replies = determineQuickReplies(response.answer, currentStepId);
            setQuickReplies(replies);

        } catch (error: any) {
            console.error("Chat Error:", error);

            // Handle 404 (Conversation Not Found) - likely stale session ID
            if (error.response?.status === 404 && conversationId) {
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

                    addMessage(MessageRole.Bot, retryResponse.answer);
                    const replies = determineQuickReplies(retryResponse.answer, questionProgress.currentStepId);
                    setQuickReplies(replies);
                    return;

                } catch (retryError) {
                    console.error("Retry failed:", retryError);
                    setSystemError('Failed to start a new conversation.');
                }
            } else {
                setSystemError(error.response?.data?.detail || 'Failed to connect to the chat server.');
            }

            setIsLoading(false);
            if (!conversationId || error.response?.status !== 404) {
                addMessage(MessageRole.Bot, "I'm having trouble connecting right now. Please try again later.");
            }
        }
    };

    const handleStart = async () => {
        if (systemError) return;
        setHasStarted(true);
        const startMsg = `Hello! I'm interested in ${config.companyName}.`;
        // Don't add user start message visually if we want bot to welcome first, 
        // but usually handleStart implies user clicked "Start Chat" which sends the message.
        // Actually, previous implementation relied on bot response WITHOUT user message shown for "Hello".
        // Let's keep it consistent: send "Hello" implicitly to trigger bot welcome flow?
        // Or if Welcome Screen is just a UI start, we send the first message now.
        // Previous code: await handleBotResponse(startMsg); (without adding user message to UI?)
        // Let's check previous impl logic:
        // if (messages.length === 0 && userMessageText.includes('Hello!')) ...

        // We will just send it as a user message to backend but maybe hide it? 
        // Or just show it. Showing it is clearer.
        // But if we want the BOT to speak first (after welcome screen), we send a hidden message.

        // We'll mimic previous behavior: Send message to backend to get first bot response.
        // We won't add it to UI if we want to mimic "System Init". 
        // But for simplicity, let's treat it as user intent.

        // Actually, let's just call handleBotResponse with the start text. 
        // We WON'T add it to the UI messages list to keep the "Welcome" feel clean.
        await handleBotResponse(startMsg);
    };

    const handleSendMessage = async (text: string) => {
        if (systemError) return;
        setQuickReplies([]);
        if (!hasStarted) {
            setHasStarted(true);
        }
        addMessage(MessageRole.User, text);
        await handleBotResponse(text);
    };

    const handleScheduleCall = () => {
        setQuickReplies([]);
        addMessage(MessageRole.User, 'Yes, schedule a call.');
        addMessage(MessageRole.Bot, 'Thank you for confirming. Our team will contact you shortly to schedule the call.');
        setIsChatEnded(true);
    };

    const handleMaybeLater = () => {
        setQuickReplies([]);
        addMessage(MessageRole.User, 'Maybe later.');
        addMessage(MessageRole.Bot, 'No problem at all. Feel free to reach out whenever you\'re ready.');
        setIsChatEnded(true);
    };

    const handleFeedback = (messageId: string, feedbackType: 'up' | 'down') => {
        setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: feedbackType } : msg))
        );
        // We could send feedback to backend if API existed
    };

    const handleNewChat = () => {
        clearChatState(sessionId);
        setMessages([]);
        setConversationId(null);
        setHasStarted(false);
        setIsChatEnded(false);
        setLeadData(null);
        setQuickReplies([]);
    };

    return {
        messages,
        hasStarted,
        isLoading,
        leadData,
        quickReplies,
        isChatEnded,
        systemError,
        sessionId,
        questionProgress,  // ⭐ NEW: Export progress for display
        handleStart,
        handleSendMessage,
        handleScheduleCall,
        handleMaybeLater,
        handleFeedback,
        handleNewChat,
    };
};
