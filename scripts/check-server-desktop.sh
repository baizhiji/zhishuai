#!/bin/bash
# 检查服务器桌面安装包 + 签名状态
set -e
echo "=== downloads 目录 ==="
ls -la /var/www/zhishuai/downloads/ | head -20
echo "=== exe sha256 ==="
sha256sum /var/www/zhishuai/downloads/*.exe 2>/dev/null || echo "无 exe"
echo "=== sig 文件 ==="
for s in /var/www/zhishuai/downloads/*.sig; do
  [ -f "$s" ] && echo "--- $s ---" && cat "$s"
done
echo "=== sig 与 exe 匹配验证（minisign-verify）==="
if [ -x /home/ubuntu/verify-client-rs/target/release/verify-client ]; then
  cd /var/www/zhishuai/downloads
  EXE=$(ls *.exe 2>/dev/null | head -1)
  SIG=$(ls *.sig 2>/dev/null | head -1)
  if [ -n "$EXE" ] && [ -n "$SIG" ]; then
    /home/ubuntu/verify-client-rs/target/release/verify-client "$EXE" "$SIG" || echo "签名验证失败"
  else
    echo "缺少 exe 或 sig"
  fi
else
  echo "verify-client 不存在"
fi
