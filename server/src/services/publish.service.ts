/**
 * 内容发布服务
 * 支持多平台内容发布
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface PublishContent {
  title: string;
  content?: string;
  mediaUrls?: string[];
  platform: string;
  accountId?: string;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  accountId: string;
  accountName?: string;
  postId?: string;
  postUrl?: string;
  error?: string;
  timestamp: Date;
}

export interface ContentTemplate {
  id: string;
  title: string;
  content: string;
  mediaUrls?: string[];
  tags?: string[];
}

/**
 * 获取用户的可用账号
 */
export async function getAvailableAccounts(userId: string, platforms: string[]) {
  return await prisma.socialAccount.findMany({
    where: {
      userId,
      platform: { in: platforms },
      status: 'active'
    }
  });
}

/**
 * 创建内容发布记录
 */
export async function createPublishRecord(
  userId: string,
  content: PublishContent,
  accountId: string,
  result: PublishResult
) {
  return await prisma.publishedContent.create({
    data: {
      userId,
      matrixAccountId: accountId,
      title: content.title,
      content: content.content,
      mediaUrls: content.mediaUrls ? JSON.stringify(content.mediaUrls) : null,
      platform: content.platform,
      status: result.success ? 'published' : 'failed',
      publishedAt: result.success ? new Date() : null
    }
  });
}

/**
 * 获取发布历史
 */
export async function getPublishHistory(
  userId: string,
  options: {
    platform?: string;
    accountId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = { userId };
  
  if (options.platform) {
    where.platform = options.platform;
  }
  
  if (options.accountId) {
    where.matrixAccountId = options.accountId;
  }
  
  if (options.status) {
    where.status = options.status;
  }
  
  const [records, total] = await Promise.all([
    prisma.publishedContent.findMany({
      where,
      include: {
        matrixAccount: true
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 20,
      skip: options.offset || 0
    }),
    prisma.publishedContent.count({ where })
  ]);
  
  return {
    records: records.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      platform: r.platform,
      accountName: r.matrixAccount?.accountName || r.accountName,
      status: r.status,
      views: r.views,
      likes: r.likes,
      comments: r.comments,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt
    })),
    total,
    hasMore: (options.offset || 0) + records.length < total
  };
}

/**
 * 更新发布内容的数据
 */
export async function updatePublishStats(
  publishId: string,
  stats: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  }
) {
  await prisma.publishedContent.update({
    where: { id: publishId },
    data: {
      views: stats.views,
      likes: stats.likes,
      comments: stats.comments,
      shares: stats.shares
    }
  });
}

/**
 * 获取内容模板
 */
export async function getContentTemplates(userId: string, type?: string) {
  const where: any = { userId };
  if (type) {
    where.type = type;
  }
  
  return await prisma.material.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * 创建内容草稿
 */
export async function createContentDraft(
  userId: string,
  data: {
    title: string;
    content: string;
    mediaUrls?: string[];
    platforms?: string[];
  }
) {
  return await prisma.material.create({
    data: {
      userId,
      type: 'draft',
      title: data.title,
      content: data.content,
      fileUrl: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null
    }
  });
}

/**
 * 获取统计数据
 */
export async function getPublishStats(userId: string) {
  const records = await prisma.publishedContent.findMany({
    where: { userId },
    select: {
      platform: true,
      status: true,
      views: true,
      likes: true,
      comments: true,
      shares: true
    }
  });
  
  const stats: Record<string, any> = {
    total: records.length,
    published: records.filter(r => r.status === 'published').length,
    failed: records.filter(r => r.status === 'failed').length,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    byPlatform: {} as Record<string, any>
  };
  
  for (const r of records) {
    stats.totalViews += r.views;
    stats.totalLikes += r.likes;
    stats.totalComments += r.comments;
    stats.totalShares += r.shares;
    
    if (!stats.byPlatform[r.platform]) {
      stats.byPlatform[r.platform] = {
        count: 0,
        views: 0,
        likes: 0,
        comments: 0
      };
    }
    
    stats.byPlatform[r.platform].count++;
    stats.byPlatform[r.platform].views += r.views;
    stats.byPlatform[r.platform].likes += r.likes;
    stats.byPlatform[r.platform].comments += r.comments;
  }
  
  return stats;
}

/**
 * 发布内容到多个平台
 */
export async function publishToPlatforms(
  userId: string,
  content: PublishContent,
  accountIds: string[]
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];
  
  for (const accountId of accountIds) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId }
    });
    
    if (!account || account.userId !== userId || account.status !== 'active') {
      results.push({
        success: false,
        platform: content.platform,
        accountId,
        error: '账号不可用',
        timestamp: new Date()
      });
      continue;
    }
    
    // 这里调用实际的发布逻辑
    // 实际项目中，应该根据不同平台调用不同的发布API
    const result = await simulatePublish(account, content);
    
    // 保存发布记录
    await createPublishRecord(userId, content, accountId, result);
    
    results.push(result);
  }
  
  return results;
}

/**
 * 模拟发布（实际项目中替换为真实的发布逻辑）
 */
async function simulatePublish(account: any, content: PublishContent): Promise<PublishResult> {
  try {
    // 模拟发布延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 根据平台模拟不同的结果
    const postId = uuidv4().substring(0, 8);
    
    return {
      success: true,
      platform: account.platform,
      accountId: account.id,
      accountName: account.accountName,
      postId,
      postUrl: getPostUrl(account.platform, postId),
      timestamp: new Date()
    };
  } catch (error: any) {
    return {
      success: false,
      platform: account.platform,
      accountId: account.id,
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * 生成帖子URL
 */
function getPostUrl(platform: string, postId: string): string {
  const urls: Record<string, string> = {
    douyin: `https://www.douyin.com/video/${postId}`,
    kuaishou: `https://www.kuaishou.com/video/${postId}`,
    xiaohongshu: `https://www.xiaohongshu.com/explore/${postId}`,
    weibo: `https://weibo.com/detail/${postId}`
  };
  
  return urls[platform] || `https://example.com/post/${postId}`;
}
