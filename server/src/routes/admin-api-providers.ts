import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// 加密 API Key
function encryptApiKey(key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyIv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.alloc(32), keyIv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return keyIv.toString('hex') + ':' + encrypted;
}

// 解密 API Key
function decryptApiKey(encrypted: string): string {
  const algorithm = 'aes-256-cbc';
  const parts = encrypted.split(':');
  const keyIv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, Buffer.alloc(32), keyIv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 获取所有API服务商
router.get('/providers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const providers = await prisma.apiProvider.findMany({
      orderBy: { priority: 'asc' }
    });
    
    // 不返回加密的 apiKey
    const safeProviders = providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? '******' : null
    }));
    
    res.json({ success: true, data: safeProviders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个API服务商详情
router.get('/providers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const provider = await prisma.apiProvider.findUnique({
      where: { id: req.params.id }
    });
    
    if (!provider) {
      return res.status(404).json({ success: false, message: '服务商不存在' });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...provider,
        apiKey: provider.apiKey ? '******' : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建API服务商
router.post('/providers', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, type, baseUrl, apiKey, enabled, isDefault, priority, config, remark } = req.body;
    
    // 如果设置为默认，先取消其他默认
    if (isDefault) {
      await prisma.apiProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const provider = await prisma.apiProvider.create({
      data: {
        name,
        type: type || 'coze',
        baseUrl,
        apiKey: apiKey ? encryptApiKey(apiKey) : '',
        enabled: enabled !== false,
        isDefault: isDefault || false,
        priority: priority || 0,
        config: config || {},
        remark
      }
    });
    
    // 记录操作日志
    await prisma.adminLog.create({
      data: {
        userId: (req as any).userId,
        userName: (req as any).userName,
        action: 'create',
        target: 'ApiProvider',
        detail: `创建API服务商: ${name}`
      }
    });
    
    res.json({ 
      success: true, 
      message: '创建成功',
      data: {
        ...provider,
        apiKey: '******'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新API服务商
router.put('/providers/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, type, baseUrl, apiKey, enabled, isDefault, priority, config, remark } = req.body;
    
    // 如果设置为默认，先取消其他默认
    if (isDefault) {
      await prisma.apiProvider.updateMany({
        where: { isDefault: true, id: { not: req.params.id } },
        data: { isDefault: false }
      });
    }
    
    const updateData: any = {
      name,
      type: type || 'coze',
      baseUrl,
      enabled,
      isDefault: isDefault || false,
      priority: priority || 0,
      config: config || {},
      remark
    };
    
    // 如果传了新apiKey才更新
    if (apiKey && !apiKey.includes('******')) {
      updateData.apiKey = encryptApiKey(apiKey);
    }
    
    const provider = await prisma.apiProvider.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    // 记录操作日志
    await prisma.adminLog.create({
      data: {
        userId: (req as any).userId,
        userName: (req as any).userName,
        action: 'update',
        target: 'ApiProvider',
        detail: `更新API服务商: ${name}`
      }
    });
    
    res.json({ 
      success: true, 
      message: '更新成功',
      data: {
        ...provider,
        apiKey: '******'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除API服务商
router.delete('/providers/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const provider = await prisma.apiProvider.findUnique({
      where: { id: req.params.id }
    });
    
    if (!provider) {
      return res.status(404).json({ success: false, message: '服务商不存在' });
    }
    
    // 不能删除默认服务商
    if (provider.isDefault) {
      return res.status(400).json({ success: false, message: '不能删除默认服务商' });
    }
    
    await prisma.apiProvider.delete({
      where: { id: req.params.id }
    });
    
    // 记录操作日志
    await prisma.adminLog.create({
      data: {
        userId: (req as any).userId,
        userName: (req as any).userName,
        action: 'delete',
        target: 'ApiProvider',
        detail: `删除API服务商: ${provider.name}`
      }
    });
    
    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取代理商API配置
router.get('/agent/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    
    // 只允许管理员和代理商查看
    if (userRole !== 'admin' && userRole !== 'agent') {
      return res.status(403).json({ success: false, message: '无权限' });
    }
    
    // 如果是代理商，只能查看自己的配置
    const agentId = userRole === 'agent' ? userId : req.query.agentId;
    
    if (!agentId) {
      return res.status(400).json({ success: false, message: '缺少代理商ID' });
    }
    
    const config = await prisma.agentApiConfig.findUnique({
      where: { agentId },
    });
    
    if (!config) {
      return res.json({ success: true, data: null });
    }
    
    // 获取provider信息
    const provider = await prisma.apiProvider.findUnique({
      where: { id: config.providerId },
      select: { id: true, name: true, type: true, baseUrl: true }
    });
    
    res.json({ 
      success: true, 
      data: {
        ...config,
        provider,
        apiKey: '******'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新代理商API配置
router.put('/agent/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    
    // 只允许管理员和代理商更新
    if (userRole !== 'admin' && userRole !== 'agent') {
      return res.status(403).json({ success: false, message: '无权限' });
    }
    
    const { providerId, apiKey, enabled } = req.body;
    
    // 如果是代理商，只能更新自己的配置
    const agentId = userRole === 'admin' ? req.body.agentId : userId;
    
    if (!agentId) {
      return res.status(400).json({ success: false, message: '缺少代理商ID' });
    }
    
    // 验证服务商存在
    const provider = await prisma.apiProvider.findUnique({
      where: { id: providerId }
    });
    
    if (!provider) {
      return res.status(404).json({ success: false, message: '服务商不存在' });
    }
    
    const updateData: any = {
      providerId,
      enabled: enabled !== false
    };
    
    if (apiKey && !apiKey.includes('******')) {
      updateData.apiKey = encryptApiKey(apiKey);
    }
    
    const config = await prisma.agentApiConfig.upsert({
      where: { agentId },
      create: {
        agentId,
        providerId,
        apiKey: apiKey ? encryptApiKey(apiKey) : '',
        enabled: enabled !== false
      },
      update: updateData
    });
    
    // 记录操作日志
    await prisma.adminLog.create({
      data: {
        userId: (req as any).userId,
        userName: (req as any).userName,
        action: userRole === 'admin' ? 'update' : 'update_agent_config',
        target: 'AgentApiConfig',
        detail: `${userRole === 'admin' ? '管理员' : '代理商'}更新API配置`
      }
    });
    
    res.json({ 
      success: true, 
      message: '配置成功',
      data: {
        ...config,
        apiKey: '******'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取API使用统计
router.get('/usage/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, agentId } = req.query;
    
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    if (agentId) {
      where.agentId = agentId;
    }
    
    const stats = await prisma.apiUsageLog.groupBy({
      by: ['providerName'],
      where,
      _count: { id: true },
      _sum: { 
        requestTokens: true, 
        responseTokens: true,
        cost: true,
        duration: true
      }
    });
    
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取API使用日志
router.get('/usage/logs', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, userId, agentId, providerId, status } = req.query;
    
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (agentId) where.agentId = agentId;
    if (providerId) where.providerId = providerId;
    if (status) where.status = status;
    
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const [logs, total] = await Promise.all([
      prisma.apiUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.apiUsageLog.count({ where })
    ]);
    
    res.json({ 
      success: true, 
      data: {
        list: logs,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取可用的API服务商（供前端调用，返回解密后的key）
router.get('/available', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agentId = (req as any).agentId;
    
    // 1. 先检查代理商是否有自定义配置
    let provider;
    if (agentId) {
      const agentConfig = await prisma.agentApiConfig.findUnique({
        where: { agentId },
      });
      
      if (agentConfig?.enabled) {
        const apiProvider = await prisma.apiProvider.findUnique({
          where: { id: agentConfig.providerId }
        });
        if (apiProvider) {
          provider = {
            ...apiProvider,
            apiKey: decryptApiKey(agentConfig.apiKey)
          };
        }
      }
    }
    
    // 2. 否则使用系统默认
    if (!provider) {
      provider = await prisma.apiProvider.findFirst({
        where: { enabled: true, isDefault: true }
      });
      
      if (provider) {
        provider = {
          ...provider,
          apiKey: decryptApiKey(provider.apiKey)
        };
      }
    }
    
    // 3. 如果还是没有，找优先级最高的
    if (!provider) {
      provider = await prisma.apiProvider.findFirst({
        where: { enabled: true },
        orderBy: { priority: 'asc' }
      });
      
      if (provider) {
        provider = {
          ...provider,
          apiKey: decryptApiKey(provider.apiKey)
        };
      }
    }
    
    if (!provider) {
      return res.status(500).json({ success: false, message: '无可用API服务商' });
    }
    
    res.json({ success: true, data: provider });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
