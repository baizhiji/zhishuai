#!/bin/bash
# 验证 multer 2.2.0 上传：正常图片可上传，恶意格式被拦截
set -e
API=http://127.0.0.1:3001

echo "=== 获取管理员 token ==="
TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.token||JSON.parse(d).token||'')}catch(e){console.log('')}})")

if [ -z "$TOKEN" ]; then echo "登录失败，无法获取 token"; exit 1; fi
echo "token 获取成功"

# 生成一个合法的 1x1 PNG
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB\x60\x82' > /tmp/valid.png

echo "=== 测试1: 合法 PNG 上传（应成功）==="
RESP=$(curl -s -o /tmp/upload_resp.json -w '%{http_code}' -X POST $API/api/materials/upload \
  -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/valid.png;type=image/png")
echo "HTTP: $RESP"
head -c 200 /tmp/upload_resp.json
echo ""

echo "=== 测试2: JXL 格式（image/jxl）上传（应被拦截 400）==="
printf '\x00\x00\x00\x0cJXL \r\n\x87\n' > /tmp/fake.jxl
RESP2=$(curl -s -o /tmp/upload_resp2.json -w '%{http_code}' -X POST $API/api/materials/upload \
  -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/fake.jxl;type=image/jxl")
echo "HTTP: $RESP2"
head -c 300 /tmp/upload_resp2.json
echo ""

if [ "$RESP" = "200" ] && [ "$RESP2" = "400" ]; then
  echo "=== 验证通过：合法图片上传成功，恶意格式被拦截 ==="
else
  echo "=== 验证异常 ==="
fi
