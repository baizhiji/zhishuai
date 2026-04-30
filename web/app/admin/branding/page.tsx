'use client'

import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Form,
  Input,
  Button,
  Upload,
  Select,
  ColorPicker,
  Space,
  Divider,
  message,
  Switch
} from 'antd'
import {
  UploadOutlined,
  SaveOutlined,
  DeleteOutlined,
  MobileOutlined,
  PictureOutlined,
  BgColorsOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Title, Text } = Typography
const { TextArea } = Input

// 贴牌配置类型
interface BrandingConfig {
  appName: string
  appNameEn: string
  logo: string
  favicon: string
  themeColor: string
  description: string
  companyName: string
  companyWebsite: string
  supportPhone: string
  supportEmail: string
}

export default function BrandingConfig() {
  const [form] = Form.useForm()
  const [themeColor, setThemeColor] = useState('#1890ff')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [faviconUrl, setFaviconUrl] = useState<string>('')

  // 上传Logo
  const logoUploadProps: UploadProps = {
    name: 'file',
    action: '#',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string)
        message.success('Logo上传成功')
      }
      reader.readAsDataURL(file)
      return false
    }
  }

  // 上传Favicon
  const faviconUploadProps: UploadProps = {
    name: 'file',
    action: '#',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFaviconUrl(e.target?.result as string)
        message.success('图标上传成功')
      }
      reader.readAsDataURL(file)
      return false
    }
  }

  // 保存
  const handleSave = () => {
    form.validateFields().then(values => {
      console.log('保存配置:', { ...values, themeColor })
      message.success('贴牌配置已保存')
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">贴牌配置</Title>
        <Text type="secondary">
          <Space>
            <MobileOutlined />
            <span>配置全局默认APP名称、LOGO、主题色等贴牌信息</span>
          </Space>
        </Text>
      </div>

      <Row gutter={24}>
        {/* 左侧配置表单 */}
        <Col span={16}>
          <Card title="基础配置" className="mb-4">
            <Form 
              form={form} 
              layout="vertical"
              initialValues={{
                appName: '智枢 AI',
                appNameEn: 'ZhishuAI',
                themeColor: '#1890ff',
                companyName: '上海百智集网络科技有限公司',
                companyWebsite: 'https://www.baizhiji.com',
                supportPhone: '400-888-8888',
                supportEmail: 'support@baizhiji.com',
                description: '全中文，可同时安装在安卓、iOS的SaaS多租户超级APK应用'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    name="appName" 
                    label="APP名称（中文）"
                    rules={[{ required: true, message: '请输入APP名称' }]}
                  >
                    <Input placeholder="如：智枢 AI" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name="appNameEn" 
                    label="APP名称（英文）"
                    rules={[{ required: true, message: '请输入英文名称' }]}
                  >
                    <Input placeholder="如：ZhishuAI" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                name="description" 
                label="APP描述"
              >
                <TextArea rows={3} placeholder="简要描述APP功能" />
              </Form.Item>

              <Divider>公司信息</Divider>

              <Form.Item 
                name="companyName" 
                label="公司名称"
                rules={[{ required: true, message: '请输入公司名称' }]}
              >
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="companyWebsite" label="公司网址">
                    <Input prefix="https://" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="supportPhone" label="客服电话">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="supportEmail" label="客服邮箱">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginTop: 24 }}>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧预览和上传 */}
        <Col span={8}>
          <Card title="Logo上传" className="mb-4">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload {...logoUploadProps}>
                <Button icon={<UploadOutlined />}>上传Logo</Button>
              </Upload>
              {logoUrl && (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={logoUrl} 
                    alt="Logo预览" 
                    style={{ 
                      width: '100%', 
                      maxHeight: 120, 
                      objectFit: 'contain',
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      padding: 8
                    }} 
                  />
                  <Button 
                    type="text" 
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => setLogoUrl('')}
                    style={{ position: 'absolute', top: 0, right: 0 }}
                  />
                </div>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                建议尺寸：200x60px，支持PNG、JPG格式
              </Text>
            </Space>
          </Card>

          <Card title="图标上传" className="mb-4">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload {...faviconUploadProps}>
                <Button icon={<UploadOutlined />}>上传图标</Button>
              </Upload>
              {faviconUrl && (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={faviconUrl} 
                    alt="图标预览" 
                    style={{ 
                      width: 64, 
                      height: 64,
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      padding: 8
                    }} 
                  />
                </div>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                建议尺寸：128x128px，支持PNG格式
              </Text>
            </Space>
          </Card>

          <Card title="主题色配置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <ColorPicker 
                value={themeColor}
                onChange={(color) => setThemeColor(color.toHexString())}
                showText
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                选择APP主题色，将应用到整个系统
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 预览区域 */}
      <Card title="效果预览" className="mt-4">
        <Row gutter={24}>
          <Col span={8}>
            <Card size="small" title="手机端首页">
              <div style={{ 
                background: '#f5f5f5', 
                borderRadius: 8, 
                padding: 16,
                textAlign: 'center'
              }}>
                <img 
                  src={logoUrl || '/logo.png'} 
                  alt="Logo" 
                  style={{ height: 32, marginBottom: 16 }} 
                />
                <div style={{ 
                  background: themeColor, 
                  color: 'white', 
                  padding: 8, 
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  主题色预览
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="底部导航">
              <div style={{ 
                background: '#fff', 
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 8
              }}>
                <div style={{ 
                  background: themeColor, 
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 4,
                  textAlign: 'center',
                  fontSize: 12
                }}>
                  底部Tab栏
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="按钮样式">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" style={{ background: themeColor }}>
                  主按钮
                </Button>
                <Button style={{ borderColor: themeColor, color: themeColor }}>
                  次要按钮
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
