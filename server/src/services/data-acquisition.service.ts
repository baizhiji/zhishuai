/**
 * 数据采集服务层
 * 封装数据源管理、采集任务执行、模拟数据生成的业务逻辑
 */
import { PrismaClient } from '@prisma/client';
import { searchCompanies } from './tianyancha.service';
import { searchPOIByKeyword } from './amap.service';
import { getDanmu, getLiveViewers, getLiveStats, calculateIntentScore } from './live-acquisition.service';

const prisma = new PrismaClient();

// ─── 类型 ───
export interface SourceConfig {
  type: string;
  name?: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export interface ListParams {
  source?: string;
  status?: string;
  intentLevel?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchParams {
  keyword?: string;
  industry?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTaskInput {
  source: string;
  keywords?: string;
  industry?: string;
  region?: string;
  radius?: number;
  centerLat?: number;
  centerLng?: number;
}

// ─── 数据源管理 ───
export async function getSourceConfig(userId: string) {
  const sources = await prisma.acquisitionSource.findMany({
    where: { userId },
    select: { type: true, config: true, enabled: true },
  });
  const config: Record<string, unknown> = {};
  sources.forEach(s => { config[s.type] = s.config; });
  return config;
}

export async function saveSourceConfig(userId: string, sources: SourceConfig[]) {
  for (const source of sources) {
    const existing = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: source.type } },
    });

    if (existing) {
      await prisma.acquisitionSource.update({
        where: { id: existing.id },
        data: { config: (source.config as Record<string, unknown>) || {}, enabled: source.enabled ?? true },
      });
    } else {
      await prisma.acquisitionSource.create({
        data: {
          userId,
          name: source.name || source.type,
          type: source.type,
          config: (source.config as Record<string, unknown>) || {},
          enabled: source.enabled ?? true,
        },
      });
    }
  }
}

export async function getSourcesList(userId: string) {
  return prisma.acquisitionSource.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function upsertSource(userId: string, input: SourceConfig) {
  const { type, name, config, enabled } = input;
  const existing = await prisma.acquisitionSource.findUnique({
    where: { userId_type: { userId, type } },
  });

  if (existing) {
    return prisma.acquisitionSource.update({
      where: { id: existing.id },
      data: { name, config: (config as Record<string, unknown>), enabled },
    });
  }

  return prisma.acquisitionSource.create({
    data: { userId, name, type, config: (config as Record<string, unknown>), enabled: enabled ?? true },
  });
}

export async function deleteSource(id: string) {
  await prisma.acquisitionSource.delete({ where: { id } });
  return true;
}

// ─── 数据查询 ───
export async function getAcquisitionData(userId: string, params: ListParams) {
  const { source, status, intentLevel, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = { userId };
  if (source) where.source = source;
  if (status) where.status = status;
  if (intentLevel) where.intentLevel = intentLevel;

  const [data, total] = await Promise.all([
    prisma.acquisitionData.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.acquisitionData.count({ where }),
  ]);

  return { list: data, total, page, pageSize };
}

export async function searchAcquisitionData(userId: string, params: SearchParams) {
  const { keyword, industry, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = { userId };

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { company: { contains: keyword } },
      { phone: { contains: keyword } },
      { intentTags: { contains: keyword } },
    ];
  }
  if (industry) {
    where.business = { contains: industry };
  }

  const [data, total] = await Promise.all([
    prisma.acquisitionData.findMany({
      where,
      orderBy: { intentScore: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.acquisitionData.count({ where }),
  ]);

  return { list: data, total, page, pageSize };
}

export async function getDataStats(userId: string) {
  const [total, bySource, byStatus, byIntent, topLeads] = await Promise.all([
    prisma.acquisitionData.count({ where: { userId } }),
    prisma.acquisitionData.groupBy({ by: ['source'], where: { userId }, _count: true }),
    prisma.acquisitionData.groupBy({ by: ['status'], where: { userId }, _count: true }),
    prisma.acquisitionData.groupBy({ by: ['intentLevel'], where: { userId }, _count: true }),
    prisma.acquisitionData.findMany({
      where: { userId },
      orderBy: { intentScore: 'desc' },
      take: 10,
    }),
  ]);

  return {
    total,
    bySource: bySource.map(s => ({ source: s.source, count: s._count })),
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
    byIntent: byIntent.map(s => ({ intentLevel: s.intentLevel, count: s._count })),
    topLeads,
  };
}

export async function updateDataItem(id: string, userId: string, updates: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  if (updates.status) data.status = updates.status;
  if (updates.intentScore !== undefined) data.intentScore = updates.intentScore;
  if (updates.intentLevel) data.intentLevel = updates.intentLevel;
  if (updates.intentTags !== undefined) data.intentTags = updates.intentTags;
  if (updates.followupAt) data.followupAt = new Date(updates.followupAt as string);

  return prisma.acquisitionData.update({
    where: { id, userId },
    data,
  });
}

export async function deleteDataItem(id: string, userId: string) {
  await prisma.acquisitionData.delete({ where: { id, userId } });
  return true;
}

// ─── 采集任务 ───
export async function getTasksList(userId: string) {
  return prisma.dataCollectionTask.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCollectionTask(userId: string, input: CreateTaskInput) {
  const { source, keywords, industry, region, radius, centerLat, centerLng } = input;

  const task = await prisma.dataCollectionTask.create({
    data: {
      userId, source, keywords, industry, region,
      radius, centerLat, centerLng,
      status: 'pending',
    },
  });

  // 异步执行采集（不阻塞响应）
  executeCollectionTask(task.id, userId, source, keywords, industry);

  return task;
}

// ─── 采集任务执行（内部） ───
async function executeCollectionTask(
  taskId: string,
  userId: string,
  source: string,
  keywords?: string,
  industry?: string
) {
  try {
    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: { status: 'running', startedAt: new Date() },
    });

    const mockData = generateMockCollectionData(source, keywords, industry);

    if (mockData.length > 0) {
      const items = mockData.map(item => ({ userId, ...item }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.acquisitionData.createMany({ data: items as any[] });

      await prisma.dataCollectionTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          totalCount: mockData.length,
          collectedCount: mockData.length,
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.dataCollectionTask.update({
        where: { id: taskId },
        data: { status: 'completed', completedAt: new Date() },
      });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '未知错误';
    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: { status: 'failed', error: errMsg },
    });
  }
}

// ─── 模拟数据生成（内部） ───
function generateMockCollectionData(
  source: string,
  keywords?: string,
  industry?: string
): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const count = Math.floor(Math.random() * 10) + 5;
  const platforms = ['douyin', 'kuaishou', 'xiaohongshu', 'weibo'];
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
        status: 'new',
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
        status: 'new',
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
        status: 'new',
      });
    }
  }

  return data;
}

// ─── 外部搜索集成 ───
export async function searchTianyancha(
  userId: string,
  params: { keyword: string; industry?: string; region?: string; page?: number; pageSize?: number }
) {
  const { keyword, industry, region, page = 1, pageSize = 20 } = params;
  const source = await prisma.acquisitionSource.findUnique({
    where: { userId_type: { userId, type: 'tianyancha' } },
  });
  const config = source?.config as { apiKey?: string } | null;

  const result = await searchCompanies(
    { keyword, industry, region, page, pageSize },
    config?.apiKey ? { apiKey: config.apiKey } : undefined,
  );

  if (result.list.length > 0) {
    const existingData = await prisma.acquisitionData.findMany({
      where: { userId, source: 'tianyancha', company: { in: result.list.map(c => c.name) } },
    });
    const existingCompanies = new Set(existingData.map(d => d.company));

    const newData = result.list
      .filter(c => !existingCompanies.has(c.name))
      .map(company => ({
        userId,
        source: 'tianyancha' as const,
        sourceType: 'enterprise' as const,
        company: company.name,
        business: company.business,
        address: company.address,
        phone: company.phone,
        latitude: 39.9 + Math.random() * 0.2,
        longitude: 116.4 + Math.random() * 0.2,
        intentScore: company.score,
        intentLevel: company.score >= 80 ? '高' : company.score >= 60 ? '中' : '低',
        status: 'new' as const,
      }));

    if (newData.length > 0) {
      await prisma.acquisitionData.createMany({ data: newData });
    }
  }

  return result;
}

export async function searchAmapPOI(
  userId: string,
  params: { keyword: string; city?: string; radius?: number; page?: number; pageSize?: number }
) {
  const { keyword, city, radius = 5000, page = 1, pageSize = 20 } = params;
  const source = await prisma.acquisitionSource.findUnique({
    where: { userId_type: { userId, type: 'amap' } },
  });
  const config = source?.config as { apiKey?: string } | null;

  const result = await searchPOIByKeyword(
    { keyword, city, offset: pageSize, page },
    config?.apiKey ? { apiKey: config.apiKey } : undefined,
  );

  if (result.pois.length > 0) {
    const existingData = await prisma.acquisitionData.findMany({
      where: { userId, source: 'amap', name: { in: result.pois.map(p => p.name) } },
    });
    const existingNames = new Set(existingData.map(d => d.name));

    const newData = result.pois
      .filter(p => !existingNames.has(p.name))
      .map(poi => ({
        userId,
        source: 'amap' as const,
        sourceType: 'merchant' as const,
        name: poi.name,
        business: poi.type,
        address: poi.address,
        phone: poi.tel,
        latitude: poi.location.lat,
        longitude: poi.location.lng,
        intentScore: 60 + Math.floor(Math.random() * 30),
        intentLevel: '中' as const,
        status: 'new' as const,
      }));

    if (newData.length > 0) {
      await prisma.acquisitionData.createMany({ data: newData });
    }
  }

  return result;
}

export async function searchLiveAudience(
  userId: string,
  params: { platform: string; roomId: string; keyword?: string }
) {
  const { platform, roomId, keyword } = params;
  const source = await prisma.acquisitionSource.findUnique({
    where: { userId_type: { userId, type: platform || 'douyin_live' } },
  });
  const config = source?.config as { apiKey?: string } | null;

  const [danmuResult, viewersResult, stats] = await Promise.all([
    getDanmu({ platform: platform || 'douyin', roomId: roomId || '', apiKey: config?.apiKey }),
    getLiveViewers({ platform: platform || 'douyin', roomId: roomId || '', apiKey: config?.apiKey }),
    getLiveStats({ platform: platform || 'douyin', roomId: roomId || '', apiKey: config?.apiKey }),
  ]);

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
      status: 'new' as const,
    }));

    await prisma.acquisitionData.createMany({ data: newData });
  }

  return {
    danmu: danmuResult.danmu,
    audience: viewersResult.viewers,
    total: viewersResult.total,
    liveRoom: {
      id: roomId || 'live_room_001',
      name: keyword || '热门直播间',
      viewers: stats.viewerCount,
      peakViewers: stats.peakViewers,
      duration: stats.duration,
      platform: platform || 'douyin',
    },
    stats,
  };
}

// ─── 错误类 ───
export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
