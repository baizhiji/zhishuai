/**
 * 跟评发送服务
 * 职责：发送评论的完整链路 —— 账号授权校验 → 频控 → 账号分级 → 话术生成 → 违禁词过滤 → 发送 → 失败熔断
 */

import { prisma } from '../utils/db';
import playwrightService from './playwright.service';
import { commentSafetyService } from './comment-safety.service';
import { getAccountById } from './social-account.service';

// ─── 平台差异化安全限额（安全线 80%） ───
export interface PlatformLimit {
  perHour: number;
  perDay: number;
  baseCooldownMs: number; // 基础冷却
  cooldownJitter: number; // 抖动比例 ±
  startHour: number;      // 活跃时段开始（当日随机分布）
  endHour: number;        // 活跃时段结束
}

export const PLATFORM_LIMITS: Record<string, PlatformLimit> = {
  douyin:     { perHour: 4,  perDay: 16, baseCooldownMs: 15 * 60 * 1000, cooldownJitter: 0.5, startHour: 8, endHour: 23 },
  kuaishou:   { perHour: 4,  perDay: 16, baseCooldownMs: 15 * 60 * 1000, cooldownJitter: 0.5, startHour: 8, endHour: 23 },
  xiaohongshu:{ perHour: 6,  perDay: 24, baseCooldownMs: 10 * 60 * 1000, cooldownJitter: 0.5, startHour: 9, endHour: 23 },
  shipinhao:  { perHour: 2,  perDay: 8,  baseCooldownMs: 30 * 60 * 1000, cooldownJitter: 0.6, startHour: 9, endHour: 22 },
};

/** 账号分级阈值（天） */
const NEW_ACCOUNT_DAYS = 7;
const MID_ACCOUNT_DAYS = 30;
/** 新号冷启动：纯互动话术标记 */
const NEW_ACCOUNT_MAX_PER_DAY = 5;
const NEW_ACCOUNT_QUOTA = 0.3;
const MID_ACCOUNT_QUOTA = 0.6;
/** 失败熔断：当日删评/限流率阈值 */
const FAILURE_RATE_THRESHOLD = 0.2;
/** 熔断时长（小时） */
const BREAK_HOURS = 24;

interface SendCommentOptions {
  userId: string;
  platform: string;
  targetUrl: string;
  targetTitle?: string;
  accountId?: string;
  content?: string;      // 手动指定话术（可选，不传则 AI 生成）
  topic?: string;        // 目标内容主题（用于生成话术）
}

interface SendCommentResult {
  success: boolean;
  message: string;
  deliveryId?: string;
  blockedReason?: 'limit' | 'quota' | 'break' | 'no-account' | 'safety' | 'duplicate' | 'send-failed';
  details?: {
    accountName?: string;
    cooldownSeconds?: number;
    remainingToday?: number;
    script?: string;
  };
}

export class CommentDeliveryService {
  /**
   * 发送一条评论（完整风控链路）
   */
  async sendComment(options: SendCommentOptions): Promise<SendCommentResult> {
    const { userId, platform, targetUrl, accountId, content, topic } = options;
    const limit = PLATFORM_LIMITS[platform];
    if (!limit) {
      return { success: false, message: `平台 ${platform} 未配置安全限额` };
    }

    // 1. 获取已授权账号（缺省取该平台第一个可用账号）
    const account = await this.pickAccount(userId, platform, accountId);
    if (!account) {
      return {
        success: false,
        message: `请先在「账号授权」中绑定 ${platformName(platform)} 账号`,
        blockedReason: 'no-account',
      };
    }

    // 2. 失败熔断检查
    const breakInfo = await this.checkCircuitBreak(account.id, platform);
    if (breakInfo.isBroken) {
      return {
        success: false,
        message: `平台已熔断（近24小时失败率 ${Math.round(breakInfo.failureRate * 100)}%），${breakInfo.remainingHours.toFixed(1)} 小时后自动恢复`,
        blockedReason: 'break',
      };
    }

    // 3. 频控检查（含账号分级额度）
    const rateCheck = await this.checkRateLimit(account, platform);
    if (!rateCheck.passed) {
      return {
        success: false,
        message: rateCheck.message,
        blockedReason: rateCheck.reason,
        details: {
          cooldownSeconds: rateCheck.cooldownSeconds,
          remainingToday: rateCheck.remainingToday,
        },
      };
    }

    // 4. 生成/校验话术
    let script = content || '';
    if (!script) {
      const generated = await commentSafetyService.generateScript({
        userId,
        platform,
        topic,
      });
      if (!generated.safetyPassed || !generated.script) {
        return {
          success: false,
          message: generated.violations[0] || '话术生成失败',
          blockedReason: 'safety',
        };
      }
      if (generated.deduped) {
        return {
          success: false,
          message: '与近期已发送话术重复，已自动跳过',
          blockedReason: 'duplicate',
        };
      }
      script = generated.script;
    } else {
      // 手动话术同样强制过违禁词
      const safety = await this.forceSafety(script, platform);
      if (!safety.safe) {
        return {
          success: false,
          message: `话术触发违禁词拦截（${safety.violations.join('、')}），已拒绝发送`,
          blockedReason: 'safety',
        };
      }
      script = safety.cleanedText;
    }

    // 5. 发送（Playwright 真实浏览器）
    const cookies = this.parseCookies(account.cookies);
    const result = await playwrightService.postComment(platform, {
      targetUrl,
      content: script,
      cookies,
      accountName: account.accountName || undefined,
    });

    // 6. 记录发送结果（失败反馈闭环数据源）
    const delivery = await prisma.commentDelivery.create({
      data: {
        userId,
        agentId: account.agentId || undefined,
        accountId: account.id,
        platform,
        targetUrl,
        targetTitle: options.targetTitle,
        content: script,
        status: result.success ? 'success' : 'failed',
        failReason: result.success ? undefined : result.message,
      },
    });

    // 7. 更新账号统计
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    if (result.success) {
      return {
        success: true,
        message: '评论发送成功',
        deliveryId: delivery.id,
        details: { accountName: account.accountName || undefined, script },
      };
    }
    return {
      success: false,
      message: result.message,
      blockedReason: 'send-failed',
      deliveryId: delivery.id,
    };
  }

  /**
   * 上报评论被删除/被限流/被折叠（由用户在前端确认或后续巡检检测）
   */
  async reportDeliveryStatus(deliveryId: string, status: 'deleted' | 'limited' | 'folded'): Promise<void> {
    await prisma.commentDelivery.update({
      where: { id: deliveryId },
      data: { status },
    });
  }

  /**
   * 查询风控状态（供前端展示）
   */
  async getRiskStatus(userId: string, platform?: string): Promise<any> {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId, ...(platform ? { platform } : {}) },
      select: { id: true, platform: true, accountName: true },
    });

    const results: any[] = [];
    for (const account of accounts) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [hourCount, dayCount, todayDeliveries] = await Promise.all([
        prisma.commentDelivery.count({
          where: { accountId: account.id, createdAt: { gte: new Date(Date.now() - 3600 * 1000) } },
        }),
        prisma.commentDelivery.count({
          where: { accountId: account.id, createdAt: { gte: todayStart } },
        }),
        prisma.commentDelivery.findMany({
          where: { accountId: account.id, createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
          select: { status: true },
        }),
      ]);

      const limit = PLATFORM_LIMITS[account.platform];
      const failures = todayDeliveries.filter(d => d.status !== 'success').length;
      const failureRate = todayDeliveries.length > 0 ? failures / todayDeliveries.length : 0;

      results.push({
        accountId: account.id,
        platform: account.platform,
        platformName: platformName(account.platform),
        accountName: account.accountName,
        hourCount,
        dayCount,
        perHour: limit?.perHour ?? 0,
        perDay: limit?.perDay ?? 0,
        failureRate: Math.round(failureRate * 100),
        isBroken: failureRate >= FAILURE_RATE_THRESHOLD && todayDeliveries.length > 5,
      });
    }
    return results;
  }

  /**
   * 获取今日剩余额度
   */
  async getTodayQuota(userId: string, platform: string): Promise<{ used: number; limit: number; remaining: number }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const used = await prisma.commentDelivery.count({
      where: { userId, platform, createdAt: { gte: todayStart } },
    });
    const limit = PLATFORM_LIMITS[platform]?.perDay ?? 0;
    return { used, limit, remaining: Math.max(0, limit - used) };
  }

  // ─── 内部方法 ───

  /** 选取可用账号（缺省取该平台第一个） */
  private async pickAccount(userId: string, platform: string, accountId?: string) {
    if (accountId) {
      const acc = await getAccountById(accountId);
      if (acc && acc.userId === userId) return acc;
      return null;
    }
    return prisma.socialAccount.findFirst({
      where: { userId, platform, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** 失败熔断检查 */
  private async checkCircuitBreak(accountId: string, platform: string) {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const deliveries = await prisma.commentDelivery.findMany({
      where: { accountId, createdAt: { gte: since } },
      select: { status: true },
    });
    const failures = deliveries.filter(d => d.status !== 'success').length;
    const failureRate = deliveries.length > 0 ? failures / deliveries.length : 0;

    const isBroken = deliveries.length > 5 && failureRate >= FAILURE_RATE_THRESHOLD;
    return { isBroken, failureRate, remainingHours: BREAK_HOURS };
  }

  /** 频控 + 账号分级额度检查 */
  private async checkRateLimit(account: any, platform: string): Promise<{
    passed: boolean;
    reason?: 'limit' | 'quota';
    message: string;
    cooldownSeconds?: number;
    remainingToday?: number;
  }> {
    const limit = PLATFORM_LIMITS[platform];
    const accountAgeDays = (Date.now() - new Date(account.createdAt).getTime()) / (24 * 3600 * 1000);

    // 账号分级配额
    let quota = 1;
    let maxPerDay = limit.perDay;
    if (accountAgeDays < NEW_ACCOUNT_DAYS) {
      quota = NEW_ACCOUNT_QUOTA;
      maxPerDay = Math.min(NEW_ACCOUNT_MAX_PER_DAY, Math.floor(limit.perDay * quota));
    } else if (accountAgeDays < MID_ACCOUNT_DAYS) {
      quota = MID_ACCOUNT_QUOTA;
      maxPerDay = Math.floor(limit.perDay * quota);
    }

    const now = new Date();
    const hourStart = new Date(now.getTime() - 3600 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [hourCount, dayCount, lastDelivery] = await Promise.all([
      prisma.commentDelivery.count({
        where: { accountId: account.id, platform, createdAt: { gte: hourStart } },
      }),
      prisma.commentDelivery.count({
        where: { accountId: account.id, platform, createdAt: { gte: todayStart } },
      }),
      prisma.commentDelivery.findFirst({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // 当日额度
    if (dayCount >= maxPerDay) {
      return {
        passed: false,
        reason: 'quota',
        message: `今日额度已用尽（${dayCount}/${maxPerDay}），明日再试`,
        remainingToday: 0,
      };
    }

    // 小时额度
    const perHourLimit = Math.max(1, Math.floor(limit.perHour * quota));
    if (hourCount >= perHourLimit) {
      return {
        passed: false,
        reason: 'limit',
        message: `达到小时发送上限（${hourCount}/${perHourLimit}），请稍后再试`,
        cooldownSeconds: 3600,
        remainingToday: maxPerDay - dayCount,
      };
    }

    // 冷却时间（随机抖动：基础值 ±jitter）
    let cooldownMs = limit.baseCooldownMs;
    if (lastDelivery?.createdAt) {
      const elapsed = Date.now() - new Date(lastDelivery.createdAt).getTime();
      const jitter = 1 + (Math.random() * 2 - 1) * limit.cooldownJitter; // ±50%
      const targetCooldown = limit.baseCooldownMs * jitter;
      if (elapsed < targetCooldown) {
        const waitMs = targetCooldown - elapsed;
        return {
          passed: false,
          reason: 'limit',
          message: `冷却中，请 ${Math.ceil(waitMs / 1000)} 秒后再试`,
          cooldownSeconds: Math.ceil(waitMs / 1000),
          remainingToday: maxPerDay - dayCount,
        };
      }
    }

    return { passed: true, message: 'ok', remainingToday: maxPerDay - dayCount };
  }

  /** 手动话术的违禁词强制过滤 */
  private async forceSafety(text: string, platform: string): Promise<{ safe: boolean; cleanedText: string; violations: string[] }> {
    const generated = await commentSafetyService['safetyCheck'](text, platform);
    if (generated.safe) {
      return { safe: true, cleanedText: text, violations: [] };
    }
    const cleaned = await commentSafetyService['softClean'](text, platform);
    if (cleaned && cleaned !== text) {
      const recheck = await commentSafetyService['safetyCheck'](cleaned, platform);
      if (recheck.safe) {
        return { safe: true, cleanedText: cleaned, violations: generated.violations };
      }
    }
    return { safe: false, cleanedText: text, violations: generated.violations };
  }

  /** 解析 cookies 字符串 */
  private parseCookies(cookiesStr?: string | null): any[] {
    if (!cookiesStr) return [];
    try {
      const parsed = JSON.parse(cookiesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

/** 平台中文名 */
function platformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    shipinhao: '视频号',
  };
  return names[platform] || platform;
}

export const commentDeliveryService = new CommentDeliveryService();
