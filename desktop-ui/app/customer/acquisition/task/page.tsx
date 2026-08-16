'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, message, Card, Space, Progress,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const TASK_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待启动', color: 'default' },
  running: { label: '运行中', color: 'green' },
  paused: { label: '已暂停', color: 'orange' },
  completed: { label: '已完成', color: 'blue' },
};

const CHANNEL_OPTIONS = [
  { label: '抖音', value: 'douyin' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '微信', value: 'wechat' },
  { label: '快手', value: 'kuaishou' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: '其他', value: 'other' },
];

interface Task {
  id: string;
  title: string;
  channel: string;
  targetCount: number;
  actualCount: number;
  status: string;
  createdAt: string;
}

export default function AcquisitionTaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res: Record<string, unknown> = await apiClient.get('/acquisition/tasks', {
        params: { page: pagination.page, pageSize: pagination.pageSize },
      });
      const payload = (res.data as Record<string, unknown>) || res;
      setTasks((payload.tasks as Task[]) || []);
      setPagination(prev => ({ ...prev, total: (payload.total as number) || 0 }));
    } catch (error: unknown) {
      message.error((error as Error).message || '获取任务列表失败');
    } finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => { setEditingTask(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (task: Task) => { setEditingTask(task); form.setFieldsValue(task); setModalVisible(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingTask) {
        await apiClient.put(`/acquisition/tasks/${editingTask.id}`, values);
        message.success('任务更新成功');
      } else {
        await apiClient.post('/acquisition/tasks', values);
        message.success('任务创建成功');
      }
      setModalVisible(false); form.resetFields(); setEditingTask(null);
      fetchTasks();
    } catch (error: unknown) {
      if ((error as Error)?.message) message.error((error as Error).message);
    } finally { setSubmitting(false); }
  };

  const handleDelete = (task: Task) => {
    Modal.confirm({
      title: `确认删除任务 "${task.title}"？`,
      content: '删除后关联的潜客数据不会丢失，确定继续吗？',
      okText: '确认删除', cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/acquisition/tasks/${task.id}`);
          message.success('任务已删除');
          fetchTasks();
        } catch (error: unknown) { message.error((error as Error).message || '删除失败'); }
      },
    });
  };

  const toggleStatus = async (task: Task) => {
    const action = task.status === 'running' ? 'pause' : 'start';
    try {
      await apiClient.put(`/acquisition/tasks/${task.id}/${action}`);
      message.success(task.status === 'running' ? '任务已暂停' : '任务已启动');
      fetchTasks();
    } catch (e: unknown) { message.error((e as Error).message || '操作失败'); }
  };

  const columns = [
    { title: '任务名称', dataIndex: 'title', key: 'title', width: 200 },
    { title: '渠道', dataIndex: 'channel', key: 'channel', width: 100, render: (c: string) => CHANNEL_OPTIONS.find(o => o.value === c)?.label || c },
    { title: '目标数', dataIndex: 'targetCount', key: 'targetCount', width: 80 },
    { title: '已获客', dataIndex: 'actualCount', key: 'actualCount', width: 80, render: (v: number) => v || 0 },
    { title: '进度', key: 'progress', width: 150, sorter: (a: Task, b: Task) => {
      const pa = a.targetCount > 0 ? (a.actualCount || 0) / a.targetCount : 0;
      const pb = b.targetCount > 0 ? (b.actualCount || 0) / b.targetCount : 0;
      return pa - pb;
    }, render: (_: unknown, r: Task) => {
      const pct = r.targetCount > 0 ? Math.round(((r.actualCount || 0) / r.targetCount) * 100) : 0;
      return <Progress percent={Math.min(pct, 100)} size="small" />;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => {
      const cfg = TASK_STATUS_CONFIG[s] || { label: s, color: 'default' };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, sorter: (a: Task, b: Task) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), render: (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-' },
    { title: '操作', key: 'action', width: 240, fixed: 'right' as const, render: (_: unknown, r: Task) => (
      <Space size={0}>
        {r.status === 'pending' && <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => toggleStatus(r)}>启动</Button>}
        {r.status === 'running' && <Button type="link" size="small" icon={<PauseCircleOutlined />} onClick={() => toggleStatus(r)}>暂停</Button>}
        {(r.status === 'pending' || r.status === 'paused') && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>}
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)}>删除</Button>
      </Space>
    )},
  ];

  return (
    <PageContainer
      title="获客任务"
      description="创建和管理引流获客任务，追踪任务进度"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '获客管理' },
        { title: '获客任务' },
      ]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTasks}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建任务</Button>
        </Space>
      }
    >
      <Card>
        <Table
          columns={columns} dataSource={tasks} rowKey="id" loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.page, pageSize: pagination.pageSize, total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, page, pageSize })),
          }}
          locale={{ emptyText: '暂无任务，点击「创建任务」开始' }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑获客任务' : '创建获客任务'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingTask(null); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingTask ? '保存' : '创建'} cancelText="取消" width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="例：抖音美妆类KOL获客" />
          </Form.Item>
          <Form.Item name="channel" label="获客渠道" rules={[{ required: true, message: '请选择渠道' }]}>
            <Select placeholder="请选择获客渠道" options={CHANNEL_OPTIONS} />
          </Form.Item>
          <Form.Item name="targetCount" label="目标数量" initialValue={100}>
            <Input type="number" placeholder="默认100" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
