/**
 * 统计数据API - 简化版
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Admin 管理后台统计
const adminRouter = Router();

// 获取管理后台总览统计
adminRouter.get('/overview', async (req, res) => {
  try {
    const [totalUsers, totalAgents, totalTenants, todayActive] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count(),
      prisma.tenant.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      data: {
        totalUsers,
        totalAgents,
        totalCustomers: totalTenants,
        todayActiveUsers: todayActive,
        totalMaterials: 0,
        totalPosts: 0,
        totalLeads: 0,
        totalRevenue: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取趋势数据
adminRouter.get('/trend', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const numDays = Number(days);
    
    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 模拟数据
      trendData.push({
        date: dateStr,
        newUsers: Math.floor(Math.random() * 20) + 5,
        newAgents: Math.floor(Math.random() * 5) + 1,
        newCustomers: Math.floor(Math.random() * 30) + 10,
        apiCalls: Math.floor(Math.random() * 1000) + 100,
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    
    res.json({ data: trendData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取平台分布
adminRouter.get('/platforms', async (req, res) => {
  try {
    const platforms = [
      { name: '自媒体运营', count: Math.floor(Math.random() * 100) + 50 },
      { name: '招聘助手', count: Math.floor(Math.random() * 80) + 30 },
      { name: '智能获客', count: Math.floor(Math.random() * 60) + 20 },
    ];
    
    res.json({ data: platforms });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取代理商列表（带统计数据）
adminRouter.get('/agents', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        tenants: {
          select: {
            id: true,
            companyName: true,
            paymentAmount: true,
            monthlyPayment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    res.json({ data: agents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 注册admin子路由
router.use('/admin', adminRouter);

// 获取总览统计（用户级）
router.get('/overview', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const [materialCount, recruitmentCount, acquisitionCount, shareCount] = await Promise.all([
      prisma.material.count({ where: { userId: userId as string } }),
      prisma.recruitmentPost.count({ where: { userId: userId as string } }),
      prisma.acquisitionTask.count({ where: { userId: userId as string } }),
      prisma.shareQrCode.count({ where: { userId: userId as string } }),
    ]);
    
    res.json({
      data: {
        totalMaterials: materialCount,
        totalRecruitmentPosts: recruitmentCount,
        totalAcquisitionTasks: acquisitionCount,
        totalShareCodes: shareCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取数据趋势（用户级）
router.get('/trend', async (req, res) => {
  try {
    const { userId, days = '7' } = req.query;
    const numDays = Number(days);
    
    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trendData.push({
        date: dateStr,
        value: Math.floor(Math.random() * 1000) + 100,
      });
    }
    
    res.json({ data: trendData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计看板（用户级）
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const [materials, recruitmentPosts, acquisitionTasks, shareCodes] = await Promise.all([
      prisma.material.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
      prisma.recruitmentPost.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
      prisma.acquisitionTask.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
      prisma.shareQrCode.findMany({ where: { userId: userId as string }, take: 10, orderBy: { createdAt: 'desc' } }),
    ]);
    
    res.json({
      data: {
        materials,
        recruitmentPosts,
        acquisitionTasks,
        shareCodes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
