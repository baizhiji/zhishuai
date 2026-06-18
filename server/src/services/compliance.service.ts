/**
 * 内容合规过滤服务
 * 提供敏感词检测、违禁内容过滤、平台规则适配功能
 * 使用AI模型进行智能检测 + 本地关键词规则双重保障
 */
import { chatCompletion } from './ai-service';

// 本地敏感词库（基础层，快速过滤明显违规内容）
const LOCAL_BANNED_WORDS: string[] = [
  '杀人', '炸弹', '恐怖袭击', '枪支', '毒品',
  '色情', '裸体', '成人视频',
  '赌博', '赌场', '下注', '时时彩',
  '刷单', '套现', '黑卡',
  '处方药', '假药',
  '代孕', '买卖器官',
];

// 各平台特殊规则
const PLATFORM_RULES: Record<string, {
  name: string;
  bannedWords: string[];
  maxTitleLength: number;
  maxContentLength: number;
  bannedContentTypes: string[];
}> = {
  douyin: {
    name: '抖音',
    bannedWords: ['引流', '加微信', '加VX', '私信领取', '免费送'],
    maxTitleLength: 55,
    maxContentLength: 2200,
    bannedContentTypes: ['硬广', '低俗', '虚假宣传'],
  },
  kuaishou: {
    name: '快手',
    bannedWords: ['加微信', '私聊领取', '免费送'],
    maxTitleLength: 50,
    maxContentLength: 2000,
    bannedContentTypes: ['硬广', '低俗'],
  },
  xiaohongshu: {
    name: '小红书',
    bannedWords: ['加微信', '私信我', '微信号', 'VX', '代购', '价格私聊'],
    maxTitleLength: 20,
    maxContentLength: 1000,
    bannedContentTypes: ['硬广', '虚假种草', '代购'],
  },
  weibo: {
    name: '微博',
    bannedWords: [],
    maxTitleLength: 140,
    maxContentLength: 2000,
    bannedContentTypes: [],
  },
  bilibili: {
    name: 'B站',
    bannedWords: ['加群领取', '私信我拿'],
    maxTitleLength: 80,
    maxContentLength: 2500,
    bannedContentTypes: ['低俗', '引战'],
  },
};

export interface ComplianceResult {
  passed: boolean;
  score: number;
  issues: ComplianceIssue[];
  sanitizedContent?: string;
}

export interface ComplianceIssue {
  type: 'banned_word' | 'sensitive_content' | 'platform_rule' | 'length_exceeded' | 'ai_flagged';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  position?: { start: number; end: number };
  originalText?: string;
  suggestion?: string;
}

function localBannedWordCheck(content: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const lowerContent = content.toLowerCase();
  for (const word of LOCAL_BANNED_WORDS) {
    const index = lowerContent.indexOf(word);
    if (index !== -1) {
      issues.push({
        type: 'banned_word',
        severity: 'critical',
        message: `检测到违禁词: "${word}"`,
        position: { start: index, end: index + word.length },
        originalText: word,
        suggestion: '请删除或替换该内容',
      });
    }
  }
  return issues;
}

function platformRuleCheck(content: string, title: string, platform: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const rules = PLATFORM_RULES[platform];
  if (!rules) return issues;

  for (const word of rules.bannedWords) {
    const index = content.indexOf(word);
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

  if (title && title.length > rules.maxTitleLength) {
    issues.push({
      type: 'length_exceeded',
      severity: 'warning',
      message: `标题超过${rules.name}限制 (${title.length}/${rules.maxTitleLength})`,
      suggestion: `请缩短标题至${rules.maxTitleLength}字以内`,
    });
  }

  if (content.length > rules.maxContentLength) {
    issues.push({
      type: 'length_exceeded',
      severity: 'warning',
      message: `内容超过${rules.name}限制 (${content.length}/${rules.maxContentLength})`,
      suggestion: `请精简内容至${rules.maxContentLength}字以内`,
    });
  }

  return issues;
}

async function aiComplianceCheck(content: string): Promise<ComplianceIssue[]> {
  try {
    const result = await chatCompletion([{
      role: 'system',
      content: '你是一个专业的内容合规审核员。请审核用户内容是否合规，检查是否包含：违法信息、虚假宣传、歧视性内容、侵权内容、诱导点击等。只返回JSON格式结果。',
    }, {
      role: 'user',
      content: `请审核以下内容是否合规，返回JSON：{"passed":boolean,"issues":[{"type":"string","severity":"critical|warning|info","message":"string","suggestion":"string"}]}\n\n内容：${content.substring(0, 2000)}`,
    }], { userId: 'system' });

    const text = result || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.passed && Array.isArray(parsed.issues)) {
        return parsed.issues.map((issue: any) => ({
          type: 'ai_flagged' as const,
          severity: issue.severity || 'warning',
          message: issue.message || 'AI检测到潜在问题',
          suggestion: issue.suggestion,
        }));
      }
    }
    return [];
  } catch (error) {
    console.error('AI合规检测失败:', error);
    return [];
  }
}

/**
 * 自动替换敏感词
 */
function sanitizeContent(content: string, issues: ComplianceIssue[]): string {
  let sanitized = content;
  // 从后往前替换，避免位置偏移
  const sortedIssues = issues
    .filter(i => i.type === 'banned_word' && i.position)
    .sort((a, b) => (b.position?.start || 0) - (a.position?.start || 0));

  for (const issue of sortedIssues) {
    if (issue.position) {
      const { start, end } = issue.position;
      sanitized = sanitized.substring(0, start) + '*'.repeat(end - start) + sanitized.substring(end);
    }
  }

  return sanitized;
}

/**
 * 主入口：内容合规检测
 * @param content 待检测内容
 * @param platform 目标平台（可选）
 * @param title 标题（可选）
 * @param useAI 是否使用AI深度检测（默认true）
 */
export async function checkContentCompliance(
  content: string,
  platform?: string,
  title?: string,
  useAI: boolean = true,
): Promise<ComplianceResult> {
  const issues: ComplianceIssue[] = [];

  // 第一层：本地敏感词快速检测
  issues.push(...localBannedWordCheck(content));

  // 第二层：平台规则检测
  if (platform) {
    issues.push(...platformRuleCheck(content, title || '', platform));
  }

  // 第三层：AI智能检测（如果有明显问题则跳过AI检测节省成本）
  const hasCriticalIssues = issues.some(i => i.severity === 'critical');
  if (useAI && !hasCriticalIssues && content.length > 10) {
    const aiIssues = await aiComplianceCheck(content);
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
  const sanitizedContent = sanitizeContent(content, issues);

  return { passed, score, issues, sanitizedContent };
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
  const sanitizedContent = sanitizeContent(content, issues);

  return { passed, score, issues, sanitizedContent };
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
  }));
}
