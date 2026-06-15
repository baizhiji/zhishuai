'use client';

import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, Switch, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getVersions, createVersion, updateVersion, deleteVersion, type AppVersion } from '@/services/version';
=======
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
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getVersions,
  createVersion,
  updateVersion,
  deleteVersion,
  type AppVersion,
} from '@/services/version';
>>>>>>> 962968886be726cd434c792933b5515366d34518

const { TextArea } = Input;
const { Option } = Select;

export default function VersionManagementPage() {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await getVersions({ page, pageSize });
      setVersions(res.data || []);
      setPagination({ total: res.total || 0, page, pageSize });
    } catch (error) {
      message.error('加载版本列表失败');
    } finally {
      setLoading(false);
    }
  };

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
<<<<<<< HEAD
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
=======
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
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

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="版本管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增版本
          </Button>
        }
      >
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
<<<<<<< HEAD
          <Form.Item name="forceUpdate" label="强制更新" valuePropName="checked" initialValue={false}>
=======
          <Form.Item
            name="forceUpdate"
            label="强制更新"
            valuePropName="checked"
            initialValue={false}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
