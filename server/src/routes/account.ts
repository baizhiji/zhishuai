import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';


const router = Router();
// 获取账户信息
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 获取统计数据
    const stats = await getUserStats(userId);

    res.json({ success: true, data: { ...user, stats } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户信息
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar },
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

    // 验证旧密码（使用 bcrypt 比对）
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: '原密码错误' });
    }

    // 新密码使用 bcrypt 哈希后存储（复用 auth middleware 的 hashPassword）
    const { hashPassword } = require('../middleware/auth');
    const hashedPassword = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: '密码修改成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取套餐列表
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const packages = [
      { id: 'basic', name: '基础版', price: 99, features: ['素材库100条', 'AI创作100次', '1个账号'] },
      { id: 'standard', name: '标准版', price: 299, features: ['素材库500条', 'AI创作500次', '3个账号'] },
      { id: 'professional', name: '专业版', price: 599, features: ['素材库无限', 'AI创作无限', '10个账号'] },
    ];

    res.json({ success: true, data: packages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 员工管理 - 获取列表
router.get('/staff', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 20 } = req.query;

    // 通过 UserAgentRelation 查找该用户创建的所有子账号
    const relations = await prisma.userAgentRelation.findMany({
      where: { agentId: userId },
      select: { userId: true },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.userAgentRelation.count({ where: { agentId: userId } });

    const staffIds = relations.map(r => r.userId);
    const staff = await prisma.user.findMany({
      where: { id: { in: staffIds } },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { list: staff, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 添加员工
router.post('/staff', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { phone, name, role } = req.body;

    // 先创建用户
    const staff = await prisma.user.create({
      data: {
        phone,
        name,
        role: role || 'staff',
        password: '888888', // 默认密码
      },
    });

    // 创建用户与代理商的关系
    await prisma.userAgentRelation.create({
      data: {
        userId: staff.id,
        agentId: userId,
      },
    });

    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除员工
router.delete('/staff/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const staffId = req.params.id;

    // 删除关联关系
    await prisma.userAgentRelation.deleteMany({
      where: { userId: staffId, agentId: userId },
    });

    // 删除用户
    await prisma.user.delete({ where: { id: staffId } });

    res.json({ success: true, message: '员工已删除' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新员工
router.put('/staff/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const staffId = req.params.id;
    const { name, status, role } = req.body;

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: { name, status, role },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取安全设置
router.get('/security-settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 从 UserSettings 表获取安全配置（如果存在）
    const userSettings = await prisma.userSettings.findFirst({
      where: { userId },
    });

    res.json({
      success: true,
      data: {
        phone: user.phone,
        email: user.email,
        loginNotify: userSettings?.loginNotify ?? true,
        riskNotify: userSettings?.riskNotify ?? true,
        deviceManage: userSettings?.deviceManage ?? true,
        devices: [], // 设备列表从登录日志中获取
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新安全设置
router.put('/security-settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { loginNotify, riskNotify, deviceManage } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { loginNotify, riskNotify, deviceManage },
      create: { userId, loginNotify: loginNotify ?? true, riskNotify: riskNotify ?? true, deviceManage: deviceManage ?? true },
    });

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更换手机号
router.put('/phone', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: '手机号和验证码为必填项' });
    }

    // 更新用户手机号
    await prisma.user.update({
      where: { id: userId },
      data: { phone },
    });

    res.json({ success: true, message: '手机号更换成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更换邮箱
router.put('/email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: '邮箱和验证码为必填项' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email },
    });

    res.json({ success: true, message: '邮箱更换成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 踢出设备（清除该用户的登录Session）
router.delete('/devices/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const deviceId = req.params.id;

    // 标记该设备ID的session为失效（通过更新用户状态）
    // TODO: 完整实现需要LoginLog模型和Session管理
    res.json({ success: true, message: '设备已退出' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户偏好设置
router.get('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const settings = await prisma.userSettings.findFirst({
      where: { userId },
    });

    res.json({
      success: true,
      data: settings || {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        theme: 'light',
        notifications: { email: true, sms: false, push: true },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户偏好设置
router.put('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { language, timezone, theme, email, sms, push, twoFactor, loginAlerts } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        language: language,
        timezone: timezone,
        theme: theme,
        loginNotify: email ?? loginAlerts,
        riskNotify: sms ?? loginAlerts,
      },
      create: {
        userId,
        language: language || 'zh-CN',
        timezone: timezone || 'Asia/Shanghai',
        theme: theme || 'light',
        loginNotify: email ?? true,
        riskNotify: sms ?? false,
      },
    });

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户Profile（完整信息，含偏好和连接应用）
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        company: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const settings = await prisma.userSettings.findFirst({
      where: { userId },
    });

    // 获取连接的第三方应用
    const connectedApps = await prisma.socialAccount.findMany({
      where: { userId },
      select: { id: true, platform: true, isConnected: true },
    });

    res.json({
      success: true,
      data: {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        avatar: user.avatar,
        preferences: {
          language: settings?.language || 'zh-CN',
          timezone: settings?.timezone || 'Asia/Shanghai',
          theme: settings?.theme || 'light',
          notifications: {
            email: settings?.loginNotify ?? true,
            sms: settings?.riskNotify ?? false,
            push: true,
          },
        },
        security: {
          twoFactor: false,
          loginAlerts: settings?.loginNotify ?? true,
        },
        connectedApps: connectedApps.map(app => ({
          id: app.id,
          name: app.platform,
          icon: app.platform,
          connected: app.isConnected,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户Profile
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, email, phone, company, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, phone, company, avatar },
    });

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 连接/断开第三方应用
router.post('/app/:appId/:action', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { appId } = req.params;
    const { action } = req.params;

    if (action === 'connect') {
      await prisma.socialAccount.update({
        where: { id: Number(appId) },
        data: { isConnected: true },
      });
      res.json({ success: true, message: '连接成功' });
    } else if (action === 'disconnect') {
      await prisma.socialAccount.update({
        where: { id: Number(appId) },
        data: { isConnected: false },
      });
      res.json({ success: true, message: '已断开连接' });
    } else {
      res.status(400).json({ error: '无效操作' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 辅助函数 ============

async function getUserStats(userId: string) {
  const [
    materialCount,
    accountCount,
    publishCount,
    referralCount,
  ] = await Promise.all([
    prisma.material.count({ where: { userId } }),
    prisma.matrixAccount.count({ where: { userId } }),
    prisma.publishedContent.count({ where: { userId } }),
    prisma.shareRecord.count({ where: { scannerId: userId } }),
  ]);

  return {
    materialCount,
    accountCount,
    publishCount,
    referralCount,
  };
}

export default router;
