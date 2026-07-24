/**
 * 内容安全服务 - 违禁词检测 + 智能替换
 *
 * 核心能力：
 * 1. 平台差异化违禁词检测（小红书/抖音/视频号/电商/广告法/医疗/金融）
 * 2. 智能同义词替换（让AI内容既合规又自然）
 * 3. 合规评分（0-100分）
 * 4. 风险等级标记（safe/warning/blocked）
 *
 * 调用入口：contentSafetyService.check(text, { platform, mode })
 *   - mode: 'strict' (严格，违禁词直接拒) | 'soft' (宽松，违禁词自动替换)
 */

import {
  PLATFORM_FORBIDDEN_WORDS,
  SYNONYM_REPLACEMENTS,
  type Platform,
} from './forbidden-words-dict';

// ─── 类型定义 ───
export interface CheckOptions {
  platform: Platform | Platform[];
  mode: 'strict' | 'soft';
  /** 替换时返回原文+替换词对照 */
  showReplacements?: boolean;
}

export interface ViolationItem {
  word: string;
  platform: Platform;
  suggestion: string;
  category: 'ad_law' | 'medical' | 'finance' | 'platform' | 'ecommerce';
  severity: 'high' | 'medium' | 'low';
}

export interface CheckResult {
  safe: boolean;
  score: number;        // 合规评分 0-100
  level: 'safe' | 'warning' | 'blocked';
  violations: ViolationItem[];
  cleanedText: string;  // 替换后的文本（soft 模式）
  stats: {
    totalChecked: number;
    hitCount: number;
    replacedCount: number;
    byPlatform: Record<string, number>;
  };
  suggestions: string[]; // 改进建议
}

// ─── 内容安全服务实现 ───
export class ContentSafetyService {
  /** 合并所有平台的违禁词到一个 Set（用于快速匹配） */
  private buildWordSet(platforms: Platform | Platform[]): Map<string, { word: string; platform: Platform; category: string; severity: 'high' | 'medium' | 'low' }> {
    const platformList = Array.isArray(platforms) ? platforms : [platforms];
    const map = new Map<string, { word: string; platform: Platform; category: string; severity: 'high' | 'medium' | 'low' }>();

    for (const platform of platformList) {
      const words = PLATFORM_FORBIDDEN_WORDS[platform] || [];
      for (const word of words) {
        const lowerWord = word.toLowerCase();
        if (!map.has(lowerWord)) {
          map.set(lowerWord, {
            word,
            platform,
            category: platform as string,
            severity: this.getSeverity(platform, word),
          });
        }
      }
    }

    return map;
  }

  /** 判断严重程度 */
  private getSeverity(platform: Platform, word: string): 'high' | 'medium' | 'low' {
    // 广告法、医疗、金融一律高危
    if (platform === 'ad_law' || platform === 'medical' || platform === 'finance') {
      return 'high';
    }
    // 平台引流的"加微信"等是高危
    if (['加微信', '私信', '微商', '招代理', '+V', '+v', '加 v'].includes(word)) {
      return 'high';
    }
    // 色情赌博类高危
    if (['色情', '裸聊', '赌博', '博彩'].some(k => word.includes(k))) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * 主检测方法
   * @param text 待检测文本
   * @param options 检测配置
   */
  check(text: string, options: CheckOptions): CheckResult {
    if (!text || text.trim().length === 0) {
      return {
        safe: true,
        score: 100,
        level: 'safe',
        violations: [],
        cleanedText: text,
        stats: { totalChecked: 0, hitCount: 0, replacedCount: 0, byPlatform: {} },
        suggestions: [],
      };
    }

    const wordMap = this.buildWordSet(options.platform);
    const violations: ViolationItem[] = [];
    const byPlatform: Record<string, number> = {};
    let cleanedText = text;

    // 1. 检测违禁词
    for (const [lowerWord, info] of wordMap.entries()) {
      // 用正则匹配，避免误命中（前后为非汉字字符或边界）
      const regex = new RegExp(
        this.escapeRegExp(info.word) + '(?![一-龥])',
        'gi'
      );

      if (regex.test(text)) {
        violations.push({
          word: info.word,
          platform: info.platform,
          suggestion: SYNONYM_REPLACEMENTS[info.word] || '建议改用其他表达',
          category: info.category as any,
          severity: info.severity,
        });

        byPlatform[info.platform] = (byPlatform[info.platform] || 0) + 1;

        // 2. 替换（仅 soft 模式）
        if (options.mode === 'soft' && SYNONYM_REPLACEMENTS[info.word]) {
          cleanedText = cleanedText.replace(
            new RegExp(this.escapeRegExp(info.word), 'g'),
            SYNONYM_REPLACEMENTS[info.word]
          );
        }
      }
    }

    // 3. 计算合规评分
    const score = this.calculateScore(text, violations);

    // 4. 判断风险等级
    let level: 'safe' | 'warning' | 'blocked' = 'safe';
    if (score < 60 || violations.some(v => v.severity === 'high')) {
      level = 'blocked';
    } else if (score < 85 || violations.length > 0) {
      level = 'warning';
    }

    // 5. 改进建议
    const suggestions = this.generateSuggestions(violations, options.platform);

    return {
      safe: level !== 'blocked',
      score,
      level,
      violations,
      cleanedText: options.mode === 'soft' ? cleanedText : text,
      stats: {
        totalChecked: wordMap.size,
        hitCount: violations.length,
        replacedCount: violations.filter(v => SYNONYM_REPLACEMENTS[v.word]).length,
        byPlatform,
      },
      suggestions,
    };
  }

  /** 计算合规评分（0-100） */
  private calculateScore(originalText: string, violations: ViolationItem[]): number {
    if (violations.length === 0) return 100;

    // 违禁词越少分越高
    const length = originalText.length;
    const violationRate = violations.length / Math.max(length / 20, 1); // 每20字1个违禁词为基准

    // 严重程度加权
    const severityWeight = violations.reduce((sum, v) => {
      return sum + (v.severity === 'high' ? 5 : v.severity === 'medium' ? 2 : 1);
    }, 0);

    // 基础分100，扣分
    let score = 100 - violationRate * 10 - severityWeight * 3;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /** 生成改进建议 */
  private generateSuggestions(violations: ViolationItem[], platforms: Platform | Platform[]): string[] {
    const suggestions: string[] = [];
    const platformList = Array.isArray(platforms) ? platforms : [platforms];

    if (violations.length === 0) return suggestions;

    // 按类别分组
    const byCategory: Record<string, ViolationItem[]> = {};
    for (const v of violations) {
      if (!byCategory[v.category]) byCategory[v.category] = [];
      byCategory[v.category].push(v);
    }

    if (byCategory['ad_law']?.length > 0) {
      suggestions.push(`广告法风险: 出现 ${byCategory['ad_law'].length} 处绝对化用语（如"最好/第一/100%"），已自动替换为更安全的表达`);
    }
    if (byCategory['medical']?.length > 0) {
      suggestions.push(`医疗风险: 出现 ${byCategory['medical'].length} 处医疗承诺性用语，已替换为"改善/辅助"等保守表达`);
    }
    if (byCategory['finance']?.length > 0) {
      suggestions.push(`金融风险: 出现 ${byCategory['finance'].length} 处投资承诺性用语，已替换为"稳健/低风险"等合规表达`);
    }
    if (byCategory['platform']?.length > 0) {
      suggestions.push(`平台规范: 出现 ${byCategory['platform'].length} 处平台违规引流词，建议通过站内合规渠道互动`);
    }

    return suggestions;
  }

  /** 转义正则特殊字符 */
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** 快捷方法：strict 模式 */
  strictCheck(text: string, platform: Platform | Platform[]): CheckResult {
    return this.check(text, { platform, mode: 'strict' });
  }

  /** 快捷方法：soft 模式（自动替换） */
  softClean(text: string, platform: Platform | Platform[]): CheckResult {
    return this.check(text, { platform, mode: 'soft' });
  }

  /**
   * 为 AI 提示词增强：在生成前注入合规要求
   * 让 AI 在生成阶段就避免违禁词
   */
  buildSafeSystemPrompt(platform: Platform | Platform[]): string {
    const platformList = Array.isArray(platform) ? platform : [platform];
    const rules: string[] = [];

    rules.push('【内容合规铁律 - 违反将导致下架/封号】');
    rules.push('1. 严禁使用广告法绝对化用语：最好/最/第一/100%/绝对/唯一/独家等');
    rules.push('2. 严禁医疗承诺：治愈/根治/包治百病/立竿见影等');
    rules.push('3. 严禁金融承诺：保本/稳赚/无风险/高收益/必赚等');
    rules.push('4. 严禁引流话术：加微信/+V/私信/微商/招代理等');

    for (const p of platformList) {
      switch (p) {
        case 'xiaohongshu':
          rules.push('【小红书规范】内容需自然种草风，避免硬广感，禁用医美/减肥/微整形相关项目引流');
          break;
        case 'douyin':
          rules.push('【抖音规范】避免诱导互动词（点赞领取/关注领取等），禁用站外引流');
          break;
        case 'wechat_video':
          rules.push('【视频号规范】保持内容真实性，避免引战、地域黑、低俗内容');
          break;
        case 'ecommerce':
          rules.push('【电商规范】避免夸大宣传、虚假承诺，使用"稳/较好/领先"等保守表达');
          break;
        case 'ad_law':
          rules.push('【广告法】所有绝对化用语必须替换为比较级或中性表达');
          break;
        case 'medical':
          rules.push('【医疗合规】所有"治疗/治愈"类承诺改为"改善/辅助/日常"');
          break;
        case 'finance':
          rules.push('【金融合规】所有"保本/稳赚"类承诺改为"稳健/低风险"');
          break;
      }
    }

    rules.push('\n【正确示范】');
    rules.push('- "最好" → "很出色" / "挺不错"');
    rules.push('- "100%" → "较高" / "绝大多数"');
    rules.push('- "第一" → "领先" / "广受认可"');
    rules.push('- "根治" → "改善" / "缓解"');
    rules.push('- "稳赚" → "稳健" / "看好"');
    rules.push('- "加微信" → "站内联系"');

    return rules.join('\n');
  }
}

// ─── 导出单例 ───
export const contentSafetyService = new ContentSafetyService();
