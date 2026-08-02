import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY
  ? crypto.createHash('sha256').update(process.env.API_KEY_ENCRYPTION_KEY).digest()
  : crypto.randomBytes(32);

function encryptApiKey(key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyIv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, keyIv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return keyIv.toString('hex') + ':' + encrypted;
}

function decryptApiKey(encrypted: string): string {
  const algorithm = 'aes-256-cbc';
  const parts = encrypted.split(':');
  const keyIv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, keyIv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ============================================
// 服务商分类与预设（用于总后台统一管理客户端可见性）
// ============================================
export const PROVIDER_CATEGORIES: Record<string, { name: string; icon: string; types: string[] }> = {
  llm: {
    name: '大语言模型（LLM）',
    icon: 'RobotOutlined',
    types: [
      'openai', 'anthropic', 'deepseek', 'zhipu', 'moonshot', 'qwen',
      'doubao', 'wenxin', 'hunyuan', 'spark', 'baichuan', 'minimax',
      'stepfun', 'yi', 'sensetime',
    ],
  },
  image: {
    name: '图像生成',
    icon: 'PictureOutlined',
    types: [
      'openai-dalle', 'cogview', 'tongyi-wanxiang', 'doubao-image',
      'jimeng', 'midjourney', 'stable-diffusion', 'flux',
    ],
  },
  video: {
    name: '视频生成（AI漫剧/AI短剧）',
    icon: 'VideoCameraOutlined',
    types: [
      'kling', 'sora', 'cogvideox', 'doubao-video', 'tongyi-wanxiang-video',
      'jimeng-video', 'runway', 'pika', 'luma', 'vidu',
    ],
  },
  voice: {
    name: '语音合成（TTS）',
    icon: 'SoundOutlined',
    types: [
      'elevenlabs', 'azure-speech', 'aliyun-tts', 'volcengine-tts',
      'tencent-tts', 'doubao-tts', 'minimax-tts',
    ],
  },
  digital_human: {
    name: '数字人',
    icon: 'UserOutlined',
    types: [
      'tencent-zhiying', 'aliyun-digital-human', 'baidu-digital-human',
      'heygen', 'synthesia', 'doubao-digital-human',
    ],
  },
  aggregator: {
    name: 'API 聚合平台',
    icon: 'ApiOutlined',
    types: [
      'tokenhub', 'dashscope', 'siliconflow', 'oneapi', 'newapi',
      'openrouter',
    ],
  },
};

function inferCategory(type: string): string {
  for (const [cat, info] of Object.entries(PROVIDER_CATEGORIES)) {
    if (info.types.includes(type)) return cat;
  }
  return 'custom';
}

function extractClientVisible(provider: any): boolean {
  if (provider.config && typeof provider.config === 'object') {
    if (typeof provider.config.clientVisible === 'boolean') {
      return provider.config.clientVisible;
    }
  }
  return true;
}

function normalizeProvider(provider: any) {
  const category = inferCategory(provider.type);
  const clientVisible = extractClientVisible(provider);
  return {
    ...provider,
    category,
    clientVisible,
    apiKey: provider.apiKey ? '******' : null,
  };
}

// 客户端 / 代理商：获取可用的服务商列表（仅 enabled + clientVisible）
router.get('/available', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const providers = await prisma.apiProvider.findMany({
      where: { enabled: true },
      orderBy: [{ isDefault: 'desc' }, { priority: 'asc' }],
    });
    let visible = providers
      .map(normalizeProvider)
      .filter((p: any) => p.clientVisible);
    if (category && typeof category === 'string') {
      visible = visible.filter((p: any) => p.category === category);
    }
    res.json({ success: true, data: visible });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/categories', authMiddleware, async (_req: Request, res: Response) => {
  const list = Object.entries(PROVIDER_CATEGORIES).map(([key, info]) => ({
    key,
    ...info,
  }));
  res.json({ success: true, data: list });
});

// 兼容旧路径
router.get('/providers', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const providers = await prisma.apiProvider.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: providers.map(normalizeProvider) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/providers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const provider = await prisma.apiProvider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ success: false, message: '服务商不存在' });
    }
    res.json({ success: true, data: normalizeProvider(provider) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

adminRouter.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = await prisma.apiProvider.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: providers.map(normalizeProvider) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/providers/:id', async (req: Request, res: Response) => {
  try {
    const provider = await prisma.apiProvider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ success: false, message: '服务商不存在' });
    }
    res.json({ success: true, data: normalizeProvider(provider) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.post('/providers', async (req: Request, res: Response) => {
  try {
    const {
      name, type, baseUrl, apiKey, enabled, isDefault, priority, remark,
      clientVisible = true, config: extraConfig = {},
    } = req.body;

    if (isDefault) {
      await prisma.apiProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const mergedConfig = { ...(extraConfig || {}), clientVisible };

    const provider = await prisma.apiProvider.create({
      data: {
        name,
        type: type || 'custom',
        baseUrl,
        apiKey: apiKey ? encryptApiKey(apiKey) : '',
        enabled: enabled !== false,
        isDefault: isDefault || false,
        priority: priority || 100,
        config: mergedConfig,
        remark,
      },
    });

    await prisma.adminLog.create({
      data: {
        userId: (req as any).userId,
        userName: (req as any).userName,
        action: 'create',
        target: 'ApiProvider',
        detail: `创建API服务商: ${name} (${type})`,
      },
    });

    res.json({ success: true, message: '创建成功', data: normalizeProvider(provider) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.put('/providers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, type, baseUrl, apiKey, enabled, isDefault, priority, remark,
      clientVisible, config: extraConfig,
    } = req.body;

    if (isDefault) {
      await prisma.apiProvider.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: any = {
      name,
      type: type || 'custom',
      baseUrl,
      enabled: enabled !== false,
      isDefault: isDefault || false,
      priority: priority || 100,
      remark,
    };

    if (apiKey && !apiKey.includes('******')) {
      updateData.apiKey = encryptApiKey(apiKey);
    }

    if (clientVisible !== undefined || extraConfig) {
      const existing = await prisma.apiProvider.findUnique({ where: { id } });
      const oldConfig = (existing?.config && typeof existing.config === 'object')
        ? existing.config as any : {};
      const newConfig: any = { ...oldConfig, ...(extraConfig || {}) };
      if (clientVisible !== undefined) newConfig.clientVisible = clientVisible;
      updateData.config = newConfig;
    }

    const provider = await prisma.apiProvider.update({ where: { id }, data: updateData });

    await prisma.adminLog.create({
      data: {
        userId: (req as any).userId,
        userName: (req as any).userName,
        action: 'update',
        target: 'ApiProvider',
        detail: `更新API服务商: ${name}`,
      },
    });

    res.json({ success: true, message: '更新成功', data: normalizeProvider(provider) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.delete('/providers/:id', async (req: Request, res: Response) => {
  try {
    const provider = await prisma.apiProvider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ success: false, message: '服务商不存在' });
    }
    await prisma.apiProvider.delete({ where: { id: req.params.id } });
    await prisma.adminLog.create({
      data: {
        userId: (req as any).userId,
        userName: (req as any).userName,
        action: 'delete',
        target: 'ApiProvider',
        detail: `删除API服务商: ${provider.name}`,
      },
    });
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.patch('/providers/:id/toggle', async (req: Request, res: Response) => {
  try {
    const provider = await prisma.apiProvider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ success: false, message: '服务商不存在' });
    }
    const updated = await prisma.apiProvider.update({
      where: { id: req.params.id },
      data: { enabled: !provider.enabled },
    });
    res.json({ success: true, data: normalizeProvider(updated) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/categories-list', async (_req: Request, res: Response) => {
  const list = Object.entries(PROVIDER_CATEGORIES).map(([key, info]) => ({
    key,
    ...info,
  }));
  res.json({ success: true, data: list });
});

export default router;
export { adminRouter as adminApiProvidersAdminRouter };
