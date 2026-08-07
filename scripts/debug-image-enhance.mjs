// 调试 image_enhance - 测试不同 content 格式
import https from 'https';

const key = process.env.DASHSCOPE_API_KEY;
if (!key) { console.error('Need DASHSCOPE_API_KEY'); process.exit(1); }

const MM = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

function post(url, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, text: buf }); }
      });
    });
    req.write(data); req.end();
  });
}

async function main() {
  // Step 1: generate a base image
  console.log('Generating base image...');
  const r1 = await post(MM, {
    model: 'qwen-image-max',
    input: { messages: [{ role: 'user', content: [{ type: 'text', text: 'A plain white background product photo, a desk lamp emitting warm soft glow' }] }] },
    parameters: { size: '1024*1024', n: 1 }
  });
  let imgUrl = '';
  if (r1.json?.output?.choices?.[0]?.message?.content) {
    imgUrl = r1.json.output.choices[0].message.content.filter(c => c.image).map(c => c.image)[0] || '';
  }
  if (!imgUrl) { console.log('Failed to get base image:', JSON.stringify(r1.json).slice(0, 300)); return; }
  console.log('Base image:', imgUrl.slice(0, 80));

  // Try different formats for refiner
  const formats = [
    {
      name: 'format1: simple {image, text}',
      content: [{ image: imgUrl }, { text: 'Enhance: sharpen, refine details' }]
    },
    {
      name: 'format2: with type="image" prefix',
      content: [{ image: imgUrl, type: 'image' }, { text: 'Enhance: sharpen, refine details', type: 'text' }]
    },
    {
      name: 'format3: qwen-vl image_url style',
      content: [{ type: 'image_url', image_url: { url: imgUrl } }, { type: 'text', text: 'Enhance: sharpen, refine details' }]
    },
    {
      name: 'format4: text-only prompt from original image',
      // skip image url, use text to describe enhancement
      inputOverride: { messages: [{ role: 'user', content: 'Describe how to enhance this image: sharpen details, remove AI artifacts, refine textures and edges' }] }
    },
    {
      name: 'format5: image in separate field, not in messages',
      inputOverride: { messages: [{ role: 'user', content: [{ type: 'text', text: 'Enhance this image reference: sharpen details, refine textures and edges' }] }], ref_image: imgUrl }
    }
  ];

  for (const fmt of formats) {
    console.log(`\n--- ${fmt.name} ---`);
    try {
      const body = {
        model: 'qwen-image-max',
        input: fmt.inputOverride || { messages: [{ role: 'user', content: fmt.content }] },
        parameters: { size: '1024*1024', n: 1 }
      };
      const r = await post(MM, body);
      if (r.status === 200) {
        const contents = r.json?.output?.choices?.[0]?.message?.content || [];
        const newImg = contents.filter(c => c.image).map(c => c.image)[0] || '';
        console.log(`  OK: ${newImg ? 'Got new image: ' + newImg.slice(0, 80) : 'No image in response: ' + JSON.stringify(r.json).slice(0, 200)}`);
      } else {
        console.log(`  FAIL (${r.status}): ${JSON.stringify(r.json || r.text).slice(0, 250)}`);
      }
    } catch(e) { console.log(`  ERROR: ${e.message}`); }
  }
}

main();
