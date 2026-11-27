import React, { useEffect, useState, useRef } from 'react';
import { chatService } from '../../services/chatService';
import { Message } from '../../types';
import { TenantConfig } from '../../types/config';
import ChatBubble from '../chat/ChatBubble';
import { getThemeStyle, TOKEN_CSS_VARS } from '../../utils/theme/cssVars';

interface ConversationViewerProps {
    conversationId: string;
    config?: TenantConfig; // Optional, for bot branding
}

/**
 * v2 transcript look: visitor = black bubble with white text, bot = white bubble with a #EAEAEA border
 * (same as the onboarding chat preview). The client's theme still drives links / focus rings.
 */
const transcriptStyle = (config?: TenantConfig): React.CSSProperties => ({
    ...getThemeStyle(config?.colors?.primary, config?.colors?.secondary),
    ...({
        [TOKEN_CSS_VARS.bubbleFrom]: '#0A0A0A',
        [TOKEN_CSS_VARS.bubbleTo]: '#0A0A0A',
        [TOKEN_CSS_VARS.onBubble]: '#FFFFFF',
    } as React.CSSProperties),
});

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
        return (
            <div role="status" className="h-full flex items-center justify-center gap-2.5 p-8 bg-[#F7F7F7] text-[13.5px] font-semibold text-[#6B6B6B]">
                <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-[#D4D4D4] border-t-[#0A0A0A] motion-safe:animate-spin" />
                Loading transcript...
            </div>
        );
    }

    return (
        // Theme vars give ChatBubble its colours (it is styled with the chat brand tokens); the bubble
        // tokens are pinned to the design's black/white and the bot border is overridden to #EAEAEA.
        <div
            className="h-full bg-[#F7F7F7] overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 [&_.border-le-bot-border]:border-[#EAEAEA]"
            style={transcriptStyle(config)}
        >
            {messages.length === 0 ? (
                <p className="m-auto py-8 text-center text-[13.5px] font-semibold text-[#6B6B6B]">No messages in this conversation.</p>
            ) : (
                messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                ))
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ConversationViewer;
