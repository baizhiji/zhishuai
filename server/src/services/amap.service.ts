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

// 模拟数据
const MOCK_POI = [
  { id: 'AMAP001', name: '星巴克咖啡（望京SOHO店）', type: '咖啡厅', typecode: '050000', address: '北京市朝阳区望京街道望京SOHO', location: { lat: 39.996, lng: 116.473 }, tel: '010-64701234', businessArea: '望京', citycode: '010', adcode: '110105' },
  { id: 'AMAP002', name: '7-ELEVEN便利店（银河SOHO店）', type: '便利店', typecode: '201100', address: '北京市东城区南竹竿胡同2号', location: { lat: 39.929, lng: 116.422 }, tel: '400-811-7111', businessArea: '朝阳门', citycode: '010', adcode: '110101' },
  { id: 'AMAP003', name: '海底捞火锅（三里屯店）', type: '火锅店', typecode: '050107', address: '北京市朝阳区三里屯路19号', location: { lat: 39.938, lng: 116.447 }, tel: '010-64176688', businessArea: '三里屯', citycode: '010', adcode: '110105' },
  { id: 'AMAP004', name: '链家地产（朝外大街店）', type: '房产中介', typecode: '170000', address: '北京市朝阳区朝外大街甲6号', location: { lat: 39.925, lng: 116.442 }, tel: '010-65861234', businessArea: '朝外', citycode: '010', adcode: '110105' },
  { id: 'AMAP005', name: '中国移动营业厅（西单店）', type: '营业厅', typecode: '150400', address: '北京市西城区西单北大街131号', location: { lat: 39.912, lng: 116.373 }, tel: '10086', businessArea: '西单', citycode: '010', adcode: '110102' },
  { id: 'AMAP006', name: '瑞幸咖啡（国贸三期店）', type: '咖啡厅', typecode: '050000', address: '北京市朝阳区建国门外大街1号', location: { lat: 39.909, lng: 116.457 }, tel: '400-010-0100', businessArea: '国贸', citycode: '010', adcode: '110105' },
  { id: 'AMAP007', name: '招商银行（北京分行营业部）', type: '银行', typecode: '150101', address: '北京市西城区复兴门内大街1号', location: { lat: 39.909, lng: 116.363 }, tel: '010-66085588', businessArea: '复兴门', citycode: '010', adcode: '110102' },
  { id: 'AMAP008', name: '全季酒店（知春路店）', type: '酒店', typecode: '100101', address: '北京市海淀区知春路25号', location: { lat: 39.987, lng: 116.322 }, tel: '400-812-8123', businessArea: '知春路', citycode: '010', adcode: '110108' },
  { id: 'AMAP009', name: '华润超市（望京店）', type: '超市', typecode: '201000', address: '北京市朝阳区望京西园四区', location: { lat: 39.999, lng: 116.470 }, tel: '010-84561234', businessArea: '望京', citycode: '010', adcode: '110105' },
  { id: 'AMAP010', name: '美年大健康体检（东三环店）', type: '医疗机构', typecode: '090000', address: '北京市朝阳区东三环南路58号', location: { lat: 39.876, lng: 116.468 }, tel: '010-87312345', businessArea: '潘家园', citycode: '010', adcode: '110105' },
];

/**
 * 关键字搜索POI
 */
export async function searchPOIByKeyword(
  params: POISearchParams,
  config?: AmapConfig
): Promise<{ pois: POIResult[]; count: number; page: number; pageSize: number }> {
  const { keyword, city, types, offset = 20, page = 1 } = params;

  // 如果没有配置API Key，使用模拟数据
  if (!config?.apiKey) {
    console.log('[Amap] 使用模拟数据');

    let results = [...MOCK_POI];

    // 关键词过滤
    if (keyword) {
      results = MOCK_POI.filter(p =>
        p.name.includes(keyword) ||
        p.type.includes(keyword) ||
        keyword.includes(p.type)
      );

      if (results.length === 0) {
        // 生成匹配的模拟数据
        results = MOCK_POI.slice(0, 5).map((p, i) => ({
          ...p,
          id: `AMAP_MOCK_${Date.now()}_${i}`,
          name: `${keyword}${['店', '中心', '馆', '厅', '行'][i % 5]}`,
          type: keyword
        }));
      }
    }

    // 城市过滤
    if (city) {
      results = results.map(p => ({
        ...p,
        citycode: city.includes('010') ? '010' : '021'
      }));
    }

    // 类型过滤
    if (types) {
      results = results.filter(p => p.type.includes(types) || types.includes(p.type));
    }

    // 分页
    const start = (page - 1) * offset;
    const pagedResults = results.slice(start, start + offset);

    return {
      pois: pagedResults,
      count: results.length + Math.floor(Math.random() * 30),
      page,
      pageSize: offset
    };
  }

  // 调用真实API
  try {
    const params = new URLSearchParams({
      key: config.apiKey,
      keywords: keyword || '',
      city: city || '全国',
      citylimit: 'true',
      offset: String(offset),
      page: String(page),
      extensions: 'base'
    });

    if (types) {
      params.set('types', types);
    }

    const response = await fetch(`${AMAP_API_BASE}/place/text?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`高德API错误: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== '1') {
      throw new Error(data.info || 'API返回错误');
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
        adcode: p.adcode
      })),
      count: parseInt(data.count) || 0,
      page,
      pageSize: offset
    };
  } catch (error: any) {
    console.error('[Amap] API调用失败:', error.message);
    // 降级到模拟数据
    return {
      pois: MOCK_POI.slice(0, 5),
      count: 50,
      page,
      pageSize: offset
    };
  }
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
    console.log('[Amap] 周边搜索使用模拟数据');

    let results = MOCK_POI.map(p => ({
      ...p,
      distance: Math.floor(Math.random() * radius)
    }));

    if (keyword) {
      results = results.filter(p =>
        p.name.includes(keyword) || p.type.includes(keyword)
      );
    }

    results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return {
      pois: results.slice(0, pageSize),
      count: results.length
    };
  }

  try {
    const params = new URLSearchParams({
      key: config.apiKey,
      location: `${location.lng},${location.lat}`,
      radius: String(radius),
      offset: String(pageSize),
      page: String(page),
      extensions: 'base'
    });

    if (keyword) params.set('keywords', keyword);
    if (types) params.set('types', types);

    const response = await fetch(`${AMAP_API_BASE}/place/around?${params.toString()}`);
    const data = await response.json();

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
        distance: parseInt(p.distance) || 0
      })),
      count: parseInt(data.count) || 0
    };
  } catch (error: any) {
    console.error('[Amap] 周边搜索失败:', error.message);
    return { pois: MOCK_POI.slice(0, 5), count: 5 };
  }
}

/**
 * 获取POI详情
 */
export async function getPOIDetail(
  id: string,
  config?: AmapConfig
): Promise<any> {
  if (!config?.apiKey) {
    const mock = MOCK_POI.find(p => p.id === id) || MOCK_POI[0];
    return {
      ...mock,
      openingHours: '08:00-22:00',
      photos: ['https://placeholder.com/photo1.jpg', 'https://placeholder.com/photo2.jpg'],
      rating: 4.5,
      reviews: 128
    };
  }

  try {
    const params = new URLSearchParams({
      key: config.apiKey,
      id
    });

    const response = await fetch(`${AMAP_API_BASE}/place/detail?${params.toString()}`);
    return await response.json();
  } catch (error: any) {
    console.error('[Amap] 获取详情失败:', error.message);
    return null;
  }
}
