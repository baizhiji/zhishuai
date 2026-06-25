#!/bin/bash
# ============================================================
# 智枢 AI - 数据库迁移脚本（在服务器上执行）
# 用途：应用 LoginLog 表 + ScheduledTask 新字段
# 用法：bash db_migrate.sh
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../server" && pwd)"

echo "===== 数据库迁移 ====="
echo "目录: $SERVER_DIR"
cd "$SERVER_DIR"

# 方式1: 使用 prisma db push（推荐，自动检测差异）
echo "[1] 尝试 prisma db push..."
npx prisma db push --accept-data-loss 2>&1 && {
    echo "✓ prisma db push 成功"
    exit 0
}

# 方式2: 如果 db push 失败，使用 prisma migrate deploy
echo "[2] 尝试 prisma migrate deploy..."
npx prisma migrate deploy 2>&1 && {
    echo "✓ prisma migrate deploy 成功"
    exit 0
}

# 方式3: 直接执行 SQL
echo "[3] 尝试直接执行 SQL..."
MIGRATION_SQL="$SERVER_DIR/prisma/migrations/manual_add_login_log_and_fields/migration.sql"
if [ -f "$MIGRATION_SQL" ]; then
    # 从 DATABASE_URL 中提取连接信息
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo "连接到: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < "$MIGRATION_SQL" 2>&1 && {
        echo "✓ SQL 直接执行成功"
        exit 0
    }
fi

echo "✗ 所有迁移方式都失败了，请手动检查"
exit 1
