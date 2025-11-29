import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import {
  IVectorStore,
  VectorSearchResult,
  VectorUpsertOptions,
  VectorSearchOptions,
} from './vector-store.interface';
import Logger from '@common/logger';

@Injectable()
export class PineconeService implements IVectorStore, OnModuleInit {
  private client: Pinecone;
  private readonly config: any;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get('pinecone');
  }

  async onModuleInit() {
    await this.initialize();
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      Logger.warn('Pinecone API key not found, skipping initialization');
      return;
    }

    try {
      this.client = new Pinecone({
        apiKey: this.config.apiKey,
      });

      Logger.info('Pinecone client initialized');
    } catch (error) {
      Logger.error({ error }, 'Failed to initialize Pinecone');
      throw error;
    }
  }

  async createCollection(name: string, dimension: number): Promise<void> {
    try {
      const exists = await this.hasCollection(name);
      if (exists) {
        Logger.info({ index: name }, 'Pinecone index already exists');
        return;
      }

      await this.client.createIndex({
        name,
        dimension,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });

      Logger.info({ index: name, dimension }, 'Created Pinecone index');
    } catch (error) {
      Logger.error({ error, index: name }, 'Failed to create Pinecone index');
      throw error;
    }
  }

  async upsert(collectionName: string, vectors: VectorUpsertOptions[]): Promise<void> {
    try {
      const index = this.client.index(collectionName);

      const records = vectors.map((v) => ({
        id: v.id,
        values: v.vector,
        metadata: v.metadata || {},
      }));

      await index.upsert(records);

      Logger.info({ index: collectionName, count: vectors.length }, 'Upserted to Pinecone');
    } catch (error) {
      Logger.error({ error, index: collectionName }, 'Failed to upsert to Pinecone');
      throw error;
    }
  }

  async search(
    collectionName: string,
    queryVector: number[],
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult[]> {
    try {
      const { topK = 10, filter, includeMetadata = true } = options;
      const index = this.client.index(collectionName);

      const response = await index.query({
        vector: queryVector,
        topK,
        filter,
        includeMetadata,
      });

      return response.matches?.map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
      })) || [];
    } catch (error) {
      Logger.error({ error, index: collectionName }, 'Failed to search Pinecone');
      throw error;
    }
  }

  async delete(collectionName: string, ids: string[]): Promise<void> {
    try {
      const index = this.client.index(collectionName);
      await index.deleteMany(ids);

      Logger.info({ index: collectionName, count: ids.length }, 'Deleted from Pinecone');
    } catch (error) {
      Logger.error({ error, index: collectionName }, 'Failed to delete from Pinecone');
      throw error;
    }
  }

  async get(collectionName: string, id: string): Promise<VectorUpsertOptions | null> {
    try {
      const index = this.client.index(collectionName);
      const response = await index.fetch([id]);

      const record = response.records?.[id];
      if (!record) {
        return null;
      }

      return {
        id: record.id,
        vector: record.values,
        metadata: record.metadata,
      };
    } catch (error) {
      Logger.error({ error, index: collectionName, id }, 'Failed to get from Pinecone');
      throw error;
    }
  }

  async hasCollection(name: string): Promise<boolean> {
    try {
      const indexes = await this.client.listIndexes();
      return indexes.indexes?.some((idx) => idx.name === name) || false;
    } catch (error) {
      Logger.error({ error, index: name }, 'Failed to check Pinecone index');
      return false;
    }
  }

  async getStats(collectionName: string): Promise<{ vectorCount: number; dimension: number }> {
    try {
      const index = this.client.index(collectionName);
      const stats = await index.describeIndexStats();

      return {
        vectorCount: stats.totalRecordCount || 0,
        dimension: stats.dimension || 0,
      };
    } catch (error) {
      Logger.error({ error, index: collectionName }, 'Failed to get Pinecone stats');
      throw error;
    }
  }
}
