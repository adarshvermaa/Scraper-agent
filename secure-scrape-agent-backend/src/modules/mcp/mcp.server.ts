import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import { PrismaService } from '@modules/database/prisma.service';
import { ScraperService } from '@modules/scraper/scraper.service';
import { IngestService } from '@modules/ingest/ingest.service';
import { AiService } from '@modules/ai/ai.service';
import { IVectorStore } from '@modules/vector-store/vector-store.interface';
import { VECTOR_STORE_TOKEN } from '@modules/vector-store/vector-store.module';
import Logger from '@common/logger';

export interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params: any;
  id: string | number;
}

export interface JsonRpcResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

@Injectable()
export class McpServer implements OnModuleInit {
  private server: net.Server;
  private readonly port: number;
  private readonly host: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private scraperService: ScraperService,
    private ingestService: IngestService,
    private aiService: AiService,
    @Inject(VECTOR_STORE_TOKEN) private vectorStore: IVectorStore,
  ) {
    const config = this.configService.get('mcp');
    this.port = config.port;
    this.host = config.host;
  }

  async onModuleInit() {
    this.startServer();
  }

  private startServer(): void {
    this.server = net.createServer((socket) => {
      Logger.info({ remoteAddress: socket.remoteAddress }, 'MCP client connected');

      let buffer = '';

      socket.on('data', (data) => {
        console.log(data);
        buffer += data.toString();

        // Process complete JSON-RPC messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            this.handleRequest(line, socket);
          }
        }
      });

      socket.on('end', () => {
        Logger.info('MCP client disconnected');
      });

      socket.on('error', (error) => {
        Logger.error({ error }, 'MCP socket error');
      });
    });

    this.server.listen(this.port, this.host, () => {
      Logger.info({ port: this.port, host: this.host }, 'MCP server started');
    });
  }

  public async processRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      Logger.info({ method: request.method, id: request.id }, 'MCP request received');

      let result: any;

      switch (request.method) {
        case 'search_jobs':
          result = await this.searchJobs(request.params);
          break;
        case 'get_job':
          result = await this.getJob(request.params);
          break;
        case 'summarize_job':
          result = await this.summarizeJob(request.params);
          break;
        case 'publish_job':
          result = await this.publishJob(request.params);
          break;
        case 'ingest_url':
          result = await this.ingestUrl(request.params);
          break;
        case 'list_tools': // Added list_tools for discovery
          result = this.listTools();
          break;
        default:
          throw new Error(`Unknown method: ${request.method}`);
      }

      return {
        jsonrpc: '2.0',
        result,
        id: request.id,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: (error as Error).message,
        },
        id: request.id || 0,
      };
    }
  }

  private async handleRequest(data: string, socket: net.Socket): Promise<void> {
    try {
      const request: JsonRpcRequest = JSON.parse(data);
      const response = await this.processRequest(request);
      socket.write(JSON.stringify(response) + '\n');
    } catch (error) {
      // Handle JSON parse error
      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error',
        },
        id: null,
      };
      socket.write(JSON.stringify(errorResponse) + '\n');
    }
  }

  public listTools() {
    return [
      {
        name: 'search_jobs',
        description: 'Search for jobs with filters',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            filters: { type: 'object' },
            limit: { type: 'number' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_job',
        description: 'Get job details by ID',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'summarize_job',
        description: 'Summarize a job',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            provider: { type: 'string', enum: ['openai', 'anthropic', 'gemini'] },
            model: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'publish_job',
        description: 'Publish a job to a platform',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            platform: { type: 'string' },
            content: { type: 'string' },
            scheduledFor: { type: 'string' }
          },
          required: ['id', 'platform', 'content']
        }
      },
      {
        name: 'ingest_url',
        description: 'Ingest a job from a URL',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            source: { type: 'string' }
          },
          required: ['url', 'source']
        }
      }
    ];
  }

  private async searchJobs(params: {
    query: string;
    filters?: { source?: string; company?: string; tags?: string[]; };
    limit?: number;
  }): Promise<any> {
    const { query, filters = {}, limit = 10 } = params;

    // Generate query embedding
    const queryEmbedding = await this.aiService.embed(query);

    // Search vector store
    const collectionName = this.configService.get('milvus.collection');
    const results = await this.vectorStore.search(collectionName, queryEmbedding, {
      topK: limit,
      includeMetadata: true,
    });

    // Get full job details
    const jobIds = [...new Set(results.map((r) => r.metadata?.jobId).filter(Boolean))];
    const jobs = await this.prisma.job.findMany({
      where: {
        id: { in: jobIds },
        ...(filters.source && { source: filters.source }),
        ...(filters.company && { company: filters.company }),
        ...(filters.tags && { tags: { hasSome: filters.tags } }),
      },
      take: limit,
    });

    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      source: job.source,
      publishedAt: job.publishedAt,
      summary: job.summary,
      url: job.url,
      tags: job.tags,
    }));
  }

  private async getJob(params: { id: string; }): Promise<any> {
    const job = await this.prisma.job.findUnique({
      where: { id: params.id },
      include: {
        chunks: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!job) {
      throw new Error(`Job not found: ${params.id}`);
    }

    return job;
  }

  private async summarizeJob(params: {
    id: string;
    provider?: 'openai' | 'anthropic' | 'gemini';
    model?: string;
  }): Promise<any> {
    const { id, provider = 'openai', model } = params;

    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful assistant that summarizes job postings and articles.',
      },
      {
        role: 'user' as const,
        content: `Summarize the following content:\n\n${job.content}`,
      },
    ];

    const result = await this.aiService.chat(messages, { provider, model });

    // Update job with summary
    await this.prisma.job.update({
      where: { id },
      data: { summary: result.content },
    });

    return {
      summary: result.content,
      model: result.model,
      tokens: result.totalTokens,
    };
  }

  private async publishJob(params: {
    id: string;
    platform: string;
    content: string;
    scheduledFor?: string;
  }): Promise<any> {
    const { id, platform, content, scheduledFor } = params;

    const publication = await this.prisma.publication.create({
      data: {
        jobId: id,
        platform,
        content,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return publication;
  }

  private async ingestUrl(params: { url: string; source: string; }): Promise<any> {
    const { url, source } = params;

    // Scrape content
    const content = await this.scraperService.scrapeUrl(url);

    // Ingest into system
    const jobId = await this.ingestService.ingestJob(content, source);

    return { jobId, url };
  }
}
