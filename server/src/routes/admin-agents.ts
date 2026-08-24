import { Router } from 'express';
import { authMiddleware, adminMiddleware, hashPassword } from '../middleware/auth';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/db';
import { auditLog } from '../services/audit-log.service';

const router = Router();
// ============================================
// Admin: 代理商管理（所有路由需要管理员权限）
// ============================================
router.use(authMiddleware);
router.use(adminMiddleware);

// 获取代理商列表
router.get('/agents', async (req, res) => {
  try {
    const { status, level, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (status) where.status = status;
    if (level) where.level = level;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          other_Agent: {
            select: { id: true }
          },
          _count: {
            select: {
              UserAgentRelation: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.agent.count({ where })
    ]);

    // 单独查询用户，避免required relation null报错
    const userIds = agents.map(a => a.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, phone: true, name: true, avatar: true, createdAt: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const agentsWithUser = agents.map(agent => ({
      ...agent,
      user: userMap.get(agent.userId) || null,
    }));

    res.json({
      success: true,
      data: agentsWithUser,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error: any) {
    console.error('[AdminAgents] GET /agents error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 获取单个代理商详情
router.get('/agents/:id([0-9a-fA-F-]{36})', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            phone: true,
            name: true,
            avatar: true,
            createdAt: true
          }
        },
        Agent: {
          include: {
            User: { select: { name: true } }
          }
        },
        other_Agent: {
          include: {
            User: { select: { name: true, phone: true } }
          }
        },
        UserAgentRelation: {
          include: {
            User: { select: { id: true, name: true, phone: true, createdAt: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: {
          select: { UserAgentRelation: true }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({ error: '代理商不存在' });
    }

    res.json({ success: true, data: agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建代理商
router.post('/agents', async (req, res) => {
  try {
    const { phone, password, name, level, region, commissionRate, parentId, openingFee = 0 } = req.body;
    const openingFeeAmount = parseFloat(openingFee) || 0;

    // 检查手机号是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 创建用户和代理商（事务）
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          phone,
          password: await hashPassword(password),
          name,
          role: 'agent',
          updatedAt: new Date()
        }
      });

      const agent = await tx.agent.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          name: name || phone,
          level: level || 'district',
          region,
          commissionRate: commissionRate || 0.3,
          parentId,
          updatedAt: new Date()
        }
      });

      // 记录开通费用并计入代理商收益
      if (openingFeeAmount > 0) {
        await tx.payment.create({
          data: {
            id: randomUUID(),
            type: 'agent_open',
            amount: openingFeeAmount,
            status: 'paid',
            paymentMethod: 'offline',
            agentId: agent.id,
            description: `开通代理商 ${name || phone} 收费`,
            paidAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        await tx.agent.update({
          where: { id: agent.id },
          data: { totalRevenue: { increment: openingFeeAmount } }
        });
      }

      return { user, agent };
    });

    auditLog({
      action: 'admin.create_agent',
      userId: (req as any).userId,
      target: result.agent.id,
      detail: `创建代理商: ${name || phone}${openingFeeAmount > 0 ? `, 开通费: ${openingFeeAmount}元` : ''}`,
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'] as string,
    }).catch(() => {});

    res.json({ success: true, message: '代理商创建成功', data: result.agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新代理商
router.put('/agents/:id([0-9a-fA-F-]{36})', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, region, commissionRate, status } = req.body;

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(level !== undefined && { level }),
        ...(region !== undefined && { region }),
        ...(commissionRate !== undefined && { commissionRate }),
        ...(status !== undefined && { status })
      },
      include: {
        User: { select: { phone: true, name: true } }
      }
    });

    auditLog({
      action: 'admin.edit_agent',
      userId: (req as any).userId,
      target: `代理商ID: ${id}`,
      detail: `编辑代理商: ${agent.User.name || agent.User.phone}`,
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'] as string,
    }).catch(() => {});

    res.json({ data: agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 冻结/解冻代理商
router.patch('/agents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const agent = await prisma.agent.update({
      where: { id },
      data: { status },
      include: {
        User: { select: { phone: true, name: true } }
      }
    });

    // 同时冻结/解冻关联的用户
    await prisma.user.update({
      where: { id: agent.userId },
      data: { status: status === 'frozen' ? 'inactive' : 'active' }
    });

    auditLog({
      action: status === 'frozen' ? 'admin.disable_agent' : 'admin.enable_agent',
      userId: (req as any).userId,
      target: `代理商ID: ${id}`,
      detail: `${status === 'frozen' ? '冻结' : '解冻'}代理商: ${agent.User.name || agent.User.phone}`,
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'] as string,
    }).catch(() => {});

    res.json({ success: true, data: agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除代理商
router.delete('/agents/:id([0-9a-fA-F-]{36})', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { _count: { select: { UserAgentRelation: true } } }
    });

    if (!agent) {
      return res.status(404).json({ error: '代理商不存在' });
    }

    if (agent._count.UserAgentRelation > 0) {
      return res.status(400).json({ error: '该代理商下有客户，无法删除' });
    }

    // 删除代理商标记（不删除用户）
    await prisma.agent.delete({ where: { id } });

    auditLog({
      action: 'admin.delete_agent',
      userId: (req as any).userId,
      target: `代理商ID: ${id}`,
      detail: '删除代理商',
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'] as string,
    }).catch(() => {});

    res.json({ success: true, message: '代理商已删除' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取代理商业绩统计
router.get('/agents/:id([0-9a-fA-F-]{36})/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'monthly' } = req.query;

    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        groupByFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84);
        groupByFormat = 'IYYY-IW';
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        groupByFormat = 'YYYY-MM';
    }

    // 获取统计数据
    const stats = await prisma.agentStats.findMany({
      where: {
        agentId: id,
        period: period as string,
        periodStart: { gte: startDate }
      },
      orderBy: { periodStart: 'desc' }
    });

    // 获取汇总数据
    const summary = await prisma.agent.findUnique({
      where: { id },
      select: {
        balance: true,
        totalRevenue: true,
        _count: {
          select: {
            UserAgentRelation: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        stats,
        summary: {
          balance: summary?.balance || 0,
          totalRevenue: summary?.totalRevenue || 0,
          totalCustomers: summary?._count.UserAgentRelation || 0
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取代理商的客户列表
router.get('/agents/:id([0-9a-fA-F-]{36})/customers', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!agent) {
      return res.status(404).json({ error: '代理商不存在' });
    }

    // 查找关联的客户
    const statusFilter = status as string | undefined;
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          Agent: { id: id },
          ...(statusFilter && { status: statusFilter })
        },
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.user.count({
        where: {
          Agent: { id: id },
          ...(statusFilter && { status: statusFilter })
        }
      })
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 设置客户功能开关
router.put('/agents/:id([0-9a-fA-F-]{36})/customer/:customerId([0-9a-fA-F-]{36})/features', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { featureCode, enabled } = req.body;

    const featureSwitch = await prisma.userFeatureSwitch.upsert({
      where: {
        userId_featureCode: {
          userId: customerId,
          featureCode
        }
      },
      update: { enabled },
      create: {
        id: randomUUID(),
        userId: customerId,
        featureCode,
        enabled,
        updatedAt: new Date()
      }
    });

    res.json({ data: featureSwitch });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量设置客户功能开关
router.put('/agents/:id([0-9a-fA-F-]{36})/customers/features', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerIds, features } = req.body;

    // 批量更新
    const updates = [];
    for (const customerId of customerIds) {
      for (const { featureCode, enabled } of features) {
        const result = await prisma.userFeatureSwitch.upsert({
          where: {
            userId_featureCode: {
              userId: customerId,
              featureCode
            }
          },
          update: { enabled },
          create: {
            id: randomUUID(),
            userId: customerId,
            featureCode,
            enabled,
            updatedAt: new Date()
          }
        });
        updates.push(result);
      }
    }

    res.json({ success: true, message: '批量设置成功', data: updates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有客户列表（Admin）
router.get('/customers', async (req, res) => {
  try {
    const { status, keyword, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          expireAt: true,
  
          Agent: {
            select: {
              id: true,
              User: { select: { name: true } },
            },
          },
          _count: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        list: customers,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建客户
router.post('/customers', async (req, res) => {
  try {
    const { phone, password, name, agentId, expireMonths, openingFee = 0 } = req.body;
    const openingFeeAmount = parseFloat(openingFee) || 0;

    // agentId 必填，防止创建无归属的孤儿客户
    if (!agentId) {
      return res.status(400).json({ error: '请选择归属代理商' });
    }

    // 验证代理商是否存在
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return res.status(400).json({ error: '代理商不存在' });
    }

    // 检查手机号是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 计算到期时间
    const expireAt = expireMonths === -1 
      ? new Date('2099-12-31') 
      : new Date(Date.now() + expireMonths * 30 * 24 * 60 * 60 * 1000);

    // 创建用户（事务）
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: randomUUID(),
          phone,
          password: await hashPassword(password || Math.random().toString(36).slice(-8)),
          name: name || phone,
          role: 'customer',
          updatedAt: new Date()
        },
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          expireAt: true,
  
        },
      });

      // 建立代理商关联
      await tx.userAgentRelation.create({
        data: {
          id: randomUUID(),
          userId: newUser.id,
          agentId
        }
      });

      // 初始化客户功能开关：默认仅开通 AI创作工厂
      const allFeatures = await tx.featureSwitch.findMany();
      if (allFeatures.length > 0) {
        const featureRecords = allFeatures.map(f => ({
          id: randomUUID(),
          userId: newUser.id,
          featureCode: f.code,
          enabled: f.code === 'factory',
          updatedAt: new Date(),
        }));
        await tx.userFeatureSwitch.createMany({ data: featureRecords });
      }

      // 记录开通费用并计入归属代理商收益
      if (openingFeeAmount > 0) {
        await tx.payment.create({
          data: {
            id: randomUUID(),
            type: 'customer_open',
            amount: openingFeeAmount,
            status: 'paid',
            paymentMethod: 'offline',
            agentId,
            userId: newUser.id,
            description: `管理员开通客户 ${name || phone} 收费`,
            paidAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        await tx.agent.update({
          where: { id: agentId },
          data: { totalRevenue: { increment: openingFeeAmount } }
        });
      }

      return newUser;
    });

    res.json({ success: true, message: '客户创建成功', data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新客户
router.put('/customers/:id([0-9a-fA-F-]{36})', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, expireAt } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(expireAt !== undefined && { expireAt: new Date(expireAt) })
      },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        expireAt: true,

      },
    });

    res.json({ data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 冻结/解冻客户
router.patch('/customers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: status === 'frozen' ? 'inactive' : 'active' },
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

    res.json({ data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除客户
router.delete('/customers/:id([0-9a-fA-F-]{36})', async (req, res) => {
  try {
    const { id } = req.params;

    // 删除客户关联数据
    await prisma.$transaction([
      prisma.userAgentRelation.deleteMany({ where: { userId: id } }),
      prisma.userFeatureSwitch.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ success: true, message: '客户已删除' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取功能开关定义列表（用于 Admin 前端构建功能名称映射）
router.get('/features', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const features = await prisma.featureSwitch.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    const data = features.map(f => ({
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      icon: f.icon,
      sortOrder: f.sortOrder,
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取指定客户的功能开关（含客户个性化覆盖）
router.get('/customers/:id([0-9a-fA-F-]{36})/features', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const allFeatures = await prisma.featureSwitch.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    let userFeatures = await prisma.userFeatureSwitch.findMany({
      where: { userId: id }
    });

    // 若客户尚无功能开关记录，按"仅 AI 创作工厂开启"自动初始化
    if (userFeatures.length === 0 && allFeatures.length > 0) {
      const now = new Date();
      const defaultRecords = allFeatures.map(f => ({
        id: randomUUID(),
        userId: id,
        featureCode: f.code,
        enabled: f.code === 'factory',
        updatedAt: now,
      }));
      await prisma.userFeatureSwitch.createMany({ data: defaultRecords });
      userFeatures = defaultRecords.map(r => ({ ...r, createdAt: now }));
    }

    const userFeatureMap = new Map(userFeatures.map(f => [f.featureCode, f]));

    const features = allFeatures.map(f => ({
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      icon: f.icon,
      enabled: userFeatureMap.get(f.code)?.enabled ?? f.enabled,
    }));

    res.json({ success: true, data: features });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 设置客户功能开关（每客户粒度，支持启用/停用）
router.put('/customers/:id([0-9a-fA-F-]{36})/features', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { features } = req.body; // [{code: string, enabled: boolean}]

    if (!Array.isArray(features)) {
      return res.status(400).json({ success: false, message: 'features 必须为 [{code, enabled}] 数组' });
    }

    for (const f of features) {
      await prisma.userFeatureSwitch.upsert({
        where: {
          userId_featureCode: { userId: id, featureCode: f.code }
        },
        update: { enabled: f.enabled, updatedAt: new Date() },
        create: {
          id: randomUUID(),
          userId: id,
          featureCode: f.code,
          enabled: f.enabled,
          updatedAt: new Date(),
        },
      });
    }

    res.json({ success: true, message: '功能开关已更新' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 重置客户密码
router.post('/customers/:id([0-9a-fA-F-]{36})/reset-password', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    const newPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id }, data: { password: hashed } });

    await prisma.adminLog.create({
      data: {
        userId: req.userId,
        userName: req.userName,
        action: 'reset_password',
        target: 'User',
        detail: `重置客户 ${user.name || user.phone} 密码`,
      },
    });

    res.json({ success: true, message: '密码已重置', data: { password: newPassword } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取代理商收益汇总（总后台）
router.get('/earnings', async (req: any, res: any) => {
  try {
    const { agentId, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where: any = {};
    if (agentId) {
      where.agentId = agentId;
    }
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) where.paidAt.gte = new Date(startDate as string);
      if (endDate) where.paidAt.lte = new Date(endDate as string);
    }

    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        commissionRate: true,
        totalRevenue: true,
        balance: true,
      },
      orderBy: { totalRevenue: 'desc' },
    });

    const agentIds = agents.map((a: any) => a.id);
    const customerCounts = agentIds.length > 0
      ? await prisma.userAgentRelation.groupBy({
          by: ['agentId'],
          where: { agentId: { in: agentIds } },
          _count: { _all: true },
        })
      : [];

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          Agent: { select: { name: true } },
          User: { select: { phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.payment.count({ where }),
    ]);

    const countMap = new Map(customerCounts.map((c: any) => [c.agentId, c._count._all]));

    const summary = agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      commissionRate: Number(agent.commissionRate),
      totalRevenue: Number(agent.totalRevenue),
      balance: Number(agent.balance),
      customerCount: countMap.get(agent.id) || 0,
    }));

    return res.json({
      success: true,
      data: {
        summary,
        records: payments.map((p: any) => ({
          id: p.id,
          agentId: p.agentId,
          agentName: p.Agent?.name,
          userId: p.userId,
          userPhone: p.User?.phone,
          userName: p.User?.name,
          type: p.type,
          amount: Number(p.amount),
          status: p.status,
          description: p.description,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
        pagination: { page: Number(page), pageSize: Number(pageSize), total },
      },
    });
  } catch (error: any) {
    console.error('获取代理商收益失败:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
