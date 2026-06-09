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
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  Timeline,
  Avatar,
  DatePicker,
  Tabs,
  Badge,
  Progress,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  TagsOutlined,
  RobotOutlined,
  BellOutlined,
  BarChartOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import Link from 'next/link';
import {
  getMyCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowUps,
  addFollowUp,
  getMyStats,
  Customer,
  CustomerStats,
} from '@/services/crm';
import { getTags, updateCustomerTags } from '@/services/crm-advanced';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  potential: { label: '潜在', color: 'default' },
  active: { label: '活跃', color: 'success' },
  inactive: { label: '不活跃', color: 'warning' },
};

// 等级映射
const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  A: { label: 'A级', color: 'red' },
  B: { label: 'B级', color: 'orange' },
  C: { label: 'C级', color: 'blue' },
  D: { label: 'D级', color: 'default' },
};

// 来源映射
const SOURCE_MAP: Record<string, string> = {
  referral: '转介绍',
  marketing: '营销获客',
  cold_call: '电话拓展',
  exhibition: '展会活动',
  other: '其他',
};

// 跟进类型
const FOLLOWUP_TYPE_MAP: Record<string, { label: string; color: string }> = {
  call: { label: '电话', color: 'blue' },
  visit: { label: '拜访', color: 'green' },
  wechat: { label: '微信', color: 'cyan' },
  email: { label: '邮件', color: 'purple' },
  other: { label: '其他', color: 'default' },
};

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>();
  const [filterStatus, setFilterStatus] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [followUpForm] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
    fetchStats();
    fetchTags();
  }, [pagination.page, searchKeyword, filterLevel, filterStatus]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getMyCustomers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword,
        level: filterLevel,
        status: filterStatus,
      });
      setCustomers(res.data?.list || []);
      setPagination(prev => ({ ...prev, total: res.data?.total || 0 }));
    } catch (error) {
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getMyStats();
      setStats(res.data);
    } catch (error) {
      console.error('获取统计失败');
    }
  };

  const fetchTags = async () => {
    try {
      const res = await getTags();
      setTags(res.data || []);
    } catch (error) {
      console.error('获取标签失败');
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success('删除成功');
      fetchCustomers();
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, values);
        message.success('更新成功');
      } else {
        await createCustomer(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchCustomers();
      fetchStats();
    } catch (error) {
      // 表单验证或API错误
    }
  };

  const handleViewDetail = async (record: Customer) => {
    setSelectedCustomer(record);
    setDetailVisible(true);
    try {
      const res = await getFollowUps(record.id);
      setFollowUps(res.data || []);
    } catch (error) {
      console.error('获取跟进记录失败');
    }
  };

  const handleAddFollowUp = async () => {
    try {
      const values = await followUpForm.validateFields();
      await addFollowUp(selectedCustomer!.id, values);
      message.success('添加成功');
      followUpForm.resetFields();
      const res = await getFollowUps(selectedCustomer!.id);
      setFollowUps(res.data || []);
      fetchStats();
    } catch (error) {
      // 表单验证或API错误
    }
  };

  const handleTagClick = async (customerId: string, tagId: string, customerTags: string[]) => {
    try {
      const hasTag = customerTags.includes(tagId);
      if (hasTag) {
        await updateCustomerTags(customerId, [tagId], 'remove');
      } else {
        await updateCustomerTags(customerId, [tagId], 'add');
      }
      fetchCustomers();
    } catch (error) {
      message.error('更新标签失败');
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: '客户信息',
      key: 'info',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone || '无手机号'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const config = LEVEL_MAP[level] || LEVEL_MAP.D;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const config = STATUS_MAP[status] || STATUS_MAP.potential;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tagsStr: string, record) => {
        const customerTags: string[] = tagsStr ? JSON.parse(tagsStr) : [];
        const displayTags = customerTags.slice(0, 2);
        const moreCount = customerTags.length - 2;
        return (
          <Space wrap>
            {displayTags.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <Tag
                  key={tagId}
                  color={tag.color}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTagClick(record.id, tagId, customerTags)}
                >
                  {tag.name}
                </Tag>
              ) : null;
            })}
            {moreCount > 0 && <Tag>+{moreCount}</Tag>}
            <Tag
              style={{ cursor: 'pointer', borderStyle: 'dashed' }}
              onClick={() => handleViewDetail(record)}
            >
              + 添加
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => SOURCE_MAP[source] || source || '-',
    },
    {
      title: '最近跟进',
      dataIndex: 'lastFollowUpAt',
      key: 'lastFollowUpAt',
      width: 120,
      render: (date: string) => {
        if (!date) return <Text type="secondary">未跟进</Text>;
        const days = dayjs().diff(dayjs(date), 'day');
        if (days > 7) return <Text type="danger">{days}天未跟进</Text>;
        if (days > 3) return <Text type="warning">{days}天</Text>;
        return <Text type="secondary">{days}天</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
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
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="客户总数" value={stats?.totalCustomers || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃客户"
              value={stats?.activeCustomers || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="超期未跟进"
              value={stats?.overdueFollowUps || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
              suffix={`/ ${stats?.totalCustomers || 0}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月新增"
              value={stats?.newThisMonth || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<PlusOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能入口 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Link href="/customer/crm/public-pool">
              <Space direction="vertical" style={{ width: '100%' }}>
                <WarningOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                <Text>公海池</Text>
                <Text type="secondary">{stats?.publicPoolCount || 0} 客户</Text>
              </Space>
            </Link>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Link href="/customer/crm/tags">
              <Space direction="vertical" style={{ width: '100%' }}>
                <TagsOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <Text>标签管理</Text>
                <Text type="secondary">{tags.length} 个标签</Text>
              </Space>
            </Link>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Link href="/customer/crm/automation">
              <Space direction="vertical" style={{ width: '100%' }}>
                <RobotOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                <Text>自动化规则</Text>
                <Text type="secondary">智能跟进</Text>
              </Space>
            </Link>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Link href="/customer/crm/reminders">
              <Space direction="vertical" style={{ width: '100%' }}>
                <BellOutlined style={{ fontSize: 24, color: '#f5222d' }} />
                <Text>提醒管理</Text>
                <Text type="secondary">{stats?.pendingReminders || 0} 待处理</Text>
              </Space>
            </Link>
          </Card>
        </Col>
      </Row>

      {/* 客户列表 */}
      <Card
        title="客户列表"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索客户"
              onSearch={setSearchKeyword}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="客户等级"
              allowClear
              onChange={setFilterLevel}
              style={{ width: 120 }}
              options={Object.entries(LEVEL_MAP).map(([value, config]) => ({
                value,
                label: config.label,
              }))}
            />
            <Select
              placeholder="客户状态"
              allowClear
              onChange={setFilterStatus}
              style={{ width: 120 }}
              options={Object.entries(STATUS_MAP).map(([value, config]) => ({
                value,
                label: config.label,
              }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建客户
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={customers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => setPagination({ page, pageSize, total: pagination.total }),
          }}
        />
      </Card>

      {/* 新建/编辑客户 */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新建客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号码">
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label="客户等级">
                <Select
                  placeholder="请选择"
                  options={Object.entries(LEVEL_MAP).map(([value, config]) => ({
                    value,
                    label: config.label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="客户状态">
                <Select
                  placeholder="请选择"
                  options={Object.entries(STATUS_MAP).map(([value, config]) => ({
                    value,
                    label: config.label,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source" label="客户来源">
                <Select
                  placeholder="请选择"
                  options={Object.entries(SOURCE_MAP).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="company" label="公司">
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户详情抽屉 */}
      <Drawer
        title="客户详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={600}
      >
        {selectedCustomer && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <Descriptions column={2}>
                    <Descriptions.Item label="名称">{selectedCustomer.name}</Descriptions.Item>
                    <Descriptions.Item label="手机">{selectedCustomer.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="微信">{selectedCustomer.wechat || '-'}</Descriptions.Item>
                    <Descriptions.Item label="公司">{selectedCustomer.company || '-'}</Descriptions.Item>
                    <Descriptions.Item label="职位">{selectedCustomer.position || '-'}</Descriptions.Item>
                    <Descriptions.Item label="等级">
                      <Tag color={LEVEL_MAP[selectedCustomer.level || 'D']?.color}>
                        {LEVEL_MAP[selectedCustomer.level || 'D']?.label}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={STATUS_MAP[selectedCustomer.status]?.color}>
                        {STATUS_MAP[selectedCustomer.status]?.label}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="来源">{SOURCE_MAP[selectedCustomer.source] || '-'}</Descriptions.Item>
                    <Descriptions.Item label="备注" span={2}>{selectedCustomer.remark || '-'}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'followup',
                label: '跟进记录',
                children: (
                  <>
                    <Form form={followUpForm} layout="inline" style={{ marginBottom: 16 }}>
                      <Form.Item name="type" rules={[{ required: true }]}>
                        <Select placeholder="跟进方式" style={{ width: 120 }}
                          options={Object.entries(FOLLOWUP_TYPE_MAP).map(([value, config]) => ({
                            value,
                            label: config.label,
                          }))}
                        />
                      </Form.Item>
                      <Form.Item name="content" rules={[{ required: true, message: '请输入跟进内容' }]}>
                        <Input placeholder="跟进内容" style={{ width: 300 }} />
                      </Form.Item>
                      <Button type="primary" onClick={handleAddFollowUp}>添加</Button>
                    </Form>
                    <Timeline
                      items={followUps.map(item => ({
                        color: FOLLOWUP_TYPE_MAP[item.type]?.color || 'blue',
                        children: (
                          <div>
                            <Tag color={FOLLOWUP_TYPE_MAP[item.type]?.color}>
                              {FOLLOWUP_TYPE_MAP[item.type]?.label}
                            </Tag>
                            <Text>{item.content}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(item.createdAt).toLocaleString('zh-CN')}
                            </Text>
                          </div>
                        ),
                      }))}
                    />
                  </>
                ),
              },
              {
                key: 'tags',
                label: '标签管理',
                children: (
                  <Space wrap>
                    {tags.map(tag => {
                      const customerTags: string[] = selectedCustomer.tags ? JSON.parse(selectedCustomer.tags) : [];
                      const hasTag = customerTags.includes(tag.id);
                      return (
                        <Tag
                          key={tag.id}
                          color={hasTag ? tag.color : undefined}
                          style={{ cursor: 'pointer', padding: '4px 12px' }}
                          onClick={() => handleTagClick(selectedCustomer.id, tag.id, customerTags)}
                        >
                          {hasTag ? '✓ ' : '+ '}{tag.name}
                        </Tag>
                      );
                    })}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
