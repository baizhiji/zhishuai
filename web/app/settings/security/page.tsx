'use client'

import { useState } from 'react'
import { Card, Form, Input, Button, message, Typography, Tabs, List, Tag, Space, Modal, Divider, Switch } from 'antd'
import { 
  SafetyOutlined, 
  MobileOutlined, 
  MailOutlined, 
  LockOutlined, 
  DesktopOutlined,
  TabletOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function SecuritySettingsPage() {
  const [passwordForm] = Form.useForm()
  const [phoneForm] = Form.useForm()
  const [emailForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [sendCodeLoading, setSendCodeLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // 模拟登录设备列表
  const [devices] = useState([
    { id: '1', device: 'Chrome浏览器', location: '北京', ip: '110.****.123', time: '2024-04-30 14:30', current: true },
    { id: '2', device: 'Safari浏览器', location: '上海', ip: '120.****.456', time: '2024-04-28 09:15', current: false },
    { id: '3', device: '微信内置', location: '广州', ip: '119.****.789', time: '2024-04-25 18:45', current: false },
  ])

  // 安全设置状态
  const [securitySettings, setSecuritySettings] = useState({
    loginNotify: true,
    riskNotify: true,
    deviceManage: true,
  })

  // 修改密码
  const handleChangePassword = () => {
    passwordForm.validateFields().then(values => {
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致')
        return
      }
      setLoading(true)
      setTimeout(() => {
        message.success('密码修改成功')
        setLoading(false)
        passwordForm.resetFields()
      }, 1000)
    })
  }

  // 发送验证码
  const handleSendCode = (type: 'phone' | 'email') => {
    setSendCodeLoading(true)
    setTimeout(() => {
      message.success('验证码已发送')
      setSendCodeLoading(false)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 1000)
  }

  // 更换手机号
  const handleChangePhone = () => {
    phoneForm.validateFields().then(values => {
      setLoading(true)
      setTimeout(() => {
        message.success('手机号更换成功')
        setLoading(false)
        phoneForm.resetFields()
      }, 1000)
    })
  }

  // 更换邮箱
  const handleChangeEmail = () => {
    emailForm.validateFields().then(values => {
      setLoading(true)
      setTimeout(() => {
        message.success('邮箱更换成功')
        setLoading(false)
        emailForm.resetFields()
      }, 1000)
    })
  }

  // 踢出设备
  const handleRemoveDevice = (id: string) => {
    Modal.confirm({
      title: '确认操作',
      content: '确定要强制该设备退出登录吗？',
      onOk: () => {
        message.success('设备已退出')
      }
    })
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">安全设置</Title>

      <Tabs
        defaultActiveKey="password"
        items={[
          {
            key: 'password',
            label: <span><LockOutlined /> 修改密码</span>,
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
                      { min: 6, message: '密码至少6位' }
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
            label: <span><MobileOutlined /> 手机绑定</span>,
            children: (
              <Card title="更换手机号">
                <div className="mb-4">
                  <Text type="secondary">当前绑定的手机号：</Text>
                  <Text strong className="ml-2">138****8000</Text>
                  <Tag color="success" className="ml-2">已验证</Tag>
                </div>
                <Divider />
                <Form form={phoneForm} layout="vertical" className="max-w-md">
                  <Form.Item label="新手机号" name="phone" rules={[{ required: true, message: '请输入新手机号' }]}>
                    <Input placeholder="请输入新手机号" maxLength={11} />
                  </Form.Item>
                  <Form.Item label="验证码" name="code" rules={[{ required: true, message: '请输入验证码' }]}>
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
            label: <span><MailOutlined /> 邮箱绑定</span>,
            children: (
              <Card title="更换邮箱">
                <div className="mb-4">
                  <Text type="secondary">当前绑定的邮箱：</Text>
                  <Text strong className="ml-2">u***@example.com</Text>
                  <Tag color="success" className="ml-2">已验证</Tag>
                </div>
                <Divider />
                <Form form={emailForm} layout="vertical" className="max-w-md">
                  <Form.Item label="新邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入正确的新邮箱' }]}>
                    <Input placeholder="请输入新邮箱" />
                  </Form.Item>
                  <Form.Item label="验证码" name="code" rules={[{ required: true, message: '请输入验证码' }]}>
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
            label: <span><DesktopOutlined /> 登录设备</span>,
            children: (
              <Card 
                title="登录设备管理"
                extra={<Switch checked={securitySettings.deviceManage} onChange={v => setSecuritySettings({...securitySettings, deviceManage: v})} />}
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
                          <Tag color="success" icon={<CheckCircleOutlined />}>当前设备</Tag>
                        ) : (
                          <Button type="link" danger onClick={() => handleRemoveDevice(item.id)}>
                            踢出
                          </Button>
                        )
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 8, 
                            backgroundColor: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
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
            label: <span><SafetyOutlined /> 安全通知</span>,
            children: (
              <Card title="安全通知设置">
                <List>
                  <List.Item
                    extra={
                      <Switch 
                        checked={securitySettings.loginNotify} 
                        onChange={v => setSecuritySettings({...securitySettings, loginNotify: v})} 
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
                        onChange={v => setSecuritySettings({...securitySettings, riskNotify: v})} 
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
  )
}
