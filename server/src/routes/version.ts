import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ==================== 版本管理 ====================

// 获取版本列表
router.get('/versions', async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { page = '1', pageSize = '20', platform } = req.query;

    const where: any = {};
    if (platform) where.platform = platform;

    const [versions, total] = await Promise.all([
      prisma.appVersion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.appVersion.count({ where }),
    ]);

    res.json({ data: versions, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 获取最新版本
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { platform = 'android' } = req.query;

    const latest = await prisma.appVersion.findFirst({
      where: { platform: platform as string },
      orderBy: { versionCode: 'desc' },
    });

    res.json(latest || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 创建版本（管理员）
router.post('/versions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { platform, versionName, versionCode, downloadUrl, forceUpdate, updateContent } = req.body;

    const version = await prisma.appVersion.create({
      data: {
        platform,
        version: versionName,
        buildNumber: Number(versionCode),
        downloadUrl,
        forceUpdate: forceUpdate || false,
        changelog: updateContent || '',
        status: 'released',
        releasedAt: new Date(),
      },
    });

    res.json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 更新版本（管理员）
router.put('/versions/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const { versionName, versionCode, downloadUrl, forceUpdate, updateContent, status } = req.body;

    const version = await prisma.appVersion.update({
      where: { id },
      data: {
        ...(versionName && { version: versionName }),
        ...(versionCode && { buildNumber: Number(versionCode) }),
        ...(downloadUrl && { downloadUrl }),
        forceUpdate: forceUpdate !== undefined ? forceUpdate : undefined,
        changelog: updateContent !== undefined ? updateContent : undefined,
        status: status || undefined,
      },
    });

    res.json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// APK端检查更新
router.post('/check', async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { currentVersion, currentBuildNumber, platform = 'android' } = req.body;

    if (!currentVersion) {
      return res.status(400).json({ error: 'currentVersion is required' });
    }

    const latest = await prisma.appVersion.findFirst({
      where: { platform: platform as string, status: 'released' },
      orderBy: { buildNumber: 'desc' },
    });

    if (!latest) {
      return res.json({ data: { hasUpdate: false } });
    }

    // 比较构建号
    const currentCode = Number(currentBuildNumber) || 0;
    const hasUpdate = latest.buildNumber > currentCode;

    res.json({
      data: hasUpdate ? {
        hasUpdate: true,
        version: latest.version,
        buildNumber: String(latest.buildNumber),
        releaseDate: latest.releasedAt?.toISOString() || latest.createdAt?.toISOString(),
        releaseNotes: latest.changelog || '',
        downloadUrl: latest.downloadUrl,
        isMandatory: latest.forceUpdate || false,
        platform: latest.platform,
      } : { hasUpdate: false },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除版本（管理员）
router.delete('/versions/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    await prisma.appVersion.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

export default router;
