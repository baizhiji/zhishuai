import { message } from 'antd';
import type {
  ApiResponse,
  User,
  Material,
  MaterialType,
  MaterialStatus,
  Account,
  Platform,
  PublishTask,
  Job,
  Resume,
  Customer,
  AcquisitionStats,
  ReferralStats,
  Order,
  OrderType,
  UserBalance,
  UserPoints
} from '@/types/api';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    role: 'admin',
    status: 'active'
  },
  {
    id: '2',
    name: '李四',
    phone: '13800138001',
    email: 'lisi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    role: 'agent',
    status: 'active'
  },
  {
    id: '3',
    name: '王五',
    phone: '13800138002',
    email: 'wangwu@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Brian',
    role: 'customer',
    status: 'active'
  }
];

// 模拟素材数据
const mockMaterials: Material[] = [
  {
    id: '1',
    type: MaterialType.TEXT,
    title: 'AI产品介绍文案',
    content: '这是一篇关于AI产品的介绍文案，详细介绍了产品的功能和优势...',
    category: '自媒体',
    tags: ['AI', '产品', '介绍'],
    status: MaterialStatus.UNUSED,
    createdAt: '2024-03-26 10:00:00',
    updatedAt: '2024-03-26 10:00:00'
  },
  {
    id: '2',
    type: MaterialType.IMAGE,
    title: '产品宣传海报',
    content: '产品宣传海报设计图',
    url: 'https://via.placeholder.com/800x600',
    thumbnailUrl: 'https://via.placeholder.com/200x150',
    category: '自媒体',
    tags: ['海报', '宣传'],
    status: MaterialStatus.UNUSED,
    createdAt: '2024-03-26 11:00:00',
    updatedAt: '2024-03-26 11:00:00'
  },
  {
    id: '3',
    type: MaterialType.VIDEO,
    title: '产品展示视频',
    content: '产品功能展示视频',
    url: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://via.placeholder.com/200x150',
    category: '自媒体',
    tags: ['视频', '展示'],
    status: MaterialStatus.USED,
    createdAt: '2024-03-26 12:00:00',
    updatedAt: '2024-03-26 12:00:00'
  }
];

// 模拟账号数据
const mockAccounts: Account[] = [
  {
    id: '1',
    platform: Platform.DOUYIN,
    accountName: '智枢AI官方',
    accountId: 'douyin_001',
    avatar: 'https://via.placeholder.com/100x100',
    followerCount: 10000,
    autoPublish: true,
    status: 'active',
    createdAt: '2024-03-20 10:00:00'
  },
  {
    id: '2',
    platform: Platform.XIAOHONGSHU,
    accountName: '智枢AI小红书',
    accountId: 'xhs_001',
    avatar: 'https://via.placeholder.com/100x100',
    followerCount: 5000,
    autoPublish: true,
    status: 'active',
    createdAt: '2024-03-20 11:00:00'
  }
];

// 模拟发布任务数据
const mockPublishTasks: PublishTask[] = [
  {
    id: '1',
    materialId: '1',
    platforms: [Platform.DOUYIN, Platform.XIAOHONGSHU],
    status: 'success',
    results: [
      {
        platform: Platform.DOUYIN,
        status: 'success',
        url: 'https://douyin.com/video/123'
      },
      {
        platform: Platform.XIAOHONGSHU,
        status: 'success',
        url: 'https://xiaohongshu.com/explore/456'
      }
    ],
    createdAt: '2024-03-26 14:00:00'
  }
];

// 模拟职位数据
const mockJobs: Job[] = [
  {
    id: '1',
    title: '前端开发工程师',
    department: '技术部',
    location: '北京',
    salaryMin: 15,
    salaryMax: 25,
    experience: '3-5年',
    education: '本科',
    description: '负责公司前端产品开发和维护',
    requirements: ['精通React', '熟悉TypeScript', '有项目经验'],
    status: 'active',
    createdAt: '2024-03-20 10:00:00'
  },
  {
    id: '2',
    title: 'AI算法工程师',
    department: 'AI部',
    location: '上海',
    salaryMin: 20,
    salaryMax: 35,
    experience: '3-5年',
    education: '硕士',
    description: '负责AI算法研发和优化',
    requirements: ['精通Python', '熟悉深度学习', '有项目经验'],
    status: 'active',
    createdAt: '2024-03-20 11:00:00'
  }
];

// 模拟简历数据
const mockResumes: Resume[] = [
  {
    id: '1',
    jobId: '1',
    name: '赵六',
    phone: '13800138003',
    email: 'zhaoliu@example.com',
    age: 28,
    education: '本科',
    experience: '3年',
    skills: ['React', 'TypeScript', 'Vue'],
    score: 85,
    status: 'reviewed',
    createdAt: '2024-03-26 10:00:00'
  }
];

// 模拟潜客数据
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: '客户A',
    phone: '13900139000',
    email: 'customer_a@example.com',
    source: '抖音',
    interestLevel: 'high',
    status: 'new',
    tags: ['潜在客户', '高意向'],
    notes: '对产品感兴趣',
    createdAt: '2024-03-26 09:00:00'
  },
  {
    id: '2',
    name: '客户B',
    phone: '13900139001',
    email: 'customer_b@example.com',
    source: '小红书',
    interestLevel: 'medium',
    status: 'contacted',
    tags: ['潜在客户'],
    notes: '已联系，等待回复',
    createdAt: '2024-03-26 10:00:00'
  }
];

// Mock API服务
export const mockApi = {
  // 模拟登录
  login: async (phone: string, password: string) => {
    await delay(500);
    const user = mockUsers.find(u => u.phone === phone);
    if (user) {
      return {
        token: 'mock_token_' + Date.now(),
        user
      };
    }
    throw new Error('用户名或密码错误');
  },

  // 模拟获取用户信息
  getUserInfo: async () => {
    await delay(300);
    return mockUsers[0];
  },

  // 模拟获取素材列表
  getMaterials: async (params: any) => {
    await delay(300);
    return {
      list: mockMaterials,
      total: mockMaterials.length
    };
  },

  // 模拟创建素材
  createMaterial: async (data: any) => {
    await delay(500);
    const newMaterial: Material = {
      id: String(mockMaterials.length + 1),
      ...data,
      status: MaterialStatus.UNUSED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockMaterials.push(newMaterial);
    return newMaterial;
  },

  // 模拟删除素材
  deleteMaterial: async (id: string) => {
    await delay(300);
    const index = mockMaterials.findIndex(m => m.id === id);
    if (index > -1) {
      mockMaterials.splice(index, 1);
    }
  },

  // 模拟下载素材
  downloadMaterial: async (id: string) => {
    await delay(500);
    const material = mockMaterials.find(m => m.id === id);
    if (material) {
      material.status = MaterialStatus.USED;
      return { url: material.url };
    }
    throw new Error('素材不存在');
  },

  // 模拟获取账号列表
  getAccounts: async () => {
    await delay(300);
    return mockAccounts;
  },

  // 模拟获取发布任务列表
  getPublishTasks: async (params: any) => {
    await delay(300);
    return {
      list: mockPublishTasks,
      total: mockPublishTasks.length
    };
  },

  // 模拟创建发布任务
  createPublishTask: async (data: any) => {
    await delay(500);
    const newTask: PublishTask = {
      id: String(mockPublishTasks.length + 1),
      ...data,
      status: 'pending',
      results: [],
      createdAt: new Date().toISOString()
    };
    mockPublishTasks.push(newTask);
    return newTask;
  },

  // 模拟获取职位列表
  getJobs: async () => {
    await delay(300);
    return mockJobs;
  },

  // 模拟创建职位
  createJob: async (data: any) => {
    await delay(500);
    const newJob: Job = {
      id: String(mockJobs.length + 1),
      ...data,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    mockJobs.push(newJob);
    return newJob;
  },

  // 模拟获取简历列表
  getResumes: async (params: any) => {
    await delay(300);
    return {
      list: mockResumes,
      total: mockResumes.length
    };
  },

  // 模拟获取潜客列表
  getCustomers: async (params: any) => {
    await delay(300);
    return {
      list: mockCustomers,
      total: mockCustomers.length
    };
  },

  // 模拟创建潜客
  createCustomer: async (data: any) => {
    await delay(500);
    const newCustomer: Customer = {
      id: String(mockCustomers.length + 1),
      ...data,
      createdAt: new Date().toISOString()
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },

  // 模拟获取获客统计
  getAcquisitionStats: async () => {
    await delay(300);
    const stats: AcquisitionStats = {
      totalCustomers: mockCustomers.length,
      newCustomers: 5,
      conversionRate: 23.5,
      avgAcquisitionCost: 150
    };
    return stats;
  },

  // 模拟获取推荐统计
  getReferralStats: async () => {
    await delay(300);
    const stats: ReferralStats = {
      totalReferrals: 10,
      totalEarnings: 500,
      pendingEarnings: 100,
      conversionRate: 30
    };
    return stats;
  },

  // 模拟获取用户余额
  getUserBalance: async () => {
    await delay(300);
    const balance: UserBalance = {
      balance: 1000,
      frozenBalance: 0
    };
    return balance;
  },

  // 模拟获取用户积分
  getUserPoints: async () => {
    await delay(300);
    const points: UserPoints = {
      total: 5000,
      available: 4800,
      frozen: 200
    };
    return points;
  },

  // 模拟获取订单列表
  getOrders: async (params: any) => {
    await delay(300);
    const orders: Order[] = [
      {
        id: '1',
        type: OrderType.RECHARGE,
        amount: 100,
        paymentMethod: 'alipay',
        status: 'paid',
        createdAt: '2024-03-25 10:00:00',
        paidAt: '2024-03-25 10:01:00'
      },
      {
        id: '2',
        type: OrderType.SUBSCRIBE,
        amount: 299,
        paymentMethod: 'wechat',
        status: 'paid',
        planId: 'monthly',
        createdAt: '2024-03-24 10:00:00',
        paidAt: '2024-03-24 10:01:00'
      }
    ];
    return {
      list: orders,
      total: orders.length
    };
  }
};

export default mockApi;
