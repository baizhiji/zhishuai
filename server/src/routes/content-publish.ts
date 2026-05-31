/**
 * 内容发布 API 路由
 */

import { Router, Request, Response } from 'express';
import {
  publishToPlatforms,
  getPublishHistory,
  getPublishStats,
  getAvailableAccounts,
  createContentDraft,
  getContentTemplates
} from '../services/publish.service';

const router = Router();

/**
 * 获取可用的发布账号
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    const { platforms } = req.query;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    const platformList = platforms 
      ? (platforms as string).split(',')
      : ['douyin', 'kuaishou', 'xiaohongshu', 'weibo'];
    
    const accounts = await getAvailableAccounts(userId, platformList);
    
    res.json({
      code: 0,
      data: accounts.map(acc => ({
        id: acc.id,
        platform: acc.platform,
        platformName: getPlatformName(acc.platform),
        accountName: acc.accountName,
        avatar: acc.avatar,
        status: acc.status
      }))
    });
    
  } catch (error: any) {
    console.error('获取账号失败:', error);
    res.json({ code: 500, message: '获取账号失败' });
  }
});

/**
 * 发布内容
 */
router.post('/publish', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.body.userId;
    const { title, content, mediaUrls, platform, accountIds } = req.body;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    if (!title && !content) {
      return res.json({ code: 400, message: '标题或内容不能为空' });
    }
    
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.json({ code: 400, message: '请选择至少一个发布账号' });
    }
    
    const results = await publishToPlatforms(userId, {
      title,
      content,
      mediaUrls,
      platform: platform || 'all'
    }, accountIds);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.json({
      code: 0,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount
        }
      }
    });
    
  } catch (error: any) {
    console.error('发布失败:', error);
    res.json({ code: 500, message: '发布失败' });
  }
});

/**
 * 获取发布历史
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    const { platform, status, limit, offset } = req.query;
    
    const history = await getPublishHistory(userId, {
      platform: platform as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0
    });
    
    res.json({
      code: 0,
      data: history
    });
    
  } catch (error: any) {
    console.error('获取历史失败:', error);
    res.json({ code: 500, message: '获取历史失败' });
  }
});

/**
 * 获取发布统计
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    const stats = await getPublishStats(userId);
    
    res.json({
      code: 0,
      data: stats
    });
    
  } catch (error: any) {
    console.error('获取统计失败:', error);
    res.json({ code: 500, message: '获取统计失败' });
  }
});

/**
 * 创建内容草稿
 */
router.post('/draft', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.body.userId;
    const { title, content, mediaUrls, platforms } = req.body;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    if (!title && !content) {
      return res.json({ code: 400, message: '标题或内容不能为空' });
    }
    
    const draft = await createContentDraft(userId, {
      title,
      content,
      mediaUrls,
      platforms
    });
    
    res.json({
      code: 0,
      data: {
        id: draft.id,
        title: draft.title,
        content: draft.content
      }
    });
    
  } catch (error: any) {
    console.error('创建草稿失败:', error);
    res.json({ code: 500, message: '创建草稿失败' });
  }
});

/**
 * 获取内容模板
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    const { type } = req.query;
    
    if (!userId) {
      return res.json({ code: 401, message: '未授权' });
    }
    
    const templates = await getContentTemplates(userId, type as string);
    
    res.json({
      code: 0,
      data: templates.map(t => ({
        id: t.id,
        title: t.title,
        content: t.content,
        fileUrl: t.fileUrl,
        createdAt: t.createdAt
      }))
    });
    
  } catch (error: any) {
    console.error('获取模板失败:', error);
    res.json({ code: 500, message: '获取模板失败' });
  }
});

/**
 * 获取平台名称
 */
function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    weibo: '微博',
    boss: 'BOSS直聘'
  };
  return names[platform] || platform;
}

export default router;
