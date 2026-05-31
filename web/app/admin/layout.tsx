'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Dropdown, Avatar, Space, Typography, MenuProps, Modal, Form, Input, message, Result } from 'antd';
import { UserOutlined, LockOutlined, LogoutOutlined } from '@ant-design/icons';
import AdminNavbar from './layout/Navbar';
import { useRouter } from 'next/navigation';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ username: '管理员', phone: '' });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const viewingRole = localStorage.getItem('viewing_role');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const currentRole = viewingRole || user.role;
        
        if (user.role === 'admin' && (currentRole === 'admin' || !viewingRole)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
        
        const stored = localStorage.getItem('userInfo');
        if (stored) {
          const info = JSON.parse(stored);
          setUserInfo({
            username: info.username || '管理员',
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

  if (isAuthorized === false) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="您没有权限访问管理员后台，请使用管理员账号登录或切换到正确的角色。"
        extra={
          <button onClick={() => router.push('/')}>
            返回首页
          </button>
        }
      />
    );
  }

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
      <AdminNavbar />
      <Layout>
        <Header style={{ padding: '0 24px', marginLeft: 220, background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space size="large">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <Text>{userInfo.username}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, marginLeft: 220, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>

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
