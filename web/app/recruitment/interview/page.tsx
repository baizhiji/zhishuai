'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
  Tabs,
  Statistic,
  Popconfirm,
  Descriptions,
  Divider,
  Avatar,
  Timeline,
  Rate,
} from 'antd'
import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  MailOutlined,
  EditOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

interface Interview {
  id: string
  candidateName: string
  candidateAvatar?: string
  candidatePhone: string
  candidateEmail?: string
  position: string
  interviewTime: string
  interviewer: string
  interviewType: 'video' | 'phone' | 'onsite'
  status: 'pending' | 'passed' | 'rejected' | 'cancelled'
  feedback?: string
  rating?: number
  notes?: string
  createdAt: string
}

export default function InterviewManagementPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [form] = Form.useForm()
  const [feedbackForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interviews')
      if (saved) {
        try {
          setInterviews(JSON.parse(saved))
        } catch (error) {
          console.error('加载面试数据失败:', error)
        }
      } else {
        // 初始化模拟数据
        const mockInterviews: Interview[] = [
          {
            id: '1',
            candidateName: '张伟',
            candidateAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
            candidatePhone: '138****1234',
            candidateEmail: 'zhangwei@email.com',
            position: '前端开发工程师',
            interviewTime: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'),
            interviewer: '李经理',
            interviewType: 'video',
            status: 'pending',
            createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
          },
          {
            id: '2',
            candidateName: '王芳',
            candidatePhone: '139****5678',
            position: '产品经理',
            interviewTime: dayjs().add(2, 'day').format('YYYY-MM-DD HH:mm'),
            interviewer: '张总监',
            interviewType: 'onsite',
            status: 'pending',
            createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
          },
          {
            id: '3',
            candidateName: '李明',
            candidatePhone: '137****9012',
            position: '后端开发工程师',
            interviewTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
            interviewer: '王技术',
            interviewType: 'video',
            status: 'passed',
            rating: 4,
            feedback: '技术扎实，沟通能力良好，适合团队协作',
            createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
          },
          {
            id: '4',
            candidateName: '赵丽',
            candidatePhone: '136****3456',
            position: 'UI设计师',
            interviewTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
            interviewer: '刘总监',
            interviewType: 'phone',
            status: 'rejected',
            feedback: '经验略有不足，建议积累更多项目经验后再次申请',
            createdAt: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm'),
          },
        ]
        setInterviews(mockInterviews)
        localStorage.setItem('interviews', JSON.stringify(mockInterviews))
      }
    }
  }

  const saveInterviews = (newInterviews: Interview[]) => {
    setInterviews(newInterviews)
    localStorage.setItem('interviews', JSON.stringify(newInterviews))
  }

  const handleAddInterview = async () => {
    try {
      const values = await form.validateFields()
      const newInterview: Interview = {
        id: Date.now().toString(),
        ...values,
        interviewTime: values.interviewRange
          ? values.interviewRange[0].format('YYYY-MM-DD HH:mm')
          : '',
        status: 'pending',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      }
      const newInterviews = [newInterview, ...interviews]
      saveInterviews(newInterviews)
      message.success('面试安排成功')
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handlePass = (record: Interview) => {
    const newInterviews = interviews.map((item) =>
      item.id === record.id ? { ...item, status: 'passed' as const } : item
    )
    saveInterviews(newInterviews)
    message.success(`已通过 ${record.candidateName} 的面试`)
  }

  const handleReject = (record: Interview) => {
    const newInterviews = interviews.map((item) =>
      item.id === record.id ? { ...item, status: 'rejected' as const } : item
    )
    saveInterviews(newInterviews)
    message.warning(`已拒绝 ${record.candidateName} 的面试`)
  }

  const handleCancel = (record: Interview) => {
    const newInterviews = interviews.map((item) =>
      item.id === record.id ? { ...item, status: 'cancelled' as const } : item
    )
    saveInterviews(newInterviews)
    message.info(`已取消 ${record.candidateName} 的面试`)
  }

  const handleDelete = (record: Interview) => {
    const newInterviews = interviews.filter((item) => item.id !== record.id)
    saveInterviews(newInterviews)
    message.success('面试记录已删除')
  }

  const handleViewDetail = (record: Interview) => {
    setSelectedInterview(record)
    setIsDetailModalVisible(true)
  }

  const handleSubmitFeedback = async () => {
    try {
      const values = await feedbackForm.validateFields()
      if (selectedInterview) {
        const newInterviews = interviews.map((item) =>
          item.id === selectedInterview.id
            ? { ...item, ...values }
            : item
        )
        saveInterviews(newInterviews)
        message.success('面试反馈已提交')
        setIsFeedbackModalVisible(false)
        setIsDetailModalVisible(false)
        feedbackForm.resetFields()
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const showFeedbackModal = () => {
    if (selectedInterview) {
      feedbackForm.setFieldsValue({
        feedback: selectedInterview.feedback || '',
        rating: selectedInterview.rating || 3,
      })
      setIsFeedbackModalVisible(true)
    }
  }

  // 统计数据
  const totalInterviews = interviews.length
  const pendingInterviews = interviews.filter((i) => i.status === 'pending').length
  const passedInterviews = interviews.filter((i) => i.status === 'passed').length
  const rejectedInterviews = interviews.filter((i) => i.status === 'rejected').length
  const todayInterviews = interviews.filter(
    (i) => dayjs(i.interviewTime).isSame(dayjs(), 'day')
  ).length

  // 筛选数据
  const filteredInterviews = interviews.filter((interview) => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return interview.status === 'pending'
    if (activeTab === 'passed') return interview.status === 'passed'
    if (activeTab === 'rejected') return interview.status === 'rejected'
    if (activeTab === 'today')
      return dayjs(interview.interviewTime).isSame(dayjs(), 'day')
    return true
  })

  const getStatusTag = (status: Interview['status']) => {
    const statusMap = {
      pending: { color: 'blue', text: '待面试' },
      passed: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' },
      cancelled: { color: 'default', text: '已取消' },
    }
    const { color, text } = statusMap[status]
    return <Tag color={color}>{text}</Tag>
  }

  const getTypeIcon = (type: Interview['interviewType']) => {
    const iconMap = {
      video: <VideoCameraOutlined />,
      phone: <PhoneOutlined />,
      onsite: <UserOutlined />,
    }
    return iconMap[type]
  }

  const getTypeText = (type: Interview['interviewType']) => {
    const textMap = {
      video: '视频面试',
      phone: '电话面试',
      onsite: '现场面试',
    }
    return textMap[type]
  }

  const columns = [
    {
      title: '候选人',
      key: 'candidate',
      render: (_: any, record: Interview) => (
        <Space>
          <Avatar src={record.candidateAvatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.candidateName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.candidatePhone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '应聘职位',
      dataIndex: 'position',
      key: 'position',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '面试时间',
      dataIndex: 'interviewTime',
      key: 'interviewTime',
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined />
          {time}
        </Space>
      ),
    },
    {
      title: '面试方式',
      dataIndex: 'interviewType',
      key: 'interviewType',
      render: (type: Interview['interviewType']) => (
        <Space>
          {getTypeIcon(type)}
          {getTypeText(type)}
        </Space>
      ),
    },
    {
      title: '面试官',
      dataIndex: 'interviewer',
      key: 'interviewer',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Interview['status']) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Interview) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handlePass(record)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="确定要取消这场面试吗？"
              onConfirm={() => handleCancel(record)}
            >
              <Button type="link" size="small">
                取消
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Title level={2} className="mb-2">
        面试管理
      </Title>
      <Text type="secondary" className="mb-6 block">
        安排和管理面试流程，跟踪面试结果
      </Text>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="面试总数"
              value={totalInterviews}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待面试"
              value={pendingInterviews}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日面试"
              value={todayInterviews}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="面试通过率"
              value={totalInterviews > 0 ? Math.round((passedInterviews / totalInterviews) * 100) : 0}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tab 切换 */}
      <Card className="mb-6">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: `全部 (${totalInterviews})` },
            { key: 'today', label: `今日 (${todayInterviews})` },
            { key: 'pending', label: `待面试 (${pendingInterviews})` },
            { key: 'passed', label: `已通过 (${passedInterviews})` },
            { key: 'rejected', label: `已拒绝 (${rejectedInterviews})` },
          ]}
          tabBarExtraContent={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              安排面试
            </Button>
          }
        />
      </Card>

      {/* 面试列表 */}
      <Card title="面试日程">
        <Table
          dataSource={filteredInterviews}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 添加面试弹窗 */}
      <Modal
        title="安排面试"
        open={isModalVisible}
        onOk={handleAddInterview}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        okText="确认安排"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="candidateName"
            label="候选人姓名"
            rules={[{ required: true, message: '请输入候选人姓名' }]}
          >
            <Input placeholder="请输入候选人姓名" />
          </Form.Item>
          <Form.Item
            name="candidatePhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="candidateEmail" label="电子邮箱">
            <Input placeholder="请输入电子邮箱" />
          </Form.Item>
          <Form.Item
            name="position"
            label="应聘职位"
            rules={[{ required: true, message: '请选择应聘职位' }]}
          >
            <Select
              placeholder="请选择应聘职位"
              options={[
                { value: '前端开发工程师', label: '前端开发工程师' },
                { value: '后端开发工程师', label: '后端开发工程师' },
                { value: '产品经理', label: '产品经理' },
                { value: 'UI设计师', label: 'UI设计师' },
                { value: '测试工程师', label: '测试工程师' },
                { value: '运营专员', label: '运营专员' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="interviewer"
            label="面试官"
            rules={[{ required: true, message: '请输入面试官姓名' }]}
          >
            <Input placeholder="请输入面试官姓名" />
          </Form.Item>
          <Form.Item
            name="interviewRange"
            label="面试时间"
            rules={[{ required: true, message: '请选择面试时间' }]}
          >
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="interviewType"
            label="面试方式"
            rules={[{ required: true, message: '请选择面试方式' }]}
          >
            <Select
              placeholder="请选择面试方式"
              options={[
                { value: 'video', label: '视频面试' },
                { value: 'phone', label: '电话面试' },
                { value: 'onsite', label: '现场面试' },
              ]}
            />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 面试详情弹窗 */}
      <Modal
        title="面试详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={
          selectedInterview?.status === 'pending' && (
            <Space>
              <Button onClick={() => setIsDetailModalVisible(false)}>关闭</Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handlePass(selectedInterview)}
              >
                通过
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => handleReject(selectedInterview)}>
                拒绝
              </Button>
            </Space>
          )
        }
        width={700}
      >
        {selectedInterview && (
          <div>
            <Card size="small" className="mb-4">
              <Descriptions column={2}>
                <Descriptions.Item label="候选人">
                  <Space>
                    <Avatar src={selectedInterview.candidateAvatar} icon={<UserOutlined />} />
                    {selectedInterview.candidateName}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="联系电话">
                  {selectedInterview.candidatePhone}
                </Descriptions.Item>
                <Descriptions.Item label="应聘职位">
                  <Tag color="blue">{selectedInterview.position}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="面试官">
                  {selectedInterview.interviewer}
                </Descriptions.Item>
                <Descriptions.Item label="面试时间">
                  <Space>
                    <ClockCircleOutlined />
                    {selectedInterview.interviewTime}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="面试方式">
                  <Space>
                    {getTypeIcon(selectedInterview.interviewType)}
                    {getTypeText(selectedInterview.interviewType)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {getStatusTag(selectedInterview.status)}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {selectedInterview.createdAt}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedInterview.feedback && (
              <Card size="small" title="面试反馈" className="mb-4">
                <Descriptions column={1}>
                  <Descriptions.Item label="评分">
                    <Rate disabled defaultValue={selectedInterview.rating} />
                  </Descriptions.Item>
                  <Descriptions.Item label="反馈内容">
                    {selectedInterview.feedback}
                  </Descriptions.Item>
                </Descriptions>
                <Divider />
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={showFeedbackModal}
                >
                  修改反馈
                </Button>
              </Card>
            )}

            {selectedInterview.status === 'pending' && !selectedInterview.feedback && (
              <Card size="small" title="面试反馈" className="mb-4">
                <Text type="secondary">暂无反馈</Text>
                <Divider />
                <Button
                  type="link"
                  icon={<FileTextOutlined />}
                  onClick={showFeedbackModal}
                >
                  填写反馈
                </Button>
              </Card>
            )}

            {/* 面试时间线 */}
            <Card size="small" title="面试流程">
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <>
                        <div>简历投递</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {selectedInterview.createdAt}
                        </Text>
                      </>
                    ),
                  },
                  {
                    color: selectedInterview.status === 'pending' ? 'blue' : 'green',
                    children: (
                      <>
                        <div>面试安排</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {selectedInterview.interviewTime}
                        </Text>
                      </>
                    ),
                  },
                  {
                    color:
                      selectedInterview.status === 'passed'
                        ? 'green'
                        : selectedInterview.status === 'rejected'
                          ? 'red'
                          : 'gray',
                    children:
                      selectedInterview.status === 'pending'
                        ? '等待面试'
                        : selectedInterview.status === 'passed'
                          ? '面试通过'
                          : selectedInterview.status === 'rejected'
                            ? '面试未通过'
                            : '已取消',
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </Modal>

      {/* 面试反馈弹窗 */}
      <Modal
        title="填写面试反馈"
        open={isFeedbackModalVisible}
        onOk={handleSubmitFeedback}
        onCancel={() => {
          setIsFeedbackModalVisible(false)
          feedbackForm.resetFields()
        }}
        okText="提交反馈"
        cancelText="取消"
      >
        <Form form={feedbackForm} layout="vertical">
          <Form.Item
            name="rating"
            label="面试评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="feedback"
            label="反馈内容"
            rules={[{ required: true, message: '请填写反馈内容' }]}
          >
            <TextArea rows={4} placeholder="请输入面试反馈内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
