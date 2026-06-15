<<<<<<< HEAD
'use client'

import React, { useState, useMemo, useEffect } from 'react'
=======
'use client';

import React, { useState, useMemo, useEffect } from 'react';
>>>>>>> 962968886be726cd434c792933b5515366d34518
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  InputNumber,
  Select,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Typography,
  Badge,
  Switch,
  Spin,
  Empty,
<<<<<<< HEAD
} from 'antd'
=======
} from 'antd';
>>>>>>> 962968886be726cd434c792933b5515366d34518
import {
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  PlusOutlined,
  SettingOutlined,
  ReloadOutlined,
<<<<<<< HEAD
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Customer {
  id: string
  name: string
  phone: string
  status: 'active' | 'frozen'
  package: 'basic' | 'pro' | 'enterprise'
  features: {
    media: boolean
    recruitment: boolean
    acquisition: boolean
    sharing: boolean
    referral: boolean
  }
  createdAt: string
  expireAt: string
  users: number
  published: number
  acquired: number
  // 计费相关
  monthlyPayment: number  // 当月支付金额
  totalPayment: number    // 累计支付金额
  agentName?: string      // 所属代理商名称
=======
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Customer {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'frozen';
  package: 'basic' | 'pro' | 'enterprise';
  features: {
    media: boolean;
    recruitment: boolean;
    acquisition: boolean;
    sharing: boolean;
    referral: boolean;
  };
  createdAt: string;
  expireAt: string;
  users: number;
  published: number;
  acquired: number;
  // 计费相关
  monthlyPayment: number; // 当月支付金额
  totalPayment: number; // 累计支付金额
  agentName?: string; // 所属代理商名称
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
]
=======
];
>>>>>>> 962968886be726cd434c792933b5515366d34518

// Mock 数据
const mockCustomers: Customer[] = [
  {
    id: '2',
    name: '李总',
    phone: '139****2002',
    status: 'active',
    package: 'pro',
<<<<<<< HEAD
    features: { media: true, recruitment: true, acquisition: false, sharing: true, referral: false },
=======
    features: {
      media: true,
      recruitment: true,
      acquisition: false,
      sharing: true,
      referral: false,
    },
>>>>>>> 962968886be726cd434c792933b5515366d34518
    createdAt: '2024-02-15',
    expireAt: '2025-02-15',
    users: 20,
    published: 580,
    acquired: 0,
    monthlyPayment: 299,
    totalPayment: 3588,
<<<<<<< HEAD
    agentName: '张三代理商'
=======
    agentName: '张三代理商',
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },
  {
    id: '3',
    name: '王老板',
    phone: '137****3003',
    status: 'frozen',
    package: 'basic',
<<<<<<< HEAD
    features: { media: true, recruitment: false, acquisition: false, sharing: false, referral: false },
=======
    features: {
      media: true,
      recruitment: false,
      acquisition: false,
      sharing: false,
      referral: false,
    },
>>>>>>> 962968886be726cd434c792933b5515366d34518
    createdAt: '2024-03-20',
    expireAt: '2024-06-20',
    users: 5,
    published: 45,
    acquired: 0,
    monthlyPayment: 0,
    totalPayment: 897,
<<<<<<< HEAD
    agentName: '李四代理商'
=======
    agentName: '李四代理商',
>>>>>>> 962968886be726cd434c792933b5515366d34518
  },
  {
    id: '5',
    name: '刘总',
    phone: '135****5005',
    status: 'active',
    package: 'pro',
    features: { media: true, recruitment: false, acquisition: true, sharing: true, referral: true },
    createdAt: '2024-04-10',
    expireAt: '2025-04-10',
    users: 12,
    published: 320,
    acquired: 156,
    monthlyPayment: 499,
    totalPayment: 5988,
<<<<<<< HEAD
    agentName: '张三代理商'
  },
]

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editVisible, setEditVisible] = useState(false)
  const [featureVisible, setFeatureVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [featureForm] = Form.useForm()
=======
    agentName: '张三代理商',
  },
];

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editVisible, setEditVisible] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [featureForm] = Form.useForm();
>>>>>>> 962968886be726cd434c792933b5515366d34518

  // 模拟加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
<<<<<<< HEAD
      setCustomers(mockCustomers)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !searchText || c.name.toLowerCase().includes(searchText.toLowerCase()) || c.phone.includes(searchText)
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [customers, searchText, statusFilter])

  const handleToggleStatus = (customer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, status: c.status === 'active' ? 'frozen' : 'active' } : c))
    )
    message.success(`${customer.name} 已${customer.status === 'active' ? '冻结' : '解冻'}`)
  }

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer)
    form.setFieldsValue(customer)
    setEditVisible(true)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      setCustomers((prev) => prev.map((c) => (c.id === editCustomer?.id ? { ...c, ...values } : c)))
      message.success('信息已更新')
      setEditVisible(false)
    })
  }

  const handleDelete = (customer: Customer) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
    message.success(`${customer.name} 已删除`)
  }

  const handleOpenFeatures = (customer: Customer) => {
    setEditCustomer(customer)
    featureForm.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      features: customer.features
    })
    setFeatureVisible(true)
  }

  const handleSaveFeatures = () => {
    featureForm.validateFields().then((values) => {
      setCustomers((prev) => 
        prev.map((c) => c.id === editCustomer?.id ? { ...c, features: values.features } : c)
      )
      message.success('功能权限已更新')
      setFeatureVisible(false)
    })
  }

  const handleOpenCreateModal = () => {
    createForm.resetFields()
=======
      setCustomers(mockCustomers);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        !searchText ||
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.phone.includes(searchText);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, searchText, statusFilter]);

  const handleToggleStatus = (customer: Customer) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === customer.id ? { ...c, status: c.status === 'active' ? 'frozen' : 'active' } : c
      )
    );
    message.success(`${customer.name} 已${customer.status === 'active' ? '冻结' : '解冻'}`);
  };

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    form.setFieldsValue(customer);
    setEditVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      setCustomers(prev => prev.map(c => (c.id === editCustomer?.id ? { ...c, ...values } : c)));
      message.success('信息已更新');
      setEditVisible(false);
    });
  };

  const handleDelete = (customer: Customer) => {
    setCustomers(prev => prev.filter(c => c.id !== customer.id));
    message.success(`${customer.name} 已删除`);
  };

  const handleOpenFeatures = (customer: Customer) => {
    setEditCustomer(customer);
    featureForm.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      features: customer.features,
    });
    setFeatureVisible(true);
  };

  const handleSaveFeatures = () => {
    featureForm.validateFields().then(values => {
      setCustomers(prev =>
        prev.map(c => (c.id === editCustomer?.id ? { ...c, features: values.features } : c))
      );
      message.success('功能权限已更新');
      setFeatureVisible(false);
    });
  };

  const handleOpenCreateModal = () => {
    createForm.resetFields();
>>>>>>> 962968886be726cd434c792933b5515366d34518
    createForm.setFieldsValue({
      status: 'active',
      price: 299,
      priceQuantity: 1,
      priceUnit: 'month',
      expireMonths: 12,
<<<<<<< HEAD
    })
    setCreateVisible(true)
  }

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      const expireValue = values.expireMonths
      const expireAt = expireValue === -1 ? '2099-12-31' : dayjs().add(expireValue, 'month').format('YYYY-MM-DD')
      
      // 根据计费周期计算显示文本
      let unitText = ''
      switch (values.priceUnit) {
        case 'quarter': unitText = '季'; break
        case 'year': unitText = '年'; break
        default: unitText = '月'; break
      }
      
=======
    });
    setCreateVisible(true);
  };

  const handleCreate = () => {
    createForm.validateFields().then(values => {
      const expireValue = values.expireMonths;
      const expireAt =
        expireValue === -1 ? '2099-12-31' : dayjs().add(expireValue, 'month').format('YYYY-MM-DD');

      // 根据计费周期计算显示文本
      let unitText = '';
      switch (values.priceUnit) {
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

>>>>>>> 962968886be726cd434c792933b5515366d34518
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: values.name,
        phone: values.phone,
        status: values.status,
        package: 'basic',
        features: {
          media: true,
          recruitment: false,
          acquisition: false,
          sharing: false,
          referral: false,
        },
        createdAt: dayjs().format('YYYY-MM-DD'),
        expireAt,
        users: 0,
        published: 0,
        acquired: 0,
        monthlyPayment: values.price || 0,
        totalPayment: values.price || 0,
        agentName: values.agentName || '-',
<<<<<<< HEAD
      }
      setCustomers((prev) => [newCustomer, ...prev])
      message.success(`已成功开通：${values.name}，价格 ¥${values.price || 0} × ${values.priceQuantity || 1}${unitText}，登录账号：${values.phone}，初始密码：123456`)
      setCreateVisible(false)
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setCustomers(mockCustomers)
      setLoading(false)
      message.success('数据已刷新')
    }, 500)
  }
=======
      };
      setCustomers(prev => [newCustomer, ...prev]);
      message.success(
        `已成功开通：${values.name}，价格 ¥${values.price || 0} × ${values.priceQuantity || 1}${unitText}，登录账号：${values.phone}，初始密码：123456`
      );
      setCreateVisible(false);
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setCustomers(mockCustomers);
      setLoading(false);
      message.success('数据已刷新');
    }, 500);
  };
>>>>>>> 962968886be726cd434c792933b5515366d34518

  const columns: ColumnsType<Customer> = [
    {
      title: '用户信息',
      key: 'user',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          <div>
            <div style={{ fontWeight: 600, color: '#262626' }}>{record.name}</div>
<<<<<<< HEAD
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
=======
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone}
            </Text>
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </div>
        </Space>
      ),
    },
    {
      title: '代理商',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 120,
<<<<<<< HEAD
      render: (text: string) => text || '-'
=======
      render: (text: string) => text || '-',
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'error'}
          text={status === 'active' ? '正常' : '已冻结'}
        />
      ),
    },
    {
      title: '功能权限',
      key: 'features',
      width: 180,
      render: (_, record) => (
        <Space size={2} wrap>
          {record.features.media && <Tag color="cyan">自媒体</Tag>}
          {record.features.recruitment && <Tag color="purple">招聘</Tag>}
          {record.features.acquisition && <Tag color="orange">获客</Tag>}
        </Space>
      ),
    },
    {
      title: '当月/累计支付',
      key: 'payment',
      width: 140,
      render: (_, record) => (
        <div>
          <div style={{ color: '#52c41a' }}>¥{record.monthlyPayment || 0}</div>
<<<<<<< HEAD
          <Text type="secondary" style={{ fontSize: 12 }}>累计 ¥{record.totalPayment || 0}</Text>
=======
          <Text type="secondary" style={{ fontSize: 12 }}>
            累计 ¥{record.totalPayment || 0}
          </Text>
>>>>>>> 962968886be726cd434c792933b5515366d34518
        </div>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type={record.status === 'active' ? 'default' : 'primary'}
            size="small"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
<<<<<<< HEAD
            style={record.status === 'active' ? {} : { background: '#52c41a', borderColor: '#52c41a' }}
=======
            style={
              record.status === 'active' ? {} : { background: '#52c41a', borderColor: '#52c41a' }
            }
>>>>>>> 962968886be726cd434c792933b5515366d34518
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenFeatures(record)}
          >
            功能
          </Button>
        </Space>
      ),
    },
<<<<<<< HEAD
  ]

  const stats = useMemo(() => {
    const total = customers.length
    const active = customers.filter((c) => c.status === 'active').length
    const frozen = customers.filter((c) => c.status === 'frozen').length
    const totalUsers = customers.reduce((sum, c) => sum + c.users, 0)
    return { total, active, frozen, totalUsers }
  }, [customers])
=======
  ];

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === 'active').length;
    const frozen = customers.filter(c => c.status === 'frozen').length;
    const totalUsers = customers.reduce((sum, c) => sum + c.users, 0);
    return { total, active, frozen, totalUsers };
  }, [customers]);
>>>>>>> 962968886be726cd434c792933b5515366d34518

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
<<<<<<< HEAD
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>终端客户管理</Title>
          <Text type="secondary">管理所有终端客户，开通账号、设置功能权限、冻结/解冻</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
=======
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
            终端客户管理
          </Title>
          <Text type="secondary">管理所有终端客户，开通账号、设置功能权限、冻结/解冻</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
>>>>>>> 962968886be726cd434c792933b5515366d34518
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            开通客户
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
<<<<<<< HEAD
            <Statistic 
              title="客户总数" 
              value={stats.total} 
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />} 
=======
            <Statistic
              title="客户总数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
>>>>>>> 962968886be726cd434c792933b5515366d34518
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
<<<<<<< HEAD
            <Statistic 
              title="正常" 
              value={stats.active} 
=======
            <Statistic
              title="正常"
              value={stats.active}
>>>>>>> 962968886be726cd434c792933b5515366d34518
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>户</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
<<<<<<< HEAD
            <Statistic 
              title="已冻结" 
              value={stats.frozen} 
=======
            <Statistic
              title="已冻结"
              value={stats.frozen}
>>>>>>> 962968886be726cd434c792933b5515366d34518
              valueStyle={{ color: '#ff4d4f' }}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>户</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
<<<<<<< HEAD
            <Statistic 
              title="总用户数" 
              value={stats.totalUsers} 
=======
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
>>>>>>> 962968886be726cd434c792933b5515366d34518
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
<<<<<<< HEAD
            <Input.Search 
              placeholder="搜索姓名或手机号" 
              onChange={(e) => setSearchText(e.target.value)} 
=======
            <Input.Search
              placeholder="搜索姓名或手机号"
              onChange={e => setSearchText(e.target.value)}
>>>>>>> 962968886be726cd434c792933b5515366d34518
              style={{ width: 220 }}
              allowClear
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            />
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="all">全部状态</Option>
              <Option value="active">正常</Option>
              <Option value="frozen">已冻结</Option>
            </Select>
          </Space>
        </div>

        <Spin spinning={loading}>
<<<<<<< HEAD
          <Table 
            columns={columns} 
            dataSource={filteredCustomers} 
            rowKey="id" 
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            locale={{
              emptyText: (
                <Empty 
=======
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条记录`,
            }}
            locale={{
              emptyText: (
                <Empty
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      {searchText || statusFilter !== 'all' ? '未找到匹配的客户' : '暂无客户数据'}
                    </span>
                  }
                >
                  {!searchText && statusFilter === 'all' && (
<<<<<<< HEAD
                    <Button type="primary" onClick={handleOpenCreateModal}>开通第一个客户</Button>
                  )}
                </Empty>
              )
=======
                    <Button type="primary" onClick={handleOpenCreateModal}>
                      开通第一个客户
                    </Button>
                  )}
                </Empty>
              ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
            }}
          />
        </Spin>
      </Card>

      {/* 编辑基本信息 */}
      <Modal
        title="编辑客户信息"
        open={editVisible}
        onOk={handleSave}
        onCancel={() => setEditVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
<<<<<<< HEAD
          <Form.Item name="name" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号码' }]}>
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          <Form.Item name="expireMonths" label="有效时间" rules={[{ required: true, message: '请选择有效时间' }]}>
            <Select placeholder="选择有效时间">
              {expireOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
=======
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号码' }]}
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          <Form.Item
            name="expireMonths"
            label="有效时间"
            rules={[{ required: true, message: '请选择有效时间' }]}
          >
            <Select placeholder="选择有效时间">
              {expireOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
>>>>>>> 962968886be726cd434c792933b5515366d34518
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 设置功能权限 */}
      <Modal
        title="功能权限设置"
        open={featureVisible}
        onOk={handleSaveFeatures}
        onCancel={() => setFeatureVisible(false)}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={featureForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户姓名">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="features" label="功能权限" style={{ marginBottom: 0 }}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
<<<<<<< HEAD
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
=======
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  <Space>
                    <Tag color="cyan">自媒体</Tag>
                    <Text>自媒体运营</Text>
                  </Space>
                  <Form.Item name={['features', 'media']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
<<<<<<< HEAD
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
=======
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  <Space>
                    <Tag color="purple">招聘</Tag>
                    <Text>招聘助手</Text>
                  </Space>
                  <Form.Item name={['features', 'recruitment']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
<<<<<<< HEAD
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
=======
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  <Space>
                    <Tag color="orange">获客</Tag>
                    <Text>智能获客</Text>
                  </Space>
                  <Form.Item name={['features', 'acquisition']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
<<<<<<< HEAD
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
=======
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  <Space>
                    <Tag color="green">分享</Tag>
                    <Text>推荐分享</Text>
                  </Space>
                  <Form.Item name={['features', 'sharing']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
<<<<<<< HEAD
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
=======
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                  }}
                >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                  <Space>
                    <Tag color="gold">转介</Tag>
                    <Text>转介绍</Text>
                  </Space>
                  <Form.Item name={['features', 'referral']} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Space>
            </Card>
          </Form.Item>
        </Form>
      </Modal>

      {/* 开通客户 */}
      <Modal
        title="开通终端客户"
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
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
<<<<<<< HEAD
              { min: 2, max: 20, message: '用户名长度2-20个字符' }
=======
              { min: 2, max: 20, message: '用户名长度2-20个字符' },
>>>>>>> 962968886be726cd434c792933b5515366d34518
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号码（登录账号）"
            rules={[
              { required: true, message: '请输入手机号码' },
<<<<<<< HEAD
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
=======
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
>>>>>>> 962968886be726cd434c792933b5515366d34518
            ]}
          >
            <Input placeholder="请输入11位手机号码" maxLength={11} />
          </Form.Item>

<<<<<<< HEAD
          <Form.Item
            name="agentName"
            label="所属代理商"
          >
=======
          <Form.Item name="agentName" label="所属代理商">
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Select placeholder="请选择代理商（可选）" allowClear>
              <Option value="张三代理商">张三代理商</Option>
              <Option value="李四代理商">李四代理商</Option>
            </Select>
          </Form.Item>

<<<<<<< HEAD
          <Form.Item
            label="价格"
          >
=======
          <Form.Item label="价格">
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Space.Compact>
              <Form.Item name="price" noStyle rules={[{ required: true, message: '请输入价格' }]}>
                <Input type="number" prefix="¥" placeholder="金额" min={0} style={{ width: 120 }} />
              </Form.Item>
<<<<<<< HEAD
              <Form.Item name="priceQuantity" noStyle rules={[{ required: true, message: '请输入时间' }]}>
                <InputNumber placeholder="时间" min={1} style={{ width: 80 }} />
              </Form.Item>
              <Form.Item name="priceUnit" noStyle rules={[{ required: true, message: '请选择单位' }]}>
=======
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
>>>>>>> 962968886be726cd434c792933b5515366d34518
                <Select style={{ width: 80 }} defaultValue="month">
                  <Option value="month">月</Option>
                  <Option value="quarter">季</Option>
                  <Option value="year">年</Option>
                </Select>
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="expireMonths"
            label="有效时间"
            rules={[{ required: true, message: '请选择有效时间' }]}
          >
            <Select placeholder="请选择">
              {expireOptions.map(opt => (
<<<<<<< HEAD
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
=======
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
>>>>>>> 962968886be726cd434c792933b5515366d34518
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="初始状态" initialValue="active">
            <Select>
              <Option value="active">正常</Option>
              <Option value="frozen">冻结</Option>
            </Select>
          </Form.Item>

          <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Space>
              <Tag color="green">提示</Tag>
              <Text type="secondary">
<<<<<<< HEAD
                登录账号：手机号码<br />
=======
                登录账号：手机号码
                <br />
>>>>>>> 962968886be726cd434c792933b5515366d34518
                初始密码：<span style={{ color: '#faad14' }}>123456</span>（用户自行修改）
              </Text>
            </Space>
          </Card>
        </Form>
      </Modal>
    </div>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
