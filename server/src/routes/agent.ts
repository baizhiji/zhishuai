/**
 * 代理商客户管理 API
 * 
 * 代理商可以管理其名下的终端客户
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, agentMiddleware, hashPassword } from '../middleware/auth';
import { prisma } from '../utils/db';

const router = Router();
// 代理商路由需要认证 + 角色检查
router.use(authMiddleware);
router.use(agentMiddleware);

// 获取代理商统计数据（数据总览用）
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const period = (req.query.period as string) || 'all';

    // 验证代理商
    const agent = await prisma.user.findFirst({
      where: { id: agentId, role: 'agent' },
    });
    if (!agent) {
      return res.status(403).json({ success: false, message: '非代理商账号' });
    }

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

    // 客户总数
    const totalCustomers = await prisma.user.count({
      where: { agentRelation: { agentId } },
    });

    // 正常客户
    const activeCustomers = await prisma.user.count({
      where: { agentRelation: { agentId }, status: 'active' },
    });

    // 冻结客户（toggle-status 将客户状态设为 'frozen'，与前端筛选保持一致）
    const disabledCustomers = await prisma.user.count({
      where: { agentRelation: { agentId }, status: 'frozen' },
    });

    // 本月新增
    const newCustomersThisMonth = await prisma.user.count({
      where: {
        agentRelation: { agentId },
        createdAt: { gte: startOfMonth },
      },
    });

    // 待处理工单（来自客户）
    const pendingTickets = await prisma.ticket.count({
      where: {
        user: { agentRelation: { agentId } },
        status: { in: ['open', 'in_progress'] },
      },
    });

    // 名下客户的素材总量
    const totalMaterials = await prisma.material.count({
      where: { user: { agentRelation: { agentId } } },
    });

    // period 筛选下的增量数据
    let periodNewCustomers = 0;
    let periodNewTickets = 0;
    if (periodStart) {
      periodNewCustomers = await prisma.user.count({
        where: {
          agentRelation: { agentId },
          createdAt: { gte: periodStart },
        },
      });
      periodNewTickets = await prisma.ticket.count({
        where: {
          user: { agentRelation: { agentId } },
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
    const agentId = (req as any).userId;
    const { page = '1', pageSize = '20', keyword = '', status = '' } = req.query;

    // 获取代理商信息
    const agent = await prisma.user.findFirst({
      where: { id: agentId, role: 'agent' },
    });

    if (!agent) {
      return res.status(403).json({ success: false, message: '非代理商账号' });
    }

    // 构建查询条件 — 通过 UserAgentRelation 关联表查询
    const where: any = {
      agentRelation: { agentId: agentId },
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
router.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const customerId = req.params.id;

    // 验证客户属于该代理商
    const customer = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        agentId: true,
        featureSwitches: true,
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
      const agentId = (req as any).userId;
      const { phone, name, password } = req.body;

      // 验证代理商
      const agent = await prisma.user.findFirst({
        where: { id: agentId, role: 'agent' },
      });

      if (!agent) {
        return res.status(403).json({ success: false, message: '非代理商账号' });
      }

      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      // 检查手机号是否已存在
      const existing = await prisma.user.findUnique({
        where: { phone },
      });

      if (existing) {
        return res.status(400).json({ success: false, message: '手机号已被注册' });
      }

      // 创建客户账号，使用bcrypt哈希密码
      const customer = await prisma.user.create({
        data: {
          phone,
          name: name || phone,
          password: hashPassword(password || phone.slice(-6)), // 若未提供密码则使用手机号后6位
          role: 'customer',
          agentRelation: { create: { agentId: agentId } },
          status: 'active',
        },
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          agentId: true,
        },
      });

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
router.put('/customers/:id', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const customerId = req.params.id;
    const { name, avatar } = req.body;

    // 验证客户属于该代理商
    const existing = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
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
        agentId: true,
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
router.post('/customers/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const customerId = req.params.id;

    // 验证客户属于该代理商
    const existing = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
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
        agentId: true,
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
router.post('/customers/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const customerId = req.params.id;
    const { newPassword = '' } = req.body;

    const generatedPassword = newPassword || Math.random().toString(36).slice(-8);

    // 验证客户属于该代理商
    const existing = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
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
router.get('/customers/:id/features', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const customerId = req.params.id;

    // 验证客户属于该代理商
    const customer = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    // 获取全局功能开关
    const globalFeatures = await prisma.featureSwitch.findMany({
      include: {
        subFeatures: true,
      },
    });

    // 获取客户的功能开关设置
    const customerFeatures = await prisma.userFeatureSwitch.findMany({
      where: { userId: customerId },
    });

    // 合并数据
    const featuresWithStatus = globalFeatures.map((feature) => {
      const customerSetting = customerFeatures.find((f) => f.featureCode === feature.code);
      return {
        id: feature.id,
        code: feature.code,
        name: feature.name,
        description: feature.description,
        enabled: customerSetting ? customerSetting.enabled : feature.enabled,
        subFeatures: feature.subFeatures.map((sub) => ({
          id: sub.id,
          code: sub.code,
          name: sub.name,
          description: sub.description,
          enabled: sub.enabled,
        })),
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
    const agentId = (req as any).userId;
    const customerId = req.params.id;
    const { features } = req.body;

    // 验证客户属于该代理商
    const customer = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
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
            userId: customerId,
            featureCode: feature.code,
            enabled: feature.enabled,
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
router.get('/customers/:id/stats', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const customerId = req.params.id;
    const { startDate, endDate } = req.query;

    // 验证客户属于该代理商
    const customer = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
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
    const agentId = (req as any).userId;
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

// 获取客户获客潜客列表
router.get('/acquisition/leads', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const { page = '1', pageSize = '20', search, status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = customerIds.map(r => r.userId);

    const where: any = { userId: { in: ids } };
    if (status && status !== 'all') where.status = status;
    if (search) where.name = { contains: search as string };

    const [leads, total] = await Promise.all([
      prisma.acquisitionLead.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.acquisitionLead.count({ where }),
    ]);

    res.json({
      success: true,
      data: { list: leads, total, page: parseInt(page as string), pageSize: take },
    });
  } catch (error: any) {
    console.error('获取获客潜客列表失败:', error);
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
      data: { agentId, providerId, apiKey, enabled: true },
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
// 内容素材管理
// ============================================================
router.get('/materials', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const { page = '1', pageSize = '20', type } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = [agentId, ...customerIds.map(r => r.customerId)];

    const where: any = { userId: { in: ids } };
    if (type && type !== 'all') where.type = type;

    const [materials, total] = await Promise.all([
      prisma.material.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.material.count({ where }),
    ]);

    res.json({
      success: true,
      data: { list: materials, total, page: parseInt(page as string), pageSize: take },
    });
  } catch (error: any) {
    console.error('获取素材列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// 分享统计数据
// ============================================================
router.get('/share/stats', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = customerIds.map(r => r.userId);

    const [qrCount, recordCount, scanCount, uniqueScanCount] = await Promise.all([
      prisma.shareQrCode.count({ where: { userId: { in: ids } } }),
      prisma.shareRecord.count({ where: { userId: { in: ids } } }),
      prisma.shareRecord.count({ where: { userId: { in: ids }, status: 'scanned' } }),
      prisma.shareRecord.groupBy({ by: ['visitorId'], where: { userId: { in: ids }, visitorId: { not: null } }, _count: true }),
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

router.get('/share/records', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const { page = '1', pageSize = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = customerIds.map(r => r.userId);

    const [records, total] = await Promise.all([
      prisma.shareRecord.findMany({
        where: { userId: { in: ids } },
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shareRecord.count({ where: { userId: { in: ids } } }),
    ]);

    res.json({
      success: true,
      data: { list: records, total, page: parseInt(page as string), pageSize: take },
    });
  } catch (error: any) {
    console.error('获取分享记录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================================
// 用量统计
// ============================================================
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const { range = '30d' } = req.query;
    const days = parseInt(range as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const customerIds = await prisma.userAgentRelation.findMany({
      where: { agentId },
      select: { userId: true },
    });
    const ids = [agentId, ...customerIds.map(r => r.customerId)];

    const logs = await prisma.apiUsageLog.findMany({
      where: { userId: { in: ids }, createdAt: { gte: since } },
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

export default router;
