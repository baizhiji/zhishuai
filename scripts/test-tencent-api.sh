#!/bin/bash
TENCENT_KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
ALIBABA_KEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"

pass=0
fail=0

test_api() {
  local label="$1" channel="$2" url="$3" method="$4" auth="$5" data="$6"
  local code body
  body=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $auth" \
    -d "$data" 2>/dev/null)
  code=$(echo "$body" | tail -1)
  body=$(echo "$body" | sed '$d')
  
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "  ✓ [$label] ($channel) - PASS (HTTP $code)"
    echo "    $(echo "$body" | head -c 200)"
    pass=$((pass + 1))
  else
    echo "  ✗ [$label] ($channel) - FAIL (HTTP $code)"
    echo "    $(echo "$body" | head -c 200)"
    fail=$((fail + 1))
  fi
  echo
}

echo "============================================================"
echo "  AI创作工厂 - 10通道腾讯系API诊断测试"
echo "============================================================"

echo ""
echo "## 通道1: 小红书图文 - deepseek-v4-pro (腾讯文本)"
test_api "deepseek-v4-pro 文本" "小红书图文" \
  "https://api.tokenhub.ai/v1/chat/completions" "POST" "$TENCENT_KEY" \
  '{"model":"deepseek-v4-pro","messages":[{"role":"user","content":"Hello"}],"max_tokens":20}'

echo "## 通道2: 图片生成 - hy-image-v3.0 (腾讯图片)"
test_api "hy-image-v3.0 图片" "图片生成" \
  "https://api.tokenhub.ai/v1/images/generations" "POST" "$TENCENT_KEY" \
  '{"model":"hy-image-v3.0","prompt":"a cute cat","n":1,"size":"1024x1024"}'

echo "## 通道4: 短视频脚本 - kl-video-v3 (腾讯视频)"
test_api "kl-video-v3 视频提交" "短视频脚本" \
  "https://api.tokenhub.ai/v1/api/video/submit" "POST" "$TENCENT_KEY" \
  '{"model":"kl-video-v3","prompt":"一只猫在草地上奔跑","duration":5}'

echo "## 通道10: 数字人 - yt-video-humanactor (腾讯数字人)"
test_api "yt-video-humanactor 数字人" "数字人" \
  "https://api.tokenhub.ai/v1/api/video/submit" "POST" "$TENCENT_KEY" \
  '{"model":"yt-video-humanactor","text":"欢迎来到智枢AI，我是你的数字人助手","duration":10}'

echo "============================================================"
echo "  汇总: 通过 $pass / 失败 $fail (共 $((pass + fail)) 项)"
echo "============================================================"
