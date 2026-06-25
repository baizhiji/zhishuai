/**
 * 扫码授权路由 V7-final - popup 窗口方式
 * 
 * 所有平台统一使用 popup 窗口方式：
 * 1. 创建会话时返回 popupUrl（平台登录页URL）
 * 2. 前端打开新窗口让用户扫码
 * 3. 用户完成后手动确认
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/db';
import { 
  createAuthSession, 
  checkAuthStatus, 
  cancelAuthSession,
  confirmAuthSession,
  getConfirmedSession,
  getPlatformList,
  PLATFORM_CONFIGS
} from '../services/browser-auth.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ============ 平台列表 ============

router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = getPlatformList().map(p => ({
      code: p.code,
      name: p.name,
      icon: PLATFORM_CONFIGS[p.code]?.icon,
      color: PLATFORM_CONFIGS[p.code]?.color,
      status: p.status,
      qrMethod: 'popup',
      loginUrl: PLATFORM_CONFIGS[p.code]?.loginUrl || '',
    }));
    
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 创建授权会话 ============

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
    
    console.log(`[OAuth-V7] 用户 ${userId} 请求授权平台: ${platform}`);
    
    const result = await createAuthSession(platform);
    
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
        qrMethod: 'popup',
        popupUrl: result.popupUrl,
        expiresAt: result.expiresAt
      }
    });
    
  } catch (error: any) {
    console.error('[OAuth-V7] 创建授权会话失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 查询授权状态（轮询）============

router.get('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    
    const dbSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!dbSession) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    if (dbSession.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权查看此会话' });
    }
    
    // 已授权
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
    
    // 已过期
    if (new Date() > dbSession.expiresAt) {
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: { status: 'expired' }
      });
      return res.json({
        success: true,
        data: { sessionId, platform: dbSession.platform, status: 'expired' }
      });
    }
    
    // 检查内存中的实时状态
    const realTimeStatus = await checkAuthStatus(sessionId);
    
    if (realTimeStatus.status === 'authorized') {
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: {
          status: 'confirmed',
          accountInfo: realTimeStatus.accountInfo
        }
      });
      
      try {
        await prisma.socialAccount.create({
          data: {
            userId,
            platform: dbSession.platform,
            accountId: realTimeStatus.accountInfo?.id || '',
            accountName: realTimeStatus.accountInfo?.name || '',
            avatar: realTimeStatus.accountInfo?.avatar || '',
            status: 'active',
            lastSyncAt: new Date()
          }
        });
      } catch (e) {}
      
      return res.json({
        success: true,
        data: {
          sessionId,
          platform: dbSession.platform,
          status: 'confirmed',
          accountInfo: realTimeStatus.accountInfo
        }
      });
    }
    
    return res.json({
      success: true,
      data: {
        sessionId,
        platform: dbSession.platform,
        status: realTimeStatus.status,
        message: realTimeStatus.message
      }
    });
    
  } catch (error: any) {
    console.error('[OAuth-V7] 查询会话状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 前端确认授权成功 ============

router.post('/sessions/:sessionId/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    const { accountInfo, cookies } = req.body;
    
    const dbSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!dbSession) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    if (dbSession.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权操作此会话' });
    }
    
    console.log(`[OAuth-V7] 前端确认授权: sessionId=${sessionId}, platform=${dbSession.platform}`);
    
    confirmAuthSession(sessionId, { cookies, accountInfo });
    
    await prisma.oAuthSession.update({
      where: { sessionId },
      data: {
        status: 'confirmed',
        accountInfo: accountInfo || {}
      }
    });
    
    try {
      await prisma.socialAccount.create({
        data: {
          userId,
          platform: dbSession.platform,
          accountId: accountInfo?.id || accountInfo?.accountId || '',
          accountName: accountInfo?.name || accountInfo?.nickname || '',
          avatar: accountInfo?.avatar || '',
          status: 'active',
          lastSyncAt: new Date()
        }
      });
    } catch (e) {}
    
    res.json({
      success: true,
      data: {
        sessionId,
        platform: dbSession.platform,
        status: 'confirmed',
        accountInfo
      }
    });
    
  } catch (error: any) {
    console.error('[OAuth-V7] 确认授权失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 取消授权会话 ============

router.delete('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    
    cancelAuthSession(sessionId);
    
    await prisma.oAuthSession.delete({
      where: { sessionId }
    }).catch(() => {});
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 已授权账号列表 ============

router.get('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.query;
    
    const where: any = { userId };
    if (platform) where.platform = platform as string;
    
    const accounts = await prisma.socialAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    const sanitizedAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      platformName: PLATFORM_CONFIGS[account.platform]?.name || account.platform,
      accountId: account.accountId,
      accountName: account.accountName,
      avatar: account.avatar,
      status: account.status,
      lastSyncAt: account.lastSyncAt,
      createdAt: account.createdAt
    }));
    
    res.json({ success: true, data: sanitizedAccounts });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 删除授权账号 ============

router.delete('/accounts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const account = await prisma.socialAccount.findUnique({ where: { id } });
    
    if (!account || account.userId !== userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    await prisma.socialAccount.delete({ where: { id } });
    res.json({ success: true });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
