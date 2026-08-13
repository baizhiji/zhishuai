/**
 * 跟评发送路由
 * 智能获客跟评：发送评论 + 发送记录 + 风控状态
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';
import { commentDeliveryService, PLATFORM_LIMITS } from '../services/comment-delivery.service';
import { commentSafetyService } from '../services/comment-safety.service';

const router = Router();

router.use(authMiddleware);

/**
 * 获取平台限额配置
 */
router.get('/limits', (_req: Request, res: Response) => {
  const limits = Object.entries(PLATFORM_LIMITS).map(([platform, limit]) => ({
    platform,
    platformName: platformName(platform),
    perHour: limit.perHour,
    perDay: limit.perDay,
    baseCooldownMinutes: Math.round(limit.baseCooldownMs / 60000),
    activeHours: `${limit.startHour}:00-${limit.endHour}:00`,
  }));
  res.json({ code: 0, data: limits });
});

/**
 * 发送一条跟评
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }

    const { platform, targetUrl, targetTitle, accountId, content, topic } = req.body || {};
    if (!platform || !targetUrl) {
      return res.json({ code: 400, message: '缺少必要参数 platform/targetUrl' });
    }

    const result = await commentDeliveryService.sendComment({
      userId,
      platform,
      targetUrl,
      targetTitle,
      accountId,
      content,
      topic,
    });

    res.json({
      code: result.success ? 0 : 1,
      message: result.message,
      data: result.details ? { ...result.details, deliveryId: result.deliveryId } : undefined,
      blockedReason: result.blockedReason,
    });
  } catch (error: any) {
    console.error('发送跟评失败:', error);
    res.json({ code: 500, message: `发送跟评失败: ${error.message}` });
  }
});

/**
 * 生成一条话术（预览用，不发送）
 */
router.post('/preview-script', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    const { platform, topic } = req.body || {};
    if (!platform) {
      return res.json({ code: 400, message: '缺少必要参数 platform' });
    }

    const generated = await commentSafetyService.generateScript({ userId, platform, topic });
    res.json({
      code: generated.safetyPassed ? 0 : 1,
      data: {
        script: generated.script,
        deduped: generated.deduped,
        violations: generated.violations,
      },
      message: generated.safetyPassed ? 'ok' : '生成话术未通过内容安全校验，已拒绝',
    });
  } catch (error: any) {
    console.error('生成话术失败:', error);
    res.json({ code: 500, message: `生成话术失败: ${error.message}` });
  }
});

/**
 * 跟评发送记录（分页）
 */
router.get('/records', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }

    const { platform, status, page = '1', pageSize = '20' } = req.query;
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));

    const where: any = { userId };
    if (platform) where.platform = platform;
    if (status) where.status = status;

    const [total, records] = await Promise.all([
      prisma.commentDelivery.count({ where }),
      prisma.commentDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        include: { SocialAccount: { select: { accountName: true } } },
      }),
    ]);

    res.json({
      code: 0,
      data: {
        total,
        page: p,
        pageSize: ps,
        records: records.map(r => ({
          id: r.id,
          platform: r.platform,
          platformName: platformName(r.platform),
          targetUrl: r.targetUrl,
          targetTitle: r.targetTitle,
          content: r.content,
          status: r.status,
          failReason: r.failReason,
          accountName: r.SocialAccount?.accountName,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('获取发送记录失败:', error);
    res.json({ code: 500, message: '获取发送记录失败' });
  }
});

/**
 * 上报评论被删/被限流/被折叠（失败反馈闭环）
 */
router.post('/records/:deliveryId/status', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const { status } = req.body || {};

    if (!['deleted', 'limited', 'folded'].includes(status)) {
      return res.json({ code: 400, message: 'status 必须为 deleted/limited/folded' });
    }

    await commentDeliveryService.reportDeliveryStatus(deliveryId, status);
    res.json({ code: 0, message: '已更新记录状态' });
  } catch (error: any) {
    console.error('更新记录状态失败:', error);
    res.json({ code: 500, message: '更新记录状态失败' });
  }
});

/**
 * 风控状态（账号级熔断/额度）
 */
router.get('/risk', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    const { platform } = req.query;
    const data = await commentDeliveryService.getRiskStatus(userId, platform as string | undefined);
    res.json({ code: 0, data });
  } catch (error: any) {
    console.error('获取风控状态失败:', error);
    res.json({ code: 500, message: '获取风控状态失败' });
  }
});

/**
 * 今日额度
 */
router.get('/quota', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    const { platform } = req.query;
    if (!platform) {
      return res.json({ code: 400, message: '缺少必要参数 platform' });
    }
    const data = await commentDeliveryService.getTodayQuota(userId, platform as string);
    res.json({ code: 0, data });
  } catch (error: any) {
    console.error('获取额度失败:', error);
    res.json({ code: 500, message: '获取额度失败' });
  }
});

function platformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    shipinhao: '视频号',
  };
  return names[platform] || platform;
}

export default router;
