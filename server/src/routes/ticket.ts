import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

// 生成工单编号
function generateTicketNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TK${dateStr}${random}`;
}

// 获取工单列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, agentId, status, category, priority, page = 1, pageSize = 20 } = req.query;
    
    const where: any = {};
    
    // 根据角色筛选
    const role = req.headers['x-user-role'] as string;
    
    if (role === 'user') {
      where.userId = userId;
    } else if (role === 'agent') {
      where.agentId = agentId;
    } else if (role === 'admin') {
      // Admin 可以看所有
    }
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const skip = (Number(page) - 1) * Number(pageSize);
    
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          responses: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.ticket.count({ where })
    ]);

    res.json({
      data: tickets,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个工单详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json({ data: ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建工单
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, agentId, category, priority, title, content, attachments } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo: generateTicketNo(),
        userId,
        agentId,
        category: category || 'consult',
        priority: priority || 'normal',
        title,
        content,
        attachments: attachments || [],
        status: 'pending'
      }
    });

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 回复工单
router.post('/:id/responses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, userName, userRole, content, attachments, isInternal = false } = req.body;

    if (!content) {
      return res.status(400).json({ error: '请填写回复内容' });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: '工单不存在' });
    }

    const response = await prisma.ticketResponse.create({
      data: {
        ticketId: id,
        userId,
        userName,
        userRole,
        content,
        attachments: attachments || [],
        isInternal
      }
    });

    // 更新工单状态
    if (userRole === 'agent' || userRole === 'admin') {
      await prisma.ticket.update({
        where: { id },
        data: { 
          status: 'processing',
          assigneeId: userId,
          assigneeName: userName
        }
      });
    }

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新工单状态
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assigneeId, assigneeName } = req.body;

    const updateData: any = { status };
    if (status === 'closed') {
      updateData.closedAt = new Date();
    }
    if (assigneeId) {
      updateData.assigneeId = assigneeId;
      updateData.assigneeName = assigneeName;
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取工单统计
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    const role = req.headers['x-user-role'] as string;
    
    const where: any = {};
    if (role === 'agent' && agentId) {
      where.agentId = agentId;
    }

    const [total, pending, processing, resolved] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: 'pending' } }),
      prisma.ticket.count({ where: { ...where, status: 'processing' } }),
      prisma.ticket.count({ where: { ...where, status: 'resolved' } })
    ]);

    res.json({
      data: {
        total,
        pending,
        processing,
        resolved,
        closed: total - pending - processing - resolved
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
