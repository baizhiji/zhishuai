/**
 * Admin: 贴牌配置管理
 * 仅限 Admin 角色操作
 */
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';


const router = Router();
// 所有路由都需要 admin 权限
router.use(authMiddleware, adminMiddleware);

// 获取贴牌配置（租户级别）
router.get('/branding', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let config = await prisma.brandingConfig.findUnique({
      where: { userId: userId as string }
    });

    // 如果没有配置，返回默认配置
    if (!config) {
      config = await prisma.brandingConfig.create({
        data: {
          userId: userId as string,
          appName: '智枢AI',
          themeColor: '#1890ff',
          primaryColor: '#1890ff',
          secondaryColor: '#52c41a'
        }
      });
    }

    res.json({ data: config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新贴牌配置
router.put('/branding/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { appName, logo, favicon, themeColor, primaryColor, secondaryColor, welcomeText, description } = req.body;

    const config = await prisma.brandingConfig.upsert({
      where: { userId },
      update: {
        ...(appName !== undefined && { appName }),
        ...(logo !== undefined && { logo }),
        ...(favicon !== undefined && { favicon }),
        ...(themeColor !== undefined && { themeColor }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
        ...(welcomeText !== undefined && { welcomeText }),
        ...(description !== undefined && { description })
      },
      create: {
        userId,
        appName: appName || '智枢AI',
        themeColor: themeColor || '#1890ff',
        primaryColor: primaryColor || '#1890ff',
        secondaryColor: secondaryColor || '#52c41a'
      }
    });

    res.json({ data: config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 上传LOGO
router.post('/branding/:userId/logo', async (req, res) => {
  try {
    const { userId } = req.params;
    const { logo } = req.body;

    const config = await prisma.brandingConfig.update({
      where: { userId },
      data: { logo }
    });

    res.json({ data: config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取全局默认贴牌配置（Admin查看）
router.get('/branding/default', async (req, res) => {
  try {
    let config = await prisma.brandingConfig.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!config) {
      config = {
        id: 'default',
        userId: 'system',
        appName: '智枢AI',
        logo: null,
        favicon: null,
        themeColor: '#1890ff',
        primaryColor: '#1890ff',
        secondaryColor: '#52c41a',
        welcomeText: '欢迎使用智枢AI',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    res.json({ data: config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
