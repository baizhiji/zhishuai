'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Drawer, Space, Tooltip, Badge } from 'antd';
import { PlusOutlined, SendOutlined, FilterOutlined, SearchOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { TicketAPI, ticketCategories, ticketPriorities, ticketStatuses } from '@/services/ticket';
import PageContainer from '@/components/customer/PageContainer';

const { TextArea } = Input;

interface TicketReply {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNo: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  responses?: TicketReply[];
}

interface TicketFormValues {
  category: string;
  priority: string;
  title: string;
  content: string;
}

export default function CustomerTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [form] = Form.useForm<TicketFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
    }
  }, [user, pagination.page, pagination.pageSize, sortField, sortOrder]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await TicketAPI.list({
        userId: user?.id,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (res.data) {
        setTickets(res.data);
        if (res.pagination) {
          setPagination(prev => ({ ...prev, total: res.pagination.total }));
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || '获取工单失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (values: TicketFormValues): Promise<void> => {
    setSubmitting(true);
    try {
      const res = await TicketAPI.create({
        userId: user?.id || '',
        title: values.title,
        content: values.content,
        category: values.category,
        priority: values.priority,
      });
      if (res.success) {
        message.success('工单提交成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchTickets();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailDrawerVisible(true);
    try {
      const res = await TicketAPI.detail(ticket.id);
      if (res.data) {
        setSelectedTicket(res.data);
      }
    } catch {
      message.error('获取工单详情失败');
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      const res = await TicketAPI.reply(selectedTicket.id, {
        userId: user?.id || '',
        userName: user?.name || '用户',
        userRole: 'user',
        content: replyContent,
      });
      if (res.success) {
        message.success('回复成功');
        setReplyContent('');
        const detailRes = await TicketAPI.detail(selectedTicket.id);
        if (detailRes.data) {
          setSelectedTicket(detailRes.data);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const statusInfo = ticketStatuses.find(s => s.value === status);
    return statusInfo?.color || 'default';
  };

  const getPriorityColor = (priority: string): string => {
    const priorityInfo = ticketPriorities.find(p => p.value === priority);
    return priorityInfo?.color || 'default';
  };

  const getCategoryLabel = (category: string): string => {
    const cat = ticketCategories.find(c => c.value === category);
    return cat?.label || category;
  };

  const isSlaBreached = (ticket: Ticket): boolean => {
    if (ticket.status === 'closed' || ticket.status === 'resolved') return false;
    const created = new Date(ticket.createdAt).getTime();
    const now = Date.now();
    const maxHours = ticket.priority === 'urgent' ? 4 : ticket.priority === 'high' ? 8 : 24;
    return (now - created) > maxHours * 3600000;
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...tickets];
    if (searchText) {
      const kw = searchText.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(kw) ||
        t.ticketNo.toLowerCase().includes(kw)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter);
    }
    const sortDir = sortOrder === 'ascend' ? 1 : -1;
    list.sort((a, b) => {
      const aVal = sortField === 'priority'
        ? ticketPriorities.findIndex(p => p.value === a.priority)
        : new Date(a.createdAt).getTime();
      const bVal = sortField === 'priority'
        ? ticketPriorities.findIndex(p => p.value === b.priority)
        : new Date(b.createdAt).getTime();
      return (aVal - bVal) * sortDir;
    });
    return list;
  }, [tickets, searchText, statusFilter, sortField, sortOrder]);

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
      width: 140,
      sorter: true,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Ticket) => (
        <Space size={4}>
          <span>{text}</span>
          {isSlaBreached(record) && (
            <Tooltip title="SLA超时">
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => getCategoryLabel(category),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: true,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {ticketPriorities.find(p => p.value === priority)?.label}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: Ticket) => (
        <Space size={4}>
          <Tag color={getStatusColor(status)}>
            {ticketStatuses.find(s => s.value === status)?.label}
          </Tag>
          {isSlaBreached(record) && (
            <Tooltip title="SLA超时">
              <Tag color="red" icon={<ClockCircleOutlined />}>超时</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      defaultSortOrder: 'descend' as const,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Ticket) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const handleTableChange = (_pagination: unknown, _filters: unknown, sorter: { field?: string; order?: string }) => {
    if (sorter.field) setSortField(sorter.field as string);
    if (sorter.order) setSortOrder(sorter.order as 'ascend' | 'descend');
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { open: 0, processing: 0, resolved: 0, closed: 0 };
    tickets.forEach(t => { if (t.status in counts) counts[t.status]++; });
    return counts;
  }, [tickets]);

  return (
    <PageContainer
      title="我的工单"
      description="提交和管理您的服务工单，我们的客服团队将尽快为您处理"
      breadcrumb={[{ title: '工单管理' }]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Input
            placeholder="搜索编号或标题"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            placeholder="全部状态"
            options={[
              { label: '全部状态', value: 'all' },
              ...ticketStatuses.map(s => ({ label: s.label, value: s.value })),
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            提交工单
          </Button>
        </Space>
      }
    >
      {/* Status Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: '待处理', count: statusCounts.open, color: '#1677ff' },
          { label: '处理中', count: statusCounts.processing, color: '#fa8c16' },
          { label: '已解决', count: statusCounts.resolved, color: '#52c41a' },
          { label: '已关闭', count: statusCounts.closed, color: '#8c8c8c' },
        ].map(item => (
          <div
            key={item.label}
            style={{
              flex: 1, background: '#fff', borderRadius: 12, padding: '16px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
              borderTop: `3px solid ${item.color}`,
            }}
          >
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: item.color }}>{item.count}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={filteredAndSorted}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          onRow={(record) => ({
            style: {
              background: record.priority === 'urgent'
                ? '#fff2f0'
                : record.priority === 'high'
                  ? '#fff7e6'
                  : undefined,
            },
          })}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, page, pageSize })),
          }}
        />
      </div>

      {/* 创建工单弹窗 */}
      <Modal
        title="提交工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
          <Form.Item name="category" label="工单类别" rules={[{ required: true, message: '请选择类别' }]}>
            <Select placeholder="请选择类别" options={ticketCategories.map(cat => ({ label: cat.label, value: cat.value }))} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
            <Select placeholder="请选择优先级" options={ticketPriorities.map(p => ({ label: p.label, value: p.value }))} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入问题标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={6} placeholder="请详细描述您的问题或建议" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>提交工单</Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 工单详情抽屉 */}
      <Drawer
        title={`工单详情 - ${selectedTicket?.ticketNo || ''}`}
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedTicket && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color={getStatusColor(selectedTicket.status)}>
                  {ticketStatuses.find(s => s.value === selectedTicket.status)?.label}
                </Tag>
                <Tag color={getPriorityColor(selectedTicket.priority)}>
                  {ticketPriorities.find(p => p.value === selectedTicket.priority)?.label}
                </Tag>
                <span style={{ color: '#999' }}>{getCategoryLabel(selectedTicket.category)}</span>
              </Space>
            </div>

            <h3>{selectedTicket.title}</h3>
            <p style={{ color: '#666', lineHeight: 1.8 }}>{selectedTicket.content}</p>

            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 24, paddingTop: 24 }}>
              <h4 style={{ marginBottom: 16 }}>沟通记录</h4>
              {selectedTicket.responses?.map((response: TicketReply) => (
                <div
                  key={response.id}
                  style={{
                    marginBottom: 16, padding: 12,
                    background: response.userRole === 'user' ? '#f6ffed' : '#f0f5ff',
                    borderRadius: 8,
                    borderLeft: `3px solid ${response.userRole === 'user' ? '#52c41a' : '#1890ff'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{response.userName}</strong>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {new Date(response.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p style={{ margin: 0 }}>{response.content}</p>
                </div>
              ))}
              {(!selectedTicket.responses || selectedTicket.responses.length === 0) && (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无沟通记录</div>
              )}
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div style={{ marginTop: 16 }}>
                  <TextArea
                    rows={3}
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder="请输入回复内容..."
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    style={{ marginTop: 8 }}
                    onClick={handleReply}
                    loading={submitting}
                    disabled={!replyContent.trim()}
                  >
                    发送回复
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
