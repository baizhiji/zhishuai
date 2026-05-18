import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import {
  generateAcquisitionStrategy,
  generateContentIdeas,
  analyzeLeadQuality,
  generateFollowUpMessage,
  createAcquisitionAutomation,
  updateAcquisitionAutomation,
  getAcquisitionAutomations,
  batchAnalyzeLeads,
} from '../services/acquisition-ai.service';

const router = Router();
const prisma = new PrismaClient();

// 获取获客任务列表
router.get('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const tasks = await prisma.acquisitionTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.acquisitionTask.count({ where });

    res.json({
      success: true,
      data: { list: tasks, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建获客任务
router.post('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, platform, targetCount, content } = req.body;

    const task = await prisma.acquisitionTask.create({
      data: {
        userId,
        name,
        platform,
        targetCount: Number(targetCount) || 100,
        content,
        currentCount: 0,
        status: 'pending',
      },
    });

    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新任务状态
router.put('/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, currentCount } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (currentCount !== undefined) data.currentCount = currentCount;

    const task = await prisma.acquisitionTask.update({
      where: { id, userId },
      data,
    });

    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取线索列表
router.get('/leads', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const leads = await prisma.acquisitionLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.acquisitionLead.count({ where });

    res.json({
      success: true,
      data: { list: leads, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建线索
router.post('/leads', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, phone, source, notes } = req.body;

    const lead = await prisma.acquisitionLead.create({
      data: { userId, name, phone, source, notes, status: 'new' },
    });

    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新线索状态
router.put('/leads/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (notes) data.notes = notes;

    const lead = await prisma.acquisitionLead.update({
      where: { id, userId },
      data,
    });

    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计数据
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const taskCount = await prisma.acquisitionTask.count({ where: { userId } });
    const activeTaskCount = await prisma.acquisitionTask.count({ where: { userId, status: 'running' } });
    const leadCount = await prisma.acquisitionLead.count({ where: { userId } });
    const newLeadCount = await prisma.acquisitionLead.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    // 获取自动化统计
    const automationCount = await prisma.acquisitionAutomation.count({ where: { userId } });
    const activeAutomationCount = await prisma.acquisitionAutomation.count({ where: { userId, status: 'running' } });

    res.json({
      success: true,
      data: {
        totalTasks: taskCount,
        activeTasks: activeTaskCount,
        totalLeads: leadCount,
        newLeads: newLeadCount,
        totalAutomations: automationCount,
        activeAutomations: activeAutomationCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ AI 智能获客功能 ============

// AI 生成获客策略
router.post('/ai/strategy', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const { productInfo, targetAudience } = req.body;
    if (!productInfo || !targetAudience) {
      res.status(400).json({ error: '产品信息和目标受众不能为空' });
      return;
    }

    const strategy = await generateAcquisitionStrategy(productInfo, targetAudience, apiKey);

    res.json({
      success: true,
      data: strategy,
    });
  } catch (error: any) {
    console.error('生成获客策略错误:', error);
    res.status(500).json({ error: error.message || '策略生成失败' });
  }
});

// AI 生成内容创意
router.post('/ai/content-ideas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const { productInfo, platform } = req.body;
    if (!productInfo) {
      res.status(400).json({ error: '产品信息不能为空' });
      return;
    }

    const ideas = await generateContentIdeas(productInfo, platform || '全平台', apiKey);

    res.json({
      success: true,
      data: ideas,
    });
  } catch (error: any) {
    console.error('生成内容创意错误:', error);
    res.status(500).json({ error: error.message || '内容生成失败' });
  }
});

// AI 分析线索质量
router.post('/ai/analyze-lead/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const userId = (req as any).userId;
    const { id } = req.params;
    const { targetProfile } = req.body;

    const lead = await prisma.acquisitionLead.findFirst({
      where: { id, userId },
    });

    if (!lead) {
      res.status(404).json({ error: '线索不存在' });
      return;
    }

    const analysis = await analyzeLeadQuality(lead, targetProfile || {}, apiKey);

    // 更新线索
    await prisma.acquisitionLead.update({
      where: { id },
      data: {
        aiScore: analysis.score,
        aiQuality: analysis.quality,
        aiInsights: analysis.insights,
      },
    });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('分析线索错误:', error);
    res.status(500).json({ error: error.message || '分析失败' });
  }
});

// AI 生成跟进话术
router.post('/ai/followup-message/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const userId = (req as any).userId;
    const { id } = req.params;
    const { productInfo } = req.body;

    const lead = await prisma.acquisitionLead.findFirst({
      where: { id, userId },
    });

    if (!lead) {
      res.status(404).json({ error: '线索不存在' });
      return;
    }

    const followup = await generateFollowUpMessage(
      lead,
      productInfo || '智枢AI产品',
      apiKey
    );

    res.json({
      success: true,
      data: followup,
    });
  } catch (error: any) {
    console.error('生成跟进话术错误:', error);
    res.status(500).json({ error: error.message || '生成失败' });
  }
});

// 创建获客自动化
router.post('/ai/automation', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, platform, targetCount, productInfo, targetAudience, schedule } = req.body;

    if (!name || !platform || !productInfo) {
      res.status(400).json({ error: '缺少必填参数' });
      return;
    }

    const automation = await createAcquisitionAutomation(userId, {
      name,
      platform,
      targetCount: targetCount || 100,
      productInfo,
      targetAudience: targetAudience || '通用',
      schedule,
    });

    res.json({
      success: true,
      data: automation,
    });
  } catch (error: any) {
    console.error('创建自动化任务错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取自动化列表
router.get('/ai/automations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;

    const automations = await getAcquisitionAutomations(userId, status as string);

    res.json({
      success: true,
      data: automations,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新自动化状态
router.put('/ai/automation/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, currentLeads, notes } = req.body;

    const automation = await updateAcquisitionAutomation(id, userId, {
      status,
      currentLeads,
      notes,
    });

    res.json({
      success: true,
      data: automation,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量分析线索
router.post('/ai/batch-analyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const userId = (req as any).userId;
    const { targetProfile } = req.body;

    const results = await batchAnalyzeLeads(userId, apiKey, targetProfile);

    res.json({
      success: true,
      data: {
        total: results.length,
        results,
      },
    });
  } catch (error: any) {
    console.error('批量分析错误:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
