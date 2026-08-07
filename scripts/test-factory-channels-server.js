/**
 * AI创作工厂 10功能通道连通性测试
 * 服务器端版本 - 从机器环境变量获取 API Key
 */
const https = require('https');

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
  'fun-music-v1':          { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', body: { model: 'fun-music-v1', input: { messages: [{ role: 'user', content: 'Make a happy birthday song' }] } } },
  'cosyvoice-v1':          { provider: 'alibaba',  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation', body: { model: 'cosyvoice-v1', input: { text: 'test' }, parameters: { voice: 'longxiaochun', language_type: 'Chinese' } } },
  'humanactor-hy':         { provider: 'tencent',  url: 'https://tokenhub.tencentmaas.com/v1/chat/completions',                      body: { model: 'humanactor-hy', messages: [{ role: 'user', content: 'test' }], max_tokens: 5 } },
};

function fetchAPI(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data.substring(0, 200) }; }
        resolve({ status: res.statusCode, json, raw: data.substring(0, 200) });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('AI创作工厂 10功能通道连通性测试');
  console.log('='.repeat(70));
  console.log('测试时间: ' + new Date().toISOString());
  console.log('');

  // 获取 API Keys
  const alibabaKey = process.env.ALIYUN_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY || '';
  const tencentKey = process.env.TENCENT_TOKENHUB_API_KEY || process.env.TENCENT_API_KEY || '';

  console.log('>>> API Key 状态:');
  console.log('  阿里云百炼:     ' + (alibabaKey ? 'YES (' + alibabaKey.substring(0, 8) + '...)' : 'NO'));
  console.log('  腾讯云 TokenHub: ' + (tencentKey ? 'YES (' + tencentKey.substring(0, 8) + '...)' : 'NO'));
  console.log('');

  if (!alibabaKey && !tencentKey) {
    console.log('!!! 错误: 没有任何有效的 API Key！');
    return;
  }

  const keyMap = { alibaba: alibabaKey, tencent: tencentKey };

  // 收集所有唯一模型
  const allModels = new Set();
  for (const f of FEATURES) {
    for (const m of f.models) allModels.add(m);
  }

  console.log('>>> 测试 ' + allModels.size + ' 个唯一模型API通道\n');

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
      const resp = await fetchAPI(ep.url, headers, ep.body);
      const latency = Date.now() - startTime;

      if (resp.status >= 200 && resp.status < 300) {
        // 检查是否有业务错误码
        const json = resp.json;
        if (json.code && json.code !== 0 && json.code !== 200) {
          const errMsg = json.message || JSON.stringify(json).substring(0, 150);
          results.push({ model: modelName, status: 'FAIL', message: 'API Error: ' + errMsg });
          console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - HTTP ' + resp.status + ' but: ' + errMsg);
        } else if (json.error && json.error.code) {
          const errMsg = json.error.message || JSON.stringify(json.error).substring(0, 150);
          results.push({ model: modelName, status: 'FAIL', message: 'API Error: ' + errMsg });
          console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - HTTP ' + resp.status + ' but: ' + errMsg);
        } else {
          results.push({ model: modelName, status: 'PASS', message: 'OK (' + latency + 'ms)' });
          console.log('  [PASS] ' + modelName + ' (' + ep.provider + ') - HTTP ' + resp.status + ' - ' + latency + 'ms');
        }
      } else {
        const errMsg = resp.json?.error?.message || resp.json?.message || resp.raw;
        results.push({ model: modelName, status: 'FAIL', message: 'HTTP ' + resp.status + ': ' + errMsg });
        console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - HTTP ' + resp.status + ': ' + errMsg);
      }
    } catch (err) {
      const latency = Date.now() - startTime;
      results.push({ model: modelName, status: 'FAIL', message: err.message });
      console.log('  [FAIL] ' + modelName + ' (' + ep.provider + ') - ' + err.message);
    }
  }

  // 按功能汇总
  console.log('');
  console.log('='.repeat(70));
  console.log('10功能通道汇总');
  console.log('='.repeat(70));
  console.log('');

  const modelResultMap = {};
  for (const r of results) modelResultMap[r.model] = r;

  let allOK = 0;
  let partialOK = 0;
  let allBad = 0;

  for (const f of FEATURES) {
    const frResults = f.models.map(m => modelResultMap[m] ? modelResultMap[m].status : 'SKIP');
    const passCount = frResults.filter(s => s === 'PASS').length;
    const failCount = frResults.filter(s => s === 'FAIL').length;
    const total = frResults.length;
    let icon;
    if (passCount === total) { icon = 'OK'; allOK++; }
    else if (failCount === total) { icon = 'FAIL'; allBad++; }
    else { icon = 'P?'; partialOK++; }

    console.log('  [' + icon + '] ' + f.name + ' (' + f.id + ')  [' + passCount + '/' + total + ' 通道通]');
    for (const m of f.models) {
      const r = modelResultMap[m];
      const s = r ? (r.status === 'PASS' ? '+' : r.status === 'FAIL' ? '-' : '?') : '?';
      console.log('       ' + s + ' ' + m + ': ' + (r ? r.message : '未知'));
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('总体结果');
  console.log('='.repeat(70));
  const passTotal = results.filter(r => r.status === 'PASS').length;
  const failTotal = results.filter(r => r.status === 'FAIL').length;
  console.log('模型: ' + results.length + '个, 通过 ' + passTotal + ', 失败 ' + failTotal);
  console.log('功能: 完全可用 ' + allOK + '/10, 部分可用 ' + partialOK + '/10, 不可用 ' + allBad + '/10');
  console.log('');

  if (allOK === 10) {
    console.log('=== 全部10个功能的API通道均正常 ===');
  } else if (allBad > 0) {
    console.log('=== 有 ' + allBad + ' 个功能完全不可用，请检查API Key配置 ===');
  }
}

main().catch(console.error);
