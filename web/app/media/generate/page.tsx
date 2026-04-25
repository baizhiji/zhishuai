'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Radio,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Divider,
  message,
  Spin,
  Tabs,
} from 'antd'
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  FileTextOutlined,
  RobotOutlined,
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { getPlatformIcon, getPlatformName } from '@/utils'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { TabPane } = Tabs

interface GeneratedContent {
  id: string
  title: string
  description: string
  tags: string[]
  type: 'video' | 'image' | 'text'
  content: string
}

export default function ContentGeneratePage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [selectedTab, setSelectedTab] = useState('single')

  const platforms = ['douyin', 'kuaishou', 'xiaohongshu', 'video']
  const contentTypes = [
    { value: 'video', label: '视频', icon: <VideoCameraOutlined /> },
    { value: 'image', label: '图文', icon: <PictureOutlined /> },
    { value: 'text', label: '短视频脚本', icon: <FileTextOutlined /> },
  ]
  const styles = [
    { value: 'professional', label: '专业严肃' },
    { value: 'humorous', label: '幽默风趣' },
    { value: 'emotional', label: '情感共鸣' },
    { value: 'tutorial', label: '教程讲解' },
    { value: 'story', label: '故事叙述' },
  ]

  const handleGenerate = async (values: any) => {
    setLoading(true)
    try {
      // TODO: 调用AI生成API
      // const response = await apiClient.post('/media/generate', values)

      // 模拟生成内容
      setTimeout(() => {
        const newContent: GeneratedContent = {
          id: Date.now().toString(),
          title: `${values.topic} - 智能生成标题`,
          description: `基于"${values.topic}"和"${values.style}"风格生成的精彩内容，吸引观众眼球...`,
          tags: values.keywords || [values.topic],
          type: values.type,
          content: '这里是生成的详细内容...',
        }

        setGeneratedContents([newContent, ...generatedContents])
        message.success('内容生成成功！')
      }, 2000)
    } catch (error: any) {
      message.error(error.message || '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchGenerate = async () => {
    setLoading(true)
    try {
      // TODO: 批量生成逻辑
      setTimeout(() => {
        message.success('批量生成任务已提交，请在任务列表查看进度')
      }, 2000)
    } catch (error: any) {
      message.error(error.message || '批量生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDigitalHuman = () => {
    message.info('数字人视频生成功能开发中...')
  }

  const handleBatchEdit = () => {
    message.info('批量剪辑功能开发中...')
  }

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
          <Title level={2}>AI内容生成</Title>
          <Text type="secondary">基于AI技术，自动生成高质量自媒体内容</Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* 左侧：生成配置 */}
          <Col xs={24} lg={14}>
            <Card>
              <Tabs activeKey={selectedTab} onChange={setSelectedTab}>
                <TabPane tab="单次生成" key="single">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleGenerate}
                    initialValues={{
                      type: 'video',
                      platform: 'douyin',
                      style: 'professional',
                    }}
                  >
                    <Form.Item
                      label="话题/主题"
                      name="topic"
                      rules={[{ required: true, message: '请输入话题或主题' }]}
                    >
                      <Input
                        placeholder="例如：最新科技趋势、美食制作教程"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item label="关键词" name="keywords">
                      <Select
                        mode="tags"
                        placeholder="输入关键词，按回车添加"
                        size="large"
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="内容类型"
                          name="type"
                          rules={[{ required: true, message: '请选择内容类型' }]}
                        >
                          <Select size="large">
                            {contentTypes.map((type) => (
                              <Select.Option key={type.value} value={type.value}>
                                <Space>
                                  {type.icon}
                                  <span>{type.label}</span>
                                </Space>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="发布平台"
                          name="platform"
                          rules={[{ required: true, message: '请选择发布平台' }]}
                        >
                          <Select size="large">
                            {platforms.map((platform) => (
                              <Select.Option key={platform} value={platform}>
                                <Space>
                                  <span>{getPlatformIcon(platform)}</span>
                                  <span>{getPlatformName(platform)}</span>
                                </Space>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label="内容风格"
                      name="style"
                      rules={[{ required: true, message: '请选择内容风格' }]}
                    >
                      <Radio.Group className="w-full">
                        <Row gutter={[8, 8]}>
                          {styles.map((style) => (
                            <Col xs={12} sm={8} key={style.value}>
                              <Radio.Button value={style.value} className="w-full">
                              {style.label}
                              </Radio.Button>
                            </Col>
                          ))}
                        </Row>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item label="补充描述（可选）" name="description">
                      <TextArea
                        rows={4}
                        placeholder="提供更多详细信息，帮助AI生成更精准的内容"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                        icon={<ThunderboltOutlined />}
                        block
                        className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                      >
                        立即生成
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                <TabPane tab="批量生成" key="batch">
                  <Form layout="vertical">
                    <Form.Item label="批量主题">
                      <TextArea
                        rows={6}
                        placeholder="每行输入一个主题，支持批量生成多个内容"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        onClick={handleBatchGenerate}
                        loading={loading}
                        size="large"
                        icon={<PlusOutlined />}
                        block
                      >
                        开始批量生成
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                <TabPane tab="数字人视频" key="digital-human">
                  <div className="text-center py-8">
                    <RobotOutlined className="text-6xl text-blue-500 mb-4" />
                    <Title level={4}>数字人视频生成</Title>
                    <Paragraph type="secondary">
                      上传数字人形象，输入文案，即可生成真人出镜视频
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      icon={<VideoCameraOutlined />}
                      onClick={handleDigitalHuman}
                    >
                      创建数字人视频
                    </Button>
                  </div>
                </TabPane>

                <TabPane tab="批量剪辑" key="batch-edit">
                  <div className="text-center py-8">
                    <VideoCameraOutlined className="text-6xl text-green-500 mb-4" />
                    <Title level={4}>批量视频剪辑</Title>
                    <Paragraph type="secondary">
                      批量处理视频，添加字幕、特效、转场，一键生成多个版本
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      icon={<VideoCameraOutlined />}
                      onClick={handleBatchEdit}
                    >
                      开始批量剪辑
                    </Button>
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          {/* 右侧：生成结果 */}
          <Col xs={24} lg={10}>
            <Card
              title="生成结果"
              extra={
                <Text type="secondary">
                  共 {generatedContents.length} 条
                </Text>
              }
            >
              {loading ? (
                <div className="text-center py-8">
                  <Spin size="large" tip="AI正在生成内容，请稍候..." />
                </div>
              ) : generatedContents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileTextOutlined className="text-5xl mb-4" />
                  <p>暂无生成内容</p>
                  <p className="text-sm">在左侧填写信息，点击生成</p>
                </div>
              ) : (
                <Space direction="vertical" className="w-full">
                  {generatedContents.map((content) => (
                    <Card
                      key={content.id}
                      size="small"
                      className="mb-4"
                      hoverable
                      onClick={() => router.push('/media/publish')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Tag color="blue">
                          {contentTypes.find((t) => t.value === content.type)?.label}
                        </Tag>
                        <Text type="secondary" className="text-xs">
                          {getPlatformName(form.getFieldValue('platform'))}
                        </Text>
                      </div>
                      <Title level={5} className="mb-2">
                        {content.title}
                      </Title>
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        type="secondary"
                        className="mb-3"
                      >
                        {content.description}
                      </Paragraph>
                      <div className="flex items-center gap-2 mb-3">
                        {content.tags.map((tag, index) => (
                          <Tag key={index}>{tag}</Tag>
                        ))}
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        block
                      >
                        发布到平台
                      </Button>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
