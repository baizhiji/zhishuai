/**
 * 直播间数据采集服务
 * 支持抖音、快手等平台的弹幕和观众数据采集
 * 依赖平台开放API，需在数据源配置中提供API密钥
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
  salesAmount?: number;
  giftCount?: number;
}

/**
 * 获取直播间弹幕 — 调用平台真实API
 */
export async function getDanmu(
  config: LiveConfig
): Promise<{ danmu: Danmu[]; newLeads: Danmu[] }> {
  const { platform, roomId } = config;

  if (!config.apiKey) {
    throw new Error(`${platform} API密钥未配置，请在数据源配置中添加对应平台的API密钥`);
  }

  try {
    // 抖音开放平台 API
    if (platform === 'douyin') {
      const response = await fetch(
        `https://open.douyin.com/live/room/danmu?room_id=${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      return {
        danmu: data.danmu_list || [],
        newLeads: (data.danmu_list || []).filter((d: any) => hasPurchaseIntent(d.content))
      };
    }

    // 快手 API
    if (platform === 'kuaishou') {
      const response = await fetch(
        `https://open.kuaishou.com/api/live/danmu?room_id=${roomId}`,
        {
          headers: {
            'Authorization': config.apiKey
          }
        }
      );
      const data = await response.json();
      return {
        danmu: data.list || [],
        newLeads: (data.list || []).filter((d: any) => hasPurchaseIntent(d.content))
      };
    }
  } catch (error: any) {
    console.error(`[${platform}] 获取弹幕失败:`, error.message);
    throw new Error(`获取${platform}弹幕失败: ${error.message}`);
  }

  return { danmu: [], newLeads: [] };
}

/**
 * 获取直播间观众列表 — 调用平台真实API
 */
export async function getLiveViewers(
  config: LiveConfig
): Promise<{ viewers: Viewer[]; total: number }> {
  const { platform, roomId } = config;

  if (!config.apiKey) {
    throw new Error(`${platform} API密钥未配置`);
  }

  try {
    if (platform === 'douyin') {
      const response = await fetch(
        `https://open.douyin.com/live/room/viewers?room_id=${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          }
        }
      );
      const data = await response.json();
      return {
        viewers: data.viewers || [],
        total: data.total || 0,
      };
    }

    if (platform === 'kuaishou') {
      const response = await fetch(
        `https://open.kuaishou.com/api/live/viewers?room_id=${roomId}`,
        {
          headers: {
            'Authorization': config.apiKey
          }
        }
      );
      const data = await response.json();
      return {
        viewers: data.list || [],
        total: data.total || 0,
      };
    }
  } catch (error: any) {
    console.error(`[${platform}] 获取观众列表失败:`, error.message);
  }

  return { viewers: [], total: 0 };
}

/**
 * 获取直播间统计 — 调用平台真实API
 */
export async function getLiveStats(
  config: LiveConfig
): Promise<LiveStats> {
  if (!config.apiKey) {
    throw new Error(`${config.platform} API密钥未配置`);
  }

  try {
    if (config.platform === 'douyin') {
      const response = await fetch(
        `https://open.douyin.com/live/room/stats?room_id=${config.roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          }
        }
      );
      const data = await response.json();
      return data.stats || {
        viewerCount: 0,
        likeCount: 0,
        followerCount: 0,
        duration: 0,
        peakViewers: 0,
      };
    }

    if (config.platform === 'kuaishou') {
      const response = await fetch(
        `https://open.kuaishou.com/api/live/stats?room_id=${config.roomId}`,
        {
          headers: {
            'Authorization': config.apiKey
          }
        }
      );
      const data = await response.json();
      return data.stats || {
        viewerCount: 0,
        likeCount: 0,
        followerCount: 0,
        duration: 0,
        peakViewers: 0,
      };
    }
  } catch (error: any) {
    console.error(`[${config.platform}] 获取统计失败:`, error.message);
  }

  return {
    viewerCount: 0,
    likeCount: 0,
    followerCount: 0,
    duration: 0,
    peakViewers: 0
  };
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

  if (danmu.isVIP) score += 10;
  if (danmu.isFollower) score += 5;
  if (danmu.gift) score += danmu.gift.value * 5;

  return Math.min(score, 100);
}
