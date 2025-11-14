# ===========================
# 1️⃣ Base dependencies layer (cached)
# ===========================
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app

# Copy only package manifests for dependency cache
COPY package.json bun.lockb* ./

# Install dependencies once; this layer is reused if package.json unchanged
RUN bun install --frozen-lockfile --production=false

# ===========================
# 2️⃣ Build stage
# ===========================
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app

# Copy cached deps from previous layer
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry for faster builds
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Generate Prisma client
RUN bunx prisma generate

# Build the Next.js app
RUN bun run build

# ===========================
# 3️⃣ Runtime stage (lightweight)
# ===========================
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy runtime assets only
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Prisma deploy migrations at container start, then start server
EXPOSE 3000
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]