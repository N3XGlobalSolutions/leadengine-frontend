import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Add top-level diagnostic logging to capture silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    maxAttempts: 3,
});

const MODEL_ID = process.env.BEDROCK_MODEL_ID || "meta.llama3-8b-instruct-v1:0";

// --- CLIENT CONFIGURATION API ---
const CONFIG_DIR = path.join(__dirname, 'config', 'clients');

// Ensure config dir exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// --- ADMIN API (Client Metadata) ---
const DATA_DIR = path.join(__dirname, 'data');
const CLIENTS_DB_PATH = path.join(DATA_DIR, 'clients.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read clients DB
const getClientsDb = () => {
    if (!fs.existsSync(CLIENTS_DB_PATH)) {
        return []; // Return empty if not exists
    }
    try {
        return JSON.parse(fs.readFileSync(CLIENTS_DB_PATH, 'utf8'));
    } catch (e) {
        console.error("Error reading clients DB:", e);
        return [];
    }
};

// GET /api/admin/clients - List all clients (metadata + config)
app.get('/api/admin/clients', (req, res) => {
    const clients = getClientsDb();
    res.json(clients);
});

// POST /api/admin/clients - Create new client
app.post('/api/admin/clients', (req, res) => {
    const newClient = req.body;
    if (!newClient || !newClient.slug) {
        return res.status(400).json({ error: "Invalid client data" });
    }

    const clients = getClientsDb();

    // Check if duplicate
    if (clients.find((c: any) => c.slug === newClient.slug)) {
        return res.status(409).json({ error: "Client slug already exists" });
    }

    // Add metadata
    clients.push(newClient);
    fs.writeFileSync(CLIENTS_DB_PATH, JSON.stringify(clients, null, 2));

    // Also save the config file for the runtime
    const configPath = path.join(CONFIG_DIR, `${newClient.slug}.json`);
    try {
        fs.writeFileSync(configPath, JSON.stringify(newClient.config, null, 2));
    } catch (e) {
        console.error("Error saving runtime config file:", e);
    }

    res.status(201).json(newClient);
});

// GET /api/clients/:slug - Fetch specific client config
app.get('/api/clients/:slug', (req, res) => {
    const { slug } = req.params;
    const cleanSlug = slug.replace(/[^a-z0-9-]/g, ''); // Basic sanitization
    const filePath = path.join(CONFIG_DIR, `${cleanSlug}.json`);

    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            console.error(`Error reading config for ${slug}:`, e);
            res.status(500).json({ error: "Failed to read configuration" });
        }
    } else {
        // Fallback or 404
        if (cleanSlug === 'sky-habitat' || cleanSlug === 'demo') {
            // Should ideally be in the file, but as fallback if migration failed
            res.status(404).json({ error: "Client definition not found on disk" });
        } else {
            res.status(404).json({ error: "Client not found" });
        }
    }
});

// POST /api/clients - Create/Update client config
app.post('/api/clients', (req, res) => {
    const { slug, config } = req.body;
    if (!slug || !config) {
        return res.status(400).json({ error: "Missing slug or config" });
    }

    const cleanSlug = slug.replace(/[^a-z0-9-]/g, '');
    const filePath = path.join(CONFIG_DIR, `${cleanSlug}.json`);

    try {
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
        console.log(`Saved config for client: ${slug}`);
        res.json({ success: true, slug });
    } catch (e) {
        console.error(`Error saving config for ${slug}:`, e);
        res.status(500).json({ error: "Failed to save configuration" });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, messages, system } = req.body;

        console.log("-----------------------------------------");
        console.log("Request received for Model ID:", MODEL_ID);
        console.log("Input Messages count:", messages?.length);
        console.log("Input Prompt length:", prompt?.length);

        // Construct payload based on Model ID or generic "Llama-like" vs "Claude-like" structure.
        // The user requested "gpt-oss 20 b", which likely implies an open/Llama architecture.
        // Llama 3 on Bedrock expects: { "prompt": "...", "max_gen_len": 512, "temperature": 0.5, "top_p": 0.9 }
        // The prompt for Llama 3 Instruct must follow a specific template:
        // <|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

        // We'll prepare a universal prompt or handle specific logic.
        // For simplicity given the migration context, let's assume standard Llama 3 formatting if the model ID contains "llama" or "gpt-oss".

        let payload = {};
        let promptText = "";

        // Helper to format Llama 3 prompt
        if (messages && Array.isArray(messages)) {
            // Convert chat history to Llama 3 format
            promptText = "<|begin_of_text|>";

            if (system) {
                promptText += `<|start_header_id|>system<|end_header_id|>\n\n${system}<|eot_id|>`;
            }

            messages.forEach((msg: any) => {
                const role = msg.role === 'user' ? 'user' : 'assistant';
                promptText += `<|start_header_id|>${role}<|end_header_id|>\n\n${msg.text}<|eot_id|>`;
            });

            // Append the final assistant header for completion
            promptText += "<|start_header_id|>assistant<|end_header_id|>\n\n";

        } else {
            // Fallback for single prompt
            promptText = prompt || "";
        }

        if (MODEL_ID.includes("claude")) {
            // Anthropic Payload
            // ... unimplemented, user asked for "gpt-oss"
        }

        // Check if the model expects an OpenAI-like 'messages' format (implied by the error received)
        // The error "expected one of ... messages ..." suggests we should send the messages array directly.
        const isOpenAI = MODEL_ID.includes("openai") || MODEL_ID.includes("gpt");
        console.log("Is OpenAI-compatible model?", isOpenAI);

        if (isOpenAI) {
            console.log("Constructing 'messages' payload...");

            // Map frontend message format (text, role='model') to OpenAI format (content, role='assistant')
            const formattedMessages = messages ? messages.map((msg: any) => ({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: msg.text || msg.content // Handle input having 'text' property
            })) : [{ role: 'user', content: prompt }];

            payload = {
                messages: formattedMessages,
                model: MODEL_ID, // Some proxies/custom models need this
                max_tokens: 1024,
                temperature: 0.7,
                top_p: 0.9
            };
            // Note: Some Bedrock models (like Nova) use 'messages' but specific Bedrock-native structure.
            // This specific error looks very OpenAI-like.
        } else {
            console.log("Constructing 'prompt' payload (Llama default)...");
            // Defaulting to Llama 3 / Generic OSS payload structure (Prompt-based)
            payload = {
                prompt: promptText,
                max_gen_len: 512,
                temperature: 0.7,
                top_p: 0.9
            };
        }

        const command = new InvokeModelCommand({
            contentType: "application/json",
            body: JSON.stringify(payload),
            modelId: MODEL_ID,
        });

        console.log("Sending Payload to Bedrock:", JSON.stringify(payload, null, 2));

        const response = await client.send(command);
        const responseBody = new TextDecoder().decode(response.body);
        const parsed = JSON.parse(responseBody);

        // Llama 3 returns { generation: "..." }
        // Others might return { outputs: [{ text: "..." }] }

        let reply = "";
        if (parsed.generation) {
            reply = parsed.generation;
        } else if (parsed.outputs && parsed.outputs[0]) {
            reply = parsed.outputs[0].text;
        } else if (parsed.completion) {
            reply = parsed.completion;
        } else {
            reply = JSON.stringify(parsed); // Fallback
        }

        res.json({ reply });

    } catch (error: any) {
        const status = error?.$metadata?.httpStatusCode || 500;
        console.error("Bedrock Error:", error);
        res.status(status).json({
            error: error?.name || "Error",
            message: error?.message || "Internal Server Error",
            requestId: error?.$metadata?.requestId,
        });
    }
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Using Bedrock Model ID: ${MODEL_ID}`);
});

server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${port} is already in use.`);
    } else {
        console.error('SERVER ERROR:', err);
    }
});
