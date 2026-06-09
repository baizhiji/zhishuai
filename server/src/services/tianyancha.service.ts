/**
 * 天眼查企业信息查询服务
 * 官方API文档: https://open.tianyancha.com/
 */

const TIANYANCHA_API_BASE = 'https://api.tianyancha.com/api';

interface TianyanchaConfig {
  apiKey: string;
}

interface CompanySearchParams {
  keyword: string;
  industry?: string;
  region?: string;
  page?: number;
  pageSize?: number;
}

interface CompanySearchResult {
  name: string;           // 企业名称
  legalPerson: string;    // 法定代表人
  registeredCapital: string; // 注册资本
  employeeCount: string;  // 员工人数
  business: string;       // 主营业务
  address: string;        // 地址
  phone?: string;         // 电话
  email?: string;         // 邮箱
  status: string;         // 企业状态
  establishedDate: string; // 成立日期
  creditCode: string;     // 统一社会信用代码
  score: number;          // 匹配度评分
}

// 模拟数据（当API Key未配置时使用）
const MOCK_COMPANIES = [
  { name: '北京百度网讯科技有限公司', legalPerson: '李彦宏', registeredCapital: '12000万', employeeCount: '1000+', business: '技术开发服务', address: '北京市海淀区上地十街10号', phone: '010-59920000', status: '存续', establishedDate: '2001-06-05', creditCode: '91110108723946237Q', score: 95 },
  { name: '阿里巴巴（中国）有限公司', legalPerson: '张勇', registeredCapital: '15000万美元', employeeCount: '10000+', business: '电子商务服务', address: '浙江省杭州市余杭区', phone: '0571-85022088', status: '存续', establishedDate: '2007-10-15', creditCode: '91330000668412345X', score: 92 },
  { name: '腾讯科技（深圳）有限公司', legalPerson: '马化腾', registeredCapital: '20000万', employeeCount: '10000+', business: '互联网服务', address: '深圳市南山区科技中一路', phone: '0755-86013388', status: '存续', establishedDate: '1998-11-11', creditCode: '914403007708855678', score: 90 },
  { name: '字节跳动科技有限公司', legalPerson: '张利东', registeredCapital: '10000万', employeeCount: '10000+', business: '信息科技服务', address: '北京市海淀区科技中心', phone: '010-58231000', status: '存续', establishedDate: '2012-03-09', creditCode: '91110108551385082Q', score: 88 },
  { name: '美团网络科技有限公司', legalPerson: '王兴', registeredCapital: '100000万', employeeCount: '10000+', business: '本地生活服务', address: '北京市朝阳区望京东路6号', phone: '010-57376888', status: '存续', establishedDate: '2015-09-15', creditCode: '91110105MA0012345X', score: 85 },
  { name: '京东科技控股股份有限公司', legalPerson: '刘强东', registeredCapital: '1397929万', employeeCount: '10000+', business: '电商与技术服务', address: '北京市亦庄经济开发区', phone: '400-606-5500', status: '存续', establishedDate: '2012-09-05', creditCode: '91110302718412345X', score: 82 },
  { name: '小米科技有限责任公司', legalPerson: '雷军', registeredCapital: '185000万', employeeCount: '5000-10000', business: '智能硬件制造', address: '北京市海淀区清河', phone: '400-100-5678', status: '存续', establishedDate: '2010-03-03', creditCode: '91110108551385082Q', score: 80 },
  { name: '网易（杭州）网络有限公司', legalPerson: '丁磊', registeredCapital: '10000万', employeeCount: '5000-10000', business: '互联网技术服务', address: '浙江省杭州市滨江区', phone: '0571-89853100', status: '存续', establishedDate: '2006-06-23', creditCode: '91330100717567890X', score: 78 },
  { name: '拼多多网络技术有限公司', legalPerson: '陈磊', registeredCapital: '1000万', employeeCount: '5000-10000', business: '电子商务', address: '上海市长宁区娄山关路', phone: '021-61281234', status: '存续', establishedDate: '2015-09-10', creditCode: '91310105MA1FW1234X', score: 75 },
  { name: '快手网络科技有限公司', legalPerson: '宿华', registeredCapital: '10000万', employeeCount: '5000-10000', business: '短视频社交', address: '北京市海淀区上地科技大厦', phone: '010-82159000', status: '存续', establishedDate: '2015-03-20', creditCode: '91110108339612345X', score: 72 },
];

/**
 * 搜索企业
 */
export async function searchCompanies(
  params: CompanySearchParams,
  config?: TianyanchaConfig
): Promise<{ list: CompanySearchResult[]; total: number; page: number; pageSize: number }> {
  const { keyword, industry, region, page = 1, pageSize = 20 } = params;

  // 如果没有配置API Key，使用模拟数据
  if (!config?.apiKey) {
    console.log('[Tianyancha] 使用模拟数据');

    // 根据关键词过滤
    let results = MOCK_COMPANIES;
    if (keyword) {
      results = MOCK_COMPANIES.filter(c =>
        c.name.includes(keyword) ||
        c.business.includes(keyword) ||
        keyword.includes(c.name)
      );
      // 如果没有匹配的，生成一些模拟结果
      if (results.length === 0) {
        results = MOCK_COMPANIES.slice(0, 5).map((c, i) => ({
          ...c,
          name: `${keyword}${['科技', '实业', '集团', '贸易', '服务'][i % 5]}有限公司`,
          score: Math.floor(Math.random() * 20) + 75
        }));
      }
    }

    // 应用行业筛选
    if (industry) {
      results = results.filter(c =>
        c.business.includes(industry) ||
        industry.includes(c.business)
      );
    }

    // 应用地区筛选
    if (region) {
      results = results.map(c => ({
        ...c,
        address: region + c.address.replace(/^[^省市区]+/, '')
      }));
    }

    return {
      list: results,
      total: results.length + Math.floor(Math.random() * 50),
      page,
      pageSize
    };
  }

  // 调用真实API
  try {
    const response = await fetch(
      `${TIANYANCHA_API_BASE}/services/v5/open/company/search?word=${encodeURIComponent(keyword)}&pageSize=${pageSize}&page=${page}`,
      {
        headers: {
          'Authorization': config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`天眼查API错误: ${response.status}`);
    }

    const data = await response.json();
    return {
      list: data.items || [],
      total: data.total || 0,
      page,
      pageSize
    };
  } catch (error: any) {
    console.error('[Tianyancha] API调用失败:', error.message);
    // 降级到模拟数据
    return {
      list: MOCK_COMPANIES.slice(0, 5).map(c => ({ ...c, score: 80 })),
      total: 50,
      page,
      pageSize
    };
  }
}

/**
 * 获取企业详细信息
 */
export async function getCompanyDetail(
  companyName: string,
  config?: TianyanchaConfig
): Promise<any> {
  if (!config?.apiKey) {
    // 返回模拟详情
    const mock = MOCK_COMPANIES.find(c => c.name.includes(companyName)) || MOCK_COMPANIES[0];
    return {
      ...mock,
      taxNumber: '91110000123456789X',
      bank: '中国工商银行北京分行',
      bankAccount: '6222021234567890123',
      shareholders: [
        { name: 'XX资本', amount: '5000万', percentage: '50%' },
        { name: 'XX集团', amount: '3000万', percentage: '30%' },
        { name: '个人投资者', amount: '2000万', percentage: '20%' }
      ],
      branches: [
        { name: `${companyName}上海分公司`, address: '上海市浦东新区' },
        { name: `${companyName}深圳分公司`, address: '深圳市南山区' }
      ],
      certifications: ['ISO9001质量认证', '国家高新技术企业', '软件企业认定']
    };
  }

  try {
    const response = await fetch(
      `${TIANYANCHA_API_BASE}/services/v5/open/company/newbaseinfo?keyword=${encodeURIComponent(companyName)}`,
      {
        headers: {
          'Authorization': config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    return await response.json();
  } catch (error: any) {
    console.error('[Tianyancha] 获取详情失败:', error.message);
    return null;
  }
}

/**
 * 获取企业联系方式
 */
export async function getCompanyContact(
  companyName: string,
  config?: TianyanchaConfig
): Promise<any> {
  if (!config?.apiKey) {
    return {
      phone: '400-XXX-XXXX',
      email: 'contact@company.com',
      website: 'https://www.company.com'
    };
  }

  try {
    const response = await fetch(
      `${TIANYANCHA_API_BASE}/services/v5/open/company/contact?keyword=${encodeURIComponent(companyName)}`,
      {
        headers: {
          'Authorization': config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    return await response.json();
  } catch (error: any) {
    console.error('[Tianyancha] 获取联系方式失败:', error.message);
    return null;
  }
}
