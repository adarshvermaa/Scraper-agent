export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface VectorUpsertOptions {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export interface VectorSearchOptions {
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface IVectorStore {
  /**
   * Initialize the vector store connection
   */
  initialize(): Promise<void>;

  /**
   * Create or update collection/index
   */
  createCollection(name: string, dimension: number): Promise<void>;

  /**
   * Upsert vectors in batch
   */
  upsert(collectionName: string, vectors: VectorUpsertOptions[]): Promise<void>;

  /**
   * Search for similar vectors
   */
  search(
    collectionName: string,
    queryVector: number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult[]>;

  /**
   * Delete vectors by IDs
   */
  delete(collectionName: string, ids: string[]): Promise<void>;

  /**
   * Get vector by ID
   */
  get(collectionName: string, id: string): Promise<VectorUpsertOptions | null>;

  /**
   * Check if collection exists
   */
  hasCollection(name: string): Promise<boolean>;

  /**
   * Get collection stats
   */
  getStats(collectionName: string): Promise<{
    vectorCount: number;
    dimension: number;
  }>;
}
