/**
 * 社交账号授权路由
 * 处理扫码授权、账号绑定等
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  startQRCodeLogin,
  checkLoginStatus,
  closeQRCodeLogin,
  PLATFORM_CONFIGS,
} from '../services/playwright.service';
import {
  bindSocialAccount,
  getUserAccounts,
  getAccountById,
  unbindAccount,
  updateAccountStatus,
  refreshAccountCookies,
  getAccountStats
} from '../services/social-account.service';

const router = Router();

// 会话存储
const loginSessions: Map<string, {
  platform: string;
  userId: string;
  status: 'pending' | 'scanning' | 'confirmed' | 'success' | 'failed';
  createdAt: Date;
  expiresAt: Date;
}> = new Map();

// 清理过期会话
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of loginSessions) {
    if (session.expiresAt < now) {
      loginSessions.delete(sessionId);
      closeQRCodeLogin(sessionId).catch(console.error);
    }
  }
}, 60000);

/**
 * 获取支持的平台列表
 */
router.get('/platforms', (req: Request, res: Response) => {
  const platforms = Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
    id: key,
    name: config.name,
    icon: getPlatformIcon(key)
  }));
  
  res.json({ code: 0, data: platforms });
});

/**
 * 创建扫码登录会话 - 打开浏览器获取真实二维码
 */
router.post('/session/create', async (req: Request, res: Response) => {
  try {
    const { platform, userId } = req.body;
    
    // 从 auth 中间件获取真实 userId
    const authUserId = (req as any).userId || userId;
    
    if (!platform || !authUserId) {
      return res.json({ code: 400, message: '缺少必要参数' });
    }
    
    if (!PLATFORM_CONFIGS[platform]) {
      return res.json({ code: 400, message: '不支持的平台' });
    }
    
    const sessionId = uuidv4();
    
    // 创建会话记录
    const session = {
      platform,
      userId: authUserId,
      status: 'pending' as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    
    loginSessions.set(sessionId, session);
    
    // 调用 Playwright 服务获取二维码截图
    console.log(`[Auth] 正在打开 ${PLATFORM_CONFIGS[platform].name} 登录页面...`);
    
    try {
      const result = await startQRCodeLogin(platform, sessionId);
      
      if (!result || !result.qrcodeUrl) {
        console.error(`[Auth] 获取二维码失败，平台: ${PLATFORM_CONFIGS[platform].name}`);
        loginSessions.delete(sessionId);
        return res.json({ 
          code: 500, 
          message: `无法获取${PLATFORM_CONFIGS[platform]?.name || platform}登录二维码，请检查浏览器环境` 
        });
      }
      
      console.log(`[Auth] 会话 ${sessionId} 创建成功，平台: ${PLATFORM_CONFIGS[platform].name}`);
      
      res.json({
        code: 0,
        data: {
          sessionId,
          qrcodeImage: result.qrcodeUrl,
          expiresIn: 600
        }
      });
      
    } catch (browserError: any) {
      console.error(`[Auth] 创建会话失败:`, browserError.message);
      loginSessions.delete(sessionId);
      
      return res.json({ 
        code: 500, 
        message: `无法打开${PLATFORM_CONFIGS[platform]?.name || platform}登录页面，可能是浏览器环境问题` 
      });
    }
    
  } catch (error: any) {
    console.error('创建授权会话失败:', error);
    res.json({ code: 500, message: '创建授权会话失败' });
  }
});

/**
 * 获取会话状态 - 轮询检测登录状态
 */
router.get('/session/:sessionId/status', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = loginSessions.get(sessionId);
    
    if (!session) {
      return res.json({ code: 404, message: '会话不存在或已过期' });
    }
    
    // 检查是否过期
    if (session.expiresAt < new Date()) {
      loginSessions.delete(sessionId);
      await closeQRCodeLogin(sessionId).catch(() => {});
      return res.json({ code: 404, message: '会话已过期' });
    }
    
    // 调用 Playwright 服务检查登录状态
    try {
      const result = await checkLoginStatus(sessionId, session.platform);
      
      // 更新本地状态
      if (result.success) {
        session.status = 'success';
      }
      
      res.json({
        code: 0,
        data: {
          status: session.status,
          platform: session.platform,
          platformName: PLATFORM_CONFIGS[session.platform]?.name
        }
      });
    } catch (checkError: any) {
      // 如果检查失败，返回当前状态
      res.json({
        code: 0,
        data: {
          status: session.status,
          platform: session.platform,
          platformName: PLATFORM_CONFIGS[session.platform]?.name
        }
      });
    }
    
  } catch (error: any) {
    console.error('获取会话状态失败:', error);
    res.json({ code: 500, message: '获取会话状态失败' });
  }
});

/**
 * 确认登录并绑定账号
 */
router.post('/session/:sessionId/confirm', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = loginSessions.get(sessionId);
    
    if (!session) {
      return res.json({ code: 404, message: '会话不存在' });
    }
    
    if (session.status !== 'success') {
      return res.json({ code: 400, message: '登录未成功，请先扫码并确认' });
    }
    
    // 调用 Playwright 服务获取登录结果
    const result = await checkLoginStatus(sessionId, session.platform);
    
    if (result.success) {
      // 绑定账号
      const account = await bindSocialAccount({
        userId: session.userId,
        platform: session.platform,
        cookies: result.cookies || [],
        accountInfo: result.accountInfo
      });
      
      // 清理会话
      await closeQRCodeLogin(sessionId).catch(() => {});
      loginSessions.delete(sessionId);
      
      res.json({
        code: 0,
        data: {
          accountId: account.id,
          accountName: account.accountName,
          platform: session.platform,
          platformName: PLATFORM_CONFIGS[session.platform]?.name,
          avatar: account.avatar
        }
      });
    } else {
      res.json({ code: 400, message: '登录状态无效' });
    }
    
  } catch (error: any) {
    console.error('确认登录失败:', error);
    res.json({ code: 500, message: '确认登录失败' });
  }
});

/**
 * 取消登录会话
 */
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = loginSessions.get(sessionId);
    
    if (session) {
      await closeQRCodeLogin(sessionId).catch(() => {});
      loginSessions.delete(sessionId);
    }
    
    res.json({ code: 0, message: '会话已取消' });
    
  } catch (error: any) {
    console.error('取消会话失败:', error);
    res.json({ code: 500, message: '取消会话失败' });
  }
});

/**
 * 获取用户的所有社交账号
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.json({ code: 401, message: '未登录' });
    }
    
    const accounts = await getUserAccounts(userId);
    res.json({ code: 0, data: accounts });
    
  } catch (error: any) {
    console.error('获取账号列表失败:', error);
    res.json({ code: 500, message: '获取账号列表失败' });
  }
});

/**
 * 获取单个账号详情
 */
router.get('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const account = await getAccountById(id);
    
    if (!account) {
      return res.json({ code: 404, message: '账号不存在' });
    }
    
    res.json({ code: 0, data: account });
    
  } catch (error: any) {
    console.error('获取账号详情失败:', error);
    res.json({ code: 500, message: '获取账号详情失败' });
  }
});

/**
 * 解绑账号
 */
router.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    await unbindAccount(id, userId);
    res.json({ code: 0, message: '解绑成功' });
    
  } catch (error: any) {
    console.error('解绑账号失败:', error);
    res.json({ code: 500, message: '解绑失败' });
  }
});

/**
 * 更新账号状态
 */
router.put('/accounts/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await updateAccountStatus(id, status);
    res.json({ code: 0, message: '状态更新成功' });
    
  } catch (error: any) {
    console.error('更新账号状态失败:', error);
    res.json({ code: 500, message: '更新状态失败' });
  }
});

/**
 * 刷新账号 Cookie
 */
router.post('/accounts/:id/refresh', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: 实现从平台刷新 Cookie 的逻辑
    // 目前只是更新最后同步时间
    await refreshAccountCookies(id, []);
    
    res.json({ code: 0, message: '刷新成功' });
    
  } catch (error: any) {
    console.error('刷新 Cookie 失败:', error);
    res.json({ code: 500, message: '刷新失败' });
  }
});

/**
 * 获取账号统计数据
 */
router.get('/accounts/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await getAccountStats(id);
    res.json({ code: 0, data: stats });
    
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    res.json({ code: 500, message: '获取统计数据失败' });
  }
});

/**
 * 获取平台图标
 */
function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    douyin: '🎵',
    kuaishou: '📹',
    xiaohongshu: '📕',
    weibo: '🌐',
    boss: '💼',
    channels: '📱',
    zhihu: '💬',
    baijiahao: '📰',
    toutiao: '📰',
    liepin: '💼',
    zhilian: '💼',
    bilibili: '📺'
  };
  return icons[platform] || '🌐';
}

export default router;
