'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Dropdown, Avatar, Space, Typography, MenuProps, Modal, Form, Input, message, Result } from 'antd';
import { UserOutlined, LockOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import AgentNavbar from './layout/Navbar';
import { useRouter } from 'next/navigation';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ username: '代理商', phone: '' });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 权限检查：只有 agent 或 admin（以 agent 视角）才能访问
    const userStr = localStorage.getItem('user');
    const viewingRole = localStorage.getItem('viewing_role');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const currentRole = viewingRole || user.role;
        
        // admin 用户可以 agent 视角访问，agent 用户只能看到 agent 角色
        if (currentRole === 'agent') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
        
        // 获取用户信息
        const stored = localStorage.getItem('userInfo');
        if (stored) {
          const info = JSON.parse(stored);
          setUserInfo({
            username: info.username || '代理商',
            phone: info.phone || '',
          });
          profileForm.setFieldsValue(info);
        }
      } catch (e) {
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(false);
    }
  }, [profileForm]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('viewing_role');
    router.push('/login');
  };

  const handlePasswordChange = () => {
    form.validateFields().then((values) => {
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      form.resetFields();
    });
  };

  const handleProfileUpdate = () => {
    profileForm.validateFields().then((values) => {
      localStorage.setItem('userInfo', JSON.stringify(values));
      message.success('个人信息更新成功');
      setProfileModalVisible(false);
    });
  };

  // 未授权
  if (isAuthorized === false) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="您没有权限访问代理商后台。"
        extra={
          <button onClick={() => router.push('/')}>
            返回首页
          </button>
        }
      />
    );
  }

  // 加载中
  if (isAuthorized === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => setProfileModalVisible(true),
    },
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AgentNavbar />
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space size="large">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#722ed1' }} icon={<UserOutlined />} />
                <Text>{userInfo.username}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          {children}
        </Content>
      </Layout>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        onOk={handlePasswordChange}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* 个人资料弹窗 */}
      <Modal
        title="个人资料"
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        onOk={handleProfileUpdate}
      >
        <Form form={profileForm} layout="vertical">
          <Form.Item name="username" label="用户名">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
