/**
 * 社交账号授权路由
 * 处理扫码授权、账号绑定等（真实二维码：Playwright 打开平台登录页截图）
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import playwrightService from '../services/playwright.service';
import {
  bindSocialAccount,
  getUserAccounts,
  getAccountById,
  unbindAccount,
  updateAccountStatus,
  refreshAccountCookies,
  getAccountStats,
  getPlatformName
} from '../services/social-account.service';

const router = Router();

// OAuth 路由需要认证
router.use(authMiddleware);

/** 仅支持的 3 个平台（智能获客） */
const SUPPORTED_PLATFORMS: Record<string, string> = {
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小红书',
};

/**
 * 获取支持的平台列表（仅 4 平台）
 */
router.get('/platforms', (_req: Request, res: Response) => {
  const platforms = Object.entries(SUPPORTED_PLATFORMS).map(([id, name]) => ({
    key: id,
    name,
    icon: getPlatformIcon(id),
  }));

  res.json({ code: 0, data: platforms });
});

/**
 * 创建扫码登录会话（真实平台登录页截图，含二维码）
 */
router.post('/session/create', async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;
    const userId = req.headers['x-user-id'] as string || (req.body as any).userId;

    if (!platform) {
      return res.json({ code: 400, message: '缺少必要参数 platform' });
    }
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    if (!SUPPORTED_PLATFORMS[platform]) {
      return res.json({ code: 400, message: '不支持的平台' });
    }

    // 启动真实登录会话：打开平台登录页 → 截图（含真实二维码）
    const { sessionId, qrcode } = await playwrightService.startLogin(platform);

    res.json({
      code: 0,
      data: {
        sessionId,
        qrcodeImage: `data:image/png;base64,${qrcode}`,
        platform,
        platformName: SUPPORTED_PLATFORMS[platform],
        expiresIn: 180, // 3 分钟
      },
    });
  } catch (error: any) {
    console.error('创建授权会话失败:', error);
    res.json({ code: 500, message: `创建授权会话失败: ${error.message}` });
  }
});

/**
 * 获取会话状态（轮询扫码结果，登录成功后自动绑定账号）
 */
router.get('/session/:sessionId/status', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);

    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }

    const status = await playwrightService.getLoginStatus(sessionId);

    // 登录成功 → 自动绑定账号（保存 cookies 到数据库）
    if (status.status === 'logged_in') {
      const account = await bindSocialAccount({
        userId,
        platform: status.platform,
        cookies: status.cookies || [],
        accountInfo: {
          name: status.accountInfo?.name,
          avatar: status.accountInfo?.avatar,
        },
      });

      await playwrightService.finishLogin(sessionId);

      return res.json({
        code: 0,
        data: {
          status: 'success',
          platform: status.platform,
          platformName: getPlatformName(status.platform),
          accountId: account.id,
          accountName: account.accountName,
          avatar: account.avatar,
        },
      });
    }

    res.json({
      code: 0,
      data: {
        status: status.status === 'pending' ? 'scanning' : status.status,
        message: status.message,
        platform: status.platform,
        platformName: getPlatformName(status.platform),
      },
    });
  } catch (error: any) {
    console.error('获取会话状态失败:', error);
    res.json({ code: 500, message: `获取会话状态失败: ${error.message}` });
  }
});

/**
 * 取消登录会话
 */
router.post('/session/:sessionId/cancel', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    await playwrightService.cancelLogin(sessionId);
    res.json({ code: 0, message: '已取消授权' });
  } catch (error: any) {
    console.error('取消授权失败:', error);
    res.json({ code: 500, message: `取消授权失败: ${error.message}` });
  }
});

/**
 * 获取用户账号列表（/list 别名）
 */
router.get('/list', async (req: Request, res: Response) => {
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
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);

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
 * 解绑账号 (别名路由，兼容前端调用)
 */
router.post('/unbind/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const userId =
      (req.headers['x-user-id'] as string) ||
      (req.body as any)?.userId ||
      (req.query.userId as string);

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
 * 刷新账号Cookie（重新扫码授权）
 */
router.post('/accounts/:accountId/refresh', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const account = await getAccountById(accountId);

    if (!account) {
      return res.json({ code: 404, message: '账号不存在' });
    }

    // 复用真实登录会话流程刷新
    const { sessionId, qrcode } = await playwrightService.startLogin(account.platform);

    res.json({
      code: 0,
      data: {
        sessionId,
        qrcodeImage: `data:image/png;base64,${qrcode}`,
        platform: account.platform,
        platformName: getPlatformName(account.platform),
        expiresIn: 180,
      },
    });
  } catch (error: any) {
    console.error('刷新Cookie失败:', error);
    res.json({ code: 500, message: '刷新失败' });
  }
});

/**
 * 获取平台图标
 */
function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    douyin: 'douyin',
    kuaishou: 'kuaishou',
    xiaohongshu: 'xiaohongshu',
    weibo: 'weibo',
    boss: 'boss',
    bosszhipin: 'boss',
    zhilian: 'zhilian',
  };
  return icons[platform] || 'default';
}

export default router;
