#!/bin/bash
# 复现上传：验证文件落盘位置
cd /var/www/zhishuai || exit 1
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login -H 'Content-Type: application/json' -d '{"loginType":"admin","phone":"18601655222","password":"20061218"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(j.data.token||j.token||'')}catch(e){console.log('')}})")
echo "token_len=${#TOKEN}"
if [ -z "$TOKEN" ]; then echo "LOGIN FAILED"; exit 1; fi
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB\x60\x82' > /tmp/debug-verify.png
RESP=$(curl -s -X POST http://127.0.0.1:3001/api/materials/upload -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/debug-verify.png;type=image/png")
echo "upload_resp=$RESP"
echo "--- server/uploads/materials ---"
ls -la /var/www/zhishuai/server/uploads/materials/ | tail -5
echo "--- find recent png ---"
find /var/www /home /tmp /root -name "*.png" -mmin -2 -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/out/*" 2>/dev/null | head -5
