/**
 * OAuth 2.0 授权路由
 * 支持扫码授权登录各平台
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as qrcode from 'qrcode';
import { 
  OAUTH_PLATFORMS, 
  isPlatformConfigured,
  generateAuthorizationUrl,
  exchangeCodeForToken,
  getUserInfo
} from '../services/oauth2.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 会话存储（生产环境应使用 Redis）
const pendingSessions: Map<string, {
  platform: string;
  userId: string;
  state: string;
  createdAt: Date;
}> = new Map();

/**
 * 获取支持的平台列表
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = Object.entries(OAUTH_PLATFORMS).map(([key, config]) => ({
      code: key,
      name: config.name,
      icon: config.icon,
      color: config.color,
      loginType: 'oauth2',
      status: config.status,
      configured: isPlatformConfigured(key),
      description: config.description
    }));
    
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建授权会话，获取授权二维码
 * GET /api/oauth/qrcode/:platform
 * 直接返回授权 URL 的二维码图片
 */
router.get('/qrcode/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    
    // 验证平台
    const config = OAUTH_PLATFORMS[platform];
    if (!config) {
      return res.status(400).json({ success: false, error: '不支持的平台' });
    }
    
    // 检查是否已配置
    if (!isPlatformConfigured(platform)) {
      return res.status(400).json({ 
        success: false, 
        error: `${config.name} 开放平台未配置，请联系管理员` 
      });
    }
    
    // 生成 state 和 session
    const state = uuidv4();
    const sessionId = uuidv4();
    
    // 保存会话（10分钟过期）
    pendingSessions.set(sessionId, {
      platform,
      userId: '', // 回调时补充
      state,
      createdAt: new Date()
    });
    
    // 生成授权 URL
    const authUrl = generateAuthorizationUrl(platform, `${sessionId}:${state}`);
    
    // 生成二维码
    const qrcodeDataUrl = await qrcode.toDataURL(authUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    res.json({
      success: true,
      data: {
        sessionId,
        platform,
        platformName: config.name,
        platformIcon: config.icon,
        qrcodeUrl: qrcodeDataUrl,
        authUrl, // 前端也可直接跳转
        expiresIn: 600 // 10分钟
      }
    });
    
  } catch (error: any) {
    console.error('生成授权二维码失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * OAuth 回调处理
 * GET /api/oauth/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { platform, code, state, error, error_description } = req.query;
    
    // 处理错误
    if (error) {
      console.error('OAuth 错误:', error, error_description);
      return res.redirect(`/?oauth_error=${encodeURIComponent(String(error_description || error))}`);
    }
    
    if (!code || !state) {
      return res.redirect('/?oauth_error=缺少授权参数');
    }
    
    // 解析 state（格式：sessionId:state）
    const [sessionId, originalState] = String(state).split(':');
    const session = pendingSessions.get(sessionId);
    
    if (!session) {
      return res.redirect('/?oauth_error=会话已过期');
    }
    
    // 验证 state
    if (session.state !== originalState) {
      return res.redirect('/?oauth_error=State验证失败');
    }
    
    // 验证平台
    if (session.platform !== platform) {
      return res.redirect('/?oauth_error=平台不匹配');
    }
    
    // 换取访问令牌
    const tokenResult = await exchangeCodeForToken(String(platform), String(code));
    
    if (!tokenResult) {
      return res.redirect('/?oauth_error=获取访问令牌失败');
    }
    
    // 获取用户信息
    const userInfo = await getUserInfo(String(platform), tokenResult.accessToken);
    
    if (!userInfo) {
      return res.redirect('/?oauth_error=获取用户信息失败');
    }
    
    // 保存会话结果（供前端轮询获取）
    pendingSessions.set(sessionId, {
      ...session,
      userId: userInfo.id // 临时存储用户ID
    });
    
    // 也存储到数据库（如果有用户关联的话）
    // 这里简化处理，实际应该通过 token 获取用户
    
    // 重定向到成功页面
    res.redirect(`/?oauth_success=1&session_id=${sessionId}&platform=${platform}`);
    
  } catch (error: any) {
    console.error('OAuth 回调处理失败:', error);
    res.redirect(`/?oauth_error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * 查询会话状态（用于前端轮询）
 * GET /api/oauth/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;
    
    const session = pendingSessions.get(sessionId);
    
    if (!session) {
      // 检查数据库
      const dbSession = await prisma.oAuthSession.findUnique({
        where: { sessionId }
      });
      
      if (!dbSession) {
        return res.status(404).json({ success: false, error: '会话不存在或已过期' });
      }
      
      return res.json({
        success: true,
        data: {
          sessionId,
          platform: dbSession.platform,
          status: dbSession.status,
          accountInfo: dbSession.accountInfo,
          completedAt: dbSession.completedAt
        }
      });
    }
    
    // 检查是否过期（10分钟）
    const isExpired = Date.now() - session.createdAt.getTime() > 10 * 60 * 1000;
    
    if (isExpired) {
      pendingSessions.delete(sessionId);
      return res.json({
        success: true,
        data: {
          sessionId,
          status: 'expired'
        }
      });
    }
    
    // 返回会话状态
    const config = OAUTH_PLATFORMS[session.platform];
    
    res.json({
      success: true,
      data: {
        sessionId,
        platform: session.platform,
        platformName: config?.name,
        platformIcon: config?.icon,
        status: 'pending', // 等待用户在 APP 中确认
        message: '请在APP中确认授权'
      }
    });
    
  } catch (error: any) {
    console.error('查询会话状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建授权会话（登录用户版本）
 * POST /api/oauth/sessions
 */
router.post('/sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.body;
    
    if (!platform) {
      return res.status(400).json({ success: false, error: '请选择平台' });
    }
    
    // 验证平台
    const config = OAUTH_PLATFORMS[platform];
    if (!config) {
      return res.status(400).json({ success: false, error: '不支持的平台' });
    }
    
    // 检查是否已配置
    if (!isPlatformConfigured(platform)) {
      return res.status(400).json({ 
        success: false, 
        error: `${config.name} 开放平台未配置` 
      });
    }
    
    // 生成 state 和 session
    const state = uuidv4();
    const sessionId = uuidv4();
    
    // 保存到数据库
    await prisma.oAuthSession.create({
      data: {
        userId,
        platform,
        sessionId,
        state,
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    
    // 生成授权 URL
    const authUrl = generateAuthorizationUrl(platform, `${sessionId}:${state}`);
    
    // 生成二维码
    const qrcodeDataUrl = await qrcode.toDataURL(authUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    res.json({
      success: true,
      data: {
        sessionId,
        platform,
        platformName: config.name,
        platformIcon: config.icon,
        qrcodeUrl: qrcodeDataUrl,
        authUrl,
        expiresIn: 600
      }
    });
    
  } catch (error: any) {
    console.error('创建授权会话失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 保存已授权的账号
 * POST /api/oauth/accounts
 */
router.post('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, accessToken, refreshToken, expiresIn, accountInfo } = req.body;
    
    if (!platform || !accessToken) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    
    // 保存账号
    const account = await prisma.socialAccount.upsert({
      where: {
        id: `${userId}_${platform}_${accountInfo?.id || 'default'}`
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiry: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        accountName: accountInfo?.name,
        avatar: accountInfo?.avatar,
        status: 'active',
        lastSyncAt: new Date()
      },
      create: {
        id: `${userId}_${platform}_${accountInfo?.id || 'default'}`,
        userId,
        platform,
        accountId: accountInfo?.id,
        accountName: accountInfo?.name || `${OAUTH_PLATFORMS[platform]?.name || platform}账号`,
        avatar: accountInfo?.avatar,
        accessToken,
        refreshToken,
        tokenExpiry: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        status: 'active'
      }
    });
    
    res.json({
      success: true,
      data: {
        id: account.id,
        platform: account.platform,
        accountName: account.accountName,
        avatar: account.avatar
      }
    });
    
  } catch (error: any) {
    console.error('保存账号失败:', error);
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
    
    await prisma.socialAccount.delete({ where: { id } });
    
    res.json({ success: true });
    
  } catch (error: any) {
    console.error('删除账号失败:', error);
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
    
    // 补充平台信息
    const data = accounts.map(account => {
      const config = OAUTH_PLATFORMS[account.platform];
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
        tokenExpiry: account.tokenExpiry
      };
    });
    
    res.json({ success: true, data });
    
  } catch (error: any) {
    console.error('获取账号列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 测试端点
 */
router.get('/test', async (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'OAuth 2.0 路由正常',
    platforms: Object.keys(OAUTH_PLATFORMS).length
  });
});

export default router;
