export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokens: number;
}

export interface EmbeddingBatchResult {
  embeddings: number[][];
  model: string;
  totalTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface IAiProvider {
  /**
   * Generate embedding for a single text
   */
  embed(text: string): Promise<EmbeddingResult>;

  /**
   * Generate embeddings for multiple texts in batch
   */
  embedBatch(texts: string[]): Promise<EmbeddingBatchResult>;

  /**
   * Generate chat completion
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;

  /**
   * Generate streaming chat completion
   */
  chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncGenerator<string, ChatResult, unknown>;

  /**
   * Get provider name
   */
  getName(): string;
}
