# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use --legacy-peer-deps to avoid React 19 / Next 16 issues
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/rust-plus.db ./rust-plus.db

EXPOSE 3000
CMD ["npm", "start"]
