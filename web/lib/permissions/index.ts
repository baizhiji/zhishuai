/**
 * 权限工具函数
 */

import { UserRole, Permission, rolePermissions, featureToggles } from './config';

// 重新导出 config 中的内容
export { UserRole, Permission, rolePermissions, featureToggles } from './config';
export type { FeatureToggle } from './config';

/**
 * 检查用户是否拥有指定权限
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * 检查用户是否拥有任一指定权限
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * 检查用户是否拥有所有指定权限
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * 获取用户的所有权限
 */
export function getUserPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * 检查功能开关是否启用
 */
export function isFeatureEnabled(featureKey: string, enabledFeatures?: Record<string, boolean>): boolean {
  const feature = featureToggles.find(f => f.key === featureKey);
  if (!feature) return false;
  if (enabledFeatures && featureKey in enabledFeatures) {
    return enabledFeatures[featureKey];
  }
  return feature.defaultEnabled;
}

/**
 * 获取用户可访问的菜单
 */
export function getAccessibleMenus(
  role: UserRole,
  enabledFeatures?: Record<string, boolean>
): MenuItem[] {
  const permissions = getUserPermissions(role);

  const allMenus = getAllMenus();

  return allMenus.filter(menu => {
    // 如果菜单不需要权限，默认显示
    if (!menu.permission) return true;

    // 检查用户是否有权限
    const hasAccess = hasPermission(role, menu.permission);

    // 如果有权限，检查功能开关
    if (hasAccess && menu.featureKey) {
      return isFeatureEnabled(menu.featureKey, enabledFeatures);
    }

    return hasAccess;
  });
}

/**
 * 菜单项接口
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  permission?: Permission;
  featureKey?: string;
  children?: MenuItem[];
}

/**
 * 获取所有菜单配置
 */
export function getAllMenus(): MenuItem[] {
  return [
    {
      key: 'dashboard',
      label: '数据大盘',
      icon: 'Dashboard',
      path: '/dashboard',
      permission: Permission.ACCOUNT_INFO,
    },
    {
      key: 'media',
      label: '自媒体运营',
      icon: 'VideoCamera',
      featureKey: 'media_factory',
      children: [
        {
          key: 'media-factory',
          label: 'AI内容工厂',
          path: '/media/factory',
          permission: Permission.MEDIA_FACTORY,
          featureKey: 'media_factory',
        },
        {
          key: 'media-matrix',
          label: '矩阵管理',
          path: '/media/matrix',
          permission: Permission.MEDIA_MATRIX,
          featureKey: 'media_matrix',
        },
        {
          key: 'media-publish',
          label: '发布中心',
          path: '/media/publish',
          permission: Permission.MEDIA_PUBLISH,
          featureKey: 'media_publish',
        },
        {
          key: 'media-report',
          label: '数据报表',
          path: '/media/report',
          permission: Permission.MEDIA_REPORT,
        },
        {
          key: 'media-digital-human',
          label: '数字人视频',
          path: '/media/digital-humans',
          permission: Permission.MEDIA_DIGITAL_HUMAN,
          featureKey: 'media_digital_human',
        },
        {
          key: 'materials',
          label: '素材库',
          path: '/materials',
          permission: Permission.MATERIALS,
        },
      ],
    },
    {
      key: 'recruitment',
      label: '招聘助手',
      icon: 'UserSwitch',
      featureKey: 'recruitment',
      permission: Permission.RECRUITMENT_BOARD,
      children: [
        {
          key: 'recruitment-board',
          label: '招聘看板',
          path: '/recruitment/board',
          permission: Permission.RECRUITMENT_BOARD,
          featureKey: 'recruitment',
        },
        {
          key: 'recruitment-publish',
          label: '职位发布',
          path: '/recruitment/publish',
          permission: Permission.RECRUITMENT_PUBLISH,
          featureKey: 'recruitment',
        },
        {
          key: 'recruitment-screen',
          label: '简历筛选',
          path: '/recruitment/screen',
          permission: Permission.RECRUITMENT_SCREEN,
          featureKey: 'recruitment',
        },
        {
          key: 'recruitment-reply',
          label: '自动回复',
          path: '/recruitment/reply',
          permission: Permission.RECRUITMENT_REPLY,
          featureKey: 'recruitment',
        },
        {
          key: 'recruitment-interview',
          label: '面试管理',
          path: '/recruitment/interview',
          permission: Permission.RECRUITMENT_INTERVIEW,
          featureKey: 'recruitment',
        },
        {
          key: 'recruitment-stats',
          label: '招聘统计',
          path: '/recruitment/stats',
          permission: Permission.RECRUITMENT_STATS,
          featureKey: 'recruitment',
        },
      ],
    },
    {
      key: 'acquisition',
      label: '智能获客',
      icon: 'CustomerService',
      featureKey: 'acquisition',
      permission: Permission.ACQUISITION_BOARD,
      children: [
        {
          key: 'acquisition-board',
          label: '获客看板',
          path: '/acquisition/board',
          permission: Permission.ACQUISITION_BOARD,
          featureKey: 'acquisition',
        },
        {
          key: 'acquisition-discover',
          label: '潜客发现',
          path: '/acquisition/discover',
          permission: Permission.ACQUISITION_DISCOVER,
          featureKey: 'acquisition',
        },
        {
          key: 'acquisition-task',
          label: '引流任务',
          path: '/acquisition/task',
          permission: Permission.ACQUISITION_TASK,
          featureKey: 'acquisition',
        },
        {
          key: 'acquisition-stats',
          label: '获客统计',
          path: '/acquisition/stats',
          permission: Permission.ACQUISITION_STATS,
          featureKey: 'acquisition',
        },
      ],
    },
    {
      key: 'share',
      label: '推荐分享',
      icon: 'ShareAlt',
      featureKey: 'share',
      permission: Permission.SHARE_BOARD,
      children: [
        {
          key: 'share-board',
          label: '推荐分享看板',
          path: '/share/board',
          permission: Permission.SHARE_BOARD,
          featureKey: 'share',
        },
        {
          key: 'share-code',
          label: '二维码生成',
          path: '/share/code',
          permission: Permission.SHARE_CODE,
          featureKey: 'share',
        },
        {
          key: 'share-track',
          label: '推荐追踪',
          path: '/share/track',
          permission: Permission.SHARE_TRACK,
          featureKey: 'share',
        },
      ],
    },
    {
      key: 'my',
      label: '转介绍',
      icon: 'Gift',
      permission: Permission.MY_REFERRAL,
      children: [
        {
          key: 'my-referral',
          label: '我的推荐',
          path: '/my/referral',
          permission: Permission.MY_REFERRAL,
        },
      ],
    },
    {
      key: 'ecommerce',
      label: '电商运营',
      icon: 'ShoppingCart',
      featureKey: 'ecommerce',
      permission: Permission.ECOMMERCE,
    },
    {
      key: 'crm',
      label: 'CRM',
      icon: 'Team',
      featureKey: 'crm',
      permission: Permission.CRM,
    },
    {
      key: 'marketing',
      label: '营销工具',
      icon: 'Megaphone',
      featureKey: 'marketing',
      permission: Permission.MARKETING,
    },
    {
      key: 'account',
      label: '账号与配置',
      icon: 'Setting',
      children: [
        {
          key: 'account-info',
          label: '账号信息',
          path: '/account',
          permission: Permission.ACCOUNT_INFO,
        },
        {
          key: 'account-api',
          label: 'API密钥',
          path: '/account/api',
          permission: Permission.ACCOUNT_API,
        },
        {
          key: 'account-knowledge',
          label: '知识库',
          path: '/account/knowledge',
          permission: Permission.ACCOUNT_KNOWLEDGE,
        },
        {
          key: 'account-log',
          label: '操作日志',
          path: '/account/log',
          permission: Permission.ACCOUNT_LOG,
        },
        {
          key: 'account-recharge',
          label: '充值中心',
          path: '/account/recharge',
          permission: Permission.ACCOUNT_RECHARGE,
        },
        {
          key: 'account-staff',
          label: '员工管理',
          path: '/account/staff',
          permission: Permission.ACCOUNT_STAFF,
        },
        {
          key: 'account-subscribe',
          label: '订阅套餐',
          path: '/account/subscribe',
          permission: Permission.ACCOUNT_SUBSCRIBE,
        },
      ],
    },
  ];
}

/**
 * Admin后台菜单
 */
export function getAdminMenus(): MenuItem[] {
  return [
    {
      key: 'admin-analytics',
      label: '数据大盘',
      icon: 'Dashboard',
      path: '/admin/analytics',
      permission: Permission.ADMIN_ANALYTICS,
    },
    {
      key: 'admin-tenants',
      label: '租户管理',
      icon: 'Bank',
      path: '/admin/tenants',
      permission: Permission.ADMIN_TENANTS,
    },
    {
      key: 'admin-agents',
      label: '代理商管理',
      icon: 'Contacts',
      path: '/admin/agents',
      permission: Permission.ADMIN_AGENTS,
    },
    {
      key: 'admin-config',
      label: '功能开关',
      icon: 'Control',
      path: '/admin/config',
      permission: Permission.ADMIN_CONFIG,
    },
    {
      key: 'admin-branding',
      label: '贴牌配置',
      icon: 'Skin',
      path: '/admin/branding',
      permission: Permission.ADMIN_BRANDING,
    },
    {
      key: 'system',
      label: '系统配置',
      icon: 'Setting',
      children: [
        {
          key: 'system-settings',
          label: '系统设置',
          path: '/system/settings',
          permission: Permission.SYSTEM_SETTINGS,
        },
        {
          key: 'system-users',
          label: '用户管理',
          path: '/system/users',
          permission: Permission.SYSTEM_USERS,
        },
      ],
    },
  ];
}

/**
 * Agent后台菜单
 */
export function getAgentMenus(): MenuItem[] {
  return [
    {
      key: 'agent-analytics',
      label: '数据大盘',
      icon: 'Dashboard',
      path: '/agent/analytics',
      permission: Permission.AGENT_ANALYTICS,
    },
    {
      key: 'agent-tenants',
      label: '客户管理',
      icon: 'Team',
      path: '/agent/tenants',
      permission: Permission.AGENT_TENANTS,
    },
    {
      key: 'agent-referrals',
      label: '推荐数据',
      icon: 'ShareAlt',
      path: '/agent/referrals',
      permission: Permission.AGENT_REFERRALS,
    },
    {
      key: 'agent-usage',
      label: '使用报表',
      icon: 'BarChart',
      path: '/agent/usage',
      permission: Permission.AGENT_USAGE,
    },
    {
      key: 'agent-tickets',
      label: '工单处理',
      icon: 'FileText',
      path: '/agent/tickets',
      permission: Permission.AGENT_TICKETS,
    },
    {
      key: 'account',
      label: '账号与配置',
      icon: 'Setting',
      children: [
        {
          key: 'account-info',
          label: '账号信息',
          path: '/account',
          permission: Permission.ACCOUNT_INFO,
        },
        {
          key: 'account-recharge',
          label: '充值中心',
          path: '/account/recharge',
          permission: Permission.ACCOUNT_RECHARGE,
        },
      ],
    },
  ];
}
