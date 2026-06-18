import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';


import { authMiddleware } from '../middleware/auth';

const router = Router();

// 获取声音克隆列表
router.get('/voices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '10', status } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (status) where.status = status;

    const [voices, total] = await Promise.all([
      prisma.voiceClone.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.voiceClone.count({ where }),
    ]);

    res.json({ voices, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取声音克隆列表失败:', error);
    res.status(500).json({ error: '获取声音克隆列表失败' });
  }
});

// 获取单个声音克隆
router.get('/voices/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const voice = await prisma.voiceClone.findFirst({
      where: { id, userId },
    });

    if (!voice) {
      return res.status(404).json({ error: '声音不存在' });
    }

    res.json(voice);
  } catch (error) {
    console.error('获取声音失败:', error);
    res.status(500).json({ error: '获取声音失败' });
  }
});

// 创建声音克隆
router.post('/voices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, gender, description, audioUrl, language } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    // 模拟声音克隆处理
    const voice = await prisma.voiceClone.create({
      data: {
        userId,
        name,
        gender: gender || 'female',
        description,
        audioUrl,
        language: language || 'zh-CN',
        status: audioUrl ? 'processing' : 'ready',
      },
    });

    // 如果有音频文件，模拟处理完成
    if (audioUrl) {
      setTimeout(async () => {
        try {
          await prisma.voiceClone.update({
            where: { id: voice.id },
            data: { status: 'ready' },
          });
        } catch (e) {
          console.error('更新声音状态失败:', e);
        }
      }, 5000); // 5秒后模拟处理完成
    }

    res.json(voice);
  } catch (error) {
    console.error('创建声音克隆失败:', error);
    res.status(500).json({ error: '创建声音克隆失败' });
  }
});

// 更新声音克隆
router.put('/voices/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { name, description, status } = req.body;

    const existing = await prisma.voiceClone.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '声音不存在' });
    }

    const voice = await prisma.voiceClone.update({
      where: { id },
      data: {
        name,
        description,
        status,
      },
    });

    res.json(voice);
  } catch (error) {
    console.error('更新声音克隆失败:', error);
    res.status(500).json({ error: '更新声音克隆失败' });
  }
});

// 删除声音克隆
router.delete('/voices/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.voiceClone.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '声音不存在' });
    }

    await prisma.voiceClone.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除声音克隆失败:', error);
    res.status(500).json({ error: '删除声音克隆失败' });
  }
});

// 预览声音
router.post('/voices/:id/preview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { text } = req.body;

    const voice = await prisma.voiceClone.findFirst({
      where: { id, userId },
    });

    if (!voice) {
      return res.status(404).json({ error: '声音不存在' });
    }

    if (voice.status !== 'ready') {
      return res.status(400).json({ error: '声音正在处理中，请稍后再试' });
    }

    // 模拟TTS生成
    res.json({
      audioUrl: voice.audioUrl || '/audio/preview-sample.mp3',
      message: '预览生成成功',
    });
  } catch (error) {
    console.error('预览声音失败:', error);
    res.status(500).json({ error: '预览声音失败' });
  }
});

// 获取视频克隆列表
router.get('/videos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = '1', pageSize = '10', status } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId };
    if (status) where.status = status;

    const [videos, total] = await Promise.all([
      prisma.videoClone.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.videoClone.count({ where }),
    ]);

    res.json({ videos, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error('获取视频克隆列表失败:', error);
    res.status(500).json({ error: '获取视频克隆列表失败' });
  }
});

// 获取单个视频克隆
router.get('/videos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const video = await prisma.videoClone.findFirst({
      where: { id, userId },
    });

    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    res.json(video);
  } catch (error) {
    console.error('获取视频失败:', error);
    res.status(500).json({ error: '获取视频失败' });
  }
});

// 创建视频克隆
router.post('/videos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, type, sourceVideoUrl, sourceImageUrl, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '名称不能为空' });
    }

    const video = await prisma.videoClone.create({
      data: {
        userId,
        name,
        type: type || 'digital_human', // digital_human, talking_photo, lip_sync
        sourceVideoUrl,
        sourceImageUrl,
        description,
        status: 'processing',
      },
    });

    // 模拟视频处理
    setTimeout(async () => {
      try {
        await prisma.videoClone.update({
          where: { id: video.id },
          data: { status: 'ready', videoUrl: '/video/clone-sample.mp4' },
        });
      } catch (e) {
        console.error('更新视频状态失败:', e);
      }
    }, 10000); // 10秒后模拟处理完成

    res.json(video);
  } catch (error) {
    console.error('创建视频克隆失败:', error);
    res.status(500).json({ error: '创建视频克隆失败' });
  }
});

// 更新视频克隆
router.put('/videos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { name, description, status } = req.body;

    const existing = await prisma.videoClone.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '视频不存在' });
    }

    const video = await prisma.videoClone.update({
      where: { id },
      data: {
        name,
        description,
        status,
      },
    });

    res.json(video);
  } catch (error) {
    console.error('更新视频克隆失败:', error);
    res.status(500).json({ error: '更新视频克隆失败' });
  }
});

// 删除视频克隆
router.delete('/videos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const existing = await prisma.videoClone.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: '视频不存在' });
    }

    await prisma.videoClone.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除视频克隆失败:', error);
    res.status(500).json({ error: '删除视频克隆失败' });
  }
});

export default router;
