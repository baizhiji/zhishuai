import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==================== 话术模板管理 API ====================

// 获取话术模板列表
router.get('/templates', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const { scenario, category, status } = req.query;
    
    const where: any = { userId: userId as string };
    if (scenario) where.scenario = scenario;
    if (category) where.category = category;
    if (status !== undefined) where.status = status === 'true';
    
    const templates = await prisma.scriptTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建话术模板
router.post('/templates', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { name, scenario, category, content, style, status, isAI } = req.body;
    
    const template = await prisma.scriptTemplate.create({
      data: {
        userId,
        name,
        scenario,
        category,
        content,
        style,
        status: status ?? true,
        isAI: isAI ?? false,
        useCount: 0,
        successRate: 85,
      },
    });
    
    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新话术模板
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, scenario, category, content, style, status, isAI } = req.body;
    
    const template = await prisma.scriptTemplate.update({
      where: { id },
      data: {
        name,
        scenario,
        category,
        content,
        style,
        status,
        isAI,
        updatedAt: new Date(),
      },
    });
    
    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除话术模板
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.scriptTemplate.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新模板使用统计
router.post('/templates/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const { success } = req.body;
    
    const template = await prisma.scriptTemplate.update({
      where: { id },
      data: {
        useCount: { increment: 1 },
        successRate: success ? { increment: 1 } : undefined,
      },
    });
    
    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Update template usage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 对话记录 API ====================

// 获取对话记录
router.get('/conversations', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const { page = '1', pageSize = '20', scenario } = req.query;
    
    const where: any = { userId: userId as string };
    if (scenario) where.scenario = scenario;
    
    const [conversations, total] = await Promise.all([
      prisma.conversationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.conversationLog.count({ where }),
    ]);
    
    res.json({ success: true, data: conversations, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建对话记录
router.post('/conversations', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { sender, receiver, originalMessage, generatedReply, templateId, scenario, style } = req.body;
    
    const conversation = await prisma.conversationLog.create({
      data: {
        userId,
        sender,
        receiver,
        originalMessage,
        generatedReply,
        templateId,
        scenario,
        style,
      },
    });
    
    // 更新模板使用次数
    if (templateId) {
      await prisma.scriptTemplate.update({
        where: { id: templateId },
        data: { useCount: { increment: 1 } },
      });
    }
    
    res.json({ success: true, data: conversation });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新对话反馈
router.put('/conversations/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    
    const conversation = await prisma.conversationLog.update({
      where: { id },
      data: { feedback },
    });
    
    // 如果反馈为差评，降低模板成功率
    if (feedback === 'bad' && conversation.templateId) {
      await prisma.scriptTemplate.update({
        where: { id: conversation.templateId },
        data: { successRate: { decrement: 2 } },
      });
    }
    
    res.json({ success: true, data: conversation });
  } catch (error: any) {
    console.error('Update feedback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 统计数据 API ====================

// 获取话术统计数据
router.get('/stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    
    const [templates, conversations, todayConversations] = await Promise.all([
      prisma.scriptTemplate.findMany({ where: { userId: userId as string } }),
      prisma.conversationLog.findMany({ where: { userId: userId as string } }),
      prisma.conversationLog.count({
        where: {
          userId: userId as string,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);
    
    const totalUsage = templates.reduce((acc, t) => acc + t.useCount, 0);
    const avgSuccessRate = templates.length > 0
      ? Math.round(templates.reduce((acc, t) => acc + t.successRate, 0) / templates.length)
      : 0;
    
    res.json({
      success: true,
      data: {
        totalTemplates: templates.length,
        activeTemplates: templates.filter(t => t.status).length,
        aiGenerated: templates.filter(t => t.isAI).length,
        totalUsage,
        avgSuccessRate,
        todayUsage: todayConversations,
        totalConversations: conversations.length,
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
