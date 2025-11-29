// src/modules/milvus/milvus.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilvusClient, DataType, IndexType } from '@zilliz/milvus2-sdk-node';
import {
  IVectorStore,
  VectorSearchResult,
  VectorUpsertOptions,
  VectorSearchOptions,
} from './vector-store.interface';

@Injectable()
export class MilvusService implements IVectorStore, OnModuleInit {
  private client: MilvusClient | null = null;
  private readonly config: any;
  private initializing = false;
  private readyFlag = false;
  private readonly logger = new Logger(MilvusService.name);

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('milvus') || {};
  }

  // Allow other modules to wait for Milvus readiness
  public async ready(timeoutMs = 30000): Promise<void> {
    const start = Date.now();
    while (!this.readyFlag) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Milvus did not become ready in time');
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  async onModuleInit() {
    // guard to avoid double calls during hot-reload / DI surprises
    if (this.initializing || this.readyFlag) return;
    this.initializing = true;
    try {
      await this.initializeWithRetry();
    } finally {
      this.initializing = false;
    }
  }

  private getAddress(): string {
    // prefer explicit env var to avoid "localhost" issues in containers
    return process.env.MILVUS_ADDR || this.config.address || 'localhost:19530';
  }

  private buildClientOptions() {
    // Only include credentials if provided
    const opts: any = { address: this.getAddress() };
    if (this.config.username) opts.username = this.config.username;
    if (this.config.password) opts.password = this.config.password;
    if (this.config.database) opts.database = this.config.database;
    return opts;
  }

  private async initializeWithRetry(retries = 8, baseDelayMs = 500): Promise<void> {
    // Prevent repeated initialization across hot reloads (attach to global)
    // @ts-ignore
    if ((global as any).__milvus_client_instance) {
      this.client = (global as any).__milvus_client_instance as MilvusClient;
      this.logger.log(`Using existing global MilvusClient -> ${this.getAddress()}`);
      this.readyFlag = true;
      return;
    }

    const opts = this.buildClientOptions();
    let lastErr: any = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.client = new MilvusClient(opts);
        this.logger.log(`Milvus client initialized (attempt ${attempt}) - ${opts.address}`);

        // sanity call - getVersion validates gRPC handshake
        const version = await this.client.getVersion();
        this.logger.log(`Connected to Milvus: ${JSON.stringify(version)}`);

        // cache globally
        // @ts-ignore
        (global as any).__milvus_client_instance = this.client;
        this.readyFlag = true;
        return;
      } catch (err: any) {
        lastErr = err;
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // exponential backoff
        this.logger.warn(`Milvus connect attempt ${attempt} failed: ${err?.message || err}. retrying in ${delay}ms`);
        // cleanup client reference in case of partial init
        try {
          // close if SDK exposes close
          // @ts-ignore
          if (this.client && typeof (this.client as any).close === 'function') {
            // @ts-ignore
            await (this.client as any).close();
          }
        } catch (_) {
          // ignore
        }
        this.client = null;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    this.logger.error(`Failed to initialize Milvus after ${retries} attempts: ${lastErr?.message || lastErr}`);
    throw lastErr || new Error('Milvus initialization failed (unknown)');
  }

  async initialize(): Promise<void> {
    if (!this.client) {
      await this.initializeWithRetry();
    }
  }

  // --------------------------
  // Collection / index helpers
  // --------------------------
  async createCollection(name: string, dimension: number): Promise<void> {
    if (!this.client) throw new Error('Milvus client not initialized');
    try {
      const exists = await this.hasCollection(name);
      if (exists) {
        this.logger.log({ collection: name }, 'Collection already exists');
        return;
      }

      await this.client.createCollection({
        collection_name: name,
        fields: [
          {
            name: 'id',
            data_type: DataType.VarChar,
            is_primary_key: true,
            max_length: 255,
          },
          {
            name: 'vector',
            data_type: DataType.FloatVector,
            dim: dimension,
          },
          {
            name: 'metadata',
            data_type: DataType.JSON,
          },
        ],
      });

      this.logger.log(`Created Milvus collection ${name} (dim=${dimension})`);

      await this.createIndex(name, dimension);

      await this.client.loadCollection({ collection_name: name });
      this.logger.log(`Collection ${name} loaded`);
    } catch (error) {
      this.logger.error(`Failed to create collection ${name}: ${(error as any)?.message || error}`);
      throw error;
    }
  }

  private async createIndex(collectionName: string, dimension: number): Promise<void> {
    if (!this.client) throw new Error('Milvus client not initialized');

    const indexType = this.config.indexType || 'IVF_PQ';

    // Build index payload in shape expected by SDK
    const indexPayload: any = {
      collection_name: collectionName,
      field_name: 'vector',
      index_name: `${collectionName}_vector_index`,
      index_type: IndexType.IVF_PQ,
      params: {},
    };

    if (indexType === 'IVF_PQ') {
      indexPayload.index_type = IndexType.IVF_PQ;
      indexPayload.params = {
        nlist: this.config.nlist || 1024,
        m: this.config.m || 8,
        nbits: this.config.nbits || 8,
      };
    } else if (indexType === 'HNSW') {
      indexPayload.index_type = IndexType.HNSW;
      indexPayload.params = {
        M: this.config.M || 16,
        efConstruction: this.config.efConstruction || 256,
      };
    } else if (indexType === 'IVF_FLAT') {
      indexPayload.index_type = IndexType.IVF_FLAT;
      indexPayload.params = {
        nlist: this.config.nlist || 1024,
      };
    }

    await this.client.createIndex(indexPayload);

    this.logger.log(`Created Milvus index for ${collectionName} type=${indexPayload.index_type}`);
  }

  // --------------------------
  // Upsert / search / delete
  // --------------------------
  async upsert(collectionName: string, vectors: VectorUpsertOptions[]): Promise<void> {
    if (!this.client) throw new Error('Milvus client not initialized');
    try {
      const fieldsData = vectors.map((v) => ({
        id: v.id,
        vector: v.vector,
        metadata: v.metadata || {},
      }));

      await this.client.insert({
        collection_name: collectionName,
        fields_data: fieldsData,
      });

      this.logger.log(`Upserted ${vectors.length} vectors into ${collectionName}`);
    } catch (error) {
      this.logger.error(`Failed to upsert vectors into ${collectionName}: ${(error as any)?.message || error}`);
      throw error;
    }
  }

  async search(
    collectionName: string,
    queryVector: number[],
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult[]> {
    if (!this.client) throw new Error('Milvus client not initialized');

    this.logger.log(`=== MILVUS SEARCH DEBUG START ===`);
    this.logger.log(`Collection: ${collectionName}`);
    this.logger.log(`Query vector length: ${queryVector?.length || 'undefined'}`);
    this.logger.log(`Query vector type: ${typeof queryVector}, isArray: ${Array.isArray(queryVector)}`);
    this.logger.log(`Options: ${JSON.stringify(options)}`);

    try {
      const { topK = 10, includeMetadata = true } = options;

      // Check if collection exists, create if it doesn't
      const collectionExists = await this.hasCollection(collectionName);
      if (!collectionExists) {
        this.logger.warn(`Collection ${collectionName} does not exist, creating it...`);
        const dimension = queryVector.length;
        await this.createCollection(collectionName, dimension);
        this.logger.log(`Collection ${collectionName} created with dimension ${dimension}`);
      } else {
        // Ensure collection is loaded before searching
        try {
          await this.client.loadCollection({ collection_name: collectionName });
          this.logger.log(`Collection ${collectionName} loaded for search`);
        } catch (loadError) {
          this.logger.warn(`Failed to load collection ${collectionName}: ${(loadError as any)?.message || loadError}`);
          // Continue anyway - collection might already be loaded
        }
      }

      const searchParams: any = {
        collection_name: collectionName,
        data: [queryVector], // SDK expects array of vectors
        anns_field: 'vector', // Name of the vector field
        limit: topK,
        output_fields: includeMetadata ? ['id', 'metadata'] : ['id'],
        search_params: {
          metric_type: 'L2',
          params: {
            nprobe: this.config.nprobe || 16,
          },
        },
      };

      // Only include filter if there's an actual filter
      if (options.filter) {
        searchParams.filter = JSON.stringify(options.filter);
      }

      this.logger.log(`Search params: ${JSON.stringify({ ...searchParams, data: `[array of ${queryVector?.length}]` })}`);

      this.logger.log(`Calling client.search...`);
      const results: any = await this.client.search(searchParams);
      this.logger.log(`Search completed, processing results...`);

      // Debug logging to see actual structure
      this.logger.log(`Results type: ${typeof results}, isArray: ${Array.isArray(results)}`);
      this.logger.log(`Results keys: ${JSON.stringify(Object.keys(results || {}))}`);
      this.logger.log(`Full results structure: ${JSON.stringify(results, null, 2).substring(0, 500)}...`);

      // Milvus SDK returns results in format: { status, results: [...] }
      // The results array contains the actual hits
      let hits: any[] = [];
      if (results?.results && Array.isArray(results.results)) {
        this.logger.log(`Using results.results, length: ${results.results.length}`);
        hits = results.results;
      } else if (Array.isArray(results)) {
        this.logger.log(`Using results directly as array, length: ${results.length}`);
        hits = results;
      } else {
        this.logger.warn(`Unexpected results structure!`);
        hits = [];
      }

      this.logger.log(`Processing ${hits.length} hits...`);

      // Safely map results with proper checks
      const mapped = hits
        .filter((r) => r != null) // Filter out null/undefined items
        .map((r: any, index: number) => {
          this.logger.log(`Mapping hit ${index}: keys = ${JSON.stringify(Object.keys(r || {}))}`);
          return {
            id: r.id ?? r._id ?? r.primary_key ?? null,
            score: r.score ?? r.distance ?? null,
            metadata: includeMetadata ? (r.metadata ?? r.payload ?? {}) : undefined,
          };
        });

      this.logger.log(`=== MILVUS SEARCH DEBUG END - Returning ${mapped.length} results ===`);
      return mapped;
    } catch (error) {
      this.logger.error(`SEARCH ERROR: ${(error as any)?.message || error}`);
      this.logger.error(`Error stack: ${(error as any)?.stack}`);
      throw error;
    }
  }

  async delete(collectionName: string, ids: string[]): Promise<void> {
    if (!this.client) throw new Error('Milvus client not initialized');
    try {
      await this.client.delete({
        collection_name: collectionName,
        filter: `id in [${ids.map((i) => `"${i}"`).join(',')}]`,
      });

      this.logger.log(`Deleted ${ids.length} vectors from ${collectionName}`);
    } catch (error) {
      this.logger.error(`Failed to delete vectors from ${collectionName}: ${(error as any)?.message || error}`);
      throw error;
    }
  }

  async get(collectionName: string, id: string): Promise<VectorUpsertOptions | null> {
    if (!this.client) throw new Error('Milvus client not initialized');
    try {
      const results: any = await this.client.query({
        collection_name: collectionName,
        expr: `id == "${id}"`,
        output_fields: ['id', 'vector', 'metadata'],
      });

      if (!results || results.length === 0) return null;

      const result = results[0];
      return {
        id: result.id,
        vector: result.vector,
        metadata: result.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get vector ${id} from ${collectionName}: ${(error as any)?.message || error}`);
      throw error;
    }
  }

  async hasCollection(name: string): Promise<boolean> {
    if (!this.client) throw new Error('Milvus client not initialized');
    try {
      const response = await this.client.hasCollection({ collection_name: name });
      return !!(response?.value ?? response);
    } catch (error) {
      this.logger.error(`Failed to check collection ${name}: ${(error as any)?.message || error}`);
      return false;
    }
  }

  async getStats(collectionName: string): Promise<{ vectorCount: number; dimension: number; }> {
    if (!this.client) throw new Error('Milvus client not initialized');
    try {
      const stats = await this.client.getCollectionStatistics({ collection_name: collectionName });
      return {
        vectorCount: parseInt((stats as any)?.data?.row_count ?? '0', 10) || 0,
        dimension: this.config.dimension || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats for ${collectionName}: ${(error as any)?.message || error}`);
      throw error;
    }
  }
}
