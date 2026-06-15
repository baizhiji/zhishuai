<<<<<<< HEAD
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
=======
import { Router, Request, Response } from 'express';
import { getAdapter } from '../services/platform-adapter';
>>>>>>> 962968886be726cd434c792933b5515366d34518

const router = Router();

/**
<<<<<<< HEAD
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
=======
 * 内容发布请求类型
 */
interface PublishContentRequest {
  platform: string;
  userId: string;
  content: {
    text?: string;
    images?: string[];
    videos?: string[];
    title?: string;
  };
}

/**
 * 发布内容到平台
 */
router.post('/publish', async (req: Request, res: Response) => {
  let browser = null;
  
  try {
    const { platform, userId, content } = req.body as PublishContentRequest;
    
    if (!platform || !userId) {
      return res.json({ code: 400, message: '缺少必要参数' });
    }
    
    if (!content.text && !content.images?.length && !content.videos?.length) {
      return res.json({ code: 400, message: '内容不能为空' });
    }
    
    // 获取平台适配器
    const adapter = getAdapter(platform);
    
    if (!adapter) {
      return res.json({ code: 400, message: '不支持该平台' });
    }
    
    // 验证平台是否支持发布
    if (!adapter.capabilities.canPublish) {
      return res.json({ code: 400, message: `${adapter.name} 暂不支持自动发布` });
    }
    
    // TODO: 从数据库获取用户账号和Cookie
    // const account = await getAccountByPlatform(platform, userId);
    // if (!account) {
    //   return res.json({ code: 400, message: '请先绑定账号' });
    // }
>>>>>>> 962968886be726cd434c792933b5515366d34518
    
    res.json({
      code: 0,
      data: {
<<<<<<< HEAD
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount
        }
=======
        status: 'pending',
        message: '内容发布功能开发中，请稍后',
        platform: adapter.name,
        content: content
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }
    });
    
  } catch (error: any) {
<<<<<<< HEAD
    console.error('发布失败:', error);
    res.json({ code: 500, message: '发布失败' });
=======
    console.error('发布内容失败:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    
    res.json({ code: 500, message: `发布失败: ${error.message}` });
  }
});

/**
 * 获取平台发布能力
 */
router.get('/capabilities/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const adapter = getAdapter(platform);
    
    if (!adapter) {
      return res.json({ code: 400, message: '不支持该平台' });
    }
    
    res.json({
      code: 0,
      data: {
        platform: adapter.name,
        capabilities: adapter.capabilities,
        loginUrl: adapter.getLoginUrl()
      }
    });
    
  } catch (error: any) {
    console.error('获取平台能力失败:', error);
    res.json({ code: 500, message: '获取平台能力失败' });
  }
});

/**
 * 批量发布内容
 */
router.post('/batch-publish', async (req: Request, res: Response) => {
  try {
    const { platforms, userId, content } = req.body as {
      platforms: string[];
      userId: string;
      content: PublishContentRequest['content'];
    };
    
    if (!platforms?.length || !userId) {
      return res.json({ code: 400, message: '缺少必要参数' });
    }
    
    const results = [];
    
    for (const platform of platforms) {
      const adapter = getAdapter(platform);
      
      if (!adapter || !adapter.capabilities.canPublish) {
        results.push({
          platform,
          success: false,
          message: '平台不支持发布'
        });
        continue;
      }
      
      results.push({
        platform,
        success: true,
        message: '已加入发布队列'
      });
    }
    
    res.json({
      code: 0,
      data: {
        total: platforms.length,
        results
      }
    });
    
  } catch (error: any) {
    console.error('批量发布失败:', error);
    res.json({ code: 500, message: '批量发布失败' });
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
    
<<<<<<< HEAD
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
=======
    // TODO: 从数据库获取发布历史
    // const history = await getPublishHistory(userId);
>>>>>>> 962968886be726cd434c792933b5515366d34518
    
    res.json({
      code: 0,
      data: {
<<<<<<< HEAD
        id: draft.id,
        title: draft.title,
        content: draft.content
=======
        items: [],
        total: 0,
        message: '发布历史功能开发中'
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }
    });
    
  } catch (error: any) {
<<<<<<< HEAD
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

=======
    console.error('获取发布历史失败:', error);
    res.json({ code: 500, message: '获取发布历史失败' });
  }
});

>>>>>>> 962968886be726cd434c792933b5515366d34518
export default router;
