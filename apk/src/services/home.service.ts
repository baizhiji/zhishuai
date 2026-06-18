// 首页数据服务 - 对接真实 Server API
import { apiClient } from './api.client';

// 今日数据统计
export interface TodayStats {
  contentGenerated: number;
  contentUsed: number;
  newCustomers: number;
  customersGrowth: number;
  publishedToday: number;
  totalPublished: number;
  newResumes: number;
  resumesReviewed: number;
}

// 转介绍统计
export interface ReferralStats {
  totalInvites: number;
  activeInvites: number;
}

// 自媒体运营统计
export interface ContentStats {
  totalContents: number;
  thisMonth: number;
  totalViews: number;
  totalLikes: number;
}

// 招聘助手统计
export interface RecruitmentStats {
  totalJobs: number;
  activeJobs: number;
  totalResumes: number;
  newResumes: number;
}

class HomeService {
  // 获取今日数据统计 - 对接 /api/dashboard-stats/overview
  async getTodayStats(): Promise<TodayStats> {
    try {
      const data = await apiClient.get<any>('/dashboard-stats/overview');
      return {
        contentGenerated: data.content?.total || 0,
        contentUsed: data.materials?.total || 0,
        newCustomers: data.leads?.today || 0,
        customersGrowth: data.leads?.trend || 0,
        publishedToday: 0,
        totalPublished: data.content?.total || 0,
        newResumes: 0,
        resumesReviewed: 0,
      };
    } catch (error) {
      console.log('获取今日统计失败，使用默认值');
      return {
        contentGenerated: 0,
        contentUsed: 0,
        newCustomers: 0,
        customersGrowth: 0,
        publishedToday: 0,
        totalPublished: 0,
        newResumes: 0,
        resumesReviewed: 0,
      };
    }
  }

  // 获取转介绍统计 - 对接 /api/referral/stats
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const data = await apiClient.get<any>('/referral/stats');
      return {
        totalInvites: data.totalInvites || 0,
        activeInvites: data.activeInvites || 0,
      };
    } catch (error) {
      console.log('获取转介绍统计失败，使用默认值');
      return { totalInvites: 0, activeInvites: 0 };
    }
  }

  // 获取自媒体运营统计 - 对接 /api/dashboard-stats/content
  async getContentStats(): Promise<ContentStats> {
    try {
      const data = await apiClient.get<any>('/dashboard-stats/content');
      return {
        totalContents: data.total || 0,
        thisMonth: 0,
        totalViews: 0,
        totalLikes: 0,
      };
    } catch (error) {
      console.log('获取内容统计失败，使用默认值');
      return { totalContents: 0, thisMonth: 0, totalViews: 0, totalLikes: 0 };
    }
  }

  // 获取招聘统计 - 对接 /api/recruitment/stats
  async getRecruitmentStats(): Promise<RecruitmentStats> {
    try {
      const data = await apiClient.get<any>('/recruitment/stats');
      return {
        totalJobs: data.totalJobs || 0,
        activeJobs: data.activeJobs || 0,
        totalResumes: data.totalCandidates || 0,
        newResumes: data.newCandidates || 0,
      };
    } catch (error) {
      console.log('获取招聘统计失败，使用默认值');
      return { totalJobs: 0, activeJobs: 0, totalResumes: 0, newResumes: 0 };
    }
  }
}

export const homeService = new HomeService();
