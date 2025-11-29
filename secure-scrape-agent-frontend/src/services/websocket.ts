import { io, Socket } from 'socket.io-client';

type EventHandler<T = any> = (data: T) => void;
type ErrorHandler = (error: { error: string; }) => void;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly url: string;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.url = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3004';
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to Socket.IO server at ${this.url}`);

        this.socket = io(this.url, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('Socket.IO connected:', this.socket?.id);
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve();
        });

        this.socket.on('connection', (data: { message: string; clientId: string; }) => {
          console.log('Server connection response:', data);
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('Socket.IO disconnected:', reason);
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('Socket.IO connection error:', error.message);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.connectionPromise = null;
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          }
        });

        this.socket.on('error', (error: Error) => {
          console.error('Socket.IO error:', error);
        });

      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Emit an event to the server
   */
  emit<T = any>(event: string, data?: T): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Listen for an event from the server
   */
  on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return () => { };
    }

    this.socket.on(event, handler);

    // Return cleanup function
    return () => {
      this.socket?.off(event, handler);
    };
  }

  /**
   * Listen for an event once
   */
  once<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.once(event, handler);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler?: EventHandler): void {
    if (!this.socket) {
      return;
    }
    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (!this.socket) {
      return;
    }
    this.socket.removeAllListeners(event);
  }

  // ============= Job Events =============

  /**
   * Search for jobs
   */
  searchJobs(
    query: string,
    filters?: any,
    page = 1,
    limit = 20,
    onResponse?: EventHandler<{ jobs: any[]; total: number; page: number; limit: number; }>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('jobs:search:response', onResponse);
    if (onError) this.once('jobs:search:error', onError);
    this.emit('jobs:search', { query, filters, page, limit, provider: "gemini" });
  }

  /**
   * Get a single job
   */
  getJob(
    id: string,
    onResponse?: EventHandler<any>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('jobs:get:response', onResponse);
    if (onError) this.once('jobs:get:error', onError);
    this.emit('jobs:get', { id });
  }

  /**
   * Get job chunks
   */
  getJobChunks(
    id: string,
    onResponse?: EventHandler<any[]>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('jobs:chunks:response', onResponse);
    if (onError) this.once('jobs:chunks:error', onError);
    this.emit('jobs:chunks', { id });
  }

  /**
   * Ingest a new job
   */
  ingestJob(
    url: string,
    source: string,
    onResponse?: EventHandler<{ jobId: string; job: any; }>,
    onProgress?: EventHandler<{ status: string; message: string; }>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('jobs:ingest:response', onResponse);
    if (onProgress) this.on('jobs:ingest:progress', onProgress);
    if (onError) this.once('jobs:ingest:error', onError);
    this.emit('jobs:ingest', { url, source });
  }

  /**
   * Summarize a job
   */
  summarizeJob(
    jobId: string,
    provider = 'openai',
    model?: string,
    onResponse?: EventHandler<{ summary: string; model: string; tokens: number; }>,
    onProgress?: EventHandler<{ status: string; message: string; }>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('jobs:summarize:response', onResponse);
    if (onProgress) this.on('jobs:summarize:progress', onProgress);
    if (onError) this.once('jobs:summarize:error', onError);
    this.emit('jobs:summarize', { jobId, provider, model });
  }

  /**
   * Delete a job
   */
  deleteJob(
    id: string,
    onResponse?: EventHandler<{ success: boolean; }>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('jobs:delete:response', onResponse);
    if (onError) this.once('jobs:delete:error', onError);
    this.emit('jobs:delete', { id });
  }

  // ============= Publication Events =============

  /**
   * Get publications for a job
   */
  getPublications(
    jobId: string,
    onResponse?: EventHandler<any[]>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('publications:get:response', onResponse);
    if (onError) this.once('publications:get:error', onError);
    this.emit('publications:get', { jobId });
  }

  /**
   * Create a publication
   */
  createPublication(
    data: {
      jobId: string;
      platform: string;
      content: string;
      scheduledFor?: string;
    },
    onResponse?: EventHandler<any>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('publications:create:response', onResponse);
    if (onError) this.once('publications:create:error', onError);
    this.emit('publications:create', data);
  }

  /**
   * Publish a publication now
   */
  publishNow(
    id: string,
    onResponse?: EventHandler<any>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('publications:publish:response', onResponse);
    if (onError) this.once('publications:publish:error', onError);
    this.emit('publications:publish', { id });
  }

  // ============= Metrics Events =============

  /**
   * Get metrics
   */
  getMetrics(
    onResponse?: EventHandler<any>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('metrics:get:response', onResponse);
    if (onError) this.once('metrics:get:error', onError);
    this.emit('metrics:get');
  }

  // ============= Settings Events =============

  /**
   * Update settings
   */
  updateSettings(
    settings: Record<string, any>,
    onResponse?: EventHandler<{ success: boolean; }>,
    onError?: ErrorHandler
  ): void {
    if (onResponse) this.once('settings:update:response', onResponse);
    if (onError) this.once('settings:update:error', onError);
    this.emit('settings:update', settings);
  }

  // ============= Playground Events =============

  /**
   * Scrape a single URL
   */
  scrapeUrl(
    url: string,
    onStatus?: EventHandler<{ url: string; status: string; message: string; }>,
    onComplete?: EventHandler<{ url: string; data: any; }>,
    onError?: EventHandler<{ url: string; error: string; }>
  ): void {
    if (onStatus) this.on('scrape:status', onStatus);
    if (onComplete) this.on('scrape:complete', onComplete);
    if (onError) this.on('scrape:error', onError);
    this.emit('scrape:start', { url });
  }

  /**
   * Batch scrape URLs
   */
  scrapeBatch(
    urls: string[],
    onComplete?: EventHandler<{ count: number; }>
  ): void {
    if (onComplete) this.once('scrape:batch:complete', onComplete);
    this.emit('scrape:batch', { urls });
  }

  // ============= Broadcast Events (listen only) =============

  /**
   * Listen for new jobs added by any client
   */
  onNewJob(handler: EventHandler<{ job: any; }>): () => void {
    return this.on('jobs:new', handler);
  }

  /**
   * Listen for jobs deleted by any client
   */
  onJobDeleted(handler: EventHandler<{ jobId: string; }>): () => void {
    return this.on('jobs:deleted', handler);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
