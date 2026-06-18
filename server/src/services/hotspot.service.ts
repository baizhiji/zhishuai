/**
 * 热点话题服务
 * 提供实时热点数据，后续可接入第三方热点API
 */
export interface Hotspot {
  id: string;
  platform: string;
  keyword: string;
  heat: number;
  label: string;
  url?: string;
  timestamp: Date;
}

// 内置热点数据库（后续可替换为实时API）
const HOTSPOT_POOL: Hotspot[] = [
  { id: 'hot_1', platform: 'weibo', keyword: 'AI人工智能', heat: 9856, label: '科技', timestamp: new Date() },
  { id: 'hot_2', platform: 'douyin', keyword: '短视频创作', heat: 8542, label: '娱乐', timestamp: new Date() },
  { id: 'hot_3', platform: 'xiaohongshu', keyword: '种草推荐', heat: 7231, label: '生活', timestamp: new Date() },
  { id: 'hot_4', platform: 'weibo', keyword: '数字化转型', heat: 6540, label: '商业', timestamp: new Date() },
  { id: 'hot_5', platform: 'douyin', keyword: 'AI绘画', heat: 5987, label: '艺术', timestamp: new Date() },
  { id: 'hot_6', platform: 'xiaohongshu', keyword: '副业赚钱', heat: 5420, label: '财经', timestamp: new Date() },
  { id: 'hot_7', platform: 'weibo', keyword: '大模型', heat: 5100, label: '科技', timestamp: new Date() },
  { id: 'hot_8', platform: 'douyin', keyword: '自媒体运营', heat: 4890, label: '教育', timestamp: new Date() },
];

/**
 * 获取热点话题
 */
export async function getHotspots(platform?: string, category?: string): Promise<Hotspot[]> {
  let results = [...HOTSPOT_POOL];

  if (platform) {
    results = results.filter(h => h.platform === platform);
  }

  if (category) {
    results = results.filter(h => h.label === category);
  }

  // 模拟热度波动
  results = results.map(h => ({
    ...h,
    heat: h.heat + Math.floor(Math.random() * 200 - 100),
    timestamp: new Date(),
  }));

  return results.sort((a, b) => b.heat - a.heat);
}

/**
 * 搜索相关热点
 */
export async function searchHotspots(keyword: string): Promise<Hotspot[]> {
  const all = await getHotspots();
  return all.filter(h => h.keyword.includes(keyword) || h.label.includes(keyword));
}

export default { getHotspots, searchHotspots };
