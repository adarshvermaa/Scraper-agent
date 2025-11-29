# Secure Scrape Agent - Frontend

Modern React frontend for the Secure Scrape Agent platform with real-time updates, virtualized feeds, and rich UX.

## Features

- ⚡ **Vite + React 18** for blazing-fast development
- 🎨 **TailwindCSS** for beautiful, responsive UI
- 🔄 **TanStack Query** for efficient data fetching and caching
- 🌐 **WebSocket** for real-time job updates
- 📊 **React Window** for virtualized feed rendering
- 🎯 **TypeScript** for type safety
- 🧪 **Cypress** for E2E testing
- 📦 **Code Splitting** for optimized bundle size

## Quick Start

### Prerequisites

- Node.js 18+
- Backend API running at http://localhost:3000

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
```

### 3. Development

```bash
npm run dev
```

Visit http://localhost:5173

### 4. Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Feed/           # Feed-specific components
│   ├── Layout/         # Layout components
│   └── ui/             # Generic UI primitives
├── pages/              # Page components
│   ├── Feed/           # Job feed page
│   ├── JobDetail/      # Job detail page
│   ├── Dashboard/      # Admin dashboard
│   └── Settings/       # Settings page
├── services/           # API and WebSocket clients
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Key Features

### Real-Time Updates

The app connects to the backend via WebSocket to receive:
- **new_item**: New jobs added to the feed
- **status_update**: Job processing updates

### Virtualized Feed

Uses `react-window` for efficient rendering of large job lists:
- Only renders visible items
- Smooth scrolling
- Memory efficient

### API Client

Includes retry logic and circuit breaker pattern:
- Automatic retries on failure
- Circuit opens after 5 consecutive failures
- Resets after 1 minute

### Code Splitting

Lazy loads all page components:
- Reduces initial bundle size
- Faster first paint
- Better performance

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
# Interactive
npm run test:e2e

# Headless
npm run test:e2e:headless
```

## Deployment

### Docker

```bash
docker build -t scrape-agent-frontend .
docker run -p 80:80 scrape-agent-frontend
```

### Nginx

The included `nginx.conf` handles:
- SPA routing
- Gzip compression
- Security headers
- API proxying

## Performance Optimizations

- **Code Splitting**: Vendor and page-level chunks
- **Tree Shaking**: Removes unused code
- **Compression**: Gzip compression for assets
- **Lazy Loading**: Images and routes loaded on demand
- **Virtualization**: Feed uses virtual scrolling

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Semantic HTML

##License

MIT
