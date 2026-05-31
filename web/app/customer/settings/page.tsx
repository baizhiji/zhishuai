'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Space,
  Tabs,
  List,
  Avatar,
  Tag,
  Typography,
  message,
  Divider,
  Modal,
  Select,
  InputNumber,
} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  BellOutlined,
  GlobalOutlined,
  KeyOutlined,
  MoonOutlined,
  SunOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    company: string;
    avatar?: string;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  security: {
    twoFactor: boolean;
    loginAlerts: boolean;
  };
  connectedApps: { id: number; name: string; icon: string; connected: boolean }[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await request.get('/api/account/profile');
      // Mock 数据
      const mockSettings: UserSettings = {
        profile: {
          name: '张三',
          email: 'zhangsan@example.com',
          phone: '138****1234',
          company: '科技有限公司',
        },
        preferences: {
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
        security: {
          twoFactor: false,
          loginAlerts: true,
        },
        connectedApps: [
          { id: 1, name: '钉钉', icon: 'dingtalk', connected: true },
          { id: 2, name: '企业微信', icon: 'wecom', connected: false },
          { id: 3, name: '飞书', icon: 'feishu', connected: true },
        ],
      };
      setSettings(mockSettings);
      form.setFieldsValue(mockSettings.profile);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSaveProfile = async (values: any) => {
    setLoading(true);
    try {
      await request.put('/api/account/profile', values);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    }
    setLoading(false);
  };

  const handlePasswordChange = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次密码输入不一致');
      return;
    }
    try {
      await request.post('/api/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    try {
      await request.put('/api/settings/notifications', {
        [key]: value,
      });
      message.success('设置已更新');
    } catch (error) {
      message.error('设置失败');
    }
  };

  const handleConnectApp = (appId: number, connected: boolean) => {
    Modal.confirm({
      title: connected ? '确认断开连接' : '确认连接',
      content: `确定要${connected ? '断开' : '连接'}此应用吗？`,
      onOk: async () => {
        try {
          // await request.post(`/api/settings/app/${appId}/${connected ? 'disconnect' : 'connect'}`);
          message.success(connected ? '已断开连接' : '连接成功');
          fetchSettings();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          个人资料
        </span>
      ),
      children: (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveProfile}
            initialValues={settings?.profile}
          >
            <Form.Item label="头像" name="avatar">
              <Space direction="vertical">
                <Avatar size={80} icon={<UserOutlined />} />
                <Button size="small">更换头像</Button>
              </Space>
            </Form.Item>
            <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}>
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item label="手机号" name="phone">
              <Input placeholder="请输入手机号" disabled />
            </Form.Item>
            <Form.Item label="公司名称" name="company">
              <Input placeholder="请输入公司名称" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyOutlined />
          安全设置
        </span>
      ),
      children: (
        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>修改密码</Title>
            <Form layout="vertical" onFinish={handlePasswordChange}>
              <Form.Item
                label="当前密码"
                name="oldPassword"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                label="确认密码"
                name="confirmPassword"
                rules={[{ required: true, message: '请确认密码' }]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </div>

          <Divider />

          <div>
            <Title level={5}>安全选项</Title>
            <List itemLayout="horizontal">
              <List.Item
                actions={[
                  <Switch
                    checked={settings?.security.twoFactor}
                    onChange={(checked) => {
                      Modal.confirm({
                        title: '确认开启两步验证',
                        content: '启用后，登录时需要输入手机验证码',
                        onOk: () => handleNotificationChange('twoFactor', checked),
                      });
                    }}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title="两步验证"
                  description="登录时需要输入手机验证码"
                />
              </List.Item>
              <List.Item
                actions={[
                  <Switch
                    checked={settings?.security.loginAlerts}
                    onChange={(checked) => handleNotificationChange('loginAlerts', checked)}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<WarningOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                  title="登录提醒"
                  description="有新设备登录时发送通知"
                />
              </List.Item>
            </List>
          </div>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          通知设置
        </span>
      ),
      children: (
        <Card>
          <Title level={5}>通知方式</Title>
          <List itemLayout="horizontal">
            <List.Item
              actions={[
                <Switch
                  checked={settings?.preferences.notifications.email}
                  onChange={(checked) => handleNotificationChange('email', checked)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<KeyOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title="邮件通知"
                description="接收重要通知邮件"
              />
            </List.Item>
            <List.Item
              actions={[
                <Switch
                  checked={settings?.preferences.notifications.sms}
                  onChange={(checked) => handleNotificationChange('sms', checked)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<KeyOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                title="短信通知"
                description="接收重要通知短信"
              />
            </List.Item>
            <List.Item
              actions={[
                <Switch
                  checked={settings?.preferences.notifications.push}
                  onChange={(checked) => handleNotificationChange('push', checked)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<BellOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
                title="推送通知"
                description="接收系统推送通知"
              />
            </List.Item>
          </List>
        </Card>
      ),
    },
    {
      key: 'preferences',
      label: (
        <span>
          <GlobalOutlined />
          偏好设置
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical" initialValues={settings?.preferences}>
            <Form.Item label="语言" name="language">
              <Select
                options={[
                  { label: '简体中文', value: 'zh-CN' },
                  { label: 'English', value: 'en-US' },
                ]}
              />
            </Form.Item>
            <Form.Item label="时区" name="timezone">
              <Select
                options={[
                  { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
                  { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
                  { label: '纽约时间 (UTC-5)', value: 'America/New_York' },
                ]}
              />
            </Form.Item>
            <Form.Item label="主题" name="theme">
              <Select
                options={[
                  { label: '浅色', value: 'light' },
                  { label: '深色', value: 'dark' },
                  { label: '自动', value: 'auto' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={() => message.success('偏好设置已保存')}>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'apps',
      label: (
        <span>
          <GlobalOutlined />
          第三方应用
        </span>
      ),
      children: (
        <Card>
          <Title level={5}>已连接的应用</Title>
          <List
            dataSource={settings?.connectedApps}
            renderItem={(app) => (
              <List.Item
                actions={[
                  <Button
                    type={app.connected ? 'default' : 'primary'}
                    danger={app.connected}
                    onClick={() => handleConnectApp(app.id, app.connected)}
                  >
                    {app.connected ? '断开' : '连接'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ background: app.connected ? '#52c41a' : '#d9d9d9' }} />}
                  title={app.name}
                  description={app.connected ? '已连接' : '未连接'}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh', maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={3}>账户设置</Title>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabPosition="left"
          style={{ minHeight: 500 }}
        />
      </Card>
    </div>
  );
}
