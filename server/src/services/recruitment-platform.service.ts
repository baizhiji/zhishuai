/**
 * 招聘平台真实采集与沟通服务（智能招聘自动化核心）
 *
 * 职责：
 *   - searchTalent：使用已授权招聘平台账号，通过 Playwright 真实搜索候选人
 *   - sendChatMessage：向候选人真实发送私信/打招呼
 *
 * 数据来源：SocialAccount 表中 platform=bosszhipin|zhilian 的授权账号（cookies）
 */
import { prisma } from '../utils/db';
import playwrightService from './playwright.service';

export interface TalentCandidate {
  name: string;
  jobTitle: string;
  company: string;
  experience: string;
  education: string;
  location: string;
  sourceUrl: string;
  platformCandidateId?: string;
  meta?: string;
}

export interface TalentSearchOptions {
  keywords: string[];
  maxResults?: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  bosszhipin: 'BOSS直聘',
  zhilian: '智联招聘',
};

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] || platform;
}

function parseCookies(cookiesText: string | null): any[] {
  if (!cookiesText) return [];
  try {
    const parsed = JSON.parse(cookiesText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 查找用户在某招聘平台的授权账号
 */
export async function findPlatformAccount(userId: string, platform: string) {
  return prisma.socialAccount.findFirst({
    where: { userId, platform, status: 'active' },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * 真实搜索候选人（使用授权账号的 cookies 驱动 Playwright 访问人才搜索页）
 */
export async function searchTalent(
  userId: string,
  platform: string,
  options: TalentSearchOptions,
): Promise<TalentCandidate[]> {
  const account = await findPlatformAccount(userId, platform);
  if (!account) {
    throw new Error(`请先在「账号授权」中绑定 ${platformLabel(platform)} 账号，智能招聘才能真实搜索候选人`);
  }

  const result = await playwrightService.searchTalent(platform, {
    keywords: options.keywords,
    cookies: parseCookies(account.cookies),
    accountName: account.accountName || undefined,
    maxResults: options.maxResults || 20,
  });

  if (!result.success) {
    throw new Error(result.message);
  }

  return (result.items as TalentCandidate[]).map((item) => ({
    name: item.name || '未知候选人',
    jobTitle: item.jobTitle || '',
    company: item.company || '',
    experience: item.experience || '',
    education: item.education || '',
    location: item.location || '',
    sourceUrl: item.sourceUrl || '',
    platformCandidateId: item.platformCandidateId || '',
  }));
}

/**
 * 向候选人真实发送私信/打招呼
 * 返回 { sent, error? }，sent=false 时 error 为失败原因
 */
export async function sendChatMessage(
  userId: string,
  candidate: { platform: string; sourceUrl?: string },
  content: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!candidate.platform || !candidate.sourceUrl) {
    return { sent: false, error: '候选人缺少平台来源信息，无法真实发送（历史数据仅本地记录）' };
  }

  const account = await findPlatformAccount(userId, candidate.platform);
  if (!account) {
    return { sent: false, error: `未找到已授权的 ${platformLabel(candidate.platform)} 账号，无法发送私信` };
  }

  const result = await playwrightService.sendTalentMessage(candidate.platform, {
    targetUrl: candidate.sourceUrl,
    content,
    cookies: parseCookies(account.cookies),
    accountName: account.accountName || undefined,
  });

  if (!result.success) {
    return { sent: false, error: result.message };
  }
  return { sent: true };
}
