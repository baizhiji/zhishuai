/**
 * 智枢 AI SaaS 系统 - 智能提示词引擎
 *
 * 包含所有业务场景的优化提示词模板
 * 支持平台化、场景化、差异化的内容生成
 */

// ==================== 平台配置 ====================

export const PLATFORM_CONFIG = {
  douyin: {
    name: '抖音',
    features: ['短视频', '直播', '图文'],
    contentStyle: ['悬念感', '冲突感', '节奏快', '音乐感强'],
    titleStyle: ['悬念式', '数字型', '冲突型', '情感型'],
    maxTitleLength: 30,
    maxHashtagCount: 10,
    restrictions: ['禁止绝对化用语', '禁止虚假宣传', '敏感行业需资质']
  },
  kuaishou: {
    name: '快手',
    features: ['短视频', '直播', '图文'],
    contentStyle: ['接地气', '真实感', '亲近感', '方言可用'],
    titleStyle: ['真实故事型', '平民视角', '情感共鸣'],
    maxTitleLength: 25,
    maxHashtagCount: 8,
    restrictions: ['避免过度精致', '真实接地气更受欢迎']
  },
  xiaohongshu: {
    name: '小红书',
    features: ['图文笔记', '短视频', '直播'],
    contentStyle: ['精致', '攻略感', '种草感', 'emoji丰富', '生活感'],
    titleStyle: ['攻略型', '种草型', '对比型', '情感型'],
    maxTitleLength: 20,
    maxHashtagCount: 10,
    restrictions: ['避免硬广', '要有真实体验感', '禁止虚假种草']
  },
  video: {
    name: '视频号',
    features: ['短视频', '直播', '图文'],
    contentStyle: ['正能量', '情感共鸣', '熟人社交', '朋友圈风格'],
    titleStyle: ['情感型', '知识型', '新闻型'],
    maxTitleLength: 35,
    maxHashtagCount: 6,
    restrictions: ['避免过度娱乐化', '正能量内容更受欢迎']
  },
  bilibili: {
    name: 'B站',
    features: ['长视频', '短视频', '直播'],
    contentStyle: ['年轻化', 'ACG文化', '知识性', '弹幕友好'],
    titleStyle: ['知识型', '娱乐型', '教程型'],
    maxTitleLength: 40,
    maxHashtagCount: 12,
    restrictions: ['尊重版权', '避免低俗']
  }
};

// ==================== 内容类型配置 ====================

export const CONTENT_TYPES = {
  // 自媒体内容
  short_video_title: {
    name: '短视频标题',
    minLength: 10,
    maxLength: 30,
    temperature: 0.7,
    maxTokens: 800,
    model: 'qwen-max',
    modelFallback: 'qwen-plus'
  },
  long_video_title: {
    name: '长视频标题',
    minLength: 15,
    maxLength: 50,
    temperature: 0.65,
    maxTokens: 1000,
    model: 'qwen-max',
    modelFallback: 'qwen-plus'
  },
  hashtags: {
    name: '话题标签',
    count: 15,
    temperature: 0.8,
    maxTokens: 500,
    model: 'qwen-plus',
    modelFallback: 'hunyuan-instruct'
  },
  xiaohongshu_content: {
    name: '小红书文案',
    minLength: 300,
    maxLength: 1000,
    temperature: 0.75,
    maxTokens: 3000,
    model: 'qwen-max',
    modelFallback: 'qwen-plus'
  },
  short_video_script: {
    name: '短视频脚本',
    minDuration: 30,
    maxDuration: 180,
    temperature: 0.7,
    maxTokens: 4000,
    model: 'qwen-max',
    modelFallback: 'qwen-plus'
  },
  ecom_detail_page: {
    name: '电商详情页',
    minLength: 500,
    maxLength: 2000,
    temperature: 0.7,
    maxTokens: 5000,
    model: 'qwen-2.5-72b-instruct',
    modelFallback: 'qwen-max'
  },

  // 招聘内容
  job_description: {
    name: '招聘JD',
    minLength: 400,
    maxLength: 1000,
    temperature: 0.6,
    maxTokens: 3000,
    model: 'qwen-2.5-72b-instruct',
    modelFallback: 'qwen-max'
  },
  recruitment_summary: {
    name: '简历摘要',
    maxLength: 500,
    temperature: 0.5,
    maxTokens: 1500,
    model: 'qwen-plus',
    modelFallback: 'hunyuan-pro'
  },
  interview_invitation: {
    name: '面试邀请',
    maxLength: 300,
    temperature: 0.5,
    maxTokens: 800,
    model: 'qwen-plus',
    modelFallback: 'qwen-turbo'
  },

  // 获客内容
  outreach_message: {
    name: '引流话术',
    minLength: 60,
    maxLength: 150,
    temperature: 0.6,
    maxTokens: 500,
    model: 'qwen-plus',
    modelFallback: 'hunyuan-instruct'
  },
  qr_description: {
    name: '二维码说明',
    maxLength: 100,
    temperature: 0.5,
    maxTokens: 300,
    model: 'qwen-turbo',
    modelFallback: 'hunyuan-flash'
  },

  // AI 对话
  ai_reply: {
    name: 'AI回复',
    maxLength: 200,
    temperature: 0.5,
    maxTokens: 600,
    model: 'hunyuan-instruct',
    modelFallback: 'qwen-turbo'
  },
  intelligent_body: {
    name: '智能体配置',
    temperature: 0.6,
    maxTokens: 2000,
    model: 'qwen-max',
    modelFallback: 'qwen-plus'
  },

  // 通用
  summary: {
    name: '内容摘要',
    maxLength: 300,
    temperature: 0.4,
    maxTokens: 1000,
    model: 'qwen-plus',
    modelFallback: 'hunyuan-flash'
  }
};

// ==================== 提示词模板 ====================

export const PROMPTS = {
  // ==================== 1. 自媒体版块 ====================

  /**
   * 短视频标题生成（通用）
   */
  shortVideoTitle: (params: {
    topic: string;
    platform: string;
    industry?: string;
    targetAudience?: string;
    count?: number;
  }) => {
    const platformConfig = PLATFORM_CONFIG[params.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.douyin;
    const count = params.count || 10;

    return `你是一位抖音/快手爆款内容专家，擅长写高点击率的短视频标题。

【任务】请为以下主题生成${count}个爆款标题

【主题】${params.topic}
【目标平台】${platformConfig.name}
${params.industry ? `【所属行业】${params.industry}` : ''}
${params.targetAudience ? `【目标人群】${params.targetAudience}` : ''}

【平台特性】
- ${platformConfig.name}内容风格：${platformConfig.contentStyle.join('、')}
- 标题特点：${platformConfig.titleStyle.join('、')}
- 标题字数限制：${platformConfig.maxTitleLength}字以内
- 话题标签数量：${platformConfig.maxHashtagCount}个以内

【标题技巧要求】
必须包含以下至少3种技巧：
1. 悬念式：制造好奇心（"原来...才是正解"、"没想到..."）
2. 数字型：具体数据吸引（"3个方法..."、"只需...就..."）
3. 冲突型：制造反差（"月薪3千和3万的区别"）
4. 情感型：引发共鸣（"这就是..."、"终于找到..."）
5. 利益型：明确收益（"学会这招..."、"从此告别..."）
6. 问答型：引导互动（"你知道...吗？"）

【禁忌】
- 严禁：标题党、夸大虚假（"最好"、"第一"等绝对化用语）
- 严禁：敏感行业无资质推广
- 严禁：涉及政治、黄赌毒内容

【输出格式】
每行一个标题，前面加序号，格式：序号. 标题

生成${count}个标题：`};
  },

  /**
   * 小红书文案生成
   */
  xiaohongshuContent: (params: {
    topic: string;
    productInfo?: string;
    sellingPoints?: string[];
    targetAudience?: string;
    wordCount?: number;
  }) => {
    const wordCount = params.wordCount || 600;

    return `你是一位小红书头部博主，擅长写爆款种草笔记，粉丝称你的笔记"看完就想买"。

【任务】请生成一篇高质量小红书种草笔记

【产品/主题】${params.topic}
${params.productInfo ? `【产品信息】${params.productInfo}` : ''}
${params.sellingPoints?.length ? `【核心卖点】\n${params.sellingPoints.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}
${params.targetAudience ? `【目标人群】${params.targetAudience}` : ''}

【写作要求】

一、标题（2-3个备选）
- 包含核心关键词
- 带emoji符号
- 控制在${platformConfig.maxTitleLength}字以内
- 类型可选：攻略型/种草型/对比型/情感型

二、正文结构（${wordCount}+字）
1. 【开头】建立共鸣（30-50字）
   - 开头要有代入感
   - 可用"姐妹们"、"真的绝"、"救命"等开头
   - 描述常见痛点或场景

2. 【主体】产品/内容介绍（${wordCount - 200}字左右）
   - 分点介绍核心卖点
   - 每个卖点包含：使用场景 + 具体效果 + 个人感受
   - 穿插emoji分隔段落
   - 加入真实细节（具体数字、对比、使用体验）

3. 【结尾】总结引导（30-50字）
   - 核心观点总结
   - 互动引导："你们觉得呢"、"评论区告诉我"
   - 关注引导："喜欢的话点个关注"

三、话题标签
- 添加${platformConfig.douyin.maxHashtagCount}个相关话题
- 格式：#话题1 #话题2 #话题3

【语言风格】
- 亲切、口语化、有温度
- 像朋友推荐而非广告
- 适当使用感叹句增加感染力

【输出格式】
---
【标题备选】
1. ...
2. ...

【正文】
[正文内容]

【话题标签】
#xxx #xxx #xxx
---`;
  },

  /**
   * 短视频脚本生成
   */
  shortVideoScript: (params: {
    topic: string;
    duration: number;
    style: '种草' | '知识' | '剧情' | '口播' | '搞笑';
    platform: string;
    includeSubtitles?: boolean;
    includeBgm?: boolean;
  }) => {
    const platformConfig = PLATFORM_CONFIG[params.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.douyin;

    return `你是一位专业短视频编导，擅长为${platformConfig.name}平台制作爆款视频脚本。

【任务】请为以下主题生成一个完整的短视频分镜脚本

【基本信息】
- 主题：${params.topic}
- 目标时长：${params.duration}秒
- 视频风格：${params.style}
- 目标平台：${platformConfig.name}
${params.includeSubtitles ? '- 需要字幕：是' : ''}
${params.includeBgm ? '- 背景音乐：需要推荐' : ''}

【分镜脚本要求】

整体结构（控制总时长在${params.duration}秒以内）：
1. 【黄金3秒】开头 - 制造悬念或直接点题
   - 类型可选：痛点型/数字型/故事型/反问型
   - 必须抓住观众注意力

2. 【核心内容】主体 - ${params.duration - 10}秒左右
   - 分${Math.ceil((params.duration - 10) / 15)}个段落
   - 每段包含：画面描述 + 配音文字 + 字幕提示
   - 语言风格：${platformConfig.contentStyle.join('、')}

3. 【结尾5秒】收尾 - 总结+互动引导
   - 必须包含：核心信息总结
   - 必须包含：互动引导（"评论区告诉我"）
   - 可选：关注引导（"点关注不迷路"）

【每句话要求】
- 每句话控制在15字以内，方便口播
- 要有节奏感：疑问句→陈述句→感叹句 交替
- 避免长句和书面语

【情绪标注】
- 在关键句后标注情绪：[激动] [温柔] [专业] [幽默] [神秘]
- 帮助后期配音或数字人表达

${params.includeSubtitles ? '【字幕设计】
- 字幕位置：中下方
- 字幕样式：白字黑边或高亮底色
- 关键字幕可放大或加特效' : ''}

${params.includeBgm ? '【背景音乐建议】
- 推荐1首适合${params.style}风格的BGM
- 标注：高潮出现时间点' : ''}

【输出格式】
| 时长 | 画面描述 | 配音文字 | 字幕 | 情绪 |
|------|---------|---------|------|------|
| 0-3秒 | ... | ... | ... | ... |

【脚本内容】
`;
  },

  /**
   * 话题标签生成
   */
  hashtags: (params: {
    topic: string;
    platform: string;
    count?: number;
    includeTrending?: boolean;
  }) => {
    const platformConfig = PLATFORM_CONFIG[params.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.douyin;
    const count = params.count || 15;

    return `你是一位${platformConfig.name}运营专家，擅长选择高热度话题标签提升内容曝光。

【任务】请为以下主题生成${count}个话题标签

【内容主题】${params.topic}
【目标平台】${platformConfig.name}

【标签要求】
1. 数量：${count}个
2. 分布建议：
   - ${Math.ceil(count * 0.3)}个核心标签（直接相关，热度高）
   - ${Math.ceil(count * 0.4)}个泛流量标签（相关但宽泛，流量大）
   - ${Math.ceil(count * 0.3)}个蹭热点标签（当前流行或话题性强）

3. 格式要求：
   - 每个标签前带#号
   - 不用空格分隔，一行输出
   - 格式：#标签1 #标签2 #标签3...

【选择标准】
- 优先选择：近期有流量扶持的标签
- 优先选择：与内容高度相关的标签
- 避免：过于小众无人问津的标签
- 避免：已被平台限流的标签

生成${count}个话题标签：`;
  },

  /**
   * 图生文（图片描述生成）
   */
  imageToText: (params: {
    imageDescription?: string;
    purpose: '小红书' | '朋友圈' | '抖音' | '微博' | '通用';
    tone?: '种草' | '分享' | '记录' | '专业';
  }) => {
    return `你是一位资深内容创作者，擅长根据图片生成配套文案。

【任务】请根据图片内容生成适合${params.purpose}平台的文案

${params.imageDescription ? `【图片内容描述】\n${params.imageDescription}` : ''}

【平台】${params.purpose}
【文案风格】${params.tone || '分享'}

【要求】
1. 长度：
   - ${params.purpose === '小红书' ? '100-200字，包含emoji和话题标签' : ''}
   - ${params.purpose === '朋友圈' ? '50-150字，生活化表达' : ''}
   - ${params.purpose === '抖音' ? '30-80字，简洁有亮点' : ''}
   - ${params.purpose === '微博' ? '140字以内，可带话题' : ''}

2. 内容：
   - 描述图片中的关键信息
   - 表达个人感受或观点
   - 适当加入互动引导

3. ${params.purpose === '小红书' ? '必须包含3-5个相关话题标签' : ''}

生成文案：`;
  },

  /**
   * 批量内容生成
   */
  batchContent: (params: {
    topic: string;
    contentType: '标题' | '文案' | '脚本' | '话题';
    platform: string;
    count: number;
    variations: '相同角度不同表达' | '不同角度完全不同';
  }) => {
    return `你是一位专业内容运营专家，请根据以下信息批量生成内容。

【任务信息】
- 主题：${params.topic}
- 内容类型：${params.contentType}
- 生成数量：${params.count}个
- 目标平台：${params.platform}
- 差异化要求：${params.variations === '相同角度不同表达' ? '同一个角度/卖点，用不同表达方式呈现' : '从完全不同的角度切入，内容要有本质区别'}

【质量要求】
1. 每个内容都要有明显差异化，避免同质化
2. 符合${params.platform}平台调性
3. 无敏感词、无违规风险
4. 内容质量稳定，不能有明显高低之分

【输出格式】
每个内容用 === 分隔，格式：
【内容 ${params.variations === '相同角度不同表达' ? '表达变体' : '角度N'}】
[具体内容]

生成${params.count}个${params.contentType}：`;
  },

  // ==================== 2. 招聘版块 ====================

  /**
   * 招聘JD生成
   */
  jobDescription: (params: {
    jobTitle: string;
    companyInfo: string;
    salary?: string;
    location?: string;
    highlights?: string[];
  }) => {
    return `你是一位拥有15年经验的HR总监，擅长写吸引人才的招聘JD，让候选人"看完就想投简历"。

【任务】请为以下职位生成一份专业招聘JD

【职位信息】
- 职位名称：${params.jobTitle}
- 公司信息：${params.companyInfo}
${params.salary ? `- 薪资范围：${params.salary}` : ''}
${params.location ? `- 工作地点：${params.location}` : ''}
${params.highlights?.length ? `- 职位亮点：\n${params.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : ''}

【JD结构要求】

1. 【职位名称】吸引眼球版
   - 可加前缀："高薪急聘"、"神仙公司招人啦"、"[福利超好]"
   - 控制在20字以内

2. 【关于团队】50字左右
   - 介绍团队规模、氛围、成长机会
   - 避免空洞描述，要具体

3. 【做什么】4-6条
   - 每条1-2句话
   - 具体说明工作内容，避免模糊
   - 体现挑战性和成长性

4. 【希望你】4-6条
   - 与岗位高度相关的要求
   - 避免"等相关工作"等模糊表述
   - 区分"必须"和"加分"

5. 【我们提供】6-10条
   - 具体化福利（"六险一金"比"完善福利"好）
   - 量化福利（"每年2次调薪机会"）
   - 特殊福利可突出（"免费三餐"、"弹性打卡"）

6. 【加分项】3-5条（可选）
   - 非必须但有优势的加分项

【写作规范】
- 用词专业精准，避免歧义
- 积极正面但不过度承诺
- 避免歧视性用语（性别、年龄、学历等硬性限制）
- 职位描述要真实，不夸大

【输出格式】
---
【高薪急聘】[职位名称]

【关于团队】
...

【做什么】
1. ...
2. ...

【希望你】
1. ...
2. ...

【我们提供】
1. ...
2. ...

【加分项】
1. ...
---`;
  },

  /**
   * 简历智能分析
   */
  resumeAnalysis: (params: {
    resumeText: string;
    jobRequirements?: string;
    analysisType: 'match_score' | 'highlights' | 'concerns' | 'full';
  }) => {
    return `你是一位资深HR专家，擅长快速评估候选人匹配度。

【任务】${params.analysisType === 'full' ? '全面分析简历' : `重点分析：${params.analysisType === 'match_score' ? '岗位匹配度评分' : params.analysisType === 'highlights' ? '候选人亮点' : '风险点'}`}

【简历内容】
${params.resumeText}

${params.jobRequirements ? `【目标岗位要求】\n${params.jobRequirements}` : ''}

${params.analysisType === 'match_score' || params.analysisType === 'full' ? `【评分维度】（每项1-10分）
1. 岗位匹配度：候选人技能与岗位要求的匹配程度
2. 经验含金量：工作经历的公司背景、项目复杂度
3. 稳定性：平均在职时长、换工作频率
4. 成长性：职业发展路径是否清晰
5. 薪资预期合理性：与候选人背景是否匹配

给出综合推荐等级：强烈推荐/推荐/待定/不推荐` : ''}

${params.analysisType === 'highlights' || params.analysisType === 'full' ? `【亮点提炼】
- 3-5个核心亮点
- 每个亮点附上简历依据` : ''}

${params.analysisType === 'concerns' || params.analysisType === 'full' ? `【风险点】
- 2-4个需要进一步了解的问题
- 面试时重点确认的事项` : ''}

${params.analysisType === 'full' ? `【面试建议】
- 适合的问题（了解候选人真实能力）
- 适合的面试方式（技术面/HR面/管理层面）` : ''}

输出格式：
---
${params.analysisType === 'match_score' || params.analysisType === 'full' ? `【匹配度评分】
| 维度 | 评分 | 说明 |
|------|------|------|
| 岗位匹配 | X/10 | ... |
...` : ''}

${(params.analysisType === 'highlights' || params.analysisType === 'full') ? `【亮点提炼】
1. ...
...` : ''}

${(params.analysisType === 'concerns' || params.analysisType === 'full') ? `【风险点】
1. ...
...` : ''}

${params.analysisType === 'full' ? `【面试建议】
...
【综合评价】
推荐等级：...` : ''}
---`;
  },

  /**
   * 主动沟通候选人话术
   */
  recruitmentOutreach: (params: {
    candidateName?: string;
    candidateBackground: string;
    position: string;
    companyName: string;
    outreachStyle?: '热情' | '专业' | '简洁';
  }) => {
    return `你是一位招聘专家，擅长通过BOSS直聘等平台主动联系优秀候选人。

【任务】生成一段主动联系候选人的打招呼话术

【候选人信息】
${params.candidateName ? `- 候选人姓名：${params.candidateName}` : ''}
- 候选人背景：${params.candidateBackground}
- 应聘职位：${params.position}

【公司信息】
- 公司名称：${params.companyName}
- 沟通风格：${params.outreachStyle || '热情'}

【话术要求】

1. 长度控制
   - 总字数：80-150字
   - 单条消息不超过200字（太长会被平台限流）

2. 结构
   - 开场：简短问候 + 说明来源
   - 主体：突出2-3个吸引候选人的点
   - 结尾：引导查看职位详情或进一步沟通

3. ${params.outreachStyle === '热情' ? '热情风格' : params.outreachStyle === '专业' ? '专业风格' : '简洁风格'}
   ${params.outreachStyle === '热情' ? '- 语气亲切，有温度\n- 可用emoji增加亲近感\n- 像朋友推荐工作' : params.outreachStyle === '专业' ? '- 语气正式专业\n- 突出公司实力和岗位价值\n- 注重效率和专业性' : '- 直奔主题，不废话\n- 信息清晰明了\n- 快速筛选意向'}

4. 避免
   - 不要一上来就问"方便聊吗"
   - 不要直接发JD（太像群发）
   - 不要夸大或虚假宣传

生成3个不同角度的话术备选：
---
【角度1：突出岗位优势】
...

【角度2：突出公司实力】
...

【角度3：突出成长机会】
...
---`;
  },

  /**
   * 面试邀请
   */
  interviewInvitation: (params: {
    candidateName: string;
    position: string;
    interviewTime?: string;
    interviewMode?: '线上面试' | '线下面试' | '电话面试';
    preparation?: string[];
  }) => {
    return `你是一位招聘专员，擅长发送专业友好的面试邀请。

【任务】生成一条面试邀请消息

【基本信息】
- 候选人姓名：${params.candidateName}
- 面试岗位：${params.position}
${params.interviewTime ? `- 面试时间：${params.interviewTime}` : ''}
${params.interviewMode ? `- 面试方式：${params.interviewMode}` : ''}

【邀请内容要求】

1. 格式
   - 总字数：100-200字
   - 结构：问候→确认意向→告知面试安排→面试准备→期待回复

2. 内容
   - 开头：表达对其简历的认可
   - 中间：具体面试信息（时间、地点/链接、时长、面试官）
   - 结尾：询问是否方便、期待回复

3. ${params.interviewMode === '线上面试' ? '线上面试额外说明' : ''}
   ${params.interviewMode === '线上面试' ? '- 提供清晰的会议链接\n- 说明需要的设备和环境\n- 建议提前测试网络' : ''}

${params.preparation?.length ? `【面试准备提醒】
- ${params.preparation.join('\n- ')}` : ''}

【语言风格】
- 专业但有温度
- 不生硬公式化
- 体现公司文化和专业性

生成面试邀请消息：`;
  },

  /**
   * 自动回复候选人
   */
  autoReply: (params: {
    candidateMessage: string;
    conversationContext?: string;
    candidateStage: '咨询' | '观望' | '面试中' | '入职前' | '在职';
    replyStyle?: '热情' | '专业' | '亲切';
  }) => {
    return `你是一位高情商的HR，擅长回复候选人消息，让候选人感受到专业和被重视。

【任务】生成一条回复候选人的消息

【对话背景】
- 候选人消息：${params.candidateMessage}
${params.conversationContext ? `- 对话历史：${params.conversationContext}` : ''}
- 候选人阶段：${params.candidateStage}
- 沟通风格：${params.replyStyle || '专业'}

【回复要求】

1. 长度控制
   - 语音消息：20-50字
   - 文字消息：30-80字
   - 简短精炼，避免长篇大论

2. 内容要求
   - 必须回应候选人的具体问题/情绪
   - 传递有价值的信息
   - 推进对话（开放式提问或明确下一步）

3. ${params.replyStyle === '热情' ? '热情风格' : params.replyStyle === '亲切' ? '亲切风格' : '专业风格'}
   ${params.replyStyle === '热情' ? '- 语气积极有活力\n- 可以用感叹句\n- emoji点缀' : params.replyStyle === '亲切' ? '- 像朋友聊天\n- 有同理心\n- 自然不做作' : '- 简洁专业\n- 信息密度高\n- 效率导向'}

4. 候选人阶段调整
   ${params.candidateStage === '咨询' ? '- 咨询阶段：耐心解答 + 适当反问了解需求' : ''}
   ${params.candidateStage === '观望' ? '- 观望阶段：消除顾虑 + 案例/背书增强信心' : ''}
   ${params.candidateStage === '面试中' ? '- 面试阶段：流程说明 + 暖心鼓励' : ''}
   ${params.candidateStage === '入职前' ? '- 入职前：细节确认 + 入职准备提醒' : ''}

5. 避免
   - 不要机械化"您好，感谢您的咨询"
   - 不要过度推销
   - 不要暴露AI身份

生成5个不同风格的回复备选：
---
【风格1】
...

【风格2】
...
---`;
  },

  // ==================== 3. 获客版块 ====================

  /**
   * 引流话术生成
   */
  outreachMessage: (params: {
    scenario: '评论区引流' | '私信引流' | '直播间引流' | '碰一碰引流';
    product: string;
    targetProfile: string;
    platform: string;
    crmQrCode?: boolean;
    warmthLevel?: 'cold' | 'warm' | 'hot';
  }) => {
    const warmthConfig = {
      cold: { description: '初次接触，需要建立基础信任', delay: '10-30秒后', template: '简单问候+价值传递' },
      warm: { description: '有过互动，正在了解产品', delay: '5-15秒后', template: '直接价值+行动引导' },
      hot: { description: '主动询问，有购买意向', delay: '1-5秒后', template: '专业解答+促单' }
    };
    const config = warmthConfig[params.warmthLevel || 'cold'];

    return `你是一位私域引流专家，擅长通过各平台高效安全地引流潜在客户。

【任务】请为以下场景生成引流话术

【引流场景】${params.scenario}
【目标平台】${params.platform}
【产品/服务】${params.product}
【目标客户画像】${params.targetProfile}
${params.crmQrCode ? '- 需要附带企业微信二维码' : ''}

【客户热度】${config.description}
- 建议发送时机：${config.delay}
- 话术模板：${config.template}

【话术要求】

1. 长度控制
   - 总字数：${params.scenario === '私信引流' ? '80-120字' : '60-100字'}
   - ${params.scenario === '直播间引流' ? '极短，10-30字，适合弹幕/抖音私信' : ''}

2. 结构
   - ${params.scenario === '评论区引流' ? '开场（引起注意）→价值传递→行动引导' : ''}
   - ${params.scenario === '私信引流' ? '开场（差异化，非"你好在吗"）→核心价值→二维码引导' : ''}
   - ${params.scenario === '直播间引流' ? '简短有力，直接利益点' : ''}

3. 平台特性适配
   ${params.platform === '抖音' ? '- 抖音：偏轻松娱乐，语气不要太正式\n- 避免明显的广告感' : ''}
   ${params.platform === '小红书' ? '- 小红书：偏种草感，分享风格\n- 可以带个人体验' : ''}
   ${params.platform === '快手' ? '- 快手：接地气，真诚直接\n- 老铁风格受欢迎' : ''}
   ${params.platform === 'B站' ? '- B站：年轻化，可略带二次元风格\n- 知识感强' : ''}

4. 二维码话术（需要附带二维码时）
   ${params.crmQrCode ? `- 不要直接说"加微信"\n- 用"领取资料"、"获取方案"、"了解更多"等替代\n- 说明扫码后的价值' : ''}

5. 防封技巧
   - 不要出现"微信"、"加我"等敏感词
   - 不要频繁发送相同内容
   - ${params.scenario === '私信引流' ? '避免外链和二维码直接发送' : ''}

【生成数量】
生成3个不同风格的话术备选
- 风格1：价值吸引型（突出产品价值）
- 风格2：情感共鸣型（引发共鸣）
- 风格3：利益诱导型（限时/限量/优惠）`;
  },

  /**
   * 企业微信爆店码说明
   */
  qrCodeDescription: (params: {
    businessName?: string;
    product: string;
    incentive?: string;
  }) => {
    return `你是一位私域运营专家，擅长设计引流物料的说明文案。

【任务】为引流物料生成一段说明文案

${params.businessName ? `- 商家/企业名称：${params.businessName}` : ''}
- 产品/服务：${params.product}
${params.incentive ? `- 扫码激励：${params.incentive}` : ''}

【要求】
1. 长度：50-100字
2. 内容：
   - 开门见山说明价值
   - 扫码能获得什么
   - ${params.incentive ? '突出激励' : ''}
3. 风格：
   - 简洁有力
   - 有吸引力
   - 扫码理由明确

4. 避免：
   - 不要写"长按识别"（太官方）
   - 不要写"扫码关注"（没价值）

生成说明文案：`;
  },

  // ==================== 4. AI 能力模块 ====================

  /**
   * 智能体配置生成
   */
  intelligentBody: (params: {
    purpose: string;
    targetAudience: string;
    personality?: '专业' | '亲切' | '幽默' | '严谨';
    knowledgeDomain?: string;
  }) => {
    return `你是一位AI智能体设计专家，擅长构建具有独特人设的AI助手。

【任务】请为以下场景设计一个AI智能体配置

【智能体信息】
- 核心用途：${params.purpose}
- 服务人群：${params.targetAudience}
${params.personality ? `- 性格定位：${params.personality}` : ''}
${params.knowledgeDomain ? `- 知识领域：${params.knowledgeDomain}` : ''}

【配置要求】

1. 【人设设定】
   - 角色定义（一句话概括智能体身份）
   - 性格特征（3-5个关键词）
   - 语言风格（口头禅、常用表达方式）
   - 专业背景（具备哪些领域的知识）

2. 【回复风格】
   - 语气：${params.personality || '专业'}、有温度
   - 格式：是否需要结构化（列表/表格/分点）
   - 长度：长回复/短回复/视情况

3. 【边界设定】
   - 擅长领域（可以深入回答的问题类型）
   - 不擅长领域（需要转接人工或委婉拒绝）
   - 安全边界（不能回答的问题类型）

4. 【开场白】
   - 生成3个不同风格的开场白
   - 每个50字以内

5. 【示例对话】
   - 生成3个典型问答示例
   - 展示智能体的回答风格

【输出格式】
---
【人设设定】
角色：...
性格：...
语言风格：...

【回复风格】
...

【边界设定】
擅长：...
边界：...

【开场白】
1. ...
2. ...
3. ...

【示例对话】
Q: ...
A: ...

Q: ...
A: ...
---`;
  },

  /**
   * 自动回复（通用客服）
   */
  customerServiceReply: (params: {
    question: string;
    product?: string;
    orderInfo?: string;
    customerType?: '售前' | '售中' | '售后';
    replyLength?: 'short' | 'medium' | 'long';
  }) => {
    const lengthConfig = {
      short: '20-50字，简洁直接',
      medium: '50-100字，包含一定信息量',
      long: '100-200字，详细解答'
    };

    return `你是一位专业客服，擅长用自然友好的方式回复客户咨询。

【任务】请生成回复消息

【客户问题】${params.question}
${params.product ? `- 相关产品：${params.product}` : ''}
${params.orderInfo ? `- 订单信息：${params.orderInfo}` : ''}
- 客户阶段：${params.customerType || '售前'}
- 回复长度：${lengthConfig[params.replyLength || 'medium']}

【回复要求】

1. 长度：${lengthConfig[params.replyLength || 'medium']}

2. 内容要求
   - 直接回答客户问题
   - 提供有价值的信息
   - 适当引导下一步

3. 阶段调整
   ${params.customerType === '售前' ? '- 售前：重在解答疑惑、介绍产品价值' : ''}
   ${params.customerType === '售中' ? '- 售中：重在流程说明、消除顾虑' : ''}
   ${params.customerType === '售后' ? '- 售后：重在解决问题、表达关心' : ''}

4. 语言风格
   - 亲切专业
   - 有同理心（尤其售后）
   - 不要机械化

5. 避免
   - 不要一上来就说"您好，感谢您的咨询"
   - 不要过度推销
   - 不要复制粘贴官方话术

生成回复消息：`;
  },

  /**
   * 批量回复生成
   */
  batchReply: (params: {
    messages: string[];
    context: string;
    replyStyle?: '统一风格' | '个性化';
  }) => {
    return `你是一位高情商的客服专家，擅长批量回复客户消息。

【任务】请为以下消息生成回复

【消息列表】
${params.messages.map((m, i) => `${i + 1}. ${m}`).join('\n')}

【背景信息】${params.context}

【回复要求】
1. ${params.replyStyle === '统一风格' ? '统一风格：每条回复保持一致的说话风格' : '个性化：每条回复根据消息内容差异化回复'}
2. 长度：30-80字
3. 不要用完全相同的开头
4. 避免机械化回复

【输出格式】
| 消息 | 回复 |
|------|------|
| ${params.messages[0]} | ... |
| ${params.messages[1]} | ... |
...`;
  },

  // ==================== 5. 数据分析模块 ====================

  /**
   * 内容数据分析
   */
  contentAnalysis: (params: {
    platform: string;
    contentType: string;
    metrics: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      followers?: number;
    };
    contentTitle?: string;
  }) => {
    const { metrics } = params;

    return `你是一位数据分析专家，擅长解读短视频/图文内容数据并给出优化建议。

【任务】分析以下内容数据并给出诊断和建议

【内容信息】
- 平台：${params.platform}
- 内容类型：${params.contentType}
${params.contentTitle ? `- 内容标题：${params.contentTitle}` : ''}

【数据指标】
- 曝光量（播放/阅读）：${metrics.views || 0}
- 点赞数：${metrics.likes || 0}
- 评论数：${metrics.comments || 0}
- 转发/分享数：${metrics.shares || 0}
${metrics.followers ? `- 新增关注：${metrics.followers}` : ''}

【分析要求】

1. 计算关键比率
   - 点赞率 = 点赞 / 曝光 × 100%
   - 评论率 = 评论 / 曝光 × 100%
   - 转发率 = 转发 / 曝光 × 100%
   - 涨粉率 = 新增关注 / 曝光 × 100%

2. 与平台基准对比
   ${params.platform === '抖音' ? '- 抖音基准：点赞率3-8%，评论率0.5-2%，转发率0.5-2%' : ''}
   ${params.platform === '快手' ? '- 快手基准：点赞率3-5%，评论率1-3%，转发率0.5-1%' : ''}
   ${params.platform === '小红书' ? '- 小红书基准：点赞率3-10%，评论率0.5-3%，收藏率2-5%' : ''}
   ${params.platform === '视频号' ? '- 视频号基准：点赞率1-3%，评论率0.2-1%，转发率1-3%（朋友圈属性强）' : ''}

3. 问题诊断
   - 哪个指标低于基准？
   - 可能原因是什么？
   - 需要重点关注什么？

4. 优化建议（3-5条）
   - 每条建议：问题 + 原因 + 具体操作
   - 按优先级排序

5. 趋势预测
   - 基于当前数据，预测下一条内容的数据范围

【输出格式】
---
【数据诊断】
| 指标 | 数值 | 比率 | 平台基准 | 评价 |
|------|------|------|----------|------|
| 曝光 | ... | - | - | ... |
...

【问题分析】
1. 主要问题：...
   原因：...
   影响：...

【优化建议】
1. [优先级：高] 标题优化
   - 当前问题：...
   - 优化方向：...
   - 具体操作：...

2. ...

【数据预测】
- 曝光预估：X - X
- 如优化后可达：X - X
---`;
  },

  // ==================== 6. 通用模块 ====================

  /**
   * SEO优化
   */
  seoOptimization: (params: {
    content: string;
    platform: string;
    targetKeywords?: string[];
  }) => {
    return `你是一位SEO优化专家，请对以下内容进行优化。

【原始内容】
${params.content}

【目标平台】${params.platform}
${params.targetKeywords?.length ? `【目标关键词】\n${params.targetKeywords.join(', ')}` : ''}

【优化要求】

1. 关键词布局
   - 标题必须包含核心关键词
   - 前100字必须出现关键词
   - 关键词密度2-8%（自然出现）

2. 标题优化
   - 加入关键词
   - 增加吸引力（数字/疑问/情感）
   - 控制在平台字数限制内

3. 内容优化
   - 自然融入关键词
   - 使用小标题分段落
   - 增加可读性

4. 平台适配
   ${params.platform === '抖音' ? '- 抖音：标题30字内，前3字抓眼球' : ''}
   ${params.platform === '小红书' ? '- 小红书：标题20字内，带emoji' : ''}
   ${params.platform === '微信' ? '- 微信：标题36字内，打开率高' : ''}

输出优化后的完整内容：`;
  },

  /**
   * 内容改写/仿写
   */
  contentRewrite: (params: {
    originalContent: string;
    rewriteType: '精简' | '扩展' | '换风格' | '伪原创';
    targetPlatform?: string;
  }) => {
    return `你是一位内容改编专家，请将以下内容进行改编。

【原始内容】
${params.content}

【改编类型】
${params.rewriteType === '精简' ? '- 精简版：提炼核心，去除冗余' : ''}
${params.rewriteType === '扩展' ? '- 扩展版：补充细节，增加案例' : ''}
${params.rewriteType === '换风格' ? `- 风格转换：${params.targetPlatform || '目标平台'}风格` : ''}
${params.rewriteType === '伪原创' ? '- 伪原创：保持核心意思，句子重组，避免重复' : ''}

${params.targetPlatform && params.rewriteType !== '换风格' ? `【目标平台】${params.targetPlatform}` : ''}

【改编要求】
1. 保持核心信息不变
2. ${params.rewriteType === '精简' ? '控制在原文1/3-1/2长度' : ''}
3. ${params.rewriteType === '扩展' ? '增加具体细节、案例、数据支撑' : ''}
4. ${params.rewriteType === '换风格' ? `适配${params.targetPlatform}平台的内容风格` : ''}
5. ${params.rewriteType === '伪原创' ? '通过句式重组、同义词替换等方式降低重复率' : ''}

输出改编后的内容：`;
  },

  /**
   * 朋友圈文案
   */
  friendCircle: (params: {
    scenario: '日常分享' | '产品推广' | '个人成长' | '活动宣传';
    product?: string;
    tone?: '生活化' | '专业感' | '正能量';
  }) => {
    return `你是一位朋友圈运营专家，擅长写让人想点赞的朋友圈文案。

【任务】生成朋友圈文案

【场景类型】${params.scenario}
${params.product ? `- 推广产品：${params.product}` : ''}
【文案风格】${params.tone || '生活化'}

【文案要求】

1. 长度：50-200字
2. 结构建议：
   - ${params.scenario === '产品推广' ? '场景引入→产品价值→行动引导' : ''}
   - ${params.scenario === '个人成长' ? '经历/感悟→核心观点→互动引导' : ''}
   - ${params.scenario === '日常分享' ? '生活场景→有趣细节→共鸣点' : ''}
   - ${params.scenario === '活动宣传' ? '活动亮点→具体信息→参与引导' : ''}

3. ${params.tone === '生活化' ? '生活化风格：真实自然，像朋友聊天' : ''}
4. ${params.tone === '专业感' ? '专业风格：展示专业能力，建立信任' : ''}
5. ${params.tone === '正能量' ? '正能量风格：积极向上，有感染力' : ''}

6. 避免：
   - 太像广告
   - 过度营销感
   - 负能量/抱怨

生成文案：`;
  },

  /**
   * 社群运营话术
   */
  communityMessage: (params: {
    messageType: '欢迎语' | '群公告' | '活动推送' | '日常互动' | '促销文案';
    communityType?: '学习群' | '产品群' | '福利群' | '粉丝群';
    content?: string;
  }) => {
    return `你是一位社群运营专家，擅长写高效转化的社群消息。

【任务】生成社群${params.messageType}

${params.communityType ? `- 社群类型：${params.communityType}` : ''}
${params.content ? `- 消息内容：${params.content}` : ''}

【消息要求】

1. 长度：
   - ${params.messageType === '欢迎语' ? '50-100字，欢迎新成员+说明群价值' : ''}
   - ${params.messageType === '群公告' ? '100-200字，信息清晰+行动指引' : ''}
   - ${params.messageType === '活动推送' ? '80-150字，突出利益点+紧迫感' : ''}
   - ${params.messageType === '日常互动' ? '20-50字，轻松自然' : ''}
   - ${params.messageType === '促销文案' ? '100-200字，价值+优惠+行动' : ''}

2. 格式：
   - 适当使用emoji
   - 重点信息加粗或特殊符号
   - ${params.messageType === '活动推送' ? '有时间限制要强调' : ''}

3. ${params.communityType === '福利群' ? '福利群特点：突出免费/优惠/限时' : ''}
4. ${params.communityType === '学习群' ? '学习群特点：强调干货、知识价值' : ''}
5. ${params.communityType === '产品群' ? '产品群特点：专业+信任+案例' : ''}

生成消息：`;
  }
};

// ==================== 质量检查规则 ====================

export const QUALITY_CHECKS = {
  // 敏感词列表
  sensitiveWords: [
    '第一', '最好', '顶级', '国家级', '最优',
    '保证', '承诺', '100%', '绝对', '彻底',
    '秒', '马上', '立即', '立刻',
    '加我', '微信', 'v信', 'vx', '群',
    '投资', '理财', '赌博', '彩票'
  ],

  // 平台敏感词
  platformSensitive: {
    douyin: ['微信', '加我', '二维码', '群'],
    kuaishou: ['微信', '加我'],
    xiaohongshu: ['微信', '加我', '群', '公众号'],
    wechat: []
  },

  // 长度检查
  lengthCheck: (content: string, type: string): { passed: boolean; issue?: string } => {
    const config = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
    if (!config) return { passed: true };

    const length = content.length;
    if (config.minLength && length < config.minLength) {
      return { passed: false, issue: `内容过短，至少需要${config.minLength}字` };
    }
    if (config.maxLength && length > config.maxLength) {
      return { passed: false, issue: `内容过长，最多${config.maxLength}字` };
    }

    return { passed: true };
  },

  // 重复度检查
  duplicateCheck: (content: string): { passed: boolean; score: number; issue?: string } => {
    const words = content.split(/[\s,\.，。、；;]/).filter(w => w.length > 2);
    const uniqueWords = new Set(words);
    const duplicateRate = 1 - (uniqueWords.size / words.length);

    if (duplicateRate > 0.5) {
      return { passed: false, score: duplicateRate, issue: '内容重复度过高' };
    }

    return { passed: true, score: duplicateRate };
  }
};

// ==================== 模型选择器 ====================

export function selectModel(taskType: string, fallback?: boolean): string {
  const config = CONTENT_TYPES[taskType as keyof typeof CONTENT_TYPES];
  if (!config) {
    return fallback ? 'qwen-turbo' : 'qwen-plus';
  }

  return fallback ? config.modelFallback : config.model;
}

// ==================== 参数优化器 ====================

export function getOptimizedParams(taskType: string) {
  const config = CONTENT_TYPES[taskType as keyof typeof CONTENT_TYPES];
  if (!config) {
    return {
      temperature: 0.7,
      max_tokens: 2000
    };
  }

  return {
    temperature: config.temperature,
    max_tokens: config.maxTokens
  };
}

// ==================== Chain of Thought 思维链提示词 ====================

export const CHAIN_OF_THOUGHT_PROMPTS = {
  /**
   * 简历分析 - 思维链版本
   */
  resumeAnalysisCot: (resumeText: string, jobRequirements?: string) => {
    return `你是一位资深HR总监，请使用"思维链"方法分析简历。

【任务】逐步分析简历，得出结论

【简历内容】
${resumeText}

${jobRequirements ? `【目标岗位要求】\n${jobRequirements}` : ''}

【思维链分析步骤】

第一步：基础信息识别
- 学历背景
- 工作年限
- 最近职位和公司
- 核心技能标签

第二步：经历分析
- 逐段分析工作经历
- 识别关键成就和贡献
- 评估公司背景含金量

第三步：技能匹配度评估
- 硬技能匹配度
- 软技能评估
- 与岗位要求的差距

第四步：风险点识别
- 职业稳定性
- 薪资预期合理性
- 潜在风险

第五步：综合判断
- 给出推荐等级（强烈推荐/推荐/待定/不推荐）
- 说明推荐理由
- 如有问题，提出改进建议

【输出要求】
请按上述步骤逐一分析，最终给出结论。每个步骤都要有具体的分析依据。`;
  },

  /**
   * 内容质量评估 - 思维链版本
   */
  contentQualityAssessment: (content: string, platform: string, purpose: string) => {
    return `你是一位内容质量评估专家，请使用"思维链"方法评估内容。

【任务】评估以下内容的质量并给出改进建议

【内容】
${content.slice(0, 2000)}

【平台】${platform}
【目的】${purpose}

【思维链评估步骤】

第一步：内容基础评估
- 结构完整性
- 逻辑连贯性
- 语言表达流畅度

第二步：平台适配性分析
- 是否符合${platform}平台调性
- 平台算法偏好匹配度
- 受众群体契合度

第三步：吸引力评估
- 开头是否能抓住注意力
- 是否有情感共鸣点
- 行动号召是否有力

第四步：合规性检查
- 敏感词检测
- 平台规则符合度
- 法律风险评估

第五步：综合评分与改进建议
- 各维度评分（1-10分）
- 核心问题总结
- 3-5条具体改进建议

【输出要求】
按步骤分析，每步给出评分和依据，最终给出综合报告。`;
  },

  /**
   * 客户意向判断 - 思维链版本
   */
  customerIntentAnalysis: (customerData: Record<string, any>, interactionHistory: string[]) => {
    return `你是一位销售分析专家，请使用"思维链"方法判断客户意向。

【任务】分析客户意向等级和最佳跟进策略

【客户信息】
${Object.entries(customerData).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

【互动历史】
${interactionHistory.map((h, i) => `${i + 1}. ${h}`).join('\n')}

【思维链分析步骤】

第一步：客户画像构建
- 基本属性（年龄、职业、地区）
- 需求标签
- 行为特征

第二步：互动深度分析
- 主动行为 vs 被动行为
- 互动频率和趋势
- 关键行为节点

第三步：意向信号识别
- 积极信号（询问价格、索要资料、主动联系）
- 消极信号（长时间无响应、多次拒绝）
- 中性信号

第四步：意向等级判定
- A级（高意向，72小时内跟进）
- B级（中意向，一周内跟进）
- C级（低意向，持续培养）
- D级（无意向，暂不跟进）

第五步：跟进策略建议
- 最佳跟进时机
- 推荐跟进方式
- 话术建议

【输出要求】
按步骤分析，最终给出意向等级和具体跟进建议。`;
  },

  /**
   * 热点选题分析 - 思维链版本
   */
  hotspotAnalysis: (topic: string, industry: string) => {
    return `你是一位热点运营专家，请使用"思维链"方法分析热点选题。

【任务】评估热点价值并给出内容方向建议

【热点/话题】${topic}
【行业/领域】${industry}

【思维链分析步骤】

第一步：热点价值评估
- 热度等级（爆款/热门/一般）
- 生命周期预估
- 受众覆盖范围

第二步：受众需求分析
- 目标用户痛点
- 用户想获得什么
- 情感共鸣点

第三步：内容角度选择
- 可以切入的角度有哪些
- 每个角度的差异化程度
- 推荐的最佳角度

第四步：风险评估
- 蹭热点风险等级
- 潜在争议点
- 平台敏感度

第五步：内容创作建议
- 推荐的内容形式
- 标题技巧
- 关键信息点
- 行动号召设计

【输出要求】
按步骤分析，最终给出创作建议。`;
  },

  /**
   * 竞品分析 - 思维链版本
   */
  competitorAnalysis: (competitorInfo: Record<string, any>) => {
    return `你是一位商业分析专家，请使用"思维链"方法分析竞品。

【任务】全面分析竞品并找出差异化机会

【竞品信息】
${Object.entries(competitorInfo).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

【思维链分析步骤】

第一步：产品定位分析
- 目标用户是谁
- 核心卖点是什么
- 价格策略

第二步：优劣势拆解
- 主要优势（3-5条）
- 主要劣势（3-5条）
- 用户评价印证

第三步：市场策略分析
- 推广渠道
- 内容策略
- 定价策略
- 运营活动

第四步：机会点识别
- 竞品未满足的需求
- 市场空白点
- 差异化机会

第五步：应对策略建议
- 差异化定位
- 核心竞争力构建
- 风险预警

【输出要求】
按步骤分析，最终给出差异化策略建议。`;
  },

  /**
   * 数据异常诊断 - 思维链版本
   */
  dataAnomalyDiagnosis: (metrics: Record<string, number>, context?: string) => {
    return `你是一位数据分析师，请使用"思维链"方法诊断数据异常。

【任务】分析数据异常原因并给出建议

【数据指标】
${Object.entries(metrics).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

${context ? `【背景信息】\n${context}` : ''}

【思维链分析步骤】

第一步：数据概览
- 整体趋势（上升/下降/平稳）
- 主要变化点
- 异常程度评估

第二步：外部因素排查
- 是否受节假日影响
- 是否有活动干扰
- 行业整体趋势

第三步：内部因素排查
- 产品/功能变化
- 运营策略调整
- 用户结构变化
- 技术/性能问题

第四步：关联分析
- 相关指标关联性
- 因果关系推理
- 主要驱动因素

第五步：结论与建议
- 异常原因判断
- 是否需要干预
- 具体改进建议

【输出要求】
按步骤分析，最终给出诊断结论和行动建议。`;
  },

  /**
   * 转化率优化分析 - 思维链版本
   */
  conversionOptimization: (funnelData: Record<string, number>, goal: string) => {
    return `你是一位增长专家，请使用"思维链"方法分析转化漏斗。

【任务】找出转化瓶颈并给出优化建议

【转化漏斗数据】
${Object.entries(funnelData).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

【目标】${goal}

【思维链分析步骤】

第一步：漏斗结构分析
- 各环节转化率计算
- 薄弱环节识别
- 行业基准对比

第二步：流失原因推断
- 流失发生在哪一步
- 可能的原因是什么
- 用户反馈印证

第三步：优化优先级排序
- 哪个环节改进空间最大
- 投入产出比评估
- 技术实现难度

第四步：优化方案设计
- 针对性改进措施
- A/B测试建议
- 预期效果评估

第五步：实施计划
- 短期行动（1-2周）
- 中期优化（1个月）
- 长期迭代（3个月）

【输出要求】
按步骤分析，最终给出优化方案和时间表。`;
  }
};

// ==================== 结构化输出提示词 ====================

export const STRUCTURED_OUTPUT_PROMPTS = {
  /**
   * JSON Schema 输出格式定义
   */
  jsonSchema: {
    title: {
      type: 'object',
      properties: {
        primary: { type: 'string', description: '主推标题' },
        alternatives: { type: 'array', items: { type: 'string' }, description: '备选标题' },
        score: { type: 'number', description: '质量评分 1-10' },
        highlights: { type: 'array', items: { type: 'string' }, description: '标题亮点' }
      },
      required: ['primary']
    },
    post: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        hashtags: { type: 'array', items: { type: 'string' } },
        emoji_count: { type: 'integer' },
        word_count: { type: 'integer' },
        call_to_action: { type: 'string' },
        quality_score: { type: 'number' }
      },
      required: ['title', 'content', 'hashtags']
    },
    script: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timing: { type: 'string' },
              content: { type: 'string' },
              emotion: { type: 'string' },
              note: { type: 'string' }
            }
          }
        },
        total_duration: { type: 'integer', description: '预计时长（秒）' },
        bpm_suggestion: { type: 'string', description: '推荐背景音乐风格' }
      },
      required: ['sections']
    },
    analysis: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string', enum: ['强烈推荐', '推荐', '待定', '不推荐'] },
        confidence: { type: 'number', description: '判断置信度 0-1' }
      },
      required: ['score', 'recommendation']
    }
  },

  /**
   * 生成结构化输出的系统提示
   */
  structuredSystemPrompt: `你是一位专业的AI助手。请严格按照要求的JSON格式输出，不要包含任何其他内容。

【输出要求】
1. 只输出JSON，不要有解释性文字
2. JSON必须完全符合schema定义
3. 所有必填字段必须存在
4. 字段类型必须正确`;
};
