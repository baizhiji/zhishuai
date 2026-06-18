'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Divider, Space, Image } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import request from '@/lib/request';

export default function LoginPageSimple() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');

  // 密码登录
  const handlePasswordLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      const res = await request.post('/auth/login', {
        phone: values.phone,
        password: values.password,
      }) as any;

      if (res.data?.token && res.data?.user) {
        login(res.data.token, {
          ...res.data.user,
          status: 'active' as const,
        });
        const targetRole = res.data.user.targetRole || res.data.user.role;
        if (typeof window !== 'undefined') {
          localStorage.setItem('viewing_role', targetRole);
        }
        message.success('登录成功！');
        const homeMap: Record<string, string> = {
          admin: '/admin/tenants',
          agent: '/agent/tenants',
          user: '/customer/dashboard',
        };
        setTimeout(() => {
          router.push(homeMap[targetRole] || '/customer/dashboard');
        }, 500);
      } else {
        throw new Error('登录响应格式错误');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async (values: { phone: string; code: string }) => {
    setLoading(true);
    try {
      const res = await request.post('/auth/login-by-code', {
        phone: values.phone,
        code: values.code,
      }) as any;

      if (res.data?.token && res.data?.user) {
        login(res.data.token, {
          ...res.data.user,
          status: 'active' as const,
        });
        const targetRole = res.data.user.targetRole || res.data.user.role;
        if (typeof window !== 'undefined') {
          localStorage.setItem('viewing_role', targetRole);
        }
        message.success('登录成功！');
        const homeMap: Record<string, string> = {
          admin: '/admin/tenants',
          agent: '/agent/tenants',
          user: '/customer/dashboard',
        };
        setTimeout(() => {
          router.push(homeMap[targetRole] || '/customer/dashboard');
        }, 500);
      } else {
        throw new Error('登录响应格式错误');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error?.message || '登录失败，请检查验证码');
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
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              margin: '0 auto 16px',
            }}
          >
            <Image src="/logo.png" alt="智枢AI" width={60} height={60} preview={false} style={{ borderRadius: 16 }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>智枢AI</h1>
          <p style={{ color: '#666', marginTop: 8 }}>智能中枢 · AI驱动的一站式SaaS平台</p>
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
                      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                    ]}
                  >
                    <Input prefix={<MobileOutlined />} placeholder="请输入手机号" size="large" />
                  </Form.Item>

                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
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
                      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                    ]}
                  >
                    <Input prefix={<MobileOutlined />} placeholder="请输入手机号" size="large" />
                  </Form.Item>

                  <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input prefix={<SafetyOutlined />} placeholder="请输入验证码" size="large" />
                      <Button size="large" onClick={handleGetCode} style={{ width: 120 }}>
                        获取验证码
                      </Button>
                    </Space.Compact>
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        <Divider plain>
          <span style={{ color: '#999', fontSize: 12 }}>其他登录方式</span>
        </Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button icon={<UserOutlined />} block size="large" disabled>
            微信登录（即将上线）
          </Button>
          <Button icon={<UserOutlined />} block size="large" disabled>
            QQ登录（即将上线）
          </Button>
        </Space>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>还没有账号？</span>
          <Button type="link" onClick={handleRegister}>
            立即注册
          </Button>
        </div>
      </Card>
    </div>
  );
}
