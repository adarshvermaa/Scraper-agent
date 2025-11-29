# Secure Scrape Agent - Backend

High-performance **Scrape → Ingest → RAG → Multi-model Summarize → Publish** system built with NestJS, Milvus vector store with Faiss GPU indexing, and MCP server.

## Features

- 🚀 **Milvus Vector Store** with Faiss GPU (IVF_PQ, HNSW) for low-latency semantic search
- 🔄 **Pinecone Adapter** for managed cloud alternative (switch via env var)
- 🤖 **Multi-AI Provider** support (OpenAI, Anthropic, Google Gemini)
- 📊 **Embedding Cache** with Redis (SHA-256 keyed)
- 🎯 **Batch Embedding** with configurable batch sizes
- 🕷️ **Playwright Scraping** with robots.txt compliance
- 📡 **MCP JSON-RPC Server** for remote procedure calls
- 📈 **Prometheus Metrics** + Grafana dashboards
- 🔐 **Prisma ORM** + PostgreSQL for metadata
- ⚡ **BullMQ** for async job processing

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- (Optional) NVIDIA GPU with CUDA for Milvus Faiss GPU

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Critical Environment Variables:**
```env
# Vector Store Choice
USE_PINECONE=false  # Set to 'true' for Pinecone, 'false' for Milvus

# Milvus Configuration (if USE_PINECONE=false)
MILVUS_ADDRESS=localhost:19530
MILVUS_COLLECTION=job_embeddings
MILVUS_INDEX_TYPE=IVF_PQ  # or HNSW, IVF_FLAT
MILVUS_USE_GPU=false  # Set to 'true' if GPU available

# Pinecone Configuration (if USE_PINECONE=true)
PINECONE_API_KEY=your_api_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX=job-embeddings

# AI Providers (at least one required)
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- PostgreSQL with pgvector
- Redis
- Milvus (standalone with etcd & MinIO)
- Prometheus
- Grafana

### 4. Run Database Migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Setup Milvus Collection

```bash
npm run milvus:setup
```

### 6. Start Development Server

```bash
npm run start:dev
```

The services will be available at:
- **Backend API**: http://localhost:3000
- **MCP Server**: tcp://localhost:4000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## GPU Configuration (Optional)

### Local Development with GPU

If you have an NVIDIA GPU:

1. Install NVIDIA Container Toolkit
2. Update `docker-compose.yml` to use GPU-enabled Milvus image
3. Set `MILVUS_USE_GPU=true` in `.env`

### Kubernetes Production Deployment

See `k8s/` directory for manifests with GPU node affinity:

```bash
# Deploy to K8s with GPU nodes
kubectl apply -f k8s/
```

**Requirements:**
- GPU node pool with NVIDIA drivers
- CUDA 11.0+ compatible GPUs
- Kubernetes GPU device plugin

## Milvus Index Configuration

### IVF_PQ (Default - GPU Optimized)

Best for: Large-scale datasets with GPU acceleration

```env
MILVUS_INDEX_TYPE=IVF_PQ
MILVUS_NLIST=2048      # Number of clusters
MILVUS_NPROBE=64       # Search clusters
MILVUS_M=8             # PQ segments
MILVUS_NBITS=8         # Bits per PQ code
```

### HNSW (CPU-friendly, High Recall)

Best for: CPU-only deployment, <10M vectors

```env
MILVUS_INDEX_TYPE=HNSW
```

### IVF_FLAT (Balanced)

Best for: Medium datasets, exact search

```env
MILVUS_INDEX_TYPE=IVF_FLAT
MILVUS_NLIST=1024
```

## Switching to Pinecone

Simply set in `.env`:

```env
USE_PINECONE=true
PINECONE_API_KEY=your_api_key
```

No code changes required! The system will use Pinecone adapter automatically.

## MCP Server Endpoints

Connect to `tcp://localhost:4000` and send JSON-RPC requests:

### `search_jobs`
```json
{
  "jsonrpc": "2.0",
  "method": "search_jobs",
  "params": {
    "query": "senior frontend engineer react",
    "filters": { "company": "Google" },
    "limit": 10
  },
  "id": 1
}
```

### `ingest_url`
```json
{
  "jsonrpc": "2.0",
  "method": "ingest_url",
  "params": {
    "url": "https://jobs.example.com/senior-engineer",
    "source": "company_careers"
  },
  "id": 2
}
```

### `summarize_job`
```json
{
  "jsonrpc": "2.0",
  "method": "summarize_job",
  "params": {
    "id": "job_uuid",
    "provider": "openai",
    "model": "gpt-4-turbo-preview"
  },
  "id": 3
}
```

### `publish_job`
```json
{
  "jsonrpc": "2.0",
  "method": "publish_job",
  "params": {
    "id": "job_uuid",
    "platform": "twitter",
    "content": "Check out this role..."
  },
  "id": 4
}
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Production Deployment

### Docker

```bash
docker build -f docker/Dockerfile.gpu -t scrape-agent-backend .
docker run -p 3000:3000 -p 4000:4000 scrape-agent-backend
```

### Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/
```

## Monitoring

Access Grafana at http://localhost:3001:

- **Embedding Throughput**: Vectors/second
- **Query Latency**: P50, P95, P99
- **Provider Costs**: Token usage estimates
- **Queue Lengths**: Scraping & ingestion backlogs

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│ MCP Server  │◄────►│ NestJS API   │
│ (TCP:4000)  │      │ (HTTP:3000)  │
└──────┬──────┘      └──────┬───────┘
       │                    │
       ▼                    ▼
┌─────────────────────────────────┐
│      Application Layer          │
│  ┌──────┐  ┌───────┐  ┌──────┐ │
│  │Scraper│  │Ingest│  │ AI  │ │
│  └───┬──┘  └───┬───┘  └──┬───┘ │
└──────┼─────────┼─────────┼─────┘
       │         │         │
       ▼         ▼         ▼
┌────────┐  ┌────────┐  ┌────────┐
│BullMQ │  │ Milvus │  │OAI/etc │
│(Redis)│  │PostgreSQL  │ APIs   │
└────────┘  └────────┘  └────────┘
```

## License

MIT

## Support

For issues or questions, open a GitHub issue.
