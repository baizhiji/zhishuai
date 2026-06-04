/**
 * AI 反馈学习路由
 */
import { Router } from 'express';
import {
  recordContentFeedback,
  batchRecordFeedback,
  getAdoptionStats,
  analyzeHighAdoptionPatterns,
  getAgentAdoptionStats,
  recordAgentFeedback,
  getOptimizedPrompt,
  getPromptOptimizationSuggestions,
  exportFeedbackData
} from '../services/ai-feedback';

const router = Router();

// 内容反馈
router.post('/content', recordContentFeedback);
router.post('/content/batch', batchRecordFeedback);
router.get('/content/stats', getAdoptionStats);
router.get('/content/patterns', analyzeHighAdoptionPatterns);
router.get('/content/optimize', getOptimizedPrompt);
router.get('/content/export', exportFeedbackData);

// 智能体反馈
router.post('/agent', recordAgentFeedback);
router.get('/agent/stats', getAgentAdoptionStats);

// 优化建议
router.get('/suggestions', getPromptOptimizationSuggestions);

export default router;
