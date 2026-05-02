export const COLORS = {
  primary: '#3B82F6', // 蓝色
  success: '#3B82F6', // 绿色
  warning: '#3B82F6', // 橙色
  danger: '#EF4444', // 红色
  purple: '#3B82F6', // 紫色
  pink: '#3B82F6', // 粉色
  
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

// AI创作类型 - 匹配Web端"内容自动生成"
export const AI_CREATION_TYPES = [
  { id: 'title', name: '标题', icon: 'text', color: '#3B82F6', description: '生成吸引人的标题，提升内容点击率' },
  { id: 'tags', name: '话题/标签', icon: 'pricetags', color: '#3B82F6', description: '生成相关话题标签，增加内容曝光' },
  { id: 'copywriting', name: '文案生成', icon: 'document-text', color: '#3B82F6', description: '智能生成文案，根据字数自动判断长短' },
  { id: 'imageToText', name: '图生文', icon: 'image', color: '#3B82F6', description: '根据图片生成文案描述' },
  { id: 'xiaohongshu', name: '小红书图文', icon: 'logo-instapaper', color: '#EF4444', description: '生成小红书风格的图文内容' },
  { id: 'image', name: '图片', icon: 'images', color: '#3B82F6', description: '生成高质量图片内容' },
  { id: 'ecommerce', name: '电商详情页', icon: 'storefront', color: '#14B8A6', description: '生成电商产品详情页内容' },
  { id: 'video', name: '短视频', icon: 'videocam', color: '#2563EB', description: '生成短视频内容，自动生成字幕、配音和背景音乐' },
  { id: 'videoAnalysis', name: '视频解析', icon: 'analytics', color: '#3B82F6', description: '分析短视频链接，生成新的爆款视频' },
  { id: 'digitalHuman', name: '数字人短视频', icon: 'person', color: '#D97706', description: '使用数字人生成真人出镜视频' },
];

export const FEATURES = [
  { id: 'media', name: '自媒体运营', icon: 'grid', color: '#3B82F6', description: 'AI内容生成与发布' },
  { id: 'recruitment', name: '招聘助手', icon: 'briefcase', color: '#3B82F6', description: '智能招聘解决方案' },
  { id: 'acquisition', name: '智能获客', icon: 'search', color: '#3B82F6', description: '精准客户发现' },
  { id: 'referral', name: '转介绍', icon: 'people', color: '#3B82F6', description: '推荐奖励系统' },
  { id: 'materials', name: '素材库', icon: 'folder', color: '#3B82F6', description: '素材管理' },
  { id: 'stats', name: '数据统计', icon: 'stats-chart', color: '#3B82F6', description: '数据报表' },
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
  todayComments: 234,
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
