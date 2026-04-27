'use client'

import { Card, Typography, Button, Space, Table, Tag, Form, Input, Switch } from 'antd'
import { RobotOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function AutoReplyPage() {
  return (
    <div className="p-6">
      <Title level={2} className="mb-2">自动回复</Title>
      <Text type="secondary" className="mb-6 block">AI自动回复求职者消息</Text>

      <Card title="自动回复配置">
        <Form layout="vertical">
          <Form.Item label="启用自动回复" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="欢迎语" name="welcomeMessage">
            <Input.TextArea rows={3} placeholder="输入欢迎语..." />
          </Form.Item>
          <Form.Item label="面试邀请模板" name="interviewTemplate">
            <Input.TextArea rows={3} placeholder="输入面试邀请模板..." />
          </Form.Item>
          <Form.Item label="拒绝回复模板" name="rejectTemplate">
            <Input.TextArea rows={3} placeholder="输入拒绝回复模板..." />
          </Form.Item>
          <Button type="primary">保存配置</Button>
        </Form>
      </Card>
    </div>
  )
}
