#!/bin/bash
KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"

echo "=== tokenhub.tencentmaas.com /v1/models ==="
curl -s -w "\nHTTP %{http_code}\n" -H "Authorization: Bearer ${KEY}" https://tokenhub.tencentmaas.com/v1/models | tail -3

echo ""
echo "=== tokenhub.cloud.tencent.com /v1/models ==="
curl -s -w "\nHTTP %{http_code}\n" -H "Authorization: Bearer ${KEY}" https://tokenhub.cloud.tencent.com/v1/models | tail -3

echo ""
echo "=== tokenhub.tencentmaas.com /video/generations (数字人) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST https://tokenhub.tencentmaas.com/v1/video/generations \
  -H "Authorization: Bearer ${KEY}" -H "Content-Type: application/json" \
  -d '{"model":"YT-Video-HumanActor","input":"欢迎来到智枢AI","tts_voice":"default","output_format":"mp4"}' | tail -10

echo ""
echo "=== tokenhub.cloud.tencent.com /video/generations (数字人) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST https://tokenhub.cloud.tencent.com/v1/video/generations \
  -H "Authorization: Bearer ${KEY}" -H "Content-Type: application/json" \
  -d '{"model":"YT-Video-HumanActor","input":"欢迎来到智枢AI","tts_voice":"default","output_format":"mp4"}' | tail -10

echo ""
echo "=== tokenhub.tencentmaas.com /api/video/submit (可灵) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST https://tokenhub.tencentmaas.com/v1/api/video/submit \
  -H "Authorization: Bearer ${KEY}" -H "Content-Type: application/json" \
  -d '{"model":"kl-video-v3","prompt":"一只奔跑的猫","duration":5}' | tail -10

echo ""
echo "=== tokenhub.tencentmaas.com /video/generations (可灵) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST https://tokenhub.tencentmaas.com/v1/video/generations \
  -H "Authorization: Bearer ${KEY}" -H "Content-Type: application/json" \
  -d '{"model":"kl-video-v3","prompt":"一只奔跑的猫","duration":5}' | tail -10
