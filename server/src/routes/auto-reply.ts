import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 自动回复规则类型（复用 Prisma AutomationTask 模型）
// type: 'auto_reply' 用于区分其他自动化任务

/**
 * 获取自动回复规则列表
 */
router.get('/rules', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    
    const rules = await prisma.automationTask.findMany({
      where: { userId, type: 'auto_reply' },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ code: 0, data: { items: rules, total: rules.length } });
  } catch (error: any) {
    console.error('获取规则失败:', error);
    res.status(500).json({ code: 500, message: '获取规则失败' });
  }
});

/**
 * 创建自动回复规则
 */
router.post('/rules', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    const { platform, keyword, replyContent, enabled = true, accountId } = req.body;
    
    if (!platform || !keyword || !replyContent) {
      return res.status(400).json({ code: 400, message: '缺少必要参数: platform, keyword, replyContent' });
    }
    
    const rule = await prisma.automationTask.create({
      data: {
        userId,
        name: `自动回复: ${keyword}`,
        type: 'auto_reply',
        platform,
        accountId: accountId || 'default',
        config: { keyword, replyContent, enabled },
        enabled,
        status: enabled ? 'active' : 'idle',
      },
    });
    
    res.json({ code: 0, data: rule, message: '规则创建成功' });
  } catch (error: any) {
    console.error('创建规则失败:', error);
    res.status(500).json({ code: 500, message: '创建规则失败' });
  }
});

/**
 * 更新自动回复规则
 */
router.put('/rules/:ruleId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ruleId } = req.params;
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    const updates = req.body;
    
    const existing = await prisma.automationTask.findFirst({
      where: { id: ruleId, userId, type: 'auto_reply' },
    });
    
    if (!existing) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    
    const config = { ...(existing.config as any || {}), ...updates };
    
    await prisma.automationTask.update({
      where: { id: ruleId },
      data: {
        config,
        enabled: updates.enabled !== undefined ? updates.enabled : existing.enabled,
        name: updates.keyword ? `自动回复: ${updates.keyword}` : existing.name,
      },
    });
    
    res.json({ code: 0, message: '规则更新成功' });
  } catch (error: any) {
    console.error('更新规则失败:', error);
    res.status(500).json({ code: 500, message: '更新规则失败' });
  }
});

/**
 * 删除自动回复规则
 */
router.delete('/rules/:ruleId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ruleId } = req.params;
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    
    const existing = await prisma.automationTask.findFirst({
      where: { id: ruleId, userId, type: 'auto_reply' },
    });
    
    if (!existing) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    
    await prisma.automationTask.delete({ where: { id: ruleId } });
    res.json({ code: 0, message: '规则删除成功' });
  } catch (error: any) {
    console.error('删除规则失败:', error);
    res.status(500).json({ code: 500, message: '删除规则失败' });
  }
});

/**
 * 切换规则启用状态
 */
router.post('/rules/:ruleId/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ruleId } = req.params;
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    
    const existing = await prisma.automationTask.findFirst({
      where: { id: ruleId, userId, type: 'auto_reply' },
    });
    
    if (!existing) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    
    await prisma.automationTask.update({
      where: { id: ruleId },
      data: {
        enabled: !existing.enabled,
        status: !existing.enabled ? 'active' : 'idle',
      },
    });
    
    res.json({ code: 0, message: `规则已${!existing.enabled ? '启用' : '禁用'}` });
  } catch (error: any) {
    console.error('切换状态失败:', error);
    res.status(500).json({ code: 500, message: '切换状态失败' });
  }
});

/**
 * 获取自动回复统计
 */
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    
    const [totalRules, activeRules] = await Promise.all([
      prisma.automationTask.count({ where: { userId, type: 'auto_reply' } }),
      prisma.automationTask.count({ where: { userId, type: 'auto_reply', enabled: true } }),
    ]);
    
    // 获取今日执行次数
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayTasks = await prisma.automationTask.findMany({
      where: { userId, type: 'auto_reply', enabled: true },
      select: { runCount: true, successCount: true, failCount: true },
    });
    
    const totalReplies = todayTasks.reduce((sum: number, t: any) => sum + (t.runCount || 0), 0);
    const todayReplies = todayTasks.reduce((sum: number, t: any) => sum + (t.successCount || 0), 0);
    
    const platforms = await prisma.automationTask.groupBy({
      by: ['platform'],
      where: { userId, type: 'auto_reply' },
      _count: true,
    });
    
    res.json({
      code: 0,
      data: {
        totalRules,
        activeRules,
        totalReplies,
        todayReplies,
        platforms: platforms.map((p: any) => ({ platform: p.platform, count: p._count })),
      },
    });
  } catch (error: any) {
    console.error('获取统计失败:', error);
    res.status(500).json({ code: 500, message: '获取统计失败' });
  }
});

/**
 * 测试自动回复规则
 */
router.post('/rules/:ruleId/test', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { testMessage } = req.body;
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    
    if (!testMessage) {
      return res.status(400).json({ code: 400, message: '请输入测试消息' });
    }
    
    const rule = await prisma.automationTask.findFirst({
      where: { id: ruleId, userId, type: 'auto_reply' },
    });
    
    if (!rule) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    
    const config = rule.config as any;
    const keyword = config?.keyword || '';
    const isMatch = testMessage.includes(keyword);
    
    res.json({
      code: 0,
      data: {
        match: isMatch,
        keyword,
        expectedReply: isMatch ? config?.replyContent : null,
        testMessage,
      },
    });
  } catch (error: any) {
    console.error('测试规则失败:', error);
    res.status(500).json({ code: 500, message: '测试规则失败' });
  }
});

/**
 * 获取回复日志
 */
router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const prisma = (req as any).prisma;
    const { platform, page = 1, pageSize = 20 } = req.query;
    
    const where: any = { userId, type: 'auto_reply' };
    if (platform) where.platform = platform;
    
    const [items, total] = await Promise.all([
      prisma.taskExecution.findMany({
        where: { taskId: { in: (await prisma.automationTask.findMany({ where, select: { id: true } })).map((r: any) => r.id) } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.taskExecution.count({
        where: { taskId: { in: (await prisma.automationTask.findMany({ where, select: { id: true } })).map((r: any) => r.id) } },
      }),
    ]);
    
    res.json({
      code: 0,
      data: { items, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    console.error('获取日志失败:', error);
    res.status(500).json({ code: 500, message: '获取日志失败' });
  }
});

export default router;
