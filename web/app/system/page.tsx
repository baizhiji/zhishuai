'use client'

import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Breadcrumb, Tabs, Form, Input, Select, Switch, Upload, message } from 'antd'
import { ArrowLeftOutlined, ApiOutlined, BookOutlined, MobileOutlined, SettingOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Title, Text, TextArea } = Typography

export default function SystemPage() {
  const router = useRouter()
  const [apiForm] = Form.useForm()
  const [appForm] = Form.useForm()
  const [kbForm] = Form.useForm()

  const uploadProps: UploadProps = {
    name: 'file',
    beforeUpload: () => false,
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('上传成功')
      }
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item onClick={() => router.push('/dashboard')} className="cursor-pointer">首页</Breadcrumb.Item>
          <Breadcrumb.Item>系统配置</Breadcrumb.Item>
        </Breadcrumb>

        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard')} className="mb-6">
          返回首页
        </Button>

        <div className="mb-8">
          <Title level={2}>系统配置</Title>
          <Text type="secondary">配置API服务商、知识库、APP定制等功能</Text>
        </div>

        <Card>
          <Tabs
            items={[
              {
                key: 'api',
                label: <span><ApiOutlined /> API配置</span>,
                children: (
                  <Form form={apiForm} layout="vertical" onFinish={(v) => { message.success('保存成功') }}>
                    <Form.Item label="API服务商" name="provider" initialValue="qwen">
                      <Select>
                        <Select.Option value="qwen">阿里云百炼</Select.Option>
                        <Select.Option value="volcano">火山引擎</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="API Key" name="apiKey" rules={[{ required: true }]}>
                      <Input.Password placeholder="请输入API Key" />
                    </Form.Item>
                    <Form.Item label="API Secret" name="apiSecret">
                      <Input.Password placeholder="请输入API Secret" />
                    </Form.Item>
                    <Form.Item label="Base URL" name="baseUrl" initialValue="https://dashscope.aliyuncs.com">
                      <Input placeholder="请输入API Base URL" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">保存配置</Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'kb',
                label: <span><BookOutlined /> 知识库管理</span>,
                children: (
                  <Form form={kbForm} layout="vertical">
                    <Form.Item label="上传知识库文件">
                      <Upload.Dragger {...uploadProps}>
                        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                        <p className="ant-upload-hint">支持PDF、TXT、Markdown等格式</p>
                      </Upload.Dragger>
                    </Form.Item>
                    <Form.Item label="添加知识条目" name="knowledge">
                      <TextArea rows={4} placeholder="输入知识条目内容" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">添加知识</Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'app',
                label: <span><MobileOutlined /> APP定制</span>,
                children: (
                  <Form form={appForm} layout="vertical" onFinish={(v) => { message.success('保存成功') }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="APP名称" name="appName" initialValue="智枢AI">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="主题颜色" name="themeColor" initialValue="#1890ff">
                          <Input type="color" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="APP Logo">
                      <Upload {...uploadProps} listType="picture-card">
                        <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>
                      </Upload>
                    </Form.Item>
                    <Form.Item label="主题风格" name="theme" initialValue="light">
                      <Select>
                        <Select.Option value="light">浅色主题</Select.Option>
                        <Select.Option value="dark">深色主题</Select.Option>
                        <Select.Option value="auto">跟随系统</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="功能按键点击方式" name="clickMode" initialValue="click">
                      <Select>
                        <Select.Option value="click">点击进入</Select.Option>
                        <Select.Option value="slide">滑动进入</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">保存配置</Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
