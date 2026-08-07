#!/bin/bash
AKEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"
curl -s -w "\nHTTP %{http_code}\n" -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","input":{"text":"欢迎来到智枢AI"},"parameters":{"voice":"zhixiaobai","language_type":"Chinese","format":"mp3"}}'
