import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==================== 数字人管理 API ====================

// 获取数字人列表
router.get('/humans', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    
    const humans = await prisma.digitalHuman.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: humans });
  } catch (error: any) {
    console.error('Get digital humans error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建数字人
router.post('/humans', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { name, gender, style, voice, description, avatar } = req.body;
    
    const human = await prisma.digitalHuman.create({
      data: {
        userId,
        name,
        gender,
        style,
        voice,
        description,
        avatar,
        status: 'active',
      },
    });
    
    res.json({ success: true, data: human });
  } catch (error: any) {
    console.error('Create digital human error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新数字人
router.put('/humans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, style, voice, description, avatar, status } = req.body;
    
    const human = await prisma.digitalHuman.update({
      where: { id },
      data: {
        name,
        gender,
        style,
        voice,
        description,
        avatar,
        status,
      },
    });
    
    res.json({ success: true, data: human });
  } catch (error: any) {
    console.error('Update digital human error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除数字人
router.delete('/humans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.digitalHuman.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete digital human error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 视频模板 API ====================

// 获取视频模板列表
router.get('/templates', async (req, res) => {
  try {
    const templates = await prisma.videoTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 视频任务 API ====================

// 获取视频生成任务列表
router.get('/tasks', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;
    const { status } = req.query;
    
    const where: any = { userId: userId as string };
    if (status) where.status = status;
    
    const tasks = await prisma.videoTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('Get video tasks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建视频生成任务
router.post('/tasks', async (req, res) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    const { humanId, templateId, title, script, backgroundMusic } = req.body;
    
    const task = await prisma.videoTask.create({
      data: {
        userId,
        humanId,
        templateId,
        title,
        script,
        backgroundMusic,
        status: 'pending',
        progress: 0,
      },
    });
    
    // 更新数字人使用次数
    if (humanId) {
      await prisma.digitalHuman.update({
        where: { id: humanId },
        data: { usageCount: { increment: 1 } },
      });
    }
    
    // 更新模板使用次数
    if (templateId) {
      await prisma.videoTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      });
    }
    
    // TODO: 调用实际视频生成服务
    // 这里可以触发异步任务处理
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Create video task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取任务状态
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.videoTask.findUnique({
      where: { id },
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 取消任务
router.post('/tasks/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.videoTask.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Cancel task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
