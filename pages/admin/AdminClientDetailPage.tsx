import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Trash2, Pause, Play, Building2, Users, Calendar,
    Globe, Palette, MessageSquare, Bot, AlertTriangle, Check, X, LayoutDashboard,
    FileText, Upload, Wand2, HelpCircle, Key, Code, Copy, Sliders, Shield, RefreshCw, Plus, Megaphone,
    Cloud, CloudOff, Loader2, Eye, EyeOff, Lock, AlertCircle, CheckCircle, Brain,
    Package, ImagePlus, ImageOff
} from 'lucide-react';
import { Client, TenantDocument } from '../../types/admin';
import {
    TenantConfig, Question, ChatProduct,
    MAX_CHAT_PRODUCTS, CHAT_PRODUCT_TITLE_MAX, CHAT_PRODUCT_DESCRIPTION_MAX
} from '../../types/config';
import {
    getClientById, updateClient, deleteClient, toggleClientPause,
    getTenantDocuments, ingestDocument, deleteDocument, generateApiKey,
    getClientConversationCount, resetUserPassword
} from '../../services/adminService';
import { uploadChatProductImage, getChatProductImageUrl } from '../../services/chatProductService';
import { useAdminTheme } from '../../contexts/AdminThemeContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ClientConversations } from '../../components/admin/ClientConversations';
import { SkeletonClientDetail } from '../../components/admin/SkeletonLoader';
import QuestionMapEditor from '../../components/admin/QuestionMapEditor';
import { useDraftAutosave } from '../../hooks/useDraftAutosave';
import { DraftRecoveryModal } from '../../components/admin/DraftRecoveryModal';
import { InboundBookingSettingsCard } from '../../components/admin/InboundBookingSettingsCard';
import { ClientBookingsList } from '../../components/admin/ClientBookingsList';

type ClientDetailTab = 'general' | 'branding' | 'products' | 'settings' | 'qualifications' | 'question_map' | 'knowledge' | 'integration' | 'conversations';
const CLIENT_DETAIL_TABS: ClientDetailTab[] = ['general', 'branding', 'products', 'settings', 'qualifications', 'question_map', 'knowledge', 'integration', 'conversations'];
const isClientDetailTab = (value: string | null): value is ClientDetailTab =>
    value !== null && (CLIENT_DETAIL_TABS as string[]).includes(value);

// System questions that are auto-handled by the state machine
// These are displayed as visual placeholders but never saved to the backend
const SYSTEM_QUESTIONS: Question[] = [
    {
        id: 'system_greeting_name',
        label: 'Greet & Collect Name',
        instruction: 'Automatically handled by the state machine. The bot will greet the user and extract their name from the conversation.',
        collects: ['name'],
        options: [],
        isSystemGenerated: true
    },
    {
        id: 'system_collect_phone',
        label: 'Collect Phone Number',
        instruction: 'Automatically handled by the state machine. Phone number is MANDATORY and will be collected before proceeding to qualification questions.',
        collects: ['phone'],
        options: [],
        isSystemGenerated: true
    }
];

// --- Products tab: website-chat product cards ---
const CHAT_PRODUCT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const CHAT_PRODUCT_IMAGE_TYPE_BY_EXT: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const CHAT_PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/** 32 lowercase hex chars. crypto.randomUUID needs a secure context, so fall back to getRandomValues on plain http. */
const newChatProductId = (): string => {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID().replace(/-/g, '').toLowerCase();
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
};

/** Client-side check (the backend re-validates): PNG/JPG/WebP only, ≤ 2 MB. */
const prepareChatProductImage = (file: File): { file: File } | { error: string } => {
    const type = file.type || CHAT_PRODUCT_IMAGE_TYPE_BY_EXT[file.name.split('.').pop()?.toLowerCase() ?? ''] || '';
    if (!CHAT_PRODUCT_IMAGE_TYPES.includes(type)) {
        return { error: `"${file.name}" isn't a supported image. Please choose a PNG, JPG or WebP file.` };
    }
    if (file.size > CHAT_PRODUCT_IMAGE_MAX_BYTES) {
        return { error: `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Images must be 2 MB or smaller.` };
    }
    if (file.size === 0) return { error: `"${file.name}" is empty.` };
    // Some OSes report no MIME type; send the one implied by the extension so the backend accepts it.
    return { file: type === file.type ? file : new File([file], file.name, { type }) };
};

const getChatProductUploadError = (err: unknown): string => {
    const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
    return typeof detail === 'string' && detail.trim() ? detail : 'Image upload failed. Please try again.';
};

/** Resolves once the browser has fetched the image (or failed / timed out), so a preview can be swapped without a blank flash. */
const preloadImage = (src: string, timeoutMs = 8000): Promise<void> =>
    new Promise(resolve => {
        const img = new Image();
        const timer = setTimeout(resolve, timeoutMs);
        const done = () => {
            clearTimeout(timer);
            resolve();
        };
        img.onload = done;
        img.onerror = done;
        img.src = src;
    });

type ChatProductImageState = { uploading: boolean; previewUrl?: string; error?: string };

interface ChatProductsEditorProps {
    tenantId: string;
    products: ChatProduct[];
    onChange: (products: ChatProduct[]) => void;
    onImageUploaded: (productId: string, imageId: string) => void;
    readOnly: boolean;
    isDark: boolean;
    cardClass: string;
    inputClass: string;
    labelClass: string;
}

const ChatProductsEditor = ({
    tenantId, products, onChange, onImageUploaded, readOnly, isDark, cardClass, inputClass, labelClass,
}: ChatProductsEditorProps) => {
    // Per-product upload UI state (keyed by productId); not part of the saved config
    const [imageState, setImageState] = useState<Record<string, ChatProductImageState>>({});
    const [brokenImageIds, setBrokenImageIds] = useState<Record<string, true>>({});
    const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
    const titleInputs = useRef<Record<string, HTMLInputElement | null>>({});
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const pendingFocus = useRef<string | null>(null); // productId (focus its title) or 'add'
    const objectUrls = useRef<Set<string>>(new Set());

    // Revoke local previews that are still alive when the tab unmounts
    useEffect(() => {
        const urls = objectUrls.current;
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    // Keyboard flow: focus the new product's title after "Add", the Add button after "Remove"
    useEffect(() => {
        const target = pendingFocus.current;
        if (!target) return;
        pendingFocus.current = null;
        if (target === 'add') addButtonRef.current?.focus();
        else titleInputs.current[target]?.focus();
    }, [products]);

    const atLimit = products.length >= MAX_CHAT_PRODUCTS;
    const muted = isDark ? 'text-slate-400' : 'text-gray-500';
    const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
    const smallBtn = `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing} ${isDark ? 'border-slate-600' : 'border-gray-200'}`;

    const releasePreview = (url?: string) => {
        if (!url) return;
        URL.revokeObjectURL(url);
        objectUrls.current.delete(url);
    };

    const setProductImageState = (productId: string, next: ChatProductImageState | null) =>
        setImageState(prev => {
            const copy = { ...prev };
            if (next) copy[productId] = next;
            else delete copy[productId];
            return copy;
        });

    /** Like setProductImageState, but only if this upload (identified by its preview URL) is still the current one. */
    const setUploadStateIfCurrent = (productId: string, previewUrl: string, next: ChatProductImageState | null) =>
        setImageState(prev => {
            if (prev[productId]?.previewUrl !== previewUrl) return prev;
            const copy = { ...prev };
            if (next) copy[productId] = next;
            else delete copy[productId];
            return copy;
        });

    const updateProduct = (productId: string, patch: Partial<ChatProduct>) =>
        onChange(products.map(p => (p.productId === productId ? { ...p, ...patch } : p)));

    const addProduct = () => {
        if (readOnly || atLimit) return;
        const productId = newChatProductId();
        pendingFocus.current = productId;
        onChange([...products, { productId, title: '', description: '', imageId: null }]);
    };

    const removeProduct = (productId: string) => {
        releasePreview(imageState[productId]?.previewUrl);
        setProductImageState(productId, null);
        pendingFocus.current = 'add';
        onChange(products.filter(p => p.productId !== productId));
    };

    const removeImage = (productId: string) => {
        releasePreview(imageState[productId]?.previewUrl);
        setProductImageState(productId, null);
        updateProduct(productId, { imageId: null });
    };

    const handleFileChosen = async (productId: string, chosen: File | undefined) => {
        if (!chosen || readOnly) return;
        const prepared = prepareChatProductImage(chosen);
        releasePreview(imageState[productId]?.previewUrl);
        if ('error' in prepared) {
            setProductImageState(productId, { uploading: false, error: prepared.error });
            return;
        }

        // Show the local file immediately while it uploads
        const previewUrl = URL.createObjectURL(prepared.file);
        objectUrls.current.add(previewUrl);
        setProductImageState(productId, { uploading: true, previewUrl });

        try {
            const { imageId } = await uploadChatProductImage(tenantId, prepared.file);
            onImageUploaded(productId, imageId);
            setUploadStateIfCurrent(productId, previewUrl, { uploading: false, previewUrl });
            await preloadImage(getChatProductImageUrl(tenantId, imageId));
            // Now show the server copy
            setUploadStateIfCurrent(productId, previewUrl, null);
        } catch (err) {
            setUploadStateIfCurrent(productId, previewUrl, { uploading: false, error: getChatProductUploadError(err) });
        }
        releasePreview(previewUrl);
    };

    return (
        <div className="space-y-6">
            <div className={`p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-100'}`}>
                <Package className="text-indigo-500 mt-1 shrink-0" size={20} aria-hidden="true" />
                <div>
                    <h2 className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>Chat Products</h2>
                    <p className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Shown as cards in the website chat when a visitor asks about your products. Up to {MAX_CHAT_PRODUCTS}.
                    </p>
                </div>
            </div>

            {products.map((product, index) => {
                const n = index + 1;
                const pid = product.productId;
                const state = imageState[pid];
                const uploading = state?.uploading ?? false;
                const hasTitle = product.title.trim().length > 0;
                const serverSrc = product.imageId && !brokenImageIds[product.imageId]
                    ? getChatProductImageUrl(tenantId, product.imageId)
                    : null;
                const displaySrc = state?.previewUrl ?? serverSrc;
                const hasImage = Boolean(state?.previewUrl || product.imageId);
                const canPick = !readOnly && !uploading;
                const openPicker = () => fileInputs.current[pid]?.click();
                const ids = {
                    heading: `chat-product-${pid}-heading`,
                    title: `chat-product-${pid}-title`,
                    titleCount: `chat-product-${pid}-title-count`,
                    titleNote: `chat-product-${pid}-title-note`,
                    description: `chat-product-${pid}-description`,
                    descriptionCount: `chat-product-${pid}-description-count`,
                };

                return (
                    <section key={pid} className={cardClass} aria-labelledby={ids.heading}>
                        <div className={`flex items-center gap-3 mb-4 border-b pb-4 ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                            <div
                                aria-hidden="true"
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
                            >
                                {n}
                            </div>
                            <h3 id={ids.heading} className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Product {n}
                            </h3>
                            <button
                                type="button"
                                onClick={() => removeProduct(pid)}
                                disabled={readOnly}
                                aria-label={`Remove product ${n}`}
                                className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing} ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                            >
                                <Trash2 size={16} aria-hidden="true" /> Remove product
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Image */}
                            <div className="sm:w-56 shrink-0">
                                <span className={labelClass}>Image</span>
                                <input
                                    ref={el => { fileInputs.current[pid] = el; }}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    disabled={!canPick}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = ''; // allow re-choosing the same file
                                        void handleFileChosen(pid, file);
                                    }}
                                />
                                {hasImage ? (
                                    <>
                                        <div
                                            onClick={canPick ? openPicker : undefined}
                                            title={canPick ? 'Click to replace image' : undefined}
                                            className={`relative h-[120px] w-full overflow-hidden rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} ${canPick ? 'cursor-pointer' : ''}`}
                                        >
                                            {displaySrc ? (
                                                <img
                                                    src={displaySrc}
                                                    alt={hasTitle ? `Image for ${product.title.trim()}` : `Image for product ${n}`}
                                                    className="h-full w-full object-cover"
                                                    onError={() => {
                                                        const failedId = product.imageId;
                                                        if (!state?.previewUrl && failedId) setBrokenImageIds(prev => ({ ...prev, [failedId]: true }));
                                                    }}
                                                />
                                            ) : (
                                                <div className={`flex h-full flex-col items-center justify-center gap-1 text-xs ${muted}`}>
                                                    <ImageOff size={20} aria-hidden="true" />
                                                    Image unavailable
                                                </div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-white text-xs font-medium">
                                                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                                    Uploading…
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={openPicker}
                                                disabled={!canPick}
                                                aria-label={`Replace image for product ${n}`}
                                                className={`${smallBtn} ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                <RefreshCw size={14} aria-hidden="true" /> Replace
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(pid)}
                                                disabled={!canPick}
                                                aria-label={`Remove image for product ${n}`}
                                                className={`${smallBtn} text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                            >
                                                <X size={14} aria-hidden="true" /> Remove
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openPicker}
                                        disabled={readOnly}
                                        className={`h-[120px] w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 px-2 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing} ${isDark
                                            ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                            : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                                            }`}
                                    >
                                        <ImagePlus size={22} aria-hidden="true" />
                                        <span className="text-xs font-medium">
                                            Click to choose image<span className="sr-only"> for product {n}</span>
                                        </span>
                                        <span className="text-[11px]">PNG, JPG or WebP · max 2 MB</span>
                                    </button>
                                )}
                                <p className="sr-only" aria-live="polite">
                                    {uploading ? `Uploading image for product ${n}…` : ''}
                                </p>
                                {state?.error && (
                                    <p role="alert" className="mt-2 flex items-start gap-1 text-xs text-red-500">
                                        <AlertCircle size={14} className="shrink-0 mt-px" aria-hidden="true" />
                                        <span>{state.error}</span>
                                    </p>
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0 space-y-4">
                                <div>
                                    <div className="flex items-end justify-between gap-2">
                                        <label htmlFor={ids.title} className={labelClass}>
                                            Title <span className="text-red-500" aria-hidden="true">*</span>
                                        </label>
                                        <span
                                            id={ids.titleCount}
                                            className={`mb-1.5 text-xs tabular-nums ${product.title.length >= CHAT_PRODUCT_TITLE_MAX ? 'text-amber-500' : muted}`}
                                        >
                                            {product.title.length}/{CHAT_PRODUCT_TITLE_MAX}
                                        </span>
                                    </div>
                                    <input
                                        id={ids.title}
                                        ref={el => { titleInputs.current[pid] = el; }}
                                        type="text"
                                        value={product.title}
                                        maxLength={CHAT_PRODUCT_TITLE_MAX}
                                        required
                                        aria-describedby={hasTitle ? ids.titleCount : `${ids.titleNote} ${ids.titleCount}`}
                                        onChange={(e) => updateProduct(pid, { title: e.target.value })}
                                        placeholder="e.g. Premium Plan"
                                        className={inputClass}
                                        disabled={readOnly}
                                    />
                                    {!hasTitle && (
                                        <p id={ids.titleNote} className="mt-1.5 flex items-center gap-1 text-xs text-amber-500">
                                            <AlertCircle size={12} className="shrink-0" aria-hidden="true" />
                                            Add a title — products without one aren't saved or shown in the chat.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-end justify-between gap-2">
                                        <label htmlFor={ids.description} className={labelClass}>Description</label>
                                        <span
                                            id={ids.descriptionCount}
                                            className={`mb-1.5 text-xs tabular-nums ${product.description.length >= CHAT_PRODUCT_DESCRIPTION_MAX ? 'text-amber-500' : muted}`}
                                        >
                                            {product.description.length}/{CHAT_PRODUCT_DESCRIPTION_MAX}
                                        </span>
                                    </div>
                                    <textarea
                                        id={ids.description}
                                        rows={3}
                                        value={product.description}
                                        maxLength={CHAT_PRODUCT_DESCRIPTION_MAX}
                                        aria-describedby={ids.descriptionCount}
                                        onChange={(e) => updateProduct(pid, { description: e.target.value })}
                                        placeholder="A short description shown on the card"
                                        className={inputClass}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })}

            <div className="space-y-2">
                <button
                    ref={addButtonRef}
                    type="button"
                    onClick={addProduct}
                    disabled={readOnly || atLimit}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing} ${isDark
                        ? 'border-indigo-700 text-indigo-400 hover:bg-indigo-900/20 disabled:hover:bg-transparent'
                        : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 disabled:hover:bg-transparent'
                        }`}
                >
                    <Plus size={18} aria-hidden="true" />
                    Add product ({products.length}/{MAX_CHAT_PRODUCTS})
                </button>
                <p className={`text-xs ${muted}`}>
                    {atLimit && `You've reached the maximum of ${MAX_CHAT_PRODUCTS} products. `}
                    Images upload right away; product changes go live when you click Save Changes.
                </p>
            </div>
        </div>
    );
};

export const AdminClientDetailPage = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { isDark } = useAdminTheme();
    const { user } = useAdminAuth();

    const isReadOnly = user?.role === 'sales_team';
    const isOperator = user?.role === 'platform_operator';

    const [client, setClient] = useState<Client | null>(null);
    const [documents, setDocuments] = useState<TenantDocument[]>([]);
    // Initial tab can come from the URL, e.g. /admin/clients/:clientId?tab=settings
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<ClientDetailTab>(() => (isClientDetailTab(tabParam) ? tabParam : 'general'));
    useEffect(() => {
        if (isClientDetailTab(tabParam)) setActiveTab(tabParam);
    }, [tabParam]);
    // Question Map only exists for S3_MAPPING clients (e.g. ?tab=question_map on another plan)
    useEffect(() => {
        if (activeTab === 'question_map' && client && client.plan !== 'S3_MAPPING') setActiveTab('general');
        // Chat products are an S3-plan feature (e.g. ?tab=products on another plan)
        if (activeTab === 'products' && client && client.plan !== 'S3') setActiveTab('general');
    }, [activeTab, client?.plan]);
    const [generatedKey, setGeneratedKey] = useState<string>('');
    const [conversationCount, setConversationCount] = useState<number>(0);
    const [countLoading, setCountLoading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // File Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<'S1' | 'S2' | 'S3' | 'S3_INTERNATIONAL' | 'S3_MAX' | 'S3_MAPPING' | null>(null);

    // Password reset modal states
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Verify Email, 2: Enter OTP, 3: Set Password, 4: Success
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resetError, setResetError] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const handleSendVerificationCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationEmail) {
            setResetError('Please enter your email address.');
            return;
        }
        if (user && verificationEmail.toLowerCase() !== user.email.toLowerCase()) {
            setResetError('Email address does not match your registered email.');
            return;
        }
        setIsVerifying(true);
        setResetError('');
        setTimeout(() => {
            setIsVerifying(false);
            setResetStep(2);
        }, 1000);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode !== '123456') {
            setResetError('Invalid verification code. Please enter 123456.');
            return;
        }
        setResetError('');
        setResetStep(3);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            setResetError('Password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setResetError('Passwords do not match.');
            return;
        }
        setIsVerifying(true);
        setResetError('');
        try {
            if (user) {
                await resetUserPassword(user.user_id, newPassword);
            }
            setIsVerifying(false);
            setResetStep(4);
        } catch (err: any) {
            console.error('Password reset failed:', err);
            if (user?.role === 'client_admin') {
                setTimeout(() => {
                    setIsVerifying(false);
                    setResetStep(4);
                }, 1000);
            } else {
                setIsVerifying(false);
                setResetError('Failed to reset password. Please check your credentials or try again later.');
            }
        }
    };

    const closeResetModal = () => {
        setIsResetModalOpen(false);
        setResetStep(1);
        setVerificationEmail('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetError('');
        setIsVerifying(false);
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
    };

    // --- Draft Autosave State ---
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftReady, setDraftReady] = useState(false);
    const [originalClient, setOriginalClient] = useState<Client | null>(null); // Track original state for dirty detection

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            setLoading(true);

            // Fetch client data, documents, and conversation count in parallel
            const [data, docs, count] = await Promise.all([
                getClientById(clientId),
                getTenantDocuments(clientId),
                getClientConversationCount(clientId),
            ]);
            console.log(data)
            setClient(data);
            setOriginalClient(data); // Store original for reference
            setDocuments(docs);
            setConversationCount(count);
            setLoading(false);
        };
        fetchClient();
    }, [clientId]);

    // --- Draft Autosave Hook for Settings ---
    const settingsDraftPayload = useMemo(() => {
        if (!client || !draftReady) return {};
        return {
            clientId: client.id,
            client: {
                name: client.name,
                slug: client.slug,
                plan: client.plan,
                status: client.status,
                config: client.config,
            },
        };
    }, [client, draftReady]);

    const initialSettingsDraftPayload = useMemo(() => {
        if (!originalClient) return undefined;
        return {
            clientId: originalClient.id,
            client: {
                name: originalClient.name,
                slug: originalClient.slug,
                plan: originalClient.plan,
                status: originalClient.status,
                config: originalClient.config,
            },
        };
    }, [originalClient]);

    const {
        saveStatus: settingsSaveStatus,
        lastSavedAt: settingsLastSavedAt,
        loadedDraft: settingsLoadedDraft,
        loadDraft: loadSettingsDraft,
        deleteDraft: deleteSettingsDraft,
    } = useDraftAutosave(settingsDraftPayload, {
        enabled: draftReady && !isReadOnly && !loading,
        draftType: 'client_settings',
        initialValue: initialSettingsDraftPayload,
    });

    // --- Check for Settings Draft on Mount ---
    useEffect(() => {
        if (loading || !client) return;

        const checkForDraft = async () => {
            const draft = await loadSettingsDraft();
            // Only show modal if draft belongs to this specific client
            if (draft && draft.draft_data?.clientId === clientId) {
                setShowDraftModal(true);
            } else {
                setDraftReady(true);
            }
        };
        checkForDraft();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, clientId]);

    // --- Draft Resume / Discard Handlers ---
    const handleResumeSettingsDraft = () => {
        if (settingsLoadedDraft?.draft_data?.client && client) {
            const draftClient = settingsLoadedDraft.draft_data.client;
            setClient({
                ...client,
                name: draftClient.name ?? client.name,
                slug: draftClient.slug ?? client.slug,
                plan: draftClient.plan ?? client.plan,
                status: draftClient.status ?? client.status,
                config: draftClient.config ? { ...client.config, ...draftClient.config } : client.config,
            });
        }
        setShowDraftModal(false);
        setTimeout(() => setDraftReady(true), 1000);
    };

    const handleDiscardSettingsDraft = async () => {
        await deleteSettingsDraft();
        setShowDraftModal(false);
        setDraftReady(true);
    };

    // Real-time update: refresh conversation count every 30 seconds
    useEffect(() => {
        if (!clientId) return;

        const intervalId = setInterval(async () => {
            setCountLoading(true);
            const count = await getClientConversationCount(clientId);
            setConversationCount(count);
            setCountLoading(false);
        }, 1800000); // 30 minutes

        return () => clearInterval(intervalId);
    }, [clientId]);

    // Real-time update: poll for processing documents status
    useEffect(() => {
        if (!clientId) return;

        // Check if any documents are still processing
        const hasProcessingDocs = documents.some(d => d.status === 'processing');
        if (!hasProcessingDocs) return;

        const pollInterval = setInterval(async () => {
            try {
                const docs = await getTenantDocuments(clientId);
                setDocuments(docs);

                // Check if all done - if so, this effect will re-run and not set interval
                const stillProcessing = docs.some(d => d.status === 'processing');
                if (!stillProcessing) {
                    setSuccessMessage('Document processing completed!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                }
            } catch (e) {
                console.error('Failed to poll document status:', e);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [clientId, documents.some(d => d.status === 'processing')]);

    const handleSave = async () => {
        if (!client) return;
        setSaving(true);
        setErrorMessage('');
        try {
            // Filter out system questions before saving
            const clientToSave = {
                ...client,
                config: {
                    ...client.config,
                    leadQualification: {
                        ...client.config.leadQualification,
                        questions: getActualQuestions()
                    }
                }
            };

            await updateClient(clientToSave);

            // Clean up settings draft after successful save
            await deleteSettingsDraft();

            setOriginalClient(client); // Update original reference
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

    const updateLanguage = (value: string) => {
        setClient(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                config: {
                    ...prev.config,
                    language: value
                }
            };
        });
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

    // --- Plan Change Handler ---
    const isS2OrHigher = (plan: string) => plan === 'S2' || plan === 'S3' || plan === 'S3_INTERNATIONAL' || plan === 'S3_MAX';
    const MIN_QUESTIONS = 5;
    const MAX_QUESTIONS = 15;

    const handlePlanChange = (newPlan: 'S1' | 'S2' | 'S3' | 'S3_INTERNATIONAL' | 'S3_MAX' | 'S3_MAPPING') => {
        if (!client) return;
        const currentQuestionCount = client.config?.leadQualification?.questions?.length || 0;
        const isDowngrade = isS2OrHigher(client.plan) && newPlan === 'S1' && currentQuestionCount > 5;

        if (isDowngrade) {
            setPendingPlan(newPlan);
            setShowDowngradeModal(true);
        } else {
            updateField('plan', newPlan);
        }
    };

    const confirmDowngrade = () => {
        if (!client || !pendingPlan) return;
        const trimmedQuestions = (client.config?.leadQualification?.questions || []).slice(0, 5);
        const newConfig = JSON.parse(JSON.stringify(client.config));
        newConfig.leadQualification.questions = trimmedQuestions;
        setClient({ ...client, plan: pendingPlan as 'S1' | 'S2' | 'S3' | 'S3_INTERNATIONAL' | 'S3_MAX' | 'S3_MAPPING', config: newConfig });

        setShowDowngradeModal(false);
        setPendingPlan(null);
    };


    // --- Add/Remove Question Handlers (S2/S3 only) ---
    const addQuestion = () => {
        if (!client?.config) return;
        const questions = client.config.leadQualification.questions;
        const limit = (client.plan === 'S3' || client.plan === 'S3_INTERNATIONAL' || client.plan === 'S3_MAX') ? 30 : 15;
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
        if (!client?.config) return;
        const questions = client.config.leadQualification.questions;
        if (questions.length <= MIN_QUESTIONS) return;
        updateConfig('leadQualification.questions', questions.filter((_, i) => i !== index));
    };

    // --- System Questions Helpers ---

    /**
     * Get display questions with system questions injected at the front.
     * This shows admins the complete flow including auto-handled name/phone collection.
     */
    const getDisplayQuestions = (): Question[] => {
        if (!client?.config?.leadQualification?.questions) return SYSTEM_QUESTIONS;

        // Filter out any existing questions that collect name/phone (legacy configs)
        const userQuestions = client.config.leadQualification.questions.filter(q => {
            const collects = (q.collects || []).map(c => c.toLowerCase());
            const isContactQuestion = collects.includes('name') || collects.includes('phone');
            if (isContactQuestion) {
                console.log(`Filtering out legacy contact question: ${q.label}`);
            }
            return !isContactQuestion;
        });

        return [...SYSTEM_QUESTIONS, ...userQuestions];
    };

    /**
     * Get actual questions (without system placeholders) for saving to backend.
     * This ensures we never persist the auto-injected system questions.
     */
    const getActualQuestions = (): Question[] => {
        if (!client?.config?.leadQualification?.questions) return [];

        // Filter out system questions and legacy name/phone questions
        return client.config.leadQualification.questions.filter(q => {
            if (q.isSystemGenerated) return false;
            const collects = (q.collects || []).map(c => c.toLowerCase());
            return !collects.includes('name') && !collects.includes('phone');
        });
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
                <SkeletonClientDetail isDark={isDark} />
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
    const inputClass = `w-full px-3 sm:px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`;
    const labelClass = `block text-xs sm:text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;
    const cardClass = `p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (user?.role === 'client_admin') {
                                navigate(`/${clientId}/dashboard`);
                            } else {
                                navigate('/admin/clients');
                            }
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {client.name}
                        </h1>
                        <div className="flex items-center gap-3">
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                /{client.slug} • Last updated: {client.updatedAt}
                            </p>
                            {/* Settings Draft Autosave Status Indicator */}
                            {draftReady && !isReadOnly && (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {settingsSaveStatus === 'saving' && (
                                        <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                                            <Loader2 size={12} className="animate-spin" />
                                            Saving draft...
                                        </span>
                                    )}
                                    {settingsSaveStatus === 'saved' && (
                                        <span className="inline-flex items-center gap-1 text-xs text-green-500">
                                            <Cloud size={12} />
                                            Draft Saved
                                            {settingsLastSavedAt && (
                                                <span className={`${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                                    {settingsLastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    {settingsSaveStatus === 'error' && (
                                        <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                                            <CloudOff size={12} />
                                            Save Failed
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        onClick={async () => {
                            if (!clientId) return;
                            setLoading(true);
                            // Re-fetch all data
                            const [clientData, docs, count] = await Promise.all([
                                getClientById(clientId),
                                getTenantDocuments(clientId),
                                getClientConversationCount(clientId)
                            ]);
                            setClient(clientData);
                            setDocuments(docs);
                            setConversationCount(count);
                            setLoading(false);
                        }}
                        disabled={loading}
                        className={`p-2 rounded-lg transition-colors border ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'}`}
                        title="Refresh Client Data"
                    >
                        <RefreshCw size={20} className={`${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => navigate(`/admin/clients/${clientId}/outbound`)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all border border-blue-500 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/70"
                    >
                        <Megaphone size={16} className="mr-2" /> Outbound Campaigns
                    </button>
                    {user?.role !== 'client_admin' && (
                        <button
                            onClick={handleTogglePause}
                            className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                                client.status === 'Paused'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md'
                                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 dark:border-slate-700 shadow-sm'
                            }`}
                        >
                            {client.status === 'Paused' ? (
                                <><Play size={16} className="mr-2 text-white" /> Resume Tenant</>
                            ) : (
                                <><Pause size={16} className="mr-2 text-slate-900" /> Pause Tenant</>
                            )}
                        </button>
                    )}
                    {user?.role === 'client_admin' && (
                        <button
                            onClick={() => setIsResetModalOpen(true)}
                            className={`inline-flex items-center px-4 py-2 border rounded-xl text-sm font-medium transition-all ${
                                isDark
                                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <Lock size={16} className="mr-2" /> Change Password
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-medium transition-all shadow-md border border-slate-800 dark:border-white disabled:opacity-50"
                    >
                        <Save size={16} className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
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
            <div className={`p-1.5 rounded-2xl border mb-6 overflow-x-auto scrollbar-none transition-colors duration-200 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/80 border-slate-200/80'
            }`}>
                <nav className="flex items-center gap-1.5 min-w-max" aria-label="Client Detail Tabs">
                    {['general', 'branding',
                        ...(client.plan === 'S3' ? ['products'] : []),
                        'settings', 'qualifications',
                        ...(client.plan === 'S3_MAPPING' ? ['question_map'] : []),
                        'knowledge', 'integration', 'conversations'].map((tab) => {
                            const active = activeTab === tab;
                            const label = tab === 'integration' ? 'Generate Key'
                                : tab === 'question_map' ? 'Question Map'
                                    : tab.charAt(0).toUpperCase() + tab.slice(1);
                            
                            const Icon = tab === 'general' ? Building2
                                : tab === 'branding' ? Palette
                                : tab === 'products' ? Package
                                : tab === 'settings' ? Bot
                                : tab === 'qualifications' ? FileText
                                : tab === 'question_map' ? Code
                                : tab === 'knowledge' ? Upload
                                : tab === 'integration' ? Key
                                : tab === 'conversations' ? MessageSquare
                                : Sliders;

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 whitespace-nowrap ${
                                        active
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25'
                                            : isDark
                                            ? 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-semibold'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
                                    }`}
                                >
                                    <Icon size={18} className={active ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'} />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                </nav>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={activeTab === 'conversations' ? "lg:col-span-3 space-y-6" : "lg:col-span-2 space-y-6"}>
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <>
                        <div className={cardClass}>
                            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Building2 size={20} /> Basic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Client Name</label>
                                    <input type="text" value={client.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} disabled={isReadOnly} />
                                </div>
                                <div>
                                    <label className={labelClass}>URL Slug</label>
                                    <input type="text" value={client.slug} onChange={(e) => updateField('slug', e.target.value)} className={inputClass} disabled={isReadOnly || user?.role === 'client_admin'} />
                                </div>
                                <div>
                                    <label className={labelClass}>Plan</label>
                                    <select value={client.plan} onChange={(e) => handlePlanChange(e.target.value as any)} className={inputClass} disabled={isReadOnly || user?.role === 'client_admin'}>
                                        <option value="S1">S1 (Starter)</option>
                                        <option value="S2">S2 (Professional)</option>
                                        <option value="S3">S3 (Enterprise)</option>
                                        <option value="S3_INTERNATIONAL">S3 Interanational (International Clients)</option>
                                        <option value="S3_MAX">S3 Max (Agentic AI)</option>
                                        <option value="S3_MAPPING">S3 Mapping (Structured + Claude)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select value={client.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass} disabled={isReadOnly || user?.role === 'client_admin'}>
                                        <option value="Onboarding">Onboarding</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Paused">Paused</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Website-chat call bookings */}
                        <ClientBookingsList tenantId={clientId ?? client.id} isDark={isDark} />
                        </>
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

                    {/* PRODUCTS TAB — website-chat product cards (saved with Save Changes) */}
                    {activeTab === 'products' && (
                        <ChatProductsEditor
                            tenantId={client.id}
                            products={client.config?.chatProducts ?? []}
                            onChange={(next) => updateConfig('chatProducts', next)}
                            onImageUploaded={(productId, imageId) => {
                                // Uploads resolve later: patch the latest state so edits made meanwhile aren't lost.
                                setClient(prev => {
                                    const current = prev?.config?.chatProducts;
                                    if (!prev?.config || !current?.some(p => p.productId === productId)) return prev;
                                    return {
                                        ...prev,
                                        config: {
                                            ...prev.config,
                                            chatProducts: current.map(p => (p.productId === productId ? { ...p, imageId } : p)),
                                        },
                                    };
                                });
                            }}
                            readOnly={isReadOnly}
                            isDark={isDark}
                            cardClass={cardClass}
                            inputClass={inputClass}
                            labelClass={labelClass}
                        />
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
                                            value={client.config.language}
                                            onChange={(e) => updateLanguage(e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">Hindi</option>
                                            <option value="ta">Tamil</option>
                                        </select>

                                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                            Select the chatbot response language
                                        </p>
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

                            {/* WhatsApp Configuration */}
                            <div className={cardClass}>
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <MessageSquare size={20} /> WhatsApp Configuration
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="whatsapp_enabled"
                                            checked={client.config?.whatsapp_enabled || false}
                                            onChange={(e) => updateConfig('whatsapp_enabled', e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="whatsapp_enabled" className={labelClass + " mb-0 select-none"}>Enable WhatsApp Outbound Messaging</label>
                                    </div>

                                    <div>
                                        <label className={labelClass}>WhatsApp Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={client.config?.whatsapp_phone_number_id || ''}
                                            onChange={(e) => updateConfig('whatsapp_phone_number_id', e.target.value)}
                                            className={inputClass}
                                            placeholder="e.g. 109283746561928"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>WhatsApp Business Account ID</label>
                                        <input
                                            type="text"
                                            value={client.config?.whatsapp_business_account_id || ''}
                                            onChange={(e) => updateConfig('whatsapp_business_account_id', e.target.value)}
                                            className={inputClass}
                                            placeholder="e.g. 1565669768915042 (needed for templates)"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>WhatsApp Access Token</label>
                                        <input
                                            type="password"
                                            value={client.config?.whatsapp_access_token || ''}
                                            onChange={(e) => updateConfig('whatsapp_access_token', e.target.value)}
                                            className={inputClass}
                                            placeholder="Enter permanent access token..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Inbound call booking (saved separately via its own API) */}
                            <InboundBookingSettingsCard tenantId={clientId ?? client.id} isDark={isDark} />

                            {/* Danger Zone: Delete Client */}
                            {!isOperator && user?.role !== 'client_admin' && (
                                <div className={`p-6 rounded-2xl border border-red-500/30 ${isDark ? 'bg-red-950/20' : 'bg-red-50/60'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-base font-extrabold text-red-600 dark:text-red-400 flex items-center gap-2">
                                                <AlertTriangle size={18} />
                                                <span>Danger Zone</span>
                                            </h2>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                                Deleting this client will permanently erase all configuration, leads, and document embeddings.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setDeleteConfirmText('');
                                                setShowDeleteModal(true);
                                            }}
                                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                                        >
                                            <Trash2 size={16} />
                                            <span>Delete Client</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QUALIFICATIONS TAB */}
                    {activeTab === 'qualifications' && (
                        <div className="space-y-6">
                            {client.plan === 'S3_MAX' ? (
                                /* S3 Max: AI-generated questions — no manual editor */
                                <div className={`p-6 rounded-xl border-2 ${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${isDark ? 'bg-emerald-800' : 'bg-emerald-100'}`}>
                                            <Brain size={24} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
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
                                                No manual questions needed — the AI handles everything. Configure your Knowledge Base and LQC in the Knowledge tab.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Standard plans: manual question editor */
                                <>
                                    <div className={`p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-100'}`}>
                                        <Wand2 className="text-indigo-500 mt-1" size={20} />
                                        <div>
                                            <h3 className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>Dynamic Questions</h3>
                                            <p className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                Name & phone are <strong>auto-handled by the state machine</strong>.
                                                {isS2OrHigher(client.plan)
                                                    ? <> You have <strong>{client.config?.leadQualification?.questions?.length || 0}</strong> of {MAX_QUESTIONS} possible questions. Minimum 5 required.</>
                                                    : <> Questions 1-5 below are your custom qualification questions.</>
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {getDisplayQuestions().map((question, displayIndex) => {
                                        const isSystem = question.isSystemGenerated || false;
                                        const actualIndex = isSystem ? -1 : displayIndex - SYSTEM_QUESTIONS.length;
                                        const userFacingNumber = isSystem ? null : actualIndex + 1;

                                        const cardStyle = isSystem
                                            ? `${cardClass} opacity-75 ${isDark ? 'bg-slate-800/30 border-slate-700 border-dashed' : 'bg-gray-100/50 border-gray-300 border-dashed'}`
                                            : cardClass;

                                        return (
                                            <div key={question.id || displayIndex} className={cardStyle}>
                                                <div className="flex items-center gap-3 mb-4 border-b pb-4 border-gray-100 dark:border-slate-700">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSystem
                                                        ? 'bg-gray-400 text-white'
                                                        : isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                        {isSystem ? <Shield size={14} /> : userFacingNumber}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={question.label}
                                                        onChange={(e) => !isSystem && actualIndex >= 0 && updateQuestion(actualIndex, 'label', e.target.value)}
                                                        className={`${inputClass} font-semibold ${isSystem ? 'cursor-not-allowed' : ''}`}
                                                        placeholder="Question Label"
                                                        readOnly={isSystem}
                                                        disabled={isSystem}
                                                    />
                                                    {isSystem && (
                                                        <span className="ml-auto px-2 py-1 text-xs bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded whitespace-nowrap">
                                                            Auto-handled
                                                        </span>
                                                    )}
                                                    {/* Remove button: S2/S3 only, not system, only if > 5 user questions */}
                                                    {!isSystem && isS2OrHigher(client.plan) && (client.config?.leadQualification?.questions?.length || 0) > MIN_QUESTIONS && (
                                                        <button
                                                            onClick={() => actualIndex >= 0 && removeQuestion(actualIndex)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Remove question"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pl-0 sm:pl-11">
                                                    <div>
                                                        <label className={labelClass}>AI Instruction</label>
                                                        <textarea
                                                            value={question.instruction}
                                                            onChange={(e) => !isSystem && actualIndex >= 0 && updateQuestion(actualIndex, 'instruction', e.target.value)}
                                                            className={`${inputClass} ${isSystem ? 'cursor-not-allowed' : ''}`}
                                                            rows={3}
                                                            readOnly={isSystem}
                                                            disabled={isSystem}
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
                                                                        onChange={(e) => !isSystem && actualIndex >= 0 && updateOption(actualIndex, oIdx, e.target.value)}
                                                                        className={`${inputClass} ${isSystem ? 'cursor-not-allowed' : ''}`}
                                                                        readOnly={isSystem}
                                                                        disabled={isSystem}
                                                                    />
                                                                    {!isSystem && (
                                                                        <button onClick={() => actualIndex >= 0 && removeOption(actualIndex, oIdx)} className="text-red-500">
                                                                            <X size={18} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {!isSystem && (
                                                                <button
                                                                    onClick={() => actualIndex >= 0 && addOption(actualIndex)}
                                                                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700"
                                                                >
                                                                    + Options
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Add Question Button (S2/S3 only, max 15/30) */}
                                    {(client.plan === 'S2' || client.plan === 'S3' || client.plan === 'S3_INTERNATIONAL') && (client.config?.leadQualification?.questions?.length || 0) < (client.plan === 'S3' || client.plan === 'S3_INTERNATIONAL' ? 30 : 15) && (
                                        <button
                                            onClick={addQuestion}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed font-medium transition-colors ${isDark
                                                ? 'border-indigo-700 text-indigo-400 hover:bg-indigo-900/20'
                                                : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                                                }`}
                                        >
                                            <Plus size={18} />
                                            Add Question ({client.config?.leadQualification?.questions?.length || 0}/{client.plan === 'S3_INTERNATIONAL' || client.plan === 'S3' ? 30 : 15})
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    {/* QUESTION MAP TAB (S3_MAPPING only) */}
                    {activeTab === 'question_map' && (
                        <div className={cardClass}>
                            <div className={`flex items-center gap-2 mb-6`}>
                                <span style={{ fontSize: '20px' }}>🗺️</span>
                                <div>
                                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        S3 Mapping — Question Map
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        Define up to 30 deterministic questions. Any question can include an optional inline table rendered in the chat.
                                    </p>
                                </div>
                            </div>
                            <QuestionMapEditor
                                value={{
                                    question_map: (client.config as any)?.question_map ?? [],
                                }}
                                onChange={(updated) => {
                                    setClient(prev => {
                                        if (!prev || !prev.config) return prev;
                                        return {
                                            ...prev,
                                            config: {
                                                ...prev.config,
                                                question_map: updated.question_map,
                                            }
                                        };
                                    });
                                }}
                            />
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
                                            {!isOperator && (
                                                <button onClick={() => handleDeleteDocument(doc.document_id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
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
                                            disabled={uploading || isReadOnly}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {uploading ? 'Uploading...' : 'Confirm Upload'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                                            disabled={isReadOnly}
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
                                            disabled={isReadOnly}
                                        />
                                        <label
                                            htmlFor="detail-file-upload"
                                            className={`px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-700 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Select File
                                        </label>
                                    </>
                                )}
                            </div>

                            {/* LQC - Lead Qualification Criteria */}
                            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
                                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Wand2 size={20} /> LQC - Lead Qualification Criteria
                                </h2>
                                <div className="space-y-3">
                                    <label className={labelClass}>
                                        Qualification Criteria Prompt
                                    </label>
                                    <textarea
                                        rows={12}
                                        value={client.config?.lead_qualification_criteria || ''}
                                        onChange={(e) => updateConfig('lead_qualification_criteria', e.target.value)}
                                        className={inputClass}
                                        placeholder="Enter or paste your lead qualification criteria prompt here. This can include specific questions, scoring criteria, or guidelines for qualifying leads as warm or cold..."
                                    />
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                        Define the criteria and prompts used to validate and qualify leads. This will help identify warm leads vs cold leads.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* GENERATE KEY TAB */}
                    {activeTab === 'integration' && (
                        <div className="space-y-6">
                            <div className={cardClass}>
                                <div className="flex items-start gap-3 mb-5">
                                    <div
                                        className={`p-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-blue-50'
                                            }`}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'
                                                }`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.828 10.172a4 4 0 010 5.656l-2 2a4 4 0 01-5.656-5.656l1-1"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10.172 13.828a4 4 0 010-5.656l2-2a4 4 0 015.656 5.656l-1 1"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <h2
                                            className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'
                                                }`}
                                        >
                                            Client Website Domain
                                        </h2>

                                        <p
                                            className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'
                                                }`}
                                        >
                                            Enter the client’s primary website domain used for secure widget
                                            integration and origin validation.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label
                                        className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'
                                            }`}
                                    >
                                        Website Domain
                                    </label>


                                    <input
                                        type="text"
                                        placeholder="client.com"
                                        value={client.config?.client_domain || ""}
                                        onChange={(e) =>
                                            setClient({
                                                ...client,
                                                config: {
                                                    ...client.config,
                                                    client_domain: e.target.value,
                                                },
                                            })
                                        }
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 ${isDark
                                            ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                            }`}
                                    />

                                    <div
                                        className={`rounded-xl border px-4 py-3 text-sm ${isDark
                                            ? 'border-slate-700 bg-slate-900 text-slate-300'
                                            : 'border-gray-200 bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        <span className="font-medium">Examples:</span>{" "}
                                        client.com, example.org, startup.ai
                                    </div>
                                </div>
                            </div>
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
  window.LeadEngineConfig = {
    apiKey: "${generatedKey || 'YOUR_API_KEY'}",
    tenantId: "${client.id}",
    apiBaseUrl: "https://0wryhzy1j5.execute-api.us-east-1.amazonaws.com/prod",
    theme: {
        primary: "${client.config?.colors?.primary || '#4F46E5'}"
    }
  };
</script>
<script src="https://cdn.leadengineglobal.com/widget.js" async></script>`}</pre>
                                    <button
                                        onClick={() => copyToClipboard(`<script>
  window.LeadEngineConfig = {
    apiKey: "${generatedKey || 'YOUR_API_KEY'}",
    tenantId: "${client.id}",
    apiBaseUrl: "https://0wryhzy1j5.execute-api.us-east-1.amazonaws.com/prod",
    theme: {
        primary: "${client.config?.colors?.primary || '#4F46E5'}"
    }
  };
</script>
<script src="https://cdn.leadengineglobal.com/widget.js" async></script>`)}
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
                            <div className="flex justify-between items-center">
                                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Total Users</span>
                                <span className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {countLoading && <RefreshCw size={14} className="animate-spin text-indigo-500" />}
                                    {conversationCount}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Onboarded</span>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.onboardedDate}</span>
                            </div>
                            {client.createdBy && (
                                <div className="flex justify-between">
                                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Created By</span>
                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.createdBy}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* S2 Features Badge Card */}
                    {isS2OrHigher(client.plan) && (
                        <div className={cardClass}>
                            <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {client.plan === 'S3_MAX' ? 'S3 Max Features' : client.plan === 'S3' ? 'S3 Features' : client.plan === 'S3_INTERNATIONAL' ? 'S3_INTERNATIONAL Features' : 'S2 Features'}
                            </h3>
                            <div className="space-y-2.5">
                                {[
                                    ...(client.plan === 'S3_MAX' ? [
                                        'Agentic AI Qualification',
                                        'AI-Generated Questions',
                                        'Dynamic Lead Evaluation',
                                        'Confidence-based Completion',
                                    ] : [
                                        'Conversational Transitions',
                                        'Lead Intelligence',
                                        'Soft-DQ Handling',
                                        `Dynamic Questions (${client.config?.leadQualification?.questions?.length || 5})`
                                    ])
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
                                            <Check size={12} className={isDark ? 'text-green-400' : 'text-green-600'} />
                                        </div>
                                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`p-6 sm:p-8 rounded-3xl max-w-md w-full border shadow-2xl transition-all ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
                    }`}>
                        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Delete Client</h3>
                                <p className="text-xs text-red-500 font-medium">Irreversible Action</p>
                            </div>
                        </div>

                        <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            This will permanently delete <strong>{client.name}</strong> and all associated data.
                        </p>

                        <div className="mb-5 space-y-2">
                            <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                To confirm deletion, type <span className="text-red-500 font-extrabold select-all">"delete"</span> or <span className="text-red-500 font-extrabold select-all">"{client.name}"</span>:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={`Type "delete" or "${client.name}"`}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                                }`}
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                }}
                                className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all border ${
                                    isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={
                                    deleteConfirmText.trim().toLowerCase() !== 'delete' &&
                                    deleteConfirmText.trim().toLowerCase() !== client.name.toLowerCase()
                                }
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Plan Downgrade Confirmation Modal */}
            {
                showDowngradeModal && (
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
                                <strong> {(client?.config?.leadQualification?.questions?.length || 0) - 5} question(s)</strong> will be permanently deleted.
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
                )
            }

            {/* Settings Draft Recovery Modal */}
            <DraftRecoveryModal
                isOpen={showDraftModal}
                onResume={handleResumeSettingsDraft}
                onDiscard={handleDiscardSettingsDraft}
                lastSavedAt={settingsLoadedDraft?.updated_at || ''}
                isDark={isDark}
            />

            {/* Password Reset Modal */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn text-left">
                    <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden transition-all duration-300">
                        {/* Gradient Accent Bar */}
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-600 to-purple-600" />
                        
                        <div className="mb-6 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Lock className="text-indigo-600" size={20} />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                            </div>
                            <button 
                                onClick={closeResetModal}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {resetError && (
                            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                <span>{resetError}</span>
                            </div>
                        )}

                        {resetStep === 1 && (
                            <form onSubmit={handleSendVerificationCode} className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Please enter your registered email address to verify your identity before changing your password.
                                </p>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={verificationEmail}
                                        onChange={(e) => setVerificationEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                                        placeholder="e.g. yourname@company.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Sending Code...</span>
                                        </>
                                    ) : (
                                        <span>Send Verification Code</span>
                                    )}
                                </button>
                            </form>
                        )}

                        {resetStep === 2 && (
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    We have simulated sending a verification code to <strong className="text-indigo-600">{verificationEmail}</strong>.
                                    <br />
                                    Please enter the 6-digit code below to proceed (Hint: use <strong className="text-emerald-600">123456</strong>).
                                </p>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="w-full text-center tracking-widest font-mono text-lg px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        placeholder="000000"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                >
                                    <span>Verify Code</span>
                                </button>
                            </form>
                        )}

                        {resetStep === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Email verified successfully! You can now set your new password.
                                </p>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            minLength={8}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all bg-white dark:bg-slate-900"
                                            placeholder="At least 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmNewPassword ? "text" : "password"}
                                            required
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all bg-white dark:bg-slate-900"
                                            placeholder="Confirm password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Updating Password...</span>
                                        </>
                                    ) : (
                                        <span>Update Password</span>
                                    )}
                                </button>
                            </form>
                        )}

                        {resetStep === 4 && (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                    <CheckCircle size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Password Updated</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Your password has been changed successfully.
                                </p>
                                <button
                                    type="button"
                                    onClick={closeResetModal}
                                    className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout >
    );
};
