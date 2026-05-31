import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取岗位列表
router.get('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [jobs, total] = await Promise.all([
      prisma.recruitmentPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.recruitmentPost.count({ where }),
    ]);

    res.json({ jobs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建岗位
router.post('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const jobData = {
      ...req.body,
      userId,
    };
    const job = await prisma.recruitmentPost.create({ data: jobData });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取岗位详情
router.get('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await prisma.recruitmentPost.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: '岗位不存在' });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新岗位
router.put('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await prisma.recruitmentPost.update({
      where: { id },
      data: req.body,
    });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除岗位
router.delete('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.recruitmentPost.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计数据
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const posts = await prisma.recruitmentPost.count({ where: { userId } });

    res.json({
      posts,
      applications: 0,
      interviews: 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取候选人列表 (candidates)
router.get('/candidates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const candidates = await prisma.candidate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(pageSize),
    });

    const total = await prisma.candidate.count({ where: { userId } });

    res.json({ candidates, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 面试安排 (interviews)
router.get('/interviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    // 返回空列表，后续可扩展
    res.json({
      interviews: [],
      total: 0,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 添加 posts 别名路由 (兼容APK端)
router.get('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [jobs, total] = await Promise.all([
      prisma.recruitmentPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.recruitmentPost.count({ where }),
    ]);

    res.json({ jobs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
