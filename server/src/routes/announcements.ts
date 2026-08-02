import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// 公共接口：客户端/代理商/管理员获取已发布公告
// GET /api/announcements?audience=agent|user|all&limit=10
// ============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const { audience = 'all', limit = '10' } = req.query;
    const where: any = { status: 'published' };
    // target: all, agent, user
    if (audience === 'agent') {
      where.target = { in: ['all', 'agent'] };
    } else if (audience === 'user') {
      where.target = { in: ['all', 'user'] };
    }

    const list = await prisma.announcement.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: Number(limit),
    });
    res.json({ success: true, data: list });
  } catch (error: any) {
    console.error('获取公告失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============================================
// 管理员接口
// ============================================
const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// 公告列表（全部状态）
adminRouter.get('/list', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status = '', type = '' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [list, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: Number(pageSize),
      }),
      prisma.announcement.count({ where }),
    ]);

    res.json({ success: true, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error: any) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 新建公告
adminRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const { title, content, type = 'info', target = 'all', status = 'draft', publishedAt } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        target,
        status,
        publishedAt: status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      },
    });
    res.json({ success: true, data: announcement });
  } catch (error: any) {
    console.error('创建公告失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新公告
adminRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, type, target, status, publishedAt } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (type !== undefined) data.type = type;
    if (target !== undefined) data.target = target;
    if (status !== undefined) {
      data.status = status;
      // 状态变为已发布时，自动设置发布时间
      if (status === 'published' && !publishedAt) {
        const existing = await prisma.announcement.findUnique({ where: { id } });
        if (!existing?.publishedAt) {
          data.publishedAt = new Date();
        }
      }
      if (status === 'published' && publishedAt) {
        data.publishedAt = new Date(publishedAt);
      }
    }
    if (publishedAt !== undefined && !data.publishedAt) {
      data.publishedAt = new Date(publishedAt);
    }

    const announcement = await prisma.announcement.update({ where: { id }, data });
    res.json({ success: true, data: announcement });
  } catch (error: any) {
    console.error('更新公告失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除公告
adminRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error('删除公告失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
export { adminRouter as adminAnnouncementRouter };
