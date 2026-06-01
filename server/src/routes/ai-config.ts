import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { 
  getUserApiKeys, 
  createApiKey, 
  updateApiKey, 
  deleteApiKey, 
  toggleApiKey, 
  getApiKeyById,
  testApiKey 
} from '../services/user-api-key.service';

const router = Router();

// 获取用户的API Keys
router.get('/keys', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const keys = await getUserApiKeys(userId);
    
    res.json({
      success: true,
      data: keys
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个API Key详情
router.get('/keys/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const key = await getApiKeyById(id, userId);
    if (!key) {
      return res.status(404).json({ success: false, message: 'API Key不存在' });
    }
    
    res.json({
      success: true,
      data: key
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建API Key
router.post('/keys', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { provider, apiKey, secretKey, isSecondary } = req.body;
    
    // 验证参数
    if (!provider || !['dashscope', 'tokenhub'].includes(provider)) {
      return res.status(400).json({ success: false, message: '请选择服务商（dashscope 或 tokenhub）' });
    }
    if (!apiKey) {
      return res.status(400).json({ success: false, message: '请输入API Key' });
    }
    if (!secretKey) {
      return res.status(400).json({ success: false, message: '请输入Secret Key' });
    }
    
    // 先测试Key是否有效
    const testResult = await testApiKey(provider, apiKey, secretKey);
    if (!testResult.valid) {
      return res.status(400).json({ success: false, message: 'API Key验证失败：' + testResult.message });
    }
    
    const newKey = await createApiKey(userId, provider, apiKey, secretKey, !isSecondary);
    
    res.json({
      success: true,
      message: 'API Key创建成功',
      data: newKey
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 删除API Key
router.delete('/keys/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const deleted = await deleteApiKey(userId, id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'API Key不存在' });
    }
    
    res.json({ success: true, message: 'API Key已删除' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 设置为主Key
router.post('/keys/:id/set-primary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    await toggleApiKey(userId, id, 'primary');
    
    res.json({ success: true, message: '已设为主Key' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 设置为备用Key
router.post('/keys/:id/set-secondary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    await toggleApiKey(userId, id, 'secondary');
    
    res.json({ success: true, message: '已设为备用Key' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
