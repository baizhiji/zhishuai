/**
 * 素材去重 API 路由
 * 检测重复/相似素材 + 使用追踪
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  checkDuplicate,
  computeAndStoreFingerprint,
  checkMaterialUsageOnPlatform,
  markMaterialAsUsed,
  batchDetectDuplicates,
  computeSimHash,
  computeContentHash,
  isSimilar,
} from '../services/material-dedup.service';

const router = Router();

// 检测素材是否重复（上传/创建前检测）
router.post('/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, content, fileHash } = req.body;

    const result = await checkDuplicate(userId, type, content, fileHash);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 检查素材在指定平台是否可用
router.get('/:id/usage/:platform', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, platform } = req.params;
    const result = await checkMaterialUsageOnPlatform(id, platform);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 标记素材已使用
router.post('/:id/mark-used', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    await markMaterialAsUsed(id, platform);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 为素材计算指纹
router.post('/:id/fingerprint', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await computeAndStoreFingerprint(id);
    res.json({ success: true, message: '指纹计算完成' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量检测重复素材
router.post('/batch-detect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await batchDetectDuplicates(userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 计算文本 SimHash（调试用）
router.post('/simhash', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const hash = computeSimHash(text);
    res.json({ success: true, data: { simHash: hash, contentHash: computeContentHash(text) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
