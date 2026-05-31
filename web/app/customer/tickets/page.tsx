'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Card, Drawer, Space } from 'antd';
import { PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { TicketAPI, ticketCategories, ticketPriorities, ticketStatuses } from '@/services/ticket';

const { TextArea } = Input;
const { Option } = Select;

export default function CustomerTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await TicketAPI.list({
        userId: user?.id,
        page: pagination.page,
        pageSize: pagination.pageSize
      });
      if (res.data) {
        setTickets(res.data);
        if (res.pagination) {
          setPagination(prev => ({ ...prev, total: res.pagination.total }));
        }
      }
    } catch (error) {
      console.error('获取工单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await TicketAPI.create({
        userId: user?.id || '',
        title: values.title,
        content: values.content,
        category: values.category,
        priority: values.priority
      });
      if (res.success) {
        message.success('工单提交成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchTickets();
      }
    } catch (error: any) {
      message.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (ticket: any) => {
    setSelectedTicket(ticket);
    setDetailDrawerVisible(true);
    
    // 获取完整详情
    try {
      const res = await TicketAPI.detail(ticket.id);
      if (res.data) {
        setSelectedTicket(res.data);
      }
    } catch (error) {
      console.error('获取详情失败:', error);
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
        content: replyContent
      });
      if (res.success) {
        message.success('回复成功');
        setReplyContent('');
        // 刷新详情
        const detailRes = await TicketAPI.detail(selectedTicket.id);
        if (detailRes.data) {
          setSelectedTicket(detailRes.data);
        }
      }
    } catch (error: any) {
      message.error(error.message || '回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusInfo = ticketStatuses.find(s => s.value === status);
    return statusInfo?.color || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const priorityInfo = ticketPriorities.find(p => p.value === priority);
    return priorityInfo?.color || 'default';
  };

  const getCategoryLabel = (category: string) => {
    const cat = ticketCategories.find(c => c.value === category);
    return cat?.label || category;
  };

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
      width: 140,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => getCategoryLabel(category)
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {ticketPriorities.find(p => p.value === priority)?.label}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {ticketStatuses.find(s => s.value === status)?.label}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="我的工单"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            提交工单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, pageSize }));
              fetchTickets();
            }
          }}
        />
      </Card>

      {/* 创建工单弹窗 */}
      <Modal
        title="提交工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
          <Form.Item
            name="category"
            label="工单类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select placeholder="请选择类别">
              {ticketCategories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              {ticketPriorities.map(p => (
                <Option key={p.value} value={p.value}>{p.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入问题标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="请详细描述您的问题或建议" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交工单
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
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
                <span style={{ color: '#999' }}>
                  {getCategoryLabel(selectedTicket.category)}
                </span>
              </Space>
            </div>

            <h3>{selectedTicket.title}</h3>
            <p style={{ color: '#666', lineHeight: 1.8 }}>{selectedTicket.content}</p>
            
            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 24, paddingTop: 24 }}>
              <h4 style={{ marginBottom: 16 }}>沟通记录</h4>
              
              {selectedTicket.responses?.map((response: any) => (
                <div
                  key={response.id}
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: response.userRole === 'user' ? '#f6ffed' : '#f0f5ff',
                    borderRadius: 8,
                    borderLeft: `3px solid ${response.userRole === 'user' ? '#52c41a' : '#1890ff'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{response.userName}</strong>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {new Date(response.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0 }}>{response.content}</p>
                </div>
              ))}

              {(!selectedTicket.responses || selectedTicket.responses.length === 0) && (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                  暂无沟通记录
                </div>
              )}

              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div style={{ marginTop: 16 }}>
                  <TextArea
                    rows={3}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
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
    </div>
  );
}
