'use client'

import { Card, Form, Input, Button, Upload, message, Typography } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Title } = Typography

export default function CompanySettingsPage() {
  const handleUpload: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      message.success('上传成功')
    }
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">公司信息</Title>

      <Card>
        <Form layout="vertical">
          <Form.Item label="公司名称" name="companyName">
            <Input placeholder="输入公司名称" />
          </Form.Item>
          <Form.Item label="公司简介" name="description">
            <Input.TextArea rows={4} placeholder="输入公司简介" />
          </Form.Item>
          <Form.Item label="公司logo" name="logo">
            <Upload onChange={handleUpload}>
              <Button icon={<UploadOutlined />}>上传logo</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="联系电话" name="phone">
            <Input placeholder="输入联系电话" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="输入邮箱" />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input placeholder="输入地址" />
          </Form.Item>
          <Button type="primary">保存</Button>
        </Form>
      </Card>
    </div>
  )
}
