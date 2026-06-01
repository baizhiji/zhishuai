'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import {
  LockOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import request from '@/lib/request';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'agent' | 'admin'>('user');

  // 根据角色返回首页路径
  // 根据登录入口决定跳转页面
  const getHomePath = (role: string) => {
    switch (role) {
      case 'admin': return '/admin/tenants';
      case 'agent': return '/agent/tenants';
      case 'user': return '/customer/dashboard';
      default: return '/customer/dashboard';
    }
  };

  // 密码登录 - 调用真实API
  const handlePasswordLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      // 调用后端登录接口
      const res = await request.post('/auth/login', {
        phone: values.phone,
        password: values.password,
        loginType: selectedRole,
      });

      if (res.data?.token && res.data?.user) {
        // 使用真实token和用户信息登录
        login(res.data.token, {
          ...res.data.user,
          status: 'active' as const
        });
        
        // 保存登录入口角色，用于权限检查
        const targetRole = res.data.user.targetRole || res.data.user.role;
        if (typeof window !== 'undefined') {
          localStorage.setItem('viewing_role', targetRole);
        }
        
        message.success('登录成功！');

        setTimeout(() => {
          router.push(getHomePath(targetRole));
        }, 500);
      } else {
        throw new Error('登录响应格式错误');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      // 错误已由request拦截器处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20,
    }}>
      {/* 装饰圆形 */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        left: '-5%',
        width: '40%',
        height: '60%',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-10%',
        right: '-5%',
        width: '50%',
        height: '70%',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'fixed',
        top: '20%',
        right: '10%',
        width: 200,
        height: 200,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'fixed',
        bottom: '30%',
        left: '15%',
        width: 150,
        height: 150,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '50%',
      }} />

      {/* 登录卡片 */}
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 20,
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
          border: 'none',
        }}
        styles={{ body: { padding: '40px 36px' } }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          }}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="#fff">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4, color: '#1a1a2e' }}>智枢AI</h1>
          <p style={{ color: '#8c8c8c', fontSize: 14, margin: 0 }}>智能内容创作与营销平台</p>
        </div>

        {/* 账号类型选择 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#666' }}>账号类型</label>
          <div style={{
            display: 'flex',
            background: '#f5f5f5',
            borderRadius: 10,
            padding: 4,
          }}>
            {[
              { value: 'user', label: '终端客户' },
              { value: 'agent', label: '区域代理' },
              { value: 'admin', label: '管理员' },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setSelectedRole(item.value as any)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  border: 'none',
                  borderRadius: 8,
                  background: selectedRole === item.value ? '#fff' : 'transparent',
                  color: selectedRole === item.value ? '#667eea' : '#666',
                  fontWeight: selectedRole === item.value ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: selectedRole === item.value ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 登录表单 */}
        <Form
          name="password-login"
          onFinish={handlePasswordLogin}
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
              prefix={<MobileOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />}
              placeholder="请输入手机号"
              size="large"
              style={{ borderRadius: 12, height: 52, fontSize: 15 }}
            />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />}
              placeholder="请输入密码"
              size="large"
              style={{ borderRadius: 12, height: 52, fontSize: 15 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 28, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                borderRadius: 12,
                height: 52,
                fontSize: 16,
                fontWeight: 500,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        {/* 底部提示 */}
        <div style={{
          textAlign: 'center',
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #f0f0f0',
        }}>
          <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
            账号由管理员统一开通管理
          </p>
        </div>
      </Card>
    </div>
  );
}
