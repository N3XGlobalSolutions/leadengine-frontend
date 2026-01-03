
export enum MessageRole {
  User = 'user',
  Bot = 'model',
  System = 'system'
}

export interface SummaryData {
  sessionId?: string; // Unique ID for this specific conversation
  name?: string;
  phone?: string;
  location?: string;
  budget?: string;
  type?: string;
  moveIn?: string;
  financing?: string;
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
