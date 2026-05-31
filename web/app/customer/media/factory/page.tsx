'use client'

import { useState, useEffect } from 'react'
import {
  Card,
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
  Tag,
  Image,
  Progress,
  Divider,
  Empty,
  List,
  Drawer,
  Upload,
  Row,
  Col,
} from 'antd'
import {
  FontSizeOutlined,
  TagsOutlined,
  FileTextOutlined,
  FileImageOutlined,
  HeartOutlined,
  PictureOutlined,
  ShoppingOutlined,
  VideoCameraOutlined,
  RobotOutlined,
  SendOutlined,
  SaveOutlined,
  HistoryOutlined,
  DownloadOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileOutlined,
  ApartmentOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { generateText, generateImage } from '@/lib/ai/aliyun'
import {
  ContentCategory,
  contentCategoryConfig,
  videoSizeOptions,
  imageSizeOptions,
  subtitleOptions,
  voiceoverOptions,
  bgmOptions,
} from '@/lib/content/types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// 生成记录类型
interface GenerationRecord {
  id: string
  category: ContentCategory
  content: string
  config: any
  timestamp: number
  status: 'success' | 'failed'
}

export default function ContentFactoryPage() {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>(ContentCategory.COPYWRITING)
  const [form] = Form.useForm()
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [generatedList, setGeneratedList] = useState<string[]>([])
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
    const newHistory = [record, ...generationHistory].slice(0, 50)
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
    setGeneratedList([])

    const count = values.count || 1
    const results: string[] = []

    // 模拟生成进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + (100 / count) * 0.1
      })
    }, 100)

    try {
      const categoryConfig = contentCategoryConfig[activeCategory]

      // 批量生成
      for (let i = 0; i < count; i++) {
        let result: any

        if (categoryConfig.type === 'image') {
          // 图片生成
          const prompt = `生成一张${values.style || '写实'}风格的图片，主题：${values.description}`
          result = await generateImage(prompt, {
            size: values.size || '1024x1024',
            model: 'wanx-v1',
          })
          // 提取图片 URL
          result = result.output.results[0].url
        } else if (categoryConfig.type === 'video') {
          // 视频生成（暂时使用模拟）
          const extras = `（字幕:${values.subtitle || '无'}，配音:${values.voiceover || '无'}，背景音乐:${values.bgm || '无'}）`
          if (activeCategory === ContentCategory.VIDEO_ANALYSIS) {
            result = `https://via.placeholder.com/${values.size?.replace('x', '/')}?text=爆款视频${i + 1}${extras}`
          } else if (activeCategory === ContentCategory.DIGITAL_HUMAN) {
            result = `https://via.placeholder.com/${values.size?.replace('x', '/')}?text=数字人视频${i + 1}-${values.digitalHumanId}${extras}`
          } else {
            result = `https://via.placeholder.com/${values.size?.replace('x', '/')}?text=视频${i + 1}${extras}`
          }
        } else {
          // 文本生成
          let prompt = ''

          // 根据不同分类生成不同的提示词
          switch (activeCategory) {
            case ContentCategory.TITLE:
              prompt = `生成${count}个吸引人的标题，主题：${values.description}，风格：${values.style || '吸引眼球'}。`
              break
            case ContentCategory.TAGS:
              prompt = `为"${values.description}"生成${count}个相关的话题标签，格式：#标签1 #标签2，风格：${values.style || '流行'}。`
              break
            case ContentCategory.COPYWRITING:
              prompt = `为"${values.description}"生成${values.wordCount || 500}字左右的文案，风格：${values.style || '专业'}。${values.requirements ? `额外要求：${values.requirements}` : ''}`
              break
            case ContentCategory.IMAGE_TO_TEXT:
              prompt = `根据上传的图片生成${values.wordCount || 300}字左右的文案描述，风格：${values.style || '生动'}。`
              break
            case ContentCategory.XIAOHONGSHU:
              prompt = `为"${values.description}"生成${values.wordCount || 300}字左右的小红书风格文案，包含emoji，风格：${values.style || '生活化'}。${values.requirements ? `额外要求：${values.requirements}` : ''}`
              break
            case ContentCategory.ECOMMERCE:
              prompt = `为产品"${values.description}"生成电商详情页文案，包含产品介绍、卖点、使用场景等，字数：${values.wordCount || 800}字。${values.requirements ? `额外要求：${values.requirements}` : ''}`
              break
            case ContentCategory.VIDEO_ANALYSIS:
              prompt = `分析视频"${values.videoUrl}"并生成爆款视频。分析维度：${values.analysisDimensions?.join('、')}，保留爆款元素：${values.viralElements?.join('、')}。生成描述：${values.description}`
              break
            case ContentCategory.DIGITAL_HUMAN:
              prompt = `使用数字人生成短视频。数字人ID：${values.digitalHumanId}，口播内容：${values.description}，字数：${values.wordCount || 500}字。字幕：${values.subtitle}，配音：${values.voiceover}，背景音乐：${values.bgm}`
              break
            default:
              prompt = `为"${values.description}"生成内容，风格：${values.style || '专业'}，字数限制：${values.wordCount || 500}字。`
          }

          result = await generateText(prompt, {
            model: 'qwen-plus',
            maxTokens: values.wordCount || 500,
            temperature: 0.7,
          })

          result = result.output.text
        }

        results.push(result)
        setProgress(Math.round(((i + 1) / count) * 90))
      }

      clearInterval(progressInterval)
      setProgress(100)

      setGeneratedList(results)
      setGeneratedContent(results[0]) // 默认显示第一条

      // 自动保存到素材库
      if (typeof window !== 'undefined') {
        const materials = JSON.parse(localStorage.getItem('materials') || '[]')
        results.forEach((content, index) => {
          materials.push({
            id: `material_${Date.now()}_${index}`,
            category: activeCategory,
            title: form.getFieldValue('description') || `${contentCategoryConfig[activeCategory].label}-${index + 1}`,
            content: content,
            timestamp: Date.now(),
            status: 'unused',
          })
        })
        localStorage.setItem('materials', JSON.stringify(materials))
      }

      // 保存到历史记录
      saveHistory({
        id: `gen_${Date.now()}`,
        category: activeCategory,
        content: results.join('\n---\n'),
        config: values,
        timestamp: Date.now(),
        status: 'success',
      })

      message.success(`成功生成 ${count} 条${categoryConfig.label}，已自动保存到素材库！`)
    } catch (error) {
      clearInterval(progressInterval)
      console.error('生成失败:', error)
      message.error('生成失败，请重试')

      saveHistory({
        id: `gen_${Date.now()}`,
        category: activeCategory,
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
  const handleSave = (content?: string) => {
    const contentToSave = content || generatedContent
    if (!contentToSave) {
      message.warning('请先生成内容')
      return
    }

    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      const materials = JSON.parse(localStorage.getItem('materials') || '[]')
      materials.push({
        id: `material_${Date.now()}`,
        category: activeCategory,
        title: form.getFieldValue('description') || contentCategoryConfig[activeCategory].label,
        content: contentToSave,
        timestamp: Date.now(),
        status: 'unused',
      })
      localStorage.setItem('materials', JSON.stringify(materials))
      message.success('已保存到素材库')
    }
  }

  // 复制内容
  const handleCopy = (content?: string) => {
    const contentToCopy = content || generatedContent
    if (!contentToCopy) return
    navigator.clipboard.writeText(contentToCopy)
    message.success('已复制到剪贴板')
  }

  // 下载内容
  const handleDownload = (content?: string) => {
    const contentToDownload = content || generatedContent
    if (!contentToDownload) return

    const categoryConfig = contentCategoryConfig[activeCategory]

    if (categoryConfig.type === 'image' || categoryConfig.type === 'video') {
      window.open(contentToDownload, '_blank')
    } else {
      const blob = new Blob([contentToDownload], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeCategory}_${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
      message.success('已下载')
    }
  }

  // 从历史记录中加载
  const handleLoadFromHistory = (record: GenerationRecord) => {
    setGeneratedContent(record.content)
    form.setFieldsValue(record.config)
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

  // 获取分类图标
  const getCategoryIcon = (category: ContentCategory) => {
    const iconMap: Record<ContentCategory, any> = {
      [ContentCategory.TITLE]: <FontSizeOutlined />,
      [ContentCategory.TAGS]: <TagsOutlined />,
      [ContentCategory.COPYWRITING]: <FileTextOutlined />,
      [ContentCategory.IMAGE_TO_TEXT]: <FileImageOutlined />,
      [ContentCategory.XIAOHONGSHU]: <HeartOutlined />,
      [ContentCategory.IMAGE]: <PictureOutlined />,
      [ContentCategory.ECOMMERCE]: <ShoppingOutlined />,
      [ContentCategory.VIDEO]: <VideoCameraOutlined />,
      [ContentCategory.VIDEO_ANALYSIS]: <ApartmentOutlined />,
      [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined />,
    }
    return iconMap[category]
  }

  // 渲染视频解析表单
  const renderVideoAnalysisForm = () => (
    <>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="视频链接"
            name="videoUrl"
            rules={[{ required: true, message: '请输入视频链接' }]}
          >
            <Input placeholder="输入短视频链接（抖音、快手、B站等）" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="分析维度"
            name="analysisDimensions"
            rules={[{ required: true, message: '请选择分析维度' }]}
          >
            <Select mode="multiple" placeholder="选择要分析的维度">
              <Select.Option value="content">内容分析</Select.Option>
              <Select.Option value="music">背景音乐</Select.Option>
              <Select.Option value="subtitle">字幕分析</Select.Option>
              <Select.Option value="rhythm">节奏分析</Select.Option>
              <Select.Option value="style">风格分析</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="爆款元素"
            name="viralElements"
            rules={[{ required: true, message: '请选择爆款元素' }]}
          >
            <Select mode="multiple" placeholder="选择要保留的爆款元素">
              <Select.Option value="opening">黄金3秒开头</Select.Option>
              <Select.Option value="transition">转场效果</Select.Option>
              <Select.Option value="music">背景音乐</Select.Option>
              <Select.Option value="subtitle">字幕样式</Select.Option>
              <Select.Option value="rhythm">节奏变化</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </>
  )

  // 渲染数字人表单
  const renderDigitalHumanForm = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="选择数字人"
            name="digitalHumanId"
            rules={[{ required: true, message: '请选择数字人' }]}
          >
            <Select
              placeholder="选择数字人"
              showSearch
              optionFilterProp="children"
            >
              <Select.OptGroup label="系统自带">
                <Select.Option value="system_male_1">商务男1</Select.Option>
                <Select.Option value="system_female_1">商务女1</Select.Option>
                <Select.Option value="system_male_2">活泼男1</Select.Option>
                <Select.Option value="system_female_2">活泼女1</Select.Option>
              </Select.OptGroup>
              <Select.OptGroup label="我的数字人">
                <Select.Option value="custom_1">自定义数字人1</Select.Option>
                <Select.Option value="custom_2">自定义数字人2</Select.Option>
              </Select.OptGroup>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => window.location.href = '/media/digital-humans'}
            style={{ marginTop: 32 }}
          >
            管理数字人仓库
          </Button>
        </Col>
      </Row>
    </>
  )

  // 渲染字幕配音背景音乐表单
  const renderVideoExtras = () => (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="字幕" name="subtitle" initialValue="chinese">
            <Select options={subtitleOptions} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="配音" name="voiceover" initialValue="female-mandarin">
            <Select options={voiceoverOptions} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="背景音乐" name="bgm" initialValue="dynamic">
            <Select options={bgmOptions} />
          </Form.Item>
        </Col>
      </Row>
    </>
  )

  // 渲染表单
  const renderForm = () => {
    const categoryConfig = contentCategoryConfig[activeCategory]

    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          count: 1,
          wordCount: 300,
          size: categoryConfig.type === 'video' ? '1920x1080' : '1024x1024',
          duration: 30,
          style: '专业',
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="内容描述"
              name="description"
              rules={[{ required: activeCategory !== ContentCategory.VIDEO_ANALYSIS, message: '请输入内容描述' }]}
            >
              <TextArea
                rows={3}
                placeholder={
                  activeCategory === ContentCategory.IMAGE_TO_TEXT
                    ? '描述图片内容或上传图片...'
                    : activeCategory === ContentCategory.VIDEO_ANALYSIS
                    ? '输入要生成的爆款视频描述...'
                    : '输入要生成的内容描述、产品描述或参数...'
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 视频解析特定表单 */}
        {activeCategory === ContentCategory.VIDEO_ANALYSIS && renderVideoAnalysisForm()}

        {/* 数字人特定表单 */}
        {activeCategory === ContentCategory.DIGITAL_HUMAN && renderDigitalHumanForm()}

        {/* 文件上传（图片和文档合并） */}
        {categoryConfig.needUpload && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="上传文件" name="files">
                <Upload
                  multiple
                  listType="text"
                  beforeUpload={() => false}
                >
                  <Button icon={<FileOutlined />}>选择文件（支持图片、文档）</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* 字数限制 */}
        {categoryConfig.needWordCount && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="字数限制"
                name="wordCount"
                rules={[
                  { required: true, message: '请输入字数限制' },
                  {
                    validator: (_, value) => {
                      if (!value || value <= 0) {
                        return Promise.reject('字数必须大于0')
                      }
                      if (value > 2000) {
                        return Promise.reject('字数不能超过2000')
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={2000}
                  style={{ width: '100%' }}
                  placeholder="请输入字数（最多2000字）"
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* 尺寸选项 */}
        {categoryConfig.needSize && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={categoryConfig.type === 'video' ? '视频尺寸' : '图片尺寸'}
                name="size"
              >
                <Select options={categoryConfig.type === 'video' ? videoSizeOptions : imageSizeOptions} />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* 时长选项 */}
        {categoryConfig.needDuration && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="视频时长（秒）"
                name="duration"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value && value > 180) {
                        return Promise.reject('时长不能超过180秒')
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={180}
                  style={{ width: '100%' }}
                  placeholder="请输入时长（最多180秒）"
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* 字幕、配音、背景音乐配置（短视频类） */}
        {(activeCategory === ContentCategory.VIDEO ||
          activeCategory === ContentCategory.VIDEO_ANALYSIS ||
          activeCategory === ContentCategory.DIGITAL_HUMAN) && renderVideoExtras()}

        {/* 风格选项 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="风格" name="style">
              <Select
                options={[
                  { label: '专业', value: '专业' },
                  { label: '活泼', value: '活泼' },
                  { label: '商务', value: '商务' },
                  { label: '生活化', value: '生活化' },
                  { label: '吸引眼球', value: '吸引眼球' },
                  { label: '简洁', value: '简洁' },
                  { label: '幽默', value: '幽默' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 额外要求 */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="额外要求" name="requirements">
              <TextArea rows={2} placeholder="输入额外要求（可选）..." />
            </Form.Item>
          </Col>
        </Row>

        {/* 生成数量 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="生成数量"
              name="count"
              rules={[
                { required: true, message: '请输入生成数量' },
                {
                  validator: (_, value) => {
                    if (!value || value <= 0) {
                      return Promise.reject('数量必须大于0')
                    }
                    if (value > 100) {
                      return Promise.reject('数量不能超过100')
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <InputNumber
                min={1}
                max={100}
                style={{ width: '100%' }}
                placeholder="请输入生成数量（最多100条）"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleGenerate}
            loading={generating}
            size="large"
            block
          >
            {generating ? '生成中...' : '开始生成'}
          </Button>
        </Form.Item>
      </Form>
    )
  }

  // 渲染生成结果
  const renderGeneratedResult = () => {
    if (!generatedContent && !generating) {
      return null
    }

    const categoryConfig = contentCategoryConfig[activeCategory]

    return (
      <Card title="生成结果" className="mt-6">
        {generating ? (
          <div className="text-center py-8">
            <Progress percent={Math.round(progress)} status="active" />
            <p className="mt-4 text-gray-500">AI正在为您生成{categoryConfig.label}，请稍候...</p>
          </div>
        ) : (
          <div>
            {/* 如果有多条结果，显示列表 */}
            {generatedList.length > 1 ? (
              <List
                dataSource={generatedList}
                renderItem={(item, index) => (
                  <List.Item
                    key={index}
                    actions={[
                      <Button type="link" onClick={() => handleCopy(item)}>复制</Button>,
                      <Button type="link" onClick={() => handleSave(item)}>保存</Button>,
                      <Button type="link" onClick={() => handleDownload(item)}>下载</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={<span>结果 {index + 1}</span>}
                      description={
                        categoryConfig.type === 'image' || categoryConfig.type === 'video' ? (
                          <Image src={item} alt={`结果${index + 1}`} style={{ maxWidth: 200 }} />
                        ) : (
                          <Paragraph ellipsis={{ rows: 3 }}>{item}</Paragraph>
                        )
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              // 单条结果
              <div>
                {categoryConfig.type === 'image' ? (
                  <div className="text-center">
                    <Image src={generatedContent || ''} alt="Generated content" style={{ maxWidth: '100%' }} />
                  </div>
                ) : categoryConfig.type === 'video' ? (
                  <div className="text-center">
                    <video src={generatedContent || ''} controls style={{ maxWidth: '100%', maxHeight: 400 }} />
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded">
                    <Paragraph className="whitespace-pre-wrap mb-4">{generatedContent}</Paragraph>
                  </div>
                )}
                <Divider />
                <Space wrap>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSave()}>
                    保存到素材库
                  </Button>
                  <Button icon={<CopyOutlined />} onClick={() => handleCopy()}>
                    复制
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={() => handleDownload()}>
                    下载
                  </Button>
                </Space>
              </div>
            )}
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
                    {getCategoryIcon(record.category)}
                  </div>
                }
                title={
                  <Space>
                    <span>{record.config?.description || contentCategoryConfig[record.category]?.label}</span>
                    <Tag color={contentCategoryConfig[record.category]?.color}>
                      {contentCategoryConfig[record.category]?.label}
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
          onChange={(key) => setActiveCategory(key as ContentCategory)}
          items={Object.values(ContentCategory).map((category) => ({
            key: category,
            label: (
              <Space>
                {getCategoryIcon(category as ContentCategory)}
                {contentCategoryConfig[category as ContentCategory]?.label}
              </Space>
            ),
          }))}
        />

        <Divider />

        {/* 当前分类说明 */}
        <div className="mb-4">
          <Title level={4}>{contentCategoryConfig[activeCategory].label}</Title>
          <Text type="secondary">{contentCategoryConfig[activeCategory].description}</Text>
        </div>

        {/* 表单区域 */}
        {renderForm()}

        {/* 生成结果 */}
        {renderGeneratedResult()}

        {/* 历史记录按钮 */}
        <div className="mt-6 text-center">
          <Button icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>
            查看历史记录
          </Button>
        </div>
      </Card>

      {/* 历史记录抽屉 */}
      {renderHistoryDrawer()}
    </div>
  )
}
