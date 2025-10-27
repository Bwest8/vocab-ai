# ===========================
# 1️⃣ Build Stage
# ===========================
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ===========================
# 2️⃣ Runtime Stage
# ===========================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN npm ci --omit=dev

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
