'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Message,
  Row,
  Col,
  Upload,
  Tabs,
  Divider,
  Tag,
  Image,
  Progress,
  Slider,
  Checkbox,
  Radio,
} from 'antd'
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  RobotOutlined,
  EyeOutlined,
  SaveOutlined,
  CopyOutlined,
  DownloadOutlined,
  SendOutlined,
  PictureOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'

const { Title, Text } = Typography
const { TextArea } = Input

interface GeneratedContent {
  title: string
  description: string
  features: string[]
  specifications: string[]
  images: string[]
  keywords: string[]
}

interface Template {
  id: string
  name: string
  category: string
  preview: string
}

export default function DetailPageGeneratorPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'pc'>('mobile')

  // 模板列表
  const templates: Template[] = [
    {
      id: '1',
      name: '简洁风格',
      category: '数码',
      preview: '简洁大气，突出产品特性',
    },
    {
      id: '2',
      name: '时尚风格',
      category: '时尚',
      preview: '时尚潮流，吸引年轻用户',
    },
    {
      id: '3',
      name: '专业风格',
      category: '数码',
      preview: '专业严谨，突出技术参数',
    },
    {
      id: '4',
      name: '生活风格',
      category: '生活',
      preview: '温馨生活，贴近用户需求',
    },
  ]

  // 热门话题
  const hotTopics = [
    { id: '1', title: '2024年科技趋势', hot: 98 },
    { id: '2', title: '智能家居普及', hot: 95 },
    { id: '3', title: '健康生活理念', hot: 92 },
    { id: '4', title: '环保材料应用', hot: 88 },
    { id: '5', title: 'AI技术融合', hot: 85 },
  ]

  // 上传配置
  const uploadProps = {
    name: 'file',
    listType: 'picture-card' as const,
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList)
    },
    beforeUpload: () => false,
    accept: 'image/*',
    multiple: true,
  }

  // 生成详情页
  const handleGenerate = async (values: any) => {
    setGenerating(true)
    setProgress(0)

    try {
      // 模拟生成进度
      const steps = [
        { progress: 20, message: '分析产品信息...' },
        { progress: 40, message: '搜索热门话题...' },
        { progress: 60, message: '生成标题和描述...' },
        { progress: 80, message: '优化关键词...' },
        { progress: 100, message: '生成完成！' },
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setProgress(step.progress)
      }

      // 模拟生成的内容
      const content: GeneratedContent = {
        title: values.productName || '智能无线蓝牙耳机 Pro',
        description: `这款${values.productName || '产品'}采用最新的蓝牙5.3技术，支持主动降噪功能，30小时超长续航。搭配人体工学设计，佩戴舒适，音质出众。适合运动、通勤、办公等多种场景使用，是您日常生活的理想伴侣。`,
        features: [
          '蓝牙5.3技术，连接更稳定',
          '主动降噪，沉浸式音质体验',
          '30小时超长续航，告别电量焦虑',
          '人体工学设计，佩戴舒适',
          'IPX5防水，运动无忧',
          '双麦降噪，通话清晰',
        ],
        specifications: [
          '蓝牙版本：5.3',
          '续航时间：30小时',
          '充电时间：1.5小时',
          '降噪深度：-35dB',
          '防水等级：IPX5',
          '重量：35g',
        ],
        images: fileList.map(f => f.url || '/placeholder.png'),
        keywords: ['无线耳机', '蓝牙耳机', '主动降噪', '长续航', '运动耳机'],
      }

      setGeneratedContent(content)
      Message.success('详情页生成成功！')
    } catch (error) {
      Message.error('生成失败，请重试')
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  // 保存内容
  const handleSave = () => {
    Message.success('内容已保存')
  }

  // 复制内容
  const handleCopy = () => {
    Message.success('内容已复制到剪贴板')
  }

  // 下载内容
  const handleDownload = () => {
    Message.success('内容已下载')
  }

  // 立即发布
  const handlePublish = () => {
    router.push('/e-commerce/auto-publish')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/e-commerce')}
          className="mb-6"
        >
          返回电商板块
        </Button>

        {/* 标题 */}
        <div className="mb-8">
          <Title level={2}>智能详情页生成</Title>
          <Text type="secondary">基于产品信息和热点话题，自动生成吸引人的商品详情页</Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* 左侧：输入表单 */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <RobotOutlined />
                  <span>产品信息</span>
                </Space>
              }
            >
              <Form form={form} layout="vertical" onFinish={handleGenerate}>
                <Form.Item
                  label="产品名称"
                  name="productName"
                  rules={[{ required: true, message: '请输入产品名称' }]}
                >
                  <Input placeholder="请输入产品名称" />
                </Form.Item>

                <Form.Item
                  label="产品分类"
                  name="category"
                  rules={[{ required: true, message: '请选择产品分类' }]}
                >
                  <Select placeholder="请选择分类">
                    <Select.Option value="digital">数码配件</Select.Option>
                    <Select.Option value="smart">智能穿戴</Select.Option>
                    <Select.Option value="home">智能家居</Select.Option>
                    <Select.Option value="audio">影音娱乐</Select.Option>
                    <Select.Option value="life">生活日用</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="核心卖点"
                  name="sellingPoints"
                  tooltip="输入产品的核心卖点和优势"
                >
                  <TextArea
                    rows={4}
                    placeholder="例如：蓝牙5.3、主动降噪、30小时续航..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  label="产品图片"
                  name="images"
                  rules={[{ required: true, message: '请上传产品图片' }]}
                >
                  <Upload {...uploadProps}>
                    {fileList.length < 10 && (
                      <div>
                        <PictureOutlined className="text-2xl mb-2" />
                        <div className="text-sm">点击上传图片</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                <Divider>生成设置</Divider>

                <Form.Item
                  label="选择风格"
                  name="style"
                  initialValue="concise"
                >
                  <Radio.Group>
                    <Radio.Button value="concise">简洁</Radio.Button>
                    <Radio.Button value="fashion">时尚</Radio.Button>
                    <Radio.Button value="professional">专业</Radio.Button>
                    <Radio.Button value="life">生活</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label="内容长度">
                  <Slider
                    min={50}
                    max={500}
                    defaultValue={200}
                    marks={{
                      50: '简短',
                      200: '中等',
                      500: '详细',
                    }}
                  />
                </Form.Item>

                <Form.Item label="包含内容">
                  <Checkbox.Group defaultValue={['title', 'description', 'features']}>
                    <Space direction="vertical">
                      <Checkbox value="title">商品标题</Checkbox>
                      <Checkbox value="description">商品描述</Checkbox>
                      <Checkbox value="features">产品特性</Checkbox>
                      <Checkbox value="specs">规格参数</Checkbox>
                      <Checkbox value="keywords">关键词</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item label="关联热门话题">
                  <Select
                    mode="multiple"
                    placeholder="选择热门话题"
                    options={hotTopics.map(topic => ({
                      label: (
                        <Space>
                          <Text>{topic.title}</Text>
                          <Tag color="red" className="text-xs">热度 {topic.hot}</Tag>
                        </Space>
                      ),
                      value: topic.id,
                    }))}
                  />
                </Form.Item>

                {generating && (
                  <div className="mb-4">
                    <Text strong>生成进度：</Text>
                    <Progress percent={progress} status="active" />
                  </div>
                )}

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={generating}
                  block
                  size="large"
                  icon={<RobotOutlined />}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 border-0"
                >
                  {generating ? '生成中...' : '智能生成'}
                </Button>
              </Form>
            </Card>
          </Col>

          {/* 右侧：预览和结果 */}
          <Col xs={24} lg={14}>
            {generatedContent ? (
              <Card
                title={
                  <Space>
                    <EyeOutlined />
                    <span>生成结果预览</span>
                  </Space>
                }
                extra={
                  <Space>
                    <Radio.Group
                      value={previewMode}
                      onChange={(e) => setPreviewMode(e.target.value)}
                      size="small"
                    >
                      <Radio.Button value="mobile">手机</Radio.Button>
                      <Radio.Button value="pc">电脑</Radio.Button>
                    </Radio.Group>
                  </Space>
                }
              >
                <Tabs
                  items={[
                    {
                      key: 'preview',
                      label: '预览',
                      children: (
                        <div
                          className="bg-white border rounded-lg p-4"
                          style={{
                            maxWidth: previewMode === 'mobile' ? '375px' : '100%',
                            margin: '0 auto',
                          }}
                        >
                          {/* 商品图片 */}
                          <div className="mb-4">
                            {generatedContent.images.length > 0 && (
                              <Image
                                src={generatedContent.images[0]}
                                alt={generatedContent.title}
                                width="100%"
                                style={{ borderRadius: '8px' }}
                              />
                            )}
                          </div>

                          {/* 商品标题 */}
                          <Title level={4} className="mb-2">
                            {generatedContent.title}
                          </Title>

                          {/* 商品描述 */}
                          <Text type="secondary" className="block mb-4">
                            {generatedContent.description}
                          </Text>

                          {/* 产品特性 */}
                          <Divider orientation="left" orientationMargin="0">
                            产品特性
                          </Divider>
                          <ul className="list-disc pl-4 mb-4 space-y-2">
                            {generatedContent.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>

                          {/* 规格参数 */}
                          <Divider orientation="left" orientationMargin="0">
                            规格参数
                          </Divider>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {generatedContent.specifications.map((spec, index) => (
                              <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                                {spec}
                              </div>
                            ))}
                          </div>

                          {/* 关键词 */}
                          <Divider orientation="left" orientationMargin="0">
                            关键词
                          </Divider>
                          <Space size="small" wrap>
                            {generatedContent.keywords.map((keyword, index) => (
                              <Tag key={index} color="blue">
                                {keyword}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      ),
                    },
                    {
                      key: 'content',
                      label: '内容',
                      children: (
                        <Space direction="vertical" size="large" className="w-full">
                          <Card size="small" title="商品标题">
                            <TextArea value={generatedContent.title} rows={2} />
                          </Card>

                          <Card size="small" title="商品描述">
                            <TextArea value={generatedContent.description} rows={4} />
                          </Card>

                          <Card size="small" title="产品特性">
                            {generatedContent.features.map((feature, index) => (
                              <Input
                                key={index}
                                defaultValue={feature}
                                className="mb-2"
                                suffix={
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<BulbOutlined />}
                                  />
                                }
                              />
                            ))}
                          </Card>

                          <Card size="small" title="规格参数">
                            {generatedContent.specifications.map((spec, index) => (
                              <Input
                                key={index}
                                defaultValue={spec}
                                className="mb-2"
                              />
                            ))}
                          </Card>

                          <Card size="small" title="关键词">
                            <Input
                              defaultValue={generatedContent.keywords.join(', ')}
                            />
                          </Card>
                        </Space>
                      ),
                    },
                  ]}
                />

                <Divider />

                <Space className="w-full justify-center">
                  <Button icon={<SaveOutlined />} onClick={handleSave}>
                    保存
                  </Button>
                  <Button icon={<CopyOutlined />} onClick={handleCopy}>
                    复制
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                    下载
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handlePublish}
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 border-0"
                  >
                    立即发布
                  </Button>
                </Space>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <FileTextOutlined className="text-6xl mb-4 text-gray-300" />
                  <Title level={4} type="secondary">
                    还没有生成内容
                  </Title>
                  <Text type="secondary">
                    在左侧填写产品信息，点击"智能生成"按钮即可开始
                  </Text>
                </div>
              </Card>
            )}

            {/* 热门话题推荐 */}
            <Card
              title={
                <Space>
                  <BulbOutlined />
                  <span>热门话题推荐</span>
                </Space>
              }
              className="mt-6"
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {hotTopics.map((topic) => (
                  <Card key={topic.id} size="small" hoverable>
                    <Space className="w-full justify-between">
                      <Space>
                        <Tag color="orange">#{topic.id}</Tag>
                        <Text>{topic.title}</Text>
                      </Space>
                      <Tag color="red" className="text-xs">
                        🔥 热度 {topic.hot}
                      </Tag>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
