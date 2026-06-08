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
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getMyCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowUps,
  addFollowUp,
  getMyStats,
  Customer,
  FollowUpRecord,
  CustomerStats,
} from '@/services/crm';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  potential: { label: '潜在客户', color: 'default' },
  active: { label: '活跃客户', color: 'success' },
  inactive: { label: '不活跃', color: 'warning' },
  lost: { label: '已流失', color: 'error' },
};

// 等级映射
const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  A: { label: 'A级(重点)', color: 'red' },
  B: { label: 'B级(优质)', color: 'orange' },
  C: { label: 'C级(普通)', color: 'blue' },
  D: { label: 'D级(观望)', color: 'default' },
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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [form] = Form.useForm();
  const [followUpForm] = Form.useForm();

  // 初始加载
  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  // 获取客户列表
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getMyCustomers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword || undefined,
        status: filterStatus || undefined,
        level: filterLevel || undefined,
      });
      setCustomers(res.data?.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.total || 0,
      }));
    } catch (error: any) {
      message.error(error?.message || '获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const res = await getMyStats();
      setStats(res.data);
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  // 新增客户
  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setCustomerModalVisible(true);
  };

  // 编辑客户
  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue({
      ...record,
    });
    setCustomerModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, values);
        message.success('客户更新成功');
      } else {
        await createCustomer(values);
        message.success('客户创建成功');
      }
      setCustomerModalVisible(false);
      fetchCustomers();
      fetchStats();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
    }
  };

  // 删除客户
  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success('删除成功');
      fetchCustomers();
      fetchStats();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  // 查看详情
  const handleViewDetail = async (record: Customer) => {
    setSelectedCustomer(record);
    setDetailDrawerVisible(true);
    fetchFollowUps(record.id);
  };

  // 获取跟进记录
  const fetchFollowUps = async (customerId: string) => {
    setFollowUpsLoading(true);
    try {
      const res = await getFollowUps(customerId);
      setFollowUps(res.data?.list || []);
    } catch (error) {
      console.error('获取跟进记录失败', error);
    } finally {
      setFollowUpsLoading(false);
    }
  };

  // 添加跟进记录
  const handleAddFollowUp = async () => {
    if (!selectedCustomer) return;
    try {
      const values = await followUpForm.validateFields();
      await addFollowUp(selectedCustomer.id, values);
      message.success('添加跟进记录成功');
      followUpForm.resetFields();
      fetchFollowUps(selectedCustomer.id);
      fetchStats();
    } catch (error: any) {
      message.error(error?.message || '添加失败');
    }
  };

  // 表格列
  const columns: ColumnsType<Customer> = [
    {
      title: '客户信息',
      key: 'customer',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone || '-'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      render: (company: string) => company || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_MAP[status]?.color}>{STATUS_MAP[status]?.label || status}</Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={LEVEL_MAP[level]?.color}>{LEVEL_MAP[level]?.label || level}</Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => SOURCE_MAP[source] || source || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该客户?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>客户管理</Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="我的客户总数"
              value={stats?.totalCustomers || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月新增"
              value={stats?.newThisMonth || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃客户"
              value={stats?.activeCustomers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="潜在客户"
              value={stats?.potentialCustomers || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索客户名称/手机号"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="客户状态"
            value={filterStatus || undefined}
            onChange={val => setFilterStatus(val || '')}
            style={{ width: 120 }}
            allowClear
          >
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="客户等级"
            value={filterLevel || undefined}
            onChange={val => setFilterLevel(val || '')}
            style={{ width: 120 }}
            allowClear
          >
            {Object.entries(LEVEL_MAP).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={() => {
            setSearchKeyword('');
            setFilterStatus('');
            setFilterLevel('');
          }}>
            重置
          </Button>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增客户
          </Button>
        </div>
      </Card>

      {/* 客户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, pageSize }));
              fetchCustomers();
            },
          }}
        />
      </Card>

      {/* 新增/编辑客户弹窗 */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={customerModalVisible}
        onOk={handleSubmit}
        onCancel={() => setCustomerModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="wechat" label="微信">
                <Input placeholder="请输入微信号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="company" label="公司">
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position" label="职位">
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="客户等级" initialValue="C">
                <Select>
                  {Object.entries(LEVEL_MAP).map(([key, val]) => (
                    <Select.Option key={key} value={key}>{val.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="客户状态" initialValue="potential">
                <Select>
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <Select.Option key={key} value={key}>{val.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="客户来源">
                <Select placeholder="请选择">
                  {Object.entries(SOURCE_MAP).map(([key, val]) => (
                    <Select.Option key={key} value={key}>{val}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户详情抽屉 */}
      <Drawer
        title="客户详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={600}
      >
        {selectedCustomer && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="客户名称" span={1}>
                      {selectedCustomer.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="手机号" span={1}>
                      {selectedCustomer.phone || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="微信号" span={1}>
                      {selectedCustomer.wechat || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="公司" span={1}>
                      {selectedCustomer.company || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="职位" span={1}>
                      {selectedCustomer.position || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="客户等级" span={1}>
                      <Tag color={LEVEL_MAP[selectedCustomer.level]?.color}>
                        {LEVEL_MAP[selectedCustomer.level]?.label || selectedCustomer.level}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="客户状态" span={1}>
                      <Tag color={STATUS_MAP[selectedCustomer.status]?.color}>
                        {STATUS_MAP[selectedCustomer.status]?.label}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="客户来源" span={1}>
                      {SOURCE_MAP[selectedCustomer.source || ''] || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间" span={2}>
                      {dayjs(selectedCustomer.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="备注" span={2}>
                      {selectedCustomer.remark || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'followup',
                label: '跟进记录',
                children: (
                  <>
                    <Card size="small" style={{ marginBottom: 16 }}>
                      <Form form={followUpForm} layout="inline">
                        <Form.Item name="type" label="跟进方式" rules={[{ required: true }]}>
                          <Select style={{ width: 100 }}>
                            {Object.entries(FOLLOWUP_TYPE_MAP).map(([key, val]) => (
                              <Select.Option key={key} value={key}>{val.label}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}>
                          <Input style={{ width: 280 }} placeholder="请输入跟进内容" />
                        </Form.Item>
                        <Button type="primary" onClick={handleAddFollowUp}>
                          添加
                        </Button>
                      </Form>
                    </Card>
                    <Timeline
                      items={followUps.map(item => ({
                        color: FOLLOWUP_TYPE_MAP[item.type]?.color || 'blue',
                        children: (
                          <div>
                            <Space>
                              <Tag color={FOLLOWUP_TYPE_MAP[item.type]?.color}>
                                {FOLLOWUP_TYPE_MAP[item.type]?.label}
                              </Tag>
                              <Text type="secondary">
                                {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                              </Text>
                            </Space>
                            <div style={{ marginTop: 4 }}>{item.content}</div>
                            {item.nextPlan && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                下一步计划：{item.nextPlan}
                              </Text>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  </>
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
