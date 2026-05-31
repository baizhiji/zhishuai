'use client';

import { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  ColorPicker, 
  message, 
  Space,
  Divider,
  Typography,
  Switch
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  BgColorsOutlined,
  AppstoreOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;

interface BrandingConfig {
  appName: string;
  logo?: string;
  favicon?: string;
  themeColor: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeText?: string;
  description?: string;
}

export default function BrandingPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  // 加载配置
  const loadConfig = async () => {
    try {
      // 从URL参数获取用户ID或者使用当前用户
      const response = await fetch('/api/admin/branding/default', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.data) {
        form.setFieldsValue(data.data);
        setLogoUrl(data.data.logo || '');
      }
    } catch (error) {
      message.error('加载配置失败');
    }
  };

  // 保存配置
  const handleSave = async (values: BrandingConfig) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/branding/branding/default', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...values,
          themeColor: values.themeColor || '#1890ff',
          primaryColor: values.primaryColor || '#1890ff',
          secondaryColor: values.secondaryColor || '#52c41a',
        }),
      });
      
      const data = await response.json();
      if (data.data) {
        message.success('保存成功');
        form.setFieldsValue(data.data);
        setLogoUrl(data.data.logo || '');
      } else {
        message.error(data.error || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // Logo上传
  const logoUploadProps: UploadProps = {
    name: 'file',
    action: '/api/media/upload',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        const url = info.file.response?.url || info.file.response?.data?.url;
        if (url) {
          setLogoUrl(url);
          form.setFieldValue('logo', url);
          message.success('Logo上传成功');
        }
      } else if (info.file.status === 'error') {
        message.error('Logo上传失败');
      }
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={4}>
            <AppstoreOutlined /> 贴牌配置
          </Title>
          <Text type="secondary">
            配置APP的名称、LOGO、主题色等品牌信息，支持代理商自定义贴牌
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            appName: '智枢AI',
            themeColor: '#1890ff',
            primaryColor: '#1890ff',
            secondaryColor: '#52c41a',
            welcomeText: '欢迎使用智枢AI',
          }}
        >
          <Divider orientation={"left" as any}>
            <GlobalOutlined /> 基础配置
          </Divider>

          <Form.Item
            label="APP名称"
            name="appName"
            rules={[{ required: true, message: '请输入APP名称' }]}
          >
            <Input placeholder="例如：智枢AI、企业助手" maxLength={20} />
          </Form.Item>

          <Form.Item
            label="欢迎语"
            name="welcomeText"
          >
            <Input placeholder="例如：欢迎使用智枢AI" maxLength={50} />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea 
              placeholder="APP描述信息" 
              rows={3} 
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Divider orientation={"left" as any}>
            <UploadOutlined /> LOGO配置
          </Divider>

          <Form.Item label="APP LOGO" name="logo">
            <Space direction="vertical" size="middle">
              {logoUrl && (
                <div style={{ marginBottom: '8px' }}>
                  <img 
                    src={logoUrl} 
                    alt="Logo预览" 
                    style={{ 
                      maxWidth: '120px', 
                      maxHeight: '120px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '8px',
                      background: '#fff'
                    }} 
                  />
                </div>
              )}
              <Upload {...logoUploadProps}>
                <Button icon={<UploadOutlined />}>上传LOGO</Button>
              </Upload>
              <Text type="secondary">建议尺寸：200x200像素，支持PNG、JPG格式</Text>
            </Space>
          </Form.Item>

          <Form.Item
            label="Favicon"
            name="favicon"
          >
            <Input placeholder="Favicon图标URL" />
          </Form.Item>

          <Divider orientation={"left" as any}>
            <BgColorsOutlined /> 主题配置
          </Divider>

          <Space size="large" wrap>
            <Form.Item label="主题色" name="themeColor" style={{ marginBottom: 0 }}>
              <ColorPicker 
                defaultValue="#1890ff"
                showText
                presets={[
                  {
                    label: '推荐',
                    colors: [
                      '#1890ff', // 科技蓝
                      '#13c2c2', // 青色
                      '#52c41a', // 绿色
                      '#faad14', // 黄色
                      '#f5222d', // 红色
                      '#722ed1', // 紫色
                      '#eb2f96', // 粉色
                      '#fa8c16', // 橙色
                    ],
                  },
                ]}
              />
            </Form.Item>

            <Form.Item label="主色" name="primaryColor" style={{ marginBottom: 0 }}>
              <ColorPicker 
                defaultValue="#1890ff"
                showText
              />
            </Form.Item>

            <Form.Item label="次色" name="secondaryColor" style={{ marginBottom: 0 }}>
              <ColorPicker 
                defaultValue="#52c41a"
                showText
              />
            </Form.Item>
          </Space>

          <Divider />

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存配置
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 预览区域 */}
      <Card 
        title="效果预览" 
        style={{ marginTop: '24px' }}
        extra={<Text type="secondary">实时预览配置效果</Text>}
      >
        <div style={{ 
          padding: '24px', 
          background: form.getFieldValue('themeColor') || '#1890ff',
          borderRadius: '8px',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                style={{ width: '64px', height: '64px', borderRadius: '8px' }} 
              />
            ) : (
              'LOGO'
            )}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            {form.getFieldValue('appName') || '智枢AI'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {form.getFieldValue('welcomeText') || '欢迎使用智枢AI'}
          </div>
        </div>
      </Card>
    </div>
  );
}
