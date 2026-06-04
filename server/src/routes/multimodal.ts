/**
 * 多模态内容生成路由
 */
import { Router } from 'express';
import {
  generateCompleteContentPackage,
  generateVideoFromImage,
  generateNarration,
  batchGenerateContent
} from '../services/multimodal.service';

const router = Router();

// 联合生成完整内容包
router.post('/generate-package', generateCompleteContentPackage);

// 图生视频
router.post('/image-to-video', generateVideoFromImage);

// 语音合成（数字人配音）
router.post('/narration', generateNarration);

// 批量生成
router.post('/batch-generate', batchGenerateContent);

export default router;
