/**
 * 社交账号授权路由
 * 处理扫码授权、Cookie 导入、账号绑定等
 * 
 * 支持两种授权方式：
 * 1. Cookie 导入（推荐）- 用户导出 Playwright storageState JSON 上传到服务器
 * 2. popup 窗口方式（辅助）- 用户在自己浏览器中打开平台登录页扫码
 * 
 * Cookie 导入借鉴 shipinfabuzhushou 参考系统的成功经验
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';
import {
  createAuthSession,
  checkAuthStatus,
  cancelAuthSession,
  confirmAuthSession,
  getConfirmedSession,
  getPlatformList,
  PLATFORM_CONFIGS,
  validateCookieImport,
  startPlaywrightLogin,
  pollPlaywrightLogin,
  getQrImage,
} from '../services/browser-auth.service';

const router = Router();

// 支持的平台列表
const PLATFORMS = [
  { id: 'douyin', name: '抖音' },
  { id: 'kuaishou', name: '快手' },
  { id: 'xiaohongshu', name: '小红书' },
  { id: 'weibo', name: '微博' },
  { id: 'channels', name: '视频号' },
  { id: 'boss', name: 'BOSS直聘' },
  { id: 'liepin', name: '前程无忧' },
  { id: 'zhilian', name: '智联招聘' },
  { id: 'lagou', name: '拉勾招聘' },
  { id: 'weixin', name: '微信公众号' },
];

/**
 * 获取支持的平台列表
 */
router.get('/platforms', (req: Request, res: Response) => {
  // 合合 PLATFORM_CONFIGS 中的详细信息
  const enrichedPlatforms = PLATFORMS.map(p => {
    const config = PLATFORM_CONFIGS[p.id];
    return {
      ...p,
      icon: config?.icon || '',
      color: config?.color || '',
      status: config?.status || (p.id === 'weixin' ? 'coming' : 'available'),
      loginUrl: config?.loginUrl || '',
    };
  });
  res.json({ code: 0, data: enrichedPlatforms });
});

/**
 * 创建授权会话（popup 窗口方式）
 * 前端调用此端点获取平台登录页URL，在新窗口中让用户扫码
 */
router.post('/session/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ code: 400, message: '请选择平台' });
    }

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      return res.status(400).json({ code: 400, message: '不支持的平台' });
    }

    if (config.status === 'coming') {
      return res.status(400).json({ code: 400, message: `${config.name} 暂未开放，敬请期待` });
    }

    console.log(`[SocialAccount] 用户 ${userId} 请求授权平台: ${platform}`);

    // 使用 browser-auth.service 创建会话
    const result = await createAuthSession(platform);

    if (!result) {
      return res.status(500).json({ code: 500, message: '创建授权会话失败，请重试' });
    }

    // 保存会话到数据库
    await prisma.oAuthSession.create({
      data: {
        userId,
        platform,
        sessionId: result.sessionId,
        state: '',
        status: 'pending',
        expiresAt: result.expiresAt,
      }
    });

    res.json({
      code: 0,
      success: true,
      data: {
        sessionId: result.sessionId,
        platform: result.platform,
        platformName: result.platformName,
        qrMethod: 'popup',
        popupUrl: result.popupUrl,
        expiresAt: result.expiresAt.toISOString(),
      },
    });

  } catch (error: any) {
    console.error('[SocialAccount] 创建授权会话失败:', error);
    res.status(500).json({ code: 500, message: error.message || '创建授权会话失败' });
  }
});

/**
 * 查询授权会话状态（轮询）
 */
router.get('/session/:sessionId/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;

    // 从数据库查找会话
    const dbSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });

    if (!dbSession) {
      return res.json({ code: 404, data: { status: 'not_found' } });
    }

    if (dbSession.userId !== userId) {
      return res.status(403).json({ code: 403, message: '无权查看此会话' });
    }

    // 已确认授权
    if (dbSession.status === 'confirmed') {
      // 创建社交账号记录
      const accountInfo = dbSession.accountInfo as any;
      const existingAccount = await prisma.socialAccount.findFirst({
        where: { userId, platform: dbSession.platform, accountName: accountInfo?.name || '' }
      });

      if (!existingAccount && accountInfo?.name) {
        await prisma.socialAccount.create({
          data: {
            userId,
            platform: dbSession.platform,
            accountName: accountInfo.name || '',
            accountId: `${dbSession.platform}_${userId}_${Date.now().toString(36)}`,
            avatar: accountInfo?.avatar || '',
            isConnected: true,
            status: 'active',
            config: { importMethod: 'popup', note: '通过扫码授权绑定' },
          }
        });
      }

      return res.json({
        code: 0,
        data: {
          status: 'success',
          platform: dbSession.platform,
          accountInfo,
        },
      });
    }

    // 已过期
    if (new Date() > dbSession.expiresAt) {
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: { status: 'expired' }
      });
      return res.json({ code: 0, data: { status: 'expired' } });
    }

    // 检查内存中的实时状态
    const realTimeStatus = await checkAuthStatus(sessionId);

    // popup 方式下前端确认后变为 authorized
    if (realTimeStatus.status === 'authorized') {
      const session = getConfirmedSession(sessionId);
      const accountInfo = session?.accountInfo || {};

      await prisma.oAuthSession.update({
        where: { sessionId },
        data: {
          status: 'confirmed',
          accountInfo: JSON.stringify(accountInfo),
        }
      });

      // 创建社交账号记录
      const existingAccount = await prisma.socialAccount.findFirst({
        where: { userId, platform: dbSession.platform, accountName: accountInfo?.name || '' }
      });

      if (!existingAccount && accountInfo?.name) {
        await prisma.socialAccount.create({
          data: {
            userId,
            platform: dbSession.platform,
            accountName: accountInfo.name || '',
            accountId: `${dbSession.platform}_${userId}_${Date.now().toString(36)}`,
            avatar: accountInfo?.avatar || '',
            isConnected: true,
            status: 'active',
            config: { importMethod: 'popup', note: '通过扫码授权绑定' },
          }
        });
      }

      return res.json({
        code: 0,
        data: {
          status: 'success',
          platform: dbSession.platform,
          accountInfo,
        },
      });
    }

    // 仍在等待
    return res.json({
      code: 0,
      data: {
        status: realTimeStatus.status === 'pending' ? 'waiting' : realTimeStatus.status,
        message: realTimeStatus.message,
      },
    });

  } catch (error: any) {
    console.error('[SocialAccount] 查询会话状态失败:', error);
    res.status(500).json({ code: 500, message: '查询状态失败' });
  }
});

/**
 * 前端确认授权成功
 * popup 方式下，用户在新窗口完成扫码后手动点击确认
 */
router.post('/session/:sessionId/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    const { accountName, accountAvatar } = req.body;

    const dbSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });

    if (!dbSession || dbSession.userId !== userId) {
      return res.status(404).json({ code: 404, message: '会话不存在' });
    }

    // 前端确认授权成功
    const confirmed = confirmAuthSession(sessionId, {
      accountInfo: {
        name: accountName || '授权账号',
        avatar: accountAvatar || '',
        id: `${dbSession.platform}_${userId}`,
      }
    });

    if (!confirmed) {
      return res.status(400).json({ code: 400, message: '确认失败，会话可能已过期' });
    }

    res.json({ code: 0, message: '确认成功' });

  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

/**
 * 取消授权会话
 */
router.delete('/session/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    cancelAuthSession(sessionId);
    await prisma.oAuthSession.update({
      where: { sessionId },
      data: { status: 'cancelled' }
    }).catch(() => {});
    res.json({ code: 0, message: '已取消' });
  } catch (error: any) {
    res.json({ code: 0, message: '已取消' });
  }
});

/**
 * 获取用户社交账号列表
 */
router.get('/accounts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const accounts = await prisma.socialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 为前端增加平台信息
    const enrichedAccounts = accounts.map(a => {
      const config = PLATFORM_CONFIGS[a.platform];
      return {
        ...a,
        platformName: config?.name || a.platform,
        platformIcon: config?.icon || '',
        platformColor: config?.color || '',
      };
    });

    res.json({ code: 0, data: enrichedAccounts });
  } catch (error: any) {
    console.error('获取账号列表失败:', error);
    res.status(500).json({ code: 500, message: '获取账号列表失败' });
  }
});

/**
 * Cookie 导入绑定（推荐方式）
 * 接受 Playwright storageState 格式的 Cookie JSON，验证后绑定账号
 * 
 * 请求体: { platform, cookieData, accountName? }
 * cookieData 格式: { cookies: [...], origins: [{ origin: "...", localStorage: [...] }] }
 * 或纯数组: [{ name, value, domain, ... }]
 */
router.post('/cookie-import', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, cookieData, accountName } = req.body;

    if (!platform) {
      return res.status(400).json({ code: 400, message: '请选择平台' });
    }

    if (!cookieData) {
      return res.status(400).json({ code: 400, message: '请提供 Cookie 数据' });
    }

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      return res.status(400).json({ code: 400, message: '不支持的平台' });
    }

    if (config.status === 'coming') {
      return res.status(400).json({ code: 400, message: `${config.name} 暂未开放，敬请期待` });
    }

    // 验证 Cookie 数据
    const validation = validateCookieImport(platform, cookieData);

    if (!validation.valid) {
      return res.status(400).json({
        code: 400,
        message: validation.message,
        data: { platformCookieCount: validation.cookies.length },
      });
    }

    // 确定 accountName
    const finalAccountName = accountName?.trim() || validation.accountName || `${config.name}用户_${Date.now().toString(36)}`;

    // 检查是否已存在同平台同名的 SocialAccount
    const existingAccount = await prisma.socialAccount.findFirst({
      where: { userId, platform, accountName: finalAccountName },
    });

    if (existingAccount) {
      // 更新已有账号的 Cookie
      const updated = await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          cookies: JSON.stringify({
            cookies: validation.cookies,
            localStorage: validation.localStorage || [],
          }),
          isConnected: true,
          status: 'active',
          lastSyncAt: new Date(),
          syncError: null,
        },
      });

      console.log(`[SocialAccount] Cookie 导入更新: ${config.name} - ${finalAccountName} (${validation.cookies.length} cookies)`);

      return res.json({
        code: 0,
        data: updated,
        message: `Cookie 更新成功，找到 ${validation.cookies.length} 个有效 Cookie`,
      });
    }

    // 创建新的 SocialAccount
    const newAccount = await prisma.socialAccount.create({
      data: {
        userId,
        platform,
        accountName: finalAccountName,
        accountId: `${platform}_${userId}_${Date.now().toString(36)}`,
        cookies: JSON.stringify({
          cookies: validation.cookies,
          localStorage: validation.localStorage || [],
        }),
        isConnected: true,
        status: 'active',
        lastSyncAt: new Date(),
        config: {
          importMethod: 'cookie',
          importedAt: new Date().toISOString(),
          cookieCount: validation.cookies.length,
          hasLocalStorage: (validation.localStorage?.length || 0) > 0,
        },
      },
    });

    console.log(`[SocialAccount] Cookie 导入绑定: ${config.name} - ${finalAccountName} (${validation.cookies.length} cookies)`);

    res.json({
      code: 0,
      data: newAccount,
      message: `绑定成功，找到 ${validation.cookies.length} 个有效 Cookie`,
    });

  } catch (error: any) {
    console.error('[SocialAccount] Cookie 导入失败:', error);
    res.status(500).json({ code: 500, message: error.message || 'Cookie 导入失败' });
  }
});

// ============ Playwright 自动扫码登录 ============

/**
 * 启动 Playwright 扫码登录
 * 
 * 服务器用 Playwright 打开平台登录页，截取二维码返回前端，
 * 用户扫码后前端轮询检查状态，登录成功后自动保存 Cookie
 */
router.post('/qrcode-login', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ code: 400, message: '请选择平台' });
    }

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      return res.status(400).json({ code: 400, message: '不支持的平台' });
    }
    if (config.status === 'coming') {
      return res.status(400).json({ code: 400, message: `${config.name} 暂未开放` });
    }

    console.log(`[SocialAccount] 用户 ${userId} 请求 Playwright 扫码登录: ${platform}`);

    const result = await startPlaywrightLogin(platform, userId);

    if (!result) {
      return res.status(500).json({ 
        code: 500, 
        message: '启动扫码登录失败，服务器可能未安装 Playwright，请使用 Cookie 导入方式' 
      });
    }

    // 保存会话到数据库
    await prisma.oAuthSession.create({
      data: {
        userId,
        platform,
        sessionId: result.sessionId,
        state: 'playwright_qrcode',
        status: 'pending',
        expiresAt: result.expiresAt,
      }
    }).catch(() => {});

    res.json({
      code: 0,
      data: {
        sessionId: result.sessionId,
        platform,
        platformName: result.platformName,
        qrImageData: result.qrImageData,
        expiresAt: result.expiresAt.toISOString(),
      },
    });

  } catch (error: any) {
    console.error('[SocialAccount] Playwright 扫码登录启动失败:', error);
    res.status(500).json({ code: 500, message: '扫码登录启动失败: ' + error.message });
  }
});

/**
 * 轮询检查扫码登录状态
 * 前端每 2-3 秒调用一次，检查用户是否已扫码登录
 */
router.get('/qrcode-login/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await pollPlaywrightLogin(sessionId);

    if (result.status === 'success') {
      // 更新数据库会话状态
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: { status: 'confirmed' }
      }).catch(() => {});
    }

    res.json({
      code: 0,
      data: result,
    });

  } catch (error: any) {
    res.status(500).json({ code: 500, message: '查询登录状态失败' });
  }
});

/**
 * 获取最新二维码截图（二维码可能刷新，需要定期更新）
 */
router.get('/qrcode-login/:sessionId/qr', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const qrImageData = getQrImage(sessionId);
    
    if (!qrImageData) {
      return res.status(404).json({ code: 404, message: '二维码已失效' });
    }

    res.json({ code: 0, data: { qrImageData } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: '获取二维码失败' });
  }
});

/**
 * 绑定社交账号（通过Cookie方式 - 旧接口，兼容）
 */
router.post('/bind', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, accountName, cookies, avatar, note } = req.body;

    if (!platform || !accountName) {
      return res.status(400).json({ code: 400, message: '平台和账号名为必填项' });
    }

    // 检查 SocialAccount 是否已存在
    const existing = await prisma.socialAccount.findFirst({
      where: { userId, platform, accountName },
    });

    if (existing) {
      return res.status(400).json({ code: 400, message: '该账号已绑定' });
    }

    const account = await prisma.socialAccount.create({
      data: {
        userId,
        platform,
        accountName,
        accountId: `${platform}_${userId}_${Date.now().toString(36)}`,
        avatar: avatar || '',
        cookies: cookies ? JSON.stringify(cookies) : null,
        isConnected: true,
        status: 'active',
        config: {
          importMethod: 'manual',
          note: note || '',
        },
      },
    });

    res.json({ code: 0, data: account });
  } catch (error: any) {
    console.error('绑定账号失败:', error);
    res.status(500).json({ code: 500, message: '绑定账号失败' });
  }
});

/**
 * 解绑社交账号
 */
router.delete('/accounts/:accountId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { accountId } = req.params;

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ code: 404, message: '账号不存在或无权操作' });
    }

    await prisma.socialAccount.delete({ where: { id: accountId } });

    res.json({ code: 0, message: '解绑成功' });
  } catch (error: any) {
    console.error('解绑失败:', error);
    res.status(500).json({ code: 500, message: '解绑失败' });
  }
});

/**
 * 更新账号状态
 */
router.put('/accounts/:accountId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { accountId } = req.params;
    const { status, accountName, cookies, config } = req.body;

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ code: 404, message: '账号不存在或无权操作' });
    }

    const updated = await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        ...(status !== undefined && { status, isConnected: status === 'active' }),
        ...(accountName !== undefined && { accountName }),
        ...(cookies !== undefined && { cookies: typeof cookies === 'string' ? cookies : JSON.stringify(cookies) }),
        ...(config !== undefined && { config }),
        lastSyncAt: new Date(),
      },
    });

    res.json({ code: 0, data: updated });
  } catch (error: any) {
    console.error('更新账号失败:', error);
    res.status(500).json({ code: 500, message: '更新账号失败' });
  }
});

/**
 * 智能刷新账号Cookie状态（自动验证 + 自动更新）
 * 用 Playwright 携带已存 Cookie 访问平台，验证登录态并获取最新 Cookie
 */
router.post('/accounts/:accountId/refresh', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { accountId } = req.params;

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return res.status(404).json({ code: 404, message: '账号不存在' });
    }

    // 使用 Cookie 监控服务做智能检查
    const { checkCookieHealth } = await import('../services/cookie-monitor.service');
    const result = await checkCookieHealth(accountId);

    if (result.healthy) {
      res.json({ 
        code: 0, 
        message: 'Cookie 验证通过，已自动刷新为最新版本',
        data: { healthy: true, checkedAt: result.checkedAt },
      });
    } else {
      res.json({ 
        code: 0, 
        message: result.reason || 'Cookie 已失效，请重新授权',
        data: { healthy: false, reason: result.reason, checkedAt: result.checkedAt },
      });
    }
  } catch (error: any) {
    console.error('智能刷新失败:', error);
    res.status(500).json({ code: 500, message: '刷新失败: ' + error.message });
  }
});

/**
 * 手动触发全量 Cookie 健康检查（管理员）
 */
router.post('/check-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { manualCheck } = await import('../services/cookie-monitor.service');
    const result = await manualCheck();
    
    res.json({
      code: 0,
      data: result,
      message: `检查完成：${result.total} 个账号，${result.healthy} 个正常，${result.expired} 个已过期`,
    });
  } catch (error: any) {
    console.error('全量检查失败:', error);
    res.status(500).json({ code: 500, message: '检查失败: ' + error.message });
  }
});

export default router;
