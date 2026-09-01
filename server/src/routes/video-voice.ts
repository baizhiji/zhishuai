/**
 * 视频配音合成路由
 *
 * 职责：将前端生成的 TTS 配音音频（audioUrl）合入视频生成模型产出的画面（videoUrl），
 * 产出带真实人声配音的成片。解决"视频模型只按 prompt 文本描述配音、音色不可控"的问题。
 *
 * 流程：校验 URL → 下载视频/音频到本地 → FFmpeg 合成（视频流 copy，仅编码音频）→ 返回可访问 URL
 * FFmpeg 二进制来源：优先 ffmpeg-static（npm 依赖自带），否则回退系统 ffmpeg。
 */
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { authMiddleware } from '../middleware/auth';
import { chatCompletion, textToSpeech } from '../services/ai-client';

const execFileAsync = promisify(execFile);
const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'video-voice');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** TTS 音频缓存目录（幂等：同音色+同文案不重复合成/扣费） */
const TTS_CACHE_DIR = path.join(UPLOAD_DIR, 'tts-cache');
fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });

/** 探测可用的 FFmpeg 二进制路径（优先 ffmpeg-static，回退系统 ffmpeg） */
async function detectFfmpeg(): Promise<string | null> {
  // 1. ffmpeg-static（npm 依赖，自带二进制；若下载失败则文件不存在）
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const staticPath = require('ffmpeg-static') as string | undefined;
    if (staticPath && fs.existsSync(staticPath)) return staticPath;
  } catch {
    /* 未安装 ffmpeg-static，继续探测系统 ffmpeg */
  }
  // 2. 系统 ffmpeg（execFile 在 Windows/Linux 均会检索 PATH）
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 10000 });
    return 'ffmpeg';
  } catch {
    return null;
  }
}

/** 下载远程文件到本地 */
async function downloadFile(url: string, dest: string): Promise<void> {
  const resp = await fetch(url, { redirect: 'follow' });
  if (!resp.ok) throw new Error(`下载失败 (${resp.status})`);
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

/** 合成：尝试视频流 copy 快速模式，失败则降级为转码模式 */
async function mergeAudioIntoVideo(
  ffmpeg: string,
  videoPath: string,
  audioPath: string,
  outPath: string
): Promise<void> {
  const common = ['-y', '-i', videoPath, '-i', audioPath, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-af', 'apad', '-shortest', '-movflags', '+faststart'];
  try {
    await execFileAsync(ffmpeg, [...common, '-c:v', 'copy', outPath], { timeout: 300000, maxBuffer: 128 * 1024 * 1024 });
    return;
  } catch {
    // 源视频编码不兼容 mp4 容器（如 webm/vp9），转码重试
    try {
      await execFileAsync(ffmpeg, [...common, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', outPath], { timeout: 600000, maxBuffer: 128 * 1024 * 1024 });
      return;
    } catch (err: any) {
      throw new Error(`FFmpeg 合成失败: ${err?.message || '未知错误'}`);
    }
  }
}

/**
 * POST /api/video-voice/synthesize
 * body: { videoUrl: string; audioUrl: string }
 */
router.post('/synthesize', authMiddleware, async (req: Request, res: Response) => {
  const { videoUrl, audioUrl } = req.body || {};
  if (!videoUrl || !audioUrl) {
    return res.status(400).json({ success: false, error: { message: 'videoUrl 和 audioUrl 必填' } });
  }
  if (!/^https?:\/\//i.test(videoUrl) || !/^https?:\/\//i.test(audioUrl)) {
    return res.status(400).json({ success: false, error: { message: 'URL 必须为 http/https 协议' } });
  }

  const stamp = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const videoPath = path.join(UPLOAD_DIR, `${stamp}-src.bin`);
  const audioPath = path.join(UPLOAD_DIR, `${stamp}-audio.bin`);
  const outPath = path.join(UPLOAD_DIR, `${stamp}.mp4`);

  try {
    const ffmpeg = await detectFfmpeg();
    if (!ffmpeg) {
      return res.status(503).json({ success: false, error: { message: '服务端未检测到 FFmpeg，无法合成配音。请安装依赖：npm i ffmpeg-static 或系统安装 ffmpeg' } });
    }

    await Promise.all([
      downloadFile(videoUrl, videoPath),
      downloadFile(audioUrl, audioPath),
    ]);

    await mergeAudioIntoVideo(ffmpeg, videoPath, audioPath, outPath);

    // 清理中间文件（保留成片）
    fs.rmSync(videoPath, { force: true });
    fs.rmSync(audioPath, { force: true });

    res.json({ success: true, data: { videoUrl: `/uploads/video-voice/${path.basename(outPath)}` } });
  } catch (err: any) {
    console.error('[video-voice] 配音合成失败:', err?.message || err);
    // 出错时清理所有临时文件
    [videoPath, audioPath, outPath].forEach(p => fs.rmSync(p, { force: true }));
    res.status(500).json({ success: false, error: { message: err?.message || '配音合成失败' } });
  }
});

// ─── 真实配音附着（一键链路：口播文案 → TTS 合成 → FFmpeg 合流） ───

/** 配音值 → 阿里云 Qwen3-TTS-Flash 音色映射（与电脑版 desktop-ui dialectVoiceMap 完全一致） */
const DIALECT_VOICE_MAP: Record<string, { voiceId: string; label: string }> = {
  'male-mandarin': { voiceId: 'Ethan', label: '男声-普通话' },
  'female-mandarin': { voiceId: 'Cherry', label: '女声-普通话' },
  'male-sichuan': { voiceId: 'Eric', label: '男声-四川话' },
  'female-sichuan': { voiceId: 'Sunny', label: '女声-四川话' },
  'male-cantonese': { voiceId: 'Rocky', label: '男声-粤语' },
  'female-cantonese': { voiceId: 'Kiki', label: '女声-粤语' },
  'male-english': { voiceId: 'Aiden', label: '男声-英语' },
  'female-english': { voiceId: 'Jennifer', label: '女声-英语' },
  shanghai: { voiceId: 'Jada', label: '上海话(女)' },
  beijing: { voiceId: 'Dylan', label: '北京话(男)' },
  nanjing: { voiceId: 'Li', label: '南京话(男)' },
  shaanxi: { voiceId: 'Marcus', label: '陕西话(男)' },
  minnan: { voiceId: 'Roy', label: '闽南语(男)' },
  tianjin: { voiceId: 'Peter', label: '天津话(男)' },
};

/** 口播文案候选模型（优先级与电脑版一致：阿里 qwen3.8-max → 腾讯 deepseek-v4-pro-202606） */
const VOICEOVER_SCRIPT_CANDIDATES: { provider: 'alibaba' | 'tencent'; modelId: string }[] = [
  { provider: 'alibaba', modelId: 'qwen3.8-max' },
  { provider: 'tencent', modelId: 'deepseek-v4-pro-202606' },
];

/** 配音 TTS 模型（方言/多音色，支持 51 种音色） */
const VOICEOVER_TTS_MODEL = 'qwen3-tts-flash';

/** 根据主题生成 120-220 字自然口语化口播旁白文案 */
async function generateVoiceoverScript(userId: string, topic: string): Promise<string> {
  for (const { provider, modelId } of VOICEOVER_SCRIPT_CANDIDATES) {
    try {
      const script = await chatCompletion(userId, {
        model: modelId,
        provider,
        messages: [
          { role: 'system', content: '你是一名短视频口播文案编剧。根据主题写一段自然、口语化、有感染力的口播旁白文案。直接输出文案本身，不要标题、不要序号、不要任何解释，控制在 120-220 字。' },
          { role: 'user', content: `主题与要求：\n${topic.slice(0, 1500)}\n\n请输出口播旁白文案：` },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });
      const cleaned = (script || '').replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').trim();
      if (cleaned.length >= 20) return cleaned;
    } catch {
      /* 尝试下一个 provider */
    }
  }
  return '';
}

/**
 * POST /api/video-voice/attach
 * body: { videoUrl: string; voiceover: string; topic?: string; script?: string }
 * 一键完成真实配音：口播文案生成 → 阿里云 Qwen3-TTS-Flash 合成 → FFmpeg 合入视频。
 * 供移动端（无本地 ffmpeg/API Key）零配置调用；失败抛出明确错误，客户端静默回退原视频。
 */
router.post('/attach', authMiddleware, async (req: Request, res: Response) => {
  const { videoUrl, voiceover, topic = '', script } = req.body || {};
  const voice = DIALECT_VOICE_MAP[voiceover];
  if (!videoUrl) {
    return res.status(400).json({ success: false, error: { message: 'videoUrl 必填' } });
  }
  if (!/^https?:\/\//i.test(videoUrl)) {
    return res.status(400).json({ success: false, error: { message: 'videoUrl 必须为 http/https 协议' } });
  }
  if (!voice) {
    return res.status(400).json({ success: false, error: { message: `不支持的配音选项: ${voiceover}` } });
  }

  const userId = String((req as any).userId || '');
  const stamp = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const videoPath = path.join(UPLOAD_DIR, `${stamp}-src.bin`);
  const audioPath = path.join(UPLOAD_DIR, `${stamp}-audio.bin`);
  const outPath = path.join(UPLOAD_DIR, `${stamp}.mp4`);

  try {
    const ffmpeg = await detectFfmpeg();
    if (!ffmpeg) {
      return res.status(503).json({ success: false, error: { message: '服务端未检测到 FFmpeg，无法合成配音。请安装依赖：npm i ffmpeg-static 或系统安装 ffmpeg' } });
    }

    // 1. 口播文案：优先客户端显式传入，否则由 LLM 生成
    const text = script && script.trim().length >= 20
      ? script.trim()
      : await generateVoiceoverScript(userId, topic);
    if (!text) {
      return res.status(422).json({ success: false, error: { message: '口播文案生成失败，请稍后重试' } });
    }

    // 2. 阿里云 Qwen3-TTS-Flash 合成配音音频（幂等：同音色+同文案复用缓存）
    const ttsCachePath = path.join(TTS_CACHE_DIR, `${crypto.createHash('sha1').update(`${voice.voiceId}:${text.slice(0, 500)}`).digest('hex')}.mp3`);
    if (!fs.existsSync(ttsCachePath)) {
      const tts = await textToSpeech(userId, {
        text: text.slice(0, 500),
        voice: voice.voiceId,
        model: VOICEOVER_TTS_MODEL,
        format: 'mp3',
      });
      if (!tts?.url) {
        return res.status(422).json({ success: false, error: { message: '语音合成失败，请确认账户已配置阿里云 API Key' } });
      }
      const ttsResp = await fetch(tts.url, { redirect: 'follow' });
      if (!ttsResp.ok) throw new Error('TTS 音频下载失败');
      fs.writeFileSync(ttsCachePath, Buffer.from(await ttsResp.arrayBuffer()));
    }
    fs.copyFileSync(ttsCachePath, audioPath);

    // 3. 下载视频 → FFmpeg 合流
    await downloadFile(videoUrl, videoPath);
    await mergeAudioIntoVideo(ffmpeg, videoPath, audioPath, outPath);

    fs.rmSync(videoPath, { force: true });
    fs.rmSync(audioPath, { force: true });

    res.json({ success: true, data: { videoUrl: `/uploads/video-voice/${path.basename(outPath)}`, script: text } });
  } catch (err: any) {
    console.error('[video-voice] 配音附着失败:', err?.message || err);
    [videoPath, audioPath, outPath].forEach(p => fs.rmSync(p, { force: true }));
    res.status(500).json({ success: false, error: { message: err?.message || '配音附着失败' } });
  }
});

export default router;
