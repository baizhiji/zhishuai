/**
 * 内容创意增强服务 (Content Creativity Enhancement Service)
 * 
 * 整合 10万+爆款选题 技能的核心方法论：
 * - 爆款四基因（情绪、信息差、身份标签、行动触发）
 * - 12条内容策划心法
 * - 8维打分卡
 * - 平台特色优化
 * 
 * 与 ai-client 配合：当 AI 可用时使用真实模型增强，
 * 不可用时提供高质量模板降级。
 */

import { chatCompletion, ChatMessage } from './ai-client';

// ─── 类型定义 ────────────────────────────────

export interface CreativityOptions {
  /** 内容主题 */
  topic: string;
  /** 目标平台 */
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'weibo';
  /** 内容类型 */
  contentType: 'video' | 'article' | 'image_text' | 'live_script' | 'ad_copy';
  /** 创意等级 0-1 */
  creativity: number;
  /** 目标受众描述 */
  targetAudience?: string;
  /** 产品/服务名称（如适用） */
  productName?: string;
  /** 关键词 */
  keywords?: string[];
}

export interface ViralScore {
  /** 情绪钩子分 1-5 */
  emotion: number;
  /** 传播潜力分 1-5 */
  spread: number;
  /** 独家性分 1-5 */
  uniqueness: number;
  /** 身份标签分 1-5 */
  identity: number;
  /** 时效性分 1-5 */
  timeliness: number;
  /** 传播锚点分 1-5 */
  anchor: number;
  /** 可视化分 1-5 */
  visual: number;
  /** 参与门槛分 1-5 */
  barrier: number;
  /** 总分 */
  total: number;
}

export interface ContentBlueprint {
  /** 标题方案（5个不同角度） */
  titles: string[];
  /** 最佳标题 */
  bestTitle: string;
  /** 内容大纲 */
  outline: string[];
  /** 钩子段（前3秒/前50字） */
  hook: string;
  /** 正文内容 */
  body: string;
  /** CTA（行动号召） */
  cta: string;
  /** 话题标签 */
  hashtags: string[];
  /** 爆款评分 */
  viralScore: ViralScore;
  /** 基因分析 */
  geneAnalysis: {
    emotionDesc: string;
    infoGap: string;
    identityTag: string;
    actionTrigger: string;
    hitCount: number;
  };
  /** 平台优化建议 */
  platformTips: string[];
  /** 是否AI生成 */
  aiGenerated: boolean;
}

export interface PlatformTrend {
  platform: string;
  trendingTopics: string[];
  viralFormats: string[];
  bestPostTimes: string;
  engagementTips: string[];
}

// ─── 平台优化配置 ────────────────────────────────

const PLATFORM_CONFIGS: Record<string, {
  maxTitleLength: number;
  maxBodyLength: number;
  optimalDuration: string;
  hashtagStrategy: string;
  hookRequirements: string;
  ctaStyle: string;
  contentTone: string;
  tabooWords: string[];
  bestFormats: string[];
  bestPostTimes: string;
  engagementTips: string[];
}> = {
  douyin: {
    maxTitleLength: 55,
    maxBodyLength: 500,
    optimalDuration: '15-30秒或1-3分钟',
    hashtagStrategy: '热门挑战标签 + 领域标签，3-5个',
    hookRequirements: '前3秒必须抓住注意力：疑问/冲突/震撼数据/反转',
    ctaStyle: '引导点赞关注，评论区互动（如"评论区告诉我你的想法"）',
    contentTone: '口语化，节奏感强，悬念反转',
    tabooWords: ['最', '第一', '唯一', '绝对', '100%', '国家级', '世界级'],
    bestFormats: ['悬念反转', '前后对比', '干货教程', 'vlog纪实', '挑战/测评'],
    bestPostTimes: '工作日7:00-9:00, 12:00-14:00, 18:00-22:00；周末10:00-12:00',
    engagementTips: ['前三秒靠画面不靠文字', '评论区引导互动', '善用热门BGM', '结尾留悬念'],
  },
  kuaishou: {
    maxTitleLength: 50,
    maxBodyLength: 400,
    optimalDuration: '10-20秒或2-5分钟',
    hashtagStrategy: '老铁文化标签 + 同城标签，2-4个',
    hookRequirements: '真实场景开场，拉近距离，"老铁们"文化',
    ctaStyle: '双击屏幕支持，评论区聊聊',
    contentTone: '真实接地气，生活化，情感共鸣',
    tabooWords: ['最', '第一', '绝对'],
    bestFormats: ['真实记录', '技能展示', '搞笑段子', '生活窍门', '草根创业'],
    bestPostTimes: '工作日6:00-8:00, 11:00-13:00, 19:00-21:00',
    engagementTips: ['真实感最重要', '老铁文化互动', '同城标签引流', '定期直播拉近距离'],
  },
  xiaohongshu: {
    maxTitleLength: 20,
    maxBodyLength: 1000,
    optimalDuration: '图文为主，视频1-3分钟',
    hashtagStrategy: '精准话题标签 + 品牌标签，5-8个',
    hookRequirements: '封面标题党：数字+结果+情绪词，正文开头用emoji',
    ctaStyle: '收藏备用，评论区提问',
    contentTone: '精致种草，攻略型，视觉美感',
    tabooWords: ['加微信', '联系我', '私信', '联系方式', '最', '第一'],
    bestFormats: ['种草测评', '攻略合集', '好物清单', '经验分享', '对比评测'],
    bestPostTimes: '工作日8:00-9:00, 12:00-13:00, 20:00-22:00',
    engagementTips: ['封面就是一半流量', '标题必须吸引点击', '正文开头有钩子', '标签精准5-8个'],
  },
  bilibili: {
    maxTitleLength: 80,
    maxBodyLength: 2000,
    optimalDuration: '5-15分钟',
    hashtagStrategy: '分区标签 + 热门话题，3-5个',
    hookRequirements: '标题吸引：反常识/深度解析/趣味挑战，用梗文化开场',
    ctaStyle: '一键三连，弹幕见',
    contentTone: '深度内容，梗文化，弹幕互动',
    tabooWords: ['加微信', '私聊'],
    bestFormats: ['深度解析', '趣味科普', '挑战实拍', '教程系列', '观点点评'],
    bestPostTimes: '工作日12:00-14:00, 18:00-20:00；周末10:00-12:00, 18:00-22:00',
    engagementTips: ['标题有梗有深度', '弹幕互动引导', '分集/系列化', 'BGM选曲讲究'],
  },
  weibo: {
    maxTitleLength: 28,
    maxBodyLength: 280,
    optimalDuration: '短图文为主，视频1-3分钟',
    hashtagStrategy: '热搜话题 + 超话标签，2-4个',
    hookRequirements: '话题引爆：热搜词+鲜明观点态度',
    ctaStyle: '转发扩散，评论区讨论',
    contentTone: '短平快，话题性，互动感',
    tabooWords: ['最', '第一', '绝对', '加微信', '私信'],
    bestFormats: ['话题引爆', '观点输出', '事件追踪', '数据可视化', '投票互动'],
    bestPostTimes: '工作日8:00-10:00, 12:00-13:00, 20:00-23:00',
    engagementTips: ['热点即时响应', '用#话题tag#', '图片胜千言', '互动引导转发'],
  },
};

// ─── 爆款四基因分析 ────────────────────────────────

export function analyzeViralGenes(topic: string, audience?: string): {
  emotionDesc: string;
  infoGap: string;
  identityTag: string;
  actionTrigger: string;
  hitCount: number;
} {
  const topicLower = topic.toLowerCase();
  const results = { emotionDesc: '', infoGap: '', identityTag: '', actionTrigger: '', hitCount: 0 };

  // 情绪检测
  const emotionPatterns: Record<string, string> = {
    '为什么|凭啥|不公平|凭什么': '愤怒共鸣——触发"凭什么"情绪',
    '治愈|温暖|感动|美好|终于': '温柔治愈——触发"被温柔击中"',
    '焦虑|来不及|错过|淘汰|差距': '适度焦虑——触发"我需要行动"',
    '真相|揭秘|内幕|原来|居然': '惊讶震撼——触发"颠覆认知"',
    '爽|燃|赢|逆袭|翻盘': '爽感满足——触发"代我出气"',
  };
  for (const [pattern, desc] of Object.entries(emotionPatterns)) {
    if (new RegExp(pattern).test(topicLower)) {
      results.emotionDesc = desc;
      results.hitCount++;
      break;
    }
  }
  if (!results.emotionDesc) results.emotionDesc = '可加强情绪钩子（建议：用"共鸣/惊讶/治愈"切入）';

  // 信息差检测
  if (/做了\d+年|内行人|内部人才知道|90%的人不知道|行业黑幕/i.test(topicLower)) {
    results.infoGap = '强信息差——"我知道你不知道"优越感';
    results.hitCount++;
  } else if (/\d+个|秘密|窍门|公式|方法|套路/i.test(topicLower)) {
    results.infoGap = '中等信息差——干货认知差';
    results.hitCount++;
  } else {
    results.infoGap = '可增强信息差（建议：加入"做了X年才发现的"惊喜感）';
  }

  // 身份标签检测
  const identityPatterns: Record<string, string> = {
    '宝妈|妈妈|孕妇|亲子': '宝妈群体——育儿身份认同',
    '打工人|上班族|996|加班': '打工人——职场身份共鸣',
    '北漂|沪漂|小镇|留学生': '漂泊者——地域身份共振',
    'i人|e人|社恐|内向|外向': '性格标签——人格身份表达',
    '80后|90后|00后|中年|30岁|20岁': '代际标签——年龄身份共鸣',
    '裸辞|被裁|自由职业|创业|副业': '职场处境——状态身份共鸣',
  };
  for (const [pattern, desc] of Object.entries(identityPatterns)) {
    if (new RegExp(pattern).test(topicLower)) {
      results.identityTag = desc;
      results.hitCount++;
      break;
    }
  }
  if (!results.identityTag && audience) {
    results.identityTag = `目标受众：${audience}（可更具体化身份标签）`;
  } else if (!results.identityTag) {
    results.identityTag = '可增强身份标签（建议：精准画像如"X0后XX岗位人群"）';
  }

  // 行动触发检测
  if (/教程|步骤|清单|模板|公式|保姆级|手把手|包教包会/i.test(topicLower)) {
    results.actionTrigger = '强行动触发——用户可立刻复制使用';
    results.hitCount++;
  } else if (/避坑|千万别|慎重|注意|建议|经验/i.test(topicLower)) {
    results.actionTrigger = '中等行动触发——避坑指南属性';
    results.hitCount++;
  } else {
    results.actionTrigger = '可增强行动触发（建议：加入"存好这份清单""看完直接抄作业"）';
  }

  return results;
}

// ─── 8维爆款评分 ────────────────────────────────

export function scoreViralPotential(
  topic: string,
  geneAnalysis: ReturnType<typeof analyzeViralGenes>,
  platform: string
): ViralScore {
  const platformConfig = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS['douyin'];

  // 情绪钩子
  let emotion = 3;
  if (geneAnalysis.emotionDesc.includes('愤怒')) emotion = 5;
  else if (geneAnalysis.emotionDesc.includes('治愈')) emotion = 4;
  else if (geneAnalysis.emotionDesc.includes('惊讶')) emotion = 4;
  else if (geneAnalysis.emotionDesc.includes('爽感')) emotion = 3;

  // 传播潜力（带平台权重）
  let spread = 3;
  spread += (geneAnalysis.hitCount >= 3 ? 2 : geneAnalysis.hitCount >= 2 ? 1 : 0);

  // 独家性
  let uniqueness = 3;
  if (geneAnalysis.infoGap.includes('强信息差')) uniqueness = 5;
  else if (geneAnalysis.infoGap.includes('中等')) uniqueness = 4;

  // 身份标签
  let identity = 3;
  if (!geneAnalysis.identityTag.includes('可增强')) identity = 5;

  // 时效性
  const timeliness = 4; // 默认假设内容有足够时效性

  // 传播锚点
  let anchor = 3;
  if (platform === 'xiaohongshu') anchor = 4; // 小红书天然适合截图传播

  // 可视化
  let visual = 3;
  if (platform === 'douyin' || platform === 'kuaishou') visual = 5; // 短视频天然可视化
  if (platform === 'xiaohongshu') visual = 4;

  // 参与门槛
  let barrier = 4;
  barrier -= (topic.length > 30 ? 1 : 0); // 主题越简洁，门槛越低

  const total = emotion + spread + uniqueness + identity + timeliness + anchor + visual + barrier;

  return {
    emotion: Math.min(5, emotion),
    spread: Math.min(5, spread),
    uniqueness: Math.min(5, uniqueness),
    identity: Math.min(5, identity),
    timeliness: Math.min(5, timeliness),
    anchor: Math.min(5, anchor),
    visual: Math.min(5, visual),
    barrier: Math.min(5, barrier),
    total: Math.min(40, total),
  };
}

// ─── 平台趋势数据（定期更新） ────────────────────────────────

export function getPlatformTrends(): Record<string, PlatformTrend> {
  return {
    douyin: {
      platform: '抖音',
      trendingTopics: ['AI工具推荐', '副业赚钱', '生活技巧', '情感共鸣', '职场吐槽'],
      viralFormats: ['3秒反转', '对比测试', '干货合集', 'vlog+旁白'],
      bestPostTimes: '工作日7:00-9:00, 12:00-14:00, 18:00-22:00；周末10:00-12:00',
      engagementTips: ['前三秒靠画面不靠文字', '评论区引导互动', '善用热门BGM', '结尾留悬念'],
    },
    kuaishou: {
      platform: '快手',
      trendingTopics: ['三农生活', '手艺人', '美食探店', '草根逆袭', '实用技能'],
      viralFormats: ['真实记录', '挑战+才艺', '情感故事', '家乡美食'],
      bestPostTimes: '工作日6:00-8:00, 11:00-13:00, 19:00-21:00',
      engagementTips: ['真实感最重要', '老铁文化互动', '同城标签引流', '定期直播拉近距离'],
    },
    xiaohongshu: {
      platform: '小红书',
      trendingTopics: ['OOTD穿搭', '护肤干货', '学习效率', '居家好物', '探店种草'],
      viralFormats: ['图文清单', '教程拆解', '好物合集', '经验干货'],
      bestPostTimes: '工作日8:00-9:00, 12:00-13:00, 20:00-22:00',
      engagementTips: ['封面就是一半流量', '标题必须吸引点击', '正文开头有钩子', '标签精准5-8个'],
    },
    bilibili: {
      platform: 'B站',
      trendingTopics: ['科技测评', '知识科普', '编程教程', '历史文化', '二次元'],
      viralFormats: ['深度解析', '趣味科普', '实验实拍', '梗文化二创'],
      bestPostTimes: '工作日12:00-14:00, 18:00-20:00；周末10:00-12:00, 18:00-22:00',
      engagementTips: ['标题有梗有深度', '弹幕互动引导', '分集/系列化', 'BGM选曲讲究'],
    },
    weibo: {
      platform: '微博',
      trendingTopics: ['社会热点', '娱乐八卦', '数码新品', '情感话题', '职场热议'],
      viralFormats: ['话题引爆', '数据对比', '投票互动', '观点输出'],
      bestPostTimes: '工作日8:00-10:00, 12:00-13:00, 20:00-23:00',
      engagementTips: ['热点即时响应', '用#话题tag#', '图片胜千言', '互动引导转发'],
    },
  };
}

// ─── 核心内容生成服务 ────────────────────────────────

export class ContentCreativityService {

  /**
   * 生成平台优化的创意内容蓝图
   */
  async generateContent(
    userId: string,
    options: CreativityOptions
  ): Promise<ContentBlueprint & { _source: 'ai' | 'fallback' }> {
    const { topic, platform, contentType, creativity, targetAudience, productName, keywords } = options;
    const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS['douyin'];

    // 基因分析
    const geneAnalysis = analyzeViralGenes(topic, targetAudience);
    const viralScore = scoreViralPotential(topic, geneAnalysis, platform);

    // 尝试 AI 生成
    try {
      return await this.aiGenerate(userId, options, config, geneAnalysis, viralScore);
    } catch (error: any) {
      console.log(`[ContentCreativity] AI生成失败，启用智能降级: ${error.message}`);
      return this.fallbackGenerate(options, config, geneAnalysis, viralScore);
    }
  }

  private async aiGenerate(
    userId: string,
    options: CreativityOptions,
    config: typeof PLATFORM_CONFIGS['douyin'],
    geneAnalysis: ReturnType<typeof analyzeViralGenes>,
    viralScore: ViralScore
  ): Promise<ContentBlueprint & { _source: 'ai' | 'fallback' }> {
    const { topic, platform, contentType, creativity, targetAudience, productName, keywords } = options;

    const systemPrompt = `你是${config.contentTone}平台的内容创作专家，也是爆款选题策划大师。
你的任务：根据用户提供的主题，生成一份完整的、能在${platform}上引爆传播的内容蓝图。

核心方法论（必须遵循）：
1. 爆款四基因：情绪钩子、信息差、身份标签、行动触发——内容必须命中至少2条
2. 12条策划心法：用户思维、热点热度、传播锚点、互动可视化、叙事张力、化繁为简
3. 8维评分：情绪×传播×独家×身份×时效×锚点×可视化×门槛

平台规则（${platform}）：
- 标题字数 ≤ ${config.maxTitleLength}字，正文 ≤ ${config.maxBodyLength}字
- 内容基调：${config.contentTone}
- 最佳格式：${config.bestFormats.join('、')}
- 禁止词：${config.tabooWords.join('、')}
- 钩子要求：${config.hookRequirements}
- CTA风格：${config.ctaStyle}
- 标签策略：${config.hashtagStrategy}

分析结果：
- 基因分析：情绪=${geneAnalysis.emotionDesc}，信息差=${geneAnalysis.infoGap}，身份=${geneAnalysis.identityTag}，行动=${geneAnalysis.actionTrigger}
- 命中基因数：${geneAnalysis.hitCount}/4
- 爆款评分：${viralScore.total}/40

请严格按照以下JSON格式返回（不要包含markdown代码块标记）：

{
  "titles": ["标题1（使用数字/疑问/情绪词）", "标题2（不同角度）", "标题3", "标题4", "标题5"],
  "bestTitle": "综合评分最高的标题",
  "outline": ["开篇钩子", "核心内容1", "核心内容2", "核心内容3", "结尾CTA"],
  "hook": "前3秒/前50字的钩子文案",
  "body": "完整正文内容，符合${config.contentTone}风格",
  "cta": "结尾行动号召文案",
  "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "platformTips": ["平台优化建议1", "平台优化建议2", "平台优化建议3"],
  "geneAnalysis": {
    "emotionDesc": "${geneAnalysis.emotionDesc}",
    "infoGap": "${geneAnalysis.infoGap}",
    "identityTag": "${geneAnalysis.identityTag}",
    "actionTrigger": "${geneAnalysis.actionTrigger}",
    "hitCount": ${geneAnalysis.hitCount}
  },
  "viralScore": {
    "emotion": ${viralScore.emotion},
    "spread": ${viralScore.spread},
    "uniqueness": ${viralScore.uniqueness},
    "identity": ${viralScore.identity},
    "timeliness": ${viralScore.timeliness},
    "anchor": ${viralScore.anchor},
    "visual": ${viralScore.visual},
    "barrier": ${viralScore.barrier},
    "total": ${viralScore.total}
  }
}

创意等级：${Math.round(creativity * 100)}%（越高越突破常规，越低越符合平台主流风格）
${targetAudience ? `目标受众：${targetAudience}` : ''}
${productName ? `产品/服务：${productName}` : ''}
${keywords?.length ? `关键词：${keywords.join('、')}` : ''}

请确保输出为合法的JSON格式，不包含任何额外文本。`;

    const userPrompt = `请为【${topic}】在${platform}平台上创作${contentType === 'video' ? '短视频' : contentType === 'article' ? '图文' : contentType === 'image_text' ? '图文笔记' : '内容'}内容。要求内容有足够的话题性和传播潜力。`;

    const response = await chatCompletion(userId, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7 + creativity * 0.3,
      max_tokens: 4096,
      platform,
      creativity,
    });

    // 解析AI响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    let data: Partial<ContentBlueprint>;
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[0]);
    } else {
      data = { body: response };
    }

    return {
      titles: data.titles || [],
      bestTitle: data.bestTitle || data.titles?.[0] || topic,
      outline: data.outline || [],
      hook: data.hook || '',
      body: data.body || response,
      cta: data.cta || '',
      hashtags: data.hashtags || [],
      viralScore: data.viralScore || viralScore,
      geneAnalysis: data.geneAnalysis || geneAnalysis,
      platformTips: data.platformTips || [],
      aiGenerated: true,
      _source: 'ai',
    };
  }

  private fallbackGenerate(
    options: CreativityOptions,
    config: typeof PLATFORM_CONFIGS['douyin'],
    geneAnalysis: ReturnType<typeof analyzeViralGenes>,
    viralScore: ViralScore
  ): ContentBlueprint & { _source: 'ai' | 'fallback' } {
    const { topic, platform, targetAudience, productName } = options;

    // 高质量模板降级
    const templates: Record<string, Partial<ContentBlueprint>> = {
      douyin: {
        titles: [
          `🔥 揭秘${topic}：90%的人都不知道的这个秘密`,
          `只用了一招，${topic}效果翻10倍`,
          `别再错误地做${topic}了！看完这个少走3年弯路`,
          `${topic}保姆级教程，看完直接抄作业`,
          `为什么你做${topic}总是失败？这3个坑90%的人都在踩`,
        ],
        hook: `你有没有遇到过这种情况：辛辛苦苦做${topic}，却始终看不到效果？今天这条视频，可能会颠覆你的认知。`,
        cta: `如果你觉得有用，双击屏幕支持一下，评论区告诉我你在${topic}方面最大的困惑是什么？`,
      },
      xiaohongshu: {
        titles: [
          `✨ 关于${topic}，我后悔没有早点知道`,
          `做了3年才知道，${topic}原来这么简单`,
          `存好这份${topic}清单，不吃亏✨`,
          `被问爆了的${topic}秘诀，全在这了`,
          `${topic}到底怎么做？一篇讲清楚`,
        ],
        hook: `做了这么久${topic}，今天才恍然大悟...姐妹们一定要收藏这篇！`,
        cta: `还有什么想问的？评论区告诉我，下期继续分享！记得收藏备用哦✨`,
      },
      bilibili: {
        titles: [
          `【硬核】${topic}深度解析，这次真讲透了`,
          `关于${topic}，这篇文章全网没人敢写`,
          `零基础学会${topic}，从入门到精通全攻略`,
          `我花了100小时研究${topic}，得出这个结论`,
          `【揭秘】${topic}背后的底层逻辑，信息量巨大`,
        ],
        hook: `今天这个话题，我敢说全网讲清楚的人不超过一只手。花15分钟，带你彻底搞懂${topic}的底层逻辑。`,
        cta: `如果觉得有用，记得一键三连支持一下。弹幕区告诉我你对${topic}的看法，下期见！`,
      },
      weibo: {
        titles: [
          `#${topic}# 说一个做${topic}的真相...`,
          `关于${topic}，我想说几句实在话`,
          `#${topic}# 这组数据可能会让你重新认识${topic}`,
        ],
        hook: `说一个做${topic}的真相：大部分人的方法是错的。#${topic}#`,
        cta: `你做过${topic}吗？遇到过什么坑？评论区聊聊👇`,
      },
    };

    const tpl = templates[platform] || templates['douyin'];

    return {
      titles: (tpl.titles || []).map(t => t.replace('${topic}', topic)),
      bestTitle: tpl.titles?.[0]?.replace('${topic}', topic) || topic,
      outline: [
        `开篇钩子：引起共鸣/好奇心`,
        `核心内容：${topic}的关键要点`,
        `深入分析：为什么这样做/不这样做的后果`,
        `解决方案：可执行的具体步骤`,
        `结尾CTA：引导互动+关注`,
      ],
      hook: (tpl.hook || '').replace('${topic}', topic),
      body: [
        `${(tpl.hook || '').replace('${topic}', topic)}`,
        ``,
        `${config.contentTone}`,
        ``,
        `关于${topic}，关键要点包括：`,
        `1. 搞清楚${topic}的核心原理比盲目操作重要100倍`,
        `2. 选择适合自己的方法，而不是盲目跟风`,
        `3. 坚持执行+持续优化，才能看到真正的效果`,
        ``,
        productName ? `${productName}可以帮你解决以上所有问题，让你轻松搞定${topic}。` : '',
        ``,
        `你还有什么关于${topic}的问题？欢迎在评论区交流！`,
      ].filter(Boolean).join('\n'),
      cta: (tpl.cta || '').replace('${topic}', topic),
      hashtags: [
        topic,
        config.contentTone.split('，')[0],
        platform === 'xiaohongshu' ? '干货分享' : '热门',
        platform === 'douyin' ? '上热门' : '涨知识',
        platform === 'bilibili' ? '知识分享官' : '创作灵感',
      ],
      viralScore,
      geneAnalysis,
      platformTips: [
        `发布时优先选择${config.bestPostTimes.split('；')[0]}时段`,
        `前${config.maxTitleLength}字的标题文案测试3-5个版本`,
        `互动引导要具体明确（不是"支持一下"而是"评论区告诉我XXX"）`,
        `${config.hashtagStrategy}`,
      ],
      aiGenerated: false,
      _source: 'fallback',
    };
  }

  /**
   * 生成爆款标题（独立功能）
   */
  async generateTitles(
    userId: string,
    topic: string,
    platform: string,
    count: number = 5
  ): Promise<{ titles: string[]; bestTitle: string; analysis: string; aiGenerated: boolean }> {
    const config = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS['douyin'];

    try {
      const systemPrompt = `你是${platform}平台的爆款标题专家。
根据主题生成${count}个高传播潜力的标题，使用以下公式混合：
- 数字列举型："${topic}的5个秘密，第3个颠覆认知"
- 悬念反转型："做了10年${topic}才发现，原来一直做错了"
- 身份共鸣型："每个做过${topic}的人都懂这种感觉"
- 信息差型："90%的人不知道的${topic}真相"
- 结果导向型："学会这招，${topic}效率提升300%"

平台限制：标题≤${config.maxTitleLength}字，禁止词：${config.tabooWords.join('、')}

返回JSON：{"titles": [...], "bestTitle": "...", "analysis": "为什么选这个标题"}。不要包含markdown代码块。`;

      const response = await chatCompletion(userId, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请为【${topic}】生成${count}个${platform}平台的爆款标题` },
        ],
        temperature: 0.9,
        max_tokens: 2048,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return { ...data, aiGenerated: true };
      }
      throw new Error('AI响应格式异常');
    } catch (error: any) {
      console.log(`[ContentCreativity] 标题生成失败，降级: ${error.message}`);
      // 模板降级
      const titleFormulas = [
        `🔥 ${topic}保姆级教程，看完直接抄作业`,
        `揭秘${topic}：做了3年才敢说的真相`,
        `为什么你的${topic}总是不行？问题出在这里`,
        `存好这份${topic}清单，绝对用得上`,
        `关于${topic}，这篇可能是全网最全的`,
      ];
      return {
        titles: titleFormulas.slice(0, count),
        bestTitle: titleFormulas[0],
        analysis: '基于模板生成，连接AI后可获得更精准的个性化标题。',
        aiGenerated: false,
      };
    }
  }
}

// 导出单例
export const contentCreativityService = new ContentCreativityService();
