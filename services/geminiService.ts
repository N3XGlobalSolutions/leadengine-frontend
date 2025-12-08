import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SummaryData } from '../types';
import { brandConfig } from '../config';

const SYSTEM_INSTRUCTION = `
You are ${brandConfig.botName}, the AI sales assistant for "${brandConfig.companyName}".
Your objective is to qualify leads coming from social media ads by collecting specific details.

**Lead Qualification Flow (Strict Order):**
1.  **Introduction & Contact:** Greet warmly, introduce ${brandConfig.companyName}, and ask for the user's **Name and Phone Number**.
2.  **Location:** Ask for their preferred location.
3.  **Budget:** Ask for their budget range.
4.  **Type:** Ask for the apartment type (e.g., 2BHK, 3BHK).
5.  **Move-in:** Ask for their move-in timeline.
6.  **Financing:** Ask if they need home loan assistance.
7.  **Closure:** Propose a site visit or call.

**Critical Rules:**
-   **Answering Queries:** If the user asks a question (e.g., "Is there a gym?", "What is the price?", "Where is it?"), you **MUST** answer it politely and concisely. **IMMEDIATELY AFTER ANSWERING**, you must ask the *next* pending question in the Lead Qualification Flow. Do not stop at just answering the user's question.
    -   *Example:* User: "Do you have a pool?" -> Bot: "Yes, we have a temperature-controlled infinity pool. May I know your preferred budget range?"
-   **One Question at a Time:** Do not ask multiple qualifying questions in one message.
-   **Persistency:** Gently steer the conversation back to the flow if the user goes off-topic.
-   **Completion:** Once you have collected ALL 6 data points (Name/Phone, Location, Budget, Type, Move-in, Financing), output the summary JSON.

**Data Summary Format:**
When all data is collected, output a JSON block:
\`\`\`json
{
  "summary": {
    "name": "...",
    "phone": "...",
    "location": "...",
    "budget": "...",
    "type": "...",
    "moveIn": "...",
    "financing": "..."
  },
  "message": "Perfect! I've noted your preferences. Everything looks good for our current availability. Would you like to schedule a quick call with our senior sales manager to finalize the details?"
}
\`\`\`

Tone: Professional, helpful, but focused on the goal.
`;

export interface ServiceResponse {
    text: string;
    summary?: SummaryData;
    showActions?: boolean;
    error?: boolean;
}

export class GeminiChatService {
  private chatSession: Chat | null = null;
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
        throw new Error("API Key is required to initialize GeminiChatService");
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.initializeChat();
  }

  private initializeChat() {
    try {
        this.chatSession = this.genAI.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });
    } catch (error) {
        console.error("Failed to create chat session:", error);
        this.chatSession = null;
    }
  }

  public async sendMessage(message: string): Promise<ServiceResponse> {
    if (!this.chatSession) {
      return { text: "System Error: Chat session not initialized. Please check API configuration.", error: true };
    }

    try {
      const response: GenerateContentResponse = await this.chatSession.sendMessage({ message });
      let text = response.text || "";
      let summary: SummaryData | undefined;
      let showActions = false;

      // Check for JSON summary block
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.summary) {
            summary = parsed.summary;
          }
          if (parsed.message) {
            text = parsed.message; // Use the cleaner message from JSON
          }
          // If we have a summary, we likely want to show the call to action buttons
          if (text.toLowerCase().includes("schedule a quick call")) {
            showActions = true;
          }
        } catch (e) {
          console.error("Failed to parse JSON from Gemini response", e);
        }
      } else {
          // Fallback detection for actions if no JSON
          if (text.toLowerCase().includes("schedule a quick call")) {
              showActions = true;
          }
      }
      
      // Cleanup: Remove the code block from text if we parsed it, or if it wasn't replaced yet
      text = text.replace(/```json[\s\S]*?```/, '').trim();

      return { text, summary, showActions, error: false };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return { 
          text: "I'm having trouble connecting to the server right now. The API Key might be invalid or quota exceeded.", 
          error: true 
      };
    }
  }
}