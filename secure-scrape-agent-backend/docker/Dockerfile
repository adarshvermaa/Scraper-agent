# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

# Copy built app
COPY --from=builder /app/dist ./dist

# Install Playwright browsers
RUN npx playwright install-deps chromium && \
    npx playwright install chromium

# Expose ports
EXPOSE 3000 4000

# Start app
CMD ["node", "dist/main.js"]
