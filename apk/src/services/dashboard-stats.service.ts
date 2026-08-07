// 数据大盘服务
import { apiClient } from './api.client';

export interface DashboardOverview {
  todayCreated: number;
  todayPublished: number;
  todayAcquired: number;
  totalMaterials: number;
  totalPosts: number;
  totalLeads: number;
  // 趋势
  materialTrend: number;
  postTrend: number;
  leadTrend: number;
}

export interface BusinessLineKPI {
  line: string;
  icon: string;
  metrics: {
    label: string;
    value: number;
    unit: string;
    change: number;
  }[];
}

export interface TrendItem {
  date: string;
  value: number;
  type: string;
}

export interface DistributionItem {
  name: string;
  value: number;
  color?: string;
}

export interface FunnelItem {
  stage: string;
  count: number;
  rate: number;
}

export interface CustomerSummary {
  materials: { total: number; todayCreated: number };
  acquisition: { total: number; todayCreated: number; active: number; todayAcquired: number };
  share: { totalCodes: number; todayCreated: number; totalClicks: number };
}

class DashboardStatsService {
  // 获取仪表盘概览
  async getOverview(days = 30): Promise<DashboardOverview> {
    try {
      const response = await apiClient.get<DashboardOverview>('/dashboard-stats/overview', { days });
      return response;
    } catch {
      return {
        todayCreated: 0, todayPublished: 0, todayAcquired: 0,
        totalMaterials: 0, totalPosts: 0, totalLeads: 0,
        materialTrend: 0, postTrend: 0, leadTrend: 0,
      };
    }
  }

  // 获取业务线KPI
  async getBusinessLines(): Promise<BusinessLineKPI[]> {
    try {
      const response = await apiClient.get<BusinessLineKPI[]>('/dashboard-stats/business-lines');
      return response || [];
    } catch {
      return [];
    }
  }

  // 获取客户综合摘要
  async getCustomerSummary(): Promise<CustomerSummary> {
    try {
      const response = await apiClient.get<CustomerSummary>('/dashboard-stats/customer-summary');
      return response;
    } catch {
      return {
        materials: { total: 0, todayCreated: 0 },
        acquisition: { total: 0, todayCreated: 0, active: 0, todayAcquired: 0 },
        share: { totalCodes: 0, todayCreated: 0, totalClicks: 0 },
      };
    }
  }

  // 获取趋势数据
  async getTrend(days = 30): Promise<TrendItem[]> {
    try {
      const response = await apiClient.get<TrendItem[]>('/dashboard-stats/trend', { days });
      return response || [];
    } catch {
      return [];
    }
  }

  // 获取分布数据
  async getDistribution(): Promise<DistributionItem[]> {
    try {
      const response = await apiClient.get<DistributionItem[]>('/dashboard-stats/distribution');
      return response || [];
    } catch {
      return [];
    }
  }

  // 获取漏斗数据
  async getFunnel(): Promise<FunnelItem[]> {
    try {
      const response = await apiClient.get<FunnelItem[]>('/dashboard-stats/funnel');
      return response || [];
    } catch {
      return [];
    }
  }

  // 获取热点话题
  async getHotTopics(platform?: string, limit = 5): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/dashboard-stats/hot-topics', { platform, limit });
      return response || [];
    } catch {
      return [];
    }
  }

  // 获取获客统计
  async getAcquisitionStats(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard-stats/acquisition');
      return response;
    } catch {
      return null;
    }
  }

  // 获取素材统计
  async getMaterialsStats(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard-stats/materials');
      return response;
    } catch {
      return null;
    }
  }

  // 获取客户统计 —— 对齐 WEB 端 GET /api/dashboard-stats/customer-summary
  async getCustomerStats(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard-stats/customer-summary');
      return response;
    } catch {
      return null;
    }
  }

  // 旧版兼容 - 获取完整统计
  async getLegacyStats(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard-stats/stats');
      return response;
    } catch {
      return null;
    }
  }
}

export const dashboardStatsService = new DashboardStatsService();
