# 智枢 AI SaaS - Web Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY web/package.json web/package-lock.json* ./
RUN npm ci

COPY web/ ./

# 构建 Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "start"]
