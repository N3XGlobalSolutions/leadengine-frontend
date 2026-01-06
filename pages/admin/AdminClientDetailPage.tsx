import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Save, Trash2, Pause, Play, Building2, Users, Calendar,
    Globe, Palette, MessageSquare, Bot, AlertTriangle, Check, X, LayoutDashboard,
    FileText, Upload, Wand2, HelpCircle, Key, Code, Copy, Sliders, Shield
} from 'lucide-react';
import { Client, TenantDocument } from '../../types/admin';
import { TenantConfig, Question } from '../../types/config';
import {
    getClientById, updateClient, deleteClient, toggleClientPause,
    getTenantDocuments, ingestDocument, deleteDocument, generateApiKey
} from '../../services/adminService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ClientConversations } from '../../components/admin/ClientConversations';

export const AdminClientDetailPage = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { isDark } = useAdminTheme();

    const [client, setClient] = useState<Client | null>(null);
    const [documents, setDocuments] = useState<TenantDocument[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'settings' | 'qualifications' | 'knowledge' | 'integration' | 'conversations'>('general');
    const [generatedKey, setGeneratedKey] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // File Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            setLoading(true);
            const data = await getClientById(clientId);
            setClient(data);

            // Also fetch documents
            const docs = await getTenantDocuments(clientId);
            setDocuments(docs);

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

    // --- Document Handlers ---
    const handleUpload = async () => {
        if (!client || !selectedFile) return;
        setUploading(true);
        try {
            await ingestDocument(client.id, selectedFile);
            setSuccessMessage('Document uploaded and processing...');
            setSelectedFile(null);

            // Backend returns 202 (async processing), so poll for the document
            // Retry fetching documents with delays to allow backend processing
            let retries = 0;
            const maxRetries = 5;
            const fetchWithRetry = async () => {
                const docs = await getTenantDocuments(client.id);

                // Check if our document appears (match by filename)
                const uploadedDoc = docs.find(d => d.filename === selectedFile.name);

                if (uploadedDoc || retries >= maxRetries) {
                    setDocuments(docs);
                    if (uploadedDoc) {
                        setSuccessMessage('Document uploaded successfully!');
                    } else {
                        setSuccessMessage('Document queued for processing. Refresh to see updates.');
                    }
                } else {
                    retries++;
                    // Wait progressively longer: 1s, 2s, 3s, 4s, 5s
                    await new Promise(resolve => setTimeout(resolve, retries * 1000));
                    await fetchWithRetry();
                }
            };

            await fetchWithRetry();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            setErrorMessage('Failed to upload document');
        }
        setUploading(false);
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!client) return;
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await deleteDocument(docId, client.id);
            setDocuments(prev => prev.filter(d => d.document_id !== docId));
            setSuccessMessage('Document deleted.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            setErrorMessage('Failed to delete document');
        }
    };

    // --- API Key Handlers ---
    const handleGenerateKey = async () => {
        if (!client) return;
        if (!confirm('Generating a new key will invalidate the old one. Continue?')) return;

        try {
            const key = await generateApiKey(client.id);
            setGeneratedKey(key);
            setSuccessMessage('New API Key generated!');
        } catch (e) {
            setErrorMessage('Failed to generate API Key');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccessMessage('Copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 2000);
    };

    // --- Config Updaters ---
    const updateConfig = (path: string, value: any) => {
        if (!client || !client.config) return;

        // Deep clone config to avoid mutation
        const newConfig = JSON.parse(JSON.stringify(client.config));

        if (path.includes('.')) {
            const keys = path.split('.');
            let current = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        } else {
            (newConfig as any)[path] = value;
        }

        setClient({ ...client, config: newConfig });
    };

    // --- Question Handlers ---
    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        if (!client?.config) return;
        const newQuestions = [...client.config.leadQualification.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        updateConfig('leadQualification.questions', newQuestions);
    };

    const addOption = (questionIndex: number) => {
        if (!client?.config) return;
        const newQuestions = [...client.config.leadQualification.questions];
        const options = newQuestions[questionIndex].options || [];
        newQuestions[questionIndex].options = [...options, ''];
        updateConfig('leadQualification.questions', newQuestions);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        if (!client?.config) return;
        const newQuestions = [...client.config.leadQualification.questions];
        const options = newQuestions[questionIndex].options || [];
        newQuestions[questionIndex].options = options.filter((_, i) => i !== optionIndex);
        updateConfig('leadQualification.questions', newQuestions);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        if (!client?.config) return;
        const newQuestions = [...client.config.leadQualification.questions];
        const options = [...(newQuestions[questionIndex].options || [])];
        options[optionIndex] = value;
        newQuestions[questionIndex].options = options;
        updateConfig('leadQualification.questions', newQuestions);
    };

    const updateField = (field: keyof Client, value: any) => {
        if (!client) return;
        setClient({ ...client, [field]: value });
    };

    // --- Feature Handlers ---
    const addFeature = () => {
        if (!client?.config) return;
        const features = [...client.config.welcome.features, ''];
        updateConfig('welcome.features', features);
    };

    const removeFeature = (index: number) => {
        if (!client?.config) return;
        const features = client.config.welcome.features.filter((_, i) => i !== index);
        updateConfig('welcome.features', features);
    };

    const updateFeature = (index: number, value: string) => {
        if (!client?.config) return;
        const features = [...client.config.welcome.features];
        features[index] = value;
        updateConfig('welcome.features', features);
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

    // Styles
    const inputClass = `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`;
    const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
    const cardClass = `p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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

            {/* Messages */}
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

            {/* Tabs */}
            <div className={`flex border-b mb-6 ${isDark ? 'border-slate-700' : 'border-gray-200'} overflow-x-auto`}>
                {['general', 'branding', 'settings', 'qualifications', 'knowledge', 'integration', 'conversations'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab
                            ? 'border-indigo-500 text-indigo-500'
                            : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`
                            }`}
                    >
                        {tab === 'integration' ? 'Generate Key' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={activeTab === 'conversations' ? "lg:col-span-3 space-y-6" : "lg:col-span-2 space-y-6"}>
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className={cardClass}>
                            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Building2 size={20} /> Basic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Client Name</label>
                                    <input type="text" value={client.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>URL Slug</label>
                                    <input type="text" value={client.slug} onChange={(e) => updateField('slug', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Plan</label>
                                    <select value={client.plan} onChange={(e) => updateField('plan', e.target.value)} className={inputClass}>
                                        <option value="Starter">Starter</option>
                                        <option value="Pro">Pro</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select value={client.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Onboarding">Onboarding</option>
                                        <option value="Paused">Paused</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BRANDING TAB */}
                    {activeTab === 'branding' && (
                        <>
                            {/* Bot Config */}
                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Bot size={20} /> Identity & Colors
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Company Name (Display)</label>
                                        <input type="text" value={client.config?.companyName || ''} onChange={(e) => updateConfig('companyName', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Bot Name</label>
                                        <input type="text" value={client.config?.botName || ''} onChange={(e) => updateConfig('botName', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Bot Avatar URL</label>
                                        <input type="url" value={client.config?.botAvatar || ''} onChange={(e) => updateConfig('botAvatar', e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={labelClass}>Primary</label>
                                            <div className="flex gap-2">
                                                <input type="color" value={client.config?.colors?.primary} onChange={(e) => updateConfig('colors.primary', e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                                                <input type="text" value={client.config?.colors?.primary} onChange={(e) => updateConfig('colors.primary', e.target.value)} className={inputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Secondary</label>
                                            <div className="flex gap-2">
                                                <input type="color" value={client.config?.colors?.secondary} onChange={(e) => updateConfig('colors.secondary', e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                                                <input type="text" value={client.config?.colors?.secondary} onChange={(e) => updateConfig('colors.secondary', e.target.value)} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Welcome Config */}
                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <MessageSquare size={20} /> Welcome Screen
                                </h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Headline Prefix</label>
                                            <input type="text" value={client.config?.welcome?.headline} onChange={(e) => updateConfig('welcome.headline', e.target.value)} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Highlighted Headline</label>
                                            <input type="text" value={client.config?.welcome?.highlightedHeadline} onChange={(e) => updateConfig('welcome.highlightedHeadline', e.target.value)} className={inputClass} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Subheadline</label>
                                        <textarea rows={2} value={client.config?.welcome?.subheadline} onChange={(e) => updateConfig('welcome.subheadline', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Features / Tags</label>
                                        <div className="space-y-2">
                                            {client.config?.welcome?.features?.map((feature, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input type="text" value={feature} onChange={(e) => updateFeature(idx, e.target.value)} className={inputClass} />
                                                    <button onClick={() => removeFeature(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded"><X size={18} /></button>
                                                </div>
                                            ))}
                                            <button onClick={addFeature} className={`text-sm px-3 py-1.5 rounded-lg font-medium bg-gray-100 dark:bg-slate-700`}>+ Add Feature</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* Behavior */}
                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Sliders size={20} /> Behavior & Personality
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Welcome Message (Initial Greeting)</label>
                                        <textarea
                                            rows={2}
                                            value={client.config?.welcome_message || ''}
                                            onChange={(e) => updateConfig('welcome_message', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Language</label>
                                        <select
                                            value={client.config?.language || 'en'}
                                            onChange={(e) => updateConfig('language', e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="en">English (en)</option>
                                            <option value="es">Spanish (es)</option>
                                            <option value="fr">French (fr)</option>
                                            <option value="de">German (de)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tone</label>
                                        <select
                                            value={client.config?.tone || 'professional'}
                                            onChange={(e) => updateConfig('tone', e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="professional">Professional</option>
                                            <option value="friendly">Friendly</option>
                                            <option value="casual">Casual</option>
                                            <option value="empathetic">Empathetic</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Company Context (for LLM)</label>
                                        <textarea
                                            rows={4}
                                            value={client.config?.company_context || ''}
                                            onChange={(e) => updateConfig('company_context', e.target.value)}
                                            className={inputClass}
                                            placeholder="Provide background about the company, products, and services to help the AI answer better."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Constraints */}
                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Shield size={20} /> Constraints & Guardrails
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Max Conversation Length</label>
                                        <input
                                            type="number"
                                            value={client.config?.max_conversation_length || 50}
                                            onChange={(e) => updateConfig('max_conversation_length', parseInt(e.target.value))}
                                            className={inputClass}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Messages per session</p>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Lead Trigger Count</label>
                                        <input
                                            type="number"
                                            value={client.config?.lead_trigger_count || 3}
                                            onChange={(e) => updateConfig('lead_trigger_count', parseInt(e.target.value))}
                                            className={inputClass}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Messages before looking for leads</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Guardrails (Topics to Avoid)</label>
                                        <textarea
                                            rows={3}
                                            value={Array.isArray(client.config?.guardrails) ? client.config?.guardrails.join(', ') : ''}
                                            onChange={(e) => updateConfig('guardrails', e.target.value.split(',').map(s => s.trim()))}
                                            className={inputClass}
                                            placeholder="Comma-separated list (e.g. competitors, politics, sensitive data)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lead Form Settings */}
                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <FileText size={20} /> Lead Form Configuration
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="leadFormEnabled"
                                            checked={client.config?.lead_form_enabled ?? true}
                                            onChange={(e) => updateConfig('lead_form_enabled', e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="leadFormEnabled" className={labelClass + " mb-0"}>Enable Standard Lead Form</label>
                                    </div>

                                    {(client.config?.lead_form_enabled ?? true) && (
                                        <div>
                                            <label className={labelClass}>Fields to Collect</label>
                                            <input
                                                type="text"
                                                value={Array.isArray(client.config?.lead_form_fields) ? client.config?.lead_form_fields.join(', ') : 'name, email, phone'}
                                                onChange={(e) => updateConfig('lead_form_fields', e.target.value.split(',').map(s => s.trim()))}
                                                className={inputClass}
                                                placeholder="name, email, phone"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Standard form fields (comma separated)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QUALIFICATIONS TAB */}
                    {activeTab === 'qualifications' && (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-100'}`}>
                                <Wand2 className="text-indigo-500 mt-1" size={20} />
                                <div>
                                    <h3 className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>Dynamic Questions</h3>
                                    <p className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Define the 5 questions the bot asks.
                                    </p>
                                </div>
                            </div>

                            {client.config?.leadQualification?.questions?.map((question, qIndex) => (
                                <div key={question.id || qIndex} className={cardClass}>
                                    <div className="flex items-center gap-3 mb-4 border-b pb-4 border-gray-100 dark:border-slate-700">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {qIndex + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={question.label}
                                            onChange={(e) => updateQuestion(qIndex, 'label', e.target.value)}
                                            className={`${inputClass} font-semibold`}
                                            placeholder="Question Label"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-11">
                                        <div>
                                            <label className={labelClass}>AI Instruction</label>
                                            <textarea
                                                value={question.instruction}
                                                onChange={(e) => updateQuestion(qIndex, 'instruction', e.target.value)}
                                                className={inputClass}
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Quick Replies</label>
                                            <div className="space-y-2">
                                                {(question.options || []).map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => updateOption(qIndex, oIdx, e.target.value)}
                                                            className={inputClass}
                                                        />
                                                        <button onClick={() => removeOption(qIndex, oIdx)} className="text-red-500"><X size={18} /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addOption(qIndex)} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700">+ Options</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* KNOWLEDGE BASE TAB */}
                    {activeTab === 'knowledge' && (
                        <div className={cardClass}>
                            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <FileText size={20} /> Document Knowledge Base
                            </h2>

                            {/* File List */}
                            <div className="space-y-3 mb-8">
                                {documents.length === 0 ? (
                                    <p className={`text-sm italic ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No documents uploaded yet.</p>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.document_id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-indigo-500" size={18} />
                                                <div>
                                                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.filename}</p>
                                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                        {new Date(doc.uploaded_at || '').toLocaleDateString()} • {doc.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteDocument(doc.document_id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Upload Area */}
                            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-gray-50'}`}>
                                <Upload size={24} className={`mb-3 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    {selectedFile ? selectedFile.name : 'Upload PDF, DOCX, TXT'}
                                </p>
                                {selectedFile ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {uploading ? 'Uploading...' : 'Confirm Upload'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="detail-file-upload"
                                            accept=".pdf,.docx,.txt"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSelectedFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="detail-file-upload"
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-700"
                                        >
                                            Select File
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {/* GENERATE KEY TAB */}
                    {activeTab === 'integration' && (
                        <div className="space-y-6">
                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Key size={20} /> API Key Management
                                </h2>
                                <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    This key is used to authenticate the chat widget. Keep it secure.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className={labelClass}>Current API Key</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={generatedKey || client.config?.apiKey || '•'.repeat(24)}
                                                    className={`${inputClass} font-mono`}
                                                />
                                                {generatedKey && (
                                                    <button
                                                        onClick={() => copyToClipboard(generatedKey)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-slate-400"
                                                        title="Copy Key"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleGenerateKey}
                                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                                        >
                                            Generate New Key
                                        </button>
                                    </div>
                                    {generatedKey && (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm">
                                            <strong>Important:</strong> This key will only be shown once. Please copy and direct save it safely.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Code size={20} /> Widget Embed Code
                                </h2>
                                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                    Add this code to your website's <code>&lt;body&gt;</code> tag.
                                </p>
                                <div className={`relative p-4 rounded-lg font-mono text-xs overflow-x-auto ${isDark ? 'bg-slate-900/80 text-blue-300' : 'bg-gray-900 text-blue-200'}`}>
                                    <pre>{`<script>
  window.QBotConfig = {
    apiKey: "${generatedKey || 'YOUR_API_KEY'}",
    tenantId: "${client.id}",
    theme: {
        primary: "${client.config?.colors?.primary || '#4F46E5'}"
    }
  };
</script>
<script src="https://cdn.qbot.com/widget.js" async></script>`}</pre>
                                    <button
                                        onClick={() => copyToClipboard(`<script>
  window.QBotConfig = {
    apiKey: "${generatedKey || 'YOUR_API_KEY'}",
    tenantId: "${client.id}",
    theme: {
        primary: "${client.config?.colors?.primary || '#4F46E5'}"
    }
  };
</script>
<script src="https://cdn.qbot.com/widget.js" async></script>`)}
                                        className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-white/70 hover:text-white"
                                        title="Copy Code"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* CONVERSATIONS TAB */}
                    {activeTab === 'conversations' && (
                        <div className={cardClass}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <MessageSquare size={20} /> Client Conversations
                                </h2>
                            </div>
                            <ClientConversations clientId={client.id} config={client.config} />
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className={activeTab === 'conversations' ? "hidden" : "space-y-6"}>
                    {/* Quick Stats */}
                    <div className={cardClass}>
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
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={cardClass}>
                        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Quick Links
                        </h3>
                        <div className="space-y-2">
                            <a
                                href={`/${client.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-indigo-400' : 'hover:bg-gray-50 text-indigo-600'}`}
                            >
                                <Globe size={18} /> View Live Chat
                            </a>
                            <a
                                href={`/${client.id}/dashboard`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-indigo-400' : 'hover:bg-gray-50 text-indigo-600'}`}
                            >
                                <LayoutDashboard size={18} /> Open Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
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
                )
            }
        </AdminLayout>
    );
};
