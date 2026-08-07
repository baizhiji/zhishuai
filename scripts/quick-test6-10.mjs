// Quick test for pipeline phases 6-10
const ALI_CHAT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const ALI_MM = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const key = process.env.DASHSCOPE_API_KEY;
const headers = { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };

async function go() {
  // Test 6: brand_voice (no emotion param - emotion is not supported by qwen-tts)
  console.log('\n=== T6: brand_voice_clone (qwen-tts, no emotion) ===');
  let r = await fetch(ALI_MM,{method:'POST',headers,body:JSON.stringify({model:'qwen-tts',input:{text:'产品太棒了！限时优惠不要错过，赶紧下单吧！'},parameters:{voice:'zhixiaobai',language_type:'Chinese',format:'mp3'}})});
  let j = await r.json();
  let au = j.output?.audio?.url || j.output?.audio_url || '';
  console.log('status:' + r.status, 'audio_url:' + au.slice(0,100));
  if (au) console.log('[PASS] T6'); else console.log('[FAIL] T6');

  // Test 7: image_enhance (size 1664*1664)
  console.log('\n=== T7: image_enhance ===');
  r = await fetch(ALI_MM,{method:'POST',headers,body:JSON.stringify({model:'qwen-image-max',input:{messages:[{role:'user',content:[{type:'text',text:'simple product display, lamp on desk'}]}]},parameters:{size:'1024*1024',n:1}})});
  j = await r.json();
  let img = (j.output?.choices?.[0]?.message?.content||[]).filter(c=>c.image).map(c=>c.image)[0] || (j.output?.results||[]).map(r=>r.url)[0] || '';
  console.log('source image:', img.slice(0,100));
  if (img) {
    r = await fetch(ALI_MM,{method:'POST',headers,body:JSON.stringify({model:'qwen-image-max',input:{messages:[{role:'user',content:[{image:img},{text:'Enhance: sharpen details, refine textures and edges, keep composition unchanged.'}]}]},parameters:{size:'1664*1664',n:1}})});
    j = await r.json();
    let enhanced = (j.output?.choices?.[0]?.message?.content||[]).filter(c=>c.image).map(c=>c.image)[0] || '';
    console.log('enhanced:', enhanced.slice(0,100));
    if (enhanced) console.log('[PASS] T7'); else { console.log('[FAIL] T7 - no enhanced url'); console.log('raw:', JSON.stringify(j).slice(0,500)); }
  } else { 
    console.log('[FAIL] T7 - no source image');
    console.log('raw source resp:', JSON.stringify(j).slice(0,500)); 
  }

  // Test 8: image_select
  console.log('\n=== T8: image_select ===');
  r = await fetch(ALI_CHAT,{method:'POST',headers,body:JSON.stringify({model:'qwen-max',messages:[{role:'system',content:'你是专业视觉评审'},{role:'user',content:'从3张图片挑选最优: 图片1: https://a.com/1.jpg 图片2: https://b.com/2.jpg 图片3: https://c.com/3.jpg'}],max_tokens:200})});
  j = await r.json();
  let content = j.choices?.[0]?.message?.content || '';
  console.log('select:', content.replace(/\n/g,' ').slice(0,120));
  if (content.includes('图')) console.log('[PASS] T8'); else console.log('[FAIL] T8');

  // Test 9: subtitle
  console.log('\n=== T9: subtitle_generate ===');
  r = await fetch(ALI_CHAT,{method:'POST',headers,body:JSON.stringify({model:'qwen-max',messages:[{role:'system',content:'你是专业视频字幕制作专家，请生成标准SRT格式中英双语字幕'},{role:'user',content:'脚本: 哈喽大家好，今天带大家来探店。进门就被氛围吸引住了，太有感觉了！'}],max_tokens:2000})});
  j = await r.json();
  content = j.choices?.[0]?.message?.content || '';
  console.log('subtitle:', content.replace(/\n/g,'\\n').slice(0,200));
  if (content.includes('-->')) console.log('[PASS] T9'); else console.log('[FAIL] T9');

  // Test 10: dialect
  console.log('\n=== T10: dialect_voiceover ===');
  r = await fetch(ALI_CHAT,{method:'POST',headers,body:JSON.stringify({model:'qwen-max',messages:[{role:'system',content:'你是方言转换专家'},{role:'user',content:'转为东北话: 今天给大家介绍一款产品，功能强大，使用简单，价格实惠。'}],max_tokens:500})});
  j = await r.json();
  content = j.choices?.[0]?.message?.content || '';
  let hasDialect = /整|瞅|嘎哈|咋地|贼|老鼻子/.test(content);
  console.log('dialect:', content.replace(/\n/g,'\\n').slice(0,120), '| has_dialect:', hasDialect);
  if (content.length > 10) console.log('[PASS] T10'); else console.log('[FAIL] T10');
}
go();
