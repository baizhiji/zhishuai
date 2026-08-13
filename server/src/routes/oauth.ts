/**
 * OAuth 授权管理 - 扫码授权各平台账号
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as qrcode from 'qrcode';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';
import {
  createBrowser,
  createContext,
  PLATFORM_CONFIGS,
} from '../services/playwright.service';

// BrowserSession type (not exported from playwright.service)
interface BrowserSession {
  browserId: string;
  contextId: string;
  platform: string;
  cookies: any[];
  createdAt: Date;
}

const router = Router();

// OAuth 路由需要认证
router.use(authMiddleware);
// 浏览器会话缓存（生产环境应使用 Redis）
const browserSessions: Map<string, BrowserSession> = new Map();

/**
 * 获取支持的平台列表
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
      code: key,
      name: (config as any).name || key,
      loginType: (config as any).selectors?.qrContainer ? 'qrcode' : 'password'
    }));
    
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建授权会话，获取二维码
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { platform } = req.body;
    
    if (!platform || !PLATFORM_CONFIGS[platform]) {
      return res.status(400).json({ success: false, error: '不支持的平台' });
    }
    
    // 生成会话ID
    const sessionId = uuidv4();
    const state = uuidv4();
    
    // 保存会话到数据库
    const oauthSession = await prisma.oAuthSession.create({
      data: {
        userId,
        platform,
        sessionId,
        state,
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期
      }
    });
    
    // 生成二维码
    const qrcodeData = JSON.stringify({
      sessionId,
      platform,
      state,
      authUrl: `/api/oauth/authorize?sessionId=${sessionId}`
    });
    
    const qrcodeUrl = await qrcode.toDataURL(qrcodeData, {
      width: 200,
      margin: 2
    });
    
    res.json({
      success: true,
      data: {
        sessionId,
        platform,
        qrcodeUrl,
        expiresAt: oauthSession.expiresAt
      }
    });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 执行扫码授权（内部接口，由前端轮询触发）
 */
router.post('/authorize', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionId, platform } = req.body;
    
    if (!sessionId || !platform) {
      return res.status(400).json({ success: false, error: '缺少参数' });
    }
    
    // 验证会话
    const oauthSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!oauthSession) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    if (oauthSession.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权操作此会话' });
    }
    
    if (oauthSession.status !== 'pending') {
      return res.json({
        success: true,
        data: { status: oauthSession.status }
      });
    }
    
    if (new Date() > oauthSession.expiresAt) {
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: { status: 'expired' }
      });
      return res.json({
        success: true,
        data: { status: 'expired' }
      });
    }
    
    // 更新会话状态为扫描中
    await prisma.oAuthSession.update({
      where: { sessionId },
      data: { status: 'scanning' }
    });
    
    // 创建浏览器上下文
    const browser = await (createBrowser as any)(userId);
    const context = await (createContext as any)(browser, userId);
    const page = await context.newPage();
    
    const browserId = `browser-${sessionId}`;
    const contextId = `context-${sessionId}`;
    
    browserSessions.set(sessionId, {
      browserId,
      contextId,
      platform,
      cookies: [],
      createdAt: new Date()
    });
    
    const config = PLATFORM_CONFIGS[platform];
    
    // 访问登录页面
    await page.goto(config.loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待登录成功
    const loginSelectors = getLoginSuccessSelectors(platform);
    let loginSuccess = false;
    
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 60000 });
        loginSuccess = true;
        break;
      } catch (e) {
        // 继续等待
      }
    }
    
    if (loginSuccess) {
      // 获取cookies和账号信息
      const cookies = await context.cookies();
      const accountInfo = await extractAccountInfo(page, platform);
      
      // 保存到数据库
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: {
          status: 'confirmed',
          cookies: JSON.stringify(cookies),
          accountInfo,
          completedAt: new Date()
        }
      });
      
      // 保存账号
      await prisma.socialAccount.create({
        data: {
          userId,
          platform,
          accountId: accountInfo?.id,
          accountName: accountInfo?.name,
          avatar: accountInfo?.avatar,
          cookies: JSON.stringify(cookies),
          status: 'active',
          lastSyncAt: new Date()
        }
      });
      
      // 清理浏览器资源
      await page.close();
      await context.close();
      await browser.close();
      browserSessions.delete(sessionId);
      
      res.json({
        success: true,
        data: {
          status: 'confirmed',
          account: accountInfo
        }
      });
    } else {
      // 继续等待
      res.json({
        success: true,
        data: { status: 'scanning' }
      });
    }
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取授权会话状态
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionId } = req.params;
    
    const session = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!session) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权查看此会话' });
    }
    
    const accountInfo = session.status === 'confirmed' ? session.accountInfo : null;
    
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        platform: session.platform,
        status: session.status,
        accountInfo,
        expiresAt: session.expiresAt,
        completedAt: session.completedAt,
        error: session.error
      }
    });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 取消授权会话
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionId } = req.params;
    
    const session = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    // 清理浏览器资源
    const browserSession = browserSessions.get(sessionId);
    if (browserSession) {
      try {
        // 浏览器实例未持久化到单独管理，此处跳过
      } catch (e) {
        // 忽略清理错误
      }
      browserSessions.delete(sessionId);
    }
    
    // 删除会话
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
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { platform } = req.query;
    
    const where: any = { userId };
    if (platform) {
      where.platform = platform as string;
    }
    
    const accounts = await prisma.socialAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    // 脱敏处理
    const sanitizedAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      platformName: (PLATFORM_CONFIGS as any)[account.platform]?.name || account.platform,
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

/**
 * 删除授权账号
 */
router.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    
    const account = await prisma.socialAccount.findUnique({
      where: { id }
    });
    
    if (!account || account.userId !== userId) {
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
 * 刷新账号授权状态
 */
router.post('/accounts/:id/refresh', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    
    const account = await prisma.socialAccount.findUnique({
      where: { id }
    });
    
    if (!account || account.userId !== userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    // 重新访问平台检测登录状态
    const browser = await (createBrowser as any)(userId);
    const context = await (createContext as any)(browser, userId);
    
    try {
      // 设置cookies
      if (account.cookies) {
        const cookies = JSON.parse(account.cookies);
        await context.addCookies(cookies);
      }
      
      const page = await context.newPage();
      const config = PLATFORM_CONFIGS[account.platform];
      
      await page.goto(config?.loginUrl || '', { waitUntil: 'networkidle', timeout: 30000 });
      
      // 检测是否仍然登录
      const loginSelectors = getLoginSuccessSelectors(account.platform);
      let isLoggedIn = false;
      
      for (const selector of loginSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          isLoggedIn = true;
          break;
        } catch (e) {
          // 继续尝试
        }
      }
      
      if (isLoggedIn) {
        const newCookies = await context.cookies();
        await prisma.socialAccount.update({
          where: { id },
          data: {
            cookies: JSON.stringify(newCookies),
            status: 'active',
            lastSyncAt: new Date(),
            syncError: null
          }
        });
        
        res.json({ success: true, data: { status: 'active' } });
      } else {
        await prisma.socialAccount.update({
          where: { id },
          data: {
            status: 'expired',
            syncError: '授权已过期，请重新授权'
          }
        });
        
        res.json({ success: true, data: { status: 'expired' } });
      }
      
      await page.close();
      
    } finally {
      await context.close();
      await browser.close();
    }
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 辅助函数
function getLoginSuccessSelectors(platform: string): string[] {
  const selectors: Record<string, string[]> = {
    douyin: ['.creator-left-menu', '[data-e2e="creator-nav"]', '.user-info'],
    kuaishou: ['.profile-header', '.user-name'],
    xiaohongshu: ['.user-info', '.creator-header'],
    weibo: ['.WB_frame', '.woo-panel-main'],
    boss: ['.boss-header', '.user-info'],
    lagou: ['.user-logo', '.header-user-info'],
    zhipin: ['.user-info', '.header-user']
  };
  
  return selectors[platform] || ['body'];
}

async function extractAccountInfo(page: any, platform: string): Promise<any> {
  const info: any = {};
  
  try {
    // 通用选择器
    const nameSelectors = ['.user-name', '.nick-name', '[class*="name"]'];
    const avatarSelectors = ['img.avatar', 'img[class*="avatar"]'];
    
    for (const selector of nameSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          info.name = await el.textContent();
          break;
        }
      } catch (e) {}
    }
    
    for (const selector of avatarSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          info.avatar = await el.getAttribute('src');
          break;
        }
      } catch (e) {}
    }
    
  } catch (e) {}
  
  return info;
}

export default router;
