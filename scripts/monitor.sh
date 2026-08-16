#!/bin/bash
# 智枢AI 系统健康监控脚本
# 用法:
#   bash scripts/monitor.sh                # 仅输出检查结果
#   bash scripts/monitor.sh --alert        # 发现异常时输出 ALERT 标记
#   MONITOR_WEBHOOK_URL=... bash scripts/monitor.sh --alert   # 异常时推送到企业微信/钉钉 webhook
#
# cron 建议(每5分钟):
#   */5 * * * * MONITOR_WEBHOOK_URL="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx" \
#     bash /var/www/zhishuai/scripts/monitor.sh --alert >> /var/log/zhishuai-monitor.log 2>&1

API_BASE="http://127.0.0.1:3001"
ALERT=false
if [ "$1" = "--alert" ]; then ALERT=true; fi

ALERTS=()
add_alert() {
  ALERTS+=("$1")
  echo "[ALERT] $1"
}

notify_webhook() {
  [ "$ALERT" = true ] || return 0
  [ -n "$MONITOR_WEBHOOK_URL" ] || return 0
  local text="智枢AI 监控告警 ($(date '+%Y-%m-%d %H:%M:%S'))%0A"
  local i
  for i in "${ALERTS[@]}"; do
    text="${text}%0A- ${i}"
  done
  curl -s -m 10 -X POST "$MONITOR_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"${text}\"}}" >/dev/null 2>&1 || true
}

echo "=== 智枢AI 系统健康检查 $(date '+%Y-%m-%d %H:%M:%S') ==="

# 1. API 健康检查
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API_BASE/health" 2>/dev/null || echo 000)
if [ "$CODE" = "200" ]; then
  echo "[OK]   API 健康检查: HTTP $CODE"
else
  add_alert "API 不可达! (HTTP $CODE)"
fi

# 2. 就绪检查(含数据库连接)
READY=$(curl -s "$API_BASE/ready" 2>/dev/null || echo '{}')
echo "[INFO] /ready: $READY"

# 3. PM2 服务状态（在线网页版已下线，仅监控后端 API）
for APP in zhishuai-api; do
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
  if [ "$STATUS" != "online" ]; then
    add_alert "$APP 未在运行!"
  fi
done

# 4. 磁盘空间
DISK=$(df -h / 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
echo "[INFO] 磁盘使用率: ${DISK}%"
if [ "${DISK:-0}" -gt 85 ]; then
  add_alert "磁盘使用率超过85%! (当前 ${DISK}%)"
fi

# 5. 内存使用(2核4G 环境, 阈值85%)
MEM=$(free 2>/dev/null | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
echo "[INFO] 内存使用率: ${MEM}%"
if [ "${MEM:-0}" -gt 85 ]; then
  add_alert "内存使用率超过85%! (当前 ${MEM}%)"
fi

# 6. Swap 使用率(内存不足时 swap 压力是主要风险)
SWAP_TOTAL=$(free -m 2>/dev/null | awk '/Swap:/ {print $2}')
SWAP_USED=$(free -m 2>/dev/null | awk '/Swap:/ {print $3}')
if [ "${SWAP_TOTAL:-0}" -gt 0 ]; then
  SWAP_PCT=$((SWAP_USED * 100 / SWAP_TOTAL))
  echo "[INFO] Swap 使用率: ${SWAP_PCT}% (${SWAP_USED}M/${SWAP_TOTAL}M)"
  if [ "${SWAP_PCT}" -gt 50 ]; then
    add_alert "Swap 使用率超过50%! (当前 ${SWAP_PCT}%)"
  fi
else
  echo "[INFO] 无 Swap 分区"
fi

# 7. 系统负载(超过 CPU 核数视为过载)
LOAD=$(cat /proc/loadavg 2>/dev/null | awk '{print $1}')
CORES=$(nproc 2>/dev/null || echo 1)
echo "[INFO] 系统负载: ${LOAD} / ${CORES} 核"
LOAD_INT=$(echo "${LOAD:-0} > ${CORES}" | bc 2>/dev/null || echo 0)
if [ "${LOAD_INT}" = "1" ]; then
  add_alert "系统负载过高! (当前 ${LOAD}, 核数 ${CORES})"
fi

echo "=== 检查完成, 告警数: ${#ALERTS[@]} ==="

notify_webhook

# 有告警时退出码为 1, 便于 cron 脚本判定
if [ "${#ALERTS[@]}" -gt 0 ]; then
  exit 1
fi
exit 0
