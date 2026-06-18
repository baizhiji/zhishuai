#!/bin/bash
# ============================================================
# 智枢AI 数据库迁移管理脚本
# 用于腾讯云 TDSQL-C MySQL
# ============================================================

set -e

cd "$(dirname "$0")/.."

echo "╔════════════════════════════════════════════╗"
echo "║       智枢AI 数据库迁移管理工具              ║"
echo "╚════════════════════════════════════════════╝"
echo ""

MODE=${1:-deploy}

case "$MODE" in
  # 首次部署：创建迁移基线（假设数据库已有表结构）
  baseline)
    echo ">>> 创建迁移基线（已有数据库）..."
    npx prisma migrate diff \
      --from-empty \
      --to-schema-datamodel prisma/schema.prisma \
      --script > prisma/migrations/0_init/migration.sql 2>/dev/null || true
    mkdir -p prisma/migrations/0_init
    echo "-- CreateEnum, CreateTable 等由 prisma migrate diff 生成" > prisma/migrations/0_init/migration.sql
    npx prisma migrate resolve --applied 0_init 2>/dev/null || true
    echo ">>> 基线创建完成"
    ;;

  # 日常部署：应用所有未应用的迁移
  deploy)
    echo ">>> 执行 prisma migrate deploy..."
    npx prisma migrate deploy
    echo ">>> 迁移部署完成"
    ;;

  # 开发环境：创建新迁移
  dev)
    MIGRATION_NAME=${2:-"update"}
    echo ">>> 创建新迁移: $MIGRATION_NAME ..."
    npx prisma migrate dev --name "$MIGRATION_NAME"
    echo ">>> 迁移创建完成"
    ;;

  # 强制推送Schema到数据库（开发用，会丢数据）
  push)
    echo ">>> 强制推送 Schema (prisma db push)..."
    npx prisma db push
    echo ">>> 推送完成"
    ;;

  # 初始化种子数据
  seed)
    echo ">>> 执行种子数据..."
    ADMIN_SEED_PASSWORD=${ADMIN_SEED_PASSWORD:-20061218} npx prisma db seed
    echo ">>> 种子数据完成"
    ;;

  *)
    echo "用法: bash migrate.sh [baseline|deploy|dev|push|seed]"
    echo "  baseline - 首次为已有数据库创建迁移基线"
    echo "  deploy   - 生产环境应用迁移（安全）"
    echo "  dev      - 开发环境创建新迁移"
    echo "  push     - 强制同步Schema到数据库（开发用）"
    echo "  seed     - 执行种子数据初始化"
    exit 1
    ;;
esac
