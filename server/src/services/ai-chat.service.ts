/**
 * AI 对话服务层
 * 封装会话管理、诊断检测的业务逻辑
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── 诊断关键词 ───
const DIAGNOSIS_KEYWORDS = [
  '诊断', '分析', '评估', '评判', '判断',
  '战略', '规划', '策略', '方案', '策划', '计划', '目标',
  '行业', '市场', '市场调研', '市场分析', '行业分析',
  '商业', '经营', '盈利', '商业模式', '营收', '利润', '成本',
  '竞争', '竞品', '竞争对手', '差异化', '优势', '劣势',
  '组织', '管理', '运营', '流程', '效率', '优化', '改革',
  '财务', '投资', '回报', '收益率', '资产', '负债', '现金流',
  '客户', '用户', '营销', '推广', '品牌', '渠道',
  '转型', '升级', '变革', '创新', '突破', '增长',
  '风险', '危机', '问题', '困境', '挑战', '瓶颈',
  '门店', '店铺', '选址', '客流', '客流量', '营业额', '坪效',
  '数据', '指标', 'KPI', '增长', '下降', '趋势', '预测',
];

// ─── 类型 ───
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SaveMessageInput {
  userId: string;
  conversationId?: string | null;
  role: string;
  content: string;
  model?: string;
  provider?: string;
  tokens?: number;
  latency?: number;
  metadata?: unknown;
}

// ─── 诊断检测 ───
export function detectDiagnosisRequest(messages: ChatMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return false;

  const content = lastMessage.content.toLowerCase();
  return DIAGNOSIS_KEYWORDS.some(keyword => content.includes(keyword));
}

// ─── 会话管理 ───
export async function getConversationList(userId: string, limit: number, offset: number) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
}

export async function getConversationDetail(id: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function deleteConversation(id: string, userId: string) {
  const conv = await prisma.conversation.findFirst({ where: { id, userId } });
  if (!conv) return false;
  await prisma.conversation.delete({ where: { id } });
  return true;
}

export async function clearAllConversations(userId: string) {
  await prisma.conversation.deleteMany({ where: { userId } });
  return true;
}

export async function updateConversationTitle(id: string, userId: string, title: string) {
  const conv = await prisma.conversation.findFirst({ where: { id, userId } });
  if (!conv) return false;
  await prisma.conversation.update({ where: { id }, data: { title } });
  return true;
}

// ─── 消息保存 ───
export async function saveMessage(input: SaveMessageInput) {
  const { userId, conversationId, role, content } = input;

  let convId = conversationId;
  if (!convId) {
    const title = content.length > 30 ? content.slice(0, 30) + '...' : content;
    const conv = await prisma.conversation.create({
      data: { userId, title },
    });
    convId = conv.id;
  } else {
    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });
  }

  return prisma.message.create({
    data: {
      conversationId: convId,
      role,
      content,
    },
  });
}

// ─── 模型配置 ───
export const DIAGNOSIS_MODEL_CONFIG = {
  deepAnalysis: 'deepseek-r1-0528',
  longReport: 'kimi-k2.6',
  quickDiagnosis: 'hunyuan-2.0-instruct-20251111',
};

export const MODEL_CONFIG = {
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    models: {
      daily: { id: 'qwen-turbo', name: 'qwen-turbo', type: 'text' },
      copywriting: { id: 'qwen-plus', name: 'qwen-plus', type: 'text' },
      longText: { id: 'qwen-long', name: 'qwen-long', type: 'text' },
      reasoning: { id: 'deepseek-r1-0528', name: 'deepseek-r1', type: 'reasoning' },
    },
  },
  tencent: {
    baseUrl: 'https://tokenhub.cloud.tencent.com',
    apiKeyEnv: 'TENCENT_TOKENHUB_API_KEY',
    models: {
      daily: { id: 'hunyuan-2.0-instruct-20251111', name: 'hunyuan-instruct', type: 'text' },
      thinking: { id: 'hunyuan-2.0-thinking-20251109', name: 'hunyuan-thinking', type: 'reasoning' },
      longText: { id: 'kimi-k2.6', name: 'kimi-k2.6', type: 'text' },
      agent: { id: 'glm-5', name: 'glm-5', type: 'agent' },
      vision: { id: 'glm-5v-turbo', name: 'glm-5v-turbo', type: 'vision' },
      video: { id: 'youtu-vita', name: 'youtu-vita', type: 'video' },
      image: { id: 'HY-Image-V3.0', name: 'hy-image-v3', type: 'image' },
      digitalHuman: { id: 'YT-Video-HumanActor', name: 'yt-video-humanactor', type: 'digital_human' },
    },
  },
};

// ─── AI 服务调用 ───
export async function callAIProvider(
  provider: 'aliyun' | 'tencent',
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean = false,
): Promise<string | AsyncIterable<string>> {
  const config = MODEL_CONFIG[provider];

  const requestBody: Record<string, unknown> = {
    model: modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream,
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
      Authorization: `Bearer ${apiKey}`,
      ...(provider === 'tencent' && { 'X-TC-Provider': 'tokenhub' }),
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(errorData.error?.message || `API调用失败: ${response.status}`);
  }

  if (stream) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    return {
      async *[Symbol.asyncIterator]() {
        if (!reader) return;
        while (true) {
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
              } catch { /* skip malformed chunks */ }
            }
          }
        }
      },
    };
  } else {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// ─── 诊断系统提示词 ───
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
全行业覆盖：制造业、服务业、零售业、餐饮业、教育业、医疗健康、金融业、房地产、互联网、科技行业、农业等所有行业。

请以专业诊断顾问的身份，为用户提供全面、深入、可执行的诊断分析。`;
