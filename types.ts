
export enum MessageRole {
  User = 'user',
  Bot = 'model',
  System = 'system'
}

export interface SummaryData {
  sessionId?: string;
  // Values are usually strings, but S3 flows nest objects ({ label, answer }) and arrays
  [key: string]: unknown;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  isSummary?: boolean;
  summaryData?: SummaryData;
  showActions?: boolean; // For the "Schedule a call" buttons
  feedback?: 'up' | 'down'; // New field for feedback
  // S2-specific fields
  conversationalTransition?: string; // Thinking text before question
  isSoftDQ?: boolean; // Soft-disqualified lead visual
  // Visitor chat UI
  products?: ChatProductCard[]; // Product cards the bot showed with this message
  currentState?: string;   // Backend current_state when this bot message arrived ("contact", "qualifying", ...)
  quickReplies?: string[]; // Tap-to-answer options shown under this bot message
  selectedReply?: string;  // The option the visitor tapped (its chip stays shown as checked)
}

/** A product the client added in the admin Products tab, as shown in the chat. */
export interface ChatProductCard {
  productId: string;
  title: string;
  description: string;
  imageId?: string | null; // image served from /tenants/{tenantId}/chat-products/images/{imageId}
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  conversationStarted: boolean;
}

// --- API Types ---

export interface ChatResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
  sources?: string[];
  suggested_actions?: string[];

  // NEW: Explicit state info from backend - no more parsing from text!
  current_state?: string;           // "greeting", "contact", "qualifying", "completed"
  current_step_index?: number;      // 0-based index for progress
  total_steps?: number;             // Total qualification questions
  summary_data?: Record<string, any>;  // Backend-created summary
  show_actions?: boolean;           // Explicit flag for action buttons
  quick_replies?: string[];         // Quick reply options for current question
  products?: Array<{                // Product cards, sent when the visitor asks about products
    product_id: string;
    title: string;
    description?: string;
    image_id?: string | null;
  }>;

  // S2-specific fields
  s2_lead_output?: {
    lead_priority: string;          // "High" | "Medium" | "Low"
    reasoning_summary: string;      // 2-3 line explanation
    key_objections: string[];       // Detected hesitations
    recommended_next_step: string;  // What sales should do next
  };
  conversational_transition?: string; // S2 acknowledgment before question

  // S3 Max (Agentic) fields
  s3_max_lead_output?: {
    verdict: string;                // "QUALIFIED" | "DISQUALIFIED"
    lead_priority: string;          // "High" | "Medium" | "Low"
    reasoning_summary: string;
    key_objections: string[];
    recommended_next_step: string;
    qualification_score: number;    // 0-100
    dimension_scores?: Record<string, { score: number; notes: string }>;
  };
  estimated_progress?: number;      // 0.0 - 1.0 for S3 Max dynamic progress bar
}

export interface Conversation {
  conversation_id: string;
  tenant_id: string;
  user_identifier: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  is_active: boolean;
  lead_captured: boolean;
  extracted_lead_data?: any;
  lead_status: string;
}
