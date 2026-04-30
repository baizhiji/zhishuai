'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Statistic,
  Row,
  Col,
  Typography,
  Avatar,
  Dropdown,
  Switch,
  Popconfirm,
  Tooltip,
  Badge
} from 'antd'
import {
  UserAddOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
  DownloadOutlined,
  ReloadOutlined,
  MessageOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

// 客户类型定义
interface Client {
  id: string
  name: string
  phone: string
  company: string
  package: string
  expireDate: string
  status: 'active' | 'frozen' | 'expired'
  features: string[]
  referralCount: number
  createdAt: string
  lastLogin: string
}

// Mock 数据
const mockClients: Client[] = [
  {
    id: '1',
    name: '张经理',
    phone: '138****1234',
    company: '上海某科技有限公司',
    package: '专业版',
    expireDate: '2025-06-15',
    status: 'active',
    features: ['自媒体运营', '招聘助手', '智能获客', '推荐分享'],
    referralCount: 12,
    createdAt: '2024-03-15',
    lastLogin: '2025-04-28 14:30'
  },
  {
    id: '2',
    name: '李总监',
    phone: '139****5678',
    company: '杭州某网络公司',
    package: '旗舰版',
    expireDate: '2025-08-20',
    status: 'active',
    features: ['自媒体运营', '招聘助手', '智能获客', '推荐分享'],
    referralCount: 28,
    createdAt: '2024-01-20',
    lastLogin: '2025-04-29 09:15'
  },
  {
    id: '3',
    name: '王主管',
    phone: '137****9012',
    company: '北京某文化传媒',
    package: '基础版',
    expireDate: '2025-05-01',
    status: 'active',
    features: ['自媒体运营', '招聘助手'],
    referralCount: 5,
    createdAt: '2024-06-10',
    lastLogin: '2025-04-27 16:45'
  },
  {
    id: '4',
    name: '刘经理',
    phone: '136****3456',
    company: '深圳某电商公司',
    package: '专业版',
    expireDate: '2025-04-10',
    status: 'expired',
    features: ['自媒体运营', '智能获客', '推荐分享'],
    referralCount: 8,
    createdAt: '2024-04-05',
    lastLogin: '2025-04-10 11:20'
  },
  {
    id: '5',
    name: '陈总',
    phone: '135****7890',
    company: '广州某信息科技',
    package: '旗舰版',
    expireDate: '2025-09-30',
    status: 'active',
    features: ['自媒体运营', '招聘助手', '智能获客', '推荐分享'],
    referralCount: 35,
    createdAt: '2023-12-01',
    lastLogin: '2025-04-29 10:00'
  }
]

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [packageFilter, setPackageFilter] = useState<string>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [detailClient, setDetailClient] = useState<Client | null>(null)
  const [form] = Form.useForm()

  // 统计
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    frozen: clients.filter(c => c.status === 'frozen').length,
    expired: clients.filter(c => c.status === 'expired').length
  }

  // 筛选数据
  const filteredClients = clients.filter(client => {
    const matchesSearch = searchText === '' || 
      client.name.includes(searchText) ||
      client.phone.includes(searchText) ||
      client.company.includes(searchText)
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    const matchesPackage = packageFilter === 'all' || client.package === packageFilter
    return matchesSearch && matchesStatus && matchesPackage
  })

  // 表格列
  const columns = [
    {
      title: '客户信息',
      key: 'info',
      render: (_: any, record: Client) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.company}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '套餐',
      dataIndex: 'package',
      key: 'package',
      render: (pkg: string) => {
        const colors: Record<string, string> = {
          '旗舰版': 'gold',
          '专业版': 'blue',
          '基础版': 'default'
        }
        return <Tag color={colors[pkg]}>{pkg}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '正常' },
          frozen: { color: 'warning', text: '已冻结' },
          expired: { color: 'error', text: '已到期' }
        }
        return <Badge status={config[status].color as any} text={config[status].text} />
      }
    },
    {
      title: '功能',
      key: 'features',
      render: (_: any, record: Client) => (
        <Space size={4} wrap>
          {record.features.slice(0, 2).map(f => (
            <Tag key={f} style={{ fontSize: 11 }}>{f}</Tag>
          ))}
          {record.features.length > 2 && (
            <Tooltip title={record.features.slice(2).join('、')}>
              <Tag>+{record.features.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '到期日期',
      dataIndex: 'expireDate',
      key: 'expireDate',
      render: (date: string, record: Client) => {
        const isNear = dayjs(date).diff(dayjs(), 'day') <= 7 && record.status === 'active'
        return (
          <Text type={isNear ? 'danger' : undefined}>
            {date}
            {isNear && <Tag color="red" style={{ marginLeft: 4 }}>即将到期</Tag>}
          </Text>
        )
      }
    },
    {
      title: '推荐数',
      dataIndex: 'referralCount',
      key: 'referralCount',
      render: (count: number) => (
        <Tag color="cyan">{count}人</Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (time: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{time}</Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Client) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: '查看详情',
            onClick: () => {
              setDetailClient(record)
              setDetailVisible(true)
            }
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑信息',
            onClick: () => {
              setEditingClient(record)
              form.setFieldsValue(record)
              setModalVisible(true)
            }
          },
          {
            key: 'features',
            icon: <CheckCircleOutlined />,
            label: '功能开关',
            onClick: () => {
              message.info('跳转到功能开关管理')
            }
          },
          { type: 'divider' },
          record.status === 'active' ? {
            key: 'freeze',
            icon: <LockOutlined />,
            label: '冻结账号',
            danger: true,
            onClick: () => handleStatusChange(record.id, 'frozen')
          } : {
            key: 'unfreeze',
            icon: <UnlockOutlined />,
            label: '解冻账号',
            onClick: () => handleStatusChange(record.id, 'active')
          },
          { type: 'divider' },
          {
            key: 'resetPwd',
            icon: <LockOutlined />,
            label: '重置密码',
            onClick: () => handleResetPassword(record.id)
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除账号',
            danger: true,
            disabled: record.referralCount > 0
          }
        ]

        return (
          <Space>
            <Button type="link" size="small" onClick={() => {
              setDetailClient(record)
              setDetailVisible(true)
            }}>
              详情
            </Button>
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        )
      }
    }
  ]

  // 状态变更
  const handleStatusChange = (id: string, status: 'active' | 'frozen') => {
    setClients(clients.map(c => c.id === id ? { ...c, status } : c))
    message.success(status === 'active' ? '账号已解冻' : '账号已冻结')
  }

  // 重置密码
  const handleResetPassword = (id: string) => {
    Modal.confirm({
      title: '确认重置密码',
      icon: <ExclamationCircleOutlined />,
      content: '确定要重置该账号的密码吗？密码将被重置为：123456',
      onOk: () => {
        message.success('密码已重置为 123456')
      }
    })
  }

  // 批量操作
  const handleBatchAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择客户')
      return
    }
    message.info(`批量${action} ${selectedRowKeys.length} 个客户`)
  }

  // 导出
  const handleExport = () => {
    message.success('正在导出客户数据...')
  }

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingClient) {
        setClients(clients.map(c => 
          c.id === editingClient.id ? { ...c, ...values } : c
        ))
        message.success('客户信息已更新')
      } else {
        const newClient: Client = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          features: ['自媒体运营', '招聘助手'],
          referralCount: 0,
          createdAt: dayjs().format('YYYY-MM-DD'),
          lastLogin: '-'
        }
        setClients([newClient, ...clients])
        message.success('客户账号已创建')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">客户管理</Title>
        <Text type="secondary">管理名下所有终端客户账号、功能权限和套餐</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Statistic 
              title="客户总数" 
              value={stats.total} 
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="正常" 
              value={stats.active} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已冻结" 
              value={stats.frozen} 
              prefix={<LockOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已到期" 
              value={stats.expired} 
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card className="mb-4">
        <Space wrap className="mb-4">
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => {
            setEditingClient(null)
            form.resetFields()
            setModalVisible(true)
          }}>
            新建客户
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => setLoading(true)}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
          <Select 
            placeholder="批量操作" 
            style={{ width: 120 }} 
            onChange={handleBatchAction}
            value={undefined}
          >
            <Option value="freeze">批量冻结</Option>
            <Option value="unfreeze">批量解冻</Option>
            <Option value="export">批量导出</Option>
          </Select>
        </Space>

        <Space wrap className="mb-4">
          <Input 
            placeholder="搜索客户名称/手机/公司" 
            prefix={<SearchOutlined />} 
            style={{ width: 200 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select 
            placeholder="客户状态" 
            style={{ width: 120 }} 
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">全部状态</Option>
            <Option value="active">正常</Option>
            <Option value="frozen">已冻结</Option>
            <Option value="expired">已到期</Option>
          </Select>
          <Select 
            placeholder="套餐类型" 
            style={{ width: 120 }} 
            value={packageFilter}
            onChange={setPackageFilter}
          >
            <Option value="all">全部套餐</Option>
            <Option value="旗舰版">旗舰版</Option>
            <Option value="专业版">专业版</Option>
            <Option value="基础版">基础版</Option>
          </Select>
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredClients}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
          loading={loading}
          pagination={{
            total: filteredClients.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingClient ? '编辑客户' : '新建客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="客户姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="company" label="公司名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="package" label="套餐类型" rules={[{ required: true }]}>
            <Select>
              <Option value="旗舰版">旗舰版</Option>
              <Option value="专业版">专业版</Option>
              <Option value="基础版">基础版</Option>
            </Select>
          </Form.Item>
          <Form.Item name="expireDate" label="到期日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="客户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="edit" type="primary" onClick={() => {
            setDetailVisible(false)
            if (detailClient) {
              setEditingClient(detailClient)
              form.setFieldsValue(detailClient)
              setModalVisible(true)
            }
          }}>
            编辑
          </Button>
        ]}
        width={600}
      >
        {detailClient && (
          <div>
            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text type="secondary">客户姓名</Text>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{detailClient.name}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">手机号</Text>
                <div>{detailClient.phone}</div>
              </Col>
            </Row>
            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text type="secondary">公司名称</Text>
                <div>{detailClient.company}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">套餐类型</Text>
                <div>{detailClient.package}</div>
              </Col>
            </Row>
            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text type="secondary">账号状态</Text>
                <div>
                  <Badge 
                    status={detailClient.status === 'active' ? 'success' : detailClient.status === 'frozen' ? 'warning' : 'error'} 
                    text={detailClient.status === 'active' ? '正常' : detailClient.status === 'frozen' ? '已冻结' : '已到期'} 
                  />
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">到期日期</Text>
                <div>{detailClient.expireDate}</div>
              </Col>
            </Row>
            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text type="secondary">注册时间</Text>
                <div>{detailClient.createdAt}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">最后登录</Text>
                <div>{detailClient.lastLogin}</div>
              </Col>
            </Row>
            <div className="mb-4">
              <Text type="secondary">已开通功能</Text>
              <div className="mt-2">
                {detailClient.features.map(f => (
                  <Tag key={f} color="blue">{f}</Tag>
                ))}
              </div>
            </div>
            <div>
              <Text type="secondary">推荐用户</Text>
              <div className="mt-2">
                <Tag color="cyan">{detailClient.referralCount} 人</Tag>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
