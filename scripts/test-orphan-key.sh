#!/bin/bash
# 测试孤儿 Key 是否仍可用于 tokenhub 真实调用（不输出完整 Key）
cd /var/www/zhishuai/server

# 解密孤儿 Key（用 node 在服务器本地处理，不传回）
ENCRYPTION_KEY='zhishuai-encrypt-key-2024-32char' node -e "
const {PrismaClient}=require('@prisma/client');
const crypto=require('crypto');
const p=new PrismaClient();
const EK=process.env.ENCRYPTION_KEY;
function dec(t){try{const s=t.split(':');const iv=Buffer.from(s[0],'hex');const d=Buffer.from(s[1],'hex');const c=crypto.createDecipheriv('aes-256-cbc',Buffer.from(EK),iv);let r=c.update(d);r=Buffer.concat([r,c.final()]);return r.toString()}catch(e){return t}}
(async()=>{
  const k=await p.apiKey.findFirst({where:{userId:'45d3dd11-27a8-4645-b021-801a0d4d7622'}});
  if(!k){console.log('NO_KEY_FOUND');process.exit(1)}
  const ak=dec(k.apiKey);
  process.stdout.write(ak);
})().finally(()=>p.\$disconnect());
" > /tmp/.orphan_key

# 用 Key 测试 tokenhub chat completions
KEY=$(cat /tmp/.orphan_key)
echo "Key长度: ${#KEY} 前缀: ${KEY:0:8}..."

echo "=== 测试 tokenhub chat (deepseek-v4-pro-202606) ==="
curl -s -X POST 'https://tokenhub.tencentmaas.com/v1/chat/completions' \
  -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"deepseek-v4-pro-202606","messages":[{"role":"user","content":"回复OK"}],"max_tokens":20}' \
  | head -c 400
echo

echo "=== 测试 tokenhub chat (hy3) ==="
curl -s -X POST 'https://tokenhub.tencentmaas.com/v1/chat/completions' \
  -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"hy3","messages":[{"role":"user","content":"回复OK"}],"max_tokens":20}' \
  | head -c 400
echo

echo "=== 测试 tokenhub 模型列表 ==="
curl -s 'https://tokenhub.tencentmaas.com/v1/models' -H "Authorization: Bearer $KEY" | head -c 800
echo

rm -f /tmp/.orphan_key
