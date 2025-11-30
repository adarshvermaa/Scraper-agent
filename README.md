# Secure Scrape Agent 🕷️

**High-performance web scraping platform with AI-powered ingestion, RAG, and multi-model summarization**

A production-ready full-stack system for **Scrape → Ingest → Vector Store → RAG → Multi-AI Summarize → Publish** workflows, built with NestJS, React, and enterprise-grade vector databases.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Architecture](#-architecture)
- [Deployment](#-deployment)
- [Scripts](#-scripts)

---

## ✨ Key Features

### 🚀 Vector Store & AI
- **Milvus Vector Store** with Faiss GPU indexing (IVF_PQ, HNSW) for low-latency semantic search
- **Pinecone Adapter** for managed cloud alternative (switch via env var)
- **Multi-AI Provider** support (OpenAI, Anthropic, Google Gemini) with streaming
- **Batch Embedding** with Redis caching (SHA-256 keyed, 7-day TTL)
- **Cost Tracking** for AI API usage and token estimation

### 🕷️ Web Scraping & Ingestion
- **Playwright Scraping** with robots.txt compliance and stealth mode
- **Content Processing** with chunking, embedding, and vector upsert pipeline
- **Async Job Processing** with BullMQ and Redis queues
- **Data Validation** with Zod schemas

### 📡 Real-time & API
- **MCP JSON-RPC Server** (port 4000) for remote procedure calls
- **WebSocket Support** for real-time job updates
- **REST API** with NestJS for HTTP operations
- **Prisma ORM** + PostgreSQL for metadata storage

### 🎨 Frontend & UX
- **React 18** + Vite with TypeScript for blazing-fast development
- **TailwindCSS** for beautiful, responsive UI with dark mode
- **Virtualized Feed** (React Window) handles 10,000+ items smoothly
- **TanStack Query** for efficient data fetching and caching
- **Real-time Updates** via WebSocket with auto-reconnect

### 📊 Monitoring & DevOps
- **Prometheus Metrics** + Grafana dashboards
- **Docker & Docker Compose** for local and production deployment
- **Kubernetes Manifests** with GPU node support
- **Production-ready** with error handling, logging, and security best practices

---

## 🛠 Tech Stack

### Backend (NestJS)
- **Framework**: NestJS (Node.js)
- **Vector Stores**: Milvus (Faiss GPU/CPU), Pinecone
- **Databases**: PostgreSQL (Prisma ORM), Redis (BullMQ, caching)
- **AI Providers**: OpenAI, Anthropic, Google Gemini
- **Scraping**: Playwright, Cheerio, Turndown, Readability
- **Real-time**: Socket.IO, WebSockets
- **Monitoring**: Prometheus, prom-client
- **Queue**: BullMQ, Bull Board
- **Validation**: Zod, class-validator

### Frontend (React + Vite)
- **Framework**: React 18, Vite, TypeScript
- **Styling**: TailwindCSS
- **Data Fetching**: TanStack Query, Axios
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **UI Components**: React Window, React Markdown, React Hot Toast
- **Testing**: Vitest, Cypress
- **Build**: Vite with compression

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (with GPU support)
- **Monitoring**: Prometheus, Grafana
- **Databases**: PostgreSQL 15, Redis 7, Milvus 2.4+
- **Storage**: MinIO (for Milvus), etcd

---

## 📁 Project Structure

```
Scraper-agent/
├── secure-scrape-agent-backend/     # NestJS backend application
│   ├── src/
│   │   ├── ai/                      # Multi-provider AI service
│   │   ├── embedding/               # Batch embedding with caching
│   │   ├── ingestion/               # Scraping & ingestion pipeline
│   │   ├── mcp/                     # MCP JSON-RPC server
│   │   ├── vector-store/            # Milvus & Pinecone adapters
│   │   ├── metrics/                 # Prometheus metrics
│   │   └── ...
│   ├── prisma/                      # Database schema & migrations
│   ├── docker/                      # Dockerfiles (CPU & GPU)
│   ├── k8s/                         # Kubernetes manifests
│   ├── package.json
│   └── README.md                    # Backend documentation
│
├── secure-scrape-agent-frontend/    # React + Vite frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API & WebSocket clients
│   │   ├── hooks/                   # Custom React hooks
│   │   └── ...
│   ├── package.json
│   └── README.md                    # Frontend documentation
│
├── scripts/                         # Development scripts
│   ├── start-all.bat/.sh            # Start everything
│   ├── start-databases.bat/.sh      # Start Docker services
│   ├── start-apps.bat/.sh           # Start frontend + backend
│   ├── stop-all.bat/.sh             # Stop all services
│   └── README.md                    # Scripts documentation
│
├── docker-compose.dev.yml           # Development environment
├── docker-compose.prod.yml          # Production environment
├── docker-start.ps1/.sh             # Docker startup scripts
├── PROJECT_SUMMARY.md               # Project overview
├── DOCKER.md                        # Docker guide
├── DOCKER_QUICKSTART.md             # Quick Docker setup
├── MCP_INTEGRATION.md               # MCP server integration
├── SOCKET_INTEGRATION.md            # WebSocket integration
├── LOCAL_DEVELOPMENT.md             # Local dev guide
└── SETUP_OPTIONS.md                 # Setup options
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version
- **(Optional)** NVIDIA GPU with CUDA for Milvus GPU acceleration

### Option 1: Automated Setup (Recommended)

#### Windows
```bash
# Navigate to scripts directory
cd scripts

# Start everything (databases + apps)
start-all.bat
```

#### Linux/Mac/Git Bash
```bash
# Navigate to scripts directory
cd scripts

# Make scripts executable
chmod +x *.sh

# Start everything
./start-all.sh
```

**Services will be available at:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MCP Server: tcp://localhost:4000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### Option 2: Manual Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Scraper-agent
```

#### 2. Start Infrastructure
```bash
# Start PostgreSQL, Redis, Milvus, Prometheus, Grafana
docker-compose -f docker-compose.dev.yml up -d

# Wait 10 seconds for services to initialize
```

#### 3. Backend Setup
```bash
cd secure-scrape-agent-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration:
# - AI API keys (OpenAI, Anthropic, Gemini)
# - Vector store choice (Milvus or Pinecone)
# - Database connection strings

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Setup Milvus collection (if using Milvus)
npm run milvus:setup

# Start development server
npm run start:dev
```

#### 4. Frontend Setup
```bash
cd ../secure-scrape-agent-frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000/api" > .env.local
echo "VITE_WS_URL=ws://localhost:3000/ws" >> .env.local

# Start development server
npm run dev
```

---

## 📚 Documentation

### Core Documentation
- **[Backend README](./secure-scrape-agent-backend/README.md)** - NestJS backend, Milvus/Pinecone, MCP server
- **[Frontend README](./secure-scrape-agent-frontend/README.md)** - React frontend, real-time features
- **[Scripts README](./scripts/README.md)** - Development scripts reference
- **[Project Summary](./PROJECT_SUMMARY.md)** - Comprehensive project overview

### Setup & Integration Guides
- **[Docker Guide](./DOCKER.md)** - Complete Docker setup and deployment
- **[Docker Quickstart](./DOCKER_QUICKSTART.md)** - Fast Docker setup
- **[Setup Options](./SETUP_OPTIONS.md)** - Different setup approaches
- **[Local Development](./LOCAL_DEVELOPMENT.md)** - Local development guide
- **[MCP Integration](./MCP_INTEGRATION.md)** - MCP server integration
- **[Socket Integration](./SOCKET_INTEGRATION.md)** - WebSocket real-time features

### Configuration Files
- **[docker-compose.dev.yml](./docker-compose.dev.yml)** - Development environment
- **[docker-compose.prod.yml](./docker-compose.prod.yml)** - Production environment

---

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 5173)
│   (Vite + TS)   │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│   NestJS API    │ (Port 3000)
│    Backend      │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────┬──────────┐
    ▼         ▼          ▼         ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────┐
│Milvus  │ │Redis │ │Postgres│ │ AI   │ │   MCP   │
│(Vector)│ │(Queue)│ │(Meta)  │ │APIs  │ │ Server  │
└────────┘ └──────┘ └────────┘ └──┬───┘ └─────────┘
                                  │
                         ┌────────┴────────┬──────────┐
                         ▼                 ▼          ▼
                   ┌─────────┐      ┌──────────┐ ┌────────┐
                   │ OpenAI  │      │Anthropic │ │ Gemini │
                   └─────────┘      └──────────┘ └────────┘
```

### Component Flow

1. **Scraping**: Playwright fetches web content with robots.txt compliance
2. **Ingestion**: Content is chunked, cleaned, and processed
3. **Embedding**: Text chunks are embedded using AI providers (batched, cached)
4. **Vector Store**: Embeddings stored in Milvus/Pinecone for semantic search
5. **RAG**: Semantic search retrieves relevant documents for queries
6. **Summarization**: Multi-AI providers generate summaries
7. **Real-time**: WebSocket pushes updates to connected clients
8. **MCP Server**: JSON-RPC interface for external integrations

---

## 🐳 Deployment

### Docker Development

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

### Docker Production

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Kubernetes (with GPU Support)

```bash
# Navigate to backend directory
cd secure-scrape-agent-backend

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/

# Requirements:
# - GPU node pool with NVIDIA drivers
# - CUDA 11.0+ compatible GPUs
# - Kubernetes GPU device plugin
```

---

## 🔧 Scripts

Development scripts are located in the `scripts/` directory. See [scripts/README.md](./scripts/README.md) for detailed documentation.

### Common Commands

| Script | Description | Windows | Linux/Mac |
|--------|-------------|---------|-----------|
| **Start All** | Start databases + apps | `scripts\start-all.bat` | `scripts/start-all.sh` |
| **Start Databases** | Start Docker services only | `scripts\start-databases.bat` | `scripts/start-databases.sh` |
| **Start Apps** | Start frontend + backend only | `scripts\start-apps.bat` | `scripts/start-apps.sh` |
| **Stop All** | Stop all services | `scripts\stop-all.bat` | `scripts/stop-all.sh` |

### Backend Scripts

```bash
cd secure-scrape-agent-backend

npm run start:dev          # Start backend in watch mode
npm run build              # Build for production
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio
npm run milvus:setup       # Setup Milvus collection
```

### Frontend Scripts

```bash
cd secure-scrape-agent-frontend

npm run dev                # Start Vite dev server
npm run build              # Build for production
npm run preview            # Preview production build
npm run test               # Run Vitest tests
npm run test:e2e           # Run Cypress E2E tests
```

---

## 🔐 Environment Configuration

### Backend (.env)

```env
# Vector Store Choice
USE_PINECONE=false          # Set to 'true' for Pinecone, 'false' for Milvus

# Milvus Configuration (if USE_PINECONE=false)
MILVUS_ADDRESS=localhost:19530
MILVUS_COLLECTION=job_embeddings
MILVUS_INDEX_TYPE=IVF_PQ    # or HNSW, IVF_FLAT
MILVUS_USE_GPU=false        # Set to 'true' if GPU available

# Pinecone Configuration (if USE_PINECONE=true)
PINECONE_API_KEY=your_api_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX=job-embeddings

# AI Providers (at least one required)
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key

# Embedding Configuration
EMBEDDING_BATCH_SIZE=64
EMBEDDING_PROVIDER=openai

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/scrape_agent
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
```

---

## 📊 Monitoring

Access Grafana dashboards at **http://localhost:3001** (admin/admin):

- **Embedding Throughput**: Vectors/second
- **Query Latency**: P50, P95, P99 percentiles
- **Provider Costs**: Token usage and cost estimates
- **Queue Lengths**: Scraping & ingestion backlogs
- **WebSocket Connections**: Active connections and messages

---

## 🧪 Testing

### Backend Tests
```bash
cd secure-scrape-agent-backend
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report
```

### Frontend Tests
```bash
cd secure-scrape-agent-frontend
npm test                    # Vitest unit tests
npm run test:e2e           # Cypress E2E (interactive)
npm run test:e2e:headless  # Cypress E2E (headless)
```

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

---

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation in the `/docs` directory
- Review component-specific READMEs

---

**Built with ❤️ by the Secure Scrape Agent Team**

*High-performance web scraping meets enterprise AI*
