'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  message,
  Typography,
  Row,
  Col,
  Avatar,
  Divider,
  Space,
  Tabs,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  SaveOutlined,
  UserOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import request from '@/utils/request';

const { Title, Text } = Typography;

export default function CompanySettingsPage() {
  const [form] = Form.useForm();
  const [financeForm] = Form.useForm();
  const [contactForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    setPageLoading(true);
    try {
      const res = await request.get('/api/company');
      const data = res?.data || res;
      if (data) {
        form.setFieldsValue({
          companyName: data.companyName || '',
          description: data.description || '',
          industry: data.industry || '',
          scale: data.scale || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
        });
        financeForm.setFieldsValue({
          taxNumber: data.taxNumber || '',
          bank: data.bank || '',
          bankAccount: data.bankAccount || '',
        });
        contactForm.setFieldsValue({
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          wechat: data.wechat || '',
          qq: data.qq || '',
        });
        setLogoUrl(data.logo || '');
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error);
    }
    setPageLoading(false);
  };

  const handleLogoUpload: UploadProps['onChange'] = info => {
    if (info.file.status === 'done') {
      message.success('Logo上传成功');
      const url = info.file.response?.data?.url || info.file.response?.url;
      if (url) setLogoUrl(url);
    }
  };

  const handleSave = async (type: string, formInstance: any) => {
    try {
      const values = await formInstance.validateFields();
      setLoading(true);
      await request.post('/api/company', { ...values, logo: logoUrl, type });
      message.success(`${type}保存成功`);
      fetchCompanyInfo();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-6" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        企业信息
      </Title>

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
                      <Text type="secondary" className="block mt-2">
                        建议尺寸：200x200
                      </Text>
                    </div>
                  </Col>
                  <Col span={18}>
                    <Form
                      form={form}
                      layout="vertical"
                      className="ml-8"
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="企业名称"
                            name="companyName"
                            rules={[{ required: true, message: '请输入企业名称' }]}
                          >
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
                          <Form.Item
                            label="联系电话"
                            name="phone"
                            rules={[{ required: true, message: '请输入联系电话' }]}
                          >
                            <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="电子邮箱"
                            name="email"
                            rules={[{ type: 'email', message: '请输入正确的邮箱' }]}
                          >
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
                        <Input.TextArea
                          rows={4}
                          placeholder="请输入公司简介"
                          showCount
                          maxLength={500}
                        />
                      </Form.Item>
                      <Form.Item label="公司地址" name="address">
                        <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
                      </Form.Item>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={loading}
                        onClick={() => handleSave('基本信息', form)}
                      >
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
                <Form form={financeForm} layout="vertical">
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
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={loading}
                      onClick={() => handleSave('财务信息', financeForm)}
                    >
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
                <Form form={contactForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="联系人姓名" name="contactName">
                        <Input prefix={<UserOutlined />} placeholder="请输入联系人姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="联系电话" name="contactPhone">
                        <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="电子邮箱" name="contactEmail">
                        <Input prefix={<MailOutlined />} placeholder="请输入电子邮箱" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="微信号" name="wechat">
                        <Input placeholder="请输入微信号" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="QQ号码" name="qq">
                    <Input placeholder="请输入QQ号码" />
                  </Form.Item>
                  <Divider />
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={loading}
                      onClick={() => handleSave('联系人信息', contactForm)}
                    >
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
  );
}
