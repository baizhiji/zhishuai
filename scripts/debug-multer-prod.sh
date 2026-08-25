#!/bin/bash
# 调试 multer 2.x mimetype 解析
cd /var/www/zhishuai/server || exit 1

cat > ./multer-debug.js <<'EOF'
const express = require('express');
const multer = require('multer');
const app = express();

const IMAGE_MIME_WHITELIST = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
]);

const upload = multer({
  storage: multer.diskStorage({ destination: '/tmp', filename: (r,f,cb)=>cb(null, f.originalname) }),
  fileFilter: (req, file, cb) => {
    console.log('fileFilter received mimetype:', JSON.stringify(file.mimetype));
    console.log('originalname:', JSON.stringify(file.originalname));
    console.log('startsWith image/:', file.mimetype.startsWith('image/'));
    console.log('in whitelist:', IMAGE_MIME_WHITELIST.has(file.mimetype));
    if (file.mimetype.startsWith('image/') && !IMAGE_MIME_WHITELIST.has(file.mimetype)) {
      cb(new Error('blocked'));
      return;
    }
    cb(null, true);
  },
});

app.post('/up', upload.single('file'), (req, res) => {
  res.json({ success: true, mimetype: req.file ? req.file.mimetype : null });
});

app.use((err, req, res, next) => {
  res.status(400).json({ success: false, error: err.message });
});

app.listen(3999, () => console.log('debug server on 3999'));
EOF

# 创建测试文件
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB\x60\x82' > /tmp/valid.png
printf '\x00\x00\x00\x0cJXL \r\n\x87\n' > /tmp/fake.jxl

# 启动调试服务器
node ./multer-debug.js &
SRV_PID=$!
sleep 2

echo "=== 上传 JXL (type=image/jxl) ==="
curl -s -X POST http://127.0.0.1:3999/up -F "file=@/tmp/fake.jxl;type=image/jxl" -w "\nHTTP: %{http_code}\n"
echo ""
echo "=== 上传 PNG (type=image/png) ==="
curl -s -X POST http://127.0.0.1:3999/up -F "file=@/tmp/valid.png;type=image/png" -w "\nHTTP: %{http_code}\n"

kill $SRV_PID 2>/dev/null
rm -f ./multer-debug.js
echo "--- multer version ---"
node -e 'console.log(require("multer/package.json").version)'
