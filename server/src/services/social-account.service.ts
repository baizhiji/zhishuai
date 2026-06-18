/**
 * 社交账号服务
 * 处理矩阵账号的授权、绑定和管理
 */

import { PrismaClient, SocialAccount, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/db';


export interface AccountBindRequest {
  userId: string;
  agentId?: string;
  platform: string;
  cookies?: any[];
  accountInfo: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  extraInfo?: Record<string, any>;
  accessToken?: string;
  refreshToken?: string;
}

export interface AccountStatus {
  id: string;
  platform: string;
  platformName: string;
  accountId: string;
  accountName: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'expired' | 'error';
  lastSyncAt?: Date;
  tokenExpiry?: Date;
}

/**
 * 绑定社交账号
 */
export async function bindSocialAccount(data: AccountBindRequest): Promise<SocialAccount> {
  const { userId, agentId, platform, cookies, accountInfo, extraInfo, accessToken, refreshToken } = data;
  
  // 检查是否已存在该平台账号
  const existing = await prisma.socialAccount.findFirst({
    where: {
      userId,
      platform,
      accountId: accountInfo.id || undefined
    }
  });
  
  if (existing) {
    // 更新现有账号
    return await prisma.socialAccount.update({
      where: { id: existing.id },
      data: {
        cookies: cookies ? JSON.stringify(cookies) : existing.cookies,
        accountName: accountInfo.name || existing.accountName,
        avatar: accountInfo.avatar || existing.avatar,
        status: 'active',
        lastSyncAt: new Date(),
        accessToken: accessToken || existing.accessToken,
        refreshToken: refreshToken || existing.refreshToken,
        config: extraInfo as any || existing.config,
        syncError: null
      }
    });
  }
  
  // 创建新账号
  return await prisma.socialAccount.create({
    data: {
      userId,
      agentId,
      platform,
      accountId: accountInfo.id || uuidv4(),
      accountName: accountInfo.name || `账号_${Date.now()}`,
      avatar: accountInfo.avatar,
      cookies: cookies ? JSON.stringify(cookies) : null,
      status: 'active',
      lastSyncAt: new Date(),
      accessToken,
      refreshToken,
      tokenExpiry: refreshToken ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      config: extraInfo as any
    }
  });
}

/**
 * 获取用户的社交账号列表
 */
export async function getUserAccounts(userId: string, agentId?: string): Promise<AccountStatus[]> {
  const where: any = { userId };
  if (agentId) {
    where.agentId = agentId;
  }
  
  const accounts = await prisma.socialAccount.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  
  return accounts.map(acc => ({
    id: acc.id,
    platform: acc.platform,
    platformName: getPlatformName(acc.platform),
    accountId: acc.accountId || '',
    accountName: acc.accountName || '',
    avatar: acc.avatar || undefined,
    status: acc.status as 'active' | 'inactive' | 'expired' | 'error',
    lastSyncAt: acc.lastSyncAt || undefined,
    tokenExpiry: acc.tokenExpiry || undefined
  }));
}

/**
 * 获取单个账号详情
 */
export async function getAccountById(accountId: string): Promise<SocialAccount | null> {
  return await prisma.socialAccount.findUnique({
    where: { id: accountId }
  });
}

/**
 * 解绑社交账号
 */
export async function unbindAccount(accountId: string, userId: string): Promise<boolean> {
  try {
    await prisma.socialAccount.delete({
      where: {
        id: accountId,
        userId // 确保只能删除自己的账号
      }
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 更新账号状态
 */
export async function updateAccountStatus(
  accountId: string,
  status: 'active' | 'inactive' | 'expired' | 'error',
  errorMessage?: string
): Promise<void> {
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      status,
      syncError: errorMessage
    }
  });
}

/**
 * 更新账号信息（同步）
 */
export async function syncAccountInfo(
  accountId: string,
  accountInfo: {
    name?: string;
    avatar?: string;
  },
  extraInfo?: Record<string, any>
): Promise<void> {
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accountName: accountInfo.name,
      avatar: accountInfo.avatar,
      lastSyncAt: new Date(),
      config: extraInfo as any
    }
  });
}

/**
 * 刷新账号Cookie
 */
export async function refreshAccountCookies(
  accountId: string,
  cookies: any[]
): Promise<void> {
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      cookies: JSON.stringify(cookies),
      lastSyncAt: new Date(),
      status: 'active',
      syncError: null
    }
  });
}

/**
 * 检查账号是否过期
 */
export async function checkAccountExpiry(): Promise<string[]> {
  const expiredAccounts = await prisma.socialAccount.findMany({
    where: {
      status: 'active',
      tokenExpiry: {
        lt: new Date()
      }
    },
    select: { id: true }
  });
  
  // 标记为过期
  await prisma.socialAccount.updateMany({
    where: {
      id: { in: expiredAccounts.map(a => a.id) }
    },
    data: {
      status: 'expired'
    }
  });
  
  return expiredAccounts.map(a => a.id);
}

/**
 * 获取可用的账号（用于发布任务）
 */
export async function getAvailableAccounts(
  userId: string,
  platforms: string[]
): Promise<SocialAccount[]> {
  return await prisma.socialAccount.findMany({
    where: {
      userId,
      platform: { in: platforms },
      status: 'active'
    }
  });
}

/**
 * 获取平台显示名称
 */
function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    weibo: '微博',
    boss: 'BOSS直聘',
    lagou: '拉勾网',
    zhipin: '智联招聘',
    zhihu: '知乎',
    bilibili: 'B站'
  };
  return names[platform] || platform;
}

/**
 * 统计用户账号情况
 */
export async function getAccountStats(userId: string): Promise<{
  total: number;
  active: number;
  expired: number;
  byPlatform: Record<string, number>;
}> {
  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    select: { platform: true, status: true }
  });
  
  const byPlatform: Record<string, number> = {};
  let active = 0;
  let expired = 0;
  
  for (const acc of accounts) {
    byPlatform[acc.platform] = (byPlatform[acc.platform] || 0) + 1;
    if (acc.status === 'active') active++;
    else if (acc.status === 'expired') expired++;
  }
  
  return {
    total: accounts.length,
    active,
    expired,
    byPlatform
  };
}
