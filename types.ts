
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
