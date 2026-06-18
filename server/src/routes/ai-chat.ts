/**
 * AI对话路由 - 支持混合最佳方案
 * 腾讯云TokenHub + 阿里云百炼
 * 包含智能模型调度、高并发降级
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { verifyOwnership } from '../middleware/ownership';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';


import { 
  aiModelRouter, 
  analyzeAndSelectModel, 
  getAllModelsList 
} from '../services/ai-model-router';
import { getPrimaryApiKey } from '../services/user-api-key.service';

const router = Router();

// 获取用户API Key（优先使用用户自己配置的Key，fallback到环境变量）
async function getUserApiKey(userId: string, provider: 'aliyun' | 'tencent'): Promise<string | null> {
  const providerKey = provider === 'aliyun' ? 'dashscope' : 'tokenhub';
  const userKey = await getPrimaryApiKey(userId, providerKey);
  if (userKey?.apiKey) {
    return userKey.apiKey;
  }
  // Fallback 到环境变量（管理员全局Key）
  const envKey = provider === 'aliyun' 
    ? process.env.DASHSCOPE_API_KEY || null
    : process.env.TENCENT_TOKENHUB_API_KEY || null;
  return envKey;
}

// ============ 全行业诊断分析系统提示词 ============
export const DIAGNOSIS_SYSTEM_PROMPT = `你是【智枢AI诊断专家】，拥有全行业、全方位的商业诊断与分析能力。

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

export const DIAGNOSIS_MODEL_CONFIG = {
  // 深度诊断 - 使用DeepSeek R1进行复杂推理
  deepAnalysis: 'deepseek-r1-0528',
  // 长文本报告 - 使用Kimi处理超长分析
  longReport: 'kimi-k2.6',
  // 日常诊断 - 使用混元快速响应
  quickDiagnosis: 'hunyuan-2.0-instruct-20251111',
};

// 模型配置 - 混合最佳方案
export const MODEL_CONFIG = {
  // 阿里云百炼
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'DASHSCOPE_API_KEY', // 用户配置的API Key
    models: {
      daily: { id: 'qwen-turbo', name: 'qwen-turbo', type: 'text' },
      copywriting: { id: 'qwen-plus', name: 'qwen-plus', type: 'text' },
      longText: { id: 'qwen-long', name: 'qwen-long', type: 'text' },
      reasoning: { id: 'deepseek-r1-0528', name: 'deepseek-r1', type: 'reasoning' },
    }
  },
  // 腾讯云TokenHub
  tencent: {
    baseUrl: 'https://tokenhub.tencentmaas.com/v1',
    apiKeyEnv: 'TENCENT_TOKENHUB_API_KEY', // 用户配置的API Key
    models: {
      daily: { id: 'hunyuan-2.0-instruct-20251111', name: 'hunyuan-instruct', type: 'text' },
      thinking: { id: 'hunyuan-2.0-thinking-20251109', name: 'hunyuan-thinking', type: 'reasoning' },
      longText: { id: 'kimi-k2.6', name: 'kimi-k2.6', type: 'text' },
      agent: { id: 'glm-5', name: 'glm-5', type: 'agent' },
      vision: { id: 'glm-5v-turbo', name: 'glm-5v-turbo', type: 'vision' },
      video: { id: 'youtu-vita', name: 'youtu-vita', type: 'video' },
      image: { id: 'HY-Image-V3.0', name: 'hy-image-v3', type: 'image' },
      digitalHuman: { id: 'YT-Video-HumanActor', name: 'yt-video-humanactor', type: 'digital_human' },
    }
  }
};

// 对话历史记录类型
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
    
    // 如果是诊断需求，注入系统提示词
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
    let selectedModelName = selection.modelName;
    
    // 如果指定了模型，优先使用指定的模型
    if (modelKey && modelKey !== 'auto') {
      // 兼容横线和下划线两种key格式（前端可能传qwen-turbo，router用qwen_turbo）
      const normalizedKey = modelKey.replace(/-/g, '_');
      selectedModelKey = normalizedKey;
      const modelInfo = aiModelRouter.getModelInfo(normalizedKey);
      if (modelInfo) {
        provider = (modelInfo.provider === 'aliyun' || modelInfo.provider === 'tencent' ? modelInfo.provider : 'aliyun');
        modelId = modelInfo.id;
        selectedModelName = modelInfo.name;
      }
    }

    // 获取API Key（优先使用用户自己的Key）
    const apiKey = await getUserApiKey(userId, provider as 'aliyun' | 'tencent');

    if (!apiKey) {
      res.status(400).json({ 
        error: 'API Key未配置',
        message: '请在「API服务商配置」页面配置API Key',
        provider: provider === 'aliyun' ? '阿里云百炼' : '腾讯云TokenHub'
      });
      return;
    }

    // 增加并发计数
    aiModelRouter.incrementConcurrent(selectedModelKey);

    try {
      // 构建请求
      const response = await callAIProvider(provider as 'aliyun' | 'tencent', modelId, processedMessages, apiKey, stream);

      if (stream) {
        // 流式响应
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        for await (const chunk of response as AsyncIterable<string>) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        // 非流式响应
        const assistantMessage = response as string;
        
        res.json({
          success: true,
          data: {
            message: assistantMessage,
            modelKey: selectedModelKey,
            modelId: modelId,
            modelName: selectedModelName,
            provider: provider,
            taskType: selection.taskType,
            isFallback: selection.isFallback,
          }
        });
      }
    } catch (error: any) {
      // 如果失败，尝试降级到备用模型
      console.error(`模型 ${selectedModelKey} 调用失败，尝试降级...`, error.message);
      
      const fallback = aiModelRouter.getFallbackModel(selectedModelKey);
      if (fallback) {
        console.log(`降级到备用模型: ${fallback.modelKey}`);
        
        const fallbackApiKey = await getUserApiKey(userId, fallback.provider as 'aliyun' | 'tencent');
        
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
              res.write('data: [DONE]\n\n');
              res.end();
            } else {
              res.json({
                success: true,
                data: {
                  message: fallbackResponse,
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
      // 减少并发计数
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

// 获取支持的模型列表
router.get('/models', authMiddleware, (req: Request, res: Response) => {
  const modelsList = getAllModelsList();
  
  // 合并并格式化模型列表
  const allModels = [
    // 阿里云百炼 - 4个模型
    ...modelsList.aliyun.map(model => ({
      key: model.key,
      id: model.id,
      name: model.name,
      provider: 'aliyun',
      providerName: '阿里云百炼',
      type: model.type,
      description: model.description,
      maxTokens: (model as any).maxTokens,
      priority: model.priority,
      cost: model.cost,
    })),
    // 腾讯云TokenHub - 8个模型
    ...modelsList.tencent.map(model => ({
      key: model.key,
      id: model.id,
      name: model.name,
      provider: 'tencent',
      providerName: '腾讯云TokenHub',
      type: model.type,
      description: model.description,
      maxTokens: (model as any).maxTokens,
      priority: model.priority,
      cost: model.cost,
    })),
  ];

  res.json({
    success: true,
    data: allModels,
  });
});

// 获取模型调度统计
router.get('/models/stats', authMiddleware, (req: Request, res: Response) => {
  const stats = aiModelRouter.getStats();
  res.json({
    success: true,
    data: stats,
  });
});

// ============ 诊断需求自动检测 ============
const DIAGNOSIS_KEYWORDS = [
  // 诊断相关
  '诊断', '分析', '评估', '诊断', '评判', '判断', '诊断',
  // 战略相关
  '战略', '规划', '策略', '方案', '策划', '计划', '目标',
  // 行业相关
  '行业', '市场', '市场调研', '市场分析', '行业分析',
  // 商业相关
  '商业', '经营', '盈利', '商业模式', '营收', '利润', '成本',
  // 竞争相关
  '竞争', '竞品', '竞争对手', '差异化', '优势', '劣势',
  // 组织相关
  '组织', '管理', '运营', '流程', '效率', '优化', '改革',
  // 财务相关
  '财务', '投资', '回报', '收益率', '资产', '负债', '现金流',
  // 客户相关
  '客户', '用户', '市场', '营销', '推广', '品牌', '渠道',
  // 转型相关
  '转型', '升级', '变革', '创新', '突破', '增长',
  // 风险相关
  '风险', '危机', '问题', '困境', '挑战', '瓶颈',
  // 实体店相关
  '门店', '店铺', '选址', '客流', '客流量', '营业额', '坪效',
  // 数据相关
  '数据', '指标', 'KPI', '增长', '下降', '趋势', '预测',
];

function detectDiagnosisRequest(messages: ChatMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return false;
  
  const content = lastMessage.content.toLowerCase();
  return DIAGNOSIS_KEYWORDS.some(keyword => content.includes(keyword));
}

// 根据模型类型解析服务商（支持诊断模式自动选择DeepSeek R1）
// 注意：apiKey由调用方通过getUserApiKey获取，此处不再返回apiKey
function resolveModel(modelType?: string, isDiagnosis: boolean = false): { 
  provider: 'aliyun' | 'tencent'; 
  modelId: string; 
} {
  // 诊断模式自动使用DeepSeek R1进行深度推理
  if (isDiagnosis && (modelType === 'daily' || modelType === 'reasoning' || !modelType)) {
    return {
      provider: 'aliyun',
      modelId: DIAGNOSIS_MODEL_CONFIG.deepAnalysis,
    };
  }
  
  // 阿里云模型
  if (modelType?.includes('qwen') || modelType === 'daily' || modelType === 'copywriting' || modelType === 'longText') {
    return {
      provider: 'aliyun',
      modelId: MODEL_CONFIG.aliyun.models[modelType as keyof typeof MODEL_CONFIG.aliyun.models]?.id || 'qwen-turbo',
    };
  }
  
  if (modelType === 'reasoning') {
    return {
      provider: 'aliyun',
      modelId: MODEL_CONFIG.aliyun.models.reasoning.id,
    };
  }

  // 腾讯云模型
  if (modelType?.includes('hunyuan') || modelType?.includes('glm') || 
      modelType?.includes('kimi') || modelType?.includes('youtu') ||
      modelType?.includes('HY-Image') || modelType?.includes('YT-Video')) {
    return {
      provider: 'tencent',
      modelId: MODEL_CONFIG.tencent.models[modelType as keyof typeof MODEL_CONFIG.tencent.models]?.id || modelType,
    };
  }

  // 默认使用腾讯云日常对话
  return {
    provider: 'tencent',
    modelId: MODEL_CONFIG.tencent.models.daily.id,
  };
}

// 使用 chat-history.service.ts 的真实实现
import {
  getConversationList as _getConversationList,
  getConversationDetail as _getConversationDetail,
  deleteConversation as _deleteConversation,
  clearAllConversations as _clearAllConversations,
  updateConversationTitle as _updateConversationTitle,
  saveMessage as _saveMessage,
} from '../services/chat-history.service';

async function getConversationList(userId: string, limit: number, offset: number) {
  return _getConversationList(userId, limit, offset);
}

async function getConversationDetail(id: string, userId: string) {
  return _getConversationDetail(id, userId);
}

async function deleteConversation(id: string, userId: string) {
  return _deleteConversation(id, userId);
}

async function clearAllConversations(userId: string) {
  return _clearAllConversations(userId);
}

async function updateConversationTitle(id: string, userId: string, title: string) {
  return _updateConversationTitle(id, userId, title);
}


// 调用AI服务提供商
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
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    stream: stream,
  };

  // 根据不同服务商添加特定参数
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
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(errorData.error?.message || `API调用失败: ${response.status}`);
  }

  if (stream) {
    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    return {
      async *[Symbol.asyncIterator]() {
        while (true) {
          const { done, value } = await reader!.read();
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

// ============ 专门的诊断分析API ============
router.post('/diagnosis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { 
      request,           // 诊断请求描述
      industry,          // 行业类型（可选，自动识别）
      data,              // 业务数据（可选）
      analysisType,      // 分析类型：comprehensive|strategic|financial|market|operation
      stream = false 
    } = req.body;

    if (!request) {
      res.status(400).json({ error: '诊断请求不能为空' });
      return;
    }

    // 获取API Key（优先使用用户自己的Key）
    const apiKey = await getUserApiKey(userId, 'aliyun');
    if (!apiKey) {
      res.status(400).json({ 
        error: 'API Key未配置',
        message: '请在「API服务商配置」页面配置您的API Key，或在「个人设置」中绑定您的API Key'
      });
      return;
    }

    // 构建诊断提示词
    let diagnosisPrompt = DIAGNOSIS_SYSTEM_PROMPT + '\n\n## 本次诊断任务\n\n';
    
    if (industry) {
      diagnosisPrompt += `【行业】${industry}\n`;
    }
    if (data) {
      diagnosisPrompt += `【业务数据】\n${JSON.stringify(data, null, 2)}\n`;
    }
    if (analysisType) {
      const typeMap = {
        comprehensive: '综合诊断 - 全方位诊断分析',
        strategic: '战略诊断 - 战略规划与竞争分析',
        financial: '财务诊断 - 财务健康度与风险评估',
        market: '市场诊断 - 市场营销与客户分析',
        operation: '运营诊断 - 组织运营与流程效率',
      };
      diagnosisPrompt += `【诊断类型】${typeMap[analysisType as keyof typeof typeMap] || '综合诊断'}\n`;
    }
    diagnosisPrompt += `\n【诊断请求】\n${request}\n\n请进行全面的诊断分析，并给出结构化的诊断报告。`;

    const messages = [
      { role: 'system' as const, content: diagnosisPrompt },
      { role: 'user' as const, content: request }
    ];

    // 使用DeepSeek R1进行深度诊断
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
    res.status(500).json({ 
      error: error.message || '诊断分析失败',
      details: error.response?.data
    });
  }
});

// ============ 获取诊断能力说明 ============
router.get('/diagnosis/capabilities', authMiddleware, (req: Request, res: Response) => {
  const capabilities = {
    overview: '智枢AI诊断专家 - 全行业、全方位的商业诊断与分析能力',
    categories: [
      {
        id: 'strategic',
        name: '战略与规划',
        items: ['战略规划与制定', '宏观环境扫描(PEST)', '行业竞争结构分析', '商业模式诊断']
      },
      {
        id: 'organization',
        name: '组织与管理',
        items: ['组织架构诊断', '运营效率分析', '风险管控评估', '人力资源管理']
      },
      {
        id: 'financial',
        name: '财务与数据',
        items: ['财务健康度分析', '投资回报评估', '成本结构优化', '数据挖掘诊断']
      },
      {
        id: 'market',
        name: '市场与客户',
        items: ['市场营销诊断', '客户关系分析', '竞品结构分析', '品牌定位评估']
      },
      {
        id: 'innovation',
        name: '创新与变革',
        items: ['创新能力评估', '数字化转型', '价值链诊断', '增长战略制定']
      },
      {
        id: 'comprehensive',
        name: '综合诊断',
        items: ['SWOT全面分析', '标杆对比诊断', '综合诊断建模', '定制化咨询']
      }
    ],
    analysisTypes: [
      { id: 'comprehensive', name: '综合诊断', description: '全方位诊断分析' },
      { id: 'strategic', name: '战略诊断', description: '战略规划与竞争分析' },
      { id: 'financial', name: '财务诊断', description: '财务健康度与风险评估' },
      { id: 'market', name: '市场诊断', description: '市场营销与客户分析' },
      { id: 'operation', name: '运营诊断', description: '组织运营与流程效率' },
    ],
    supportedIndustries: '全行业覆盖',
    model: 'DeepSeek R1 (深度推理)'
  };

  res.json({
    success: true,
    data: capabilities
  });
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

    const apiKey = await getUserApiKey(userId, 'tencent');
    if (!apiKey) {
      res.status(400).json({ error: 'API Key未配置，请在「个人设置」中绑定您的API Key' });
      return;
    }

    // 调用腾讯云GLM多模态模型
    const response = await fetch(`${MODEL_CONFIG.tencent.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_CONFIG.tencent.models.vision.id,
        messages: [
          {
            role: 'user' as const,
            content: [
              { type: 'text', text: question || '请描述这张图片的内容' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 2048,
      }),
    });

    const data: any = await response.json();
    const description = data?.choices?.[0]?.message?.content || '';

    res.json({
      success: true,
      data: { description },
    });
  } catch (error: any) {
    console.error('图片理解错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 图像生成
router.post('/image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      res.status(400).json({ error: '提示词不能为空' });
      return;
    }

    const apiKey = await getUserApiKey(userId, 'tencent');
    if (!apiKey) {
      res.status(400).json({ error: 'API Key未配置，请在「个人设置」中绑定您的API Key' });
      return;
    }

    // 调用腾讯云图像生成
    const response = await fetch(`${MODEL_CONFIG.tencent.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_CONFIG.tencent.models.image.id,
        prompt,
        size,
        quality,
        n: 1,
      }),
    });

    const data: any = await response.json();
    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('图像生成失败');
    }

    res.json({
      success: true,
      data: { imageUrl, revisedPrompt: data.data?.[0]?.revised_prompt },
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

    const apiKey = await getUserApiKey(userId, 'tencent');
    if (!apiKey) {
      res.status(400).json({ error: 'API Key未配置，请在「个人设置」中绑定您的API Key' });
      return;
    }

    // 调用腾讯云视频理解
    const response = await fetch(`${MODEL_CONFIG.tencent.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_CONFIG.tencent.models.video.id,
        messages: [
          {
            role: 'user' as const,
            content: question || '请分析这个视频的内容',
          },
        ],
        // 视频理解可能需要不同的API端点或参数
        video_url: videoUrl,
        max_tokens: 2048,
      }),
    });

    const data: any = await response.json();
    const analysis = data.choices?.[0]?.message?.content || '';

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error: any) {
    console.error('视频理解错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ 对话会话管理 ============

// 获取会话列表
router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 50, offset = 0 } = req.query;

    const result = await getConversationList(userId, Number(limit), Number(offset));

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取会话详情
router.get('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { id } = req.params;

    const conversation = await getConversationDetail(id, userId);

    if (!conversation) {
      res.status(404).json({ error: '会话不存在' });
      return;
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('获取会话详情错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除会话
router.delete('/conversations/:id', authMiddleware, verifyOwnership('chatConversation'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { id } = req.params;

    const success = await deleteConversation(id, userId);

    if (!success) {
      res.status(404).json({ error: '会话不存在' });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('删除会话错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 清空所有会话
router.delete('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await clearAllConversations(userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('清空会话错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新会话标题
router.patch('/conversations/:id', authMiddleware, verifyOwnership('chatConversation'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ error: '标题不能为空' });
      return;
    }

    await updateConversationTitle(id, userId, title);

    res.json({ success: true });
  } catch (error: any) {
    console.error('更新会话标题错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取AI模型列表
router.get('/models', authMiddleware, async (req: Request, res: Response) => {
  try {
    const models = [
      { id: 'qwen-plus', name: '通义千问 Plus', provider: 'aliyun', type: 'chat' },
      { id: 'qwen-max', name: '通义千问 Max', provider: 'aliyun', type: 'chat' },
      { id: 'qwen-vl-plus', name: '通义千问 VL Plus', provider: 'aliyun', type: 'vision' },
      { id: 'qwen-audio-turbo', name: '通义千问 音频', provider: 'aliyun', type: 'audio' },
      { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'aliyun', type: 'chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'aliyun', type: 'reasoning' },
    ];

    res.json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    console.error('获取模型列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 保存聊天消息
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { conversationId, role, content, model, provider, tokens, latency, metadata } = req.body;

    if (!role || !content) {
      res.status(400).json({ error: '角色和内容不能为空' });
      return;
    }

    // @ts-ignore
    const result = await saveMessage({
      userId,
      conversationId,
      role,
      content,
      model,
      provider,
      tokens,
      latency,
      metadata,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('保存消息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
