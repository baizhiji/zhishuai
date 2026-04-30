'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Tabs, message, Space, Select, Alert, Typography } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  SafetyOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'agent' | 'admin'>('customer');
  const [countdown, setCountdown] = useState(0);

  // 背景动画效果
  useEffect(() => {
    const interval = setInterval(() => {
      // 动画效果由CSS处理
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // 根据角色返回首页路径
  const getHomePath = (role: string) => {
    switch (role) {
      case 'admin': return '/admin/tenants';
      case 'agent': return '/agent/tenants';
      default: return '/dashboard';
    }
  };

  // 角色信息
  const roleInfo = {
    customer: { name: '终端客户', icon: <UserOutlined />, desc: '使用平台全部功能' },
    agent: { name: '区域代理', icon: <TeamOutlined />, desc: '管理区域代理商和终端客户' },
    admin: { name: '管理员', icon: <CrownOutlined />, desc: '系统最高权限管理' },
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(102,126,234,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(118,75,162,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* 左侧品牌介绍 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          color: '#fff',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              fontSize: 32,
            }}>
              <RobotOutlined style={{ color: '#fff' }} />
            </div>
            <Title level={1} style={{ color: '#fff', margin: 0, fontSize: '48px' }}>
              智枢AI
            </Title>
          </div>
          <Text style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)' }}>
            智能内容创作与营销平台
          </Text>
        </div>

        <div style={{ marginBottom: 40 }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 24 }}>
            核心功能
          </Title>
          <Space direction="vertical" size="large" style={{ display: 'flex' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 16,
              }}>
                <ThunderboltOutlined style={{ fontSize: 20, color: '#667eea' }} />
              </div>
              <div>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>AI智能创作</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>一键生成文章、图片、视频内容</Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 16,
              }}>
                <TeamOutlined style={{ fontSize: 20, color: '#764ba2' }} />
              </div>
              <div>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>矩阵运营</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>多平台账号统一管理运营</Text>
              </div>
            </div>
          </Space>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div
        style={{
          width: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: 24,
            border: 'none',
            backdropFilter: 'blur(20px)',
          }}
          styles={{ body: { padding: 40 } }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8 }}>欢迎回来</Title>
            <Text type="secondary">登录您的账户继续使用</Text>
          </div>

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
                        prefix={<MobileOutlined style={{ color: '#667eea' }} />}
                        placeholder="请输入手机号"
                        size="large"
                        style={{ borderRadius: 12 }}
                      />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#667eea' }} />}
                        placeholder="请输入密码"
                        size="large"
                        style={{ borderRadius: 12 }}
                      />
                    </Form.Item>

                    <Form.Item label="选择账号类型" name="role">
                      <Select
                        value={selectedRole}
                        onChange={setSelectedRole}
                        size="large"
                        style={{ borderRadius: 12 }}
                      >
                        <Option value="customer">
                          <Space>{roleInfo.customer.icon} {roleInfo.customer.name}</Space>
                        </Option>
                        <Option value="agent">
                          <Space>{roleInfo.agent.icon} {roleInfo.agent.name}</Space>
                        </Option>
                        <Option value="admin">
                          <Space>{roleInfo.admin.icon} {roleInfo.admin.name}</Space>
                        </Option>
                      </Select>
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        style={{ borderRadius: 12, height: 48, fontSize: 16 }}
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
                        prefix={<MobileOutlined style={{ color: '#667eea' }} />}
                        placeholder="请输入手机号"
                        size="large"
                        style={{ borderRadius: 12 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="code"
                      rules={[{ required: true, message: '请输入验证码' }]}
                    >
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          prefix={<SafetyOutlined style={{ color: '#667eea' }} />}
                          placeholder="请输入验证码"
                          size="large"
                          maxLength={6}
                          style={{ borderRadius: '12px 0 0 12px' }}
                        />
                        <Button
                          size="large"
                          onClick={handleGetCode}
                          style={{ borderRadius: '0 12px 12px 0', width: 120 }}
                          disabled={countdown > 0}
                        >
                          {countdown > 0 ? `${countdown}s` : '获取验证码'}
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
                        style={{ borderRadius: 12, height: 48, fontSize: 16 }}
                      >
                        登 录
                      </Button>
                    </Form.Item>
                  </Form>
                )
              }
            ]}
          />

          <Alert
            message="演示说明"
            description="本系统所有账号由开发者总后台统一开通管理。如需开通账号，请联系管理员。"
            type="info"
            showIcon
            style={{ borderRadius: 12 }}
          />
        </Card>
      </div>
    </div>
  );
}
