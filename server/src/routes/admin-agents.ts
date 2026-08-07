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
          user: {
            select: {
              phone: true,
              name: true,
              avatar: true,
              createdAt: true
            }
          },
          children: {
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

    res.json({
      data: agents,
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

// 获取单个代理商详情
router.get('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            phone: true,
            name: true,
            avatar: true,
            createdAt: true
          }
        },
        agent: {
          include: {
            user: { select: { name: true } }
          }
        },
        children: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        UserAgentRelation: {
          include: {
            user: { select: { id: true, name: true, phone: true, createdAt: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: {
          select: { agentRelations: true }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({ error: '代理商不存在' });
    }

    res.json({ data: agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建代理商
router.post('/agents', async (req, res) => {
  try {
    const { phone, password, name, level, region, commissionRate, parentId } = req.body;

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
          password: hashPassword(password),
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

      return { user, agent };
    });

    auditLog({
      action: 'admin.create_agent',
      userId: (req as any).userId,
      target: result.agent.id,
      detail: `创建代理商: ${name || phone}`,
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'] as string,
    }).catch(() => {});

    res.json({ message: '代理商创建成功', data: result.agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新代理商
router.put('/agents/:id', async (req, res) => {
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
        user: { select: { phone: true, name: true } }
      }
    });

    auditLog({
      action: 'admin.edit_agent',
      userId: (req as any).userId,
      target: `代理商ID: ${id}`,
      detail: `编辑代理商: ${agent.user.name || agent.user.phone}`,
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
        user: { select: { phone: true, name: true } }
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
      detail: `${status === 'frozen' ? '冻结' : '解冻'}代理商: ${agent.user.name || agent.user.phone}`,
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'] as string,
    }).catch(() => {});

    res.json({ data: agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除代理商
router.delete('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { _count: { select: { agentRelations: true } } }
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

    res.json({ message: '代理商已删除' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取代理商业绩统计
router.get('/agents/:id/stats', async (req, res) => {
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
router.get('/agents/:id/customers', async (req, res) => {
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
          UserAgentRelation: { agent: { id: id } },
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
          UserAgentRelation: { agent: { id: id } },
          ...(statusFilter && { status: statusFilter })
        }
      })
    ]);

    res.json({
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
router.put('/agents/:id/customer/:customerId/features', async (req, res) => {
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
router.put('/agents/:id/customers/features', async (req, res) => {
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

    res.json({ message: '批量设置成功', data: updates });
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
          agentId: true,
          UserAgentRelation: {
            select: {
              agentId: true,
              userId: true,
              agent: {
                select: {
                  id: true,
                  name: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
          _count: {}
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
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

// 创建客户
router.post('/customers', async (req, res) => {
  try {
    const { phone, password, name, agentId, expireMonths } = req.body;

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
          password: hashPassword(password || Math.random().toString(36).slice(-8)),
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
          agentId: true,
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

      return newUser;
    });

    res.json({ message: '客户创建成功', data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新客户
router.put('/customers/:id', async (req, res) => {
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
        agentId: true,
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
        agentId: true,
      },
    });

    res.json({ data: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除客户
router.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 删除客户关联数据
    await prisma.$transaction([
      prisma.userAgentRelation.deleteMany({ where: { userId: id } }),
      prisma.userFeatureSwitch.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ message: '客户已删除' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取功能开关定义列表（用于 Admin 前端构建功能名称映射）
router.get('/features', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const features = await prisma.featureSwitch.findMany({
      where: { enabled: true },
      include: {
        FeatureSubSwitch: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { sortOrder: 'asc' }
    });

    const data = features.map(f => ({
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      icon: f.icon,
      sortOrder: f.sortOrder,
      subSwitches: f.FeatureSubSwitch.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        description: s.description,
        enabled: s.enabled,
      })),
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取指定客户的功能开关（含客户个性化覆盖）
router.get('/customers/:id/features', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const allFeatures = await prisma.featureSwitch.findMany({
      where: { enabled: true },
      include: {
        FeatureSubSwitch: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { sortOrder: 'asc' }
    });

    const userFeatures = await prisma.userFeatureSwitch.findMany({
      where: { userId: id }
    });

    const userFeatureMap = new Map(userFeatures.map(f => [f.featureCode, f]));

    const features = allFeatures.map(f => ({
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      icon: f.icon,
      enabled: userFeatureMap.has(f.code)
        ? userFeatureMap.get(f.code)!.enabled
        : f.enabled,
      subSwitches: f.FeatureSubSwitch.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        description: s.description,
        enabled: s.enabled,
      })),
    }));

    res.json({ success: true, data: features });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 设置客户功能开关（每客户粒度，支持启用/停用）
router.put('/customers/:id/features', authMiddleware, adminMiddleware, async (req: any, res: any) => {
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
router.post('/customers/:id/reset-password', authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    const newPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    const hashed = hashPassword(newPassword);
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

export default router;
