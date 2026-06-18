'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  InputNumber,
  Modal,
  Form,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Typography,
  Spin,
  Empty,
  message,
  Divider,
  Descriptions,
  Checkbox,
  Select,
} from 'antd';
import {
  LockOutlined,
  UnlockOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import request from '@/lib/request';
import type { ApiResponse } from '@/types/api';

const { Title, Text, Paragraph } = Typography;

interface Customer {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'frozen';
  features: string[];
  createdAt: string;
  expireAt: string;
  users?: number;
  published?: number;
  acquired?: number;
  userId?: string;
  balance?: number;
}

// 到期时间选项
const expireOptions = [
  { value: 1, label: '1个月' },
  { value: 3, label: '3个月' },
  { value: 6, label: '6个月' },
  { value: 12, label: '1年' },
  { value: 24, label: '2年' },
  { value: 36, label: '3年' },
  { value: -1, label: '永久' },
];

// 功能列表
const allFeatures = [
  { key: 'media', name: '自媒体运营' },
  { key: 'recruitment', name: '招聘助手' },
  { key: 'acquisition', name: '智能获客' },
  { key: 'referral', name: '转介绍' },
  { key: 'share', name: '推荐分享' },
];

export default function AgentTenantsPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  // 加载客户列表
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await request.get<ApiResponse<{ data: Customer[]; pagination: any }>>(
        '/admin/customers',
        {
          params: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            keyword: searchText,
          },
        }
      );
      if (res.data) {
        const customersData = ((res.data as any).data as any[]).map((c: any) => ({
          id: c.id,
          name: c.name || c.user?.name || '未知',
          phone: c.user?.phone || '',
          status: c.status === 'frozen' ? 'frozen' : 'active',
          features: c.features || [],
          createdAt: c.user?.createdAt ? dayjs(c.user.createdAt).format('YYYY-MM-DD') : '',
          expireAt: c.expireAt || '',
          users: c._count?.users || 0,
          userId: c.userId,
        }));
        setCustomers(customersData as any);
        if ((res.data as any).pagination) {
          setPagination(prev => ({
            ...prev,
            total: (res.data as any).pagination?.total || 0,
          }));
        }
      }
    } catch (error: any) {
      message.error('加载客户列表失败: ' + (error.message || '未知错误'));
      // 如果API不存在，使用空数据
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCustomers();
  };

  // 搜索过滤
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      c =>
        !searchText ||
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.phone.includes(searchText)
    );
  }, [customers, searchText]);

  // 创建客户
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const { expireMonths, price, priceQuantity, priceUnit, ...rest } = values;

      // 根据计费周期计算显示文本
      let unitText = '';
      switch (priceUnit) {
        case 'quarter':
          unitText = '季';
          break;
        case 'year':
          unitText = '年';
          break;
        default:
          unitText = '月';
          break;
      }

      await request.post('/admin/customers', {
        ...rest,
        password: '123456',
        price,
        priceQuantity,
        priceUnit,
        expireMonths,
      });

      message.success(
        `已开通客户账号：${values.name}，价格 ¥${price || 0} × ${priceQuantity || 1}${unitText}，登录账号：${values.phone}，初始密码：123456`
      );
      setCreateVisible(false);
      createForm.resetFields();
      loadCustomers();
    } catch (error: any) {
      if (!error.errorFields) {
        message.error('创建客户失败: ' + (error.message || '未知错误'));
      }
    }
  };

  // 冻结/解冻
  const handleToggleStatus = async (customer: Customer) => {
    try {
      const newStatus = customer.status === 'active' ? 'frozen' : 'active';
      await request.put(`/admin/customers/${customer.id}`, { status: newStatus });
      message.success(`${customer.name} 已${newStatus === 'active' ? '解冻' : '冻结'}`);
      loadCustomers();
    } catch (error: any) {
      message.error('操作失败: ' + (error.message || '未知错误'));
    }
  };

  // 删除客户
  const handleDelete = async (customer: Customer) => {
    try {
      await request.delete(`/admin/customers/${customer.id}`);
      message.success('删除成功');
      loadCustomers();
    } catch (error: any) {
      message.error('删除失败: ' + (error.message || '未知错误'));
    }
  };

  // 查看详情
  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailVisible(true);
  };

  // 打开功能设置
  const handleOpenFeatures = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedFeatures(customer.features || []);
    setFeatureVisible(true);
  };

  // 保存功能设置
  const handleSaveFeatures = async () => {
    try {
      if (!selectedCustomer) return;

      await request.put(`/admin/customers/${selectedCustomer.id}/features`, {
        features: selectedFeatures,
      });

      message.success('功能开关已更新');
      setFeatureVisible(false);
      loadCustomers();
    } catch (error: any) {
      message.error('保存失败: ' + (error.message || '未知错误'));
    }
  };

  // 获取功能标签
  const getFeatureTags = (features: string[]) => (
    <Space size={4} wrap>
      {allFeatures.map(f => (
        <Tag key={f.key} color={features?.includes?.(f.key) ? 'blue' : 'default'}>
          {f.name}
        </Tag>
      ))}
    </Space>
  );

  const columns: ColumnsType<Customer> = [
    {
      title: '客户',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ fontSize: 20, color: '#722ed1' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '开通功能',
      dataIndex: 'features',
      key: 'features',
      width: 350,
      render: (features: string[]) => getFeatureTags(features),
    },
    {
      title: '到期时间',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 120,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD') : '永久'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '正常' : '已冻结'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenFeatures(record)}
          >
            功能
          </Button>
          <Button
            type="text"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Popconfirm title="确定删除该客户？" onConfirm={() => handleDelete(record)}>
            <Button type="text" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === 'active').length;
    const totalUsers = customers.reduce((sum, c) => sum + (c.users || 0), 0);
    return { total, active, totalUsers };
  }, [customers]);

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            客户管理
          </Title>
          <Text type="secondary">管理名下客户账号，设置功能开关</Text>
        </div>
        <Space>
          <Input.Search
            placeholder="搜索客户名称/手机号"
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadCustomers}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              createForm.setFieldsValue({
                expireMonths: 12,
                price: 299,
                priceQuantity: 1,
                priceUnit: 'month',
              });
              setCreateVisible(true);
            }}
          >
            开通客户
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="客户总数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="正常"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>个</span>}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="子账号总数"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card>
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredCustomers}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: total => `共 ${total} 条记录`,
              onChange: (page, pageSize) => {
                setPagination({ page, pageSize, total: pagination.total });
              },
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span>{searchText ? '未找到匹配的客户' : '暂无客户数据'}</span>}
                >
                  {!searchText && (
                    <Button type="primary" onClick={() => setCreateVisible(true)}>
                      开通第一个客户
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />
        </Spin>
      </Card>

      {/* 开通客户弹窗 */}
      <Modal
        title="开通客户"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okText="确认开通"
        cancelText="取消"
        width={500}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号码（登录账号）"
            rules={[{ required: true, message: '请输入手机号码' }]}
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          <Form.Item label="价格">
            <Space.Compact>
              <Form.Item name="price" noStyle rules={[{ required: true, message: '请输入价格' }]}>
                <Input type="number" prefix="¥" placeholder="金额" min={0} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item
                name="priceQuantity"
                noStyle
                rules={[{ required: true, message: '请输入时间' }]}
              >
                <InputNumber placeholder="时间" min={1} style={{ width: 80 }} />
              </Form.Item>
              <Form.Item
                name="priceUnit"
                noStyle
                rules={[{ required: true, message: '请选择单位' }]}
              >
                <Select style={{ width: 80 }} defaultValue="month">
                  <Select.Option value="month">月</Select.Option>
                  <Select.Option value="quarter">季</Select.Option>
                  <Select.Option value="year">年</Select.Option>
                </Select>
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="expireMonths"
            label="有效时间"
            rules={[{ required: true, message: '请选择有效时间' }]}
          >
            <Select placeholder="选择有效时间">
              {expireOptions.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Card size="small" style={{ background: '#f5f5f5' }}>
            <Text type="secondary">
              <UserOutlined /> 登录账号：手机号码
              <br />
              <LockOutlined /> 初始密码：123456（客户自行修改）
            </Text>
          </Card>
        </Form>
      </Modal>

      {/* 功能设置弹窗 */}
      <Modal
        title="设置客户功能开关"
        open={featureVisible}
        onOk={handleSaveFeatures}
        onCancel={() => setFeatureVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        {selectedCustomer && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="客户名称">{selectedCustomer.name}</Descriptions.Item>
              <Descriptions.Item label="手机号码">{selectedCustomer.phone}</Descriptions.Item>
            </Descriptions>
            <Divider>选择该客户可使用的功能</Divider>
            <Checkbox.Group
              value={selectedFeatures}
              onChange={values => setSelectedFeatures(values as string[])}
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]}>
                {allFeatures.map(f => (
                  <Col span={12} key={f.key}>
                    <Checkbox value={f.key}>{f.name}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="客户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedCustomer && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="客户名称" span={2}>
              <Space>
                <TeamOutlined style={{ color: '#722ed1' }} />
                {selectedCustomer.name}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="手机号码">{selectedCustomer.phone}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedCustomer.status === 'active' ? 'green' : 'orange'}>
                {selectedCustomer.status === 'active' ? '正常' : '已冻结'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedCustomer.createdAt}</Descriptions.Item>
            <Descriptions.Item label="到期时间">
              {selectedCustomer.expireAt
                ? dayjs(selectedCustomer.expireAt).format('YYYY-MM-DD')
                : '永久'}
            </Descriptions.Item>
            <Descriptions.Item label="开通功能" span={2}>
              {getFeatureTags(selectedCustomer.features)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
