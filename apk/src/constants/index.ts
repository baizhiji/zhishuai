export const COLORS = {
  primary: '#3B82F6', // 蓝色
  success: '#10B981', // 绿色
  warning: '#F59E0B', // 橙色
  danger: '#EF4444', // 红色
  purple: '#6366F1', // 紫色
  pink: '#EC4899', // 粉色
  
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

// AI创作类型 - 匹配Web端"内容自动生成"
export const AI_CREATION_TYPES = [
  { id: 'title', name: '标题', icon: 'text-outline', color: '#2563EB', description: '生成吸引人的标题', tags: ['标题党', '悬念式', '数字型'] },
  { id: 'tags', name: '话题/标签', icon: 'pricetags-outline', color: '#7C3AED', description: '生成热门话题标签', tags: ['热门', '垂直', '泛流量'] },
  { id: 'copywriting', name: '文案生成', icon: 'document-text-outline', color: '#0891B2', description: '生成营销文案', tags: ['长文案', '短文案', '产品文案'] },
  { id: 'imageToText', name: '图生文', icon: 'image-outline', color: '#059669', description: '根据图片生成文案', tags: ['商品图', '场景图', '人物图'] },
  { id: 'xiaohongshu', name: '小红书图文', icon: 'logo-instagram-outline', color: '#DB2777', description: '生成小红书内容', tags: ['种草', '攻略', '测评'] },
  { id: 'image', name: '图片', icon: 'camera-outline', color: '#D97706', description: '生成高质量图片', tags: ['海报', '详情页', '封面'] },
  { id: 'ecommerce', name: '电商详情页', icon: 'storefront-outline', color: '#6366F1', description: '生成电商详情页', tags: ['淘宝', '京东', '拼多多'] },
  { id: 'video', name: '短视频', icon: 'film-outline', color: '#EA580C', description: '生成短视频内容', tags: ['竖版', '横版', '热门'] },
  { id: 'videoAnalysis', name: '视频解析', icon: 'barcode-outline', color: '#0891B2', description: '分析视频脚本', tags: ['链接解析', '脚本提取', '改写'] },
  { id: 'digitalHuman', name: '数字人短视频', icon: 'accessibility-outline', color: '#4F46E5', description: '生成数字人视频', tags: ['2D真人', '3D虚拟人', '克隆人'] },
];

// 首页功能中心
export const FEATURES = [
  { id: 'media', name: '自媒体运营', icon: 'newspaper-outline', color: '#2563EB', description: 'AI内容生成与发布' },
  { id: 'recruitment', name: '招聘助手', icon: 'briefcase-outline', color: '#7C3AED', description: '智能招聘解决方案' },
  { id: 'acquisition', name: '智能获客', icon: 'trending-up-outline', color: '#10B981', description: '精准客户发现' },
  { id: 'referral', name: '推荐分享', icon: 'share-social-outline', color: '#D97706', description: '推荐奖励系统' },
  { id: 'materials', name: '素材库', icon: 'images-outline', color: '#EC4899', description: '素材管理' },
  { id: 'analytics', name: '数据统计', icon: 'stats-chart-outline', color: '#0891B2', description: '数据报表' },
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
