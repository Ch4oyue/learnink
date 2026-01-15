/**
 * Staging Types for n8n Webhook Integration
 * 
 * These types define the structure for incoming data from external sources
 * (n8n webhooks, Notion API, etc.) before they are processed into the main system.
 */

/**
 * Source of the incoming note
 */
export type NoteSource = 'n8n' | 'notion' | 'manual';

/**
 * Processing status of the incoming note
 */
export type NoteStatus = 'pending' | 'processed' | 'rejected';

/**
 * Represents an incoming note from an external source
 * that needs to be reviewed before being added to the system
 */
export interface IncomingNote {
    /** Unique identifier for the incoming note */
    id: string;

    /** Source of the note (n8n webhook, Notion, manual entry) */
    source: NoteSource;

    /** The main content of the note */
    content: string;

    /** Title or heading for the note (optional) */
    title?: string;

    /** Raw data from the source (for debugging/reference) */
    raw_data: Record<string, unknown>;

    /** Current processing status */
    status: NoteStatus;

    /** Timestamp when the note was received */
    created_at: string;

    /** Timestamp when the note was last updated */
    updated_at?: string;

    /** Optional metadata */
    metadata?: {
        module_id?: string;
        lesson_id?: string;
        tags?: string[];
    };
}

/**
 * Response from the staging webhook endpoint
 */
export interface WebhookResponse {
    success: boolean;
    message: string;
    note_id?: string;
}

/**
 * Configuration for the webhook integration
 */
export interface WebhookConfig {
    /** The webhook endpoint URL */
    endpoint_url: string;

    /** Secret key for authentication */
    secret_key: string;

    /** Whether the webhook is active */
    is_active: boolean;

    /** Timestamp when the config was last updated */
    updated_at: string;
}
