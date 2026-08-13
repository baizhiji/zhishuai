/**
 * 代理商客户管理 API
 * 
 * 代理商可以管理其名下的终端客户
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, agentMiddleware, hashPassword } from '../middleware/auth';
import { prisma } from '../utils/db';
import crypto from 'crypto';

const router = Router();
// 代理商路由需要认证 + 角色检查
router.use(authMiddleware);
router.use(agentMiddleware);

function genUUID(): string {
  return crypto.randomUUID();
}

// 核心修复：JWT 中 userId 是 User.id，但 UserAgentRelation.agentId 存的是 Agent.id
// 两者不同，必须先转换。管理员账号没有 Agent 记录，直接用 userId 即可。
async function resolveAgentId(userId: string): Promise<string> {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  return agent?.id || userId;
}

// 获取代理商统计数据（数据总览用）
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const period = (req.query.period as string) || 'all';

    // admin 用户可以访问所有代理数据，agent 用户只访问自己的
    const isAdmin = (req as any).userRole === 'admin';
    // UserAgentRelation.agentId 存的是 Agent.id，不是 User.id，必须转换
    const agentId = isAdmin ? userId : await resolveAgentId(userId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 计算 period 起始时间
    const getPeriodStart = (): Date | null => {
      switch (period) {
        case 'today': {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return d;
        }
        case 'week': {
          const dow = now.getDay() || 7;
          const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + 1);
          return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        }
        case 'month':
          return startOfMonth;
        default:
          return null;
      }
    };
    const periodStart = getPeriodStart();

    // 客户总数（通过 UserAgentRelation 查询）
    const agentCustomerWhere = isAdmin ? {} : { UserAgentRelation: { agentId } };
    const totalCustomers = await prisma.user.count({
      where: agentCustomerWhere,
    });

    // 正常客户
    const activeCustomers = await prisma.user.count({
      where: { ...agentCustomerWhere, status: 'active' },
    });

    // 冻结客户
    const disabledCustomers = await prisma.user.count({
      where: { ...agentCustomerWhere, status: 'frozen' },
    });

    // 本月新增
    const newCustomersThisMonth = await prisma.user.count({
      where: {
        ...agentCustomerWhere,
        createdAt: { gte: startOfMonth },
      },
    });

    // 待处理工单
    const pendingTickets = await prisma.ticket.count({
      where: {
        ...(isAdmin ? {} : {
          userId: { in: [userId, ...(await prisma.userAgentRelation.findMany({
            where: { agentId },
            select: { userId: true },
          })).map(r => r.userId)] },
        }),
        status: { in: ['open', 'in_progress'] },
      },
    });

    // 名下客户的素材总量
    const totalMaterials = isAdmin
      ? await prisma.material.count()
      : await prisma.material.count({
          where: { User: { UserAgentRelation: { agentId } } },
        });

    // period 筛选下的增量数据
    let periodNewCustomers = 0;
    let periodNewTickets = 0;
    if (periodStart) {
      periodNewCustomers = await prisma.user.count({
        where: { ...agentCustomerWhere, createdAt: { gte: periodStart } },
      });
      periodNewTickets = await prisma.ticket.count({
        where: {
          ...(isAdmin ? {} : { userId: { in: [userId] } }),
          createdAt: { gte: periodStart },
        },
      });
    }

    res.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        disabledCustomers,
        newCustomersThisMonth,
        pendingTickets,
        totalMaterials,
        periodNewCustomers,
        periodNewTickets,
      },
    });
  } catch (error: any) {
    console.error('获取代理商统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取客户列表
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const isAdmin = (req as any).userRole === 'admin';
    const { page = '1', pageSize = '20', keyword = '', status = '' } = req.query;

    // UserAgentRelation.agentId 存的是 Agent.id，不是 User.id，必须转换
    const agentId = isAdmin ? userId : await resolveAgentId(userId);

    // 构建查询条件 — 通过 UserAgentRelation 关联表查询
    const where: any = isAdmin ? {} : {
      UserAgentRelation: { agentId: agentId },
    };

    if (keyword) {
      where.OR = [
        { phone: { contains: keyword as string } },
        { name: { contains: keyword as string } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.user.count({ where }),
    ]);

    // 获取每个客户的统计数据
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const [materialCount] = await Promise.all([
          prisma.material.count({ where: { userId: customer.id } }),
        ]);

        return {
          ...customer,
          materialCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        list: customersWithStats,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: any) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取客户详情
router.get('/customers/:id([0-9a-fA-F-]{36})', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const isAdmin = (req as any).userRole === 'admin';
    const customerId = req.params.id;

    // 验证客户（admin 不需要校验归属关系）
    const customerWhere: any = { id: customerId };
    if (!isAdmin) {
      const agentId = await resolveAgentId(userId);
      customerWhere.UserAgentRelation = { agentId: agentId };
    }
    const customer = await prisma.user.findFirst({
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        UserFeatureSwitch: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    // 获取统计数据
    const [materialCount, referralCount] = await Promise.all([
      prisma.material.count({ where: { userId: customerId } }),
      Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data: {
        ...customer,
        materialCount,
      },
    });
  } catch (error: any) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建客户账号
router.post(
  '/customers',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号'),
    body('name').optional().isString(),
    body('password').optional().isLength({ min: 6 }).withMessage('密码至少6位'),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { phone, name, password } = req.body;

      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      // 获取真实的 Agent ID（通过 userId 查 Agent 表）
      const agent = await prisma.agent.findUnique({
        where: { userId },
      });
      if (!agent) {
        return res.status(403).json({ success: false, message: '代理记录不存在，请联系管理员' });
      }
      const agentId = agent.id;

      // 检查手机号是否已存在
      const existing = await prisma.user.findUnique({
        where: { phone },
      });

      if (existing) {
        return res.status(400).json({ success: false, message: '手机号已被注册' });
      }

      // 创建客户账号
      const customerId = genUUID();
      // 分两步创建：先建User，再建关联（避免MySQL遗留字段FK约束冲突）
      const customer = await prisma.user.create({
        data: {
          id: customerId,
          phone,
          name: name || phone,
          password: hashPassword(password || phone.slice(-6)),
          role: 'customer',
          status: 'active',
          updatedAt: new Date(),
        },
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

      // 建立客户-代理关联
      try {
        await prisma.userAgentRelation.create({
          data: {
            id: genUUID(),
            userId: customerId,
            agentId: agentId,
          },
        });
      } catch (relError: any) {
        await prisma.user.delete({ where: { id: customerId } }).catch(() => {});
        console.error('建立代理关联失败:', relError);
        return res.status(500).json({ success: false, message: '建立代理关联失败' });
      }

      // 初始化客户功能开关：默认仅开通 AI创作工厂
      try {
        const allFeatures = await prisma.featureSwitch.findMany();
        if (allFeatures.length > 0) {
          const featureRecords = allFeatures.map(f => ({
            id: genUUID(),
            userId: customerId,
            featureCode: f.code,
            enabled: f.code === 'factory',
            updatedAt: new Date(),
          }));
          await prisma.userFeatureSwitch.createMany({ data: featureRecords });
        }
      } catch (featError: any) {
        // 功能初始化失败时回滚：删除用户和关联
        await prisma.userAgentRelation.delete({ where: { id: (await prisma.userAgentRelation.findFirst({ where: { userId: customerId } }))!.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: customerId } }).catch(() => {});
        console.error('初始化客户功能开关失败:', featError);
        return res.status(500).json({ success: false, message: '初始化客户功能开关失败' });
      }

      res.json({
        success: true,
        message: '客户创建成功',
        data: customer,
      });
    } catch (error: any) {
      console.error('创建客户失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

// 更新客户信息
router.put('/customers/:id([0-9a-fA-F-]{36})', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const customerId = req.params.id;
    const { name, avatar } = req.body;

    // 验证客户属于该代理商
    const agentId = await resolveAgentId(userId);
    const existing = await prisma.user.findFirst({
      where: { id: customerId, UserAgentRelation: { agentId: agentId } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    const customer = await prisma.user.update({
      where: { id: customerId },
      data: { name, avatar },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,

      },
    });

    res.json({
      success: true,
      message: '更新成功',
      data: customer,
    });
  } catch (error: any) {
    console.error('更新客户失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 冻结/解冻客户
router.post('/customers/:id([0-9a-fA-F-]{36})/toggle-status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const customerId = req.params.id;

    // 验证客户属于该代理商
    const agentId = await resolveAgentId(userId);
    const existing = await prisma.user.findFirst({
      where: { id: customerId, UserAgentRelation: { agentId: agentId } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    const newStatus = existing.status === 'active' ? 'frozen' : 'active';

    const customer = await prisma.user.update({
      where: { id: customerId },
      data: { status: newStatus },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,

      },
    });

    res.json({
      success: true,
      message: newStatus === 'active' ? '已解冻' : '已冻结',
      data: customer,
    });
  } catch (error: any) {
    console.error('切换客户状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 重置客户密码
router.post('/customers/:id([0-9a-fA-F-]{36})/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const customerId = req.params.id;
    const { newPassword = '' } = req.body;

    const generatedPassword = newPassword || Math.random().toString(36).slice(-8);

    // 验证客户属于该代理商
    const agentId = await resolveAgentId(userId);
    const existing = await prisma.user.findFirst({
      where: { id: customerId, UserAgentRelation: { agentId: agentId } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    await prisma.user.update({
      where: { id: customerId },
      data: { password: hashPassword(generatedPassword) },
    });

    res.json({
      success: true,
      message: `密码已重置为: ${generatedPassword}`,
      password: generatedPassword, // 返回明文密码供代理商交给客户
    });
  } catch (error: any) {
    console.error('重置密码失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取客户功能开关
router.get('/customers/:id([0-9a-fA-F-]{36})/features', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const customerId = req.params.id;

    // 验证客户属于该代理商
    const agentId = await resolveAgentId(userId);
    const customer = await prisma.user.findFirst({
      where: { id: customerId, UserAgentRelation: { agentId: agentId } },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    // 获取全局功能开关
    const globalFeatures = await prisma.featureSwitch.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // 获取客户的功能开关设置
    let customerFeatures = await prisma.userFeatureSwitch.findMany({
      where: { userId: customerId },
    });

    // 若该客户尚无功能开关记录，按全局默认值自动初始化（仅 AI 创作工厂默认开启）
    if (customerFeatures.length === 0 && globalFeatures.length > 0) {
      const now = new Date();
      const defaultRecords = globalFeatures.map((f) => ({
        id: genUUID(),
        userId: customerId,
        featureCode: f.code,
        enabled: f.code === 'factory',
        createdAt: now,
        updatedAt: now,
      }));
      await prisma.userFeatureSwitch.createMany({ data: defaultRecords });
      customerFeatures = defaultRecords;
    }

    const customerFeatureMap = new Map(customerFeatures.map((f) => [f.featureCode, f]));

    // 合并数据
    const featuresWithStatus = globalFeatures.map((feature) => {
      const customerSetting = customerFeatureMap.get(feature.code);
      return {
        id: feature.id,
        code: feature.code,
        name: feature.name,
        description: feature.description,
        enabled: customerSetting ? customerSetting.enabled : feature.enabled,
      };
    });

    res.json({
      success: true,
      data: featuresWithStatus,
    });
  } catch (error: any) {
    console.error('获取功能开关失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新客户功能开关
router.put('/customers/:id/features', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const customerId = req.params.id;
    const { features } = req.body;

    // 验证客户属于该代理商
    const agentId = await resolveAgentId(userId);
    const customer = await prisma.user.findFirst({
      where: { id: customerId, UserAgentRelation: { agentId: agentId } },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    // 批量更新功能开关
    await Promise.all(
      features.map(async (feature: any) => {
        await prisma.userFeatureSwitch.upsert({
          where: {
            userId_featureCode: {
              userId: customerId,
              featureCode: feature.code,
            },
          },
          create: {
            id: genUUID(),
            userId: customerId,
            featureCode: feature.code,
            enabled: feature.enabled,
            updatedAt: new Date(),
          },
          update: {
            enabled: feature.enabled,
          },
        });
      })
    );

    res.json({
      success: true,
      message: '功能开关已更新',
    });
  } catch (error: any) {
    console.error('更新功能开关失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取客户统计数据
router.get('/customers/:id([0-9a-fA-F-]{36})/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const customerId = req.params.id;
    const { startDate, endDate } = req.query;

    // 验证客户属于该代理商
    const agentId = await resolveAgentId(userId);
    const customer = await prisma.user.findFirst({
      where: { id: customerId, UserAgentRelation: { agentId: agentId } },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const where = {
      userId: customerId,
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    };

    const [materialCount] = await Promise.all([
      prisma.material.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        materialCount,
      },
    });
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// 获取我的客户获客统计数据
// ============================================================
router.get('/acquisition/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agentId = await resolveAgentId(userId);
    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = customerIds.map(r => r.userId);

    const [leadCount, taskCount, leadsWithStatus] = await Promise.all([
      prisma.acquisitionLead.count({ where: { userId: { in: ids } } }),
      prisma.acquisitionTask.count({ where: { userId: { in: ids } } }),
      prisma.acquisitionLead.groupBy({ by: ['status'], where: { userId: { in: ids } }, _count: true }),
    ]);

    const statusCounts: Record<string, number> = {};
    leadsWithStatus.forEach(g => { statusCounts[g.status] = g._count; });

    res.json({
      success: true,
      data: { leadCount, taskCount, statusCounts },
    });
  } catch (error: any) {
    console.error('获取获客统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取客户获客潜客统计（仅聚合，不暴露潜客个人身份信息）
router.get('/acquisition/leads', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agentId = await resolveAgentId(userId);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = customerIds.map(r => r.userId);

    // 按状态统计潜客数量
    const statusBreakdown = await prisma.acquisitionLead.groupBy({
      by: ['status'],
      where: { userId: { in: ids } },
      _count: { id: true },
    });

    const totalLeads = await prisma.acquisitionLead.count({
      where: { userId: { in: ids } },
    });

    const statusCounts: Record<string, number> = {};
    statusBreakdown.forEach(g => { statusCounts[g.status] = g._count.id; });

    res.json({
      success: true,
      data: { totalLeads, statusCounts },
    });
  } catch (error: any) {
    console.error('获取获客潜客统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// API 密钥管理
// ============================================================
router.get('/api-keys', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const apiKeys = await prisma.agentApiConfig.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: apiKeys.map(k => ({
        id: k.id,
        providerId: k.providerId,
        apiKey: `${(k.apiKey || '').slice(0, 8)}****`,
        enabled: k.enabled,
        createdAt: k.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('获取API密钥失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/api-keys', [
  body('providerId').notEmpty().withMessage('服务商不能为空'),
  body('apiKey').notEmpty().withMessage('API密钥不能为空'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const agentId = (req as any).userId;
    const { providerId, apiKey } = req.body;

    const created = await prisma.agentApiConfig.create({
      data: { id: genUUID(), agentId, providerId, apiKey, enabled: true, updatedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'API密钥已添加',
      data: { id: created.id, providerId: created.providerId, apiKey: `${apiKey.slice(0, 8)}****`, enabled: true, createdAt: created.createdAt },
    });
  } catch (error: any) {
    console.error('添加API密钥失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// 内容素材统计（仅聚合数据，不暴露客户素材内容）
// ============================================================
router.get('/materials', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agentId = await resolveAgentId(userId);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = [userId, ...customerIds.map(r => r.userId)];

    // 按类型统计素材数量
    const typeBreakdown = await prisma.material.groupBy({
      by: ['type'],
      where: { userId: { in: ids } },
      _count: { id: true },
    });

    const totalMaterials = await prisma.material.count({
      where: { userId: { in: ids } },
    });

    const typeCounts: Record<string, number> = {};
    typeBreakdown.forEach(g => { typeCounts[g.type] = g._count.id; });

    res.json({
      success: true,
      data: { totalMaterials, typeCounts },
    });
  } catch (error: any) {
    console.error('获取素材统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// 分享统计数据
// ============================================================
router.get('/share/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agentId = await resolveAgentId(userId);
    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = customerIds.map(r => r.userId);

    const [qrCount, recordCount, scanCount, uniqueScanCount] = await Promise.all([
      prisma.shareQrCode.count({ where: { userId: { in: ids } } }),
      prisma.shareRecord.count({ where: { userId: { in: ids } } }),
      prisma.shareRecord.count({ where: { userId: { in: ids }, status: 'scanned' } }),
      (prisma as any).shareRecord.groupBy({ by: ['visitorId'], where: { userId: { in: ids }, visitorId: { not: null } }, _count: true }),
    ]);

    res.json({
      success: true,
      data: { qrCount, recordCount, scanCount, uniqueVisitorCount: uniqueScanCount.length },
    });
  } catch (error: any) {
    console.error('获取分享统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 分享记录统计（仅按日期聚合，不暴露扫码人身份信息）
router.get('/share/records', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agentId = await resolveAgentId(userId);
    const { days = '30' } = req.query;
    const lookbackDays = parseInt(days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = customerIds.map(r => r.userId);

    const records = await prisma.shareRecord.findMany({
      where: { userId: { in: ids }, createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // 按日期聚合扫码次数
    const dailyCounts: Record<string, number> = {};
    records.forEach(r => {
      const dateKey = r.createdAt.toISOString().split('T')[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    });

    const total = await prisma.shareRecord.count({ where: { userId: { in: ids } } });

    res.json({
      success: true,
      data: { total, dailyCounts },
    });
  } catch (error: any) {
    console.error('获取分享记录统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// 用量统计
// ============================================================
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agentId = await resolveAgentId(userId);
    const { range = '30d' } = req.query;
    const days = parseInt(range as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const customerUserIds = [userId, ...customerIds.map(r => r.userId)];

    const logs = await prisma.apiUsageLog.findMany({
      where: { userId: { in: customerUserIds }, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    const totalCalls = logs.length;
    const totalTokens = logs.reduce((s, l) => s + (l.requestTokens || 0) + (l.responseTokens || 0), 0);
    const totalCost = logs.reduce((s, l) => s + Number(l.cost || 0), 0);

    // 按客户分组
    const customerMap = new Map<string, { calls: number; tokens: number; cost: number }>();
    for (const log of logs) {
      const uid = log.userId;
      const entry = customerMap.get(uid) || { calls: 0, tokens: 0, cost: 0 };
      entry.calls++;
      entry.tokens += (log.requestTokens || 0) + (log.responseTokens || 0);
      entry.cost += Number(log.cost || 0);
      customerMap.set(uid, entry);
    }

    // 按日期趋势
    const trendMap = new Map<string, { calls: number; tokens: number; cost: number }>();
    for (const log of logs) {
      const d = log.createdAt.toISOString().slice(0, 10);
      const t = trendMap.get(d) || { calls: 0, tokens: 0, cost: 0 };
      t.calls++;
      t.tokens += (log.requestTokens || 0) + (log.responseTokens || 0);
      t.cost += Number(log.cost || 0);
      trendMap.set(d, t);
    }
    const trendData = Array.from(trendMap.entries()).map(([date, v]) => ({ date, calls: v.calls, tokens: v.tokens, cost: parseFloat(v.cost.toFixed(4)) }));

    res.json({
      success: true,
      data: {
        totalCalls, totalTokens, totalCost: parseFloat(totalCost.toFixed(4)),
        customerCount: customerMap.size,
        trendData,
        customerDetails: Array.from(customerMap.entries()).map(([userId, v]) => ({ userId, ...v, cost: parseFloat(v.cost.toFixed(4)) })),
      },
    });
  } catch (error: any) {
    console.error('获取用量统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// 结算管理
// ============================================================
router.get('/settlement/overview', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agent = await prisma.agent.findUnique({ where: { userId } });
    if (!agent) {
      return res.status(403).json({ success: false, message: '代理记录不存在' });
    }

    const agentId = agent.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 累计收益 & 本月收益
    const [earningsResult, monthEarnings, pendingEarnings, customerCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { agentId, status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { agentId, status: 'paid', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { agentId, status: 'pending' },
        _sum: { amount: true },
      }),
      prisma.userAgentRelation.count({ where: { agentId } }),
    ]);

    // 近6个月收益趋势
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const recentPayments = await prisma.payment.findMany({
      where: { agentId, status: 'paid', paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    const monthlyTrend = new Array(6).fill(0).map((_, i) => {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { month: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, amount: 0 };
    }).reverse();

    recentPayments.forEach(p => {
      if (!p.paidAt) return;
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyTrend.find(t => t.month === key);
      if (entry) entry.amount += Number(p.amount || 0);
    });

    res.json({
      success: true,
      data: {
        balance: Number(agent.balance || 0),
        totalEarnings: Number(earningsResult._sum.amount || 0),
        monthEarnings: Number(monthEarnings._sum.amount || 0),
        pendingEarnings: Number(pendingEarnings._sum.amount || 0),
        commissionRate: Number(agent.commissionRate || 0),
        customerCount,
        monthlyTrend,
      },
    });
  } catch (error: any) {
    console.error('结算概览失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/settlement/records', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const agent = await prisma.agent.findUnique({ where: { userId } });
    if (!agent) {
      return res.status(403).json({ success: false, message: '代理记录不存在' });
    }

    const { page = '1', pageSize = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    const [records, total] = await Promise.all([
      prisma.payment.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(pageSize as string),
      }),
      prisma.payment.count({ where: { agentId: agent.id } }),
    ]);

    res.json({
      success: true,
      data: {
        list: records.map(r => ({
          id: r.id,
          amount: Number(r.amount),
          status: r.status,
          type: r.type,
          description: r.description,
          paidAt: r.paidAt,
          createdAt: r.createdAt,
        })),
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    });
  } catch (error: any) {
    console.error('结算记录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
