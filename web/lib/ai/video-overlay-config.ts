/**
 * 横幅/贴片叠加层预设库
 *
 * 提供 10 种横幅类型的完整可视化预设，
 * 每个预设可直接用于视频生成，也支持用户自定义。
 */
import type { BannerOverlay, BannerOption, BannerType, BannerStyle } from '@/../shared/types/video-production';

// ─── 横幅类型选项（UI 选择器用） ────────────

export const bannerOptions: BannerOption[] = [
  {
    label: '片头标题',
    value: 'opening-title',
    description: '视频开头的标题展示，居中大字',
    defaultContent: '请输入视频标题',
    defaultPosition: 'middle-center',
  },
  {
    label: '人名标注条',
    value: 'lower-third',
    description: '画面下方的人名、职位、地点等信息条',
    defaultContent: '张三 | 产品经理',
    defaultPosition: 'full-width-bottom',
  },
  {
    label: '片尾落款',
    value: 'closing-credits',
    description: '视频结尾的品牌Logo+口号',
    defaultContent: '智枢AI · 让创作更智能',
    defaultPosition: 'bottom-center',
  },
  {
    label: '行动号召',
    value: 'call-to-action',
    description: '引导用户点击、关注、购买的提示条',
    defaultContent: '点击下方链接了解更多 →',
    defaultPosition: 'bottom-center',
  },
  {
    label: '水印',
    value: 'watermark',
    description: '半透明品牌水印，全程显示',
    defaultContent: '@智枢AI',
    defaultPosition: 'bottom-right',
  },
  {
    label: '场景分隔',
    value: 'scene-divider',
    description: '场景切换时的过渡提示文字',
    defaultContent: '第二章',
    defaultPosition: 'middle-center',
  },
  {
    label: '说话气泡',
    value: 'speech-bubble',
    description: '模拟对话的气泡框',
    defaultContent: '这个功能太强了！',
    defaultPosition: 'bottom-left',
  },
  {
    label: '弹幕风格',
    value: 'bullet-comment',
    description: '从右到左飘过的弹幕文字',
    defaultContent: '666666',
    defaultPosition: 'top-center',
  },
  {
    label: '品牌角标',
    value: 'brand-logo',
    description: '角落品牌Logo标识',
    defaultContent: '智枢',
    defaultPosition: 'top-right',
  },
  {
    label: '进度提示',
    value: 'progress-hint',
    description: '预告接下来内容',
    defaultContent: '接下来：核心功能介绍',
    defaultPosition: 'bottom-center',
  },
];

// ─── 横幅样式预设 ──────────────────────────

export interface BannerStylePreset {
  name: string;
  style: BannerStyle;
}

/** 深色半透明底 + 白字（通用风格） */
export const STYLE_DARK_OVERLAY: BannerStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  textColor: '#FFFFFF',
  fontSize: 28,
  fontFamily: 'Alimama ShuHeiTi, sans-serif',
  padding: '12px 24px',
  borderRadius: 8,
  opacity: 1,
};

/** 渐变品牌色底（智枢蓝紫渐变） */
export const STYLE_BRAND_GRADIENT: BannerStyle = {
  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  textColor: '#FFFFFF',
  fontSize: 32,
  fontFamily: 'Alimama ShuHeiTi, sans-serif',
  padding: '16px 32px',
  borderRadius: 12,
  opacity: 1,
};

/** 纯白卡片 + 深色字（干净商务风） */
export const STYLE_CLEAN_CARD: BannerStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  textColor: '#1a1a2e',
  fontSize: 24,
  fontFamily: 'Montserrat, sans-serif',
  padding: '10px 20px',
  borderRadius: 6,
  opacity: 1,
};

/** 毛玻璃效果 */
export const STYLE_GLASS: BannerStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  textColor: '#FFFFFF',
  fontSize: 26,
  fontFamily: 'Douyin Sans, sans-serif',
  padding: '12px 24px',
  borderRadius: 12,
  opacity: 0.95,
};

/** 醒目红底 + 白字（CTA/促销用） */
export const STYLE_CTA_RED: BannerStyle = {
  backgroundColor: 'rgba(220, 38, 38, 0.9)',
  textColor: '#FFFFFF',
  fontSize: 26,
  fontFamily: 'Alimama ShuHeiTi, sans-serif',
  padding: '14px 28px',
  borderRadius: 24,
  opacity: 1,
};

/** 极简线框 */
export const STYLE_MINIMAL_BORDER: BannerStyle = {
  backgroundColor: 'transparent',
  textColor: '#FFFFFF',
  fontSize: 24,
  fontFamily: 'Montserrat, sans-serif',
  padding: '8px 16px',
  borderRadius: 4,
  opacity: 0.85,
  border: '1px solid rgba(255, 255, 255, 0.5)',
};

/** 半透明黑底 + 金色字（高级感） */
export const STYLE_PREMIUM_GOLD: BannerStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  textColor: '#D4AF37',
  fontSize: 30,
  fontFamily: 'Alimama ShuHeiTi, sans-serif',
  padding: '14px 28px',
  borderRadius: 8,
  opacity: 1,
};

/** 字幕风格条（底部通栏） */
export const STYLE_SUBTITLE_BAR: BannerStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  textColor: '#FFFFFF',
  fontSize: 28,
  fontFamily: 'Douyin Sans, sans-serif',
  padding: '8px 0',
  borderRadius: 0,
  opacity: 1,
};

export const bannerStylePresets: BannerStylePreset[] = [
  { name: '深色半透明', style: STYLE_DARK_OVERLAY },
  { name: '品牌渐变', style: STYLE_BRAND_GRADIENT },
  { name: '干净卡片', style: STYLE_CLEAN_CARD },
  { name: '毛玻璃', style: STYLE_GLASS },
  { name: '醒目红底', style: STYLE_CTA_RED },
  { name: '极简线框', style: STYLE_MINIMAL_BORDER },
  { name: '高级金色', style: STYLE_PREMIUM_GOLD },
  { name: '字幕通栏', style: STYLE_SUBTITLE_BAR },
];

// ─── 横幅预设模板工厂函数 ──────────────────

let bannerIdCounter = 0;
function nextBannerId(): string {
  return `banner-${Date.now()}-${++bannerIdCounter}`;
}

/**
 * 根据类型创建横幅预设
 */
export function createBannerPreset(
  type: BannerType,
  overrides?: Partial<BannerOverlay>
): BannerOverlay {
  const option = bannerOptions.find(o => o.value === type);
  const defaults: Record<BannerType, Partial<BannerOverlay>> = {
    'opening-title': {
      content: '视频标题',
      position: 'middle-center',
      enterAnimation: 'scale',
      enterDuration: 800,
      exitAnimation: 'fadeOut',
      exitDuration: 500,
      startTime: 0,
      duration: 3,
      style: { ...STYLE_BRAND_GRADIENT },
    },
    'lower-third': {
      content: '人物姓名 | 职位',
      position: 'full-width-bottom',
      enterAnimation: 'slideUp',
      enterDuration: 400,
      exitAnimation: 'slideDown',
      exitDuration: 300,
      startTime: 1,
      duration: 5,
      style: { ...STYLE_DARK_OVERLAY },
    },
    'closing-credits': {
      content: '智枢AI · 让创作更智能',
      position: 'bottom-center',
      enterAnimation: 'fadeIn',
      enterDuration: 1000,
      exitAnimation: 'fadeOut',
      exitDuration: 800,
      startTime: -3,
      duration: 3,
      style: { ...STYLE_DARK_OVERLAY },
    },
    'call-to-action': {
      content: '点击下方链接了解更多 →',
      position: 'bottom-center',
      enterAnimation: 'bounce',
      enterDuration: 600,
      exitAnimation: 'fadeOut',
      exitDuration: 400,
      startTime: -5,
      duration: 5,
      style: { ...STYLE_CTA_RED },
    },
    'watermark': {
      content: '@智枢AI',
      position: 'bottom-right',
      enterAnimation: 'fadeIn',
      enterDuration: 2000,
      exitAnimation: 'none',
      exitDuration: 0,
      startTime: 0,
      duration: 999,
      style: { ...STYLE_DARK_OVERLAY, opacity: 0.4, fontSize: 18, padding: '4px 12px' },
    },
    'scene-divider': {
      content: '下一章',
      position: 'middle-center',
      enterAnimation: 'scale',
      enterDuration: 500,
      exitAnimation: 'fadeOut',
      exitDuration: 400,
      startTime: 10,
      duration: 2,
      style: { ...STYLE_CLEAN_CARD, fontSize: 36 },
    },
    'speech-bubble': {
      content: '说点什么...',
      position: 'bottom-left',
      enterAnimation: 'slideUp',
      enterDuration: 400,
      exitAnimation: 'fadeOut',
      exitDuration: 300,
      startTime: 3,
      duration: 4,
      style: { ...STYLE_DARK_OVERLAY, borderRadius: 20, showIcon: true, iconName: 'message-circle' },
    },
    'bullet-comment': {
      content: '666666',
      position: 'top-center',
      enterAnimation: 'slideRight',
      enterDuration: 3000,
      exitAnimation: 'none',
      exitDuration: 0,
      startTime: 2,
      duration: 3,
      style: { ...STYLE_DARK_OVERLAY, opacity: 0.7, fontSize: 24 },
    },
    'brand-logo': {
      content: '智枢',
      position: 'top-right',
      enterAnimation: 'fadeIn',
      enterDuration: 500,
      exitAnimation: 'none',
      exitDuration: 0,
      startTime: 0,
      duration: 999,
      style: { ...STYLE_DARK_OVERLAY, opacity: 0.6, fontSize: 20, padding: '6px 14px' },
    },
    'progress-hint': {
      content: '接下来：核心功能展示',
      position: 'bottom-center',
      enterAnimation: 'slideUp',
      enterDuration: 400,
      exitAnimation: 'fadeOut',
      exitDuration: 500,
      startTime: 5,
      duration: 3,
      style: { ...STYLE_DARK_OVERLAY, fontSize: 22 },
    },
  };

  const base = defaults[type] || {};
  return {
    id: nextBannerId(),
    type,
    enabled: true,
    ...base,
    ...overrides,
    style: { ...(base.style || STYLE_DARK_OVERLAY), ...(overrides?.style || {}) },
  } as BannerOverlay;
}

/**
 * 为指定视频时长创建一套推荐的横幅组合
 */
export function createRecommendedBanners(durationSeconds: number, videoType: string): BannerOverlay[] {
  const banners: BannerOverlay[] = [];

  // 水印（几乎所有视频都加）
  if (videoType !== 'digital-human') {
    banners.push(createBannerPreset('watermark'));
  }

  // 片头标题
  banners.push(createBannerPreset('opening-title', { duration: Math.min(3, durationSeconds * 0.1) }));

  // 场景分隔（长视频加）
  if (durationSeconds > 30) {
    const midPoint = Math.floor(durationSeconds / 2);
    banners.push(createBannerPreset('scene-divider', { startTime: midPoint, duration: 2 }));
  }

  // 行动号召（片尾）
  banners.push(createBannerPreset('call-to-action', {
    startTime: durationSeconds - 5,
    duration: 5,
  }));

  // 企业宣传类额外加品牌角标
  if (videoType === 'enterprise-video' || videoType === 'product-video') {
    banners.push(createBannerPreset('brand-logo'));
  }

  return banners;
}

/**
 * 将横幅配置转换为给 AI 模型的 prompt 描述
 */
export function bannersToPrompt(banners: BannerOverlay[]): string {
  if (banners.length === 0) return '无横幅/贴片叠加';

  return banners
    .filter(b => b.enabled)
    .map(b => {
      const typeLabel = bannerOptions.find(o => o.value === b.type)?.label || b.type;
      return `[${typeLabel}] 位置:${b.position} | 内容:"${b.content}" | ${b.startTime}s起持续${b.duration}s | 入场:${b.enterAnimation}`;
    })
    .join('\n');
}
