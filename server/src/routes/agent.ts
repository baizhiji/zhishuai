/**
 * 代理商客户管理 API
 * 
 * 代理商可以管理其名下的终端客户
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

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

    // 构建查询条件
    const where: any = {
      agentId: agentId,
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
        const [materialCount, accountCount, publishCount] = await Promise.all([
          prisma.material.count({ where: { userId: customer.id } }),
          prisma.matrixAccount.count({ where: { userId: customer.id } }),
          prisma.publishedContent.count({ where: { userId: customer.id } }),
        ]);

        return {
          ...customer,
          materialCount,
          accountCount,
          publishCount,
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
      include: {
        featureSwitches: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    // 获取统计数据
    const [materialCount, accountCount, publishCount, referralCount] = await Promise.all([
      prisma.material.count({ where: { userId: customerId } }),
      prisma.matrixAccount.count({ where: { userId: customerId } }),
      prisma.publishedContent.count({ where: { userId: customerId } }),
      // 需要添加 Referral 表
    ]);

    res.json({
      success: true,
      data: {
        ...customer,
        materialCount,
        accountCount,
        publishCount,
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

      // 检查手机号是否已存在
      const existing = await prisma.user.findUnique({
        where: { phone },
      });

      if (existing) {
        return res.status(400).json({ success: false, message: '手机号已被注册' });
      }

      // 创建客户账号
      const customer = await prisma.user.create({
        data: {
          phone,
          name: name || phone,
          password: password || '123456', // 默认密码
          role: 'customer',
          agentRelation: { create: { agentId: agentId } },
          status: 'active',
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
    const { newPassword = '123456' } = req.body;

    // 验证客户属于该代理商
    const existing = await prisma.user.findFirst({
      where: { id: customerId, agentRelation: { agentId: agentId } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    await prisma.user.update({
      where: { id: customerId },
      data: { password: newPassword },
    });

    res.json({
      success: true,
      message: '密码已重置为: 123456',
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

    const [materialCount, accountCount, publishCount] = await Promise.all([
      prisma.material.count({ where }),
      prisma.matrixAccount.count({ where }),
      prisma.publishedContent.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        materialCount,
        accountCount,
        publishCount,
      },
    });
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
