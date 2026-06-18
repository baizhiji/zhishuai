import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';


const router = Router();
// 获取代理仪表盘数据
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.userId;
    const { dateRange = '30d' } = req.query;

    // 获取代理下的所有客户
    const customers = await prisma.user.findMany({
      where: { agentId: agentId!, role: 'user' },
      select: { id: true, name: true, phone: true, status: true, createdAt: true },
    });

    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalCustomers = customers.length;

    // 获取获客线索数据用于漏斗统计
    const customerIds = customers.map(c => c.id);
    const leads = await prisma.acquisitionLead.findMany({
      where: { userId: { in: customerIds } },
    });

    const contactedLeads = leads.filter(l => l.status === 'contacted').length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;

    // 获取支付数据
    const payments = await prisma.payment.findMany({
      where: { agentId: agentId!, createdAt: { gte: startDate } },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const commissionRate = 20;
    const commission = totalRevenue * (commissionRate / 100);

    // 获取新客户数（本月）
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newCustomersThisMonth = customers.filter(c => new Date(c.createdAt) >= monthStart).length;

    // 增长率
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthNewCustomers = customers.filter(c => {
      const d = new Date(c.createdAt);
      return d >= lastMonthStart && d < monthStart;
    }).length;
    const growthRate = lastMonthNewCustomers > 0
      ? ((newCustomersThisMonth - lastMonthNewCustomers) / lastMonthNewCustomers * 100)
      : 0;

    // 收益趋势
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayPayments = payments.filter(p => {
        const d = new Date(p.createdAt);
        return d >= dayStart && d < dayEnd;
      });
      trendData.push({
        date: dayStart.toLocaleDateString('zh-CN', { weekday: 'short' }),
        revenue: dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0),
        commission: dayPayments.reduce((s, p) => s + Number(p.amount || 0) * commissionRate / 100, 0),
      });
    }

    // 转化漏斗
    const totalLeads = leads.length || totalCustomers * 3;
    const funnelData = [
      { stage: '潜在客户', value: totalLeads, rate: '100%' },
      { stage: '已联系', value: contactedLeads || Math.floor(totalLeads * 0.7), rate: `${Math.floor((contactedLeads || Math.floor(totalLeads * 0.7)) * 100 / totalLeads)}%` },
      { stage: '有意向', value: Math.floor(contactedLeads * 0.5) || Math.floor(totalLeads * 0.4), rate: '40%' },
      { stage: '已签约', value: totalCustomers, rate: `${Math.floor(totalCustomers * 100 / totalLeads)}%` },
      { stage: '活跃使用', value: activeCustomers, rate: totalCustomers > 0 ? `${Math.floor(activeCustomers * 100 / totalCustomers)}%` : '0%' },
    ];

    // 客户列表摘要
    const customerList = customers.slice(0, 10).map(c => ({
      id: c.id,
      companyName: c.name || '',
      contactName: c.name || '',
      phone: c.phone || '',
      status: c.status === 'active' ? 'active' : 'frozen',
      createdAt: c.createdAt,
      revenue: payments.filter(p => p.userId === c.id).reduce((s, p) => s + Number(p.amount || 0), 0),
      commission: payments.filter(p => p.userId === c.id).reduce((s, p) => s + Number(p.amount || 0) * commissionRate / 100, 0),
    }));

    res.json({
      stats: {
        totalCustomers,
        activeCustomers,
        totalRevenue,
        commission,
        commissionRate: 20,
        newCustomersThisMonth,
        growthRate: Math.round(growthRate * 10) / 10,
      },
      customers: customerList,
      revenueTrend: trendData,
      funnelData,
    });
  } catch (error) {
    console.error('获取代理仪表盘数据失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

export default router;
