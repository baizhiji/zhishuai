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
  Descriptions,
  Statistic,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  KeyOutlined,
  ReloadOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface ApiKey {
  id: number;
  name: string;
  apiKey: string;
  secretKey: string;
  provider: string;
  status: 'active' | 'disabled';
  usage: number;
  limit: number;
  createdAt: string;
  lastUsedAt: string;
}

interface ApiUsage {
  date: string;
  calls: number;
  tokens: number;
  cost: number;
}

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<ApiUsage[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const keysRes = await request.get('/api/user/api-keys');
      const usageRes = await request.get('/api/statistics/api-usage');

      // Mock 数据
      const mockKeys: ApiKey[] = [
        {
          id: 1,
          name: '生产环境 Key',
          apiKey: 'sk-live-a1b2c3d4e5f6g7h8i9j0',
          secretKey: 'sk-live-secret-x1y2z3w4v5u6t7s8r9q0',
          provider: 'coze',
          status: 'active',
          usage: 15680,
          limit: 100000,
          createdAt: '2024-01-01 10:00:00',
          lastUsedAt: '2024-01-15 14:30:00',
        },
        {
          id: 2,
          name: '测试环境 Key',
          apiKey: 'sk-test-m1n2o3p4q5r6s7t8u9v0',
          secretKey: 'sk-test-secret-a1b2c3d4e5f6',
          provider: 'coze',
          status: 'active',
          usage: 3200,
          limit: 10000,
          createdAt: '2024-01-10 15:30:00',
          lastUsedAt: '2024-01-15 12:00:00',
        },
      ];

      const mockUsage: ApiUsage[] = [
        { date: '周一', calls: 1200, tokens: 45000, cost: 12.5 },
        { date: '周二', calls: 1500, tokens: 52000, cost: 15.8 },
        { date: '周三', calls: 1800, tokens: 61000, cost: 18.2 },
        { date: '周四', calls: 1400, tokens: 48000, cost: 14.6 },
        { date: '周五', calls: 2200, tokens: 78000, cost: 22.4 },
        { date: '周六', calls: 2500, tokens: 89000, cost: 25.8 },
        { date: '周日', calls: 2100, tokens: 72000, cost: 21.2 },
      ];

      setApiKeys(mockKeys);
      setUsage(mockUsage);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleCreate = async (values: any) => {
    try {
      // await request.post('/api/user/api-keys', values);
      message.success('API Key 创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // await request.delete(`/api/user/api-keys/${id}`);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      message.success('已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      // await request.put(`/api/user/api-keys/${id}`, { status: newStatus });
      setApiKeys(apiKeys.map(k =>
        k.id === id ? { ...k, status: newStatus as 'active' | 'disabled' } : k
      ));
      message.success(`已${newStatus === 'active' ? '启用' : '禁用'}`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const toggleVisible = (id: number) => {
    const newSet = new Set(visibleKeys);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisibleKeys(newSet);
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + '****' + key.slice(-4);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (key: string, record: ApiKey) => (
        <Space>
          <Text code>{visibleKeys.has(record.id) ? key : maskKey(key)}</Text>
          <Button
            type="text"
            size="small"
            icon={visibleKeys.has(record.id) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleVisible(record.id)}
          />
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(key)}
          />
        </Space>
      ),
    },
    {
      title: '服务商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color={provider === 'coze' ? 'blue' : 'green'}>
          {provider.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '使用量',
      key: 'usage',
      render: (_: any, record: ApiKey) => (
        <span>
          {record.usage.toLocaleString()} / {record.limit.toLocaleString()}
        </span>
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ApiKey) => (
        <Space>
          <Button
            type="text"
            size="small"
            onClick={() => handleToggleStatus(record.id, record.status)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除此 API Key？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalCalls = usage.reduce((sum, u) => sum + u.calls, 0);
  const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>API Key 管理</Title>
          <Text type="secondary">管理您的 AI API 密钥</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          创建 API Key
        </Button>
      </div>

      {/* Usage Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="本周调用次数"
              value={totalCalls}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="本周消费"
              value={totalCost}
              precision={2}
              prefix="¥"
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="可用 Key 数量"
              value={apiKeys.filter(k => k.status === 'active').length}
              suffix={`/ ${apiKeys.length}`}
            />
          </Card>
        </Col>
      </Row>

      {/* API Keys Table */}
      <Card title="API Keys" style={{ marginBottom: 24 }}>
        <Alert
          message="安全提示"
          description="请妥善保管您的 API Key，不要泄露给他人。建议定期更换密钥。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={apiKeys}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Usage Details */}
      <Card title="调用明细">
        <Table
          dataSource={usage}
          rowKey="date"
          loading={loading}
          pagination={false}
          columns={[
            { title: '日期', dataIndex: 'date', key: 'date' },
            { title: '调用次数', dataIndex: 'calls', key: 'calls', sorter: (a, b) => a.calls - b.calls },
            { title: 'Tokens', dataIndex: 'tokens', key: 'tokens', render: (v) => v.toLocaleString() },
            { title: '费用 (¥)', dataIndex: 'cost', key: 'cost', render: (v) => `¥${v.toFixed(2)}` },
          ]}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="创建 API Key"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入 Key 名称，如：生产环境 Key" />
          </Form.Item>
          <Form.Item
            label="服务商"
            name="provider"
            rules={[{ required: true, message: '请选择服务商' }]}
          >
            <Select
              placeholder="请选择服务商"
              options={[
                { label: 'Coze', value: 'coze' },
                { label: 'OpenAI', value: 'openai' },
                { label: 'Claude', value: 'claude' },
              ]}
            />
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
                创建
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
