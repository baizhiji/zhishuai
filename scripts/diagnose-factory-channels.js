/**
 * AI创作工厂 — 5个失败通道综合诊断脚本
 * 对每个通道尝试多个 API 端点/格式组合，找到正确的调用方式
 */

const https = require('https');
const http = require('http');

// API Keys
const ALIBABA_KEY = 'sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg';
const TENCENT_KEY = 'sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h';

function apiCall(method, url, headers, body, timeout = 60000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    const startTime = Date.now();

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        let parsed = data;
        try { parsed = JSON.parse(data); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          elapsed,
        });
      });
    });

    req.on('error', (e) => resolve({ status: 0, error: e.message, elapsed: Date.now() - startTime }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout', elapsed: Date.now() - startTime }); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, configs) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  [诊断] ${name}`);
  console.log(`${'='.repeat(60)}`);

  for (const cfg of configs) {
    const { label, method, url, headers, body } = cfg;
    process.stdout.write(`\n  [TRY] ${label}\n         ${method} ${url}\n`);

    const result = await apiCall(method, url, headers, body, 90000);
    console.log(`  [RES] HTTP ${result.status} (${result.elapsed}ms)`);

    if (result.status >= 200 && result.status < 300) {
      console.log(`  [OK]  SUCCESS!`);
      if (typeof result.body === 'object') {
        console.log(`        Sample: ${JSON.stringify(result.body).substring(0, 300)}`);
      }
      return true; // Found working config
    } else {
      const errMsg = result.error || (typeof result.body === 'object' ? JSON.stringify(result.body).substring(0, 150) : result.body);
      console.log(`  [FAIL] ${errMsg}`);
    }
  }

  console.log(`\n  [XX] ALL ATTEMPTS FAILED for ${name}`);
  return false;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  AI创作工厂 — 5通道综合诊断                    ║');
  console.log('╚══════════════════════════════════════════════════╝');

  // ============================
  // Channel 1: qwen-image-max
  // ============================
  await test('1. qwen-image-max (百炼图片生成)', [
    // Variant A: OpenAI-compatible endpoint with qwen-image-max
    {
      label: 'OpenAI兼容: /compatible-mode/v1/images/generations, model=qwen-image-max',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'qwen-image-max', prompt: 'a white square', n: 1, size: '256x256' },
    },
    // Variant B: OpenAI-compatible with qwen/ prefix
    {
      label: 'OpenAI兼容: /compatible-mode/v1/images/generations, model=qwen/qwen-image-max',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'qwen/qwen-image-max', prompt: 'a white square', n: 1, size: '256x256' },
    },
    // Variant C: Native multimodal-generation endpoint
    {
      label: '原生API: /api/v1/services/aigc/multimodal-generation/generation',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
      body: { model: 'qwen-image-max', input: { messages: [{ role: 'user', content: [{ text: 'a white square' }] }] }, parameters: {} },
    },
    // Variant D: Native text2image endpoint
    {
      label: '原生API: /api/v1/services/aigc/text2image/image-synthesis',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
      body: { model: 'qwen-image-max', input: { prompt: 'a white square' }, parameters: { size: '1024*1024', n: 1 } },
    },
    // Variant E: image-generation endpoint with qwen-image-3.0-pro
    {
      label: '原生API: /api/v1/services/aigc/image-generation/generation, model=qwen-image-3.0-pro',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
      body: { model: 'qwen-image-3.0-pro', input: { prompt: 'a white square' }, parameters: { size: '256*256', n: 1 } },
    },
  ]);

  // ============================
  // Channel 2: flux-pro-v1.1-ultra
  // ============================
  await test('2. flux-pro-v1.1-ultra (百炼图片生成)', [
    // Variant A: flux/ prefix on OpenAI-compatible
    {
      label: 'OpenAI兼容: model=flux/flux-pro-v1.1-ultra',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'flux/flux-pro-v1.1-ultra', prompt: 'a white square', n: 1, size: '256x256' },
    },
    // Variant B: black-forest-labs prefix
    {
      label: 'OpenAI兼容: model=black-forest-labs/flux-pro-v1.1-ultra',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'black-forest-labs/flux-pro-v1.1-ultra', prompt: 'a white square', n: 1, size: '256x256' },
    },
    // Variant C: flux-dev (known working model)
    {
      label: 'OpenAI兼容: model=flux/flux-dev (known model)',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'flux/flux-dev', prompt: 'a white square', n: 1, size: '256x256' },
    },
    // Variant D: flux-schnell
    {
      label: 'OpenAI兼容: model=flux/flux-schnell',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'flux/flux-schnell', prompt: 'a white square', n: 1, size: '256x256' },
    },
    // Variant E: flux as third party model on native endpoint
    {
      label: '原生API: model=flux-pro-v1.1-ultra 不带前缀',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
      body: { model: 'flux-pro-v1.1-ultra', input: { prompt: 'a white square' }, parameters: { size: '256*256', n: 1 } },
    },
  ]);

  // ============================
  // Channel 3: kl-video-v3 (TokenHub 可灵视频)
  // ============================
  await test('3. kl-video-v3 (TokenHub 视频生成)', [
    // Variant A: TokenHub submit API
    {
      label: 'TokenHub: POST /v1/api/video/submit',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'kl-video-v3', prompt: 'a white square rotating slowly', duration: 5 },
    },
    // Variant B: TokenHub submit with different params
    {
      label: 'TokenHub: POST /v1/api/video/submit (simple params)',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model_name: 'kl-video-v3', input: { prompt: 'a white square' }, parameters: { duration: 5 } },
    },
    // Variant C: TokenHub OpenAI-style with correct model prefix
    {
      label: 'TokenHub OpenAI: /v1/video/generations, model=kling/kl-video-v3',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/video/generations',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'kling/kl-video-v3', prompt: 'a white square', n: 1 },
    },
    // Variant D: TokenHub OpenAI-style with different model name
    {
      label: 'TokenHub OpenAI: /v1/video/generations, model=KLING-V3',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/video/generations',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'KLING-V3', prompt: 'a white square', n: 1 },
    },
    // Variant E: TokenHub submit with openapi params
    {
      label: 'TokenHub: /v1/video/submit',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'kl-video-v3', prompt: 'a white square' },
    },
    // Variant F: Try hy-video-1.5 as fallback
    {
      label: 'TokenHub: /v1/video/submit, model=hy-video-1.5',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'hy-video-1.5', prompt: 'a white square', duration: 5 },
    },
  ]);

  // ============================
  // Channel 4: qwen-audio-3.0-tts-plus (百炼TTS)
  // ============================
  await test('4. qwen-audio-3.0-tts-plus (百炼TTS)', [
    // Variant A: Multimodal-generation endpoint for TTS
    {
      label: '原生API: multimodal-generation/generation (TTS)',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
      body: { model: 'qwen-audio-3.0-tts-plus', input: { messages: [{ role: 'user', content: [{ text: '你好世界' }] }] }, parameters: { voice: 'Cherry', format: 'mp3' } },
    },
    // Variant B: OpenAI-compatible audio/speech
    {
      label: 'OpenAI兼容: /compatible-mode/v1/audio/speech',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'qwen-audio-3.0-tts-plus', input: '你好世界', voice: 'Cherry' },
    },
    // Variant C: OpenAI-compatible with qwen-tts model
    {
      label: 'OpenAI兼容: /compatible-mode/v1/audio/speech, model=cosyvoice-v1',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'cosyvoice-v1', input: '你好世界', voice: 'longxiaochun' },
    },
    // Variant D: Native DashScope TTS SpeechSynthesizer
    {
      label: '原生API: /api/v1/services/aigc/tts/speech-synthesizer (DashScope)',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/tts/speech-synthesizer',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
      body: { model: 'qwen-audio-3.0-tts-plus', input: { text: '你好世界' }, parameters: { voice: 'Cherry', format: 'mp3' } },
    },
    // Variant E: Try cosyvoice-v1 on native endpoint
    {
      label: '原生API: tts/speech-synthesizer, model=cosyvoice-v1',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/tts/speech-synthesizer',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}` },
      body: { model: 'cosyvoice-v1', input: { text: '你好世界' }, parameters: { voice: 'longxiaochun', format: 'mp3' } },
    },
    // Variant F: multimodal text-to-speech endpoint
    {
      label: '原生API: /api/v1/services/aigc/text-to-speech/generation (multimodal)',
      method: 'POST',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation',
      headers: { 'Authorization': `Bearer ${ALIBABA_KEY}`, 'X-DashScope-Async': 'enable' },
      body: { model: 'qwen-audio-3.0-tts-plus', input: { text: '你好世界' }, parameters: { format: 'mp3' } },
    },
  ]);

  // ============================
  // Channel 5: yt-video-humanactor (TokenHub 数字人)
  // ============================
  await test('5. yt-video-humanactor (TokenHub 数字人)', [
    // Variant A: TokenHub submit API
    {
      label: 'TokenHub: POST /v1/api/video/submit, model=yt-video-humanactor',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'yt-video-humanactor', prompt: 'hello', duration: 10, voice: 'default' },
    },
    // Variant B: TokenHub submit with different params
    {
      label: 'TokenHub: /v1/api/video/submit (model_name param)',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model_name: 'yt-video-humanactor', input: { text: '你好', audio_url: '' }, parameters: { duration: 10 } },
    },
    // Variant C: TokenHub OpenAI-style
    {
      label: 'TokenHub: /v1/video/generations, model=yt-video-humanactor',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/video/generations',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'yt-video-humanactor', prompt: 'hello', n: 1 },
    },
    // Variant D: Try different endpoint for humanactor
    {
      label: 'TokenHub: /v1/video/submit, model=yt-video-humanactor (minimal)',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'yt-video-humanactor', prompt: 'hello' },
    },
    // Variant E: Try /v1/api/video/submit with full body
    {
      label: 'TokenHub: /v1/api/video/submit, humanactor full params',
      method: 'POST',
      url: 'https://tokenhub.tencentmaas.com/v1/api/video/submit',
      headers: { 'Authorization': `Bearer ${TENCENT_KEY}` },
      body: { model: 'yt-video-humanactor', text: '你好世界', avatar: 'default', background: 'office' },
    },
  ]);

  console.log('\n\n╔══════════════════════════════════════════════════╗');
  console.log('║  诊断完成                                      ║');
  console.log('╚══════════════════════════════════════════════════╝');
}

main().catch(console.error);
