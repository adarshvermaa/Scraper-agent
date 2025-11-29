import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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
export class OpenAiProvider implements IAiProvider {
  private client: OpenAI;
  private readonly config: any;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get('openai');
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout,
    });
  }

  getName(): string {
    return 'openai';
  }

  async embed(text: string): Promise<EmbeddingResult> {
    try {
      const response = await this.client.embeddings.create({
        model: this.config.embeddingModel,
        input: text,
      });

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        tokens: response.usage.total_tokens,
      };
    } catch (error) {
      Logger.error({ error, provider: 'openai' }, 'Failed to generate embedding');
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
    try {
      const response = await this.client.embeddings.create({
        model: this.config.embeddingModel,
        input: texts,
      });

      return {
        embeddings: response.data.map((d) => d.embedding),
        model: response.model,
        totalTokens: response.usage.total_tokens,
      };
    } catch (error) {
      Logger.error(
        { error, provider: 'openai', count: texts.length },
        'Failed to generate batch embeddings',
      );
      throw error;
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.config.chatModel,
        messages: messages as any,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        stream: false,
      });

      const choice = response.choices[0];
      return {
        content: choice.message.content || '',
        model: response.model,
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      Logger.error({ error, provider: 'openai' }, 'Failed to generate chat completion');
      throw error;
    }
  }

  async *chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): AsyncGenerator<string, ChatResult, unknown> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.config.chatModel,
        messages: messages as any,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        stream: true,
      });

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let model = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          yield delta;
        }
        if (chunk.model) {
          model = chunk.model;
        }
      }

      // Estimate tokens (rough approximation)
      outputTokens = Math.ceil(fullContent.length / 4);
      inputTokens = Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4);

      return {
        content: fullContent,
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      };
    } catch (error) {
      Logger.error({ error, provider: 'openai' }, 'Failed to stream chat completion');
      throw error;
    }
  }
}
