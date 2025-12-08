import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageRole, SummaryData } from '../types';
import { GeminiChatService } from '../services/geminiService';
import { brandConfig } from '../config';
import { getCookie, setCookie } from '../utils/cookies';

const generateSessionId = () => {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

export const useChatSession = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasStarted, setHasStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [leadData, setLeadData] = useState<SummaryData | null>(null);
    const [quickReplies, setQuickReplies] = useState<string[]>([]);
    const [isChatEnded, setIsChatEnded] = useState(false);

    // Initialize error state lazily to verify config without side effects in render
    const [systemError, setSystemError] = useState<string | null>(() => {
        if (!import.meta.env.VITE_GEMINI_API_KEY && !process.env.API_KEY) {
            const errorMsg = 'Configuration Error: API Key is missing.';
            console.error(errorMsg);
            return errorMsg;
        }
        return null;
    });

    const [sessionId] = useState(() => {
        const existingSession = getCookie('qbot_session_id');
        if (existingSession) {
            console.log('Resuming existing session:', existingSession);
            return existingSession;
        }
        const newSession = generateSessionId();
        setCookie('qbot_session_id', newSession, 7);
        return newSession;
    });

    const chatServiceRef = useRef<GeminiChatService | null>(null);

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
        // If no key, error is already set in initial state
        if (!apiKey) return;

        try {
            chatServiceRef.current = new GeminiChatService(apiKey);
            console.log(`Initialized chat service for session: ${sessionId}`);
        } catch (err) {
            console.error('Failed to initialize GeminiChatService:', err);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSystemError('Failed to initialize chat service. Please refresh.');
        }
    }, [sessionId]);

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
            return brandConfig.leadQualification.options.locations;
        }
        if (lowerText.includes('budget') || lowerText.includes('price range')) {
            return brandConfig.leadQualification.options.budgets;
        }
        if (
            lowerText.includes('type') ||
            lowerText.includes('bhk') ||
            lowerText.includes('configuration')
        ) {
            return brandConfig.leadQualification.options.types;
        }
        if (
            lowerText.includes('move-in') ||
            lowerText.includes('timeline') ||
            lowerText.includes('possession')
        ) {
            return brandConfig.leadQualification.options.moveIn;
        }
        if (
            lowerText.includes('loan') ||
            lowerText.includes('financing') ||
            lowerText.includes('funding')
        ) {
            return brandConfig.leadQualification.options.financing;
        }
        return [];
    };

    const handleBotResponse = async (prompt?: string) => {
        if (systemError) return;

        setIsLoading(true);
        setQuickReplies([]);

        if (messages.length === 0 && prompt) {
            await new Promise((resolve) => setTimeout(resolve, 600));

            if (!chatServiceRef.current) {
                setSystemError('Chat service is not available.');
                setIsLoading(false);
                return;
            }

            const response = await chatServiceRef.current.sendMessage(prompt);
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
            return;
        }

        const lastUserMsg = messages.filter((m) => m.role === MessageRole.User).pop()?.text;

        if (!chatServiceRef.current) {
            setIsLoading(false);
            setSystemError('Chat service disconnected.');
            return;
        }

        const response = await chatServiceRef.current.sendMessage(prompt || lastUserMsg || 'Hello');
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
            const replies = determineQuickReplies(response.text);
            setQuickReplies(replies);
        }
    };

    const handleStart = async () => {
        if (systemError) return;
        setHasStarted(true);
        await handleBotResponse(`Hello! I'm interested in ${brandConfig.companyName}.`);
    };

    const handleSendMessage = async (text: string) => {
        if (systemError) return;
        setQuickReplies([]);
        if (!hasStarted) {
            setHasStarted(true);
            addMessage(MessageRole.User, text);
            await handleBotResponse();
        } else {
            addMessage(MessageRole.User, text);
            await handleBotResponse();
        }
    };

    const submitToCRM = (status: 'scheduled' | 'later') => {
        console.log('------------------------------------------------');
        console.log('🚀 CRM SUBMISSION SIMULATION');
        console.log('------------------------------------------------');
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
            addMessage(MessageRole.Bot, brandConfig.messages.scheduleSuccess);
        }, 1000);
    };

    const handleMaybeLater = () => {
        setQuickReplies([]);
        addMessage(MessageRole.User, 'Maybe later.');
        submitToCRM('later');
        setIsChatEnded(true);
        setTimeout(() => {
            addMessage(MessageRole.Bot, brandConfig.messages.maybeLater);
        }, 1000);
    };

    const handleFeedback = (messageId: string, feedbackType: 'up' | 'down') => {
        setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: feedbackType } : msg))
        );
        console.log('FEEDBACK:', { sessionId, messageId, feedbackType });
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
    };
};
