/**
 * AI创作工厂 10功能通道连通性测试
 * 纯 JS 版本，使用 server 目录下的 Prisma Client
 */
const { PrismaClient } = require('../server/node_modules/@prisma/client');

const prisma = new PrismaClient();

// 10大功能定义
const FEATURES = [
  { id: 'xiaohongshu',    name: '小红书图文',       models: ['qwen3.7-max', 'flux-pro-v1.1-ultra'] },
  { id: 'image',          name: '图片生成',         models: ['wan2.7-t2i-pro', 'flux-pro-v1.1-ultra', 'hy-image-3.0'] },
  { id: 'ecommerce',      name: '电商详情页',       models: ['qwen3.7-max', 'hy-image-3.0'] },
  { id: 'shortVideo',     name: '短视频脚本',       models: ['qwen3.7-max', 'hy-image-3.0'] },
  { id: 'enterpriseVideo',name: '企业宣传视频',     models: ['qwen3.7-max', 'wan2.7-t2i-pro', 'happyhorse-v2.0-pro'] },
  { id: 'productVideo',   name: '产品宣传视频',     models: ['qwen3.7-max', 'hy-image-3.0', 'happyhorse-v2.0-pro'] },
  { id: 'storeTour',      name: '探店视频',         models: ['qwen3.7-max', 'hy-image-3.0', 'happyhorse-v2.0-pro', 'qwen-tts-plus'] },
  { id: 'personMv',       name: '真人MV视频',       models: ['qwen3.7-max', 'hy-image-3.0', 'happyhorse-v2.0-pro', 'qwen-tts-plus', 'fun-music-v1', 'cosyvoice-v1'] },
  { id: 'cartoonVideo',   name: '萌宠卡通短视频',   models: ['qwen3.7-max', 'wan2.7-t2i-pro', 'happyhorse-v2.0-pro', 'qwen-tts-plus'] },
  { id: 'digitalHuman',   name: '数字人短视频',     models: ['qwen3.7-max', 'humanactor-hy'] },
];

// 模型 -> API端点
const ENDPOINTS = {
  'qwen3.7-max':           { provider: 'alibaba', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',         body: { model: 'qwen3.7-max', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 } },
  'deepseek-v4-pro':       { provider: 'tencent',  url: 'https://tokenhub.tencentmaas.com/v1/chat/completions',                      body: { model: 'deepseek-v4-pro', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 } },
  'hy-image-3.0':          { provider: 'tencent',  url: 'https://tokenhub.tencentmaas.com/v1/images/generations',                    body: { model: 'hy-image-3.0', prompt: 'test', n: 1, size: '256x256' } },
  'flux-pro-v1.1-ultra':   { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', body: { model: 'flux-pro-v1.1-ultra', input: { prompt: 'test' }, parameters: { size: '256*256', n: 1 } }, asyncHeader: {'X-DashScope-Async': 'enable'} },
  'wan2.7-t2i-pro':        { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', body: { model: 'wan2.7-t2i-pro', input: { prompt: 'test' }, parameters: { size: '256*256', n: 1 } }, asyncHeader: {'X-DashScope-Async': 'enable'} },
  'happyhorse-v2.0-pro':   { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/generation', body: { model: 'happyhorse-v2.0-pro', input: { prompt: 'test still' }, parameters: { duration: 1 } } },
  'qwen-tts-plus':         { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation', body: { model: 'qwen-audio-3.0-tts-plus', input: { text: 'test' }, parameters: { voice: 'longxiaochun', language_type: 'Chinese' } } },
  'fun-music-v1':          { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', body: { model: 'fun-music-v1', input: { prompt: 'happy' } } },
  'cosyvoice-v1':          { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation', body: { model: 'cosyvoice-v1', input: { text: 'test' }, parameters: { voice: 'longxiaochun', language_type: 'Chinese' } } },
  'humanactor-hy':         { provider: 'tencent',   url: 'https://tokenhub.tencentmaas.com/v1/chat/completions',                      body: { model: 'humanactor-hy', messages: [{ role: 'user', content: 'test' }], max_tokens: 5 } },
};

async function main() {
  console.log('='.repeat(70));
  console.log('AI创作工厂 10功能通道连通性测试');
  console.log('='.repeat(70));
  console.log('测试时间: ' + new Date().toISOString());
  console.log('');

  // 1. 获取 API Keys
  console.log('>>> 步骤1: 获取 API Key 配置\n');
  
  let dbKeys = [];
  let dbProviders = [];
  try {
    dbKeys = await prisma.apiKey.findMany({
      select: { id: true, provider: true, apiKey: true, status: true },
    });
    dbProviders = await prisma.apiProvider.findMany({
      select: { id: true, name: true, baseUrl: true, status: true },
    });
  } catch (e) {
    console.log('数据库查询失败: ' + e.message);
    console.log('尝试使用环境变量...');
  }

  console.log('数据库 API Key: ' + dbKeys.length + ' 个');
  for (const k of dbKeys) {
    console.log('  - ' + k.provider + ': ' + k.status + ' (key: ' + k.apiKey.substring(0, 8) + '...)');
  }
  console.log('数据库 Provider: ' + dbProviders.length + ' 个');
  for (const p of dbProviders) {
    console.log('  - ' + p.name + ': ' + p.baseUrl + ' [' + p.status + ']');
  }

  // 构建 key map
  const keyMap = {};
  for (const k of dbKeys) {
    if (k.status === 'ACTIVE') {
      const p = k.provider.toLowerCase();
      if (p.includes('tencent') || p.includes('tokenhub')) keyMap['tencent'] = k.apiKey;
      else if (p.includes('alibaba') || p.includes('aliyun') || p.includes('dashscope') || p.includes('bailian')) keyMap['alibaba'] = k.apiKey;
    }
  }

  // Fallback 到环境变量
  if (!keyMap['alibaba'] && process.env.ALIYUN_DASHSCOPE_API_KEY) {
    keyMap['alibaba'] = process.env.ALIYUN_DASHSCOPE_API_KEY;
    console.log('\n使用环境变量 ALIYUN_DASHSCOPE_API_KEY');
  }
  if (!keyMap['tencent'] && process.env.TENCENT_API_KEY) {
    keyMap['tencent'] = process.env.TENCENT_API_KEY;
    console.log('使用环境变量 TENCENT_API_KEY');
  }

  console.log('\n有效 Key:');
  console.log('  腾讯云 TokenHub: ' + (keyMap['tencent'] ? 'YES (' + keyMap['tencent'].substring(0, 8) + '...)' : 'NO'));
  console.log('  阿里云百炼:     ' + (keyMap['alibaba'] ? 'YES (' + keyMap['alibaba'].substring(0, 8) + '...)' : 'NO'));
  console.log('');

  if (!keyMap['tencent'] && !keyMap['alibaba']) {
    console.log('!!! 错误: 没有任何有效的 API Key！');
    console.log('请通过管理后台 (admin/api-config) 配置 API Key');
    await prisma.$disconnect();
    return;
  }

  // 2. 收集需要测试的唯一模型
  const allModels = new Set();
  for (const f of FEATURES) {
    for (const m of f.models) allModels.add(m);
  }

  console.log('>>> 步骤2: 测试 ' + allModels.size + ' 个唯一模型API通道\n');

  const results = [];

  for (const modelName of allModels) {
    const ep = ENDPOINTS[modelName];
    if (!ep) {
      results.push({ model: modelName, status: 'SKIP', message: '无端点配置' });
      console.log('  [SKIP] ' + modelName + ' - 无测试端点定义');
      continue;
    }

    const apiKey = keyMap[ep.provider];
    if (!apiKey) {
      results.push({ model: modelName, status: 'FAIL', message: '缺少 ' + ep.provider + ' API Key' });
      console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - 缺少 API Key');
      continue;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    };
    if (ep.asyncHeader) Object.assign(headers, ep.asyncHeader);

    const startTime = Date.now();
    try {
      const resp = await fetch(ep.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(ep.body),
      });

      const latency = Date.now() - startTime;
      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { raw: text.substring(0, 200) }; }

      if (resp.status >= 200 && resp.status < 300) {
        // 检查是否有错误码
        if (json.code || (json.error && json.error.code)) {
          const errMsg = json.message || json.error?.message || JSON.stringify(json).substring(0, 150);
          results.push({ model: modelName, status: 'FAIL', message: 'API返回错误: ' + errMsg });
          console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - HTTP ' + resp.status + ' but API error: ' + errMsg);
        } else {
          results.push({ model: modelName, status: 'PASS', message: 'HTTP ' + resp.status + ' OK' });
          console.log('  [PASS] ' + modelName + ' (' + ep.provider + ') - HTTP ' + resp.status + ' - ' + latency + 'ms');
        }
      } else {
        const errMsg = json?.error?.message || json?.message || text.substring(0, 100);
        results.push({ model: modelName, status: 'FAIL', message: 'HTTP ' + resp.status + ': ' + errMsg });
        console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - HTTP ' + resp.status + ': ' + errMsg);
      }
    } catch (err) {
      const latency = Date.now() - startTime;
      results.push({ model: modelName, status: 'FAIL', message: err.message });
      console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - ' + err.message);
    }
  }

  // 3. 按功能汇总
  console.log('');
  console.log('='.repeat(70));
  console.log('功能通道汇总');
  console.log('='.repeat(70));
  console.log('');

  const modelResultMap = {};
  for (const r of results) {
    modelResultMap[r.model] = r;
  }

  let allFeaturesPass = 0;
  let partialPass = 0;
  let allFail = 0;

  for (const f of FEATURES) {
    const frStatuses = f.models.map(m => modelResultMap[m] ? modelResultMap[m].status : 'SKIP');
    const passCount = frStatuses.filter(s => s === 'PASS').length;
    const failCount = frStatuses.filter(s => s === 'FAIL').length;
    const total = frStatuses.length;
    
    let icon;
    if (passCount === total) { icon = 'OK'; allFeaturesPass++; }
    else if (failCount === total) { icon = 'FAIL'; allFail++; }
    else { icon = 'P?'; partialPass++; }

    console.log('  [' + icon + '] ' + f.name + ' (' + f.id + ')  [' + passCount + '/' + total + ']');
    for (const m of f.models) {
      const r = modelResultMap[m];
      const s = r ? (r.status === 'PASS' ? '+' : r.status === 'FAIL' ? '-' : '?') : '?';
      const msg = r ? r.message : '未知';
      console.log('       ' + s + ' ' + m + ': ' + msg);
    }
  }

  // 4. 总体打分
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;

  console.log('');
  console.log('='.repeat(70));
  console.log('总体结果');
  console.log('='.repeat(70));
  console.log('模型总数: ' + results.length + ', 通过: ' + passCount + ', 失败: ' + failCount + ', 跳过: ' + skipCount);
  console.log('功能完全可用: ' + allFeaturesPass + '/10, 部分可用: ' + partialPass + '/10, 不可用: ' + allFail + '/10');

  if (failCount === 0 && skipCount === 0) {
    console.log('\n✓ 全部通道可用！AI创作工厂所有10个功能的API通道均正常。');
  } else {
    console.log('\n详细信息请查看上方各通道测试结果。');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('测试脚本运行失败:', err);
  try { prisma.$disconnect(); } catch {}
  process.exit(1);
});
