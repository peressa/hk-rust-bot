# Build stage
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

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
