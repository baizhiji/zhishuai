'use client';

import { useState } from 'react';
import { absUrl } from '@/utils/env';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Tag,
  Space,
  Alert,
} from 'antd';
import {
  LockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/customer/PageContainer';

const { Title, Text } = Typography;

export default function SecuritySettingsPage() {
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }
      setLoading(true);
      const res = await fetch(absUrl('/api/auth/password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        message.success('密码修改成功，请重新登录');
        passwordForm.resetFields();
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        message.error(json.error || json.message || '密码修改失败');
      }
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown[] }).errorFields) return;
      message.error((err as Error)?.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="安全设置"
      description="修改密码，保护您的账号安全"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '账户设置', href: '/customer/settings' },
        { title: '安全设置' },
      ]}
    >
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* 安全状态 */}
        <Space style={{ marginBottom: 16 }}>
          <Tag icon={<CheckCircleOutlined />} color="success">账号安全</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            上次修改密码时间：登录后即可查看
          </Text>
        </Space>

        <Alert
          type="info"
          showIcon
          message="密码安全提示"
          description="密码长度至少6位，建议使用字母、数字、特殊字符的组合，避免使用生日、手机号等易猜测的信息。"
          style={{ marginBottom: 24, borderRadius: 8 }}
        />

        <Card style={{ borderRadius: 12 }}>
          <Form form={passwordForm} layout="vertical">
            <Form.Item
              label="原密码"
              name="oldPassword"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入原密码"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入新密码（至少6位）"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
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
                prefix={<LockOutlined />}
                placeholder="请再次输入新密码"
                autoComplete="new-password"
              />
            </Form.Item>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              密码长度至少6位，建议使用字母、数字、特殊字符的组合
            </Text>
            <Button type="primary" onClick={handlePasswordChange} loading={loading} block>
              修改密码
            </Button>
          </Form>
        </Card>
      </div>
    </PageContainer>
  );
}
