'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  message,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getReminders,
  createReminder,
  completeReminder,
  deleteReminder,
  CrmReminder,
} from '../../../../services/crm-advanced';
import { getMyCustomers } from '../../../../services/crm';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function RemindersPage() {
  const [reminders, setReminders] = useState<CrmReminder[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchReminders();
    fetchCustomers();
  }, [activeTab]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await getReminders({
        upcoming: activeTab === 'upcoming',
        completed: activeTab === 'completed',
      });
      setReminders(res || []);
    } catch (error) {
      message.error('获取提醒失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await getMyCustomers({ page: 1, pageSize: 100 });
      setCustomers(res.list || []);
    } catch (error) {
      console.error('获取客户列表失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id);
      message.success('已完成');
      fetchReminders();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      message.success('删除成功');
      fetchReminders();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createReminder({
        customerId: values.customerId,
        type: values.type,
        title: values.title,
        remindAt: values.remindAt[0].toISOString(),
      });
      message.success('创建成功');
      setModalVisible(false);
      fetchReminders();
    } catch (error) {
      // 表单验证失败或API错误
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      follow_up: 'blue',
      contract: 'purple',
      birthday: 'pink',
      custom: 'cyan',
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      follow_up: '跟进',
      contract: '合同',
      birthday: '生日',
      custom: '自定义',
    };
    return labels[type] || type;
  };

  const columns = [
    {
      title: '提醒类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '提醒标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '提醒时间',
      dataIndex: 'remindAt',
      key: 'remindAt',
      width: 180,
      render: (date: string) => (
        <Space>
          <ClockCircleOutlined />
          {dayjs(date).format('YYYY-MM-DD HH:mm')}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isCompleted',
      key: 'isCompleted',
      width: 100,
      render: (isCompleted: boolean) =>
        isCompleted ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            已完成
          </Tag>
        ) : (
          <Tag color="warning">待处理</Tag>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: CrmReminder) => (
        <Space>
          {!record.isCompleted && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record.id)}
            >
              完成
            </Button>
          )}
          <Popconfirm
            title="确定删除此提醒？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
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
        title="客户提醒"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建提醒
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'upcoming', label: '待处理' },
            { key: 'completed', label: '已完成' },
          ]}
        />
        <Table
          dataSource={reminders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建提醒"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customerId"
            label="关联客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select
              placeholder="请选择客户"
              showSearch
              optionFilterProp="children"
              options={customers.map(c => ({
                value: c.id,
                label: c.name || c.phone,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="提醒类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select
              placeholder="请选择类型"
              options={[
                { value: 'follow_up', label: '跟进提醒' },
                { value: 'contract', label: '合同到期' },
                { value: 'birthday', label: '生日提醒' },
                { value: 'custom', label: '自定义' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="提醒标题"
            rules={[{ required: true, message: '请输入提醒标题' }]}
          >
            <Input placeholder="请输入提醒标题" />
          </Form.Item>

          <Form.Item
            name="remindAt"
            label="提醒时间"
            rules={[{ required: true, message: '请选择提醒时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
