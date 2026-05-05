import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取总览统计
router.get('/overview', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // 获取各模块统计数据
    const [
      materialCount,
      recruitmentCount,
      acquisitionCount,
      shareCount,
    ] = await Promise.all([
      prisma.material.count({ where: { userId: userId as string } }),
      prisma.recruitmentPost.count({ where: { userId: userId as string } }),
      prisma.acquisitionTask.count({ where: { userId: userId as string } }),
      prisma.shareCode.count({ where: { userId: userId as string } }),
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

// 获取数据趋势
router.get('/trend', async (req, res) => {
  try {
    const { userId, days = '7' } = req.query;
    const numDays = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    
    // 生成最近N天的日期数据
    const trendData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trendData.push({
        date: dateStr,
        views: Math.floor(Math.random() * 1000) + 100,
        likes: Math.floor(Math.random() * 500) + 50,
        comments: Math.floor(Math.random() * 100) + 10,
        shares: Math.floor(Math.random() * 50) + 5,
      });
    }
    
    res.json({ data: trendData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取热门内容
router.get('/popular', async (req, res) => {
  try {
    const { userId, limit = '10' } = req.query;
    
    const materials = await prisma.material.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
    
    res.json({ data: materials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取平台分布
router.get('/platforms', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // 模拟平台分布数据
    const platforms = [
      { name: '抖音', count: 1250, percentage: 35 },
      { name: '小红书', count: 980, percentage: 28 },
      { name: '视频号', count: 750, percentage: 21 },
      { name: '快手', count: 580, percentage: 16 },
    ];
    
    res.json({ data: platforms });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
