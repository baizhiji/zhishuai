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
  Select,
  message,
  Modal,
  Checkbox,
  Input,
  Form,
  Image,
  Upload,
  DatePicker,
  Radio,
  Drawer,
  List,
  Divider,
  Badge,
  Progress,
  Tooltip,
  Popconfirm,
} from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import {
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text, TextArea } = Typography
const { RangePicker } = DatePicker

interface PublishTask {
  id: string
  type: 'text' | 'image' | 'video' | 'digital-human'
  title: string
  content: string
  thumbnail?: string
  file?: UploadFile
  platforms: string[]
  scheduledTime?: string
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed'
  createdAt: string
  publishedAt?: string
  error?: string
}

interface Material {
  id: string
  type: 'text' | 'image' | 'video'
  content: string
  timestamp: number
  status: 'unused' | 'used'
}

export default function PublishCenterPage() {
  const [tasks, setTasks] = useState<PublishTask[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [isPublishModalVisible, setIsPublishModalVisible] = useState(false)
  const [isMaterialDrawerVisible, setIsMaterialDrawerVisible] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate')
  const [form] = Form.useForm()

  // 从 localStorage 加载数据
  useEffect(() => {
    // 加载发布任务
    const savedTasks = localStorage.getItem('publish-tasks')
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (error) {
        console.error('加载发布任务失败:', error)
      }
    }

    // 加载素材库
    const savedMaterials = localStorage.getItem('materials')
    if (savedMaterials) {
      try {
        setMaterials(JSON.parse(savedMaterials))
      } catch (error) {
        console.error('加载素材库失败:', error)
      }
    }
  }, [])

  // 保存发布任务到 localStorage
  useEffect(() => {
    localStorage.setItem('publish-tasks', JSON.stringify(tasks))
  }, [tasks])

  // 检查定时任务并自动发布
  useEffect(() => {
    const interval = setInterval(() => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.status === 'scheduled' && task.scheduledTime && task.scheduledTime <= now) {
            // 开始发布
            return { ...task, status: 'publishing' }
          }
          return task
        })
      )
    }, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [])

  // 平台选项
  const platformOptions = [
    { label: '抖音', value: 'douyin' },
    { label: '快手', value: 'kuaishou' },
    { label: '小红书', value: 'xiaohongshu' },
    { label: '视频号', value: 'weixin' },
    { label: 'B站', value: 'bilibili' },
  ]

  const platformLabel: Record<string, string> = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书',
    weixin: '视频号',
    bilibili: 'B站',
  }

  const statusConfig = {
    pending: { text: '待发布', color: 'default', icon: null },
    scheduled: { text: '已定时', color: 'processing', icon: <ClockCircleOutlined /> },
    publishing: { text: '发布中', color: 'processing', icon: <ReloadOutlined spin /> },
    published: { text: '已发布', color: 'success', icon: <CheckCircleOutlined /> },
    failed: { text: '失败', color: 'error', icon: null },
  }

  const typeConfig = {
    text: { label: '文本', color: 'blue', icon: <FileTextOutlined /> },
    image: { label: '图片', color: 'green', icon: <PictureOutlined /> },
    video: { label: '视频', color: 'purple', icon: <VideoCameraOutlined /> },
    'digital-human': { label: '数字人', color: 'orange', icon: <AppstoreOutlined /> },
  }

  // 文件上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    listType: 'picture-card',
    maxCount: 1,
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      if (!isVideo && !isImage) {
        message.error('只能上传视频或图片文件')
        return false
      }
      return false // 阻止自动上传，只显示预览
    },
  }

  // 打开发布模态框
  const handleOpenPublishModal = () => {
    setPublishType('immediate')
    form.resetFields()
    form.setFieldsValue({
      contentType: 'text',
      publishType: 'immediate',
    })
    setIsPublishModalVisible(true)
  }

  // 关闭发布模态框
  const handleClosePublishModal = () => {
    form.resetFields()
    setPublishType('immediate')
    setIsPublishModalVisible(false)
  }

  // 提交发布任务
  const handlePublish = async (values: any) => {
    if (!values.platforms || values.platforms.length === 0) {
      message.warning('请至少选择一个发布平台')
      return
    }

    const task: PublishTask = {
      id: `task_${Date.now()}`,
      type: values.contentType,
      title: values.title || '未命名',
      content: values.content || '',
      platforms: values.platforms,
      status: 'pending',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }

    // 如果是定时发布
    if (values.publishType === 'scheduled' && values.scheduledTime) {
      task.scheduledTime = values.scheduledTime.format('YYYY-MM-DD HH:mm:ss')
      task.status = 'scheduled'
    }

    // 如果上传了文件
    if (values.file && values.file.fileList && values.file.fileList.length > 0) {
      task.file = values.file.fileList[0]
      task.thumbnail = URL.createObjectURL(values.file.fileList[0].originFileObj as File)
    }

    setTasks([task, ...tasks])
    setIsPublishModalVisible(false)
    form.resetFields()

    // 如果是立即发布
    if (values.publishType === 'immediate') {
      await handlePublishTask(task.id)
    } else {
      message.success('发布任务创建成功')
    }
  }

  // 发布单个任务
  const handlePublishTask = async (taskId: string) => {
    setPublishing(true)
    setPublishProgress(0)

    // 模拟发布进度
    const progressInterval = setInterval(() => {
      setPublishProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)

    setTimeout(() => {
      clearInterval(progressInterval)
      setPublishProgress(100)

      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.id === taskId) {
            // 模拟部分平台发布失败
            const shouldFail = Math.random() > 0.8
            return {
              ...task,
              status: shouldFail ? 'failed' : 'published',
              publishedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              error: shouldFail ? '平台接口调用失败，请重试' : undefined,
            }
          }
          return task
        })
      )

      setPublishing(false)
      message.success('发布完成')
    }, 3000)
  }

  // 批量发布
  const handleBatchPublish = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要发布的任务')
      return
    }

    setPublishing(true)

    // 依次发布每个任务
    for (const taskId of selectedRowKeys) {
      await handlePublishTask(taskId as string)
    }

    setSelectedRowKeys([])
  }

  // 从素材库选择
  const handleSelectFromMaterial = (material: Material) => {
    form.setFieldsValue({
      contentType: material.type,
      content: material.content,
    })
    setIsMaterialDrawerVisible(false)
    message.success('已从素材库导入内容')
  }

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId))
    message.success('删除成功')
  }

  // 列配置
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const config = typeConfig[type as keyof typeof typeConfig]
        return (
          <Tooltip title={config.label}>
            <Tag color={config.color} icon={config.icon} />
          </Tooltip>
        )
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string, record: PublishTask) => {
        if (record.thumbnail) {
          return <Image src={record.thumbnail} width={60} height={40} />
        }
        return <Text type="secondary" ellipsis={{ tooltip: content }}>{content}</Text>
      },
    },
    {
      title: '发布平台',
      dataIndex: 'platforms',
      key: 'platforms',
      width: 150,
      render: (platforms: string[]) => (
        <Space size={4} wrap>
          {platforms.map((p) => (
            <Tag key={p}>{platformLabel[p]}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '定时发布',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 160,
      render: (time: string) => (time ? time : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: PublishTask) => {
        const config = statusConfig[status as keyof typeof statusConfig]
        return (
          <Space>
            {config.icon}
            <Tag color={config.color}>{config.text}</Tag>
          </Space>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: PublishTask) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => handlePublishTask(record.id)}
              disabled={publishing}
            >
              发布
            </Button>
          )}
          {record.status === 'published' && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => message.success('查看详情')}
            >
              查看
            </Button>
          )}
          {record.status === 'failed' && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => handlePublishTask(record.id)}
            >
              重试
            </Button>
          )}
          <Popconfirm
            title="确认删除"
            description="确定要删除这个任务吗？"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} disabled={publishing}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">发布中心</Title>
        <Text type="secondary">
          从素材库选择内容，一键发布到多个平台
        </Text>
      </div>

      {/* 发布进度 */}
      {publishing && (
        <Card className="mb-4" style={{ borderColor: '#1890ff' }}>
          <Space direction="vertical" className="w-full">
            <div className="flex justify-between items-center">
              <Space>
                <SendOutlined spin className="text-blue-500" />
                <Text strong>正在发布内容...</Text>
              </Space>
              <Text>{Math.round(publishProgress)}%</Text>
            </div>
            <Progress percent={Math.round(publishProgress)} status="active" />
          </Space>
        </Card>
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-gray-600 text-sm">待发布</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {tasks.filter(t => t.status === 'scheduled').length}
              </div>
              <div className="text-gray-600 text-sm">定时任务</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {tasks.filter(t => t.status === 'published').length}
              </div>
              <div className="text-gray-600 text-sm">已发布</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {tasks.filter(t => t.status === 'failed').length}
              </div>
              <div className="text-gray-600 text-sm">发布失败</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 发布任务列表 */}
      <Card
        title="发布任务"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Text type="secondary">已选择 {selectedRowKeys.length} 项</Text>
                <Divider type="vertical" />
              </>
            )}
            <Button icon={<InboxOutlined />} onClick={() => setIsMaterialDrawerVisible(true)}>
              素材库 ({materials.length})
            </Button>
            <Button icon={<PlusOutlined />} onClick={handleOpenPublishModal}>
              创建发布任务
            </Button>
            <Button type="primary" icon={<SendOutlined />} onClick={handleBatchPublish} disabled={publishing || selectedRowKeys.length === 0}>
              批量发布
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status === 'published' || record.status === 'publishing',
            }),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 发布任务创建模态框 - 测试版本 2: 添加简单 Form */}
      <Modal
        title="创建发布任务"
        open={isPublishModalVisible}
        onCancel={handleClosePublishModal}
        onOk={() => {
          console.log('Modal OK clicked - test version 2')
          form.submit()
        }}
        width={700}
        okText="创建任务"
        cancelText="取消"
        destroyOnClose={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            console.log('Form submitted:', values)
            setIsPublishModalVisible(false)
            message.success('测试成功: ' + JSON.stringify(values))
          }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="输入内容标题" maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* 素材库抽屉 */}
      <Drawer
        title="素材库"
        onClose={() => setIsMaterialDrawerVisible(false)}
        open={isMaterialDrawerVisible}
        width={600}
      >
        {materials.length === 0 ? (
          <div className="text-center py-8">
            <InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <div className="mt-4 text-gray-500">暂无素材</div>
            <div className="mt-2 text-gray-400 text-sm">请先到内容工厂生成内容</div>
          </div>
        ) : (
          <List
            dataSource={materials}
            renderItem={(material) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    onClick={() => handleSelectFromMaterial(material)}
                  >
                    使用
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="w-12 h-12 rounded bg-blue-50 flex items-center justify-center">
                      {material.type === 'text' && <FileTextOutlined className="text-blue-500" />}
                      {material.type === 'image' && <PictureOutlined className="text-green-500" />}
                      {material.type === 'video' && <VideoCameraOutlined className="text-purple-500" />}
                    </div>
                  }
                  title={
                    <Space>
                      <Tag color={typeConfig[material.type].color}>
                        {typeConfig[material.type].label}
                      </Tag>
                      <Tag color={material.status === 'unused' ? 'default' : 'success'}>
                        {material.status === 'unused' ? '未使用' : '已使用'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div className="text-gray-600 text-sm mb-1">
                        {material.content.slice(0, 100)}...
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(material.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  )
}
