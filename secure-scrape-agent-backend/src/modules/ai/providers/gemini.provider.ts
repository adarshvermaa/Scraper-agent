import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    IAiProvider,
    EmbeddingResult,
    EmbeddingBatchResult,
    ChatMessage,
    ChatOptions,
    ChatResult,
} from '../ai-provider.interface';
import Logger from '@common/logger';

@Injectable()
export class GeminiProvider implements IAiProvider {
    private client: GoogleGenerativeAI;
    private readonly config: any;

    constructor(private configService: ConfigService) {
        this.config = this.configService.get('gemini') || {};
        this.client = new GoogleGenerativeAI(this.config.apiKey || process.env.GEMINI_API_KEY);
    }
    getName(): string {
        return 'gemini';
    }

    async embed(text: string): Promise<EmbeddingResult> {
        console.log("text-embedding-004");
        try {
            const model = this.client.getGenerativeModel({ model: "text-embedding-004" });
            console.log(model, 'model');
            const result = await model.embedContent(text);
            console.log(result, 'result');
            const embedding = result.embedding;

            return {
                embedding: embedding.values,
                model: 'text-embedding-004',
                tokens: 0, // Gemini doesn't always return token usage for embeddings
            };
        } catch (error) {
            Logger.error({ error, provider: 'gemini' }, 'Failed to generate embedding');
            throw error;
        }
    }
    private async embedWithRetry(text: string, maxAttempts = 5): Promise<EmbeddingResult> {
        let attempt = 0;
        const baseDelay = 500; // ms

        while (attempt < maxAttempts) {
            attempt++;
            try {
                const model = this.client.getGenerativeModel({
                    model: "text-embedding-004",
                });
                const result = await model.embedContent(text);
                return {
                    embedding: result.embedding.values,
                    model: 'text-embedding-004',
                    tokens: 0,
                };
            } catch (err: any) {
                // if 429, backoff and retry; if other non-retriable, rethrow
                const status = err?.status || err?.code || (err?.response?.status);
                const message = String(err?.message || err);
                if (status === 429 || message.includes('Too Many Requests') || message.includes('Quota exceeded')) {
                    const delayMs = baseDelay * Math.pow(2, attempt - 1);
                    Logger.warn({ attempt, delayMs, provider: 'gemini', message }, 'Rate limited - backing off');
                    await this.delay(delayMs);
                    continue;
                }
                Logger.error({ err, provider: 'gemini' }, 'Non-retriable error during embedWithRetry');
                throw err;
            }
        }
        throw new Error('Max retry attempts reached for embedding (rate limited)');
    }
    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
        try {
            const embeddings: number[][] = [];
            for (let i = 0; i < texts.length; i++) {
                // small delay between requests to avoid per-minute quota bursts
                if (i > 0) await this.delay(200); // adjust delay as needed

                const embedRes = await this.embedWithRetry(texts[i]);
                embeddings.push(embedRes.embedding);
            }
            return {
                embeddings,
                model: 'text-embedding-004',
                totalTokens: 0,
            };
        } catch (error) {
            Logger.error({ error, provider: 'gemini' }, 'Failed to generate batch embeddings');
            throw error;
        }
    }

    async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
        try {
            const modelName = options.model || this.config.chatModel || 'gemini-pro';
            const model = this.client.getGenerativeModel({ model: modelName });

            // Convert messages to Gemini format
            // Gemini expects history + last message
            const history = messages.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));

            const lastMessage = messages[messages.length - 1];
            const chat = model.startChat({
                history: history as any,
                generationConfig: {
                    maxOutputTokens: options.maxTokens,
                    temperature: options.temperature,
                },
            });

            const result = await chat.sendMessage(lastMessage.content);
            const response = await result.response;
            const text = response.text();

            return {
                content: text,
                model: 'gemini-pro',
                inputTokens: 0, // Not always available
                outputTokens: 0,
                totalTokens: 0,
            };
        } catch (error) {
            Logger.error({ error, provider: 'gemini' }, 'Failed to generate chat completion');
            throw error;
        }
    }

    async *chatStream(
        messages: ChatMessage[],
        options: ChatOptions = {},
    ): AsyncGenerator<string, ChatResult, unknown> {
        try {
            const modelName = options.model || this.config.chatModel || 'gemini-pro';
            const model = this.client.getGenerativeModel({ model: modelName });

            const history = messages.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));

            const lastMessage = messages[messages.length - 1];
            const chat = model.startChat({
                history: history as any,
                generationConfig: {
                    maxOutputTokens: options.maxTokens,
                    temperature: options.temperature,
                },
            });

            const result = await chat.sendMessageStream(lastMessage.content);

            let fullContent = '';

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullContent += chunkText;
                yield chunkText;
            }

            return {
                content: fullContent,
                model: modelName,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
            };
        } catch (error) {
            Logger.error({ error, provider: 'gemini' }, 'Failed to stream chat completion');
            throw error;
        }
    }
}
