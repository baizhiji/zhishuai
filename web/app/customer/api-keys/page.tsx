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
  Tooltip,
  Switch,
  Divider,
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
  SafetyCertificateOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

// 功能模块定义
const FEATURE_MODULES = [
  { label: '智能沟通（话术生成）', value: 'smart_reply' },
  { label: '数字人（视频生成）', value: 'digital_human' },
  { label: '自媒体矩阵（内容发布）', value: 'social_media' },
  { label: '智能客服（对话）', value: 'customer_service' },
  { label: 'AI 写作助手', value: 'ai_writer' },
  { label: '图片生成', value: 'image_gen' },
  { label: '语音合成', value: 'tts' },
  { label: '语音识别', value: 'asr' },
];

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
  // 新增字段
  features: string[]; // 分配的功能模块
  isBackup: boolean; // 是否为备用 Key
  linkedKeyId?: number; // 关联的主 Key ID
  failCount: number; // 连续失败次数
  autoSwitch: boolean; // 自动切换备用
}

interface ApiUsage {
  date: string;
  calls: number;
  tokens: number;
  cost: number;
}

// 模拟数据
const mockApiKeys: ApiKey[] = [
  {
    id: 1,
    name: '智能沟通-主Key',
    apiKey: 'sk-zhishuai-main-****',
    secretKey: 'main-secret-****',
    provider: 'dashscope',
    status: 'active',
    usage: 12500,
    limit: 50000,
    createdAt: '2025-05-01',
    lastUsedAt: '2025-05-20 10:30',
    features: ['smart_reply', 'customer_service'],
    isBackup: false,
    failCount: 0,
    autoSwitch: true,
  },
  {
    id: 2,
    name: '智能沟通-备用Key',
    apiKey: 'sk-zhishuai-backup-****',
    secretKey: 'backup-secret-****',
    provider: 'tokenhub',
    status: 'active',
    usage: 3200,
    limit: 30000,
    createdAt: '2025-05-01',
    lastUsedAt: '2025-05-20 09:15',
    features: ['smart_reply', 'customer_service'],
    isBackup: true,
    linkedKeyId: 1,
    failCount: 0,
    autoSwitch: true,
  },
  {
    id: 3,
    name: '数字人-主Key',
    apiKey: 'sk-digital-human-****',
    secretKey: 'dh-secret-****',
    provider: 'dashscope',
    status: 'active',
    usage: 8900,
    limit: 20000,
    createdAt: '2025-05-05',
    lastUsedAt: '2025-05-20 11:20',
    features: ['digital_human', 'image_gen'],
    isBackup: false,
    failCount: 0,
    autoSwitch: true,
  },
  {
    id: 4,
    name: '自媒体-主Key',
    apiKey: 'sk-social-media-****',
    secretKey: 'sm-secret-****',
    provider: 'dashscope',
    status: 'active',
    usage: 5600,
    limit: 15000,
    createdAt: '2025-05-10',
    lastUsedAt: '2025-05-20 08:45',
    features: ['social_media', 'ai_writer'],
    isBackup: false,
    failCount: 0,
    autoSwitch: true,
  },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [usage] = useState<ApiUsage[]>([
    { date: '2025-05-20', calls: 1200, tokens: 580000, cost: 12.50 },
    { date: '2025-05-19', calls: 980, tokens: 420000, cost: 9.80 },
    { date: '2025-05-18', calls: 1150, tokens: 510000, cost: 11.20 },
    { date: '2025-05-17', calls: 890, tokens: 380000, cost: 8.50 },
    { date: '2025-05-16', calls: 1320, tokens: 620000, cost: 14.30 },
  ]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = (values: any) => {
    const newKey: ApiKey = {
      id: Date.now(),
      ...values,
      status: 'active',
      usage: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: '-',
      failCount: 0,
      autoSwitch: values.autoSwitch || false,
      features: values.features || [],
    };
    setApiKeys([...apiKeys, newKey]);
    message.success('API Key 创建成功');
    setModalVisible(false);
    form.resetFields();
  };

  const handleDelete = (id: number) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    message.success('API Key 已删除');
  };

  const handleToggle = (id: number) => {
    setApiKeys(apiKeys.map(k => 
      k.id === id ? { ...k, status: k.status === 'active' ? 'disabled' : 'active' } : k
    ));
    message.success('状态已更新');
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ApiKey) => (
        <Space>
          <KeyOutlined />
          <Text strong>{text}</Text>
          {record.isBackup && <Tag color="orange">备用</Tag>}
        </Space>
      ),
    },
    {
      title: '服务商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color={provider === 'dashscope' ? 'blue' : 'green'}>
          {provider === 'dashscope' ? '阿里云百炼' : '腾讯云 TokenHub'}
        </Tag>
      ),
    },
    {
      title: '分配功能',
      dataIndex: 'features',
      key: 'features',
      render: (features: string[]) => (
        <Space wrap>
          {features.map(f => {
            const module = FEATURE_MODULES.find(m => m.value === f);
            return <Tag key={f}>{module?.label || f}</Tag>;
          })}
        </Space>
      ),
    },
    {
      title: '用量',
      key: 'usage',
      render: (_: any, record: ApiKey) => (
        <Text>{record.usage.toLocaleString()} / {record.limit.toLocaleString()}</Text>
      ),
    },
    {
      title: '失败次数',
      dataIndex: 'failCount',
      key: 'failCount',
      render: (count: number) => (
        <Text type={count > 3 ? 'danger' : count > 0 ? 'warning' : 'success'}>
          {count === 0 ? '正常' : `${count}次`}
        </Text>
      ),
    },
    {
      title: '自动切换',
      dataIndex: 'autoSwitch',
      key: 'autoSwitch',
      render: (auto: boolean, record: ApiKey) => (
        record.isBackup ? (
          <Tag color="cyan">已启用</Tag>
        ) : (
          <Switch size="small" checked={auto} />
        )
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ApiKey) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleToggle(record.id)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除此 API Key？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>API Key 管理</Title>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="API Keys 总数" 
              value={apiKeys.length} 
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="启用中" 
              value={apiKeys.filter(k => k.status === 'active').length}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="备用 Key" 
              value={apiKeys.filter(k => k.isBackup).length}
              suffix="个"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="本月调用" 
              value={apiKeys.reduce((sum, k) => sum + k.usage, 0)}
              suffix="次"
            />
          </Card>
        </Col>
      </Row>

      {/* 功能说明 */}
      <Alert
        message="API Key 调用机制说明"
        description={
          <div>
            <p><strong>按功能分配：</strong>每个 API Key 可以分配到不同的功能模块（智能沟通、数字人、自媒体等），系统会根据功能自动选择对应的 Key。</p>
            <p><strong>备用 Key：</strong>当主 Key 连续失败超过 3 次时，系统会自动切换到备用 Key，确保服务不中断。</p>
            <p><strong>自动重试：</strong>调用失败时会自动重试 3 次，重试间隔分别为 1s、3s、10s。</p>
            <p><strong>熔断机制：</strong>如果某个 Key 在 1 分钟内失败超过 10 次，将自动禁用 5 分钟进行冷却。</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        icon={<SafetyCertificateOutlined />}
      />

      {/* Keys Table */}
      <Card title="API Keys" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Alert
            message="安全提示：请妥善保管您的 API Key，不要泄露给他人。建议定期更换密钥。"
            type="warning"
            showIcon
            style={{ flex: 1, marginRight: 16 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            创建 API Key
          </Button>
        </div>
        <Table
          dataSource={apiKeys}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 备用 Key 配置说明 */}
      <Card 
        title="备用 Key 配置" 
        extra={<Button icon={<SwapOutlined />}>批量配置</Button>}
      >
        <Alert
          message="如何配置备用 Key？"
          description={
            <div>
              <p>1. 创建主 Key 和备用 Key（可以是不同服务商）</p>
              <p>2. 在主 Key 中选择需要的功能模块</p>
              <p>3. 将备用 Key 的功能模块设置与主 Key 相同</p>
              <p>4. 备用 Key 会自动继承主 Key 的配置，当主 Key 失败时自动切换</p>
            </div>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Descriptions bordered column={2}>
          <Descriptions.Item label="智能沟通">
            主: 阿里云百炼 | 备: 腾讯云 TokenHub
          </Descriptions.Item>
          <Descriptions.Item label="数字人">
            主: 阿里云百炼 | 备: -
          </Descriptions.Item>
          <Descriptions.Item label="自媒体矩阵">
            主: 阿里云百炼 | 备: -
          </Descriptions.Item>
          <Descriptions.Item label="智能客服">
            主: 阿里云百炼 | 备: 腾讯云 TokenHub
          </Descriptions.Item>
        </Descriptions>
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
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入 Key 名称，如：智能沟通-主Key" />
          </Form.Item>
          
          <Form.Item
            label="服务商"
            name="provider"
            rules={[{ required: true, message: '请选择服务商' }]}
          >
            <Select
              placeholder="请选择服务商"
              options={[
                { label: '阿里云百炼', value: 'dashscope' },
                { label: '腾讯云 TokenHub', value: 'tokenhub' },
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

          <Divider>功能分配</Divider>
          
          <Form.Item
            label="分配功能模块"
            name="features"
            tooltip="选择此 Key 负责的功能模块"
          >
            <Select
              mode="multiple"
              placeholder="请选择功能模块（可多选）"
              options={FEATURE_MODULES}
            />
          </Form.Item>

          <Divider>备用配置</Divider>

          <Form.Item
            label="设为备用 Key"
            name="isBackup"
            valuePropName="checked"
            tooltip="备用 Key 会在主 Key 失败时自动启用"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="自动切换"
            name="autoSwitch"
            valuePropName="checked"
            tooltip="启用后，当主 Key 失败时会自动切换到备用 Key"
          >
            <Switch />
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
