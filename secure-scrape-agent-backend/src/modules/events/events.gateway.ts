import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { IngestService } from '@modules/ingest/ingest.service';
import { ScraperService } from '@modules/scraper/scraper.service';
import { AiService } from '@modules/ai/ai.service';
import { PrismaService } from '@modules/database/prisma.service';
import { MetricsService } from '@modules/metrics/metrics.service';

interface SearchJobsPayload {
  query: string;
  filters?: any;
  page?: number;
  limit?: number;
  provider?: 'openai' | 'anthropic' | 'gemini';
}

interface IngestJobPayload {
  url: string;
  source: string;
}

interface SummarizeJobPayload {
  jobId: string;
  provider?: 'openai' | 'anthropic' | 'gemini';
  model?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly scraperService: ScraperService,
    private readonly ingestService: IngestService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) { }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection', { message: 'Connected to server', clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Job search event
  @SubscribeMessage('jobs:search')
  async handleJobSearch(
    @MessageBody() payload: SearchJobsPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { query, filters, page = 1, limit = 20, provider } = payload;

      this.logger.log(`Searching jobs: ${query}`);

      // Build search query
      const skip = (page - 1) * limit;

      const where: any = {};

      // Text search if query provided
      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ];
      }

      // Apply filters
      if (filters?.source) {
        where.source = filters.source;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.dateFrom) {
        where.publishedAt = { gte: new Date(filters.dateFrom) };
      }
      if (filters?.dateTo) {
        where.publishedAt = {
          ...where.publishedAt,
          lte: new Date(filters.dateTo)
        };
      }

      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: 'desc' },
        }),
        this.prisma.job.count({ where }),
      ]);

      client.emit('jobs:search:response', { jobs, total, page, limit });
    } catch (error) {
      this.logger.error(`Job search error: ${error.message}`);
      client.emit('jobs:search:error', { error: error.message });
    }
  }

  // Get single job
  @SubscribeMessage('jobs:get')
  async handleGetJob(
    @MessageBody() payload: { id: string; },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: payload.id },
        include: {
          chunks: true,
          publications: true,
        },
      });

      if (!job) {
        client.emit('jobs:get:error', { error: 'Job not found' });
        return;
      }

      client.emit('jobs:get:response', job);
    } catch (error) {
      this.logger.error(`Get job error: ${error.message}`);
      client.emit('jobs:get:error', { error: error.message });
    }
  }

  // Get job chunks
  @SubscribeMessage('jobs:chunks')
  async handleGetJobChunks(
    @MessageBody() payload: { id: string; },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const chunks = await this.prisma.chunk.findMany({
        where: { jobId: payload.id },
        orderBy: { position: 'asc' },
      });

      client.emit('jobs:chunks:response', chunks);
    } catch (error) {
      this.logger.error(`Get chunks error: ${error.message}`);
      client.emit('jobs:chunks:error', { error: error.message });
    }
  }

  // Ingest job
  @SubscribeMessage('jobs:ingest')
  async handleIngestJob(
    @MessageBody() payload: IngestJobPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(`Ingesting URL: ${payload.url}`);

      // Emit progress
      client.emit('jobs:ingest:progress', { status: 'scraping', message: 'Scraping content...' });

      // Scrape the content
      const scrapedContent = await this.scraperService.scrapeUrl(payload.url);

      client.emit('jobs:ingest:progress', {
        status: 'processing',
        message: 'Processing and indexing content...'
      });

      // Ingest the job
      const jobId = await this.ingestService.ingestJob(scrapedContent, payload.source);

      // Get the created job
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      client.emit('jobs:ingest:response', { jobId, job });

      // Broadcast to all clients that a new job was added
      this.server.emit('jobs:new', { job });
    } catch (error) {
      this.logger.error(`Ingest job error: ${error.message}`);
      client.emit('jobs:ingest:error', { error: error.message });
    }
  }

  // Summarize job
  @SubscribeMessage('jobs:summarize')
  async handleSummarizeJob(
    @MessageBody() payload: SummarizeJobPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { jobId, provider = 'openai', model } = payload;

      this.logger.log(`Summarizing job: ${jobId} with ${provider}`);

      // Get job with chunks
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: { chunks: true },
      });

      if (!job) {
        client.emit('jobs:summarize:error', { error: 'Job not found' });
        return;
      }

      client.emit('jobs:summarize:progress', {
        status: 'generating',
        message: 'Generating summary...'
      });

      // Generate summary using AI
      const fullContent = job.chunks
        .sort((a, b) => a.position - b.position)
        .map(c => c.content)
        .join('\n\n');

      const summary = await this.aiService.generateSummary(fullContent, provider, model);

      // Update job with summary
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          summary: summary.summary,
          summaryModel: summary.model,
        },
      });

      client.emit('jobs:summarize:response', {
        summary: summary.summary,
        model: summary.model,
        tokens: summary.tokens
      });
    } catch (error) {
      this.logger.error(`Summarize job error: ${error.message}`);
      client.emit('jobs:summarize:error', { error: error.message });
    }
  }

  // Delete job
  @SubscribeMessage('jobs:delete')
  async handleDeleteJob(
    @MessageBody() payload: { id: string; },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.prisma.job.delete({
        where: { id: payload.id },
      });

      client.emit('jobs:delete:response', { success: true });

      // Broadcast to all clients
      this.server.emit('jobs:deleted', { jobId: payload.id });
    } catch (error) {
      this.logger.error(`Delete job error: ${error.message}`);
      client.emit('jobs:delete:error', { error: error.message });
    }
  }

  // Get publications for a job
  @SubscribeMessage('publications:get')
  async handleGetPublications(
    @MessageBody() payload: { jobId: string; },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const publications = await this.prisma.publication.findMany({
        where: { jobId: payload.jobId },
        orderBy: { createdAt: 'desc' },
      });

      client.emit('publications:get:response', publications);
    } catch (error) {
      this.logger.error(`Get publications error: ${error.message}`);
      client.emit('publications:get:error', { error: error.message });
    }
  }

  // Create publication
  @SubscribeMessage('publications:create')
  async handleCreatePublication(
    @MessageBody() payload: {
      jobId: string;
      platform: string;
      content: string;
      scheduledFor?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const publication = await this.prisma.publication.create({
        data: {
          jobId: payload.jobId,
          platform: payload.platform,
          content: payload.content,
          scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : null,
          status: 'DRAFT',
        },
      });

      client.emit('publications:create:response', publication);
    } catch (error) {
      this.logger.error(`Create publication error: ${error.message}`);
      client.emit('publications:create:error', { error: error.message });
    }
  }

  // Publish now
  @SubscribeMessage('publications:publish')
  async handlePublishNow(
    @MessageBody() payload: { id: string; },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const publication = await this.prisma.publication.update({
        where: { id: payload.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      client.emit('publications:publish:response', publication);
    } catch (error) {
      this.logger.error(`Publish error: ${error.message}`);
      client.emit('publications:publish:error', { error: error.message });
    }
  }

  // Get metrics
  @SubscribeMessage('metrics:get')
  async handleGetMetrics(@ConnectedSocket() client: Socket) {
    try {
      const metrics = await this.metricsService.getMetrics();
      client.emit('metrics:get:response', metrics);
    } catch (error) {
      this.logger.error(`Get metrics error: ${error.message}`);
      client.emit('metrics:get:error', { error: error.message });
    }
  }

  // Update settings
  @SubscribeMessage('settings:update')
  async handleUpdateSettings(
    @MessageBody() payload: Record<string, any>,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Implement settings update logic here
      // For now, just acknowledge
      client.emit('settings:update:response', { success: true });
    } catch (error) {
      this.logger.error(`Update settings error: ${error.message}`);
      client.emit('settings:update:error', { error: error.message });
    }
  }

  // Scrape single URL (Playground)
  @SubscribeMessage('scrape:start')
  async handleScrapeStart(
    @MessageBody() payload: { url: string; },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(`Starting playground scrape: ${payload.url}`);

      client.emit('scrape:status', {
        url: payload.url,
        status: 'scraping',
        message: 'Fetching content...'
      });

      const scrapedContent = await this.scraperService.scrapeUrl(payload.url);

      client.emit('scrape:status', {
        url: payload.url,
        status: 'processing',
        message: 'Content scraped successfully'
      });

      client.emit('scrape:complete', {
        url: payload.url,
        data: scrapedContent
      });

    } catch (error) {
      this.logger.error(`Scrape error: ${error.message}`);
      client.emit('scrape:error', {
        url: payload.url,
        error: error.message
      });
    }
  }

  // Batch scrape (Playground)
  @SubscribeMessage('scrape:batch')
  async handleBatchScrape(
    @MessageBody() payload: { urls: string[]; },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Starting batch scrape for ${payload.urls.length} URLs`);

    for (const url of payload.urls) {
      await this.handleScrapeStart({ url }, client);
    }

    client.emit('scrape:batch:complete', {
      count: payload.urls.length
    });
  }
}
