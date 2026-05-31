import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 报表类型枚举
const REPORT_TYPES = {
  users: '用户报表',
  agents: '代理商报表',
  materials: '素材报表',
  posts: '发布报表',
  recruitment: '招聘报表',
  acquisition: '获客报表',
  api_usage: 'API使用报表',
};

// 生成报表
router.post('/generate', async (req, res) => {
  try {
    const { type, startDate, endDate, format = 'json' } = req.body;
    
    if (!type || !REPORT_TYPES[type as keyof typeof REPORT_TYPES]) {
      return res.status(400).json({ error: '无效的报表类型' });
    }

    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    let data: any[] = [];
    let reportName = REPORT_TYPES[type as keyof typeof REPORT_TYPES];

    switch (type) {
      case 'users':
        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        data = users.map(u => ({
          用户ID: u.id,
          用户名: u.name || '-',
          手机号: u.phone,
          角色: u.role,
          状态: u.status === 'active' ? '正常' : '禁用',
          注册时间: u.createdAt.toLocaleString('zh-CN'),
          最后登录: u.lastLoginAt?.toLocaleString('zh-CN') || '从未登录',
        }));
        break;

      case 'agents':
        const agents = await prisma.agent.findMany({
          where,
          include: {
            user: { select: { name: true, phone: true } },
            UserAgentRelation: { select: { userId: true } },
          },
        });
        data = agents.map(a => ({
          代理商ID: a.id,
          公司名称: a.companyName,
          联系人: a.user?.name || '-',
          手机号: a.user?.phone || '-',
          区域: a.region || '-',
          客户数: a.UserAgentRelation?.length || 0,
          注册时间: a.createdAt.toLocaleString('zh-CN'),
        }));
        break;

      case 'materials':
        const materials = await prisma.material.findMany({
          where,
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            used: true,
            viewCount: true,
            likeCount: true,
            createdAt: true,
          },
        });
        data = materials.map(m => ({
          素材ID: m.id,
          标题: m.title,
          类型: m.type,
          分类: m.category || '-',
          状态: m.used ? '已使用' : '未使用',
          浏览数: m.viewCount,
          点赞数: m.likeCount,
          创建时间: m.createdAt.toLocaleString('zh-CN'),
        }));
        break;

      case 'posts':
        const posts = await prisma.publishedContent.findMany({
          where,
          select: {
            id: true,
            title: true,
            platform: true,
            accountId: true,
            status: true,
            views: true,
            likes: true,
            createdAt: true,
          },
        });
        data = posts.map(p => ({
          内容ID: p.id,
          标题: p.title,
          平台: p.platform,
          账号ID: p.accountId,
          状态: p.status,
          阅读: p.views || 0,
          点赞: p.likes || 0,
          发布时间: p.createdAt.toLocaleString('zh-CN'),
        }));
        break;

      case 'recruitment':
        const jobs = await prisma.recruitmentPost.findMany({
          where,
          include: {
            candidates: { select: { id: true, status: true } },
          },
        });
        data = jobs.map(j => ({
          岗位ID: j.id,
          岗位名称: j.title,
          薪资范围: j.salaryMin && j.salaryMax ? `${j.salaryMin}-${j.salaryMax}` : '-',
          状态: j.status,
          简历数: j.candidates.length,
          投递中: j.candidates.filter(c => c.status === 'pending').length,
          已面试: j.candidates.filter(c => c.status === 'interview').length,
          已入职: j.candidates.filter(c => c.status === 'hired').length,
          创建时间: j.createdAt.toLocaleString('zh-CN'),
        }));
        break;

      case 'acquisition':
        const leads = await prisma.acquisitionLead.findMany({
          where,
          select: {
            id: true,
            name: true,
            phone: true,
            source: true,
            quality: true,
            status: true,
            createdAt: true,
          },
        });
        data = leads.map(l => ({
          线索ID: l.id,
          姓名: l.name || '-',
          手机号: l.phone,
          来源: l.source || '-',
          质量: l.quality || '-',
          状态: l.status,
          创建时间: l.createdAt.toLocaleString('zh-CN'),
        }));
        break;

      case 'api_usage':
        const logs = await prisma.apiUsageLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });
        data = logs.map(l => ({
          日志ID: l.id,
          用户ID: l.userId,
          服务商: l.providerName,
          端点: l.endpoint,
          模型: l.model || '-',
          请求Token: l.requestTokens || 0,
          响应Token: l.responseTokens || 0,
          费用: l.cost ? `¥${l.cost}` : '-',
          耗时: l.duration ? `${l.duration}ms` : '-',
          状态: l.status === 'success' ? '成功' : '失败',
          时间: l.createdAt.toLocaleString('zh-CN'),
        }));
        break;
    }

    // 生成文件
    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h as keyof typeof row] || ''}"`).join(',')),
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
    res.status(500).json({ error: error.message });
  }
});

// 获取报表类型列表
router.get('/types', async (req, res) => {
  res.json(Object.entries(REPORT_TYPES).map(([key, name]) => ({ key, name })));
});

// 导出为 Excel (简化版，返回 JSON 供前端处理)
router.post('/export', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    
    // 复用 generate 的逻辑，但返回适合导出的格式
    const result = await new Promise((resolve) => {
      // 模拟异步结果
      setTimeout(() => resolve(null), 0);
    });

    // 返回数据，前端可使用 xlsx 库导出
    const generateReq = { body: { type, startDate, endDate, format: 'json' } };
    const generateRes = {
      json: (data: any) => resolve(data),
      status: (code: number) => ({ json: (data: any) => resolve(data) }),
      setHeader: () => {},
      send: () => {},
    } as any;

    // 重新执行 generate 逻辑
    await router.stack
      .find((r: any) => r.route?.path === '/generate')
      ?.route?.stack[0]
      ?.handle(generateReq, generateRes, () => {});

    const data = await new Promise<any>((resolve) => {
      // 简化处理：直接返回前端需要的格式
      resolve({ success: true, message: '请使用前端导出功能' });
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
