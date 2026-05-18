'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tabs,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  StopOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  cancelScheduledTask,
  deleteScheduledTask,
  ScheduledTask,
} from '@/services/schedule';
import { getAccounts } from '@/services/social-account';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const platformOptions = [
  { value: 'douyin', label: '抖音' },
  { value: 'kuaishou', label: '快手' },
  { value: 'xiaohongshu', label: '小红书' },
];

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待执行' },
  { value: 'running', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'cancelled', label: '已取消' },
];

const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  pending: { color: 'blue', text: '待执行', icon: <ClockCircleOutlined /> },
  running: { color: 'processing', text: '执行中', icon: <SyncOutlined spin /> },
  completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
  cancelled: { color: 'default', text: '已取消', icon: <StopOutlined /> },
};

export default function ScheduledPublishPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
    fetchAccounts();
  }, [pagination.page, pagination.pageSize, statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getScheduledTasks({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: statusFilter || undefined,
      });
      setTasks(res.data?.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.total || 0,
      }));
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await getAccounts();
      setAccounts(res.data || []);
    } catch (error) {
      console.error('获取账号失败');
    }
  };

  const handleAdd = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      scheduledTime: dayjs().add(1, 'hour').startOf('hour'),
    });
    setTaskModalVisible(true);
  };

  const handleEdit = (record: ScheduledTask) => {
    setEditingTask(record);
    form.setFieldsValue({
      ...record,
      scheduledTime: dayjs(record.scheduledTime),
    });
    setTaskModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        scheduledTime: values.scheduledTime.format('YYYY-MM-DDTHH:mm:ssZ'),
      };

      if (editingTask) {
        await updateScheduledTask(editingTask.id, data);
        message.success('任务已更新');
      } else {
        await createScheduledTask(data);
        message.success('任务创建成功');
      }
      setTaskModalVisible(false);
      fetchTasks();
    } catch (error: any) {
      if (!error.errorFields) {
        message.error(error.message || '操作失败');
      }
    }
  };

  const handleCancel = async (record: ScheduledTask) => {
    try {
      await cancelScheduledTask(record.id);
      message.success('任务已取消');
      fetchTasks();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (record: ScheduledTask) => {
    try {
      await deleteScheduledTask(record.id);
      message.success('任务已删除');
      fetchTasks();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getPlatformLabel = (platform: string) => {
    return platformOptions.find(p => p.value === platform)?.label || platform;
  };

  const columns: ColumnsType<ScheduledTask> = [
    {
      title: '任务信息',
      key: 'info',
      width: 300,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.title}</div>
          <div className="text-gray-500 text-sm truncate max-w-[280px]">
            {record.content}
          </div>
        </div>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => (
        <Tag>{getPlatformLabel(platform)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '定时时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确认取消此任务？"
                onConfirm={() => handleCancel(record)}
              >
                <Button type="link" size="small" danger>
                  取消
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status !== 'running' && (
            <Popconfirm
              title="确认删除此任务？"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>定时发布</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建定时任务
          </Button>
        }
      >
        {/* 统计卡片 */}
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Statistic
              title="待执行"
              value={stats.pending}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="执行中"
              value={stats.running}
              valueStyle={{ color: '#722ed1' }}
              prefix={<SyncOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="失败"
              value={stats.failed}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
        </Row>

        {/* 筛选 */}
        <div className="mb-4">
          <Space>
            <span>状态筛选：</span>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              options={statusOptions}
              style={{ width: 120 }}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ page, pageSize, total: pagination.total });
            },
          }}
        />
      </Card>

      {/* 创建/编辑任务弹窗 */}
      <Modal
        title={editingTask ? '编辑定时任务' : '创建定时任务'}
        open={taskModalVisible}
        onOk={handleSubmit}
        onCancel={() => setTaskModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入内容标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={4} placeholder="请输入要发布的内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="platform"
                label="发布平台"
                rules={[{ required: true, message: '请选择平台' }]}
              >
                <Select placeholder="请选择平台" options={platformOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountId"
                label="发布账号"
                rules={[{ required: true, message: '请选择账号' }]}
              >
                <Select placeholder="请选择账号">
                  {accounts.map(account => (
                    <Select.Option key={account.id} value={account.id}>
                      {account.nickname || account.platform}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="scheduledTime"
            label="定时时间"
            rules={[{ required: true, message: '请选择定时时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              minuteStep={15}
              disabledDate={(current) => current && current < dayjs().endOf('minute')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="images" label="图片（选填）">
            <Input placeholder="多张图片用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
