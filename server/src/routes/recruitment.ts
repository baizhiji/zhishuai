import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取岗位列表
router.get('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const jobs = await prisma.recruitmentJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.recruitmentJob.count({ where });

    res.json({
      success: true,
      data: {
        list: jobs,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建岗位
router.post('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      title,
      salaryMin,
      salaryMax,
      education,
      experience,
      description,
      requirements,
      benefits,
      recruiterName,
      recruiterPhone,
    } = req.body;

    const job = await prisma.recruitmentJob.create({
      data: {
        userId,
        title,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        education: education || '不限',
        experience: experience || '不限',
        description,
        requirements,
        benefits,
        recruiterName,
        recruiterPhone,
        status: 'active',
      },
    });

    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新岗位
router.put('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const updateData = req.body;

    const job = await prisma.recruitmentJob.update({
      where: { id, userId },
      data: updateData,
    });

    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除岗位
router.delete('/jobs/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await prisma.recruitmentJob.delete({ where: { id, userId } });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取简历列表
router.get('/resumes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, jobId, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;

    const resumes = await prisma.recruitmentResume.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      include: { job: { select: { title: true } } },
    });

    const total = await prisma.recruitmentResume.count({ where });

    res.json({
      success: true,
      data: {
        list: resumes,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建简历
router.post('/resumes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      jobId,
      name,
      phone,
      email,
      education,
      experience,
      resumeUrl,
      status = 'pending',
    } = req.body;

    const resume = await prisma.recruitmentResume.create({
      data: {
        userId,
        jobId,
        name,
        phone,
        email,
        education,
        experience,
        resumeUrl,
        status,
      },
    });

    res.json({ success: true, data: resume });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新简历状态
router.put('/resumes/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status } = req.body;

    const resume = await prisma.recruitmentResume.update({
      where: { id, userId },
      data: { status },
    });

    res.json({ success: true, data: resume });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计数据
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const jobCount = await prisma.recruitmentJob.count({ where: { userId } });
    const activeJobCount = await prisma.recruitmentJob.count({ where: { userId, status: 'active' } });
    const resumeCount = await prisma.recruitmentResume.count({ where: { userId } });
    const newResumeCount = await prisma.recruitmentResume.count({
      where: { userId, status: 'pending', createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });

    res.json({
      success: true,
      data: {
        totalJobs: jobCount,
        activeJobs: activeJobCount,
        totalResumes: resumeCount,
        newResumes: newResumeCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
