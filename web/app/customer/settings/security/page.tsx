'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Tabs,
  List,
  Tag,
  Space,
  Modal,
  Divider,
  Switch,
} from 'antd';
import {
  SafetyOutlined,
  MobileOutlined,
  MailOutlined,
  LockOutlined,
  DesktopOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface Device {
  id: string;
  device: string;
  location: string;
  ip: string;
  time: string;
  current: boolean;
}

interface SecuritySettings {
  loginNotify: boolean;
  riskNotify: boolean;
  deviceManage: boolean;
}

export default function SecuritySettingsPage() {
  const [passwordForm] = Form.useForm();
  const [phoneForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentPhone, setCurrentPhone] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');

  // 登录设备列表 - 从API获取
  const [devices, setDevices] = useState<Device[]>([]);

  // 安全设置状态 - 从API获取
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    loginNotify: true,
    riskNotify: true,
    deviceManage: true,
  });

  // 加载安全设置和设备列表
  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const res = await request.get('/api/account/security-settings');
      if (res.data) {
        setSecuritySettings({
          loginNotify: res.data.loginNotify ?? true,
          riskNotify: res.data.riskNotify ?? true,
          deviceManage: res.data.deviceManage ?? true,
        });
        setDevices(res.data.devices || []);
        setCurrentPhone(res.data.phone || '');
        setCurrentEmail(res.data.email || '');
      }
    } catch (error) {
      // API不可用时显示空状态，不使用mock数据
      console.error('Failed to fetch security settings:', error);
    }
  };

  // 修改密码 - 调用真实API
  const handleChangePassword = () => {
    passwordForm.validateFields().then(async values => {
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      setLoading(true);
      try {
        await request.put('/api/account/password', {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        });
        message.success('密码修改成功');
        passwordForm.resetFields();
      } catch (error: any) {
        message.error(error?.response?.data?.message || '密码修改失败');
      } finally {
        setLoading(false);
      }
    });
  };

  // 发送验证码 - 调用真实SMS API
  const handleSendCode = async (type: 'phone' | 'email') => {
    const formValues = type === 'phone' ? phoneForm.getFieldsValue() : emailForm.getFieldsValue();
    const target = type === 'phone' ? formValues.phone : formValues.email;

    if (!target) {
      message.error(type === 'phone' ? '请先输入新手机号' : '请先输入新邮箱');
      return;
    }

    setSendCodeLoading(true);
    try {
      await request.post('/api/sms/send', {
        phone: type === 'phone' ? target : currentPhone,
        type: type === 'phone' ? 'verify' : 'verify',
      });
      message.success('验证码已发送');
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
    } catch (error: any) {
      message.error(error?.response?.data?.message || '验证码发送失败');
    } finally {
      setSendCodeLoading(false);
    }
  };

  // 更换手机号 - 调用真实API
  const handleChangePhone = () => {
    phoneForm.validateFields().then(async values => {
      setLoading(true);
      try {
        await request.put('/api/account/phone', {
          phone: values.phone,
          code: values.code,
        });
        message.success('手机号更换成功');
        setCurrentPhone(values.phone);
        phoneForm.resetFields();
      } catch (error: any) {
        message.error(error?.response?.data?.message || '手机号更换失败');
      } finally {
        setLoading(false);
      }
    });
  };

  // 更换邮箱 - 调用真实API
  const handleChangeEmail = () => {
    emailForm.validateFields().then(async values => {
      setLoading(true);
      try {
        await request.put('/api/account/email', {
          email: values.email,
          code: values.code,
        });
        message.success('邮箱更换成功');
        setCurrentEmail(values.email);
        emailForm.resetFields();
      } catch (error: any) {
        message.error(error?.response?.data?.message || '邮箱更换失败');
      } finally {
        setLoading(false);
      }
    });
  };

  // 踢出设备 - 调用真实API
  const handleRemoveDevice = (id: string) => {
    Modal.confirm({
      title: '确认操作',
      content: '确定要强制该设备退出登录吗？',
      onOk: async () => {
        try {
          await request.delete(`/api/account/devices/${id}`);
          message.success('设备已退出');
          setDevices(devices.filter(d => d.id !== id));
        } catch (error: any) {
          message.error(error?.response?.data?.message || '操作失败');
        }
      },
    });
  };

  // 更新安全通知设置 - 调用真实API
  const handleSecuritySettingChange = async (key: keyof SecuritySettings, value: boolean) => {
    try {
      await request.put('/api/account/security-settings', {
        [key]: value,
      });
      setSecuritySettings({ ...securitySettings, [key]: value });
      message.success('设置已更新');
    } catch (error: any) {
      message.error('设置更新失败');
    }
  };

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        安全设置
      </Title>

      <Tabs
        defaultActiveKey="password"
        items={[
          {
            key: 'password',
            label: (
              <span>
                <LockOutlined /> 修改密码
              </span>
            ),
            children: (
              <Card title="修改登录密码">
                <Form form={passwordForm} layout="vertical" className="max-w-md">
                  <Form.Item
                    label="原密码"
                    name="oldPassword"
                    rules={[{ required: true, message: '请输入原密码' }]}
                  >
                    <Input.Password placeholder="请输入原密码" />
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
                    label="确认新密码"
                    name="confirmPassword"
                    rules={[{ required: true, message: '请确认新密码' }]}
                  >
                    <Input.Password placeholder="请再次输入新密码" />
                  </Form.Item>
                  <Text type="secondary" className="block mb-4">
                    密码规则：至少6位，支持字母、数字、特殊字符
                  </Text>
                  <Button type="primary" onClick={handleChangePassword} loading={loading}>
                    修改密码
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'phone',
            label: (
              <span>
                <MobileOutlined /> 手机绑定
              </span>
            ),
            children: (
              <Card title="更换手机号">
                <div className="mb-4">
                  <Text type="secondary">当前绑定的手机号：</Text>
                  <Text strong className="ml-2">
                    {currentPhone || '未绑定'}
                  </Text>
                  {currentPhone && (
                    <Tag color="success" className="ml-2">
                      已验证
                    </Tag>
                  )}
                </div>
                <Divider />
                <Form form={phoneForm} layout="vertical" className="max-w-md">
                  <Form.Item
                    label="新手机号"
                    name="phone"
                    rules={[{ required: true, message: '请输入新手机号' }]}
                  >
                    <Input placeholder="请输入新手机号" maxLength={11} />
                  </Form.Item>
                  <Form.Item
                    label="验证码"
                    name="code"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <Space.Compact>
                      <Input placeholder="请输入验证码" style={{ width: '60%' }} maxLength={6} />
                      <Button
                        onClick={() => handleSendCode('phone')}
                        loading={sendCodeLoading}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                      </Button>
                    </Space.Compact>
                  </Form.Item>
                  <Button type="primary" onClick={handleChangePhone} loading={loading}>
                    更换手机号
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'email',
            label: (
              <span>
                <MailOutlined /> 箱绑定
              </span>
            ),
            children: (
              <Card title="更换邮箱">
                <div className="mb-4">
                  <Text type="secondary">当前绑定的邮箱：</Text>
                  <Text strong className="ml-2">
                    {currentEmail || '未绑定'}
                  </Text>
                  {currentEmail && (
                    <Tag color="success" className="ml-2">
                      已验证
                    </Tag>
                  )}
                </div>
                <Divider />
                <Form form={emailForm} layout="vertical" className="max-w-md">
                  <Form.Item
                    label="新邮箱"
                    name="email"
                    rules={[{ required: true, type: 'email', message: '请输入正确的新邮箱' }]}
                  >
                    <Input placeholder="请输入新邮箱" />
                  </Form.Item>
                  <Form.Item
                    label="验证码"
                    name="code"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <Space.Compact>
                      <Input placeholder="请输入验证码" style={{ width: '60%' }} maxLength={6} />
                      <Button
                        onClick={() => handleSendCode('email')}
                        loading={sendCodeLoading}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                      </Button>
                    </Space.Compact>
                  </Form.Item>
                  <Button type="primary" onClick={handleChangeEmail} loading={loading}>
                    更换邮箱
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'devices',
            label: (
              <span>
                <DesktopOutlined /> 登录设备
              </span>
            ),
            children: (
              <Card
                title="登录设备管理"
                extra={
                  <Switch
                    checked={securitySettings.deviceManage}
                    onChange={v => handleSecuritySettingChange('deviceManage', v)}
                  />
                }
              >
                <Text type="secondary" className="block mb-4">
                  开启后在新设备登录时需要验证，当前已授权 {devices.length} 台设备
                </Text>
                <List
                  dataSource={devices}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        item.current ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>
                            当前设备
                          </Tag>
                        ) : (
                          <Button type="link" danger onClick={() => handleRemoveDevice(item.id)}>
                            踢出
                          </Button>
                        ),
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              backgroundColor: '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <DesktopOutlined style={{ fontSize: 20, color: '#666' }} />
                          </div>
                        }
                        title={item.device}
                        description={
                          <Space>
                            <Text type="secondary">{item.location}</Text>
                            <Text type="secondary">|</Text>
                            <Text type="secondary">IP: {item.ip}</Text>
                            <Text type="secondary">|</Text>
                            <Text type="secondary">{item.time}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
          {
            key: 'notify',
            label: (
              <span>
                <SafetyOutlined /> 安全通知
              </span>
            ),
            children: (
              <Card title="安全通知设置">
                <List>
                  <List.Item
                    extra={
                      <Switch
                        checked={securitySettings.loginNotify}
                        onChange={v => handleSecuritySettingChange('loginNotify', v)}
                      />
                    }
                  >
                    <List.Item.Meta
                      title="登录通知"
                      description="开启后，当账号在新设备登录时，会收到短信通知"
                    />
                  </List.Item>
                  <List.Item
                    extra={
                      <Switch
                        checked={securitySettings.riskNotify}
                        onChange={v => handleSecuritySettingChange('riskNotify', v)}
                      />
                    }
                  >
                    <List.Item.Meta
                      title="风险预警"
                      description="开启后，当检测到异常登录或安全风险时会收到通知"
                    />
                  </List.Item>
                </List>
                <Divider />
                <Card type="inner" size="small">
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <Text type="secondary">建议开启所有安全通知，及时发现账号异常情况</Text>
                  </Space>
                </Card>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
