#!/bin/bash
TKEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
AKEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"
TBASE="https://tokenhub.tencentmaas.com/v1"
ABASE="https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"

echo "=== Step 1: 生成人物照片 ==="
IMG_RESP=$(curl -s -X POST "${ABASE}" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-image-max","input":{"prompt":"一位亚洲年轻女性正面半身照，白色背景，自然微笑，高清"},"parameters":{"size":"1024*1024","n":1}}')
echo "$IMG_RESP" | tail -c 300
echo
IMAGE=$(echo "$IMG_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['output']['image_url'] or d['output']['url'] or d['output']['results'][0]['url'])")
echo "Image: $IMAGE"

echo ""
echo "=== Step 2: TTS ==="
TTS=$(curl -s -X POST "${ABASE}" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","input":{"text":"欢迎来到智枢AI"},"parameters":{"voice":"zhixiaobai","language_type":"Chinese","format":"mp3"}}')
AUDIO=$(echo "$TTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['output']['audio']['url'])")
echo "Audio: $AUDIO"

echo ""
echo "=== Step 3: 数字人 ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${TBASE}/api/video/submit" \
  -H "Authorization: Bearer ${TKEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"yt-video-humanactor\",\"prompt\":\"一位年轻女性微笑着讲话\",\"image_url\":\"${IMAGE}\",\"audio_url\":\"${AUDIO}\"}" | tail -10
