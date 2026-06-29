/**
 * Draft autosave types for client creation and client settings editing.
 */

export interface DraftResponse {
    draft_id: string;
    user_id: string;
    draft_type: string;
    draft_data: Record<string, any>;
    created_at: string;
    updated_at: string;
    expires_at: number;
}

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type DraftType = 'client_creation' | 'client_settings';
