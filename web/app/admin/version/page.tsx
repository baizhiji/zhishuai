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
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, AppstoreOutlined, CheckCircleOutlined, AndroidOutlined, AppleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getVersions,
  createVersion,
  updateVersion,
  deleteVersion,
  type AppVersion,
} from '@/services/version';

const { TextArea } = Input;
const { Option } = Select;

export default function VersionManagementPage() {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (platformFilter) params.platform = platformFilter;
      const res = await getVersions(params);
      setVersions(res.data || []);
      setPagination({ total: res.total || 0, page, pageSize });
    } catch (error) {
      message.error('加载版本列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadVersions(1, pagination.pageSize);
  };

  useEffect(() => {
    loadVersions(1, pagination.pageSize);
  }, [statusFilter, platformFilter]);

  const handleAdd = () => {
    setEditingVersion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AppVersion) => {
    setEditingVersion(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVersion(id);
      message.success('删除成功');
      loadVersions(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingVersion) {
        await updateVersion(editingVersion.id, values);
        message.success('更新成功');
      } else {
        await createVersion(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadVersions(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<AppVersion> = [
    { title: '版本号', dataIndex: 'versionName', key: 'versionName', width: 120 },
    { title: '版本Code', dataIndex: 'versionCode', key: 'versionCode', width: 100 },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (p: string) => (
        <Tag color={p === 'android' ? 'green' : 'blue'}>{p === 'android' ? 'Android' : 'iOS'}</Tag>
      ),
    },
    {
      title: '强制更新',
      dataIndex: 'forceUpdate',
      key: 'forceUpdate',
      width: 100,
      render: (v: boolean) => <Tag color={v ? 'red' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '启用' : '禁用'}</Tag>
      ),
    },
    { title: '更新内容', dataIndex: 'updateContent', key: 'updateContent', ellipsis: true },
    { title: '下载链接', dataIndex: 'downloadUrl', key: 'downloadUrl', ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeCount = versions.filter(v => v.status === 'active').length;
  const androidCount = versions.filter(v => v.platform === 'android').length;
  const iosCount = versions.filter(v => v.platform === 'ios').length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>版本管理</h3>
          <p style={{ margin: '4px 0 0', color: '#8c8c8c', fontSize: 14 }}>管理移动端App版本更新，控制强制升级策略</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增版本
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="版本总数" value={pagination.total} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="启用中" value={activeCount} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="Android" value={androidCount} prefix={<AndroidOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic title="iOS" value={iosCount} prefix={<AppleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="平台筛选"
            style={{ width: 130 }}
            allowClear
            value={platformFilter || undefined}
            onChange={v => setPlatformFilter(v || '')}
          >
            <Option value="android">Android</Option>
            <Option value="ios">iOS</Option>
          </Select>
          <Select
            placeholder="状态筛选"
            style={{ width: 130 }}
            allowClear
            value={statusFilter || undefined}
            onChange={v => setStatusFilter(v || '')}
          >
            <Option value="active">启用</Option>
            <Option value="inactive">禁用</Option>
          </Select>
        </Space>
        <Table
          columns={columns}
          dataSource={versions}
          rowKey="id"
          loading={loading}
          pagination={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.pageSize,
            onChange: (page, pageSize) => loadVersions(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title={editingVersion ? '编辑版本' : '新增版本'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
            <Select>
              <Option value="android">Android</Option>
              <Option value="ios">iOS</Option>
            </Select>
          </Form.Item>
          <Form.Item name="versionName" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="如: 1.0.0" />
          </Form.Item>
          <Form.Item name="versionCode" label="版本Code" rules={[{ required: true }]}>
            <Input type="number" placeholder="如: 100" />
          </Form.Item>
          <Form.Item name="downloadUrl" label="下载链接" rules={[{ required: true }]}>
            <Input placeholder="APK下载链接或App Store链接" />
          </Form.Item>
          <Form.Item
            name="forceUpdate"
            label="强制更新"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          <Form.Item name="updateContent" label="更新内容">
            <TextArea rows={4} placeholder="本次更新内容..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
