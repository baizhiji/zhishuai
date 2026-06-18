/**
 * 报表 API 路由 - 已添加权限校验
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 报表类型枚举
const REPORT_TYPES: Record<string, string> = {
  users: '用户报表',
  materials: '素材报表',
  posts: '发布报表',
  recruitment: '招聘报表',
  acquisition: '获客报表',
  api_usage: 'API使用报表',
};

// 生成报表
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const prisma = (req as any).prisma;
    const { type, startDate, endDate, format = 'json' } = req.body;

    if (!type || !REPORT_TYPES[type]) {
      return res.status(400).json({ error: '无效的报表类型' });
    }

    const where: any = { userId };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    let data: any[] = [];
    const reportName = REPORT_TYPES[type];

    switch (type) {
      case 'materials': {
        const materials = await prisma.material.findMany({
          where,
          select: { id: true, title: true, type: true, category: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
        data = materials.map((m: any) => ({
          素材ID: m.id, 标题: m.title, 类型: m.type,
          分类: m.category || '-', 状态: m.status === 'used' ? '已使用' : '未使用',
          创建时间: m.createdAt?.toLocaleString('zh-CN'),
        }));
        break;
      }
      case 'posts': {
        const posts = await prisma.publishRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        data = posts.map((p: any) => ({
          记录ID: p.id, 平台: p.platform, 状态: p.status,
          创建时间: p.createdAt?.toLocaleString('zh-CN'),
        }));
        break;
      }
      case 'recruitment': {
        const jobs = await prisma.recruitmentPost.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        data = jobs.map((j: any) => ({
          岗位ID: j.id, 岗位名称: j.title, 状态: j.status,
          创建时间: j.createdAt?.toLocaleString('zh-CN'),
        }));
        break;
      }
      case 'acquisition': {
        const leads = await prisma.acquisitionLead.findMany({
          where,
          select: { id: true, name: true, phone: true, source: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
        data = leads.map((l: any) => ({
          线索ID: l.id, 姓名: l.name || '-', 手机号: l.phone || '-',
          来源: l.source || '-', 状态: l.status,
          创建时间: l.createdAt?.toLocaleString('zh-CN'),
        }));
        break;
      }
      default:
        data = [];
    }

    if (format === 'csv' && data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(',')),
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv;charset=utf-8');
      res.setHeader('Content-Disposition', `attachment;filename=${reportName}_${Date.now()}.csv`);
      return res.send(csvContent);
    }

    res.json({
      success: true,
      reportName,
      type,
      total: data.length,
      data,
      generatedAt: new Date().toLocaleString('zh-CN'),
    });
  } catch (error: any) {
    console.error('报表生成失败:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// 获取报表类型列表
router.get('/types', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ success: true, data: Object.entries(REPORT_TYPES).map(([key, name]) => ({ key, name })) });
});

export default router;
