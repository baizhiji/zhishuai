#!/bin/bash
# 智枢AI 数据库备份脚本
# 用法: sudo bash scripts/backup-db.sh
# 备份: TDSQL-C MySQL -> /var/www/zhishuai/backups/ (保留30天)
set -e

APP_DIR=/var/www/zhishuai
SERVER_DIR=$APP_DIR/server
BACKUP_DIR=$APP_DIR/backups
RETENTION_DAYS=30

if [ ! -f "$SERVER_DIR/.env" ]; then
  echo "[ERROR] 未找到 $SERVER_DIR/.env"
  exit 1
fi

# 解析 DATABASE_URL: mysql://user:pass@host:3306/dbname
DB_URL=$(grep -E '^DATABASE_URL=' "$SERVER_DIR/.env" | head -1 | cut -d'=' -f2- | tr -d '"')
if [ -z "$DB_URL" ]; then
  echo "[ERROR] 无法从 .env 读取 DATABASE_URL"
  exit 1
fi

DB_USER=$(echo "$DB_URL" | sed -E 's#mysql://([^:]+):.*#\1#')
DB_PASS=$(echo "$DB_URL" | sed -E 's#mysql://[^:]+:([^@]+)@.*#\1#')
DB_HOST=$(echo "$DB_URL" | sed -E 's#mysql://[^@]+@([^:/]+).*#\1#')
DB_PORT=$(echo "$DB_URL" | sed -E 's#mysql://[^@]+@[^:]+:([0-9]+)/.*#\1#')
DB_NAME=$(echo "$DB_URL" | sed -E 's#mysql://[^@]+@[^:/]+:[0-9]+/([^?]+).*#\1#')

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d_%H%M%S)
OUTFILE="$BACKUP_DIR/zhishuai_$STAMP.sql.gz"

echo "[1/3] 备份 $DB_NAME@$DB_HOST:$DB_PORT -> $OUTFILE"
MYSQL_PWD="$DB_PASS" mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
  --single-transaction --routines --triggers "$DB_NAME" 2>/dev/null | gzip > "$OUTFILE"

echo "[2/3] 校验备份文件"
if [ ! -s "$OUTFILE" ]; then
  echo "[ERROR] 备份文件为空，删除失败备份"
  rm -f "$OUTFILE"
  exit 1
fi
SIZE=$(du -h "$OUTFILE" | cut -f1)
echo "      备份完成: $SIZE"

echo "[3/3] 清理 $RETENTION_DAYS 天前的备份"
find "$BACKUP_DIR" -name "zhishuai_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "备份目录: $BACKUP_DIR"
echo "最新备份: $(ls -t $BACKUP_DIR/zhishuai_*.sql.gz | head -1)"
