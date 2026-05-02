// 用户类型
export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'customer';
  agentName?: string; // 所属代理商
  features: string[]; // 已开通功能
}

// 功能模块
export interface Feature {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  description: string;
}

// 数据统计
export interface Stats {
  todayViews: number;
  todayLikes: number;
  todayShares: number;
  totalContent: number;
  totalFollowers: number;
  growthRate: number;
}

// 内容项
export interface ContentItem {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video';
  thumbnail?: string;
  status: 'draft' | 'published' | 'failed';
  views: number;
  likes: number;
  createdAt: string;
}

// 消息项
export interface Message {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'order' | 'activity';
  read: boolean;
  createdAt: string;
}
