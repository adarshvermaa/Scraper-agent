import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
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
export class AnthropicProvider implements IAiProvider {
    private client: Anthropic;
    private readonly config: any;

    constructor(private configService: ConfigService) {
        this.config = this.configService.get('anthropic') || {};
        this.client = new Anthropic({
            apiKey: this.config.apiKey || process.env.ANTHROPIC_API_KEY,
        });
    }

    getName(): string {
        return 'anthropic';
    }

    async embed(text: string): Promise<EmbeddingResult> {
        throw new Error('Embeddings not supported by Anthropic provider');
    }

    async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
        throw new Error('Embeddings not supported by Anthropic provider');
    }

    async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
        try {
            const systemMessage = messages.find(m => m.role === 'system')?.content;
            const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user' as const,
                content: m.content,
            }));

            const response = await this.client.messages.create({
                model: options.model || this.config.chatModel || 'claude-3-opus-20240229',
                messages: userMessages as any,
                system: systemMessage,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature || 0.7,
                stream: false,
            });

            return {
                content: response.content[0].text,
                model: response.model,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            };
        } catch (error) {
            Logger.error({ error, provider: 'anthropic' }, 'Failed to generate chat completion');
            throw error;
        }
    }

    async *chatStream(
        messages: ChatMessage[],
        options: ChatOptions = {},
    ): AsyncGenerator<string, ChatResult, unknown> {
        try {
            const systemMessage = messages.find(m => m.role === 'system')?.content;
            const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user' as const,
                content: m.content,
            }));

            const stream = await this.client.messages.create({
                model: options.model || this.config.chatModel || 'claude-3-opus-20240229',
                messages: userMessages as any,
                system: systemMessage,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature || 0.7,
                stream: true,
            });

            let fullContent = '';
            let inputTokens = 0;
            let outputTokens = 0;
            let model = '';

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    const delta = chunk.delta.text;
                    fullContent += delta;
                    yield delta;
                }
                if (chunk.type === 'message_start') {
                    model = chunk.message.model;
                    inputTokens = chunk.message.usage.input_tokens;
                }
                if (chunk.type === 'message_delta' && chunk.usage) {
                    outputTokens = chunk.usage.output_tokens;
                }
            }

            return {
                content: fullContent,
                model,
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
            };
        } catch (error) {
            Logger.error({ error, provider: 'anthropic' }, 'Failed to stream chat completion');
            throw error;
        }
    }
}
