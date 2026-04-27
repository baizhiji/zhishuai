import request from '../lib/request';
import type {
  ApiResponse,
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  Material,
  MaterialListParams,
  ContentGenerateRequest,
  BatchGenerateRequest,
  BatchEditRequest,
  Account,
  Platform,
  PublishTask,
  Job,
  Resume,
  Customer,
  AcquisitionTask,
  AcquisitionStats,
  ReferralCode,
  ReferralRecord,
  ReferralStats,
  Order,
  OrderType,
  PaymentMethod,
  SubscriptionPlan,
  UserBalance,
  UserPoints,
  ApiProvider,
  Knowledge,
  Log
} from '../types/api';

// ==================== 认证相关 ====================

export const authApi = {
  // 登录
  login: (data: LoginRequest) => {
    return request.post<ApiResponse<LoginResponse>>('/auth/login', data);
  },

  // 注册
  register: (data: RegisterRequest) => {
    return request.post<ApiResponse<LoginResponse>>('/auth/register', data);
  },

  // 获取用户信息
  getUserInfo: () => {
    return request.get<ApiResponse<User>>('/user/info');
  },

  // 退出登录
  logout: () => {
    return request.post<ApiResponse<void>>('/auth/logout');
  }
};

// ==================== 素材库相关 ====================

export const materialsApi = {
  // 获取素材列表
  list: (params: MaterialListParams) => {
    return request.get<ApiResponse<{ list: Material[]; total: number }>>('/materials', { params });
  },

  // 获取素材详情
  get: (id: string) => {
    return request.get<ApiResponse<Material>>(`/materials/${id}`);
  },

  // 创建素材
  create: (data: Partial<Material>) => {
    return request.post<ApiResponse<Material>>('/materials', data);
  },

  // 更新素材
  update: (id: string, data: Partial<Material>) => {
    return request.put<ApiResponse<Material>>(`/materials/${id}`, data);
  },

  // 删除素材
  delete: (id: string) => {
    return request.delete<ApiResponse<void>>(`/materials/${id}`);
  },

  // 下载素材
  download: (id: string) => {
    return request.post<ApiResponse<{ url: string }>>(`/materials/${id}/download`);
  },

  // 批量删除
  batchDelete: (ids: string[]) => {
    return request.post<ApiResponse<void>>('/materials/batch-delete', { ids });
  }
};

// ==================== 内容工厂相关 ====================

export const contentApi = {
  // 生成内容
  generate: (data: ContentGenerateRequest) => {
    return request.post<ApiResponse<{ materialId: string }>>('/content/generate', data);
  },

  // 批量生成
  batchGenerate: (data: BatchGenerateRequest) => {
    return request.post<ApiResponse<{ materialIds: string[] }>>('/content/batch-generate', data);
  },

  // 批量剪辑
  batchEdit: (data: BatchEditRequest) => {
    return request.post<ApiResponse<{ taskId: string }>>('/content/batch-edit', data);
  },

  // 获取生成任务状态
  getTaskStatus: (taskId: string) => {
    return request.get<ApiResponse<{ status: string; progress: number }>>(`/content/tasks/${taskId}`);
  }
};

// ==================== 矩阵管理相关 ====================

export const accountsApi = {
  // 获取账号列表
  list: () => {
    return request.get<ApiResponse<Account[]>>('/accounts');
  },

  // 获取账号详情
  get: (id: string) => {
    return request.get<ApiResponse<Account>>(`/accounts/${id}`);
  },

  // 添加账号
  create: (data: Partial<Account>) => {
    return request.post<ApiResponse<Account>>('/accounts', data);
  },

  // 更新账号
  update: (id: string, data: Partial<Account>) => {
    return request.put<ApiResponse<Account>>(`/accounts/${id}`, data);
  },

  // 删除账号
  delete: (id: string) => {
    return request.delete<ApiResponse<void>>(`/accounts/${id}`);
  },

  // 同步账号数据
  sync: (id: string) => {
    return request.post<ApiResponse<void>>(`/accounts/${id}/sync`);
  }
};

// ==================== 发布中心相关 ====================

export const publishApi = {
  // 获取发布任务列表
  list: (params: { page: number; pageSize: number; status?: string }) => {
    return request.get<ApiResponse<{ list: PublishTask[]; total: number }>>('/publish/tasks', { params });
  },

  // 创建发布任务
  create: (data: {
    materialId: string;
    platforms: Platform[];
    scheduledTime?: string;
  }) => {
    return request.post<ApiResponse<PublishTask>>('/publish/tasks', data);
  },

  // 获取任务详情
  get: (id: string) => {
    return request.get<ApiResponse<PublishTask>>(`/publish/tasks/${id}`);
  },

  // 批量发布
  batchPublish: (data: { materialIds: string[]; platforms: Platform[] }) => {
    return request.post<ApiResponse<{ taskIds: string[] }>>('/publish/batch', data);
  },

  // 取消任务
  cancel: (id: string) => {
    return request.post<ApiResponse<void>>(`/publish/tasks/${id}/cancel`);
  }
};

// ==================== 招聘助手相关 ====================

export const recruitmentApi = {
  // 获取职位列表
  getJobs: () => {
    return request.get<ApiResponse<Job[]>>('/recruitment/jobs');
  },

  // 创建职位
  createJob: (data: Partial<Job>) => {
    return request.post<ApiResponse<Job>>('/recruitment/jobs', data);
  },

  // 更新职位
  updateJob: (id: string, data: Partial<Job>) => {
    return request.put<ApiResponse<Job>>(`/recruitment/jobs/${id}`, data);
  },

  // 删除职位
  deleteJob: (id: string) => {
    return request.delete<ApiResponse<void>>(`/recruitment/jobs/${id}`);
  },

  // 获取简历列表
  getResumes: (params: { page: number; pageSize: number; jobId?: string }) => {
    return request.get<ApiResponse<{ list: Resume[]; total: number }>>('/recruitment/resumes', { params });
  },

  // 简历评分
  scoreResume: (id: string, jobId: string) => {
    return request.post<ApiResponse<{ score: number }>>(`/recruitment/resumes/${id}/score`, { jobId });
  },

  // 更新简历状态
  updateResumeStatus: (id: string, status: string) => {
    return request.put<ApiResponse<Resume>>(`/recruitment/resumes/${id}`, { status });
  }
};

// ==================== 智能获客相关 ====================

export const acquisitionApi = {
  // 获取潜客列表
  getCustomers: (params: { page: number; pageSize: number; keyword?: string }) => {
    return request.get<ApiResponse<{ list: Customer[]; total: number }>>('/acquisition/customers', { params });
  },

  // 创建潜客
  createCustomer: (data: Partial<Customer>) => {
    return request.post<ApiResponse<Customer>>('/acquisition/customers', data);
  },

  // 更新潜客
  updateCustomer: (id: string, data: Partial<Customer>) => {
    return request.put<ApiResponse<Customer>>(`/acquisition/customers/${id}`, data);
  },

  // 删除潜客
  deleteCustomer: (id: string) => {
    return request.delete<ApiResponse<void>>(`/acquisition/customers/${id}`);
  },

  // 创建引流任务
  createTask: (data: Partial<AcquisitionTask>) => {
    return request.post<ApiResponse<AcquisitionTask>>('/acquisition/tasks', data);
  },

  // 获取统计
  getStats: () => {
    return request.get<ApiResponse<AcquisitionStats>>('/acquisition/stats');
  }
};

// ==================== 推荐分享相关 ====================

export const referralApi = {
  // 生成推荐码
  createCode: () => {
    return request.post<ApiResponse<ReferralCode>>('/referral/codes');
  },

  // 获取推荐码列表
  getCodes: () => {
    return request.get<ApiResponse<ReferralCode[]>>('/referral/codes');
  },

  // 获取推荐记录
  getRecords: (params: { page: number; pageSize: number }) => {
    return request.get<ApiResponse<{ list: ReferralRecord[]; total: number }>>('/referral/records', { params });
  },

  // 获取统计数据
  getStats: () => {
    return request.get<ApiResponse<ReferralStats>>('/referral/stats');
  }
};

// ==================== 订单支付相关 ====================

export const orderApi = {
  // 创建充值订单
  createRechargeOrder: (data: { amount: number; paymentMethod: PaymentMethod }) => {
    return request.post<ApiResponse<{ orderId: string; paymentUrl: string }>>('/orders/recharge', data);
  },

  // 创建订阅订单
  createSubscribeOrder: (data: { planId: SubscriptionPlan; paymentMethod: PaymentMethod }) => {
    return request.post<ApiResponse<{ orderId: string; paymentUrl: string }>>('/orders/subscribe', data);
  },

  // 获取订单列表
  list: (params: { page: number; pageSize: number; type?: OrderType }) => {
    return request.get<ApiResponse<{ list: Order[]; total: number }>>('/orders', { params });
  },

  // 获取订单详情
  get: (id: string) => {
    return request.get<ApiResponse<Order>>(`/orders/${id}`);
  },

  // 取消订单
  cancel: (id: string) => {
    return request.post<ApiResponse<void>>(`/orders/${id}/cancel`);
  }
};

// ==================== 用户中心相关 ====================

export const userApi = {
  // 更新用户信息
  update: (data: Partial<User>) => {
    return request.put<ApiResponse<User>>('/user/info', data);
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) => {
    return request.put<ApiResponse<void>>('/user/password', data);
  },

  // 获取余额
  getBalance: () => {
    return request.get<ApiResponse<UserBalance>>('/user/balance');
  },

  // 获取积分
  getPoints: () => {
    return request.get<ApiResponse<UserPoints>>('/user/points');
  },

  // 获取转介绍记录
  getReferrals: (params: { page: number; pageSize: number }) => {
    return request.get<ApiResponse<{ list: ReferralRecord[]; total: number }>>('/user/referrals', { params });
  }
};

// ==================== 系统设置相关 ====================

export const settingsApi = {
  // 获取API服务商配置
  getApiProviders: () => {
    return request.get<ApiResponse<ApiProvider[]>>('/settings/api-providers');
  },

  // 更新API服务商配置
  updateApiProvider: (id: string, data: Partial<ApiProvider>) => {
    return request.put<ApiResponse<ApiProvider>>(`/settings/api-providers/${id}`, data);
  },

  // 获取知识库列表
  getKnowledge: () => {
    return request.get<ApiResponse<Knowledge[]>>('/settings/knowledge');
  },

  // 上传知识库文件
  uploadKnowledge: (data: FormData) => {
    return request.post<ApiResponse<Knowledge>>('/settings/knowledge/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 获取操作日志
  getLogs: (params: { page: number; pageSize: number; action?: string }) => {
    return request.get<ApiResponse<{ list: Log[]; total: number }>>('/settings/logs', { params });
  }
};

// ==================== 导出所有API ====================

export default {
  auth: authApi,
  materials: materialsApi,
  content: contentApi,
  accounts: accountsApi,
  publish: publishApi,
  recruitment: recruitmentApi,
  acquisition: acquisitionApi,
  referral: referralApi,
  order: orderApi,
  user: userApi,
  settings: settingsApi
};
