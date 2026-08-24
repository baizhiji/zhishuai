/**
 * 智能剪辑成片路由
 *
 * 职责：把用户提供的多段素材视频拼接成一部带统一尺寸、可选字幕与 BGM 的成片（MP4）。
 * 解决电脑端 Web 版"智能剪辑"只能产出 FFmpeg 指令清单、无法直接交付成片的问题（蓝皮书铁律1：全类目产出最终交付物）。
 *
 * 流程：校验 URL → 逐段下载 → 归一化（统一尺寸/帧率/编码）→ concat 拼接 → 可选字幕 → 可选 BGM 混流 → 返回成片 URL
 */
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { authMiddleware } from '../middleware/auth';

const execFileAsync = promisify(execFile);
const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'video-edit');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_CLIPS = 10;
const MAX_DOWNLOAD_BYTES = 500 * 1024 * 1024; // 单素材 500MB 上限

/** 探测可用的 FFmpeg 二进制路径（优先 ffmpeg-static，回退系统 ffmpeg） */
async function detectFfmpeg(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const staticPath = require('ffmpeg-static') as string | undefined;
    if (staticPath && fs.existsSync(staticPath)) return staticPath;
  } catch {
    /* 未安装 ffmpeg-static，继续探测系统 ffmpeg */
  }
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 10000 });
    return 'ffmpeg';
  } catch {
    return null;
  }
}

/** 下载远程文件到本地（带大小上限） */
async function downloadFile(url: string, dest: string): Promise<void> {
  const resp = await fetch(url, { redirect: 'follow' });
  if (!resp.ok) throw new Error(`素材下载失败 (HTTP ${resp.status})`);
  const len = Number(resp.headers.get('content-length') || '0');
  if (len > MAX_DOWNLOAD_BYTES) throw new Error('素材文件过大（超过 500MB）');
  const buf = Buffer.from(await resp.arrayBuffer());
  if (buf.length > MAX_DOWNLOAD_BYTES) throw new Error('素材文件过大（超过 500MB）');
  fs.writeFileSync(dest, buf);
}

/** 归一化单个片段：统一尺寸/帧率/H.264/去音频，保证 concat 兼容 */
async function normalizeClip(ffmpeg: string, input: string, output: string, width: number, height: number, fps: number): Promise<void> {
  const vf = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,fps=${fps},format=yuv420p`;
  await execFileAsync(
    ffmpeg,
    ['-y', '-i', input, '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-an', output],
    { timeout: 600000, maxBuffer: 128 * 1024 * 1024 }
  );
}

/** 转义 ASS 文本中的特殊字符 */
function escapeAssText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/,/g, '\\,');
}

/** 生成简单 ASS 字幕文件（底部居中白字黑边，全程展示） */
function writeAssFile(filePath: string, text: string, width: number, height: number): void {
  const safe = escapeAssText(text);
  const ass = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: ' + width,
    'PlayResY: ' + height,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Microsoft YaHei,64,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,1,2,80,80,60,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    'Dialogue: 0,0:00:00.00,9:00:00.00,Default,,0,0,0,,' + safe,
    '',
  ].join('\n');
  fs.writeFileSync(filePath, ass, 'utf-8');
}

/**
 * POST /api/video-edit/compose
 * body: { clips: string[]; subtitleText?: string; bgmUrl?: string; size?: string; fps?: number }
 */
router.post('/compose', authMiddleware, async (req: Request, res: Response) => {
  const { clips, subtitleText, bgmUrl, size = '1080x1920', fps = 30 } = req.body || {};

  if (!Array.isArray(clips) || clips.length < 1 || clips.length > MAX_CLIPS) {
    return res.status(400).json({ success: false, error: { message: `clips 必须是 1-${MAX_CLIPS} 段的素材视频 URL 数组` } });
  }
  for (const url of clips) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ success: false, error: { message: '素材 URL 必须为 http/https 协议' } });
    }
  }
  if (bgmUrl && !/^https?:\/\//i.test(bgmUrl)) {
    return res.status(400).json({ success: false, error: { message: 'BGM URL 必须为 http/https 协议' } });
  }
  const sizeMatch = /^(\d{2,5})x(\d{2,5})$/.exec(size);
  if (!sizeMatch) {
    return res.status(400).json({ success: false, error: { message: 'size 格式必须为 WxH，如 1080x1920' } });
  }
  const width = parseInt(sizeMatch[1], 10);
  const height = parseInt(sizeMatch[2], 10);
  const fpsNum = Number(fps);
  if (!Number.isFinite(fpsNum) || fpsNum < 1 || fpsNum > 60) {
    return res.status(400).json({ success: false, error: { message: 'fps 必须在 1-60 之间' } });
  }

  const ffmpeg = await detectFfmpeg();
  if (!ffmpeg) {
    return res.status(503).json({ success: false, error: { message: '服务端未检测到 FFmpeg，无法合成成片' } });
  }

  const workId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const workDir = path.join(UPLOAD_DIR, workId);
  fs.mkdirSync(workDir, { recursive: true });
  const outPath = path.join(UPLOAD_DIR, `${workId}.mp4`);

  try {
    // 1. 下载全部素材
    const srcPaths: string[] = [];
    for (let i = 0; i < clips.length; i++) {
      const p = path.join(workDir, `src-${i}.bin`);
      await downloadFile(clips[i], p);
      srcPaths.push(p);
    }

    // 2. 逐段归一化
    const normPaths: string[] = [];
    for (let i = 0; i < srcPaths.length; i++) {
      const p = path.join(workDir, `norm-${i}.mp4`);
      await normalizeClip(ffmpeg, srcPaths[i], p, width, height, fpsNum);
      normPaths.push(p);
    }

    // 3. concat 拼接（同一编码直接 copy）
    const listPath = path.join(workDir, 'list.txt');
    fs.writeFileSync(
      listPath,
      normPaths.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'),
      'utf-8'
    );
    const concatPath = path.join(workDir, 'concat.mp4');
    await execFileAsync(
      ffmpeg,
      ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', concatPath],
      { timeout: 600000, maxBuffer: 128 * 1024 * 1024 }
    );

    // 4. 可选字幕（重编码压入 ASS）
    let currentPath = concatPath;
    if (subtitleText && subtitleText.trim()) {
      const assPath = path.join(workDir, 'subtitle.ass');
      writeAssFile(assPath, subtitleText.trim(), width, height);
      const subbedPath = path.join(workDir, 'subbed.mp4');
      await execFileAsync(
        ffmpeg,
        ['-y', '-i', currentPath, '-vf', `ass=${assPath.replace(/\\/g, '/')}`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', subbedPath],
        { timeout: 600000, maxBuffer: 128 * 1024 * 1024 }
      );
      currentPath = subbedPath;
    }

    // 5. 可选 BGM 混流，否则拷贝输出
    if (bgmUrl) {
      const bgmPath = path.join(workDir, 'bgm.bin');
      await downloadFile(bgmUrl, bgmPath);
      await execFileAsync(
        ffmpeg,
        ['-y', '-i', currentPath, '-i', bgmPath, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', outPath],
        { timeout: 600000, maxBuffer: 128 * 1024 * 1024 }
      );
    } else {
      await execFileAsync(
        ffmpeg,
        ['-y', '-i', currentPath, '-c', 'copy', '-movflags', '+faststart', outPath],
        { timeout: 600000, maxBuffer: 128 * 1024 * 1024 }
      );
    }

    fs.rmSync(workDir, { recursive: true, force: true });

    res.json({ success: true, data: { videoUrl: `/uploads/video-edit/${path.basename(outPath)}` } });
  } catch (err: any) {
    console.error('[video-edit] 智能剪辑成片失败:', err?.message || err);
    fs.rmSync(workDir, { recursive: true, force: true });
    fs.rmSync(outPath, { force: true });
    res.status(500).json({ success: false, error: { message: err?.message || '智能剪辑成片失败' } });
  }
});

export default router;
