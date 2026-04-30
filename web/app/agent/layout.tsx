'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Dropdown, Avatar, Space, Typography, MenuProps, Modal, Form, Input, message } from 'antd';
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

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try {
        const info = JSON.parse(stored);
        setUserInfo({
          username: info.username || '代理商',
          phone: info.phone || '',
        });
        profileForm.setFieldsValue(info);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
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
      setUserInfo({
        username: values.username || '代理商',
        phone: values.phone || '',
      });
      message.success('个人信息更新成功');
      setProfileModalVisible(false);
    });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => setProfileModalVisible(true),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AgentNavbar />
      <Layout style={{ marginLeft: 220 }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#52c41a' }} icon={<UserOutlined />} />
              <Text strong>{userInfo.username}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          {children}
        </Content>
      </Layout>

      {/* 个人信息 Modal */}
      <Modal
        title="个人信息"
        open={profileModalVisible}
        onOk={handleProfileUpdate}
        onCancel={() => setProfileModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={profileForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号码" rules={[{ required: true, message: '请输入手机号码' }]}>
            <Input placeholder="请输入手机号码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码 Modal */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handlePasswordChange}
        onCancel={() => setPasswordModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次密码输入不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
