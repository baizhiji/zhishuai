'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tabs,
  Input,
  Select,
  Form,
  Radio,
  Slider,
  InputNumber,
  message,
  Modal,
  Tag,
  Image,
  Progress,
  Divider,
  Empty,
  List,
  Drawer,
} from 'antd'
import {
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  SendOutlined,
  SaveOutlined,
  HistoryOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ScissorOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CopyOutlined,
  FontSizeOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { generateText, generateImage } from '@/lib/ai/aliyun'
import {
  ContentType,
  ContentCategory,
  contentTypeConfig,
  contentCategoryConfig,
  contentTypeByCategory,
} from '@/lib/content/types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// 生成记录类型
interface GenerationRecord {
  id: string
  type: ContentType
  content: string
  config: any
  timestamp: number
  status: 'success' | 'failed'
}

export default function ContentFactoryPage() {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>(ContentCategory.COPYWRITING)
  const [selectedContentType, setSelectedContentType] = useState<ContentType>(ContentType.TEXT_SHORT)
  const [form] = Form.useForm()
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<GenerationRecord[]>([])

  // 从 localStorage 加载历史记录
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('generation-history')
      if (saved) {
        try {
          setGenerationHistory(JSON.parse(saved))
        } catch (error) {
          console.error('加载历史记录失败:', error)
        }
      }
    }
  }, [])

  // 保存历史记录到 localStorage
  const saveHistory = (record: GenerationRecord) => {
    const newHistory = [record, ...generationHistory].slice(0, 50) // 只保留最近50条
    setGenerationHistory(newHistory)
    if (typeof window !== 'undefined') {
      localStorage.setItem('generation-history', JSON.stringify(newHistory))
    }
  }

  // 生成内容
  const handleGenerate = async () => {
    const values = await form.validateFields()
    setGenerating(true)
    setProgress(0)
    setGeneratedContent(null)

    // 模拟生成进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      let result: any
      const typeConfig = contentTypeConfig[selectedContentType]

      // 根据不同类型调用不同的生成函数
      if (selectedContentType === ContentType.IMAGE) {
        // 图片生成
        const prompt = `生成一张${values.imageType}图片，主题：${values.topic}，风格：${values.style || '写实'}，色调：${values.colorScheme || '明亮'}`
        result = await generateImage(prompt, {
          size: '1024*1024',
          model: 'wanx-v1',
        })
        // 提取图片 URL
        result = { output: { text: result.output.results[0].url } }
      } else if ([ContentType.VIDEO, ContentType.DIGITAL_HUMAN].includes(selectedContentType)) {
        // 视频和数字人生成（暂时使用模拟）
        const videoType = selectedContentType === ContentType.DIGITAL_HUMAN ? '数字人视频' : '短视频'
        result = { output: { text: `https://via.placeholder.com/600x400?text=${videoType}生成中...` } }
      } else {
        // 文本生成（包括所有文案、标题、标签）
        let prompt = ''

        // 根据不同类型生成不同的提示词
        switch (selectedContentType) {
          case ContentType.TEXT_IMAGE_TO_TEXT:
            prompt = `根据以下描述生成一段文案：${values.topic}\n风格要求：${values.style || '专业'}，字数限制：${values.wordCount || 300}字。`
            break
          case ContentType.TEXT_LONG:
            prompt = `为"${values.topic}"生成详细的长文案，风格：${values.style || '专业'}，字数：${values.wordCount || 1000}字以上。${values.requirements ? `额外要求：${values.requirements}` : ''}`
            break
          case ContentType.TEXT_SHORT:
            prompt = `为"${values.topic}"生成简洁的短文案，风格：${values.style || '活泼'}，字数：${values.wordCount || 100}字以内。`
            break
          case ContentType.TEXT_XIAOHONGSHU:
            prompt = `为"${values.topic}"生成小红书风格的文案，包含emoji，风格：${values.style || '生活化'}，字数：${values.wordCount || 300}字左右。${values.requirements ? `额外要求：${values.requirements}` : ''}`
            break
          case ContentType.TEXT_ECOMMERCE:
            prompt = `为产品"${values.topic}"生成电商详情页文案，风格：${values.style || '专业'}，包含产品介绍、卖点、使用场景等，字数：${values.wordCount || 800}字。${values.requirements ? `额外要求：${values.requirements}` : ''}`
            break
          case ContentType.TITLE:
            prompt = `为"${values.topic}"生成5-10个吸引人的标题，风格：${values.style || '吸引眼球'}。${values.requirements ? `额外要求：${values.requirements}` : ''}`
            break
          case ContentType.TAGS:
            prompt = `为"${values.topic}"生成10-15个相关的话题标签，格式：#标签1 #标签2，风格：${values.style || '流行'}。`
            break
          default:
            prompt = `为"${values.topic}"生成内容，风格：${values.style || '专业'}，字数限制：${values.wordCount || 500}字。`
        }

        result = await generateText(prompt, {
          model: 'qwen-plus',
          maxTokens: values.wordCount || 500,
          temperature: 0.7,
        })
      }

      clearInterval(progressInterval)
      setProgress(100)

      // 保存生成结果
      if (result?.output?.text) {
        setGeneratedContent(result.output.text)

        // 保存到历史记录
        saveHistory({
          id: `gen_${Date.now()}`,
          type: selectedContentType,
          content: result.output.text,
          config: values,
          timestamp: Date.now(),
          status: 'success',
        })

        message.success(`${typeConfig.label}生成成功！`)
      } else {
        throw new Error('生成失败，未返回有效结果')
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error('生成失败:', error)
      message.error('生成失败，请重试')

      // 保存失败记录
      saveHistory({
        id: `gen_${Date.now()}`,
        type: selectedContentType,
        content: '',
        config: values,
        timestamp: Date.now(),
        status: 'failed',
      })
    } finally {
      setGenerating(false)
    }
  }

  // 保存到素材库
  const handleSave = () => {
    if (!generatedContent) {
      message.warning('请先生成内容')
      return
    }

    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      const materials = JSON.parse(localStorage.getItem('materials') || '[]')
      materials.push({
        id: `material_${Date.now()}`,
        type: selectedContentType,
        title: form.getFieldValue('topic') || contentTypeConfig[selectedContentType].label,
        content: generatedContent,
        category: contentTypeConfig[selectedContentType].category,
        timestamp: Date.now(),
        status: 'unused',
      })
      localStorage.setItem('materials', JSON.stringify(materials))
      message.success('已保存到素材库')
    }
  }

  // 直接发布
  const handlePublish = () => {
    if (!generatedContent) {
      message.warning('请先生成内容')
      return
    }
    message.success('已添加到发布中心')
  }

  // 复制内容
  const handleCopy = () => {
    if (!generatedContent) return
    navigator.clipboard.writeText(generatedContent)
    message.success('已复制到剪贴板')
  }

  // 下载内容
  const handleDownload = () => {
    if (!generatedContent) return

    if ([ContentType.TEXT_IMAGE_TO_TEXT, ContentType.TEXT_LONG, ContentType.TEXT_SHORT,
         ContentType.TEXT_XIAOHONGSHU, ContentType.TEXT_ECOMMERCE, ContentType.TITLE, ContentType.TAGS].includes(selectedContentType)) {
      // 下载文本
      const blob = new Blob([generatedContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `content_${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
      message.success('已下载')
    } else {
      // 下载图片
      window.open(generatedContent, '_blank')
    }
  }

  // 从历史记录中加载
  const handleLoadFromHistory = (record: GenerationRecord) => {
    setGeneratedContent(record.content)
    setHistoryVisible(false)
    message.success('已加载历史记录')
  }

  // 删除历史记录
  const handleDeleteHistory = (id: string) => {
    const newHistory = generationHistory.filter((r) => r.id !== id)
    setGenerationHistory(newHistory)
    if (typeof window !== 'undefined') {
      localStorage.setItem('generation-history', JSON.stringify(newHistory))
    }
    message.success('已删除')
  }

  // 文案类型选项
  const contentTypeOptions = [
    { label: '长文案', value: 'long' },
    { label: '短文案', value: 'short' },
    { label: '标题', value: 'title' },
    { label: '口播稿', value: 'script' },
  ]

  // 平台选择
  const platformOptions = [
    { label: '抖音', value: 'douyin' },
    { label: '快手', value: 'kuaishou' },
    { label: '小红书', value: 'xiaohongshu' },
    { label: '视频号', value: 'weixin' },
    { label: 'B站', value: 'bilibili' },
  ]

  // 渲染配置表单
  const renderConfigForm = () => {
    switch (activeCategory) {
      case ContentCategory.COPYWRITING:
        return (
          <>
            <Form.Item label="内容类型" name="contentType" initialValue={ContentType.TEXT_SHORT}>
              <Select
                options={contentTypeByCategory[ContentCategory.COPYWRITING].map(type => ({
                  label: contentTypeConfig[type].label,
                  value: type,
                }))}
                onChange={setSelectedContentType}
              />
            </Form.Item>
            <Form.Item label="主题/话题" name="topic" rules={[{ required: true, message: '请输入主题' }]}>
              <Input placeholder="输入要生成的主题或话题..." />
            </Form.Item>
            <Form.Item label="风格" name="style" initialValue="专业">
              <Select
                options={[
                  { label: '专业', value: '专业' },
                  { label: '活泼', value: '活泼' },
                  { label: '正式', value: '正式' },
                  { label: '生活化', value: '生活化' },
                  { label: '吸引眼球', value: '吸引眼球' },
                ]}
              />
            </Form.Item>
            <Form.Item label="字数限制" name="wordCount" initialValue={300}>
              <InputNumber min={50} max={2000} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="额外要求" name="requirements">
              <TextArea rows={3} placeholder="输入额外要求或限制条件（可选）..." />
            </Form.Item>
          </>
        )
      case ContentCategory.IMAGE:
        return (
          <>
            <Form.Item label="内容类型" name="contentType" initialValue={ContentType.IMAGE}>
              <Select
                options={contentTypeByCategory[ContentCategory.IMAGE].map(type => ({
                  label: contentTypeConfig[type].label,
                  value: type,
                }))}
                onChange={setSelectedContentType}
              />
            </Form.Item>
            <Form.Item label="图片类型" name="imageType" initialValue="graphic">
              <Radio.Group>
                <Radio value="graphic">图文</Radio>
                <Radio value="poster">海报</Radio>
                <Radio value="product">产品图</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="尺寸比例" name="aspectRatio" initialValue="1:1">
              <Select
                options={[
                  { label: '1:1 (正方形)', value: '1:1' },
                  { label: '16:9 (横屏)', value: '16:9' },
                  { label: '9:16 (竖屏)', value: '9:16' },
                  { label: '4:3 (标准)', value: '4:3' },
                ]}
              />
            </Form.Item>
            <Form.Item label="主题描述" name="topic" rules={[{ required: true, message: '请输入主题' }]}>
              <TextArea rows={3} placeholder="描述您想要的图片内容..." />
            </Form.Item>
            <Form.Item label="风格" name="style">
              <Select
                options={[
                  { label: '写实', value: '写实' },
                  { label: '卡通', value: '卡通' },
                  { label: '极简', value: '极简' },
                  { label: '科技感', value: '科技感' },
                ]}
              />
            </Form.Item>
            <Form.Item label="色调" name="colorScheme">
              <Select
                options={[
                  { label: '明亮', value: '明亮' },
                  { label: '暗色', value: '暗色' },
                  { label: '自然', value: '自然' },
                  { label: '商务', value: '商务' },
                ]}
              />
            </Form.Item>
          </>
        )
      case ContentCategory.VIDEO:
        return (
          <>
            <Form.Item label="内容类型" name="contentType" initialValue={ContentType.VIDEO}>
              <Select
                options={contentTypeByCategory[ContentCategory.VIDEO].map(type => ({
                  label: contentTypeConfig[type].label,
                  value: type,
                }))}
                onChange={setSelectedContentType}
              />
            </Form.Item>
            <Form.Item label="视频类型" name="videoType" initialValue="short">
              <Radio.Group>
                <Radio value="short">短视频</Radio>
                <Radio value="tutorial">教程视频</Radio>
                <Radio value="product">产品展示</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="时长" name="duration" initialValue={15}>
              <Select
                options={[
                  { label: '15秒', value: 15 },
                  { label: '30秒', value: 30 },
                  { label: '60秒', value: 60 },
                  { label: '120秒', value: 120 },
                ]}
              />
            </Form.Item>
            <Form.Item label="主题描述" name="topic" rules={[{ required: true, message: '请输入主题' }]}>
              <TextArea rows={3} placeholder="描述视频内容..." />
            </Form.Item>
            <Form.Item label="背景音乐" name="bgm">
              <Select
                options={[
                  { label: '欢快', value: 'happy' },
                  { label: '舒缓', value: 'relaxing' },
                  { label: '动感', value: 'dynamic' },
                  { label: '无音乐', value: 'none' },
                ]}
              />
            </Form.Item>
          </>
        )
      case ContentCategory.DIGITAL_HUMAN:
        return (
          <>
            <Form.Item label="内容类型" name="contentType" initialValue={ContentType.DIGITAL_HUMAN}>
              <Select
                options={contentTypeByCategory[ContentCategory.DIGITAL_HUMAN].map(type => ({
                  label: contentTypeConfig[type].label,
                  value: type,
                }))}
                onChange={setSelectedContentType}
              />
            </Form.Item>
            <Form.Item label="数字人形象" name="avatar" initialValue="avatar1">
              <Select
                options={[
                  { label: '商务男1', value: 'avatar1' },
                  { label: '商务女1', value: 'avatar2' },
                  { label: '活泼男1', value: 'avatar3' },
                  { label: '活泼女1', value: 'avatar4' },
                ]}
              />
            </Form.Item>
            <Form.Item label="视频类型" name="digitalType" initialValue="speaking">
              <Radio.Group>
                <Radio value="speaking">口播视频</Radio>
                <Radio value="explaining">讲解视频</Radio>
                <Radio value="dialogue">对话视频</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="输入内容" name="content" rules={[{ required: true, message: '请输入内容' }]}>
              <TextArea rows={5} placeholder="输入数字人要说的话..." />
            </Form.Item>
            <Form.Item label="语速" name="speed" initialValue={1}>
              <Slider min={0.5} max={2} step={0.1} marks={{ 0.5: '0.5x', 1: '1x', 2: '2x' }} />
            </Form.Item>
          </>
        )
      case ContentCategory.TITLE:
        return (
          <>
            <Form.Item label="内容类型" name="contentType" initialValue={ContentType.TITLE}>
              <Select
                options={contentTypeByCategory[ContentCategory.TITLE].map(type => ({
                  label: contentTypeConfig[type].label,
                  value: type,
                }))}
                onChange={setSelectedContentType}
              />
            </Form.Item>
            <Form.Item label="主题/话题" name="topic" rules={[{ required: true, message: '请输入主题' }]}>
              <Input placeholder="输入要生成标题的主题或产品..." />
            </Form.Item>
            <Form.Item label="风格" name="style" initialValue="吸引眼球">
              <Select
                options={[
                  { label: '吸引眼球', value: '吸引眼球' },
                  { label: '专业', value: '专业' },
                  { label: '简洁', value: '简洁' },
                  { label: '幽默', value: '幽默' },
                ]}
              />
            </Form.Item>
            <Form.Item label="额外要求" name="requirements">
              <TextArea rows={3} placeholder="输入额外要求（可选）..." />
            </Form.Item>
          </>
        )
      case ContentCategory.TAGS:
        return (
          <>
            <Form.Item label="内容类型" name="contentType" initialValue={ContentType.TAGS}>
              <Select
                options={contentTypeByCategory[ContentCategory.TAGS].map(type => ({
                  label: contentTypeConfig[type].label,
                  value: type,
                }))}
                onChange={setSelectedContentType}
              />
            </Form.Item>
            <Form.Item label="主题/话题" name="topic" rules={[{ required: true, message: '请输入主题' }]}>
              <Input placeholder="输入要生成标签的主题..." />
            </Form.Item>
            <Form.Item label="风格" name="style" initialValue="流行">
              <Select
                options={[
                  { label: '流行', value: '流行' },
                  { label: '专业', value: '专业' },
                  { label: '生活化', value: '生活化' },
                  { label: '科技', value: '科技' },
                ]}
              />
            </Form.Item>
          </>
        )
      default:
        return null
    }
  }

  // 渲染生成结果
  const renderGeneratedResult = () => {
    if (!generatedContent && !generating) {
      return null
    }

    const typeConfig = contentTypeConfig[selectedContentType]

    return (
      <Card title="生成结果" className="mt-6">
        {generating ? (
          <div className="text-center py-8">
            <Progress percent={Math.round(progress)} status="active" />
            <p className="mt-4 text-gray-500">AI正在为您生成{typeConfig.label}，请稍候...</p>
          </div>
        ) : (
          <div>
            {typeConfig.category === ContentCategory.IMAGE ? (
              <div className="text-center">
                <Image src={generatedContent} alt="Generated content" style={{ maxWidth: '100%' }} />
              </div>
            ) : typeConfig.category === ContentCategory.VIDEO || typeConfig.category === ContentCategory.DIGITAL_HUMAN ? (
              <div className="text-center">
                <video src={generatedContent} controls style={{ maxWidth: '100%', maxHeight: 400 }} />
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <Paragraph className="whitespace-pre-wrap mb-4">{generatedContent}</Paragraph>
              </div>
            )}
            <Divider />
            <Space wrap>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存到素材库
              </Button>
              <Button icon={<SendOutlined />} onClick={handlePublish}>
                直接发布
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                下载
              </Button>
              <Button icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>
                查看历史记录 ({generationHistory.length})
              </Button>
            </Space>
          </div>
        )}
      </Card>
    )
  }

  // 渲染历史记录
  const renderHistoryDrawer = () => (
    <Drawer
      title="生成历史记录"
      onClose={() => setHistoryVisible(false)}
      open={historyVisible}
      width={600}
    >
      {generationHistory.length === 0 ? (
        <Empty description="暂无历史记录" />
      ) : (
        <List
          dataSource={generationHistory}
          renderItem={(record) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleLoadFromHistory(record)}
                >
                  使用
                </Button>,
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteHistory(record.id)}
                >
                  删除
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                    {record.type === ContentType.TEXT_IMAGE_TO_TEXT && <FileTextOutlined />}
                    {record.type === ContentType.TEXT_LONG && <FileTextOutlined />}
                    {record.type === ContentType.TEXT_SHORT && <FileTextOutlined />}
                    {record.type === ContentType.TEXT_XIAOHONGSHU && <FileTextOutlined />}
                    {record.type === ContentType.TEXT_ECOMMERCE && <FileTextOutlined />}
                    {record.type === ContentType.TITLE && <FontSizeOutlined />}
                    {record.type === ContentType.TAGS && <TagsOutlined />}
                    {record.type === ContentType.IMAGE && <PictureOutlined />}
                    {record.type === ContentType.VIDEO && <VideoCameraOutlined />}
                    {record.type === ContentType.DIGITAL_HUMAN && <RobotOutlined />}
                  </div>
                }
                title={
                  <Space>
                    <span>{record.config?.topic || contentTypeConfig[record.type]?.label}</span>
                    <Tag color={contentTypeConfig[record.type]?.color}>
                      {contentTypeConfig[record.type]?.label}
                    </Tag>
                    <Tag color={record.status === 'success' ? 'green' : 'red'}>
                      {record.status === 'success' ? '成功' : '失败'}
                    </Tag>
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary">
                      {new Date(record.timestamp).toLocaleString('zh-CN')}
                    </Text>
                    <Tag>{record.type === 'text' ? '文案' : record.type === 'image' ? '图片' : '视频'}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  )

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">内容工厂</Title>
        <Text type="secondary">
          使用AI智能生成各类自媒体内容，支持文案、图片、视频、数字人等多种形式
        </Text>
      </div>

      {/* 功能标签页 */}
      <Card>
        <Tabs
          activeKey={activeCategory}
          onChange={(key) => {
            const category = key as ContentCategory
            setActiveCategory(category)
            // 设置默认选中的内容类型
            const types = contentTypeByCategory[category]
            if (types.length > 0) {
              setSelectedContentType(types[0])
            }
          }}
          items={[
            {
              key: ContentCategory.COPYWRITING,
              label: (
                <Space>
                  <FileTextOutlined />
                  文案
                </Space>
              ),
            },
            {
              key: ContentCategory.TITLE,
              label: (
                <Space>
                  <FontSizeOutlined />
                  标题
                </Space>
              ),
            },
            {
              key: ContentCategory.TAGS,
              label: (
                <Space>
                  <TagsOutlined />
                  标签
                </Space>
              ),
            },
            {
              key: ContentCategory.IMAGE,
              label: (
                <Space>
                  <PictureOutlined />
                  图片
                </Space>
              ),
            },
            {
              key: ContentCategory.VIDEO,
              label: (
                <Space>
                  <VideoCameraOutlined />
                  短视频
                </Space>
              ),
            },
            {
              key: ContentCategory.DIGITAL_HUMAN,
              label: (
                <Space>
                  <RobotOutlined />
                  数字人
                </Space>
              ),
            },
          ]}
        />

        {/* 配置表单 */}
        <div className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <Title level={3}>{contentCategoryConfig[activeCategory].label}生成</Title>
              <Paragraph type="secondary">
                {contentTypeConfig[selectedContentType].description}
              </Paragraph>
            </div>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{
                contentType: selectedContentType,
              }}
            >
              {renderConfigForm()}

              <Form.Item>
                <Space size="large">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={generating}
                    icon={<ThunderboltOutlined />}
                    size="large"
                  >
                    {generating ? '生成中...' : '立即生成'}
                  </Button>
                  {generating && (
                    <Progress
                      percent={progress}
                      status="active"
                      style={{ width: 300 }}
                    />
                  )}
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>

        {/* 生成结果展示 */}
        {renderGeneratedResult()}
      </Card>

      {/* 历史记录抽屉 */}
      {renderHistoryDrawer()}
    </div>
  )
}
