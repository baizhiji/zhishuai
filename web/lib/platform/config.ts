// 平台枚举
export enum Platform {
  DOUYIN = 'douyin',           // 抖音
  KUAISHOU = 'kuaishou',       // 快手
  BILIBILI = 'bilibili',       // B站
  XIAOHONGSHU = 'xiaohongshu', // 小红书
  WECHAT = 'wechat',           // 微信视频号
  WEIBO = 'weibo',             // 微博
  TIKTOK = 'tiktok',           // TikTok（海外）
  YOUTUBE = 'youtube',         // YouTube（海外）
}

// 平台配置
export const platformConfig: Record<Platform, {
  label: string
  icon: string
  color: string
  maxScheduledDays: number  // 最大定时发布天数
  maxVideosPerDay: number   // 每日最多发布视频数
  supportsBatch: boolean    // 是否支持批量发布
}> = {
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
}

// 平台账号接口
export interface PlatformAccount {
  id: string
  platform: Platform
  accountName: string
  avatar: string
  fans: number
  status: 'active' | 'inactive' | 'expired'
  lastSync: string
  autoPublish: boolean
}

// 模拟账号数据
export const mockAccounts: PlatformAccount[] = [
  // 抖音账号
  {
    id: 'douyin_1',
    platform: Platform.DOUYIN,
    accountName: '小明生活',
    avatar: 'https://via.placeholder.com/150?text=抖音1',
    fans: 150000,
    status: 'active',
    lastSync: '2024-01-15 10:30:00',
    autoPublish: true,
  },
  {
    id: 'douyin_2',
    platform: Platform.DOUYIN,
    accountName: '小红美食',
    avatar: 'https://via.placeholder.com/150?text=抖音2',
    fans: 85000,
    status: 'active',
    lastSync: '2024-01-15 10:25:00',
    autoPublish: true,
  },
  // 快手账号
  {
    id: 'kuaishou_1',
    platform: Platform.KUAISHOU,
    accountName: '快手上手',
    avatar: 'https://via.placeholder.com/150?text=快手1',
    fans: 120000,
    status: 'active',
    lastSync: '2024-01-15 10:20:00',
    autoPublish: true,
  },
  // B站账号
  {
    id: 'bilibili_1',
    platform: Platform.BILIBILI,
    accountName: 'B站UP主',
    avatar: 'https://via.placeholder.com/150?text=B站1',
    fans: 50000,
    status: 'active',
    lastSync: '2024-01-15 10:15:00',
    autoPublish: true,
  },
  // 小红书账号
  {
    id: 'xiaohongshu_1',
    platform: Platform.XIAOHONGSHU,
    accountName: '小红书博主',
    avatar: 'https://via.placeholder.com/150?text=小红书1',
    fans: 200000,
    status: 'active',
    lastSync: '2024-01-15 10:10:00',
    autoPublish: true,
  },
  // 微信视频号
  {
    id: 'wechat_1',
    platform: Platform.WECHAT,
    accountName: '视频号',
    avatar: 'https://via.placeholder.com/150?text=微信1',
    fans: 80000,
    status: 'active',
    lastSync: '2024-01-15 10:05:00',
    autoPublish: true,
  },
]
