# ================================
# Multi-stage Dockerfile for Frontend
# ================================

# ================================
# Base Stage - Common dependencies
# ================================
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# ================================
# Development Stage
# ================================
FROM base AS development

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ================================
# Builder Stage - Production build
# ================================
FROM base AS builder

# Accept build arguments for Vite
ARG VITE_API_BASE_URL=http://localhost:3004
ARG VITE_WS_URL=ws://localhost:3004

# Set as environment variables for Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ================================
# Production Stage - Nginx
# ================================
FROM nginx:1.25-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
