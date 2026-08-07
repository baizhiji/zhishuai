#!/bin/bash
set -e
TKEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
AKEY="sk-d929af912ab14175810c4ac112d94b0a"
TBASE="https://tokenhub.tencentmaas.com/v1"
ABASE="https://dashscope.aliyuncs.com/compatible-mode/v1"

echo "=== Step 1: 阿里云 TTS 生成音频 ==="
TTS=$(curl -s -X POST "${ABASE}/audio/speech" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","input":"欢迎来到智枢AI","voice":"default","response_format":"mp3"}')
echo "$TTS" | tail -c 200
echo
AUDIO=$(echo "$TTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['output']['audio']['url'])")
echo "Audio: $AUDIO"

echo ""
echo "=== Step 2: 数字人提交 ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${TBASE}/api/video/submit" \
  -H "Authorization: Bearer ${TKEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"yt-video-humanactor\",\"audio_url\":\"${AUDIO}\",\"duration\":10}" | tail -10
