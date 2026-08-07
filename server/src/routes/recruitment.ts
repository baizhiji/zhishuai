/**
 * Recruitment Routes — 智能招聘全流程
 *
 * 端点:
 *   CRUD: GET/POST /jobs, GET/PUT/DELETE /jobs/:id
 *   自动化: POST /jobs/:id/match, POST /candidates/:id/contact, POST /batch-contact
 *   搜索配置: GET/POST/PUT/DELETE /search-config, POST /search-config/:id/run
 *   管线: GET /pipeline/stats, POST /process-timeouts
 *   状态机: PUT /candidates/:id/status
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import recruitmentService from '../services/recruitment.service';
import { randomUUID } from 'crypto';

const router = Router();

// ─── 岗位 CRUD ────────────────────────────────

router.get('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
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
        select: {
          id: true, title: true, salaryMin: true, salaryMax: true, experience: true,
          education: true, department: true, location: true, status: true,
          headcount: true, description: true, requirements: true, benefits: true,
          recruiterName: true, recruiterPhone: true, createdAt: true, updatedAt: true,
          _count: { select: { Candidate: true } },
        },
      }),
      prisma.recruitmentPost.count({ where }),
    ]);

    const jobsWithCount = jobs.map((j: any) => ({
      ...j,
      candidateCount: j._count?.Candidate || 0,
      _count: undefined,
    }));

    res.json({ code: 200, message: 'success', data: { jobs: jobsWithCount, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.post('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const job = await prisma.recruitmentPost.create({
      data: {
        id: randomUUID(),
        title: req.body.title,
        department: req.body.department,
        location: req.body.location,
        salaryMin: req.body.salaryMin,
        salaryMax: req.body.salaryMax,
        experience: req.body.experience,
        education: req.body.education,
        description: req.body.description || '',
        requirements: req.body.requirements || '',
        benefits: req.body.benefits || '',
        headcount: req.body.headcount || 1,
        recruiterName: req.body.recruiterName || '',
        recruiterPhone: req.body.recruiterPhone || '',
        status: 'recruiting',
        userId,
        updatedAt: new Date(),
      },
    });
    res.json({ code: 200, message: 'success', data: job });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.get('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const job = await prisma.recruitmentPost.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, title: true, salaryMin: true, salaryMax: true, experience: true,
        education: true, department: true, location: true, status: true,
        headcount: true, description: true, requirements: true, benefits: true,
        recruiterName: true, recruiterPhone: true, createdAt: true, updatedAt: true,
        _count: { select: { Candidate: true } },
      },
    });
    if (!job) return res.status(404).json({ code: 404, message: '岗位不存在', data: null });
    const result = { ...(job as any), candidateCount: (job as any)._count?.Candidate || 0, _count: undefined };
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.put('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const job = await prisma.recruitmentPost.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() },
    });
    res.json({ code: 200, message: 'success', data: job });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.delete('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.recruitmentPost.delete({ where: { id: req.params.id } });
    res.json({ code: 200, message: 'success', data: { deleted: true } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ─── 自动化匹配 ────────────────────────────────

// POST /jobs/:id/match — AI匹配候选人
router.post('/jobs/:id/match', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { searchConfigId } = req.body;

    const candidates = await recruitmentService.matchCandidates(userId, id, searchConfigId);
    res.json({ code: 200, message: 'success', data: { candidates, count: candidates.length } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// POST /candidates/:id/contact — 联系候选人
router.post('/candidates/:id/contact', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { channel = 'platform' } = req.body;

    const result = await recruitmentService.contactCandidate(userId, id, channel);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// POST /batch-contact — 批量联系
router.post('/batch-contact', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { jobId, candidateIds } = req.body;

    const result = await recruitmentService.batchContact(userId, jobId, candidateIds);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ─── 状态机 ────────────────────────────────

// PUT /candidates/:id/status — 更新候选人状态
router.put('/candidates/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await recruitmentService.updateCandidateStatus(id, status, userId, notes);
    // 如果状态变更到 replied, 记录为 inbound 通信
    if (result.newStage === 'replied') {
      await prisma.recruitmentCommunication.create({
        data: {
          id: randomUUID(),
          userId,
          candidateId: id,
          channel: 'platform',
          direction: 'inbound',
          content: '候选人回复',
          aiGenerated: false,
          readByCandidate: true,
        },
      });
    }
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ─── 搜索配置 ────────────────────────────────

router.get('/search-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const configs = await prisma.candidateSearchConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ code: 200, message: 'success', data: { configs } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.post('/search-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const config = await prisma.candidateSearchConfig.create({
      data: {
        id: randomUUID(),
        userId,
        postId: req.body.postId,
        platform: req.body.platform || 'boss',
        keywords: req.body.keywords,
        location: req.body.location,
        experienceMin: req.body.experienceMin,
        experienceMax: req.body.experienceMax,
        education: req.body.education,
        salaryMin: req.body.salaryMin,
        salaryMax: req.body.salaryMax,
        skills: req.body.skills,
        autoContact: req.body.autoContact || false,
        contactTemplate: req.body.contactTemplate,
        status: 'active',
        updatedAt: new Date(),
      },
    });
    res.json({ code: 200, message: 'success', data: config });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.put('/search-config/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const config = await prisma.candidateSearchConfig.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() },
    });
    res.json({ code: 200, message: 'success', data: config });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.delete('/search-config/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.candidateSearchConfig.update({
      where: { id: req.params.id },
      data: { status: 'inactive', updatedAt: new Date() },
    });
    res.json({ code: 200, message: 'success', data: { deleted: true } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// POST /search-config/:id/run — 运行搜索
router.post('/search-config/:id/run', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const config = await prisma.candidateSearchConfig.findUnique({ where: { id: req.params.id } });
    if (!config) return res.status(404).json({ code: 404, message: '搜索配置不存在', data: null });

    await prisma.candidateSearchConfig.update({
      where: { id: req.params.id },
      data: { lastSearchedAt: new Date(), updatedAt: new Date() },
    });

    const candidates = await recruitmentService.matchCandidates(userId, config.postId, config.id);
    res.json({ code: 200, message: 'success', data: { candidates, count: candidates.length, configId: config.id } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ─── 管线统计 ────────────────────────────────

router.get('/pipeline/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const stats = await recruitmentService.getPipelineStats(userId);
    res.json({ code: 200, message: 'success', data: stats });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// POST /process-timeouts — 处理超时
router.post('/process-timeouts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await recruitmentService.processTimeouts(userId);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ─── 候选人查询 ────────────────────────────────

router.get('/candidates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 50, status, jobId } = req.query;
    const where: any = { userId };
    if (status) where.status = status as string;
    if (jobId) where.postId = jobId as string;

    const skip = (Number(page) - 1) * Number(pageSize);
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
        include: { RecruitmentPost: { select: { title: true } } },
      }),
      prisma.candidate.count({ where }),
    ]);

    res.json({ code: 200, message: 'success', data: { candidates, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// GET /interviews — 面试列表
router.get('/interviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const processes = await prisma.recruitmentProcess.findMany({
      where: { userId, stage: { in: ['interview_scheduled', 'interview_completed'] } },
      include: { RecruitmentResume: true, RecruitmentPost: { select: { title: true } } },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: Number(pageSize),
    });

    const total = await prisma.recruitmentProcess.count({
      where: { userId, stage: { in: ['interview_scheduled', 'interview_completed'] } },
    });

    res.json({ code: 200, message: 'success', data: { interviews: processes, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// APK 兼容: GET /posts → 等同于 GET /jobs
router.get('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
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
        select: {
          id: true, title: true, salaryMin: true, salaryMax: true, experience: true,
          education: true, department: true, location: true, status: true,
          headcount: true, description: true, requirements: true, benefits: true,
          recruiterName: true, recruiterPhone: true, createdAt: true, updatedAt: true,
          _count: { select: { Candidate: true } },
        },
      }),
      prisma.recruitmentPost.count({ where }),
    ]);

    const jobsWithCount = jobs.map((j: any) => ({
      ...j,
      candidateCount: j._count?.Candidate || 0,
      _count: undefined,
    }));

    res.json({ code: 200, message: 'success', data: { jobs: jobsWithCount, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// APK 兼容: GET /stats → 统计概览
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const stats = await recruitmentService.getPipelineStats(userId);
    const totalCandidates = stats.jobs.reduce((sum: number, j: any) => sum + j.total, 0);
    const totalInterviews = stats.jobs.reduce((sum: number, j: any) => sum + (j.stages?.['interview_completed'] || 0) + (j.stages?.['interview_scheduled'] || 0), 0);

    res.json({
      code: 200,
      message: 'success',
      data: {
        posts: stats.totalJobs,
        applications: totalCandidates,
        interviews: totalInterviews,
        totalJobs: stats.totalJobs,
        activeJobs: stats.activeJobs || stats.totalJobs,
        totalResumes: totalCandidates,
        newResumes: 0,
        totalInterviews,
        pendingInterviews: stats.jobs.reduce((sum: number, j: any) => sum + (j.stages?.['interview_scheduled'] || 0), 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
