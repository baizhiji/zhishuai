/**
 * Multimodal Routes — 多模态内容处理
 * 使用统一 AI 客户端
 */
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { processMultimodal } from '../services/multimodal.service';

const router = Router();

// Process image
router.post('/image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.userId!;

    const result = await processMultimodal(userId, {
      type: 'image',
      url: imageUrl
    });

    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Process text
router.post('/text', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.userId!;

    const result = await processMultimodal(userId, {
      type: 'text',
      content
    });

    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
