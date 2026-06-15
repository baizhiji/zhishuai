'use client';

import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, type Announcement } from '@/services/version';
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
  DatePicker,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
} from '@/services/version';
>>>>>>> 962968886be726cd434c792933b5515366d34518

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function AnnouncementManagementPage() {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await getAnnouncements({ page, pageSize });
      setAnnouncements(res.data || []);
      setPagination({ total: res.data.total || 0, page, pageSize });
    } catch (error) {
      message.error('加载公告列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingAnnouncement(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Announcement) => {
    setEditingAnnouncement(record);
    form.setFieldsValue({
      ...record,
      timeRange: [record.startTime, record.endTime],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      message.success('删除成功');
      loadAnnouncements(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [startTime, endTime] = values.timeRange || [];
      const data = {
        ...values,
        startTime: startTime?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: endTime?.format('YYYY-MM-DD HH:mm:ss'),
      };
      delete data.timeRange;

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, data);
        message.success('更新成功');
      } else {
        await createAnnouncement(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadAnnouncements(pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
<<<<<<< HEAD
      case 'warning': return 'orange';
      case 'success': return 'green';
      default: return 'blue';
=======
      case 'warning':
        return 'orange';
      case 'success':
        return 'green';
      default:
        return 'blue';
>>>>>>> 962968886be726cd434c792933b5515366d34518
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
<<<<<<< HEAD
      case 'warning': return '重要';
      case 'success': return '成功';
      default: return '通知';
=======
      case 'warning':
        return '重要';
      case 'success':
        return '成功';
      default:
        return '通知';
>>>>>>> 962968886be726cd434c792933b5515366d34518
    }
  };

  const columns: ColumnsType<Announcement> = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: string) => <Tag color={getTypeColor(t)}>{getTypeText(t)}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: string) => (
        <Tag color={p === 'high' ? 'red' : p === 'low' ? 'default' : 'orange'}>
          {p === 'high' ? '高' : p === 'low' ? '低' : '中'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '显示' : '隐藏'}</Tag>
      ),
    },
    { title: '生效时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 180 },
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
        title="系统公告"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            发布公告
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={announcements}
          rowKey="id"
          loading={loading}
          pagination={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.pageSize,
            onChange: (page, pageSize) => loadAnnouncements(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title={editingAnnouncement ? '编辑公告' : '发布公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="公告标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="公告内容..." />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="type" label="类型" initialValue="info">
              <Select style={{ width: 120 }}>
                <Option value="info">通知</Option>
                <Option value="warning">重要</Option>
                <Option value="success">成功</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="优先级" initialValue="normal">
              <Select style={{ width: 120 }}>
                <Option value="low">低</Option>
                <Option value="normal">中</Option>
                <Option value="high">高</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="active">
              <Select style={{ width: 120 }}>
                <Option value="active">显示</Option>
                <Option value="inactive">隐藏</Option>
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="timeRange" label="生效时间">
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
