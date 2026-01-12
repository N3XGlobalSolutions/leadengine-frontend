
export enum MessageRole {
  User = 'user',
  Bot = 'model',
  System = 'system'
}

export interface SummaryData {
  sessionId?: string;
  [key: string]: string | undefined;
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
