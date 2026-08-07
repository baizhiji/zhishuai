/**
 * 视频生产统一配置 — 共享类型定义
 *
 * 覆盖：配音（中英文/方言）、字幕（中英双语）、横幅贴片（Banner/Lower Third）
 * 所有视频类目（短视频/企业宣传/产品宣传/探店/MV/卡通/数字人/自由创意）共用此配置
 */

// ─── 配音配置 ────────────────────────────────

/** 配音方言/语言枚举 */
export type VoiceoverDialect =
  | 'none'
  | 'male-mandarin' | 'female-mandarin'
  | 'male-cantonese' | 'female-cantonese'
  | 'male-english' | 'female-english'
  | 'sichuan' | 'dongbei' | 'shanghai' | 'minnan'
  | 'henan' | 'hunan' | 'shaanxi' | 'tianjin';

export interface VoiceoverConfig {
  /** 是否启用配音 */
  enabled: boolean;
  /** 方言/语言选择 */
  dialect: VoiceoverDialect;
  /** 语速 0.5-2.0，默认 1.0 */
  speed: number;
  /** 音量 0-1，默认 0.8 */
  volume: number;
  /** 音调 -12 到 12，默认 0 */
  pitch: number;
  /** 自定义声音ID（声音克隆后使用） */
  customVoiceId?: string;
}

export interface VoiceoverOption {
  label: string;
  value: VoiceoverDialect;
  /** 所属 TTS 提供商 */
  provider?: 'alibaba' | 'tencent';
  /** 提供商 voice ID */
  voiceId?: string;
}

// ─── 字幕配置 ────────────────────────────────

export type SubtitleLanguage = 'none' | 'chinese' | 'english' | 'bilingual';

export interface SubtitleStyle {
  /** 字体颜色，默认 #FFFFFF */
  color: string;
  /** 字体大小 px，默认 32 */
  fontSize: number;
  /** 背景颜色（半透明黑底），默认 rgba(0,0,0,0.5) */
  backgroundColor: string;
  /** 字体族 */
  fontFamily: string;
  /** 描边颜色 */
  strokeColor: string;
  /** 描边宽度 */
  strokeWidth: number;
  /** 底部边距 px */
  bottomMargin: number;
}

export interface SubtitleConfig {
  /** 是否启��字幕 */
  enabled: boolean;
  /** 字幕语言 */
  language: SubtitleLanguage;
  /** 字幕样式 */
  style: SubtitleStyle;
  /** 中英文同时显示时，中文在上还是英文在上 */
  bilingualOrder: 'chinese-first' | 'english-first';
}

export interface SubtitleOption {
  label: string;
  value: SubtitleLanguage;
}

// ─── 横幅/贴片叠加层配置（Banner / Lower Third） ───

export type BannerType =
  | 'opening-title'     // 片头标题
  | 'lower-third'       // 人名/职位标注条
  | 'closing-credits'   // 片尾落款
  | 'call-to-action'    // 行动号召
  | 'watermark'         // 水印
  | 'scene-divider'     // 场景分隔提示
  | 'speech-bubble'     // 说话气泡
  | 'bullet-comment'    // 弹幕风格
  | 'brand-logo'        // 品牌Logo角标
  | 'progress-hint';    // 进度提示（"接下来..."）

export type BannerPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'full-width-top' | 'full-width-bottom';

export type BannerAnimation =
  | 'none'
  | 'fadeIn' | 'fadeOut'
  | 'slideUp' | 'slideDown'
  | 'slideLeft' | 'slideRight'
  | 'scale' | 'bounce'
  | 'typewriter';

export interface BannerStyle {
  /** 背景颜色 */
  backgroundColor: string;
  /** 文字颜色 */
  textColor: string;
  /** 字体大小 */
  fontSize: number;
  /** 字体族 */
  fontFamily: string;
  /** 内边距 px */
  padding: string;
  /** 圆角 px */
  borderRadius: number;
  /** 透明度 0-1 */
  opacity: number;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 图标名称（Lucide icon） */
  iconName?: string;
  /** 边框样式 */
  border?: string;
}

export interface BannerOverlay {
  /** 唯一标识 */
  id: string;
  /** 横幅类型 */
  type: BannerType;
  /** 显示内容（支持 {variable} 模板变量） */
  content: string;
  /** 副标题/第二行内容 */
  subContent?: string;
  /** 屏幕位置 */
  position: BannerPosition;
  /** 出场动画 */
  enterAnimation: BannerAnimation;
  /** 出场动画时长 ms */
  enterDuration: number;
  /** 离场动画 */
  exitAnimation: BannerAnimation;
  /** 离场动画时长 ms */
  exitDuration: number;
  /** 显示起始时间（秒），相对于视频开始 */
  startTime: number;
  /** 持续显示时长（秒） */
  duration: number;
  /** 视觉样式 */
  style: BannerStyle;
  /** 是否启用此横幅 */
  enabled: boolean;
}

export interface BannerOption {
  label: string;
  value: BannerType;
  description: string;
  /** 默认内容模板 */
  defaultContent: string;
  /** 默认位置 */
  defaultPosition: BannerPosition;
}

// ─── 背景音乐配置 ────────────────────────────

export type BgmMood =
  | 'none' | 'happy' | 'relaxing' | 'dynamic'
  | 'sad' | 'suspense' | 'tech' | 'classical'
  | 'lyrical' | 'business' | 'cheerful';

export interface BgmConfig {
  enabled: boolean;
  mood: BgmMood;
  volume: number;
  /** 是否循环 */
  loop: boolean;
  /** 自定义 BGM URL */
  customUrl?: string;
}

export interface BgmOption {
  label: string;
  value: BgmMood;
}

// ─── 视频尺寸配置 ────────────────────────────

export type VideoSize = '1080x1920' | '1920x1080' | '1080x1080';

export interface VideoSizeOption {
  label: string;
  value: VideoSize;
}

// ─── 统一视频生产配置 ───────────────────────

export interface VideoProductionConfig {
  /** 视频尺寸 */
  size: VideoSize;
  /** 视频时长（秒） */
  duration: number;
  /** 配音配置 */
  voiceover: VoiceoverConfig;
  /** 字幕配置 */
  subtitle: SubtitleConfig;
  /** 背景音乐配置 */
  bgm: BgmConfig;
  /** 横幅/贴片列表（按 startTime 自动排序） */
  banners: BannerOverlay[];
}

// ─── 默认配置 ───────────────────────────────

export const DEFAULT_VOICEOVER_CONFIG: VoiceoverConfig = {
  enabled: false,
  dialect: 'female-mandarin',
  speed: 1.0,
  volume: 0.8,
  pitch: 0,
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  color: '#FFFFFF',
  fontSize: 32,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  fontFamily: 'Douyin Sans, sans-serif',
  strokeColor: '#000000',
  strokeWidth: 2,
  bottomMargin: 80,
};

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  enabled: false,
  language: 'chinese',
  style: DEFAULT_SUBTITLE_STYLE,
  bilingualOrder: 'chinese-first',
};

export const DEFAULT_BGM_CONFIG: BgmConfig = {
  enabled: false,
  mood: 'none',
  volume: 0.3,
  loop: true,
};

export const DEFAULT_BANNER_STYLE: BannerStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  textColor: '#FFFFFF',
  fontSize: 28,
  fontFamily: 'Alimama ShuHeiTi, sans-serif',
  padding: '12px 24px',
  borderRadius: 8,
  opacity: 1,
};

export function createDefaultVideoConfig(duration: number = 30): VideoProductionConfig {
  return {
    size: '1080x1920',
    duration,
    voiceover: { ...DEFAULT_VOICEOVER_CONFIG },
    subtitle: { ...DEFAULT_SUBTITLE_CONFIG },
    bgm: { ...DEFAULT_BGM_CONFIG },
    banners: [],
  };
}
