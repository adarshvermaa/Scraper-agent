import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto-js';
import { PrismaService } from '@modules/database/prisma.service';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { ChatMessage, ChatOptions, ChatResult } from './ai-provider.interface';
import Logger from '@common/logger';

export interface EmbeddingOptions {
  useCache?: boolean;
  provider?: 'openai' | 'anthropic' | 'gemini';
}

@Injectable()
export class AiService {
  private redis: Redis;
  private readonly embeddingBatchSize: number;
  private readonly cacheTtl: number;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private openaiProvider: OpenAiProvider,
    private anthropicProvider: AnthropicProvider,
    private geminiProvider: GeminiProvider,
  ) {
    const redisConfig = this.configService.get('redis');
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
    });

    const embeddingConfig = this.configService.get('embedding');
    this.embeddingBatchSize = embeddingConfig.batchSize;
    this.cacheTtl = embeddingConfig.cacheTtl;
  }

  /**
   * Embed single text with caching
   */
  async embed(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
    const { useCache = true, provider = 'gemini' } = options;

    // Check cache
    if (useCache) {
      const cached = await this.getCachedEmbedding(text, provider);
      if (cached) {
        Logger.debug({ provider, cached: true }, 'Using cached embedding');
        return cached;
      }
    }

    // Generate embedding
    const aiProvider = this.getProvider(provider);
    const result = await aiProvider.embed(text);

    // Log provider call
    await this.logProviderCall({
      provider: aiProvider.getName(),
      operation: 'embed',
      model: result.model,
      totalTokens: result.tokens,
      success: true,
    });

    // Cache result
    if (useCache) {
      await this.cacheEmbedding(text, result.embedding, provider, result.model);
    }

    return result.embedding;
  }

  /**
   * Embed multiple texts in batches with caching
   */
  async embedBatch(
    texts: string[],
    options: EmbeddingOptions = {},
  ): Promise<number[][]> {
    const { useCache = true, provider = 'gemini' } = options;
    const results: number[][] = new Array(texts.length);
    const toEmbed: { text: string; index: number; }[] = [];

    // Check cache for each text
    if (useCache) {
      for (let i = 0; i < texts.length; i++) {
        const cached = await this.getCachedEmbedding(texts[i], provider);
        if (cached) {
          results[i] = cached;
        } else {
          toEmbed.push({ text: texts[i], index: i });
        }
      }
    } else {
      texts.forEach((text, index) => toEmbed.push({ text, index }));
    }

    if (toEmbed.length === 0) {
      Logger.info('All embeddings served from cache');
      return results;
    }

    // Process in batches
    const aiProvider = this.getProvider(provider);
    for (let i = 0; i < toEmbed.length; i += this.embeddingBatchSize) {
      const batch = toEmbed.slice(i, i + this.embeddingBatchSize);
      const batchTexts = batch.map((item) => item.text);

      const batchResult = await aiProvider.embedBatch(batchTexts);

      // Store results
      for (let j = 0; j < batch.length; j++) {
        const embedding = batchResult.embeddings[j];
        results[batch[j].index] = embedding;

        // Cache individual embeddings
        if (useCache) {
          await this.cacheEmbedding(
            batch[j].text,
            embedding,
            provider,
            batchResult.model,
          );
        }
      }

      // Log provider call
      await this.logProviderCall({
        provider: aiProvider.getName(),
        operation: 'embed_batch',
        model: batchResult.model,
        totalTokens: batchResult.totalTokens,
        success: true,
      });

      Logger.info(
        { provider, batch: i / this.embeddingBatchSize + 1, count: batch.length },
        'Generated batch embeddings',
      );
    }

    return results;
  }

  /**
   * Generate chat completion
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions & { provider?: 'openai' | 'anthropic' | 'gemini'; } = {},
  ): Promise<ChatResult> {
    const { provider = 'openai', ...chatOptions } = options;
    const aiProvider = this.getProvider(provider);

    try {
      const result = await aiProvider.chat(messages, chatOptions);

      // Log provider call
      await this.logProviderCall({
        provider: aiProvider.getName(),
        operation: 'chat',
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        success: true,
      });

      return result;
    } catch (error) {
      await this.logProviderCall({
        provider: aiProvider.getName(),
        operation: 'chat',
        model: chatOptions.model || 'unknown',
        success: false,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Generate streaming chat completion
   */
  async *chatStream(
    messages: ChatMessage[],
    options: ChatOptions & { provider?: 'openai' | 'anthropic' | 'gemini'; } = {},
  ): AsyncGenerator<string, ChatResult, unknown> {
    const { provider = 'openai', ...chatOptions } = options;
    const aiProvider = this.getProvider(provider);

    try {
      const generator = aiProvider.chatStream(messages, chatOptions);
      let result: ChatResult | undefined;

      for await (const chunk of generator) {
        if (typeof chunk === 'string') {
          yield chunk;
        } else {
          result = chunk;
        }
      }

      if (result) {
        // Log provider call
        await this.logProviderCall({
          provider: aiProvider.getName(),
          operation: 'chat_stream',
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: result.totalTokens,
          success: true,
        });

        return result;
      }

      throw new Error('Stream ended without result');
    } catch (error) {
      await this.logProviderCall({
        provider: aiProvider.getName(),
        operation: 'chat_stream',
        model: chatOptions.model || 'unknown',
        success: false,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Generate summary for job content
   */
  async generateSummary(
    content: string,
    provider: 'openai' | 'anthropic' | 'gemini' = 'openai',
    model?: string,
  ): Promise<{ summary: string; model: string; tokens: number; }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a helpful assistant that creates concise summaries of job postings. Focus on key requirements, responsibilities, and qualifications.',
      },
      {
        role: 'user',
        content: `Please summarize the following job posting:\n\n${content}`,
      },
    ];

    const result = await this.chat(messages, { provider, model });

    return {
      summary: result.content,
      model: result.model,
      tokens: result.totalTokens || 0,
    };
  }

  private getProvider(provider: string): any {
    switch (provider) {
      case 'openai':
        return this.openaiProvider;
      case 'anthropic':
        return this.anthropicProvider;
      case 'gemini':
        return this.geminiProvider;
      default:
        return this.openaiProvider;
    }
  }

  private async getCachedEmbedding(
    text: string,
    provider: string,
  ): Promise<number[] | null> {
    const hash = this.hashText(text);
    const key = `embedding:${provider}:${hash}`;

    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  private async cacheEmbedding(
    text: string,
    embedding: number[],
    provider: string,
    model: string,
  ): Promise<void> {
    const hash = this.hashText(text);
    const key = `embedding:${provider}:${hash}`;

    await this.redis.setex(key, this.cacheTtl, JSON.stringify(embedding));

    // Also store in database for persistent cache
    try {
      await this.prisma.embeddingCache.upsert({
        where: { contentHash: hash },
        create: {
          contentHash: hash,
          embedding: [],
          model,
          provider,
        },
        update: {
          hitCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.warn({ error }, 'Failed to update embedding cache in database');
    }
  }

  private hashText(text: string): string {
    return crypto.SHA256(text).toString();
  }

  private async logProviderCall(data: {
    provider: string;
    operation: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    success: boolean;
    errorMessage?: string;
    jobId?: string;
  }): Promise<void> {
    try {
      await this.prisma.providerCallLog.create({
        data: {
          provider: data.provider,
          operation: data.operation,
          model: data.model,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
          success: data.success,
          errorMessage: data.errorMessage,
          latencyMs: 0, // Would need to track timing
          jobId: data.jobId,
        },
      });
    } catch (error) {
      Logger.warn({ error }, 'Failed to log provider call');
    }
  }
}
