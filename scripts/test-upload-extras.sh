#!/bin/bash
# 补测：HEIF/ICNS 恶意格式拦截 + 文件大小超限 413
API=http://127.0.0.1:3001

TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.token||'')}catch(e){console.log('')}})")

if [ -z "$TOKEN" ]; then echo "登录失败"; exit 1; fi
echo "token 获取成功"

echo "=== HEIF (image/heif) 应 400 ==="
printf '\x00\x00\x00\x18ftypheic\x00\x00\x00\x00' > /tmp/fake.heic
curl -s -o /tmp/heif.json -w 'HTTP %{http_code}\n' -X POST $API/api/materials/upload \
  -H "Authorization: Bearer $TOKEN" -F 'file=@/tmp/fake.heic;type=image/heif'
head -c 200 /tmp/heif.json; echo ""

echo "=== ICNS (image/icns) 应 400 ==="
printf 'icns\x00\x00\x00\x08' > /tmp/fake.icns
curl -s -o /tmp/icns.json -w 'HTTP %{http_code}\n' -X POST $API/api/materials/upload \
  -H "Authorization: Bearer $TOKEN" -F 'file=@/tmp/fake.icns;type=image/icns'
head -c 200 /tmp/icns.json; echo ""

echo "=== 超大文件 150MB (应 413) ==="
dd if=/dev/zero of=/tmp/big.png bs=1M count=150 2>/dev/null
curl -s -o /tmp/big.json -w 'HTTP %{http_code}\n' -X POST $API/api/materials/upload \
  -H "Authorization: Bearer $TOKEN" -F 'file=@/tmp/big.png;type=image/png'
head -c 200 /tmp/big.json; echo ""

echo "=== 非图片扩展名但正常 mimetype (text/plain) 应成功 200 ==="
printf 'hello' > /tmp/hello.txt
curl -s -o /tmp/txt.json -w 'HTTP %{http_code}\n' -X POST $API/api/materials/upload \
  -H "Authorization: Bearer $TOKEN" -F 'file=@/tmp/hello.txt;type=text/plain'
head -c 200 /tmp/txt.json; echo ""
