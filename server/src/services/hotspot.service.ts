/**
 * 热点话题服务
 *
 * 注意：本服务为「预留接口」。真实热点数据源（微博/抖音/小红书等公开热搜 API）
 * 尚未接入，统一返回空数组，绝不返回编造数据。
 * 前端热点功能请使用 hot-topics 路由（/api/hot-topics）。
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
 * TODO: 接入真实热点 API（待数据源就绪后实现，当前返回空数组）
 */
export async function getHotspots(platform?: string, category?: string): Promise<Hotspot[]> {
  void platform;
  void category;
  return [];
}

/**
 * 搜索相关热点
 */
export async function searchHotspots(keyword: string): Promise<Hotspot[]> {
  void keyword;
  const all = await getHotspots();
  return all.filter(h => h.keyword.includes(keyword));
}

export default { getHotspots, searchHotspots };
