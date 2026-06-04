import { Router } from 'express';
import { processWorkflow } from '../services/ai-workflow';

const router = Router();

// 执行 AI 工作流
router.post('/execute', async (req, res) => {
  try {
    const { workflowType, params } = req.body;
    
    if (!workflowType) {
      return res.status(400).json({
        code: 400,
        message: 'workflowType is required',
        data: null
      });
    }

    const result = await processWorkflow(workflowType, params || {});
    
    res.json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error: any) {
    console.error('Workflow error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || 'Workflow execution failed',
      data: null
    });
  }
});

// 获取工作流列表
router.get('/list', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      workflows: [
        { type: 'content_production', name: '内容生产流水线', description: '从选题到发布的完整流程' },
        { type: 'recruitment', name: '招聘全流程', description: 'JD生成到面试准备的完整流程' },
        { type: 'customer_acquisition', name: '获客话术', description: '引流话术生成流水线' },
      ]
    }
  });
});

export default router;
