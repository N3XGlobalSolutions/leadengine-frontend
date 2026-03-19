import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types';
import { chatService } from '../../services/chatService';
import { MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
// import { format } from 'date-fns';
import ConversationViewer from './ConversationViewer.tsx';

import { TenantConfig } from '../../types/config';

interface ClientConversationsProps {
    clientId: string;
    config?: TenantConfig;
}

export const ClientConversations: React.FC<ClientConversationsProps> = ({ clientId, config }) => {
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

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading conversations...</div>;
    }

    if (selectedConversationId) {
        return (
            <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <button
                        onClick={() => setSelectedConversationId(null)}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
                    >
                        ← Back to List
                    </button>
                    <span className="text-xs text-gray-400 font-mono">ID: {selectedConversationId}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ConversationViewer conversationId={selectedConversationId} config={config} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">User / Lead</th>
                            <th className="px-4 py-3">Started</th>
                            <th className="px-4 py-3 text-center">Messages</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {conversations.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                    No conversations found.
                                </td>
                            </tr>
                        ) : (
                            conversations.map((conv) => (
                                <tr key={conv.conversation_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <MessageCircle size={16} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {conv.lead_captured && conv.extracted_lead_data?.name
                                                        ? conv.extracted_lead_data.name
                                                        : (conv.user_identifier || 'Anonymous')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {conv.lead_captured ? (
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <CheckCircle size={10} /> Lead Captured
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">Visitor</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(conv.started_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                            {conv.message_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {conv.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                Closed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setSelectedConversationId(conv.conversation_id)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded transition-all"
                                        >
                                            View Chat
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {conversations.length > 0 && hasMore && (
                    <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load More'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
