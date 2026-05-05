import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取发布历史
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId: userId as string } : {};
    
    const history = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    res.json({ data: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建发布任务
router.post('/tasks', async (req, res) => {
  try {
    const { materialId, platform, accountIds } = req.body;
    
    const tasks = accountIds.map((accountId: string) => ({
      materialId,
      platform,
      accountId,
      status: 'pending',
    }));
    
    res.json({ data: tasks, message: '发布任务已创建' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
