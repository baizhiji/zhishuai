'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  Tabs,
  Divider,
  InputNumber,
  Radio,
  Alert,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  CloudServerOutlined,
  SaveOutlined,
  SyncOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

export default function SettingsPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // API配置
  const handleSaveApiConfig = async (values: any) => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('API配置保存成功！')
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 系统配置
  const handleSaveSystemConfig = async (values: any) => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('系统配置保存成功！')
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 通知配置
  const handleSaveNotificationConfig = async (values: any) => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('通知配置保存成功！')
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 测试连接
  const handleTestConnection = async () => {
    message.loading('测试连接中...', 0)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      message.destroy()
      message.success('连接测试成功！')
    } catch (error) {
      message.destroy()
      message.error('连接测试失败')
    }
  }

  // 导出配置
  const handleExportConfig = () => {
    message.success('配置已导出')
  }

  // 导入配置
  const handleImportConfig = () => {
    message.success('配置已导入')
  }

  // 重置配置
  const handleResetConfig = () => {
    message.info('配置已重置为默认值')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/system')}
          className="mb-6"
        >
          返回系统设置
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>系统配置</Title>
          <Text type="secondary">配置系统参数、API服务、通知等设置</Text>
        </div>

        {/* 警告信息 */}
        <Alert
          message="配置修改注意事项"
          description="修改系统配置后可能需要重启服务才能生效，请谨慎操作。建议在修改前备份当前配置。"
          type="warning"
          showIcon
          className="mb-6"
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 操作按钮 */}
          <Row gutter={[16, 16]}>
            <Col span={24} className="flex justify-end">
              <Space>
                <Button icon={<SyncOutlined />} onClick={handleResetConfig}>
                  重置配置
                </Button>
                <Button icon={<SaveOutlined />} onClick={handleExportConfig}>
                  导出配置
                </Button>
                <Button icon={<SyncOutlined />} onClick={handleImportConfig}>
                  导入配置
                </Button>
              </Space>
            </Col>
          </Row>

          {/* 配置选项卡 */}
          <Card>
            <Tabs
              defaultActiveKey="api"
              items={[
                {
                  key: 'api',
                  label: (
                    <Space>
                      <ApiOutlined />
                      <span>API配置</span>
                    </Space>
                  ),
                  children: (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSaveApiConfig}
                      initialValues={{
                        provider: 'qwen',
                        maxTokens: 2000,
                        temperature: 0.7,
                      }}
                    >
                      <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="API服务商"
                            name="provider"
                            rules={[{ required: true, message: '请选择API服务商' }]}
                          >
                            <Select placeholder="请选择API服务商">
                              <Select.Option value="qwen">阿里云百炼 (Qwen)</Select.Option>
                              <Select.Option value="volcano">火山引擎 (豆包)</Select.Option>
                              <Select.Option value="openai">OpenAI (GPT)</Select.Option>
                              <Select.Option value="claude">Anthropic (Claude)</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="模型版本"
                            name="model"
                            rules={[{ required: true, message: '请选择模型版本' }]}
                          >
                            <Select placeholder="请选择模型版本">
                              <Select.Option value="qwen-turbo">Qwen-Turbo</Select.Option>
                              <Select.Option value="qwen-plus">Qwen-Plus</Select.Option>
                              <Select.Option value="qwen-max">Qwen-Max</Select.Option>
                              <Select.Option value="gpt-4">GPT-4</Select.Option>
                              <Select.Option value="gpt-3.5">GPT-3.5</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="API Key"
                        name="apiKey"
                        rules={[{ required: true, message: '请输入API Key' }]}
                        tooltip="从服务商控制台获取的API密钥"
                      >
                        <Input.Password placeholder="请输入API Key" />
                      </Form.Item>

                      <Form.Item
                        label="API Secret"
                        name="apiSecret"
                        tooltip="API服务的密钥（如需要）"
                      >
                        <Input.Password placeholder="请输入API Secret" />
                      </Form.Item>

                      <Form.Item
                        label="Base URL"
                        name="baseUrl"
                        initialValue="https://dashscope.aliyuncs.com"
                        rules={[{ required: true, message: '请输入Base URL' }]}
                        tooltip="API服务的基础URL"
                      >
                        <Input placeholder="请输入API Base URL" />
                      </Form.Item>

                      <Divider>高级设置</Divider>

                      <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="最大Token数"
                            name="maxTokens"
                            tooltip="单次请求的最大token数量"
                          >
                            <InputNumber
                              min={100}
                              max={4000}
                              step={100}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="温度参数"
                            name="temperature"
                            tooltip="控制生成文本的随机性，值越高越随机"
                          >
                            <InputNumber
                              min={0}
                              max={2}
                              step={0.1}
                              precision={1}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="超时时间（秒）"
                        name="timeout"
                        initialValue={30}
                      >
                        <InputNumber min={10} max={300} style={{ width: '100%' }} />
                      </Form.Item>

                      <Form.Item
                        label="启用缓存"
                        name="enableCache"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Divider />

                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Button
                            icon={<SyncOutlined />}
                            onClick={handleTestConnection}
                            block
                          >
                            测试连接
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                            block
                            icon={<SaveOutlined />}
                          >
                            保存配置
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  ),
                },
                {
                  key: 'system',
                  label: (
                    <Space>
                      <SettingOutlined />
                      <span>系统参数</span>
                    </Space>
                  ),
                  children: (
                    <Form
                      layout="vertical"
                      onFinish={handleSaveSystemConfig}
                      initialValues={{
                        siteName: '智枢AI',
                        language: 'zh-CN',
                        timezone: 'Asia/Shanghai',
                        maxUploadSize: 10,
                        sessionTimeout: 7200,
                      }}
                    >
                      <Form.Item
                        label="系统名称"
                        name="siteName"
                        rules={[{ required: true, message: '请输入系统名称' }]}
                      >
                        <Input placeholder="请输入系统名称" />
                      </Form.Item>

                      <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="系统语言"
                            name="language"
                            rules={[{ required: true, message: '请选择系统语言' }]}
                          >
                            <Select>
                              <Select.Option value="zh-CN">简体中文</Select.Option>
                              <Select.Option value="zh-TW">繁体中文</Select.Option>
                              <Select.Option value="en-US">English</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="时区"
                            name="timezone"
                            rules={[{ required: true, message: '请选择时区' }]}
                          >
                            <Select>
                              <Select.Option value="Asia/Shanghai">中国标准时间 (GMT+8)</Select.Option>
                              <Select.Option value="America/New_York">美国东部时间 (GMT-5)</Select.Option>
                              <Select.Option value="Europe/London">格林威治时间 (GMT+0)</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="系统描述"
                        name="siteDescription"
                      >
                        <Input.TextArea rows={3} placeholder="请输入系统描述" />
                      </Form.Item>

                      <Divider>上传设置</Divider>

                      <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="最大上传文件大小 (MB)"
                            name="maxUploadSize"
                          >
                            <InputNumber min={1} max={100} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="允许的文件类型"
                            name="allowedFileTypes"
                          >
                            <Select mode="tags" placeholder="请输入文件类型">
                              <Select.Option value="jpg">JPG</Select.Option>
                              <Select.Option value="png">PNG</Select.Option>
                              <Select.Option value="pdf">PDF</Select.Option>
                              <Select.Option value="doc">DOC</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider>会话设置</Divider>

                      <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="会话超时时间（秒）"
                            name="sessionTimeout"
                          >
                            <InputNumber min={300} max={86400} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label="并发会话数限制"
                            name="maxConcurrentSessions"
                            initialValue={100}
                          >
                            <InputNumber min={10} max={1000} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="启用自动会话清理"
                        name="enableAutoCleanup"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Divider />

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={saving}
                          block
                          icon={<SaveOutlined />}
                        >
                          保存配置
                        </Button>
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'notification',
                  label: (
                    <Space>
                      <BellOutlined />
                      <span>通知设置</span>
                    </Space>
                  ),
                  children: (
                    <Form
                      layout="vertical"
                      onFinish={handleSaveNotificationConfig}
                      initialValues={{
                        emailEnabled: true,
                        smsEnabled: false,
                        webhookEnabled: false,
                      }}
                    >
                      <Form.Item label="邮件通知">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Form.Item
                            name="emailEnabled"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                          </Form.Item>
                          <Row gutter={[16, 16]}>
                            <Col span={12}>
                              <Form.Item
                                label="SMTP服务器"
                                name="smtpHost"
                              >
                                <Input placeholder="smtp.example.com" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="SMTP端口"
                                name="smtpPort"
                                initialValue={587}
                              >
                                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="SMTP用户名"
                                name="smtpUser"
                              >
                                <Input placeholder="user@example.com" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="SMTP密码"
                                name="smtpPassword"
                              >
                                <Input.Password />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Button icon={<SyncOutlined />}>测试邮件</Button>
                        </Space>
                      </Form.Item>

                      <Divider />

                      <Form.Item label="短信通知">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Form.Item
                            name="smsEnabled"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                          </Form.Item>
                          <Row gutter={[16, 16]}>
                            <Col span={12}>
                              <Form.Item
                                label="短信服务商"
                                name="smsProvider"
                              >
                                <Select>
                                  <Select.Option value="aliyun">阿里云</Select.Option>
                                  <Select.Option value="tencent">腾讯云</Select.Option>
                                  <Select.Option value="twilio">Twilio</Select.Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Access Key"
                                name="smsAccessKey"
                              >
                                <Input.Password />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Space>
                      </Form.Item>

                      <Divider />

                      <Form.Item label="Webhook通知">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Form.Item
                            name="webhookEnabled"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                          </Form.Item>
                          <Form.Item
                            label="Webhook URL"
                            name="webhookUrl"
                          >
                            <Input placeholder="https://example.com/webhook" />
                          </Form.Item>
                        </Space>
                      </Form.Item>

                      <Divider />

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={saving}
                          block
                          icon={<SaveOutlined />}
                        >
                          保存配置
                        </Button>
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      </div>
    </div>
  )
}
