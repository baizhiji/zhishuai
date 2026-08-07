/**
 * 第三轮 — 使用官方文档确认的百炼新版API端点
 * 关键发现：百炼已迁移到 workplace-specific URL
 */

const https = require('https');

const ALIBABA_KEY = 'sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg';
const TENCENT_KEY = 'sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h';

function apiCall(method, url, headers, body, timeout = 120000) {
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
  console.log('=== 第三轮诊断：百炼新版API + TokenHub正确端点 ===\n');

  const DASHSCOPE = 'https://dashscope.aliyuncs.com';

  // ============================================================
  // TEST 1: qwen-image-max — multimodal-generation SYNC mode (NO async header!)
  // ============================================================
  console.log('[1] qwen-image-max: multimodal-generation (SYNC, NO X-DashScope-Async)');
  let r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    {
      model: 'qwen-image-max',
      input: {
        messages: [{ role: 'user', content: [{ text: 'a white square on gray background' }] }]
      },
      parameters: { size: '1328*1328', watermark: false }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 2: qwen-image-max — multimodal-generation ASYNC mode
  // ============================================================
  console.log('[2] qwen-image-max: multimodal-generation (ASYNC, WITH X-DashScope-Async)');
  r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
    {
      model: 'qwen-image-max',
      input: {
        messages: [{ role: 'user', content: [{ text: 'a white square on gray background' }] }]
      },
      parameters: { size: '1328*1328', watermark: false }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 3: z-image-turbo (替代Flux的模型)
  // ============================================================
  console.log('[3] z-image-turbo (Flux替代): multimodal-generation SYNC');
  r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    {
      model: 'z-image-turbo',
      input: {
        messages: [{ role: 'user', content: [{ text: 'a white square on gray background' }] }]
      },
      parameters: { size: '1328*1328', watermark: false }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 4: qwen-image-max with new body format (prompt field)
  // ============================================================
  console.log('[4] qwen-image-max: text2image/image with messages format');
  r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/text2image/image',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    {
      model: 'qwen-image-max',
      input: { prompt: 'a white square on gray background' },
      parameters: { size: '1328*1328', n: 1 }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 5: qwen-image-max on image-generation — try with messages body
  // ============================================================
  console.log('[5] qwen-image-max: image-generation/generation with messages format');
  r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/image-generation/generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
    {
      model: 'qwen-image-max',
      input: {
        messages: [{ role: 'user', content: [{ text: 'a white square on gray background' }] }]
      },
      parameters: { size: '1328*1328', watermark: false }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 6: qwen-audio-3.0-tts-plus: multimodal-generation endpoint
  // ============================================================
  console.log('[6] TTS: multimodal-generation, qwen-audio-3.0-tts-plus (SYNC)');
  r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    {
      model: 'qwen-audio-3.0-tts-plus',
      input: {
        messages: [{ role: 'user', content: [{ text: '你好世界' }] }]
      },
      parameters: { voice: 'longanlingxi', format: 'mp3' }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 7: TTS: qwen-tts model on multimodal-generation (may be different model name)
  // ============================================================
  console.log('[7] TTS: multimodal-generation, qwen-tts (SYNC)');
  r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    {
      model: 'qwen-tts',
      input: {
        messages: [{ role: 'user', content: [{ text: '你好世界' }] }]
      },
      parameters: { voice: 'longanlingxi', format: 'mp3' }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 8: TTS: cosyvoice-v1 on multimodal-generation
  // ============================================================
  console.log('[8] TTS: multimodal-generation, cosyvoice-v1 (SYNC)');
  r = await apiCall('POST',
    DASHSCOPE + '/api/v1/services/aigc/multimodal-generation/generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    {
      model: 'cosyvoice-v1',
      input: {
        messages: [{ role: 'user', content: [{ text: '你好世界' }] }]
      },
      parameters: { voice: 'longxiaochun', format: 'mp3' }
    }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms)`);
  console.log(`  ${JSON.stringify(r.body, null, 2).substring(0, 400)}\n`);

  // ============================================================
  // TEST 9: TokenHub: verify hy-video-1.5 works with full flow
  // ============================================================
  console.log('[9] TokenHub: hy-video-1.5 submit + poll');
  r = await apiCall('POST',
    'https://tokenhub.tencentmaas.com/v1/api/video/submit',
    { 'Authorization': `Bearer ${TENCENT_KEY}` },
    { model: 'hy-video-1.5', prompt: 'a white square rotating', duration: 5 },
    120000
  );
  console.log(`  Submit: HTTP ${r.status} → ${JSON.stringify(r.body).substring(0, 200)}`);

  // ============================================================
  // TEST 10: HumanActor: fix AudioUrl issue
  // ============================================================
  console.log('\n[10] HumanActor: /v1/api/video/submit with audio_url param');
  r = await apiCall('POST',
    'https://tokenhub.tencentmaas.com/v1/api/video/submit',
    { 'Authorization': `Bearer ${TENCENT_KEY}` },
    {
      model: 'yt-video-humanactor',
      text: '你好，欢迎使用数字人',
      audio_url: '',
      background: 'office'
    },
    120000
  );
  console.log(`  HTTP ${r.status} → ${JSON.stringify(r.body).substring(0, 250)}`);

  console.log('\n\n===== 第三轮诊断完成 =====');
}

main().catch(console.error);
