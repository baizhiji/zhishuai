'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Checkbox,
  Space,
  Typography,
  Upload,
  message,
  Modal,
  Table,
  Tag,
  DatePicker,
  Radio,
  Progress,
  Divider,
  Tooltip,
  Row,
  Col,
} from 'antd'
import {
  ArrowLeftOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'
import { MediaContent } from '@/types'
import { getPlatformIcon, getPlatformName } from '@/utils'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function PublishPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [publishModalVisible, setPublishModalVisible] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)

  const platforms = [
    { id: 'douyin', name: '抖音', icon: '🎵' },
    { id: 'kuaishou', name: '快手', icon: '📹' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕' },
    { id: 'video', name: '视频号', icon: '🎬' },
  ]

  // 模拟待发布内容
  const [draftContents, setDraftContents] = useState<MediaContent[]>([
    {
      id: '1',
      title: '最新科技产品评测',
      description: '深度解析2024年最值得购买的科技产品...',
      content: '这里是详细的内容描述',
      type: 'video',
      tags: ['科技', '数码', '评测'],
      platform: 'douyin',
      publishStatus: 'draft',
      stats: { views: 0, likes: 0, comments: 0, shares: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: '美食制作教程',
      description: '教你在家做出餐厅级的美味佳肴...',
      content: '这里是详细的内容描述',
      type: 'video',
      tags: ['美食', '教程', '生活'],
      platform: 'kuaishou',
      publishStatus: 'draft',
      stats: { views: 0, likes: 0, comments: 0, shares: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList)
    },
    beforeUpload: () => false,
    accept: 'video/*,image/*',
  }

  const handlePlatformChange = (checkedValues: string[]) => {
    setSelectedPlatforms(checkedValues)
  }

  const handlePublish = async () => {
    const values = await form.validateFields()

    if (selectedPlatforms.length === 0) {
      message.warning('请至少选择一个发布平台')
      return
    }

    if (fileList.length === 0) {
      message.warning('请上传内容文件')
      return
    }

    setPublishModalVisible(true)
  }

  const handleConfirmPublish = async () => {
    setPublishing(true)
    setPublishProgress(0)

    try {
      // 模拟发布进度
      const interval = setInterval(() => {
        setPublishProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      setTimeout(() => {
        clearInterval(interval)
        setPublishProgress(100)
        message.success('发布成功！')

        // 添加到草稿列表
        const newContent: MediaContent = {
          id: Date.now().toString(),
          title: form.getFieldValue('title'),
          description: form.getFieldValue('description'),
          content: form.getFieldValue('description'),
          type: fileList[0].type?.startsWith('video') ? 'video' : 'image',
          tags: form.getFieldValue('tags') || [],
          platform: selectedPlatforms[0],
          publishStatus: 'published',
          publishTime: new Date(),
          stats: { views: 0, likes: 0, comments: 0, shares: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setDraftContents([newContent, ...draftContents])
        setPublishModalVisible(false)
        setPublishing(false)
        setPublishProgress(0)
        form.resetFields()
        setFileList([])
        setSelectedPlatforms([])
      }, 2200)
    } catch (error: any) {
      message.error(error.message || '发布失败')
      setPublishing(false)
    }
  }

  const handleDeleteDraft = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条草稿吗？',
      onOk: () => {
        setDraftContents(draftContents.filter((c) => c.id !== id))
        message.success('草稿已删除')
      },
    })
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <Tooltip title={title}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {title}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'video' ? 'blue' : 'green'}>
          {type === 'video' ? '视频' : '图文'}
        </Tag>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Space>
          <span className="text-xl">{getPlatformIcon(platform)}</span>
          <span>{getPlatformName(platform)}</span>
        </Space>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space size={[0, 4]} wrap>
          {tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MediaContent) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
          >
            发布
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteDraft(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/media')}
          className="mb-6"
        >
          返回自媒体板块
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>批量发布</Title>
          <Text type="secondary">一键发布到多个自媒体平台</Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* 左侧：发布表单 */}
          <Col xs={24} lg={14}>
            <Card title="发布内容">
              <Form form={form} layout="vertical">
                <Form.Item
                  label="上传内容"
                  name="files"
                  rules={[{ required: true, message: '请上传内容文件' }]}
                >
                  <Upload.Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                      <CloudUploadOutlined className="text-5xl text-blue-500" />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                    <p className="ant-upload-hint">
                      支持视频（MP4、MOV）和图片（JPG、PNG）
                    </p>
                  </Upload.Dragger>
                </Form.Item>

                <Form.Item
                  label="标题"
                  name="title"
                  rules={[{ required: true, message: '请输入标题' }]}
                >
                  <Input
                    placeholder="请输入标题，建议20字以内"
                    maxLength={50}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  label="描述"
                  name="description"
                  rules={[{ required: true, message: '请输入描述' }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="请输入内容描述，吸引更多观众"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <Form.Item label="标签" name="tags">
                  <Select
                    mode="tags"
                    placeholder="输入标签，按回车添加"
                    maxTagCount={5}
                  />
                </Form.Item>

                <Divider>选择发布平台</Divider>

                <Form.Item label="">
                  <Checkbox.Group onChange={handlePlatformChange}>
                    <Space direction="vertical" className="w-full">
                      {platforms.map((platform) => (
                        <Checkbox key={platform.id} value={platform.id}>
                          <Space>
                            <span className="text-2xl">{platform.icon}</span>
                            <span className="font-medium">{platform.name}</span>
                          </Space>
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item label="发布方式">
                  <Radio.Group defaultValue="now">
                    <Radio value="now">
                      <Space>
                        <SendOutlined />
                        <span>立即发布</span>
                      </Space>
                    </Radio>
                    <Radio value="scheduled">
                      <Space>
                        <ClockCircleOutlined />
                        <span>定时发布</span>
                      </Space>
                    </Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="选择发布时间">
                  <DatePicker
                    showTime
                    placeholder="选择发布时间"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={handlePublish}
                    block
                    className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                  >
                    发布内容
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 右侧：草稿列表 */}
          <Col xs={24} lg={10}>
            <Card
              title="草稿箱"
              extra={
                <Text type="secondary">
                  共 {draftContents.length} 条
                </Text>
              }
            >
              {draftContents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CloudUploadOutlined className="text-5xl mb-4" />
                  <p>暂无草稿</p>
                  <p className="text-sm">在左侧创建内容后发布</p>
                </div>
              ) : (
                <Table
                  columns={columns}
                  dataSource={draftContents}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* 发布确认弹窗 */}
        <Modal
          title="确认发布"
          open={publishModalVisible}
          onCancel={() => setPublishModalVisible(false)}
          footer={null}
          width={600}
        >
          <div className="py-4">
            <div className="mb-4">
              <Text strong>发布平台：</Text>
              <div className="mt-2">
                <Space wrap>
                  {selectedPlatforms.map((platform) => (
                    <Tag key={platform} color="blue" className="text-base px-3 py-1">
                      <Space>
                        <span>{getPlatformIcon(platform)}</span>
                        <span>{getPlatformName(platform)}</span>
                      </Space>
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>

            <div className="mb-4">
              <Text strong>发布内容：</Text>
              <div className="mt-2 bg-gray-50 p-3 rounded">
                <Text>{form.getFieldValue('title')}</Text>
              </div>
            </div>

            {publishing && (
              <div className="mt-6">
                <Text strong>发布进度：</Text>
                <Progress percent={publishProgress} status="active" />
              </div>
            )}

            {!publishing && (
              <div className="mt-6 flex justify-end space-x-2">
                <Button onClick={() => setPublishModalVisible(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleConfirmPublish}
                >
                  确认发布
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  )
}
