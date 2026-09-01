/**
 * 反AI味提示词库（服务端版）
 * 与 desktop-ui/lib/ai/anti-ai-flavor.ts 的图片部分保持一致，
 * 供服务端 generateImage 注入真实感正向/负向提示词，
 * 确保手机端/电脑端所有图片产出达到"真人照片"水准。
 */

/** 真实感图片正向提示词（自动追加到所有图片生成的 prompt 末尾） */
export const REALISM_IMAGE_POSITIVE = `
photorealistic, hyperrealistic, natural skin texture with visible pores and fine lines,
subtle skin imperfections, natural asymmetrical face, realistic lighting,
shot on professional DSLR, 50mm lens, natural depth of field,
candid photography style, soft shadows, natural color grading,
real-world environment, ambient occlusion, subsurface scattering on skin`;

/** 真实感图片负向提示词（移除 AI 生成图片的典型特征） */
export const REALISM_IMAGE_NEGATIVE = `
plastic skin, wax face, airbrushed look, perfect symmetry,
uncanny valley, CGI render, 3D render, cartoon, anime,
oversaturated colors, HDR effect, unnatural lighting,
smooth texture, doll-like, mannequin, artificial,
watermark, text, signature, low quality, blurry,
deformed hands, deformed fingers, extra fingers, fused fingers,
bad anatomy, disfigured, mutation`;

/** 人物照片真实感增强（数字人/真人照片用） */
export const PORTRAIT_REALISM_POSITIVE = `
professional portrait photography, editorial style,
natural expression, candid moment, real person,
visible skin texture, natural wrinkles around eyes when smiling,
uneven skin tone (natural), slight asymmetry in face,
real hair texture with flyaways, natural makeup or no makeup,
indoor natural window light, 85mm portrait lens, f/2.8,
shallow depth of field, bokeh background`;

/** 产品图真实感增强 */
export const PRODUCT_REALISM_POSITIVE = `
product photography, commercial photography,
real product texture and material detail,
natural studio lighting, softbox, rim light,
subtle shadows on surface, realistic reflections,
shot on product photography table, macro detail,
no fake reflections, real environment context`;

/** 场景/环境真实感增强 */
export const SCENE_REALISM_POSITIVE = `
real location, candid shot, street photography style,
natural ambient light, overcast sky or golden hour,
real people in background (blurred), urban environment,
shot on iPhone 15 Pro, no filter, realistic colors,
photorealistic, 8K, highly detailed, sharp focus`;

// ─── 视频类真实感词库（真人实拍效果）───────────────────────

/** 视频真实感正向提示词（自动追加到所有 AI 生成视频 prompt 末尾） */
export const REALISM_VIDEO_POSITIVE = `
cinematic video, real footage, shot on Arri Alexa,
natural camera movement, slight handheld micro-shake,
realistic color grading like professional colorist,
natural motion blur, 24fps film look, real physics,
consistent lighting throughout, no morphing artifacts,
no AI warping, stable face structure, natural body movement`;

/** 视频真实感负向提示词（移除 AI 生成视频的典型特征） */
export const VIDEO_REALISM_NEGATIVE = `
morphing artifacts, AI warping, unstable face structure,
deformed hands, extra fingers, distorted limbs,
plastic skin, uncanny valley, CGI render, 3D animation,
glitch, flicker, pixelation, low quality, cartoon, anime,
unnatural movement, robotic motion, repetitive motion`;

/** 视频类型专属真实感增强 */
export const VIDEO_REALISM_SPECIFICS: Record<string, string> = {
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

/**
 * 为视频 prompt 追加真实感增强关键词
 * videoType: portrait(真人口播出镜) | product(产品) | scene(实景/探店) | digital-human(数字人) | mv(真人MV) | enterprise(企业宣传)
 */
export function buildVideoRealismPrompt(videoType: string = 'scene'): string {
  const specific = VIDEO_REALISM_SPECIFICS[videoType] || '';
  return `${REALISM_VIDEO_POSITIVE.trim()}, ${specific}`.trim();
}

export type RealismType = 'portrait' | 'product' | 'scene' | 'general';

/**
 * 为 prompt 追加真实感增强关键词
 */
export function enhanceImagePrompt(basePrompt: string, type: RealismType = 'general'): string {
  const typeMap: Record<RealismType, string> = {
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
export function buildNegativePrompt(type: RealismType = 'general'): string {
  const extras: Record<RealismType, string> = {
    portrait: 'deformed face, extra limbs, bad anatomy, poorly drawn face, mutation, ugly, disgusting',
    product: 'watermark, label, text overlay, reflection artifacts, lens flare',
    scene: 'motion blur, lens flare, warped perspective, plastic-looking plants',
    general: '',
  };
  return `${REALISM_IMAGE_NEGATIVE}, ${extras[type] || ''}`.trim();
}
