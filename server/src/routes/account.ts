import { Router, Request, Response } from 'express';
import { authMiddleware, verifyPassword, hashPassword } from '../middleware/auth';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/db';
import { validate } from '../utils/validate';
import { changePasswordSchema, updateProfileSchema, paginationSchema } from '../validators/schemas';
import { ok, badRequest, internalError } from '../utils/api-response';

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

    ok(res, { ...user, stats });
  } catch (error: any) {
    internalError(res, error.message);
  }
});

// 更新用户信息
router.put('/', authMiddleware, validate({ body: updateProfileSchema }), async (req: Request, res: Response) => {
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
        status: true,
        createdAt: true,
      },
    });

    ok(res, user);
  } catch (error: any) {
    internalError(res, error.message);
  }
});

// 修改密码
router.put('/password', authMiddleware, validate({ body: changePasswordSchema }), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return badRequest(res, '用户不存在');
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
    internalError(res, error.message);
  }
});

// 获取使用统计
router.get('/usage-stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const stats = await getUserStats(userId);

    // 补充更多统计维度
    const [
      shareCodeCount,
      digitalHumanCount,
      voiceCloneCount,
      recruitmentCount,
      acquisitionTaskCount,
    ] = await Promise.all([
      prisma.shareQrCode.count({ where: { userId } }),
      prisma.digitalHuman.count({ where: { userId } }),
      prisma.voiceClone.count({ where: { userId } }),
      prisma.recruitmentPost.count({ where: { userId } }),
      prisma.acquisitionTask.count({ where: { userId } }),
    ]);

    ok(res, {
      ...stats,
      shareCodeCount,
      digitalHumanCount,
      voiceCloneCount,
      recruitmentCount,
      acquisitionTaskCount,
    });
  } catch (error: any) {
    internalError(res, error.message);
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

    ok(res, packages);
  } catch (error: any) {
    internalError(res, error.message);
  }
});

// 员工管理 - 获取列表
router.get('/staff', authMiddleware, validate({ query: paginationSchema }), async (req: Request, res: Response) => {
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

    ok(res, { list: staff, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    internalError(res, error.message);
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
        id: randomUUID(),
        phone,
        name,
        role: role || 'staff',
        password: hashPassword(Math.random().toString(36).slice(-8)),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 创建用户与代理商的关系
    await prisma.userAgentRelation.create({
      data: {
        id: randomUUID(),
        userId: staff.id,
        agentId: userId,
      },
    });

    ok(res, staff);
  } catch (error: any) {
    internalError(res, error.message);
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

    ok(res, { message: '员工已删除' });
  } catch (error: any) {
    internalError(res, error.message);
  }
});

// 更新员工
router.put('/staff/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const staffId = req.params.id;
    const { name, status, role } = req.body;

    // 校验所有权：当前用户必须是该员工的上级（通过 UserAgentRelation 关联）
    const relation = await prisma.userAgentRelation.findFirst({
      where: { userId: staffId, agentId: userId },
    });
    if (!relation) {
      return res.status(403).json({ success: false, message: '无权修改该员工信息' });
    }

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

    ok(res, staff);
  } catch (error: any) {
    internalError(res, error.message);
  }
});

// ============ 账号注销 ============

import { cleanupUserData } from '../services/data-cleanup.service';

router.post('/delete-account', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // 清理用户数据
    const cleanupResult = await cleanupUserData(userId);

    // 软删除用户账号
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'deleted',
        phone: '',
    
        name: '已注销用户',
      },
    });

    // 记录审计日志
    const { auditLog } = require('../services/audit-log.service');
    await auditLog({
      action: 'user.delete_account',
      userId,
      target: 'account',
      detail: `用户注销账号，清理了${cleanupResult.details.totalAffected}条记录`,
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'] as string,
    });

    ok(res, {
      message: '账号已注销',
      cleanup: cleanupResult.details,
    });
  } catch (error: any) {
    internalError(res, error.message);
  }
});

// ============ 辅助函数 ============

async function getUserStats(userId: string) {
  const [
    materialCount,
    referralCount,
  ] = await Promise.all([
    prisma.material.count({ where: { userId } }),
    prisma.shareRecord.count({ where: { scannerId: userId } }),
  ]);

  return {
    materialCount,
    referralCount,
  };
}

export default router;
