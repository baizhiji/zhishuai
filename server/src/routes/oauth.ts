/**
 * 扫码授权路由
 * 使用浏览器自动化获取平台二维码并检测登录状态
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  createAuthSession, 
  checkAuthStatus, 
  cancelAuthSession,
  getPlatformList
} from '../services/browser-auth.service';
import { PLATFORM_CONFIGS } from '../services/browser-auth.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * 获取支持的平台列表
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = getPlatformList().map(p => ({
      code: p.code,
      name: p.name,
      status: p.status,
      icon: PLATFORM_CONFIGS[p.code]?.icon,
      color: PLATFORM_CONFIGS[p.code]?.color
    }));
    
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建授权会话，获取二维码
 * POST /api/oauth/sessions
 */
router.post('/sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.body;
    
    if (!platform) {
      return res.status(400).json({ success: false, error: '请选择平台' });
    }
    
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      return res.status(400).json({ success: false, error: '不支持的平台' });
    }
    
    if (config.status === 'coming') {
      return res.status(400).json({ success: false, error: `${config.name} 暂未开放，敬请期待` });
    }
    
    console.log(`[OAuth] 用户 ${userId} 请求授权平台: ${platform}`);
    
    // 创建授权会话
    const result = await createAuthSession(platform);
    
    console.log('[OAuth] createAuthSession 返回:', {
      hasResult: !!result,
      sessionId: result?.sessionId,
      hasQrcodeUrl: !!result?.qrcodeUrl,
      qrcodeUrlLength: result?.qrcodeUrl?.length || 0,
      qrcodeUrlPrefix: result?.qrcodeUrl?.substring(0, 50) || '无'
    });
    
    if (!result) {
      return res.status(500).json({ success: false, error: '创建授权会话失败，请重试' });
    }
    
    // 保存会话到数据库
    await prisma.oAuthSession.create({
      data: {
        userId,
        platform,
        sessionId: result.sessionId,
        state: '',
        status: 'pending',
        expiresAt: result.expiresAt
      }
    });
    
    res.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        platform: result.platform,
        platformName: result.platformName,
        qrcodeImage: result.qrcodeUrl,  // 前端期望 qrcodeImage
        expiresAt: result.expiresAt
      }
    });
    
  } catch (error: any) {
    console.error('创建授权会话失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 查询授权状态（轮询接口）
 * GET /api/oauth/sessions/:sessionId
 */
router.get('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    
    // 检查数据库中的会话
    const dbSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!dbSession) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    if (dbSession.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权查看此会话' });
    }
    
    // 检查是否已授权
    if (dbSession.status === 'confirmed') {
      return res.json({
        success: true,
        data: {
          sessionId,
          platform: dbSession.platform,
          status: 'confirmed',
          accountInfo: dbSession.accountInfo
        }
      });
    }
    
    // 检查是否过期
    if (new Date() > dbSession.expiresAt) {
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: { status: 'expired' }
      });
      
      return res.json({
        success: true,
        data: {
          sessionId,
          status: 'expired',
          message: '授权已过期，请重新授权'
        }
      });
    }
    
    // 检查浏览器中的登录状态
    const authResult = await checkAuthStatus(sessionId);
    
    if (authResult.status === 'authorized') {
      // 授权成功，保存账号
      const accountInfo = authResult.accountInfo || {};
      
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: {
          status: 'confirmed',
          cookies: JSON.stringify(authResult.cookies || []),
          accountInfo: accountInfo,
          completedAt: new Date()
        }
      });
      
      // 创建或更新社交账号
      const platformConfig = PLATFORM_CONFIGS[dbSession.platform];
      await prisma.socialAccount.create({
        data: {
          id: `${userId}_${dbSession.platform}_${Date.now()}`,
          userId,
          platform: dbSession.platform,
          accountId: accountInfo?.id || dbSession.platform,
          accountName: accountInfo?.name || `${platformConfig?.name || dbSession.platform}账号`,
          avatar: accountInfo?.avatar,
          cookies: JSON.stringify(authResult.cookies || []),
          status: 'active'
        }
      }).catch(() => {
        // 如果已存在，更新
        return prisma.socialAccount.updateMany({
          where: { userId, platform: dbSession.platform },
          data: {
            cookies: JSON.stringify(authResult.cookies || []),
            accountName: accountInfo?.name || `${platformConfig?.name || dbSession.platform}账号`,
            avatar: accountInfo?.avatar,
            status: 'active',
            lastSyncAt: new Date()
          }
        });
      });
      
      return res.json({
        success: true,
        data: {
          sessionId,
          platform: dbSession.platform,
          status: 'confirmed',
          accountInfo,
          message: '授权成功！'
        }
      });
    }
    
    // 返回当前状态
    const platformConfig = PLATFORM_CONFIGS[dbSession.platform];
    return res.json({
      success: true,
      data: {
        sessionId,
        platform: dbSession.platform,
        platformName: platformConfig?.name,
        status: dbSession.status,
        message: authResult.message
      }
    });
    
  } catch (error: any) {
    console.error('查询授权状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 取消授权会话
 * DELETE /api/oauth/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    
    const session = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    // 清理浏览器会话
    cancelAuthSession(sessionId);
    
    // 删除数据库会话
    await prisma.oAuthSession.delete({
      where: { sessionId }
    });
    
    res.json({ success: true });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取已授权账号列表
 * GET /api/oauth/accounts
 */
router.get('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const accounts = await prisma.socialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    const data = accounts.map(account => {
      const config = PLATFORM_CONFIGS[account.platform];
      return {
        id: account.id,
        platform: account.platform,
        platformName: config?.name || account.platform,
        platformIcon: config?.icon,
        platformColor: config?.color,
        accountId: account.accountId,
        accountName: account.accountName,
        avatar: account.avatar,
        status: account.status,
        lastSyncAt: account.lastSyncAt,
        createdAt: account.createdAt
      };
    });
    
    res.json({ success: true, data });
    
  } catch (error: any) {
    console.error('获取账号列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除授权账号
 * DELETE /api/oauth/accounts/:id
 */
router.delete('/accounts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const account = await prisma.socialAccount.findFirst({
      where: { id, userId }
    });
    
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    await prisma.socialAccount.delete({
      where: { id }
    });
    
    res.json({ success: true });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 测试端点
 */
router.get('/test', async (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: '扫码授权路由正常',
    platforms: getPlatformList().length
  });
});

export default router;
