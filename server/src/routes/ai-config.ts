import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { 
  getUserApiKeys, 
  createApiKey, 
  updateApiKey, 
  deleteApiKey, 
  toggleApiKey, 
  getApiKeyById,
  testApiKey,
  normalizeProvider
} from '../services/user-api-key.service';

// 允许的服务商（含标准命名 alibaba/tencent/volcano 与存储值 dashscope/tokenhub/ark）
const ALLOWED_PROVIDERS = ['dashscope', 'tokenhub', 'ark', 'alibaba', 'tencent', 'volcano'];

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
    if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, message: '请选择服务商（阿里云百炼/腾讯云TokenHub/火山方舟）' });
    }
    if (!apiKey) {
      return res.status(400).json({ success: false, message: '请输入API Key' });
    }
    if (!secretKey) {
      return res.status(400).json({ success: false, message: '请输入Secret Key' });
    }

    // 归一化服务商命名（alibaba/tencent/volcano → dashscope/tokenhub/ark），统一存储
    const normalizedProvider = normalizeProvider(provider);
    
    // 先测试Key是否有效
    const testResult = await testApiKey(normalizedProvider, apiKey, secretKey);
    if (!testResult.valid) {
      return res.status(400).json({ success: false, message: 'API Key验证失败：' + testResult.message });
    }
    
    const newKey = await createApiKey(userId, normalizedProvider, apiKey, secretKey, !isSecondary);
    
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
