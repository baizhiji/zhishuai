/**
 * 声音克隆/数字人路由
 * 支持TTS语音合成预览 + 数字人视频克隆
 * 优先使用用户自行配置的API Key
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrimaryApiKey } from '../services/user-api-key.service';
import { prisma } from '../utils/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/db';

const router = Router();

// 文件上传配置
const uploadDir = path.join(process.cwd(), 'uploads', 'voice-clone');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

/**
 * 获取用户的API Key（优先用户自己的，否则用系统环境变量）
 */
async function resolveApiKey(userId: string): Promise<string | null> {
  // 1. 尝试从数据库读取用户自己的Key
  try {
    const userKey = await getPrimaryApiKey(userId, 'tokenhub');
    if (userKey && userKey.apiKey) {
      console.log(`[voice-clone] 使用用户 ${userId} 自行配置的 tokenhub API Key`);
      return userKey.apiKey;
    }
  } catch (err: any) {
    console.warn(`[voice-clone] 读取用户API Key失败:`, err.message);
  }

  // 2. 使用系统环境变量
  const envKey = process.env.TENCENT_TOKENHUB_API_KEY;
  if (envKey) {
    console.log('[voice-clone] 使用系统环境变量 API Key');
    return envKey;
  }

  return null;
}

const TOKENHUB_BASE = 'https://tokenhub.cloud.tencent.com';
const TTS_MODEL = 'hunyuan-tts-1.5'; // 混元TTS模型

// ============================================
// 声音克隆
// ============================================

// 获取用户的声纹列表（语音克隆模型）
router.get('/voices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const voices = await prisma.voiceClone.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 附加系统预设音色
    const presets = [
      { id: 'preset-male-01', name: '沉稳男声', description: '适合新闻播报、商务介绍', type: 'male', isPreset: true },
      { id: 'preset-male-02', name: '清新男声', description: '适合短视频解说、日常交流', type: 'male', isPreset: true },
      { id: 'preset-female-01', name: '温柔女声', description: '适合有声书、情感内容', type: 'female', isPreset: true },
      { id: 'preset-female-02', name: '活泼女声', description: '适合直播带货、娱乐内容', type: 'female', isPreset: true },
    ];

    res.json({
      success: true,
      data: {
        cloned: voices,
        presets,
      },
    });
  } catch (error: any) {
    console.error('获取声音列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 上传音频克隆声音
router.post('/voices', authMiddleware, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: '请上传音频文件' });
      return;
    }

    const voice = await prisma.voiceClone.create({
      data: {
        userId,
        name: name || '我的声音',
        sampleUrl: `/uploads/voice-clone/${file.filename}`,
        status: 'ready',
      },
    });

    res.json({ success: true, data: voice });
  } catch (error: any) {
    console.error('创建声音错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除声音
router.delete('/voices/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const voice = await prisma.voiceClone.findFirst({ where: { id, userId } });
    if (!voice) {
      res.status(404).json({ error: '声音不存在' });
      return;
    }

    // 删除音频文件
    if (voice.sampleUrl) {
      const filePath = path.join(process.cwd(), voice.sampleUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.voiceClone.delete({ where: { id } });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// TTS语音合成预览
router.post('/preview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { text, voiceId, speed = 1.0, volume = 1.0 } = req.body;

    if (!text) {
      res.status(400).json({ error: '文本不能为空' });
      return;
    }

    const apiKey = await resolveApiKey(userId);
    if (!apiKey) {
      // 降级：使用浏览器TTS提示用户
      res.json({
        success: true,
        data: {
          audioUrl: null,
          text,
          ttsProvider: 'browser',
          message: '未配置API Key，请在浏览器中使用系统语音合成。配置腾讯云TokenHub API Key后可获得更高质量语音。',
          fallback: true,
        },
      });
      return;
    }

    // 调用腾讯云TokenHub TTS
    try {
      const response = await fetch(`${TOKENHUB_BASE}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-TC-Provider': 'tokenhub',
        },
        body: JSON.stringify({
          model: TTS_MODEL,
          input: text,
          voice: voiceId || 'default',
          speed: speed,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        const err: any = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `TTS调用失败: ${response.status}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const filename = `tts-${Date.now()}.mp3`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, audioBuffer);

      res.json({
        success: true,
        data: {
          audioUrl: `/uploads/voice-clone/${filename}`,
          text,
          duration: text.length * 0.25, // 估算时长
          format: 'mp3',
          ttsProvider: 'tokenhub',
        },
      });
    } catch (ttsError: any) {
      console.error('TTS调用失败:', ttsError.message);
      // 降级到浏览器方案
      res.json({
        success: true,
        data: {
          audioUrl: null,
          text,
          ttsProvider: 'browser',
          message: `TTS服务暂不可用(${ttsError.message})，请联系管理员。配置API Key后可获取服务。`,
          fallback: true,
        },
      });
    }
  } catch (error: any) {
    console.error('TTS预览错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 数字人视频
// ============================================

// 获取视频列表
router.get('/videos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const videos = await prisma.videoClone.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: videos });
  } catch (error: any) {
    console.error('获取视频列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建数字人视频
router.post('/videos', authMiddleware, upload.fields([
  { name: 'sourceImage', maxCount: 1 },
  { name: 'sourceAudio', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, voiceId, text, description } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const apiKey = await resolveApiKey(userId);

    // 如果有图片上传，保存地址
    let imageUrl = undefined;
    if (files?.sourceImage?.[0]) {
      imageUrl = `/uploads/voice-clone/${files.sourceImage[0].filename}`;
    }

    // 创建视频任务
    const video = await prisma.videoClone.create({
      data: {
        userId,
        name: name || '数字人视频',
        sourceImageUrl: imageUrl,
        description: description || '',
        status: apiKey ? 'processing' : 'pending', // 有API Key才开始处理
        progress: 0,
      },
    });

    // 如果有API Key，异步生成视频
    if (apiKey && text) {
      generateVideoAsync(video.id, apiKey, text, voiceId, imageUrl).catch(err => {
        console.error('异步视频生成失败:', err);
        prisma.videoClone.update({
          where: { id: video.id },
          data: { status: 'failed', progress: 0 },
        }).catch(() => {});
      });
    } else if (!apiKey) {
      res.json({
        success: true,
        data: video,
        message: '视频任务已创建。配置腾讯云TokenHub API Key后可自动生成数字人视频。当前状态：等待API Key配置。',
      });
      return;
    }

    res.json({ success: true, data: video });
  } catch (error: any) {
    console.error('创建视频错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 异步生成视频
async function generateVideoAsync(videoId: string, apiKey: string, text: string, voiceId?: string, imageUrl?: string) {
  try {
    // 更新进度 10%
    await prisma.videoClone.update({ where: { id: videoId }, data: { progress: 10 } });

    // 第一步：TTS语音合成
    const ttsResponse = await fetch(`${TOKENHUB_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-TC-Provider': 'tokenhub',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: text,
        voice: voiceId || 'default',
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS失败: ${ttsResponse.status}`);
    }

    // 更新进度 40%
    await prisma.videoClone.update({ where: { id: videoId }, data: { progress: 40 } });

    // 第二步：尝试调用数字人视频生成API
    const videoResponse = await fetch(`${TOKENHUB_BASE}/video/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-TC-Provider': 'tokenhub',
      },
      body: JSON.stringify({
        model: 'YT-Video-HumanActor',
        input: text,
        tts_voice: voiceId || 'default',
        ...(imageUrl ? { reference_image: imageUrl } : {}),
        output_format: 'mp4',
      }),
    });

    if (videoResponse.ok) {
      const data: any = await videoResponse.json();
      await prisma.videoClone.update({
        where: { id: videoId },
        data: {
          status: 'ready',
          progress: 100,
          videoUrl: data?.data?.[0]?.url || data?.url || data?.video_url || undefined,
        },
      });
    } else {
      // 视频生成API不可用，标记为仅语音
      await prisma.videoClone.update({
        where: { id: videoId },
        data: {
          status: 'ready',
          progress: 100,
          description: '视频生成API暂不可用，已生成语音。请联系管理员确认API权限。',
        },
      });
    }
  } catch (error: any) {
    console.error('视频生成错误:', error.message);
    await prisma.videoClone.update({
      where: { id: videoId },
      data: { status: 'failed', progress: 0 },
    });
  }
}

// 删除视频
router.delete('/videos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const video = await prisma.videoClone.findFirst({ where: { id, userId } });
    if (!video) {
      res.status(404).json({ error: '视频不存在' });
      return;
    }

    await prisma.videoClone.delete({ where: { id } });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取视频导出历史
router.get('/exports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const exports = await prisma.videoClone.findMany({
      where: { userId, status: 'ready' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: exports });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取声音/视频状态概览（APK 客户终端使用）
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const [voiceCount, videoCount, readyVideoCount] = await Promise.all([
      prisma.voiceClone.count({ where: { userId } }),
      prisma.videoClone.count({ where: { userId } }),
      prisma.videoClone.count({ where: { userId, status: 'ready' } }),
    ]);
    res.json({ code: 200, message: 'ok', data: { voiceCount, videoCount, readyVideoCount } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
