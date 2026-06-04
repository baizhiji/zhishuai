/**
 * 热点话题服务
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

/**
 * 获取热点话题
 */
export async function getHotspots(platform?: string, category?: string): Promise<Hotspot[]> {
  // TODO: 接入真实热点 API
  return [
    { id: '1', platform: 'weibo', keyword: 'AI人工智能', heat: 9856, label: '科技', timestamp: new Date() },
    { id: '2', platform: 'douyin', keyword: '短视频', heat: 8542, label: '娱乐', timestamp: new Date() },
    { id: '3', platform: 'xiaohongshu', keyword: '种草', heat: 7231, label: '生活', timestamp: new Date() },
  ];
}

/**
 * 搜索相关热点
 */
export async function searchHotspots(keyword: string): Promise<Hotspot[]> {
  const all = await getHotspots();
  return all.filter(h => h.keyword.includes(keyword));
}

export default { getHotspots, searchHotspots };
