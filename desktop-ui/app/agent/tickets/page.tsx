'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Typography, Table, Tag, Space,
  Button, Modal, Form, Input, Select, App, Drawer, Tooltip,
  Timeline, Avatar, Popconfirm,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, SearchOutlined, ReloadOutlined, SendOutlined,
  TeamOutlined, ExclamationCircleOutlined, FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '@/contexts/AuthContext';
import { TicketAPI, ticketCategories, ticketPriorities, ticketStatuses } from '@/services/ticket';
import PageContainer from '@/components/agent/PageContainer';

const { TextArea } = Input;

interface TicketResponse {
  id: string;
  ticketId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

interface TicketData {
  id: string;
  ticketNo: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: { phone: string; name?: string; company?: string };
  responses?: TicketResponse[];
}

const cardBase: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
  border: '1px solid #f0f0f0',
};

export default function AgentTicketPage() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TicketAPI.list({
        agentId: user?.id,
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      const data = res as unknown as {
        success?: boolean;
        data?: TicketData[];
        pagination?: { total: number };
      };
      if (data?.data) {
        setTickets(data.data);
        if (data.pagination) {
          setPagination(prev => ({ ...prev, total: data.pagination!.total }));
        }
      } else {
        setTickets([]);
      }
    } catch (err: any) {
      console.error('获取工单列表失败', err);
      message.error(err?.message || '获取工单列表失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id, pagination.page, pagination.pageSize, statusFilter, categoryFilter, message]);

  useEffect(() => {
    if (user?.id) fetchTickets();
  }, [user?.id, pagination.page, pagination.pageSize]);

  // 当筛选条件变化时重新请求
  useEffect(() => {
    if (user?.id) {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchTickets();
    }
  }, [statusFilter, categoryFilter]);

  const handleViewDetail = async (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setDrawerVisible(true);
    setDetailLoading(true);
    try {
      const res = await TicketAPI.detail(ticket.id);
      const data = res as unknown as { data?: TicketData };
      if (data?.data) setSelectedTicket(data.data);
    } catch {
      message.error('获取工单详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await TicketAPI.updateStatus(ticketId, { status });
      message.success(status === 'resolved' ? '工单已标记为已解决' : '工单已关闭');
      setDrawerVisible(false);
      fetchTickets();
    } catch (err: any) {
      message.error(err?.message || '状态更新失败');
    }
  };

  const handleAssign = async (ticketId: string) => {
    try {
      await TicketAPI.updateStatus(ticketId, {
        status: 'processing',
        assigneeId: user?.id,
        assigneeName: user?.name || user?.phone || '代理商',
      });
      message.success('已接单，工单处理中');
      fetchTickets();
      // 刷新详情
      const res = await TicketAPI.detail(ticketId);
      const data = res as unknown as { data?: TicketData };
      if (data?.data) setSelectedTicket(data.data);
    } catch (err: any) {
      message.error(err?.message || '接单失败');
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return;
    setReplySubmitting(true);
    try {
      await TicketAPI.reply(selectedTicket.id, {
        userId: user?.id || '',
        userName: user?.name || user?.phone || '代理商',
        userRole: 'agent',
        content: replyContent,
        isInternal: false,
      });
      message.success('回复成功');
      setReplyContent('');
      const res = await TicketAPI.detail(selectedTicket.id);
      const data = res as unknown as { data?: TicketData };
      if (data?.data) setSelectedTicket(data.data);
    } catch (err: any) {
      message.error(err?.message || '回复失败');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleInternalNote = async () => {
    if (!replyContent.trim() || !selectedTicket) return;
    setReplySubmitting(true);
    try {
      await TicketAPI.reply(selectedTicket.id, {
        userId: user?.id || '',
        userName: user?.name || user?.phone || '代理商',
        userRole: 'agent',
        content: replyContent,
        isInternal: true,
      });
      message.success('内部备注已添加');
      setReplyContent('');
      const res = await TicketAPI.detail(selectedTicket.id);
      const data = res as unknown as { data?: TicketData };
      if (data?.data) setSelectedTicket(data.data);
    } catch (err: any) {
      message.error(err?.message || '添加失败');
    } finally {
      setReplySubmitting(false);
    }
  };

  const getStatusTag = (status: string) => {
    const s = ticketStatuses.find(t => t.value === status);
    const icons: Record<string, React.ReactNode> = {
      pending: <ClockCircleOutlined />,
      processing: <SyncOutlined spin />,
      resolved: <CheckCircleOutlined />,
      closed: <CloseCircleOutlined />,
    };
    return (
      <Tag color={s?.color || 'default'} icon={icons[status]}>
        {s?.label || status}
      </Tag>
    );
  };

  const getPriorityTag = (priority: string) => {
    const p = ticketPriorities.find(t => t.value === priority);
    return <Tag color={p?.color || 'default'}>{p?.label || priority}</Tag>;
  };

  const getCategoryLabel = (category: string) => {
    const c = ticketCategories.find(t => t.value === category);
    return c?.label || category;
  };

  const isSlaBreached = (ticket: TicketData): boolean => {
    if (ticket.status === 'closed' || ticket.status === 'resolved') return false;
    const created = new Date(ticket.createdAt).getTime();
    const now = Date.now();
    const maxHours = ticket.priority === 'high' ? 4 : ticket.priority === 'medium' ? 8 : 24;
    return (now - created) > maxHours * 3600000;
  };

  // 统计数据
  const stats = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, processing: 0, resolved: 0, closed: 0 };
    tickets.forEach(t => { if (t.status in counts) counts[t.status]++; });
    return counts;
  }, [tickets]);

  // 筛选
  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    if (searchText) {
      const kw = searchText.toLowerCase();
      list = list.filter(t =>
        t.ticketNo?.toLowerCase().includes(kw) ||
        t.title?.toLowerCase().includes(kw) ||
        t.user?.name?.toLowerCase().includes(kw) ||
        t.user?.phone?.includes(kw)
      );
    }
    return list;
  }, [tickets, searchText]);

  const columns: ColumnsType<TicketData> = [
    {
      title: '工单编号',
      dataIndex: 'ticketNo',
      width: 130,
      sorter: true,
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (text: string, record: TicketData) => (
        <Space size={4}>
          <a onClick={() => handleViewDetail(record)}>{text}</a>
          {isSlaBreached(record) && (
            <Tooltip title="SLA超时">
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 140,
      render: (_: unknown, record: TicketData) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user?.name || '未设置昵称'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.user?.phone}</div>
        </div>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      width: 100,
      render: (cat: string) => getCategoryLabel(cat),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (p: string) => getPriorityTag(p),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => getStatusTag(s),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (d: string) => new Date(d).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: TicketData) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleAssign(record.id)}
            >
              接单
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="工单处理"
      description="管理客户提交的工单，审批功能开通申请，处理技术支持请求"
      breadcrumb={[{ title: '工单处理' }]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Input
            placeholder="搜索编号/标题/申请人"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            options={[
              { label: '全部状态', value: 'all' },
              ...ticketStatuses.map(s => ({ label: s.label, value: s.value })),
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 130 }}
            options={[
              { label: '全部分类', value: 'all' },
              ...ticketCategories.map(c => ({ label: c.label, value: c.value })),
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchTickets}>
            刷新
          </Button>
        </Space>
      }
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...cardBase, borderTop: '3px solid #6d28d9' }} styles={{ body: { padding: '16px 24px' } }}>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#6d28d9' }} />}
              valueStyle={{ color: '#6d28d9' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...cardBase, borderTop: '3px solid #fa8c16' }} styles={{ body: { padding: '16px 24px' } }}>
            <Statistic
              title="处理中"
              value={stats.processing}
              prefix={<SyncOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...cardBase, borderTop: '3px solid #52c41a' }} styles={{ body: { padding: '16px 24px' } }}>
            <Statistic
              title="已解决"
              value={stats.resolved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...cardBase, borderTop: '3px solid #8c8c8c' }} styles={{ body: { padding: '16px 24px' } }}>
            <Statistic
              title="已关闭"
              value={stats.closed}
              prefix={<CloseCircleOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 工单表格 */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 8 }}>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条工单`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, page, pageSize })),
          }}
          onRow={(record) => ({
            style: {
              background: record.priority === 'high'
                ? '#fff2f0'
                : isSlaBreached(record)
                  ? '#fffbe6'
                  : undefined,
            },
          })}
        />
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <span>工单详情</span>
            {selectedTicket && getStatusTag(selectedTicket.status)}
          </Space>
        }
        placement="right"
        width={640}
        open={drawerVisible}
        onClose={() => { setDrawerVisible(false); setReplyContent(''); }}
        loading={detailLoading}
      >
        {selectedTicket && (
          <div>
            {/* 基本信息 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                工单编号：{selectedTicket.ticketNo}
              </div>
              <Typography.Title level={4} style={{ margin: '0 0 12px' }}>
                {selectedTicket.title}
              </Typography.Title>
              <Space size={8} style={{ marginBottom: 12 }}>
                {getPriorityTag(selectedTicket.priority)}
                <Tag>{getCategoryLabel(selectedTicket.category)}</Tag>
              </Space>
              <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, lineHeight: 1.8 }}>
                {selectedTicket.content}
              </div>
            </div>

            {/* 申请人信息 */}
            <Card size="small" style={{ marginBottom: 20, background: '#fafafa' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <Avatar icon={<TeamOutlined />} />
                <div>
                  <div style={{ fontWeight: 500 }}>{selectedTicket.user?.name || '未设置昵称'}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{selectedTicket.user?.phone}</div>
                  {selectedTicket.user?.company && (
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{selectedTicket.user.company}</div>
                  )}
                </div>
              </div>
            </Card>

            {/* 操作按钮 */}
            <div style={{ marginBottom: 20 }}>
              <Space>
                {selectedTicket.status === 'pending' && (
                  <Button type="primary" onClick={() => handleAssign(selectedTicket.id)}>
                    接单处理
                  </Button>
                )}
                {(selectedTicket.status === 'pending' || selectedTicket.status === 'processing') && (
                  <>
                    <Button
                      type="primary"
                      style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    >
                      <CheckCircleOutlined /> 标记已解决
                    </Button>
                    <Popconfirm
                      title="确定关闭此工单？"
                      onConfirm={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                    >
                      <Button danger>
                        <CloseCircleOutlined /> 关闭工单
                      </Button>
                    </Popconfirm>
                  </>
                )}
              </Space>
            </div>

            {/* 沟通记录 */}
            <Typography.Title level={5} style={{ marginBottom: 16 }}>
              沟通记录
            </Typography.Title>
            {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
              <Timeline
                items={selectedTicket.responses.map((r, idx) => ({
                  color: r.isInternal ? 'orange' : r.userRole === 'agent' ? 'blue' : 'green',
                  children: (
                    <div key={r.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Space size={4}>
                          <strong>{r.userName}</strong>
                          <Tag style={{ fontSize: 10, lineHeight: '16px' }}>
                            {r.userRole === 'agent' ? '代理商' : '客户'}
                          </Tag>
                          {r.isInternal && (
                            <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px' }}>
                              内部备注
                            </Tag>
                          )}
                        </Space>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {new Date(r.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: 12,
                          background: r.isInternal ? '#fffbe6' : r.userRole === 'agent' ? '#f0f5ff' : '#f6ffed',
                          borderRadius: 8,
                          borderLeft: `3px solid ${r.isInternal ? '#faad14' : r.userRole === 'agent' ? '#6d28d9' : '#52c41a'}`,
                          lineHeight: 1.8,
                        }}
                      >
                        {r.content}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无沟通记录</div>
            )}

            {/* 回复区域 */}
            {selectedTicket.status !== 'closed' && (
              <div style={{ marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
                <Typography.Title level={5} style={{ marginBottom: 12 }}>
                  回复客户
                </Typography.Title>
                <TextArea
                  rows={4}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="请输入回复内容..."
                />
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleReply}
                    loading={replySubmitting}
                    disabled={!replyContent.trim()}
                  >
                    发送回复
                  </Button>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={handleInternalNote}
                    loading={replySubmitting}
                    disabled={!replyContent.trim()}
                  >
                    添加内部备注
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
