import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==================== 获客自动化 API ====================

// 获取获客任务列表
router.get('/tasks', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const { status } = req.query;
    
    const where: any = { userId: userId as string };
    if (status) where.status = status;
    
    const tasks = await prisma.acquisitionTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        leads: {
          select: {
            id: true,
            status: true,
            interestLevel: true,
            createdAt: true,
          },
        },
      },
    });

    // 计算统计数据
    const tasksWithStats = tasks.map(task => {
      const leads = task.leads || [];
      const sentCount = leads.length;
      const repliedCount = leads.filter(l => l.status === 'replied' || l.status === 'converted').length;
      const scannedCount = leads.filter(l => l.scannedQrcode).length;
      const convertedCount = leads.filter(l => l.status === 'converted').length;
      
      return {
        ...task,
        sentCount,
        repliedCount,
        scannedCount,
        convertedCount,
        replyRate: sentCount > 0 ? Math.round((repliedCount / sentCount) * 100) : 0,
        scanRate: repliedCount > 0 ? Math.round((scannedCount / repliedCount) * 100) : 0,
        convertRate: scannedCount > 0 ? Math.round((convertedCount / scannedCount) * 100) : 0,
      };
    });
    
    res.json({ success: true, data: tasksWithStats });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建获客任务
router.post('/tasks', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { name, targetCount, targetKeywords, content, qrcodeEnabled, delay, dailyLimit, scheduledAt } = req.body;
    
    const task = await prisma.acquisitionTask.create({
      data: {
        userId,
        name,
        targetCount: targetCount || 0,
        targetKeywords: targetKeywords || [],
        content,
        qrcodeEnabled: qrcodeEnabled ?? true,
        delay: delay || 30,
        dailyLimit: dailyLimit || 100,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'pending',
      },
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新获客任务
router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetCount, targetKeywords, content, qrcodeEnabled, delay, dailyLimit, scheduledAt, status } = req.body;
    
    const task = await prisma.acquisitionTask.update({
      where: { id },
      data: {
        name,
        targetCount,
        targetKeywords,
        content,
        qrcodeEnabled,
        delay,
        dailyLimit,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status,
      },
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除获客任务
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.acquisitionTask.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动任务
router.post('/tasks/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.acquisitionTask.update({
      where: { id },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Start task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 暂停任务
router.post('/tasks/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.acquisitionTask.update({
      where: { id },
      data: {
        status: 'paused',
      },
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Pause task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 完成任务
router.post('/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.acquisitionTask.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Complete task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 潜客管理 API ====================

// 获取潜客列表
router.get('/leads', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const { taskId, status, interestLevel, page = '1', pageSize = '20' } = req.query;
    
    const where: any = { task: { userId: userId as string } };
    if (taskId) where.taskId = taskId;
    if (status) where.status = status;
    if (interestLevel) where.interestLevel = interestLevel;
    
    const [leads, total] = await Promise.all([
      prisma.acquisitionLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          task: { select: { name: true } },
          followups: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.acquisitionLead.count({ where }),
    ]);
    
    res.json({ success: true, data: leads, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    console.error('Get leads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建潜客
router.post('/leads', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { taskId, name, phone, platform, source, interestLevel } = req.body;
    
    const lead = await prisma.acquisitionLead.create({
      data: {
        taskId,
        name,
        phone,
        platform: platform || 'unknown',
        source: source || 'manual',
        interestLevel: interestLevel || 'medium',
        status: 'new',
        userId,
      },
    });
    
    res.json({ success: true, data: lead });
  } catch (error: any) {
    console.error('Create lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新潜客状态
router.put('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, interestLevel, remark } = req.body;
    
    const lead = await prisma.acquisitionLead.update({
      where: { id },
      data: {
        status,
        interestLevel,
        remark,
      },
    });
    
    res.json({ success: true, data: lead });
  } catch (error: any) {
    console.error('Update lead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 标记潜客已回复
router.post('/leads/:id/replied', async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await prisma.acquisitionLead.update({
      where: { id },
      data: {
        status: 'replied',
        repliedAt: new Date(),
      },
    });
    
    res.json({ success: true, data: lead });
  } catch (error: any) {
    console.error('Mark replied error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 标记潜客已转化
router.post('/leads/:id/converted', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerData } = req.body;
    
    const lead = await prisma.acquisitionLead.update({
      where: { id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
      },
    });
    
    // 如果有客户数据，可以创建客户记录
    if (customerData) {
      await prisma.crmCustomer.create({
        data: {
          userId: lead.userId,
          name: customerData.name || lead.name,
          phone: customerData.phone || lead.phone,
          source: 'acquisition',
          tags: ['潜客转化'],
        },
      });
    }
    
    res.json({ success: true, data: lead });
  } catch (error: any) {
    console.error('Mark converted error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 跟进记录 API ====================

// 添加跟进记录
router.post('/leads/:id/followup', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, nextFollowupDate } = req.body;
    const userId = (req as any).user?.id;
    
    const followup = await prisma.leadFollowup.create({
      data: {
        leadId: id,
        userId,
        content,
        nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate) : null,
      },
    });
    
    res.json({ success: true, data: followup });
  } catch (error: any) {
    console.error('Add followup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取跟进记录
router.get('/leads/:id/followups', async (req, res) => {
  try {
    const { id } = req.params;
    
    const followups = await prisma.leadFollowup.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: followups });
  } catch (error: any) {
    console.error('Get followups error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
