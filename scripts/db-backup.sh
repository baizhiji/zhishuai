#!/usr/bin/env bash
# 智枢AI 数据库与关键文件备份脚本（生产服务器专用）
# crontab 每日 02:00 调用：bash /var/www/zhishuai/scripts/db-backup.sh
# 备份内容：zhishuai 数据库(mysqldump) + uploads/ + server/.env
# 保留策略：30 天滚动清理
set -uo pipefail

ENV_FILE="/var/www/zhishuai/server/.env"
BACKUP_DIR="/var/www/zhishuai/backups"
LOG_FILE="/var/log/db-backup.log"
KEEP_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

[ -f "$ENV_FILE" ] || { log "错误: 找不到 $ENV_FILE"; exit 1; }

# 仅解析 DATABASE_URL 单行，避免 source 整个 .env 因特殊字符报错
DB_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | tail -1 | cut -d'"' -f2)
[ -n "$DB_URL" ] || { log "错误: DATABASE_URL 解析失败"; exit 1; }

# 解析 mysql://user:pass@host:port/dbname
DB_URL="${DB_URL#mysql://}"
DB_CRED="${DB_URL%%@*}"
DB_USER="${DB_CRED%%:*}"
DB_PASS="${DB_CRED#*:}"
DB_HP="${DB_URL#*@}"
DB_HOST="${DB_HP%%:*}"
DB_PORT="${DB_HP##*:}"
DB_PORT="${DB_PORT%%/*}"
DB_NAME="${DB_URL##*/}"

mkdir -p "$BACKUP_DIR"

log "===== 开始备份 db=$DB_NAME host=$DB_HOST ====="

if MYSQL_PWD="$DB_PASS" mysqldump --single-transaction --routines --triggers \
  -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" 2>>"$LOG_FILE" \
  | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"; then
  log "数据库备份 OK: ${DB_NAME}_${TIMESTAMP}.sql.gz ($(du -h "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz" | cut -f1))"
else
  log "数据库备份失败!"
  exit 1
fi

if [ -d /var/www/zhishuai/uploads ]; then
  tar czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C /var/www/zhishuai uploads 2>>"$LOG_FILE" \
    && log "uploads 备份 OK: uploads_${TIMESTAMP}.tar.gz"
fi

if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$BACKUP_DIR/server.env.${TIMESTAMP}.bak" && log "server/.env 备份 OK"
fi

# 清理过期备份（保留 KEEP_DAYS 天）
find "$BACKUP_DIR" -maxdepth 1 -name '*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -name '*.tar.gz' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -name '*.bak' -mtime +"$KEEP_DAYS" -delete
log "===== 备份完成（保留 ${KEEP_DAYS} 天）====="
