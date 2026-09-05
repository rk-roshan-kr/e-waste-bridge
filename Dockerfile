# ==============================================================================
# E-Waste Bridge - Production Multi-Stage Dockerfile
# Optimized for Ultra-Lightweight Edge Hosting & Low-Resource Environments
# Compatible with: x86_64, ARM64 (Raspberry Pi 4/5, AWS Graviton, GCP Ampere)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Environment
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package manifests first for optimal layer caching
COPY package.json package-lock.json ./

# Clean install dependencies (including devDependencies needed for Vite build)
RUN npm ci

# Copy entire source tree
COPY . .

# Run dataset verification and build production bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Runner
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom production Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Configure health check for container orchestration (Docker Compose, Kubernetes, ECS)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
