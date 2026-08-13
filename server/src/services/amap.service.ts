/**
 * 高德地图 POI 搜索服务
 * 官方API文档: https://lbs.amap.com/api/webservice/guide/api/newpoisearch
 */

const AMAP_API_BASE = 'https://restapi.amap.com/v3';

interface AmapConfig {
  apiKey: string;
  searchType?: 'keyword' | 'around' | 'polygon';
}

interface POISearchParams {
  keyword?: string;      // 关键词
  city?: string;        // 城市名称或城市编码
  types?: string;       // POI类型
  offset?: number;       // 每页记录数
  page?: number;        // 页码
  building?: string;    // 建筑
  floor?: string;       // 楼层
  extensions?: 'base' | 'all'; // 返回数据控制
}

interface POIResult {
  id: string;           // POI唯一标识
  name: string;         // 名称
  type: string;          // 类型
  typecode: string;      // 类型编码
  address: string;       // 地址
  location: {
    lat: number;         // 纬度
    lng: number;         // 经度
  };
  tel?: string;          // 电话
  distance?: number;     // 距离（周边搜索时）
  businessArea?: string; // 所在商圈
  citycode?: string;     // 城市编码
  adcode?: string;       // 区域编码
}

function assertApiKey(config?: AmapConfig): string {
  if (!config?.apiKey) {
    throw new Error('高德地图服务未配置 API Key，请联系管理员在环境变量中配置 AMAP_API_KEY');
  }
  return config.apiKey;
}

function mapPOI(p: any): POIResult {
  const [lng, lat] = String(p.location || '0,0').split(',');
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    typecode: p.typecode,
    address: p.address,
    location: {
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
    },
    tel: p.tel,
    distance: p.distance ? parseInt(p.distance) || 0 : undefined,
    businessArea: p.business_area,
    citycode: p.citycode,
    adcode: p.adcode,
  };
}

/**
 * 关键字搜索POI
 */
export async function searchPOIByKeyword(
  params: POISearchParams,
  config?: AmapConfig
): Promise<{ pois: POIResult[]; count: number; page: number; pageSize: number }> {
  const { keyword, city, types, offset = 20, page = 1 } = params;
  const key = assertApiKey(config);

  const query = new URLSearchParams({
    key,
    keywords: keyword || '',
    city: city || '全国',
    citylimit: 'true',
    offset: String(offset),
    page: String(page),
    extensions: 'base',
  });
  if (types) query.set('types', types);

  const response = await fetch(`${AMAP_API_BASE}/place/text?${query.toString()}`);
  if (!response.ok) throw new Error(`高德API错误: ${response.status}`);

  const data: Record<string, any> = await response.json();
  if (data.status !== '1') throw new Error(data.info || '高德API返回错误');

  return {
    pois: (data.pois || []).map(mapPOI),
    count: parseInt(data.count) || 0,
    page,
    pageSize: offset,
  };
}

/**
 * 周边搜索
 */
export async function searchPOIAround(
  location: { lat: number; lng: number },
  params: {
    keyword?: string;
    radius?: number;
    types?: string;
    page?: number;
    pageSize?: number;
  },
  config?: AmapConfig
): Promise<{ pois: POIResult[]; count: number }> {
  const { keyword, radius = 3000, types, page = 1, pageSize = 20 } = params;
  const key = assertApiKey(config);

  const query = new URLSearchParams({
    key,
    location: `${location.lng},${location.lat}`,
    radius: String(radius),
    offset: String(pageSize),
    page: String(page),
    extensions: 'base',
  });
  if (keyword) query.set('keywords', keyword);
  if (types) query.set('types', types);

  const response = await fetch(`${AMAP_API_BASE}/place/around?${query.toString()}`);
  if (!response.ok) throw new Error(`高德API错误: ${response.status}`);

  const data: Record<string, any> = await response.json();
  if (data.status !== '1') throw new Error(data.info || '高德API返回错误');

  return {
    pois: (data.pois || []).map(mapPOI),
    count: parseInt(data.count) || 0,
  };
}

/**
 * 获取POI详情
 */
export async function getPOIDetail(
  id: string,
  config?: AmapConfig
): Promise<any> {
  const key = assertApiKey(config);

  const query = new URLSearchParams({ key, id });
  const response = await fetch(`${AMAP_API_BASE}/place/detail?${query.toString()}`);
  if (!response.ok) throw new Error(`高德API错误: ${response.status}`);

  const data: Record<string, any> = await response.json();
  if (data.status !== '1') throw new Error(data.info || '高德API返回错误');

  return data;
}
