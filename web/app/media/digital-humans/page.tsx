'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  message,
  Image,
  Upload,
  Form,
  Input,
  Select,
  Radio,
  Divider,
  Avatar,
  Popconfirm,
  Empty,
  Tabs,
} from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  RobotOutlined,
  ApiOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { DigitalHuman, DigitalHumanType } from '@/lib/content/types'

const { Title, Text } = Typography

export default function DigitalHumanWarehousePage() {
  const [digitalHumans, setDigitalHumans] = useState<DigitalHuman[]>([])
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isApiModalVisible, setIsApiModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // 从 localStorage 加载数字人数据
  useEffect(() => {
    loadDigitalHumans()
  }, [])

  const loadDigitalHumans = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('digital-humans')
      if (saved) {
        try {
          setDigitalHumans(JSON.parse(saved))
        } catch (error) {
          console.error('加载数字人失败:', error)
        }
      }

      // 初始化系统自带数字人
      initializeSystemDigitalHumans()
    }
  }

  const initializeSystemDigitalHumans = () => {
    if (typeof window !== 'undefined') {
      const systemHumans: DigitalHuman[] = [
        {
          id: 'system_male_1',
          name: '商务男1',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150?text=男1',
          gender: 'male',
          ageRange: '30-35',
          style: '商务',
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_1',
          name: '商务女1',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150?text=女1',
          gender: 'female',
          ageRange: '28-32',
          style: '商务',
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_male_2',
          name: '活泼男1',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150?text=男2',
          gender: 'male',
          ageRange: '25-30',
          style: '活泼',
          createdAt: Date.now(),
          status: 'active',
        },
        {
          id: 'system_female_2',
          name: '活泼女1',
          type: DigitalHumanType.SYSTEM,
          avatar: 'https://via.placeholder.com/150?text=女2',
          gender: 'female',
          ageRange: '23-28',
          style: '活泼',
          createdAt: Date.now(),
          status: 'active',
        },
      ]

      // 合并系统数字人和已存在的数字人
      const existing = localStorage.getItem('digital-humans')
      const existingHumans = existing ? JSON.parse(existing) : []

      // 过滤出非系统数字人
      const nonSystemHumans = existingHumans.filter((h: DigitalHuman) => h.type !== DigitalHumanType.SYSTEM)

      // 合并
      const allHumans = [...systemHumans, ...nonSystemHumans]
      localStorage.setItem('digital-humans', JSON.stringify(allHumans))
      setDigitalHumans(allHumans)
    }
  }

  // 上传真人照片克隆
  const handlePhotoClone = async (values: any) => {
    setLoading(true)
    try {
      // 模拟克隆过程
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newHuman: DigitalHuman = {
        id: `cloned_photo_${Date.now()}`,
        name: values.name || `克隆数字人-${digitalHumans.length + 1}`,
        type: DigitalHumanType.CLONED,
        avatar: 'https://via.placeholder.com/150?text=克隆',
        gender: values.gender,
        ageRange: values.ageRange,
        style: values.style,
        createdAt: Date.now(),
        status: 'active',
      }

      const updatedHumans = [...digitalHumans, newHuman]
      setDigitalHumans(updatedHumans)
      localStorage.setItem('digital-humans', JSON.stringify(updatedHumans))

      setIsAddModalVisible(false)
      message.success('数字人克隆成功！')
    } catch (error) {
      message.error('克隆失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 上传真人视频克隆
  const handleVideoClone = async (values: any) => {
    setLoading(true)
    try {
      // 模拟克隆过程
      await new Promise(resolve => setTimeout(resolve, 3000))

      const newHuman: DigitalHuman = {
        id: `cloned_video_${Date.now()}`,
        name: values.name || `克隆数字人-${digitalHumans.length + 1}`,
        type: DigitalHumanType.CLONED,
        avatar: 'https://via.placeholder.com/150?text=视频克隆',
        gender: values.gender,
        ageRange: values.ageRange,
        style: values.style,
        createdAt: Date.now(),
        status: 'active',
      }

      const updatedHumans = [...digitalHumans, newHuman]
      setDigitalHumans(updatedHumans)
      localStorage.setItem('digital-humans', JSON.stringify(updatedHumans))

      setIsAddModalVisible(false)
      message.success('数字人克隆成功！')
    } catch (error) {
      message.error('克隆失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 从API调用数字人
  const handleApiCall = async (values: any) => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newHuman: DigitalHuman = {
        id: `api_${Date.now()}`,
        name: values.name || `API数字人-${digitalHumans.length + 1}`,
        type: DigitalHumanType.API,
        avatar: 'https://via.placeholder.com/150?text=API',
        gender: values.gender,
        ageRange: values.ageRange,
        style: values.style,
        createdAt: Date.now(),
        status: 'active',
      }

      const updatedHumans = [...digitalHumans, newHuman]
      setDigitalHumans(updatedHumans)
      localStorage.setItem('digital-humans', JSON.stringify(updatedHumans))

      setIsApiModalVisible(false)
      message.success('数字人添加成功！')
    } catch (error) {
      message.error('添加失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除数字人
  const handleDelete = (id: string) => {
    if (id.startsWith('system_')) {
      message.warning('系统自带数字人不能删除')
      return
    }

    const newHumans = digitalHumans.filter((h) => h.id !== id)
    setDigitalHumans(newHumans)
    localStorage.setItem('digital-humans', JSON.stringify(newHumans))
    message.success('已删除')
  }

  // 筛选数字人
  const filteredHumans = digitalHumans.filter((human) => {
    if (activeTab === 'all') return true
    return human.type === activeTab
  })

  // 表格列定义
  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => (
        <Avatar src={avatar} size={60} />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DigitalHuman) => (
        <Space>
          <Text strong>{name}</Text>
          {record.type === DigitalHumanType.SYSTEM && (
            <Tag color="blue">系统自带</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: DigitalHumanType) => {
        const typeMap = {
          [DigitalHumanType.SYSTEM]: { label: '系统自带', color: 'blue', icon: <RobotOutlined /> },
          [DigitalHumanType.CLONED]: { label: '克隆', color: 'green', icon: <CameraOutlined /> },
          [DigitalHumanType.API]: { label: 'API', color: 'purple', icon: <ApiOutlined /> },
        }
        const config = typeMap[type]
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => gender === 'male' ? '男' : '女',
    },
    {
      title: '年龄范围',
      dataIndex: 'ageRange',
      key: 'ageRange',
      width: 100,
    },
    {
      title: '风格',
      dataIndex: 'style',
      key: 'style',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: DigitalHuman) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.type === DigitalHumanType.SYSTEM}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2}>数字人仓库</Title>
        <Text type="secondary">
          管理您的数字人，支持真人克隆、系统自带和API调用的数字人
        </Text>
      </div>

      {/* 操作按钮 */}
      <Card className="mb-4">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
          >
            克隆数字人
          </Button>
          <Button
            icon={<ApiOutlined />}
            onClick={() => setIsApiModalVisible(true)}
          >
            从API添加
          </Button>
          <Button
            icon={<VideoCameraOutlined />}
            onClick={() => window.location.href = '/media/factory'}
          >
            使用数字人生成视频
          </Button>
        </Space>
      </Card>

      {/* 数字人列表 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: `全部 (${digitalHumans.length})`,
            },
            {
              key: DigitalHumanType.SYSTEM,
              label: `系统自带 (${digitalHumans.filter(h => h.type === DigitalHumanType.SYSTEM).length})`,
            },
            {
              key: DigitalHumanType.CLONED,
              label: `克隆 (${digitalHumans.filter(h => h.type === DigitalHumanType.CLONED).length})`,
            },
            {
              key: DigitalHumanType.API,
              label: `API (${digitalHumans.filter(h => h.type === DigitalHumanType.API).length})`,
            },
          ]}
        />

        <div className="mt-4">
          {filteredHumans.length === 0 ? (
            <Empty description="暂无数字人" />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredHumans}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个数字人`,
              }}
            />
          )}
        </div>
      </Card>

      {/* 克隆数字人模态框 */}
      <Modal
        title="克隆数字人"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        width={600}
      >
        <Tabs
          items={[
            {
              key: 'photo',
              label: '照片克隆',
              children: (
                <Form layout="vertical" onFinish={handlePhotoClone}>
                  <Form.Item
                    label="上传真人照片"
                    name="photo"
                    rules={[{ required: true, message: '请上传照片' }]}
                  >
                    <Upload
                      listType="picture-card"
                      maxCount={1}
                      beforeUpload={() => false}
                    >
                      <div>
                        <CameraOutlined />
                        <div style={{ marginTop: 8 }}>上传照片</div>
                      </div>
                    </Upload>
                  </Form.Item>
                  <Form.Item
                    label="数字人名称"
                    name="name"
                    rules={[{ required: true, message: '请输入名称' }]}
                  >
                    <Input placeholder="为数字人起个名字" />
                  </Form.Item>
                  <Form.Item
                    label="性别"
                    name="gender"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Radio.Group>
                      <Radio value="male">男</Radio>
                      <Radio value="female">女</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    label="年龄范围"
                    name="ageRange"
                    rules={[{ required: true, message: '请选择年龄范围' }]}
                  >
                    <Select>
                      <Select.Option value="18-25">18-25岁</Select.Option>
                      <Select.Option value="25-30">25-30岁</Select.Option>
                      <Select.Option value="30-35">30-35岁</Select.Option>
                      <Select.Option value="35-40">35-40岁</Select.Option>
                      <Select.Option value="40-50">40-50岁</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label="风格"
                    name="style"
                    rules={[{ required: true, message: '请选择风格' }]}
                  >
                    <Select>
                      <Select.Option value="商务">商务</Select.Option>
                      <Select.Option value="活泼">活泼</Select.Option>
                      <Select.Option value="亲和">亲和</Select.Option>
                      <Select.Option value="专业">专业</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                    >
                      开始克隆
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'video',
              label: '视频克隆',
              children: (
                <Form layout="vertical" onFinish={handleVideoClone}>
                  <Form.Item
                    label="上传真人视频"
                    name="video"
                    rules={[{ required: true, message: '请上传视频' }]}
                  >
                    <Upload
                      listType="text"
                      maxCount={1}
                      beforeUpload={() => false}
                    >
                      <Button icon={<UploadOutlined />}>选择视频文件</Button>
                    </Upload>
                  </Form.Item>
                  <Form.Item
                    label="数字人名称"
                    name="name"
                    rules={[{ required: true, message: '请输入名称' }]}
                  >
                    <Input placeholder="为数字人起个名字" />
                  </Form.Item>
                  <Form.Item
                    label="性别"
                    name="gender"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Radio.Group>
                      <Radio value="male">男</Radio>
                      <Radio value="female">女</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    label="年龄范围"
                    name="ageRange"
                    rules={[{ required: true, message: '请选择年龄范围' }]}
                  >
                    <Select>
                      <Select.Option value="18-25">18-25岁</Select.Option>
                      <Select.Option value="25-30">25-30岁</Select.Option>
                      <Select.Option value="30-35">30-35岁</Select.Option>
                      <Select.Option value="35-40">35-40岁</Select.Option>
                      <Select.Option value="40-50">40-50岁</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label="风格"
                    name="style"
                    rules={[{ required: true, message: '请选择风格' }]}
                  >
                    <Select>
                      <Select.Option value="商务">商务</Select.Option>
                      <Select.Option value="活泼">活泼</Select.Option>
                      <Select.Option value="亲和">亲和</Select.Option>
                      <Select.Option value="专业">专业</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                    >
                      开始克隆
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Modal>

      {/* API添加模态框 */}
      <Modal
        title="从API添加数字人"
        open={isApiModalVisible}
        onCancel={() => setIsApiModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleApiCall}>
          <Form.Item
            label="API提供商"
            name="provider"
            rules={[{ required: true, message: '请选择API提供商' }]}
          >
            <Select>
              <Select.Option value="provider1">API提供商1</Select.Option>
              <Select.Option value="provider2">API提供商2</Select.Option>
              <Select.Option value="provider3">API提供商3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="选择数字人"
            name="apiHumanId"
            rules={[{ required: true, message: '请选择数字人' }]}
          >
            <Select placeholder="从API选择数字人">
              <Select.Option value="api1">数字人1</Select.Option>
              <Select.Option value="api2">数字人2</Select.Option>
              <Select.Option value="api3">数字人3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="数字人名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="为数字人起个名字" />
          </Form.Item>
          <Form.Item
            label="性别"
            name="gender"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Radio.Group>
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="年龄范围"
            name="ageRange"
            rules={[{ required: true, message: '请选择年龄范围' }]}
          >
            <Select>
              <Select.Option value="18-25">18-25岁</Select.Option>
              <Select.Option value="25-30">25-30岁</Select.Option>
              <Select.Option value="30-35">30-35岁</Select.Option>
              <Select.Option value="35-40">35-40岁</Select.Option>
              <Select.Option value="40-50">40-50岁</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="风格"
            name="style"
            rules={[{ required: true, message: '请选择风格' }]}
          >
            <Select>
              <Select.Option value="商务">商务</Select.Option>
              <Select.Option value="活泼">活泼</Select.Option>
              <Select.Option value="亲和">亲和</Select.Option>
              <Select.Option value="专业">专业</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              添加数字人
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
