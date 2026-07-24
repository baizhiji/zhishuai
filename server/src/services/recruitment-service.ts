/**
 * Recruitment Service - 招聘系统 Service 层
 *
 * 借鉴 CodeBuddy 技能：
 * - Agent Browser Core: 浏览器自动化访问招聘平台
 * - sprint-planning: 招聘流程规划
 * - stakeholder-comms: 多角色沟通
 *
 * 新辅助能力：
 * - 多平台账号管理（Boss直聘/智联招聘/猎聘/拉勾）
 * - 浏览器自动化浏览职位和简历
 * - AI 驱动的 JD 生成、简历筛选、面试题生成
 * - 自动沟通 Pipeline
 */

import { PrismaClient } from '@prisma/client';
import { chatCompletion } from './ai-client';

const prisma = new PrismaClient();

// ==================== 类型定义 ====================

export interface RecruitmentPlatform {
  id: string;
  name: string;
  baseUrl: string;
  loginUrl: string;
  jobSearchUrl: string;
  resumeSearchUrl: string;
  enabled: boolean;
  authType: 'cookie' | 'token' | 'password';
}

export interface JDGenerationParams {
  title: string;
  department?: string;
  experience?: string;
  location?: string;
  salary?: string;
  requirements?: string;
  style?: 'professional' | 'casual' | 'concise';
}

export interface ResumeScreeningResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: 'strong_recommend' | 'recommend' | 'consider' | 'not_recommend';
  suggestedQuestions: string[];
  cultureFit: number;
  growthPotential: number;
}

export interface InterviewQuestionSet {
  jobTitle: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  totalQuestions: number;
  categories: {
    technical: Array<{
      question: string;
      expectedAnswer: string;
      difficulty: string;
      keywords: string[];
    }>;
    behavioral: Array<{
      question: string;
      expectedAnswer: string;
      difficulty: string;
      competency: string;
    }>;
    scenario: Array<{
      question: string;
      context: string;
      expectedAnswer: string;
      difficulty: string;
      competency: string;
    }>;
  };
  interviewTips: string[];
}

export interface CommunicationScript {
  scenario: string;
  scenarioName: string;
  style: string;
  scripts: Array<{
    id: string;
    name: string;
    content: string;
    variables: string[];
    tips: string;
  }>;
  bestPractices: string[];
  commonObjections: Array<{
    objection: string;
    response: string;
  }>;
}

// ==================== 招聘平台配置 ====================

export const RECRUITMENT_PLATFORMS: RecruitmentPlatform[] = [
  {
    id: 'boss',
    name: 'Boss直聘',
    baseUrl: 'https://www.zhipin.com',
    loginUrl: 'https://www.zhipin.com/web/user/?ka=header-login',
    jobSearchUrl: 'https://www.zhipin.com/web/geek/job',
    resumeSearchUrl: 'https://www.zhipin.com/web/chat',
    enabled: true,
    authType: 'cookie',
  },
  {
    id: 'zhilian',
    name: '智联招聘',
    baseUrl: 'https://www.zhaopin.com',
    loginUrl: 'https://passport.zhaopin.com/login',
    jobSearchUrl: 'https://www.zhaopin.com/sou/',
    resumeSearchUrl: 'https://rd5.zhaopin.com/resume/search',
    enabled: true,
    authType: 'cookie',
  },
  {
    id: 'liepin',
    name: '猎聘',
    baseUrl: 'https://www.liepin.com',
    loginUrl: 'https://www.liepin.com/login/',
    jobSearchUrl: 'https://www.liepin.com/zhaopin/',
    resumeSearchUrl: 'https://www.liepin.com/resume/',
    enabled: true,
    authType: 'cookie',
  },
  {
    id: 'lagou',
    name: '拉勾',
    baseUrl: 'https://www.lagou.com',
    loginUrl: 'https://passport.lagou.com/login/login.html',
    jobSearchUrl: 'https://www.lagou.com/jobs/list_',
    resumeSearchUrl: 'https://www.lagou.com/resume/',
    enabled: false,
    authType: 'cookie',
  },
];

/**
 * 获取平台登录状态
 */
export async function getPlatformStatus(userId: string): Promise<Array<RecruitmentPlatform & { loggedIn: boolean }>> {
  const accounts = await prisma.platformAccount.findMany({
    where: { userId, platform: { in: RECRUITMENT_PLATFORMS.map(p => p.id) }, status: 'active' },
  });

  const accountMap = new Map(accounts.map(a => [a.platform, a]));

  return RECRUITMENT_PLATFORMS.map(platform => ({
    ...platform,
    loggedIn: accountMap.has(platform.id)
      ? (accountMap.get(platform.id)!.sessionExpiry
        ? new Date(accountMap.get(platform.id)!.sessionExpiry!) > new Date()
        : false)
      : false,
  }));
}

/**
 * 生成浏览器自动化脚本（用于登录和浏览招聘平台）
 */
export function getPlatformLoginScript(platformId: string): string {
  const platform = RECRUITMENT_PLATFORMS.find(p => p.id === platformId);
  if (!platform) throw new Error(`未知平台: ${platformId}`);

  return `# ${platform.name} 平台自动化登录脚本

## 目标
登录 ${platform.name} (${platform.baseUrl}) 招聘平台

## 执行步骤
1. 打开 ${platform.loginUrl}
2. 等待页面加载完成（等待登录表单或二维码出现）
3. 检测登录方式：
   a. 如果有二维码 → 截图提示用户扫码
   b. 如果有账号密码框 → 尝试自动填入
4. 等待登录成功：
   a. 检测页面 URL 变化（例如不再包含 /login）
   b. 检测用户头像/用户名元素出现
5. 登录成功后，保存 Cookie 和 Session 信息
6. 返回登录状态

## 后续操作
登录后可以执行：
- 发布职位：导航到 ${platform.jobSearchUrl}
- 搜索简历：导航到 ${platform.resumeSearchUrl}
- 查看消息：检测消息通知

## 注意事项
- 如果出现验证码，截图并提示用户手动处理
- Cookie 有效期通常为 7 天，过期后需重新登录
- 操作频率不超过 3 秒/次`;
}

/**
 * 获取简历浏览脚本
 */
export function getResumeBrowseScript(platformId: string, keywords: string[]): string {
  const platform = RECRUITMENT_PLATFORMS.find(p => p.id === platformId);
  if (!platform) throw new Error(`未知平台: ${platformId}`);

  return `# ${platform.name} 简历浏览与收集脚本

## 目标
在 ${platform.name} 上搜索并浏览匹配的候选人简历

## 搜索条件
- 关键词: ${keywords.join(', ')}
- 平台: ${platform.name}

## 执行步骤
1. 确认已登录 ${platform.name}
2. 导航到 ${platform.resumeSearchUrl}
3. 在搜索框中输入关键词: "${keywords.join(' ')}"
4. 设置筛选条件（工作经验、学历、薪资期望等）
5. 浏览搜索结果列表
6. 对每个候选人：
   a. 记录姓名、当前职位、工作经验
   b. 记录技能标签
   c. 记录期望薪资
   d. 评估匹配度
7. 对于高匹配候选人：
   a. 点击"打招呼"或"联系TA"
   b. 发送预设的沟通模板
   c. 记录联系方式
8. 导出收集到的候选人数据

## 注意
- 每次浏览后间隔 3-5 秒
- 每天主动联系不超过 50 人（平台限制）
- 记录已联系的候选人 ID，避免重复`;
}

// ==================== AI JD 生成 ====================

/**
 * AI 生成职位描述（多模型协作版）
 */
export async function generateJD(
  userId: string,
  params: JDGenerationParams,
): Promise<Record<string, unknown>> {
  const buildPrompt = () => {
    const lines = [
      '请为以下岗位生成一份专业的职位描述(JD)：',
      `岗位名称：${params.title}`,
      params.department ? `部门：${params.department}` : '',
      params.experience ? `经验要求：${params.experience}` : '',
      params.location ? `工作地点：${params.location}` : '',
      params.salary ? `薪资范围：${params.salary}` : '',
      params.requirements ? `关键要求：${params.requirements}` : '',
      `风格：${params.style === 'casual' ? '轻松友好' : params.style === 'professional' ? '专业正式' : '简洁明了'}`,
    ].filter(Boolean).join('\n');

    const systemPrompt = `你是一位资深的人力资源专家。请严格按照JSON格式返回职位描述：

{
  "title": "岗位名称",
  "department": "所属部门",
  "location": "工作地点",
  "salaryRange": "薪资范围",
  "responsibilities": ["职责1", "职责2", ...],
  "requirements": ["要求1", "要求2", ...],
  "bonusPoints": ["加分项1", "加分项2", ...],
  "benefits": ["福利1", "福利2", ...],
  "summary": "职位亮点总结",
  "keywords": ["SEO关键词1", "SEO关键词2", ...]
}

要求：
- 岗位职责：5-8条，动词开头
- 任职要求：5-8条，区分必须和优先
- 加分项：3-5条
- 福利待遇：4-6条
- 总结：一句话亮点
- 关键词：5-8个

请确保输出为合法的JSON格式，不要包含markdown代码块标记。`;

    return { userPrompt: lines, systemPrompt };
  };

  // 尝试主模型
  let jdData: Record<string, unknown> | null = null;
  let aiGenerated = false;

  try {
    const { userPrompt, systemPrompt } = buildPrompt();
    const aiResponse = await chatCompletion(userId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jdData = JSON.parse(jsonMatch[0]);
      aiGenerated = true;
    }
  } catch {
    console.log('[Recruitment] AI JD生成失败，使用智能降级');
  }

  // 降级到模板
  if (!jdData) {
    jdData = generateFallbackJD(params);
  }

  return { ...jdData, aiGenerated, generatedAt: new Date().toISOString() };
}

/**
 * 智能降级 JD 生成（全品类模板，无 AI 时使用）
 */
export function generateFallbackJD(params: JDGenerationParams): Record<string, unknown> {
  const { title, department = '', location = '', experience = '3-5年', salary = '', requirements = '', style } = params;
  const isTech = /工程师|开发|前端|后端|测试|运维|算法|数据|AI|架构/i.test(title);
  const isProduct = /产品|运营|经理|策划/i.test(title);
  const isDesign = /设计|UI|UX|视觉/i.test(title);
  const isSales = /销售|市场|商务|客户|渠道/i.test(title);
  const isHR = /HR|人事|招聘|行政|人力/i.test(title);

  const category = isTech ? 'tech' : isProduct ? 'product' : isDesign ? 'design' : isSales ? 'sales' : isHR ? 'hr' : 'general';

  const templates: Record<string, any> = {
    tech: {
      responsibilities: [
        `负责${title}相关的系统设计、开发与维护工作`,
        `参与核心业务模块的技术方案设计与代码实现`,
        `编写高质量、可维护的代码，确保系统稳定性和性能`,
        `与产品、设计团队紧密协作，推动需求落地`,
        `参与代码评审，持续优化代码质量和开发流程`,
        `关注前沿技术，推动技术升级和团队成长`,
      ],
      requirements: [
        `${experience}以上${title}相关工作经验`,
        `精通对应技术栈，具备扎实的计算机基础`,
        `熟悉敏捷开发流程，具备良好的工程化思维`,
        `具备较强的问题分析和解决能力`,
        `良好的沟通协作能力和团队精神`,
        `有大规模系统开发经验者优先`,
      ],
      bonusPoints: ['有开源项目贡献或技术博客', '有高并发系统设计经验', '有技术团队管理经验', '熟悉云原生技术栈'],
      benefits: ['具有竞争力的薪资和期权', '五险一金+补充商业保险', '弹性工作制、不打卡', '定期团建和技术分享', '免费零食饮料下午茶'],
      summary: `加入我们，成为${title}领域的专家，与优秀的团队一起打造行业领先的产品。`,
    },
    product: {
      responsibilities: [
        `负责${title}的产品规划与需求分析`,
        `制定产品路线图，推动产品从概念到上线的全过程`,
        `深入理解用户需求，输出高质量的PRD文档`,
        `协调研发、设计、运营等团队，确保产品目标达成`,
        `持续跟踪产品数据，通过数据分析驱动产品迭代`,
        `关注行业竞品和趋势，保持产品竞争力`,
      ],
      requirements: [
        `${experience}以上${title}相关经验`,
        `熟悉产品设计方法论，具备结构化思维能力`,
        `良好的数据分析能力，能通过数据驱动决策`,
        `优秀的跨团队沟通和项目管理能力`,
        `强大的用户同理心和商业敏感度`,
        `有成功产品案例者优先`,
      ],
      bonusPoints: ['有B端SaaS产品经验', '有从0到1的产品经验', '具备技术背景', '有行业资源和人脉'],
      benefits: ['行业领先的薪资体系', '完善的晋升通道', '扁平化管理', '丰富的培训资源', '年度旅游'],
      summary: `如果你热爱产品，渴望用产品改变世界，这里是最好的舞台。`,
    },
    design: {
      responsibilities: [
        `负责${title}的整体视觉设计和交互体验`,
        `参与产品需求讨论，输出高质量的设计方案`,
        `建立和维护设计规范与组件库`,
        `与产品和研发团队协作，确保设计高质量落地`,
        `持续优化用户体验，提升产品可用性`,
      ],
      requirements: [
        `${experience}以上${title}相关经验`,
        `精通主流设计工具（Figma/Sketch等）`,
        `具备优秀的审美能力和设计思维`,
        `了解前端基础知识，能与开发高效协作`,
        `有完整的项目设计案例`,
        `有品牌设计经验者优先`,
      ],
      bonusPoints: ['有动效设计能力', '有3D设计经验', '有设计系统搭建经验', '有交互设计背景'],
      benefits: ['iMac+专业显示器', '设计培训基金', '弹性工作', '设计氛围浓厚', '作品自由度高'],
      summary: `让你的创意发光，与优秀设计师一起创造极致体验。`,
    },
    sales: {
      responsibilities: [
        `负责${title}相关业务的市场开拓与客户关系维护`,
        `完成销售目标，制定销售策略和计划`,
        `挖掘客户需求，提供专业的产品解决方案`,
        `参与商务谈判，推动合同签订和回款`,
        `收集市场反馈，为产品和运营提供建议`,
      ],
      requirements: [
        `${experience}以上${title}相关经验`,
        `具备优秀的商务沟通和谈判能力`,
        `有较强的目标感和执行力`,
        `熟悉行业特点和客户决策流程`,
        `良好的抗压能力和团队合作精神`,
        `有行业客户资源者优先`,
      ],
      bonusPoints: ['有团队管理经验', '有SaaS销售经验', '有行业大客户资源', '有销售培训经验'],
      benefits: ['高底薪+高提成', '完善的晋升通道', '差旅补贴', '定期团建', '股权激励'],
      summary: `在这里，你的每一分努力都将获得丰厚回报。`,
    },
    hr: {
      responsibilities: [
        `负责${title}相关工作，推动组织与人才发展`,
        `制定并执行招聘/培训/绩效计划`,
        `参与企业文化建设，提升员工满意度和归属感`,
        `优化人事流程和制度，提高管理效率`,
        `为业务部门提供专业的人力资源解决方案`,
      ],
      requirements: [
        `${experience}以上${title}相关经验`,
        `熟悉人力资源相关法律法规`,
        `具备优秀的沟通协调能力`,
        `良好的数据分析能力和系统性思维`,
        `有亲和力，善于处理员工关系`,
        `有HR系统建设经验者优先`,
      ],
      bonusPoints: ['有互联网/科技公司HR经验', '有组织发展(OD)经验', '有HRBP经验', '持有人力资源相关证书'],
      benefits: ['全面的福利保障', '丰富的培训资源', '良好的工作氛围', '职业发展通道', '年度体检'],
      summary: `加入我们，成为组织成长的核心推动者。`,
    },
    general: {
      responsibilities: [
        `负责${title}相关工作的规划与执行`,
        `参与团队协作，推动项目目标的达成`,
        `持续优化工作流程，提高工作效率`,
        `与部门内外保持良好沟通，确保信息畅通`,
        `协助上级完成相关任务和汇报`,
      ],
      requirements: [
        `${experience}以上相关工作经验`,
        `具备岗位所需的专业知识和技能`,
        `良好的沟通能力和团队合作精神`,
        `较强的学习能力和适应能力`,
        `工作积极主动，有责任心`,
        `有相关行业经验者优先`,
      ],
      bonusPoints: ['有团队管理经验', '有跨部门协作经验', '有相关证书或资质'],
      benefits: ['完善的社保福利', '良好的晋升空间', '舒适的办公环境', '定期团建活动', '节日福利'],
      summary: `在充满活力的团队中实现你的职业理想。`,
    },
  };

  const tpl = templates[category] || templates.general;
  const keywordsList = [title, ...(department ? [department] : []), ...(location ? [location] : []), '招聘', '求职', '高薪', '发展'];

  return {
    title,
    department: department || '待定部门',
    location: location || '待定工作地点',
    salaryRange: salary || '面议（行业领先水平）',
    ...tpl,
    keywords: [...new Set(keywordsList)],
    aiGenerated: false,
  };
}

// ==================== AI 简历筛选 ====================

/**
 * AI 简历筛选（增强版 - 多维度评估）
 */
export async function screenResume(
  userId: string,
  resumeText: string,
  jobId: string,
): Promise<ResumeScreeningResult> {
  const job = await prisma.recruitmentPost.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('岗位不存在');

  const jobDescription = [
    `岗位：${job.title}`,
    job.description ? `描述：${job.description}` : '',
    job.requirements ? `要求：${job.requirements}` : '',
    job.experience ? `经验：${job.experience}` : '',
    job.education ? `学历：${job.education}` : '',
    job.salaryMin && job.salaryMax ? `薪资：${job.salaryMin / 1000}K-${job.salaryMax / 1000}K` : '',
  ].filter(Boolean).join('\n');

  try {
    const systemPrompt = `你是一位资深的招聘专家。请分析简历与岗位的匹配度，以JSON格式返回：

{
  "score": 0-100,
  "matchedSkills": ["匹配技能"],
  "missingSkills": ["缺失技能"],
  "strengths": ["优势"],
  "weaknesses": ["不足"],
  "summary": "100-200字综合评价",
  "recommendation": "strong_recommend/recommend/consider/not_recommend",
  "suggestedQuestions": ["建议面试问题"],
  "cultureFit": 0-100,
  "growthPotential": 0-100
}

评分标准：
- 90+ strong_recommend, 75-89 recommend, 60-74 consider, <60 not_recommend
- 客观公正，给出具体理由
- cultureFit和growthPotential独立于技能匹配度评分

只返回JSON，不要其他文字。`;

    const aiResponse = await chatCompletion(userId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `岗位：\n${jobDescription}\n\n简历：\n${resumeText}` },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Number(parsed.score) || 0,
        matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
        missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        summary: String(parsed.summary || ''),
        recommendation: ['strong_recommend', 'recommend', 'consider', 'not_recommend'].includes(parsed.recommendation)
          ? parsed.recommendation
          : 'consider',
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : [],
        cultureFit: Number(parsed.cultureFit) || 50,
        growthPotential: Number(parsed.growthPotential) || 50,
      };
    }
  } catch {
    console.log('[Recruitment] AI简历筛选失败');
  }

  // 降级
  return {
    score: 0,
    matchedSkills: [],
    missingSkills: [],
    strengths: ['请配置AI服务后获得完整简历分析功能'],
    weaknesses: ['AI分析暂不可用'],
    summary: 'AI简历分析需要配置API密钥。请前往设置页面添加腾讯云TokenHub或阿里云百炼的API Key。',
    recommendation: 'consider',
    suggestedQuestions: [],
    cultureFit: 50,
    growthPotential: 50,
  };
}

// ==================== AI 面试题生成 ====================

/**
 * AI 面试题生成
 */
export async function generateInterviewQuestions(
  userId: string,
  jobTitle: string,
  skillsNeeded: string = '',
  questionCount: number = 10,
  difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium',
): Promise<InterviewQuestionSet> {
  const difficultyMap: Record<string, string> = {
    easy: '初级/校招水平',
    medium: '中级/社招水平',
    hard: '高级/专家水平',
  };

  try {
    const technicalCount = Math.ceil(questionCount * 0.5);
    const behavioralCount = Math.ceil(questionCount * 0.3);
    const scenarioCount = questionCount - technicalCount - behavioralCount;

    const systemPrompt = `你是一位资深面试官。请生成面试题目，以JSON格式返回：

{
  "jobTitle": "岗位名称",
  "difficultyLevel": "${difficultyLevel}",
  "totalQuestions": ${questionCount},
  "categories": {
    "technical": [{ "question": "...", "expectedAnswer": "...", "difficulty": "easy/medium/hard", "keywords": ["..."] }],
    "behavioral": [{ "question": "...", "expectedAnswer": "...", "difficulty": "easy/medium/hard", "competency": "..." }],
    "scenario": [{ "question": "...", "context": "...", "expectedAnswer": "...", "difficulty": "easy/medium/hard", "competency": "..." }]
  },
  "interviewTips": ["建议1", "建议2"]
}

要求：
- 技术题${technicalCount}道，覆盖核心技能点
- 行为题${behavioralCount}道，基于STAR法则
- 场景题${scenarioCount}道，贴近实际工作
- 难度：${difficultyMap[difficultyLevel]}
${skillsNeeded ? `- 重点考察：${skillsNeeded}` : ''}
只返回JSON。`;

    const aiResponse = await chatCompletion(userId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `为【${jobTitle}】生成${questionCount}道面试题，难度${difficultyMap[difficultyLevel]}` },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    });

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InterviewQuestionSet;
    }
  } catch {
    console.log('[Recruitment] AI面试题生成失败');
  }

  // 降级
  return {
    jobTitle,
    difficultyLevel,
    totalQuestions: questionCount,
    categories: {
      technical: [
        { question: `请介绍你在${jobTitle}领域的核心技能`, expectedAnswer: '候选人的技术能力和项目经验', difficulty: 'medium', keywords: ['专业技能'] },
        { question: '在过往项目中遇到过什么技术挑战？如何解决？', expectedAnswer: '问题分析与解决思路', difficulty: 'medium', keywords: ['解决问题'] },
        { question: `对${jobTitle}领域的最新技术趋势有何了解？`, expectedAnswer: '持续学习能力', difficulty: 'easy', keywords: ['技术视野'] },
      ],
      behavioral: [
        { question: '描述一次与团队分歧时如何处理', expectedAnswer: '沟通与冲突解决能力', difficulty: 'medium', competency: '沟通协作' },
        { question: '如何平衡多个优先级任务？', expectedAnswer: '时间管理能力', difficulty: 'medium', competency: '时间管理' },
      ],
      scenario: [
        { question: '新入职第一周你会做什么？', context: '入职场景', expectedAnswer: '快速上手、了解业务', difficulty: 'easy', competency: '适应能力' },
        { question: '项目突发需求变更如何应对？', context: '紧急场景', expectedAnswer: '应急响应、风险评估', difficulty: 'hard', competency: '应变能力' },
      ],
    },
    interviewTips: ['准备公司介绍材料', '预留给候选人提问时间', '记录面试评价'],
  };
}

// ==================== AI 沟通话术 ====================

/**
 * AI 招聘话术生成
 */
export async function generateRecruitmentScript(
  userId: string,
  scenario: string,
  jobTitle: string,
  style: 'professional' | 'friendly' | 'casual' = 'professional',
): Promise<CommunicationScript> {
  const scenarioMap: Record<string, { name: string; description: string }> = {
    initial_contact: { name: '初次联系', description: '第一次联系候选人，介绍岗位，引起兴趣' },
    follow_up: { name: '跟进沟通', description: '候选人未回复后跟进，温和提醒' },
    interview_invite: { name: '面试邀请', description: '正式邀请面试，传达安排信息' },
    offer: { name: 'Offer沟通', description: '传达录用意向，沟通薪资细节' },
    rejection: { name: '婉拒通知', description: '礼貌传达未通过消息，保持良好关系' },
  };

  const scenarioInfo = scenarioMap[scenario] || scenarioMap.initial_contact;

  try {
    const systemPrompt = `你是一位资深招聘顾问。请生成招聘话术，以JSON格式返回：

{
  "scenario": "${scenario}",
  "scenarioName": "${scenarioInfo.name}",
  "style": "${style}",
  "scripts": [
    { "id": "v1", "name": "版本一", "content": "话术（用{{变量}}标记）, "variables": ["说明"], "tips": "使用提示" },
    { "id": "v2", "name": "版本二", "content": "精简版话术", "variables": ["说明"], "tips": "适用于短信/微信" }
  ],
  "bestPractices": ["建议1", "建议2"],
  "commonObjections": [{ "objection": "可能异议", "response": "回应话术" }]
}

要求：至少2个版本，用{{变量名}}标记变量，包含异议处理。
只返回JSON。`;

    const aiResponse = await chatCompletion(userId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `为【${jobTitle}】生成${scenarioInfo.name}场景的招聘话术` },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    });

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CommunicationScript;
    }
  } catch {
    console.log('[Recruitment] AI话术生成失败');
  }

  // 降级
  return {
    scenario,
    scenarioName: scenarioInfo.name,
    style,
    scripts: [
      {
        id: 'v1',
        name: '标准版',
        content: `您好{{name}}，我是{{company}}的招聘顾问。看到您的背景与我们的{{jobTitle}}岗位很匹配，想与您深入聊聊。我们提供有竞争力的薪酬和良好发展空间。方便约个时间吗？`,
        variables: ['name - 候选人姓名', 'company - 公司名称', 'jobTitle - 岗位名称'],
        tips: '适用于第一次联系',
      },
    ],
    bestPractices: ['先了解候选人背景', '突出岗位吸引力', '保持真诚'],
    commonObjections: [{ objection: '已有其他offer', response: '了解候选人选择标准，强调自身优势' }],
  };
}

// ==================== 面试流程管理 ====================

export interface InterviewSchedule {
  jobId: string;
  candidateId: string;
  interviewerId: string;
  scheduledAt: Date;
  format: string;
  duration: number;
  notes: string;
}

export async function scheduleInterview(
  userId: string,
  schedule: InterviewSchedule,
) {
  const interview = await prisma.recruitmentInterview.create({
    data: {
      userId,
      jobId: schedule.jobId,
      resumeId: schedule.candidateId,
      interviewerId: schedule.interviewerId,
      scheduledAt: schedule.scheduledAt,
      format: schedule.format,
      duration: schedule.duration || 60,
      notes: schedule.notes,
      status: 'scheduled',
    },
  });

  // 自动生成面试提醒
  await prisma.crmReminder.create({
    data: {
      userId,
      type: 'interview',
      content: `面试提醒：${schedule.scheduledAt.toLocaleString()}，形式：${schedule.format}`,
      dueDate: new Date(schedule.scheduledAt.getTime() - 30 * 60 * 1000), // 提前30分钟提醒
    },
  }).catch(() => {});

  return interview;
}

// ==================== 招聘流水线统计 ====================

export async function getRecruitmentPipeline(userId: string) {
  const [jobs, resumes, interviews] = await Promise.all([
    prisma.recruitmentPost.findMany({
      where: { userId },
      select: { id: true, title: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.recruitmentResume.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    prisma.recruitmentInterview.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
  ]);

  const resumeStatus: Record<string, number> = {};
  resumes.forEach(r => { resumeStatus[r.status] = r._count; });

  const interviewStatus: Record<string, number> = {};
  interviews.forEach(i => { interviewStatus[i.status] = i._count; });

  return {
    activeJobs: jobs.filter(j => j.status === 'active').length,
    closedJobs: jobs.filter(j => j.status === 'closed').length,
    totalCandidates: Object.values(resumeStatus).reduce((a, b) => a + b, 0),
    candidatesByStatus: resumeStatus,
    interviewsByStatus: interviewStatus,
    pipelineSummary: {
      new: resumeStatus['new'] || 0,
      reviewing: resumeStatus['reviewing'] || 0,
      passed: resumeStatus['passed'] || 0,
      scheduled: interviewStatus['scheduled'] || 0,
      completed: interviewStatus['completed'] || 0,
      offered: resumeStatus['offered'] || 0,
      hired: resumeStatus['hired'] || 0,
      rejected: resumeStatus['rejected'] || 0,
    },
  };
}
