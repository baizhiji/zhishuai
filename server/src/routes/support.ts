import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// 上传配置：企业微信二维码
const qrcodeDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(qrcodeDir)) {
  fs.mkdirSync(qrcodeDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, qrcodeDir),
    filename: (_req, file, cb) => cb(null, `support_qrcode_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 PNG/JPG/JPEG/GIF/WEBP 格式图片'));
    }
  },
});

// 获取当前企业微信二维码（所有角色均可访问，无需登录）
router.get('/qrcode', async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const setting = await prisma.setting.findFirst({
      where: { key: 'support_qrcode' },
    });
    res.json({
      success: true,
      data: {
        url: setting?.value || '',
        description: setting ? '已配置企业微信二维码' : '尚未配置二维码',
      },
    });
  } catch (err: any) {
    console.error('[SupportQRCode] 获取二维码失败:', err);
    res.status(500).json({ error: err.message || '获取失败' });
  }
});

// 管理员上传/更新企业微信二维码
router.post('/qrcode', authMiddleware, adminMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const file = req.file;
    const userId = (req as any).userId;

    let url = '';

    if (file) {
      // 新上传的文件
      url = `/uploads/${file.filename}`;
    } else if (req.body.url) {
      // 直接提供URL
      url = req.body.url;
    } else {
      return res.status(400).json({ success: false, error: '请上传二维码图片或提供图片URL' });
    }

    // 删除旧图片
    const oldSetting = await prisma.setting.findFirst({
      where: { key: 'support_qrcode' },
    });
    if (oldSetting?.value && oldSetting.value.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../public', oldSetting.value);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // 保存到Setting表（全局配置，先删后插）
    await prisma.setting.deleteMany({
      where: { key: 'support_qrcode' },
    });
    await prisma.setting.create({
      data: { userId, key: 'support_qrcode', value: url },
    });

    res.json({ success: true, data: { url } });
  } catch (err: any) {
    console.error('[SupportQRCode] 上传二维码失败:', err);
    res.status(500).json({ success: false, error: err.message || '上传失败' });
  }
});

export default router;
