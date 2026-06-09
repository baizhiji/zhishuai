import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { z } from 'zod';

const prisma = new PrismaClient();

const router = Router();

// ==================== 标签管理 ====================

// 获取标签列表
router.get('/tags', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tags = await prisma.crmTag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // 获取每个标签关联的客户数量
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const count = await prisma.crmCustomer.count({
          where: {
            userId,
            tags: { contains: tag.id }
          }
        });
        return { ...tag, customerCount: count };
      })
    );
    
    res.json({ code: 0, data: tagsWithCount });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 创建标签
router.post('/tags', [
  body('name').notEmpty().withMessage('标签名称不能为空'),
  body('color').optional().isHexColor().withMessage('颜色格式错误')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: errors.array()[0].msg });
    }
    
    const userId = req.headers['x-user-id'] as string;
    const { name, color } = req.body;
    
    // 检查是否已存在同名标签
    const existing = await prisma.crmTag.findUnique({
      where: { userId_name: { userId, name } }
    });
    if (existing) {
      return res.status(400).json({ code: 400, message: '标签名称已存在' });
    }
    
    const tag = await prisma.crmTag.create({
      data: { userId, name, color: color || '#1890ff' }
    });
    
    res.json({ code: 0, data: tag });
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新标签
router.put('/tags/:id', [
  body('name').optional().notEmpty(),
  body('color').optional().isHexColor()
], async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { name, color } = req.body;
    
    const tag = await prisma.crmTag.findFirst({
      where: { id, userId }
    });
    if (!tag) {
      return res.status(404).json({ code: 404, message: '标签不存在' });
    }
    
    const updated = await prisma.crmTag.update({
      where: { id },
      data: { name, color }
    });
    
    res.json({ code: 0, data: updated });
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除标签
router.delete('/tags/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    
    const tag = await prisma.crmTag.findFirst({
      where: { id, userId }
    });
    if (!tag) {
      return res.status(404).json({ code: 404, message: '标签不存在' });
    }
    
    // 删除标签
    await prisma.crmTag.delete({ where: { id } });
    
    // 从所有客户中移除该标签
    const customers = await prisma.crmCustomer.findMany({
      where: { userId, tags: { contains: id } }
    });
    
    for (const customer of customers) {
      const tags = JSON.parse(customer.tags || '[]').filter((t: string) => t !== id);
      await prisma.crmCustomer.update({
        where: { id: customer.id },
        data: { tags: JSON.stringify(tags) }
      });
    }
    
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 给客户添加/移除标签
router.post('/customers/:customerId/tags', [
  body('tagIds').isArray()
], async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { customerId } = req.params;
    const { tagIds, action } = req.body; // action: add 或 remove
    
    const customer = await prisma.crmCustomer.findFirst({
      where: { id: customerId, userId }
    });
    if (!customer) {
      return res.status(404).json({ code: 404, message: '客户不存在' });
    }
    
    let currentTags = JSON.parse(customer.tags || '[]');
    
    if (action === 'remove') {
      currentTags = currentTags.filter((t: string) => !tagIds.includes(t));
    } else {
      currentTags = [...new Set([...currentTags, ...tagIds])];
    }
    
    const updated = await prisma.crmCustomer.update({
      where: { id: customerId },
      data: { tags: JSON.stringify(currentTags) }
    });
    
    res.json({ code: 0, data: updated });
  } catch (error) {
    console.error('更新客户标签失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ==================== 自动化规则 ====================

// 获取自动化规则列表
router.get('/rules', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const rules = await prisma.crmAutomationRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ code: 0, data: rules });
  } catch (error) {
    console.error('获取规则失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 创建自动化规则
const createRuleSchema = z.object({
  name: z.string().min(1),
  trigger: z.enum(['follow_up_overdue', 'level_change', 'source_change', 'tag_added', 'days_inactive']),
  condition: z.object({
    level: z.string().optional(),
    source: z.string().optional(),
    days: z.number().optional(),
  }),
  action: z.object({
    type: z.enum(['notify', 'assign', 'tag', 'status_change']),
    value: z.string().optional(),
  })
});

router.post('/rules', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const data = createRuleSchema.parse(req.body);
    
    const rule = await prisma.crmAutomationRule.create({
      data: {
        userId,
        name: data.name,
        trigger: data.trigger,
        condition: JSON.stringify(data.condition),
        action: JSON.stringify(data.action)
      }
    });
    
    res.json({ code: 0, data: rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ code: 400, message: error.errors[0].message });
    }
    console.error('创建规则失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新自动化规则
router.put('/rules/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    
    const rule = await prisma.crmAutomationRule.findFirst({
      where: { id, userId }
    });
    if (!rule) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    
    const { name, trigger, condition, action, isActive } = req.body;
    
    const updated = await prisma.crmAutomationRule.update({
      where: { id },
      data: {
        name,
        trigger,
        condition: condition ? JSON.stringify(condition) : undefined,
        action: action ? JSON.stringify(action) : undefined,
        isActive
      }
    });
    
    res.json({ code: 0, data: updated });
  } catch (error) {
    console.error('更新规则失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除自动化规则
router.delete('/rules/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    
    const rule = await prisma.crmAutomationRule.findFirst({
      where: { id, userId }
    });
    if (!rule) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    
    await prisma.crmAutomationRule.delete({ where: { id } });
    
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('删除规则失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 执行自动化规则检查（定时任务调用）
router.post('/rules/execute', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.body.userId;
    
    // 获取所有启用的规则
    const rules = await prisma.crmAutomationRule.findMany({
      where: { userId, isActive: true }
    });
    
    let executedCount = 0;
    
    for (const rule of rules) {
      const condition = JSON.parse(rule.condition);
      const action = JSON.parse(rule.action);
      
      // 根据触发器类型执行不同的检查
      if (rule.trigger === 'follow_up_overdue') {
        // 查找超过N天未跟进的客户
        const days = condition.days || 7;
        const overdueDate = new Date();
        overdueDate.setDate(overdueDate.getDate() - days);
        
        const customers = await prisma.crmCustomer.findMany({
          where: {
            userId,
            status: 'active',
            OR: [
              { lastFollowUpAt: { lt: overdueDate } },
              { lastFollowUpAt: null, createdAt: { lt: overdueDate } }
            ]
          }
        });
        
        for (const customer of customers) {
          // 发送通知
          if (action.type === 'notify') {
            await prisma.notification.create({
              data: {
                userId,
                title: '客户跟进提醒',
                content: `客户 ${customer.name} 已超过${days}天未跟进，请及时处理`,
                type: 'crm_reminder',
                relatedId: customer.id
              }
            });
          }
        }
      }
      
      // 更新规则执行统计
      await prisma.crmAutomationRule.update({
        where: { id: rule.id },
        data: { lastRunAt: new Date(), runCount: { increment: 1 } }
      });
      
      executedCount++;
    }
    
    res.json({ code: 0, data: { executedCount } });
  } catch (error) {
    console.error('执行规则失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ==================== 提醒管理 ====================

// 获取提醒列表
router.get('/reminders', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { upcoming, completed } = req.query;
    
    const where: any = { userId };
    
    if (upcoming === 'true') {
      where.isCompleted = false;
      where.remindAt = { gte: new Date() };
    } else if (completed === 'true') {
      where.isCompleted = true;
    }
    
    const reminders = await prisma.crmReminder.findMany({
      where,
      orderBy: { remindAt: 'asc' },
      take: 100
    });
    
    res.json({ code: 0, data: reminders });
  } catch (error) {
    console.error('获取提醒失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 创建提醒
const createReminderSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(['follow_up', 'contract', 'birthday', 'custom']),
  title: z.string().min(1),
  remindAt: z.string().datetime()
});

router.post('/reminders', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const data = createReminderSchema.parse(req.body);
    
    const customer = await prisma.crmCustomer.findFirst({
      where: { id: data.customerId, userId }
    });
    if (!customer) {
      return res.status(404).json({ code: 404, message: '客户不存在' });
    }
    
    const reminder = await prisma.crmReminder.create({
      data: {
        userId,
        customerId: data.customerId,
        type: data.type,
        title: data.title,
        remindAt: new Date(data.remindAt)
      }
    });
    
    res.json({ code: 0, data: reminder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ code: 400, message: error.errors[0].message });
    }
    console.error('创建提醒失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 标记提醒完成
router.post('/reminders/:id/complete', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    
    const reminder = await prisma.crmReminder.findFirst({
      where: { id, userId }
    });
    if (!reminder) {
      return res.status(404).json({ code: 404, message: '提醒不存在' });
    }
    
    const updated = await prisma.crmReminder.update({
      where: { id },
      data: { isCompleted: true }
    });
    
    res.json({ code: 0, data: updated });
  } catch (error) {
    console.error('完成提醒失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除提醒
router.delete('/reminders/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    
    const reminder = await prisma.crmReminder.findFirst({
      where: { id, userId }
    });
    if (!reminder) {
      return res.status(404).json({ code: 404, message: '提醒不存在' });
    }
    
    await prisma.crmReminder.delete({ where: { id } });
    
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('删除提醒失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ==================== CRM 统计看板 ====================

router.get('/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    // 客户统计
    const [totalCustomers, activeCustomers, overdueFollowUps, todayReminders] = await Promise.all([
      // 总客户数
      prisma.crmCustomer.count({ where: { userId } }),
      // 活跃客户数（本月有跟进）
      prisma.crmCustomer.count({
        where: {
          userId,
          status: 'active',
          lastFollowUpAt: { gte: new Date(new Date().setDate(1)) }
        }
      }),
      // 超期未跟进客户数
      prisma.crmCustomer.count({
        where: {
          userId,
          status: 'active',
          OR: [
            { lastFollowUpAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            { lastFollowUpAt: null }
          ]
        }
      }),
      // 今日待办提醒数
      prisma.crmReminder.count({
        where: {
          userId,
          isCompleted: false,
          remindAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);
    
    // 客户等级分布
    const levelDistribution = await prisma.crmCustomer.groupBy({
      by: ['level'],
      where: { userId },
      _count: true
    });
    
    // 客户来源分布
    const sourceDistribution = await prisma.crmCustomer.groupBy({
      by: ['source'],
      where: { userId, source: { not: null } },
      _count: true
    });
    
    // 最近7天新增客户趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCustomers = await prisma.crmCustomer.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });
    
    // 按天统计
    const dailyTrend: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyTrend[key] = 0;
    }
    recentCustomers.forEach(c => {
      const key = c.createdAt.toISOString().split('T')[0];
      if (dailyTrend[key] !== undefined) {
        dailyTrend[key]++;
      }
    });
    
    res.json({
      code: 0,
      data: {
        totalCustomers,
        activeCustomers,
        overdueFollowUps,
        todayReminders,
        levelDistribution: levelDistribution.map(d => ({ level: d.level || '未分类', count: d._count })),
        sourceDistribution: sourceDistribution.map(d => ({ source: d.source || '未知', count: d._count })),
        dailyTrend: Object.entries(dailyTrend).map(([date, count]) => ({ date, count }))
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
