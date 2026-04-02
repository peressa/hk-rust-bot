# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
# Install dependencies but ignore scripts for now (as fix-push-receiver depends on src/ files)
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .
# Now run the patch manually before building
RUN node scripts/fix-push-receiver.js
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
