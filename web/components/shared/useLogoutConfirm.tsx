'use client';

import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { clearToken } from '@/lib/request';

export function useLogoutConfirm() {
  const { modal } = App.useApp();
  const router = useRouter();
  const { logout } = useAuth();

  const confirmLogout = () => {
    modal.confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '确定要退出登录吗？',
      okText: '确认退出',
      cancelText: '取消',
      onOk: () => {
        logout();
        clearToken();
        router.push('/login');
      },
    });
  };

  return confirmLogout;
}

export function useRoleSwitch() {
  const { modal } = App.useApp();
  const router = useRouter();
  const { logout } = useAuth();

  const confirmRoleSwitch = () => {
    modal.confirm({
      title: '确认切换账号',
      icon: <ExclamationCircleOutlined />,
      content: '切换账号将清除当前登录状态，确定要继续吗？',
      okText: '确认切换',
      cancelText: '取消',
      onOk: () => {
        logout();
        clearToken();
        router.push('/login');
      },
    });
  };

  return confirmRoleSwitch;
}
