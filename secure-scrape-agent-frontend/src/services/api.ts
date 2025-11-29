import socketService from './websocket';
import type { Job, SearchFilters, Publication, MetricsData } from '@/types/api';

/**
 * API Client using Socket.io instead of REST API
 * All requests are handled through WebSocket events
 */
class ApiClient {
  constructor() {
    // Initialize socket connection
    this.connect();
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    try {
      await socketService.connect();
    } catch (error) {
      console.error('Failed to connect to socket server:', error);
      throw error;
    }
  }

  /**
   * Ensure socket is connected before making requests
   */
  private async ensureConnected(): Promise<void> {
    if (!socketService.isConnected()) {
      await this.connect();
    }
  }

  // ============= Jobs API =============

  /**
   * Search for jobs
   */
  async searchJobs(
    query: string,
    filters?: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<{ jobs: Job[]; total: number; }> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.searchJobs(
        query,
        filters,
        page,
        limit,
        (response) => {
          resolve({ jobs: response.jobs, total: response.total });
        },
        (error) => {
          reject(new Error(error.error));
        }
      );
    });
  }

  /**
   * Get a single job by ID
   */
  async getJob(id: string): Promise<Job> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.getJob(
        id,
        (job) => resolve(job),
        (error) => reject(new Error(error.error))
      );
    });
  }

  /**
   * Get job chunks
   */
  async getJobChunks(id: string) {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.getJobChunks(
        id,
        (chunks) => resolve(chunks),
        (error) => reject(new Error(error.error))
      );
    });
  }

  /**
   * Summarize a job
   */
  async summarizeJob(
    id: string,
    provider: string = 'openai',
    model?: string
  ): Promise<{ summary: string; model: string; tokens: number; }> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.summarizeJob(
        id,
        provider,
        model,
        (response) => resolve(response),
        undefined, // progress handler (optional)
        (error) => reject(new Error(error.error))
      );
    });
  }

  /**
   * Ingest a URL
   */
  async ingestUrl(
    url: string,
    source: string
  ): Promise<{ jobId: string; }> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.ingestJob(
        url,
        source,
        (response) => resolve({ jobId: response.jobId }),
        undefined, // progress handler (optional)
        (error) => reject(new Error(error.error))
      );
    });
  }

  /**
   * Delete a job
   */
  async deleteJob(id: string): Promise<void> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.deleteJob(
        id,
        () => resolve(),
        (error) => reject(new Error(error.error))
      );
    });
  }

  // ============= Publications API =============

  /**
   * Get publications for a job
   */
  async getPublications(jobId: string): Promise<Publication[]> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.getPublications(
        jobId,
        (publications) => resolve(publications),
        (error) => reject(new Error(error.error))
      );
    });
  }

  /**
   * Create a publication
   */
  async createPublication(
    jobId: string,
    platform: string,
    content: string,
    scheduledFor?: string
  ): Promise<Publication> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.createPublication(
        { jobId, platform, content, scheduledFor },
        (publication) => resolve(publication),
        (error) => reject(new Error(error.error))
      );
    });
  }

  /**
   * Publish a publication now
   */
  async publishNow(id: string): Promise<Publication> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.publishNow(
        id,
        (publication) => resolve(publication),
        (error) => reject(new Error(error.error))
      );
    });
  }

  // ============= Metrics API =============

  /**
   * Get metrics
   */
  async getMetrics(): Promise<MetricsData> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.getMetrics(
        (metrics) => resolve(metrics),
        (error) => reject(new Error(error.error))
      );
    });
  }

  // ============= Settings API =============

  /**
   * Update settings
   */
  async updateSettings(settings: Record<string, any>): Promise<void> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      socketService.updateSettings(
        settings,
        () => resolve(),
        (error) => reject(new Error(error.error))
      );
    });
  }

  // ============= Helper Methods =============

  /**
   * Subscribe to new jobs broadcast
   */
  onNewJob(callback: (job: Job) => void): () => void {
    return socketService.onNewJob((data) => callback(data.job));
  }

  /**
   * Subscribe to job deletions broadcast
   */
  onJobDeleted(callback: (jobId: string) => void): () => void {
    return socketService.onJobDeleted((data) => callback(data.jobId));
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    socketService.disconnect();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
