'use client';

/**
 * 权限控制组件
 * 用于根据用户权限控制页面元素显示
 */

import React from 'react';
import { UserRole, Permission, rolePermissions } from '@/lib/permissions/config';

// 重新导出
export { UserRole, Permission } from '@/lib/permissions/config';

/**
 * 检查用户是否拥有指定权限
 */
function checkPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * 检查用户是否拥有任一指定权限
 */
function checkAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => checkPermission(role, p));
}

/**
 * 获取用户的所有权限
 */
function getUserPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

// 获取当前用户信息的hook（简化版，实际项目中应该从context或store获取）
function useCurrentUser() {
  // 模拟用户信息，实际项目中应该从auth context获取
  return {
    role: UserRole.CUSTOMER,
    enabledFeatures: {},
  };
}

// 获取当前用户角色
export function useUserRole(): UserRole {
  const { role } = useCurrentUser();
  return role;
}

// 获取当前用户权限
export function useUserPermissions(): Permission[] {
  const { role } = useCurrentUser();
  return getUserPermissions(role);
}

// 权限检查hook
export function usePermissionCheck() {
  const { role, enabledFeatures } = useCurrentUser();

  return {
    hasPermission: (permission: Permission) => checkPermission(role, permission),
    hasAnyPermission: (permissions: Permission[]) => checkAnyPermission(role, permissions),
    role,
    enabledFeatures,
  };
}

// 权限验证组件props
interface PermissionWrapperProps {
  permission?: Permission;
  permissions?: Permission[];
  mode?: 'all' | 'any'; // mode: all表示需要所有权限，any表示需要任一权限
  fallback?: React.ReactNode; // 无权限时显示的内容
  children: React.ReactNode;
}

/**
 * 权限包装组件
 * 根据权限控制子元素显示
 */
export function PermissionWrapper({
  permission,
  permissions,
  mode = 'any',
  fallback = null,
  children,
}: PermissionWrapperProps) {
  const { hasPermission: checkPermission, hasAnyPermission: checkAnyPermission } = usePermissionCheck();

  let hasAccess = true;

  if (permission) {
    hasAccess = checkPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = mode === 'all'
      ? permissions.every(p => checkPermission(p))
      : checkAnyPermission(permissions);
  }

  return <>{hasAccess ? children : fallback}</>;
}

/**
 * 角色包装组件
 * 根据角色控制子元素显示
 */
interface RoleWrapperProps {
  roles: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleWrapper({ roles, fallback = null, children }: RoleWrapperProps) {
  const { role } = useCurrentUser();
  const hasAccess = roles.includes(role);

  return <>{hasAccess ? children : fallback}</>;
}

/**
 * 权限检查高阶组件
 * 用于保护页面组件
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission?: Permission,
  permissions?: Permission[],
  mode: 'all' | 'any' = 'any'
) {
  return function PermissionGuardComponent(props: P) {
    const { hasPermission: checkPermission, hasAnyPermission: checkAnyPermission } = usePermissionCheck();

    let hasAccess = true;

    if (permission) {
      hasAccess = checkPermission(permission);
    } else if (permissions && permissions.length > 0) {
      hasAccess = mode === 'all'
        ? permissions.every(p => checkPermission(p))
        : checkAnyPermission(permissions);
    }

    if (!hasAccess) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999'
        }}>
          <h2>无权限访问</h2>
          <p>您没有权限访问此页面</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * 权限指令组件
 * 简化版，用于快速权限判断
 */
export function Can({
  permission,
  yes,
  no = null,
}: {
  permission: Permission;
  yes: React.ReactNode;
  no?: React.ReactNode;
}) {
  const { hasPermission: checkPermission } = usePermissionCheck();
  return checkPermission(permission) ? <>{yes}</> : <>{no}</>;
}
