'use client'

import { Card, Form, Input, Button, message, Typography } from 'antd'

const { Title } = Typography

export default function SecuritySettingsPage() {
  const handleSave = () => {
    message.success('保存成功')
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">安全设置</Title>

      <Card title="修改密码" className="mb-6">
        <Form layout="vertical">
          <Form.Item label="原密码" name="oldPassword">
            <Input.Password placeholder="输入原密码" />
          </Form.Item>
          <Form.Item label="新密码" name="newPassword">
            <Input.Password placeholder="输入新密码" />
          </Form.Item>
          <Form.Item label="确认密码" name="confirmPassword">
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
          <Button type="primary" onClick={handleSave}>修改密码</Button>
        </Form>
      </Card>

      <Card title="绑定手机">
        <Form layout="vertical">
          <Form.Item label="手机号" name="phone">
            <Input placeholder="输入手机号" disabled />
          </Form.Item>
          <Button type="primary">更换手机号</Button>
        </Form>
      </Card>
    </div>
  )
}
