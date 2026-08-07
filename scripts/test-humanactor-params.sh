#!/bin/bash
KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
BASE="https://tokenhub.tencentmaas.com/v1"

# 先调用TTS生成音频
TTS_RESPONSE=$(curl -s -X POST "${BASE}/audio/speech" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"hunyuan-tts-1.5","input":"欢迎来到智枢AI","voice":"default","response_format":"mp3"}')
echo "TTS response: $TTS_RESPONSE"
AUDIO_URL=$(echo "$TTS_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',[{}])[0].get('url',''))" 2>/dev/null || echo "")
echo "Audio URL: $AUDIO_URL"

echo ""
echo "=== 数字人 with audio_url ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}/api/video/submit" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"yt-video-humanactor\",\"audio_url\":\"${AUDIO_URL}\",\"duration\":10}" | tail -10

echo ""
echo "=== 数字人 with audioUrl ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}/api/video/submit" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"yt-video-humanactor\",\"audioUrl\":\"${AUDIO_URL}\",\"duration\":10}" | tail -10

echo ""
echo "=== 数字人 with text + reference_image ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}/api/video/submit" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"yt-video-humanactor","text":"欢迎来到智枢AI","duration":10}' | tail -10
