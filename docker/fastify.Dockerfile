# ===========================
# 1️⃣ Build Stage
# ===========================
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app
ENV NODE_ENV=development

# Install pnpm
RUN npm i -g pnpm@10.18.3

# Install deps first for caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy TypeScript source and config
COPY tsconfig.json ./
COPY src ./src
COPY app.ts index.ts ./

# Build TypeScript -> dist/
RUN pnpm run build


# ===========================
# 2️⃣ Production Stage
# ===========================
FROM node:24-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Install curl for health checks
RUN apk add --no-cache curl
# Install pnpm
RUN npm i -g pnpm@10.18.3


# Copy only built code + minimal dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Expose Fastify port (This needs to be set via the PORT value in the .env file)
EXPOSE 8080

# Start Fastify app (compiled JS entry)
CMD ["node", "dist/index.js"]
