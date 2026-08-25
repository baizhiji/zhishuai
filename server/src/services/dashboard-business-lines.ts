/**
 * Dashboard 业务线聚合服务
 * 四条业务线核心KPI：AI创作工厂 + 智能招聘 + 智能获客 + 推荐分享
 */
import { prisma } from '../utils/db';

export interface BusinessLineKPI {
  name: string;
  icon: string;
  metrics: { label: string; value: number; unit: string; trend?: 'up' | 'down' | 'stable' }[];
  chartData: { label: string; value: number }[];
}

export async function getBusinessLinesSummary(userId: string): Promise<{
  overview: { totalContent: number; totalLeads: number; totalCandidates: number; totalShareRevenue: number };
  lines: BusinessLineKPI[];
}> {
  const [
    // AI创作工厂
    materialsCount,
    scriptsCount,
    // 智能招聘
    jobsCount,
    candidatesCount,
    interviewsCount,
    hiresCount,
    // 智能获客
    leadsCount,
    convertedLeadsCount,
    acquisitionTasksCount,
    // 推荐分享
    shareCodesCount,
    shareScansSum,
    sharePublishesSum,
    shareEffectsSum,
    shareCommissionSum,
    shareCommissionSettled,
  ] = await Promise.all([
    prisma.material.count({ where: { userId } }),
    0, // publishedContent model removed
    prisma.scriptTemplate.count({ where: { userId } }),

    prisma.recruitmentPost.count({ where: { userId, status: 'active' } }),
    prisma.candidate.count({ where: { userId } }),
    prisma.candidate.count({ where: { userId, status: 'interview_scheduled' } }),
    prisma.candidate.count({ where: { userId, status: 'hired' } }),

    prisma.acquisitionLead.count({ where: { userId } }),
    prisma.acquisitionLead.count({ where: { userId, status: 'converted' } }),
    prisma.acquisitionTask.count({ where: { userId } }),

    prisma.shareQrCode.count({ where: { userId } }),
    (prisma.shareQrCode.aggregate({ where: { userId }, _sum: { scanCount: true } }) as any),
    (prisma.shareQrCode.aggregate({ where: { userId }, _sum: { publishCount: true } }) as any),
    // shareEffect 通过 qrCode 关联过滤，aggregate 的嵌套 where 在部分 Prisma 版本中受限
    (prisma as any).shareEffect.aggregate({
      where: { qrCode: { userId } },
      _sum: { viewCount: true, convertCount: true, revenue: true },
    }).catch(() => ({ _sum: { viewCount: 0, convertCount: 0, revenue: 0 } })),
    (prisma as any).shareCommission.aggregate({ where: { userId }, _sum: { amount: true } }),
    (prisma as any).shareCommission.aggregate({ where: { userId, status: 'settled' }, _sum: { amount: true } }),
  ]);

  const totalScans = (shareScansSum as any)._sum?.scanCount || 0;
  const totalPublishes = (sharePublishesSum as any)._sum?.publishCount || 0;
  const totalViews = (shareEffectsSum as any)._sum?.viewCount || 0;
  const totalConverts = (shareEffectsSum as any)._sum?.convertCount || 0;
  const totalRevenue = (shareEffectsSum as any)._sum?.revenue || 0;
  const totalCommission = (shareCommissionSum as any)._sum?.amount || 0;
  const settledCommission = (shareCommissionSettled as any)._sum?.amount || 0;

  const lines: BusinessLineKPI[] = [
    {
      name: 'AI创作工厂',
      icon: 'sparkles',
      metrics: [
        { label: '素材库', value: materialsCount, unit: '个' },
        { label: '已发布内容', value: 0, unit: '条' },
        { label: 'AI脚本', value: scriptsCount, unit: '个' },
        { label: '内容总量', value: materialsCount, unit: '条', trend: 'up' },
      ],
      chartData: [
        { label: '素材', value: materialsCount },
        { label: '已发布', value: 0 },
        { label: 'AI脚本', value: scriptsCount },
      ],
    },
    {
      name: '智能招聘',
      icon: 'briefcase',
      metrics: [
        { label: '在招岗位', value: jobsCount, unit: '个' },
        { label: '候选人', value: candidatesCount, unit: '人' },
        { label: '面试中', value: interviewsCount, unit: '人' },
        { label: '已入职', value: hiresCount, unit: '人', trend: hiresCount > 0 ? 'up' : 'stable' },
      ],
      chartData: [
        { label: '岗位', value: jobsCount },
        { label: '候选人', value: candidatesCount },
        { label: '面试', value: interviewsCount },
        { label: '入职', value: hiresCount },
      ],
    },
    {
      name: '智能获客',
      icon: 'thunderbolt',
      metrics: [
        { label: '线索总量', value: leadsCount, unit: '条' },
        { label: '已转化', value: convertedLeadsCount, unit: '条' },
        { label: '采集任务', value: acquisitionTasksCount, unit: '个' },
        {
          label: '转化率',
          value: leadsCount > 0 ? Math.round((convertedLeadsCount / leadsCount) * 100) : 0,
          unit: '%',
          trend: convertedLeadsCount > 0 ? 'up' : 'stable',
        },
      ],
      chartData: [
        { label: '线索', value: leadsCount },
        { label: '已转化', value: convertedLeadsCount },
        { label: '任务', value: acquisitionTasksCount },
      ],
    },
    {
      name: '推荐分享',
      icon: 'share',
      metrics: [
        { label: '分享码', value: shareCodesCount, unit: '个' },
        { label: '扫码数', value: totalScans, unit: '次' },
        { label: '发布数', value: totalPublishes, unit: '次' },
        {
          label: '累计佣金',
          value: Math.round(totalCommission * 100) / 100,
          unit: '元',
          trend: settledCommission > 0 ? 'up' : 'stable',
        },
      ],
      chartData: [
        { label: '扫码', value: totalScans },
        { label: '发布', value: totalPublishes },
        { label: '观看', value: totalViews },
        { label: '转化', value: totalConverts },
      ],
    },
  ];

  return {
    overview: {
      totalContent: materialsCount,
      totalLeads: leadsCount,
      totalCandidates: candidatesCount,
      totalShareRevenue: Math.round(totalRevenue * 100) / 100,
    },
    lines,
  };
}

// Agent 端：获取名下所有客户的业务线汇总
export async function getAgentBusinessLinesSummary(agentUserId: string): Promise<{
  overview: { totalContent: number; totalLeads: number; totalCandidates: number; totalShareRevenue: number; customerCount: number };
  lines: BusinessLineKPI[];
}> {
  // JWT 中 agentUserId 是 User.id，而 UserAgentRelation.agentId 存的是 Agent.id，必须先转换
  const agent = await prisma.agent.findUnique({ where: { userId: agentUserId } });
  const agentId = agent?.id || agentUserId;
  // 获取该代理商的所有客户ID（通过UserAgentRelation）
  const relations = await prisma.userAgentRelation.findMany({
    where: { agentId },
    select: { userId: true },
  });
  const customerIds = relations.map(r => r.userId);

  if (customerIds.length === 0) {
    return {
      overview: { totalContent: 0, totalLeads: 0, totalCandidates: 0, totalShareRevenue: 0, customerCount: 0 },
      lines: [],
    };
  }

  const [
    materialsCount,
    jobsCount,
    candidatesCount,
    leadsCount,
    convertedLeadsCount,
    shareCodesCount,
    shareScansSum,
    shareRevenue,
  ] = await Promise.all([
    prisma.material.count({ where: { userId: { in: customerIds } } }),
    0, // publishedContent model removed
    prisma.recruitmentPost.count({ where: { userId: { in: customerIds } } }),
    prisma.candidate.count({ where: { userId: { in: customerIds } } }),
    prisma.acquisitionLead.count({ where: { userId: { in: customerIds } } }),
    prisma.acquisitionLead.count({ where: { userId: { in: customerIds }, status: 'converted' } }),
    prisma.shareQrCode.count({ where: { userId: { in: customerIds } } }),
    (prisma.shareQrCode.aggregate({
      where: { userId: { in: customerIds } },
      _sum: { scanCount: true, publishCount: true },
    }) as any),
    (prisma as any).shareEffect.aggregate({
      where: { qrCode: { userId: { in: customerIds } } },
      _sum: { revenue: true },
    }).catch(() => ({ _sum: { revenue: 0 } })),
  ]);

  const lines: BusinessLineKPI[] = [
    {
      name: 'AI创作工厂',
      icon: 'sparkles',
      metrics: [
        { label: '客户素材', value: materialsCount, unit: '个' },
        { label: '已发布', value: 0, unit: '条' },
        { label: '覆盖客户', value: customerIds.length, unit: '家' },
      ],
      chartData: [
        { label: '素材', value: materialsCount },
        { label: '已发布', value: 0 },
      ],
    },
    {
      name: '智能招聘',
      icon: 'briefcase',
      metrics: [
        { label: '在招岗位', value: jobsCount, unit: '个' },
        { label: '候选人', value: candidatesCount, unit: '人' },
        { label: '覆盖客户', value: customerIds.length, unit: '家' },
      ],
      chartData: [
        { label: '岗位', value: jobsCount },
        { label: '候选人', value: candidatesCount },
      ],
    },
    {
      name: '智能获客',
      icon: 'thunderbolt',
      metrics: [
        { label: '线索总量', value: leadsCount, unit: '条' },
        { label: '已转化', value: convertedLeadsCount, unit: '条' },
        { label: '覆盖客户', value: customerIds.length, unit: '家' },
      ],
      chartData: [
        { label: '线索', value: leadsCount },
        { label: '已转化', value: convertedLeadsCount },
      ],
    },
    {
      name: '推荐分享',
      icon: 'share',
      metrics: [
        { label: '分享码', value: shareCodesCount, unit: '个' },
        { label: '扫码数', value: (shareScansSum as any)._sum?.scanCount || 0, unit: '次' },
        { label: '覆盖客户', value: customerIds.length, unit: '家' },
      ],
      chartData: [
        { label: '分享码', value: shareCodesCount },
        { label: '扫码', value: (shareScansSum as any)._sum?.scanCount || 0 },
      ],
    },
  ];

  return {
    overview: {
      totalContent: materialsCount,
      totalLeads: leadsCount,
      totalCandidates: candidatesCount,
      totalShareRevenue: Math.round((shareRevenue._sum?.revenue || 0) * 100) / 100,
      customerCount: customerIds.length,
    },
    lines,
  };
}
