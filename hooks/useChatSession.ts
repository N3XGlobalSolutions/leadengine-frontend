import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageRole, SummaryData } from '../types';
import { BedrockService } from '../services/bedrockService';

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

    const chatServiceRef = useRef<BedrockService | null>(null);

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
                createdAt: sessionCreatedAt
            });
        }
    }, [messages, hasStarted, isChatEnded, leadData, sessionId, sessionCreatedAt]);

    // Re-initialize service if config changes
    useEffect(() => {
        try {
            chatServiceRef.current = new BedrockService(config, sessionId);
            console.log(`Initialized Bedrock service for session: ${sessionId}`);

            // If we have persisted messages, restore chat history to the service
            if (persistedState?.messages && persistedState.messages.length > 0) {
                chatServiceRef.current.restoreHistory(persistedState.messages);
            }
        } catch (err) {
            console.error('Failed to initialize BedrockService:', err);
            setSystemError('Failed to initialize chat service. Please refresh.');
        }
    }, [sessionId, config]);

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

    const determineQuickReplies = (text: string): string[] => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('location') || lowerText.includes('area') || lowerText.includes('where')) {
            return config.leadQualification.options?.locations || [];
        }
        if (lowerText.includes('budget') || lowerText.includes('price range')) {
            return config.leadQualification.options?.budgets || [];
        }
        if (
            lowerText.includes('type') ||
            lowerText.includes('bhk') ||
            lowerText.includes('configuration')
        ) {
            return config.leadQualification.options?.types || [];
        }
        if (
            lowerText.includes('move-in') ||
            lowerText.includes('timeline') ||
            lowerText.includes('possession')
        ) {
            return config.leadQualification.options?.moveIn || [];
        }
        if (
            lowerText.includes('loan') ||
            lowerText.includes('financing') ||
            lowerText.includes('funding')
        ) {
            return config.leadQualification.options?.financing || [];
        }
        return [];
    };

    const handleBotResponse = async (userMessageText: string) => {
        if (systemError) return;

        setIsLoading(true);
        setQuickReplies([]);

        // Handle initial start
        if (messages.length === 0 && userMessageText.includes('Hello!')) {
            await new Promise((resolve) => setTimeout(resolve, 600));

            if (!chatServiceRef.current) {
                setSystemError('Chat service is not available.');
                setIsLoading(false);
                return;
            }

            const response = await chatServiceRef.current.sendMessage(userMessageText);
            setIsLoading(false);

            if (response.error) {
                setSystemError('Connection failed. Please check your API key or network.');
                addMessage(MessageRole.Bot, response.text);
                return;
            }

            addMessage(MessageRole.Bot, response.text, {
                isSummary: !!response.summary,
                summaryData: response.summary,
                showActions: response.showActions,
            });

            if (!response.showActions && !response.summary) {
                let replies: string[] = [];
                if (response.currentStepId) {
                    const question = config.leadQualification.questions.find(q => q.id === response.currentStepId);
                    if (question) {
                        if (question.optionsKey && config.leadQualification.options) {
                            replies = config.leadQualification.options[question.optionsKey] || [];
                        } else if (question.options) {
                            replies = question.options;
                        }
                    }
                }
                if (replies.length === 0) {
                    replies = determineQuickReplies(response.text);
                }
                setQuickReplies(replies);
            }
            return;
        }


        if (!chatServiceRef.current) {
            setIsLoading(false);
            setSystemError('Chat service disconnected.');
            return;
        }

        const response = await chatServiceRef.current.sendMessage(userMessageText);
        setIsLoading(false);

        if (response.error) {
            addMessage(MessageRole.Bot, response.text);
            return;
        }

        if (response.summary) {
            setLeadData({ ...response.summary, sessionId });
        }

        addMessage(MessageRole.Bot, response.text, {
            isSummary: !!response.summary,
            summaryData: { ...response.summary, sessionId },
            showActions: response.showActions,
        });

        if (!response.showActions && !response.summary) {
            let replies: string[] = [];

            if (response.currentStepId) {
                const question = config.leadQualification.questions.find(q => q.id === response.currentStepId);
                if (question) {
                    if (question.optionsKey && config.leadQualification.options) {
                        replies = config.leadQualification.options[question.optionsKey] || [];
                    } else if (question.options) {
                        replies = question.options;
                    }
                }
            }

            // Fallback to text matching if no step ID or no options found via ID
            if (replies.length === 0) {
                replies = determineQuickReplies(response.text);
            }

            setQuickReplies(replies);
        }
    };

    const handleStart = async () => {
        if (systemError) return;
        setHasStarted(true);
        const startMsg = `Hello! I'm interested in ${config.companyName}.`;
        await handleBotResponse(startMsg);
    };

    const handleSendMessage = async (text: string) => {
        if (systemError) return;
        setQuickReplies([]);
        if (!hasStarted) {
            setHasStarted(true);
            addMessage(MessageRole.User, text);
            await handleBotResponse(text);
        } else {
            addMessage(MessageRole.User, text);
            await handleBotResponse(text);
        }
    };

    const submitToCRM = (status: 'scheduled' | 'later') => {
        console.log('------------------------------------------------');
        console.log('🚀 CRM SUBMISSION SIMULATION');
        console.log('------------------------------------------------');
        console.log('Client Slug:', clientSlug);
        console.log('Session ID:', sessionId);
        console.log(
            'Lead Status:',
            status === 'scheduled' ? 'HOT LEAD - Call Scheduled' : 'WARM LEAD - Follow up later'
        );
        console.log('Captured Data:', leadData);
        console.log(
            'Chat Transcript:',
            messages.map((m) => `[${m.role}]: ${m.text}`)
        );
        console.log('------------------------------------------------');
    };

    const handleScheduleCall = () => {
        setQuickReplies([]);
        addMessage(MessageRole.User, 'Yes, schedule a call.');
        submitToCRM('scheduled');
        setIsChatEnded(true);
        setTimeout(() => {
            addMessage(MessageRole.Bot, config.messages.scheduleSuccess);
        }, 1000);
    };

    const handleMaybeLater = () => {
        setQuickReplies([]);
        addMessage(MessageRole.User, 'Maybe later.');
        submitToCRM('later');
        setIsChatEnded(true);
        setTimeout(() => {
            addMessage(MessageRole.Bot, config.messages.maybeLater);
        }, 1000);
    };

    const handleFeedback = (messageId: string, feedbackType: 'up' | 'down') => {
        setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: feedbackType } : msg))
        );
        console.log('FEEDBACK:', { sessionId, messageId, feedbackType });
    };

    const handleNewChat = () => {
        // Clear persisted state and start fresh
        clearChatState(sessionId);
        setMessages([]);
        setHasStarted(false);
        setIsChatEnded(false);
        setLeadData(null);
        setQuickReplies([]);
        if (chatServiceRef.current) {
            chatServiceRef.current.clearHistory();
        }
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
        handleStart,
        handleSendMessage,
        handleScheduleCall,
        handleMaybeLater,
        handleFeedback,
        handleNewChat,
    };
};
