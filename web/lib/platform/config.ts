// 平台枚举
export enum Platform {
  DOUYIN = 'douyin', // 抖音
  KUAISHOU = 'kuaishou', // 快手
  BILIBILI = 'bilibili', // B站
  XIAOHONGSHU = 'xiaohongshu', // 小红书
  WECHAT = 'wechat', // 微信视频号
  WEIBO = 'weibo', // 微博
  TIKTOK = 'tiktok', // TikTok（海外）
  YOUTUBE = 'youtube', // YouTube（海外）
}

// 平台配置
export const platformConfig: Record<
  Platform,
  {
    label: string;
    icon: string;
    color: string;
    maxScheduledDays: number; // 最大定时发布天数
    maxVideosPerDay: number; // 每日最多发布视频数
    supportsBatch: boolean; // 是否支持批量发布
  }
> = {
  [Platform.DOUYIN]: {
    label: '抖音',
    icon: 'FireOutlined',
    color: '#ff0000',
    maxScheduledDays: 7,
    maxVideosPerDay: 3,
    supportsBatch: true,
  },
  [Platform.KUAISHOU]: {
    label: '快手',
    icon: 'CameraOutlined',
    color: '#ff5000',
    maxScheduledDays: 7,
    maxVideosPerDay: 5,
    supportsBatch: true,
  },
  [Platform.BILIBILI]: {
    label: 'B站',
    icon: 'PlayCircleOutlined',
    color: '#00aeec',
    maxScheduledDays: 10,
    maxVideosPerDay: 2,
    supportsBatch: true,
  },
  [Platform.XIAOHONGSHU]: {
    label: '小红书',
    icon: 'HeartOutlined',
    color: '#ff2442',
    maxScheduledDays: 7,
    maxVideosPerDay: 5,
    supportsBatch: true,
  },
  [Platform.WECHAT]: {
    label: '微信视频号',
    icon: 'WechatOutlined',
    color: '#07c160',
    maxScheduledDays: 5,
    maxVideosPerDay: 2,
    supportsBatch: false,
  },
  [Platform.WEIBO]: {
    label: '微博',
    icon: 'WeiboOutlined',
    color: '#e6162d',
    maxScheduledDays: 7,
    maxVideosPerDay: 10,
    supportsBatch: true,
  },
  [Platform.TIKTOK]: {
    label: 'TikTok',
    icon: 'PlaySquareOutlined',
    color: '#000000',
    maxScheduledDays: 10,
    maxVideosPerDay: 4,
    supportsBatch: true,
  },
  [Platform.YOUTUBE]: {
    label: 'YouTube',
    icon: 'YoutubeOutlined',
    color: '#ff0000',
    maxScheduledDays: 30,
    maxVideosPerDay: 1,
    supportsBatch: false,
  },
};

// 平台账号接口
export interface PlatformAccount {
  id: string;
  platform: Platform;
  accountName: string;
  avatar: string;
  fans: number;
  status: 'active' | 'inactive' | 'expired';
  lastSync: string;
  autoPublish: boolean;
}

// Mock 账号数据已移除 — 所有平台账号通过 API /api/matrix/accounts 获取
