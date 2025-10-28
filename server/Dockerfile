# Multi-stage build for y-webrtc signaling server
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including y-webrtc)
RUN npm ci --production

# Final stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder /app/node_modules ./node_modules

# Expose the port (default 4444, can be overridden with PORT env var)
EXPOSE 4444

# Set environment variable
ENV PORT=4444

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Run the signaling server
CMD ["node", "node_modules/y-webrtc/bin/server.js"]
