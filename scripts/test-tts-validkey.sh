.  /usr/bin/true
AKEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"
ABASE="https://dashscope.aliyuncs.com/compatible-mode/v1"

echo "=== /audio/speech qwen-tts (valid key) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}/audio/speech" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","input":"欢迎来到智枢AI","voice":"default","response_format":"mp3"}' | tail -5

echo ""
echo "=== /chat/completions qwen-tts (valid key) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${ABASE}/chat/completions" \
  -H "Authorization: Bearer ${AKEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-tts","messages":[{"role":"user","content":"欢迎来到智枢AI"}],"modalities":["text","audio"],"audio":{"voice":"default","format":"mp3"}}' | tail -5
