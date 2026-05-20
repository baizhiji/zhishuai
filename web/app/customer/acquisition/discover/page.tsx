'use client'

import { useState, useMemo } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Space, Button, Input, Select, Form, Modal, Progress, Badge, Avatar, Tabs, Statistic, message, Popconfirm } from 'antd'
import { SearchOutlined, PlusOutlined, EnvironmentOutlined, UserOutlined, MessageOutlined, StarOutlined, FilterOutlined, SortAscendingOutlined, PhoneOutlined, WechatOutlined, AimOutlined, WomanOutlined, ManOutlined, RobotOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface PotentialCustomer {
  id: string
  name: string
  avatar?: string
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili'
  platformName: string
  gender: 'male' | 'female' | 'unknown'
  age: number
  location: string
  industry: string
  interest: string
  intentLevel: 'high' | 'medium' | 'low'
  intentScore: number
  contactStatus: 'uncontacted' | 'contacted' | 'responded' | 'converted'
  lastActivity: string
  followers: number
  bio: string
  contactPhone?: string
  wechat?: string
  tags: string[]
  note?: string
  discoveredAt: string
  source: string
}

export default function DiscoverPage() {
  const [searchText, setSearchText] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [intentFilter, setIntentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<PotentialCustomer | null>(null)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const [customers] = useState<PotentialCustomer[]>([
    {
      id: '1',
      name: '创业达人小王',
      platform: 'douyin',
      platformName: '抖音',
      gender: 'male',
      age: 28,
      location: '上海浦东',
      industry: '创业投资',
      interest: '项目融资、商业计划',
      intentLevel: 'high',
      intentScore: 92,
      contactStatus: 'uncontacted',
      lastActivity: '2小时前',
      followers: 12500,
      bio: '专注创业项目分享，对融资对接感兴趣',
      tags: ['创业者', '融资需求', '高意向'],
      discoveredAt: '2024-03-25',
      source: '关键词搜索',
    },
    {
      id: '2',
      name: '职场女性加油站',
      platform: 'xiaohongshu',
      platformName: '小红书',
      gender: 'female',
      age: 30,
      location: '北京朝阳',
      industry: '企业管理',
      interest: '团队管理、职场晋升',
      intentLevel: 'high',
      intentScore: 88,
      contactStatus: 'contacted',
      lastActivity: '1天前',
      followers: 8900,
      bio: '分享职场成长经验，对管理培训感兴趣',
      tags: ['职场精英', '管理培训', '女性用户'],
      contactPhone: '138****1234',
      discoveredAt: '2024-03-24',
      source: '话题互动',
    },
    {
      id: '3',
      name: '科技前沿观察',
      platform: 'bilibili',
      platformName: 'B站',
      gender: 'male',
      age: 26,
      location: '深圳南山',
      industry: '人工智能',
      interest: 'AI技术、产品落地',
      intentLevel: 'medium',
      intentScore: 75,
      contactStatus: 'responded',
      lastActivity: '3天前',
      followers: 23000,
      bio: 'AI行业从业者，关注技术商业化',
      tags: ['AI从业者', '技术控'],
      wechat: 'tech_observer',
      discoveredAt: '2024-03-23',
      source: '直播间采集',
    },
    {
      id: '4',
      name: '短视频变现之路',
      platform: 'kuaishou',
      platformName: '快手',
      gender: 'unknown',
      age: 25,
      location: '广州天河',
      industry: '自媒体运营',
      interest: '涨粉技巧、变现方法',
      intentLevel: 'medium',
      intentScore: 68,
      contactStatus: 'uncontacted',
      lastActivity: '5小时前',
      followers: 45000,
      bio: '分享短视频运营经验，寻找合作机会',
      tags: ['自媒体', '变现需求'],
      discoveredAt: '2024-03-22',
      source: '行业搜索',
    },
    {
      id: '5',
      name: '企业服务专家',
      platform: 'douyin',
      platformName: '抖音',
      gender: 'male',
      age: 35,
      location: '杭州西湖',
      industry: '企业服务',
      interest: 'SaaS产品、数字化转型',
      intentLevel: 'high',
      intentScore: 95,
      contactStatus: 'converted',
      lastActivity: '1小时前',
      followers: 6700,
      bio: '服务中小企业，助力数字化升级',
      tags: ['企业决策者', '高净值', '已转化'],
      contactPhone: '139****5678',
      wechat: 'qyfw_2024',
      discoveredAt: '2024-03-20',
      source: '竞品用户',
    },
    {
      id: '6',
      name: '教育培训探索',
      platform: 'xiaohongshu',
      platformName: '小红书',
      gender: 'female',
      age: 32,
      location: '成都武侯',
      industry: '教育培训',
      interest: '课程研发、招生获客',
      intentLevel: 'low',
      intentScore: 45,
      contactStatus: 'uncontacted',
      lastActivity: '1周前',
      followers: 3200,
      bio: '教育机构负责人，寻找增长方案',
      tags: ['教育行业'],
      discoveredAt: '2024-03-19',
      source: '关键词搜索',
    },
  ])

  const [searchForm] = Form.useForm()

  // 统计数据
  const stats = useMemo(() => ({
    total: customers.length,
    highIntent: customers.filter(c => c.intentLevel === 'high').length,
    contacted: customers.filter(c => c.contactStatus !== 'uncontacted').length,
    converted: customers.filter(c => c.contactStatus === 'converted').length,
  }), [customers])

  // 筛选后的数据
  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    if (searchText) {
      const lower = searchText.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.industry.toLowerCase().includes(lower) ||
        c.interest.toLowerCase().includes(lower) ||
        c.tags.some(t => t.toLowerCase().includes(lower))
      )
    }

    if (platformFilter !== 'all') {
      result = result.filter(c => c.platform === platformFilter)
    }

    if (intentFilter !== 'all') {
      result = result.filter(c => c.intentLevel === intentFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.contactStatus === statusFilter)
    }

    if (industryFilter !== 'all') {
      result = result.filter(c => c.industry === industryFilter)
    }

    return result
  }, [customers, searchText, platformFilter, intentFilter, statusFilter, industryFilter])

  const platformConfig: Record<string, { color: string; icon: string }> = {
    douyin: { color: '#fe2c55', icon: '抖音' },
    kuaishou: { color: '#ff4906', icon: '快手' },
    xiaohongshu: { color: '#fe2c55', icon: '小红书' },
    bilibili: { color: '#00a1d6', icon: 'B站' },
  }

  const intentConfig: Record<string, { label: string; color: string }> = {
    high: { label: '高意向', color: 'success' },
    medium: { label: '中意向', color: 'warning' },
    low: { label: '低意向', color: 'default' },
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    uncontacted: { label: '未联系', color: 'default' },
    contacted: { label: '已联系', color: 'processing' },
    responded: { label: '已回复', color: 'warning' },
    converted: { label: '已转化', color: 'success' },
  }

  const columns = [
    {
      title: '潜客信息',
      key: 'info',
      fixed: 'left' as const,
      width: 220,
      render: (_: any, record: PotentialCustomer) => (
        <div className="flex items-center gap-3">
          <Avatar size={44} src={record.avatar} icon={<UserOutlined />} className={`bg-[${platformConfig[record.platform].color}]`} style={{ backgroundColor: platformConfig[record.platform].color }}>
            {record.name[0]}
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {record.name}
              <Tag color={platformConfig[record.platform].color} className="text-xs">{record.platformName}</Tag>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              {record.gender === 'male' ? <ManOutlined /> : record.gender === 'female' ? <WomanOutlined /> : null}
              {record.age}岁 | {record.location}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '行业/兴趣',
      key: 'interest',
      width: 180,
      render: (_: any, record: PotentialCustomer) => (
        <div>
          <Tag color="blue">{record.industry}</Tag>
          <div className="text-xs text-gray-500 mt-1">{record.interest}</div>
        </div>
      ),
    },
    {
      title: '意向度',
      dataIndex: 'intentScore',
      key: 'intentScore',
      width: 130,
      sorter: (a: PotentialCustomer, b: PotentialCustomer) => a.intentScore - b.intentScore,
      render: (score: number, record: PotentialCustomer) => (
        <div className="flex flex-col">
          <Tag color={intentConfig[record.intentLevel].color}>{intentConfig[record.intentLevel].label}</Tag>
          <Progress percent={score} showInfo={false} size="small" className="w-20 mt-1" />
          <span className="text-xs text-gray-400">{score}分</span>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 130,
      render: (_: any, record: PotentialCustomer) => (
        <div className="text-sm">
          {record.contactPhone && <div className="flex items-center gap-1"><PhoneOutlined className="text-gray-400" /> {record.contactPhone}</div>}
          {record.wechat && <div className="flex items-center gap-1"><WechatOutlined className="text-gray-400" /> {record.wechat}</div>}
          {!record.contactPhone && !record.wechat && <span className="text-gray-400">暂无</span>}
        </div>
      ),
    },
    {
      title: '粉丝数',
      dataIndex: 'followers',
      key: 'followers',
      width: 100,
      sorter: (a: PotentialCustomer, b: PotentialCustomer) => a.followers - b.followers,
      render: (f: number) => f >= 10000 ? `${(f / 10000).toFixed(1)}w` : f.toString(),
    },
    {
      title: '跟进状态',
      dataIndex: 'contactStatus',
      key: 'contactStatus',
      width: 100,
      render: (status: string) => (
        <Badge status={statusConfig[status].color as any} text={statusConfig[status].label} />
      ),
    },
    {
      title: '标签',
      key: 'tags',
      width: 160,
      render: (_: any, record: PotentialCustomer) => (
        <div className="flex flex-wrap gap-1">
          {record.tags.slice(0, 2).map((tag, i) => (
            <Tag key={i} className="text-xs">{tag}</Tag>
          ))}
          {record.tags.length > 2 && <Tag className="text-xs">+{record.tags.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '最近活动',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 100,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => <Tag>{source}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 140,
      render: (_: any, record: PotentialCustomer) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedCustomer(record); setDetailVisible(true) }}>
            详情
          </Button>
          {record.contactStatus !== 'converted' && (
            <Button type="link" size="small" icon={<MessageOutlined />} className="text-blue-600">
              联系
            </Button>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => message.success('已删除')}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleSearch = () => {
    setSearchLoading(true)
    const values = searchForm.getFieldsValue()
    console.log('搜索条件：', values)
    setTimeout(() => {
      setSearchLoading(false)
      message.success('发现 156 个潜在客户')
    }, 1500)
  }

  const handleBatchAction = (action: string) => {
    message.success(`已对 ${selectedRowKeys.length} 个潜客执行 ${action === 'export' ? '导出' : action === 'contact' ? '批量联系' : '删除'} 操作`)
    setBatchModalVisible(false)
    setSelectedRowKeys([])
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">潜客发现</Title>
        <Text type="secondary">精准发现潜在客户，按行业、关键词、互动行为筛选目标人群</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="border-l-4 border-l-blue-500">
            <Statistic title="潜客总数" value={stats.total} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-green-500">
            <Statistic title="高意向" value={stats.highIntent} valueStyle={{ color: '#52c41a' }} prefix={<StarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-orange-500">
            <Statistic title="已联系" value={stats.contacted} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-purple-500">
            <Statistic title="已转化" value={stats.converted} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* 搜索条件 */}
      <Card className="mb-6">
        <Form form={searchForm} layout="inline">
          <Form.Item name="industry" label="行业" className="flex-1">
            <Select
              placeholder="选择行业"
              className="w-40"
              allowClear
              options={[
                { value: '创业投资', label: '创业投资' },
                { value: '企业管理', label: '企业管理' },
                { value: '人工智能', label: '人工智能' },
                { value: '自媒体运营', label: '自媒体运营' },
                { value: '企业服务', label: '企业服务' },
                { value: '教育培训', label: '教育培训' },
              ]}
            />
          </Form.Item>
          <Form.Item name="keywords" label="关键词" className="flex-1">
            <Input placeholder="输入关键词" className="w-48" />
          </Form.Item>
          <Form.Item name="platform" label="平台" className="flex-1">
            <Select
              placeholder="选择平台"
              className="w-32"
              allowClear
              options={[
                { value: 'douyin', label: '抖音' },
                { value: 'kuaishou', label: '快手' },
                { value: 'xiaohongshu', label: '小红书' },
                { value: 'bilibili', label: 'B站' },
              ]}
            />
          </Form.Item>
          <Form.Item name="location" label="地区" className="flex-1">
            <Input placeholder="输入地区" className="w-32" />
          </Form.Item>
          <Form.Item name="intentLevel" label="意向度" className="flex-1">
            <Select
              placeholder="意向度"
              className="w-28"
              allowClear
              options={[
                { value: 'high', label: '高意向' },
                { value: 'medium', label: '中意向' },
                { value: 'low', label: '低意向' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} loading={searchLoading} onClick={handleSearch}>
                搜索潜客
              </Button>
              <Button icon={<RobotOutlined />} onClick={() => message.info('AI智能分析功能开发中')}>
                AI智能发现
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 筛选和操作栏 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <Space wrap>
            <Input
              placeholder="搜索潜客..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-56"
              allowClear
            />
            <Select
              placeholder="平台"
              value={platformFilter}
              onChange={setPlatformFilter}
              className="w-28"
              options={[
                { value: 'all', label: '全部平台' },
                { value: 'douyin', label: '抖音' },
                { value: 'kuaishou', label: '快手' },
                { value: 'xiaohongshu', label: '小红书' },
                { value: 'bilibili', label: 'B站' },
              ]}
            />
            <Select
              placeholder="意向度"
              value={intentFilter}
              onChange={setIntentFilter}
              className="w-28"
              options={[
                { value: 'all', label: '全部意向' },
                { value: 'high', label: '高意向' },
                { value: 'medium', label: '中意向' },
                { value: 'low', label: '低意向' },
              ]}
            />
            <Select
              placeholder="跟进状态"
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-28"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'uncontacted', label: '未联系' },
                { value: 'contacted', label: '已联系' },
                { value: 'responded', label: '已回复' },
                { value: 'converted', label: '已转化' },
              ]}
            />
          </Space>
          
          <Space>
            <Text type="secondary">已选择 {selectedRowKeys.length} 个</Text>
            <Button icon={<MessageOutlined />} disabled={selectedRowKeys.length === 0} onClick={() => setBatchModalVisible(true)}>
              批量联系
            </Button>
            <Button icon={<AimOutlined />} disabled={selectedRowKeys.length === 0} onClick={() => setBatchModalVisible(true)}>
              导出
            </Button>
          </Space>
        </div>
      </Card>

      {/* 潜客列表 */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个潜客`,
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 潜客详情弹窗 */}
      <Modal
        title="潜客详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="note">添加备注</Button>,
          <Button key="contact" type="primary" icon={<MessageOutlined />}>发送引流</Button>,
        ]}
        width={600}
      >
        {selectedCustomer && (
          <div className="py-4">
            <div className="flex gap-6 mb-6">
              <Avatar size={80} src={selectedCustomer.avatar} style={{ backgroundColor: platformConfig[selectedCustomer.platform].color }}>
                {selectedCustomer.name[0]}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold">{selectedCustomer.name}</span>
                  <Tag color={platformConfig[selectedCustomer.platform].color}>{selectedCustomer.platformName}</Tag>
                  <Tag color={intentConfig[selectedCustomer.intentLevel].color}>{intentConfig[selectedCustomer.intentLevel].label}</Tag>
                </div>
                <div className="text-gray-500 mb-2">
                  {selectedCustomer.gender === 'male' ? '男' : selectedCustomer.gender === 'female' ? '女' : '未知'} | {selectedCustomer.age}岁 | {selectedCustomer.location}
                </div>
                <div className="text-gray-500">
                  <EnvironmentOutlined /> 行业：{selectedCustomer.industry}
                </div>
              </div>
            </div>

            <Card title="意向分析" size="small" className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="text-gray-500">意向评分</div>
                  <div className="text-2xl font-bold text-green-500">{selectedCustomer.intentScore}分</div>
                </Col>
                <Col span={12}>
                  <div className="text-gray-500">粉丝数</div>
                  <div className="text-2xl font-bold">{selectedCustomer.followers >= 10000 ? `${(selectedCustomer.followers / 10000).toFixed(1)}w` : selectedCustomer.followers}</div>
                </Col>
              </Row>
              <div className="mt-3">
                <div className="text-gray-500 mb-1">兴趣标签</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tag, i) => (
                    <Tag key={i} color="blue">{tag}</Tag>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="基本信息" size="small" className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">近期活动：</Text>{selectedCustomer.lastActivity}
                </Col>
                <Col span={12}>
                  <Text type="secondary">发现时间：</Text>{selectedCustomer.discoveredAt}
                </Col>
              </Row>
              <div className="mt-2">
                <Text type="secondary">个人简介：</Text>
                <p className="mt-1">{selectedCustomer.bio}</p>
              </div>
            </Card>

            <Card title="联系方式" size="small">
              {selectedCustomer.contactPhone && (
                <div className="mb-2"><PhoneOutlined /> {selectedCustomer.contactPhone}</div>
              )}
              {selectedCustomer.wechat && (
                <div className="mb-2"><WechatOutlined /> 微信：{selectedCustomer.wechat}</div>
              )}
              {!selectedCustomer.contactPhone && !selectedCustomer.wechat && (
                <Text type="secondary">暂无联系方式</Text>
              )}
            </Card>
          </div>
        )}
      </Modal>

      {/* 批量操作弹窗 */}
      <Modal
        title="批量操作"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={400}
      >
        <div className="py-4">
          <p className="mb-4">已选择 <Text strong>{selectedRowKeys.length}</Text> 个潜客</p>
          <Space direction="vertical" className="w-full">
            <Button block icon={<MessageOutlined />} onClick={() => handleBatchAction('contact')}>批量发送引流消息</Button>
            <Button block icon={<AimOutlined />} onClick={() => handleBatchAction('export')}>导出潜客信息</Button>
            <Button block danger icon={<DeleteOutlined />} onClick={() => handleBatchAction('delete')}>删除选中潜客</Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}
