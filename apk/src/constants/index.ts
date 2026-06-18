// AI创作类型配置（兼容别名）
export const CONTENT_TYPES = [
  { id: 'title', name: '标题', icon: 'text-outline', color: '#2563EB', description: '生成吸引人的标题', tags: ['吸引点击', 'SEO优化', '热点标题'] },
  { id: 'topics', name: '话题标签', icon: 'pricetag-outline', color: '#7C3AED', description: '生成热门话题标签', tags: ['微博话题', '抖音话题', '小红书话题'] },
  { id: 'copywriting', name: '文案生成', icon: 'create-outline', color: '#0891B2', description: '生成营销文案', tags: ['种草文案', '产品卖点', '品牌故事'] },
  { id: 'imageToText', name: '图生文', icon: 'scan-outline', color: '#059669', description: '根据图片生成文案', tags: ['图片描述', '卖点提取', '场景解读'] },
  { id: 'xiaohongshu', name: '小红书图文', icon: 'book-outline', color: '#EC4899', description: '生成小红书内容', tags: ['种草笔记', '好物分享', '探店打卡'] },
  { id: 'image', name: '图片', icon: 'images-outline', color: '#D97706', description: '生成高质量图片', tags: ['商品图', '海报图', '封面图'] },
  { id: 'ecommerce', name: '电商详情页', icon: 'bag-outline', color: '#6366F1', description: '生成电商详情页', tags: ['产品详情', '卖点提炼', '买家秀'] },
  { id: 'video', name: '短视频', icon: 'videocam-outline', color: '#DC2626', description: '生成短视频脚本', tags: ['口播脚本', '分镜脚本', '剧情脚本'] },
  { id: 'videoAnalysis', name: '视频解析', icon: 'link-outline', color: '#0891B2', description: '分析视频链接生成脚本', tags: ['链接解析', '脚本改写', '爆款分析'] },
  { id: 'digitalHuman', name: '数字人短视频', icon: 'people-outline', color: '#4F46E5', description: '生成数字人视频脚本', tags: ['数字人', 'AI主播', '虚拟形象'] },
];

// 别名兼容
export const AI_CREATION_TYPES = CONTENT_TYPES;

// 首页功能中心
export const FEATURES = [
  { id: 'media', name: '自媒体运营', icon: 'newspaper-outline', color: '#2563EB', description: 'AI内容生成与发布' },
  { id: 'recruitment', name: '招聘助手', icon: 'briefcase-outline', color: '#7C3AED', description: '智能招聘解决方案' },
  { id: 'acquisition', name: '智能获客', icon: 'trending-up-outline', color: '#10B981', description: '精准客户发现' },
  { id: 'referral', name: '推荐分享', icon: 'share-social-outline', color: '#D97706', description: '推荐奖励系统' },
  { id: 'materials', name: '素材库', icon: 'images-outline', color: '#EC4899', description: '素材管理' },
  { id: 'analytics', name: '数据统计', icon: 'stats-chart-outline', color: '#0891B2', description: '数据报表' },
];

// Mock 常量已移除 — 所有数据通过 API 获取
// 如需默认空值，使用以下类型定义：
export interface UserStats {
  todayViews: number;
  todayLikes: number;
  todayComments: number;
  todayShares: number;
  totalContent: number;
  totalFollowers: number;
  growthRate: number;
}

export const DEFAULT_STATS: UserStats = {
  todayViews: 0,
  todayLikes: 0,
  todayComments: 0,
  todayShares: 0,
  totalContent: 0,
  totalFollowers: 0,
  growthRate: 0,
};
