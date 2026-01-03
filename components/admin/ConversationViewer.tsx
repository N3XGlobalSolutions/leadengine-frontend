import React, { useEffect, useState, useRef } from 'react';
import { chatService } from '../../services/chatService';
import { Message, MessageRole } from '../../types';
import { TenantConfig } from '../../types/config';
import ChatBubble from '../chat/ChatBubble';

interface ConversationViewerProps {
    conversationId: string;
    config?: TenantConfig; // Optional, for bot branding
}

const ConversationViewer: React.FC<ConversationViewerProps> = ({ conversationId, config }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const data = await chatService.getMessages(conversationId);
                // Sort by timestamp if necessary, usually backend returns time-ordered or we sort
                setMessages(data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
            } catch (error) {
                console.error("Failed to load messages", error);
            } finally {
                setLoading(false);
            }
        };

        if (conversationId) {
            fetchMessages();
        }
    }, [conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (!loading) {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages, loading]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading transcript...</div>;
    }

    return (
        <div className="h-full bg-gray-50 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
                <p className="text-center text-gray-400 my-8">No messages in this conversation.</p>
            ) : (
                messages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        message={msg}
                        botAvatar={config?.botAvatar}
                        botName={config?.botDisplayName || 'Assistant'}
                        allowFeedback={false}
                    />
                ))
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ConversationViewer;
