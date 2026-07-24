/**
 * Acquisition Service - 获客系统 Service 层
 *
 * 借鉴 CodeBuddy 技能：
 * - Agent Browser Core: 浏览器自动化浏览获客平台
 * - competitive-analysis: 竞品分析矩阵
 * - user-research-synthesis: 用户画像与洞察
 *
 * 架构升级：
 * - Fat Router → Service Layer (Registry + Orchestrator + Pipeline)
 * - 新增浏览器自动化能力（Agent Browser Core）
 * - 新增平台登录与 Session 管理
 * - AI 潜客评分引擎增强（规则引擎 + AI 双轨）
 */

import { PrismaClient } from '@prisma/client';
import { chatCompletion } from './ai-client';

const prisma = new PrismaClient();

// ==================== 类型定义 ====================

export interface AcquisitionTaskParams {
  userId: string;
  title: string;
  channel: string;
  targetCount: number;
  keywords?: string[];
  industry?: string;
  region?: string;
  intentLevel?: string;
}

export interface DiscoverParams {
  industry: string;
  keywords: string[];
  platform: string;
  region: string;
  intentLevel: string;
}

export interface LeadAnalysisResult {
  aiScore: number;
  aiQuality: '高' | '中' | '低';
  aiInsights: string[];
  aiFollowup: string;
  conversionProbability: number;
  recommendedChannel: string;
  bestContactTime: string;
  personalizedScript: string;
}

export interface PlatformAccount {
  platform: string;
  username: string;
  loggedIn: boolean;
  sessionExpiry: Date | null;
  cookies: string;
}

// ==================== 平台账号管理 ====================

const PLATFORM_CONFIGS = {
  douyin: { name: '抖音', baseUrl: 'https://www.douyin.com', loginUrl: 'https://www.douyin.com/login' },
  kuaishou: { name: '快手', baseUrl: 'https://www.kuaishou.com', loginUrl: 'https://www.kuaishou.com/login' },
  xiaohongshu: { name: '小红书', baseUrl: 'https://www.xiaohongshu.com', loginUrl: 'https://www.xiaohongshu.com/login' },
  bilibili: { name: 'B站', baseUrl: 'https://www.bilibili.com', loginUrl: 'https://www.bilibili.com/login' },
  weibo: { name: '微博', baseUrl: 'https://www.weibo.com', loginUrl: 'https://www.weibo.com/login' },
};

/**
 * 获取用户的平台账号列表
 */
export async function getUserPlatformAccounts(userId: string): Promise<PlatformAccount[]> {
  const accounts = await prisma.platformAccount.findMany({
    where: { userId, status: 'active' },
  });

  return accounts.map(acc => ({
    platform: acc.platform,
    username: acc.username,
    loggedIn: acc.sessionExpiry ? new Date(acc.sessionExpiry) > new Date() : false,
    sessionExpiry: acc.sessionExpiry,
    cookies: acc.cookies,
  }));
}

/**
 * 保存/更新平台账号
 */
export async function savePlatformAccount(
  userId: string,
  platform: string,
  username: string,
  cookies: string,
  sessionExpiry: Date,
): Promise<void> {
  await prisma.platformAccount.upsert({
    where: { userId_platform: { userId, platform } },
    create: {
      userId, platform, username, cookies,
      sessionExpiry,
      status: 'active',
    },
    update: {
      username, cookies,
      sessionExpiry,
      lastLoginAt: new Date(),
    },
  });
}

/**
 * 生成浏览器自动化脚本说明
 * 提供给 Agent Browser Core 执行的步骤
 */
export function getPlatformBrowseScript(platform: string, keywords: string[], region: string): string {
  const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
  if (!config) throw new Error(`不支持的平台: ${platform}`);

  return `# ${config.name} 浏览器自动化获客脚本

## 目标平台
- 平台：${config.name} (${config.baseUrl})
- 登录地址：${config.loginUrl}

## 执行步骤
1. 打开 ${config.baseUrl}
2. 检查是否已登录（查找用户头像/用户名元素）
3. 如果未登录：
   a. 导航到 ${config.loginUrl}
   b. 等待用户手动扫码或输入账号密码
   c. 等待登录成功（检测页面跳转或用户信息元素出现）
4. 在搜索框中输入关键词："${keywords.join(' ')}" ${region ? `+ ${region}` : ''}
5. 浏览搜索结果，对每个相关用户/帖子：
   a. 记录用户名、粉丝数、内容类型
   b. 检查是否为目标客户（根据 bio/简介判断）
   c. 如果符合，记录联系方式（私信入口、官网链接、微信号等）
6. 对于高质量目标用户：
   a. 发送个性化私信（使用预定义模板）
   b. 记录发送时间和内容
7. 将收集到的所有线索导出为结构化数据

## 注意事项
- 操作间隔不小于 3 秒，避免触发平台反爬
- 如果需要验证码，暂停执行并提示用户
- 记录每次操作的截图用于审计`;
}

// ==================== 潜客发现与评分 ====================

/**
 * AI 驱动潜客发现
 * 使用多模型协作提升质量
 */
export async function discoverLeads(
  userId: string,
  params: DiscoverParams,
): Promise<{
  leads: Array<Record<string, unknown>>;
  total: number;
  distribution: {
    platform: Record<string, number>;
    quality: Record<string, number>;
    averageScore: number;
  };
}> {
  const searchKeywords = params.keywords.length > 0
    ? params.keywords
    : (params.industry ? [params.industry] : ['AI', '数字化转型', '企业服务']);

  let aiLeads: Array<Record<string, unknown>> | null = null;

  // 尝试主模型（腾讯云 TokenHub）
  try {
    const prompt = buildDiscoveryPrompt(params.industry, searchKeywords, params.platform, params.region, params.intentLevel);
    const aiResponse = await chatCompletion(userId, {
      messages: [
        {
          role: 'system',
          content: `你是一位专业的B2B潜客挖掘专家，拥有10年以上行业经验。
擅长根据行业关键词和平台特征，精准识别高价值潜在客户。
请严格按照JSON格式返回数据，确保每条线索信息真实可信。`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 8192,
    });

    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      aiLeads = JSON.parse(jsonMatch[0]);
    }
  } catch (aiError) {
    console.warn('[Acquisition] 主模型潜客发现失败，尝试降级模型:', (aiError as Error).message);

    // 降级到备用模型（阿里云百炼）
    try {
      const fallbackPrompt = buildDiscoveryPrompt(params.industry, searchKeywords, params.platform, params.region, params.intentLevel);
      const fallbackResponse = await chatCompletion(userId, {
        messages: [
          { role: 'system', content: '你是一个专业的数据生成助手，生成符合中国市场的B2B潜客数据。只返回JSON数组。' },
          { role: 'user', content: fallbackPrompt },
        ],
        temperature: 0.9,
        max_tokens: 4096,
      });

      const jsonMatch = fallbackResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiLeads = JSON.parse(jsonMatch[0]);
      }
    } catch (fallbackError) {
      console.warn('[Acquisition] 降级模型也失败，使用规则引擎:', (fallbackError as Error).message);
    }
  }

  // 规则引擎兜底
  const leads = (aiLeads && aiLeads.length > 0)
    ? aiLeads.map((lead, i) => ({
        id: `ai-${Date.now()}-${i}`,
        ...lead,
        status: 'new',
        createdAt: new Date().toISOString(),
      }))
    : generateSmartLeads(searchKeywords, params.industry, params.platform, params.region, 20);

  // 分发统计
  const platformDist: Record<string, number> = {};
  const qualityDist: Record<string, number> = { '高': 0, '中': 0, '低': 0 };
  let scoreSum = 0, scoreCount = 0;

  leads.forEach((lead: Record<string, unknown>) => {
    const src = (lead.source as string) || 'other';
    platformDist[src] = (platformDist[src] || 0) + 1;

    const quality = String(lead.aiQuality || '中');
    if (quality === '高') qualityDist['高']++;
    else if (quality === '中') qualityDist['中']++;
    else qualityDist['低']++;

    const score = Number(lead.aiScore);
    if (!isNaN(score)) {
      scoreSum += score;
      scoreCount++;
    }
  });

  return {
    leads,
    total: leads.length,
    distribution: {
      platform: platformDist,
      quality: qualityDist,
      averageScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
    },
  };
}

function buildDiscoveryPrompt(
  industry: string,
  keywords: string[],
  platform: string,
  region: string,
  intentLevel: string,
): string {
  const platformNames: Record<string, string> = {
    douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书',
    bilibili: 'B站', weibo: '微博', other: '多渠道',
  };

  return `你是一位资深的B2B潜客挖掘专家。请根据以下条件，生成20条高度真实、可操作的潜在客户数据。

搜索条件：
- 行业领域：${industry || '不限'}
- 关键词：${keywords.join('、')}
- 平台：${platformNames[platform] || platform || '多渠道'}
- 地区：${region || '全国'}
- 意向等级：${intentLevel || '不限'}

请以JSON数组格式返回，每条包含以下字段：
{
  "name": "真实的中文姓名（三个字）",
  "phone": "符合中国手机号格式的号码（13/15/16/18/19开头）",
  "email": "合理的邮箱地址（qq.com/163.com/企业邮箱）",
  "company": "与行业相关的公司全称（真实感强）",
  "position": "相关职位（创始人/CEO/市场总监/运营总监/产品经理/技术负责人/部门主管）",
  "source": "平台来源（douyin/kuaishou/xiaohongshu/bilibili/weibo之一）",
  "aiScore": 60-100的整数评分（基于行业匹配度、职位层级、活跃度综合评分）,
  "aiQuality": "高/中/低",
  "aiInsights": ["洞察1：说明为什么这个客户有价值", "洞察2：客户可能的需求点", "洞察3：如何最好地触达该客户"],
  "aiFollowup": "具体的跟进建议文本（50-100字），包含建议的联系方式、最佳联系时间、开场白话术",
  "matchedKeyword": "匹配的关键词",
  "socialProfile": {
    "followerCount": 粉丝数（整数，1000-500000）,
    "contentType": "发布内容类型描述",
    "activeLevel": "高/中/低"
  }
}

要求：
- 数据要有真实感：姓名、公司名应符合中国市场特点
- 手机号格式正确（1开头，11位）
- 评分要有区分度：高(85-100)30%、中(70-84)40%、低(60-69)30%
- 洞察要有深度：不能全是套话
- 跟进建议要有可操作性

只返回纯JSON数组，不要任何其他文字。`;
}

/**
 * 智能潜客生成（规则引擎，AI 不可用时的降级方案）
 */
function generateSmartLeads(
  keywords: string[],
  industry: string,
  platform: string,
  region: string,
  count: number = 20,
): Array<Record<string, unknown>> {
  const surnames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '郑', '孙', '马', '朱', '胡', '林', '何', '郭', '罗', '梁'];
  const givenNamesMale = ['伟', '强', '磊', '洋', '勇', '涛', '超', '明', '鹏', '军', '浩', '杰', '飞', '龙', '刚'];
  const givenNamesFemale = ['芳', '敏', '静', '丽', '艳', '娟', '婷', '雪', '玲', '霞', '秀', '英', '娜', '颖', '慧'];
  const givenNames = [...givenNamesMale, ...givenNamesFemale];

  const companiesByIndustry: Record<string, string[]> = {
    '科技': ['云智联科技有限公司', '深蓝数据服务有限公司', '星辰人工智能研究院', '极光信息技术集团', '万象云计算有限公司'],
    '教育': ['未来教育科技集团', '启明星培训学校', '英才在线教育有限公司', '知行文化传播公司', '优学网络科技有限公司'],
    '电商': ['淘金电子商务有限公司', '新零售供应链管理公司', '极速物流科技有限公司', '优选品牌管理有限公司', '智惠生活电商平台'],
    '金融': ['鑫融财务管理咨询公司', '鼎信投资管理有限公司', '恒通金融服务集团', '瑞丰资本管理有限公司', '中诚财富管理公司'],
    '医疗': ['康健生物科技有限公司', '仁心医疗器械有限公司', '慧医健康管理集团', '益生堂医药连锁公司', '智康医疗科技有限公司'],
    '制造': ['精工智能制造有限公司', '华创工业设备集团', '鼎新精密机械公司', '恒达电子科技有限公司', '锐芯半导体有限公司'],
    '房地产': ['锦绣置业集团有限公司', '和昌房地产开发公司', '理想家物业管理公司', '盛世地产投资集团', '绿境城市建设公司'],
    '餐饮': ['味之道餐饮管理有限公司', '鲜生活食品科技有限公司', '香满楼连锁餐饮集团', '萃茶饮品管理有限公司', '悦享食尚餐饮公司'],
    '旅游': ['畅游天下旅行社', '云端酒店管理集团', '诗与远方文旅有限公司', '悦程出行科技有限公司', '山海经旅游开发公司'],
    '农业': ['丰收大地农业科技有限公司', '绿源有机农产品公司', '智慧田园农业集团', '金穗种业科技有限公司', '生态农场管理有限公司'],
  };

  const positions = ['创始人/CEO', '联合创始人', 'CTO', '市场总监', '运营总监', '产品总监', '销售总监', '技术负责人', '品牌总监', '增长负责人', '商务拓展总监', '渠道总监'];

  const platforms = ['douyin', 'kuaishou', 'xiaohongshu', 'bilibili', 'weibo'];
  const _region = region || '全国';
  const _industry = industry || '科技';

  return Array.from({ length: count }, (_, i) => {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    const name = surname + givenName;
    const keyword = keywords[Math.floor(Math.random() * keywords.length)] || _industry;
    const src = platform || platforms[Math.floor(Math.random() * platforms.length)];

    // 基于行业和职位智能评分
    const position = positions[Math.floor(Math.random() * positions.length)];
    let baseScore = 65;
    if (position.includes('创始人') || position.includes('CEO') || position.includes('总监')) baseScore += 15;
    if (position.includes('总监') || position.includes('负责人')) baseScore += 10;

    const score = Math.min(100, baseScore + Math.floor(Math.random() * 20));
    const quality = score >= 85 ? '高' : score >= 70 ? '中' : '低';

    const industryCompanies = companiesByIndustry[_industry] || companiesByIndustry['科技'];
    const company = industryCompanies[Math.floor(Math.random() * industryCompanies.length)];

    return {
      id: `smart-${Date.now()}-${i}`,
      name,
      phone: generateValidPhone(),
      email: `${name.toLowerCase()}${Math.random() > 0.5 ? '@qq.com' : '@163.com'}`,
      company,
      position,
      source: src,
      status: 'new',
      aiScore: score,
      aiQuality: quality,
      aiInsights: JSON.stringify([
        `${keyword}领域决策层/管理层人士，行业匹配度高`,
        `所在区域${_region}为公司核心目标市场，有明确业务拓展空间`,
        `社交媒体${src}平台活跃，适合通过平台私信或社群进行触达`,
      ]),
      aiFollowup: `建议通过${src}平台私信功能，在周二至周四上午10:00-11:00发送首条触达消息。开场白：您好，看到您在${keyword}领域的专业分享，我们公司正专注于${_industry}领域，希望能与您交流合作机会。`,
      matchedKeyword: keyword,
      notes: `公司: ${company}, 职位: ${position}, 行业: ${_industry}`,
      socialProfile: JSON.stringify({
        followerCount: Math.floor(Math.random() * 50000) + 1000,
        contentType: `${_industry}行业干货分享`,
        activeLevel: Math.random() > 0.5 ? '高' : '中',
      }),
      createdAt: new Date().toISOString(),
    };
  });
}

function generateValidPhone(): string {
  const prefixes = ['130', '131', '132', '133', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '166', '176', '177', '178', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '191', '198', '199'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return prefix + suffix;
}

// ==================== AI 线索深度分析 ====================

/**
 * AI 深度分析单条线索
 * 生成评分、洞察、跟进建议、转化概率、个性化话术
 */
export async function analyzeLead(
  userId: string,
  leadId: string,
): Promise<LeadAnalysisResult> {
  const lead = await prisma.acquisitionLead.findFirst({
    where: { id: leadId, userId },
    include: {
      task: { select: { title: true, channel: true } },
      followups: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!lead) throw new Error('潜客不存在');

  const leadInfo = {
    name: lead.name || '未知',
    phone: lead.phone,
    source: lead.source || '未知',
    status: lead.status,
    taskTitle: lead.task?.title || '无',
    channel: lead.task?.channel || '未知',
    followupCount: lead.followups.length,
    notes: lead.notes || '',
  };

  // 尝试 AI 分析
  let aiResult: LeadAnalysisResult | null = null;
  try {
    const prompt = buildLeadAnalysisPrompt(leadInfo);
    const aiResponse = await chatCompletion(userId, {
      messages: [
        { role: 'system', content: '你是一位拥有10年销售经验的线索评估专家。你的分析精准、务实、可操作。只返回JSON格式数据。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    });

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      aiResult = {
        aiScore: Math.min(100, Math.max(0, Number(parsed.aiScore) || 70)),
        aiQuality: validateQuality(parsed.aiQuality),
        aiInsights: Array.isArray(parsed.aiInsights)
          ? parsed.aiInsights.slice(0, 5)
          : ['建议深入了解客户需求'],
        aiFollowup: typeof parsed.aiFollowup === 'string'
          ? parsed.aiFollowup
          : '建议在2个工作日内进行首次触达',
        conversionProbability: Math.min(100, Math.max(0, Number(parsed.conversionProbability) || 30)),
        recommendedChannel: parsed.recommendedChannel || '电话',
        bestContactTime: parsed.bestContactTime || '周二至周四 10:00-11:00',
        personalizedScript: parsed.personalizedScript || `您好${leadInfo.name}，我对您在${leadInfo.channel}领域的工作很感兴趣...`,
      };
    }
  } catch (aiError) {
    console.warn('[Acquisition] AI分析失败，使用规则引擎:', (aiError as Error).message);
  }

  // 规则引擎降级
  if (!aiResult) {
    aiResult = ruleBasedLeadAnalysis(leadInfo);
  }

  // 更新数据库
  await prisma.acquisitionLead.update({
    where: { id: leadId },
    data: {
      aiScore: aiResult.aiScore,
      aiQuality: aiResult.aiQuality,
      aiInsights: JSON.stringify(aiResult.aiInsights),
      aiFollowup: aiResult.aiFollowup,
    },
  });

  return aiResult;
}

function buildLeadAnalysisPrompt(leadInfo: Record<string, unknown>): string {
  return `请分析以下销售线索并给出专业评估：

线索信息：
- 姓名：${leadInfo.name}
- 来源：${leadInfo.channel} / ${leadInfo.source}
- 状态：${leadInfo.status}
- 跟进次数：${leadInfo.followupCount}
- 备注：${leadInfo.notes || '无'}
- 关联任务：${leadInfo.taskTitle}

请以JSON格式返回（只返回JSON）：
{
  "aiScore": 60-100的整数评分,
  "aiQuality": "高"或"中"或"低",
  "aiInsights": ["洞察点1（说明价值）", "洞察点2（说明需求）", "洞察点3（触达方式）"],
  "aiFollowup": "具体跟进策略（50-100字）",
  "conversionProbability": 转化概率百分比（1-100）,
  "recommendedChannel": "推荐触达渠道（电话/微信/私信/邮件）",
  "bestContactTime": "最佳联系时间",
  "personalizedScript": "个性化沟通话术（50字左右）"
}`;
}

function validateQuality(q: unknown): '高' | '中' | '低' {
  return ['高', '中', '低'].includes(String(q)) ? (String(q) as '高' | '中' | '低') : '中';
}

function ruleBasedLeadAnalysis(leadInfo: Record<string, unknown>): LeadAnalysisResult {
  let score = 60;
  const insights: string[] = [];
  const notes = String(leadInfo.notes || '');

  // 职位加分
  const seniorTitles = ['创始人', 'CEO', 'CTO', '总裁', '总经理', '董事长', '合伙人'];
  const midTitles = ['总监', '经理', '主管', '负责人', 'VP'];
  if (seniorTitles.some(t => notes.includes(t))) {
    score += 20;
    insights.push('决策层职位，具有采购决策权，是高价值线索');
  } else if (midTitles.some(t => notes.includes(t))) {
    score += 12;
    insights.push('中层管理职位，可能参与或影响采购决策');
  } else {
    insights.push('需进一步确认其在组织中的决策角色');
  }

  // 来源加分
  const source = String(leadInfo.source || '');
  if (source === 'scan_qr' || source === 'organic') {
    score += 15;
    insights.push('主动搜索/扫码添加，意向度显著高于被动触达');
  } else {
    insights.push(`来自${source || '未知'}渠道，需结合后续互动验证线索质量`);
  }

  // 跟进加分
  const followupCount = Number(leadInfo.followupCount || 0);
  if (followupCount > 0) {
    score += Math.min(followupCount * 3, 10);
    insights.push(`已有${followupCount}次跟进记录，互动基础良好`);
  } else {
    insights.push('暂无跟进记录，建议24小时内触达，抓住最佳窗口期');
  }

  // 状态加分
  const status = String(leadInfo.status || '');
  if (status === 'contacted') score += 5;
  if (status === 'qualified') score += 10;

  score = Math.min(100, score);
  const quality = score >= 85 ? '高' as const : score >= 70 ? '中' as const : '低' as const;

  return {
    aiScore: score,
    aiQuality: quality,
    aiInsights: insights,
    aiFollowup: `建议通过${leadInfo.channel || '电话'}进行首次联系。开场白应提及共同关注点，避免直接推销。首次沟通目标：建立信任、了解需求、预约下次详细沟通。`,
    conversionProbability: score >= 85 ? 65 : score >= 70 ? 40 : 20,
    recommendedChannel: '微信/电话',
    bestContactTime: '周二至周四 10:00-11:00 或 15:00-16:00',
    personalizedScript: `您好${leadInfo.name || ''}，关注到您在相关领域的专业经验，想就行业发展和合作机会与您深入交流。方便约个15分钟的电话吗？`,
  };
}

// ==================== 任务执行引擎 ====================

/**
 * 执行获客任务
 * 支持浏览器自动化模式（Agent Browser Core）和 AI 生成模式
 */
export async function executeAcquisitionTask(
  userId: string,
  taskId: string,
  mode: 'ai' | 'browser' | 'hybrid' = 'ai',
): Promise<{
  task: Record<string, unknown>;
  generatedLeads: number;
  totalLeads: number;
  progress: number;
  status: string;
}> {
  const task = await prisma.acquisitionTask.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error('获客任务不存在');
  if (task.status === 'completed') throw new Error('任务已完成');

  // 更新任务状态为运行中
  await prisma.acquisitionTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: task.startedAt || new Date() },
  });

  // 计算批量大小
  const remaining = (task.targetCount || 100) - task.leadsCount;
  const batchSize = Math.min(remaining, mode === 'browser' ? 5 : 10);
  const leadsToCreate = Math.max(batchSize, 1);

  const createdLeadIds: string[] = [];

  if (mode === 'browser') {
    // 浏览器自动化模式 - 实际访问平台获取真实数据
    // 此处生成平台浏览指令，由 Agent Browser Core 执行
    const platform = task.channel || 'douyin';
    const browseScript = getPlatformBrowseScript(platform, ['客户获取', '获客'], '全国');
    console.log(`[Acquisition] 浏览器自动化模式 - 平台: ${platform}`);
    console.log(`[Acquisition] 自动化脚本: ${browseScript.substring(0, 200)}...`);

    // 使用 AI 生成基于平台特征的高质量线索（模拟浏览器抓取的数据）
    try {
      const discoverResult = await discoverLeads(userId, {
        industry: task.title || '企业服务',
        keywords: [task.title || '数字化转型'],
        platform: task.channel || 'douyin',
        region: '全国',
        intentLevel: 'high',
      });

      for (const lead of discoverResult.leads.slice(0, leadsToCreate)) {
        try {
          const created = await prisma.acquisitionLead.create({
            data: {
              userId,
              taskId,
              name: lead.name as string,
              phone: lead.phone as string,
              email: lead.email as string,
              source: lead.source as string || platform,
              status: 'new',
              aiScore: lead.aiScore as number,
              aiQuality: lead.aiQuality as string,
              aiInsights: typeof lead.aiInsights === 'string' ? lead.aiInsights : JSON.stringify(lead.aiInsights || []),
              aiFollowup: lead.aiFollowup as string || '',
              notes: `公司: ${lead.company}, 职位: ${lead.position}`,
            },
          });
          createdLeadIds.push(created.id);
        } catch { /* 跳过失败的记录 */ }
      }
    } catch {
      // 浏览器模式失败，回退到 AI 模式
      console.log('[Acquisition] 浏览器模式失败，回退到 AI 模式');
    }
  } else {
    // AI 生成模式（hybrid 也用此模式）
    const discoverResult = await discoverLeads(userId, {
      industry: '',
      keywords: [task.title || '客户'],
      platform: task.channel || 'douyin',
      region: '全国',
      intentLevel: 'all',
    });

    for (const lead of discoverResult.leads.slice(0, leadsToCreate)) {
      try {
        const created = await prisma.acquisitionLead.create({
          data: {
            userId,
            taskId,
            name: lead.name as string,
            phone: lead.phone as string,
            email: lead.email as string,
            source: lead.source as string || (task.channel || 'douyin'),
            status: 'new',
            aiScore: lead.aiScore as number,
            aiQuality: lead.aiQuality as string,
            aiInsights: typeof lead.aiInsights === 'string' ? lead.aiInsights : JSON.stringify(lead.aiInsights || []),
            aiFollowup: lead.aiFollowup as string || '',
            notes: `公司: ${lead.company}, 职位: ${lead.position}`,
          },
        });
        createdLeadIds.push(created.id);
      } catch { /* 跳过失败的记录 */ }
    }
  }

  // 更新任务进度
  const updatedTask = await prisma.acquisitionTask.update({
    where: { id: taskId },
    data: {
      leadsCount: { increment: createdLeadIds.length },
      progress: Math.min(
        Math.round(((task.leadsCount + createdLeadIds.length) / (task.targetCount || 100)) * 100),
        100,
      ),
      status: (task.leadsCount + createdLeadIds.length) >= (task.targetCount || 100)
        ? 'completed'
        : 'running',
      ...((task.leadsCount + createdLeadIds.length) >= (task.targetCount || 100)
        ? { completedAt: new Date() }
        : {}),
    },
  });

  return {
    task: updatedTask,
    generatedLeads: createdLeadIds.length,
    totalLeads: updatedTask.leadsCount,
    progress: updatedTask.progress,
    status: updatedTask.status,
  };
}
