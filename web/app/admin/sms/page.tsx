'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
  Select,
  Typography,
  Divider,
  Descriptions,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getSmsConfigs,
  createSmsConfig,
  updateSmsConfig,
  deleteSmsConfig,
  setDefaultConfig,
  testSmsConfig,
  getSmsLogs,
  SmsConfig,
  SmsLog,
} from '@/services/sms';

const { Title, Text } = Typography;

export default function SmsConfigPage() {
  const [configs, setConfigs] = useState<SmsConfig[]>([]);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SmsConfig | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<'configs' | 'logs'>('configs');
  const [logsPagination, setLogsPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [testLoading, setTestLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logsPagination.page, logsPagination.pageSize]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await getSmsConfigs();
      setConfigs(res.data || []);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await getSmsLogs({
        page: logsPagination.page,
        pageSize: logsPagination.pageSize,
      });
      setLogs(res.data?.list || []);
      setLogsPagination(prev => ({
        ...prev,
        total: res.data?.total || 0,
      }));
    } catch (error) {
      message.error('获取日志失败');
    }
  };

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setConfigModalVisible(true);
  };

  const handleEdit = (record: SmsConfig) => {
    setEditingConfig(record);
    form.setFieldsValue(record);
    setConfigModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingConfig) {
        await updateSmsConfig(editingConfig.id, values);
        message.success('更新成功');
      } else {
        await createSmsConfig(values);
        message.success('创建成功');
      }
      setConfigModalVisible(false);
      fetchConfigs();
    } catch (error: any) {
      if (!error.errorFields) {
        message.error(error.message || '操作失败');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSmsConfig(id);
      message.success('删除成功');
      fetchConfigs();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultConfig(id);
      message.success('设置默认成功');
      fetchConfigs();
    } catch (error) {
      message.error('设置失败');
    }
  };

  const handleTest = async (id: string) => {
    setTestLoading(id);
    try {
      const res = await testSmsConfig(id);
      if (res.data.success) {
        message.success('测试成功！请检查手机是否收到验证码');
      } else {
        message.error(res.data.message || '测试失败');
      }
    } catch (error: any) {
      message.error(error.message || '测试失败');
    } finally {
      setTestLoading(null);
    }
  };

  const configColumns: ColumnsType<SmsConfig> = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '服务商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color={provider === 'aliyun' ? 'blue' : 'green'}>
          {provider === 'aliyun' ? '阿里云' : '腾讯云'}
        </Tag>
      ),
    },
    {
      title: '签名',
      dataIndex: 'signName',
      key: 'signName',
    },
    {
      title: '模板ID',
      dataIndex: 'templateCode',
      key: 'templateCode',
    },
    {
      title: '默认',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault: boolean) => (isDefault ? <Tag color="gold">默认</Tag> : null),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) =>
        enabled ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            启用
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            禁用
          </Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleSetDefault(record.id)}
            disabled={record.isDefault}
          >
            设为默认
          </Button>
          <Button
            type="link"
            size="small"
            loading={testLoading === record.id}
            onClick={() => handleTest(record.id)}
          >
            测试
          </Button>
          <Popconfirm title="确认删除此配置？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const logColumns: ColumnsType<SmsLog> = [
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          register: { text: '注册', color: 'blue' },
          login: { text: '登录', color: 'green' },
          forgot_password: { text: '忘记密码', color: 'orange' },
          verify: { text: '验证', color: 'purple' },
        };
        const config = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '验证码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '服务商',
      dataIndex: 'provider',
      key: 'provider',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'success' ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>短信配置管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加配置
          </Button>
        }
        tabList={[
          { key: 'configs', tab: '配置管理' },
          { key: 'logs', tab: '发送日志' },
        ]}
        activeTabKey={activeTab}
        onTabChange={key => setActiveTab(key as 'configs' | 'logs')}
      >
        {activeTab === 'configs' ? (
          <>
            <Alert
              message="配置说明"
              description={
                <div>
                  <p>1. 支持阿里云和腾讯云短信服务</p>
                  <p>2. 请确保已开通短信服务并创建签名和模板</p>
                  <p>3. 模板内容应包含验证码变量：您的验证码为 {`{code}`}</p>
                  <p>4. 建议只启用一个配置，另一个作为备份</p>
                </div>
              }
              type="info"
              showIcon
              className="mb-4"
            />
            <Table
              columns={configColumns}
              dataSource={configs}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </>
        ) : (
          <Table
            columns={logColumns}
            dataSource={logs}
            rowKey="id"
            pagination={{
              current: logsPagination.page,
              pageSize: logsPagination.pageSize,
              total: logsPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setLogsPagination({ page, pageSize, total: logsPagination.total });
              },
            }}
          />
        )}
      </Card>

      <Modal
        title={editingConfig ? '编辑短信配置' : '添加短信配置'}
        open={configModalVisible}
        onOk={handleSubmit}
        onCancel={() => setConfigModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="例如：阿里云主配置" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="服务商"
            rules={[{ required: true, message: '请选择服务商' }]}
          >
            <Select placeholder="请选择服务商">
              <Select.Option value="aliyun">阿里云短信服务</Select.Option>
              <Select.Option value="tencent">腾讯云短信服务</Select.Option>
            </Select>
          </Form.Item>

          <Divider>API 凭证</Divider>

          <Form.Item
            name="accessKeyId"
            label="AccessKey ID"
            rules={[{ required: true, message: '请输入 AccessKey ID' }]}
          >
            <Input placeholder="请输入阿里云或腾讯云的 AccessKey ID" />
          </Form.Item>

          <Form.Item
            name="accessKeySecret"
            label="AccessKey Secret"
            rules={[{ required: true, message: '请输入 AccessKey Secret' }]}
          >
            <Input.Password placeholder="请输入 AccessKey Secret" />
          </Form.Item>

          <Divider>短信配置</Divider>

          <Form.Item
            name="signName"
            label="短信签名"
            rules={[{ required: true, message: '请输入短信签名' }]}
          >
            <Input placeholder="例如：智枢科技" />
          </Form.Item>

          <Form.Item
            name="templateCode"
            label="模板ID"
            rules={[{ required: true, message: '请输入短信模板ID' }]}
          >
            <Input placeholder="例如：SMS_123456789" />
          </Form.Item>

          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="isDefault" label="设为默认" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
