/**
 * TTS 精确定位 — 测试不同格式和端点
 */

const https = require('https');

const KEY = 'sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg';

function apiCall(method, url, headers, body, timeout = 60000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const startTime = Date.now();
    const options = {
      hostname: urlObj.hostname, port: 443,
      path: urlObj.pathname + urlObj.search,
      method, headers: { 'Content-Type': 'application/json', ...headers }, timeout,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        let parsed = data;
        try { parsed = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, body: parsed, elapsed });
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message, elapsed: Date.now() - startTime }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout', elapsed: Date.now() - startTime }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const BASE = 'https://dashscope.aliyuncs.com';

  console.log('[1] qwen-tts on multimodal-generation with input.text');
  let r = await apiCall('POST', BASE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${KEY}` },
    { model: 'qwen-tts', input: { text: '你好世界' }, parameters: { voice: 'longanlingxi', format: 'mp3' } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms): ${JSON.stringify(r.body).substring(0, 300)}\n`);

  console.log('[2] qwen-audio-3.0-tts-plus on multimodal-generation with input.text');
  r = await apiCall('POST', BASE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${KEY}` },
    { model: 'qwen-audio-3.0-tts-plus', input: { text: '你好世界' }, parameters: { voice: 'longanlingxi', format: 'mp3' } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms): ${JSON.stringify(r.body).substring(0, 300)}\n`);

  console.log('[3] qwen-tts-flash on multimodal-generation with input.text');
  r = await apiCall('POST', BASE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${KEY}` },
    { model: 'qwen-tts-flash', input: { text: '你好世界' }, parameters: { voice: 'longanlingxi', format: 'mp3' } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms): ${JSON.stringify(r.body).substring(0, 300)}\n`);

  console.log('[4] qwen-tts on multimodal-generation ASYNC');
  r = await apiCall('POST', BASE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${KEY}`, 'X-DashScope-Async': 'enable' },
    { model: 'qwen-tts', input: { text: '你好世界' }, parameters: { voice: 'longanlingxi', format: 'mp3' } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms): ${JSON.stringify(r.body).substring(0, 300)}\n`);

  // Try OpenAI-compatible audio/speech
  console.log('[5] qwen-tts on compatible-mode/v1/audio/speech');
  r = await apiCall('POST', BASE + '/compatible-mode/v1/audio/speech',
    { 'Authorization': `Bearer ${KEY}` },
    { model: 'qwen-tts', input: '你好世界', voice: 'longanlingxi' }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms): ${JSON.stringify(r.body).substring(0, 300)}\n`);

  console.log('Done.');
}

main().catch(console.error);
