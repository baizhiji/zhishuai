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
} from '@ant-design/icons'
import { generateText, generateImage } from '@/lib/ai/aliyun'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// 生成记录类型
interface GenerationRecord {
  id: string
  type: 'text' | 'image' | 'video' | 'digitalHuman'
  content: string
  config: any
  timestamp: number
  status: 'success' | 'failed'
}

export default function ContentFactoryPage() {
  const [activeTab, setActiveTab] = useState('text')
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

      // 根据不同类型调用不同的生成函数
      if (activeTab === 'text') {
        // 文本生成
        const prompt = `请为"${values.topic}"生成一段${values.contentType || '短文案'}，风格要求：${values.style || '专业'}，字数限制：${values.wordCount || 500}字。${values.requirements ? `额外要求：${values.requirements}` : ''}`
        result = await generateText(prompt, {
          model: 'qwen-plus',
          maxTokens: values.wordCount || 500,
          temperature: 0.7,
        })
      } else if (activeTab === 'image') {
        // 图片生成
        const prompt = `生成一张${values.imageType}图片，主题：${values.topic}，风格：${values.style || '写实'}，色调：${values.colorScheme || '明亮'}`
        result = await generateImage(prompt, {
          size: '1024*1024',
          model: 'wanx-v1',
        })
        // 提取图片 URL
        result = { output: { text: result.output.results[0].url } }
      } else if (activeTab === 'video') {
        // 视频生成（暂时使用模拟）
        result = { output: { text: 'https://via.placeholder.com/600x400?text=视频生成中...' } }
      } else if (activeTab === 'digitalHuman') {
        // 数字人视频（暂时使用模拟）
        result = { output: { text: 'https://via.placeholder.com/600x400?text=数字人视频生成中...' } }
      }

      clearInterval(progressInterval)
      setProgress(100)

      // 保存生成结果
      if (result?.output?.text) {
        setGeneratedContent(result.output.text)

        // 保存到历史记录
        saveHistory({
          id: `gen_${Date.now()}`,
          type: activeTab as any,
          content: result.output.text,
          config: values,
          timestamp: Date.now(),
          status: 'success',
        })

        message.success('生成成功！')
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
        type: activeTab as any,
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
        type: activeTab,
        content: generatedContent,
        timestamp: Date.now(),
        status: 'unused', // 未使用
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

    if (activeTab === 'text') {
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
    switch (activeTab) {
      case 'text':
        return (
          <>
            <Form.Item label="文案类型" name="contentType" initialValue="short">
              <Radio.Group options={contentTypeOptions} />
            </Form.Item>
            <Form.Item label="目标平台" name="platform" initialValue="douyin">
              <Select options={platformOptions} />
            </Form.Item>
            <Form.Item label="主题/关键词" name="topic" rules={[{ required: true, message: '请输入主题' }]}>
              <Input placeholder="例如：AI产品介绍、活动推广..." />
            </Form.Item>
            <Form.Item label="风格要求" name="style">
              <Select
                options={[
                  { label: '专业严谨', value: 'professional' },
                  { label: '活泼幽默', value: 'humorous' },
                  { label: '温馨感人', value: 'emotional' },
                  { label: '潮流时尚', value: 'trendy' },
                ]}
              />
            </Form.Item>
            <Form.Item label="字数限制" name="wordCount">
              <Slider min={50} max={5000} marks={{ 50: '50', 500: '500', 2000: '2000', 5000: '5000' }} />
            </Form.Item>
            <Form.Item label="额外要求" name="requirements">
              <TextArea rows={3} placeholder="如有特殊要求，请在此说明..." />
            </Form.Item>
          </>
        )
      case 'image':
        return (
          <>
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
                  { label: '写实', value: 'realistic' },
                  { label: '卡通', value: 'cartoon' },
                  { label: '极简', value: 'minimalist' },
                  { label: '科技感', value: 'tech' },
                ]}
              />
            </Form.Item>
            <Form.Item label="色调" name="colorScheme">
              <Select
                options={[
                  { label: '明亮', value: 'bright' },
                  { label: '暗色', value: 'dark' },
                  { label: '自然', value: 'natural' },
                  { label: '商务', value: 'business' },
                ]}
              />
            </Form.Item>
          </>
        )
      case 'video':
        return (
          <>
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
      case 'digitalHuman':
        return (
          <>
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
      default:
        return null
    }
  }

  // 渲染生成结果
  const renderGeneratedResult = () => {
    if (!generatedContent && !generating) {
      return null
    }

    return (
      <Card title="生成结果" className="mt-6">
        {generating ? (
          <div className="text-center py-8">
            <Progress percent={Math.round(progress)} status="active" />
            <p className="mt-4 text-gray-500">AI正在为您生成内容，请稍候...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'text' ? (
              <div className="bg-gray-50 p-4 rounded">
                <Paragraph className="whitespace-pre-wrap mb-4">{generatedContent}</Paragraph>
              </div>
            ) : generatedContent ? (
              <div className="text-center">
                <Image src={generatedContent} alt="Generated content" style={{ maxWidth: '100%' }} />
              </div>
            ) : null}
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
                    {record.type === 'text' && <FileTextOutlined />}
                    {record.type === 'image' && <PictureOutlined />}
                    {record.type === 'video' && <VideoCameraOutlined />}
                    {record.type === 'digitalHuman' && <RobotOutlined />}
                  </div>
                }
                title={
                  <Space>
                    <span>{record.config?.topic || '未命名'}</span>
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
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'text',
              label: (
                <Space>
                  <FileTextOutlined />
                  文案生成
                </Space>
              ),
            },
            {
              key: 'image',
              label: (
                <Space>
                  <PictureOutlined />
                  AI绘画
                </Space>
              ),
            },
            {
              key: 'video',
              label: (
                <Space>
                  <VideoCameraOutlined />
                  短视频生成
                </Space>
              ),
            },
            {
              key: 'digitalHuman',
              label: (
                <Space>
                  <RobotOutlined />
                  数字人视频
                </Space>
              ),
            },
            {
              key: 'batchGenerate',
              label: (
                <Space>
                  <AppstoreOutlined />
                  批量生成
                </Space>
              ),
            },
            {
              key: 'batchEdit',
              label: (
                <Space>
                  <ScissorOutlined />
                  批量剪辑
                </Space>
              ),
            },
          ]}
        />

        {/* 配置表单 */}
        <div className="mt-6">
          {activeTab === 'batchGenerate' ? (
            <Card className="p-6">
              <Title level={3}>批量生成</Title>
              <Paragraph type="secondary">
                批量生成多组内容，提高创作效率
              </Paragraph>
              <Form layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="生成数量" name="count" initialValue={5}>
                      <Select
                        options={[
                          { label: '5个', value: 5 },
                          { label: '10个', value: 10 },
                          { label: '20个', value: 20 },
                          { label: '50个', value: 50 },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="内容类型" name="type" initialValue="text">
                      <Select
                        options={[
                          { label: '文案', value: 'text' },
                          { label: '图片', value: 'image' },
                          { label: '视频', value: 'video' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="主题/关键词" name="topics" rules={[{ required: true }]}>
                  <Select
                    mode="tags"
                    placeholder="输入多个主题，每个生成一个版本"
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" size="large" icon={<ThunderboltOutlined />} block>
                    开始批量生成
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          ) : activeTab === 'batchEdit' ? (
            <Card className="p-6">
              <Title level={3}>批量剪辑</Title>
              <Paragraph type="secondary">
                对视频素材进行批量剪辑，添加特效、字幕等
              </Paragraph>
              <Form layout="vertical">
                <Form.Item label="选择素材" name="materials" rules={[{ required: true }]}>
                  <Select
                    mode="multiple"
                    placeholder="从素材库选择视频"
                    options={[
                      { label: '短视频-产品介绍', value: '1' },
                      { label: '数字人视频-讲解', value: '2' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="添加字幕" name="addSubtitle" valuePropName="checked" initialValue={true}>
                  <Select
                    options={[
                      { label: '自动生成', value: 'auto' },
                      { label: '手动输入', value: 'manual' },
                      { label: '不添加', value: 'none' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="添加背景音乐" name="addBgm" valuePropName="checked" initialValue={true}>
                  <Select
                    options={[
                      { label: '欢快', value: 'happy' },
                      { label: '舒缓', value: 'relaxing' },
                      { label: '动感', value: 'dynamic' },
                      { label: '无音乐', value: 'none' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="视频特效" name="effects">
                  <Select
                    mode="multiple"
                    options={[
                      { label: '转场效果', value: 'transition' },
                      { label: '滤镜', value: 'filter' },
                      { label: '缩放', value: 'zoom' },
                      { label: '马赛克', value: 'mosaic' },
                    ]}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" size="large" icon={<ScissorOutlined />} block>
                    开始批量剪辑
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          ) : (
            <>
              <Form form={form} layout="vertical">
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={12}>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <Title level={4} className="mb-4">
                        <Space>
                          <SettingOutlined />
                          配置参数
                        </Space>
                      </Title>
                      {renderConfigForm()}
                      <Form.Item>
                        <Button
                          type="primary"
                          size="large"
                          icon={<ThunderboltOutlined />}
                          loading={generating}
                          onClick={handleGenerate}
                          block
                        >
                          {generating ? '生成中...' : '立即生成'}
                        </Button>
                      </Form.Item>
                    </div>
                  </Col>

                  <Col xs={24} md={12}>
                    {/* 提示信息 */}
                    <Card className="h-full">
                      <Title level={4}>使用提示</Title>
                      <ul className="space-y-2 text-gray-600">
                        <li>• 输入详细的主题描述，可以获得更准确的结果</li>
                        <li>• 生成的素材只能使用一次，使用后状态会变为"已使用"</li>
                        <li>• 保存到素材库后可以在发布中心统一发布</li>
                        <li>• 每次生成会消耗相应的积分</li>
                        <li>• 数字人视频生成时间较长，请耐心等待</li>
                      </ul>
                      <Divider />
                      <Title level={4}>今日剩余额度</Title>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div className="text-center p-4 bg-blue-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">98</div>
                            <div className="text-sm text-gray-600">文案生成</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="text-center p-4 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-600">45</div>
                            <div className="text-sm text-gray-600">AI绘画</div>
                          </div>
                        </Col>
                      </Row>
                      <Row gutter={16} className="mt-4">
                        <Col span={12}>
                          <div className="text-center p-4 bg-purple-50 rounded">
                            <div className="text-2xl font-bold text-purple-600">12</div>
                            <div className="text-sm text-gray-600">短视频</div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="text-center p-4 bg-orange-50 rounded">
                            <div className="text-2xl font-bold text-orange-600">8</div>
                            <div className="text-sm text-gray-600">数字人</div>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </Form>
            </>
          )}
        </div>

        {/* 生成结果 */}
        {renderGeneratedResult()}
      </Card>

      {/* 历史记录抽屉 */}
      {renderHistoryDrawer()}
    </div>
  )
}
