import { TenantConfig } from '../types/config';
import { SummaryData } from '../types';

interface ServiceResponse {
    text: string;
    summary?: SummaryData;
    showActions?: boolean;
    error?: boolean;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const createSystemInstruction = (config: TenantConfig) => {
    const questions = config.leadQualification.questions;

    const steps = questions.map((q, index) =>
        `${index + 1}.  **${q.label}:** ${q.instruction}`
    ).join('\n');

    const allCollectedFields = questions.flatMap(q => q.collects).join(', ');

    const summaryJsonFields = questions.reduce((acc, q) => {
        q.collects.forEach(field => {
            acc += `    "${field}": "...",\n`;
        });
        return acc;
    }, "");

    return `
You are ${config.botName}, the AI sales assistant for "${config.companyName}".
Your objective is to qualify leads coming from social media ads by collecting specific details.

**Lead Qualification Flow (Strict Order):**
${steps}
${questions.length + 1}.  **Closure:** Propose a site visit or call.

**Critical Rules:**
-   **Answering Queries:** If the user asks a question, answer it politely. **IMMEDIATELY AFTER ANSWERING**, ask the *next* pending question in the Lead Qualification Flow.
-   **One Question at a Time:** Do not ask multiple qualifying questions in one message.
-   **Completion:** Once you have collected ALL ${questions.length} data points (${allCollectedFields}), output the summary JSON.

**Data Summary Format:**
When all data is collected, output a JSON block:
\`\`\`json
{
  "summary": {
${summaryJsonFields.trimEnd()}
  },
  "message": "Perfect! I've noted your preferences. Everything looks good for our current availability. Would you like to schedule a quick call?"
}
\`\`\`
`.trim();
};

export class BedrockService {
    private history: ChatMessage[] = [];
    private config: TenantConfig;
    private backendUrl: string = 'http://localhost:3001/api/chat';
    private sessionId: string;

    constructor(config: TenantConfig, sessionId?: string) {
        this.config = config;
        this.sessionId = sessionId || 'default';
    }

    // Restore chat history from persisted messages
    public restoreHistory(messages: Array<{ role: string; text: string }>) {
        this.history = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            text: msg.text
        }));
        console.log(`Restored ${this.history.length} messages to BedrockService history`);
    }

    // Clear history for new chat
    public clearHistory() {
        this.history = [];
        console.log('Cleared BedrockService history');
    }

    public async sendMessage(message: string): Promise<ServiceResponse> {
        try {
            // Add user message to history
            this.history.push({ role: 'user', text: message });

            const systemInstruction = createSystemInstruction(this.config);

            const response = await fetch(this.backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: this.history,
                    system: systemInstruction,
                    // Optional: passing raw prompt if strictly using completion API on backend, 
                    // but our backend handles "messages" -> Llama chat format.
                }),
            });

            if (!response.ok) {
                throw new Error('Backend failed');
            }

            const data = await response.json();
            let text = data.reply || "";
            let summary: SummaryData | undefined;
            let showActions = false;

            // Add model response to history
            this.history.push({ role: 'model', text: text });

            // Check for JSON summary block (supports ```json, ``` alone, or bare JSON)
            // Pattern 1: ```json { ... } ```
            let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);

            // Pattern 2: ``` { ... } ``` (without json keyword)
            if (!jsonMatch) {
                jsonMatch = text.match(/```\s*(\{[\s\S]*?\})\s*```/);
            }

            // Pattern 3: Bare JSON at start/end { "summary": ... }
            if (!jsonMatch) {
                jsonMatch = text.match(/(\{\s*"summary"\s*:\s*\{[\s\S]*?\}\s*,\s*"message"\s*:\s*"[^"]*"\s*\})/);
            }

            if (jsonMatch && jsonMatch[1]) {
                try {
                    const jsonStr = jsonMatch[1].trim();
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.summary) summary = parsed.summary;
                    if (parsed.message) text = parsed.message;
                    if (text.toLowerCase().includes("schedule a quick call") || text.toLowerCase().includes("schedule a call")) showActions = true;
                } catch (e) {
                    console.error("Failed to parse JSON", e);
                }
            } else {
                if (text.toLowerCase().includes("schedule a quick call") || text.toLowerCase().includes("schedule a call")) showActions = true;
            }

            // Cleanup any JSON/code blocks from the displayed text
            text = text.replace(/```json[\s\S]*?```/g, '').trim();
            text = text.replace(/```[\s\S]*?```/g, '').trim();
            text = text.replace(/\{\s*"summary"\s*:\s*\{[\s\S]*?\}\s*,\s*"message"\s*:\s*"[^"]*"\s*\}/g, '').trim();

            return { text, summary, showActions, error: false };

        } catch (error) {
            console.error("Bedrock Service Error:", error);
            return {
                text: "I'm having trouble connecting to the server. Please ensure the backend is running.",
                error: true
            };
        }
    }
}
