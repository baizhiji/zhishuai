#!/bin/bash
AKEY="sk-d929af912ab14175810c4ac112d94b0a"
ABASE="https://dashscope.aliyuncs.com/compatible-mode/v1"
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}/audio/speech" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","input":"欢迎来到智枢AI","voice":"default","response_format":"mp3"}'
