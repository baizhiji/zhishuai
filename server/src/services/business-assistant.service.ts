/**
 * 商业助手服务 (Business Assistant Service)
 * 智枢 AI SaaS 系统 - 后端
 *
 * 功能：
 * 1. 商业方案场景管理（创业、运营、诊断、自媒体、产品宣传、竞品分析、实体店等）
 * 2. AI 驱动的方案生成（调用 TokenHub/百炼大模型）
 * 3. 文档导出（PPT/PDF/DOCX/Markdown）
 * 4. 方案历史管理
 */

import { prisma } from '../utils/db';
import { getPrimaryApiKey } from './user-api-key.service';
import { appendAIGCLabel } from './aigc-label.service';
import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import ExcelJS from 'exceljs';

// ==================== 类型定义 ====================

export interface BusinessScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  prompts: {
    system: string;
    initial: string;
    refinements: Record<string, string>;
  };
}

export interface GeneratePlanRequest {
  scenarioId: string;
  userId: string;
  businessName: string;
  businessDescription: string;
  targetAudience?: string;
  budget?: string;
  timeline?: string;
  additionalContext?: string;
}

export interface BusinessPlanSection {
  title: string;
  content: string;
  order: number;
}

export interface BusinessPlan {
  id: string;
  scenarioId: string;
  scenarioName: string;
  businessName: string;
  createdAt: string;
  sections: BusinessPlanSection[];
  summary: string;
}

// ==================== 商业场景定义 ====================

export const BUSINESS_SCENARIOS: BusinessScenario[] = [
  {
    id: 'startup',
    name: '创业方案',
    description: '为新企业或项目制定完整的创业计划，涵盖市场分析、商业模式、财务预测等',
    icon: 'Lightbulb',
    category: 'planning',
    prompts: {
      system: `你是一位资深的商业顾问和创业导师，拥有丰富的创业指导和商业策划经验。
你的任务是为用户制定专业的创业方案。请以结构化、专业的方式输出内容。

请按以下结构组织创业方案：
1. 执行摘要 - 核心理念与价值主张概述
2. 市场分析 - 目标市场规模、增长趋势、细分市场
3. 竞争分析 - 主要竞争对手、差异化优势、竞争策略
4. 商业模式 - 收入来源、成本结构、盈利预测
5. 产品/服务规划 - 核心功能、开发路线图、MVP定义
6. 营销策略 - 获客渠道、品牌定位、推广计划
7. 团队规划 - 核心团队角色、招聘计划
8. 财务预测 - 启动资金需求、收入预测、盈亏平衡分析
9. 风险评估 - 主要风险点、应对策略
10. 执行路线图 - 分阶段实施计划与里程碑

请用中文输出，确保内容专业、具体、可执行。`,
      initial: '请根据我提供的信息，为我制定一份完整的创业方案。',
      refinements: {
        market: '请进一步深入分析市场机会和竞争格局',
        finance: '请详细展开财务预测和资金规划',
        marketing: '请详细制定营销推广策略和执行计划',
        roadmap: '请细化执行路线图和时间节点',
      },
    },
  },
  {
    id: 'operations',
    name: '运营策划',
    description: '优化企业运营效率，制定运营管理体系、流程规范和KPI考核方案',
    icon: 'Settings',
    category: 'management',
    prompts: {
      system: `你是一位资深的企业运营管理专家，擅长帮助企业优化运营流程、提升效率。

请按以下结构组织运营策划方案：
1. 运营现状诊断 - 当前运营痛点和改进机会
2. 运营目标设定 - SMART目标、关键指标
3. 流程优化方案 - 核心业务流程再造
4. 组织架构建议 - 团队配置、职责分工
5. KPI考核体系 - 关键绩效指标、考核机制
6. 信息化建设 - 系统工具、数据管理
7. 成本控制方案 - 降本增效策略
8. 质量管理 - 标准化流程、质检机制
9. 实施计划 - 分阶段落地执行

请用中文输出，确保方案务实、可操作。`,
      initial: '请根据我的企业情况，制定一份运营优化方案。',
      refinements: {
        process: '请详细说明核心流程再造的具体步骤',
        kpi: '请设计详细的KPI考核指标和评分标准',
        cost: '请深入分析成本结构和降本空间',
      },
    },
  },
  {
    id: 'diagnosis',
    name: '企业诊断',
    description: '全面分析企业经营状况，识别问题根源，提供改进建议和转型方案',
    icon: 'Activity',
    category: 'analysis',
    prompts: {
      system: `你是一位资深的企业管理咨询顾问，擅长企业诊断和问题分析。

请按以下结构输出企业诊断报告：
1. 诊断概述 - 诊断范围、方法、核心发现
2. 财务健康度分析 - 收入结构、成本分析、现金流、盈利能力
3. 运营效率评估 - 人效、流程效率、资源利用率
4. 市场竞争力分析 - 市场份额、客户满意度、品牌力
5. 组织能力评估 - 团队能力、人才梯队、企业文化
6. 技术能力评估 - 技术栈、数字化程度、创新力
7. 核心问题识别 - 问题优先级矩阵、根因分析
8. 改进方案建议 - 短期速赢、中期优化、长期转型
9. 转型路线图 - 分阶段实施计划

请用中文输出，诊断要客观、具体，建议要可落地。`,
      initial: '请对我的企业进行全面诊断分析，识别关键问题和改进方向。',
      refinements: {
        finance: '请深入分析财务状况，提供具体的财务改善建议',
        strategy: '请制定详细的战略转型方案和路线图',
        quick: '请优先列出可以快速见效的3-5个改进措施',
      },
    },
  },
  {
    id: 'media_operations',
    name: '自媒体运营方案',
    description: '制定自媒体矩阵运营策略，包含内容规划、账号定位、涨粉方案、变现路径',
    icon: 'Smartphone',
    category: 'marketing',
    prompts: {
      system: `你是一位资深的社交媒体运营专家和新媒体营销顾问。

请按以下结构输出自媒体运营方案：
1. 账号定位 - 目标受众画像、内容定位、人设打造
2. 平台矩阵策略 - 各平台特点分析、内容适配方案
3. 内容规划 - 内容类型、选题方向、发布频率
4. 爆款内容方法论 - 爆款要素、选题机制、标题技巧
5. 涨粉策略 - 自然增长、付费推广、互推合作
6. 互动运营 - 粉丝维护、社群运营、用户运营
7. 数据分析 - 核心指标、数据看板、优化机制
8. 变现路径设计 - 广告、电商、知识付费、品牌合作
9. 团队配置 - 岗位设置、外包策略
10. 执行排期 - 月度/季度内容日历

请用中文输出，内容要符合当下主流平台（抖音、小红书、视频号等）的最新趋势。`,
      initial: '请根据我的业务特点，制定一份自媒体运营方案。',
      refinements: {
        content: '请详细规划内容选题方向和爆款内容策略',
        growth: '请制定具体的涨粉计划和执行方案',
        monetize: '请详细分析变现路径和收入预测',
      },
    },
  },
  {
    id: 'product_promotion',
    name: '产品宣传方案',
    description: '为产品制定全渠道宣传推广方案，涵盖品牌传播、渠道策略和效果评估',
    icon: 'Megaphone',
    category: 'marketing',
    prompts: {
      system: `你是一位资深的品牌营销和产品推广专家。

请按以下结构输出产品宣传方案：
1. 产品卖点提炼 - 核心卖点、差异化优势、用户痛点匹配
2. 目标用户画像 - 用户分层、消费场景、决策路径
3. 品牌传播策略 - 品牌故事、传播主题、调性定位
4. 渠道推广方案 - 线上渠道（社交媒体、搜索、信息流）、线下渠道
5. 内容营销 - 种草内容、测评内容、UGC引导
6. KOL/KOC合作 - 达人筛选标准、合作模式、效果预估
7. 促销活动设计 - 活动策划、优惠机制、节奏把控
8. 预算分配 - 各渠道预算、ROI预估
9. 效果评估 - 核心KPI、监测方法、优化机制
10. 执行排期 - 全渠道推广日历

请用中文输出，方案要贴近实战，可执行。`,
      initial: '请为我的产品制定一份全面的宣传推广方案。',
      refinements: {
        channels: '请详细制定各推广渠道的具体执行方案',
        content: '请设计详细的种草内容和传播规划',
        budget: '请优化预算分配方案，提升ROI',
      },
    },
  },
  {
    id: 'competitive_analysis',
    name: '竞品分析报告',
    description: '深度分析竞争对手，包含市场定位、产品对比、优劣势和应对策略',
    icon: 'Target',
    category: 'analysis',
    prompts: {
      system: `你是一位资深的市场研究和竞争情报分析专家。

请按以下结构输出竞品分析报告：
1. 分析概述 - 分析目的、范围、核心发现
2. 行业格局 - 市场规模、竞争梯队、发展趋势
3. 竞品画像 - 每个竞品的基本信息、融资情况、团队背景
4. 产品对比矩阵 - 功能对比、价格对比、用户体验对比
5. SWOT分析 - 每个竞品的优势/劣势/机会/威胁
6. 商业模式对比 - 收入模式、成本结构、盈利情况
7. 用户口碑分析 - 用户评价、NPS、投诉热点
8. 营销策略对比 - 推广渠道、内容策略、获客成本
9. 竞争策略建议 - 差异化路径、蓝海机会、攻防策略
10. 监测计划 - 持续监测指标、数据来源、更新频率

请用中文输出，分析要客观、数据驱动、有战略价值。`,
      initial: '请对我的竞品进行全面分析，包括市场定位、产品对比和竞争策略建议。',
      refinements: {
        product: '请深入对比各竞品的产品功能和用户体验',
        strategy: '请制定详细的竞争攻防策略',
        positioning: '请帮我找到差异化的市场定位和蓝海机会',
      },
    },
  },
  {
    id: 'brick_and_mortar',
    name: '实体店经营方案',
    description: '为线下实体店提供选址、装修、选品、运营、获客等全链路经营方案',
    icon: 'Store',
    category: 'management',
    prompts: {
      system: `你是一位资深的实体零售和门店运营专家。

请按以下结构输出实体店经营方案：
1. 商圈分析 - 位置评估、人流量、周边竞品
2. 店铺定位 - 目标客群、品类规划、价格带
3. 装修设计方案 - 空间布局、动线设计、氛围营造
4. 商品策略 - 选品逻辑、供应链管理、库存控制
5. 定价策略 - 定价方法、促销策略、会员体系
6. 人员管理 - 招聘标准、培训体系、排班管理
7. 获客引流 - 线上引流（美团/大众点评/抖音）、线下地推
8. 客户运营 - 私域流量、社群运营、复购策略
9. 财务管理 - 成本核算、利润分析、现金流管理
10. 扩张规划 - 单店模型验证、多店复制路径

请用中文输出，方案要落地、可执行、考虑实际经营细节。`,
      initial: '请帮我制定一份完整的实体店经营方案。',
      refinements: {
        location: '请详细分析选址策略和商圈评估方法',
        online: '请制定详细的线上引流和私域运营方案',
        finance: '请深入分析单店盈利模型和财务规划',
      },
    },
  },
  {
    id: 'marketing',
    name: '市场营销方案',
    description: '制定系统化的市场营销策略，涵盖品牌、渠道、内容、数字营销和效果追踪',
    icon: 'TrendingUp',
    category: 'marketing',
    prompts: {
      system: `你是一位资深的整合营销和数字营销专家。

请按以下结构输出市场营销方案：
1. 市场洞察 - 行业趋势、消费者洞察、机会分析
2. 营销目标 - SMART目标、KPI体系
3. 品牌定位 - 品牌价值主张、差异化定位
4. 整合营销策略 - 线上+线下全渠道整合
5. 数字营销方案 - SEO/SEM、信息流、社交媒体、短视频
6. 内容营销 - 内容矩阵、传播规划、话题营销
7. 事件营销 - 活动策划、发布会、跨界合作
8. 预算规划 - 各渠道预算分配、ROI预测
9. 执行排期 - 年度营销日历
10. 效果评估 - 监测体系、数据看板、优化机制

请用中文输出，方案要系统化、可量化、可执行。`,
      initial: '请为我的企业制定一份全面的市场营销方案。',
      refinements: {
        digital: '请详细制定数字营销和社交媒体推广方案',
        content: '请设计完整的内容营销策略和传播规划',
        event: '请策划具体的营销活动和事件营销方案',
      },
    },
  },
];

// ==================== 商业助手专属 AI 模型配置 ====================
// 商业助手是移动端特有功能，独立于通用 AI 对话（ai-chat）的智能调度，
// 配置专属"最强模型链路"；API Key 复用用户电脑端配置（按 userId 从数据库读取），
// APK 端无需单独配置 Key / 模型。
const BUSINESS_MODEL_CONFIG = {
  // 各服务商调用网关（与 ai-chat 智能调度链路保持一致）
  endpoints: {
    tencent: {
      baseUrl: 'https://tokenhub.tencentmaas.com/v1',
      getKey: (userId: string) => getPrimaryApiKey(userId, 'tokenhub'),
    },
    aliyun: {
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      getKey: (userId: string) => getPrimaryApiKey(userId, 'dashscope'),
    },
    volcano: {
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      getKey: (userId: string) => getPrimaryApiKey(userId, 'ark'),
    },
  },
  // 模型链路（按商业能力从强到次强排序，依次尝试、自动降级）
  // 主  : 腾讯 DeepSeek V4 Pro（结构化分析/大纲，实测首选）
  // 备1 : 阿里 Qwen3.8 Max（高质量创作/复杂推理）
  // 备2 : 腾讯 Kimi K3（长文/摘要，1M 上下文）
  // 备3 : 火山方舟 GLM-5.2（字幕/去AI化/中英双语，1M 上下文）
  // 备4 : 火山方舟 豆包 Seed 2.1 Pro（第三服务商兜底，OpenAI 兼容）
  modelChain: [
    { provider: 'tencent', model: 'deepseek-v4-pro-202606', name: 'DeepSeek V4 Pro' },
    { provider: 'aliyun', model: 'qwen3.8-max', name: 'Qwen3.8 Max' },
    { provider: 'tencent', model: 'kimi-k3', name: 'Kimi K3' },
    { provider: 'volcano', model: 'glm-5-2', name: 'GLM-5.2（方舟）' },
    { provider: 'volcano', model: 'doubao-seed-2-1-pro-260628', name: '豆包 Seed 2.1 Pro' },
  ],
} as const;

// ==================== 商业助手全链路专家提示词 ====================
const BUSINESS_MASTER_SYSTEM_PROMPT = `你是【智枢AI商业助手】，中国顶级的商业顾问与创业导师，覆盖企业从0（创业启动）到100（做大做强）全生命周期的所有商业问题，给出最贴合实际、可直接落地的完美方案。

## 全链路服务范围（企业生命周期 0→100）

【阶段一 0-10 创业启动】市场机会识别、商业模式设计、MVP验证、启动资金测算、股权架构、注册合规、产品定义、团队组建
【阶段二 10-30 生存发展】产品打磨、第一批客户获取、现金流管理、定价策略、渠道冷启动、人效提升、口碑运营
【阶段三 30-60 成长扩张】组织架构搭建、管理机制与SOP、营销放量、融资规划（天使/VC）、第二增长曲线、数字化转型
【阶段四 60-80 规模经营】多店/多市场复制、供应链优化、品牌升级、数据化经营、降本增效、并购整合、渠道矩阵
【阶段五 80-100 做大做强】资本运作、股权融资/上市辅导、战略并购、国际化、生态布局、组织变革、传承与公司治理

## 核心能力矩阵

1. 战略与规划：战略制定、PEST分析、行业研究、竞争分析、增长战略
2. 商业模式：价值主张、盈利模型、定价策略、渠道通路、收入结构、客户关系
3. 市场营销：品牌定位、获客渠道、内容营销、私域运营、活动策划、投放优化
4. 运营管理：流程再造、组织架构、KPI体系、供应链管理、成本控制、效率提升
5. 财务与资本：财务分析、预算管理、现金流管理、融资估值、盈亏平衡、成本结构
6. 人力资源：招聘选才、人才梯队、激励机制、绩效考核、企业文化建设
7. 数字化转型：技术选型、系统建设、AI应用、数据驱动决策
8. 风险与合规：风险识别、合规审查、危机应对、应急预案
9. 实体经营：选址评估、选品逻辑、门店运营、坪效人效、连锁扩张
10. 自媒体与流量：账号定位、内容创作、平台运营（抖音/小红书/视频号等）、涨粉变现、IP打造

## 输出原则（必须严格遵守）

1. 先判断用户所处阶段（0-10 / 10-30 / 30-60 / 60-80 / 80-100），结合阶段特征给出针对性建议
2. 最贴合实际：结合行业常识与真实经营规律，禁止空泛套话、禁止虚构数据
3. 每条建议必须可执行：给出具体步骤、量化指标（金额/人数/时间周期）、优先级排序
4. 方案完整：覆盖"现状诊断 → 方案设计 → 执行步骤 → 风险预案 → 效果预期"完整链条
5. 给出1-3个备选方案，并说明适用场景与取舍
6. 若问题跨阶段，说明当前阶段优先做什么、下一阶段何时升级
7. 用中文回答，条理清晰、重点突出、专业务实

若用户询问与商业无关的问题，请友好引导回到商业咨询方向。`;

// 方案生成统一质量增强要求（追加到 8 大场景 system prompt 之后）
const BUSINESS_QUALITY_BOOST = `

## 输出质量要求（必须严格遵守）
1. 先判断用户企业所处阶段（0-10创业启动 / 10-30生存发展 / 30-60成长扩张 / 60-80规模经营 / 80-100做大做强），并据此调整建议侧重
2. 最贴合实际：结合行业真实经营规律与通用数据，禁止空泛套话、禁止编造数据
3. 每条建议给出具体步骤、量化指标（金额/人数/时间周期）、优先级排序
4. 覆盖"现状诊断 → 方案设计 → 执行步骤 → 风险与预案 → 效果预期"完整链条
5. 给出1-3个备选路径并说明取舍
6. 明确下一阶段的升级方向（从当前阶段到下一阶段的关键动作与里程碑）`;

// ==================== AI 调用 ====================

/**
 * 调用 AI 模型（商业助手专属模型链路，自动降级）
 * - 依次尝试模型链路中的每个模型（DeepSeek V4 Pro → Qwen3.8 Max → Kimi K3 → GLM-5.2 → 豆包Seed2.1）
 * - 每个模型优先读取用户在该服务商配置的 API Key（复用电脑端配置，手机端无需单独配置）
 * - 服务商无 Key 或调用失败时自动降级到下一个模型
 */
async function callAI(
  userId: string,
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 4096;

  let lastError: string | null = null;

  for (const modelCfg of BUSINESS_MODEL_CONFIG.modelChain) {
    const endpoint = BUSINESS_MODEL_CONFIG.endpoints[modelCfg.provider];
    if (!endpoint) continue;

    // 1. 读取用户在该服务商配置的 API Key（复用电脑端配置）
    let apiKey: string | null = null;
    try {
      const keyConfig = await endpoint.getKey(userId);
      apiKey = keyConfig?.apiKey || null;
    } catch {
      apiKey = null;
    }
    if (!apiKey) {
      console.log(`[商业助手] 用户 ${userId} 未配置 ${modelCfg.provider} 的 API Key，跳过 ${modelCfg.name}`);
      continue;
    }

    // 2. 调用模型
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      // 腾讯云 TokenHub 网关需要该标记头
      if (modelCfg.provider === 'tencent') {
        headers['X-TC-Provider'] = 'tokenhub';
      }

      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), 120000);
      let response: Response;
      try {
        response = await fetch(`${endpoint.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelCfg.model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutTimer);
      }

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API 调用失败 (HTTP ${response.status})`);
      }

      const data: any = await response.json();
      const raw = data?.choices?.[0]?.message?.content || '';
      if (!raw) {
        throw new Error('模型返回内容为空');
      }
      return appendAIGCLabel(raw);
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[商业助手] 模型 ${modelCfg.name} 调用失败，自动降级: ${lastError}`);
    }
  }

  throw new Error(lastError || '未配置 AI 服务商 API Key，请在电脑端「API Key 管理」中配置阿里云百炼、腾讯云 TokenHub 或火山方舟任一 API Key');
}

// ==================== 方案生成与解析 ====================

function parseSections(content: string): BusinessPlanSection[] {
  const sections: BusinessPlanSection[] = [];
  const lines = content.split('\n');

  let currentTitle = '';
  let currentContent: string[] = [];
  let sectionIndex = 0;

  for (const line of lines) {
    // 匹配 "数字. 标题" 或 "## 标题" 或 "**标题**"
    const mdMatch = line.match(/^##\s+(.+)/);
    const numMatch = line.match(/^(\d+)[.、]\s*(.+)/);
    const boldMatch = line.match(/^\*\*(.+?)\*\*/);
    const dashMatch = line.match(/^[-—]\s*(.+)/);

    if (mdMatch || numMatch || boldMatch) {
      // Save previous section
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n').trim(),
          order: sectionIndex++,
        });
      }
      const title = mdMatch?.[1] || numMatch?.[2] || boldMatch?.[1] || '';
      currentTitle = title;
      currentContent = [];
    } else if (dashMatch && !currentTitle) {
      currentTitle = dashMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentTitle) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
      order: sectionIndex++,
    });
  }

  return sections;
}

function generateSummary(content: string): string {
  // Extract first 200 chars as summary
  const clean = content.replace(/[#*\-\d.]/g, '').trim();
  return clean.slice(0, 300) + (clean.length > 300 ? '...' : '');
}

// ==================== 对外接口 ====================

export const businessAssistantService = {
  /** 获取所有商业场景列表 */
  getScenarios(): BusinessScenario[] {
    return BUSINESS_SCENARIOS.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      category: s.category,
      prompts: {
        system: s.prompts.system.slice(0, 100) + '...', // 只返回摘要
        initial: s.prompts.initial,
        refinements: s.prompts.refinements,
      },
    }));
  },

  /** 生成商业方案 */
  async generatePlan(request: GeneratePlanRequest): Promise<BusinessPlan> {
    const scenario = BUSINESS_SCENARIOS.find(s => s.id === request.scenarioId);
    if (!scenario) {
      throw new Error(`未找到场景: ${request.scenarioId}`);
    }

    // 构建用户提示
    let userPrompt = `${scenario.prompts.initial}\n\n`;
    userPrompt += `企业/项目名称：${request.businessName}\n`;
    userPrompt += `业务描述：${request.businessDescription}\n`;
    if (request.targetAudience) userPrompt += `目标用户：${request.targetAudience}\n`;
    if (request.budget) userPrompt += `预算范围：${request.budget}\n`;
    if (request.timeline) userPrompt += `时间规划：${request.timeline}\n`;
    if (request.additionalContext) userPrompt += `补充信息：${request.additionalContext}\n`;

    const messages = [
      { role: 'system', content: scenario.prompts.system + BUSINESS_QUALITY_BOOST },
      { role: 'user', content: userPrompt },
    ];

    const content = await callAI(request.userId, messages, { temperature: 0.8, maxTokens: 8192 });

    // 解析方案结构
    const sections = parseSections(content);
    const summary = generateSummary(content);

    // 保存到数据库
    const plan = await (prisma as any).businessPlan.create({
      data: {
        userId: request.userId,
        scenarioId: request.scenarioId,
        scenarioName: scenario.name,
        businessName: request.businessName,
        content: JSON.stringify({ sections, fullContent: content }),
        summary,
        status: 'completed',
      },
    });

    return {
      id: plan.id,
      scenarioId: plan.scenarioId,
      scenarioName: plan.scenarioName,
      businessName: plan.businessName,
      createdAt: plan.createdAt.toISOString(),
      sections,
      summary,
    };
  },

  /** 优化方案（针对特定方向） */
  async refinePlan(request: {
    planId: string;
    userId: string;
    refinementKey: string;
    scenarioId: string;
  }): Promise<{ content: string }> {
    const scenario = BUSINESS_SCENARIOS.find(s => s.id === request.scenarioId);
    if (!scenario) throw new Error(`未找到场景: ${request.scenarioId}`);

    const plan = await (prisma as any).businessPlan.findFirst({
      where: { id: request.planId, userId: request.userId },
    });
    if (!plan) throw new Error('方案未找到');

    const refinementPrompt = scenario.prompts.refinements[request.refinementKey];
    if (!refinementPrompt) throw new Error(`未找到优化方向: ${request.refinementKey}`);

    const existingContent = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content;
    const currentPlanText = existingContent?.fullContent || existingContent?.sections?.map((s: any) => s.content).join('\n') || '';

    const messages = [
      { role: 'system', content: scenario.prompts.system + BUSINESS_QUALITY_BOOST },
      { role: 'user', content: `基于以下已有方案：\n\n${currentPlanText.slice(0, 2000)}\n\n${refinementPrompt}` },
    ];

    const content = await callAI(request.userId, messages, { temperature: 0.7, maxTokens: 4096 });

    return { content };
  },

  /** 获取用户方案列表 */
  async getUserPlans(userId: string): Promise<BusinessPlan[]> {
    const plans = await (prisma as any).businessPlan.findMany({
      where: { userId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return plans.map(p => {
      const parsed = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
      return {
        id: p.id,
        scenarioId: p.scenarioId,
        scenarioName: p.scenarioName,
        businessName: p.businessName,
        createdAt: p.createdAt.toISOString(),
        sections: parsed?.sections || [],
        summary: p.summary,
      };
    });
  },

  /** 获取方案详情 */
  async getPlanDetail(planId: string, userId: string): Promise<BusinessPlan & { fullContent: string }> {
    const plan = await (prisma as any).businessPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) throw new Error('方案未找到');

    const parsed = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content;

    return {
      id: plan.id,
      scenarioId: plan.scenarioId,
      scenarioName: plan.scenarioName,
      businessName: plan.businessName,
      createdAt: plan.createdAt.toISOString(),
      sections: parsed?.sections || [],
      summary: plan.summary,
      fullContent: parsed?.fullContent || '',
    };
  },

  /** 导出方案为 PPT */
  async exportPPT(planId: string, userId: string): Promise<Buffer> {
    const plan = await this.getPlanDetail(planId, userId);

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'A4', width: 13.333, height: 7.5 });
    pptx.layout = 'A4';

    // 封面页
    const coverSlide = pptx.addSlide();
    coverSlide.background = { fill: '1a1a2e' };
    coverSlide.addText(plan.scenarioName, {
      x: 1, y: 1.5, w: 11, h: 1.5,
      fontSize: 36, bold: true, color: 'FFFFFF',
      align: 'center',
    });
    coverSlide.addText(plan.businessName, {
      x: 1, y: 3.2, w: 11, h: 1,
      fontSize: 24, color: 'CCCCCC',
      align: 'center',
    });
    coverSlide.addText(`生成日期：${new Date(plan.createdAt).toLocaleDateString('zh-CN')}`, {
      x: 1, y: 5, w: 11, h: 0.5,
      fontSize: 14, color: '888888',
      align: 'center',
    });

    // 内容页
    for (const section of plan.sections) {
      const slide = pptx.addSlide();
      slide.addText(section.title, {
        x: 0.5, y: 0.3, w: 12, h: 0.8,
        fontSize: 24, bold: true, color: '1a1a2e',
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.1, w: 12, h: 0.03,
        fill: { color: '1a1a2e' },
      });
      // Truncate content if too long
      let displayContent = section.content;
      if (displayContent.length > 2000) {
        displayContent = displayContent.slice(0, 2000) + '\n\n... (内容过长，请查看完整版)';
      }
      slide.addText(displayContent, {
        x: 0.5, y: 1.4, w: 12, h: 5.6,
        fontSize: 13, color: '333333',
        valign: 'top',
      });
    }

    // 结尾页
    const endSlide = pptx.addSlide();
    endSlide.background = { fill: '1a1a2e' };
    endSlide.addText('感谢使用智枢AI商业助手', {
      x: 1, y: 3, w: 11, h: 1,
      fontSize: 28, color: 'FFFFFF',
      align: 'center',
    });

    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    return buffer;
  },

  /** 导出方案为 PDF */
  async exportPDF(planId: string, userId: string): Promise<Buffer> {
    const plan = await this.getPlanDetail(planId, userId);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        info: {
          Title: `${plan.scenarioName} - ${plan.businessName}`,
          Author: '智枢AI商业助手',
        },
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text(plan.scenarioName, { align: 'center' });
      doc.fontSize(16).font('Helvetica').text(plan.businessName, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#888888').text(`生成日期：${new Date(plan.createdAt).toLocaleDateString('zh-CN')}`, { align: 'center' });
      doc.moveDown(2);

      // Sections
      for (const section of plan.sections) {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a2e').text(section.title);
        doc.moveDown(0.3);
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .strokeColor('#1a1a2e')
          .stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').fillColor('#333333').text(section.content, { lineGap: 4 });
        doc.moveDown();
      }

      doc.end();
    });
  },

  /** 导出方案为 DOCX */
  async exportDOCX(planId: string, userId: string): Promise<Buffer> {
    const plan = await this.getPlanDetail(planId, userId);

    const children: (Paragraph | Table)[] = [];

    // Title
    children.push(
      new Paragraph({
        text: plan.scenarioName,
        heading: HeadingLevel.TITLE,
        alignment: 'center',
      }),
      new Paragraph({
        text: plan.businessName,
        heading: HeadingLevel.HEADING_2,
        alignment: 'center',
      }),
      new Paragraph({
        text: `生成日期：${new Date(plan.createdAt).toLocaleDateString('zh-CN')}`,
        alignment: 'center',
      }),
      new Paragraph({ text: '' }),
    );

    // Sections
    for (const section of plan.sections) {
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
        }),
      );

      // Split content into paragraphs
      const paragraphs = section.content.split('\n').filter(Boolean);
      for (const p of paragraphs) {
        children.push(
          new Paragraph({
            text: p,
          }),
        );
      }
      children.push(new Paragraph({ text: '' }));
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  },

  /** 导出方案为 Excel */
  async exportXLSX(planId: string, userId: string): Promise<Buffer> {
    const plan = await this.getPlanDetail(planId, userId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '智枢AI商业助手';
    workbook.created = new Date();
    workbook.modified = new Date();

    this.buildXlsxOverview(workbook, plan);
    this.buildXlsxDetail(workbook, plan);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  },

  /** 构建方案概览 Sheet */
  buildXlsxOverview(workbook: ExcelJS.Workbook, plan: BusinessPlan): void {
    const ws = workbook.addWorksheet('方案概览');
    ws.mergeCells('A1:B1');
    ws.columns = [{ width: 16 }, { width: 90 }];

    const title = ws.getCell('A1');
    title.value = plan.businessName;
    title.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    ws.getRow(1).height = 34;

    const meta: [string, string][] = [
      ['方案类型', plan.scenarioName],
      ['企业名称', plan.businessName],
      ['生成日期', new Date(plan.createdAt).toLocaleDateString('zh-CN')],
      ['方案摘要', plan.summary],
    ];

    meta.forEach(([item, value], i) => {
      const row = ws.getRow(i + 3);
      row.getCell(1).value = item;
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      row.getCell(1).border = this.xlsxBorder();
      row.getCell(2).value = value;
      row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
      row.getCell(2).border = this.xlsxBorder();
    });
  },

  /** 构建方案详情 Sheet */
  buildXlsxDetail(workbook: ExcelJS.Workbook, plan: BusinessPlan): void {
    const ws = workbook.addWorksheet('方案详情');
    ws.columns = [
      { header: '序号', width: 8 },
      { header: '章节', width: 28 },
      { header: '内容', width: 90 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 22;

    for (const section of plan.sections) {
      const row = ws.addRow([section.order + 1, section.title, section.content]);
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'top' };
      row.getCell(2).font = { bold: true };
      row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
      row.getCell(3).font = { size: 10 };
      row.getCell(3).alignment = { wrapText: true, vertical: 'top' };
      row.eachCell((cell) => {
        cell.border = this.xlsxBorder();
      });
      row.height = Math.min(90, Math.max(20, Math.ceil(section.content.length / 40) * 15));
    }
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  },

  /** Excel 单元格边框 */
  xlsxBorder(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
  },

  /** 聊天问答（自由模式） */
  async chat(userId: string, messages: { role: string; content: string }[]): Promise<string> {
    const allMessages = [
      { role: 'system', content: BUSINESS_MASTER_SYSTEM_PROMPT },
      ...messages,
    ];

    return await callAI(userId, allMessages, { temperature: 0.7, maxTokens: 4096 });
  },
};
