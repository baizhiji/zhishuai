export const COLORS = {
  primary: '#3B82F6', // 蓝色
  success: '#10B981', // 绿色
  warning: '#F59E0B', // 橙色
  danger: '#EF4444', // 红色
  purple: '#8B5CF6', // 紫色
  pink: '#EC4899', // 粉色
  
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export const FEATURES = [
  { id: 'media', name: '自媒体运营', icon: '📱', color: '#3B82F6', description: 'AI内容生成与发布' },
  { id: 'recruitment', name: '招聘助手', icon: '👔', color: '#10B981', description: '智能招聘解决方案' },
  { id: 'acquisition', name: '智能获客', icon: '🎯', color: '#F59E0B', description: '精准客户发现' },
  { id: 'referral', name: '转介绍', icon: '🤝', color: '#8B5CF6', description: '推荐奖励系统' },
  { id: 'materials', name: '素材库', icon: '📁', color: '#EC4899', description: '素材管理' },
  { id: 'stats', name: '数据统计', icon: '📊', color: '#6366F1', description: '数据报表' },
];

export const MOCK_USER = {
  id: '1',
  phone: '138****8888',
  nickname: '张三',
  role: 'customer' as const,
  agentName: '北京代理商',
  features: ['media', 'recruitment', 'acquisition', 'referral', 'materials', 'stats'],
};

export const MOCK_STATS = {
  todayViews: 12580,
  todayLikes: 892,
  todayShares: 156,
  totalContent: 328,
  totalFollowers: 15820,
  growthRate: 12.5,
};

export const MOCK_CONTENT = [
  { id: '1', title: 'AI赋能企业数字化转型', type: 'text' as const, status: 'published' as const, views: 2560, likes: 128, createdAt: '2024-05-01' },
  { id: '2', title: '新品上市宣传视频', type: 'video' as const, status: 'published' as const, views: 8920, likes: 456, createdAt: '2024-05-02' },
  { id: '3', title: '端午节活动海报', type: 'image' as const, status: 'draft' as const, views: 0, likes: 0, createdAt: '2024-05-03' },
];

export const MOCK_MESSAGES = [
  { id: '1', title: '系统通知', content: '您的账号已开通自媒体运营功能', type: 'system' as const, read: false, createdAt: '2024-05-01' },
  { id: '2', title: '订单完成', content: '您的视频剪辑任务已完成', type: 'order' as const, read: true, createdAt: '2024-04-30' },
  { id: '3', title: '活动提醒', content: '五一活动即将开始，快来参与！', type: 'activity' as const, read: false, createdAt: '2024-04-29' },
];
