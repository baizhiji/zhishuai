'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Space, Select, Typography } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'agent' | 'admin'>('customer');
  const [countdown, setCountdown] = useState(0);

  // 根据角色返回首页路径
  const getHomePath = (role: string) => {
    switch (role) {
      case 'admin': return '/admin/tenants';
      case 'agent': return '/agent/tenants';
      default: return '/dashboard';
    }
  };

  // 密码登录
  const handlePasswordLogin = async (values: any) => {
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
      message.success('登录成功！');

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
      message.success('登录成功！');

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
    if (countdown > 0) return;
    message.success('验证码已发送到您的手机');
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: '20px',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: 0,
      }}>
        {/* 装饰圆形 */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '40%',
          height: '60%',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '50%',
          height: '70%',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '30%',
          left: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '50%',
        }} />
      </div>

      {/* 登录卡片 */}
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: 'none',
          position: 'relative',
          zIndex: 1,
        }}
        styles={{ body: { padding: '40px 36px' } }}
      >
        {/* Logo和标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 32,
            color: '#fff',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <Title level={2} style={{ marginBottom: 4, color: '#1a1a2e' }}>智枢AI</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>智能内容创作与营销平台</Text>
        </div>

        {/* 登录表单 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          style={{ marginBottom: 24 }}
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
                      prefix={<MobileOutlined style={{ color: '#8c8c8c' }} />}
                      placeholder="手机号"
                      size="large"
                      style={{ borderRadius: 10, height: 48 }}
                    />
                  </Form.Item>

                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                      placeholder="密码"
                      size="large"
                      style={{ borderRadius: 10, height: 48 }}
                    />
                  </Form.Item>

                  <Form.Item label={<Text style={{ fontSize: 13, color: '#666' }}>选择账号类型</Text>} name="role">
                    <Select
                      value={selectedRole}
                      onChange={setSelectedRole}
                      size="large"
                      style={{ borderRadius: 10 }}
                    >
                      <Select.Option value="customer">终端客户</Select.Option>
                      <Select.Option value="agent">区域代理</Select.Option>
                      <Select.Option value="admin">管理员</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      style={{
                        borderRadius: 10,
                        height: 48,
                        fontSize: 16,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      登 录
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
                      prefix={<MobileOutlined style={{ color: '#8c8c8c' }} />}
                      placeholder="手机号"
                      size="large"
                      style={{ borderRadius: 10, height: 48 }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        prefix={<SafetyOutlined style={{ color: '#8c8c8c' }} />}
                        placeholder="验证码"
                        size="large"
                        maxLength={6}
                        style={{ borderRadius: '10px 0 0 10px', height: 48 }}
                      />
                      <Button
                        size="large"
                        onClick={handleGetCode}
                        style={{ borderRadius: '0 10px 10px 0', width: 110, height: 48 }}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </Button>
                    </Space.Compact>
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      style={{
                        borderRadius: 10,
                        height: 48,
                        fontSize: 16,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      登 录
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />

        {/* 底部提示 */}
        <div style={{
          textAlign: 'center',
          paddingTop: 16,
          borderTop: '1px solid #f0f0f0',
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            本系统所有账号由管理员统一开通管理
          </Text>
        </div>
      </Card>
    </div>
  );
}
