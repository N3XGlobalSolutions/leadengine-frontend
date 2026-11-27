import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types';
import { chatService } from '../../services/chatService';
import { ArrowLeft, CheckCircle, Loader2, MessageCircle } from 'lucide-react';
// import { format } from 'date-fns';
import ConversationViewer from './ConversationViewer.tsx';

import { TenantConfig } from '../../types/config';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { cn } from '../../utils/cn';
import { Button, ListFooterText, Mono, StatusPill, Table, TableCard, Td, Th, tone, trClass } from './ui/kit';

interface ClientConversationsProps {
    clientId: string;
    config?: TenantConfig;
}

export const ClientConversations: React.FC<ClientConversationsProps> = ({ clientId, config }) => {
    const { isDark } = useAdminTheme();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 30;
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    const fetchConversations = async (currentSkip: number, isInitial: boolean = false) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            const data = await chatService.getTenantConversations(clientId, currentSkip, LIMIT);

            // Sort new data by last message time descending
            const sortedData = data.sort((a, b) =>
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );

            if (isInitial) {
                setConversations(sortedData);
            } else {
                setConversations(prev => [...prev, ...sortedData]);
            }

            // If we received fewer items than the limit, we've reached the end
            setHasMore(data.length === LIMIT);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            setSkip(0);
            setHasMore(true);
            fetchConversations(0, true);
        }
    }, [clientId]);

    const handleLoadMore = () => {
        const nextSkip = skip + LIMIT;
        setSkip(nextSkip);
        fetchConversations(nextSkip, false);
    };

    const t = tone(isDark);

    if (loading) {
        return (
            <div
                className={cn('flex items-center justify-center gap-2 py-10 text-sm font-semibold', t.muted)}
                role="status"
                aria-live="polite"
            >
                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading conversations...
            </div>
        );
    }

    if (selectedConversationId) {
        return (
            <section className={cn('flex flex-col h-[600px] rounded-2xl border overflow-hidden', t.card)}>
                <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b', t.border, t.soft)}>
                    <Button
                        isDark={isDark}
                        variant="ghost"
                        onClick={() => setSelectedConversationId(null)}
                        className="min-h-[36px] text-[13px]"
                    >
                        <ArrowLeft size={15} aria-hidden="true" /> Back to List
                    </Button>
                    <Mono isDark={isDark} className="truncate max-w-full">ID: {selectedConversationId}</Mono>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ConversationViewer conversationId={selectedConversationId} config={config} />
                </div>
            </section>
        );
    }

    return (
        <TableCard
            isDark={isDark}
            footer={conversations.length > 0 ? (
                <>
                    <ListFooterText isDark={isDark}>
                        Showing {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                    </ListFooterText>
                    {hasMore && (
                        <Button
                            isDark={isDark}
                            variant="secondary"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="min-h-[38px] px-4 text-[13px]"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                                    Loading...
                                </>
                            ) : (
                                'Load More'
                            )}
                        </Button>
                    )}
                </>
            ) : undefined}
        >
            <Table>
                <thead>
                    <tr>
                        <Th isDark={isDark}>User / Lead</Th>
                        <Th isDark={isDark}>Started</Th>
                        <Th isDark={isDark} className="text-center">Messages</Th>
                        <Th isDark={isDark}>Status</Th>
                        <Th isDark={isDark} className="text-right">Action</Th>
                    </tr>
                </thead>
                <tbody>
                    {conversations.length === 0 ? (
                        <tr className={trClass(isDark)}>
                            <Td isDark={isDark} colSpan={5} className={cn('py-10 text-center text-sm', t.muted)}>
                                No conversations found.
                            </Td>
                        </tr>
                    ) : (
                        conversations.map((conv) => {
                            const name = conv.lead_captured && conv.extracted_lead_data?.name
                                ? conv.extracted_lead_data.name
                                : conv.user_identifier || 'Anonymous';
                            return (
                                <tr key={conv.conversation_id} className={cn(trClass(isDark), 'transition-colors', isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-[#FAFAFA]')}>
                                    <Td isDark={isDark}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span
                                                className={cn(
                                                    'flex-none w-[34px] h-[34px] rounded-full border flex items-center justify-center',
                                                    isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#F2F2F2] border-[#E5E5E5] text-[#0A0A0A]',
                                                )}
                                                aria-hidden="true"
                                            >
                                                <MessageCircle size={15} />
                                            </span>
                                            <div className="min-w-0">
                                                <div className={cn('font-bold truncate max-w-[260px]', t.text)}>{name}</div>
                                                <div className="text-xs font-semibold mt-0.5">
                                                    {conv.lead_captured ? (
                                                        <span className={cn('flex items-center gap-1', isDark ? 'text-green-300' : 'text-[#166534]')}>
                                                            <CheckCircle size={11} aria-hidden="true" /> Lead Captured
                                                        </span>
                                                    ) : (
                                                        <span className={t.hint}>Visitor</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td isDark={isDark} className={cn('text-[13px] whitespace-nowrap', t.muted)}>
                                        {new Date(conv.started_at).toLocaleString()}
                                    </Td>
                                    <Td isDark={isDark} className="text-center">
                                        <StatusPill isDark={isDark} tone="soft" className="h-6 min-w-[32px] justify-center text-[11.5px]">
                                            {conv.message_count}
                                        </StatusPill>
                                    </Td>
                                    <Td isDark={isDark}>
                                        {conv.is_active ? (
                                            <StatusPill isDark={isDark} tone="green" dot="#16A34A">Active</StatusPill>
                                        ) : (
                                            <StatusPill isDark={isDark} tone="grey">Closed</StatusPill>
                                        )}
                                    </Td>
                                    <Td isDark={isDark} className="text-right">
                                        <Button
                                            isDark={isDark}
                                            variant="secondary"
                                            onClick={() => setSelectedConversationId(conv.conversation_id)}
                                            className="min-h-[34px] px-3 text-[12.5px] rounded-[9px]"
                                        >
                                            View Chat
                                        </Button>
                                    </Td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </Table>
        </TableCard>
    );
};
