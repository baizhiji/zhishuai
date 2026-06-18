'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Alert,
  Tooltip,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloudOutlined,
  CloudServerOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

// 服务商定义
const PROVIDERS = [
  { label: '阿里云百炼', value: 'dashscope' },
  { label: '腾讯云 TokenHub', value: 'tokenhub' },
];

interface ApiKey {
  id: number;
  apiKey: string;
  secretKey: string;
  provider: string;
  status: 'active' | 'disabled';
  usage: number;
  limit: number;
  createdAt: string;
  lastUsedAt: string;
  failCount: number;
  isPrimary: boolean;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 从API加载Key列表
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/ai-config/keys');
      if (res.data) {
        setApiKeys(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      message.error('加载API Key列表失败');
    }
    setLoading(false);
  };

  // 获取主 Key 和备用 Key
  const getPrimaryKey = () => apiKeys.find(k => k.isPrimary && k.status === 'active');
  const getBackupKeys = () => apiKeys.filter(k => !k.isPrimary && k.status === 'active');

  const handleCreate = async (values: any) => {
    try {
      await request.post('/api/ai-config/keys', {
        apiKey: values.apiKey,
        secretKey: values.secretKey,
        provider: values.provider,
      });
      message.success('API Key 创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchApiKeys();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/api/ai-config/keys/${id}`);
      message.success('API Key 已删除');
      fetchApiKeys();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '删除失败');
    }
  };

  const handleToggle = async (id: number) => {
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;
    try {
      // 启用/禁用通过 set-primary/set-secondary 实现
      if (key.status === 'disabled') {
        await request.post(`/api/ai-config/keys/${id}/set-primary`);
        message.success('已启用并设为主 Key');
      } else {
        await request.post(`/api/ai-config/keys/${id}/set-secondary`);
        message.success('已设为备用 Key');
      }
      fetchApiKeys();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await request.post(`/api/ai-config/keys/${id}/set-primary`);
      message.success('已设置为主 Key');
      fetchApiKeys();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '设置失败');
    }
  };

  const columns = [
    {
      title: '服务商',
      dataIndex: 'provider',
      key: 'provider',
      width: 150,
      render: (provider: string, record: ApiKey) => (
        <Space>
          <Tag color={provider === 'dashscope' ? 'blue' : 'green'}>
            {provider === 'dashscope' ? '阿里云百炼' : '腾讯云 TokenHub'}
          </Tag>
          {record.isPrimary && (
            <Tag color="gold" icon={<CheckCircleOutlined />}>
              主
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (text: string) => <Text copyable={{ text }}>{text}</Text>,
    },
    {
      title: 'Secret Key',
      dataIndex: 'secretKey',
      key: 'secretKey',
      render: (text: string) => <Text copyable={{ text }}>{'••••••••'}</Text>,
    },
    {
      title: '用量',
      key: 'usage',
      width: 150,
      render: (_: any, record: ApiKey) => (
        <Text>
          {record.usage.toLocaleString()} / {record.limit.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ApiKey) => (
        <Space>
          {!record.isPrimary && (
            <Button type="link" size="small" onClick={() => handleSetPrimary(record.id)}>
              设为主 Key
            </Button>
          )}
          <Button type="link" size="small" onClick={() => handleToggle(record.id)}>
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确认删除此 API Key？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 计算各服务商使用量
  const dashscopeUsage = apiKeys
    .filter(k => k.provider === 'dashscope' && k.status === 'active')
    .reduce((sum, k) => sum + k.usage, 0);
  const dashscopeLimit = apiKeys
    .filter(k => k.provider === 'dashscope' && k.status === 'active')
    .reduce((sum, k) => sum + k.limit, 0);
  const tokenhubUsage = apiKeys
    .filter(k => k.provider === 'tokenhub' && k.status === 'active')
    .reduce((sum, k) => sum + k.usage, 0);
  const tokenhubLimit = apiKeys
    .filter(k => k.provider === 'tokenhub' && k.status === 'active')
    .reduce((sum, k) => sum + k.limit, 0);

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>API Key 管理</Title>

      {/* 服务商使用量统计：主=腾讯云TokenHub，副=阿里云百炼 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">腾讯云 TokenHub Token 使用量（主）</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>{tokenhubUsage.toLocaleString()}</Text>
                  <Text type="secondary"> / {tokenhubLimit.toLocaleString()}</Text>
                </div>
              </div>
              <CloudOutlined style={{ fontSize: 32, color: '#52c41a' }} />
            </div>
            <Progress
              percent={tokenhubLimit > 0 ? Math.min((tokenhubUsage / tokenhubLimit) * 100, 100) : 0}
              size="small"
              strokeColor="#52c41a"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">阿里云百炼 Token 使用量（副）</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>{dashscopeUsage.toLocaleString()}</Text>
                  <Text type="secondary"> / {dashscopeLimit.toLocaleString()}</Text>
                </div>
              </div>
              <CloudServerOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            </div>
            <Progress
              percent={
                dashscopeLimit > 0 ? Math.min((dashscopeUsage / dashscopeLimit) * 100, 100) : 0
              }
              size="small"
              strokeColor="#1890ff"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div>
                <Text type="secondary">主 Key</Text>
                <div>
                  <Text strong>
                    {getPrimaryKey()?.provider === 'dashscope' ? '阿里云百炼' : '腾讯云 TokenHub'}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyCertificateOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div>
                <Text type="secondary">备用 Key</Text>
                <div>
                  <Text strong>{getBackupKeys().length} 个</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <Text type="secondary">可用状态</Text>
                <div>
                  <Text strong>
                    {apiKeys.filter(k => k.status === 'active').length} / {apiKeys.length}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 说明 */}
      <Alert
        message="API Key 自动切换机制"
        description={
          <div>
            <p>
              <strong>自动识别：</strong>同服务商的第一个 Key 自动设为主 Key，后续添加的为备用 Key。
            </p>
            <p>
              <strong>自动切换：</strong>当主 Key 调用失败时，系统自动切换到同服务商的备用 Key。
            </p>
            <p>
              <strong>跨服务商备用：</strong>如需跨服务商备用，请分别添加两个服务商的主 Key。
            </p>
            <p>
              <strong>自动重试：</strong>调用失败时自动重试，同服务商备用 Key 依次启用。
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        icon={<SafetyCertificateOutlined />}
      />

      {/* Keys Table */}
      <Card title="API Keys">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Alert
            message="安全提示：请妥善保管您的 API Key，不要泄露给他人。"
            type="warning"
            showIcon
            style={{ flex: 1, marginRight: 16 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加 API Key
          </Button>
        </div>
        <Table dataSource={apiKeys} columns={columns} rowKey="id" pagination={false} loading={loading} />
      </Card>

      {/* Create Modal */}
      <Modal
        title="添加 API Key"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="服务商"
            name="provider"
            rules={[{ required: true, message: '请选择服务商' }]}
          >
            <Select placeholder="请选择服务商" options={PROVIDERS} />
          </Form.Item>

          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="请输入 API Key" />
          </Form.Item>

          <Form.Item
            label="Secret Key"
            name="secretKey"
            rules={[{ required: true, message: '请输入 Secret Key' }]}
          >
            <Input.Password placeholder="请输入 Secret Key" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
