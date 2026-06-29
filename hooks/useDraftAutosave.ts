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

const DEBOUNCE_MS = 5000; // 5 seconds after last change

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
    /** Debounce delay in ms (default 5000) */
    debounceMs?: number;
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
    forceSave: (data: Record<string, any>) => Promise<void>;
}

export function useDraftAutosave(
    formData: Record<string, any>,
    options: UseDraftAutosaveOptions = {}
): UseDraftAutosaveReturn {
    const {
        enabled = true,
        draftType = 'client_creation',
        debounceMs = DEBOUNCE_MS,
    } = options;

    const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [loadedDraft, setLoadedDraft] = useState<DraftResponse | null>(null);

    // Refs for tracking state without re-renders
    const draftExistsOnServer = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const isMounted = useRef(true);
    const lastSavedDataRef = useRef<string>('');

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
        async (data: Record<string, any>) => {
            if (!isMounted.current) return;

            const cleanData = stripSensitive(data);
            const serialized = JSON.stringify(cleanData);

            // Skip save if data hasn't actually changed since last save
            if (serialized === lastSavedDataRef.current) {
                return;
            }

            setSaveStatus('saving');

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
                        lastSavedDataRef.current = serialized;
                        setSaveStatus('saved');
                        setLastSavedAt(new Date());
                    } else {
                        setSaveStatus('error');
                    }
                }
            } catch (err) {
                console.error('Draft autosave failed:', err);
                if (isMounted.current) {
                    setSaveStatus('error');
                }
            }
        },
        [draftType]
    );

    /**
     * Watch formData for changes and debounce saves.
     * Skips the first data snapshot after enabled=true to avoid saving the
     * initial/default form state. Only subsequent user-driven changes trigger saves.
     */
    useEffect(() => {
        // Gate: don't do anything while autosave is disabled.
        // Crucially, this runs BEFORE consuming isFirstRender so the guard
        // survives the disabled→enabled transition.
        if (!enabled) return;

        // Skip the first render after enabled becomes true.
        // This prevents saving the initial/restored form state.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            // Snapshot the current data so the next change can be compared
            lastSavedDataRef.current = JSON.stringify(formData);
            return;
        }

        // Cancel any pending debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Start new debounce timer
        debounceTimerRef.current = setTimeout(() => {
            saveDraft(formData);
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [formData, enabled, debounceMs, saveDraft]);

    /**
     * Load the latest draft from the server.
     */
    const loadDraft = useCallback(async (): Promise<DraftResponse | null> => {
        try {
            const draft = await getLatestClientDraft(draftType);
            if (draft) {
                draftExistsOnServer.current = true;
                setDraftLoaded(true);
                setLoadedDraft(draft);
            } else {
                setDraftLoaded(false);
                setLoadedDraft(null);
            }
            return draft;
        } catch (err) {
            console.error('Failed to load draft:', err);
            return null;
        }
    }, [draftType]);

    /**
     * Delete the draft on the server and reset local state.
     */
    const deleteDraft = useCallback(async () => {
        // Cancel any pending save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        try {
            await deleteClientDraft(draftType);
        } catch (err) {
            console.error('Failed to delete draft:', err);
        }

        draftExistsOnServer.current = false;
        lastSavedDataRef.current = '';
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
            await saveDraft(data);
        },
        [saveDraft]
    );

    return {
        saveStatus,
        lastSavedAt,
        draftLoaded,
        loadedDraft,
        loadDraft,
        deleteDraft,
        forceSave,
    };
}
