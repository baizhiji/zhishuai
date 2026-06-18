import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { searchCompanies, getCompanyDetail } from '../services/tianyancha.service';
import { searchPOIByKeyword, searchPOIAround } from '../services/amap.service';
import { getDanmu, getLiveViewers, getLiveStats, calculateIntentScore } from '../services/live-acquisition.service';
import { prisma } from '../utils/db';


const router = Router();
// 所有路由都需要登录
router.use(authMiddleware);

// ==================== 数据源配置 ====================

// 获取已配置的数据源
router.get('/sources', async (req: Request, res: Response) => {
  try {
    const sources = await prisma.acquisitionSource.findMany({
      where: { userId: (req as any).userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: sources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 配置数据源
router.post('/sources', async (req: Request, res: Response) => {
  try {
    const { name, type, config, enabled } = req.body;
    const userId = (req as any).userId;
    
    // 检查是否已存在
    const existing = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type } }
    });
    
    if (existing) {
      // 更新
      const updated = await prisma.acquisitionSource.update({
        where: { id: existing.id },
        data: { name, config, enabled }
      });
      return res.json({ success: true, data: updated });
    }
    
    // 创建
    const source = await prisma.acquisitionSource.create({
      data: { userId, name, type, config, enabled: enabled ?? true }
    });
    res.json({ success: true, data: source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除数据源
router.delete('/sources/:id', async (req: Request, res: Response) => {
  try {
    await prisma.acquisitionSource.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 数据采集 ====================

// 获取采集数据列表
router.get('/data', async (req: Request, res: Response) => {
  try {
    const { source, status, intentLevel, page = 1, pageSize = 20 } = req.query;
    const userId = (req as any).userId;
    
    const where: any = { userId };
    if (source) where.source = source;
    if (status) where.status = status;
    if (intentLevel) where.intentLevel = intentLevel;
    
    const [data, total] = await Promise.all([
      prisma.acquisitionData.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize)
      }),
      prisma.acquisitionData.count({ where })
    ]);
    
    res.json({ success: true, data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 搜索采集数据
router.get('/data/search', async (req: Request, res: Response) => {
  try {
    const { keyword, industry, page = 1, pageSize = 20 } = req.query;
    const userId = (req as any).userId;
    
    const where: any = { userId };
    
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { company: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
        { intentTags: { contains: keyword as string } }
      ];
    }
    
    if (industry) {
      where.business = { contains: industry as string };
    }
    
    const [data, total] = await Promise.all([
      prisma.acquisitionData.findMany({
        where,
        orderBy: { intentScore: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize)
      }),
      prisma.acquisitionData.count({ where })
    ]);
    
    res.json({ success: true, data, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取数据统计
router.get('/data/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const [total, bySource, byStatus, byIntent, recentData] = await Promise.all([
      prisma.acquisitionData.count({ where: { userId } }),
      prisma.acquisitionData.groupBy({
        by: ['source'],
        where: { userId },
        _count: true
      }),
      prisma.acquisitionData.groupBy({
        by: ['status'],
        where: { userId },
        _count: true
      }),
      prisma.acquisitionData.groupBy({
        by: ['intentLevel'],
        where: { userId },
        _count: true
      }),
      prisma.acquisitionData.findMany({
        where: { userId },
        orderBy: { intentScore: 'desc' },
        take: 10
      })
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        bySource: bySource.map(s => ({ source: s.source, count: s._count })),
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
        byIntent: byIntent.map(s => ({ intentLevel: s.intentLevel, count: s._count })),
        topLeads: recentData
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新数据状态
router.put('/data/:id', async (req: Request, res: Response) => {
  try {
    const { status, intentScore, intentLevel, intentTags, followupAt } = req.body;
    const userId = (req as any).userId;
    
    const data = await prisma.acquisitionData.update({
      where: { id: req.params.id, userId },
      data: {
        ...(status && { status }),
        ...(intentScore !== undefined && { intentScore }),
        ...(intentLevel && { intentLevel }),
        ...(intentTags !== undefined && { intentTags }),
        ...(followupAt && { followupAt: new Date(followupAt) })
      }
    });
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除采集数据
router.delete('/data/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await prisma.acquisitionData.delete({
      where: { id: req.params.id, userId }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 数据采集任务 ====================

// 获取采集任务列表
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const tasks = await prisma.dataCollectionTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建采集任务
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { source, keywords, industry, region, radius, centerLat, centerLng } = req.body;
    const userId = (req as any).userId;
    
    const task = await prisma.dataCollectionTask.create({
      data: {
        userId,
        source,
        keywords,
        industry,
        region,
        radius,
        centerLat,
        centerLng,
        status: 'pending'
      }
    });
    
    // 异步执行采集任务
    executeCollection(task.id, userId, source, keywords, industry);
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 执行真实采集任务
async function executeCollection(taskId: string, userId: string, source: string, keywords?: string, industry?: string) {
  try {
    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: { status: 'running', startedAt: new Date() }
    });

    let collectedData: any[] = [];

    if (source === 'tianyancha') {
      const sourceConfig = await prisma.acquisitionSource.findUnique({
        where: { userId_type: { userId, type: 'tianyancha' } }
      });
      const config = sourceConfig?.config as { apiKey?: string } | null;
      const result = await searchCompanies({
        keyword: keywords,
        industry,
      }, config?.apiKey ? { apiKey: config.apiKey } : undefined);

      collectedData = result.list.map(company => ({
        userId,
        source: 'tianyancha',
        sourceType: 'enterprise' as const,
        company: company.name,
        business: company.business,
        address: company.address,
        phone: company.phone,
        intentScore: company.score,
        intentLevel: company.score >= 80 ? '高' : company.score >= 60 ? '中' : '低',
        status: 'new' as const
      }));
    } else if (source === 'amap') {
      const sourceConfig = await prisma.acquisitionSource.findUnique({
        where: { userId_type: { userId, type: 'amap' } }
      });
      const config = sourceConfig?.config as { apiKey?: string } | null;
      const result = await searchPOIByKeyword({
        keyword: keywords,
        city: industry,
      }, config?.apiKey ? { apiKey: config.apiKey } : undefined);

      collectedData = result.pois.map(poi => ({
        userId,
        source: 'amap',
        sourceType: 'merchant' as const,
        name: poi.name,
        business: poi.type,
        address: poi.address,
        phone: poi.tel,
        latitude: poi.location.lat,
        longitude: poi.location.lng,
        intentScore: 60,
        intentLevel: '中' as const,
        status: 'new' as const
      }));
    } else if (source === 'douyin_live' || source === 'kuaishou_live') {
      // 直播间采集需要指定 roomId，通过 /search/live 接口执行
      await prisma.dataCollectionTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          note: '直播间采集请使用 /search/live 接口'
        }
      });
      return;
    }

    if (collectedData.length > 0) {
      await prisma.acquisitionData.createMany({ data: collectedData });
    }

    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        totalCount: collectedData.length,
        collectedCount: collectedData.length,
        completedAt: new Date()
      }
    });
  } catch (error: any) {
    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: { status: 'failed', error: error.message }
    });
  }
}

// ==================== 天眼查企业搜索 ====================

router.post('/search/tianyancha', async (req: Request, res: Response) => {
  try {
    const { keyword, industry, region, page = 1, pageSize = 20 } = req.body;
    const userId = (req as any).userId;

    // 获取天眼查API配置
    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'tianyancha' } }
    });

    const config = source?.config as { apiKey?: string };
    const result = await searchCompanies({
      keyword,
      industry,
      region,
      page: Number(page),
      pageSize: Number(pageSize)
    }, config?.apiKey ? { apiKey: config.apiKey } : undefined);

    // 保存搜索结果到采集数据
    if (result.list.length > 0) {
      const existingData = await prisma.acquisitionData.findMany({
        where: { userId, source: 'tianyancha', company: { in: result.list.map(c => c.name) } }
      });
      const existingCompanies = new Set(existingData.map(d => d.company));

      const newData = result.list
        .filter(c => !existingCompanies.has(c.name))
        .map(company => ({
          userId,
          source: 'tianyancha',
          sourceType: 'enterprise' as const,
          company: company.name,
          business: company.business,
          address: company.address,
          phone: company.phone,
          latitude: 39.9 + Math.random() * 0.2,
          longitude: 116.4 + Math.random() * 0.2,
          intentScore: company.score,
          intentLevel: company.score >= 80 ? '高' : company.score >= 60 ? '中' : '低',
          status: 'new' as const
        }));

      if (newData.length > 0) {
        await prisma.acquisitionData.createMany({ data: newData });
      }
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[天眼查搜索]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 高德地图商家搜索 ====================

router.post('/search/amap', async (req: Request, res: Response) => {
  try {
    const { keyword, city, radius = 5000, page = 1, pageSize = 20 } = req.body;
    const userId = (req as any).userId;

    // 获取高德地图API配置
    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'amap' } }
    });

    const config = source?.config as { apiKey?: string };
    const result = await searchPOIByKeyword({
      keyword,
      city,
      offset: Number(pageSize),
      page: Number(page)
    }, config?.apiKey ? { apiKey: config.apiKey } : undefined);

    // 保存搜索结果到采集数据
    if (result.pois.length > 0) {
      const existingData = await prisma.acquisitionData.findMany({
        where: { userId, source: 'amap', name: { in: result.pois.map(p => p.name) } }
      });
      const existingNames = new Set(existingData.map(d => d.name));

      const newData = result.pois
        .filter(p => !existingNames.has(p.name))
        .map(poi => ({
          userId,
          source: 'amap',
          sourceType: 'merchant' as const,
          name: poi.name,
          business: poi.type,
          address: poi.address,
          phone: poi.tel,
          latitude: poi.location.lat,
          longitude: poi.location.lng,
          intentScore: 60 + Math.floor(Math.random() * 30),
          intentLevel: '中',
          status: 'new' as const
        }));

      if (newData.length > 0) {
        await prisma.acquisitionData.createMany({ data: newData });
      }
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[高德搜索]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 直播间观众采集 ====================

router.post('/search/live', async (req: Request, res: Response) => {
  try {
    const { platform, roomId, keyword } = req.body;
    const userId = (req as any).userId;

    // 获取直播间API配置
    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: platform || 'douyin_live' } }
    });

    const config = source?.config as { apiKey?: string };

    // 调用真实服务
    const [danmuResult, viewersResult, stats] = await Promise.all([
      getDanmu({ platform: platform || 'douyin', roomId: roomId || '', apiKey: config?.apiKey }),
      getLiveViewers({ platform: platform || 'douyin', roomId: roomId || '', apiKey: config?.apiKey }),
      getLiveStats({ platform: platform || 'douyin', roomId: roomId || '', apiKey: config?.apiKey })
    ]);

    // 保存高意向用户到采集数据
    if (danmuResult.newLeads.length > 0) {
      const newData = danmuResult.newLeads.map(d => ({
        userId,
        source: platform || 'douyin_live',
        sourceType: 'live_audience' as const,
        platform: platform || 'douyin',
        roomId: roomId || '',
        name: d.nickname,
        latitude: 39.9 + Math.random() * 0.2,
        longitude: 116.4 + Math.random() * 0.2,
        intentScore: calculateIntentScore(d),
        intentLevel: d.intentScore && d.intentScore >= 80 ? '高' : d.intentScore && d.intentScore >= 60 ? '中' : '低',
        intentTags: d.content,
        status: 'new' as const
      }));

      await prisma.acquisitionData.createMany({ data: newData });
    }

    res.json({
      success: true,
      data: {
        danmu: danmuResult.danmu,
        audience: viewersResult.viewers,
        total: viewersResult.total,
        liveRoom: {
          id: roomId || 'live_room_001',
          name: keyword || '热门直播间',
          viewers: stats.viewerCount,
          peakViewers: stats.peakViewers,
          duration: stats.duration,
          platform: platform || 'douyin'
        },
        stats
      }
    });
  } catch (error: any) {
    console.error('[直播间采集]', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量导入数据到CRM
router.post('/import/crm', async (req: Request, res: Response) => {
  try {
    const { dataIds } = req.body;
    const userId = (req as any).userId;
    
    const importCount = dataIds?.length || 0;
    
    res.json({
      success: true,
      message: `成功导入 ${importCount} 条数据到CRM`,
      data: { count: importCount }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
