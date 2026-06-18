/**
 * 内容合规检测 API 路由 V2
 * 增强功能：图片合规检测、批量检测、敏感词统计、白名单管理
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  checkContentCompliance,
  quickComplianceCheck,
  checkImageCompliance,
  batchComplianceCheck,
  getPlatformRules,
  getSupportedPlatforms,
  getSensitiveWordStats,
  addToWhitelist,
  removeFromWhitelist,
  addExemptUser,
  removeExemptUser,
} from '../services/compliance.service.v2';

const router = Router();

// 内容合规检测（完整版，含AI检测）
router.post('/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, platform, title, useAI } = req.body;
    if (!content) {
      return res.status(400).json({ error: '请提供待检测的内容' });
    }
    const userId = (req as any).userId || 'anonymous';
    const result = await checkContentCompliance(content, platform, title, useAI !== false, userId);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('合规检测失败:', error);
    return res.status(500).json({ error: `合规检测失败: ${error.message}` });
  }
});

// 快速本地检测（不调用AI，用于实时预览）
router.post('/quick-check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, platform, title } = req.body;
    if (!content) {
      return res.status(400).json({ error: '请提供待检测的内容' });
    }
    const result = quickComplianceCheck(content, platform, title);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('快速检测失败:', error);
    return res.status(500).json({ error: `检测失败: ${error.message}` });
  }
});

// 图片合规检测
router.post('/check-image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { imageBase64, platform } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: '请提供图片数据' });
    }
    const result = await checkImageCompliance(imageBase64, platform);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('图片合规检测失败:', error);
    return res.status(500).json({ error: `图片合规检测失败: ${error.message}` });
  }
});

// 批量合规检测
router.post('/batch-check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { items, useAI } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '请提供待检测的内容列表' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: '单次批量检测最多50条' });
    }
    const userId = (req as any).userId || 'system';
    const results = await batchComplianceCheck(items, useAI === true, userId);
    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('批量检测失败:', error);
    return res.status(500).json({ error: `批量检测失败: ${error.message}` });
  }
});

// 获取平台规则（增强版 - 包含正则规则和特殊规则）
router.get('/platform-rules/:platform', authMiddleware, async (req: Request, res: Response) => {
  try {
    const platform = req.params.platform as string;
    const rules = getPlatformRules(platform);
    if (!rules) {
      return res.status(404).json({ error: '不支持的平台' });
    }
    return res.json({
      success: true,
      data: {
        platform: rules.name,
        maxTitleLength: rules.maxTitleLength,
        maxContentLength: rules.maxContentLength,
        bannedContentTypes: rules.bannedContentTypes,
        specialRules: rules.specialRules,
        bannedWordCount: rules.bannedWords.length,
        patternCount: rules.bannedWordPatterns.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: '获取平台规则失败' });
  }
});

// 获取支持的平台列表
router.get('/platforms', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const platforms = getSupportedPlatforms();
    return res.json({ success: true, data: platforms });
  } catch (error: any) {
    return res.status(500).json({ error: '获取平台列表失败' });
  }
});

// 获取敏感词分类统计
router.get('/word-stats', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const stats = getSensitiveWordStats();
    return res.json({ success: true, data: stats });
  } catch (error: any) {
    return res.status(500).json({ error: '获取统计失败' });
  }
});

// 白名单管理（仅管理员）
router.post('/whitelist', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '仅管理员可管理白名单' });
    }
    const { word, action } = req.body;
    if (!word) return res.status(400).json({ error: '请提供词汇' });
    if (action === 'add') {
      addToWhitelist(word);
      return res.json({ success: true, message: `已添加白名单: ${word}` });
    } else if (action === 'remove') {
      removeFromWhitelist(word);
      return res.json({ success: true, message: `已移除白名单: ${word}` });
    }
    return res.status(400).json({ error: '请指定操作: add 或 remove' });
  } catch (error: any) {
    return res.status(500).json({ error: '操作失败' });
  }
});

export default router;
