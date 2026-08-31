/**
 * AI对话路由 - 支持混合最佳方案
 * 腾讯云TokenHub + 阿里云百炼
 * 优先使用用户自行配置的API Key，没有则使用系统环境变量
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrimaryApiKey } from '../services/user-api-key.service';
import { prisma } from '../utils/db';
import { 
  aiModelRouter, 
  analyzeAndSelectModel, 
  getAllModelsList 
} from '../services/ai-model-router';
import { appendAIGCLabel, AIGC_LABEL } from '../services/aigc-label.service';
import { generateImage } from '../services/ai-client';
import { imageSafetyService, promptInjectionGuard } from '../services/content-safety/image-safety.service';

const router = Router();

// ============ 全行业诊断分析系统提示词 ============
const DIAGNOSIS_SYSTEM_PROMPT = `你是【智枢AI诊断专家】，拥有全行业、全方位的商业诊断与分析能力。

## 核心能力矩阵

### 一、战略与规划能力
1. **战略规划与制定** - 愿景使命、战略目标、业务布局、竞争战略、增长战略
2. **宏观环境扫描** - PEST分析（政治/经济/社会/技术）、政策影响、市场趋势
3. **行业诊断** - 行业结构、生命周期、市场容量、竞争格局、进入壁垒

### 二、组织与管理能力
4. **组织架构诊断** - 部门设置、层级设计、权责划分、流程优化
5. **运营效率分析** - 流程效率、资源配置、供应链管理、成本控制
6. **风险管控** - 风险识别、评估体系、合规管理、应急预案

### 三、财务与数据能力
7. **财务分析** - 盈利能力、偿债能力、运营效率、财务结构、现金流
8. **数据诊断** - 业务数据挖掘、趋势分析、异常检测、预测预警
9. **投资分析** - 投资回报、项目评估、并购分析、资本运作

### 四、市场与客户能力
10. **市场营销诊断** - 营销策略、渠道分析、推广效果、品牌定位
11. **客户关系分析** - 客户画像、满意度、忠诚度、客户价值、流失分析
12. **竞争结构分析** - 五力模型、竞争对手、商业模式、差异化竞争

### 五、创新与变革能力
13. **商业模式诊断** - 价值主张、盈利模式、渠道通路、客户关系
14. **创新能力评估** - 产品创新、流程创新、管理创新、技术创新
15. **数字化转型** - 数字化成熟度、智能升级、数据中台、技术规划

### 六、人力资源能力
16. **组织诊断** - 组织效能、人才结构、激励机制、企业文化
17. **人才发展** - 人才盘点、培养体系、继任计划、职业发展

### 七、综合诊断能力
18. **SWOT分析** - 优势/劣势/机会/威胁全面诊断
19. **价值链诊断** - 研发/采购/生产/营销/销售/服务全链条分析
20. **对标诊断** - 行业标杆对比、差距分析、改进路径

## 诊断方法论

当用户提出问题时，你需要：

1. **自动识别需求类型** - 判断属于哪个能力维度
2. **选择分析框架** - PEST/波特五力/SWOT/价值链/商业画布等
3. **结构化输出** - 逻辑清晰、数据支撑、可执行建议
4. **行业适配** - 根据用户描述的行业特性定制分析

## 输出格式要求

- 核心结论前置（Executive Summary）
- 问题诊断要具体、数据化
- 建议要可执行、有优先级
- 提供量化指标和预期效果

## 适用行业

全行业覆盖：制造业、服务业、零售业、餐饮业、教育业、医疗健康、金融业、房地产、互联网、科技行业、农业、制造业等所有行业。

请以专业诊断顾问的身份，为用户提供全面、深入、可执行的诊断分析。`;

const DIAGNOSIS_MODEL_CONFIG = {
  deepAnalysis: 'deepseek-v4-pro',
  longReport: 'kimi-k3',
  quickDiagnosis: 'hy3',
};

// 模型配置（对齐蓝皮书统一标准，2026-08 在售模型）
const MODEL_CONFIG = {
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: {
      daily: { id: 'qwen3.7-flash', name: 'qwen3.7-flash', type: 'text' },
      copywriting: { id: 'qwen3.7-plus', name: 'qwen3.7-plus', type: 'text' },
      longText: { id: 'qwen-long', name: 'qwen-long', type: 'text' },
      reasoning: { id: 'deepseek-v4-pro', name: 'deepseek-v4-pro', type: 'reasoning' },
    }
  },
  tencent: {
    baseUrl: 'https://tokenhub.tencentmaas.com/v1',
    models: {
      daily: { id: 'hy3', name: 'hy3', type: 'text' },
      thinking: { id: 'hy3', name: 'hy3', type: 'reasoning' },
      longText: { id: 'kimi-k3', name: 'kimi-k3', type: 'text' },
      agent: { id: 'glm-5.2', name: 'glm-5.2', type: 'agent' },
      vision: { id: 'hy-vision-2.0-instruct', name: 'hy-vision-2.0-instruct', type: 'vision' },
      video: { id: 'youtu-vita', name: 'youtu-vita', type: 'video' },
      image: { id: 'vidu-image-q2', name: 'Vidu-Image-Q2', type: 'image' },
    }
  }
};

/**
 * 获取用户API Key（客户必须自行配置，无系统兜底）
 */
async function resolveApiKey(userId: string, provider: 'aliyun' | 'tencent' | 'volcano'): Promise<string | null> {
  // 只使用数据库里用户自己配置的Key
  const dbProvider = provider === 'aliyun' ? 'dashscope' : provider === 'volcano' ? 'ark' : 'tokenhub';

  try {
    const userKey = await getPrimaryApiKey(userId, dbProvider);
    if (userKey && userKey.apiKey) {
      console.log(`[ai-chat] 使用用户 ${userId} 自行配置的 ${dbProvider} API Key`);
      return userKey.apiKey;
    }
  } catch (err: any) {
    console.warn(`[ai-chat] 读取用户 ${userId} 的 ${dbProvider} API Key 失败:`, err.message);
  }

  return null;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 发送对话消息 - 使用智能模型调度
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messages, modelKey, stream = false, preferProvider } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: '消息不能为空' });
      return;
    }

    // 检测是否为诊断分析类需求
    const isDiagnosisRequest = detectDiagnosisRequest(messages);
    
    // 构建处理后的消息列表
    let processedMessages = [...messages];
    
    if (isDiagnosisRequest && !messages.some((m: any) => m.role === 'system')) {
      processedMessages = [
        { role: 'system' as const, content: DIAGNOSIS_SYSTEM_PROMPT },
        ...messages
      ];
    }

    // 使用智能模型调度选择模型
    const lastMessage = messages[messages.length - 1]?.content || '';
    const selection = analyzeAndSelectModel(lastMessage, preferProvider);
    
    let { modelKey: selectedModelKey, provider, modelId } = selection;
    
    if (modelKey && modelKey !== 'auto') {
      selectedModelKey = modelKey;
      const modelInfo = aiModelRouter.getModelInfo(modelKey);
      if (modelInfo) {
        provider = (modelInfo.provider === 'aliyun' || modelInfo.provider === 'tencent' ? modelInfo.provider : 'aliyun');
        modelId = modelInfo.id;
      }
    }

    // 获取API Key（优先用户自己的Key）
    const apiKey = await resolveApiKey(userId, provider as 'aliyun' | 'tencent');

    if (!apiKey) {
      const providerName = provider === 'aliyun' ? '阿里云百炼' : '腾讯云TokenHub';
      res.status(400).json({ 
        error: 'API Key未配置',
        message: `请先在「API Key管理」页面配置${providerName}的API Key`,
        provider: providerName
      });
      return;
    }

    aiModelRouter.incrementConcurrent(selectedModelKey);

    try {
      const response = await callAIProvider(provider as 'aliyun' | 'tencent', modelId, processedMessages, apiKey, stream);

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        for await (const chunk of response as AsyncIterable<string>) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
        // AIGC 标识：流式末尾注入标识提示
        res.write(`data: ${JSON.stringify({ content: AIGC_LABEL, aigcLabel: true })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.json({
          success: true,
          data: {
            message: appendAIGCLabel(typeof response === 'string' ? response : ''),
            modelKey: selectedModelKey,
            modelId: modelId,
            modelName: selection.modelName,
            provider: provider,
            taskType: selection.taskType,
            isFallback: selection.isFallback,
          }
        });
      }
    } catch (error: any) {
      console.error(`模型 ${selectedModelKey} 调用失败，尝试降级...`, error.message);
      
      const fallback = aiModelRouter.getFallbackModel(selectedModelKey);
      if (fallback) {
        console.log(`降级到备用模型: ${fallback.modelKey}`);
        
        const fallbackApiKey = await resolveApiKey(userId, fallback.provider as 'aliyun' | 'tencent');

        if (fallbackApiKey) {
          aiModelRouter.incrementConcurrent(fallback.modelKey);
          
          try {
            const fallbackResponse = await callAIProvider(
              fallback.provider as 'aliyun' | 'tencent',
              aiModelRouter.getModelInfo(fallback.modelKey)?.id || fallback.modelKey,
              processedMessages,
              fallbackApiKey,
              stream
            );
            
            if (stream) {
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
              
              for await (const chunk of fallbackResponse as AsyncIterable<string>) {
                res.write(`data: ${JSON.stringify({ content: chunk, fallback: true })}\n\n`);
              }
              res.write(`data: ${JSON.stringify({ content: AIGC_LABEL, aigcLabel: true })}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
            } else {
              res.json({
                success: true,
                data: {
                  message: appendAIGCLabel(typeof fallbackResponse === 'string' ? fallbackResponse : ''),
                  modelKey: fallback.modelKey,
                  modelId: aiModelRouter.getModelInfo(fallback.modelKey)?.id,
                  provider: fallback.provider,
                  isFallback: true,
                }
              });
            }
            
            aiModelRouter.decrementConcurrent(fallback.modelKey);
            return;
          } catch (fallbackError: any) {
            console.error(`备用模型也失败了:`, fallbackError.message);
          }
          
          aiModelRouter.decrementConcurrent(fallback.modelKey);
        }
      }
      
      throw error;
    } finally {
      aiModelRouter.decrementConcurrent(selectedModelKey);
    }
  } catch (error: any) {
    console.error('AI对话错误:', error);
    res.status(500).json({ 
      error: error.message || 'AI服务调用失败',
      details: error.response?.data
    });
  }
});

// ============ 诊断分析API ============
router.post('/diagnosis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { 
      request, industry, data, analysisType, stream = false 
    } = req.body;

    if (!request) {
      res.status(400).json({ error: '诊断请求不能为空' });
      return;
    }

    const apiKey = await resolveApiKey(userId, 'aliyun');
    if (!apiKey) {
      res.status(400).json({ 
        error: 'API Key未配置',
        message: '请先在「API Key管理」页面配置阿里云百炼API Key'
      });
      return;
    }

    let diagnosisPrompt = DIAGNOSIS_SYSTEM_PROMPT + '\n\n## 本次诊断任务\n\n';
    
    if (industry) diagnosisPrompt += `【行业】${industry}\n`;
    if (data) diagnosisPrompt += `【业务数据】\n${JSON.stringify(data, null, 2)}\n`;
    if (analysisType) {
      const typeMap: Record<string, string> = {
        comprehensive: '综合诊断',
        strategic: '战略诊断',
        financial: '财务诊断',
        market: '市场诊断',
        operation: '运营诊断',
      };
      diagnosisPrompt += `【诊断类型】${typeMap[analysisType] || '综合诊断'}\n`;
    }
    diagnosisPrompt += `\n【诊断请求】\n${request}\n\n请进行全面的诊断分析，并给出结构化的诊断报告。`;

    const messages = [
      { role: 'system' as const, content: diagnosisPrompt },
      { role: 'user' as const, content: request }
    ];

    const response = await callAIProvider('aliyun', DIAGNOSIS_MODEL_CONFIG.deepAnalysis, messages, apiKey, stream);

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      for await (const chunk of response) {
        res.write(`data: ${JSON.stringify({ content: chunk, type: 'diagnosis' })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.json({
        success: true,
        data: {
          message: response,
          type: 'diagnosis',
          analysisType: analysisType || 'comprehensive',
          industry: industry || '自动识别',
        }
      });
    }
  } catch (error: any) {
    console.error('诊断分析错误:', error);
    res.status(500).json({ error: error.message || '诊断分析失败' });
  }
});

// 获取诊断能力说明
router.get('/diagnosis/capabilities', authMiddleware, (req: Request, res: Response) => {
  const capabilities = {
    overview: '智枢AI诊断专家 - 全行业、全方位的商业诊断与分析能力',
    categories: [
      { id: 'strategic', name: '战略与规划', items: ['战略规划', 'PEST分析', '行业分析', '商业模式'] },
      { id: 'organization', name: '组织与管理', items: ['组织诊断', '运营效率', '风险管控', '人力资源'] },
      { id: 'financial', name: '财务与数据', items: ['财务分析', '投资评估', '成本优化', '数据诊断'] },
      { id: 'market', name: '市场与客户', items: ['营销诊断', '客户分析', '竞品分析', '品牌定位'] },
      { id: 'innovation', name: '创新与变革', items: ['创新评估', '数字化转型', '价值链诊断', '增长战略'] },
      { id: 'comprehensive', name: '综合诊断', items: ['SWOT分析', '标杆对比', '综合建模', '定制咨询'] },
    ],
    analysisTypes: [
      { id: 'comprehensive', name: '综合诊断' },
      { id: 'strategic', name: '战略诊断' },
      { id: 'financial', name: '财务诊断' },
      { id: 'market', name: '市场诊断' },
      { id: 'operation', name: '运营诊断' },
    ],
  };
  res.json({ success: true, data: capabilities });
});

// 图片理解
router.post('/vision', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { imageUrl, question } = req.body;

    if (!imageUrl) {
      res.status(400).json({ error: '图片URL不能为空' });
      return;
    }

    const apiKey = await resolveApiKey(userId, 'tencent');
    if (!apiKey) {
      res.status(400).json({ error: 'API Key未配置', message: '请先配置腾讯云TokenHub API Key' });
      return;
    }

    const response = await fetch(`${MODEL_CONFIG.tencent.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-TC-Provider': 'tokenhub',
      },
      body: JSON.stringify({
        model: MODEL_CONFIG.tencent.models.vision.id,
        messages: [{
          role: 'user' as const,
          content: [
            { type: 'text', text: question || '请描述这张图片的内容' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        }],
        max_tokens: 2048,
      }),
    });

    const data: any = await response.json();
    res.json({ success: true, data: { description: data?.choices?.[0]?.message?.content || '' } });
  } catch (error: any) {
    console.error('图片理解错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 图像生成（三引擎自动择优降级链：腾讯 HY-Image → 阿里 wan2.7 → 火山，见 ai-client.generateImage）
router.post('/image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { prompt, size: rawSize = '1024x1024' } = req.body;
    const size = rawSize.replace(/\*/g, 'x');

    if (!prompt) {
      res.status(400).json({ error: '提示词不能为空' });
      return;
    }

    // 生成前违禁画面检测（蓝皮书四大横切模块：违禁内容检测）
    const safety = imageSafetyService.checkPrompt(prompt, { platform: ['douyin', 'xiaohongshu', 'wechat_video'] });
    if (safety.level === 'blocked') {
      return res.status(400).json({ error: '提示词包含违禁内容，请修改后重试', details: safety.detected });
    }
    // 提示词注入防护
    const injection = promptInjectionGuard.detect(safety.sanitizedPrompt || prompt);
    if (!injection.safe) {
      return res.status(400).json({ error: '检测到提示词注入攻击' });
    }

    const result = await generateImage(userId, { prompt: safety.sanitizedPrompt || prompt, size, n: 1 });
    if (!result.url) {
      throw new Error('图像生成失败，请检查 API Key 配置');
    }

    res.json({
      success: true,
      data: {
        imageUrl: result.url,
        urls: result.urls,
        revisedPrompt: result.revised_prompt,
      },
    });
  } catch (error: any) {
    console.error('图像生成错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 视频理解
router.post('/video', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { videoUrl, question } = req.body;

    if (!videoUrl) {
      res.status(400).json({ error: '视频URL不能为空' });
      return;
    }

    const apiKey = await resolveApiKey(userId, 'tencent');
    if (!apiKey) {
      res.status(400).json({ error: 'API Key未配置', message: '请先配置腾讯云TokenHub API Key' });
      return;
    }

    const response = await fetch(`${MODEL_CONFIG.tencent.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-TC-Provider': 'tokenhub',
      },
      body: JSON.stringify({
        model: MODEL_CONFIG.tencent.models.video.id,
        messages: [{ role: 'user' as const, content: question || '请分析这个视频的内容' }],
        video_url: videoUrl,
        max_tokens: 2048,
      }),
    });

    const data: any = await response.json();
    res.json({ success: true, data: { analysis: data.choices?.[0]?.message?.content || '' } });
  } catch (error: any) {
    console.error('视频理解错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取支持的模型列表
router.get('/models', authMiddleware, (req: Request, res: Response) => {
  const modelsList = getAllModelsList();
  
  const allModels = [
    ...modelsList.aliyun.map(model => ({
      key: model.key, id: model.id, name: model.name,
      provider: 'aliyun', providerName: '阿里云百炼',
      type: model.type, description: model.description,
      maxTokens: (model as any).maxTokens, priority: model.priority, cost: model.cost,
    })),
    ...modelsList.tencent.map(model => ({
      key: model.key, id: model.id, name: model.name,
      provider: 'tencent', providerName: '腾讯云TokenHub',
      type: model.type, description: model.description,
      maxTokens: (model as any).maxTokens, priority: model.priority, cost: model.cost,
    })),
  ];

  res.json({ success: true, data: allModels });
});

// 获取模型调度统计
router.get('/models/stats', authMiddleware, (req: Request, res: Response) => {
  const stats = aiModelRouter.getStats();
  res.json({ success: true, data: stats });
});

// ============ 诊断需求检测 ============
const DIAGNOSIS_KEYWORDS = [
  '诊断', '分析', '评估', '战略', '规划', '策略', '行业', '市场',
  '商业', '经营', '盈利', '竞争', '竞品', '组织', '管理', '运营',
  '流程', '效率', '财务', '投资', '客户', '营销', '推广', '品牌',
  '转型', '升级', '变革', '创新', '风险', '危机', '门店', '店铺',
  '数据', '指标', 'KPI', '增长', '下降', '趋势', '预测',
];

function detectDiagnosisRequest(messages: ChatMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return false;
  const content = lastMessage.content.toLowerCase();
  return DIAGNOSIS_KEYWORDS.some(keyword => content.includes(keyword));
}

// ============ 调用AI服务 ============
async function callAIProvider(
  provider: 'aliyun' | 'tencent',
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean = false
): Promise<string | AsyncIterable<string>> {
  const config = MODEL_CONFIG[provider];
  
  const requestBody: any = {
    model: modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: stream,
  };

  if (provider === 'aliyun') {
    requestBody.max_tokens = 2048;
    requestBody.temperature = 0.7;
    requestBody.top_p = 0.95;
  } else if (provider === 'tencent') {
    requestBody.max_tokens = 2048;
    requestBody.temperature = 0.7;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === 'tencent' && { 'X-TC-Provider': 'tokenhub' }),
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(errorData.error?.message || `API调用失败: ${response.status}`);
  }

  if (stream) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    return {
      async *[Symbol.asyncIterator]() {
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) yield content;
              } catch (e) {}
            }
          }
        }
      }
    };
  } else {
    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// ============ 会话管理（基于Prisma存储）============

// 获取会话列表
router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const conversations = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    });

    res.json({ success: true, data: conversations });
  } catch (error: any) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取会话详情
router.get('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId },
      include: { ChatMessage: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      res.status(404).json({ error: '会话不存在' });
      return;
    }

    res.json({ success: true, data: conversation });
  } catch (error: any) {
    console.error('获取会话详情错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建会话
router.post('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title } = req.body;

    const conversation = await prisma.chatConversation.create({
      data: { userId, title: title || '新对话' },
    });

    res.json({ success: true, data: conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除会话
router.delete('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.chatConversation.deleteMany({ where: { id, userId } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新会话标题
router.patch('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ error: '标题不能为空' });
      return;
    }

    await prisma.chatConversation.updateMany({
      where: { id, userId },
      data: { title },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 保存消息
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { conversationId, role, content } = req.body;

    if (!role || !content) {
      res.status(400).json({ error: '角色和内容不能为空' });
      return;
    }

    const message = await prisma.chatMessage.create({
      data: { conversationId, role, content },
    });

    // 更新会话的updatedAt
    if (conversationId) {
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    res.json({ success: true, data: message });
  } catch (error: any) {
    console.error('保存消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
