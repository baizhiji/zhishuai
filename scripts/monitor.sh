#!/usr/bin/env bash
# 智枢AI 生产监控脚本：服务状态 + HTTP 健康检查 + 异常自动拉起
# crontab 每 5 分钟调用：bash /var/www/zhishuai/scripts/monitor.sh --alert
# 告警方式：当前写日志；如需即时告警可在此接入企业微信群机器人/钉钉 Webhook
set -uo pipefail

LOG_FILE="/var/log/zhishuai-monitor.log"
log() {
  # 日志超 1MB 自动截断，防止无限增长
  [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE")" -gt 1048576 ] && : > "$LOG_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# 1. pm2 服务状态检查，异常自动重启
if command -v pm2 >/dev/null 2>&1; then
  STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for x in d:
        if x.get('name') == 'zhishuai-api':
            print(x['pm2_env']['status']); break
except Exception:
    print('unknown')
" 2>/dev/null)
  if [ "$STATUS" = "online" ]; then
    log "OK: zhishuai-api online"
  elif [ "$STATUS" = "unknown" ]; then
    log "WARN: 无法读取 pm2 状态"
  else
    log "ALERT: zhishuai-api 状态=$STATUS，正在重启"
    pm2 restart zhishuai-api >>"$LOG_FILE" 2>&1 && log "已触发重启" || log "重启失败!"
  fi
fi

# 2. HTTP 健康检查
check() {
  local url="$1" name="$2"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -k "$url" 2>/dev/null)
  if [ "$code" = "200" ]; then
    log "OK: $name ($code)"
  else
    log "ALERT: $name 返回 $code ($url)"
  fi
}
check "https://api.baizhiji.net/api/version/latest" "API服务"
check "https://baizhiji.net" "官网/下载"
check "https://baizhiji.net/downloads/zhishuai.apk" "APK下载"
