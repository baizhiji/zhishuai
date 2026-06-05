'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useRouter } from 'next/navigation';
import CountDownInput from '@/components/ui/count-down-input';
import { UserForgotPassword as ForgotPasswordAPI } from '@/services/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'send' | 'reset'>('send');
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  // 发送验证码
  const handleSendCode = async (values: { phone: string }) => {
    setLoading(true);
    try {
      const res = await ForgotPasswordAPI.sendCode(values.phone);
      if (res.success) {
        message.success(res.message || '验证码已发送');
        setStep('reset');
      }
    } catch (error: any) {
      message.error(error.message || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleReset = async (values: {
    phone: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次密码输入不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await ForgotPasswordAPI.reset(values);
      if (res.success) {
        message.success(res.message || '密码重置成功');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error: any) {
      message.error(error.message || '重置失败');
    } finally {
      setLoading(false);
    }
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
      <Card style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
            {step === 'send' ? '找回密码' : '设置新密码'}
          </h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            {step === 'send' ? '输入注册时的手机号' : '输入新密码'}
          </p>
        </div>

        {step === 'send' ? (
          <Form form={form} onFinish={handleSendCode} layout="vertical">
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input placeholder="请输入手机号" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                发送验证码
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a
                onClick={() => router.push('/login')}
                style={{ color: '#1890ff', cursor: 'pointer' }}
              >
                返回登录
              </a>
            </div>
          </Form>
        ) : (
          <Form form={resetForm} onFinish={handleReset} layout="vertical">
            <Form.Item
              name="phone"
              label="手机号"
              rules={[{ required: true, message: '请输入手机号' }]}
            >
              <Input placeholder="请输入手机号" size="large" disabled />
            </Form.Item>

            <Form.Item
              name="code"
              label="验证码"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <CountDownInput placeholder="请输入验证码" size="large" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" size="large" />
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
              <Input.Password placeholder="请再次输入新密码" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                重置密码
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a onClick={() => setStep('send')} style={{ color: '#1890ff', cursor: 'pointer' }}>
                返回上一步
              </a>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
