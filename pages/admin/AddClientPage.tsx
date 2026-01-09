import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Check, Building2, Bot, MessageSquare,
    HelpCircle, ClipboardCheck, Plus, X, Sparkles, Wand2, FileText, Upload, AlertCircle
} from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { TenantConfig, DEFAULT_TENANT_CONFIG, Question } from '../../types/config';
import { createClient, ingestDocument } from '../../services/adminService';

const STEPS = [
    { id: 1, title: 'Basic Info', icon: Building2 },
    { id: 2, title: 'Bot Identity', icon: Bot },
    { id: 3, title: 'Welcome Screen', icon: MessageSquare },
    { id: 4, title: 'Knowledge Base', icon: FileText },
    { id: 5, title: 'Qualifications', icon: HelpCircle },
    { id: 6, title: 'Review', icon: ClipboardCheck },
];

export const AddClientPage = () => {
    const navigate = useNavigate();
    const { isDark } = useAdminTheme();
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Form state initialized with default 5 questions
    const [formData, setFormData] = useState<{
        name: string;
        slug: string;
        plan: 'Starter' | 'Pro' | 'Enterprise';
        config: TenantConfig;
    }>({
        name: '',
        slug: '',
        plan: 'Pro',
        config: JSON.parse(JSON.stringify(DEFAULT_TENANT_CONFIG)) // Deep copy
    });

    // New state for two separate greeting fields (Questions #0 and #1)
    const [greetNameInstruction, setGreetNameInstruction] = useState('Hello! I am [Bot Name], the virtual assistant for [Company Name]. Before we proceed, may I have your name?');
    const [collectPhoneInstruction, setCollectPhoneInstruction] = useState('Great! And what\'s the best phone number to reach you?');

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    // Generic config updater
    const updateConfig = (path: string, value: any) => {
        const keys = path.split('.');
        setFormData(prev => {
            const newConfig = { ...prev.config };
            let current: any = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return { ...prev, config: newConfig };
        });
    };

    // --- Feature Tag Handlers ---
    const addFeature = () => {
        const features = [...formData.config.welcome.features, ''];
        updateConfig('welcome.features', features);
    };

    const removeFeature = (index: number) => {
        const features = formData.config.welcome.features.filter((_, i) => i !== index);
        updateConfig('welcome.features', features);
    };

    const updateFeature = (index: number, value: string) => {
        const features = [...formData.config.welcome.features];
        features[index] = value;
        updateConfig('welcome.features', features);
    };

    // --- Lead Question Handlers ---
    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...formData.config.leadQualification.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        updateConfig('leadQualification.questions', newQuestions);
    };

    const addOption = (questionIndex: number) => {
        const newQuestions = [...formData.config.leadQualification.questions];
        const options = newQuestions[questionIndex].options || [];
        newQuestions[questionIndex].options = [...options, ''];
        updateConfig('leadQualification.questions', newQuestions);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const newQuestions = [...formData.config.leadQualification.questions];
        const options = newQuestions[questionIndex].options || [];
        newQuestions[questionIndex].options = options.filter((_, i) => i !== optionIndex);
        updateConfig('leadQualification.questions', newQuestions);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const newQuestions = [...formData.config.leadQualification.questions];
        const options = [...(newQuestions[questionIndex].options || [])];
        options[optionIndex] = value;
        newQuestions[questionIndex].options = options;
        updateConfig('leadQualification.questions', newQuestions);
    };

    // --- Validation ---
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return formData.name.length >= 2 && formData.slug.length >= 2;
            case 2:
                return formData.config.botName.length >= 1;
            case 3:
                return formData.config.welcome.highlightedHeadline.length >= 1;
            case 4:
                // Knowledge Base - Optional for now
                return true;
            case 5:
                // Ensure all 5 questions have at least a label and instruction
                return formData.config.leadQualification.questions.every(q =>
                    q.label.trim().length > 0 && q.instruction.trim().length > 0
                );
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
            setError('');
        } else {
            setError('Please fill in all required fields for this step.');
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    // --- Submission ---
    const handleSubmit = async () => {
        setSaving(true);
        setError('');
        try {
            // Ensure company name syncs if not set
            const finalConfig = {
                ...formData.config,
                companyName: formData.name,
                shortName: formData.config.shortName || formData.name,
                welcome: {
                    ...formData.config.welcome,
                    highlightedHeadline: formData.config.welcome.highlightedHeadline || formData.name
                }
            };

            // Prepend two greeting questions: name collection and phone collection
            const allQuestions = [
                {
                    id: 'q0',
                    label: 'Greet & Collect Name',
                    instruction: greetNameInstruction,
                    collects: ['name'],
                    options: []
                },
                {
                    id: 'q1',
                    label: 'Collect Phone Number',
                    instruction: collectPhoneInstruction,
                    collects: ['phone'],
                    options: []
                },
                ...formData.config.leadQualification.questions
            ];

            const createdClient = await createClient({
                name: formData.name,
                slug: formData.slug,
                plan: formData.plan,
                config: {
                    ...finalConfig,
                    leadQualification: {
                        ...finalConfig.leadQualification,
                        questions: allQuestions
                    }
                }
            });

            // If a file was selected, upload it now using the new tenant ID
            if (selectedFile) {
                try {
                    await ingestDocument(createdClient.id, selectedFile);
                    console.log('📄 Document queued for processing');
                    // Note: Document will be processed asynchronously, may take a few seconds to appear
                } catch (docErr) {
                    console.error('Failed to upload document', docErr);
                    // Show error but don't block navigation - user can upload later
                    setError(`Client created successfully! However, document upload failed. You can upload it from the client detail page.`);
                    setTimeout(() => {
                        navigate('/admin/clients');
                    }, 3000); // Give user time to read the message
                    setSaving(false);
                    return; // Don't navigate immediately
                }
            }

            navigate('/admin/clients');
        } catch (e) {
            setError('Failed to create client. Please try again.');
        }
        setSaving(false);
    };

    // Styling
    const inputClass = `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
        }`;
    const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
    const cardClass = `p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin/clients')}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Add New Client
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Configure a new tenant with 2 greeting fields and 5 dynamic qualification questions
                    </p>
                </div>
            </div>

            {/* Steps Progress */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px]">
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep > step.id
                                    ? 'bg-green-500 text-white'
                                    : currentStep === step.id
                                        ? 'bg-indigo-600 text-white'
                                        : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${currentStep >= step.id
                                    ? (isDark ? 'text-white' : 'text-gray-900')
                                    : (isDark ? 'text-slate-500' : 'text-gray-400')
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded -mt-6 ${currentStep > step.id ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                    {error}
                </div>
            )}

            <div className="mb-8">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <div className={cardClass}>
                        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Company Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                            slug: generateSlug(e.target.value)
                                        }));
                                    }}
                                    className={inputClass}
                                    placeholder="e.g. HealthFirst Clinics"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Short Name</label>
                                <input
                                    type="text"
                                    value={formData.config.shortName}
                                    onChange={(e) => updateConfig('shortName', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. HealthFirst"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>URL Slug *</label>
                                <div className="flex items-center">
                                    <span className={`px-3 py-2.5 border border-r-0 rounded-l-lg text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-gray-100 border-gray-200 text-gray-500'
                                        }`}>
                                        /
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                                        className={`${inputClass} rounded-l-none`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Plan</label>
                                <select
                                    value={formData.plan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value as any }))}
                                    className={inputClass}
                                >
                                    <option value="Starter">Starter</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Bot Identity */}
                {currentStep === 2 && (
                    <div className={cardClass}>
                        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Bot Identity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Bot Name *</label>
                                <input type="text" value={formData.config.botName} onChange={(e) => updateConfig('botName', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Display Name</label>
                                <input type="text" value={formData.config.botDisplayName} onChange={(e) => updateConfig('botDisplayName', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Avatar URL</label>
                                <input type="url" value={formData.config.botAvatar} onChange={(e) => updateConfig('botAvatar', e.target.value)} className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Primary Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={formData.config.colors.primary} onChange={(e) => updateConfig('colors.primary', e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                                        <input type="text" value={formData.config.colors.primary} onChange={(e) => updateConfig('colors.primary', e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Secondary Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={formData.config.colors.secondary} onChange={(e) => updateConfig('colors.secondary', e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                                        <input type="text" value={formData.config.colors.secondary} onChange={(e) => updateConfig('colors.secondary', e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Welcome Screen */}
                {currentStep === 3 && (
                    <div className={cardClass}>
                        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome Screen</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Headline Prefix</label>
                                    <input type="text" value={formData.config.welcome.headline} onChange={(e) => updateConfig('welcome.headline', e.target.value)} className={inputClass} placeholder="Welcome to" />
                                </div>
                                <div>
                                    <label className={labelClass}>Highlighted Headline *</label>
                                    <input type="text" value={formData.config.welcome.highlightedHeadline} onChange={(e) => updateConfig('welcome.highlightedHeadline', e.target.value)} className={inputClass} placeholder="Your Company" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Subheadline</label>
                                <textarea rows={3} value={formData.config.welcome.subheadline} onChange={(e) => updateConfig('welcome.subheadline', e.target.value)} className={inputClass} placeholder="Subtitle text..." />
                            </div>
                            <div>
                                <label className={labelClass}>Start Button Text</label>
                                <input type="text" value={formData.config.welcome.startBtnText} onChange={(e) => updateConfig('welcome.startBtnText', e.target.value)} className={inputClass} />
                            </div>

                            <div>
                                <label className={labelClass}>Key Features/Tags</label>
                                <div className="space-y-3">
                                    {formData.config.welcome.features.map((feature, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => updateFeature(idx, e.target.value)}
                                                className={inputClass}
                                                placeholder={`Feature ${idx + 1}`}
                                            />
                                            <button onClick={() => removeFeature(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded"><X size={18} /></button>
                                        </div>
                                    ))}
                                    <button onClick={addFeature} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                        <Plus size={16} /> Add Feature Tag
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Knowledge Base (RAG Upload) */}
                {currentStep === 4 && (
                    <div className={cardClass}>
                        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Knowledge Base</h2>
                        <div className="space-y-6">
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                                <FileText className="text-blue-500 mt-1" size={20} />
                                <div>
                                    <h3 className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Upload Documents</h3>
                                    <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        Upload a PDF, DOCX, or TXT file to train the bot. This allows the bot to answer questions based on your specific company data.
                                    </p>
                                </div>
                            </div>

                            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${isDark ? 'border-slate-700 hover:border-indigo-500 bg-slate-800/50' : 'border-gray-300 hover:border-indigo-500 bg-gray-50'
                                }`}>
                                <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-700' : 'bg-white shadow-sm'}`}>
                                    <Upload size={32} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
                                </div>
                                <div className="text-center">
                                    <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX, TXT up to 10MB'}
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    id="file-upload"
                                    accept=".pdf,.docx,.txt,.md"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
                                >
                                    {selectedFile ? 'Change File' : 'Select File'}
                                </label>
                                {selectedFile && (
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="mt-3 text-sm text-red-500 hover:underline"
                                    >
                                        Remove file
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Qualifications (The Dynamic Part) */}
                {currentStep === 5 && (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-100'}`}>
                            <Wand2 className="text-indigo-500 mt-1" size={20} />
                            <div>
                                <h3 className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>Dynamic Lead Qualification</h3>
                                <p className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    The bot will first collect the user's name and phone number (2 required fields),
                                    then ask exactly 5 custom qualification questions for this client.
                                    Adding "Quick Reply Options" helps users answer faster.
                                </p>
                            </div>
                        </div>

                        {/* GREETING FIELD 1: Greet & Collect Name (Question 0) */}
                        <div className={cardClass}>
                            <div className="flex items-center gap-3 mb-4 border-b pb-4 border-gray-100 dark:border-slate-700">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-green-500 text-white`}>
                                    0
                                </div>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Greet & Collect Name</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">Required</span>
                            </div>
                            <div className="pl-11">
                                <label className={labelClass}>Greeting Instruction & Name Collection *</label>
                                <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    This is the very first thing the bot will do. It should introduce itself and ask for the user's name.
                                </p>
                                <textarea
                                    value={greetNameInstruction}
                                    onChange={(e) => setGreetNameInstruction(e.target.value)}
                                    className={inputClass}
                                    rows={3}
                                    placeholder="Hello! I am [Bot Name], the virtual assistant for [Company Name]. May I have your name?"
                                />
                            </div>
                        </div>

                        {/* GREETING FIELD 2: Collect Phone Number (Question 1) */}
                        <div className={cardClass}>
                            <div className="flex items-center gap-3 mb-4 border-b pb-4 border-gray-100 dark:border-slate-700">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-green-500 text-white`}>
                                    1
                                </div>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Collect Phone Number</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">Required</span>
                            </div>
                            <div className="pl-11">
                                <label className={labelClass}>Phone Number Collection *</label>
                                <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    After collecting the name, ask for their phone number.
                                </p>
                                <textarea
                                    value={collectPhoneInstruction}
                                    onChange={(e) => setCollectPhoneInstruction(e.target.value)}
                                    className={inputClass}
                                    rows={3}
                                    placeholder="Great! And what's the best phone number to reach you?"
                                />
                            </div>
                        </div>

                        {formData.config.leadQualification.questions.map((question, qIndex) => (
                            <div key={question.id} className={cardClass}>
                                <div className="flex items-center gap-3 mb-4 border-b pb-4 border-gray-100 dark:border-slate-700">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {qIndex + 2}
                                    </div>
                                    <input
                                        type="text"
                                        value={question.label}
                                        onChange={(e) => updateQuestion(qIndex, 'label', e.target.value)}
                                        className={`${inputClass} font-semibold`}
                                        placeholder={`Question ${qIndex + 2} Category (e.g. Budget)`}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-11">
                                    <div>
                                        <label className={labelClass}>AI Instruction (What to ask) *</label>
                                        <textarea
                                            value={question.instruction}
                                            onChange={(e) => updateQuestion(qIndex, 'instruction', e.target.value)}
                                            className={inputClass}
                                            rows={3}
                                            placeholder="Example: Ask the user what their monthly budget is."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Quick Reply Options (Optional)</label>
                                        <div className="space-y-2">
                                            {(question.options || []).map((opt, oIdx) => (
                                                <div key={oIdx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => updateOption(qIndex, oIdx, e.target.value)}
                                                        className={inputClass}
                                                        placeholder={`Option ${oIdx + 1}`}
                                                    />
                                                    <button onClick={() => removeOption(qIndex, oIdx)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => addOption(qIndex)} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>+ Add Option</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 6: Review */}
                {currentStep === 6 && (
                    <div className={cardClass}>
                        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Review & Create</h2>

                        <div className="space-y-6 divide-y divide-gray-100 dark:divide-slate-700">
                            <div className="pt-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Details</h3>
                                <p className={isDark ? 'text-white' : 'text-gray-900'}><strong>{formData.name}</strong> ({formData.plan})</p>
                                <p className={`font-mono text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>/{formData.slug}</p>
                                {selectedFile && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-indigo-500">
                                        <FileText size={16} />
                                        <span>File to ingest: {selectedFile.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Lead Qualification Flow</h3>
                                <div className="space-y-3">
                                    {/* Show the two greeting questions first */}
                                    <div className="flex gap-3">
                                        <span className="font-mono text-gray-400">0.</span>
                                        <div>
                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Greet & Collect Name</p>
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>"{greetNameInstruction}"</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="font-mono text-gray-400">1.</span>
                                        <div>
                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Collect Phone Number</p>
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>"{collectPhoneInstruction}"</p>
                                        </div>
                                    </div>
                                    {/* Show the 5 qualification questions */}
                                    {formData.config.leadQualification.questions.map((q, i) => (
                                        <div key={i} className="flex gap-3">
                                            <span className="font-mono text-gray-400">{i + 2}.</span>
                                            <div>
                                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{q.label}</p>
                                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>"{q.instruction}"</p>
                                                {q.options && q.options.length > 0 && (
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {q.options.map(opt => (
                                                            <span key={opt} className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">{opt}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                {currentStep < 6 ? (
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                    >
                        Next <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg shadow-green-200 dark:shadow-green-900/20"
                    >
                        {saving ? <Sparkles className="animate-spin" size={18} /> : <Check size={18} />}
                        {saving ? 'Creating...' : 'Create Client'}
                    </button>
                )}
            </div>
        </AdminLayout >
    );
};
