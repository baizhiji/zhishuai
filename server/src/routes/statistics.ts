/**
 * 统计数据API - 简化版
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取总览统计
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

// 获取数据趋势
router.get('/trend', async (req, res) => {
  try {
    const { userId, days = '7' } = req.query;
    const numDays = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    
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

// 获取统计看板
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
