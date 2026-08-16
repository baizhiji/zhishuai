'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AdminSecurityPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (values: {
    oldPassword: string;
    newPassword: string;
  }) => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.put('/auth/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })) as unknown as { success: boolean; message?: string };
      if (res.success !== false) {
        message.success('密码修改成功，请重新登录');
        form.resetFields();
        setTimeout(() => window.location.href = '/login', 800);
      } else {
        message.error(res.message || '密码修改失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" style={{ maxWidth: 560, margin: '0 auto' }}>
      <Title level={3}>修改密码</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        定期更换密码可以保护账号安全
      </Text>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            label="当前密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              placeholder="请输入新密码（至少 6 位）"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            密码长度至少 6 位，建议使用字母、数字、特殊字符的组合
          </Text>
          <Button type="primary" htmlType="submit" loading={loading} block>
            修改密码
          </Button>
        </Form>
      </Card>
    </div>
  );
}
