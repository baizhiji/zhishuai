import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

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
    
    // 模拟异步采集任务
    simulateCollection(task.id, userId, source, keywords, industry);
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 模拟采集任务（实际应调用第三方API）
async function simulateCollection(taskId: string, userId: string, source: string, keywords?: string, industry?: string) {
  try {
    // 更新任务状态为运行中
    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: { status: 'running', startedAt: new Date() }
    });
    
    // 模拟采集数据
    const mockData = generateMockData(source, keywords, industry);
    
    // 保存采集的数据
    if (mockData.length > 0) {
      await prisma.acquisitionData.createMany({
        data: mockData.map(item => ({
          userId,
          ...item
        }))
      });
      
      // 更新任务统计
      await prisma.dataCollectionTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          totalCount: mockData.length,
          collectedCount: mockData.length,
          completedAt: new Date()
        }
      });
    } else {
      await prisma.dataCollectionTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });
    }
  } catch (error: any) {
    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: { status: 'failed', error: error.message }
    });
  }
}

// 生成模拟数据
function generateMockData(source: string, keywords?: string, industry?: string) {
  const data: any[] = [];
  const count = Math.floor(Math.random() * 10) + 5;
  
  const platforms = ['douyin', 'kuaishou', 'xiaohongshu', 'weibo'];
  const intents = ['高意向', '中意向', '低意向', '待确认'];
  const tags = ['行业咨询', '产品询价', '合作意向', '价格对比', '品牌了解', '竞品对比'];
  
  for (let i = 0; i < count; i++) {
    const intentScore = Math.floor(Math.random() * 40) + 60;
    const intentLevel = intentScore >= 80 ? '高' : intentScore >= 60 ? '中' : '低';
    
    if (source === 'douyin_live' || source === 'kuaishou_live') {
      data.push({
        source,
        sourceType: 'live_audience',
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        roomId: `room_${Date.now()}_${i}`,
        roomName: keywords || '热门直播间',
        name: `用户${1000 + i}`,
        intentScore,
        intentLevel,
        intentTags: tags.slice(0, Math.floor(Math.random() * 3) + 1).join(','),
        status: 'new'
      });
    } else if (source === 'tianyancha') {
      data.push({
        source,
        sourceType: 'enterprise',
        company: keywords ? `${keywords}科技公司` : `示例公司${i}`,
        business: industry || '互联网服务',
        address: `北京市朝阳区建国路${88 + i}号`,
        latitude: 39.9 + Math.random() * 0.1,
        longitude: 116.4 + Math.random() * 0.1,
        employeeCount: ['50-100人', '100-500人', '500-1000人'][Math.floor(Math.random() * 3)],
        intentScore,
        intentLevel,
        intentTags: tags.slice(0, Math.floor(Math.random() * 3) + 1).join(','),
        status: 'new'
      });
    } else if (source === 'amap') {
      data.push({
        source,
        sourceType: 'merchant',
        name: `商家${1000 + i}`,
        phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        address: keywords || `商业街${i}号`,
        latitude: 39.9 + Math.random() * 0.1,
        longitude: 116.4 + Math.random() * 0.1,
        business: industry || '零售服务',
        intentScore,
        intentLevel,
        intentTags: tags.slice(0, Math.floor(Math.random() * 3) + 1).join(','),
        status: 'new'
      });
    }
  }
  
  return data;
}

// ==================== 天眼查企业搜索 ====================

router.post('/search/tianyancha', async (req: Request, res: Response) => {
  try {
    const { keyword, industry, region, page = 1, pageSize = 20 } = req.body;
    const userId = (req as any).userId;
    
    // 检查是否配置了天眼查API
    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'tianyancha' } }
    });
    
    // 模拟天眼查搜索结果
    const mockResults = [];
    const count = Math.min(Number(pageSize), 10);
    
    for (let i = 0; i < count; i++) {
      mockResults.push({
        name: `${keyword || '企业'}${i + 1}`,
        legalPerson: `张${['伟', '磊', '鹏', '强', '军'][i % 5]}`,
        registeredCapital: `${[100, 500, 1000, 5000][i % 4]}万`,
        employeeCount: ['50-99', '100-499', '500-999', '1000+'][i % 4],
        business: industry || '技术服务',
        address: region || '北京市朝阳区',
        phone: `010-${String(Math.floor(Math.random() * 9000000 + 1000000))}`,
        status: '存续',
        score: Math.floor(Math.random() * 30) + 70
      });
    }
    
    res.json({
      success: true,
      data: {
        list: mockResults,
        total: 100,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 高德地图商家搜索 ====================

router.post('/search/amap', async (req: Request, res: Response) => {
  try {
    const { keyword, city, radius = 5000, page = 1, pageSize = 20 } = req.body;
    const userId = (req as any).userId;
    
    // 检查是否配置了高德地图API
    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'amap' } }
    });
    
    // 模拟高德地图搜索结果
    const mockResults = [];
    const count = Math.min(Number(pageSize), 10);
    
    for (let i = 0; i < count; i++) {
      mockResults.push({
        id: `amap_${Date.now()}_${i}`,
        name: `${keyword || '商家'}${i + 1}`,
        address: `${city || '北京市'}${['朝阳区', '海淀区', '东城区', '西城区'][i % 4]}`,
        location: {
          lat: 39.9 + Math.random() * 0.2,
          lng: 116.4 + Math.random() * 0.2
        },
        tel: `400-${String(Math.floor(Math.random() * 9000000 + 1000000)).slice(0, 7)}`,
        type: ['美食', '酒店', '购物', '娱乐', '教育'][i % 5],
        distance: Math.floor(Math.random() * Number(radius))
      });
    }
    
    res.json({
      success: true,
      data: {
        pois: mockResults,
        count: 50,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 直播间观众采集 ====================

router.post('/search/live', async (req: Request, res: Response) => {
  try {
    const { platform, roomId, keyword } = req.body;
    const userId = (req as any).userId;
    
    // 模拟直播间观众数据
    const mockAudience = [];
    const count = 10;
    
    const platforms = ['douyin', 'kuaishou'];
    
    for (let i = 0; i < count; i++) {
      mockAudience.push({
        id: `user_${Date.now()}_${i}`,
        nickname: `用户${Math.floor(Math.random() * 10000)}`,
        platform: platform || platforms[i % 2],
        roomId: roomId || 'live_room_001',
        comment: keyword ? `这条视频很好，关注了` : ['想要这个链接', '怎么买', '多少钱', '很好'][i % 4],
        intent: ['高', '中', '低'][i % 3],
        score: Math.floor(Math.random() * 30) + 70
      });
    }
    
    res.json({
      success: true,
      data: {
        audience: mockAudience,
        total: 100,
        liveRoom: {
          id: roomId || 'live_room_001',
          name: keyword || '热门直播间',
          viewers: Math.floor(Math.random() * 10000) + 1000,
          platform: platform || 'douyin'
        }
      }
    });
  } catch (error: any) {
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
