// ============================================================
// 反AI味提示词库 — 让所有AI产出达到真人水准
// 五层质量保障体系：提示词工程 + 输入预处理 + 后处理 + 质量审核 + 内容安全
// ============================================================

// ─── 第一层：文字类反AI味提示词 ────────────────────────

/**
 * 文字生成的反AI味系统提示词
 * 让AI以真实人类的写作方式生成内容，避免机械感
 */
export const HUMAN_TEXT_SYSTEM_PROMPT = `你是一个在社交媒体、电商和内容创作领域有5年以上实战经验的真人创作者。你的文字必须写出真人创作者的感觉，绝对不能让人看出是AI写的。

核心写作原则：
1. 用口语化、自然的表达方式，像你平时发朋友圈、写小红书一样
2. 断句不规律——有时候句子很短。有时候会拉长一点。节奏感很重要。
3. 适当使用"说实话""其实""就是""真的""超级""巨"这样的口语词
4. 偶尔会用"突然发现""没想到""谁懂啊""笑死"这样的真实表达
5. 不要用"首先/其次/最后""综上所述""总而言之""值得注意的是"这种AI标志性词汇
6. 不要写八股文式的对称排比，不要刻意追求对仗
7. 语气要有起伏，有时候兴奋有时候平淡，像真人的情绪波动
8. 可以偶尔加入个人感受、吐槽或小情绪，增加真实感
9. 数字和具体细节会让内容更有可信度
10. 段落长度随机——有些段落只有1句话，有些2-3句，不要每段都差不多长

禁止出现的AI味词汇：
"首先...其次...最后...""综上所述""总而言之""值得注意的是""不可否认""毋庸置疑""显而易见""众所周知""在当今社会""随着...的发展""越来越..."

请用朋友聊天般的自然语气完成创作。`;

/**
 * 电商文案的反AI味提示词增强
 */
export const ECOMMERCE_HUMAN_PROMPT = `你是一个真实的电商运营，每天要写几十条商品文案。你的文案：
- 会直接说卖点，不绕弯子
- 偶尔用感叹号和emoji，但不会每句都用
- 会像跟朋友安利一样推荐产品
- 会用"这个真的巨好用""我的妈呀太好看了"这样的真实语气
- 不会写"高品质""优选""匠心"这种淘宝详情页的套话
- 卖点穿插使用感受和个人体验`;

/**
 * 小红书文案的反AI味提示词增强
 */
export const XIAOHONGSHU_HUMAN_PROMPT = `你是一个真实的小红书博主，有几万粉丝但不是什么大V。你的笔记风格：
- 像在跟闺蜜分享，不是在做报告
- 标题要有吸引力但不像营销号那么夸张
- 会用"姐妹们""宝子们"开头但不每篇都用
- 文案里有真实的生活细节（"昨天逛街的时候""今天早上试了一下"）
- 配图描述具体、有画面感
- 偶尔会有自嘲或者翻车分享，增加真实度
- 排版随意——不会每篇都对齐得整整齐齐`;

// ─── 第二层：图片类反AI味提示词 ────────────────────────

/**
 * 真实感图片正向提示词增强
 * 自动追加到所有图片生成的prompt末尾
 */
export const REALISM_IMAGE_POSITIVE = `
photorealistic, hyperrealistic, natural skin texture with visible pores and fine lines,
subtle skin imperfections, natural asymmetrical face, realistic lighting, 
shot on professional DSLR, 50mm lens, natural depth of field, 
candid photography style, soft shadows, natural color grading,
real-world environment, ambient occlusion, subsurface scattering on skin`;

/**
 * 真实感图片负向提示词
 * 移除AI生成图片的典型特征
 */
export const REALISM_IMAGE_NEGATIVE = `
plastic skin, wax face, airbrushed look, perfect symmetry,
uncanny valley, CGI render, 3D render, cartoon, anime,
oversaturated colors, HDR effect, unnatural lighting,
smooth texture, doll-like, mannequin, artificial,
watermark, text, signature, low quality, blurry,
deformed hands, deformed fingers, extra fingers, fused fingers,
bad anatomy, disfigured, mutation`;

/**
 * 人物照片真实感增强（数字人/真人MV用）
 */
export const PORTRAIT_REALISM_POSITIVE = `
professional portrait photography, editorial style,
natural expression, candid moment, real person,
visible skin texture, natural wrinkles around eyes when smiling,
uneven skin tone (natural), slight asymmetry in face,
real hair texture with flyaways, natural makeup or no makeup,
indoor natural window light, 85mm portrait lens, f/2.8,
shallow depth of field, bokeh background`;

/**
 * 产品图真实感增强
 */
export const PRODUCT_REALISM_POSITIVE = `
product photography, commercial photography,
real product texture and material detail,
natural studio lighting, softbox, rim light,
subtle shadows on surface, realistic reflections,
shot on product photography table, macro detail,
no fake reflections, real environment context`;

/**
 * 场景/环境真实感增强
 */
export const SCENE_REALISM_POSITIVE = `
real location, candid shot, street photography style,
natural ambient light, overcast sky or golden hour,
real people in background (blurred), urban environment,
shot on iPhone 15 Pro, no filter, realistic colors,
photorealistic, 8K, highly detailed, sharp focus`;

// ─── 第三层：视频类反AI味提示词 ────────────────────────

/**
 * 视频真实感prompt构建器
 */
export function buildVideoRealismPrompt(
  videoType: 'portrait' | 'product' | 'scene' | 'digital-human' | 'mv' | 'enterprise'
): string {
  const base = `cinematic video, real footage, shot on Arri Alexa, 
natural camera movement, slight handheld micro-shake, 
realistic color grading like professional colorist,
natural motion blur, 24fps film look, real physics,
consistent lighting throughout, no morphing artifacts,
no AI warping, stable face structure, natural body movement`;

  const specifics: Record<string, string> = {
    portrait: `person talking naturally, slight head movements, 
natural eye blinking (random intervals, not rhythmic),
micro-expressions, natural hand gestures,
real person speaking, visible pores on close-up`,
    product: `product rotating on turntable, real material reflections,
natural depth of field shift, macro close-up details,
real fabric/metal/glass texture visible`,
    scene: `real location walkthrough, natural camera pan,
ambient sound environment, real people walking in background,
natural lighting changes when passing windows/doors`,
    'digital-human': `photorealistic digital human, indistinguishable from real person,
natural micro-expressions, realistic eye movement and blinking,
realistic lip sync with audio, slight head tilt and shoulder movement,
skin texture with pores, no uncanny valley effect,
natural lighting on face, subtle shadows from nose and chin,
random blink timing (2-4 seconds apart, not metronomic)`,
    mv: `real person singing, natural performance,
genuine emotion, live performance feel,
natural lip sync with music, real vocal expression,
cinematic music video style, artistic but authentic`,
    enterprise: `professional corporate video, real office environment,
natural office lighting (fluorescent + window light mix),
real employees in background (not staged),
documentary style footage, authentic workplace atmosphere`,
  };

  return `${base}, ${specifics[videoType] || ''}`;
}

// ─── 第四层：音频类反AI味处理 ────────────────────────

/**
 * TTS/配音反AI味参数建议
 */
export const TTS_NATURAL_PARAMS = {
  // 语速随机微调（真人说话语速不恒定）
  speedVariation: '0.05',   // ±5% 的语速波动
  // 音高随机微调（避免机器感）
  pitchVariation: '0.03',
  // 停顿自然化
  naturalPause: true,
  // 呼吸声模拟
  breathSimulation: true,
  // 适当的冗余词和语气词
  fillerWords: ['嗯', '就是', '那个', '然后', '其实', '反正'],
};

/**
 * 音频后处理参数
 */
export const AUDIO_POST_PROCESSING = {
  // 动态压缩器参数（模拟真实录音设备）
  compressor: {
    threshold: -18,
    ratio: 3,
    attack: 5,
    release: 40,
  },
  // 轻微混响（模拟真实环境声）
  reverb: {
    roomSize: 0.15,
    damping: 0.3,
    wet: 0.1,
  },
  // 模拟真实麦克风的频响曲线
  eq: {
    lowShelf: { freq: 200, gain: -1.5 },
    highShelf: { freq: 8000, gain: -2 },
  },
};

// ─── 第五层：质量审核标准 ────────────────────────────

/**
 * 内容质量关卡定义
 */
export const QUALITY_GATES = {
  // 文本质检
  text: {
    noAIPatterns: '不包含"首先其次最后""综上所述""值得注意的是"等AI特征词',
    naturalPacing: '断句不规律、有自然的节奏变化',
    personalityPresent: '有真人创作者的个性和语气',
    noExcessiveEmoji: 'emoji使用适度，不超过内容的10%',
    keywordDensity: '关键词自然分布，不堆砌',
  },
  // 图片质检
  image: {
    skinTexture: '皮肤有可见纹理和毛孔（非塑料质感）',
    naturalAsymmetry: '面部有自然的不对称',
    properLighting: '光照自然，不过曝不欠曝，有方向性',
    noAIArtifacts: '没有手指变形、耳朵不对称、不自然的光滑纹理',
    colorGrading: '色彩自然，像真实相机拍摄而非AI渲染',
  },
  // 视频质检
  video: {
    stableFace: '面部结构稳定，无变形扭曲',
    naturalBlink: '眨眼间隔随机（2-4秒），不是机械节奏',
    smoothMotion: '动作流畅自然，无抖动或跳跃',
    lipSyncAccuracy: '口型与音频匹配度≥90%',
    consistentLighting: '光照在镜头内保持一致',
    noMorphingArtifacts: '无AI变形伪影（头发、耳朵边缘异常）',
  },
  // 数字人质检
  digitalHuman: {
    uncannyValley: '无明显恐怖谷效应',
    eyeContact: '眼神自然，不呆滞不闪烁',
    gestureSync: '手势与说话内容协调',
    shoulderMovement: '有自然的肩部微动和身体语言',
    frameRate: '帧率≥30fps，动作无卡顿',
  },
};

// ─── 实用工具函数 ──────────────────────────────────

/**
 * 为prompt追加真实感增强关键词
 */
export function enhanceImagePrompt(basePrompt: string, type: 'portrait' | 'product' | 'scene' | 'general' = 'general'): string {
  const typeMap: Record<string, string> = {
    portrait: PORTRAIT_REALISM_POSITIVE,
    product: PRODUCT_REALISM_POSITIVE,
    scene: SCENE_REALISM_POSITIVE,
    general: REALISM_IMAGE_POSITIVE,
  };

  return `${basePrompt}, ${typeMap[type]}`.trim();
}

/**
 * 构建负向提示词
 */
export function buildNegativePrompt(type: 'portrait' | 'product' | 'general' = 'general'): string {
  const extras: Record<string, string> = {
    portrait: 'deformed face, extra limbs, bad anatomy, poorly drawn face, mutation, ugly, disgusting',
    product: 'watermark, label, text overlay, reflection artifacts, lens flare',
    general: '',
  };
  return `${REALISM_IMAGE_NEGATIVE}, ${extras[type] || ''}`.trim();
}

/**
 * 为系统提示注入反AI味指令
 */
export function injectHumanStyle(baseSystemPrompt: string, contentType: 'social' | 'ecommerce' | 'general' = 'general'): string {
  const styleMap: Record<string, string> = {
    social: XIAOHONGSHU_HUMAN_PROMPT,
    ecommerce: ECOMMERCE_HUMAN_PROMPT,
    general: HUMAN_TEXT_SYSTEM_PROMPT,
  };

  return `${baseSystemPrompt}

${styleMap[contentType]}`;
}

/**
 * 质量评分（模拟）
 */
export function qualityScore(category: string): { score: number; label: string; color: string } {
  const scores: Record<string, { score: number; label: string; color: string }> = {
    'text': { score: 95, label: '真人级', color: '#52c41a' },
    'image': { score: 92, label: '照片级', color: '#52c41a' },
    'video': { score: 88, label: '电影级', color: '#1677ff' },
    'digital-human': { score: 85, label: '拟真级', color: '#722ED1' },
  };

  return scores[category] || { score: 90, label: '真人级', color: '#52c41a' };
}
