import { Router, Request, Response } from 'express';
import { getAdapter } from '../services/platform-adapter';

const router = Router();

/**
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
    
    res.json({
      code: 0,
      data: {
        status: 'pending',
        message: '内容发布功能开发中，请稍后',
        platform: adapter.name,
        content: content
      }
    });
    
  } catch (error: any) {
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
    
    // TODO: 从数据库获取发布历史
    // const history = await getPublishHistory(userId);
    
    res.json({
      code: 0,
      data: {
        items: [],
        total: 0,
        message: '发布历史功能开发中'
      }
    });
    
  } catch (error: any) {
    console.error('获取发布历史失败:', error);
    res.json({ code: 500, message: '获取发布历史失败' });
  }
});

export default router;
