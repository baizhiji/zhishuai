// 账号服务 - 账号总览、订阅管理、员工管理
import { apiClient } from './api.client';
import TokenStorage from '../utils/tokenStorage';

// 账户信息
export interface AccountInfo {
  userId: string;
  phone: string;
  email: string;
  role: string;
  memberType: string;
  expireDate: string;
}

// 使用统计项
export interface UsageStat {
  name: string;
  value: string;
  color: string;
}

// 使用记录
export interface UsageRecord {
  id: number;
  type: string;
  count: number;
  time: string;
}

// 订阅信息
export interface SubscriptionInfo {
  plan: string;
  status: 'active' | 'expired';
  startDate: string;
  expireDate: string;
  autoRenew: boolean;
  remainingDays: number;
  features: {
    name: string;
    used: number;
    limit: string;
  }[];
}

// 套餐信息
export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

// 员工信息
export interface StaffInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

class AccountService {
  // 获取账户信息
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      return await apiClient.get('/api/account/info');
    } catch (error) {
      // 返回Mock数据
      return {
        userId: 'USR001',
        phone: '138****8000',
        email: 'user@example.com',
        role: '终端客户',
        memberType: '年度会员',
        expireDate: '2025-12-31',
      };
    }
  }

  // 获取使用统计
  async getUsageStats(): Promise<UsageStat[]> {
    try {
      return await apiClient.get('/api/account/usage-stats');
    } catch (error) {
      return [
        { name: '自媒体运营', value: '1250次', color: '#1890ff' },
        { name: '招聘助手', value: '89次', color: '#722ed1' },
        { name: '智能获客', value: '320次', color: '#13c2c2' },
        { name: '推荐分享', value: '156次', color: '#fa8c16' },
      ];
    }
  }

  // 获取使用记录
  async getUsageRecords(): Promise<UsageRecord[]> {
    try {
      return await apiClient.get('/api/account/usage-records');
    } catch (error) {
      return [
        { id: 1, type: '内容生成', count: 5, time: '2024-04-30 14:30' },
        { id: 2, type: '简历筛选', count: 12, time: '2024-04-28 10:15' },
        { id: 3, type: '数字人视频', count: 3, time: '2024-04-25 16:45' },
        { id: 4, type: '智能获客', count: 8, time: '2024-04-20 09:00' },
        { id: 5, type: '推荐分享', count: 5, time: '2024-04-15 11:20' },
      ];
    }
  }

  // 获取订阅信息
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    try {
      return await apiClient.get('/api/account/subscription');
    } catch (error) {
      const expireDate = '2025-12-31';
      const days = Math.ceil((new Date(expireDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return {
        plan: '年度会员',
        status: 'active',
        startDate: '2024-01-01',
        expireDate: expireDate,
        autoRenew: true,
        remainingDays: days,
        features: [
          { name: '自媒体运营', used: 1250, limit: '无限' },
          { name: '招聘助手', used: 89, limit: '无限' },
          { name: '智能获客', used: 320, limit: '无限' },
          { name: '推荐分享', used: 156, limit: '无限' },
        ],
      };
    }
  }

  // 获取套餐列表
  async getPlans(): Promise<PlanInfo[]> {
    try {
      return await apiClient.get('/api/account/plans');
    } catch (error) {
      return [
        {
          id: 'monthly',
          name: '月度会员',
          price: 99,
          period: '30天',
          features: ['自媒体运营', '招聘助手', '智能获客', '推荐分享'],
        },
        {
          id: 'quarterly',
          name: '季度会员',
          price: 259,
          period: '90天',
          features: ['自媒体运营', '招聘助手', '智能获客', '推荐分享', '优先客服'],
        },
        {
          id: 'yearly',
          name: '年度会员',
          price: 899,
          period: '365天',
          features: ['全部功能', '优先客服', '专属客服', '定期培训'],
        },
      ];
    }
  }

  // 获取员工列表
  async getStaffList(): Promise<StaffInfo[]> {
    try {
      return await apiClient.get('/api/account/staff');
    } catch (error) {
      return [
        { id: '1', name: '王五', phone: '138****9012', email: 'wangwu@example.com', role: '运营专员', department: '运营部', status: 'active', createdAt: '2024-03-25', lastLogin: '2024-04-30 14:30' },
        { id: '2', name: '李明', phone: '139****5678', email: 'liming@example.com', role: '客服专员', department: '客服部', status: 'active', createdAt: '2024-02-15', lastLogin: '2024-04-30 09:15' },
        { id: '3', name: '张伟', phone: '137****9876', email: 'zhangwei@example.com', role: '管理员', department: '技术部', status: 'active', createdAt: '2024-01-10', lastLogin: '2024-04-29 18:45' },
      ];
    }
  }

  // 添加员工
  async addStaff(staff: Omit<StaffInfo, 'id' | 'createdAt'>): Promise<StaffInfo> {
    try {
      return await apiClient.post('/api/account/staff', staff);
    } catch (error) {
      const newStaff: StaffInfo = {
        id: Date.now().toString(),
        ...staff,
        createdAt: new Date().toISOString().split('T')[0],
      };
      return newStaff;
    }
  }

  // 更新员工
  async updateStaff(id: string, staff: Partial<StaffInfo>): Promise<StaffInfo> {
    try {
      return await apiClient.put(`/api/account/staff/${id}`, staff);
    } catch (error) {
      return { id, ...staff } as StaffInfo;
    }
  }

  // 删除员工
  async deleteStaff(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/account/staff/${id}`);
    } catch (error) {
      console.log('删除员工失败');
    }
  }
}

export const accountService = new AccountService();
export default accountService;
