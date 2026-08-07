/**
 * Playwright Bridge Routes — 浏览器自动化API
 *
 * 提供:
 *   - 平台登录/状态检查
 *   - 内容发布到抖音/快手/小红书/视频号
 *   - 平台数据采集(招聘/获客)
 *   - 截图/Page实例获取
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import playwrightService from '../services/playwright.service';

const router = Router();

// ─── 登录与状态 ────────────────────────────────

// POST /login — 触发平台登录(返回登录URL，用户需自行扫码)
router.post('/login', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;
    if (!platform) {
      return res.status(400).json({ success: false, error: 'platform is required' });
    }

    const result = await playwrightService.ensureLogin(platform);
    res.json({ success: result.success, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /login-status/:platform — 检查平台登录状态
router.get('/login-status/:platform', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const result = await playwrightService.ensureLogin(platform);
    res.json({ success: true, data: { platform, loggedIn: result.success, message: result.message } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /supported-platforms — 获取支持的平台列表
router.get('/supported-platforms', authMiddleware, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'douyin', name: '抖音', features: ['publish', 'acquisition'] },
      { id: 'kuaishou', name: '快手', features: ['publish', 'acquisition'] },
      { id: 'xiaohongshu', name: '小红书', features: ['publish', 'acquisition'] },
      { id: 'shipinhao', name: '视频号', features: ['publish'] },
      { id: 'bosszhipin', name: 'BOSS直聘', features: ['acquisition', 'recruitment'] },
      { id: 'zhilian', name: '智联招聘', features: ['acquisition', 'recruitment'] },
      { id: 'weibo', name: '微博', features: ['publish', 'acquisition'] },
      { id: 'bilibili', name: 'B站', features: ['publish'] },
    ],
  });
});

// ─── 内容发布 ────────────────────────────────

// POST /publish — 发布内容到指定平台
router.post('/publish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;
    if (!platform) {
      return res.status(400).json({ success: false, error: 'platform is required' });
    }

    const result = await playwrightService.publishContent(platform, {
      platform,
      filePath: req.body.filePath,
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags,
      coverImage: req.body.coverImage,
      postUrl: req.body.postUrl,
    });

    res.json({ success: result.success, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── 截图 ────────────────────────────────

// POST /screenshot — 截取平台当前页面
router.post('/screenshot', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;
    if (!platform) {
      return res.status(400).json({ success: false, error: 'platform is required' });
    }

    const screenshot = await playwrightService.screenshot(platform);
    res.json({ success: true, data: { screenshot: `data:image/png;base64,${screenshot}` } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── 健康检查 ────────────────────────────────

// GET /health — 检查服务是否可用
router.get('/health', (_req: Request, res: Response) => {
  try {
    // 检查 Playwright 是否可用
    const playwrightInstalled = require.resolve('playwright');
    res.json({
      success: true,
      data: {
        available: !!playwrightInstalled,
        platforms: Object.keys(require('../services/playwright.service').PLATFORM_LOGIN_CONFIGS),
      },
    });
  } catch {
    res.json({ success: true, data: { available: false, message: 'Playwright 未安装' } });
  }
});

export default router;
