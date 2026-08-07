/**
 * 商业助手 API 路由
 * 智枢 AI SaaS 系统 - 后端
 */

import { Router, Request, Response } from 'express';
import { businessAssistantService } from '../services/business-assistant.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取商业助手列表（别名 /list 兼容前端调用）
router.get('/list', async (_req: Request, res: Response) => {
  try {
    const scenarios = businessAssistantService.getScenarios();
    res.json({ success: true, data: scenarios });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取商业场景列表
router.get('/scenarios', async (_req: Request, res: Response) => {
  try {
    const scenarios = businessAssistantService.getScenarios();
    res.json({ success: true, data: scenarios });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 生成商业方案
router.post('/generate-plan', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { scenarioId, businessName, businessDescription, targetAudience, budget, timeline, additionalContext } = req.body;

    if (!scenarioId || !businessName || !businessDescription) {
      return res.status(400).json({
        success: false,
        message: '请填写场景类型、企业名称和业务描述',
      });
    }

    const plan = await businessAssistantService.generatePlan({
      scenarioId,
      userId,
      businessName,
      businessDescription,
      targetAudience,
      budget,
      timeline,
      additionalContext,
    });

    res.json({ success: true, data: plan });
  } catch (err: any) {
    console.error('生成方案失败:', err);
    res.status(500).json({ success: false, message: err.message || '生成方案失败' });
  }
});

// 优化方案
router.post('/refine-plan', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { planId, refinementKey, scenarioId } = req.body;

    if (!planId || !refinementKey || !scenarioId) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const result = await businessAssistantService.refinePlan({
      planId,
      userId,
      refinementKey,
      scenarioId,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('优化方案失败:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取用户方案列表
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const plans = await businessAssistantService.getUserPlans(userId);
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取方案详情
router.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const plan = await businessAssistantService.getPlanDetail(req.params.id, userId);
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 导出 PPT
router.get('/export/ppt/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const buffer = await businessAssistantService.exportPPT(req.params.id, userId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="business-plan-${req.params.id}.pptx"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 导出 PDF
router.get('/export/pdf/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const buffer = await businessAssistantService.exportPDF(req.params.id, userId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="business-plan-${req.params.id}.pdf"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 导出 DOCX
router.get('/export/docx/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const buffer = await businessAssistantService.exportDOCX(req.params.id, userId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="business-plan-${req.params.id}.docx"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 自由问答
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: '请提供对话消息' });
    }

    const reply = await businessAssistantService.chat(userId, messages);
    res.json({ success: true, data: { reply } });
  } catch (err: any) {
    console.error('对话失败:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
