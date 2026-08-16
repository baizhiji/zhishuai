/* 解码 tauri 签名的 base64 文本，输出到 stdout + 保存为本地文件 */
const fs = require('fs');

const SIGNATURE = `dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWTZvL0lSTWdRczMxODY3NFBzN1NKa3FRbFBTNjlQME92dE9ETzdaZ0dmdVpuY0hESHY4d05RcHpSZCs1QjNjcnYzalE3THA0cFRFRVJRWTQrbVpWbHZPU3BSRkRES0FNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg2ODEzMzI2CWZpbGU6emhpc2h1YWktc2V0dXAtMy4wLjAtbmV3LmV4ZQo3V1BOM21qWTlFQmZVWTJIVXJKVWdoL2Q3ZFVrblJ0bkZ3NDRwQzdud1g4S0NSb21TQ2RmVk9TcCt0ZWZjby9yQmw4YjkxUDF1MUtOdlRZdGJ1eCtCQT09Cg==`;

const text = Buffer.from(SIGNATURE, 'base64').toString('utf8');
console.log('===== DECODED SIG TEXT =====');
console.log(text);
console.log('===== LINE ANALYSIS =====');
const lines = text.split('\n');
lines.forEach((l, i) => {
  const trimmed = l.trim();
  let info = '';
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 20) {
    const bytes = Buffer.from(trimmed, 'base64');
    info = `[base64 len=${trimmed.length} -> bytes=${bytes.length} first2=${bytes.slice(0,2).toString('hex')}]`;
  }
  console.log(`L${i}: ${JSON.stringify(l)} ${info}`);
});

// 保存解码文本
fs.writeFileSync('scripts/decoded-sig.txt', text);
console.log('saved scripts/decoded-sig.txt');
