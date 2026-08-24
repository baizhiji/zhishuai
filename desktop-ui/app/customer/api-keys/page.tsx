'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, message,
  Popconfirm, Space, Typography, Alert, Divider, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, KeyOutlined, DeleteOutlined,
  CloudServerOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  ReloadOutlined, StarFilled, StarOutlined, CopyOutlined, ApiOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/customer/PageContainer';

const { Title, Text, Paragraph } = Typography;

const LOCAL_STORAGE_KEYS: Record<string, string> = {
  dashscope: 'api_key_alibaba',
  tokenhub: 'api_key_tencent',
  volcano: 'api_key_volcano',
  ark: 'api_key_volcano', // 后端将火山方舟归一化为 ark 存储，删除时兼容清理本地缓存
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

function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

function maskKey(key: string): string {
  if (key.length <= 12) return key.slice(0, 4) + '****';
  return key.slice(0, 8) + '****' + key.slice(-4);
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [balanceMap, setBalanceMap] = useState<Record<string, { balance: number | null; unit: string; message?: string }>>({});

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-config/keys', { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setKeys(json.data);
      }
    } catch (err: unknown) {
      console.warn('加载API Key列表失败，从本地缓存恢复:', (err as Error).message);
      const localKeys: ApiKeyItem[] = [];
      const alibaba = localStorage.getItem('api_key_alibaba');
      const tencent = localStorage.getItem('api_key_tencent');
      const volcano = localStorage.getItem('api_key_volcano');
      const hasAny = !!(alibaba || tencent || volcano);
      if (alibaba) {
        localKeys.push({
          id: 'local-dashscope', provider: 'dashscope',
          providerName: '阿里云百炼 (DashScope)',
          apiKey: maskKey(alibaba),
          status: 'active', isPrimary: !hasAny, isSecondary: false,
          usage: 0, limit: 0, failCount: 0, lastUsedAt: null,
          createdAt: new Date().toISOString(),
        });
      }
      if (tencent) {
        localKeys.push({
          id: 'local-tokenhub', provider: 'tokenhub',
          providerName: '腾讯云TokenHub',
          apiKey: maskKey(tencent),
          status: 'active', isPrimary: !alibaba && !volcano, isSecondary: !!alibaba,
          usage: 0, limit: 0, failCount: 0, lastUsedAt: null,
          createdAt: new Date().toISOString(),
        });
      }
      if (volcano) {
        localKeys.push({
          id: 'local-volcano', provider: 'volcano',
          providerName: '火山方舟 (Volcano Ark)',
          apiKey: maskKey(volcano),
          status: 'active', isPrimary: !alibaba && !tencent, isSecondary: !!(alibaba || tencent),
          usage: 0, limit: 0, failCount: 0, lastUsedAt: null,
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

  // 加载所有服务端 Key 的余额（蓝皮书 6.2 第 3 条）
  const loadBalances = useCallback(async (keyList: ApiKeyItem[]) => {
    const serverKeys = keyList.filter(k => !k.id.startsWith('local-'));
    const next: Record<string, { balance: number | null; unit: string; message?: string }> = {};
    await Promise.all(
      serverKeys.map(async k => {
        try {
          const res = await fetch(`/api/ai-config/keys/${k.id}/balance`, { headers: getAuthHeaders() });
          const json = await res.json();
          if (json.success) next[k.id] = json.data;
        } catch { /* 单个 Key 余额失败不影响其他 */ }
      })
    );
    setBalanceMap(next);
  }, []);

  useEffect(() => {
    if (keys.length > 0) loadBalances(keys);
  }, [keys, loadBalances]);

  const handleAdd = async (values: Record<string, string | boolean>) => {
    setSubmitting(true);
    try {
      const provider = values.provider as string;
      const localStorageKey = LOCAL_STORAGE_KEYS[provider];
      if (localStorageKey) {
        localStorage.setItem(localStorageKey, values.apiKey as string);
      }
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
      } catch (backendErr: unknown) {
        message.warning(`已保存到本地，但服务端同步失败: ${(backendErr as Error).message || '未知错误'}`);
      }
      setModalOpen(false);
      form.resetFields();
      loadKeys();
    } catch (error: unknown) {
      message.error((error as Error).message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, provider: string) => {
    try {
      const localStorageKey = LOCAL_STORAGE_KEYS[provider];
      if (localStorageKey) localStorage.removeItem(localStorageKey);
      try {
        await fetch(`/api/ai-config/keys/${id}`, {
          method: 'DELETE', headers: getAuthHeaders(),
        });
      } catch { /* ignore */ }
      message.success('已删除');
      loadKeys();
    } catch (error: unknown) {
      message.error((error as Error).message || '删除失败');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-config/keys/${id}/set-primary`, {
        method: 'POST', headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) message.success('已设置为主Key');
      else throw new Error(json.error || '设置失败');
      loadKeys();
    } catch (error: unknown) {
      message.error((error as Error).message || '设置失败');
    }
  };

  const handleSetSecondary = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-config/keys/${id}/set-secondary`, {
        method: 'POST', headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) message.success('已设为备用Key');
      else throw new Error(json.error || '设置失败');
      loadKeys();
    } catch (error: unknown) {
      message.error((error as Error).message || '设置失败');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => message.success('已复制'));
  };

  const handleTest = async (record: ApiKeyItem) => {
    if (record.id.startsWith('local-')) {
      message.info('该Key仅存于浏览器本地缓存，无法在服务端测试；请删除后重新添加以完成服务端保存');
      return;
    }
    setTestingId(record.id);
    try {
      const res = await fetch(`/api/ai-config/keys/${record.id}/test`, {
        method: 'POST', headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.valid) {
        message.success(`${record.providerName} 连接正常：${json.message || 'API Key 验证成功'}`);
      } else {
        message.error(`${record.providerName} 连接失败：${json.message || json.error || '验证失败'}`);
      }
    } catch (error: unknown) {
      message.error(`${record.providerName} 测试失败：${(error as Error).message || '网络错误'}`);
    } finally {
      setTestingId(null);
    }
  };

  const totalUsage = keys.reduce((sum, k) => sum + k.usage, 0);
  const activeKeys = keys.filter(k => k.status === 'active').length;

  const columns = [
    {
      title: '服务商', dataIndex: 'providerName', key: 'providerName',
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
      title: 'API Key', dataIndex: 'apiKey', key: 'apiKey',
      render: (text: string) => (
        <Space>
          <Text code>{text}</Text>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyKey(text)} />
        </Space>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => (
        status === 'active' ? (
          <Tag icon={<CheckCircleOutlined />} color="success">启用</Tag>
        ) : (
          <Tag icon={<ExclamationCircleOutlined />} color="error">禁用</Tag>
        )
      ),
    },
    {
      title: '用量明细', dataIndex: 'usage', key: 'usage', width: 170,
      render: (usage: number, record: ApiKeyItem) => (
        <Space direction="vertical" size={0}>
          <span>{usage} 次调用</span>
          {record.failCount > 0 && <Text type="danger" style={{ fontSize: 11 }}>失败 {record.failCount} 次</Text>}
          {record.lastUsedAt && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              最近使用 {new Date(record.lastUsedAt).toLocaleString()}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '余额', dataIndex: 'id', key: 'balance', width: 150,
      render: (_: unknown, record: ApiKeyItem) => {
        const b = balanceMap[record.id];
        if (record.id.startsWith('local-')) {
          return <Text type="secondary" style={{ fontSize: 12 }}>本地缓存</Text>;
        }
        if (!b) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
        if (b.balance === null) return <Text type="secondary" style={{ fontSize: 12 }}>{b.message || '不支持查询'}</Text>;
        return (
          <Text style={{ fontSize: 12 }}>
            <span style={{ color: '#16a34a', fontWeight: 500 }}>¥ {b.balance.toFixed(2)}</span>
            <span style={{ color: '#999' }}> / {b.unit}</span>
          </Text>
        );
      },
    },
    {
      title: '操作', key: 'action', width: 280,
      render: (_: unknown, record: ApiKeyItem) => (
        <Space size="small" wrap>
          <Button
            type="link" size="small" icon={<ApiOutlined />}
            loading={testingId === record.id}
            onClick={() => handleTest(record)}
          >
            测试连接
          </Button>
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
    <PageContainer
      title="API 设置"
      description="配置AI模型API密钥，启用AI相关功能"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: 'API 设置' },
      ]}
      loading={false}
      skeletonType="card"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadKeys} disabled={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            添加API Key
          </Button>
        </Space>
      }
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* 使用统计 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="已配置 Key" value={activeKeys} suffix={`/ ${keys.length}`} prefix={<ApiOutlined />} valueStyle={{ color: '#6d28d9' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="累计调用次数" value={totalUsage} prefix={<CloudServerOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="AI功能状态" value={hasKeys ? '已就绪' : '未配置'} valueStyle={{ color: hasKeys ? '#52c41a' : '#999' }} />
            </Card>
          </Col>
        </Row>

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
                  配置至少一家服务商的API Key后，AI创作工厂的全部功能即可使用。三家服务商都配置效果最佳（智能剪辑需要火山方舟支持视频理解模型）。
                </Paragraph>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Card size="small" title="阿里云百炼 (DashScope)" type="inner">
                    <Text type="secondary">支持模型：通义千问 Qwen 系列、DeepSeek R1/V3、WAN 图像、HappyHorse 视频、千问 TTS</Text><br />
                    <Text type="secondary">适用功能：文案创作、图片生成、视频生成、配音合成、反AI化重写</Text><br />
                    <Text type="secondary">申请入口：</Text>
                    <a href="https://bailian.console.aliyun.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6d28d9', fontWeight: 500 }}>
                      bailian.console.aliyun.com <span style={{ fontSize: 11 }}>↗</span>
                    </a>
                  </Card>
                  <Card size="small" title="腾讯云TokenHub" type="inner">
                    <Text type="secondary">支持模型：混元 Image/Video、可灵 KLING、Vidu、Kimi K3、优图数字人、YT-VITA 视频理解</Text><br />
                    <Text type="secondary">适用功能：图片生成、视频生成、数字人口播、智能剪辑素材理解</Text><br />
                    <Text type="secondary">申请入口：</Text>
                    <a href="https://console.cloud.tencent.com/tokenhub" target="_blank" rel="noopener noreferrer" style={{ color: '#6d28d9', fontWeight: 500 }}>
                      console.cloud.tencent.com/tokenhub <span style={{ fontSize: 11 }}>↗</span>
                    </a>
                  </Card>
                  <Card size="small" title="火山方舟 (Volcano Ark)" type="inner">
                    <Text type="secondary">支持模型：Doubao Seed 2.1 Pro/Turbo、Seedream 5.0 图像、Seedance 2.5 视频、SeedEdit 图像编辑、Seed Audio TTS</Text><br />
                    <Text type="secondary">适用功能：智能剪辑素材理解、图片生成、视频生成、配音、BGM</Text><br />
                    <Text type="secondary">申请入口：</Text>
                    <a href="https://console.volcengine.com/ark" target="_blank" rel="noopener noreferrer" style={{ color: '#6d28d9', fontWeight: 500 }}>
                      console.volcengine.com/ark <span style={{ fontSize: 11 }}>↗</span>
                    </a>
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
          <Text type="secondary">配置完成后，以下功能即可正常使用：</Text>
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
            name="provider" label="服务商"
            rules={[{ required: true, message: '请选择服务商' }]}
          >
            <Select placeholder="请选择AI服务商">
              <Select.Option value="dashscope">
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Space>
                    <CloudServerOutlined />
                    <Text strong>阿里云百炼 (DashScope)</Text>
                    <Text type="secondary">— 通义千问/DeepSeek/WAN/HappyHorse</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 24 }}>
                    申请入口：<a href="https://bailian.console.aliyun.com" target="_blank" rel="noopener noreferrer">bailian.console.aliyun.com ↗</a>
                  </Text>
                </Space>
              </Select.Option>
              <Select.Option value="tokenhub">
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Space>
                    <CloudServerOutlined />
                    <Text strong>腾讯云TokenHub</Text>
                    <Text type="secondary">— 混元/可灵/Vidu/Kimi/数字人/YT-VITA</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 24 }}>
                    申请入口：<a href="https://console.cloud.tencent.com/tokenhub" target="_blank" rel="noopener noreferrer">console.cloud.tencent.com/tokenhub ↗</a>
                  </Text>
                </Space>
              </Select.Option>
              <Select.Option value="volcano">
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Space>
                    <CloudServerOutlined />
                    <Text strong>火山方舟 (Volcano Ark)</Text>
                    <Text type="secondary">— Doubao Seed/Seedream/Seedance/SeedEdit</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 24 }}>
                    申请入口：<a href="https://console.volcengine.com/ark" target="_blank" rel="noopener noreferrer">console.volcengine.com/ark ↗</a>
                  </Text>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="apiKey" label="API Key"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="请输入API Key"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="secretKey" label="Secret Key"
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
    </PageContainer>
  );
}
