/**
 * 扫码授权路由
 * 使用 Playwright 浏览器自动化获取平台二维码并检测登录状态
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  createAuthSession, 
  checkAuthStatus, 
  cancelAuthSession,
  getPlatformList,
  PLATFORM_CONFIGS
} from '../services/browser-auth.service';
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
      icon: PLATFORM_CONFIGS[p.code]?.icon,
      color: PLATFORM_CONFIGS[p.code]?.color,
      status: p.status
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
      qrcodeUrlLength: result?.qrcodeUrl?.length || 0
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
        qrcodeUrl: result.qrcodeUrl,
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
        data: {
          sessionId,
          platform: dbSession.platform,
          status: 'expired'
        }
      });
    }
    
    // 检查 Playwright 中的实时状态
    const realTimeStatus = await checkAuthStatus(sessionId);
    
    if (realTimeStatus.status === 'authorized') {
      // 更新数据库
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: {
          status: 'confirmed',
          accountInfo: JSON.stringify(realTimeStatus.accountInfo)
        }
      });
      
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
    
    // 返回当前状态
    return res.json({
      success: true,
      data: {
        sessionId,
        platform: dbSession.platform,
        status: realTimeStatus.status
      }
    });
    
  } catch (error: any) {
    console.error('查询会话状态失败:', error);
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
    
    const dbSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (dbSession && dbSession.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权取消此会话' });
    }
    
    cancelAuthSession(sessionId);
    
    await prisma.oAuthSession.delete({
      where: { sessionId }
    }).catch(() => {});
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
