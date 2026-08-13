#!/bin/bash
# 智枢AI 系统健康监控脚本
# 用法: bash scripts/monitor.sh [--alert]
#   --alert  发现异常时输出 ALERT 标记(可配合 cron 告警)

API_BASE="http://127.0.0.1:3001"
ALERT=false
if [ "$1" = "--alert" ]; then ALERT=true; fi

echo "=== 智枢AI 系统健康检查 $(date '+%Y-%m-%d %H:%M:%S') ==="

# 1. API 健康检查
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API_BASE/api/health" 2>/dev/null || echo 000)
if [ "$CODE" = "200" ]; then
  echo "[OK]   API 健康检查: HTTP $CODE"
else
  echo "[FAIL] API 健康检查: HTTP $CODE"
  [ "$ALERT" = true ] && echo "[ALERT] API 不可达!"
fi

# 2. 就绪检查(含数据库连接)
READY=$(curl -s "$API_BASE/api/ready" 2>/dev/null || echo '{}')
echo "[INFO] /ready: $READY"

# 3. PM2 服务状态
for APP in zhishuai-api zhishuai-web; do
  STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for p in data:
        if p['name'] == '$APP':
            print(p['pm2_env']['status'])
            break
except Exception:
    print('unknown')
" 2>/dev/null || echo "unknown")
  echo "[INFO] $APP 状态: $STATUS"
  if [ "$STATUS" != "online" ] && [ "$ALERT" = true ]; then
    echo "[ALERT] $APP 未在运行!"
  fi
done

# 4. 磁盘空间
DISK=$(df -h / 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
echo "[INFO] 磁盘使用率: ${DISK}%"
if [ "${DISK:-0}" -gt 85 ] && [ "$ALERT" = true ]; then
  echo "[ALERT] 磁盘使用率超过85%!"
fi

# 5. 内存使用
MEM=$(free 2>/dev/null | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
echo "[INFO] 内存使用率: ${MEM}%"
if [ "${MEM:-0}" -gt 90 ] && [ "$ALERT" = true ]; then
  echo "[ALERT] 内存使用率超过90%!"
fi

echo "=== 检查完成 ==="
