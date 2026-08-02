'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, message,
  Popconfirm, Space, Typography, Alert, Divider,
} from 'antd';
import {
  PlusOutlined, KeyOutlined, DeleteOutlined,
  CloudServerOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  ReloadOutlined, StarFilled, StarOutlined, CopyOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// localStorage key映射
const LOCAL_STORAGE_KEYS: Record<string, string> = {
  dashscope: 'api_key_alibaba',
  tokenhub: 'api_key_tencent',
};

interface ApiKeyItem {
  id: string;
  provider: string;
  providerName: string;
  apiKey: string;
  secretKey?: string;
  status: string;
  isPrimary: boolean;
  isSecondary: boolean;
  usage: number;
  limit: number;
  failCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

// API调用工具函数
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  // 从后端加载API Key列表
  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-config/keys', { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setKeys(json.data);
      }
    } catch (err: any) {
      console.warn('加载API Key列表失败，从本地缓存恢复:', err.message);
      const localKeys: ApiKeyItem[] = [];
      const alibaba = localStorage.getItem('api_key_alibaba');
      const tencent = localStorage.getItem('api_key_tencent');
      if (alibaba) {
        localKeys.push({
          id: 'local-dashscope',
          provider: 'dashscope',
          providerName: '阿里云百炼 (DashScope)',
          apiKey: alibaba.slice(0, 8) + '****' + alibaba.slice(-4),
          status: 'active',
          isPrimary: true,
          isSecondary: false,
          usage: 0,
          limit: 0,
          failCount: 0,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
        });
      }
      if (tencent) {
        localKeys.push({
          id: 'local-tokenhub',
          provider: 'tokenhub',
          providerName: '腾讯云TokenHub',
          apiKey: tencent.slice(0, 8) + '****' + tencent.slice(-4),
          status: 'active',
          isPrimary: !alibaba,
          isSecondary: !!alibaba,
          usage: 0,
          limit: 0,
          failCount: 0,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
        });
      }
      setKeys(localKeys);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleAdd = async (values: any) => {
    setSubmitting(true);
    try {
      // 1. 先保存到localStorage（前端AI工厂直接使用）
      const provider = values.provider;
      const localStorageKey = LOCAL_STORAGE_KEYS[provider];
      if (localStorageKey) {
        localStorage.setItem(localStorageKey, values.apiKey);
        console.log(`[api-keys] 已保存到 localStorage: ${localStorageKey}`);
      }

      // 2. 保存到后端数据库（后端AI对话使用）
      try {
        const res = await fetch('/api/ai-config/keys', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            provider: values.provider,
            apiKey: values.apiKey,
            secretKey: values.secretKey || values.apiKey,
            isSecondary: values.isSecondary || false,
          }),
        });
        const json = await res.json();
        if (json.success) {
          message.success('API Key 配置成功，AI功能已就绪');
        } else {
          throw new Error(json.error || json.message || '保存失败');
        }
      } catch (backendErr: any) {
        // 后端保存失败但不影响localStorage
        message.warning(`已保存到本地，但服务端同步失败: ${backendErr.message || '未知错误'}`);
      }

      setModalOpen(false);
      form.resetFields();
      loadKeys();
    } catch (error: any) {
      message.error(error.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, provider: string) => {
    try {
      // 同时清除localStorage
      const localStorageKey = LOCAL_STORAGE_KEYS[provider];
      if (localStorageKey) {
        localStorage.removeItem(localStorageKey);
      }

      // 调用后端删除
      try {
        await fetch(`/api/ai-config/keys/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch (e: any) {
        // 忽略后端删除失败
      }

      message.success('已删除');
      loadKeys();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-config/keys/${id}/set-primary`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) message.success('已设置为主Key');
      else throw new Error(json.error || '设置失败');
      loadKeys();
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  const handleSetSecondary = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-config/keys/${id}/set-secondary`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) message.success('已设为备用Key');
      else throw new Error(json.error || '设置失败');
      loadKeys();
    } catch (error: any) {
      message.error(error.message || '设置失败');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => message.success('已复制'));
  };

  const columns = [
    {
      title: '服务商',
      dataIndex: 'providerName',
      key: 'providerName',
      render: (text: string, record: ApiKeyItem) => (
        <Space>
          <CloudServerOutlined />
          <span>{text}</span>
          {record.isPrimary && <Tag color="blue" icon={<StarFilled />}>主Key</Tag>}
          {record.isSecondary && <Tag color="green" icon={<StarOutlined />}>备用Key</Tag>}
        </Space>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (text: string) => (
        <Space>
          <Text code>{text}</Text>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyKey(text)} />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        status === 'active' ? (
          <Tag icon={<CheckCircleOutlined />} color="success">启用</Tag>
        ) : (
          <Tag icon={<ExclamationCircleOutlined />} color="error">禁用</Tag>
        )
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'usage',
      key: 'usage',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: ApiKeyItem) => (
        <Space size="small" wrap>
          {!record.isPrimary && (
            <Button type="link" size="small" onClick={() => handleSetPrimary(record.id)}>
              设为主Key
            </Button>
          )}
          {!record.isSecondary && (
            <Button type="link" size="small" onClick={() => handleSetSecondary(record.id)}>
              设为备用
            </Button>
          )}
          <Popconfirm
            title="确定删除该API Key？"
            description="删除后相关AI功能将无法使用该Key"
            onConfirm={() => handleDelete(record.id, record.provider)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const hasKeys = keys.length > 0;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>API Key 管理</Title>
          <Text type="secondary">配置AI模型API密钥，启用AI相关功能</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadKeys} disabled={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            添加API Key
          </Button>
        </Space>
      </div>

      {showHelp && (
        <Alert
          type="info"
          showIcon
          closable
          onClose={() => setShowHelp(false)}
          style={{ marginBottom: 16 }}
          message="配置说明"
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                配置至少一家服务商的API Key后，以下功能即可使用：
              </Paragraph>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Card size="small" title="阿里云百炼 (DashScope)" type="inner">
                  <Text type="secondary">支持模型：通义千问、DeepSeek R1</Text><br />
                  <Text type="secondary">适用功能：AI对话、诊断分析、文案生成</Text><br />
                  <Text type="secondary">获取地址：dashscope.aliyun.com</Text>
                </Card>
                <Card size="small" title="腾讯云TokenHub" type="inner">
                  <Text type="secondary">支持模型：混元、Kimi、GLM</Text><br />
                  <Text type="secondary">适用功能：AI对话、图片理解、视频分析、语音合成</Text><br />
                  <Text type="secondary">获取地址：console.cloud.tencent.com</Text>
                </Card>
              </div>
            </div>
          }
        />
      )}

      <Table
        columns={columns}
        dataSource={keys}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: '暂无API Key，点击「添加API Key」开始配置' }}
        pagination={false}
      />

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">
          配置完成后，以下功能即可正常使用：
        </Text>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[
            { name: 'AI 对话', status: hasKeys },
            { name: 'AI 创作工厂', status: hasKeys },
            { name: '自媒体/文案生成', status: hasKeys },
            { name: '话术生成', status: hasKeys },
            { name: '数字人·声音克隆', status: hasKeys },
            { name: '自动回复', status: true },
            { name: '内容发布', status: true },
          ].map(f => (
            <Tag key={f.name} color={f.status ? 'success' : 'default'}>
              {f.name} {f.status ? '✓' : '○'}
            </Tag>
          ))}
        </div>
      </div>

      <Modal
        title="添加 API Key"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdd}
          initialValues={{ provider: 'dashscope', isSecondary: false }}
        >
          <Form.Item
            name="provider"
            label="服务商"
            rules={[{ required: true, message: '请选择服务商' }]}
          >
            <Select placeholder="请选择AI服务商">
              <Option value="dashscope">
                <Space>
                  <CloudServerOutlined />
                  阿里云百炼 (DashScope) — 通义千问/DeepSeek
                </Space>
              </Option>
              <Option value="tokenhub">
                <Space>
                  <CloudServerOutlined />
                  腾讯云TokenHub — 混元/Kimi/GLM
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="请输入API Key"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="secretKey"
            label="Secret Key"
            tooltip="部分服务商需要Secret Key，如不需要可留空"
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="请输入Secret Key（选填）"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
