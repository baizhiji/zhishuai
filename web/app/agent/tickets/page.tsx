'use client';

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Timeline,
  Avatar,
  Popconfirm,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  MessageOutlined,
  UserOutlined,
  FileTextOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// 工单类型
interface Ticket {
  key: string;
  id: string;
  title: string;
  type: string;
  customer: string;
  company: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  createTime: string;
  updateTime: string;
  description: string;
}

// Mock 数据 - 已移除，改为 API 获取

export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // 从 API 加载工单
  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { default: request } = await import('@/utils/request');
      const res = await request.get('/api/tickets', { params: { status: activeTab === 'all' ? undefined : activeTab } });
      const data = Array.isArray(res) ? res : (res?.data || res?.tickets || []);
      setTickets(data.map((t: any) => ({
        key: t.id || t.key,
        id: t.id,
        title: t.title,
        type: t.type || 'feature',
        customer: t.customer || t.customerName || '',
        company: t.company || t.companyName || '',
        status: t.status || 'pending',
        priority: t.priority || 'medium',
        createTime: t.createTime || t.createdAt || '',
        updateTime: t.updateTime || t.updatedAt || '',
        description: t.description || '',
      })));
    } catch (error) {
      console.error('获取工单失败:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // 审批通过 - 调用 API
  const handleApprove = async (ticket: Ticket) => {
    try {
      const { default: request } = await import('@/utils/request');
      await request.put(`/api/tickets/${ticket.id}/approve`);
      message.success(`已通过申请：${ticket.title}`);
      setDetailVisible(false);
      fetchTickets();
    } catch (error) {
      message.error('审批操作失败');
    }
  };

  // 审批拒绝 - 调用 API
  const handleReject = async (ticket: Ticket, reason: string) => {
    try {
      const { default: request } = await import('@/utils/request');
      await request.put(`/api/tickets/${ticket.id}/reject`, { reason });
      message.info(`已拒绝申请：${ticket.title}`);
      setDetailVisible(false);
      fetchTickets();
    } catch (error) {
      message.error('审批操作失败');
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined /> },
    };
    const item = map[status];
    return (
      <Tag color={item.color} icon={item.icon}>
        {item.text}
      </Tag>
    );
  };

  // 获取类型标签
  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      feature: { color: 'blue', text: '功能申请' },
      quota: { color: 'purple', text: '额度申请' },
      tech: { color: 'cyan', text: '技术支持' },
    };
    const item = map[type];
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  // 获取优先级标签
  const getPriorityTag = (priority: string) => {
    const map: Record<string, { color: string; text: string }> = {
      low: { color: 'default', text: '低' },
      medium: { color: 'orange', text: '中' },
      high: { color: 'red', text: '高' },
    };
    const item = map[priority];
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const columns: ColumnsType<Ticket> = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Ticket) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <Space size={4} className="mt-1">
            {getTypeTag(record.type)}
            {getPriorityTag(record.priority)}
          </Space>
        </div>
      ),
    },
    {
      title: '申请人',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.company}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '已通过', value: 'approved' },
        { text: '已拒绝', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => handleApprove(record)}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => handleReject(record, '')}
                style={{ color: '#ff4d4f' }}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          工单/申请处理
        </Title>
        <Text type="secondary">接收客户的功能开通申请，审批通过或拒绝</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 工单列表 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'pending', label: `待处理 (${stats.pending})` },
            { key: 'approved', label: `已通过 (${stats.approved})` },
            { key: 'rejected', label: `已拒绝 (${stats.rejected})` },
            { key: 'all', label: '全部' },
          ]}
        />
        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredTickets}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="工单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          selectedTicket?.status === 'pending' ? (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>取消</Button>
              <Button
                danger
                onClick={() => {
                  form.validateFields().then(values => {
                    handleReject(selectedTicket, values.reason);
                  });
                }}
              >
                拒绝
              </Button>
              <Button type="primary" onClick={() => handleApprove(selectedTicket)}>
                通过
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setDetailVisible(false)}>关闭</Button>
          )
        }
        width={700}
      >
        {selectedTicket && (
          <div>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="工单编号">
                    <Text code>{selectedTicket.id}</Text>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="状态">{getStatusTag(selectedTicket.status)}</Form.Item>
                </Col>
              </Row>

              <Form.Item label="标题">
                <Text strong>{selectedTicket.title}</Text>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="申请人">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {selectedTicket.customer}
                    </Space>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="公司">
                    <Text>{selectedTicket.company}</Text>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="申请类型">{getTypeTag(selectedTicket.type)}</Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="优先级">{getPriorityTag(selectedTicket.priority)}</Form.Item>
                </Col>
              </Row>

              <Form.Item label="申请说明">
                <div
                  style={{
                    padding: 12,
                    background: '#f5f5f5',
                    borderRadius: 4,
                  }}
                >
                  {selectedTicket.description}
                </div>
              </Form.Item>

              {selectedTicket.status === 'pending' && (
                <Form.Item name="reason" label="拒绝原因（拒绝时必填）">
                  <Input.TextArea rows={3} placeholder="请输入拒绝原因" />
                </Form.Item>
              )}
            </Form>

            {/* 处理历史 */}
            {selectedTicket.status !== 'pending' && (
              <div className="mt-4">
                <Title level={5}>处理历史</Title>
                <Timeline
                  items={ticketHistory.map(item => ({
                    color: item.action.includes('通过')
                      ? 'green'
                      : item.action.includes('拒绝')
                        ? 'red'
                        : 'blue',
                    children: (
                      <div>
                        <Text strong>{item.action}</Text>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.operator} · {item.time}
                          </Text>
                        </div>
                      </div>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
