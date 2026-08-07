/**
 * AI创作工厂 10功能通道测试脚本
 * 测试每个功能依赖的所有API模型通道是否可达
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// 10大功能定义（来自 category-config.ts 的 CATEGORY_PIPELINES）
// ============================================================
const FEATURES = [
  {
    id: 'xiaohongshu',
    name: '小红书图文',
    models: ['qwen3.7-max', 'flux-pro-v1.1-ultra'],
    providers: ['alibaba', 'alibaba'],
  },
  {
    id: 'image',
    name: '图片生成',
    models: ['wan2.7-t2i-pro', 'flux-pro-v1.1-ultra', 'hy-image-3.0'],
    providers: ['alibaba', 'alibaba', 'tencent'],
  },
  {
    id: 'ecommerce',
    name: '电商详情页',
    models: ['qwen3.7-max', 'hy-image-3.0'],
    providers: ['alibaba', 'tencent'],
  },
  {
    id: 'shortVideo',
    name: '短视频脚本',
    models: ['qwen3.7-max', 'hy-image-3.0'],
    providers: ['alibaba', 'tencent'],
  },
  {
    id: 'enterpriseVideo',
    name: '企业宣传视频',
    models: ['qwen3.7-max', 'wan2.7-t2i-pro', 'happyhorse-v2.0-pro'],
    providers: ['alibaba', 'alibaba', 'alibaba'],
  },
  {
    id: 'productVideo',
    name: '产品宣传视频',
    models: ['qwen3.7-max', 'hy-image-3.0', 'happyhorse-v2.0-pro'],
    providers: ['alibaba', 'tencent', 'alibaba'],
  },
  {
    id: 'storeTour',
    name: '探店视频',
    models: ['qwen3.7-max', 'hy-image-3.0', 'happyhorse-v2.0-pro', 'qwen-tts-plus'],
    providers: ['alibaba', 'tencent', 'alibaba', 'alibaba'],
  },
  {
    id: 'personMv',
    name: '真人MV视频',
    models: ['qwen3.7-max', 'hy-image-3.0', 'happyhorse-v2.0-pro', 'qwen-tts-plus', 'fun-music-v1', 'cosyvoice-v1'],
    providers: ['alibaba', 'tencent', 'alibaba', 'alibaba', 'alibaba', 'alibaba'],
  },
  {
    id: 'cartoonVideo',
    name: '萌宠卡通短视频',
    models: ['qwen3.7-max', 'wan2.7-t2i-pro', 'happyhorse-v2.0-pro', 'qwen-tts-plus'],
    providers: ['alibaba', 'alibaba', 'alibaba', 'alibaba'],
  },
  {
    id: 'digitalHuman',
    name: '数字人短视频',
    models: ['qwen3.7-max', 'humanactor-hy'],
    providers: ['alibaba', 'tencent'],
  },
];

// ============================================================
// 模型 -> API端点映射
// ============================================================
interface ModelEndpoint {
  model: string;
  provider: 'tencent' | 'alibaba';
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  body: Record<string, unknown>;
  checkFn: string; // 如何判断成功
}

const ENDPOINTS: Record<string, ModelEndpoint> = {
  // 腾讯云 TokenHub 模型
  'deepseek-v4-pro': {
    model: 'deepseek-v4-pro',
    provider: 'tencent',
    endpoint: 'https://tokenhub.tencentmaas.com/v1/chat/completions',
    method: 'POST',
    headers: {},
    body: {
      model: 'deepseek-v4-pro',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    },
    checkFn: 'status 200 + choices',
  },
  'qwen3.7-max': {
    model: 'qwen3.7-max',
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    method: 'POST',
    headers: {},
    body: {
      model: 'qwen3.7-max',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    },
    checkFn: 'status 200 + choices',
  },
  'hy-image-3.0': {
    model: 'hy-image-3.0',
    provider: 'tencent',
    endpoint: 'https://tokenhub.tencentmaas.com/v1/images/generations',
    method: 'POST',
    headers: {},
    body: {
      model: 'hy-image-3.0',
      prompt: 'test white square 50x50',
      n: 1,
      size: '512x512',
    },
    checkFn: 'status 200 + data',
  },
  'flux-pro-v1.1-ultra': {
    model: 'flux-pro-v1.1-ultra',
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
    method: 'POST',
    headers: { 'X-DashScope-Async': 'enable' },
    body: {
      model: 'flux-pro-v1.1-ultra',
      input: { prompt: 'test white square' },
      parameters: { size: '512*512', n: 1 },
    },
    checkFn: 'status 200 + output',
  },
  'wan2.7-t2i-pro': {
    model: 'wan2.7-t2i-pro',
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
    method: 'POST',
    headers: { 'X-DashScope-Async': 'enable' },
    body: {
      model: 'wan2.7-t2i-pro',
      input: { prompt: 'test white square' },
      parameters: { size: '512*512', n: 1 },
    },
    checkFn: 'status 200 + output',
  },
  'happyhorse-v2.0-pro': {
    model: 'happyhorse-v2.0-pro',
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/generation',
    method: 'POST',
    headers: { 'X-DashScope-Async': 'enable' },
    body: {
      model: 'happyhorse-v2.0-pro',
      input: { prompt: 'a still white background' },
      parameters: { duration: 1 },
    },
    checkFn: 'status 200 + output',
  },
  'qwen-tts-plus': {
    model: 'qwen-tts-plus',
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation',
    method: 'POST',
    headers: {},
    body: {
      model: 'qwen-audio-3.0-tts-plus',
      input: { text: '测试' },
      parameters: { voice: 'longxiaochun', language_type: 'Chinese' },
    },
    checkFn: 'status 200 + output',
  },
  'fun-music-v1': {
    model: 'fun-music-v1',
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    method: 'POST',
    headers: {},
    body: {
      model: 'fun-music-v1',
      input: { prompt: 'happy birthday' },
    },
    checkFn: 'status 200',
  },
  'cosyvoice-v1': {
    model: 'cosyvoice-v1',
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation',
    method: 'POST',
    headers: {},
    body: {
      model: 'cosyvoice-v1',
      input: { text: '测试' },
      parameters: { voice: 'longxiaochun', language_type: 'Chinese' },
    },
    checkFn: 'status 200 + output',
  },
  'humanactor-hy': {
    model: 'humanactor-hy',
    provider: 'tencent',
    endpoint: 'https://tokenhub.tencentmaas.com/v1/images/generations',
    method: 'POST',
    headers: {},
    body: {
      model: 'humanactor-hy',
      prompt: 'test',
      n: 1,
    },
    checkFn: 'status 200',
  },
};

async function main() {
  console.log('='.repeat(70));
  console.log('AI创作工厂 10功能通道连通性测试');
  console.log('='.repeat(70));
  console.log(`测试时间: ${new Date().toISOString()}`);
  console.log('');

  // 1. 获取 API Keys
  console.log('>>> 步骤1: 获取 API Key 配置\n');
  const apiKeys = await prisma.apiKey.findMany({
    select: {
      id: true,
      provider: true,
      apiKey: true,
      status: true,
    },
  });

  const providers = await prisma.apiProvider.findMany({
    select: {
      id: true,
      name: true,
      baseUrl: true,
      status: true,
    },
  });

  console.log(`数据库中找到 ${apiKeys.length} 个 API Key:`);
  for (const k of apiKeys) {
    console.log(`  - ${k.provider}: ${k.status} (key前8位: ${k.apiKey.substring(0, 8)}...)`);
  }
  console.log(`数据库中找到 ${providers.length} 个 Provider:`);
  for (const p of providers) {
    console.log(`  - ${p.name}: ${p.baseUrl} [${p.status}]`);
  }
  console.log('');

  // 构建 key map
  const keyMap: Record<string, string> = {};
  for (const k of apiKeys) {
    if (k.status === 'ACTIVE') {
      const providerName = k.provider.toLowerCase();
      if (providerName.includes('tencent') || providerName.includes('tokenhub')) {
        keyMap['tencent'] = k.apiKey;
      } else if (providerName.includes('alibaba') || providerName.includes('aliyun') || providerName.includes('dashscope')) {
        keyMap['alibaba'] = k.apiKey;
      }
    }
  }

  if (!keyMap['tencent'] && !keyMap['alibaba']) {
    console.log('!!! 未找到有效的 API Key，检查环境变量...');
    // 尝试从环境变量获取
    if (process.env.ALIYUN_DASHSCOPE_API_KEY) {
      keyMap['alibaba'] = process.env.ALIYUN_DASHSCOPE_API_KEY;
      console.log('  从环境变量 ALIYUN_DASHSCOPE_API_KEY 获取到阿里云 Key');
    }
    if (process.env.TENCENT_API_KEY) {
      keyMap['tencent'] = process.env.TENCENT_API_KEY;
      console.log('  从环境变量 TENCENT_API_KEY 获取到腾讯云 Key');
    }
    if (process.env.TENCENT_SECRET_ID && process.env.TENCENT_SECRET_KEY) {
      keyMap['tencent'] = process.env.TENCENT_SECRET_ID;
      console.log('  从环境变量 TENCENT_SECRET_ID 获取到腾讯云 Key');
    }
  }

  console.log(`\n有效 Key: tencent=${keyMap['tencent'] ? 'YES (' + keyMap['tencent'].substring(0, 8) + '...)' : 'NO'}, alibaba=${keyMap['alibaba'] ? 'YES (' + keyMap['alibaba'].substring(0, 8) + '...)' : 'NO'}`);
  console.log('');

  // 2. 收集需要测试的唯一模型
  const allModels = new Set<string>();
  for (const f of FEATURES) {
    for (const m of f.models) {
      allModels.add(m);
    }
  }

  console.log(`>>> 步骤2: 测试 ${allModels.size} 个唯一模型API通道\n`);

  // 添加 deepseek-v4-pro（虽然不在当前10功能里，但是系统主要模型）
  // allModels.add('deepseek-v4-pro');

  const results: { model: string; provider: string; status: 'PASS' | 'FAIL' | 'SKIP'; latency: number; message: string }[] = [];

  for (const modelName of allModels) {
    const ep = ENDPOINTS[modelName];
    if (!ep) {
      results.push({ model: modelName, provider: 'N/A', status: 'SKIP', latency: 0, message: '无端点配置' });
      console.log(`  [SKIP] ${modelName} - 无测试端点定义`);
      continue;
    }

    const apiKey = keyMap[ep.provider];
    if (!apiKey) {
      results.push({ model: modelName, provider: ep.provider, status: 'FAIL', latency: 0, message: `缺少 ${ep.provider} API Key` });
      console.log(`  [FAIL] ${modelName} (${ep.provider}) - 缺少 API Key`);
      continue;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (ep.provider === 'tencent') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (ep.provider === 'alibaba') {
      headers['Authorization'] = `Bearer ${apiKey}`;
      // 部分百炼接口需要不同的鉴权方式
      if (ep.endpoint.includes('/services/')) {
        // 百炼异步接口可以是 Bearer 也可以直接传
      }
    }

    // 合并自定义 headers
    Object.assign(headers, ep.headers);

    const startTime = Date.now();
    try {
      const resp = await fetch(ep.endpoint, {
        method: ep.method,
        headers,
        body: JSON.stringify(ep.body),
      });

      const latency = Date.now() - startTime;
      const text = await resp.text();
      let json: any;
      try { json = JSON.parse(text); } catch { json = { raw: text.substring(0, 200) }; }

      if (resp.status >= 200 && resp.status < 300) {
        results.push({ model: modelName, provider: ep.provider, status: 'PASS', latency, message: `HTTP ${resp.status}` });
        console.log(`  [PASS] ${modelName} (${ep.provider}) - HTTP ${resp.status} - ${latency}ms`);
      } else {
        const errMsg = json?.error?.message || json?.message || text.substring(0, 100);
        results.push({ model: modelName, provider: ep.provider, status: 'FAIL', latency, message: `HTTP ${resp.status}: ${errMsg}` });
        console.log(`  [FAIL] ${modelName} (${ep.provider}) - HTTP ${resp.status}: ${errMsg}`);
      }
    } catch (err: any) {
      const latency = Date.now() - startTime;
      results.push({ model: modelName, provider: ep.provider, status: 'FAIL', latency, message: err.message });
      console.log(`  [FAIL] ${modelName} (${ep.provider}) - ${err.message}`);
    }
  }

  // 3. 总结
  console.log('');
  console.log('='.repeat(70));
  console.log('功能通道汇总');
  console.log('='.repeat(70));
  console.log('');

  const modelResultMap: Record<string, { status: string; message: string }> = {};
  for (const r of results) {
    modelResultMap[r.model] = { status: r.status, message: r.message };
  }

  let allFeaturesPass = true;
  for (const f of FEATURES) {
    const featureResults = f.models.map((m, i) => ({
      model: m,
      provider: f.providers[i],
      result: modelResultMap[m] || { status: 'SKIP', message: '未找到测试结果' },
    }));

    const allPass = featureResults.every(r => r.result.status === 'PASS');
    const anyFail = featureResults.some(r => r.result.status === 'FAIL');
    const icon = allPass ? 'OK' : anyFail ? 'FAIL' : 'PARTIAL';

    console.log(`  [${icon}] ${f.name} (${f.id})`);
    for (const fr of featureResults) {
      const s = fr.result.status === 'PASS' ? '✓' : fr.result.status === 'FAIL' ? '✗' : '?';
      console.log(`       ${s} ${fr.model} (${fr.provider}): ${fr.result.message}`);
    }
  }

  console.log('');

  // 4. 总体打分
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  const totalTested = passCount + failCount;

  console.log(`测试总计: ${results.length} 个模型, 通过 ${passCount}/${totalTested}, 失败 ${failCount}/${totalTested}, 跳过 ${skipCount}`);

  if (failCount === 0 && skipCount === 0) {
    console.log('\n✓ 全部通道可用！AI创作工厂所有10个功能的API通道均正常。');
  } else if (failCount > 0) {
    console.log(`\n✗ 有 ${failCount} 个通道失败，部分功能可能不可用。`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('测试脚本运行失败:', err);
  prisma.$disconnect();
  process.exit(1);
});
