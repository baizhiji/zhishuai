/**
 * 视频质量增强服务
 * 注意：视频增强/封面生成/平台适配能力尚未接入真实视频处理服务。
 * 商用原则：禁止返回假成功，未接入时明确抛错，由前端感知真实失败。
 */

export interface VideoEnhanceOptions {
  resolution?: '720p' | '1080p' | '2k';
  fps?: 30 | 60;
  colorEnhance?: boolean;
  audioEnhance?: boolean;
}

export interface VideoEnhanceResult {
  success: boolean;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  message?: string;
}

const NOT_IMPLEMENTED_MESSAGE =
  '视频增强能力尚未接入视频处理服务，请先配置视频处理 API 后重试';

/**
 * 视频质量增强
 */
export async function enhanceVideo(
  videoUrl: string,
  options: VideoEnhanceOptions = {}
): Promise<VideoEnhanceResult> {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

/**
 * 生成视频封面
 */
export async function generateVideoCover(videoUrl: string): Promise<string> {
  throw new Error('视频封面生成能力尚未接入，请先配置封面生成服务后重试');
}

/**
 * 视频平台适配
 */
export function adaptForPlatform(
  videoUrl: string,
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'video'
): VideoEnhanceResult {
  throw new Error('视频平台适配能力尚未接入，请先配置适配服务后重试');
}

export default { enhanceVideo, generateVideoCover, adaptForPlatform };
