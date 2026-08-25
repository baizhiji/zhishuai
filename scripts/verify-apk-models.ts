/**
 * 实测 APK 端 AI 助手(server /api/ai-chat)使用的旧模型 ID 是否仍可用
 * 对照组：蓝皮书统一标准的新模型 ID
 * 运行：cd /var/www/zhishuai/server && npx tsx scripts/verify-apk-models.ts
 */
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  console.error('[SECURITY] 请先设置 ENCRYPTION_KEY 环境变量（与服务器 .env 一致）后再运行本脚本');
  process.exit(1);
}
function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return text;
  }
}

const BASES = {
  tokenhub: 'https://tokenhub.tencentmaas.com/v1',
  dashscope: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

const OLD_MODELS: Array<[string, string]> = [
  // APK ai-chat 当前使用的旧模型（来源 ai-model-router.ts / ai-chat.service.ts）
  ['tokenhub', 'hunyuan-2.0-instruct-20251111'],
  ['tokenhub', 'hunyuan-2.0-thinking-20251109'],
  ['tokenhub', 'kimi-k2.6'],
  ['tokenhub', 'glm-5'],
  ['tokenhub', 'glm-5v-turbo'],
  ['tokenhub', 'youtu-vita'],
  ['dashscope', 'qwen-turbo'],
  ['dashscope', 'qwen-plus'],
  ['dashscope', 'qwen-long'],
  ['dashscope', 'deepseek-r1-0528'],
];

const NEW_MODELS: Array<[string, string]> = [
  // 蓝皮书统一标准新模型（对照组）
  ['tokenhub', 'deepseek-v4-pro-202606'],
  ['tokenhub', 'kimi-k3'],
  ['tokenhub', 'glm-5.2'],
  ['dashscope', 'qwen3.8-max'],
  ['dashscope', 'deepseek-v4-pro'],
];

async function getKey(provider: 'tokenhub' | 'dashscope'): Promise<string | null> {
  const record = await prisma.apiKey.findFirst({
    where: { provider, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return record ? decrypt(record.apiKey) : null;
}

async function testModel(provider: 'tokenhub' | 'dashscope', apiKey: string, model: string): Promise<string> {
  try {
    const resp = await fetch(`${BASES[provider]}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 }),
      signal: AbortSignal.timeout(20000),
    });
    const text = await resp.text();
    if (resp.ok) return 'OK';
    let reason = text.slice(0, 160).replace(/\n/g, ' ');
    try {
      const j = JSON.parse(text);
      reason = j?.error?.message || j?.message || reason;
    } catch { /* ignore */ }
    return `FAIL(${resp.status}) ${reason}`;
  } catch (e: any) {
    return `ERROR ${e.message}`;
  }
}

async function run() {
  const tk = await getKey('tokenhub');
  const ds = await getKey('dashscope');
  console.log('tokenhub key:', tk ? 'FOUND(' + tk.slice(0, 8) + '...)' : 'NOT FOUND');
  console.log('dashscope key:', ds ? 'FOUND(' + ds.slice(0, 8) + '...)' : 'NOT FOUND');
  console.log('');

  console.log('=== APK 端当前使用的旧模型 ===');
  for (const [p, m] of OLD_MODELS) {
    const key = p === 'tokenhub' ? tk : ds;
    if (!key) { console.log(`[${p}] ${m}: NO KEY`); continue; }
    const r = await testModel(p as any, key, m);
    console.log(`[${p}] ${m}: ${r}`);
  }

  console.log('\n=== 蓝皮书统一标准新模型（对照组） ===');
  for (const [p, m] of NEW_MODELS) {
    const key = p === 'tokenhub' ? tk : ds;
    if (!key) { console.log(`[${p}] ${m}: NO KEY`); continue; }
    const r = await testModel(p as any, key, m);
    console.log(`[${p}] ${m}: ${r}`);
  }
  await prisma.$disconnect();
}

run();
