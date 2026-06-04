/**
 * 视频增强路由
 */
import { Router } from 'express';
import videoEnhancer from '../services/video-enhancer';
import voiceClone from '../services/voice-clone';
import digitalHuman from '../services/digital-human';
import realtimeAnalytics from '../services/realtime-analytics';

const router = Router();

// 视频增强路由
router.use('/video', videoEnhancer);

// 语音克隆路由
router.use('/voice', voiceClone);

// 数字人路由
router.use('/digital-human', digitalHuman);

// 实时分析路由
router.use('/analytics', realtimeAnalytics);

// 组合路由 - 一键生成完整内容包
router.post('/generate-complete-package', async (req, res) => {
  try {
    const {
      topic,
      contentType = 'short_video',
      style = 'professional',
      platforms = ['douyin'],
      duration = 30
    } = req.body;
    
    // 调用 multimodal service 的 generatePackage
    const { default: multimodalService } = await import('../services/multimodal.service');
    
    // 生成完整内容包
    const result = await multimodalService.generateCompletePackage({
      topic,
      contentType,
      style,
      platforms,
      duration
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('生成完整包失败:', error);
    res.status(500).json({ error: error.message || '生成失败' });
  }
});

export default router;
