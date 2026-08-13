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

/**
 * 搜索企业
 */
export async function searchCompanies(
  params: CompanySearchParams,
  config?: TianyanchaConfig
): Promise<{ list: CompanySearchResult[]; total: number; page: number; pageSize: number }> {
  const { keyword, industry, region, page = 1, pageSize = 20 } = params;

  // 未配置 API Key 时拒绝服务，禁止返回模拟数据
  if (!config?.apiKey) {
    throw new Error('天眼查服务未配置 API Key，请联系管理员在环境变量中配置 TIANYANCHA_API_KEY');
  }

  // 调用真实API
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

  const data = await response.json() as { items?: any[]; total?: number };

  let list = (data.items || []).map((item: any) => ({
    name: item.name || '',
    legalPerson: item.legalPersonName || '',
    registeredCapital: item.regCapital || '',
    employeeCount: item.employeeCount || '',
    business: item.businessScope || '',
    address: item.regLocation || '',
    phone: item.phoneNumber || undefined,
    email: item.email || undefined,
    status: item.regStatus || '',
    establishedDate: item.estiblishTime || '',
    creditCode: item.creditCode || '',
    score: 0,
  }));

  // 行业/地区过滤（本地二次过滤）
  if (industry) list = list.filter(c => c.business.includes(industry));
  if (region) list = list.filter(c => c.address.includes(region));

  return { list, total: data.total || list.length, page, pageSize };
}

/**
 * 获取企业详细信息
 */
export async function getCompanyDetail(
  companyName: string,
  config?: TianyanchaConfig
): Promise<any> {
  if (!config?.apiKey) {
    throw new Error('天眼查服务未配置 API Key，请联系管理员在环境变量中配置 TIANYANCHA_API_KEY');
  }

  const response = await fetch(
    `${TIANYANCHA_API_BASE}/services/v5/open/company/newbaseinfo?keyword=${encodeURIComponent(companyName)}`,
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

  return await response.json();
}

/**
 * 获取企业联系方式
 */
export async function getCompanyContact(
  companyName: string,
  config?: TianyanchaConfig
): Promise<any> {
  if (!config?.apiKey) {
    throw new Error('天眼查服务未配置 API Key，请联系管理员在环境变量中配置 TIANYANCHA_API_KEY');
  }

  const response = await fetch(
    `${TIANYANCHA_API_BASE}/services/v5/open/company/contact?keyword=${encodeURIComponent(companyName)}`,
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

  return await response.json();
}
