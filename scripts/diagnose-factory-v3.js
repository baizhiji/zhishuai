/**
 * AI创作工厂 — 第二轮精确定向诊断
 * 使用从官方文档/博客中确认的正确端点进行验证
 */

const https = require('https');
const http = require('http');

const ALIBABA_KEY = 'sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg';
const TENCENT_KEY = 'sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h';

function apiCall(method, url, headers, body, timeout = 90000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const startTime = Date.now();
    const options = {
      hostname: urlObj.hostname, port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method, headers: { 'Content-Type': 'application/json', ...headers }, timeout,
    };
    const req = client.request(options, (res) => {
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
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  第二轮 — 精确端点验证                         ║');
  console.log('╚══════════════════════════════════════════════════╝');

  // ============================================================
  // 1. qwen-image-max — 用 text-to-image 端点
  // ============================================================
  console.log('\n[1] qwen-image-max: text-to-image/image-generation');
  let r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-image/image-generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'qwen-image-max', input: { prompt: 'a white square' }, parameters: { size: '256*256', n: 1 } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  // ============================================================
  // 2. qwen-image-2.0-pro — 回退模型
  // ============================================================
  console.log('\n[2] qwen-image-2.0-pro: text-to-image/image-generation');
  r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-image/image-generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'qwen-image-2.0-pro', input: { prompt: 'a white square' }, parameters: { size: '256*256', n: 1 } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  // ============================================================
  // 3. qwen-image on text2image/image (older endpoint)
  // ============================================================
  console.log('\n[3] qwen-image: text2image/image (旧端点)');
  r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'qwen-image-max', input: { prompt: 'a white square' }, parameters: { size: '1024*1024', n: 1 } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  // ============================================================
  // 4. FLUX — try different model ID formats on text-to-image endpoint
  // ============================================================
  console.log('\n[4] Flux: flux/FLUX.2 z-image-turbo on text-to-image');
  r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-image/image-generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'flux/FLUX.2 z-image-turbo', input: { prompt: 'a white square' }, parameters: { size: '512*512', n: 1 } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  console.log('\n[5] Flux: flux/flux-dev on text-to-image');
  r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-image/image-generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'flux/flux-dev', input: { prompt: 'a white square' }, parameters: { size: '512*512', n: 1 } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  console.log('\n[6] Flux: flux-pro-v1.1-ultra on text-to-image');
  r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-image/image-generation',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'flux-pro-v1.1-ultra', input: { prompt: 'a white square' }, parameters: { size: '512*512', n: 1 } }
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  // ============================================================
  // 5. TokenHub video submit (hy-video as alternative)
  // ============================================================
  console.log('\n[7] TokenHub: /v1/api/video/submit, hy-video-1.5');
  r = await apiCall('POST',
    'https://tokenhub.tencentmaas.com/v1/api/video/submit',
    { 'Authorization': `Bearer ${TENCENT_KEY}` },
    { model: 'hy-video-1.5', prompt: 'a white square', duration: 5 },
    120000
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  console.log('\n[8] TokenHub: /v1/api/video/submit, hy-video-3.0');
  r = await apiCall('POST',
    'https://tokenhub.tencentmaas.com/v1/api/video/submit',
    { 'Authorization': `Bearer ${TENCENT_KEY}` },
    { model: 'hy-video-3.0', prompt: 'a white square', duration: 5 },
    120000
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  // ============================================================
  // 6. TTS — /api/v1/services/audio/tts/synthesis
  // ============================================================
  console.log('\n[9] TTS: /api/v1/services/audio/tts/synthesis, qwen-audio-3.0-tts-plus');
  r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/synthesis',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'qwen-audio-3.0-tts-plus', input: { text: '你好世界' }, parameters: { voice: 'longanlingxi', sample_rate: 24000, format: 'mp3' } },
    60000
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  // Also try with cosyvoice-v1
  console.log('\n[10] TTS: /api/v1/services/audio/tts/synthesis, cosyvoice-v1');
  r = await apiCall('POST',
    'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/synthesis',
    { 'Authorization': `Bearer ${ALIBABA_KEY}` },
    { model: 'cosyvoice-v1', input: { text: '你好世界' }, parameters: { voice: 'longxiaochun', format: 'mp3' } },
    60000
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 200)}`);

  // ============================================================
  // 7. HumanActor — verify correct params
  // ============================================================
  console.log('\n[11] HumanActor: /v1/api/video/submit with text');
  r = await apiCall('POST',
    'https://tokenhub.tencentmaas.com/v1/api/video/submit',
    { 'Authorization': `Bearer ${TENCENT_KEY}` },
    { model: 'yt-video-humanactor', text: '你好世界，欢迎使用数字人', voice: 'default' },
    120000
  );
  console.log(`  HTTP ${r.status} (${r.elapsed}ms) → ${JSON.stringify(r.body).substring(0, 250)}`);

  console.log('\n\n===== 诊断完成 =====');
}

main().catch(console.error);
