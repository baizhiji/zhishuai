'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Space, message, Tag, Popconfirm, Typography, Divider, Alert } from 'antd';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ApiProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  isDefault: boolean;
  priority: number;
  config: any;
  remark: string;
}

const providerTypes = [
  { value: 'coze', label: '扣子 (Coze)', color: 'blue' },
  { value: 'volcengine', label: '火山引擎', color: 'red' },
  { value: 'openai', label: 'OpenAI', color: 'green' },
  { value: 'custom', label: '自定义', color: 'default' },
];

export default function ApiProvidersPage() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/api-providers/providers');
      if (res.data) {
        setProviders(res.data);
      }
    } catch (error) {
      console.error('获取API服务商失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProvider(null);
    form.resetFields();
    setDialogOpen(true);
  };

  const handleEdit = (record: ApiProvider) => {
    setEditingProvider(record);
    form.setFieldsValue(record);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/api-providers/providers/${id}`);
      message.success('删除成功');
      fetchProviders();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/admin/api-providers/providers/${id}`, { isDefault: true });
      message.success('设置成功');
      fetchProviders();
    } catch (error) {
      message.error('设置失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      if (editingProvider) {
        await api.put(`/admin/api-providers/providers/${editingProvider.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/admin/api-providers/providers', values);
        message.success('创建成功');
      }
      
      setDialogOpen(false);
      fetchProviders();
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      width: 120,
      render: (type: string) => {
        const provider = providerTypes.find(p => p.value === type);
        return <Tag color={provider?.color}>{provider?.label || type}</Tag>;
      }
    },
    { title: 'Base URL', dataIndex: 'baseUrl', key: 'baseUrl', width: 200, ellipsis: true },
    { 
      title: 'API Key', 
      dataIndex: 'apiKey', 
      key: 'apiKey',
      width: 150,
      ellipsis: true,
      render: (text: string) => <Text copyable={{ text: text }}>{text ? '******' + text.slice(-4) : '-'}</Text>
    },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    { 
      title: '默认', 
      dataIndex: 'isDefault', 
      key: 'isDefault',
      width: 80,
      render: (isDefault: boolean) => isDefault ? <Tag color="green">默认</Tag> : null
    },
    { 
      title: '状态', 
      dataIndex: 'enabled', 
      key: 'enabled',
      width: 80,
      render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '禁用'}</Tag>
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ApiProvider) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {!record.isDefault && (
            <Button type="link" size="small" onClick={() => handleSetDefault(record.id)}>设为默认</Button>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={<Title level={4}>API服务商配置</Title>}
        extra={
          <Button type="primary" onClick={handleAdd}>
            添加服务商
          </Button>
        }
      >
        <Alert
          message="配置说明"
          description="在这里配置AI服务商（如扣子、火山引擎等）的API信息。默认服务商将优先使用。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table
          columns={columns}
          dataSource={providers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProvider ? '编辑服务商' : '添加服务商'}
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如：扣子-生产环境" />
          </Form.Item>
          
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select>
              {providerTypes.map(p => (
                <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true }]}>
            <Input placeholder="如：https://ark.cn-beijing.volces.com/api/v3" />
          </Form.Item>
          
          <Form.Item name="apiKey" label="API Key" rules={[{ required: true }]}>
            <Input.Password placeholder="输入API Key" />
          </Form.Item>
          
          <Form.Item name="priority" label="优先级" initialValue={100}>
            <Input type="number" placeholder="数字越小优先级越高" />
          </Form.Item>
          
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="备注信息（可选）" />
          </Form.Item>
          
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
