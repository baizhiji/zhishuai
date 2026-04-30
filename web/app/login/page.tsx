'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Divider, Space, Select, Alert } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Option } = Select;

export default function LoginPageSimple() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'agent' | 'admin'>('customer');

  // 根据角色返回首页路径
  const getHomePath = (role: string) => {
    switch (role) {
      case 'admin': return '/admin/tenants';
      case 'agent': return '/agent/clients';
      default: return '/dashboard';
    }
  };

  // 密码登录
  const handlePasswordLogin = async (values: any) => {
    setLoading(true);
    try {
      const token = `token_${Date.now()}`;

      // 根据角色构造用户信息
      const roleNames = {
        customer: '终端客户',
        agent: '区域代理',
        admin: '管理员'
      };

      const user = {
        id: selectedRole === 'admin' ? 'admin-001' : selectedRole === 'agent' ? 'agent-001' : '1',
        name: roleNames[selectedRole],
        phone: values.phone,
        role: selectedRole,
        status: 'active' as const
      };

      login(token, user);

      setTimeout(() => {
        router.push(getHomePath(selectedRole));
      }, 500);
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async (values: any) => {
    setLoading(true);
    try {
      const token = `token_${Date.now()}`;

      const roleNames = {
        customer: '终端客户',
        agent: '区域代理',
        admin: '管理员'
      };

      const user = {
        id: selectedRole === 'admin' ? 'admin-001' : selectedRole === 'agent' ? 'agent-001' : '1',
        name: roleNames[selectedRole],
        phone: values.phone,
        role: selectedRole,
        status: 'active' as const
      };

      login(token, user);

      setTimeout(() => {
        router.push(getHomePath(selectedRole));
      }, 500);
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取验证码
  const handleGetCode = async () => {
    message.info('验证码已发送到您的手机');
  };

  // 注册
  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px'
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="智枢AI"
            style={{ width: 60, height: 60, marginBottom: 16 }}
          />
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>智枢AI</h1>
          <p style={{ color: '#666', marginTop: 8 }}>智能内容创作与营销平台</p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'password',
              label: '密码登录',
              children: (
                <Form
                  name="password-login"
                  onFinish={handlePasswordLogin}
                  autoComplete="off"
                  layout="vertical"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                    ]}
                  >
                    <Input
                      prefix={<MobileOutlined />}
                      placeholder="请输入手机号"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item label="选择账号类型" name="role">
                    <Select
                      value={selectedRole}
                      onChange={setSelectedRole}
                      size="large"
                    >
                      <Option value="customer">终端客户</Option>
                      <Option value="agent">区域代理</Option>
                      <Option value="admin">管理员</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'code',
              label: '验证码登录',
              children: (
                <Form
                  name="code-login"
                  onFinish={handleCodeLogin}
                  autoComplete="off"
                  layout="vertical"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                    ]}
                  >
                    <Input
                      prefix={<MobileOutlined />}
                      placeholder="请输入手机号"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        prefix={<SafetyOutlined />}
                        placeholder="请输入验证码"
                        size="large"
                      />
                      <Button
                        size="large"
                        onClick={handleGetCode}
                        style={{ width: 120 }}
                      >
                        获取验证码
                      </Button>
                    </Space.Compact>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />

        {/* 注册提示 - 仅供演示，所有账号由后台开通 */}
        <Alert
          message="演示说明"
          description="本系统所有账号由开发者总后台统一开通管理。如需开通账号，请联系管理员。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
}
