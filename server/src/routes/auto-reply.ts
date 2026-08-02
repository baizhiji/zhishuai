/**
 * 自动回复路由 - 管理自动回复规则
 * 支持关键词匹配、智能回复
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// 获取自动回复规则列表
router.get('/rules', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, status } = req.query;

    const where: any = { userId };
    if (platform && platform !== 'all') where.platform = { in: [platform as string, 'all'] };
    if (status !== undefined) where.status = status === 'true';

    const rules = await prisma.replyRule.findMany({
      where,
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('获取回复规则错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取单个规则
router.get('/rules/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const rule = await prisma.replyRule.findFirst({ where: { id, userId } });
    if (!rule) {
      res.status(404).json({ error: '规则不存在' });
      return;
    }

    res.json({ success: true, data: rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建自动回复规则
router.post('/rules', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { keyword, matchType, replyContent, platform, replyType, sortOrder } = req.body;

    if (!keyword || !replyContent) {
      res.status(400).json({ error: '关键词和回复内容不能为空' });
      return;
    }

    // 检查是否已存在相同关键词
    const existing = await prisma.replyRule.findFirst({
      where: { userId, keyword, platform: platform || 'all' },
    });
    if (existing) {
      // 更新已有规则
      const rule = await prisma.replyRule.update({
        where: { id: existing.id },
        data: { replyContent, matchType, replyType, sortOrder },
      });
      res.json({ success: true, data: rule, duplicated: true });
      return;
    }

    const rule = await prisma.replyRule.create({
      data: {
        userId,
        keyword,
        matchType: matchType || 'exact',
        replyContent,
        platform: platform || 'all',
        replyType: replyType || 'text',
        sortOrder: sortOrder || 0,
      },
    });

    res.json({ success: true, data: rule });
  } catch (error: any) {
    console.error('创建回复规则错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新自动回复规则
router.put('/rules/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { keyword, matchType, replyContent, platform, replyType, sortOrder, status } = req.body;

    const existing = await prisma.replyRule.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: '规则不存在' });
      return;
    }

    const data: any = {};
    if (keyword !== undefined) data.keyword = keyword;
    if (matchType !== undefined) data.matchType = matchType;
    if (replyContent !== undefined) data.replyContent = replyContent;
    if (platform !== undefined) data.platform = platform;
    if (replyType !== undefined) data.replyType = replyType;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (status !== undefined) data.status = status;

    const rule = await prisma.replyRule.update({ where: { id }, data });

    res.json({ success: true, data: rule });
  } catch (error: any) {
    console.error('更新回复规则错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 切换规则启用状态
router.patch('/rules/:id/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existing = await prisma.replyRule.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: '规则不存在' });
      return;
    }

    const rule = await prisma.replyRule.update({
      where: { id },
      data: { status: !existing.status },
    });

    res.json({ success: true, data: rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除规则
router.delete('/rules/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existing = await prisma.replyRule.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: '规则不存在' });
      return;
    }

    await prisma.replyRule.delete({ where: { id } });

    res.json({ success: true });
  } catch (error: any) {
    console.error('删除回复规则错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量删除规则
router.post('/rules/batch-delete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '请提供要删除的规则ID列表' });
      return;
    }

    await prisma.replyRule.deleteMany({ where: { id: { in: ids }, userId } });

    res.json({ success: true, message: `已删除 ${ids.length} 条规则` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取自动回复日志
router.get('/logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await prisma.replyLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: Number(offset),
      take: Number(limit),
      include: { rule: { select: { keyword: true, matchType: true } } },
    });

    const total = await prisma.replyLog.count({ where: { userId } });

    res.json({ success: true, data: logs, total });
  } catch (error: any) {
    console.error('获取回复日志错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取自动回复统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [totalRules, activeRules, totalUsed, todayUsed, totalLogs, todayLogs] = await Promise.all([
      prisma.replyRule.count({ where: { userId } }),
      prisma.replyRule.count({ where: { userId, status: true } }),
      prisma.replyRule.aggregate({ where: { userId }, _sum: { totalCount: true } }),
      prisma.replyRule.aggregate({ where: { userId, status: true }, _sum: { weeklyCount: true } }),
      prisma.replyLog.count({ where: { userId } }),
      prisma.replyLog.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRules,
        activeRules,
        totalUsed: totalUsed._sum.totalCount || 0,
        todayUsed: todayUsed._sum.weeklyCount || 0,
        totalLogs,
        todayLogs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 测试匹配（不实际回复，只返回匹配结果）
router.post('/test-match', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { message, platform } = req.body;

    if (!message) {
      res.status(400).json({ error: '消息内容不能为空' });
      return;
    }

    const rules = await prisma.replyRule.findMany({
      where: { userId, status: true },
      orderBy: { sortOrder: 'desc' },
    });

    const matchedRules = [];
    for (const rule of rules) {
      // 检查平台匹配
      if (platform && rule.platform !== 'all' && rule.platform !== platform) {
        continue;
      }

      let matched = false;
      const msgLower = message.toLowerCase();
      const kwLower = rule.keyword.toLowerCase();

      switch (rule.matchType) {
        case 'exact':
          matched = msgLower.includes(kwLower);
          break;
        case 'fuzzy':
          // 模糊匹配：允许一个字符差异
          matched = fuzzyMatch(msgLower, kwLower);
          break;
        case 'regex':
          try {
            matched = new RegExp(rule.keyword, 'i').test(message);
          } catch (e) {
            // 无效正则跳过
          }
          break;
        default:
          matched = msgLower.includes(kwLower);
      }

      if (matched) {
        matchedRules.push(rule);
      }
    }

    res.json({
      success: true,
      data: {
        message,
        matchCount: matchedRules.length,
        matches: matchedRules,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 模拟自动回复（从各平台webhook调用）
router.post('/simulate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { message, senderName, platform } = req.body;

    if (!message) {
      res.status(400).json({ error: '消息内容不能为空' });
      return;
    }

    const rules = await prisma.replyRule.findMany({
      where: { userId, status: true },
      orderBy: { sortOrder: 'desc' },
    });

    let matchedRule = null;
    for (const rule of rules) {
      if (platform && rule.platform !== 'all' && rule.platform !== platform) {
        continue;
      }

      let matched = false;
      const msgLower = message.toLowerCase();
      const kwLower = rule.keyword.toLowerCase();

      switch (rule.matchType) {
        case 'exact':
          matched = msgLower.includes(kwLower);
          break;
        case 'fuzzy':
          matched = fuzzyMatch(msgLower, kwLower);
          break;
        case 'regex':
          try {
            matched = new RegExp(rule.keyword, 'i').test(message);
          } catch (e) {}
          break;
        default:
          matched = msgLower.includes(kwLower);
      }

      if (matched) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      // 更新使用统计
      await prisma.replyRule.update({
        where: { id: matchedRule.id },
        data: {
          totalCount: { increment: 1 },
          weeklyCount: { increment: 1 },
          monthlyCount: { increment: 1 },
          lastMatched: new Date(),
        },
      });

      // 记录日志
      await prisma.replyLog.create({
        data: {
          userId,
          ruleId: matchedRule.id,
          keyword: matchedRule.keyword,
          matchType: matchedRule.matchType,
          replyContent: matchedRule.replyContent,
          platform: platform || 'unknown',
          sourceMessage: message,
          senderName: senderName || '未知',
          success: true,
        },
      });

      res.json({
        success: true,
        data: {
          matched: true,
          reply: matchedRule.replyContent,
          ruleId: matchedRule.id,
          keyword: matchedRule.keyword,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          matched: false,
          reply: null,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 模糊匹配辅助函数
function fuzzyMatch(text: string, keyword: string): boolean {
  if (text.includes(keyword)) return true;
  // 简单的模糊匹配：允许差一个字符
  if (keyword.length <= 3) return text.includes(keyword);
  for (let i = 0; i < keyword.length; i++) {
    const trimmed = keyword.slice(0, i) + keyword.slice(i + 1);
    if (trimmed.length > 2 && text.includes(trimmed)) return true;
  }
  return false;
}

export default router;
