# --- Stage 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Build client
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Build server (skip postinstall — Docker installs yt-dlp via apt)
COPY server/package*.json ./server/
RUN cd server && npm ci --ignore-scripts
COPY server/ ./server/
RUN cd server && npm run build

# --- Stage 2: Runtime ---
FROM node:22-slim

# Install yt-dlp and ffmpeg
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg python3 curl ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install server production dependencies only (skip postinstall)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server/dist/index.js"]
