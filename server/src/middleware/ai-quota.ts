/**
 * AI 配额中间件
 * 限制用户每日 AI 请求次数，防止滥用
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../utils/db';

// 配额上限配置
const FREE_DAILY_QUOTA = 50;   // 免费用户每日配额
const PAID_DAILY_QUOTA = 500;  // 付费用户每日配额

/**
 * 获取用户今日 AI 调用次数
 */
async function getTodayUsageCount(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = await prisma.apiUsageLog.count({
    where: {
      userId,
      createdAt: { gte: todayStart },
      status: 'success',
    },
  });

  return count;
}

/**
 * 获取用户配额上限
 * 根据用户角色和订阅状态决定
 */
function getUserQuotaLimit(userRole: string, expireAt?: Date | null): number {
  // 管理员无限制
  if (userRole === 'admin') return Infinity;

  // 有有效订阅的用户
  if (expireAt && new Date(expireAt) > new Date()) {
    return PAID_DAILY_QUOTA;
  }

  return FREE_DAILY_QUOTA;
}

/**
 * AI 配额检查中间件
 * 应挂在 AI 路由前
 */
export const aiQuotaMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    // 管理员跳过配额检查
    if (req.userRole === 'admin') {
      return next();
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, expireAt: true },
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 检查今日用量
    const todayCount = await getTodayUsageCount(userId);
    const quotaLimit = getUserQuotaLimit(user.role, user.expireAt);

    if (todayCount >= quotaLimit) {
      return res.status(429).json({
        error: '今日 AI 使用次数已达上限',
        quota: quotaLimit,
        used: todayCount,
        remaining: 0,
        resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      });
    }

    // 在响应头中附加配额信息
    res.setHeader('X-AI-Quota-Limit', quotaLimit.toString());
    res.setHeader('X-AI-Quota-Used', todayCount.toString());
    res.setHeader('X-AI-Quota-Remaining', (quotaLimit - todayCount).toString());

    next();
  } catch (error) {
    // 配额检查失败不阻塞请求
    console.error('[AI Quota] 检查失败:', error);
    next();
  }
};

export default aiQuotaMiddleware;
