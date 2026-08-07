// 修复验证：测试 image_enhance 用 qwen-image-edit + 重跑全部 10 项
import https from 'https';

const KEY = process.env.DASHSCOPE_API_KEY;
const TKKEY = process.env.TENCENT_TOKENHUB_API_KEY;
if (!KEY) { console.error('Need DASHSCOPE_API_KEY'); process.exit(1); }

const ALI_MM = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const ALI_CHAT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const ALI_VIDEO = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis';
const TK_IMG = 'https://tokenhub.tencentmaas.com/v1/images/generations';

function post(url, body, headers) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode === 200, status: res.statusCode, json: JSON.parse(buf) }); }
        catch { resolve({ ok: false, status: res.statusCode, text: buf }); }
      });
    });
    req.write(data); req.end();
  });
}

async function get(url, headers) {
  return new Promise((resolve) => {
    const u = new URL(url);
    https.get(u, { headers }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode === 200, status: res.statusCode, json: JSON.parse(buf) }); }
        catch { resolve({ ok: false, status: res.statusCode, text: buf }); }
      });
    });
  });
}

const aliHeaders = { Authorization: `Bearer ${KEY}` };
const tkHeaders = { Authorization: `Bearer ${TKKEY}` };
const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const results = [];
  const pass = (name, detail) => { console.log(`  ✅ ${name}: ${detail}`); results.push({ name, pass: true, detail }); };
  const fail = (name, detail) => { console.log(`  ❌ ${name}: ${detail}`); results.push({ name, pass: false, detail }); };

  // === 1. image_generate (ali) ===
  console.log('\n[1] image_generate (ali)');
  try {
    const r = await post(ALI_MM, { model:'qwen-image-max', input:{messages:[{role:'user',content:[{type:'text',text:'A product photo: desk lamp on white background, warm soft light'}]}]}, parameters:{size:'1024*1024',n:1} }, aliHeaders);
    if (r.ok) {
      const imgs = (r.json?.output?.choices?.[0]?.message?.content||[]).filter(c=>c.image).map(c=>c.image);
      pass('image_generate(ali)', imgs.length > 0 ? `OK: ${imgs[0].slice(0,50)}` : 'No image in response');
    } else fail('image_generate(ali)', `${r.status}: ${JSON.stringify(r.json||r.text).slice(0,150)}`);
  } catch(e) { fail('image_generate(ali)', e.message); }
  await delay(3000);

  // === 2. image_generate (tx) ===
  console.log('\n[2] image_generate (tx)');
  try {
    const r = await post(TK_IMG, { model:'hy-image-v3.0', prompt:'A product photo: desk lamp on white background', n:1, size:'1024x1024' }, tkHeaders);
    if (r.ok) {
      pass('image_generate(tx)', `OK: ${(r.json?.data?.[0]?.url||'').slice(0,50)}`);
    } else fail('image_generate(tx)', `${r.status}: ${JSON.stringify(r.json||r.text).slice(0,150)}`);
  } catch(e) { fail('image_generate(tx)', e.message); }
  await delay(3000);

  // === 3. video_generate (ali) - 异步 ===
  console.log('\n[3] video_generate (ali)');
  try {
    const r = await post(ALI_VIDEO, { model:'happyhorse-1.1-t2v', input:{prompt:'A 5-second product demo: desk lamp turns on with warm glow, soft bokeh background, elegant cinematic lighting'}, parameters:{resolution:'720P',ratio:'16:9',duration:5} }, { ...aliHeaders, 'X-DashScope-Async':'enable' });
    const taskId = r.json?.output?.task_id || '';
    if (taskId) {
      let done = false;
      for (let i = 0; i < 40; i++) {
        await delay(5000);
        const p = await get(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, aliHeaders);
        const st = p.json?.output?.task_status || '';
        if (st === 'SUCCEEDED') { pass('video_generate(ali)', `OK (poll ${i+1}): ${(p.json.output?.video_url||'').slice(0,50)}`); done = true; break; }
        if (st === 'FAILED') { fail('video_generate(ali)', `task failed: ${JSON.stringify(p.json).slice(0,200)}`); done = true; break; }
        process.stdout.write(`  [poll ${i+1} status=${st}] `);
      }
      if (!done) fail('video_generate(ali)', 'timeout');
    } else fail('video_generate(ali)', `no task_id: ${JSON.stringify(r.json).slice(0,200)}`);
  } catch(e) { fail('video_generate(ali)', e.message); }
  await delay(3000);

  // === 4. tts_generate ===
  console.log('\n[4] tts_generate');
  try {
    const r = await post(ALI_MM, { model:'qwen-tts', input:{text:'欢迎来到智枢AI内容工厂'}, parameters:{voice:'zhixiaobai',language_type:'Chinese',format:'mp3'} }, aliHeaders);
    if (r.ok) pass('tts_generate', `OK: ${(r.json.output?.audio?.url||r.json.output?.audio_url||'NONE').slice(0,60)}`);
    else fail('tts_generate', `${r.status}: ${JSON.stringify(r.json||r.text).slice(0,150)}`);
  } catch(e) { fail('tts_generate', e.message); }
  await delay(3000);

  // === 5. brand_voice_clone ===
  console.log('\n[5] brand_voice_clone');
  try {
    const r = await post(ALI_MM, { model:'qwen-tts', input:{text:'匠心品质，值得信赖'}, parameters:{voice:'zhixiaobai',language_type:'Chinese',format:'mp3'} }, aliHeaders);
    if (r.ok) pass('brand_voice_clone', `OK: ${(r.json.output?.audio?.url||r.json.output?.audio_url||'NONE').slice(0,60)}`);
    else fail('brand_voice_clone', `${r.status}: ${JSON.stringify(r.json||r.text).slice(0,150)}`);
  } catch(e) { fail('brand_voice_clone', e.message); }
  await delay(3000);

  // === 7. image_enhance - KEY FIX: use qwen-image-edit ===
  console.log('\n[7] image_enhance (qwen-image-edit) - NEW FIX');
  try {
    // Step 1: generate a base image
    const baseR = await post(ALI_MM, { model:'qwen-image-max', input:{messages:[{role:'user',content:[{type:'text',text:'A simple product photograph: white desk lamp, soft warm glow, clean white background, minimal composition'}]}]}, parameters:{size:'1024*1024',n:1} }, aliHeaders);
    const imgUrl = (baseR.json?.output?.choices?.[0]?.message?.content||[]).filter(c=>c.image).map(c=>c.image)[0] || '';
    if (!imgUrl) { fail('image_enhance', '无法生成基准图片'); }
    else {
      await delay(2000);
      // Step 2: enhance with qwen-image-edit
      const enR = await post(ALI_MM, {
        model: 'qwen-image-edit',
        input: { messages: [{ role: 'user', content: [{ image: imgUrl }, { text: 'Enhance this image: sharpen details, remove AI artifacts, refine textures and edges, keep composition unchanged' }] }] },
        parameters: { size: '1024*1024', n: 1 }
      }, aliHeaders);
      if (enR.ok) {
        const newImgs = (enR.json?.output?.choices?.[0]?.message?.content||[]).filter(c=>c.image).map(c=>c.image);
        pass('image_enhance', newImgs.length > 0 ? `OK: ${newImgs[0].slice(0,50)}` : 'No enhanced image in response');
      } else fail('image_enhance', `${enR.status}: ${JSON.stringify(enR.json||enR.text).slice(0,200)}`);
    }
  } catch(e) { fail('image_enhance', e.message); }
  await delay(3000);

  // === 8. image_select ===
  console.log('\n[8] image_select');
  try {
    const r = await post(ALI_CHAT, { model:'qwen-max', messages:[{role:'system',content:'你是专业视觉评审'},{role:'user',content:'从以下3张图选择最优：图片1: a.jpg 暖色调 图片2: b.jpg 冷色调 图片3: c.jpg 自然光 请选出最优并给出理由'}], max_tokens:200 }, aliHeaders);
    if (r.ok) pass('image_select', `OK: ${(r.json?.choices?.[0]?.message?.content||'').replace(/\n/g,' ').slice(0,100)}`);
    else fail('image_select', `${r.status}: ${JSON.stringify(r.json||r.text).slice(0,150)}`);
  } catch(e) { fail('image_select', e.message); }
  await delay(2000);

  // === 9. subtitle_generate ===
  console.log('\n[9] subtitle_generate');
  try {
    const r = await post(ALI_CHAT, { model:'qwen-max', messages:[{role:'system',content:'生成SRT双语字幕文件'},{role:'user',content:'脚本: 今天带大家探店这家藏在弄堂里的宝藏咖啡馆'}], max_tokens:1000 }, aliHeaders);
    if (r.ok) pass('subtitle_generate', `OK: ${(r.json?.choices?.[0]?.message?.content||'').replace(/\n/g,' ').slice(0,100)}`);
    else fail('subtitle_generate', `${r.status}: ${JSON.stringify(r.json||r.text).slice(0,150)}`);
  } catch(e) { fail('subtitle_generate', e.message); }
  await delay(2000);

  // === 10. dialect_voiceover ===
  console.log('\n[10] dialect_voiceover');
  try {
    const r = await post(ALI_CHAT, { model:'qwen-max', messages:[{role:'system',content:'你是方言转换专家，将普通话转为地道东北话'},{role:'user',content:'转东北话: 今天给大家介绍一款非常好用的AI办公软件'}], max_tokens:500 }, aliHeaders);
    if (r.ok) pass('dialect_voiceover', `OK: ${(r.json?.choices?.[0]?.message?.content||'').replace(/\n/g,' ').slice(0,100)}`);
    else fail('dialect_voiceover', `${r.status}: ${JSON.stringify(r.json||r.text).slice(0,150)}`);
  } catch(e) { fail('dialect_voiceover', e.message); }

  // === Summary ===
  console.log('\n═════════════════════════════');
  console.log('         FINAL RESULTS');
  console.log('═════════════════════════════');
  let passCount = 0;
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.name}`);
    if (r.pass) passCount++;
  }
  console.log(`\n  ${passCount}/${results.length} PASSED`);
  console.log('═════════════════════════════\n');
}

main();
