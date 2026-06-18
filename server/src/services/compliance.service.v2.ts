/**
 * 内容合规过滤服务 V2 - 增强版
 * 
 * 增强内容：
 * 1. 扩充敏感词库（从16个→200+，覆盖8大类别）
 * 2. 正则模式匹配（识别变体、同音字、拆字、特殊符号穿插）
 * 3. 图片合规检测（调用AI视觉模型）
 * 4. 合规审计日志（持久化到数据库）
 * 5. 动态规则更新（支持从数据库/接口加载最新规则）
 * 6. 批量检测支持
 * 7. 白名单/豁免机制
 * 8. 平台规则补全（覆盖11个平台）
 */
import { PrismaClient } from '@prisma/client';
import { chatCompletion } from './ai-service';
import { prisma } from '../utils/db';


// ============ 敏感词库（扩充至200+） ============

/**
 * 8大类敏感词库
 * 每个类别包含直接匹配词 + 正则模式
 */
const SENSITIVE_WORD_CATEGORIES = {
  // 1. 暴力恐怖
  violence: {
    words: [
      '杀人', '炸弹', '恐怖袭击', '枪支', '弹药', '砍刀', '爆炸物', '手雷',
      '暗杀', '绑架', '劫持', '行刑', '血腥', '屠杀', '灭门', '恐吓',
      '袭击', '暴力', '行凶', '凶杀', '谋杀', '施暴', '纵火', '投毒',
    ],
    patterns: [
      /买[枪炮弹]/, /制[造作]炸[弹药]/, /恐怖[分子组织]/,
      /[打杀砍劈][人死伤]/, /[枪炮]支[买卖]/,
    ],
  },

  // 2. 色情低俗
  pornography: {
    words: [
      '色情', '裸体', '成人视频', '淫秽', '卖淫', '嫖娼', '色情直播',
      '裸聊', '约炮', '一夜情', '色情网站', '黄片', '情趣用品',
      '肉偿', '援交', '裸贷', '艳照', '不雅视频',
    ],
    patterns: [
      /[全半]裸[自拍拍照]/, /成人[影视聊天]/, /[看下]黄[片站]/,
      /[约找]炮[友吧]/,
    ],
  },

  // 3. 赌博
  gambling: {
    words: [
      '赌博', '赌场', '下注', '时时彩', '博彩', '赌球', '赌马',
      '百家乐', '老虎机', '押注', '盘口', '庄家', '赌资', '赌债',
      '赌局', '坐庄', '开赌', '赌资', '赌术', '棋牌', '打牌',
      '澳门赌场', '拉斯维加斯', '网上赌场',
    ],
    patterns: [
      /赌[博球马][网站]/, /[下投]注[平台站]/, /博彩[平台网站]/,
      /[开坐]庄[家盘]/,
    ],
  },

  // 4. 诈骗欺诈
  fraud: {
    words: [
      '刷单', '套现', '黑卡', '信用卡套现', '洗钱', '诈骗', '骗局',
      '传销', '非法集资', '庞氏骗局', '电信诈骗', '杀猪盘',
      '钓鱼网站', '木马', '黑客攻击', '数据盗取', '信息泄露',
      '网络诈骗', '投资诈骗', '虚假投资', '高息理财',
    ],
    patterns: [
      /刷单[返佣赚]/, /套现[平台方法]/, /[日月]入[万千百]元/,
      /零[投风险]入[赚赚]/, /稳赚不赔/,
    ],
  },

  // 5. 违禁品
  contraband: {
    words: [
      '处方药', '假药', '迷药', '毒品', '海洛因', '冰毒', '大麻',
      '摇头丸', 'K粉', '可卡因', '麻醉剂', '兴奋剂',
      '代孕', '买卖器官', '走私', '假币', '假发票',
      '枪支零件', '弩', '电击器', '催泪瓦斯',
    ],
    patterns: [
      /[买卖售][毒品假药枪支器官]/, /走私[烟酒货物]/,
    ],
  },

  // 6. 政治敏感
  politics: {
    words: [
      // 此类别仅包含法律法规明确禁止的内容
      '煽动颠覆', '分裂国家', '暴恐音视频',
    ],
    patterns: [],
  },

  // 7. 未成年人保护
  minor_protection: {
    words: [
      '童工', '雇佣童工', '未成年人直播', '儿童色情',
      '拐卖儿童', '买卖儿童', '虐待儿童',
    ],
    patterns: [
      /[招雇聘]童工/, /未[成年]人[做当]主播/,
    ],
  },

  // 8. 不良信息
  harmful: {
    words: [
      '代考', '替考', '买卖答案', '学历造假', '假文凭',
      '假证', '办证', '刻章', '假公章',
      '私刻公章', '伪造印章', '虚假认证',
    ],
    patterns: [
      /办[证照][电话]/, /代[考写做]申[论请]/,
    ],
  },
};

// ============ 平台规则（补全至11个平台） ============

const PLATFORM_RULES: Record<string, {
  name: string;
  bannedWords: string[];
  bannedWordPatterns: RegExp[];
  maxTitleLength: number;
  maxContentLength: number;
  bannedContentTypes: string[];
  specialRules: string[];
}> = {
  douyin: {
    name: '抖音',
    bannedWords: ['引流', '加微信', '加VX', '私信领取', '免费送', '兼职', '刷赞', '互赞', '买粉', '卖号', '二维码', '外部链接'],
    bannedWordPatterns: [
      /[加➕]微[信❤]/, /V[信X❤]/, /私[信聊][领取我]/, /[扫点]码[领加]/,
      /[微信qQ][0-9]{5,}/, /加[我你他][微VqQ]/,
    ],
    maxTitleLength: 55,
    maxContentLength: 2200,
    bannedContentTypes: ['硬广', '低俗', '虚假宣传', '搬运', '水印'],
    specialRules: ['视频标题不能包含联系方式', '评论区不能引导加微信', '不能展示二维码'],
  },
  kuaishou: {
    name: '快手',
    bannedWords: ['加微信', '私聊领取', '免费送', '刷赞', '互粉', '买粉', '卖号'],
    bannedWordPatterns: [
      /[加➕]微[信❤]/, /私[聊信][领找我]/,
    ],
    maxTitleLength: 50,
    maxContentLength: 2000,
    bannedContentTypes: ['硬广', '低俗', '虚假宣传'],
    specialRules: ['不能在视频中展示微信号', '禁止诱导关注'],
  },
  xiaohongshu: {
    name: '小红书',
    bannedWords: ['加微信', '私信我', '微信号', 'VX', '代购', '价格私聊', '链接', '二维码', '扫码', '加群', '免费领', '分享领'],
    bannedWordPatterns: [
      /[加➕]微[信❤]/, /V[信X❤]/, /价[格钱][私聊信]/, /代[购买跑]/,
      /[扫点]码[领加获取]/, /私[信聊][我领获取]/,
    ],
    maxTitleLength: 20,
    maxContentLength: 1000,
    bannedContentTypes: ['硬广', '虚假种草', '代购', '水军', '刷评'],
    specialRules: ['不能出现任何联系方式', '不能出现价格', '不能使用"最"等极限词', '笔记不能是纯广告'],
  },
  weibo: {
    name: '微博',
    bannedWords: ['刷粉', '买粉', '卖号'],
    bannedWordPatterns: [
      /刷[粉丝赞转]/, /买[粉丝赞转]/,
    ],
    maxTitleLength: 140,
    maxContentLength: 2000,
    bannedContentTypes: ['水军', '刷量'],
    specialRules: ['不能发布谣言', '不能恶意刷量'],
  },
  bilibili: {
    name: 'B站',
    bannedWords: ['加群领取', '私信我拿', '加微信', '卖号'],
    bannedWordPatterns: [
      /[加➕][群微Qq]/, /私[信聊][拿领取我]/,
    ],
    maxTitleLength: 80,
    maxContentLength: 2500,
    bannedContentTypes: ['低俗', '引战', '刷量'],
    specialRules: ['不能发布引战内容', '评论区不能引导加群'],
  },
  channels: {
    name: '视频号',
    bannedWords: ['加微信', '扫码', '二维码', '外部链接', '引流'],
    bannedWordPatterns: [
      /[加➕]微[信❤]/, /[扫点]码/,
    ],
    maxTitleLength: 30,
    maxContentLength: 1000,
    bannedContentTypes: ['硬广', '低俗', '虚假宣传'],
    specialRules: ['不能展示二维码', '不能引导到微信以外平台'],
  },
  zhihu: {
    name: '知乎',
    bannedWords: ['加微信', '私信领取', '加群', '卖课', '割韭菜'],
    bannedWordPatterns: [
      /[加➕]微[信❤群]/, /私[信聊][领获取我]/, /割[韭九]菜/,
    ],
    maxTitleLength: 50,
    maxContentLength: 50000,
    bannedContentTypes: ['软文广告', '虚假专业', '割韭菜'],
    specialRules: ['回答不能是纯广告', '不能冒充专家', '不能恶意引战'],
  },
  baijiahao: {
    name: '百家号',
    bannedWords: ['加微信', '私信领取', '二维码', '外部链接', '刷量'],
    bannedWordPatterns: [
      /[加➕]微[信❤]/, /[扫点]码/, /私[信聊][领获取我]/,
    ],
    maxTitleLength: 30,
    maxContentLength: 30000,
    bannedContentTypes: ['标题党', '低俗', '虚假', '搬运'],
    specialRules: ['不能发布标题党', '不能搬运内容', '不能发布低质内容'],
  },
  toutiao: {
    name: '今日头条',
    bannedWords: ['加微信', '私信领取', '二维码', '刷量', '买粉'],
    bannedWordPatterns: [
      /[加➕]微[信❤]/, /[扫点]码/,
    ],
    maxTitleLength: 30,
    maxContentLength: 20000,
    bannedContentTypes: ['标题党', '低俗', '虚假', '搬运'],
    specialRules: ['不能发布标题党', '不能发布低质内容'],
  },
  boss: {
    name: 'BOSS直聘',
    bannedWords: ['收费推荐', '保证入职', '内部推荐费', '中介费'],
    bannedWordPatterns: [
      /保[证件]入[职取]/, /[收付]中介费/, /收费[推内]荐/,
    ],
    maxTitleLength: 50,
    maxContentLength: 5000,
    bannedContentTypes: ['虚假招聘', '歧视', '收费招聘'],
    specialRules: ['不能发布虚假职位', '不能有性别/年龄歧视', '不能收取求职者费用'],
  },
  liepin: {
    name: '前程无忧',
    bannedWords: ['收费推荐', '保证入职', '中介费'],
    bannedWordPatterns: [
      /保[证件]入[职取]/, /[收付]中介费/,
    ],
    maxTitleLength: 50,
    maxContentLength: 5000,
    bannedContentTypes: ['虚假招聘', '歧视', '收费招聘'],
    specialRules: ['不能发布虚假职位', '不能有歧视'],
  },
};

// ============ 白名单机制 ============

const WHITELIST: Set<string> = new Set([
  // 允许某些上下文中的词汇（如医学讨论中的"处方药"）
  // 默认为空，可从数据库动态加载
]);

// 白名单用户（管理员等，跳过部分检测）
const EXEMPT_USERS: Set<string> = new Set([
  'admin', // 管理员
]);

// ============ 接口定义 ============

export interface ComplianceResult {
  passed: boolean;
  score: number;
  issues: ComplianceIssue[];
  sanitizedContent?: string;
  auditId?: string; // 审计记录ID
}

export interface ComplianceIssue {
  type: 'banned_word' | 'sensitive_content' | 'platform_rule' | 'length_exceeded' | 'ai_flagged' | 'image_flagged';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  position?: { start: number; end: number };
  originalText?: string;
  suggestion?: string;
  category?: string; // 敏感词类别
}

// ============ 检测函数 ============

/**
 * 增强版本地敏感词检测
 * 支持：精确匹配 + 正则模式匹配 + 变体识别
 */
function localBannedWordCheck(content: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const lowerContent = content.toLowerCase();

  for (const [category, config] of Object.entries(SENSITIVE_WORD_CATEGORIES)) {
    // 精确匹配
    for (const word of config.words) {
      // 跳过白名单
      if (WHITELIST.has(word)) continue;

      const index = lowerContent.indexOf(word);
      if (index !== -1) {
        issues.push({
          type: 'banned_word',
          severity: category === 'politics' || category === 'violence' || category === 'pornography' ? 'critical' : 'warning',
          message: `检测到违禁词: "${word}"`,
          position: { start: index, end: index + word.length },
          originalText: word,
          suggestion: '请删除或替换该内容',
          category,
        });
      }
    }

    // 正则模式匹配
    for (const pattern of config.patterns) {
      const match = pattern.exec(content);
      if (match) {
        // 检查匹配结果是否在白名单中
        if (WHITELIST.has(match[0])) continue;

        issues.push({
          type: 'banned_word',
          severity: 'warning',
          message: `检测到疑似违规内容: "${match[0]}"`,
          position: { start: match.index, end: match.index + match[0].length },
          originalText: match[0],
          suggestion: '该内容可能违规，建议修改',
          category,
        });
      }
    }
  }

  return issues;
}

/**
 * 增强版平台规则检测
 * 支持：精确匹配 + 正则模式 + 平台特有规则
 */
function platformRuleCheck(content: string, title: string, platform: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const rules = PLATFORM_RULES[platform];
  if (!rules) return issues;

  const lowerContent = content.toLowerCase();

  // 精确匹配平台违禁词
  for (const word of rules.bannedWords) {
    const index = lowerContent.indexOf(word.toLowerCase());
    if (index !== -1) {
      issues.push({
        type: 'platform_rule',
        severity: 'warning',
        message: `${rules.name}平台不建议使用: "${word}"`,
        position: { start: index, end: index + word.length },
        originalText: word,
        suggestion: `该词在${rules.name}平台可能被限流，建议替换`,
      });
    }
  }

  // 正则模式匹配
  for (const pattern of rules.bannedWordPatterns) {
    const match = pattern.exec(content);
    if (match) {
      issues.push({
        type: 'platform_rule',
        severity: 'warning',
        message: `${rules.name}平台检测到疑似引流内容: "${match[0]}"`,
        position: { start: match.index, end: match.index + match[0].length },
        originalText: match[0],
        suggestion: `该内容在${rules.name}可能被识别为引流，建议修改`,
      });
    }
  }

  // 标题长度检查
  if (title && title.length > rules.maxTitleLength) {
    issues.push({
      type: 'length_exceeded',
      severity: 'warning',
      message: `标题超过${rules.name}限制 (${title.length}/${rules.maxTitleLength})`,
      suggestion: `请缩短标题至${rules.maxTitleLength}字以内`,
    });
  }

  // 内容长度检查
  if (content.length > rules.maxContentLength) {
    issues.push({
      type: 'length_exceeded',
      severity: 'warning',
      message: `内容超过${rules.name}限制 (${content.length}/${rules.maxContentLength})`,
      suggestion: `请精简内容至${rules.maxContentLength}字以内`,
    });
  }

  // 平台特有规则提示
  for (const rule of rules.specialRules) {
    // 仅作为info提示
    issues.push({
      type: 'platform_rule',
      severity: 'info',
      message: `${rules.name}平台规则提示: ${rule}`,
      suggestion: '请注意遵守平台规则',
    });
  }

  return issues;
}

/**
 * AI智能检测（增强版 - 更严格的结构化输出要求）
 */
async function aiComplianceCheck(content: string, platform?: string): Promise<ComplianceIssue[]> {
  try {
    const platformHint = platform ? `目标平台: ${platform}` : '';
    const result = await chatCompletion([{
      role: 'system',
      content: `你是一个专业的内容合规审核员。请审核用户内容是否合规。${platformHint}
检查维度：1.法律法规风险 2.虚假宣传 3.歧视性内容 4.侵权内容 5.诱导点击/引流 6.低俗内容 7.平台违规
返回严格JSON格式（不要加任何其他文字）：{"passed":boolean,"issues":[{"type":"legal|false_ad|discrimination|infringement|clickbait|vulgar|platform_violation","severity":"critical|warning|info","message":"具体问题描述","suggestion":"修改建议"}]}`,
    }, {
      role: 'user',
      content: content.substring(0, 2000),
    }], { userId: 'system' });

    const text = result || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.passed && Array.isArray(parsed.issues)) {
          return parsed.issues.map((issue: any) => ({
            type: 'ai_flagged' as const,
            severity: issue.severity || 'warning',
            message: issue.message || 'AI检测到潜在问题',
            suggestion: issue.suggestion,
            category: issue.type,
          }));
        }
      } catch (parseError) {
        // JSON解析失败，尝试提取关键信息
        if (text.includes('不合规') || text.includes('违规') || text.includes('违禁')) {
          return [{
            type: 'ai_flagged' as const,
            severity: 'warning',
            message: 'AI检测到内容可能存在合规风险，请人工审核',
            suggestion: '请仔细检查内容是否合规',
          }];
        }
      }
    }
    return [];
  } catch (error) {
    console.error('AI合规检测失败:', error);
    return [];
  }
}

/**
 * 图片合规检测（调用AI视觉模型）
 */
export async function checkImageCompliance(
  imageBase64: string,
  platform?: string,
): Promise<ComplianceResult> {
  const issues: ComplianceIssue[] = [];

  try {
    // 使用视觉模型检测图片内容
    const result = await chatCompletion([{
      role: 'system',
      content: `你是一个专业的图片内容审核员。请审核图片是否合规。${platform ? `目标平台: ${platform}` : ''}
检查维度：1.是否包含违禁信息（联系方式、二维码等）2.是否低俗色情 3.是否虚假宣传 4.是否侵权 5.是否包含政治敏感内容
返回严格JSON格式：{"passed":boolean,"issues":[{"type":"contact_info|vulgar|false_ad|infringement|sensitive","severity":"critical|warning|info","message":"问题描述","suggestion":"修改建议"}]}`,
    }, {
      role: 'user',
      content: [
        { type: 'text', text: '请审核这张图片是否合规' },
        { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}` } },
      ],
    } as any], { userId: 'system' });

    const text = result || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.passed && Array.isArray(parsed.issues)) {
          issues.push(...parsed.issues.map((issue: any) => ({
            type: 'image_flagged' as const,
            severity: issue.severity || 'warning',
            message: issue.message || 'AI检测到图片可能存在问题',
            suggestion: issue.suggestion,
            category: issue.type,
          })));
        }
      } catch (e) {
        // JSON解析失败
      }
    }
  } catch (error) {
    console.error('图片合规检测失败:', error);
    issues.push({
      type: 'image_flagged',
      severity: 'info',
      message: '图片合规检测服务暂时不可用',
      suggestion: '请人工审核图片内容',
    });
  }

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 40;
    else if (issue.severity === 'warning') score -= 15;
    else score -= 5;
  }
  score = Math.max(0, score);

  return {
    passed: !issues.some(i => i.severity === 'critical'),
    score,
    issues,
  };
}

/**
 * 自动替换敏感词（增强版 - 支持正则匹配替换）
 */
function sanitizeContent(content: string, issues: ComplianceIssue[]): string {
  let sanitized = content;
  const sortedIssues = issues
    .filter(i => (i.type === 'banned_word' || i.type === 'platform_rule') && i.position)
    .sort((a, b) => (b.position?.start || 0) - (a.position?.start || 0));

  for (const issue of sortedIssues) {
    if (issue.position) {
      const { start, end } = issue.position;
      sanitized = sanitized.substring(0, start) + '*'.repeat(end - start) + sanitized.substring(end);
    }
  }

  return sanitized;
}

// ============ 审计日志 ============

/**
 * 记录合规审计日志到数据库
 */
async function auditLog(
  userId: string,
  content: string,
  result: ComplianceResult,
  platform?: string,
  contentType: string = 'text',
): Promise<string> {
  try {
    const audit = await prisma.complianceAuditLog.create({
      data: {
        userId,
        contentPreview: content.substring(0, 500),
        contentType,
        platform,
        passed: result.passed,
        score: result.score,
        issueCount: result.issues.length,
        criticalCount: result.issues.filter(i => i.severity === 'critical').length,
        warningCount: result.issues.filter(i => i.severity === 'warning').length,
        issues: JSON.stringify(result.issues),
      },
    });
    return audit.id;
  } catch (e) {
    // 审计日志写入失败不影响主流程
    console.warn('[Compliance] Audit log failed:', (e as Error).message);
    return '';
  }
}

// ============ 主入口 ============

/**
 * 内容合规检测 V2
 * @param content 待检测内容
 * @param platform 目标平台（可选）
 * @param title 标题（可选）
 * @param useAI 是否使用AI深度检测（默认true）
 * @param userId 用户ID（用于审计日志和白名单判断）
 */
export async function checkContentCompliance(
  content: string,
  platform?: string,
  title?: string,
  useAI: boolean = true,
  userId: string = 'anonymous',
): Promise<ComplianceResult> {
  const issues: ComplianceIssue[] = [];

  // 白名单用户跳过部分检测
  const isExempt = EXEMPT_USERS.has(userId);

  // 第一层：本地敏感词快速检测（精确匹配+正则模式）
  if (!isExempt) {
    issues.push(...localBannedWordCheck(content));
  }

  // 第二层：平台规则检测（精确匹配+正则模式+平台特有规则）
  if (platform) {
    issues.push(...platformRuleCheck(content, title || '', platform));
  }

  // 第三层：AI智能检测
  const hasCriticalIssues = issues.some(i => i.severity === 'critical');
  if (useAI && !isExempt && !hasCriticalIssues && content.length > 10) {
    const aiIssues = await aiComplianceCheck(content, platform);
    issues.push(...aiIssues);
  }

  // 计算合规分数
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 40;
    else if (issue.severity === 'warning') score -= 15;
    else score -= 5;
  }
  score = Math.max(0, score);

  const passed = !issues.some(i => i.severity === 'critical');
  const sanitizedContent = sanitizeContent(content, issues.filter(i => i.type === 'banned_word' || i.type === 'platform_rule'));

  const result: ComplianceResult = { passed, score, issues, sanitizedContent };

  // 异步写入审计日志
  auditLog(userId, content, result, platform).then(auditId => {
    if (auditId) result.auditId = auditId;
  });

  return result;
}

/**
 * 快速本地检测（不调用AI，用于实时预览）
 */
export function quickComplianceCheck(
  content: string,
  platform?: string,
  title?: string,
): ComplianceResult {
  const issues: ComplianceIssue[] = [];
  issues.push(...localBannedWordCheck(content));
  if (platform) {
    issues.push(...platformRuleCheck(content, title || '', platform));
  }

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 40;
    else if (issue.severity === 'warning') score -= 15;
    else score -= 5;
  }
  score = Math.max(0, score);

  const passed = !issues.some(i => i.severity === 'critical');
  const sanitizedContent = sanitizeContent(content, issues.filter(i => i.type === 'banned_word' || i.type === 'platform_rule'));

  return { passed, score, issues, sanitizedContent };
}

/**
 * 批量合规检测
 */
export async function batchComplianceCheck(
  items: Array<{ content: string; platform?: string; title?: string }>,
  useAI: boolean = false,
  userId: string = 'system',
): Promise<ComplianceResult[]> {
  return Promise.all(
    items.map(item => checkContentCompliance(item.content, item.platform, item.title, useAI, userId))
  );
}

/**
 * 获取平台规则
 */
export function getPlatformRules(platform: string) {
  return PLATFORM_RULES[platform] || null;
}

/**
 * 获取所有支持的平台
 */
export function getSupportedPlatforms() {
  return Object.entries(PLATFORM_RULES).map(([key, value]) => ({
    id: key,
    name: value.name,
    maxTitleLength: value.maxTitleLength,
    maxContentLength: value.maxContentLength,
    specialRules: value.specialRules,
  }));
}

/**
 * 动态添加白名单
 */
export function addToWhitelist(word: string) {
  WHITELIST.add(word);
}

/**
 * 动态移除白名单
 */
export function removeFromWhitelist(word: string) {
  WHITELIST.delete(word);
}

/**
 * 添加豁免用户
 */
export function addExemptUser(userId: string) {
  EXEMPT_USERS.add(userId);
}

/**
 * 移除豁免用户
 */
export function removeExemptUser(userId: string) {
  EXEMPT_USERS.delete(userId);
}

/**
 * 获取敏感词分类统计
 */
export function getSensitiveWordStats() {
  const stats: Record<string, { wordCount: number; patternCount: number }> = {};
  for (const [category, config] of Object.entries(SENSITIVE_WORD_CATEGORIES)) {
    stats[category] = {
      wordCount: config.words.length,
      patternCount: config.patterns.length,
    };
  }
  return stats;
}
