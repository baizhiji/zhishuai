import { getAuthToken, getUserInfo } from '@/lib/request';

// 角色类型
export type UserRole = 'admin' | 'agent' | 'customer';

// 权限配置
export const permissions = {
  // 管理员权限
  admin: [
    // 通用权限
    'dashboard:read',

    // 素材库
    'materials:read',
    'materials:create',
    'materials:update',
    'materials:delete',
    'materials:download',

    // 内容工厂
    'content:generate',
    'content:batchGenerate',
    'content:batchEdit',

    // 矩阵管理
    'accounts:read',
    'accounts:create',
    'accounts:update',
    'accounts:delete',
    'accounts:sync',

    // 发布中心
    'publish:read',
    'publish:create',
    'publish:cancel',

    // 招聘助手
    'recruitment:read',
    'recruitment:create',
    'recruitment:update',
    'recruitment:delete',

    // 智能获客
    'acquisition:read',
    'acquisition:create',
    'acquisition:update',
    'acquisition:delete',

    // 推荐分享
    'referral:read',
    'referral:create',

    // 用户中心
    'user:read',
    'user:update',
    'user:changePassword',

    // 账户中心
    'account:read',
    'account:update',

    // 系统设置
    'settings:read',
    'settings:update',
    'settings:users',
    'settings:logs',
    'settings:api',
    'settings:knowledge',
    'settings:staff'
  ],

  // 代理商权限
  agent: [
    // 通用权限
    'dashboard:read',

    // 素材库
    'materials:read',
    'materials:create',
    'materials:download',

    // 内容工厂
    'content:generate',
    'content:batchGenerate',
    'content:batchEdit',

    // 矩阵管理
    'accounts:read',
    'accounts:create',
    'accounts:update',
    'accounts:sync',

    // 发布中心
    'publish:read',
    'publish:create',

    // 招聘助手
    'recruitment:read',
    'recruitment:create',

    // 智能获客
    'acquisition:read',
    'acquisition:create',

    // 推荐分享
    'referral:read',
    'referral:create',

    // 用户中心
    'user:read',
    'user:update',
    'user:changePassword',

    // 账户中心
    'account:read',
    'account:update',

    // 系统设置（部分）
    'settings:read',
    'settings:api',
    'settings:knowledge'
  ],

  // 客户权限
  customer: [
    // 通用权限
    'dashboard:read',

    // 素材库
    'materials:read',
    'materials:download',

    // 内容工厂
    'content:generate',

    // 矩阵管理
    'accounts:read',
    'accounts:sync',

    // 发布中心
    'publish:read',
    'publish:create',

    // 招聘助手
    'recruitment:read',

    // 智能获客
    'acquisition:read',

    // 推荐分享
    'referral:read',
    'referral:create',

    // 用户中心
    'user:read',
    'user:update',
    'user:changePassword',

    // 账户中心
    'account:read',

    // 系统设置（部分）
    'settings:read',
    'settings:knowledge'
  ]
};

// 检查用户是否已登录
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getUserInfo();
  return !!token && !!user;
};

// 检查用户是否有某个权限
export const hasPermission = (permission: string): boolean => {
  const user = getUserInfo();
  if (!user) return false;

  const rolePermissions = permissions[user.role as UserRole] || [];
  return rolePermissions.includes(permission);
};

// 检查用户是否有某些权限（满足任意一个即可）
export const hasAnyPermission = (permissionList: string[]): boolean => {
  return permissionList.some(permission => hasPermission(permission));
};

// 检查用户是否有所有指定的权限
export const hasAllPermissions = (permissionList: string[]): boolean => {
  return permissionList.every(permission => hasPermission(permission));
};

// 检查用户角色
export const hasRole = (role: UserRole): boolean => {
  const user = getUserInfo();
  if (!user) return false;
  return user.role === role;
};

// 检查用户是否有某个或多个角色
export const hasAnyRole = (roles: UserRole[]): boolean => {
  const user = getUserInfo();
  if (!user) return false;
  return roles.includes(user.role as UserRole);
};

// 权限守卫装饰器
export const withPermission = (permission: string) => {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function PermissionGuard(props: P) {
      if (!hasPermission(permission)) {
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              fontSize: 16,
              color: '#666'
            }}
          >
            您没有访问该页面的权限
          </div>
        );
      }
      return <Component {...props} />;
    };
  };
};

// 角色守卫装饰器
export const withRole = (role: UserRole) => {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function RoleGuard(props: P) {
      if (!hasRole(role)) {
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              fontSize: 16,
              color: '#666'
            }}
          >
            您没有访问该页面的权限
          </div>
        );
      }
      return <Component {...props} />;
    };
  };
};
