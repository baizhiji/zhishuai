'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Modal,
  Form,
  Input,
  message,
  Dropdown,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ContactsOutlined,
  ApiOutlined,
  NotificationOutlined,
  SettingOutlined,
  LockOutlined,
  SwapOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Sider } = Layout;

const SIDER_WIDTH = 220;

const AdminNavbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [selectedKey, setSelectedKey] = useState('admin-dashboard');
  const [mounted, setMounted] = useState(false);

  // 修改密码
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 顶部主菜单（5 项）
  interface MenuItemDef {
    key: string;
    label: string;
    path?: string;
  }

  const menuItems: MenuItemDef[] = [
    { key: 'admin-dashboard', label: '数据总览', path: '/admin/dashboard' },
    { key: 'admin-tenants', label: '客户管理', path: '/admin/tenants' },
    { key: 'admin-agents', label: '代理商管理', path: '/admin/agents' },
    { key: 'admin-api-providers', label: 'API 服务商', path: '/admin/api-providers' },
    { key: 'admin-announcement', label: '系统公告', path: '/admin/announcement' },
  ];

  // 同步当前路由高亮
  useEffect(() => {
    const current = menuItems.find(item => item.path && pathname.startsWith(item.path));
    if (current) {
      setSelectedKey(current.key);
    }
  }, [pathname]);

  const handleMenuClick = (key: string) => {
    const item = menuItems.find(i => i.key === key);
    if (item && item.path) {
      router.push(item.path);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: { oldPassword: string; newPassword: string; confirmPassword?: string }) => {
    setPasswordLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.put('/auth/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })) as unknown as { success: boolean; message?: string };
      if (res.success !== false) {
        message.success('密码修改成功，请重新登录');
        setPasswordModalOpen(false);
        passwordForm.resetFields();
        // 修改成功后强制退出
        setTimeout(() => logout(), 800);
      } else {
        message.error(res.message || '密码修改失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    Modal.confirm({
      title: '切换账号',
      content: '切换后需重新登录，当前账号将被登出。是否继续？',
      okText: '继续切换',
      cancelText: '取消',
      onOk: () => {
        logout();
      },
    });
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      okText: '退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        logout();
      },
    });
  };

  // 系统设置二级菜单
  const settingsItems = [
    {
      key: 'change-password',
      label: '修改密码',
      icon: <LockOutlined />,
      onClick: () => setPasswordModalOpen(true),
    },
    {
      key: 'switch-account',
      label: '切换账号',
      icon: <SwapOutlined />,
      onClick: handleSwitchAccount,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <Sider
        width={SIDER_WIDTH}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#001529',
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            letterSpacing: 1,
          }}
        >
          智枢 AI · 总后台
        </div>

        {/* 主菜单 */}
        <div style={{ paddingTop: 8 }}>
          {menuItems.map(item => {
            const isActive = mounted && selectedKey === item.key;
            return (
              <div
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                style={{
                  padding: '10px 24px',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                  background: isActive ? '#1677ff' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  transition: 'background 0.2s',
                }}
              >
                {item.key === 'admin-dashboard' && <DashboardOutlined />}
                {item.key === 'admin-tenants' && <TeamOutlined />}
                {item.key === 'admin-agents' && <ContactsOutlined />}
                {item.key === 'admin-api-providers' && <ApiOutlined />}
                {item.key === 'admin-announcement' && <NotificationOutlined />}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* 底部：系统设置 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 12,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <Dropdown menu={{ items: settingsItems }} placement="topLeft" trigger={['click']}>
            <div
              style={{
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <SettingOutlined />
              <span style={{ flex: 1 }}>系统设置</span>
              <DownOutlined style={{ fontSize: 10 }} />
            </div>
          </Dropdown>
        </div>
      </Sider>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={() => passwordForm.submit()}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        confirmLoading={passwordLoading}
        okText="确认修改"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少 6 位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AdminNavbar;
