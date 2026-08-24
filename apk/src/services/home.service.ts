// 首页数据服务
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';

// 今日数据统计
export interface TodayStats {
  // 智能获客
  newCustomers: number; // 新增潜客
  customersGrowth: number; // 潜客增长百分比

  // 发布统计
  publishedToday: number; // 今日发布数
  totalPublished: number; // 累计发布数

  // 招聘统计
  newResumes: number; // 新增简历
  resumesReviewed: number; // 已查看简历
}

// 智能招聘统计
export interface RecruitmentStats {
  totalJobs: number; // 职位数
  activeJobs: number; // 在招职位
  totalResumes: number; // 收到简历
  newResumes: number; // 新增简历
}

class HomeService {
  // 获取今日数据统计
  async getTodayStats(): Promise<TodayStats | null> {
    try {
      const data = await apiClient.get<TodayStats>(API_ENDPOINTS.ACQUISITION_STATS);
      return data;
    } catch {
      return null;
    }
  }

  // 获取招聘统计
  async getRecruitmentStats(): Promise<RecruitmentStats | null> {
    try {
      const data = await apiClient.get<RecruitmentStats>('/recruitment/stats');
      return data;
    } catch {
      return null;
    }
  }
}

export const homeService = new HomeService();
