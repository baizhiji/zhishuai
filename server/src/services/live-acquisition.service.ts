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

// 模拟弹幕数据
const MOCK_DANMU: Danmu[] = [
  { id: 'd1', userId: 'u001', nickname: '张三', content: '主播讲得太好了', timestamp: new Date(), isFollower: true, isVIP: false },
  { id: 'd2', userId: 'u002', nickname: '李四', content: '怎么购买？', timestamp: new Date(), isFollower: false, isVIP: true, intentScore: 90 },
  { id: 'd3', userId: 'u003', nickname: '王五', content: '想要这个产品', timestamp: new Date(), isFollower: true, isVIP: false, intentScore: 85 },
  { id: 'd4', userId: 'u004', nickname: '赵六', content: '价格多少？', timestamp: new Date(), isFollower: false, isVIP: false, intentScore: 80 },
  { id: 'd5', userId: 'u005', nickname: '钱七', content: '已下单，等发货', timestamp: new Date(), isFollower: true, isVIP: true },
  { id: 'd6', userId: 'u006', nickname: '孙八', content: '有没有优惠券？', timestamp: new Date(), isFollower: false, isVIP: false, intentScore: 75 },
  { id: 'd7', userId: 'u007', nickname: '周九', content: '支持主播', timestamp: new Date(), isFollower: true, isVIP: false },
  { id: 'd8', userId: 'u008', nickname: '吴十', content: '产品看起来不错', timestamp: new Date(), isFollower: false, isVIP: true, intentScore: 70 },
];

const NICKNAMES = ['用户', '粉丝', '观众', '小主', '老板', '亲', '朋友'];
const CONTENTS = [
  '这个多少钱', '怎么买', '想要', '下单了', '已购买',
  '支持主播', '讲得不错', '666', '棒', '点赞',
  '优惠吗', '有券吗', '在哪买', '链接发一下', '求推荐',
  '效果好吗', '真的假的', '来看看', '不错', '可以'
];

/**
 * 获取直播间弹幕
 */
export async function getDanmu(
  config: LiveConfig
): Promise<{ danmu: Danmu[]; newLeads: Danmu[] }> {
  const { platform, roomId } = config;

  // 如果没有配置API，使用模拟数据
  if (!config.apiKey) {
    console.log(`[${platform}] 使用模拟弹幕数据`);

    const count = Math.floor(Math.random() * 5) + 3;
    const danmu: Danmu[] = [];
    const newLeads: Danmu[] = [];

    for (let i = 0; i < count; i++) {
      const d: Danmu = {
        id: `danmu_${Date.now()}_${i}`,
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        nickname: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)] + Math.floor(Math.random() * 1000),
        content: CONTENTS[Math.floor(Math.random() * CONTENTS.length)],
        timestamp: new Date(),
        isFollower: Math.random() > 0.5,
        isVIP: Math.random() > 0.7
      };

      // 计算意向评分
      if (d.content.includes('买') || d.content.includes('价') || d.content.includes('优惠') || d.content.includes('券')) {
        d.intentScore = 70 + Math.floor(Math.random() * 30);
        newLeads.push(d);
      }

      danmu.push(d);
    }

    return { danmu, newLeads };
  }

  // 调用真实API（这里需要根据不同平台实现）
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
  }

  return { danmu: [], newLeads: [] };
}

/**
 * 获取直播间观众列表
 */
export async function getLiveViewers(
  config: LiveConfig
): Promise<{ viewers: Viewer[]; total: number }> {
  const { platform, roomId } = config;

  if (!config.apiKey) {
    console.log(`[${platform}] 使用模拟观众数据`);

    const count = Math.floor(Math.random() * 20) + 10;
    const viewers: Viewer[] = [];

    for (let i = 0; i < count; i++) {
      viewers.push({
        id: `viewer_${Math.random().toString(36).substr(2, 9)}`,
        nickname: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)] + Math.floor(Math.random() * 10000),
        avatar: `https://avatar.example.com/${i}.jpg`,
        followStatus: ['following', 'followers', 'stranger'][Math.floor(Math.random() * 3)] as any,
        isFanClub: Math.random() > 0.7,
        intentScore: Math.floor(Math.random() * 40) + 60
      });
    }

    return { viewers, total: count + Math.floor(Math.random() * 100) };
  }

  // 真实API调用
  return { viewers: [], total: 0 };
}

/**
 * 获取直播间统计
 */
export async function getLiveStats(
  config: LiveConfig
): Promise<LiveStats> {
  if (!config.apiKey) {
    return {
      viewerCount: Math.floor(Math.random() * 10000) + 1000,
      likeCount: Math.floor(Math.random() * 100000) + 10000,
      followerCount: Math.floor(Math.random() * 5000) + 500,
      duration: Math.floor(Math.random() * 3600) + 600,
      peakViewers: Math.floor(Math.random() * 50000) + 5000
    };
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
