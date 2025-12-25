import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Save, Trash2, Pause, Play, Building2, Users, Calendar,
    Globe, Palette, MessageSquare, Bot, AlertTriangle, Check, X
} from 'lucide-react';
import { Client, ClientConfig } from '../../types/admin';
import { getClientById, updateClient, deleteClient, toggleClientPause } from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';

export const AdminClientDetailPage = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { isDark } = useAdminTheme();

    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            setLoading(true);
            const data = await getClientById(clientId);
            setClient(data);
            setLoading(false);
        };
        fetchClient();
    }, [clientId]);

    const handleSave = async () => {
        if (!client) return;
        setSaving(true);
        setErrorMessage('');
        try {
            await updateClient(client);
            setSuccessMessage('Changes saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            setErrorMessage('Failed to save changes');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!client) return;
        try {
            await deleteClient(client.id);
            navigate('/admin/clients');
        } catch (e) {
            setErrorMessage('Failed to delete client');
        }
    };

    const handleTogglePause = async () => {
        if (!client) return;
        try {
            const updated = await toggleClientPause(client.id);
            setClient(updated);
            setSuccessMessage(`Client ${updated.status === 'Paused' ? 'paused' : 'resumed'} successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            setErrorMessage('Failed to update client status');
        }
    };

    const updateConfig = (field: keyof ClientConfig, value: string) => {
        if (!client) return;
        setClient({
            ...client,
            config: {
                ...client.config!,
                [field]: value
            }
        });
    };

    const updateField = (field: keyof Client, value: any) => {
        if (!client) return;
        setClient({ ...client, [field]: value });
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Loading client details...
                </div>
            </AdminLayout>
        );
    }

    if (!client) {
        return (
            <AdminLayout>
                <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Client not found.
                    <Link to="/admin/clients" className="text-indigo-500 hover:underline ml-2">
                        Back to clients
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/clients')}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {client.name}
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            /{client.slug} • Last updated: {client.updatedAt}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTogglePause}
                        className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all ${client.status === 'Paused'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : (isDark ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600') + ' text-white'
                            }`}
                    >
                        {client.status === 'Paused' ? (
                            <><Play size={18} className="mr-2" /> Resume</>
                        ) : (
                            <><Pause size={18} className="mr-2" /> Pause</>
                        )}
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                    >
                        <Trash2 size={18} className="mr-2" /> Delete
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                        <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center">
                    <Check size={18} className="mr-2" /> {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center">
                    <X size={18} className="mr-2" /> {errorMessage}
                </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Config */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Building2 size={20} /> Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Client Name
                                </label>
                                <input
                                    type="text"
                                    value={client.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    URL Slug
                                </label>
                                <input
                                    type="text"
                                    value={client.slug}
                                    onChange={(e) => updateField('slug', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Plan
                                </label>
                                <select
                                    value={client.plan}
                                    onChange={(e) => updateField('plan', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                >
                                    <option value="Starter">Starter</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Status
                                </label>
                                <select
                                    value={client.status}
                                    onChange={(e) => updateField('status', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Onboarding">Onboarding</option>
                                    <option value="Paused">Paused</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bot Config */}
                    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Bot size={20} /> Bot Configuration
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Company Name (Display)
                                </label>
                                <input
                                    type="text"
                                    value={client.config?.companyName || ''}
                                    onChange={(e) => updateConfig('companyName', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Bot Name
                                </label>
                                <input
                                    type="text"
                                    value={client.config?.botName || ''}
                                    onChange={(e) => updateConfig('botName', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Bot Display Name
                                </label>
                                <input
                                    type="text"
                                    value={client.config?.botDisplayName || ''}
                                    onChange={(e) => updateConfig('botDisplayName', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Primary Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={client.config?.primaryColor || '#4F46E5'}
                                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                                        className="h-10 w-14 rounded border-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={client.config?.primaryColor || '#4F46E5'}
                                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                                        className={`flex-1 px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Messages */}
                    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <MessageSquare size={20} /> Welcome Screen
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Welcome Headline
                                </label>
                                <input
                                    type="text"
                                    value={client.config?.welcomeHeadline || ''}
                                    onChange={(e) => updateConfig('welcomeHeadline', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Welcome Subheadline
                                </label>
                                <input
                                    type="text"
                                    value={client.config?.welcomeSubheadline || ''}
                                    onChange={(e) => updateConfig('welcomeSubheadline', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    System Prompt (AI Instructions)
                                </label>
                                <textarea
                                    value={client.config?.systemPrompt || ''}
                                    onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                                    rows={4}
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                    placeholder="Enter custom instructions for the AI bot..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Statistics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Total Users</span>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.totalUsers}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Onboarded</span>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.onboardedDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Created</span>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.createdAt}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Quick Links
                        </h3>
                        <div className="space-y-2">
                            <a
                                href={`/${client.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-indigo-400' : 'hover:bg-gray-50 text-indigo-600'
                                    }`}
                            >
                                <Globe size={18} />
                                View Live Chat
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-xl max-w-md w-full mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertTriangle size={24} />
                            <h3 className="text-lg font-bold">Delete Client</h3>
                        </div>
                        <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Are you sure you want to delete <strong>{client.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
