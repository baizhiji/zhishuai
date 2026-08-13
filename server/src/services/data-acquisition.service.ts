/**
 * 数据采集服务层
 * 封装数据源管理、采集任务执行的业务逻辑
 */
import { searchCompanies } from './tianyancha.service';
import { searchPOIByKeyword } from './amap.service';
import { getDanmu, getLiveViewers, getLiveStats, calculateIntentScore } from './live-acquisition.service';
import { prisma } from '../utils/db';

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

/** 采集到的线索数据项（对应 AcquisitionData 模型字段） */
export interface CollectedLeadItem {
  source: string;
  sourceType: string;
  name?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  company?: string;
  position?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  business?: string;
  intentScore?: number;
  intentLevel?: string;
  intentTags?: string;
  status?: string;
  platform?: string;
  roomId?: string;
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
        data: { config: (source.config as any) || {}, enabled: source.enabled ?? true },
      });
    } else {
      await prisma.acquisitionSource.create({
        data: {
          userId,
          name: source.name || source.type,
          type: source.type,
          config: (source.config as any) || {},
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
      data: { name, config: (config as any), enabled },
    });
  }

  return prisma.acquisitionSource.create({
    data: { userId, name, type, config: (config as any), enabled: enabled ?? true },
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
  await (prisma as any).acquisitionData.delete({ where: { id, userId } });
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

    // 按数据源类型调用真实采集服务
    let collected: CollectedLeadItem[] = [];

    if (source === 'tianyancha') {
      const sourceCfg = await prisma.acquisitionSource.findUnique({
        where: { userId_type: { userId, type: 'tianyancha' } },
      });
      const cfg = sourceCfg?.config as { apiKey?: string } | null;
      const result = await searchCompanies(
        { keyword: keywords || '', industry, page: 1, pageSize: 20 },
        cfg?.apiKey ? { apiKey: cfg.apiKey } : undefined,
      );
      collected = result.list.map(company => ({
        source: 'tianyancha' as const,
        sourceType: 'enterprise' as const,
        company: company.name,
        business: company.business,
        address: company.address,
        phone: company.phone,
        latitude: 0,
        longitude: 0,
        intentScore: company.score,
        intentLevel: company.score >= 80 ? '高' as const : company.score >= 60 ? '中' as const : '低' as const,
        status: 'new' as const,
      }));
    } else if (source === 'amap') {
      const sourceCfg = await prisma.acquisitionSource.findUnique({
        where: { userId_type: { userId, type: 'amap' } },
      });
      const cfg = sourceCfg?.config as { apiKey?: string } | null;
      const result = await searchPOIByKeyword(
        { keyword: keywords || '', offset: 20, page: 1 },
        cfg?.apiKey ? { apiKey: cfg.apiKey } : undefined,
      );
      collected = result.pois.map(poi => ({
        source: 'amap' as const,
        sourceType: 'merchant' as const,
        name: poi.name,
        business: poi.type,
        address: poi.address,
        phone: poi.tel,
        latitude: poi.location.lat,
        longitude: poi.location.lng,
        intentScore: 50,
        intentLevel: '中' as const,
        status: 'new' as const,
      }));
    } else if (source === 'douyin_live' || source === 'kuaishou_live') {
      const sourceCfg = await prisma.acquisitionSource.findUnique({
        where: { userId_type: { userId, type: source } },
      });
      const cfg = sourceCfg?.config as { apiKey?: string } | null;
      const platform = source === 'douyin_live' ? 'douyin' : 'kuaishou';
      const roomId = (sourceCfg?.config as any)?.roomId || '';
      const danmuResult = await getDanmu({
        platform: platform as any,
        roomId: roomId || '',
        apiKey: cfg?.apiKey,
      });
      collected = danmuResult.newLeads.map(d => ({
        source,
        sourceType: 'live_audience' as const,
        platform,
        roomId: roomId || '',
        name: d.nickname,
        latitude: 0,
        longitude: 0,
        intentScore: calculateIntentScore(d),
        intentLevel: (d.intentScore ?? 0) >= 80 ? '高' as const : (d.intentScore ?? 0) >= 60 ? '中' as const : '低' as const,
        intentTags: d.content,
        status: 'new' as const,
      }));
    }

    // 已存在数据去重
    const existing = await prisma.acquisitionData.findMany({
      where: { userId, source },
      select: { company: true, name: true },
    });
    const existingKeys = new Set(
      existing.map(e => e.company || e.name || '').filter(Boolean)
    );
    const newItems = collected.filter(item => {
      const key = String(item.company || item.name || '');
      return key ? !existingKeys.has(key) : true;
    });

    if (newItems.length > 0) {
      await prisma.acquisitionData.createMany({
        data: newItems.map(item => ({ userId, ...item })),
      });
    }

    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        totalCount: newItems.length,
        collectedCount: newItems.length,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '未知错误';
    await prisma.dataCollectionTask.update({
      where: { id: taskId },
      data: { status: 'failed', error: errMsg },
    });
  }
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
        latitude: 0,
        longitude: 0,
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
        intentScore: 50,
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
    getDanmu({ platform: (platform || 'douyin') as any, roomId: roomId || '', apiKey: config?.apiKey }),
    getLiveViewers({ platform: (platform || 'douyin') as any, roomId: roomId || '', apiKey: config?.apiKey }),
    getLiveStats({ platform: (platform || 'douyin') as any, roomId: roomId || '', apiKey: config?.apiKey }),
  ] as any);

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
