/**
 * 内容发布 API 路由 - 合并版本
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 内容发布请求类型
interface PublishContentRequest {
  platform: string;
  userId: string;
  content: {
    text?: string;
    images?: string[];
    videos?: string[];
    title?: string;
  };
}

// 获取平台名称
function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    weibo: '微博',
    bilibili: 'B站',
    zhihu: '知乎',
    boss: 'BOSS直聘'
  };
  return names[platform] || platform;
}

// ============ 账号管理 ============

// 获取可用的发布账号
router.get('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platforms } = req.query;
    
    const platformList = platforms 
      ? (platforms as string).split(',')
      : ['douyin', 'kuaishou', 'xiaohongshu', 'weibo'];
    
    const prisma = (req as any).prisma;
    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        platform: { in: platformList },
        status: 'active',
      },
    });

    res.json({
      success: true,
      data: accounts.map((acc: any) => ({
        id: acc.id,
        platform: acc.platform,
        platformName: getPlatformName(acc.platform),
        accountName: acc.accountName,
        avatar: acc.avatar,
        status: acc.status
      }))
    });
    
  } catch (error: any) {
    console.error('获取账号失败:', error);
    res.status(500).json({ error: '获取账号失败' });
  }
});

// ============ 内容发布 ============

// 发布内容到平台
router.post('/publish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, content, mediaUrls, platform, accountIds } = req.body;
    
    if (!title && !content) {
      return res.status(400).json({ error: '标题或内容不能为空' });
    }
    
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ error: '请选择至少一个发布账号' });
    }

    // 验证账号归属
    const prisma = (req as any).prisma;
    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds }, userId },
    });
    if (accounts.length !== accountIds.length) {
      return res.status(400).json({ error: '部分账号不存在或不属于当前用户' });
    }

    // 创建发布记录并更新素材状态
    const results = [];
    for (const accountId of accountIds) {
      const account = accounts.find((a: any) => a.id === accountId);
      const record = await prisma.publishRecord.create({
        data: {
          userId,
          materialId: req.body.materialId || '00000000-0000-0000-0000-000000000000',
          accountId,
          platform: platform || account?.platform || 'unknown',
          status: 'pending',
          title: title || '',
          content: content || '',
          mediaUrls: mediaUrls || [],
        },
      });
      results.push({ id: record.id, accountId, platform: account?.platform, success: true });
    }

    // 更新关联素材状态为已使用（含平台追踪）
    if (req.body.materialId && req.body.materialId !== '00000000-0000-0000-0000-000000000000') {
      const { markMaterialAsUsed } = await import('../services/material-dedup.service');
      for (const r of results) {
        const account = accounts.find(a => a.id === r.accountId);
        if (account?.platform) {
          await markMaterialAsUsed(req.body.materialId, account.platform).catch(() => {});
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: results.length,
          failed: 0
        }
      }
    });
    
  } catch (error: any) {
    console.error('发布内容失败:', error);
    res.status(500).json({ error: `发布失败: ${error.message}` });
  }
});

// 批量发布内容
router.post('/batch-publish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platforms, content, title, mediaUrls, materialId, accountIds } = req.body;
    
    if (!platforms?.length) {
      return res.status(400).json({ error: '请选择发布平台' });
    }
    
    const prisma = (req as any).prisma;
    
    // 获取用户在这些平台上的活跃账号
    const accounts = await prisma.socialAccount.findMany({
      where: { userId, platform: { in: platforms }, status: 'active' },
    });
    
    if (accounts.length === 0) {
      return res.status(400).json({ error: '所选平台暂无可用账号，请先绑定账号' });
    }
    
    // 为每个账号创建发布记录
    const results = [];
    for (const account of accounts) {
      const record = await prisma.publishRecord.create({
        data: {
          userId,
          materialId: materialId || '00000000-0000-0000-0000-000000000000',
          accountId: account.id,
          platform: account.platform,
          status: 'pending',
          title: title || '',
          content: content || '',
          mediaUrls: mediaUrls || [],
        },
      });
      results.push({
        id: record.id,
        platform: account.platform,
        platformName: getPlatformName(account.platform),
        accountId: account.id,
        accountName: account.accountName,
        success: true,
        message: '已加入发布队列',
      });
    }
    
    // 更新素材状态（含平台追踪）
    if (materialId && materialId !== '00000000-0000-0000-0000-000000000000') {
      const { markMaterialAsUsed } = await import('../services/material-dedup.service');
      for (const account of accounts) {
        await markMaterialAsUsed(materialId, account.platform).catch(() => {});
      }
    }
    
    res.json({
      success: true,
      data: {
        total: results.length,
        results,
        skipped: platforms.length - accounts.length,
        message: accounts.length < platforms.length
          ? `部分平台无可用账号，已跳过${platforms.length - accounts.length}个平台`
          : undefined,
      }
    });
    
  } catch (error: any) {
    console.error('批量发布失败:', error);
    res.status(500).json({ error: '批量发布失败' });
  }
});

// 获取平台发布能力
router.get('/capabilities/:platform', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    
    const capabilities: Record<string, any> = {
      douyin: { canPublish: true, canSchedule: true, supportsVideo: true, supportsImage: true },
      kuaishou: { canPublish: true, canSchedule: false, supportsVideo: true, supportsImage: true },
      xiaohongshu: { canPublish: true, canSchedule: true, supportsVideo: true, supportsImage: true },
      weibo: { canPublish: true, canSchedule: true, supportsVideo: true, supportsImage: true },
      bilibili: { canPublish: true, canSchedule: true, supportsVideo: true, supportsImage: false },
      zhihu: { canPublish: true, canSchedule: false, supportsVideo: false, supportsImage: true },
    };
    
    res.json({
      success: true,
      data: {
        platform: getPlatformName(platform),
        capabilities: capabilities[platform] || { canPublish: false },
      }
    });
    
  } catch (error: any) {
    console.error('获取平台能力失败:', error);
    res.status(500).json({ error: '获取平台能力失败' });
  }
});

// ============ 发布历史 ============

// 获取发布历史
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, status, page = '1', pageSize = '20' } = req.query;
    
    const prisma = (req as any).prisma;
    const where: any = { userId };
    if (platform) where.platform = platform;
    if (status) where.status = status;
    
    const records = await prisma.publishRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });
    
    const total = await prisma.publishRecord.count({ where });
    
    res.json({
      success: true,
      data: {
        list: records,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      }
    });
    
  } catch (error: any) {
    console.error('获取发布历史失败:', error);
    res.status(500).json({ error: '获取发布历史失败' });
  }
});

// 获取发布统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const prisma = (req as any).prisma;
    
    const [total, published, failed, pending] = await Promise.all([
      prisma.publishRecord.count({ where: { userId } }),
      prisma.publishRecord.count({ where: { userId, status: 'success' } }),
      prisma.publishRecord.count({ where: { userId, status: 'failed' } }),
      prisma.publishRecord.count({ where: { userId, status: 'pending' } }),
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        published,
        failed,
        pending,
        successRate: total > 0 ? Math.round((published / total) * 100) : 0,
      }
    });
    
  } catch (error: any) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

export default router;
