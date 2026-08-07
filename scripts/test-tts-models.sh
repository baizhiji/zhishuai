#!/bin/bash
AKEY="sk-d929af912ab14175810c4ac112d94b0a"
ABASE="https://dashscope.aliyuncs.com/compatible-mode/v1"

echo "=== /audio/speech cosyvoice-v1 ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}/audio/speech" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"cosyvoice-v1","input":"欢迎来到智枢AI","voice":"longhua","response_format":"mp3"}' | tail -5

echo ""
echo "=== /audio/speech qwen-tts ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}/audio/speech" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","input":"欢迎来到智枢AI","voice":"default","response_format":"mp3"}' | tail -5

echo ""
echo "=== /audio/speech qwen-tts-latest ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}/audio/speech" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts-latest","input":"欢迎来到智枢AI","voice":"default","response_format":"mp3"}' | tail -5

echo ""
echo "=== /chat/completions qwen-tts ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}/chat/completions" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","messages":[{"role":"user","content":"欢迎来到智枢AI"}],"modalities":["text","audio"],"audio":{"voice":"default","format":"mp3"}}' | tail -5
