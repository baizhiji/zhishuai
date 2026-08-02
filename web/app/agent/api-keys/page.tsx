'use client';

import { Card, Typography, Empty, Table, Tag, Space, Button, App, Switch, Modal, Form, Input, message as antdMessage } from 'antd';
import { KeyOutlined, PlusOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastUsed?: string;
}

export default function AgentApiKeysPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ApiKeyItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res: any = await request.get('/agent/api-keys');
      const items = res?.data?.list || res?.list || res?.data || [];
      setList(Array.isArray(items) ? items : []);
    } catch (err) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values: { name: string }) => {
    try {
      const request = (await import('@/lib/request')).default;
      await request.post('/agent/api-keys', values);
      message.success('API Key 已创建');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '创建失败');
    }
  };

  const handleToggle = async (id: string, status: 'active' | 'disabled') => {
    try {
      const request = (await import('@/lib/request')).default;
      await request.patch(`/agent/api-keys/${id}`, { status });
      message.success('已更新状态');
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '更新失败');
    }
  };

  const copy = (k: string) => {
    navigator.clipboard.writeText(k).then(
      () => message.success('已复制到剪贴板'),
      () => message.error('复制失败')
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <KeyOutlined style={{ marginRight: 8 }} />
            API 管理
          </Title>
          <Text type="secondary">管理名下客户对接系统时使用的 API Key</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新建 Key
          </Button>
        </Space>
      </div>

      <Card>
        {list.length === 0 ? (
          <Empty description={loading ? '加载中...' : '尚未创建 API Key'} />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            dataSource={list}
            pagination={{ pageSize: 20 }}
            columns={[
              { title: '名称', dataIndex: 'name', key: 'name' },
              {
                title: 'Key',
                dataIndex: 'key',
                key: 'key',
                render: (v: string) => (
                  <Space>
                    <Text code>{v?.slice(0, 12)}****</Text>
                    <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copy(v)}>
                      复制
                    </Button>
                  </Space>
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 120,
                render: (v: 'active' | 'disabled', r: ApiKeyItem) => (
                  <Switch
                    checked={v === 'active'}
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                    onChange={(checked) => handleToggle(r.id, checked ? 'active' : 'disabled')}
                  />
                ),
              },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
              { title: '最后使用', dataIndex: 'lastUsed', key: 'lastUsed', width: 180 },
            ]}
          />
        )}
      </Card>

      <Modal
        title="新建 API Key"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Key 名称"
            rules={[{ required: true, message: '请输入 Key 名称' }]}
          >
            <Input placeholder="例如：客户系统对接" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
