#!/bin/bash
KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
BASE="https://tokenhub.tencentmaas.com"

for endpoint in \
  "/v1/audio/speech" \
  "/v1/tts" \
  "/v1/tts/generations" \
  "/api/v1/tts" \
  "/api/v1/audio/speech" \
  "/audio/speech" \
  "/tts"
do
  echo "=== ${BASE}${endpoint} ==="
  curl -s -w "\nHTTP %{http_code}\n" -X POST "${BASE}${endpoint}" \
    -H "Authorization: Bearer ${KEY}" \
    -H "Content-Type: application/json" \
    -d '{"model":"hunyuan-tts-1.5","input":"欢迎来到智枢AI","voice":"default","response_format":"mp3"}' | tail -3
  echo ""
done
