#!/bin/bash
AKEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"
ABASE="https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"

echo "=== qwen-image-max ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-image-max","input":{"prompt":"一只可爱的猫，写实风格，高清"},"parameters":{"size":"1024*1024","n":1}}' | tail -5

echo ""
echo "=== z-image-turbo ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"z-image-turbo","input":{"prompt":"一只可爱的猫，写实风格，高清"},"parameters":{"size":"1024*1024","n":1}}' | tail -5
