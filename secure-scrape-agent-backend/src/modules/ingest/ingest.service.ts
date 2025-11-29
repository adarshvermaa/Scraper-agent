import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@modules/database/prisma.service';
import { AiService } from '@modules/ai/ai.service';
import { IVectorStore } from '@modules/vector-store/vector-store.interface';
import { VECTOR_STORE_TOKEN } from '@modules/vector-store/vector-store.module';
import { ScrapedContent } from '@modules/scraper/scraper.types';
import { ChunkerService } from './chunker.service';
import Logger from '@common/logger';
import * as crypto from 'crypto-js';

@Injectable()
export class IngestService {
  private readonly collectionName: string;

  constructor(
    private configService: ConfigService,
    @Inject(PrismaService) private prisma: any,
    private aiService: AiService,
    private chunkerService: ChunkerService,
    @Inject(VECTOR_STORE_TOKEN) private vectorStore: IVectorStore,
  ) {
    this.collectionName = this.configService.get('milvus.collection', 'job_embeddings');
  }

  async ingestJob(content: ScrapedContent, source: string): Promise<string> {
    const startTime = Date.now();

    try {
      // Use content_text or fallback to legacy content
      const contentText = content.content_text || content.content || '';

      // Generate content hash for deduplication
      const contentHash = crypto.SHA256(contentText).toString();

      // Check if already exists
      const existing = await this.prisma.job.findUnique({
        where: { contentHash },
      });

      if (existing) {
        Logger.info({ url: content.url, jobId: existing.id }, 'Job already exists');
        return existing.id;
      }

      //  1: Chunk the content
      const chunks = await this.chunkerService.chunk(contentText);
      Logger.info({ url: content.url, chunkCount: chunks.length }, 'Content chunked');

      // Step 2: Generate embeddings in batch
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await this.aiService.embedBatch(chunkTexts);
      Logger.info({ url: content.url, embeddingCount: embeddings.length }, 'Embeddings generated');

      // Step 3: Create job in database
      const job = await this.prisma.job.create({
        data: {
          url: content.url,
          title: content.title,
          company: content.metadata?.company || content.og_meta?.['og:site_name'],
          source,
          publishedAt: content.published_at || content.metadata?.publishedAt,
          content: contentText,
          rawHtml: content.raw_html || content.content_html || '',
          metadata: content.metadata || {},

          // Enhanced fields
          canonicalUrl: content.canonical_url,
          language: content.language,
          headings: content.headings as any, // Cast to any for Json type
          images: content.images as any,
          author: content.author as any,

          summary: null,
          tags: content.tags || content.metadata?.tags || [],
          contactInfo: content.contactInfo || (content.author?.contacts ? { emails: content.author.contacts.map(c => c.email).filter(Boolean) } : {}),
          vectorIds: [],
          status: 'PROCESSING',
          contentHash,
        },
      });

      // Step 4: Prepare vector upserts
      const vectorUpserts = chunks.map((chunk, index) => ({
        id: `${job.id}_chunk_${index}`,
        vector: embeddings[index],
        metadata: {
          jobId: job.id,
          chunkIndex: index,
          url: content.url,
          title: content.title,
        },
      }));

      // Step 5: Bulk upsert to vector store
      await this.vectorStore.upsert(this.collectionName, vectorUpserts);
      Logger.info({ jobId: job.id, vectorCount: vectorUpserts.length }, 'Vectors upserted');

      // Step 6: Create chunk records
      const chunkRecords = chunks.map((chunk, index) => ({
        jobId: job.id,
        content: chunk.text,
        position: index,
        tokens: chunk.tokens,
        vectorId: vectorUpserts[index].id,
        embeddingModel: 'text-embedding-004', // Gemini embedding model
      }));

      await this.prisma.chunk.createMany({
        data: chunkRecords,
      });

      // Step 7: Update job with vector IDs
      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          vectorIds: vectorUpserts.map((v) => v.id),
          status: 'INDEXED',
        },
      });

      const duration = Date.now() - startTime;
      Logger.info(
        { jobId: job.id, url: content.url, duration },
        'Job ingestion completed',
      );

      return job.id;
    } catch (error) {
      Logger.error({ error, url: content.url }, 'Job ingestion failed');
      throw error;
    }
  }
}
