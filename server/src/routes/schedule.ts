/**
 * 定时发布 API 路由
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createScheduledTask,
  getScheduledTasks,
  cancelScheduledTask,
  deleteScheduledTask
} from '../services/schedule.service';

const router = Router();

/**
 * 创建定时发布任务
 * POST /api/publish/schedule
 */
router.post('/schedule', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { title, content, mediaUrls, platforms, scheduledAt } = req.body;
    
    if (!title || !content || !platforms || !scheduledAt) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const scheduledTime = new Date(scheduledAt);
    if (scheduledTime <= new Date()) {
      return res.status(400).json({ error: '定时时间必须晚于当前时间' });
    }
    
    const task = await createScheduledTask(userId, {
      title,
      content,
      mediaUrls,
      platforms,
      scheduledAt: scheduledTime
    });
    
    res.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        scheduledAt: task.scheduledAt,
        status: task.status
      }
    });
  } catch (error: any) {
    console.error('创建定时任务失败:', error);
    res.status(500).json({ error: '创建定时任务失败' });
  }
});

/**
 * 获取定时任务列表
 * GET /api/publish/schedule
 */
router.get('/schedule', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { status, limit, offset } = req.query;
    
    const result = await getScheduledTasks(userId, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('获取定时任务失败:', error);
    res.status(500).json({ error: '获取定时任务失败' });
  }
});

/**
 * 取消定时任务
 * DELETE /api/publish/schedule/:id
 */
router.delete('/schedule/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const result = await cancelScheduledTask(id, userId);
    
    if (result.count === 0) {
      return res.status(404).json({ error: '任务不存在或无法取消' });
    }
    
    res.json({
      success: true,
      message: '任务已取消'
    });
  } catch (error: any) {
    console.error('取消定时任务失败:', error);
    res.status(500).json({ error: '取消定时任务失败' });
  }
});

/**
 * 删除定时任务
 * DELETE /api/publish/schedule/:id/permanent
 */
router.delete('/schedule/:id/permanent', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const result = await deleteScheduledTask(id, userId);
    
    if (result.count === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    res.json({
      success: true,
      message: '任务已删除'
    });
  } catch (error: any) {
    console.error('删除定时任务失败:', error);
    res.status(500).json({ error: '删除定时任务失败' });
  }
});

export default router;
