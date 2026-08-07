import { Router } from 'express';
import { prisma } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
const router = Router();

// ============================================
// 用户功能开关 API（Customer / APK 使用）
// Base: /api/features
// ============================================

// 获取所有全局功能开关（admin/agent 用）
router.get('/', async (req, res) => {
  try {
    const globalFeatures = await prisma.featureSwitch.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ code: 200, message: 'ok', data: globalFeatures });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取当前用户的功能开关状态
router.get('/my-features', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(400).json({ code: 400, message: 'userId is required', data: null });
    }
    const globalFeatures = await prisma.featureSwitch.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    const userOverrides = await prisma.userFeatureSwitch.findMany({
      where: { userId: userId as string },
    });
    const featuresWithStatus = globalFeatures.map(feature => {
      const override = userOverrides.find(o => o.featureCode === feature.code);
      return { ...feature, enabled: override ? override.enabled : feature.enabled };
    });
    res.json({ code: 200, message: 'ok', data: featuresWithStatus });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取用户可用的功能列表（简化版，供APK首页使用）
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(400).json({ code: 400, message: 'userId is required', data: null });
    }
    const globalFeatures = await prisma.featureSwitch.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, name: true, icon: true, description: true },
    });
    const userOverrides = await prisma.userFeatureSwitch.findMany({
      where: { userId: userId as string },
    });
    const availableFeatures = globalFeatures
      .filter(feature => {
        const override = userOverrides.find(o => o.featureCode === feature.code);
        return override ? override.enabled : true;
      })
      .map(feature => ({
        code: feature.code, name: feature.name,
        icon: feature.icon, description: feature.description,
      }));
    res.json({ code: 200, message: 'ok', data: availableFeatures });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取单个功能开关状态
router.get('/:featureCode', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { featureCode } = req.params;
    if (!userId) {
      return res.status(400).json({ code: 400, message: 'userId is required', data: null });
    }
    const globalFeature = await prisma.featureSwitch.findUnique({
      where: { code: featureCode },
    });
    if (!globalFeature) {
      return res.status(404).json({ code: 404, message: '功能不存在', data: null });
    }
    const override = await prisma.userFeatureSwitch.findUnique({
      where: { userId_featureCode: { userId: userId as string, featureCode } },
    });
    res.json({
      code: 200, message: 'ok',
      data: { ...globalFeature, enabled: override ? override.enabled : globalFeature.enabled },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 设置用户功能开关 — 仅 admin/agent 可修改
router.put('/:featureCode', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).user?.role;
    const { featureCode } = req.params;
    const { enabled } = req.body;
    if (!userId) return res.status(400).json({ code: 400, message: 'userId required', data: null });
    if (userRole === 'customer')
      return res.status(403).json({ code: 403, message: '无权修改功能开关', data: null });

    const feature = await prisma.featureSwitch.findUnique({ where: { code: featureCode } });
    if (!feature) return res.status(404).json({ code: 404, message: '功能不存在', data: null });

    const featureSwitch = await prisma.userFeatureSwitch.upsert({
      where: { userId_featureCode: { userId: userId as string, featureCode } },
      update: { enabled },
      create: { userId: userId as string, featureCode, enabled },
    });
    res.json({ code: 200, message: 'ok', data: featureSwitch });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 批量设置
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { features } = req.body;
    const userId = (req as any).userId;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(400).json({ code: 400, message: 'userId required', data: null });
    if (userRole === 'customer')
      return res.status(403).json({ code: 403, message: '无权修改功能开关', data: null });
    if (!features || !Array.isArray(features))
      return res.status(400).json({ code: 400, message: 'features must be array', data: null });

    const updates = await Promise.all(
      features.map(({ featureCode, enabled }: { featureCode: string; enabled: boolean }) =>
        prisma.userFeatureSwitch.upsert({
          where: { userId_featureCode: { userId, featureCode } },
          update: { enabled },
          create: { userId, featureCode, enabled },
        })
      )
    );
    res.json({ code: 200, message: 'ok', data: updates });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 重置
router.delete('/:featureCode', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).user?.role;
    const { featureCode } = req.params;
    if (!userId) return res.status(400).json({ code: 400, message: 'userId required', data: null });
    if (userRole === 'customer')
      return res.status(403).json({ code: 403, message: '无权修改', data: null });
    await prisma.userFeatureSwitch.deleteMany({ where: { userId: userId as string, featureCode } });
    res.json({ code: 200, message: 'ok', data: null });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(400).json({ code: 400, message: 'userId required', data: null });
    if (userRole === 'customer')
      return res.status(403).json({ code: 403, message: '无权修改', data: null });
    await prisma.userFeatureSwitch.deleteMany({ where: { userId } });
    res.json({ code: 200, message: 'ok', data: null });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
