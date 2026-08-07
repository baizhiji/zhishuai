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
  // 获取账户信息 —— 对齐 WEB 端 GET /api/account/
  async getAccountInfo(): Promise<AccountInfo | null> {
    try {
      return await apiClient.get('/account/');
    } catch {
      return null;
    }
  }

  // 获取使用统计
  async getUsageStats(): Promise<UsageStat[]> {
    try {
      return await apiClient.get('/account/usage-stats');
    } catch {
      return [];
    }
  }

  // 获取使用记录
  async getUsageRecords(): Promise<UsageRecord[]> {
    try {
      return await apiClient.get('/account/usage-records');
    } catch {
      return [];
    }
  }

  // 获取订阅信息 —— 后端暂无 /account/subscription 端点，返回 null 降级
  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    try {
      return await apiClient.get('/account/subscription');
    } catch {
      return null;
    }
  }

  // 获取套餐列表 —— 对齐 WEB 端 GET /api/account/packages
  async getPlans(): Promise<PlanInfo[]> {
    try {
      return await apiClient.get('/account/packages');
    } catch {
      return [];
    }
  }

  // 获取员工列表
  async getStaffList(): Promise<StaffInfo[]> {
    try {
      return await apiClient.get('/account/staff');
    } catch {
      return [];
    }
  }

  // 添加员工
  async addStaff(staff: Omit<StaffInfo, 'id' | 'createdAt'>): Promise<StaffInfo | null> {
    try {
      return await apiClient.post('/account/staff', staff);
    } catch {
      return null;
    }
  }

  // 更新员工
  async updateStaff(id: string, staff: Partial<StaffInfo>): Promise<StaffInfo | null> {
    try {
      return await apiClient.put(`/account/staff/${id}`, staff);
    } catch {
      return null;
    }
  }

  // 删除员工
  async deleteStaff(id: string): Promise<void> {
    try {
      await apiClient.delete(`/account/staff/${id}`);
    } catch {
      throw new Error('删除员工失败');
    }
  }
}

export const accountService = new AccountService();
export default accountService;
