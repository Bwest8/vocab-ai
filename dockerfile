# ===========================
# 1️⃣ Build Stage
# ===========================
FROM node:24-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# ===========================
# 2️⃣ Runtime Stage
# ===========================
FROM node:24-alpine AS runner
WORKDIR /app

# Copy only what’s needed for runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies only
RUN npm ci --omit=dev
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

# Run Prisma migrations before starting
CMD sh -c "npx prisma migrate deploy && npm run start"
