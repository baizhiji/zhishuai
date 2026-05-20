'use client'

import { useState } from 'react'
import { Card, Form, Input, Button, Upload, message, Typography, Row, Col, Avatar, Divider, Space, Tabs } from 'antd'
import { UploadOutlined, SaveOutlined, UserOutlined, ShopOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, BankOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Title, Text } = Typography

export default function CompanySettingsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('https://api.dicebear.com/7.x/miniavs/svg?seed=company')

  // 模拟数据
  const companyInfo = {
    companyName: '智枢科技有限公司',
    logo: logoUrl,
    description: '智枢AI是一家专注于人工智能内容创作的科技公司，致力于为企业提供智能化营销解决方案。',
    industry: '互联网/人工智能',
    scale: '50-100人',
    address: '北京市海淀区中关村软件园二期',
    phone: '010-88888888',
    email: 'contact@zhishuai.com',
    website: 'www.zhishuai.com',
    taxNumber: '91110108MA01XXXXX',
    bank: '中国工商银行北京分行',
    bankAccount: '6222***********1234',
  }

  const [contactInfo, setContactInfo] = useState({
    contactName: '张三',
    contactPhone: '138****8000',
    contactEmail: 'zhangsan@zhishuai.com',
    wechat: 'zhishuai_ai',
    qq: '1234567890',
  })

  const handleLogoUpload: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      message.success('Logo上传成功')
      setLogoUrl('https://api.dicebear.com/7.x/miniavs/svg?seed=newlogo')
    }
  }

  const handleSave = (type: string) => {
    setLoading(true)
    setTimeout(() => {
      message.success(`${type}保存成功`)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">企业信息</Title>

      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Card>
                <Row gutter={24}>
                  <Col span={6}>
                    <div className="text-center">
                      <Avatar size={120} src={logoUrl} icon={<ShopOutlined />} />
                      <div className="mt-4">
                        <Upload onChange={handleLogoUpload} showUploadList={false}>
                          <Button icon={<UploadOutlined />}>更换Logo</Button>
                        </Upload>
                      </div>
                      <Text type="secondary" className="block mt-2">建议尺寸：200x200</Text>
                    </div>
                  </Col>
                  <Col span={18}>
                    <Form 
                      form={form} 
                      layout="vertical" 
                      initialValues={companyInfo}
                      className="ml-8"
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="企业名称" name="companyName" rules={[{ required: true, message: '请输入企业名称' }]}>
                            <Input prefix={<ShopOutlined />} placeholder="请输入企业名称" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="所属行业" name="industry">
                            <Input placeholder="请输入所属行业" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="企业规模" name="scale">
                            <Input placeholder="如：50-100人" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
                            <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="电子邮箱" name="email" rules={[{ type: 'email', message: '请输入正确的邮箱' }]}>
                            <Input prefix={<MailOutlined />} placeholder="请输入电子邮箱" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="官方网站" name="website">
                            <Input placeholder="www.example.com" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item label="公司简介" name="description">
                        <Input.TextArea rows={4} placeholder="请输入公司简介" showCount maxLength={500} />
                      </Form.Item>
                      <Form.Item label="公司地址" name="address">
                        <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
                      </Form.Item>
                      <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('基本信息')}>
                        保存
                      </Button>
                    </Form>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'finance',
            label: '财务信息',
            children: (
              <Card>
                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="统一社会信用代码" name="taxNumber">
                        <Input prefix={<BankOutlined />} placeholder="请输入统一社会信用代码" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="开户银行" name="bank">
                        <Input placeholder="请输入开户银行" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="银行账号" name="bankAccount">
                    <Input placeholder="请输入银行账号" />
                  </Form.Item>
                  <Divider />
                  <Text type="secondary">财务信息仅用于发票开具，请确保信息准确</Text>
                  <div className="mt-4">
                    <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('财务信息')}>
                      保存
                    </Button>
                  </div>
                </Form>
              </Card>
            ),
          },
          {
            key: 'contact',
            label: '联系人信息',
            children: (
              <Card>
                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="联系人姓名">
                        <Input prefix={<UserOutlined />} placeholder="请输入联系人姓名" defaultValue={contactInfo.contactName} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="联系电话">
                        <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" defaultValue={contactInfo.contactPhone} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="电子邮箱">
                        <Input prefix={<MailOutlined />} placeholder="请输入电子邮箱" defaultValue={contactInfo.contactEmail} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="微信号">
                        <Input placeholder="请输入微信号" defaultValue={contactInfo.wechat} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="QQ号码">
                    <Input placeholder="请输入QQ号码" defaultValue={contactInfo.qq} />
                  </Form.Item>
                  <Divider />
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('联系人信息')}>
                      保存
                    </Button>
                  </Space>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}
