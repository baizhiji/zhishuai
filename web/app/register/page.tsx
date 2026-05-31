'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import {
  MobileOutlined,
  LockOutlined,
  UserOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiAdapter from '@/services/apiAdapter';
import { setAuthToken, setUserInfo } from '@/lib/request';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 注册
  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const result = await apiAdapter.auth.register(values);

      // 保存token和用户信息
      setAuthToken(result.token);
      setUserInfo(result.user);

      message.success('注册成功');

      // 跳转到首页
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取验证码
  const handleGetCode = async (phone: string) => {
    if (!phone) {
      message.warning('请先输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      message.warning('手机号格式不正确');
      return;
    }

    // 开始倒计时
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    message.info('验证码已发送到您的手机');
  };

  // 返回登录
  const handleBackToLogin = () => {
    router.push('/login');
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
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>注册账号</h1>
          <p style={{ color: '#666', marginTop: 8 }}>创建您的智枢AI账号</p>
        </div>

        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入姓名"
              size="large"
            />
          </Form.Item>

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
                onClick={() => {
                  const phone = (document.querySelector('input[name="phone"]') as HTMLInputElement)?.value;
                  handleGetCode(phone);
                }}
                disabled={countdown > 0}
                style={{ width: 120 }}
              >
                {countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码（至少6位）"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次密码输入不一致'));
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请确认密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>已有账号？</span>
          <Button type="link" onClick={handleBackToLogin}>
            立即登录
          </Button>
        </div>
      </Card>
    </div>
  );
}
