/**
 * 统计数据API
 * 管理员统计 → /admin/*  客户统计 → /overview, /trend, /dashboard
 */
import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';

const router = Router();

// ── 管理员专用统计 ──
const adminRouter = Router();
adminRouter.use(adminMiddleware);

adminRouter.get('/overview', async (_req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalUsers, totalAgents, totalCustomers, todayActive] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count({ where: { status: 'active' } }),
      prisma.userAgentRelation.count(),
      prisma.user.count({ where: { updatedAt: { gte: todayStart } } }),
    ]);

    const [totalMaterials, totalShareCodes, totalRecruitmentPosts, totalAcquisitionTasks] = await Promise.all([
      prisma.material.count(),
      prisma.shareQrCode.count(),
      prisma.recruitmentPost.count(),
      prisma.acquisitionTask.count(),
    ]);

    res.json({
      code: 200, message: 'ok',
      data: { totalUsers, totalAgents, totalCustomers, todayActiveUsers: todayActive,
        totalMaterials, totalShareCodes, totalRecruitmentPosts, totalAcquisitionTasks,
        totalRevenue: 0, monthlyRevenue: 0 },
    });
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

adminRouter.get('/trend', async (_req, res) => {
  try {
    const days = Number(_req.query.days || 7);
    const trend: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const s = new Date(d); s.setHours(0, 0, 0, 0);
      const e = new Date(d); e.setHours(23, 59, 59, 999);
      const ds = s.toISOString().slice(0, 10);
      const [newUsers, apiCalls] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: s, lte: e } } }),
        prisma.material.count({ where: { createdAt: { gte: s, lte: e } } }),
      ]);
      trend.push({ date: ds, newUsers, apiCalls, revenue: 0 });
    }
    res.json({ code: 200, message: 'ok', data: trend });
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

adminRouter.get('/platforms', async (_req, res) => {
  try {
    const [media, rec, acq] = await Promise.all([
      prisma.user.count({ where: { featureSwitches: { some: { featureCode: 'media', enabled: true } } } }),
      prisma.user.count({ where: { featureSwitches: { some: { featureCode: 'recruitment', enabled: true } } } }),
      prisma.user.count({ where: { featureSwitches: { some: { featureCode: 'acquisition', enabled: true } } } }),
    ]);
    res.json({ code: 200, message: 'ok', data: [
      { name: 'AI创作工厂', count: media },
      { name: '智能招聘', count: rec },
      { name: '智能获客', count: acq },
    ]});
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

router.use('/admin', adminRouter);

// ── 客户级统计（仅需登录，自动取 userId）─-
router.get('/overview', authMiddleware, async (req: any, res) => {
  try {
    const uid = req.userId;
    const [materials, recruitments, acquisitions, shares, shareRecords] = await Promise.all([
      prisma.material.count({ where: { userId: uid } }),
      prisma.recruitmentPost.count({ where: { userId: uid } }),
      prisma.acquisitionTask.count({ where: { userId: uid } }),
      prisma.shareQrCode.count({ where: { userId: uid } }),
      prisma.shareRecord.count({ where: { userId: uid } }),
    ]);
    res.json({ code: 200, message: 'ok', data: {
      totalMaterials: materials, totalRecruitmentPosts: recruitments,
      totalAcquisitionTasks: acquisitions, totalShareCodes: shares,
      totalShareRecords: shareRecords,
    }});
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

router.get('/trend', authMiddleware, async (req: any, res) => {
  try {
    const uid = req.userId;
    const days = Number(req.query.days || 7);
    const trend: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const s = new Date(d); s.setHours(0, 0, 0, 0);
      const e = new Date(d); e.setHours(23, 59, 59, 999);
      const ds = s.toISOString().slice(0, 10);
      const cnt = await prisma.material.count({ where: { userId: uid, createdAt: { gte: s, lte: e } } });
      trend.push({ date: ds, value: cnt });
    }
    res.json({ code: 200, message: 'ok', data: trend });
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

router.get('/dashboard', authMiddleware, async (req: any, res) => {
  try {
    const uid = req.userId;
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const [materials, recruitmentPosts, acquisitionTasks, shareCodes, shareRecords] = await Promise.all([
      prisma.material.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.recruitmentPost.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.acquisitionTask.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.shareQrCode.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.shareRecord.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    res.json({ code: 200, message: 'ok', data: {
      materials: materials.map((m: any) => ({ ...m, createdAt: fmt(m.createdAt) })),
      recruitmentPosts: recruitmentPosts.map((p: any) => ({ ...p, createdAt: fmt(p.createdAt) })),
      acquisitionTasks: acquisitionTasks.map((t: any) => ({ ...t, createdAt: fmt(t.createdAt) })),
      shareCodes: shareCodes.map((s: any) => ({ ...s, createdAt: fmt(s.createdAt) })),
      shareRecords: shareRecords.map((r: any) => ({ ...r, createdAt: fmt(r.createdAt) })),
    }});
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

export default router;
