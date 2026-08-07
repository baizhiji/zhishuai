import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// 文件上传配置
const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// 获取最近素材
router.get('/recent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = '10' } = req.query;

    const materials = await prisma.material.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    const total = await prisma.material.count({ where: { userId } });

    res.json({
      success: true,
      data: { list: materials, total, recentCount: materials.length },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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
    const { title, type, content } = req.body;

    const material = await prisma.material.create({
      data: {
        userId,
        title,
        type,
        content,
        status: 'unused',
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

// 上传文件（APK/WEB 通用）
router.post('/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).userId);
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: '未提供文件' });
      return;
    }

    const baseUrl = process.env.API_BASE_URL || '';
    const fileUrl = `${baseUrl}/uploads/materials/${file.filename}`;

    // 顺便创建一条素材记录
    const material = await prisma.material.create({
      data: {
        id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        title: file.originalname,
        type: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'document',
        content: fileUrl,
        status: 'unused',
      } as any,
    });

    res.json({ success: true, data: { url: fileUrl, id: material.id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
