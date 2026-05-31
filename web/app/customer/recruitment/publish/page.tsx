'use client'

import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Modal,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface JobPosition {
  id: string
  title: string
  department: string
  location: string
  salaryMin: number
  salaryMax: number
  experience: string
  education: string
  description?: string
  status: 'active' | 'closed' | 'draft'
  createdAt: string
  applicants: number
}

export default function JobPublishPage() {
  const [jobs, setJobs] = useState<JobPosition[]>([
    {
      id: '1',
      title: '前端开发工程师',
      department: '技术部',
      location: '北京',
      salaryMin: 15,
      salaryMax: 25,
      experience: '3-5年',
      education: '本科',
      status: 'active',
      createdAt: '2024-03-25',
      applicants: 42,
    },
    {
      id: '2',
      title: '产品经理',
      department: '产品部',
      location: '上海',
      salaryMin: 20,
      salaryMax: 35,
      experience: '5-10年',
      education: '本科',
      status: 'active',
      createdAt: '2024-03-24',
      applicants: 28,
    },
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  const statusConfig = {
    active: { text: '招聘中', color: 'success' },
    closed: { text: '已关闭', color: 'default' },
    draft: { text: '草稿', color: 'warning' },
  }

  const columns = [
    { title: '职位名称', dataIndex: 'title', key: 'title' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    {
      title: '薪资',
      key: 'salary',
      render: (_: any, record: JobPosition) => (
        `${record.salaryMin}-${record.salaryMax}K`
      ),
    },
    { title: '工作地点', dataIndex: 'location', key: 'location' },
    { title: '经验要求', dataIndex: 'experience', key: 'experience' },
    { title: '学历要求', dataIndex: 'education', key: 'education' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    { title: '投递人数', dataIndex: 'applicants', key: 'applicants' },
    { title: '发布时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: JobPosition) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ]

  const handleAdd = () => {
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const newJob: JobPosition = {
        id: Date.now().toString(),
        ...values,
        status: 'active',
        createdAt: new Date().toLocaleDateString(),
        applicants: 0,
      }
      setJobs([...jobs, newJob])
      setIsModalVisible(false)
      form.resetFields()
      message.success('发布成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">职位发布</Title>
          <Text type="secondary">发布招聘职位，AI自动生成职位描述</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          发布新职位
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {jobs.filter(j => j.status === 'active').length}
              </div>
              <div className="text-gray-600 text-sm">招聘中</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {jobs.reduce((sum, j) => sum + j.applicants, 0)}
              </div>
              <div className="text-gray-600 text-sm">总投递数</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">85%</div>
              <div className="text-gray-600 text-sm">回复率</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">12</div>
              <div className="text-gray-600 text-sm">待面试</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="职位列表">
        <Table
          dataSource={jobs}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="发布新职位"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="职位名称" name="title" rules={[{ required: true }]}>
                <Input placeholder="例如：前端开发工程师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="所属部门" name="department" rules={[{ required: true }]}>
                <Select options={[{ label: '技术部', value: '技术部' }, { label: '产品部', value: '产品部' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="工作地点" name="location" rules={[{ required: true }]}>
                <Input placeholder="例如：北京" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="经验要求" name="experience" rules={[{ required: true }]}>
                <Select options={[{ label: '1-3年', value: '1-3年' }, { label: '3-5年', value: '3-5年' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="最低薪资(K)" name="salaryMin" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最高薪资(K)" name="salaryMax" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="学历要求" name="education" rules={[{ required: true }]}>
                <Select options={[{ label: '本科', value: '本科' }, { label: '硕士', value: '硕士' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="职位描述" name="description">
            <TextArea rows={4} placeholder="输入职位描述，或使用AI自动生成" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
