'use client'

import { useState, useMemo } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Space, Button, Input, Select, Form, Modal, Progress, Steps, Badge, Switch, Divider, message, Popconfirm, Statistic, Timeline, Alert } from 'antd'
import { PlusOutlined, SendOutlined, DeleteOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined, CopyOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, RobotOutlined, QrcodeOutlined, MessageOutlined, UserAddOutlined, BarChartOutlined, SafetyOutlined, ThunderboltOutlined, FieldTimeOutlined, GlobalOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface Task {
  id: string
  name: string
  targetCount: number
  sentCount: number
  repliedCount: number
  scannedCount: number
  convertedCount: number
  status: 'running' | 'paused' | 'completed' | 'draft'
  type: 'auto' | 'manual'
  replyRate: number
  scanRate: number
  convertRate: number
  startTime: string
  endTime?: string
  targetKeywords: string[]
  content: string
  qrcodeEnabled: boolean
  delay: number
  dailyLimit: number
}

interface SendRecord {
  id: string
  customerName: string
  platform: string
  status: 'sending' | 'sent' | 'replied' | 'blocked'
  sentAt: string
  repliedAt?: string
  content: string
}

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: '企业服务精准获客',
      targetCount: 500,
      sentCount: 356,
      repliedCount: 89,
      scannedCount: 67,
      convertedCount: 12,
      status: 'running',
      type: 'auto',
      replyRate: 25.0,
      scanRate: 75.3,
      convertRate: 17.9,
      startTime: '2024-03-25 09:00',
      targetKeywords: ['企业服务', 'SaaS', '数字化转型'],
      content: '您好！我是专注于企业服务的顾问。看到您也在关注企业数字化转型，这是我们整理的《中小企业数字化转型白皮书》，包含20+成功案例，或许对您有帮助。需要的话可以免费分享给您~',
      qrcodeEnabled: true,
      delay: 30,
      dailyLimit: 100,
    },
    {
      id: '2',
      name: 'AI工具推广引流',
      targetCount: 300,
      sentCount: 300,
      repliedCount: 78,
      scannedCount: 56,
      convertedCount: 8,
      status: 'completed',
      type: 'auto',
      replyRate: 26.0,
      scanRate: 71.8,
      convertRate: 14.3,
      startTime: '2024-03-20 10:00',
      endTime: '2024-03-22 18:00',
      targetKeywords: ['AI工具', 'ChatGPT', '效率提升'],
      content: '看到您在探索AI工具应用，我们团队开发了一款国产AI助手，完全免费使用，支持文案生成、数据分析等。有兴趣了解吗？',
      qrcodeEnabled: true,
      delay: 45,
      dailyLimit: 150,
    },
    {
      id: '3',
      name: '教育培训招生推广',
      targetCount: 200,
      sentCount: 145,
      repliedCount: 34,
      scannedCount: 0,
      convertedCount: 0,
      status: 'paused',
      type: 'auto',
      replyRate: 23.4,
      scanRate: 0,
      convertRate: 0,
      startTime: '2024-03-18 14:00',
      targetKeywords: ['在线教育', '技能培训', '考证'],
      content: '您好！我们是专业技能培训机构，现推出限时优惠课程，报名即送学习资料包。有兴趣了解课程详情吗？',
      qrcodeEnabled: true,
      delay: 60,
      dailyLimit: 80,
    },
    {
      id: '4',
      name: '新品推广活动',
      targetCount: 0,
      sentCount: 0,
      repliedCount: 0,
      scannedCount: 0,
      convertedCount: 0,
      status: 'draft',
      type: 'manual',
      replyRate: 0,
      scanRate: 0,
      convertRate: 0,
      startTime: '',
      targetKeywords: [],
      content: '',
      qrcodeEnabled: true,
      delay: 30,
      dailyLimit: 100,
    },
  ])

  const [records] = useState<SendRecord[]>([
    { id: '1', customerName: '张三', platform: '抖音', status: 'replied', sentAt: '2024-03-25 14:30', repliedAt: '2024-03-25 14:35', content: '您好！我是专注于企业服务的顾问...' },
    { id: '2', customerName: '李四', platform: '小红书', status: 'sent', sentAt: '2024-03-25 14:28', content: '您好！我是专注于企业服务的顾问...' },
    { id: '3', customerName: '王五', platform: '快手', status: 'blocked', sentAt: '2024-03-25 14:25', content: '您好！我是专注于企业服务的顾问...' },
    { id: '4', customerName: '赵六', platform: 'B站', status: 'sent', sentAt: '2024-03-25 14:20', content: '您好！我是专注于企业服务的顾问...' },
  ])

  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskType, setTaskType] = useState<'create' | 'edit'>('create')
  const [form] = Form.useForm()

  // 统计数据
  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status === 'running')
    const totalSent = tasks.reduce((sum, t) => sum + t.sentCount, 0)
    const totalReplied = tasks.reduce((sum, t) => sum + t.repliedCount, 0)
    const totalScanned = tasks.reduce((sum, t) => sum + t.scannedCount, 0)
    const totalConverted = tasks.reduce((sum, t) => sum + t.convertedCount, 0)
    const avgReplyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0.0'
    const avgScanRate = totalReplied > 0 ? ((totalScanned / totalReplied) * 100).toFixed(1) : '0.0'
    const avgConvertRate = totalScanned > 0 ? ((totalConverted / totalScanned) * 100).toFixed(1) : '0.0'
    
    return {
      activeTasks: activeTasks.length,
      totalSent,
      totalReplied,
      totalScanned,
      totalConverted,
      avgReplyRate,
      avgScanRate,
      avgConvertRate,
    }
  }, [tasks])

  const statusConfig: Record<string, { label: string; color: string }> = {
    running: { label: '执行中', color: 'success' },
    paused: { label: '已暂停', color: 'warning' },
    completed: { label: '已完成', color: 'default' },
    draft: { label: '草稿', color: 'default' },
  }

  const recordStatusConfig: Record<string, { label: string; color: string }> = {
    sending: { label: '发送中', color: 'processing' },
    sent: { label: '已发送', color: 'success' },
    replied: { label: '已回复', color: 'blue' },
    blocked: { label: '被拦截', color: 'error' },
  }

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Task) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {name}
            <Tag color={statusConfig[record.status].color}>{statusConfig[record.status].label}</Tag>
            {record.type === 'auto' ? <Tag icon={<RobotOutlined />} color="purple">自动</Tag> : <Tag icon={<UserAddOutlined />} color="cyan">手动</Tag>}
          </div>
          <div className="text-xs text-gray-400">
            关键词：{record.targetKeywords.join('、')}
          </div>
        </div>
      ),
    },
    {
      title: '发送进度',
      key: 'progress',
      width: 180,
      render: (_: any, record: Task) => (
        <div>
          {record.status === 'draft' ? (
            <Text type="secondary">未开始</Text>
          ) : (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span>{record.sentCount}</span>
                <span>/ {record.targetCount}</span>
              </div>
              <Progress percent={record.targetCount > 0 ? Math.round((record.sentCount / record.targetCount) * 100) : 0} showInfo={false} size="small" />
            </>
          )}
        </div>
      ),
    },
    {
      title: '数据统计',
      key: 'stats',
      width: 280,
      render: (_: any, record: Task) => (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-gray-400">发送</div>
            <div className="font-medium">{record.sentCount}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">回复</div>
            <div className="font-medium text-blue-500">{record.repliedCount}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">扫码</div>
            <div className="font-medium text-green-500">{record.scannedCount}</div>
          </div>
        </div>
      ),
    },
    {
      title: '转化漏斗',
      key: 'funnel',
      width: 200,
      render: (_: any, record: Task) => (
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span>回复率</span>
            <Progress percent={record.replyRate} size="small" className="flex-1" />
            <span className="w-10">{record.replyRate}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <span>扫码率</span>
            <Progress percent={record.scanRate} size="small" className="flex-1" strokeColor="#52c41a" />
            <span className="w-10">{record.scanRate}%</span>
          </div>
        </div>
      ),
    },
    {
      title: '时间设置',
      key: 'time',
      width: 120,
      render: (_: any, record: Task) => (
        <div className="text-xs text-gray-500">
          {record.startTime && <div>开始：{record.startTime}</div>}
          {record.endTime && <div>结束：{record.endTime}</div>}
          {!record.startTime && <Text type="secondary">未设置</Text>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: Task) => (
        <Space size="small">
          {record.status === 'draft' ? (
            <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => {
              setTasks(list => list.map(t => t.id === record.id ? { ...t, status: 'running' as const, startTime: new Date().toLocaleString() } : t))
              message.success('任务已启动')
            }}>启动</Button>
          ) : record.status === 'running' ? (
            <Button size="small" icon={<PauseCircleOutlined />} onClick={() => {
              setTasks(list => list.map(t => t.id === record.id ? { ...t, status: 'paused' as const } : t))
              message.success('任务已暂停')
            }}>暂停</Button>
          ) : record.status === 'paused' ? (
            <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => {
              setTasks(list => list.map(t => t.id === record.id ? { ...t, status: 'running' as const } : t))
              message.success('任务已恢复')
            }}>恢复</Button>
          ) : (
            <Button type="link" size="small" icon={<BarChartOutlined />}>报表</Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditingTask(record)
            setTaskType('edit')
            form.setFieldsValue(record)
            setModalVisible(true)
          }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => {
            setTasks(list => list.filter(t => t.id !== record.id))
            message.success('已删除')
          }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const recordColumns = [
    {
      title: '潜客',
      key: 'customer',
      render: (_: any, record: SendRecord) => (
        <div>
          <div className="font-medium">{record.customerName}</div>
          <div className="text-xs text-gray-400">{record.platform}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge status={recordStatusConfig[status].color as any} text={recordStatusConfig[status].label} />
      ),
    },
    {
      title: '发送内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      key: 'sentAt',
      width: 150,
    },
    {
      title: '回复时间',
      dataIndex: 'repliedAt',
      key: 'repliedAt',
      width: 150,
      render: (time: string) => time || '-',
    },
  ]

  const handleSave = () => {
    form.validateFields().then(values => {
      if (taskType === 'edit' && editingTask) {
        setTasks(list => list.map(t => t.id === editingTask.id ? { ...t, ...values } : t))
        message.success('任务已更新')
      } else {
        setTasks(list => [...list, {
          ...values,
          id: Date.now().toString(),
          sentCount: 0,
          repliedCount: 0,
          scannedCount: 0,
          convertedCount: 0,
          replyRate: 0,
          scanRate: 0,
          convertRate: 0,
          status: 'draft' as const,
        }])
        message.success('任务已创建')
      }
      setModalVisible(false)
      setEditingTask(null)
      form.resetFields()
    })
  }

  const openCreateModal = () => {
    setTaskType('create')
    setEditingTask(null)
    form.resetFields()
    setModalVisible(true)
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">引流任务</Title>
        <Text type="secondary">批量发送引流消息，自动发送企业微信二维码，追踪转化效果</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card className="border-l-4 border-l-blue-500">
            <Statistic title="进行中任务" value={stats.activeTasks} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="border-l-4 border-l-green-500">
            <Statistic title="总发送数" value={stats.totalSent} prefix={<SendOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="border-l-4 border-l-orange-500">
            <Statistic title="收到回复" value={stats.totalReplied} suffix={`(${stats.avgReplyRate}%)`} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="border-l-4 border-l-cyan-500">
            <Statistic title="扫码人数" value={stats.totalScanned} suffix={`(${stats.avgScanRate}%)`} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="border-l-4 border-l-purple-500">
            <Statistic title="成功转化" value={stats.totalConverted} suffix={`(${stats.avgConvertRate}%)`} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="border-l-4 border-l-red-500">
            <Statistic title="今日发送" value={45} suffix="/ 200" />
          </Card>
        </Col>
      </Row>

      {/* 功能提示 */}
      <Alert
        message="引流任务说明"
        description="配置引流话术和目标人群，系统自动发送引流消息。支持自动发送企业微信二维码，设置发送延迟避免被平台检测。支持批量处理和实时数据追踪。"
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        className="mb-6"
      />

      {/* 转化漏斗 */}
      <Card title="转化漏斗" className="mb-6">
        <div className="flex items-center justify-between px-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">{stats.totalSent}</div>
            <div className="text-gray-500 mt-1">触达潜客</div>
          </div>
          <div className="flex-1 mx-8">
            <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
            <div className="text-center text-sm text-gray-400 mt-1">发送消息</div>
          </div>
          <div className="text-3xl text-orange-500">→</div>
          <div className="flex-1 mx-8">
            <Progress percent={stats.avgReplyRate} showInfo={false} strokeColor="#faad14" />
            <div className="text-center text-sm text-gray-400 mt-1">回复率 {stats.avgReplyRate}%</div>
          </div>
          <div className="text-3xl text-orange-500">→</div>
          <div className="flex-1 mx-8">
            <Progress percent={stats.avgScanRate} showInfo={false} strokeColor="#52c41a" />
            <div className="text-center text-sm text-gray-400 mt-1">扫码率 {stats.avgScanRate}%</div>
          </div>
          <div className="text-3xl text-orange-500">→</div>
          <div className="flex-1 mx-8">
            <Progress percent={stats.avgConvertRate} showInfo={false} strokeColor="#722ed1" />
            <div className="text-center text-sm text-gray-400 mt-1">转化率 {stats.avgConvertRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500">{stats.totalConverted}</div>
            <div className="text-gray-500 mt-1">成功转化</div>
          </div>
        </div>
      </Card>

      {/* 操作栏 */}
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新建引流任务</Button>
            <Button icon={<RobotOutlined />} onClick={() => message.info('AI优化话术功能开发中')}>AI优化话术</Button>
          </Space>
          <Space>
            <Select defaultValue="all" className="w-28" options={[
              { value: 'all', label: '全部状态' },
              { value: 'running', label: '执行中' },
              { value: 'paused', label: '已暂停' },
              { value: 'completed', label: '已完成' },
              { value: 'draft', label: '草稿' },
            ]} />
          </Space>
        </div>
      </Card>

      {/* 任务列表 */}
      <Card title="引流任务列表" className="mb-6">
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 发送记录 */}
      <Card title="最近发送记录">
        <Table
          columns={recordColumns}
          dataSource={records}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* 创建/编辑任务弹窗 */}
      <Modal
        title={taskType === 'edit' ? '编辑引流任务' : '新建引流任务'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingTask(null); form.resetFields() }}
        onOk={handleSave}
        okText="保存"
        width={700}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="如：企业服务精准获客" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'auto', label: '自动执行' },
                  { value: 'manual', label: '手动执行' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetCount" label="目标发送数" rules={[{ required: true, message: '请输入目标数量' }]}>
                <Input type="number" placeholder="如：500" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="targetKeywords" label="目标关键词" rules={[{ required: true, message: '请选择目标关键词' }]}>
            <Select mode="tags" placeholder="输入关键词后按回车" />
          </Form.Item>

          <Form.Item name="content" label="引流话术" rules={[{ required: true, message: '请输入引流话术' }]}>
            <TextArea rows={4} placeholder="输入引流消息内容，支持多个版本随机发送" />
          </Form.Item>

          <Divider>二维码设置</Divider>

          <Form.Item name="qrcodeEnabled" label="自动发送二维码" valuePropName="checked" extra="开启后，潜客回复消息后自动发送企业微信二维码">
            <Switch />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="delay" label="发送延迟（秒）" extra="设置发送延迟，避免被平台检测">
                <Input type="number" placeholder="30" suffix="秒" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dailyLimit" label="每日发送上限" extra="限制每天最大发送量">
                <Input type="number" placeholder="100" suffix="条/天" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>定时设置</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
