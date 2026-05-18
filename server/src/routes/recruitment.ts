import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import {
  parseResumeWithAI,
  matchJobWithAI,
  generateInterviewQuestions,
  batchSmartScreen,
  getRecruitmentProcesses,
  updateRecruitmentProcess,
} from '../services/resume-ai.service';

const router = Router();
const prisma = new PrismaClient();

// 获取岗位列表
router.get('/jobs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const jobs = await prisma.recruitmentPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.recruitmentPost.count({ where });

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

    const job = await prisma.recruitmentPost.create({
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

    const job = await prisma.recruitmentPost.update({
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

    await prisma.recruitmentPost.delete({ where: { id, userId } });

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

    const jobCount = await prisma.recruitmentPost.count({ where: { userId } });
    const activeJobCount = await prisma.recruitmentPost.count({ where: { userId, status: 'active' } });
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

// ============ AI 智能招聘功能 ============

// AI 解析简历
router.post('/ai/parse-resume', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置，请联系管理员' });
      return;
    }

    const { resumeText } = req.body;
    if (!resumeText) {
      res.status(400).json({ error: '简历内容不能为空' });
      return;
    }

    const parsedData = await parseResumeWithAI(resumeText, apiKey);

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('AI解析简历错误:', error);
    res.status(500).json({ error: error.message || 'AI解析失败' });
  }
});

// AI 匹配岗位
router.post('/ai/match-job', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
      res.status(400).json({ error: '简历ID和岗位ID不能为空' });
      return;
    }

    const resume = await prisma.recruitmentResume.findFirst({
      where: { id: resumeId, userId: (req as any).userId },
    });

    const job = await prisma.recruitmentPost.findFirst({
      where: { id: jobId, userId: (req as any).userId },
    });

    if (!resume || !job) {
      res.status(404).json({ error: '简历或岗位不存在' });
      return;
    }

    const resumeText = `
      姓名：${resume.name}
      电话：${resume.phone}
      邮箱：${resume.email}
      学历：${resume.education}
      经验：${resume.experience}
    `;

    const parsedResume = await parseResumeWithAI(resumeText, apiKey);
    const matchResult = await matchJobWithAI({ ...resume, ...parsedResume }, job, apiKey);

    // 更新简历分数
    await prisma.recruitmentResume.update({
      where: { id: resumeId },
      data: {
        aiScore: matchResult.score,
        aiAnalysis: matchResult.analysis,
        status: matchResult.score >= 60 ? 'screening' : 'rejected',
      },
    });

    res.json({
      success: true,
      data: matchResult,
    });
  } catch (error: any) {
    console.error('AI匹配岗位错误:', error);
    res.status(500).json({ error: error.message || 'AI匹配失败' });
  }
});

// AI 生成面试问题
router.post('/ai/interview-questions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
      res.status(400).json({ error: '简历ID和岗位ID不能为空' });
      return;
    }

    const resume = await prisma.recruitmentResume.findFirst({
      where: { id: resumeId, userId: (req as any).userId },
    });

    const job = await prisma.recruitmentPost.findFirst({
      where: { id: jobId, userId: (req as any).userId },
    });

    if (!resume || !job) {
      res.status(404).json({ error: '简历或岗位不存在' });
      return;
    }

    const resumeText = `
      姓名：${resume.name}
      学历：${resume.education}
      经验：${resume.experience}
    `;

    const parsedResume = await parseResumeWithAI(resumeText, apiKey);
    const questions = await generateInterviewQuestions({ ...resume, ...parsedResume }, job, apiKey);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    console.error('AI生成面试问题错误:', error);
    res.status(500).json({ error: error.message || '生成失败' });
  }
});

// 批量智能筛选
router.post('/ai/batch-screen/:jobId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'AI服务未配置' });
      return;
    }

    const userId = (req as any).userId;
    const { jobId } = req.params;

    const results = await batchSmartScreen(userId, jobId, apiKey);

    res.json({
      success: true,
      data: {
        total: results.length,
        results,
      },
    });
  } catch (error: any) {
    console.error('批量筛选错误:', error);
    res.status(500).json({ error: error.message || '批量筛选失败' });
  }
});

// 获取招聘流程
router.get('/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { resumeId } = req.query;

    const processes = await getRecruitmentProcesses(userId, resumeId as string);

    res.json({
      success: true,
      data: processes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新招聘流程
router.put('/process/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { stage, notes, scheduledAt } = req.body;

    const process = await updateRecruitmentProcess(id, userId, {
      stage,
      notes,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    res.json({
      success: true,
      data: process,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
