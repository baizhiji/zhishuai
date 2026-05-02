// 首页数据服务
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';

// 今日数据统计
export interface TodayStats {
  // 内容工厂
  contentGenerated: number; // 今日生成内容数
  contentUsed: number; // 今日使用素材数
  
  // 智能获客
  newCustomers: number; // 新增潜客
  customersGrowth: number; // 潜客增长百分比
  
  // 发布统计
  publishedToday: number; // 今日发布数
  totalPublished: number; // 累计发布数
  
  // 招聘统计
  newResumes: number; // 新增简历
  resumesReviewed: number; // 已查看简历
  
  // 积分
  points: number; // 当前积分
  pointsUsedToday: number; // 今日消耗积分
}

// 转介绍统计
export interface ReferralStats {
  totalInvites: number; // 累计邀请人数
  activeInvites: number; // 有效邀请人数
  pointsEarned: number; // 已获得积分
  pointsPending: number; // 待生效积分
}

// 自媒体运营统计
export interface ContentStats {
  totalContents: number; // 累计生成
  thisMonth: number; // 本月生成
  totalViews: number; // 累计浏览
  totalLikes: number; // 累计点赞
}

// 招聘助手统计
export interface RecruitmentStats {
  totalJobs: number; // 职位数
  activeJobs: number; // 在招职位
  totalResumes: number; // 收到简历
  newResumes: number; // 新增简历
}

class HomeService {
  // 获取今日数据统计
  async getTodayStats(): Promise<TodayStats> {
    try {
      // 尝试调用真实API
      const data = await apiClient.get<TodayStats>(API_ENDPOINTS.ACQUISITION_STATS);
      return data;
    } catch (error) {
      // API未ready时返回Mock数据
      console.log('使用Mock数据: 今日统计');
      return this.getMockTodayStats();
    }
  }

  // 获取转介绍统计
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const data = await apiClient.get<ReferralStats>(API_ENDPOINTS.REFERRAL_STATS);
      return data;
    } catch (error) {
      console.log('使用Mock数据: 转介绍统计');
      return this.getMockReferralStats();
    }
  }

  // 获取自媒体运营统计
  async getContentStats(): Promise<ContentStats> {
    try {
      // API_ENDPOINTS中没有对应端点，使用Mock
      return this.getMockContentStats();
    } catch (error) {
      return this.getMockContentStats();
    }
  }

  // 获取招聘统计
  async getRecruitmentStats(): Promise<RecruitmentStats> {
    try {
      return this.getMockRecruitmentStats();
    } catch (error) {
      return this.getMockRecruitmentStats();
    }
  }

  // ===== Mock数据 =====
  
  private getMockTodayStats(): TodayStats {
    return {
      contentGenerated: 15,
      contentUsed: 8,
      newCustomers: 23,
      customersGrowth: 12.5,
      publishedToday: 5,
      totalPublished: 156,
      newResumes: 12,
      resumesReviewed: 8,
      points: 2580,
      pointsUsedToday: 120,
    };
  }

  private getMockReferralStats(): ReferralStats {
    return {
      totalInvites: 15,
      activeInvites: 8,
      pointsEarned: 800,
      pointsPending: 350,
    };
  }

  private getMockContentStats(): ContentStats {
    return {
      totalContents: 320,
      thisMonth: 45,
      totalViews: 12580,
      totalLikes: 860,
    };
  }

  private getMockRecruitmentStats(): RecruitmentStats {
    return {
      totalJobs: 12,
      activeJobs: 8,
      totalResumes: 56,
      newResumes: 12,
    };
  }
}

export const homeService = new HomeService();
