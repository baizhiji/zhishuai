import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取客户列表
router.get('/customers', async (req, res) => {
  try {
    const { userId, page = '1', pageSize = '20' } = req.query;
    const where = userId ? { userId: userId as string } : {};
    
    const customers = await prisma.crmCustomer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });
    
    const total = await prisma.crmCustomer.count({ where });
    
    res.json({ 
      data: customers,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      }
    });
  } catch (error: any) {
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
    const { userId, name, phone, email, company, industry, status, level, tags, remark } = req.body;
    
    const customer = await prisma.crmCustomer.create({
      data: {
        userId,
        name,
        phone,
        email,
        company,
        industry,
        status: status || 'potential',
        level: level || 'normal',
        tags: tags || '',
        remark: remark || '',
      },
    });
    
    res.json({ data: customer, message: '客户创建成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新客户
router.put('/customers/:id', async (req, res) => {
  try {
    const { name, phone, email, company, industry, status, level, tags, remark } = req.body;
    
    const customer = await prisma.crmCustomer.update({
      where: { id: req.params.id },
      data: {
        name,
        phone,
        email,
        company,
        industry,
        status,
        level,
        tags,
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

export default router;
