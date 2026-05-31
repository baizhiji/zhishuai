import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 获取话术模板列表
router.get('/scripts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '10', scenario, category } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (scenario) where.scenario = scenario;
    if (category) where.category = category;

    const [scripts, total] = await Promise.all([
      prisma.scriptTemplate.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scriptTemplate.count({ where }),
    ]);

    res.json({ scripts, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取话术模板失败:', error);
    res.status(500).json({ error: '获取话术模板失败' });
  }
});

// 获取单个话术模板
router.get('/scripts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const script = await prisma.scriptTemplate.findFirst({
      where: { id, userId },
    });

    if (!script) {
      return res.status(404).json({ error: '话术模板不存在' });
    }

    res.json(script);
  } catch (error) {
    console.error('获取话术模板失败:', error);
    res.status(500).json({ error: '获取话术模板失败' });
  }
});

// 创建话术模板
router.post('/scripts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, scenario, category, content, style, isAI } = req.body;

    if (!name || !scenario || !content) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const script = await prisma.scriptTemplate.create({
      data: {
        userId,
        name,
        scenario: scenario || 'common',
        category: category || '通用',
        content,
        style: style || 'professional',
        isAI: isAI || false,
      },
    });

    res.json(script);
  } catch (error) {
    console.error('创建话术模板失败:', error);
    res.status(500).json({ error: '创建话术模板失败' });
  }
});

// 更新话术模板
router.put('/scripts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { name, scenario, category, content, style, isAI, status } = req.body;

    const existing = await prisma.scriptTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '话术模板不存在' });
    }

    const script = await prisma.scriptTemplate.update({
      where: { id },
      data: {
        name,
        scenario,
        category,
        content,
        style,
        isAI,
        status,
      },
    });

    res.json(script);
  } catch (error) {
    console.error('更新话术模板失败:', error);
    res.status(500).json({ error: '更新话术模板失败' });
  }
});

// 删除话术模板
router.delete('/scripts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.scriptTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '话术模板不存在' });
    }

    await prisma.scriptTemplate.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除话术模板失败:', error);
    res.status(500).json({ error: '删除话术模板失败' });
  }
});

// 获取对话记录
router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '20', templateId, feedback } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (templateId) where.templateId = templateId;
    if (feedback) where.feedback = feedback;

    const [conversations, total] = await Promise.all([
      prisma.conversationLog.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          template: { select: { name: true } },
        },
      }),
      prisma.conversationLog.count({ where }),
    ]);

    res.json({ conversations, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取对话记录失败:', error);
    res.status(500).json({ error: '获取对话记录失败' });
  }
});

// 创建对话记录
router.post('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sender, receiver, originalMessage, generatedReply, templateId, scenario, style, feedback } = req.body;

    const conversation = await prisma.conversationLog.create({
      data: {
        userId,
        sender: sender || 'system',
        receiver: receiver || 'user',
        originalMessage,
        generatedReply,
        templateId,
        scenario: scenario || 'common',
        style: style || 'professional',
        feedback,
      },
    });

    res.json(conversation);
  } catch (error) {
    console.error('创建对话记录失败:', error);
    res.status(500).json({ error: '创建对话记录失败' });
  }
});

// 更新对话反馈
router.put('/conversations/:id/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { feedback } = req.body;

    const existing = await prisma.conversationLog.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '对话记录不存在' });
    }

    const conversation = await prisma.conversationLog.update({
      where: { id },
      data: { feedback },
    });

    res.json(conversation);
  } catch (error) {
    console.error('更新对话反馈失败:', error);
    res.status(500).json({ error: '更新对话反馈失败' });
  }
});

// 获取话术统计
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [scripts, conversations, feedbackStats] = await Promise.all([
      prisma.scriptTemplate.count({ where: { userId } }),
      prisma.conversationLog.count({ where: { userId } }),
      prisma.conversationLog.groupBy({
        by: ['feedback'],
        where: { userId },
        _count: true,
      }),
    ]);

    const goodCount = feedbackStats.find(s => s.feedback === 'good')?._count || 0;
    const badCount = feedbackStats.find(s => s.feedback === 'bad')?._count || 0;
    const successRate = conversations > 0 ? Math.round((goodCount / conversations) * 100) : 0;

    res.json({
      totalScripts: scripts,
      totalConversations: conversations,
      goodCount,
      badCount,
      successRate,
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

export default router;
