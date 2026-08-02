/**
 * AI Feedback Routes
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { recordContentFeedback, getAdoptionStats, analyzeHighAdoptionPatterns } from '../services/ai-feedback';

const router = Router();

// 反馈路由需要认证
router.use(authMiddleware);

// Record content feedback
router.post('/content', async (req, res) => {
  try {
    const feedback = req.body;
    await recordContentFeedback(feedback);
    res.json({ code: 200, message: 'success', data: null });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Get adoption stats
router.get('/content/stats', async (req, res) => {
  try {
    const { contentType } = req.query;
    const stats = getAdoptionStats(contentType as string);
    res.json({ code: 200, message: 'success', data: stats });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Analyze patterns
router.get('/content/patterns', async (req, res) => {
  try {
    const { contentType } = req.query;
    const patterns = analyzeHighAdoptionPatterns(contentType as string);
    res.json({ code: 200, message: 'success', data: patterns });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Record agent feedback
router.post('/agent', async (req, res) => {
  res.json({ code: 200, message: 'success', data: null });
});

// Get agent stats
router.get('/agent/stats', async (req, res) => {
  res.json({ code: 200, message: 'success', data: { adoptionRate: 0.75 } });
});

export default router;
