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
  keyword?: string;
  city?: string;
  types?: string;
  offset?: number;
  page?: number;
  building?: string;
  floor?: string;
  extensions?: 'base' | 'all';
}

interface POIResult {
  id: string;
  name: string;
  type: string;
  typecode: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  tel?: string;
  distance?: number;
  businessArea?: string;
  citycode?: string;
  adcode?: string;
  rating?: number;
  photos?: string[];
}

/**
 * 关键字搜索POI
 */
export async function searchPOIByKeyword(
  params: POISearchParams,
  config?: AmapConfig
): Promise<{ pois: POIResult[]; count: number; page: number; pageSize: number }> {
  const { keyword, city, types, offset = 20, page = 1 } = params;

  if (!config?.apiKey) {
    throw new Error('高德地图API Key未配置，请在数据源配置中添加高德API Key');
  }

  const searchParams = new URLSearchParams({
    key: config.apiKey,
    keywords: keyword || '',
    city: city || '全国',
    citylimit: 'true',
    offset: String(offset),
    page: String(page),
    extensions: 'base'
  });

  if (types) {
    searchParams.set('types', types);
  }

  const response = await fetch(`${AMAP_API_BASE}/place/text?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`高德API错误: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== '1') {
    throw new Error(data.info || '高德API返回错误');
  }

  return {
    pois: (data.pois || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      typecode: p.typecode,
      address: p.address,
      location: {
        lat: parseFloat(p.location?.split(',')[1] || '0'),
        lng: parseFloat(p.location?.split(',')[0] || '0')
      },
      tel: p.tel,
      businessArea: p.business_area,
      citycode: p.citycode,
      adcode: p.adcode,
      photos: p.photos?.map((ph: any) => ph.url).filter(Boolean),
    })),
    count: parseInt(data.count) || 0,
    page,
    pageSize: offset
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

  if (!config?.apiKey) {
    throw new Error('高德地图API Key未配置，请在数据源配置中添加高德API Key');
  }

  const searchParams = new URLSearchParams({
    key: config.apiKey,
    location: `${location.lng},${location.lat}`,
    radius: String(radius),
    offset: String(pageSize),
    page: String(page),
    extensions: 'base'
  });

  if (keyword) searchParams.set('keywords', keyword);
  if (types) searchParams.set('types', types);

  const response = await fetch(`${AMAP_API_BASE}/place/around?${searchParams.toString()}`);
  const data = await response.json();

  if (data.status !== '1') {
    throw new Error(data.info || '高德周边搜索API返回错误');
  }

  return {
    pois: (data.pois || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      location: {
        lat: parseFloat(p.location?.split(',')[1] || '0'),
        lng: parseFloat(p.location?.split(',')[0] || '0')
      },
      address: p.address,
      tel: p.tel,
      distance: parseInt(p.distance) || 0,
      photos: p.photos?.map((ph: any) => ph.url).filter(Boolean),
    })),
    count: parseInt(data.count) || 0
  };
}

/**
 * 获取POI详情
 */
export async function getPOIDetail(
  id: string,
  config?: AmapConfig
): Promise<any> {
  if (!config?.apiKey) {
    throw new Error('高德地图API Key未配置');
  }

  const searchParams = new URLSearchParams({
    key: config.apiKey,
    id
  });

  const response = await fetch(`${AMAP_API_BASE}/place/detail?${searchParams.toString()}`);
  const data = await response.json();

  if (data.status !== '1') {
    throw new Error(data.info || '高德详情API返回错误');
  }

  return data.pois?.[0] || null;
}

/**
 * 地理编码
 */
export async function geocode(
  address: string,
  city?: string,
  config?: AmapConfig
): Promise<{
  location: { lng: number; lat: number };
  formattedAddress: string;
  addressComponent: {
    province: string;
    city: string;
    district: string;
    township?: string;
    street?: string;
    streetNumber?: string;
  };
}> {
  if (!config?.apiKey) {
    throw new Error('高德地图API Key未配置');
  }

  const searchParams = new URLSearchParams({
    key: config.apiKey,
    address,
  });

  if (city) searchParams.set('city', city);

  const response = await fetch(`${AMAP_API_BASE}/geocode/geo?${searchParams.toString()}`);
  const data = await response.json();

  if (data.status !== '1' || !data.geocodes?.length) {
    throw new Error(data.info || '地理编码失败，未找到结果');
  }

  const geo = data.geocodes[0];
  const [lng, lat] = geo.location.split(',').map(Number);

  return {
    location: { lng, lat },
    formattedAddress: geo.formatted_address,
    addressComponent: {
      province: geo.province || '',
      city: geo.city || '',
      district: geo.district || '',
      township: geo.township || '',
      street: geo.streetNumber?.street || '',
      streetNumber: geo.streetNumber?.number || '',
    },
  };
}

/**
 * 路径规划
 */
export async function planRoute(
  origin: string,
  destination: string,
  mode: 'driving' | 'walking' | 'bus' | 'ride' = 'driving',
  config?: AmapConfig
): Promise<{
  distance: string;
  time: string;
  steps: { instruction: string; distance: string }[];
  path?: { lng: number; lat: number }[];
}> {
  if (!config?.apiKey) {
    throw new Error('高德地图API Key未配置');
  }

  const modeMap: Record<string, string> = {
    driving: 'driving',
    walking: 'walking',
    bus: 'transit',
    ride: 'bicycling',
  };

  const apiPath = modeMap[mode] || 'driving';
  const searchParams = new URLSearchParams({
    key: config.apiKey,
    origin,
    destination,
  });

  if (mode === 'bus') {
    searchParams.set('city', '全国');
  }

  const response = await fetch(`${AMAP_API_BASE}/direction/${apiPath}?${searchParams.toString()}`);
  const data = await response.json();

  if (data.status !== '1') {
    throw new Error(data.info || '路径规划失败');
  }

  // 解析不同模式的路径结果
  let route: any = null;
  if (mode === 'driving' && data.route?.paths?.length) {
    route = data.route.paths[0];
  } else if (mode === 'walking' && data.route?.paths?.length) {
    route = data.route.paths[0];
  } else if (mode === 'bus' && data.route?.transits?.length) {
    route = data.route.transits[0];
  } else if (mode === 'ride' && data.route?.paths?.length) {
    route = data.route.paths[0];
  }

  if (!route) {
    throw new Error('未找到可用路线');
  }

  const steps = (route.steps || []).map((step: any) => ({
    instruction: step.instruction || step.action || '',
    distance: step.distance ? `${step.distance}米` : '',
  }));

  return {
    distance: route.distance ? `${(route.distance / 1000).toFixed(1)}公里` : '-',
    time: route.duration ? `约${Math.ceil(route.duration / 60)}分钟` : '-',
    steps,
    path: route.steps?.flatMap((step: any) =>
      (step.polyline || '').split(';').filter(Boolean).map((p: string) => {
        const [lng, lat] = p.split(',').map(Number);
        return { lng, lat };
      })
    ),
  };
}
