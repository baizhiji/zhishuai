/**
 * 话术安全服务
 * - 话术生成（三段式随机组合）
 * - 话术去重（同账号近 7 天不重复 + 相似度过滤）
 * - 违禁词强制过滤（接入 content-safety 链路）
 */

import { prisma } from '../utils/db';
import { contentSafetyService } from './content-safety/content-safety.service';
import type { Platform } from './content-safety/forbidden-words-dict';

// 平台 → 内容安全平台映射
const PLATFORM_SAFETY_MAP: Record<string, Platform[]> = {
  douyin: ['douyin', 'ad_law', 'finance'],
  kuaishou: ['douyin', 'ad_law', 'finance'],
  xiaohongshu: ['xiaohongshu', 'ad_law', 'finance'],
  shipinhao: ['wechat_video', 'ad_law', 'finance'],
};

// ─── 三段式话术模板（组合爆炸：开头×核心×收尾，天然低重复度） ───
const OPENERS = [
  '刚刷到，', '路过看到，', '最近也在关注这块，',
  '正好刷到你这条，', '刷了几遍，觉得说得挺实在，', '关注这个话题有一阵子了，',
  '偶然刷到，', '看了你的分享，', '这个问题我最近也在研究，',
];

const CORES = [
  '我自己也是做这行的，看了你的分析很认同。',
  '身边好几个朋友都遇到过同样的情况，确实很折腾。',
  '我试用过好几家，对比下来各有千秋。',
  '这个思路不错，我之前走了不少弯路才搞明白。',
  '实操过类似方案，有几个细节值得再聊聊。',
  '我们团队也踩过类似的坑，后来换了个做法效果好很多。',
  '按我的经验，关键是前期准备要做足。',
  '说得很中肯，补充一点我的看法。',
  '认同你的观点，补充一个实际案例。',
  '之前调研过这个方向，你的总结基本到位。',
];

const CLOSERS = [
  '有需要交流的可以站内聊聊。',
  '大家可以多交流，互相学习。',
  '感兴趣的可以一起探讨。',
  '有不同看法欢迎补充。',
  '关注后续更新。',
  '祝越做越好。',
  '希望更多人看到这条。',
  '先收藏了，回头细看。',
  '手动点赞支持一下。',
  '同路人握个手。',
];

/** 相似度阈值：跨账号话术相似度超过该值判定为重复 */
const SIMILARITY_THRESHOLD = 0.7;
/** 同一账号近 N 天不重复 */
const DEDUP_DAYS = 7;
/** 每次组合尝试次数上限 */
const MAX_COMBINE_TRIES = 50;

interface GenerateScriptOptions {
  userId: string;
  platform: string;
  topic?: string; // 目标内容主题，用于生成定制开头
  tone?: 'warm' | 'professional' | 'casual';
}

interface GenerateScriptResult {
  script: string;
  deduped: boolean;
  safetyPassed: boolean;
  violations: string[];
}

export class CommentSafetyService {
  /** 生成一条安全且去重的话术 */
  async generateScript(options: GenerateScriptOptions): Promise<GenerateScriptResult> {
    const { userId, platform, topic } = options;

    let lastError = '';
    for (let attempt = 0; attempt < MAX_COMBINE_TRIES; attempt++) {
      const script = this.combineScript(topic);
      if (!script) continue;

      // 1. 违禁词强制过滤（发送链路拦截）
      const safetyResult = await this.safetyCheck(script, platform);
      if (!safetyResult.safe) {
        lastError = `触发内容安全拦截: ${safetyResult.violations.join('、')}`;
        // 尝试软替换后重新检测
        const cleaned = await this.softClean(script, platform);
        if (cleaned) {
          const recheck = await this.safetyCheck(cleaned, platform);
          if (recheck.safe) {
            return {
              script: cleaned,
              deduped: await this.isDuplicate(userId, platform, cleaned),
              safetyPassed: true,
              violations: [],
            };
          }
        }
        continue;
      }

      // 2. 去重检查（同账号近 7 天不重复 + 与近期话术相似度）
      const isDup = await this.isDuplicate(userId, platform, script);
      if (isDup) continue;

      // 3. 通过 → 入库话术库
      await this.recordTemplate(userId, platform, script);

      return { script, deduped: false, safetyPassed: true, violations: [] };
    }

    return {
      script: '',
      deduped: true,
      safetyPassed: false,
      violations: lastError ? [lastError] : ['多次组合仍未生成合规话术'],
    };
  }

  /** 三段式组合 */
  private combineScript(topic?: string): string {
    const open = this.pick(OPENERS);
    const core = this.pick(CORES);
    const close = this.pick(CLOSERS);

    const topicPart = topic ? `看了这篇${topic.length > 20 ? topic.slice(0, 20) + '…' : topic}，` : '';
    return `${open}${topicPart}${core}${close}`;
  }

  /** 随机取一 */
  private pick(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** 违禁词强制检测（strict） */
  private async safetyCheck(text: string, platform: string): Promise<{ safe: boolean; violations: string[] }> {
    const safetyPlatforms = PLATFORM_SAFETY_MAP[platform] || ['ad_law', 'finance'];
    const result = contentSafetyService.strictCheck(text, safetyPlatforms as Platform[]);
    return {
      safe: result.safe,
      violations: result.violations.map(v => v.word),
    };
  }

  /** 软清洗（替换违禁词） */
  private async softClean(text: string, platform: string): Promise<string | null> {
    const safetyPlatforms = PLATFORM_SAFETY_MAP[platform] || ['ad_law', 'finance'];
    const result = contentSafetyService.softClean(text, safetyPlatforms as Platform[]);
    if (result.safe && result.cleanedText !== text) {
      return result.cleanedText;
    }
    return null;
  }

  /** 判断是否与近期已发话术重复（同账号近 7 天 + 相似度） */
  private async isDuplicate(userId: string, platform: string, script: string): Promise<boolean> {
    const since = new Date(Date.now() - DEDUP_DAYS * 24 * 3600 * 1000);

    // 1. 精确去重：话术库哈希
    const hash = this.hashText(script);
    const exactDup = await prisma.commentTemplate.findFirst({
      where: { userId, platform, hash, createdAt: { gte: since } },
    });
    if (exactDup) return true;

    // 2. 相似度去重：对比近期发送记录
    const recent = await prisma.commentDelivery.findMany({
      where: { userId, platform, createdAt: { gte: since } },
      select: { content: true },
      take: 50,
    });
    for (const r of recent) {
      if (this.similarity(script, r.content) >= SIMILARITY_THRESHOLD) {
        return true;
      }
    }
    return false;
  }

  /** 文本哈希（简单非加密） */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return String(hash >>> 0);
  }

  /** 归一化（去空白/标点） */
  private normalize(text: string): string {
    return text.replace(/[\s，。！？、,.!?：:；;""''（）()]/g, '').toLowerCase();
  }

  /** 字符级 Jaccard 相似度（简单、高效） */
  private similarity(a: string, b: string): number {
    const na = this.normalize(a);
    const nb = this.normalize(b);
    if (!na || !nb) return 0;
    const setA = new Set(na.split(''));
    const setB = new Set(nb.split(''));
    let inter = 0;
    for (const ch of setA) {
      if (setB.has(ch)) inter++;
    }
    const union = setA.size + setB.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  /** 记录话术入库（供后续去重） */
  private async recordTemplate(userId: string, platform: string, script: string): Promise<void> {
    const hash = this.hashText(script);
    const existing = await prisma.commentTemplate.findFirst({
      where: { userId, platform, hash },
    });
    if (existing) {
      await prisma.commentTemplate.update({
        where: { id: existing.id },
        data: { usedCount: { increment: 1 }, lastUsedAt: new Date() },
      });
    } else {
      await prisma.commentTemplate.create({
        data: { userId, platform, content: script, hash },
      });
    }
  }
}

export const commentSafetyService = new CommentSafetyService();
