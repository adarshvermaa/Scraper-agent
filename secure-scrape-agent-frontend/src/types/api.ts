export interface Job {
  id: string;
  url: string;
  title: string;
  company: string | null;
  source: string;
  publishedAt: string | null;
  scrapedAt: string;
  content: string;
  summary: string | null;
  tags: string[];
  contactInfo: {
    emails: string[];
    phones: string[];
  } | null;
  status: 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED' | 'REMOVED';
  createdAt: string;
  updatedAt: string;
}

export interface Chunk {
  id: string;
  jobId: string;
  content: string;
  position: number;
  tokens: number;
  vectorId: string;
  embeddingModel: string;
}

export interface SearchFilters {
  source?: string;
  company?: string;
  tags?: string[];
  status?: Job['status'];
}

export interface Publication {
  id: string;
  jobId: string;
  platform: string;
  content: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
}

export interface MetricsData {
  queueLengths: {
    scraping: number;
    ingestion: number;
  };
  embeddingThroughput: {
    timestamp: string;
    value: number;
  }[];
  vectorCount: number;
  providerCosts: {
    provider: string;
    totalTokens: number;
    estimatedCost: number;
  }[];
}
