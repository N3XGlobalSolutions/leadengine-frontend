export interface Question {
    id: string;
    label: string;           // Display label for the question category (e.g. "Industry", "Budget")
    instruction: string;     // Instruction for the AI (e.g. "Ask what industry they are in")
    collects: string[];      // Fields to extract for the summary (e.g. ["name", "phone"])
    optionsKey?: string;     // Reference to the options list in leadQualification.options
    options?: string[];      // Optional quick reply options
    isSystemGenerated?: boolean; // True if this is a system question (auto-handled by state machine)
}

export type TenantPlan = 'S1' | 'S2' | 'S3' | 'S3_MAX' | 'S3_MAPPING';

export interface TenantConfig {
    plan?: TenantPlan;
    companyName: string;
    shortName: string;
    botName: string;
    botDisplayName: string;
    botAvatar: string;
    apiKey?: string; // Generated API key for the widget

    colors: {
        primary: string;
        secondary: string;
    };

    welcome: {
        headline: string;
        highlightedHeadline: string;
        subheadline: string;
        startBtnText: string;
        features: string[];
    };

    leadQualification: {
        options: Record<string, string[]>;
        // We enforce exactly 5 dynamic questions for all clients
        questions: Question[];
    };

    messages: {
        scheduleSuccess: string;
        maybeLater: string;
    };

    // Behavior & Settings
    welcome_message?: string;
    language?: string;
    tone?: string;
    company_context?: string;
    client_domain?: string;
    guardrails?: string[]; // stored as string[] but edited as comma-separated string maybe?
    max_conversation_length?: number;
    lead_trigger_count?: number;
    lead_form_enabled?: boolean;
    lead_form_fields?: string[];

    // Lead Qualification Criteria
    lead_qualification_criteria?: string; // Natural language criteria for qualifying leads

    // S3 Mapping
    question_map?: any[];

    // WhatsApp Configuration
    whatsapp_enabled?: boolean;
    whatsapp_access_token?: string;
    whatsapp_phone_number_id?: string;
}

// Default template with placeholder questions
export const DEFAULT_TENANT_CONFIG: TenantConfig = {
    whatsapp_enabled: false,
    whatsapp_access_token: '',
    whatsapp_phone_number_id: '',
    companyName: '',
    shortName: '',
    botName: 'Q-Bot',
    botDisplayName: 'Assistant',
    botAvatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png',

    colors: {
        primary: '#4F46E5', // Indigo-600
        secondary: '#6366F1' // Indigo-500
    },

    welcome: {
        headline: 'Welcome to',
        highlightedHeadline: '',
        subheadline: 'How can I help you today?',
        startBtnText: 'Start Conversation',
        features: []
    },

    leadQualification: {
        options: {},
        questions: [
            { id: 'q1', label: 'Question 1', instruction: '', collects: [], options: [] },
            { id: 'q2', label: 'Question 2', instruction: '', collects: [], options: [] },
            { id: 'q3', label: 'Question 3', instruction: '', collects: [], options: [] },
            { id: 'q4', label: 'Question 4', instruction: '', collects: [], options: [] },
            { id: 'q5', label: 'Question 5', instruction: '', collects: [], options: [] },
        ]
    },

    messages: {
        scheduleSuccess: 'Thank you! Our team will be in touch shortly.',
        maybeLater: 'No problem! Feel free to reach out whenever you are ready.'
    }
};
