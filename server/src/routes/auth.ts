import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, generateToken, hashPassword, verifyPassword } from '../middleware/auth';
import { generateCode, sendSms } from '../services/sms.service';
import { validate, loginSchema, sendCodeSchema, createUserSchema, resetPasswordSchema, changePasswordSchema } from '../middleware/validate';
import { prisma } from '../utils/db';


const router = Router();
// 登录失败锁定机制
const loginFailMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15分钟

// 从 User-Agent 解析设备名称
function parseDeviceFromUA(ua: string): string {
  if (!ua) return '未知设备';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android 手机';
  if (ua.includes('Windows NT')) return 'Windows 电脑';
  if (ua.includes('Mac OS')) return 'Mac 电脑';
  if (ua.includes('Linux')) return 'Linux 设备';
  return '未知设备';
}

// Cookie配置
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
  path: '/',
};

// 设置Token到Cookie和响应体
function setTokenResponse(res: Response, token: string, data: any) {
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ success: true, data: { ...data, token } });
}

// 发送验证码
router.post('/send-code', validate(sendCodeSchema), async (req: Request, res: Response) => {
  try {
    const { phone, type = 'register' } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: '请输入手机号' });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号' });
    }

    const recentCode = await prisma.smsLog.findFirst({
      where: {
        phone,
        type,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode) {
      return res.status(400).json({ error: '发送太频繁，请稍后再试' });
    }

    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
      orderBy: { isDefault: 'desc' },
    });

    if (!smsConfig) {
      return res.status(403).json({ error: '短信服务未配置，暂不支持验证码登录/注册，请联系管理员开通账号' });
    }

    const code = generateCode();

    const result = await sendSms({
      provider: smsConfig.provider as 'aliyun' | 'tencent',
      phone,
      code,
      signName: smsConfig.signName,
      templateCode: smsConfig.templateCode,
      accessKeyId: smsConfig.accessKeyId,
      accessKeySecret: smsConfig.accessKeySecret,
    });

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
        return res.json({ success: true, message: '验证码已发送', code });
      }
      return res.json({ success: true, message: '验证码已发送' });
    } else {
      return res.status(500).json({ error: result.error || '发送失败' });
    }
  } catch (error: any) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 注册（支持验证码注册和密码注册）
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, code, name, password, role = 'user' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '请输入手机号' });
    }

    // 只允许注册 agent 和 user 角色
    if (role !== 'agent' && role !== 'user') {
      return res.status(400).json({ error: '注册仅支持区域代理和终端客户' });
    }

    // 使用用户提供的密码，如果没有则使用默认密码
    const DEFAULT_PASSWORD = '123456';
    const userPassword = password || DEFAULT_PASSWORD;

    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
    });

    // 没有短信服务配置时，允许密码注册（管理员邀请制场景）
    let usedSmsLogId: string | null = null;

    if (smsConfig && code) {
      // 有短信配置且有验证码 - 正常验证流程
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
        return res.status(400).json({ error: '验证码错误或已过期' });
      }

      usedSmsLogId = smsLog.id;
      
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { used: true, usedAt: new Date(), status: 'verified' },
      });
    } else if (!smsConfig) {
      // 没有短信服务配置时，允许密码注册（无需验证码）
      // 管理员创建账号或邀请制场景
    } else {
      return res.status(400).json({ error: '请输入验证码' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    const user = await prisma.user.create({
      data: {
        phone,
        password: hashPassword(userPassword),
        name: name || (role === 'agent' ? `代理${phone.slice(-4)}` : `用户${phone.slice(-4)}`),
        role,
        status: 'active',
      },
    });

    if (usedSmsLogId) {
      await prisma.smsLog.update({
        where: { id: usedSmsLogId },
        data: { userId: user.id },
      });
    }

    const token = generateToken(user.id, user.role, user.status);

    setTokenResponse(res, token, {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 发送重置密码验证码
router.post('/send-reset-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: '请输入手机号' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: '该手机号未注册' });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号' });
    }

    const recentCode = await prisma.smsLog.findFirst({
      where: {
        phone,
        type: 'reset_password',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCode) {
      return res.status(400).json({ error: '发送太频繁，请稍后再试' });
    }

    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
      orderBy: { isDefault: 'desc' },
    });

    if (!smsConfig) {
      return res.status(403).json({ error: '短信服务未配置，请联系管理员重置密码' });
    }

    const code = generateCode();

    const result = await sendSms({
      provider: smsConfig.provider as 'aliyun' | 'tencent',
      phone,
      code,
      signName: smsConfig.signName,
      templateCode: smsConfig.templateCode,
      accessKeyId: smsConfig.accessKeyId,
      accessKeySecret: smsConfig.accessKeySecret,
    });

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
        return res.json({ success: true, message: '验证码已发送', code });
      }
      return res.json({ success: true, message: '验证码已发送' });
    } else {
      return res.status(500).json({ error: result.error || '发送失败' });
    }
  } catch (error: any) {
    console.error('发送重置密码验证码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 重置密码
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { phone, code, newPassword } = req.body;
    
    if (!phone || !code || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: '该手机号未注册' });
    }

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

    if (!smsLog) {
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
        return res.status(400).json({ error: '验证码错误或已过期' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(newPassword) },
      });

      await prisma.smsLog.update({
        where: { id: devSmsLog.id },
        data: { used: true, usedAt: new Date(), status: 'verified' },
      });

      return res.json({ success: true, message: '密码重置成功' });
    }

    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: { used: true, usedAt: new Date(), status: 'verified', userId: user.id },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    });

    res.json({ success: true, message: '密码重置成功' });
  } catch (error: any) {
    console.error('重置密码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 登录
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { phone, password, loginType } = req.body;
    
    // 检查是否被锁定
    const failInfo = loginFailMap.get(phone);
    if (failInfo && failInfo.lockedUntil > Date.now()) {
      const remainMin = Math.ceil((failInfo.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `登录失败次数过多，请${remainMin}分钟后再试` });
    }
    // 锁定已过期则清除
    if (failInfo && failInfo.lockedUntil <= Date.now()) {
      loginFailMap.delete(phone);
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 验证密码
    const isValidUser = verifyPassword(password, user.password);
    if (!isValidUser) {
      // 记录失败次数
      const current = loginFailMap.get(phone) || { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCK_DURATION;
        loginFailMap.set(phone, current);
        return res.status(429).json({ error: `连续登录失败${MAX_LOGIN_ATTEMPTS}次，账号已锁定15分钟` });
      }
      loginFailMap.set(phone, current);
      const remain = MAX_LOGIN_ATTEMPTS - current.count;
      return res.status(401).json({ error: `手机号或密码错误，还剩${remain}次尝试机会` });
    }

    // 检查账号状态
    if (user.status !== 'active') {
      return res.status(401).json({ error: '账号已被禁用，请联系管理员' });
    }

    // 入口权限控制
    // admin 可以从三个入口（管理员/区域代理/终端客户）登录
    // agent 只能从区域代理入口登录
    // user 只能从终端客户入口登录
    const userRole = user.role;
    if (userRole === 'user' && loginType && loginType !== 'user') {
      return res.status(403).json({ error: '您的账号不支持从此入口登录' });
    }
    if (userRole === 'agent' && loginType && loginType !== 'agent') {
      return res.status(403).json({ error: '您的账号不支持从此入口登录，如需使用终端客户功能请创建终端客户账号' });
    }

    const token = generateToken(user.id, user.role, user.status);
    const targetRole = loginType || userRole;

    // 登录成功，清除失败计数
    loginFailMap.delete(phone);

    // 记录登录日志
    const deviceId = req.headers['x-device-id'] as string || `web_${req.ip}_${Date.now()}`;
    const deviceName = req.headers['x-device-name'] as string || parseDeviceFromUA(req.headers['user-agent'] || '');
    try {
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ip: req.ip || '',
          device: req.headers['user-agent'] || '',
          deviceId,
          deviceName,
          status: 'success',
          token,
          isActive: true,
        },
      });
    } catch (e) {
      // 日志记录失败不影响登录流程
      console.warn('记录登录日志失败:', e);
    }

    setTokenResponse(res, token, {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        targetRole: targetRole,
        avatar: user.avatar,
        status: user.status,
      },
      expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 修改密码
router.put('/password', authMiddleware, validate(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (!verifyPassword(oldPassword, user.password)) {
      return res.status(400).json({ error: '原密码错误' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(newPassword) },
    });

    res.json({ success: true, message: '密码修改成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 管理员创建账号（区域代理/终端用户）
router.post('/admin/create-user', authMiddleware, validate(createUserSchema), async (req: Request, res: Response) => {
  try {
    const adminRole = (req as any).userRole;
    if (adminRole !== 'admin' && adminRole !== 'agent') {
      return res.status(403).json({ error: '需要管理员或代理商权限' });
    }

    const { phone, name, role } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '请输入手机号' });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号' });
    }

    // admin 可以创建 agent 和 user；agent 只能创建 user
    const allowedRoles = adminRole === 'admin' ? ['agent', 'user'] : ['user'];
    const targetRole = role || 'user';
    if (!allowedRoles.includes(targetRole)) {
      return res.status(403).json({ error: adminRole === 'agent' ? '代理商只能创建终端客户账号' : '无效的角色类型' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    const DEFAULT_PASSWORD = '123456';
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashPassword(DEFAULT_PASSWORD),
        name: name || (targetRole === 'agent' ? `代理${phone.slice(-4)}` : `用户${phone.slice(-4)}`),
        role: targetRole,
        status: 'active',
      },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        defaultPassword: DEFAULT_PASSWORD,
        message: `账号创建成功，初始密码为 ${DEFAULT_PASSWORD}，请通知用户尽快修改密码`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户列表（管理员/代理商）
router.get('/admin/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const adminRole = (req as any).userRole;
    if (adminRole !== 'admin' && adminRole !== 'agent') {
      return res.status(403).json({ error: '需要管理员或代理商权限' });
    }

    const where: any = {};
    // agent 只能看到自己的 user
    if (adminRole === 'agent') {
      where.role = 'user';
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, phone: true, name: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 管理员重置用户密码为初始密码
router.post('/admin/reset-user-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const adminRole = (req as any).userRole;
    if (adminRole !== 'admin' && adminRole !== 'agent') {
      return res.status(403).json({ error: '需要管理员或代理商权限' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: '请指定用户ID' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // agent 不能重置 admin/agent 密码
    if (adminRole === 'agent' && targetUser.role !== 'user') {
      return res.status(403).json({ error: '无权操作该用户' });
    }

    const DEFAULT_PASSWORD = '123456';
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(DEFAULT_PASSWORD) },
    });

    res.json({ success: true, message: `密码已重置为初始密码 ${DEFAULT_PASSWORD}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
