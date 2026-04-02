# Stage 1: Install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./

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

# Fix missing .proto files in standalone node_modules
# We copy them from the builder's node_modules to the runner's node_modules
RUN mkdir -p /app/node_modules/@liamcottle/rustplus.js/ \
    && mkdir -p /app/node_modules/@liamcottle/push-receiver/src/gcm/ \
    && mkdir -p /app/node_modules/@liamcottle/push-receiver/src/

COPY --from=builder /app/node_modules/@liamcottle/rustplus.js/rustplus.proto /app/node_modules/@liamcottle/rustplus.js/rustplus.proto
COPY --from=builder /app/node_modules/@liamcottle/push-receiver/src/gcm/checkin.proto /app/node_modules/@liamcottle/push-receiver/src/gcm/checkin.proto
COPY --from=builder /app/node_modules/@liamcottle/push-receiver/src/mcs.proto /app/node_modules/@liamcottle/push-receiver/src/mcs.proto

# Create data directory for persistency (SQLite)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

# Standalone mode in Next.js uses server.js
CMD ["node", "server.js"]
