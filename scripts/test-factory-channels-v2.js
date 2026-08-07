/**
 * AI创作工厂 10功能通道连通性测试 v2
 * 使用正确的 modelId（来自 category-config.ts MODEL_INFO）
 */
const https = require('https');

// API Keys
const ALIBABA_KEY = 'sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg';
const TENCENT_KEY = 'sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h';

// ============================================================
// 10 大功能 & 实际模型ID映射
// ============================================================
const FEATURES = [
  { id: 'xiaohongshu',    name: '小红书图文',       channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',     modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: 'Qwen Image Max (配图)',   modelId: 'qwen-image-max',         provider: 'alibaba', type: 'image' },
    { label: 'Flux Pro v1.1 (备图)',    modelId: 'flux-pro-v1.1-ultra',    provider: 'alibaba', type: 'image' },
  ]},
  { id: 'image',          name: '图片生成',         channels: [
    { label: 'DeepSeek V4 Pro (策略)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (风格)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: 'Qwen Image Max (图像)',  modelId: 'qwen-image-max',         provider: 'alibaba', type: 'image' },
    { label: 'Flux Pro v1.1 (备图)',   modelId: 'flux-pro-v1.1-ultra',    provider: 'alibaba', type: 'image' },
    { label: '混元 Image 3.0 (备图)',  modelId: 'hy-image-v3.0',          provider: 'tencent', type: 'image' },
  ]},
  { id: 'ecommerce',      name: '电商详情页',       channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: 'WAN 2.7 Pro (商品图)',   modelId: 'wan2.7-image-pro',       provider: 'alibaba', type: 'image' },
    { label: 'Qwen Image Max (详情图)',modelId: 'qwen-image-max',         provider: 'alibaba', type: 'image' },
    { label: 'Flux Pro v1.1 (备图)',   modelId: 'flux-pro-v1.1-ultra',    provider: 'alibaba', type: 'image' },
  ]},
  { id: 'shortVideo',     name: '短视频脚本',       channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: '可灵 KLING 3.0 (视频)',  modelId: 'kl-video-v3',            provider: 'tencent', type: 'video' },
    { label: '千问 TTS Plus (配音)',   modelId: 'qwen-audio-3.0-tts-plus',provider: 'alibaba', type: 'tts' },
  ]},
  { id: 'enterpriseVideo',name: '企业宣传视频',     channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: '可灵 KLING 3.0 (视频)',  modelId: 'kl-video-v3',            provider: 'tencent', type: 'video' },
    { label: '千问 TTS Plus (配音)',   modelId: 'qwen-audio-3.0-tts-plus',provider: 'alibaba', type: 'tts' },
  ]},
  { id: 'productVideo',   name: '产品宣传视频',     channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: '可灵 KLING 3.0 (视频)',  modelId: 'kl-video-v3',            provider: 'tencent', type: 'video' },
    { label: '千问 TTS Plus (配音)',   modelId: 'qwen-audio-3.0-tts-plus',provider: 'alibaba', type: 'tts' },
    { label: 'WAN 2.7 Pro (商品图)',   modelId: 'wan2.7-image-pro',       provider: 'alibaba', type: 'image' },
    { label: 'Qwen Image Max (图)',    modelId: 'qwen-image-max',         provider: 'alibaba', type: 'image' },
  ]},
  { id: 'storeTour',      name: '探店视频',         channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: '可灵 KLING 3.0 (视频)',  modelId: 'kl-video-v3',            provider: 'tencent', type: 'video' },
    { label: '千问 TTS Plus (配音)',   modelId: 'qwen-audio-3.0-tts-plus',provider: 'alibaba', type: 'tts' },
  ]},
  { id: 'personMv',       name: '真人MV视频',       channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: '可灵 KLING 3.0 (视频)',  modelId: 'kl-video-v3',            provider: 'tencent', type: 'video' },
    { label: '千问 TTS Plus (配音)',   modelId: 'qwen-audio-3.0-tts-plus',provider: 'alibaba', type: 'tts' },
    { label: 'Qwen Image Max (视觉)',  modelId: 'qwen-image-max',         provider: 'alibaba', type: 'image' },
    { label: 'Flux Pro v1.1 (备图)',   modelId: 'flux-pro-v1.1-ultra',    provider: 'alibaba', type: 'image' },
  ]},
  { id: 'cartoonVideo',   name: '萌宠卡通短视频',   channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: '可灵 KLING 3.0 (视频)',  modelId: 'kl-video-v3',            provider: 'tencent', type: 'video' },
    { label: '千问 TTS Plus (配音)',   modelId: 'qwen-audio-3.0-tts-plus',provider: 'alibaba', type: 'tts' },
    { label: 'Qwen Image Max (视觉)',  modelId: 'qwen-image-max',         provider: 'alibaba', type: 'image' },
    { label: 'Flux Pro v1.1 (备图)',   modelId: 'flux-pro-v1.1-ultra',    provider: 'alibaba', type: 'image' },
  ]},
  { id: 'digitalHuman',   name: '数字人短视频',     channels: [
    { label: 'DeepSeek V4 Pro (文案)', modelId: 'deepseek-v4-pro-202606', provider: 'tencent', type: 'chat' },
    { label: 'Qwen 3.7 Max (文案)',    modelId: 'qwen3.7-max',            provider: 'alibaba', type: 'chat' },
    { label: '数字人 HumanActor(出镜)',modelId: 'yt-video-humanactor',     provider: 'tencent', type: 'digital_human' },
    { label: '千问 TTS Plus (配音)',   modelId: 'qwen-audio-3.0-tts-plus',provider: 'alibaba', type: 'tts' },
  ]},
];

function fetchAPI(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers,
      timeout: 30000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data.substring(0, 300) }; }
        resolve({ status: res.statusCode, json, raw: data.substring(0, 300) });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function getProviderBaseUrl(provider) {
  return provider === 'tencent'
    ? 'https://tokenhub.tencentmaas.com/v1'
    : 'https://dashscope.aliyuncs.com';
}

async function testChannel(channel) {
  const apiKey = channel.provider === 'tencent' ? TENCENT_KEY : ALIBABA_KEY;
  const baseUrl = getProviderBaseUrl(channel.provider);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + apiKey,
  };

  let url, body;

  switch (channel.type) {
    case 'chat':
      url = baseUrl + (channel.provider === 'tencent' ? '/chat/completions' : '/compatible-mode/v1/chat/completions');
      body = { model: channel.modelId, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 };
      break;

    case 'image':
      if (channel.provider === 'tencent') {
        url = baseUrl + '/images/generations';
        body = { model: channel.modelId, prompt: 'a white square', n: 1, size: '256x256' };
      } else {
        url = baseUrl + '/api/v1/services/aigc/image-generation/generation';
        headers['X-DashScope-Async'] = 'enable';
        body = { model: channel.modelId, input: { prompt: 'a white square' }, parameters: { size: '256*256', n: 1 } };
      }
      break;

    case 'video':
      if (channel.provider === 'tencent') {
        url = baseUrl + '/video/generations';
        body = { model: channel.modelId, prompt: 'a still white background', duration: 1 };
      } else {
        url = baseUrl + '/api/v1/services/aigc/video-generation/generation';
        body = { model: channel.modelId, input: { prompt: 'a still white background' }, parameters: { duration: 1 } };
      }
      break;

    case 'tts':
      url = baseUrl + '/api/v1/services/aigc/text-to-speech/generation';
      body = { model: channel.modelId, input: { text: 'test' }, parameters: { voice: 'longxiaochun', language_type: 'Chinese' } };
      break;

    case 'digital_human':
      url = baseUrl + '/chat/completions';
      body = { model: channel.modelId, messages: [{ role: 'user', content: 'test' }], max_tokens: 5 };
      break;

    default:
      return { status: 'SKIP', message: 'Unknown type' };
  }

  const startTime = Date.now();
  try {
    const resp = await fetchAPI(url, headers, body);
    const latency = Date.now() - startTime;
    const json = resp.json;

    if (resp.status >= 200 && resp.status < 300) {
      if (json.code && json.code !== 0 && json.code !== 200) {
        return { status: 'FAIL', message: 'API错误: ' + (json.message || JSON.stringify(json).substring(0, 100)), latency };
      }
      if (json.error && json.error.code) {
        const errCode = json.error.code;
        // 权限问题也算通道不可用
        if (errCode === 'AccessDenied' || errCode === '403') {
          return { status: 'FAIL', message: '权限不足(403): ' + (json.error.message || '未开通此服务'), latency };
        }
        return { status: 'FAIL', message: 'API错误(' + errCode + '): ' + (json.error.message || ''), latency };
      }
      return { status: 'PASS', message: 'HTTP ' + resp.status + ' OK', latency };
    } else {
      const errMsg = json?.error?.message || json?.message || resp.raw;
      return { status: 'FAIL', message: 'HTTP ' + resp.status + ': ' + errMsg, latency };
    }
  } catch (err) {
    const latency = Date.now() - startTime;
    return { status: 'FAIL', message: err.message, latency };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('AI创作工厂 10功能 API通道连通性测试 v2');
  console.log('='.repeat(70));
  console.log('时间: ' + new Date().toISOString());
  console.log('');

  // 收集唯一通道
  const uniqueChannels = [];
  const seen = new Set();
  for (const f of FEATURES) {
    for (const c of f.channels) {
      const key = c.modelId + '|' + c.type;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueChannels.push(c);
      }
    }
  }

  console.log('共 ' + uniqueChannels.length + ' 个唯一通道待测试\n');

  // 测试所有唯一通道
  const results = {};
  let idx = 0;
  for (const c of uniqueChannels) {
    idx++;
    process.stdout.write('  [' + idx + '/' + uniqueChannels.length + '] ' + c.label + ' (' + c.modelId + ', ' + c.provider + ', ' + c.type + ')... ');
    const r = await testChannel(c);
    results[c.modelId] = r;
    console.log(r.status === 'PASS' ? 'PASS ' + r.latency + 'ms' : 'FAIL: ' + r.message);
  }

  // 按功能汇总
  console.log('');
  console.log('='.repeat(70));
  console.log('10功能通道汇总');
  console.log('='.repeat(70));
  console.log('');

  let allOK = 0, partialOK = 0, allBad = 0;

  for (const f of FEATURES) {
    const channelResults = f.channels.map(c => ({
      label: c.label,
      result: results[c.modelId] || { status: 'SKIP', message: '未测试' },
    }));
    const passCount = channelResults.filter(r => r.result.status === 'PASS').length;
    const failCount = channelResults.filter(r => r.result.status === 'FAIL').length;
    const total = channelResults.length;
    let icon;
    if (passCount === total) { icon = 'OK'; allOK++; }
    else if (failCount === total) { icon = 'FAIL'; allBad++; }
    else { icon = 'P?'; partialOK++; }

    console.log('  [' + icon + '] ' + f.name + ' (' + f.id + ')  [' + passCount + '/' + total + ' 通道通]');
    for (const cr of channelResults) {
      const s = cr.result.status === 'PASS' ? '+' : cr.result.status === 'FAIL' ? '-' : '?';
      console.log('       ' + s + ' ' + cr.label + ': ' + cr.result.message);
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('总体结果');
  console.log('='.repeat(70));
  const uniqueResults = Object.entries(results);
  const passTotal = uniqueResults.filter(([, r]) => r.status === 'PASS').length;
  const failTotal = uniqueResults.filter(([, r]) => r.status === 'FAIL').length;
  console.log('唯一通道: ' + uniqueResults.length + ', 通过 ' + passTotal + ', 失败 ' + failTotal);
  console.log('功能: 全通 ' + allOK + '/10, 部分通 ' + partialOK + '/10, 全不通 ' + allBad + '/10');

  // 详细列出失败的通道
  const failed = uniqueResults.filter(([, r]) => r.status === 'FAIL');
  if (failed.length > 0) {
    console.log('\n失败通道详情:');
    for (const [modelId, r] of failed) {
      console.log('  - ' + modelId + ': ' + r.message);
    }
  }
}

main().catch(console.error);
