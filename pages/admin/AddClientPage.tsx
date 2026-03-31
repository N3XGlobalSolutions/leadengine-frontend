import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Check, Building2, Bot, MessageSquare,
    HelpCircle, ClipboardCheck, Plus, X, Sparkles, Wand2, FileText, Upload, AlertCircle, Trash2, AlertTriangle
} from 'lucide-react';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { TenantConfig, DEFAULT_TENANT_CONFIG, Question } from '../../types/config';
import { createClient, ingestDocument } from '../../services/adminService';
import QuestionMapEditor, { QuestionMapConfig } from '../../components/admin/QuestionMapEditor';

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
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<'S1' | 'S2' | 'S3' | 'S3_MAX' | 'S3_MAPPING' | null>(null);

    // Form state initialized with default 5 questions
    const [formData, setFormData] = useState<{
        name: string;
        slug: string;
        plan: 'S1' | 'S2' | 'S3' | 'S3_MAX' | 'S3_MAPPING';
        config: TenantConfig;
    }>({
        name: '',
        slug: '',
        plan: 'S1',
        config: JSON.parse(JSON.stringify(DEFAULT_TENANT_CONFIG)) // Deep copy
    });

    // S3 Mapping: question map state (separate from S1/S2/S3 leadQualification questions)
    const [questionMapConfig, setQuestionMapConfig] = useState<QuestionMapConfig>({
        question_map: [],
        max_branching_questions: 10,
    });

    // Note: Questions 0-1 (name/phone) are handled by the state machine and should NOT be stored in config

    // Lead Qualification Criteria state
    const [leadQualificationCriteria, setLeadQualificationCriteria] = useState('');

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

    // --- Plan Change Handler ---
    const isS2OrHigher = (plan: string) => plan === 'S2' || plan === 'S3' || plan === 'S3_MAX';
    const MIN_QUESTIONS = 5;
    const MAX_QUESTIONS = 15;

    const handlePlanChange = (newPlan: 'S1' | 'S2' | 'S3' | 'S3_MAX' | 'S3_MAPPING') => {
        const currentQuestionCount = formData.config.leadQualification.questions.length;
        const isDowngrade = isS2OrHigher(formData.plan) && newPlan === 'S1' && currentQuestionCount > 5;

        if (isDowngrade) {
            setPendingPlan(newPlan);
            setShowDowngradeModal(true);
        } else {
            setFormData(prev => ({ ...prev, plan: newPlan }));
        }
    };

    const confirmDowngrade = () => {
        if (!pendingPlan) return;
        const trimmedQuestions = formData.config.leadQualification.questions.slice(0, 5);
        setFormData(prev => ({
            ...prev,
            plan: pendingPlan as 'S1' | 'S2' | 'S3' | 'S3_MAX' | 'S3_MAPPING',
            config: {
                ...prev.config,
                leadQualification: {
                    ...prev.config.leadQualification,
                    questions: trimmedQuestions
                }
            }
        }));
        setShowDowngradeModal(false);
        setPendingPlan(null);
    };

    // --- Add/Remove Question Handlers (S2/S3 only) ---
    const addQuestion = () => {
        const questions = formData.config.leadQualification.questions;
        const limit = (formData.plan === 'S3' || formData.plan === 'S3_MAX') ? 30 : 15;
        if (questions.length >= limit) return;
        const newQ: Question = {
            id: `q${questions.length + 1}`,
            label: '',
            instruction: '',
            collects: [],
            options: []
        };
        updateConfig('leadQualification.questions', [...questions, newQ]);
    };

    const removeQuestion = (index: number) => {
        const questions = formData.config.leadQualification.questions;
        if (questions.length <= MIN_QUESTIONS) return;
        updateConfig('leadQualification.questions', questions.filter((_, i) => i !== index));
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
                // Knowledge Base - LQC is required; Document upload mandatory for S3_MAX
                if (formData.plan === 'S3_MAX' && !selectedFile) return false;
                return leadQualificationCriteria.trim().length > 0;
            case 5:
                // S3_MAX: questions are AI-generated, no manual questions needed
                if (formData.plan === 'S3_MAX') return true;
                // S3_MAPPING: at least 1 mapped question is needed
                if (formData.plan === 'S3_MAPPING') return questionMapConfig.question_map.length >= 1;
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

            // DON'T prepend questions 0-1 - they're handled by the state machine!
            // Only save the actual user-defined qualification questions
            const allQuestions = formData.config.leadQualification.questions;

            const createdClient = await createClient({
                name: formData.name,
                slug: formData.slug,
                plan: formData.plan,
                config: {
                    ...finalConfig,
                    leadQualification: {
                        ...finalConfig.leadQualification,
                        questions: allQuestions
                    },
                    lead_qualification_criteria: leadQualificationCriteria || undefined,
                    // S3 Mapping: attach the question map
                    ...(formData.plan === 'S3_MAPPING' ? {
                        question_map: questionMapConfig.question_map,
                        max_branching_questions: questionMapConfig.max_branching_questions,
                    } : {}),
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
    const inputClass = `w-full px-3 sm:px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
        }`;
    const labelClass = `block text-xs sm:text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
    const cardClass = `p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button
                    onClick={() => navigate('/admin/clients')}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Add New Client
                    </h1>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'} truncate`}>
                        Configure a new tenant with 5 qualification questions (name & phone auto-collected)
                    </p>
                </div>
            </div>

            {/* Steps Progress */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px]">
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center z-10">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep > step.id
                                    ? 'bg-green-500 text-white'
                                    : currentStep === step.id
                                        ? 'bg-indigo-600 text-white'
                                        : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {currentStep > step.id ? <Check size={16} className="sm:w-[18px] sm:h-[18px]" /> : <step.icon size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                </div>
                                <span className={`text-xs mt-1 sm:mt-2 font-medium whitespace-nowrap ${currentStep >= step.id
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
                                    onChange={(e) => handlePlanChange(e.target.value as any)}
                                    className={inputClass}
                                >
                                    <option value="S1">S1 (Starter)</option>
                                    <option value="S2">S2 (Professional)</option>
                                    <option value="S3">S3 (Enterprise)</option>
                                    <option value="S3_MAX">S3 Max (Agentic AI)</option>
                                    <option value="S3_MAPPING">S3 Mapping (Structured + Claude)</option>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className={labelClass}>Primary Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={formData.config.colors.primary} onChange={(e) => updateConfig('colors.primary', e.target.value)} className="h-10 w-10 sm:w-12 rounded cursor-pointer flex-shrink-0" />
                                        <input type="text" value={formData.config.colors.primary} onChange={(e) => updateConfig('colors.primary', e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Secondary Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={formData.config.colors.secondary} onChange={(e) => updateConfig('colors.secondary', e.target.value)} className="h-10 w-10 sm:w-12 rounded cursor-pointer flex-shrink-0" />
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

                            <div className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center transition-colors ${isDark ? 'border-slate-700 hover:border-indigo-500 bg-slate-800/50' : 'border-gray-300 hover:border-indigo-500 bg-gray-50'
                                }`}>
                                <div className={`p-3 sm:p-4 rounded-full mb-3 sm:mb-4 ${isDark ? 'bg-slate-700' : 'bg-white shadow-sm'}`}>
                                    <Upload size={24} className={`${isDark ? 'text-slate-400' : 'text-gray-400'} sm:w-8 sm:h-8`} />
                                </div>
                                <div className="text-center px-2">
                                    <p className={`font-medium mb-1 text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
                                    className="mt-4 sm:mt-6 px-4 sm:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-medium rounded-lg cursor-pointer transition-colors"
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

                            {/* LQC - Lead Qualification Criteria */}
                            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
                                <h3 className={`text-md font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Wand2 size={18} /> LQC - Lead Qualification Criteria
                                </h3>
                                <div className="space-y-3">
                                    <label className={labelClass}>
                                        Qualification Criteria Prompt *
                                    </label>
                                    <textarea
                                        rows={12}
                                        value={leadQualificationCriteria}
                                        onChange={(e) => setLeadQualificationCriteria(e.target.value)}
                                        className={inputClass}
                                        placeholder="Enter or paste your lead qualification criteria prompt here. This can include specific questions, scoring criteria, or guidelines for qualifying leads as warm or cold..."
                                    />
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                        Define the criteria and prompts used to validate and qualify leads. This will help identify warm leads vs cold leads.
                                        {(formData.plan === 'S3' || formData.plan === 'S3_MAX') && <span className="block mt-1 text-indigo-500 font-medium">✨ {formData.plan === 'S3_MAX' ? 'S3 Max Agentic AI active: Questions will be AI-generated from your Knowledge Base and this criteria.' : 'S3 Lead Intelligence active: The AI will use this criteria for deeper analysis.'}</span>}
                                        {formData.plan === 'S3_MAX' && !selectedFile && <span className="block mt-1 text-red-400 font-medium">⚠️ Document upload is required for S3 Max to generate questions.</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            {formData.plan === 'S3_MAX' ? (
                                /* S3 Max: AI-generated questions — no manual editor */
                                <div className={`p-6 rounded-xl border-2 ${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${isDark ? 'bg-emerald-800' : 'bg-emerald-100'}`}>
                                            <Sparkles size={24} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>AI-Generated Questions</h3>
                                            <p className={`text-sm mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                                S3 Max uses <strong>Agentic AI</strong> to dynamically generate qualification questions based on your <strong>Knowledge Base</strong> and <strong>Lead Qualification Criteria (LQC)</strong>.
                                            </p>
                                            <div className={`space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                                <div className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Questions adapt to each lead's responses in real-time</div>
                                                <div className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Strict guardrails: 3–20 questions per session</div>
                                                <div className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Early completion when confidence is high (min 5 questions)</div>
                                                <div className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> AI evaluates lead as Qualified or Disqualified automatically</div>
                                            </div>
                                            <p className={`text-xs mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                No manual questions needed — the AI handles everything. Make sure your Knowledge Base and LQC are well-configured in the previous step.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : formData.plan === 'S3_MAPPING' ? (
                                /* S3 Mapping: structured question map editor */
                                <div className={cardClass}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span style={{ fontSize: '22px' }}>🗺️</span>
                                        <div>
                                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Build Your Question Map</h3>
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                Define up to 20 questions with signal scoring. Claude Haiku handles branching follow-ups after.
                                            </p>
                                        </div>
                                    </div>
                                    <QuestionMapEditor
                                        value={questionMapConfig}
                                        onChange={setQuestionMapConfig}
                                    />
                                    {questionMapConfig.question_map.length === 0 && (
                                        <p className="mt-4 text-sm text-amber-500">⚠️ Add at least 1 question to continue.</p>
                                    )}
                                </div>
                            ) : (
                                /* Standard plans: manual question editor */
                                <>
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-100'}`}>
                            <Wand2 className="text-indigo-500 mt-1" size={20} />
                            <div>
                                <h3 className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>Dynamic Lead Qualification</h3>
                                <p className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    The bot will <strong>automatically collect name and phone</strong> before asking these qualification questions.
                                    {isS2OrHigher(formData.plan)
                                        ? <> You have <strong>{formData.config.leadQualification.questions.length}</strong> of {formData.plan === 'S3' ? 30 : 15} possible questions. Minimum 5 required.</>
                                        : <> Define exactly 5 custom questions below. Adding "Quick Reply Options" helps users answer faster.</>
                                    }
                                </p>
                            </div>
                        </div>



                        {formData.config.leadQualification.questions.map((question, qIndex) => (
                            <div key={question.id} className={cardClass}>
                                <div className="flex items-center gap-3 mb-4 border-b pb-4 border-gray-100 dark:border-slate-700">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {qIndex + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={question.label}
                                        onChange={(e) => updateQuestion(qIndex, 'label', e.target.value)}
                                        className={`${inputClass} font-semibold flex-1`}
                                        placeholder={`Question ${qIndex + 1} Category (e.g. Budget)`}
                                    />
                                    {/* Remove button: only for S2/S3 and only if > 5 questions */}
                                    {isS2OrHigher(formData.plan) && formData.config.leadQualification.questions.length > MIN_QUESTIONS && (
                                        <button
                                            onClick={() => removeQuestion(qIndex)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove question"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pl-0 sm:pl-11">
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

                        {/* Add Question Button (S2/S3 only, max 15/30) */}
                        {(formData.plan === 'S2' || formData.plan === 'S3') && formData.config.leadQualification.questions.length < (formData.plan === 'S3' ? 30 : 15) && (
                            <button
                                onClick={addQuestion}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed font-medium transition-colors ${isDark
                                    ? 'border-indigo-700 text-indigo-400 hover:bg-indigo-900/20'
                                    : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                                    }`}
                            >
                                <Plus size={18} />
                                Add Question ({formData.config.leadQualification.questions.length}/{formData.plan === 'S3' ? 30 : 15})
                            </button>
                        )}
                            </>
                        )}
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
                                {formData.plan === 'S3_MAX' ? (
                                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'} text-sm`}>
                                        ✨ <strong>S3 Max — AI-Generated Questions</strong>: The Agentic AI will automatically generate and ask qualification questions based on your Knowledge Base and LQC criteria. No manual questions needed.
                                    </div>
                                ) : formData.plan === 'S3_MAPPING' ? (
                                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-indigo-900/20 border-indigo-700 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800'} text-sm`}>
                                        <strong>🗺️ S3 Mapping</strong>: {questionMapConfig.question_map.length} mapped question{questionMapConfig.question_map.length !== 1 ? 's' : ''} + {questionMapConfig.max_branching_questions} Claude branching question{questionMapConfig.max_branching_questions !== 1 ? 's' : ''} = <strong>{questionMapConfig.question_map.length + questionMapConfig.max_branching_questions} total max</strong>
                                        {questionMapConfig.question_map.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {questionMapConfig.question_map.slice(0, 5).map((q, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="font-mono text-xs opacity-60">{q.id}</span>
                                                        <span>{q.question || <em>Untitled</em>}</span>
                                                        <span className="ml-auto text-xs opacity-60">{q.quick_replies.length} opts</span>
                                                    </li>
                                                ))}
                                                {questionMapConfig.question_map.length > 5 && (
                                                    <li className="opacity-50 text-xs">...and {questionMapConfig.question_map.length - 5} more</li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <p className={`text-xs mb-3 italic ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            Note: Name and phone are auto-collected by the state machine before these questions.
                                        </p>
                                        <div className="space-y-3">
                                            {formData.config.leadQualification.questions.map((q, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <span className="font-mono text-gray-400">{i + 1}.</span>
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 order-2 sm:order-1 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                {currentStep < 6 ? (
                    <button
                        onClick={handleNext}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 order-1 sm:order-2"
                    >
                        Next <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg shadow-green-200 dark:shadow-green-900/20 order-1 sm:order-2"
                    >
                        {saving ? <Sparkles className="animate-spin" size={18} /> : <Check size={18} />}
                        {saving ? 'Creating...' : 'Create Client'}
                    </button>
                )}
            </div>

            {/* Plan Downgrade Confirmation Modal */}
            {showDowngradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Downgrade Plan?</h3>
                        </div>
                        <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            Switching to <strong>S1</strong> will limit questions to 5. Your extra
                            <strong> {formData.config.leadQualification.questions.length - 5} question(s)</strong> will be permanently deleted.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowDowngradeModal(false); setPendingPlan(null); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDowngrade}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                            >
                                Confirm & Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout >
    );
};
