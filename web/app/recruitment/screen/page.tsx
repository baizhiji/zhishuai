'use client'

import { useState, useMemo } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Space, Button, Input, Select, Badge, Modal, Form, Progress, Tooltip, message } from 'antd'
import { UserOutlined, CheckOutlined, CloseOutlined, EyeOutlined, SearchOutlined, FilterOutlined, SortAscendingOutlined, RobotOutlined, MessageOutlined, MailOutlined, PhoneOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface Resume {
  id: string
  name: string
  avatar?: string
  position: string
  experience: string
  education: string
  phone: string
  email: string
  matchScore: number
  matchReasons: string[]
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired'
  source: string
  skills: string[]
  salary: string
  age: number
  location: string
  applyDate: string
  aiSummary: string
}

export default function ResumeScreenPage() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [matchFilter, setMatchFilter] = useState<string>('all')
  const [sortType, setSortType] = useState<string>('match')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [bulkModalVisible, setBulkModalVisible] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>('')

  const [resumes] = useState<Resume[]>([
    {
      id: '1',
      name: '李明',
      position: '前端开发工程师',
      experience: '5年',
      education: '本科',
      phone: '138****1234',
      email: 'liming@example.com',
      matchScore: 95,
      matchReasons: ['精通React/Vue框架', '有大型项目经验', '薪资期望匹配'],
      status: 'pending',
      source: 'BOSS直聘',
      skills: ['React', 'Vue', 'TypeScript', 'Node.js'],
      salary: '20-30K',
      age: 28,
      location: '上海',
      applyDate: '2024-03-25',
      aiSummary: '5年前端开发经验，熟悉主流前端框架，有SaaS平台开发经验，沟通能力良好。',
    },
    {
      id: '2',
      name: '王芳',
      position: '前端开发工程师',
      experience: '3年',
      education: '硕士',
      phone: '139****5678',
      email: 'wangfang@example.com',
      matchScore: 88,
      matchReasons: ['硕士学历', 'React技术栈匹配', '项目经验对口'],
      status: 'pending',
      source: '前程无忧',
      skills: ['React', 'JavaScript', 'CSS3', 'Webpack'],
      salary: '15-25K',
      age: 26,
      location: '北京',
      applyDate: '2024-03-24',
      aiSummary: '3年前端经验，硕士学历，善于学习新技术，参与过多个商业项目开发。',
    },
    {
      id: '3',
      name: '张伟',
      position: '前端开发工程师',
      experience: '4年',
      education: '本科',
      phone: '137****9012',
      email: 'zhangwei@example.com',
      matchScore: 82,
      matchReasons: ['技术栈匹配', '薪资期望适中'],
      status: 'reviewed',
      source: '智联招聘',
      skills: ['Vue', 'React', '微信小程序', 'Taro'],
      salary: '18-25K',
      age: 30,
      location: '深圳',
      applyDate: '2024-03-23',
      aiSummary: '4年经验，擅长Vue和React，有移动端开发经验，性能优化意识强。',
    },
    {
      id: '4',
      name: '刘洋',
      position: '前端开发工程师',
      experience: '2年',
      education: '本科',
      phone: '136****3456',
      email: 'liuyang@example.com',
      matchScore: 75,
      matchReasons: ['学习能力强', '积极主动'],
      status: 'pending',
      source: 'BOSS直聘',
      skills: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
      salary: '10-15K',
      age: 24,
      location: '广州',
      applyDate: '2024-03-22',
      aiSummary: '2年经验，基础扎实，学习能力强，有团队协作经验。',
    },
    {
      id: '5',
      name: '陈静',
      position: '前端开发工程师',
      experience: '6年',
      education: '本科',
      phone: '135****7890',
      email: 'chenjing@example.com',
      matchScore: 92,
      matchReasons: ['资深经验', '架构能力', '团队管理经验'],
      status: 'interview',
      source: '猎聘',
      skills: ['React', 'Vue', 'Node.js', '微前端', '性能优化'],
      salary: '30-40K',
      age: 32,
      location: '上海',
      applyDate: '2024-03-20',
      aiSummary: '6年经验，曾任技术负责人，有丰富的前端架构和团队管理经验。',
    },
    {
      id: '6',
      name: '赵强',
      position: '前端开发工程师',
      experience: '1年',
      education: '大专',
      phone: '134****2345',
      email: 'zhaoqiang@example.com',
      matchScore: 55,
      matchReasons: ['薪资期望低'],
      status: 'rejected',
      source: 'BOSS直聘',
      skills: ['HTML', 'CSS', 'JavaScript'],
      salary: '6-8K',
      age: 22,
      location: '杭州',
      applyDate: '2024-03-19',
      aiSummary: '应届或1年经验，技术基础一般，薪资期望较低。',
    },
  ])

  // 智能筛选和排序
  const filteredResumes = useMemo(() => {
    let result = [...resumes]

    // 搜索过滤
    if (searchText) {
      const lower = searchText.toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(lower) ||
        r.position.toLowerCase().includes(lower) ||
        r.skills.some(s => s.toLowerCase().includes(lower)) ||
        r.aiSummary.toLowerCase().includes(lower)
      )
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter)
    }

    // 匹配度过滤
    if (matchFilter === 'high') {
      result = result.filter(r => r.matchScore >= 80)
    } else if (matchFilter === 'medium') {
      result = result.filter(r => r.matchScore >= 60 && r.matchScore < 80)
    } else if (matchFilter === 'low') {
      result = result.filter(r => r.matchScore < 60)
    }

    // 排序
    switch (sortType) {
      case 'match':
        result.sort((a, b) => b.matchScore - a.matchScore)
        break
      case 'time':
        result.sort((a, b) => new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime())
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [resumes, searchText, statusFilter, matchFilter, sortType])

  // 统计信息
  const stats = useMemo(() => ({
    total: resumes.length,
    pending: resumes.filter(r => r.status === 'pending').length,
    highMatch: resumes.filter(r => r.matchScore >= 80).length,
    interview: resumes.filter(r => r.status === 'interview').length,
  }), [resumes])

  const statusConfig: Record<string, { text: string; color: string }> = {
    pending: { text: '待处理', color: 'default' },
    reviewed: { text: '已查看', color: 'blue' },
    interview: { text: '面试中', color: 'processing' },
    rejected: { text: '已拒绝', color: 'error' },
    hired: { text: '已录用', color: 'success' },
  }

  const columns = [
    {
      title: '基本信息',
      key: 'basic',
      fixed: 'left' as const,
      width: 200,
      render: (_: any, record: Resume) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserOutlined className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-xs text-gray-500">{record.position}</div>
          </div>
        </div>
      ),
    },
    {
      title: '匹配度',
      dataIndex: 'matchScore',
      key: 'matchScore',
      width: 120,
      sorter: (a: Resume, b: Resume) => a.matchScore - b.matchScore,
      render: (score: number) => (
        <div className="flex flex-col">
          <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'} className="w-fit">
            {score}%
          </Tag>
          <Progress percent={score} showInfo={false} size="small" className="w-16 mt-1" />
        </div>
      ),
    },
    {
      title: '匹配原因',
      key: 'matchReasons',
      width: 200,
      render: (_: any, record: Resume) => (
        <div className="flex flex-wrap gap-1">
          {record.matchReasons.slice(0, 2).map((reason, i) => (
            <Tag key={i} color="blue" className="text-xs">{reason}</Tag>
          ))}
          {record.matchReasons.length > 2 && (
            <Tooltip title={record.matchReasons.slice(2).join(', ')}>
              <Tag className="text-xs">+{record.matchReasons.length - 2}</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '经验/学历',
      key: 'exp_edu',
      width: 140,
      render: (_: any, record: Resume) => (
        <div className="text-sm">
          <div>{record.experience}</div>
          <div className="text-gray-500">{record.education}</div>
        </div>
      ),
    },
    {
      title: '期望薪资',
      dataIndex: 'salary',
      key: 'salary',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status]
        return <Badge status={config.color === 'default' ? 'default' : config.color as any} text={config.text} />
      },
    },
    {
      title: '投递时间',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 110,
      sorter: (a: Resume, b: Resume) => new Date(a.applyDate).getTime() - new Date(b.applyDate).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: Resume) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedResume(record); setDetailModalVisible(true) }}>
            查看
          </Button>
          {record.status !== 'interview' && record.status !== 'hired' && (
            <Button type="link" size="small" icon={<CheckOutlined />} className="text-green-600" onClick={() => handleSingleAction(record.id, 'interview')}>
              通过
            </Button>
          )}
          {record.status !== 'rejected' && record.status !== 'hired' && (
            <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleSingleAction(record.id, 'rejected')}>
              拒绝
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleSingleAction = (id: string, action: string) => {
    message.success(`已将简历标记为${action === 'interview' ? '面试中' : '已拒绝'}`)
  }

  const handleBulkAction = () => {
    if (!bulkAction) {
      message.warning('请选择操作')
      return
    }
    if (selectedRowKeys.length === 0) {
      message.warning('请选择简历')
      return
    }
    message.success(`已对 ${selectedRowKeys.length} 份简历执行${bulkAction === 'interview' ? '通过' : '拒绝'}操作`)
    setBulkModalVisible(false)
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
        <Title level={2} className="mb-2">AI简历筛选</Title>
        <Text type="secondary">智能分析简历匹配度，批量处理招聘流程</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">简历总数</Text>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="text-3xl opacity-20"><UserOutlined /></div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">待处理</Text>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </div>
              <Badge count={stats.pending} overflowCount={99}>
                <div className="text-3xl opacity-20"><FilterOutlined /></div>
              </Badge>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">高匹配度</Text>
                <div className="text-2xl font-bold">{stats.highMatch}</div>
              </div>
              <div className="text-3xl opacity-20"><RobotOutlined /></div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary">安排面试</Text>
                <div className="text-2xl font-bold">{stats.interview}</div>
              </div>
              <div className="text-3xl opacity-20"><MessageOutlined /></div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选和操作栏 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <Space wrap>
            <Input
              placeholder="搜索简历..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-64"
              allowClear
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-32"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'pending', label: '待处理' },
                { value: 'reviewed', label: '已查看' },
                { value: 'interview', label: '面试中' },
                { value: 'rejected', label: '已拒绝' },
                { value: 'hired', label: '已录用' },
              ]}
            />
            <Select
              placeholder="匹配度"
              value={matchFilter}
              onChange={setMatchFilter}
              className="w-32"
              options={[
                { value: 'all', label: '全部匹配' },
                { value: 'high', label: '高(≥80%)' },
                { value: 'medium', label: '中(60-80%)' },
                { value: 'low', label: '低(<60%)' },
              ]}
            />
            <Select
              placeholder="排序"
              value={sortType}
              onChange={setSortType}
              className="w-32"
              options={[
                { value: 'match', label: '匹配度排序' },
                { value: 'time', label: '时间排序' },
                { value: 'name', label: '姓名排序' },
              ]}
            />
          </Space>
          
          <Space>
            <Text type="secondary">已选择 {selectedRowKeys.length} 份</Text>
            <Button 
              icon={<CheckCircleOutlined />} 
              type="primary"
              disabled={selectedRowKeys.length === 0}
              onClick={() => { setBulkAction('interview'); setBulkModalVisible(true) }}
            >
              批量通过
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={() => { setBulkAction('rejected'); setBulkModalVisible(true) }}
            >
              批量拒绝
            </Button>
          </Space>
        </div>
      </Card>

      {/* 简历表格 */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredResumes}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 份简历`,
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 简历详情弹窗 */}
      <Modal
        title="简历详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="reject" danger onClick={() => { handleSingleAction(selectedResume?.id || '', 'rejected'); setDetailModalVisible(false) }}>
            拒绝
          </Button>,
          <Button key="interview" type="primary" onClick={() => { handleSingleAction(selectedResume?.id || '', 'interview'); setDetailModalVisible(false) }}>
            安排面试
          </Button>,
        ]}
        width={700}
      >
        {selectedResume && (
          <div className="py-4">
            <div className="flex gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <UserOutlined className="text-3xl text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold">{selectedResume.name}</span>
                  <Tag color={selectedResume.matchScore >= 80 ? 'success' : selectedResume.matchScore >= 60 ? 'warning' : 'error'}>
                    匹配度 {selectedResume.matchScore}%
                  </Tag>
                </div>
                <div className="text-gray-500 mb-2">
                  {selectedResume.position} | {selectedResume.experience} | {selectedResume.education}
                </div>
                <Space size="large">
                  <span><PhoneOutlined /> {selectedResume.phone}</span>
                  <span><MailOutlined /> {selectedResume.email}</span>
                </Space>
              </div>
            </div>

            <Card title="AI智能分析" size="small" className="mb-4 bg-gray-50">
              <div className="mb-3">
                <Text type="secondary">匹配原因：</Text>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedResume.matchReasons.map((reason, i) => (
                    <Tag key={i} color="blue">{reason}</Tag>
                  ))}
                </div>
              </div>
              <div>
                <Text type="secondary">简历摘要：</Text>
                <p className="mt-1 text-gray-700">{selectedResume.aiSummary}</p>
              </div>
            </Card>

            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text type="secondary">期望薪资：</Text>
                <Text strong>{selectedResume.salary}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">年龄：</Text>
                <Text strong>{selectedResume.age}岁</Text>
              </Col>
            </Row>
            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text type="secondary">所在地：</Text>
                <Text strong>{selectedResume.location}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">简历来源：</Text>
                <Text strong>{selectedResume.source}</Text>
              </Col>
            </Row>
            <div className="mb-4">
              <Text type="secondary">技能标签：</Text>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedResume.skills.map((skill, i) => (
                  <Tag key={i}>{skill}</Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 批量操作确认弹窗 */}
      <Modal
        title="批量操作确认"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        onOk={handleBulkAction}
        okText="确认"
        okButtonProps={{ danger: bulkAction === 'rejected' }}
      >
        <p>确认对选中的 <Text strong>{selectedRowKeys.length}</Text> 份简历执行 <Text strong>{bulkAction === 'interview' ? '通过' : '拒绝'}</Text> 操作？</p>
        <p className="text-gray-500 mt-2">此操作可以批量处理大量简历，提高工作效率。</p>
      </Modal>
    </div>
  )
}
