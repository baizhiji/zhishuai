/**
 * 多模型管道 API 路由 V3
 * 补全3个缺失管道：recruitment-chat, acquisition-outreach, auto-reply
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  generateCopywritingPipeline,
  generateXiaohongshuPipeline,
  generateTitlePipeline,
  generateEcommercePipeline,
  generateVideoScriptPipeline,
  generateRecruitmentJDPipeline,
  generateRecruitmentChatPipeline,
  generateAcquisitionOutreachPipeline,
  generateAutoReplyPipeline,
  getAvailablePipelines,
  getModelAssignments,
} from '../services/pipeline.service';

const router = Router();

// 获取可用管道列表
router.get('/list', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ success: true, data: getAvailablePipelines() });
});

// 获取模型分配配置
router.get('/model-assignments', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ success: true, data: getModelAssignments() });
});

// 通用管道执行入口
router.post('/execute', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      pipeline, description, style, wordCount, count, platform, duration,
      productName, requirements, companyInfo,
      // 新增：招聘沟通参数
      candidateInfo, jobDescription, chatGoal,
      // 新增：获客话术参数
      targetInfo, productInfo,
      // 新增：自动回复参数
      incomingMessage, context, replyStyle,
    } = req.body;

    if (!pipeline) {
      return res.status(400).json({ error: '请指定管道类型' });
    }

    let result;
    switch (pipeline) {
      case 'copywriting':
        if (!description) return res.status(400).json({ error: '请提供内容描述' });
        result = await generateCopywritingPipeline(description, style, wordCount, platform, userId);
        break;

      case 'xiaohongshu':
        if (!description) return res.status(400).json({ error: '请提供内容描述' });
        result = await generateXiaohongshuPipeline(description, style, userId);
        break;

      case 'title':
        if (!description) return res.status(400).json({ error: '请提供内容描述' });
        result = await generateTitlePipeline(description, count, platform, userId);
        break;

      case 'ecommerce':
        if (!description) return res.status(400).json({ error: '请提供产品描述' });
        result = await generateEcommercePipeline(productName || description, description, userId);
        break;

      case 'video-script':
        if (!description) return res.status(400).json({ error: '请提供视频描述' });
        result = await generateVideoScriptPipeline(description, duration, style, userId);
        break;

      case 'recruitment-jd':
        if (!description) return res.status(400).json({ error: '请提供岗位信息' });
        result = await generateRecruitmentJDPipeline(description, requirements || '', companyInfo, userId);
        break;

      case 'recruitment-chat':
        if (!candidateInfo || !jobDescription) {
          return res.status(400).json({ error: '请提供候选人信息和职位描述' });
        }
        result = await generateRecruitmentChatPipeline(
          candidateInfo, jobDescription, chatGoal || 'greet', userId
        );
        break;

      case 'acquisition-outreach':
        if (!targetInfo || !productInfo) {
          return res.status(400).json({ error: '请提供目标客户信息和产品信息' });
        }
        result = await generateAcquisitionOutreachPipeline(targetInfo, productInfo, platform, userId);
        break;

      case 'auto-reply':
        if (!incomingMessage) {
          return res.status(400).json({ error: '请提供对方消息内容' });
        }
        result = await generateAutoReplyPipeline(
          incomingMessage, context || '', replyStyle || 'friendly', platform, userId
        );
        break;

      default:
        return res.status(400).json({ error: `不支持的管道类型: ${pipeline}` });
    }

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('管道执行失败:', error);
    return res.status(500).json({ error: `管道执行失败: ${error.message}` });
  }
});

export default router;
