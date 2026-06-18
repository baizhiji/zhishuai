# 智枢 AI SaaS - Server Dockerfile
# 多阶段构建 + 非 root 用户 + 生产级安全

FROM node:20-alpine AS builder

WORKDIR /app

# 安装 OpenSSL 依赖（Prisma 需要）
RUN apk add --no-cache openssl

COPY server/package.json server/package-lock.json* ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/prisma ./prisma
COPY server/src ./src

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript
RUN npm run build

# ============ 生产阶段 ============
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 创建上传目录
RUN mkdir -p uploads && chown appuser:appgroup uploads

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# 切换到非 root 用户
USER appuser

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# 生产环境使用 migrate deploy（非 dev 迁移）
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
