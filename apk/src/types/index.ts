// 用户类型
export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'customer';
  actualRole: 'admin' | 'agent' | 'customer'; // 实际角色（不变）
  agentName?: string; // 所属代理商
  features: string[]; // 已开通功能
  isAdmin?: boolean; // 是否是管理员账号
}

// 角色类型
export type UserRole = 'admin' | 'agent' | 'customer';

// 角色信息
export interface RoleInfo {
  role: UserRole;
  name: string;
  description: string;
  icon: string;
}

// 可用角色列表
export const ROLE_LIST: RoleInfo[] = [
  { role: 'admin', name: '管理员', description: '开发者总后台', icon: 'shield-checkmark' },
  { role: 'agent', name: '代理商', description: '区域代理后台', icon: 'business' },
  { role: 'customer', name: '终端客户', description: '客户后台', icon: 'person' },
];

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
