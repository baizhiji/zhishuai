#!/bin/bash
set -e

KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
BASE="https://tokenhub.tencentmaas.com/v1"

echo "=== 1. deepseek-v4-pro 文本 ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${KEY}" \
  -d '{"model":"deepseek-v4-pro","messages":[{"role":"user","content":"Hello"}],"max_tokens":20}' | tail -5

echo ""
echo "=== 2. hy-image-v3.0 图片 ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}/images/generations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${KEY}" \
  -d '{"model":"hy-image-v3.0","prompt":"a cute cat","n":1,"size":"1024x1024"}' | tail -5

echo ""
echo "=== 3. kl-video-v3 视频 ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}/api/video/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${KEY}" \
  -d '{"model":"kl-video-v3","prompt":"一只奔跑的猫","duration":5}' | tail -10

echo ""
echo "=== 4. yt-video-humanactor 数字人 ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}/api/video/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${KEY}" \
  -d '{"model":"yt-video-humanactor","text":"欢迎来到智枢AI","duration":10}' | tail -10
