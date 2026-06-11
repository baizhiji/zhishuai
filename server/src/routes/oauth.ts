/**
 * OAuth 授权管理 - 扫码授权各平台账号
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as qrcode from 'qrcode';
import {
  startQRCodeLogin,
  checkLoginStatus,
  closeQRCodeLogin,
  PLATFORM_CONFIGS,
  BrowserSession
} from '../services/playwright.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 浏览器会话缓存（生产环境应使用 Redis）
const browserSessions: Map<string, BrowserSession> = new Map();

/**
 * 获取支持的平台列表
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
      code: key,
      name: config.name,
      loginType: config.selectors.qrContainer ? 'qrcode' : 'password'
    }));
    
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建授权会话，获取真实二维码 - 需要登录
 */
router.post('/sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
    
    // 启动浏览器，获取真实二维码
    const qrResult = await startQRCodeLogin(platform, sessionId);
    
    if (!qrResult) {
      return res.status(500).json({ success: false, error: '启动扫码登录失败，请检查Playwright是否正确安装' });
    }
    
    res.json({
      success: true,
      data: {
        sessionId,
        platform,
        qrcodeUrl: qrResult.qrcodeUrl,
        expiresAt: oauthSession.expiresAt
      }
    });
    
  } catch (error: any) {
    console.error('创建授权会话失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取授权会话状态
 */
router.get('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
    
    // 如果会话处于 pending 或 scanning 状态，检查浏览器中的登录状态
    if (session.status === 'pending' || session.status === 'scanning') {
      // 更新为扫描中
      if (session.status === 'pending') {
        await prisma.oAuthSession.update({
          where: { sessionId },
          data: { status: 'scanning' }
        });
      }
      
      // 检查浏览器中的登录状态
      const loginResult = await checkLoginStatus(sessionId, session.platform);
      
      if (loginResult.success) {
        // 登录成功，保存结果
        const browserSession = browserSessions.get(sessionId);
        
        await prisma.oAuthSession.update({
          where: { sessionId },
          data: {
            status: 'confirmed',
            cookies: JSON.stringify(loginResult.cookies || []),
            accountInfo: loginResult.accountInfo,
            completedAt: new Date()
          }
        });
        
        // 保存账号
        await prisma.socialAccount.create({
          data: {
            userId,
            platform: session.platform,
            accountId: loginResult.accountInfo?.id,
            accountName: loginResult.accountInfo?.name,
            avatar: loginResult.accountInfo?.avatar,
            cookies: JSON.stringify(loginResult.cookies || []),
            status: 'active',
            lastSyncAt: new Date()
          }
        });
        
        // 清理浏览器
        await closeQRCodeLogin(sessionId);
        
        return res.json({
          success: true,
          data: {
            sessionId: session.sessionId,
            platform: session.platform,
            status: 'confirmed',
            accountInfo: loginResult.accountInfo
          }
        });
      }
      
      // 检查是否过期
      if (new Date() > session.expiresAt) {
        await prisma.oAuthSession.update({
          where: { sessionId },
          data: { status: 'expired' }
        });
        await closeQRCodeLogin(sessionId);
        
        return res.json({
          success: true,
          data: {
            sessionId: session.sessionId,
            platform: session.platform,
            status: 'expired'
          }
        });
      }
      
      // 仍在等待扫码
      return res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          platform: session.platform,
          status: 'scanning'
        }
      });
    }
    
    // 已完成的会话
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
    console.error('查询会话状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 取消授权会话
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
    
    // 清理浏览器资源
    await closeQRCodeLogin(sessionId);
    
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
router.get('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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

/**
 * 删除授权账号
 */
router.delete('/accounts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
router.post('/accounts/:id/refresh', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const account = await prisma.socialAccount.findUnique({
      where: { id }
    });
    
    if (!account || account.userId !== userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    // 重新访问平台检测登录状态
    const browser = await createBrowser(userId);
    const context = await createContext(browser, userId);
    
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
