#!/bin/bash
for i in $(seq 1 75); do
  if ls /var/www/zhishuai/downloads/zhishuai_3.2.9* >/dev/null 2>&1; then
    echo "FOUND at $(date)"
    ls -la /var/www/zhishuai/downloads/zhishuai_3.2.9*
    break
  fi
  sleep 20
done
echo "watch ended at $(date)"
