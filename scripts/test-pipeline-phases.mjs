/**
 * 管线功能测试脚本 v2 — 使用正确的 API 端点逐一验证
 * 用法: node /tmp/test-pipeline-phases.mjs
 * 需要环境变量: DASHSCOPE_API_KEY, TENCENT_TOKENHUB_API_KEY
 */

const ALI_BASE = 'https://dashscope.aliyuncs.com';
const ALI_CHAT = `${ALI_BASE}/compatible-mode/v1/chat/completions`;
const ALI_MM = `${ALI_BASE}/api/v1/services/aigc/multimodal-generation/generation`;
// ★ 修复: 视频合成端点路径（非 generation 而是 video-synthesis）
const ALI_VIDEO = `${ALI_BASE}/api/v1/services/aigc/video-generation/video-synthesis`;
const TX_BASE = 'https://tokenhub.tencentmaas.com';
const TX_IMAGE = `${TX_BASE}/v1/images/generations`;
const TX_CHAT = `${TX_BASE}/v1/chat/completions`;
const TX_VIDEO = `${TX_BASE}/v1/api/video/submit`;

const RESULTS = [];
const TIMEOUT = 90000;

function ok(name, detail) { RESULTS.push({ name, status: 'PASS', detail }); console.log(`  √ ${name}: ${detail}`); }
function fail(name, detail) { RESULTS.push({ name, status: 'FAIL', detail }); console.log(`  ✗ ${name}: ${detail}`); }
function skip(name, detail) { RESULTS.push({ name, status: 'SKIP', detail }); console.log(`  - ${name}: ${detail}`); }

async function fetchJson(url, opts = {}) {
  const resp = await fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT) });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text.slice(0, 300) }; }
  return { status: resp.status, ok: resp.ok, url, json, text: text.slice(0, 500) };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Test 1: image_generate (Alibaba qwen-image-max) ───────
async function test1(aliKey) {
  console.log('\n═══ [1/10] image_generate (Alibaba: qwen-image-max) ═══');
  if (!aliKey) return skip('image_generate:ali', 'No DASHSCOPE_API_KEY');
  try {
    const r = await fetchJson(ALI_MM, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-image-max',
        input: { messages: [{ role: 'user', content: [{ type: 'text', text: '一只可爱的橘猫坐在窗台上晒太阳，温暖的午后光线，4K高清摄影' }] }] },
        parameters: { size: '1024*1024', n: 1 },
      }),
    });
    if (!r.ok) return fail('image_generate:ali', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    const contents = r.json.output?.choices?.[0]?.message?.content || [];
    const urls = contents.filter(c => c.image).map(c => c.image);
    if (urls.length > 0) return ok('image_generate:ali', `图片: ${urls[0].slice(0, 80)}...`);
    const fbUrls = (r.json.output?.results || []).map(r2 => r2.url);
    if (fbUrls.length > 0) return ok('image_generate:ali', `图片(fb): ${fbUrls[0].slice(0, 80)}...`);
    return fail('image_generate:ali', `200但无图片URL: ${JSON.stringify(r.json).slice(0, 300)}`);
  } catch (e) { return fail('image_generate:ali', e.message); }
}

// ─── Test 2: image_generate (Tencent hy-image-v3.0) ───────
async function test2(txKey) {
  console.log('\n═══ [2/10] image_generate (Tencent: hy-image-v3.0) ═══');
  if (!txKey) return skip('image_generate:tx', 'No TENCENT_TOKENHUB_API_KEY');
  try {
    const r = await fetchJson(TX_IMAGE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${txKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'hy-image-v3.0', prompt: '一只可爱的橘猫坐在窗台上晒太阳，温暖的午后光线', n: 1, size: '1024x1024' }),
    });
    if (!r.ok) return fail('image_generate:tx', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    const urls = (r.json.data || []).map(d => d.url);
    if (urls.length > 0) return ok('image_generate:tx', `图片: ${urls[0].slice(0, 80)}...`);
    return fail('image_generate:tx', `200但无图片URL: ${JSON.stringify(r.json).slice(0, 300)}`);
  } catch (e) { return fail('image_generate:tx', e.message); }
}

// ─── Test 3: video_generate (Alibaba happyhorse-1.1-t2v, async) ───────
async function test3(aliKey) {
  console.log('\n═══ [3/10] video_generate (Alibaba: happyhorse-1.1-t2v) ═══');
  if (!aliKey) return skip('video_generate:ali', 'No DASHSCOPE_API_KEY');
  try {
    // ★ 关键修复: 必须用 video-synthesis 端点 + X-DashScope-Async 头
    const r = await fetchJson(ALI_VIDEO, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aliKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'happyhorse-1.1-t2v',
        input: { prompt: '一只猫在海边散步，夕阳西下，电影质感' },
        parameters: { resolution: '720P', ratio: '16:9', duration: 5 },
      }),
    });
    if (!r.ok) return fail('video_generate:ali', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    
    const taskId = r.json.output?.task_id || r.json.request_id || '';
    const videoUrl = r.json.output?.video_url || '';
    
    if (videoUrl) return ok('video_generate:ali', `同步返回: ${videoUrl.slice(0, 80)}`);
    if (!taskId) return fail('video_generate:ali', `200但无task_id: ${JSON.stringify(r.json).slice(0, 300)}`);
    
    // 轮询任务（最多等2分钟）
    console.log(`      任务已提交: ${taskId}, 轮询中...`);
    const pollUrl = `${ALI_BASE}/api/v1/tasks/${taskId}`;
    for (let i = 0; i < 24; i++) {
      await sleep(5000);
      const poll = await fetchJson(pollUrl, { headers: { Authorization: `Bearer ${aliKey}` } });
      const status = poll.json.output?.task_status || poll.json.status || '';
      console.log(`      轮询 ${i+1}/24: status=${status}`);
      if (['SUCCEEDED', 'succeeded', 'completed', 'success'].includes(status)) {
        const url = poll.json.output?.video_url || poll.json.output?.results?.[0]?.url || '';
        if (url) return ok('video_generate:ali', `视频(轮询): ${url.slice(0, 80)}`);
        return fail('video_generate:ali', `任务成功但无video_url`);
      }
      if (['FAILED', 'failed', 'error'].includes(status)) {
        return fail('video_generate:ali', `任务失败: ${JSON.stringify(poll.json).slice(0, 300)}`);
      }
    }
    return fail('video_generate:ali', '轮询超时(2分钟)');
  } catch (e) { return fail('video_generate:ali', e.message); }
}

// ─── Test 4: tts_generate (Alibaba qwen-tts) ───────
async function test4(aliKey) {
  console.log('\n═══ [4/10] tts_generate (Alibaba: qwen-tts) ═══');
  if (!aliKey) return skip('tts_generate', 'No DASHSCOPE_API_KEY');
  try {
    const r = await fetchJson(ALI_MM, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-tts',
        input: { text: '你好，欢迎使用智枢AI内容工厂，这是一个语音合成测试' },
        parameters: { voice: 'zhixiaobai', language_type: 'Chinese', format: 'mp3' },
      }),
    });
    if (!r.ok) return fail('tts_generate', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    const audioUrl = r.json.output?.audio?.url || r.json.output?.audio_url || r.json.output?.url || '';
    if (audioUrl) return ok('tts_generate', `音频: ${audioUrl.slice(0, 80)}`);
    return fail('tts_generate', `200但无音频URL: ${JSON.stringify(r.json).slice(0, 300)}`);
  } catch (e) { return fail('tts_generate', e.message); }
}

// ─── Test 5: bgm_generate (Alibaba fun-music-v1) ───────
async function test5(aliKey) {
  console.log('\n═══ [5/10] bgm_generate (Alibaba: fun-music-v1) ═══');
  if (!aliKey) return skip('bgm_generate', 'No DASHSCOPE_API_KEY');
  // fun-music-v1 可能用独立的 audio 端点而非 multimodal-generation
  // 先试 multimodal-generation, 失败则尝试其他
  const endpoints = [
    { url: ALI_MM, name: 'multimodal-generation', body: { model: 'fun-music-v1', input: { messages: [{ role: 'user', content: [{ type: 'text', text: 'Calm peaceful background music, 30 seconds, nature vibe' }] }] }, parameters: {} } },
    { url: ALI_MM, name: 'multimodal(text)', body: { model: 'fun-music-v1', input: { text: 'Generate calm peaceful background music 30 seconds' }, parameters: { duration: 30 } } },
  ];
  
  for (const ep of endpoints) {
    try {
      const r = await fetchJson(ep.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body),
      });
      if (r.ok) {
        const audioUrl = r.json.output?.audio?.url || r.json.output?.audio_url || r.json.output?.url || '';
        if (audioUrl) return ok('bgm_generate', `[${ep.name}] BGM: ${audioUrl.slice(0, 80)}`);
        console.log(`      [${ep.name}] 200但无音频: ${JSON.stringify(r.json).slice(0, 200)}`);
        continue;
      }
      console.log(`      [${ep.name}] HTTP ${r.status}: ${r.text.slice(0, 150)}`);
    } catch { continue; }
  }
  // fun-music 可能根本不存在或未开通，降级报告
  return fail('bgm_generate', 'fun-music-v1 不可用 (403/权限不足或模型不存在)，需后台确认是否开通');
}

// ─── Test 6: brand_voice_clone (Alibaba qwen-tts with emotion) ───────
async function test6(aliKey) {
  console.log('\n═══ [6/10] brand_voice_clone (Alibaba: qwen-tts 带情感) ═══');
  if (!aliKey) return skip('brand_voice_clone', 'No DASHSCOPE_API_KEY');
  try {
    const r = await fetchJson(ALI_MM, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-tts',
        input: { text: '这个产品太棒了！限时优惠不要错过，赶紧下单吧！' },
        parameters: { voice: 'zhixiaobai', language_type: 'Chinese', format: 'mp3', emotion: 'excited' },
      }),
    });
    if (!r.ok) return fail('brand_voice_clone', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    const audioUrl = r.json.output?.audio?.url || r.json.output?.audio_url || r.json.output?.url || '';
    if (audioUrl) return ok('brand_voice_clone', `配音: ${audioUrl.slice(0, 80)}`);
    return fail('brand_voice_clone', `200但无音频URL: ${JSON.stringify(r.json).slice(0, 300)}`);
  } catch (e) { return fail('brand_voice_clone', e.message); }
}

// ─── Test 7: image_enhance (Alibaba multimodal refiner) ───────
async function test7(aliKey) {
  console.log('\n═══ [7/10] image_enhance (Alibaba: multimodal refiner) ═══');
  if (!aliKey) return skip('image_enhance', 'No DASHSCOPE_API_KEY');

  // 先出图
  let imgUrl = '';
  try {
    const r1 = await fetchJson(ALI_MM, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-image-max',
        input: { messages: [{ role: 'user', content: [{ type: 'text', text: '一张简洁的产品展示图，白色背景，一盏台灯柔和照亮桌面' }] }] },
        parameters: { size: '1024*1024', n: 1 },
      }),
    });
    if (r1.ok) {
      const contents = r1.json.output?.choices?.[0]?.message?.content || [];
      imgUrl = contents.filter(c => c.image).map(c => c.image)[0] || '';
      if (!imgUrl) imgUrl = (r1.json.output?.results || []).map(r => r.url)[0] || '';
    }
    if (!imgUrl) return fail('image_enhance', '先生成源图片失败');
    console.log(`      源图片: ${imgUrl.slice(0, 80)}`);
  } catch (e) { return fail('image_enhance', `源图片: ${e.message}`); }

  // ★ 修复: 尺寸改为 1664*1664（最大范围）
  try {
    const r2 = await fetchJson(ALI_MM, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-image-max',
        input: {
          messages: [{
            role: 'user',
            content: [
              { image: imgUrl },
              { text: 'Enhance this image: sharpen details, remove AI artifacts and distortion, refine textures and edges, keep composition and subject unchanged.' },
            ],
          }],
        },
        parameters: { size: '1664*1664', n: 1 },
      }),
    });
    if (!r2.ok) return fail('image_enhance', `refiner HTTP ${r2.status}: ${r2.text.slice(0, 200)}`);
    const contents = r2.json.output?.choices?.[0]?.message?.content || [];
    const newUrls = contents.filter(c => c.image).map(c => c.image);
    if (newUrls.length > 0) return ok('image_enhance', `增强: ${newUrls[0].slice(0, 80)}`);
    const fbUrls = (r2.json.output?.results || []).map(r => r.url);
    if (fbUrls.length > 0) return ok('image_enhance', `增强(fb): ${fbUrls[0].slice(0, 80)}`);
    return fail('image_enhance', `refiner无输出: ${JSON.stringify(r2.json).slice(0, 300)}`);
  } catch (e) { return fail('image_enhance', e.message); }
}

// ─── Test 8: image_select (LLM review) ───────
async function test8(aliKey) {
  console.log('\n═══ [8/10] image_select (LLM: 图片评审择优) ═══');
  if (!aliKey) return skip('image_select', 'No DASHSCOPE_API_KEY');
  try {
    const r = await fetchJson(ALI_CHAT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          { role: 'system', content: '你是专业视觉评审，请从多张图片中挑选质量最优的一张。只输出编号和简短理由。' },
          { role: 'user', content: '从以下 3 张图片中挑选最优的一张：\n图片1: https://example.com/img1.jpg\n图片2: https://example.com/img2.jpg\n图片3: https://example.com/img3.jpg\n\n内容主题: 产品展示照片' },
        ],
        temperature: 0.2, max_tokens: 500,
      }),
    });
    if (!r.ok) return fail('image_select', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    const content = r.json.choices?.[0]?.message?.content || '';
    if (content.includes('图片')) return ok('image_select', `评审: ${content.replace(/\n/g,' ').slice(0, 80)}`);
    return fail('image_select', `无预期格式: ${content.slice(0, 100)}`);
  } catch (e) { return fail('image_select', e.message); }
}

// ─── Test 9: subtitle_generate (LLM SRT 字幕) ───────
async function test9(aliKey) {
  console.log('\n═══ [9/10] subtitle_generate (LLM: 中英双语SRT) ═══');
  if (!aliKey) return skip('subtitle_generate', 'No DASHSCOPE_API_KEY');
  try {
    const r = await fetchJson(ALI_CHAT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          { role: 'system', content: '你是专业视频字幕制作专家。请从以下脚本中提取对白和旁白，生成标准SRT格式的中英双语字幕。输出严格遵循SRT格式。' },
          { role: 'user', content: '请为以下视频脚本生成中英双语SRT字幕：\n\n风格: 探店Vlog\n\n脚本:\n哈喽大家好，今天带大家来打卡这家藏在巷子里的宝藏小店。进门就被这个氛围吸引住了，太有感觉了！老板是个超有意思的人，给我们讲了好多开店的故事。他们家的招牌菜就是这个，我跟你说绝了，一口下去满满的幸福感。' },
        ],
        temperature: 0.3, max_tokens: 8192,
      }),
    });
    if (!r.ok) return fail('subtitle_generate', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    const content = r.json.choices?.[0]?.message?.content || '';
    if (content.includes('-->')) return ok('subtitle_generate', `SRT(${content.length}字): ${content.slice(0, 80).replace(/\n/g,' ')}`);
    return fail('subtitle_generate', `不含时间戳: ${content.slice(0, 150)}`);
  } catch (e) { return fail('subtitle_generate', e.message); }
}

// ─── Test 10: dialect_voiceover (LLM 方言转换) ───────
async function test10(aliKey) {
  console.log('\n═══ [10/10] dialect_voiceover (LLM: 方言转换) ═══');
  if (!aliKey) return skip('dialect_voiceover', 'No DASHSCOPE_API_KEY');
  try {
    const r = await fetchJson(ALI_CHAT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          { role: 'system', content: '你是方言转换专家，擅长将普通话转为指定方言口语。' },
          { role: 'user', content: '将以下内容转为东北话。加入东北味儿词（"整"、"瞅"、"嘎哈"、"老鼻子"、"咋地"），语气自然豪爽，适合TTS配音。\n\n原文:\n大家好，今天给大家介绍一款非常好用的产品。这个产品功能强大，使用简单，价格实惠。我用了之后感觉特别好，真心推荐给大家！' },
        ],
        temperature: 0.7, max_tokens: 4096,
      }),
    });
    if (!r.ok) return fail('dialect_voiceover', `HTTP ${r.status}: ${r.text.slice(0, 200)}`);
    const content = r.json.choices?.[0]?.message?.content || '';
    if (content.length > 20) {
      const hasDialect = /整|瞅|嘎哈|咋地|老鼻子|贼/.test(content);
      return ok('dialect_voiceover', `${hasDialect ? '含方言词' : '已转换'}(${content.length}字): ${content.slice(0, 80)}`);
    }
    return fail('dialect_voiceover', `输出过短: ${content}`);
  } catch (e) { return fail('dialect_voiceover', e.message); }
}

// ─── main ────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  智枢AI 内容工厂 — 管线功能测试 v2');
  console.log(`  时间: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  const aliKey = process.env.DASHSCOPE_API_KEY || '';
  const txKey = process.env.TENCENT_TOKENHUB_API_KEY || '';

  console.log(`\nAPI Keys: Alibaba=${aliKey ? 'OK' : 'MISSING'}, Tencent=${txKey ? 'OK' : 'MISSING'}`);
  if (!aliKey && !txKey) { console.log('FATAL: 无可用 API Key'); process.exit(1); }

  // 顺序执行（间隔2秒避免限流）
  await test1(aliKey); await sleep(2000);
  await test2(txKey);  await sleep(2000);
  await test3(aliKey); await sleep(2000);
  await test4(aliKey); await sleep(2000);
  await test5(aliKey); await sleep(2000);
  await test6(aliKey); await sleep(2000);
  await test7(aliKey); await sleep(2000);
  await test8(aliKey); await sleep(2000);
  await test9(aliKey); await sleep(2000);
  await test10(aliKey);

  // ─── Summary ─────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('  测试汇总');
  console.log('═══════════════════════════════════════════');
  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const failCount = RESULTS.filter(r => r.status === 'FAIL').length;
  const skipCount = RESULTS.filter(r => r.status === 'SKIP').length;
  console.log(`  PASS: ${pass} | FAIL: ${failCount} | SKIP: ${skipCount} | TOTAL: ${RESULTS.length}`);
  RESULTS.forEach(r => {
    const icon = r.status === 'PASS' ? '√' : r.status === 'FAIL' ? '✗' : '-';
    console.log(`  ${icon} ${r.name}: ${r.detail}`);
  });
  console.log('═══════════════════════════════════════════\n');
  process.exit(failCount > 0 ? 1 : 0);
}

main();
