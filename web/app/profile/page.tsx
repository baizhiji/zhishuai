'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, CameraOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { AuthAPI } from '@/services/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        phone: user.phone,
        email: user.email,
        company: (user as any)?.company,
      });
    }
  }, [user]);

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const res = await AuthAPI.updateProfile(values);
      if (res.success) {
        message.success('个人信息更新成功');
        // 更新本地用户信息
      }
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次密码输入不一致');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await AuthAPI.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (res.success) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      }
    } catch (error: any) {
      message.error(error.message || '修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        <Col span={8}>
          <Card title="头像设置">
            <div style={{ textAlign: 'center' }}>
              <Avatar size={120} src={user?.avatar} icon={<UserOutlined />} />
              <div style={{ marginTop: 16 }}>
                <Upload showUploadList={false}>
                  <Button icon={<CameraOutlined />}>更换头像</Button>
                </Upload>
              </div>
              <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
                支持 JPG、PNG 格式<br />
                文件小于 2MB
              </p>
            </div>
          </Card>

          <Card title="账号信息" style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>{user?.name}</p>
              <p style={{ margin: '8px 0 0', color: '#666' }}>{user?.phone}</p>
              <div style={{ marginTop: 8 }}>
                <span style={{ 
                  padding: '4px 12px', 
                  background: user?.role === 'admin' ? '#ff4d4f' : user?.role === 'agent' ? '#1890ff' : '#52c41a',
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  {user?.role === 'admin' ? '管理员' : user?.role === 'agent' ? '代理商' : '用户'}
                </span>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={16}>
          <Card title="基本信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="姓名">
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="手机号">
                    <Input placeholder="请输入手机号" disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="email" label="邮箱">
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="company" label="公司名称">
                    <Input placeholder="请输入公司名称" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="修改密码" style={{ marginTop: 16 }}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                rules={[
                  { required: true, message: '请确认新密码' },
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
                <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={passwordLoading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
