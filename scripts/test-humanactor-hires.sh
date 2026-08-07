#!/bin/bash
TKEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
AKEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"
TBASE="https://tokenhub.tencentmaas.com/v1"
ABASE="https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
IMAGE="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1024&h=1024&fit=crop"

echo "=== TTS ==="
TTS=$(curl -s -X POST "${ABASE}" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","input":{"text":"欢迎来到智枢AI"},"parameters":{"voice":"zhixiaobai","language_type":"Chinese","format":"mp3"}}')
AUDIO=$(echo "$TTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['output']['audio']['url'])")
echo "Audio: $AUDIO"

echo ""
echo "=== 数字人 with high-res image ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${TBASE}/api/video/submit" \
  -H "Authorization: Bearer ${TKEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"yt-video-humanactor\",\"image_url\":\"${IMAGE}\",\"audio_url\":\"${AUDIO}\",\"duration\":10}" | tail -10
