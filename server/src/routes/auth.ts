import { Router, Request, Response } from 'express';
import { authMiddleware, generateToken, hashPassword, verifyPassword } from '../middleware/auth';
import { generateCode, sendSms } from '../services/sms.service';
import { prisma } from '../utils/db';
import { z } from 'zod';
import { validate } from '../utils/validate';
import { sendCodeSchema, registerSchema, loginSchema, changePasswordSchema, phoneSchema, passwordSchema } from '../validators/schemas';
import { ok, badRequest, unauthorized, forbidden, notFound, internalError, tooManyRequests } from '../utils/api-response';

const router = Router();
// ============================================
// 登录限速：简单内存计数器，生产环境应用Redis
// ============================================
const loginAttempts = new Map<string, { count: number; resetAt: Date }>();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15分钟

function checkLoginRateLimit(identifier: string): boolean {
  const now = new Date();
  const entry = loginAttempts.get(identifier);
  
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: new Date(now.getTime() + LOGIN_WINDOW_MS) });
    return true;
  }
  
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

function clearLoginRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

// 发送验证码（含5分钟内只允许发送一次的限速）
const smsRateLimit = new Map<string, Date>();
router.post('/send-code', validate({ body: sendCodeSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { phone, type = 'register' } = req.body;

    // 检查发送频率（60秒内只能发送一次）
    const recentCode = await prisma.smsLog.findFirst({
      where: {
        phone,
        type,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode) {
      return badRequest(res, '发送太频繁，请稍后再试');
    }

    // 获取短信配置
    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
      orderBy: { isDefault: 'desc' },
    });

    if (!smsConfig) {
      // 如果没有配置短信，使用开发模式（仅返回验证码）
      const code = generateCode();
      console.log(`开发模式：验证码 ${code} 已发送到 ${phone}`);
      
      // 开发环境也记录到数据库
      await prisma.smsLog.create({
        data: {
          phone,
          type,
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          status: 'sent',
          ip: req.ip,
          provider: 'development',
        },
      });
      
      return ok(res, { message: '验证码已发送', code });
    }

    // 生成验证码
    const code = generateCode();

    // 发送短信
    const result = await sendSms({
      provider: smsConfig.provider as 'aliyun' | 'tencent',
      phone,
      code,
      signName: smsConfig.signName,
      templateCode: smsConfig.templateCode,
      accessKeyId: smsConfig.accessKeyId,
      accessKeySecret: smsConfig.accessKeySecret,
    });

    // 记录发送日志
    await prisma.smsLog.create({
      data: {
        phone,
        type,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        status: result.success ? 'sent' : 'failed',
        errorMsg: result.error || null,
        ip: req.ip,
        provider: smsConfig.provider,
      },
    });

    if (result.success) {
      if (process.env.NODE_ENV === 'development') {
        return ok(res, { message: '验证码已发送', code });
      }
      return ok(res, { message: '验证码已发送' });
    } else {
      return internalError(res, result.error || '发送失败');
    }
  } catch (error: any) {
    console.error('发送验证码失败:', error);
    internalError(res, error.message);
  }
});

// 注册
router.post('/register', validate({ body: registerSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { phone, password, code, name } = req.body;

    // 验证验证码：生产环境必须有短信配置并验证，开发环境无配置时可跳过
    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
    });

    let usedSmsLogId: string | null = null;

    if (smsConfig) {
      // 有短信配置时，必须验证验证码
      const smsLog = await prisma.smsLog.findFirst({
        where: {
          phone,
          type: 'register',
          code,
          expiresAt: { gt: new Date() },
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!smsLog) {
        return badRequest(res, '验证码错误或已过期');
      }

      usedSmsLogId = smsLog.id;
      
      // 标记验证码已使用
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { used: true, usedAt: new Date(), status: 'verified' },
      });
    } else if (process.env.NODE_ENV === 'development') {
      // 开发环境无短信配置时，签到code
      const smsLog = await prisma.smsLog.findFirst({
        where: {
          phone,
          type: 'register',
          code,
          expiresAt: { gt: new Date() },
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!smsLog) {
        return badRequest(res, '验证码错误或已过期');
      }

      usedSmsLogId = smsLog.id;
      
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { used: true, usedAt: new Date(), status: 'verified' },
      });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return badRequest(res, '该手机号已注册');
    }

    // 创建用户（id 和 updatedAt 需手动设置，因为 schema 未设置 @default）
    const userId = require('crypto').randomUUID();
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        id: userId,
        phone,
        password: hashPassword(password),
        name: name || `用户${phone.slice(-4)}`,
        role: 'customer',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });

    // 关联短信记录
    if (usedSmsLogId) {
      await prisma.smsLog.update({
        where: { id: usedSmsLogId },
        data: { userId: user.id },
      });
    }

    const token = generateToken(user.id, user.role);

    ok(res, {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      token,
      expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    internalError(res, error.message);
  }
});

// 发送重置密码验证码
router.post('/send-reset-code', validate({ body: sendCodeSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return badRequest(res, '该手机号未注册');
    }

    // 检查发送频率（60秒内只能发送一次）
    const recentCode = await prisma.smsLog.findFirst({
      where: {
        phone,
        type: 'reset_password',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode) {
      return badRequest(res, '发送太频繁，请稍后再试');
    }

    // 获取短信配置
    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
      orderBy: { isDefault: 'desc' },
    });

    if (!smsConfig) {
      // 开发模式
      const code = generateCode();
      console.log(`开发模式：重置密码验证码 ${code}`);
      
      await prisma.smsLog.create({
        data: {
          phone,
          type: 'reset_password',
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          status: 'sent',
          ip: req.ip,
          provider: 'development',
        },
      });
      
      return ok(res, { message: '验证码已发送', code });
    }

    // 生成验证码
    const code = generateCode();

    // 发送短信
    const result = await sendSms({
      provider: smsConfig.provider as 'aliyun' | 'tencent',
      phone,
      code,
      signName: smsConfig.signName,
      templateCode: smsConfig.templateCode,
      accessKeyId: smsConfig.accessKeyId,
      accessKeySecret: smsConfig.accessKeySecret,
    });

    // 记录发送日志
    await prisma.smsLog.create({
      data: {
        phone,
        type: 'reset_password',
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        status: result.success ? 'sent' : 'failed',
        errorMsg: result.error || null,
        ip: req.ip,
        provider: smsConfig.provider,
      },
    });

    if (result.success) {
      if (process.env.NODE_ENV === 'development') {
        return ok(res, { message: '验证码已发送', code });
      }
      return ok(res, { message: '验证码已发送' });
    } else {
      return internalError(res, result.error || '发送失败');
    }
  } catch (error: any) {
    console.error('发送重置密码验证码失败:', error);
    return internalError(res, error.message);
  }
});

// 重置密码
router.post('/reset-password', validate({ body: z.object({
  phone: phoneSchema,
  code: z.string().length(6, '验证码为6位数字'),
  newPassword: passwordSchema,
})}), async (req: Request, res: Response) => {
  try {
    const { phone, code, newPassword } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return badRequest(res, '该手机号未注册');
    }

    // 获取短信配置
    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
    });

    // 验证验证码
    const smsLog = await prisma.smsLog.findFirst({
      where: {
        phone,
        type: 'reset_password',
        code,
        expiresAt: { gt: new Date() },
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 如果没有配置短信或验证失败但有开发模式验证码
    if (!smsLog) {
      // 检查是否有有效的开发模式验证码
      const devSmsLog = await prisma.smsLog.findFirst({
        where: {
          phone,
          type: 'reset_password',
          code,
          expiresAt: { gt: new Date() },
          used: false,
          provider: 'development',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!devSmsLog) {
        return badRequest(res, '验证码错误或已过期');
      }

      // 标记验证码已使用
      await prisma.smsLog.update({
        where: { id: devSmsLog.id },
        data: { used: true, usedAt: new Date(), status: 'verified' },
      });

      return ok(res, { message: '密码重置成功' });
    }

    // 标记验证码已使用
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: { used: true, usedAt: new Date(), status: 'verified', userId: user.id },
    });

    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    });

    return ok(res, { message: '密码重置成功' });
  } catch (error: any) {
    console.error('重置密码失败:', error);
    return internalError(res, error.message);
  }
});

// 登录
router.post('/login', validate({ body: loginSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { phone, password, loginType } = req.body;

    // 登录速率限制
    const rateLimitKey = `login:${phone}:${req.ip}`;
    if (!checkLoginRateLimit(rateLimitKey)) {
      return tooManyRequests(res, '登录尝试次数过多，请15分钟后再试');
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { phone } });
    
    // 验证密码
    const isValidUser = user && verifyPassword(password, user.password);

    if (!isValidUser) {
      return unauthorized(res, '手机号或密码错误');
    }

    // 检查账号状态
    if (user!.status !== 'active') {
      return unauthorized(res, '账号已被禁用，请联系管理员');
    }

    // 入口权限控制
    const userRole = user!.role;
    
    if (userRole === 'customer' && loginType !== 'user') {
      return forbidden(res, '您的账号不支持从此入口登录');
    }

    // 登录成功，清除限速标记
    clearLoginRateLimit(`login:${phone}:${req.ip}`);

    const token = generateToken(user!.id, user!.role);

    // 根据登录入口决定跳转的 targetRole
    // 从哪个入口登录就跳转到对应的后台
    const targetRole = loginType || userRole;

    ok(res, {
      user: {
        id: user!.id,
        phone: user!.phone,
        name: user!.name,
        role: user!.role,
        targetRole: targetRole,
        avatar: user!.avatar,
      },
      token,
      expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    return internalError(res, error.message);
  }
});

// 获取用户信息
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    ok(res, user);
  } catch (error: any) {
    return internalError(res, error.message);
  }
});

// 更新用户信息
router.put('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    ok(res, user);
  } catch (error: any) {
    return internalError(res, error.message);
  }
});

// ... 后续路由 (change-password, update-profile 等)
router.put('/password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return notFound(res, '用户不存在');
    }

    if (!verifyPassword(oldPassword, user.password)) {
      return badRequest(res, '原密码错误');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(newPassword) },
    });

    ok(res, { message: '密码修改成功' });
  } catch (error: any) {
    return internalError(res, error.message);
  }
});

// 获取登录日志（从真实数据库查询）
router.get('/login-logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    const userRole = (req as any).userRole;

    // admin 可以看所有日志，其他角色只能看自己的
    if (userRole !== 'admin') {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      prisma.smsLog.findMany({
        where: { ...where, status: 'verified' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
      select: {
        id: true,
        phone: true,
        type: true,
        status: true,
        ip: true,
        provider: true,
        userId: true,
        createdAt: true,
      },
      }),
      prisma.smsLog.count({ where }),
    ]);

    ok(res, {
      logs: logs.map((l: any) => ({
        id: l.id,
        userId: l.userId,
        userName: l.phone,
        userType: l.type,
        action: l.type,
        ip: l.ip,
        status: l.status,
        createdAt: l.createdAt?.toISOString(),
      })),
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error: any) {
    return internalError(res, error.message);
  }
});

// POST /logout — 用户登出
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    // 记录登出日志
    (prisma as any).loginLog?.create({
      data: {
        id: `logout_${Date.now()}`,
        userId: userId,
        type: 'logout',
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        status: 'success',
      },
    }).catch(() => {}); // loginLog 表不存在则忽略
    return ok(res, { message: '登出成功' });
  } catch (error: any) {
    return internalError(res, error.message);
  }
});

export default router;
