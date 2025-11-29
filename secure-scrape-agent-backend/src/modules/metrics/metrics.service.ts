import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  // Counters
  public readonly embeddingTotal: Counter;
  public readonly aiProviderCallsTotal: Counter;
  public readonly aiProviderErrorsTotal: Counter;

  // Histograms
  public readonly milvusQueryLatency: Histogram;
  public readonly embeddingLatency: Histogram;

  // Gauges
  public readonly queueLength: Gauge;
  public readonly vectorCount: Gauge;

  constructor() {
    // Enable default metrics (CPU, memory, etc.)
    collectDefaultMetrics();

    // Embedding metrics
    this.embeddingTotal = new Counter({
      name: 'embedding_total',
      help: 'Total number of embeddings generated',
      labelNames: ['provider', 'model'],
    });

    this.embeddingLatency = new Histogram({
      name: 'embedding_latency_seconds',
      help: 'Embedding generation latency',
      labelNames: ['provider'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // AI provider metrics
    this.aiProviderCallsTotal = new Counter({
      name: 'ai_provider_calls_total',
      help: 'Total AI provider API calls',
      labelNames: ['provider', 'operation', 'status'],
    });

    this.aiProviderErrorsTotal = new Counter({
      name: 'ai_provider_errors_total',
      help: 'Total AI provider errors',
      labelNames: ['provider', 'operation'],
    });

    // Vector store metrics
    this.milvusQueryLatency = new Histogram({
      name: 'milvus_query_latency_seconds',
      help: 'Milvus query latency',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
    });

    this.vectorCount = new Gauge({
      name: 'vector_count',
      help: 'Total vectors in collection',
      labelNames: ['collection'],
    });

    // Queue metrics
    this.queueLength = new Gauge({
      name: 'queue_length',
      help: 'Queue length',
      labelNames: ['queue'],
    });
  }

  getMetrics(): Promise<string> {
    return register.metrics();
  }
}
