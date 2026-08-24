#!/bin/bash
cd /var/www/zhishuai/server
cat > /tmp/fetch-test.js <<'EOF'
async function main() {
  // 1. 测试 tokenhub
  try {
    const r = await fetch('https://tokenhub.tencentmaas.com/v1/models', {
      headers: { Authorization: 'Bearer test-key-123', 'Content-Type': 'application/json' },
    });
    console.log('tokenhub status:', r.status);
    const t = await r.text();
    console.log('tokenhub body:', t.slice(0, 200));
  } catch (e) {
    console.log('tokenhub fetch ERR:', e.message);
  }
  // 2. 测试 dashscope
  try {
    const r = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/models', {
      headers: { Authorization: 'Bearer test-key-123', 'Content-Type': 'application/json' },
    });
    console.log('dashscope status:', r.status);
    const t = await r.text();
    console.log('dashscope body:', t.slice(0, 200));
  } catch (e) {
    console.log('dashscope fetch ERR:', e.message);
  }
}
main();
EOF
node /tmp/fetch-test.js 2>&1 | head -20
rm -f /tmp/fetch-test.js
