import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取素材列表
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, status, keyword, page = 1, pageSize = 20 } = req.query;

    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.used = status === 'used';
    if (keyword) {
      where.OR = [
        { title: { contains: String(keyword) } },
        { content: { contains: String(keyword) } },
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.material.count({ where });

    res.json({
      success: true,
      data: { list: materials, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建素材
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, type, content, url, tags } = req.body;

    const material = await prisma.material.create({
      data: {
        userId,
        title,
        type,
        content,
        url,
        tags: tags || [],
        used: false,
      },
    });

    res.json({ success: true, data: material });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新素材
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const updateData = req.body;

    const material = await prisma.material.update({
      where: { id, userId },
      data: updateData,
    });

    res.json({ success: true, data: material });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除素材
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.material.delete({ where: { id, userId } });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量删除
router.post('/batch-delete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { ids } = req.body;

    await prisma.material.deleteMany({
      where: { id: { in: ids }, userId },
    });

    res.json({ success: true, message: '批量删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
