'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Modal, Form, Input, message } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  WarningOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  LockOutlined,
  LogoutOutlined,
  BarChartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Sider } = Layout;

const AgentNavbar: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('');
  const [openSubMenu, setOpenSubMenu] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  interface MenuItemDef {
    key: string;
    label: string;
    path?: string;
  }

  const menuItems: MenuItemDef[] = [
    { key: 'dashboard', label: '数据总览', path: '/agent/dashboard' },
    { key: 'customers', label: '客户管理', path: '/agent/customers' },
    { key: 'usage', label: '用量统计', path: '/agent/usage' },
    { key: 'tickets', label: '工单处理', path: '/agent/tickets' },
    { key: 'support', label: '客服中心', path: '/agent/support' },
    { key: 'settlement', label: '分成结算', path: '/agent/settlement' },
  ];

  useEffect(() => {
    const current = menuItems.find(item => item.path && pathname.startsWith(item.path));
    if (current) {
      setSelectedKey(current.key);
    }
  }, [pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'change-password') {
      setPasswordModalOpen(true);
      return;
    }
    if (key === 'logout') {
      handleLogout();
      return;
    }
    const item = menuItems.find(i => i.key === key);
    if (item && item.path) {
      router.push(item.path);
    }
  };

  // 退出登录（带二次确认）
  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      okText: '确认退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await logout();
        message.success('已退出登录');
        router.push('/login');
      },
    });
  }, [logout, router]);

  // 修改密码
  const handleChangePassword = async (values: { oldPassword: string; newPassword: string; confirmPassword?: string }) => {
    setPasswordLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.put('/account/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })) as unknown as { success: boolean; message?: string };
      if (res.success !== false) {
        message.success('密码修改成功');
        setPasswordModalOpen(false);
        passwordForm.resetFields();
      } else {
        message.error(res.message || '密码修改失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 服务端渲染时返回占位符，避免 hydration 不匹配
  if (!mounted) {
    return (
      <Sider
        width={220}
        className="zs-sidebar"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
        }}
      >
        <div style={{ height: 64 }} />
      </Sider>
    );
  }

  return (
    <>
      <Sider
        width={220}
        className="zs-sidebar"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
        }}
      >
        <div className="zs-sidebar-logo">
          <span className="logo-mark">智</span>
          <span>
            <div className="logo-title">智枢 AI</div>
            <div className="logo-sub">代理商后台</div>
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openSubMenu}
          onOpenChange={(keys) => setOpenSubMenu(keys as string[])}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: '数据总览',
            },
            {
              key: 'customers',
              icon: <TeamOutlined />,
              label: '客户管理',
            },
            {
              key: 'usage',
              icon: <BarChartOutlined />,
              label: '用量统计',
            },
            {
              key: 'tickets',
              icon: <WarningOutlined />,
              label: '工单处理',
            },
            {
              key: 'support',
              icon: <CustomerServiceOutlined />,
              label: '客服中心',
            },
            {
              key: 'settlement',
              icon: <DollarOutlined />,
              label: '分成结算',
            },
            {
              key: 'settings',
              icon: <SettingOutlined />,
              label: '系统设置',
              children: [
                {
                  key: 'change-password',
                  icon: <LockOutlined />,
                  label: '修改密码',
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  danger: true,
                },
              ],
            },
          ]}
        />
      </Sider>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="当前密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少 6 位）" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
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
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => {
                setPasswordModalOpen(false);
                passwordForm.resetFields();
              }}
              style={{
                marginRight: 8,
                padding: '6px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: 6,
                background: '#6d28d9',
                color: '#fff',
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
                opacity: passwordLoading ? 0.6 : 1,
              }}
            >
              {passwordLoading ? '提交中...' : '确认修改'}
            </button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AgentNavbar;
