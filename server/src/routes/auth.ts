import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, generateToken, hashPassword, verifyPassword } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 发送验证码（Mock实现）
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: '请输入手机号' });
    }

    // Mock: 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 实际应该发送短信，这里Mock存储
    console.log(`验证码 ${code} 已发送到 ${phone}`);
    
    res.json({ success: true, message: '验证码已发送', code }); // 开发环境返回验证码
  } catch (error: any) {
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

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: '请填写手机号和密码' });
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { phone } });
    
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

    res.json({
      success: true,
      data: {
        user: {
          id: finalUser!.id,
          phone: finalUser!.phone,
          name: finalUser!.name,
          role: finalUser!.role,
          avatar: finalUser!.avatar,
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

export default router;
