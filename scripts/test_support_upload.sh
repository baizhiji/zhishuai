#!/bin/bash
# 测试客服中心二维码上传接口
# 用法：ADMIN_PASSWORD=xxxx bash scripts/test_support_upload.sh
if [ -z "$ADMIN_PASSWORD" ]; then
  echo "错误：请设置 ADMIN_PASSWORD 环境变量（管理员密码），例如："
  echo "  ADMIN_PASSWORD=xxxx bash scripts/test_support_upload.sh"
  exit 1
fi
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d "{\"phone\":\"18601655222\",\"password\":\"$ADMIN_PASSWORD\"}" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "TOKEN_LEN:${#TOKEN}"
# 生成一个有效的 PNG（1x1 红色像素）
python3 -c "import base64,struct,zlib;raw=b''.join(b'\x00'+b'\xff\x00\x00'*1 for _ in range(1));data=struct.pack('>2I',1,1)+raw;png=b'\x89PNG\r\n\x1a\n'+struct.pack('>I',13)+b'IHDR'+struct.pack('>IIBBBBB',1,1,8,2,0,0,0)+struct.pack('>I',zlib.crc32(b'IHDR'+struct.pack('>IIBBBBB',1,1,8,2,0,0,0))&0xffffffff)+struct.pack('>I',len(data))+b'IDAT'+zlib.compress(data)+struct.pack('>I',zlib.crc32(b'IDAT'+zlib.compress(data))&0xffffffff)+struct.pack('>I',0)+b'IEND'+struct.pack('>I',zlib.crc32(b'IEND')&0xffffffff);open('/tmp/qr_test.png','wb').write(png)" 2>/dev/null || dd if=/dev/zero of=/tmp/qr_test.png bs=1024 count=500 2>/dev/null
echo '=== 上传测试 ==='
curl -s -X POST http://localhost:3001/api/support/qrcode -F 'file=@/tmp/qr_test.png;type=image/png' -H "Authorization: Bearer $TOKEN" -w '\nHTTP:%{http_code}\n'
echo '=== uploads 目录 ==='
ls -la /var/www/zhishuai/server/uploads/ | tail -5
echo '=== GET 验证 ==='
curl -s http://localhost:3001/api/support/qrcode
echo
