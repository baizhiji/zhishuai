'use client';

/**
 * 管理员 CRM 客户管理
 * 平台级客户管理视图
 */

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
  Divider,
  DatePicker,
  InputNumber,
  Tabs,
  Timeline,
  Avatar,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ExportOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowUps,
  addFollowUp,
  getCustomerStats,
  exportCustomers,
  Customer,
  FollowUpRecord,
  CustomerStats,
} from '@/services/crm-admin';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  potential: { label: '潜在客户', color: 'default' },
  active: { label: '活跃客户', color: 'success' },
  inactive: { label: '不活跃', color: 'warning' },
  lost: { label: '已流失', color: 'error' },
};

// 等级映射
const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  vip: { label: 'VIP', color: 'red' },
  normal: { label: '普通', color: 'blue' },
  trial: { label: '试用', color: 'orange' },
};

// 跟进类型
const FOLLOWUP_TYPE_MAP: Record<string, { label: string; color: string }> = {
  call: { label: '电话', color: 'blue' },
  visit: { label: '拜访', color: 'green' },
  wechat: { label: '微信', color: 'cyan' },
  email: { label: '邮件', color: 'purple' },
  other: { label: '其他', color: 'default' },
};

export default function AdminCRMPage() {
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
      const res = await getCustomers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword || undefined,
        status: filterStatus || undefined,
        level: filterLevel || undefined,
      });
      setCustomers(res.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.total || 0,
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
      const res = await getCustomerStats();
      setStats(res);
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
      setFollowUps(res.list || []);
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

  // 导出客户
  const handleExport = async () => {
    try {
      const blob = await exportCustomers({
        keyword: searchKeyword || undefined,
        status: filterStatus || undefined,
        level: filterLevel || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('导出成功');
    } catch (error: any) {
      message.error(error?.message || '导出失败');
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
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <div>
            <div>{record.name || record.phone}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      width: 150,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_MAP[status]?.color}>
          {STATUS_MAP[status]?.label}
        </Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={LEVEL_MAP[level]?.color}>
          {LEVEL_MAP[level]?.label}
        </Tag>
      ),
    },
    {
      title: '累计付费',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      width: 100,
      render: (val: number) => (
        <Text strong style={{ color: '#f5222d' }}>
          ¥{val?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: '最后联系',
      dataIndex: 'lastContactAt',
      key: 'lastContactAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
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
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该客户？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
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
      <Title level={4}>客户管理</Title>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="客户总数"
                value={stats.totalCustomers}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="本月新增"
                value={stats.newThisMonth}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="活跃客户"
                value={stats.activeCustomers}
                prefix={<Badge status="success" />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="流失客户"
                value={stats.lostCustomers}
                prefix={<FallOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="总营收"
                value={stats.totalRevenue}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="转化率"
                value={stats.conversionRate}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索客户名称/手机/公司"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="客户状态"
            value={filterStatus || undefined}
            onChange={val => {
              setFilterStatus(val || '');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            allowClear
            style={{ width: 120 }}
          >
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="客户等级"
            value={filterLevel || undefined}
            onChange={val => {
              setFilterLevel(val || '');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            allowClear
            style={{ width: 100 }}
          >
            {Object.entries(LEVEL_MAP).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增客户
          </Button>
        </Space>
      </Card>

      {/* 客户列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, pageSize }));
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
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号码"
                rules={[{ required: true, message: '请输入手机号码' }]}
              >
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company" label="公司名称">
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="industry" label="所属行业">
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="客户来源">
                <Select placeholder="请选择">
                  <Select.Option value="referral">转介绍</Select.Option>
                  <Select.Option value="online">线上推广</Select.Option>
                  <Select.Option value="offline">线下活动</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="客户状态">
                <Select placeholder="请选择">
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <Select.Option key={key} value={key}>{val.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="客户等级">
                <Select placeholder="请选择">
                  {Object.entries(LEVEL_MAP).map(([key, val]) => (
                    <Select.Option key={key} value={key}>{val.label}</Select.Option>
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
        width={700}
      >
        {selectedCustomer && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="客户名称" span={1}>
                      {selectedCustomer.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="手机号码" span={1}>
                      {selectedCustomer.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="公司名称" span={1}>
                      {selectedCustomer.company || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="邮箱" span={1}>
                      {selectedCustomer.email || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="所属行业" span={1}>
                      {selectedCustomer.industry || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="客户来源" span={1}>
                      {selectedCustomer.source || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="客户状态" span={1}>
                      <Tag color={STATUS_MAP[selectedCustomer.status]?.color}>
                        {STATUS_MAP[selectedCustomer.status]?.label}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="客户等级" span={1}>
                      <Tag color={LEVEL_MAP[selectedCustomer.level]?.color}>
                        {LEVEL_MAP[selectedCustomer.level]?.label}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="累计付费" span={2}>
                      <Text strong style={{ color: '#f5222d' }}>
                        ¥{selectedCustomer.totalPaid?.toLocaleString() || 0}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间" span={1}>
                      {dayjs(selectedCustomer.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="最后联系" span={1}>
                      {selectedCustomer.lastContactAt
                        ? dayjs(selectedCustomer.lastContactAt).format('YYYY-MM-DD HH:mm')
                        : '-'}
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
                          <Input style={{ width: 300 }} placeholder="请输入跟进内容" />
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
