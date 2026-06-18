import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  generateSearchKeywords,
  generateContactMessage,
  generateInterviewInvitation,
  scoreCandidateMatch,
  generateInterviewQuestions,
  generateAutoReply,
} from '../services/recruitment-ai.service';

const router = Router();

// ============ 岗位管理 ============

// 获取岗位列表
router.get('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [jobs, total] = await Promise.all([
      prisma.recruitmentPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
        include: {
          _count: { select: { candidates: true, interviews: true } },
        },
      }),
      prisma.recruitmentPost.count({ where }),
    ]);

    return res.json({ jobs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 创建岗位
router.post('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const job = await prisma.recruitmentPost.create({
      data: { ...req.body, userId },
    });
    return res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 获取岗位详情
router.get('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const job = await prisma.recruitmentPost.findUnique({
      where: { id },
      include: {
        candidates: { orderBy: { matchScore: 'desc' } },
        interviews: { orderBy: { scheduledAt: 'desc' } },
        searchConfigs: true,
      },
    });
    if (!job) return res.status(404).json({ error: '岗位不存在' });
    return res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 更新岗位
router.put('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const job = await prisma.recruitmentPost.update({ where: { id }, data: req.body });
    return res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 删除岗位
router.delete('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    await prisma.recruitmentPost.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// ============ 主动搜索候选人 ============

// AI生成搜索关键词
router.post('/jobs/:postId/generate-keywords', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { postId } = req.params;
    const keywords = await generateSearchKeywords(userId, postId!);
    return res.json({ keywords });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 创建/更新候选人搜索配置
router.post('/jobs/:postId/search-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { postId } = req.params;

    const existing = await prisma.candidateSearchConfig.findFirst({
      where: { userId, postId },
    });

    if (existing) {
      const updated = await prisma.candidateSearchConfig.update({
        where: { id: existing.id },
        data: req.body,
      });
      return res.json(updated);
    } else {
      const created = await prisma.candidateSearchConfig.create({
        data: { ...req.body, userId, postId },
      });
      return res.json(created);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 获取搜索配置
router.get('/jobs/:postId/search-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { postId } = req.params;

    const config = await prisma.candidateSearchConfig.findFirst({
      where: { userId, postId },
    });
    return res.json(config || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// ============ 候选人管理 ============

// 获取候选人列表
router.get('/candidates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { postId, status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (postId) where.postId = postId as string;
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { matchScore: 'desc' },
        skip,
        take: Number(pageSize),
        include: {
          post: { select: { title: true } },
          _count: { select: { communications: true, interviews: true } },
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    return res.json({ candidates, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 添加候选人（手动或从搜索结果导入）
router.post('/candidates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { postId, name, phone, email, skills, experience, education, source, location, resume } = req.body;

    if (!postId || !name || !phone) {
      return res.status(400).json({ error: '岗位、姓名和手机号为必填项' });
    }

    // 检查是否已存在
    const existing = await prisma.candidate.findFirst({
      where: { postId, phone },
    });

    if (existing) {
      return res.status(400).json({ error: '该候选人已存在于此岗位' });
    }

    // AI匹配度评分
    let matchScore = 50;
    let matchAnalysis = '';
    try {
      const result = await scoreCandidateMatch(userId, postId, {
        name,
        skills,
        experience,
        education,
        resume,
      });
      matchScore = result.score;
      matchAnalysis = result.analysis;
    } catch (e) {
      // AI评分失败不影响添加
    }

    const candidate = await prisma.candidate.create({
      data: {
        userId,
        postId,
        name,
        phone,
        email,
        skills: skills ? JSON.stringify(Array.isArray(skills) ? skills : skills.split(',')) : null,
        experience,
        education,
        source: source || 'manual',
        matchScore,
        location,
        resume,
        status: 'pending',
      },
    });

    // 更新岗位候选人计数
    await prisma.recruitmentPost.update({
      where: { id: postId },
      data: { candidateCount: { increment: 1 } },
    });

    return res.json({ candidate, matchAnalysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 批量导入候选人
router.post('/candidates/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { postId, candidates } = req.body;

    if (!postId || !Array.isArray(candidates)) {
      return res.status(400).json({ error: '岗位ID和候选人数组为必填项' });
    }

    const results: any[] = [];
    for (const c of candidates) {
      try {
        // 检查重复
        const existing = await prisma.candidate.findFirst({
          where: { postId, phone: c.phone },
        });
        if (existing) {
          results.push({ name: c.name, status: 'duplicate' });
          continue;
        }

        const candidate = await prisma.candidate.create({
          data: {
            userId,
            postId,
            name: c.name,
            phone: c.phone,
            email: c.email,
            skills: c.skills ? JSON.stringify(Array.isArray(c.skills) ? c.skills : c.skills.split(',')) : null,
            experience: c.experience,
            education: c.education,
            source: c.source || 'import',
            location: c.location,
            matchScore: 0,
            status: 'pending',
          },
        });
        results.push({ name: c.name, status: 'created', id: candidate.id });
      } catch (e: any) {
        results.push({ name: c.name, status: 'error', error: e.message });
      }
    }

    // 更新岗位候选人计数
    const createdCount = results.filter(r => r.status === 'created').length;
    if (createdCount > 0) {
      await prisma.recruitmentPost.update({
        where: { id: postId },
        data: { candidateCount: { increment: createdCount } },
      });
    }

    return res.json({ results, created: createdCount, duplicates: results.filter(r => r.status === 'duplicate').length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 获取候选人详情
router.get('/candidates/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        post: { select: { title: true, id: true } },
        communications: { orderBy: { createdAt: 'desc' } },
        interviews: { orderBy: { scheduledAt: 'desc' } },
      },
    });
    if (!candidate) return res.status(404).json({ error: '候选人不存在' });
    return res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 更新候选人状态
router.put('/candidates/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const candidate = await prisma.candidate.update({
      where: { id },
      data: req.body,
    });
    return res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// AI重新评分候选人
router.post('/candidates/:id/rescore', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { id } = req.params;

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return res.status(404).json({ error: '候选人不存在' });

    const result = await scoreCandidateMatch(userId, candidate.postId, {
      name: candidate.name,
      skills: candidate.skills,
      experience: candidate.experience || undefined,
      education: candidate.education || undefined,
      resume: candidate.resume || undefined,
    });

    await prisma.candidate.update({
      where: { id },
      data: { matchScore: result.score },
    });

    return res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// ============ 沟通管理 ============

// 获取沟通记录
router.get('/candidates/:candidateId/communications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { candidateId } = req.params;
    const communications = await prisma.recruitmentCommunication.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(communications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 主动联系候选人 - AI生成沟通话术
router.post('/candidates/:id/contact', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { id } = req.params;
    const { channel, customMessage } = req.body;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { post: true },
    });
    if (!candidate) return res.status(404).json({ error: '候选人不存在' });

    // 生成沟通话术
    let message: string;
    if (customMessage) {
      message = customMessage;
    } else {
      message = await generateContactMessage(userId, candidate.postId, {
        name: candidate.name,
        skills: candidate.skills || undefined,
        experience: candidate.experience || undefined,
        source: candidate.source || undefined,
      });
    }

    // 保存沟通记录
    const communication = await prisma.recruitmentCommunication.create({
      data: {
        userId,
        candidateId: id,
        postId: candidate.postId,
        channel: channel || 'platform',
        direction: 'outbound',
        content: message,
        aiGenerated: !customMessage,
      },
    });

    // 更新候选人状态
    await prisma.candidate.update({
      where: { id },
      data: {
        status: 'contacted',
        lastContactedAt: new Date(),
      },
    });

    return res.json({ communication, message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 发送消息给候选人
router.post('/candidates/:id/message', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { id } = req.params;
    const { content, channel } = req.body;

    if (!content) return res.status(400).json({ error: '消息内容不能为空' });

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return res.status(404).json({ error: '候选人不存在' });

    const communication = await prisma.recruitmentCommunication.create({
      data: {
        userId,
        candidateId: id,
        postId: candidate.postId,
        channel: channel || 'platform',
        direction: 'outbound',
        content,
        aiGenerated: false,
      },
    });

    await prisma.candidate.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    });

    return res.json(communication);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 记录候选人回复
router.post('/candidates/:id/reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { id } = req.params;
    const { content, channel } = req.body;

    if (!content) return res.status(400).json({ error: '消息内容不能为空' });

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return res.status(404).json({ error: '候选人不存在' });

    const communication = await prisma.recruitmentCommunication.create({
      data: {
        userId,
        candidateId: id,
        postId: candidate.postId,
        channel: channel || 'platform',
        direction: 'inbound',
        content,
        aiGenerated: false,
        readByCandidate: true,
      },
    });

    // 更新候选人状态为沟通中
    await prisma.candidate.update({
      where: { id },
      data: { status: 'communicating' },
    });

    return res.json(communication);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// AI自动回复候选人消息
router.post('/candidates/:id/auto-reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { id } = req.params;
    const { candidateMessage } = req.body;

    if (!candidateMessage) return res.status(400).json({ error: '候选人消息不能为空' });

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        post: true,
        communications: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!candidate) return res.status(404).json({ error: '候选人不存在' });

    // 构建历史消息上下文
    const previousMessages = candidate.communications
      .map((c: any) => `${c.direction === 'outbound' ? 'HR' : candidate.name}: ${c.content}`)
      .join('\n');

    const reply = await generateAutoReply(userId, candidateMessage, {
      jobTitle: candidate.post.title,
      candidateName: candidate.name,
      previousMessages,
    });

    // 保存候选人消息
    await prisma.recruitmentCommunication.create({
      data: {
        userId,
        candidateId: id,
        postId: candidate.postId,
        channel: 'platform',
        direction: 'inbound',
        content: candidateMessage,
        aiGenerated: false,
      },
    });

    // 保存AI回复
    const communication = await prisma.recruitmentCommunication.create({
      data: {
        userId,
        candidateId: id,
        postId: candidate.postId,
        channel: 'platform',
        direction: 'outbound',
        content: reply,
        aiGenerated: true,
      },
    });

    return res.json({ reply: communication });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// ============ 面试管理 ============

// 获取面试列表
router.get('/interviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { postId, status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (postId) where.postId = postId as string;
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: Number(pageSize),
        include: {
          candidate: { select: { name: true, phone: true, email: true } },
          post: { select: { title: true } },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    return res.json({ interviews, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 安排面试
router.post('/interviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { candidateId, postId, round, type, scheduledAt, duration, location, interviewer } = req.body;

    if (!candidateId || !postId || !scheduledAt) {
      return res.status(400).json({ error: '候选人、岗位和面试时间为必填项' });
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return res.status(404).json({ error: '候选人不存在' });

    const interview = await prisma.interview.create({
      data: {
        userId,
        candidateId,
        postId,
        round: round || 1,
        type: type || 'video',
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        location,
        interviewer,
        status: 'scheduled',
      },
    });

    // 生成面试邀约消息
    let invitationMessage = '';
    try {
      invitationMessage = await generateInterviewInvitation(
        userId, postId, candidate.name, type || 'video', scheduledAt, duration || 60
      );
      // 保存邀约记录
      await prisma.recruitmentCommunication.create({
        data: {
          userId,
          candidateId,
          postId,
          channel: 'platform',
          direction: 'outbound',
          content: invitationMessage,
          aiGenerated: true,
        },
      });
    } catch (e) {
      // 生成邀约失败不影响面试创建
    }

    // 更新候选人状态
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: 'interviewed' },
    });

    return res.json({ interview, invitationMessage });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 更新面试状态
router.put('/interviews/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const interview = await prisma.interview.update({
      where: { id },
      data: req.body,
    });
    return res.json(interview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 获取面试问题
router.get('/interviews/questions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { postId, round } = req.query;

    if (!postId) return res.status(400).json({ error: '岗位ID为必填项' });

    const questions = await generateInterviewQuestions(userId, postId as string, Number(round) || 1);
    return res.json({ questions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// 提交面试反馈
router.post('/interviews/:id/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const { id } = req.params;
    const { feedback, score, status } = req.body;

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        feedback,
        score,
        status: status || 'completed',
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      },
    });

    // 如果面试通过且是终面，更新候选人状态
    if (status === 'completed' && score && score >= 70) {
      const candidateId = interview.candidateId;
      // 检查是否还有后续面试
      const remainingInterviews = await prisma.interview.count({
        where: {
          candidateId,
          status: 'scheduled',
          id: { not: id },
        },
      });

      if (remainingInterviews === 0) {
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { status: 'offered' },
        });
      }
    }

    return res.json(interview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// ============ 统计 ============

// 获取统计数据
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;

    const [
      totalJobs,
      activeJobs,
      totalCandidates,
      contactedCandidates,
      interviewingCandidates,
      hiredCandidates,
      totalInterviews,
      pendingInterviews,
    ] = await Promise.all([
      prisma.recruitmentPost.count({ where: { userId } }),
      prisma.recruitmentPost.count({ where: { userId, status: 'recruiting' } }),
      prisma.candidate.count({ where: { userId } }),
      prisma.candidate.count({ where: { userId, status: { in: ['contacted', 'communicating'] } } }),
      prisma.candidate.count({ where: { userId, status: 'interviewed' } }),
      prisma.candidate.count({ where: { userId, status: 'hired' } }),
      prisma.interview.count({ where: { userId } }),
      prisma.interview.count({ where: { userId, status: 'scheduled' } }),
    ]);

    // 最近7天新增候选人
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newCandidates = await prisma.candidate.count({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
    });

    return res.json({
      totalJobs,
      activeJobs,
      totalCandidates,
      newCandidates,
      contactedCandidates,
      interviewingCandidates,
      hiredCandidates,
      totalInterviews,
      pendingInterviews,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

// ============ 兼容旧接口 ============

// 岗位别名
router.get('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [jobs, total] = await Promise.all([
      prisma.recruitmentPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
        include: { _count: { select: { candidates: true } } },
      }),
      prisma.recruitmentPost.count({ where }),
    ]);

    return res.json({ jobs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

export default router;
