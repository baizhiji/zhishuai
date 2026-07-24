/**
 * 违禁画面检测服务
 *
 * 三层防护：
 * 1. 提示词前置过滤（生成前）
 * 2. 平台内容安全 API 复核（生成后，可选）
 * 3. NSFW 自建规则兜底（本地规则）
 *
 * 主要能力：
 * - NSFW 关键词过滤（色情/暴力/血腥/裸露/毒品/武器等）
 * - 政治敏感词检测
 * - 平台差异化策略（小红书/抖音/视频号）
 * - 提示词注入防护
 */

import { Platform } from './forbidden-words-dict';

// ─── NSFW 敏感关键词 ───
const NSFW_KEYWORDS: string[] = [
  // 色情类
  'nude', 'nudity', 'naked', '裸体', '裸照', '裸露', '全裸', '半裸',
  'sex', 'sexual', 'porn', 'pornography', '色情', '情色', '淫秽', '黄色',
  'breast', 'nipple', '胸部', '乳房', '乳头', '臀部', '阴部', '生殖器',
  'vagina', 'penis', 'genitals', '私处', '下体', '做爱', '性交',
  'orgasm', '高潮', '自慰', '手淫', '援交', '一夜情', '约炮', '包养',
  'hentai', 'h漫画', '本子', '里番', '工口',
  // 暴力类
  'gore', 'blood', '血腥', '暴力', '杀戮', '肢解', '斩首', '虐待',
  'weapon', 'gun', 'rifle', 'pistol', '枪支', '武器', '枪', '步枪', '手枪',
  'bomb', 'explosive', '炸弹', '爆炸物', '袭击', '恐怖袭击',
  'torture', '酷刑', '残害', '屠杀',
  // 毒品
  'drug', 'cocaine', 'heroin', 'meth', '大麻', '可卡因', '海洛因',
  '冰毒', '摇头丸', '毒品', '注射毒品',
  // 政治敏感
  'tibet independence', '台湾独立', '藏独', '疆独', '港独',
  '台独', '法轮功', '六四', '天安门事件', '反动', '颠覆国家',
  '领导人', '国家主席', '国务院总理', '中央军委',
];

// ─── 平台特定的画面敏感词 ───
const PLATFORM_IMAGE_RULES: Record<string, string[]> = {
  xiaohongshu: [
    '微整形', '打针', '玻尿酸', '瘦脸针', '美白针', '水光针',
    '医美', '整形', '整容', '磨骨', '抽脂',
    '减肥药', '减肥胶囊', '瘦身贴', '暴瘦',
  ],
  douyin: [
    '微整形', '医美', '整形', '整容',
    '赌场', '博彩', '赌博',
    '色情', '低俗', '引战', '血腥',
  ],
  wechat_video: [
    '色情', '低俗', '引战', '暴力血腥',
    '邪教', '迷信',
  ],
  ecommerce: [
    '假冒', '仿冒', '山寨', '盗版',
    '虚假', '夸张', '误导',
  ],
};

// ─── 类型 ───
export interface ImageSafetyCheckOptions {
  platform: Platform | Platform[];
  /** 是否启用云端 API 复核（需要外部 API Key） */
  enableCloudReview?: boolean;
}

export interface ImageSafetyResult {
  safe: boolean;
  score: number;  // 0-100，100 = 最安全
  level: 'safe' | 'warning' | 'blocked';
  detected: {
    nsfw: string[];
    violence: string[];
    political: string[];
    platformSpecific: string[];
  };
  /** 清理后的提示词（用于重新生成） */
  sanitizedPrompt: string;
  suggestions: string[];
}

// ─── 画面安全服务 ───
export class ImageSafetyService {
  /** 主入口：检查图片提示词 */
  checkPrompt(prompt: string, options: ImageSafetyCheckOptions): ImageSafetyResult {
    const lowerPrompt = prompt.toLowerCase();
    const detected = {
      nsfw: [] as string[],
      violence: [] as string[],
      political: [] as string[],
      platformSpecific: [] as string[],
    };

    // 1. NSFW 检测
    for (const keyword of NSFW_KEYWORDS) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        if (this.isViolenceKeyword(keyword)) {
          detected.violence.push(keyword);
        } else if (this.isPoliticalKeyword(keyword)) {
          detected.political.push(keyword);
        } else {
          detected.nsfw.push(keyword);
        }
      }
    }

    // 2. 平台特定规则
    const platformList = Array.isArray(options.platform) ? options.platform : [options.platform];
    for (const platform of platformList) {
      const rules = PLATFORM_IMAGE_RULES[platform] || [];
      for (const keyword of rules) {
        if (lowerPrompt.includes(keyword.toLowerCase())) {
          detected.platformSpecific.push(keyword);
        }
      }
    }

    // 3. 评分
    const totalHits =
      detected.nsfw.length * 5 +
      detected.violence.length * 4 +
      detected.political.length * 10 +
      detected.platformSpecific.length * 2;

    const score = Math.max(0, 100 - totalHits);

    // 4. 风险等级
    let level: 'safe' | 'warning' | 'blocked' = 'safe';
    if (detected.political.length > 0 || detected.nsfw.length > 0 || detected.violence.length > 0) {
      level = 'blocked';
    } else if (detected.platformSpecific.length > 0 || score < 80) {
      level = 'warning';
    }

    // 5. 清理后的提示词
    const sanitizedPrompt = this.sanitizePrompt(prompt, detected);

    // 6. 改进建议
    const suggestions = this.generateSuggestions(detected, options.platform);

    return {
      safe: level !== 'blocked',
      score,
      level,
      detected,
      sanitizedPrompt,
      suggestions,
    };
  }

  /** 暴力关键词识别 */
  private isViolenceKeyword(keyword: string): boolean {
    const violenceKeywords = ['gore', 'blood', '血腥', '暴力', '杀戮', '肢解', '斩首', '虐待',
      'weapon', 'gun', 'rifle', 'pistol', '枪支', '武器', '枪', '步枪', '手枪',
      'bomb', 'explosive', '炸弹', '爆炸物', '袭击', '恐怖袭击',
      'torture', '酷刑', '残害', '屠杀'];
    return violenceKeywords.includes(keyword);
  }

  /** 政治关键词识别 */
  private isPoliticalKeyword(keyword: string): boolean {
    const politicalKeywords = ['tibet independence', '台湾独立', '藏独', '疆独', '港独',
      '台独', '法轮功', '六四', '天安门事件', '反动', '颠覆国家',
      '领导人', '国家主席', '国务院总理', '中央军委'];
    return politicalKeywords.includes(keyword);
  }

  /** 清理提示词（移除敏感词） */
  private sanitizePrompt(prompt: string, detected: ImageSafetyResult['detected']): string {
    let sanitized = prompt;
    const allKeywords = [
      ...detected.nsfw,
      ...detected.violence,
      ...detected.political,
      ...detected.platformSpecific,
    ];

    for (const keyword of allKeywords) {
      const regex = new RegExp(this.escapeRegExp(keyword), 'gi');
      sanitized = sanitized.replace(regex, '[合规过滤]');
    }

    return sanitized;
  }

  /** 改进建议 */
  private generateSuggestions(
    detected: ImageSafetyResult['detected'],
    platforms: Platform | Platform[]
  ): string[] {
    const suggestions: string[] = [];
    const platformList = Array.isArray(platforms) ? platforms : [platforms];

    if (detected.political.length > 0) {
      suggestions.push('【严重】检测到政治敏感内容，已被拦截');
    }
    if (detected.nsfw.length > 0) {
      suggestions.push('【严重】检测到色情裸露内容，已被拦截');
    }
    if (detected.violence.length > 0) {
      suggestions.push('【严重】检测到暴力血腥内容，已被拦截');
    }
    if (detected.platformSpecific.length > 0) {
      suggestions.push(`检测到平台敏感词${detected.platformSpecific.length}处，已过滤，建议重新描述`);
    }

    return suggestions;
  }

  /** 增强提示词：拟人化（避免AI典型特征） */
  humanizePrompt(prompt: string, contentType: 'image' | 'video' | 'portrait'): string {
    const enhancements: Record<string, string> = {
      // 图片 - 真实摄影风格
      image: 'photorealistic, natural lighting, slight film grain, candid moment, real-life texture, professional photography',
      // 视频 - 电影感运镜
      video: 'cinematic shot, smooth camera movement, natural color grading, real-world lighting, slight handheld shake, professional film look',
      // 人物 - 真人质感
      portrait: 'natural skin texture, real human features, authentic expression, soft natural lighting, slight bokeh background, candid portrait',
    };

    return `${prompt}, ${enhancements[contentType]}`;
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ─── 提示词注入防护 ───
export class PromptInjectionGuard {
  private readonly DANGEROUS_PATTERNS = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
    /disregard\s+(all\s+)?(previous|above|prior)/i,
    /forget\s+(everything|all)/i,
    /你现在是/i,
    /你现在扮演/i,
    /system\s*:/i,
    /\<\|im_start\|\>/i,
    /\<\|im_end\|\>/i,
  ];

  /** 检测提示词注入 */
  detect(prompt: string): { safe: boolean; reason?: string } {
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(prompt)) {
        return { safe: false, reason: '检测到提示词注入攻击' };
      }
    }
    return { safe: true };
  }

  /** 清理危险模式 */
  sanitize(prompt: string): string {
    let sanitized = prompt;
    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[已过滤]');
    }
    return sanitized;
  }
}

export const imageSafetyService = new ImageSafetyService();
export const promptInjectionGuard = new PromptInjectionGuard();
