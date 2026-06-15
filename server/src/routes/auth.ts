import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, generateToken, hashPassword, verifyPassword } from '../middleware/auth';
import { generateCode, sendSms } from '../services/sms.service';

const router = Router();
const prisma = new PrismaClient();

// 发送验证码
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { phone, type = 'register' } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: '请输入手机号' });
    }

    // 手机号格式验证
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号' });
    }

    // 检查发送频率（60秒内只能发送一次）
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
      
      return res.json({ success: true, message: '验证码已发送', code });
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
      // 开发环境返回验证码方便测试
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

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, code, name } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 如果有验证码配置，验证验证码
    const smsConfig = await prisma.smsConfig.findFirst({
      where: { enabled: true },
    });

    let usedSmsLogId: string | null = null;

    if (smsConfig && code) {
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
      
      // 标记验证码已使用
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { used: true, usedAt: new Date(), status: 'verified' },
      });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashPassword(password),
        name: name || `用户${phone.slice(-4)}`,
        role: 'user',
        status: 'active',
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

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        token,
        expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
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

    // 检查用户是否存在
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: '该手机号未注册' });
    }

    // 手机号格式验证
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号' });
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
      return res.status(400).json({ error: '发送太频繁，请稍后再试' });
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
      
      return res.json({ success: true, message: '验证码已发送', code });
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
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { phone, code, newPassword } = req.body;
    
    if (!phone || !code || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: '该手机号未注册' });
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
        return res.status(400).json({ error: '验证码错误或已过期' });
      }

      // 更新密码
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(newPassword) },
      });

      // 标记验证码已使用
      await prisma.smsLog.update({
        where: { id: devSmsLog.id },
        data: { used: true, usedAt: new Date(), status: 'verified' },
      });

      return res.json({ success: true, message: '密码重置成功' });
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

    res.json({ success: true, message: '密码重置成功' });
  } catch (error: any) {
    console.error('重置密码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
<<<<<<< HEAD
    const { phone, password } = req.body;
=======
    const { phone, password, loginType } = req.body;
>>>>>>> 962968886be726cd434c792933b5515366d34518
    
    if (!phone || !password) {
      return res.status(400).json({ error: '请填写手机号和密码' });
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { phone } });
    
<<<<<<< HEAD
    // Mock登录 - 测试账号
    const mockUsers: Record<string, string> = {
      '13800138000': hashPassword('123456'),
      '13800138001': hashPassword('123456'),
    };

    const isMockUser = mockUsers[phone] && verifyPassword(password, mockUsers[phone]);
    const isValidUser = user && verifyPassword(password, user.password);

    if (!isMockUser && !isValidUser) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 如果是Mock用户但数据库没有，则创建
    let finalUser = user;
    if (isMockUser && !user) {
      finalUser = await prisma.user.create({
        data: {
          phone,
          password: hashPassword(password),
          name: phone === '13800138000' ? '测试用户' : '管理员',
          role: phone === '13800138001' ? 'admin' : 'user',
          status: 'active',
        },
      });
    }

    const token = generateToken(finalUser!.id, finalUser!.role);
=======
    // 验证密码
    const isValidUser = user && verifyPassword(password, user.password);

    if (!isValidUser) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 检查账号状态
    if (user!.status !== 'active') {
      return res.status(401).json({ error: '账号已被禁用，请联系管理员' });
    }

    // 入口权限控制
    const userRole = user!.role;
    
    // admin 角色可以从所有入口登录
    // agent 角色可以从所有入口登录（可以切换视角）
    // user 角色只能从 user 入口登录
    if (userRole === 'user' && loginType !== 'user') {
      return res.status(403).json({ error: '您的账号不支持从此入口登录' });
    }

    const token = generateToken(user!.id, user!.role);

    // 根据登录入口决定跳转的 targetRole
    // 从哪个入口登录就跳转到对应的后台
    const targetRole = loginType || userRole;
>>>>>>> 962968886be726cd434c792933b5515366d34518

    res.json({
      success: true,
      data: {
        user: {
<<<<<<< HEAD
          id: finalUser!.id,
          phone: finalUser!.phone,
          name: finalUser!.name,
          role: finalUser!.role,
          avatar: finalUser!.avatar,
=======
          id: user!.id,
          phone: user!.phone,
          name: user!.name,
          role: user!.role,
          targetRole: targetRole,
          avatar: user!.avatar,
>>>>>>> 962968886be726cd434c792933b5515366d34518
        },
        token,
        expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
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
router.put('/password', authMiddleware, async (req: Request, res: Response) => {
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

<<<<<<< HEAD
=======
// 获取登录日志
router.get('/login-logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;
    
    // 生成模拟数据
    const logs = [];
    const users = ['张三', '李四', '王五', '赵六', '孙七'];
    const actions = ['login', 'logout'];
    const devices = ['desktop', 'mobile', 'tablet'];
    const browsers = ['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120'];
    const osList = ['Windows 11', 'macOS 14', 'iOS 17', 'Android 14'];
    const locations = ['北京市', '上海市', '广州市', '深圳市', '杭州市'];
    
    for (let i = 0; i < 30; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      logs.push({
        id: `log-${i}-${Date.now()}`,
        userId: `user-${i % 5}`,
        userName: users[i % 5],
        userType: ['admin', 'agent', 'customer', 'employee'][i % 4],
        action: action,
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: osList[Math.floor(Math.random() * osList.length)],
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        status: 'success',
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      });
    }
    
    res.json({
      success: true,
      data: {
        logs: logs.slice(0, Number(pageSize)),
        total: logs.length,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

>>>>>>> 962968886be726cd434c792933b5515366d34518
export default router;
