import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';


const router = Router();
router.use(authMiddleware);

// 权限配置
const PERMISSIONS = {
  staff: ['view_materials', 'create_content', 'manage_own_posts'],
  manager: ['view_materials', 'create_content', 'manage_own_posts', 'view_reports', 'manage_team'],
  admin: ['view_materials', 'create_content', 'manage_own_posts', 'view_reports', 'manage_team', 'manage_settings'],
};

// 获取员工列表
router.get('/employees', async (req, res) => {
  try {
    const { userId, page = '1', pageSize = '20', keyword, status } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
        { email: { contains: keyword as string } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatar: true,
          role: true,
          permissions: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({ data: employees, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建员工
router.post('/employees', async (req, res) => {
  try {
    const { userId, name, phone, password, email, role = 'staff' } = req.body;
    
    // 检查手机号是否已存在
    const existing = await prisma.employee.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password || '123456', 10);

    const employee = await prisma.employee.create({
      data: {
        userId,
        name,
        phone,
        password: hashedPassword,
        email,
        role,
        permissions: PERMISSIONS[role as keyof typeof PERMISSIONS] || PERMISSIONS.staff,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新员工
router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, permissions } = req.body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(role && { role, permissions: PERMISSIONS[role as keyof typeof PERMISSIONS] || PERMISSIONS.staff }),
        ...(status && { status }),
        ...(permissions && { permissions }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
      },
    });

    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 重置员工密码
router.put('/employees/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password = '123456' } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.employee.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: '密码已重置为: 123456' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除员工
router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 员工登录
router.post('/employees/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress;

    const employee = await prisma.employee.findUnique({ where: { phone } });
    if (!employee) {
      // 记录失败日志
      await prisma.employeeLoginLog.create({
        data: { employeeId: 'unknown', ip, status: 'failed', errorMsg: '员工不存在' },
      });
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    if (employee.status !== 'active') {
      return res.status(401).json({ error: '账号已被禁用' });
    }

    const validPassword = await bcrypt.compare(password, employee.password);
    if (!validPassword) {
      await prisma.employeeLoginLog.create({
        data: { employeeId: employee.id, ip, status: 'failed', errorMsg: '密码错误' },
      });
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 更新最后登录时间
    await prisma.employee.update({
      where: { id: employee.id },
      data: { lastLoginAt: new Date() },
    });

    // 记录成功日志
    await prisma.employeeLoginLog.create({
      data: { employeeId: employee.id, ip, status: 'success' },
    });

    // 返回员工信息（不含密码）
    const { password: _, ...employeeInfo } = employee;
    res.json({
      ...employeeInfo,
      mainUserId: employee.userId,
      token: `emp_${employee.id}_${Date.now()}`, // 简化token，实际应使用JWT
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取员工登录日志
router.get('/employees/:id/login-logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '20' } = req.query;

    const [logs, total] = await Promise.all([
      prisma.employeeLoginLog.findMany({
        where: { employeeId: id },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.employeeLoginLog.count({ where: { employeeId: id } }),
    ]);

    res.json({ data: logs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
