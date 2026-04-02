# Stage 1: Install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
COPY scripts ./scripts
# Copy protos so the patch script can find them during postinstall
COPY src/lib/fcm/proto ./src/lib/fcm/proto

# Install dependencies and allow scripts (compiles better-sqlite3)
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Force Next.js to use the correct hostname for container
ENV HOSTNAME="0.0.0.0"

# Install runtime dependencies for native modules (libc6-compat is needed for better-sqlite3 on Alpine)
RUN apk add --no-cache libc6-compat

# Copy the standalone build from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Crucial: copy the localized protos to the final image for the patched library to find them
# In standalone mode, files needed at runtime should be accessible from the app root
COPY --from=builder /app/src/lib/fcm/proto ./src/lib/fcm/proto

# Create data directory for persistency (SQLite)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

# Standalone mode in Next.js uses server.js
CMD ["node", "server.js"]
