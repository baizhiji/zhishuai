/**
 * 直播间数据采集服务
 * 支持抖音、快手等平台的弹幕和观众数据采集
 */

interface LiveConfig {
  platform: 'douyin' | 'kuaishou';
  roomId: string;
  apiKey?: string;
}

interface Danmu {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  timestamp: Date;
  isFollower: boolean;
  isVIP: boolean;
  intentScore?: number;
  gift?: {
    name: string;
    count: number;
    value: number;
  };
}

interface Viewer {
  id: string;
  nickname: string;
  avatar: string;
  followStatus: 'following' | 'followers' | 'stranger';
  isFanClub: boolean;
  intentScore: number;
}

interface LiveStats {
  viewerCount: number;
  likeCount: number;
  followerCount: number;
  duration: number;
  peakViewers: number;
}

function assertApiKey(config: LiveConfig): string {
  if (!config.apiKey) {
    throw new Error(
      `${config.platform} 直播平台 API 未配置，请在环境变量中配置 ${config.platform === 'douyin' ? 'DOUYIN_API_KEY' : 'KUAISHOU_API_KEY'}（开放平台应用凭证），或使用 Playwright 页面采集方案`
    );
  }
  return config.apiKey;
}

/**
 * 获取直播间弹幕
 */
export async function getDanmu(
  config: LiveConfig
): Promise<{ danmu: Danmu[]; newLeads: Danmu[] }> {
  const { platform, roomId } = config;
  assertApiKey(config);

  let data: any;
  if (platform === 'douyin') {
    const response = await fetch(
      `https://open.douyin.com/live/room/danmu?room_id=${roomId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error(`抖音直播API错误: ${response.status}`);
    data = await response.json();
    const list: any[] = data?.data?.danmu_list || [];
    return {
      danmu: list,
      newLeads: list.filter((d: any) => hasPurchaseIntent(d.content)),
    };
  }

  if (platform === 'kuaishou') {
    const response = await fetch(
      `https://open.kuaishou.com/api/live/danmu?room_id=${roomId}`,
      {
        headers: { 'Authorization': config.apiKey },
      }
    );
    if (!response.ok) throw new Error(`快手直播API错误: ${response.status}`);
    data = await response.json();
    const list: any[] = data?.list || [];
    return {
      danmu: list,
      newLeads: list.filter((d: any) => hasPurchaseIntent(d.content)),
    };
  }

  throw new Error(`不支持的直播平台: ${platform}`);
}

/**
 * 获取直播间观众列表
 */
export async function getLiveViewers(
  config: LiveConfig
): Promise<{ viewers: Viewer[]; total: number }> {
  const { platform, roomId } = config;
  assertApiKey(config);

  let data: any;
  if (platform === 'douyin') {
    const response = await fetch(
      `https://open.douyin.com/live/room/viewers?room_id=${roomId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error(`抖音直播API错误: ${response.status}`);
    data = await response.json();
    return {
      viewers: data?.data?.viewer_list || [],
      total: data?.data?.total || 0,
    };
  }

  if (platform === 'kuaishou') {
    const response = await fetch(
      `https://open.kuaishou.com/api/live/viewers?room_id=${roomId}`,
      {
        headers: { 'Authorization': config.apiKey },
      }
    );
    if (!response.ok) throw new Error(`快手直播API错误: ${response.status}`);
    data = await response.json();
    return {
      viewers: data?.list || [],
      total: data?.total || 0,
    };
  }

  throw new Error(`不支持的直播平台: ${platform}`);
}

/**
 * 获取直播间统计
 */
export async function getLiveStats(
  config: LiveConfig
): Promise<LiveStats> {
  const { platform, roomId } = config;
  assertApiKey(config);

  let data: any;
  if (platform === 'douyin') {
    const response = await fetch(
      `https://open.douyin.com/live/room/stats?room_id=${roomId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error(`抖音直播API错误: ${response.status}`);
    data = await response.json();
    const s = data?.data || {};
    return {
      viewerCount: s.viewer_count || 0,
      likeCount: s.like_count || 0,
      followerCount: s.follower_count || 0,
      duration: s.duration || 0,
      peakViewers: s.peak_viewers || 0,
    };
  }

  if (platform === 'kuaishou') {
    const response = await fetch(
      `https://open.kuaishou.com/api/live/stats?room_id=${roomId}`,
      {
        headers: { 'Authorization': config.apiKey },
      }
    );
    if (!response.ok) throw new Error(`快手直播API错误: ${response.status}`);
    data = await response.json();
    const s = data || {};
    return {
      viewerCount: s.viewer_count || 0,
      likeCount: s.like_count || 0,
      followerCount: s.follower_count || 0,
      duration: s.duration || 0,
      peakViewers: s.peak_viewers || 0,
    };
  }

  throw new Error(`不支持的直播平台: ${platform}`);
}

/**
 * 判断内容是否包含购买意向
 */
function hasPurchaseIntent(content: string): boolean {
  const keywords = [
    '买', '价格', '优惠', '券', '折扣',
    '多少钱', '哪里', '链接', '下单', '购买',
    '想要', '推荐', '效果', '怎么'
  ];
  return keywords.some(k => content.includes(k));
}

/**
 * 计算用户意向评分
 */
export function calculateIntentScore(danmu: Danmu): number {
  let score = 50; // 基础分

  // 购买相关关键词加分
  const purchaseKeywords = [
    { keyword: '买', score: 20 },
    { keyword: '价格', score: 15 },
    { keyword: '优惠', score: 15 },
    { keyword: '下单', score: 25 },
    { keyword: '链接', score: 20 },
    { keyword: '想要', score: 10 },
    { keyword: '效果', score: 10 }
  ];

  for (const { keyword, score: addScore } of purchaseKeywords) {
    if (danmu.content.includes(keyword)) {
      score += addScore;
    }
  }

  // VIP用户加分
  if (danmu.isVIP) score += 10;

  // 粉丝加分
  if (danmu.isFollower) score += 5;

  // 打赏过礼物的加分
  if (danmu.gift) score += danmu.gift.value * 5;

  return Math.min(score, 100);
}
