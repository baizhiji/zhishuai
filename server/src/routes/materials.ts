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
// 图片格式白名单：拦截 image-size 无修复版本的恶意格式（JXL/HEIF/ICNS 可触发解析死循环 DoS）
const IMAGE_MIME_WHITELIST = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
]);
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') && !IMAGE_MIME_WHITELIST.has(file.mimetype)) {
      cb(new Error('不支持的图片格式，请使用 JPEG/PNG/GIF/WEBP/SVG/BMP/TIFF/ICO'));
      return;
    }
    cb(null, true);
  },
});

/**
 * 服务端兜底：把多图素材的 usagePlatforms（JSON 数组字符串）解析为 images 数组，
 * 保证电脑端 / 手机端等新老客户端都能取到完整图片列表。
 */
function toClientMaterial(material: any) {
  let extraImages: string[] = [];
  try {
    const parsed =
      typeof material.usagePlatforms === 'string'
        ? JSON.parse(material.usagePlatforms)
        : material.usagePlatforms;
    if (Array.isArray(parsed)) {
      extraImages = parsed.filter((u: unknown) => typeof u === 'string' && u.length > 0);
    }
  } catch {
    // 忽略非法 JSON，回退到单图字段
  }
  const images = extraImages.length > 0 ? extraImages : material.fileUrl ? [material.fileUrl] : [];
  return { ...material, images };
}

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
      data: { list: materials.map(toClientMaterial), total, recentCount: materials.length },
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
    if (status) {
      if (status === 'downloaded') where.downloadedAt = { not: null };
      else if (status === 'undownloaded') where.downloadedAt = null;
      else where.status = status; // 兼容旧语义 used/unused
    }
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
      data: { list: materials.map(toClientMaterial), total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建素材
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, type, content, thumbnail, fileType, fileUrl, images } = req.body;
    if (!title || !type) {
      res.status(400).json({ success: false, error: '缺少必填字段 title/type' });
      return;
    }

    // 支持多图生成结果：images 数组优先，fileUrl/thumbnail 兜底
    const imageList: string[] = Array.isArray(images)
      ? images.filter((u: unknown) => typeof u === 'string' && u.length > 0)
      : [];
    const firstMedia = imageList[0] || (fileUrl ? String(fileUrl) : undefined);

    const material = await prisma.material.create({
      data: {
        userId,
        title: String(title),
        type: String(type),
        content: content ? String(content) : undefined,
        thumbnail: thumbnail ? String(thumbnail) : imageList[0] || undefined,
        fileType: fileType ? String(fileType) : imageList.length ? 'image' : undefined,
        fileUrl: firstMedia || undefined,
        // 多图素材的完整图片列表暂存于 usagePlatforms（JSON 数组字符串，不影响现有字段语义）
        usagePlatforms: imageList.length > 1 ? JSON.stringify(imageList) : undefined,
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
    const allowedFields = ['title', 'type', 'content', 'status', 'downloadedAt', 'thumbnail', 'fileType', 'fileUrl'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ success: false, error: '没有可更新的字段' });
      return;
    }

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

    const existing = await prisma.material.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: '素材不存在' });
      return;
    }
    // 清理关联的上传文件
    if (existing.content && existing.content.includes('/uploads/materials/')) {
      const filename = existing.content.split('/uploads/materials/').pop();
      if (filename && !filename.includes('/') && !filename.includes('..')) {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

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
router.post('/upload', authMiddleware, async (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err: any) => {
    // multer/fileFilter 错误属于客户端问题，返回 4xx 而非 500
    if (err) {
      const isMulter = err instanceof multer.MulterError;
      const status = isMulter && err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ success: false, error: err.message });
      return;
    }
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
});

export default router;
