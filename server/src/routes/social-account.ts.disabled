/**
 * 社交账号授权路由
 * 处理扫码授权、账号绑定等
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as qrcode from 'qrcode';
import {
  createBrowser,
  createContext,
  getAdapter,
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

// 会话存储（生产环境应使用Redis）
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
    }
  }
}, 60000); // 每分钟清理

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
 * 创建扫码登录会话
 */
router.post('/session/create', async (req: Request, res: Response) => {
  try {
    const { platform, userId } = req.body;
    
    if (!platform || !userId) {
      return res.json({ code: 400, message: '缺少必要参数' });
    }
    
    if (!PLATFORM_CONFIGS[platform]) {
      return res.json({ code: 400, message: '不支持的平台' });
    }
    
    const sessionId = uuidv4();
    const session = {
      platform,
      userId,
      status: 'pending' as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期
    };
    
    loginSessions.set(sessionId, session);
    
    // 生成二维码
    const qrData = JSON.stringify({
      sessionId,
      platform,
      timestamp: Date.now()
    });
    
    const qrcodeImage = await qrcode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    res.json({
      code: 0,
      data: {
        sessionId,
        qrcodeImage,
        expiresIn: 600 // 10分钟
      }
    });
    
  } catch (error: any) {
    console.error('创建授权会话失败:', error);
    res.json({ code: 500, message: '创建授权会话失败' });
  }
});

/**
 * 获取会话状态
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
      return res.json({ code: 404, message: '会话已过期' });
    }
    
    res.json({
      code: 0,
      data: {
        status: session.status,
        platform: session.platform,
        platformName: PLATFORM_CONFIGS[session.platform]?.name
      }
    });
    
  } catch (error: any) {
    console.error('获取会话状态失败:', error);
    res.json({ code: 500, message: '获取会话状态失败' });
  }
});

/**
 * 模拟扫码（前端调用，模拟用户扫码确认）
 */
router.post('/session/:sessionId/scan', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = loginSessions.get(sessionId);
    
    if (!session) {
      return res.json({ code: 404, message: '会话不存在' });
    }
    
    session.status = 'scanning';
    
    res.json({ code: 0, message: '扫码成功，等待确认' });
    
  } catch (error: any) {
    res.json({ code: 500, message: '操作失败' });
  }
});

/**
 * 模拟确认（前端调用，模拟用户确认登录）
 */
router.post('/session/:sessionId/confirm', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = loginSessions.get(sessionId);
    
    if (!session) {
      return res.json({ code: 404, message: '会话不存在' });
    }
    
    if (session.status !== 'scanning') {
      return res.json({ code: 400, message: '请先扫码' });
    }
    
    session.status = 'confirmed';
    
    res.json({ code: 0, message: '确认成功，正在登录...' });
    
  } catch (error: any) {
    res.json({ code: 500, message: '操作失败' });
  }
});

/**
 * 执行实际登录（后台浏览器自动化）
 */
router.post('/session/:sessionId/login', async (req: Request, res: Response) => {
  let browser = null;
  
  try {
    const { sessionId } = req.params;
    const session = loginSessions.get(sessionId);
    
    if (!session) {
      return res.json({ code: 404, message: '会话不存在' });
    }
    
    // 启动浏览器
    browser = await createBrowser(session.userId);
    const context = await createContext(browser, session.userId);
    const page = await context.newPage();
    
    // 获取平台适配器
    const adapter = getAdapter(session.platform);
    
    if (!adapter) {
      return res.json({ code: 400, message: '不支持该平台' });
    }
    
    // 访问登录页面
    await page.goto(adapter.getLoginUrl(), {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待二维码容器出现
    const qrSelector = adapter.getQrContainerSelector();
    try {
      await page.waitForSelector(qrSelector, { timeout: 10000 });
    } catch (e) {
      await context.close();
      return res.json({ code: 400, message: '页面加载异常，请重试' });
    }
    
    // 等待登录成功
    const successSelectors = adapter.getLoginSuccessSelectors();
    let loginSuccess = false;
    
    for (let i = 0; i < 60; i++) { // 最多等60次 * 2秒 = 2分钟
      await page.waitForTimeout(2000);
      
      for (const selector of successSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            loginSuccess = true;
            break;
          }
        } catch (e) {}
      }
      
      if (loginSuccess) break;
    }
    
    if (!loginSuccess) {
      // 关闭浏览器
      await context.close();
      session.status = 'failed';
      return res.json({ code: 400, message: '登录超时，请在手机上确认授权' });
    }
    
    // 提取账号信息
    const accountInfo = await adapter.extractAccountInfo(page);
    
    // 获取cookies
    const cookies = await context.cookies();
    
    // 绑定账号
    const account = await bindSocialAccount({
      userId: session.userId,
      platform: session.platform,
      cookies,
      accountInfo
    });
    
    // 更新会话状态
    session.status = 'success';
    
    // 关闭浏览器
    await context.close();
    
    res.json({
      code: 0,
      data: {
        accountId: account.id,
        accountName: account.accountName,
        platform: session.platform,
        platformName: adapter.platformName,
        avatar: account.avatar
      }
    });
    
  } catch (error: any) {
    console.error('登录失败:', error);
    
    // 清理资源
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    
    res.json({ code: 500, message: `登录失败: ${error.message}` });
  }
});

/**
 * 获取用户账号列表
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    const accounts = await getUserAccounts(userId);
    
    res.json({ code: 0, data: accounts });
    
  } catch (error: any) {
    console.error('获取账号列表失败:', error);
    res.json({ code: 500, message: '获取账号列表失败' });
  }
});

/**
 * 获取账号统计
 */
router.get('/accounts/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    const stats = await getAccountStats(userId);
    
    res.json({ code: 0, data: stats });
    
  } catch (error: any) {
    console.error('获取统计失败:', error);
    res.json({ code: 500, message: '获取统计失败' });
  }
});

/**
 * 解绑账号
 */
router.delete('/accounts/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    const success = await unbindAccount(accountId, userId);
    
    if (success) {
      res.json({ code: 0, message: '解绑成功' });
    } else {
      res.json({ code: 400, message: '解绑失败，账号不存在或无权操作' });
    }
    
  } catch (error: any) {
    console.error('解绑失败:', error);
    res.json({ code: 500, message: '解绑失败' });
  }
});

/**
 * 刷新账号Cookie
 */
router.post('/accounts/:accountId/refresh', async (req: Request, res: Response) => {
  let browser = null;
  
  try {
    const { accountId } = req.params;
    const account = await getAccountById(accountId);
    
    if (!account) {
      return res.json({ code: 404, message: '账号不存在' });
    }
    
    // 启动浏览器
    browser = await createBrowser(account.userId);
    const context = await createContext(browser, account.userId);
    const page = await context.newPage();
    
    // 设置旧cookies
    if (account.cookies) {
      try {
        const oldCookies = JSON.parse(account.cookies);
        await context.addCookies(oldCookies);
      } catch (e) {
        console.error('解析cookies失败:', e);
      }
    }
    
    // 获取平台适配器
    const adapter = getAdapter(account.platform);
    
    if (!adapter) {
      return res.json({ code: 400, message: '不支持该平台' });
    }
    
    // 访问登录页面
    await page.goto(adapter.getLoginUrl(), {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待登录成功
    const successSelectors = adapter.getLoginSuccessSelectors();
    let loginSuccess = false;
    
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      
      for (const selector of successSelectors) {
        try {
          const el = await page.locator(selector).first();
          if (await el.isVisible({ timeout: 2000 })) {
            loginSuccess = true;
            break;
          }
        } catch (e) {}
      }
      
      if (loginSuccess) break;
    }
    
    if (!loginSuccess) {
      await context.close();
      return res.json({ code: 400, message: '刷新Cookie失败，请重新授权' });
    }
    
    // 获取新的cookies
    const newCookies = await context.cookies();
    await refreshAccountCookies(accountId, newCookies);
    
    await context.close();
    
    res.json({ code: 0, message: '刷新成功' });
    
  } catch (error: any) {
    console.error('刷新Cookie失败:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    
    res.json({ code: 500, message: '刷新失败' });
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
    lagou: '📊',
    zhipin: '📋'
  };
  return icons[platform] || '📱';
}

export default router;
