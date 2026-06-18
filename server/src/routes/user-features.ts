import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';


const router = Router();
router.use(authMiddleware);

// ============================================
// 用户功能开关 API（Customer / APK 使用）
// ============================================

// 获取用户的功能开关状态（包含全局开关和用户覆盖）
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 获取所有全局功能开关
    const globalFeatures = await prisma.featureSwitch.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        subFeatures: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    // 获取用户的功能开关覆盖
    const userOverrides = await prisma.userFeatureSwitch.findMany({
      where: { userId: userId as string }
    });

    // 合并数据
    const featuresWithStatus = globalFeatures.map(feature => {
      const override = userOverrides.find(o => o.featureCode === feature.code);
      return {
        ...feature,
        enabled: override ? override.enabled : feature.enabled,
        subFeatures: feature.subFeatures.map(sub => ({
          ...sub,
          // 子功能继承主功能的开关状态
          effectiveEnabled: sub.enabled && (override ? override.enabled : feature.enabled)
        }))
      };
    });

    res.json({ data: featuresWithStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户可用的功能列表（简化版，供APK首页使用）
router.get('/available', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 获取所有全局功能开关
    const globalFeatures = await prisma.featureSwitch.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        code: true,
        name: true,
        icon: true,
        description: true
      }
    });

    // 获取用户的功能开关覆盖
    const userOverrides = await prisma.userFeatureSwitch.findMany({
      where: { userId: userId as string }
    });

    // 过滤出可用的功能
    const availableFeatures = globalFeatures
      .filter(feature => {
        const override = userOverrides.find(o => o.featureCode === feature.code);
        return override ? override.enabled : true;
      })
      .map(feature => ({
        code: feature.code,
        name: feature.name,
        icon: feature.icon,
        description: feature.description
      }));

    res.json({ data: availableFeatures });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个功能开关状态
router.get('/:featureCode', async (req, res) => {
  try {
    const { userId } = req.query;
    const { featureCode } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 获取全局功能开关
    const globalFeature = await prisma.featureSwitch.findUnique({
      where: { code: featureCode },
      include: {
        subFeatures: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!globalFeature) {
      return res.status(404).json({ error: '功能不存在' });
    }

    // 获取用户覆盖
    const override = await prisma.userFeatureSwitch.findUnique({
      where: {
        userId_featureCode: {
          userId: userId as string,
          featureCode
        }
      }
    });

    res.json({
      data: {
        ...globalFeature,
        enabled: override ? override.enabled : globalFeature.enabled,
        subFeatures: globalFeature.subFeatures.map(sub => ({
          ...sub,
          effectiveEnabled: sub.enabled && (override ? override.enabled : globalFeature.enabled)
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 设置用户功能开关（用户自己设置）
router.put('/:featureCode', async (req, res) => {
  try {
    const { userId } = req.query;
    const { featureCode } = req.params;
    const { enabled } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 检查功能是否存在
    const feature = await prisma.featureSwitch.findUnique({
      where: { code: featureCode }
    });

    if (!feature) {
      return res.status(404).json({ error: '功能不存在' });
    }

    const featureSwitch = await prisma.userFeatureSwitch.upsert({
      where: {
        userId_featureCode: {
          userId: userId as string,
          featureCode
        }
      },
      update: { enabled },
      create: {
        userId: userId as string,
        featureCode,
        enabled
      }
    });

    res.json({ data: featureSwitch });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量设置用户功能开关
router.put('/', async (req, res) => {
  try {
    const { userId, features } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ error: 'features must be an array' });
    }

    // 批量更新
    const updates = await Promise.all(
      features.map(({ featureCode, enabled }: { featureCode: string; enabled: boolean }) =>
        prisma.userFeatureSwitch.upsert({
          where: {
            userId_featureCode: {
              userId,
              featureCode
            }
          },
          update: { enabled },
          create: {
            userId,
            featureCode,
            enabled
          }
        })
      )
    );

    res.json({ message: '设置成功', data: updates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 重置用户功能开关到默认
router.delete('/:featureCode', async (req, res) => {
  try {
    const { userId } = req.query;
    const { featureCode } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await prisma.userFeatureSwitch.deleteMany({
      where: {
        userId: userId as string,
        featureCode
      }
    });

    res.json({ message: '已重置为默认' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 重置所有用户功能开关到默认
router.delete('/', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await prisma.userFeatureSwitch.deleteMany({
      where: { userId }
    });

    res.json({ message: '所有功能开关已重置为默认' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
