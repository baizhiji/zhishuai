'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Switch,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  NotificationOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  target: 'all' | 'agent' | 'user';
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_META = {
  info: { color: 'blue', label: '提示' },
  warning: { color: 'orange', label: '警告' },
  important: { color: 'red', label: '重要' },
};

const TARGET_META = {
  all: { color: 'purple', label: '全员' },
  agent: { color: 'cyan', label: '代理商' },
  user: { color: 'green', label: '客户' },
};

const STATUS_META = {
  draft: { color: 'default', label: '草稿' },
  published: { color: 'success', label: '已发布' },
  archived: { color: 'default', label: '已归档' },
};

export default function AdminAnnouncementPage() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = (await request.get<{ success: boolean; data: { list: Announcement[]; total: number } }>(
        `/api/admin/announcements/list?${params.toString()}`
      )) as unknown as { success: boolean; data: { list: Announcement[]; total: number } };

      if (res.success) {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
        // 计算统计
        const all = res.data?.list || [];
        setStats({
          total: res.data?.total || 0,
          published: all.filter((a: Announcement) => a.status === 'published').length,
          draft: all.filter((a: Announcement) => a.status === 'draft').length,
        });
      } else {
        setList([]);
      }
    } catch (err) {
      console.error('获取公告失败', err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openModal = (item?: Announcement) => {
    setEditing(item || null);
    if (item) {
      form.setFieldsValue({
        ...item,
        publishedAt: item.publishedAt ? dayjs(item.publishedAt) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: 'info',
        target: 'all',
        status: 'draft',
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        title: values.title,
        content: values.content,
        type: values.type,
        target: values.target,
        status: values.status,
      };
      if (values.publishedAt) {
        payload.publishedAt = values.publishedAt.toISOString();
      }

      const request = (await import('@/lib/request')).default;
      let res: any;
      if (editing) {
        res = (await request.put<{ success: boolean; message?: string }>(
          `/api/admin/announcements/${editing.id}`,
          payload
        )) as unknown as { success: boolean; message?: string };
      } else {
        res = (await request.post<{ success: boolean; message?: string }>(
          '/api/admin/announcements/create',
          payload
        )) as unknown as { success: boolean; message?: string };
      }
      if (res.success) {
        message.success(editing ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchList();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.delete<{ success: boolean; message?: string }>(
        `/api/admin/announcements/${id}`
      )) as unknown as { success: boolean; message?: string };
      if (res.success) {
        message.success('已删除');
        fetchList();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败');
    }
  };

  const handleTogglePublish = async (item: Announcement) => {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.put<{ success: boolean; message?: string }>(
        `/api/admin/announcements/${item.id}`,
        { status: nextStatus }
      )) as unknown as { success: boolean; message?: string };
      if (res.success) {
        message.success(nextStatus === 'published' ? '已发布' : '已撤回为草稿');
        fetchList();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  const columns: ColumnsType<Announcement> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{v}</Text>
            {r.type === 'important' && <Tag color="red">重要</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
            {r.content.slice(0, 60)}{r.content.length > 60 ? '...' : ''}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: t => <Tag color={TYPE_META[t as keyof typeof TYPE_META]?.color}>{TYPE_META[t as keyof typeof TYPE_META]?.label}</Tag>,
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
      width: 90,
      render: t => <Tag color={TARGET_META[t as keyof typeof TARGET_META]?.color}>{TARGET_META[t as keyof typeof TARGET_META]?.label}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s, r) => (
        <Space>
          <Tag color={STATUS_META[s as keyof typeof STATUS_META]?.color}>
            {STATUS_META[s as keyof typeof STATUS_META]?.label}
          </Tag>
          {s === 'published' && (
            <Switch
              size="small"
              defaultChecked
              onChange={() => handleTogglePublish(r)}
            />
          )}
          {s === 'draft' && (
            <Switch
              size="small"
              onChange={() => handleTogglePublish(r)}
            />
          )}
        </Space>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 160,
      render: v => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: v => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, r) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(r)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该公告？" onConfirm={() => handleDelete(r.id)}>
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
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>系统公告</Title>
          <Text type="secondary">发布系统通知，代理商端和客户端顶部公告区会实时显示</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchList}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            发布公告
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="公告总数"
              value={stats.total}
              prefix={<NotificationOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="已发布"
              value={stats.published}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="草稿"
              value={stats.draft}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 130 }}>
              <Option value="all">全部状态</Option>
              <Option value="published">已发布</Option>
              <Option value="draft">草稿</Option>
              <Option value="archived">已归档</Option>
            </Select>
            <Button type="primary" onClick={() => { setPage(1); fetchList(); }}>查询</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: t => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑公告' : '发布公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="公告标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="如：AI 短剧功能上线通知" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="info">提示</Option>
                  <Option value="warning">警告</Option>
                  <Option value="important">重要</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="target" label="目标" rules={[{ required: true }]}>
                <Select>
                  <Option value="all">全员（代理商 + 客户）</Option>
                  <Option value="agent">仅代理商</Option>
                  <Option value="user">仅客户</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  <Option value="draft">保存为草稿</Option>
                  <Option value="published">立即发布</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="publishedAt" label="定时发布时间（可选）">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="不填则使用创建时间"
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="公告内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="详细描述公告内容..." maxLength={2000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
