import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
<<<<<<< HEAD
=======
import { authMiddleware } from '../middleware/auth';
>>>>>>> 962968886be726cd434c792933b5515366d34518

const router = Router();
const prisma = new PrismaClient();

// 获取客户列表
router.get('/customers', async (req, res) => {
  try {
<<<<<<< HEAD
    const { userId, page = '1', pageSize = '20' } = req.query;
    const where = userId ? { userId: userId as string } : {};
=======
    const { page = '1', pageSize = '20', keyword, status, level } = req.query;
    const userId = (req as any).user?.id;
    
    // 构建查询条件
    const where: any = {};
    
    // 如果不是管理员，只看自己的客户
    if (userId && (req as any).user?.role !== 'admin') {
      where.userId = userId;
    }
    
    // 关键字搜索
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
        { company: { contains: keyword as string } },
      ];
    }
    
    // 状态筛选
    if (status) {
      where.status = status;
    }
    
    // 等级筛选
    if (level) {
      where.level = level;
    }
>>>>>>> 962968886be726cd434c792933b5515366d34518
    
    const customers = await prisma.crmCustomer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });
    
    const total = await prisma.crmCustomer.count({ where });
    
    res.json({ 
<<<<<<< HEAD
      data: customers,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      }
    });
  } catch (error: any) {
=======
      data: {
        list: customers,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      }
    });
  } catch (error: any) {
    console.error('获取客户列表失败:', error);
>>>>>>> 962968886be726cd434c792933b5515366d34518
    res.status(500).json({ error: error.message });
  }
});

// 获取单个客户详情
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.crmCustomer.findUnique({
      where: { id: req.params.id },
    });
    
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    
    res.json({ data: customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建客户
router.post('/customers', async (req, res) => {
  try {
<<<<<<< HEAD
    const { userId, name, phone, email, company, industry, status, level, tags, remark } = req.body;
    
    // @ts-ignore
=======
    const userId = (req as any).user?.id;
    const { name, phone, wechat, company, position, source, level, status, remark } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }
    
>>>>>>> 962968886be726cd434c792933b5515366d34518
    const customer = await prisma.crmCustomer.create({
      data: {
        userId,
        name,
        phone,
<<<<<<< HEAD
        company,
        status: status || 'potential',
        level: level || 'normal',
=======
        wechat,
        company,
        position,
        source,
        level: level || 'C',
        status: status || 'potential',
>>>>>>> 962968886be726cd434c792933b5515366d34518
        remark: remark || '',
      },
    });
    
    res.json({ data: customer, message: '客户创建成功' });
  } catch (error: any) {
<<<<<<< HEAD
=======
    console.error('创建客户失败:', error);
>>>>>>> 962968886be726cd434c792933b5515366d34518
    res.status(500).json({ error: error.message });
  }
});

// 更新客户
router.put('/customers/:id', async (req, res) => {
  try {
<<<<<<< HEAD
    const { name, phone, company, status, level, remark } = req.body;
=======
    const { name, phone, wechat, company, position, source, level, status, remark } = req.body;
>>>>>>> 962968886be726cd434c792933b5515366d34518
    
    const customer = await prisma.crmCustomer.update({
      where: { id: req.params.id },
      data: {
        name,
        phone,
<<<<<<< HEAD
        company,
        status,
        level,
=======
        wechat,
        company,
        position,
        source,
        level,
        status,
>>>>>>> 962968886be726cd434c792933b5515366d34518
        remark,
      },
    });
    
    res.json({ data: customer, message: '客户更新成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除客户
router.delete('/customers/:id', async (req, res) => {
  try {
    await prisma.crmCustomer.delete({
      where: { id: req.params.id },
    });
    
    res.json({ message: '客户删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

<<<<<<< HEAD
=======
// 获取客户的跟进记录
router.get('/customers/:id/follow-ups', async (req, res) => {
  try {
    const followUps = await prisma.crmFollowUp.findMany({
      where: { customerId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ data: { list: followUps } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 添加跟进记录
router.post('/customers/:id/follow-ups', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { type, content, nextPlan, nextFollowUpAt } = req.body;
    
    // 创建跟进记录
    const followUp = await prisma.crmFollowUp.create({
      data: {
        customerId: req.params.id,
        type,
        content,
        nextPlan,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        createdBy: userId || '',
      },
    });
    
    // 更新客户的最后联系时间
    await prisma.crmCustomer.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });
    
    res.json({ data: followUp, message: '跟进记录添加成功' });
  } catch (error: any) {
    console.error('添加跟进记录失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取我的统计数据
router.get('/my-stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      totalCustomers,
      newThisMonth,
      activeCustomers,
      potentialCustomers,
    ] = await Promise.all([
      prisma.crmCustomer.count({ where: { userId } }),
      prisma.crmCustomer.count({ 
        where: { 
          userId,
          createdAt: { gte: startOfMonth },
        } 
      }),
      prisma.crmCustomer.count({ 
        where: { 
          userId,
          status: 'active',
        } 
      }),
      prisma.crmCustomer.count({ 
        where: { 
          userId,
          status: 'potential',
        } 
      }),
    ]);
    
    res.json({
      data: {
        totalCustomers,
        newThisMonth,
        activeCustomers,
        potentialCustomers,
        totalRevenue: 0,
      }
    });
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取公海池客户
router.get('/public-pool', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', keyword } = req.query;
    
    // 公海池定义：30天未跟进的潜在客户
    const poolDeadline = new Date();
    poolDeadline.setDate(poolDeadline.getDate() - 30);
    
    const where: any = {
      status: 'potential',
      updatedAt: { lt: poolDeadline },
    };
    
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
        { company: { contains: keyword as string } },
      ];
    }
    
    const customers = await prisma.crmCustomer.findMany({
      where,
      orderBy: { updatedAt: 'asc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });
    
    const total = await prisma.crmCustomer.count({ where });
    
    res.json({
      data: {
        list: customers,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      }
    });
  } catch (error: any) {
    console.error('获取公海池失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 认领公海客户
router.post('/customers/:id/claim', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }
    
    await prisma.crmCustomer.update({
      where: { id: req.params.id },
      data: {
        userId,
        updatedAt: new Date(),
      },
    });
    
    res.json({ message: '认领成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 放入公海
router.post('/customers/:id/release', async (req, res) => {
  try {
    // 放入公海：将客户释放（设置特殊标记或删除userId关联）
    await prisma.crmCustomer.update({
      where: { id: req.params.id },
      data: {
        status: 'potential',
        updatedAt: new Date(),
      },
    });
    
    res.json({ message: '已放入公海' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

>>>>>>> 962968886be726cd434c792933b5515366d34518
export default router;
