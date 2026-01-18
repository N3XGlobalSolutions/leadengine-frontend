import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Zap, Users, Calendar, RefreshCw } from 'lucide-react';
import { Client } from '../../types/admin';
import { getClientConversationCount } from '../../services/adminService';

interface ClientSpotlightProps {
    client: Client | null;
    onClose: () => void;
}

import { useNavigate } from 'react-router-dom';

export const ClientSpotlight: React.FC<ClientSpotlightProps> = ({ client, onClose }) => {
    const navigate = useNavigate();
    const [conversationCount, setConversationCount] = useState<number>(0);
    const [countLoading, setCountLoading] = useState(false);

    useEffect(() => {
        const fetchCount = async () => {
            if (!client) return;
            setCountLoading(true);
            try {
                const count = await getClientConversationCount(client.id);
                setConversationCount(count);
            } catch (e) {
                console.error('Error fetching conversation count:', e);
            } finally {
                setCountLoading(false);
            }
        };
        fetchCount();
    }, [client]);

    if (!client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100">
                <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute -bottom-10 left-8">
                        <div className="h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-white">
                            {client.name.charAt(0)}
                        </div>
                    </div>
                </div>

                <div className="pt-12 px-8 pb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                            <p className="text-gray-500 flex items-center mt-1">
                                {client.slug}
                                <span className="mx-2 text-gray-300">•</span>
                                <span className={`text-sm font-medium ${client.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                                    {client.status}
                                </span>
                            </p>
                        </div>
                        <a href="#" className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors">
                            Visit <ExternalLink size={16} className="ml-1" />
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center text-gray-500 mb-2">
                                <Users size={16} className="mr-2" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {countLoading && <RefreshCw size={18} className="animate-spin text-indigo-500" />}
                                {conversationCount}
                            </span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center text-gray-500 mb-2">
                                <Zap size={16} className="mr-2" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Plan</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{client.plan}</span>
                        </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 bg-blue-50 p-4 rounded-lg text-blue-700">
                        <Calendar size={18} className="mr-2" />
                        Client since {new Date(client.onboardedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    <div className="mt-8 flex space-x-3">
                        <button
                            onClick={() => navigate(`/admin/clients/${client.id}`)}
                            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            Manage Client
                        </button>
                        <button
                            onClick={() => navigate(`/${client.id}/dashboard`)}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            View Reports
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
