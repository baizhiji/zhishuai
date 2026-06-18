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
    const data = await apiClient.get<AccountInfo>('/account/');
    return data;
  }

  // 获取使用统计
  async getUsageStats(): Promise<UsageStat[]> {
    const data = await apiClient.get<UsageStat[]>('/account/usage-stats');
    return data;
  }

  // 获取使用记录
  async getUsageRecords(): Promise<UsageRecord[]> {
    const data = await apiClient.get<UsageRecord[]>('/account/usage-records');
    return data;
  }

  // 获取订阅信息
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const data = await apiClient.get<SubscriptionInfo>('/account/subscription');
    return data;
  }

  // 获取套餐列表
  async getPlans(): Promise<PlanInfo[]> {
    const data = await apiClient.get<PlanInfo[]>('/account/plans');
    return data;
  }

  // 获取员工列表
  async getStaffList(): Promise<StaffInfo[]> {
    const data = await apiClient.get<StaffInfo[]>('/account/staff');
    return data;
  }

  // 添加员工
  async addStaff(staff: Omit<StaffInfo, 'id' | 'createdAt'>): Promise<StaffInfo> {
    const data = await apiClient.post<StaffInfo>('/account/staff', staff);
    return data;
  }

  // 更新员工
  async updateStaff(id: string, staff: Partial<StaffInfo>): Promise<StaffInfo> {
    const data = await apiClient.put<StaffInfo>(`/account/staff/${id}`, staff);
    return data;
  }

  // 删除员工
  async deleteStaff(id: string): Promise<void> {
    await apiClient.delete(`/account/staff/${id}`);
  }
}

export const accountService = new AccountService();
export default accountService;
