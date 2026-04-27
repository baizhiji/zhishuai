'use client'

import { useState } from 'react'
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
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function ContentFactoryPage() {
  const [activeTab, setActiveTab] = useState('text')
  const [form] = Form.useForm()
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)

  // 模拟生成内容
  const handleGenerate = async () => {
    const values = await form.validateFields()
    setGenerating(true)
    setProgress(0)

    // 模拟生成进度
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    // 模拟生成完成
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setGenerating(false)

      // 根据不同类型生成不同内容
      const contents = {
        text: '【智枢AI：让内容创作更简单】\n\n在这个信息爆炸的时代，如何高效地创作出优质内容？智枢AI为您解答！\n\n✨ AI智能写作：一键生成爆款文案\n🎨 AI绘画：秒变专业设计师\n🤖 数字人视频：解放真人出镜\n\n现在注册，免费试用30天！\n\n#AI #人工智能 #内容创作 #智枢AI',
        image: 'https://via.placeholder.com/600x400',
        video: 'https://via.placeholder.com/600x400?text=视频生成中...',
        digitalHuman: 'https://via.placeholder.com/600x400?text=数字人视频生成中...',
      }

      setGeneratedContent(contents[activeTab as keyof typeof contents] || '生成内容')
      message.success('生成成功！')
    }, 3000)
  }

  // 保存到素材库
  const handleSave = () => {
    message.success('已保存到素材库')
  }

  // 直接发布
  const handlePublish = () => {
    message.success('已添加到发布中心')
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
            <Progress percent={progress} status="active" />
            <p className="mt-4 text-gray-500">AI正在为您生成内容，请稍候...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'text' ? (
              <div className="bg-gray-50 p-4 rounded">
                <Paragraph className="whitespace-pre-wrap">{generatedContent}</Paragraph>
              </div>
            ) : generatedContent ? (
              <div className="text-center">
                <Image src={generatedContent} alt="Generated content" />
              </div>
            ) : null
            }
            <Divider />
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存到素材库
              </Button>
              <Button icon={<SendOutlined />} onClick={handlePublish}>
                直接发布
              </Button>
              <Button icon={<HistoryOutlined />}>
                查看历史记录
              </Button>
            </Space>
          </div>
        )}
      </Card>
    )
  }

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
    </div>
  )
}
