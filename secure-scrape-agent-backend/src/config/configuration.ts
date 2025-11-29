export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  milvus: {
    usePinecone: process.env.USE_PINECONE === 'true',
    address: process.env.MILVUS_ADDRESS || 'localhost:19530',
    username: process.env.MILVUS_USERNAME,
    password: process.env.MILVUS_PASSWORD,
    database: process.env.MILVUS_DATABASE || 'default',
    collection: process.env.MILVUS_COLLECTION || 'job_embeddings',
    dimension: parseInt(process.env.MILVUS_DIMENSION || '1536', 10),
    indexType: process.env.MILVUS_INDEX_TYPE || 'IVF_PQ',
    metricType: process.env.MILVUS_METRIC_TYPE || 'IP',
    nlist: parseInt(process.env.MILVUS_NLIST || '2048', 10),
    nprobe: parseInt(process.env.MILVUS_NPROBE || '64', 10),
    m: parseInt(process.env.MILVUS_M || '8', 10),
    nbits: parseInt(process.env.MILVUS_NBITS || '8', 10),
    useGpu: process.env.MILVUS_USE_GPU === 'true',
    gpuId: parseInt(process.env.MILVUS_GPU_ID || '0', 10),
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    index: process.env.PINECONE_INDEX || 'job-embeddings',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4-turbo-preview',
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10),
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000', 10),
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    maxRetries: parseInt(process.env.ANTHROPIC_MAX_RETRIES || '3', 10),
    timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '60000', 10),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
  },

  embedding: {
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '64', 10),
    provider: process.env.EMBEDDING_PROVIDER || 'openai',
    cacheTtl: parseInt(process.env.EMBEDDING_CACHE_TTL || '604800', 10),
  },

  chunking: {
    size: parseInt(process.env.CHUNK_SIZE || '512', 10),
    overlap: parseInt(process.env.CHUNK_OVERLAP || '128', 10),
    strategy: process.env.CHUNKING_STRATEGY || 'recursive',
  },

  scraper: {
    userAgent:
      process.env.SCRAPER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3', 10),
    respectRobots: process.env.SCRAPER_RESPECT_ROBOTS !== 'false',
    enableStealth: process.env.SCRAPER_ENABLE_STEALTH !== 'false',
  },

  queue: {
    scrapingConcurrency: parseInt(process.env.QUEUE_SCRAPING_CONCURRENCY || '5', 10),
    ingestionConcurrency: parseInt(process.env.QUEUE_INGESTION_CONCURRENCY || '3', 10),
    retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000', 10),
  },

  mcp: {
    port: parseInt(process.env.MCP_PORT || '4000', 10),
    host: process.env.MCP_HOST || '0.0.0.0',
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
  },

  social: {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
    },
  },

  security: {
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  },
});
