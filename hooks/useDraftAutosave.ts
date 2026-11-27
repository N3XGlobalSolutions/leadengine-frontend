/**
 * useDraftAutosave — Dirty-state tracking with debounced server-side draft persistence.
 *
 * Strategy:
 * - On form data change → mark dirty, restart 5-second debounce timer
 * - When 5 seconds pass with no changes → save once, reset dirty flag
 * - If user does nothing → zero API requests (NO polling, NO setInterval)
 * - On unmount → cancel pending debounce (no leaked saves)
 *
 * Security:
 * - Strips whatsapp_access_token from draft_data before sending to API
 * - Server also strips it (defense-in-depth)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    getLatestClientDraft,
    createClientDraft,
    updateClientDraft,
    deleteClientDraft,
} from '../services/adminService';
import { DraftResponse, DraftSaveStatus, DraftType } from '../types/draft';
import { DEFAULT_TENANT_CONFIG } from '../types/config';

const DEBOUNCE_MS = 2000; // 2 seconds after last change

const DEFAULT_CLIENT_CREATION_PAYLOAD = {
    formData: {
        name: '',
        slug: '',
        plan: 'S1',
        config: DEFAULT_TENANT_CONFIG
    },
    leadQualificationCriteria: '',
    questionMapConfig: {
        question_map: []
    }
};

/**
 * Checks if a value is empty (null, undefined, "", empty array, or empty object).
 */
function isEmpty(v: any): boolean {
    if (v === null || v === undefined || v === '') return true;
    if (Array.isArray(v) && v.length === 0) return true;
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true;
    return false;
}

/**
 * Checks if value has meaningful difference from defaultValue.
 * Ignores keys: 'currentStep', 'activeTab', 'clientId'.
 */
function isMeaningfulValue(value: any, defaultValue: any): boolean {
    if (value === defaultValue) {
        return false;
    }

    if (isEmpty(value) && isEmpty(defaultValue)) {
        return false;
    }

    if (isEmpty(value) !== isEmpty(defaultValue)) {
        return true;
    }

    if (Array.isArray(value) && Array.isArray(defaultValue)) {
        if (value.length !== defaultValue.length) {
            return true;
        }
        for (let i = 0; i < value.length; i++) {
            if (isMeaningfulValue(value[i], defaultValue[i])) {
                return true;
            }
        }
        return false;
    }

    if (typeof value === 'object' && value !== null && typeof defaultValue === 'object' && defaultValue !== null) {
        const allKeys = new Set([...Object.keys(value), ...Object.keys(defaultValue)]);
        for (const key of allKeys) {
            if (key === 'currentStep' || key === 'activeTab' || key === 'clientId') {
                continue;
            }
            if (isMeaningfulValue(value[key], defaultValue[key])) {
                return true;
            }
        }
        return false;
    }

    return true;
}

/** Fields to strip from draft data before sending to the API */
const SENSITIVE_KEYS = new Set(['whatsapp_access_token']);

function stripSensitive(data: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.has(key)) continue;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            cleaned[key] = stripSensitive(value);
        } else if (Array.isArray(value)) {
            cleaned[key] = value.map((item) =>
                item && typeof item === 'object' && !Array.isArray(item)
                    ? stripSensitive(item)
                    : item
            );
        } else {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

interface UseDraftAutosaveOptions {
    /** Whether autosave is enabled (disable during initial load, etc.) */
    enabled?: boolean;
    /** Draft type identifier */
    draftType?: DraftType;
    /** Debounce delay in ms (default 2000) */
    debounceMs?: number;
    /** The initial value of the payload to detect dirty state */
    initialValue?: Record<string, any>;
}

interface UseDraftAutosaveReturn {
    /** Current save status for UI display */
    saveStatus: DraftSaveStatus;
    /** Timestamp of last successful save */
    lastSavedAt: Date | null;
    /** Whether a draft was loaded from the server */
    draftLoaded: boolean;
    /** The loaded draft response (null if none) */
    loadedDraft: DraftResponse | null;
    /** Load the latest draft from the server */
    loadDraft: () => Promise<DraftResponse | null>;
    /** Delete the draft on the server */
    deleteDraft: () => Promise<void>;
    /** Force an immediate save (e.g. before navigation) */
    /** Resolves true when saved (or nothing needed saving), false when the save failed. */
    forceSave: (data: Record<string, any>) => Promise<boolean>;
    /** Whether the local form is dirty compared to baseline */
    isDirty: boolean;
}

export function useDraftAutosave(
    formData: Record<string, any>,
    options: UseDraftAutosaveOptions = {}
): UseDraftAutosaveReturn {
    const {
        enabled = true,
        draftType = 'client_creation',
        debounceMs = DEBOUNCE_MS,
        initialValue,
    } = options;

    const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [loadedDraft, setLoadedDraft] = useState<DraftResponse | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Refs for tracking state without re-renders
    const draftExistsOnServer = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const isMounted = useRef(true);
    const initialDataRef = useRef<Record<string, any> | null>(null);
    const lastSavedDataRef = useRef<Record<string, any> | null>(null);
    const inFlightSaveRef = useRef<Promise<void> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };
    }, []);

    /**
     * Perform the actual save to the server.
     * Creates a new draft if none exists, otherwise updates.
     */
    const saveDraft = useCallback(
        async (data: Record<string, any>): Promise<boolean> => {
            if (!isMounted.current) return false;

            const baseline = draftExistsOnServer.current
                ? (lastSavedDataRef.current || initialValue || initialDataRef.current)
                : (initialValue || initialDataRef.current);

            // Skip save if data hasn't actually changed in a meaningful way (nothing to save counts as success)
            if (!isMeaningfulValue(data, baseline)) {
                return true;
            }

            const cleanData = stripSensitive(data);

            setSaveStatus('saving');

            // Track the in-flight request so deleteDraft can wait for it (otherwise a save that
            // finishes after the delete would re-create the draft).
            let resolveInFlight: () => void = () => {};
            const inFlight = new Promise<void>((resolve) => { resolveInFlight = resolve; });
            inFlightSaveRef.current = inFlight;

            try {
                let result: DraftResponse | null;

                if (draftExistsOnServer.current) {
                    result = await updateClientDraft(cleanData, draftType);
                    // If update returns null (draft expired/deleted), create a new one
                    if (!result) {
                        result = await createClientDraft(cleanData, draftType);
                    }
                } else {
                    result = await createClientDraft(cleanData, draftType);
                }

                if (isMounted.current) {
                    if (result) {
                        draftExistsOnServer.current = true;
                        lastSavedDataRef.current = data;
                        setIsDirty(false);
                        setSaveStatus('saved');
                        setLastSavedAt(new Date());
                    } else {
                        setSaveStatus('error');
                    }
                }
                return !!result;
            } catch (err) {
                console.error('Draft autosave failed:', err);
                if (isMounted.current) {
                    setSaveStatus('error');
                }
                return false;
            } finally {
                resolveInFlight();
                if (inFlightSaveRef.current === inFlight) inFlightSaveRef.current = null;
            }
        },
        [draftType, initialValue]
    );

    /**
     * Watch formData for changes and debounce saves.
     * Only subsequent user-driven changes trigger saves when isDirty is true.
     */
    useEffect(() => {
        // Gate: don't do anything while autosave is disabled.
        if (!enabled) return;

        // Skip the first render after enabled becomes true.
        // This prevents saving the initial/restored form state.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            initialDataRef.current = formData;
            if (draftExistsOnServer.current) {
                lastSavedDataRef.current = formData;
            }
            return;
        }

        const baseline = draftExistsOnServer.current
            ? (lastSavedDataRef.current || initialValue || initialDataRef.current)
            : (initialValue || initialDataRef.current);

        const dirty = isMeaningfulValue(formData, baseline);

        if (dirty) {
            setIsDirty(true);
            // Cancel any pending debounce
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            // Start new debounce timer
            debounceTimerRef.current = setTimeout(() => {
                saveDraft(formData);
            }, debounceMs);
        } else {
            setIsDirty(false);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [formData, enabled, debounceMs, saveDraft, initialValue]);

    /**
     * Load the latest draft from the server.
     */
    const loadDraft = useCallback(async (): Promise<DraftResponse | null> => {
        try {
            const draft = await getLatestClientDraft(draftType);
            if (draft) {
                const baseline = initialValue || (draftType === 'client_creation' ? DEFAULT_CLIENT_CREATION_PAYLOAD : null);

                // If the draft on server is an empty/placeholder draft, automatically discard it
                if (baseline && !isMeaningfulValue(draft.draft_data, baseline)) {
                    console.log('Discarding empty/placeholder draft found on server');
                    try {
                        await deleteClientDraft(draftType);
                    } catch (e) {
                        console.error('Failed to auto-delete empty draft:', e);
                    }
                    draftExistsOnServer.current = false;
                    setDraftLoaded(false);
                    setLoadedDraft(null);
                    return null;
                }

                draftExistsOnServer.current = true;
                setDraftLoaded(true);
                setLoadedDraft(draft);
                lastSavedDataRef.current = draft.draft_data;
            } else {
                draftExistsOnServer.current = false;
                setDraftLoaded(false);
                setLoadedDraft(null);
            }
            return draft;
        } catch (err) {
            console.error('Failed to load draft:', err);
            return null;
        }
    }, [draftType, initialValue]);

    /**
     * Delete the draft on the server and reset local state.
     */
    const deleteDraft = useCallback(async () => {
        // Cancel any pending save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        // Let a save that is already in flight finish first, so it can't re-create the draft after we delete it
        if (inFlightSaveRef.current) {
            await inFlightSaveRef.current;
        }

        try {
            await deleteClientDraft(draftType);
        } catch (err) {
            console.error('Failed to delete draft:', err);
        }

        draftExistsOnServer.current = false;
        lastSavedDataRef.current = null;
        setIsDirty(false);
        setDraftLoaded(false);
        setLoadedDraft(null);
        setSaveStatus('idle');
        setLastSavedAt(null);
    }, [draftType]);

    /**
     * Force an immediate save (skips debounce).
     * Useful before navigation or form submission.
     */
    const forceSave = useCallback(
        async (data: Record<string, any>) => {
            // Cancel pending debounce
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            const baseline = draftExistsOnServer.current
                ? (lastSavedDataRef.current || initialValue || initialDataRef.current)
                : (initialValue || initialDataRef.current);
            if (isMeaningfulValue(data, baseline)) {
                return saveDraft(data);
            }
            return true; // nothing new to save
        },
        [saveDraft, initialValue]
    );

    return {
        saveStatus,
        lastSavedAt,
        draftLoaded,
        loadedDraft,
        loadDraft,
        deleteDraft,
        forceSave,
        isDirty,
    };
}
