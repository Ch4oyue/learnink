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

// =============================================
// INCOMING CONTENTS (from n8n integration)
// =============================================

/**
 * Status of incoming content for admin review
 */
export type ContentStatus = 'pending' | 'approved' | 'rejected';

/**
 * Represents incoming content from n8n workflow
 * that needs admin review before publishing to modules
 */
export interface IncomingContent {
    /** Unique identifier */
    id: string;

    /** Title of the content */
    title: string;

    /** Markdown content from Notion page body */
    content?: string;

    /** Summary/description of the content */
    summary?: string;

    /** Difficulty level (Pemula, Menengah, Lanjutan) */
    level?: string;

    /** Track/cluster (The Specialist, Life OS) */
    track?: string;

    /** Category of the module */
    category?: string;

    /** Raw JSON content from n8n (deprecated, kept for backward compatibility) */
    raw_content?: {
        content?: string;
        tags?: string[];
        [key: string]: unknown;
    };

    /** Source of the content (default: 'n8n') */
    source: string;

    /** Current review status */
    status: ContentStatus;

    /** AI-generated summary (optional) */
    ai_summary?: string;

    /** Timestamp when content was received */
    created_at: string;

    /** Timestamp when content was processed (approved/rejected) */
    processed_at?: string;

    /** UUID of admin who processed the content */
    processed_by?: string;
}

/**
 * Payload structure expected from n8n webhook
 */
export interface N8nPayload {
    title: string;
    content: string;
    tags?: string[];
}

// =============================================
// INTEGRATIONS (API Key Management)
// =============================================

/**
 * Available integration sources
 */
export type IntegrationSource = 'n8n' | 'notion' | 'chatgpt' | 'zapier' | 'custom';

/**
 * Integration configuration for external sources
 */
export interface Integration {
    /** Unique identifier */
    id: string;

    /** Display name for the integration */
    name: string;

    /** Optional description */
    description?: string;

    /** Source type */
    source: IntegrationSource;

    /** Masked API key preview (e.g., sk_live_••••••••x1a4) */
    api_key_preview: string;

    /** Webhook URL to send data to */
    webhook_url: string;

    /** Whether the integration is active */
    is_active: boolean;

    /** Last time this integration was used */
    last_used_at: string | null;

    /** Number of requests made through this integration */
    request_count: number;

    /** UUID of admin who created the integration */
    created_by?: string;

    /** Timestamp when integration was created */
    created_at: string;

    /** Timestamp when integration was last updated */
    updated_at: string;
}

/**
 * Response when generating a new API key
 */
export interface GenerateKeyResponse {
    success: boolean;
    message: string;
    integration: Omit<Integration, 'api_key_preview' | 'request_count' | 'last_used_at' | 'updated_at'>;
    api_key: string;  // Full key - only shown once!
    api_key_preview: string;
}

/**
 * Input for creating a new integration
 */
export interface CreateIntegrationInput {
    name: string;
    source: IntegrationSource;
    description?: string;
}
