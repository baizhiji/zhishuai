import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// Admin: 代理商管理
// ============================================

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
              customers: true
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
        parent: {
          include: {
            user: { select: { name: true } }
          }
        },
        children: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        customers: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: {
          select: { customers: true }
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
          phone,
          password: hashPassword(password),
          name,
          role: 'agent'
        }
      });

      const agent = await tx.agent.create({
        data: {
          userId: user.id,
          name: name || phone,
          level: level || 'district',
          region,
          commissionRate: commissionRate || 0.3,
          parentId
        }
      });

      return { user, agent };
    });

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
      include: { _count: { select: { customers: true } } }
    });

    if (!agent) {
      return res.status(404).json({ error: '代理商不存在' });
    }

    if (agent._count.customers > 0) {
      return res.status(400).json({ error: '该代理商下有客户，无法删除' });
    }

    // 删除代理商标记（不删除用户）
    await prisma.agent.delete({ where: { id } });

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
        period,
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
            customers: true
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
          totalCustomers: summary?._count.customers || 0
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
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          agentRelation: { agentId: id },
          ...(status && { status })
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
          agentRelation: { agentId: id },
          ...(status && { status })
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
        userId: customerId,
        featureCode,
        enabled
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
            userId: customerId,
            featureCode,
            enabled
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

export default router;
