'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Avatar,
  Empty,
  InputNumber,
  TimePicker,
  Alert,
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
  FileImageOutlined,
  HeartOutlined,
  ShoppingOutlined,
  RobotOutlined,
  FontSizeOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { ContentCategory, contentCategoryConfig } from '@/lib/content/types'
import { Platform, platformConfig, PlatformAccount, mockAccounts } from '@/lib/platform/config'

const { Title, Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

interface PublishTask {
  id: string
  type: 'text' | 'image' | 'video' | 'digital-human'
  title: string
  content: string
  thumbnail?: string
  file?: UploadFile
  platforms: string[]
  accounts: string[]  // 添加账号ID
  tags: string[]  // 添加标签
  scheduledTime?: string
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed'
  createdAt: string
  publishedAt?: string
  error?: string
}

interface Material {
  id: string
  type: string
  content: string
  title: string
  category: string  // 添加分类字段
  timestamp: number
  status: 'unused' | 'used'
}

interface Account {
  id: string
  platform: string
  accountName: string
  avatar: string
  fans: number
  status: 'active' | 'inactive' | 'expired'
  lastSync: string
  autoPublish: boolean
}

export default function PublishCenterPage() {
  const [tasks, setTasks] = useState<PublishTask[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [accounts, setAccounts] = useState<PlatformAccount[]>([])
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>('all')
  const [isPublishModalVisible, setIsPublishModalVisible] = useState(false)
  const [isMaterialDrawerVisible, setIsMaterialDrawerVisible] = useState(false)
  const [isBatchPublishModalVisible, setIsBatchPublishModalVisible] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled' | 'continuous'>('immediate')

  // 受控表单状态
  const [formData, setFormData] = useState({
    contentType: 'text',
    title: '',
    content: '',
    platform: '' as Platform,  // 单一平台
    accounts: [] as string[],  // 该平台的账号
    tags: [] as string[],  // 添加标签
    publishType: 'immediate' as 'immediate' | 'scheduled' | 'continuous',  // 添加连续发布
    scheduledTime: null as dayjs.Dayjs | null,
    continuousDays: 1,  // 连续发布天数
    continuousStartTime: null as dayjs.Dayjs | null,  // 连续发布开始时间
  })

  // 批量发布状态
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])  // 选中的素材ID列表
  const [batchPublishProgress, setBatchPublishProgress] = useState(0)  // 批量发布进度
  const [continuousStartDate, setContinuousStartDate] = useState<Dayjs | null>(dayjs())  // 连续发布开始日期
  const [batchScheduledTime, setBatchScheduledTime] = useState<Dayjs | null>(dayjs().hour(10).minute(0))  // 每天定时发布时间
  const [continuousDays, setContinuousDays] = useState(1)

  // 计算定时发布日期列表
  const scheduledDates = useMemo(() => {
    if (!continuousStartDate || continuousDays <= 0) return []
    return Array.from({ length: continuousDays }, (_, i) => {
      const date = continuousStartDate.add(i, 'day')
      if (batchScheduledTime) {
        return date.hour(batchScheduledTime.hour()).minute(batchScheduledTime.minute()).format('YYYY-MM-DD HH:mm')
      }
      return date.format('YYYY-MM-DD')
    })
  }, [continuousStartDate, continuousDays, batchScheduledTime])

  // 生成定时日期列表（用于列表展示）
  const generateScheduledDates = () => scheduledDates

  // 获取定时发布限制天数
  const getScheduledLimitDays = () => {
    if (!formData.platform) return 30
    return platformConfig[formData.platform]?.maxScheduledDays || 30
  }

  // 常用标签
  const popularTags = [
    'AI人工智能',
    '智枢AI',
    '科技分享',
    '教程',
    '干货',
    '短视频',
    '数字人',
    'AIGC',
    '自动化',
    '效率工具',
  ]

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

    // 加载账号数据（使用mockAccounts作为默认数据）
    const savedAccounts = localStorage.getItem('platform-accounts')
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts))
      } catch (error) {
        console.error('加载账号数据失败:', error)
        setAccounts(mockAccounts)
      }
    } else {
      setAccounts(mockAccounts)
      localStorage.setItem('platform-accounts', JSON.stringify(mockAccounts))
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
  const statusConfig = {
    pending: { text: '待发布', color: 'default', icon: null },
    scheduled: { text: '已定时', color: 'processing', icon: <ClockCircleOutlined /> },
    publishing: { text: '发布中', color: 'processing', icon: <ReloadOutlined spin /> },
    published: { text: '已发布', color: 'success', icon: <CheckCircleOutlined /> },
    failed: { text: '失败', color: 'error', icon: null },
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
    setFormData({
      contentType: 'text',
      title: '',
      content: '',
      platform: '' as Platform,
      accounts: [],
      tags: [],
      publishType: 'immediate',
      scheduledTime: null,
      continuousDays: 1,
      continuousStartTime: null,
    })
    setIsPublishModalVisible(true)
  }

  // 关闭发布模态框
  const handleClosePublishModal = () => {
    setPublishType('immediate')
    setIsPublishModalVisible(false)
  }

  // 从素材库选择素材
  const handleSelectMaterial = (material: Material) => {
    setFormData({
      ...formData,
      title: material.title || '',
      content: material.content,
      contentType: material.type as 'text' | 'image' | 'video',
    })
    setIsMaterialDrawerVisible(false)
    message.success('已选择素材')
  }

  // 打开批量发布模态框
  const handleOpenBatchPublishModal = () => {
    setSelectedMaterials([])
    setIsBatchPublishModalVisible(true)
  }

  // 执行批量发布
  const handleBatchPublish = async () => {
    if (selectedMaterials.length === 0) {
      message.warning('请至少选择一个素材')
      return
    }

    if (!formData.platform) {
      message.warning('请选择发布平台')
      return
    }

    if (formData.accounts.length === 0) {
      message.warning('请至少选择一个账号')
      return
    }

    setIsBatchPublishModalVisible(false)
    setPublishing(true)

    // 为每个选中的素材创建发布任务
    for (let i = 0; i < selectedMaterials.length; i++) {
      const materialId = selectedMaterials[i]
      const material = materials.find(m => m.id === materialId)

      if (material) {
        const task: PublishTask = {
          id: `task_${Date.now()}_${i}`,
          type: material.type as 'text' | 'image' | 'video',
          title: material.title || '未命名',
          content: material.content,
          platforms: [formData.platform],
          accounts: formData.accounts,
          tags: formData.tags,
          status: formData.publishType === 'immediate' ? 'publishing' : 'scheduled',
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }

        if (formData.publishType === 'scheduled' && formData.scheduledTime) {
          task.scheduledTime = formData.scheduledTime.format('YYYY-MM-DD HH:mm:ss')
        }

        setTasks(prevTasks => [task, ...prevTasks])

        // 更新进度
        setBatchPublishProgress(Math.round(((i + 1) / selectedMaterials.length) * 100))

        // 模拟发布延迟
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setPublishing(false)
    setBatchPublishProgress(0)
    message.success(`成功创建 ${selectedMaterials.length} 个发布任务`)
  }

  // 提交发布任务
  const handlePublish = async () => {
    if (!formData.title) {
      message.warning('请输入标题')
      return
    }

    if (!formData.content) {
      message.warning('请输入内容')
      return
    }

    if (!formData.platform) {
      message.warning('请选择发布平台')
      return
    }

    if (formData.accounts.length === 0) {
      message.warning('请至少选择一个账号')
      return
    }

    if (formData.publishType === 'scheduled' && !formData.scheduledTime) {
      message.warning('请选择发布时间')
      return
    }

    if (formData.publishType === 'continuous') {
      if (!formData.continuousStartTime) {
        message.warning('请选择开始发布时间')
        return
      }
      if (formData.continuousDays < 1 || formData.continuousDays > platformConfig[formData.platform].maxScheduledDays) {
        message.warning(`连续发布天数必须在1-${platformConfig[formData.platform].maxScheduledDays}之间`)
        return
      }
    }

    // 如果是连续多天发布，创建多个任务
    if (formData.publishType === 'continuous') {
      const newTasks: PublishTask[] = []
      for (let i = 0; i < formData.continuousDays; i++) {
        const scheduledTime = dayjs(formData.continuousStartTime).add(i, 'day')
        const task: PublishTask = {
          id: `task_${Date.now()}_${i}`,
          type: formData.contentType,
          title: formData.title,
          content: formData.content,
          platforms: [formData.platform],
          accounts: formData.accounts,
          tags: formData.tags,
          status: 'scheduled',
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          scheduledTime: scheduledTime.format('YYYY-MM-DD HH:mm:ss'),
        }
        newTasks.push(task)
      }
      setTasks([...newTasks, ...tasks])
      setIsPublishModalVisible(false)
      message.success(`已创建 ${formData.continuousDays} 个发布任务，将从 ${formData.continuousStartTime?.format('YYYY-MM-DD HH:mm:ss')} 开始连续发布`)
      return
    }

    // 单次发布
    const task: PublishTask = {
      id: `task_${Date.now()}`,
      type: formData.contentType,
      title: formData.title,
      content: formData.content,
      platforms: [formData.platform],
      accounts: formData.accounts,
      tags: formData.tags,
      status: 'pending',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }

    // 如果是定时发布
    if (formData.publishType === 'scheduled' && formData.scheduledTime) {
      task.scheduledTime = formData.scheduledTime.format('YYYY-MM-DD HH:mm:ss')
      task.status = 'scheduled'
    }

    setTasks([task, ...tasks])
    setIsPublishModalVisible(false)

    // 如果是立即发布
    if (formData.publishType === 'immediate') {
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
            <Tag key={p}>{platformConfig[p]?.label || p}</Tag>
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
            <Button type="primary" icon={<SendOutlined />} onClick={handleOpenBatchPublishModal}>
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

      {/* 发布任务创建模态框 - 受控组件版本 */}
      <Modal
        title="创建发布任务"
        open={isPublishModalVisible}
        onCancel={handleClosePublishModal}
        onOk={handlePublish}
        width={700}
        okText="创建任务"
        cancelText="取消"
        destroyOnClose={false}
      >
        <div style={{ padding: '20px' }}>
          {/* 素材选择 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              从素材库选择
            </label>
            <Button
              icon={<InboxOutlined />}
              onClick={() => setIsMaterialDrawerVisible(true)}
            >
              选择素材
            </Button>
            {formData.content && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                已选择素材
              </Text>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              内容类型 <span style={{ color: 'red' }}>*</span>
            </label>
            <Radio.Group
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
            >
              <Radio value="text">文本</Radio>
              <Radio value="image">图片</Radio>
              <Radio value="video">视频</Radio>
              <Radio value="digital-human">数字人</Radio>
            </Radio.Group>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              标题 <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              placeholder="输入内容标题"
              maxLength={100}
              showCount
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              内容 <span style={{ color: 'red' }}>*</span>
            </label>
            <TextArea
              rows={6}
              placeholder="输入发布内容，或从素材库选择"
              maxLength={2000}
              showCount
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <Button
              type="link"
              size="small"
              icon={<InboxOutlined />}
              onClick={() => setMaterialDrawerVisible(true)}
              style={{ marginTop: 4, padding: 0 }}
            >
              从素材库选择
            </Button>
          </div>

          {/* 平台选择 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              选择发布平台 <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              placeholder="请选择发布平台"
              style={{ width: '100%' }}
              value={formData.platform || undefined}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  platform: value as Platform,
                  accounts: [], // 清空已选账号
                })
              }}
            >
              {Object.values(Platform).map((platform) => (
                <Select.Option key={platform} value={platform}>
                  <Space>
                    <span style={{ color: platformConfig[platform].color }}>
                      ●
                    </span>
                    {platformConfig[platform].label}
                  </Space>
                </Select.Option>
              ))}
            </Select>
            {formData.platform && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                {platformConfig[formData.platform].label} 最多可定时 {platformConfig[formData.platform].maxScheduledDays} 天，
                每日最多发布 {platformConfig[formData.platform].maxVideosPerDay} 条内容
              </Text>
            )}
          </div>

          {/* 账号选择 */}
          {formData.platform && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                选择账号 <span style={{ color: 'red' }}>*</span>
              </label>
              {accounts.filter(a => a.platform === formData.platform).length > 0 ? (
                <Checkbox.Group
                  value={formData.accounts}
                  onChange={(values) => setFormData({ ...formData, accounts: values as string[] })}
                >
                  <Space direction="vertical">
                    {accounts.filter(a => a.platform === formData.platform).map((account) => (
                      <Checkbox key={account.id} value={account.id}>
                        <Space>
                          <Avatar src={account.avatar} size="small" />
                          <Text>{account.accountName}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {account.fans > 10000
                              ? `${(account.fans / 10000).toFixed(1)}万粉丝`
                              : `${account.fans}粉丝`
                            }
                          </Text>
                        </Space>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical">
                      <Text type="secondary">该平台暂无账号</Text>
                      <Button type="link" size="small" onClick={() => window.location.href = '/media/matrix'}>
                        去添加账号
                      </Button>
                    </Space>
                  }
                />
              )}
            </div>
          )}

          {/* 标签选择 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              话题/标签
            </label>
            <Checkbox.Group
              options={popularTags.map(tag => ({ label: tag, value: tag }))}
              value={formData.tags}
              onChange={(values) => setFormData({ ...formData, tags: values as string[] })}
            />
            <div style={{ marginTop: 8 }}>
              <Input
                placeholder="自定义标签（回车添加）"
                onPressEnter={(e) => {
                  const value = (e.target as HTMLInputElement).value.trim()
                  if (value && !formData.tags.includes(value)) {
                    setFormData({ ...formData, tags: [...formData.tags, value] })
                  }
                  (e.target as HTMLInputElement).value = ''
                }}
              />
            </div>
            {formData.tags.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {formData.tags.map((tag, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => {
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((_, i) => i !== index)
                        })
                      }}
                    >
                      #{tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              发布方式
            </label>
            <Radio.Group
              value={formData.publishType}
              onChange={(e) => {
                const newPublishType = e.target.value
                setPublishType(newPublishType)
                setFormData({ ...formData, publishType: newPublishType })
              }}
            >
              <Radio value="immediate">立即发布</Radio>
              <Radio value="scheduled">定时发布</Radio>
              <Radio value="continuous" disabled={!formData.platform}>
                连续多天发布
              </Radio>
            </Radio.Group>
          </div>

          {publishType === 'scheduled' && formData.platform && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                定时发布时间 <span style={{ color: 'red' }}>*</span>
              </label>
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择发布时间"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  if (!current) return false
                  const minDate = dayjs().endOf('day')
                  const maxDays = platformConfig[formData.platform].maxScheduledDays
                  const maxDate = dayjs().add(maxDays, 'day')
                  return current < minDate || current > maxDate
                }}
                value={formData.scheduledTime}
                onChange={(date) => setFormData({ ...formData, scheduledTime: date })}
              />
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                根据{platformConfig[formData.platform].label}规则，最多可定时 {platformConfig[formData.platform].maxScheduledDays} 天
              </Text>
            </div>
          )}

          {/* 连续多天发布 */}
          {publishType === 'continuous' && formData.platform && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  连续发布天数 <span style={{ color: 'red' }}>*</span>
                </label>
                <InputNumber
                  min={1}
                  max={platformConfig[formData.platform].maxScheduledDays}
                  value={formData.continuousDays}
                  onChange={(value) => setFormData({ ...formData, continuousDays: value || 1 })}
                  style={{ width: '100%' }}
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  根据{platformConfig[formData.platform].label}规则，最多连续发布 {platformConfig[formData.platform].maxScheduledDays} 天
                </Text>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  开始发布时间 <span style={{ color: 'red' }}>*</span>
                </label>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择开始发布时间"
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    if (!current) return false
                    const minDate = dayjs().endOf('day')
                    const maxDays = platformConfig[formData.platform].maxScheduledDays
                    const maxDate = dayjs().add(maxDays, 'day')
                    return current < minDate || current > maxDate
                  }}
                  value={formData.continuousStartTime}
                  onChange={(date) => setFormData({ ...formData, continuousStartTime: date })}
                />
              </div>

              <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  💡 连续发布说明：
                  <br />• 系统将为您自动创建 {formData.continuousDays} 个发布任务
                  <br />• 每天自动发布到所选账号
                  <br />• 发布时间与开始时间相同
                </Text>
              </div>
            </div>
          )}
        </div>
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
                    onClick={() => handleSelectMaterial(material)}
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
                      <Text>{material.title || '无标题'}</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <div className="text-gray-600 text-sm mb-1">
                        {material.content.slice(0, 100)}
                        {material.content.length > 100 ? '...' : ''}
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

      {/* 批量发布模态框 */}
      <Modal
        title="批量发布"
        open={isBatchPublishModalVisible}
        onCancel={() => setIsBatchPublishModalVisible(false)}
        onOk={handleBatchPublish}
        width={800}
        okText="开始批量发布"
        cancelText="取消"
        destroyOnClose={false}
      >
        <div style={{ padding: '20px' }}>
          {/* 素材选择 - 改为点击按钮打开抽屉 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              选择素材 <span style={{ color: 'red' }}>*</span>
            </label>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="dashed"
                icon={<InboxOutlined />}
                onClick={() => setIsMaterialDrawerVisible(true)}
                style={{ width: '100%', height: 60 }}
              >
                点击选择素材
              </Button>
              {selectedMaterials.length > 0 && (
                <Alert
                  type="info"
                  message={`已选择 ${selectedMaterials.length} 个素材`}
                  showIcon
                />
              )}
              {selectedMaterials.length > 0 && (
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  <List
                    size="small"
                    dataSource={materials.filter(m => selectedMaterials.includes(m.id))}
                    renderItem={(material) => (
                      <List.Item
                        actions={[
                          <Button
                            type="text"
                            danger
                            size="small"
                            onClick={() => setSelectedMaterials(selectedMaterials.filter(id => id !== material.id))}
                          >
                            移除
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                              {material.type === 'text' && <FileTextOutlined className="text-blue-500" />}
                              {material.type === 'image' && <PictureOutlined className="text-green-500" />}
                              {material.type === 'video' && <VideoCameraOutlined className="text-purple-500" />}
                            </div>
                          }
                          title={<Text>{material.title || '无标题'}</Text>}
                          description={<Tag color={typeConfig[material.type].color}>{typeConfig[material.type].label}</Tag>}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Space>
          </div>

          {/* 账号选择 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              选择账号 <span style={{ color: 'red' }}>*</span>
            </label>
            {accounts.length > 0 ? (
              <Checkbox.Group
                value={formData.accounts}
                onChange={(values) => setFormData({ ...formData, accounts: values as string[] })}
              >
                <Space direction="vertical">
                  {accounts.map((account) => (
                    <Checkbox key={account.id} value={account.id}>
                      <Space>
                        <Avatar src={account.avatar} size="small" />
                        <Text>{account.accountName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({platformConfig[account.platform]?.label || account.platform})
                        </Text>
                      </Space>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space>
                    <Text type="secondary">暂无账号</Text>
                    <Button type="link" size="small" onClick={() => window.location.href = '/media/matrix'}>
                      去添加
                    </Button>
                  </Space>
                }
              />
            )}
          </div>

          {/* 标签选择 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              话题/标签
            </label>
            <Checkbox.Group
              options={popularTags.map(tag => ({ label: tag, value: tag }))}
              value={formData.tags}
              onChange={(values) => setFormData({ ...formData, tags: values as string[] })}
            />
            <div style={{ marginTop: 8 }}>
              <Input
                placeholder="自定义标签（回车添加）"
                onPressEnter={(e) => {
                  const value = (e.target as HTMLInputElement).value.trim()
                  if (value && !formData.tags.includes(value)) {
                    setFormData({ ...formData, tags: [...formData.tags, value] })
                  }
                  (e.target as HTMLInputElement).value = ''
                }}
              />
            </div>
            {formData.tags.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {formData.tags.map((tag, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => {
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((_, i) => i !== index)
                        })
                      }}
                    >
                      #{tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              发布方式
            </label>
            <Radio.Group
              value={formData.publishType}
              onChange={(e) => {
                const newPublishType = e.target.value
                setPublishType(newPublishType)
                setFormData({ ...formData, publishType: newPublishType })
              }}
            >
              <Radio value="immediate">立即发布</Radio>
              <Radio value="scheduled">定时发布</Radio>
            </Radio.Group>
          </div>

          {/* 定时发布 - 日期时间分开选择 */}
          {publishType === 'scheduled' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                定时发布设置 <span style={{ color: 'red' }}>*</span>
              </label>
              <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                {/* 第一行：连续天数 + 每天发布时间 */}
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="连续发布天数" style={{ marginBottom: 8 }}>
                      <InputNumber
                        min={1}
                        max={30}
                        value={continuousDays}
                        onChange={(value) => setContinuousDays(value || 1)}
                        style={{ width: '100%' }}
                        addonAfter="天"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item label="每天发布时间" style={{ marginBottom: 8 }}>
                      <TimePicker
                        format="HH:mm"
                        placeholder="选择时间"
                        style={{ width: '100%' }}
                        value={batchScheduledTime}
                        onChange={(time) => setBatchScheduledTime(time)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                {/* 第二行：开始日期 */}
                <Form.Item label="开始日期" style={{ marginBottom: 8 }}>
                  <DatePicker
                    format="YYYY-MM-DD"
                    placeholder="选择开始日期"
                    style={{ width: '100%' }}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    value={continuousStartDate}
                    onChange={(date) => setContinuousStartDate(date)}
                  />
                </Form.Item>
                
                {/* 第三行：定时发布日期列表预览 */}
                {continuousDays > 0 && continuousStartDate && batchScheduledTime && (
                  <div style={{ marginTop: 12 }}>
                    <Alert
                      type="info"
                      message={`将在 ${continuousDays} 天内完成发布，每天 ${batchScheduledTime.format('HH:mm')} 准时发布`}
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>发布日程：</Text>
                    <div style={{ maxHeight: 120, overflowY: 'auto', marginTop: 4 }}>
                      <List
                        size="small"
                        dataSource={generateScheduledDates()}
                        renderItem={(dateStr, index) => (
                          <List.Item style={{ padding: '4px 0' }}>
                            <Space>
                              <Tag color="blue">{index + 1}</Tag>
                              <Text>{dateStr}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {/* 提示信息 */}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formData.accounts.length > 0
                    ? `根据所选平台规则，最多可定时 ${getScheduledLimitDays()} 天`
                    : '请先选择账号，系统将根据平台规则显示可定时范围'
                  }
                </Text>
              </Card>
            </div>
          )}
        </div>
      </Modal>

      {/* 素材选择抽屉 */}
      <Drawer
        title="选择素材"
        onClose={() => setIsMaterialDrawerVisible(false)}
        open={isMaterialDrawerVisible}
        width={800}
      >
        {materials.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text type="secondary">暂无素材</Text>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => window.location.href = '/media/factory'}
                >
                  去内容工厂生成
                </Button>
              </Space>
            }
          />
        ) : (
          <List
            dataSource={materials}
            renderItem={(material) => {
              const categoryKey = material.category as ContentCategory
              const categoryConfig = contentCategoryConfig[categoryKey]
              if (!categoryConfig) return null

              const iconMap: Record<ContentCategory, any> = {
                [ContentCategory.TITLE]: <FontSizeOutlined />,
                [ContentCategory.TAGS]: <TagsOutlined />,
                [ContentCategory.COPYWRITING]: <FileTextOutlined />,
                [ContentCategory.IMAGE_TO_TEXT]: <FileImageOutlined />,
                [ContentCategory.XIAOHONGSHU]: <HeartOutlined />,
                [ContentCategory.IMAGE]: <PictureOutlined />,
                [ContentCategory.ECOMMERCE]: <ShoppingOutlined />,
                [ContentCategory.VIDEO]: <VideoCameraOutlined />,
                [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined />,
              }

              return (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => {
                        setFormData({ ...formData, content: material.content, title: material.title })
                        setIsMaterialDrawerVisible(false)
                        message.success('已选择素材')
                      }}
                    >
                      使用
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                        {iconMap[categoryKey]}
                      </div>
                    }
                    title={
                      <Space>
                        <span>{material.title}</span>
                        <Tag color={categoryConfig.color}>{categoryConfig.label}</Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">
                          {new Date(material.timestamp).toLocaleString('zh-CN')}
                        </Text>
                        <Tag color={material.status === 'used' ? 'green' : 'blue'}>
                          {material.status === 'used' ? '已使用' : '未使用'}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )
            }}
          />
        )}
      </Drawer>
    </div>
  )
}
