/**
 * AI 工具箱路由
 * 话术生成、文案改写、图片描述等工具类AI能力
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrimaryApiKey } from '../services/user-api-key.service';

const router = Router();

/**
 * 获取用户的API Key（客户必须自行配置，无系统兜底）
 */
async function resolveApiKey(userId: string): Promise<{ key: string; provider: 'tencent' | 'aliyun' } | null> {
  // 1. 尝试腾讯云TokenHub
  try {
    const tokenhubKey = await getPrimaryApiKey(userId, 'tokenhub');
    if (tokenhubKey && tokenhubKey.apiKey) {
      return { key: tokenhubKey.apiKey, provider: 'tencent' };
    }
  } catch (err: any) {
    console.warn('[ai-tools] 读取用户tokenhub Key失败:', err.message);
  }

  // 2. 尝试阿里云百炼
  try {
    const dashscopeKey = await getPrimaryApiKey(userId, 'dashscope');
    if (dashscopeKey && dashscopeKey.apiKey) {
      return { key: dashscopeKey.apiKey, provider: 'aliyun' };
    }
  } catch (err: any) {
    console.warn('[ai-tools] 读取用户dashscope Key失败:', err.message);
  }

  return null;
}

const API_CONFIGS = {
  tencent: {
    baseUrl: 'https://tokenhub.tencentmaas.com/v1',
    defaultModel: 'deepseek-v4-pro-202606',
  },
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3.8-max',
  },
};

// AI生成话术
router.post('/generate-script', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { scene, sceneName, scenePrompt, style, context, maxTokens = 500 } = req.body;

    if (!scene) {
      res.status(400).json({ error: '请选择使用场景' });
      return;
    }

    const resolved = await resolveApiKey(userId);
    if (!resolved) {
      res.status(400).json({
        error: 'API Key未配置',
        message: '请先在「API Key管理」页面配置AI模型API Key'
      });
      return;
    }

    const config = API_CONFIGS[resolved.provider];
    const systemPrompt = `你是一个专业的话术创作助手。根据用户提供的场景、风格和要求，生成高质量的话术脚本。

要求：
1. 话术要自然流畅，符合真实的交流场景
2. 根据风格要求调整语气（热情/专业/幽默/正式等）
3. 长度适中，控制在${maxTokens}字以内
4. 话术要有明确的结构：开场白 → 核心内容 → 收尾/引导行动`;

    const userPrompt = [
      `使用场景：${sceneName || scene}`,
      style ? `风格要求：${style}` : '',
      scenePrompt ? `场景描述：${scenePrompt}` : '',
      context ? `补充信息：${context}` : '',
      '请为以上场景生成一段专业话术脚本。',
    ].filter(Boolean).join('\n');

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resolved.key}`,
        ...(resolved.provider === 'tencent' ? { 'X-TC-Provider': 'tokenhub' } : {}),
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorBody: any = await response.json().catch(() => ({}));
      throw new Error(errorBody.error?.message || `AI服务调用失败(${response.status})`);
    }

    const data: any = await response.json();
    const script = data.choices?.[0]?.message?.content || '';

    res.json({
      success: true,
      data: {
        script,
        scene,
        style: style || '标准',
        provider: resolved.provider,
      },
    });
  } catch (error: any) {
    console.error('话术生成错误:', error);
    res.status(500).json({ error: error.message || '话术生成失败' });
  }
});

// AI改写/润色文本
router.post('/rewrite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { text, tone, target, length } = req.body;

    if (!text) {
      res.status(400).json({ error: '文本不能为空' });
      return;
    }

    const resolved = await resolveApiKey(userId);
    if (!resolved) {
      res.status(400).json({ error: 'API Key未配置', message: '请先配置AI模型API Key' });
      return;
    }

    const config = API_CONFIGS[resolved.provider];
    const prompt = `请改写以下文本。${tone ? `语气要求：${tone}。` : ''}${target ? `目标受众：${target}。` : ''}${length ? `长度要求：${length}。` : ''}\n\n原文：\n${text}\n\n改写结果：`;

    const resp = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resolved.key}`,
        ...(resolved.provider === 'tencent' ? { 'X-TC-Provider': 'tokenhub' } : {}),
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.max(text.length * 2, 200),
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      const err: any = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `AI服务调用失败(${resp.status})`);
    }

    const data: any = await resp.json();
    const rewritten = data.choices?.[0]?.message?.content || text;

    res.json({ success: true, data: { text: rewritten, original: text } });
  } catch (error: any) {
    console.error('文本改写错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI提取关键词
router.post('/extract-keywords', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { text, count = 10 } = req.body;

    if (!text) {
      res.status(400).json({ error: '文本不能为空' });
      return;
    }

    const resolved = await resolveApiKey(userId);
    if (!resolved) {
      res.status(400).json({ error: 'API Key未配置', message: '请先配置AI模型API Key' });
      return;
    }

    const config = API_CONFIGS[resolved.provider];
    const prompt = `请从以下文本中提取${count}个最重要的关键词，以JSON数组格式返回（仅返回数组，不要其他文字）：\n\n${text}`;

    const resp = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resolved.key}`,
        ...(resolved.provider === 'tencent' ? { 'X-TC-Provider': 'tokenhub' } : {}),
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const err: any = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `AI服务调用失败(${resp.status})`);
    }

    const data: any = await resp.json();
    let keywords: string[] = [];
    try {
      const raw = data.choices?.[0]?.message?.content || '[]';
      // 尝试从可能包含markdown格式的输出中提取JSON数组
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        keywords = JSON.parse(match[0]);
      }
    } catch (e) {
      // 解析失败时返回空数组
      keywords = [];
    }

    res.json({ success: true, data: { keywords } });
  } catch (error: any) {
    console.error('关键词提取错误:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
