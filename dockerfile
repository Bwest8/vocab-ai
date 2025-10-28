# ===========================
# 1️⃣ Base dependencies layer (cached)
# ===========================
FROM node:24-alpine AS deps
WORKDIR /app

# Cache npm downloads between builds (optional but faster)
RUN npm config set cache /root/.npm

# Copy only package manifests for dependency cache
COPY package*.json ./

# Install dependencies once; this layer is reused if package*.json unchanged
RUN npm ci --ignore-scripts

# ===========================
# 2️⃣ Build stage
# ===========================
FROM node:24-alpine AS builder
WORKDIR /app

# Copy cached deps from previous layer
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry & lint for faster builds
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js app (Turbopack optional)
RUN npm run build -- --turbopack

# ===========================
# 3️⃣ Runtime stage (lightweight)
# ===========================
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy runtime assets only
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Prisma deploy migrations at container start, then start server
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]