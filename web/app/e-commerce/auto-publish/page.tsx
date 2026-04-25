'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Message,
  Modal,
  Row,
  Col,
  Upload,
  Checkbox,
  Radio,
  Progress,
  Divider,
  Image,
  Badge,
  Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  SendOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'

const { Title, Text } = Typography
const { TextArea } = Input

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  images: string[]
  description: string
  platforms: string[]
  status: 'draft' | 'published' | 'scheduled'
  publishTime?: string
  createdAt: string
}

interface PublishTask {
  id: string
  productName: string
  platforms: string[]
  status: 'pending' | 'publishing' | 'success' | 'failed'
  progress: number
  createdAt: string
  completedAt?: string
  message: string
}

export default function AutoPublishPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // 商品列表
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: '无线蓝牙耳机 Pro',
      category: '数码配件',
      price: 299,
      stock: 100,
      images: ['https://example.com/product1.jpg'],
      description: '高品质无线蓝牙耳机，支持主动降噪，30小时续航',
      platforms: ['taobao', 'jd', 'pinduoduo'],
      status: 'published',
      createdAt: '2024-01-15 10:00:00',
    },
    {
      id: '2',
      name: '智能手表 S2',
      category: '智能穿戴',
      price: 899,
      stock: 50,
      images: ['https://example.com/product2.jpg'],
      description: '多功能智能手表，健康监测，运动模式，防水设计',
      platforms: ['taobao', 'douyin'],
      status: 'published',
      createdAt: '2024-01-14 14:30:00',
    },
    {
      id: '3',
      name: '便携式充电宝 10000mAh',
      category: '数码配件',
      price: 99,
      stock: 200,
      images: ['https://example.com/product3.jpg'],
      description: '大容量便携充电宝，双向快充，轻薄设计',
      platforms: ['pinduoduo'],
      status: 'draft',
      createdAt: '2024-01-16 09:00:00',
    },
    {
      id: '4',
      name: '智能家居摄像头',
      category: '智能家居',
      price: 199,
      stock: 80,
      images: ['https://example.com/product4.jpg'],
      description: '高清智能摄像头，夜视功能，移动侦测，云存储',
      platforms: ['taobao', 'jd', 'meituan'],
      status: 'scheduled',
      publishTime: '2024-01-20 10:00:00',
      createdAt: '2024-01-13 16:20:00',
    },
  ])

  // 发布任务
  const [publishTasks, setPublishTasks] = useState<PublishTask[]>([
    {
      id: '1',
      productName: '无线蓝牙耳机 Pro',
      platforms: ['taobao', 'jd', 'pinduoduo'],
      status: 'success',
      progress: 100,
      createdAt: '2024-01-15 10:05:00',
      completedAt: '2024-01-15 10:08:00',
      message: '发布成功',
    },
    {
      id: '2',
      productName: '智能手表 S2',
      platforms: ['taobao', 'douyin'],
      status: 'success',
      progress: 100,
      createdAt: '2024-01-14 14:35:00',
      completedAt: '2024-01-14 14:38:00',
      message: '发布成功',
    },
    {
      id: '3',
      productName: '智能家居摄像头',
      platforms: ['taobao', 'jd', 'meituan'],
      status: 'pending',
      progress: 0,
      createdAt: '2024-01-13 16:25:00',
      message: '定时任务，等待发布',
    },
  ])

  // 平台选项
  const platforms = [
    { id: 'taobao', name: '淘宝', icon: '🛍️' },
    { id: 'jd', name: '京东', icon: '🛒' },
    { id: 'pinduoduo', name: '拼多多', icon: '📦' },
    { id: 'douyin', name: '抖店', icon: '🎪' },
    { id: 'meituan', name: '美团', icon: '🍔' },
  ]

  // 分类选项
  const categories = [
    { id: 'digital', name: '数码配件' },
    { id: 'smart', name: '智能穿戴' },
    { id: 'home', name: '智能家居' },
    { id: 'audio', name: '影音娱乐' },
    { id: 'life', name: '生活日用' },
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

  // 创建商品
  const handleCreateProduct = async (values: any) => {
    try {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: values.productName,
        category: values.category,
        price: values.price,
        stock: values.stock,
        images: fileList.map(f => f.url || ''),
        description: values.description,
        platforms: values.platforms,
        status: values.publishMode === 'now' ? 'published' : 'draft',
        publishTime: values.publishMode === 'scheduled' ? values.scheduledTime : undefined,
        createdAt: new Date().toLocaleString('zh-CN'),
      }

      setProducts([newProduct, ...products])
      Message.success('商品创建成功！')

      form.resetFields()
      setFileList([])
    } catch (error) {
      Message.error('创建失败，请重试')
    }
  }

  // 立即发布
  const handlePublish = async (productId: string) => {
    setPublishing(true)
    setPublishProgress(0)

    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

      // 模拟发布进度
      const interval = setInterval(() => {
        setPublishProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 20
        })
      }, 500)

      await new Promise(resolve => setTimeout(resolve, 3000))

      clearInterval(interval)
      setPublishProgress(100)

      // 更新商品状态
      setProducts(products.map(p =>
        p.id === productId ? { ...p, status: 'published' as const } : p
      ))

      // 添加发布任务
      const newTask: PublishTask = {
        id: Date.now().toString(),
        productName: product.name,
        platforms: product.platforms,
        status: 'success',
        progress: 100,
        createdAt: new Date().toLocaleString('zh-CN'),
        completedAt: new Date().toLocaleString('zh-CN'),
        message: '发布成功',
      }
      setPublishTasks([newTask, ...publishTasks])

      Message.success('发布成功！')
    } catch (error) {
      Message.error('发布失败，请重试')
    } finally {
      setPublishing(false)
      setPublishProgress(0)
    }
  }

  // 查看详情
  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product)
    setDetailModalVisible(true)
  }

  // 删除商品
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      onOk: () => {
        setProducts(products.filter(p => p.id !== id))
        Message.success('商品已删除')
      },
    })
  }

  // 复制商品
  const handleCopy = (product: Product) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (副本)`,
      status: 'draft',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    setProducts([newProduct, ...products])
    Message.success('商品已复制')
  }

  const statusMap: Record<string, { text: string; color: string; icon: any }> = {
    draft: { text: '草稿', color: 'default', icon: <EditOutlined /> },
    published: { text: '已发布', color: 'success', icon: <CheckCircleOutlined /> },
    scheduled: { text: '定时发布', color: 'processing', icon: <ClockCircleOutlined /> },
  }

  const taskStatusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '等待中', color: 'default' },
    publishing: { text: '发布中', color: 'processing' },
    success: { text: '成功', color: 'success' },
    failed: { text: '失败', color: 'error' },
  }

  const columns = [
    {
      title: '商品信息',
      key: 'product',
      render: (_: any, record: Product) => (
        <Space>
          <Image
            src={record.images[0] || '/placeholder.png'}
            alt={record.name}
            width={50}
            height={50}
            className="rounded"
          />
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" className="text-sm">{record.category}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>¥{price}</Text>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => <Text>{stock}</Text>,
    },
    {
      title: '发布平台',
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platforms: string[]) => (
        <Space size="small">
          {platforms.map(p => (
            <Tooltip key={p} title={platforms.find(pt => pt.id === p)?.name}>
              <span className="text-lg">{platforms.find(pt => pt.id === p)?.icon}</span>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = statusMap[status]
        return (
          <Tag icon={s.icon} color={s.color}>
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <Text className="text-sm">{date.split(' ')[0]}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handlePublish(record.id)}
            >
              发布
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const taskColumns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '发布平台',
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platforms: string[]) => (
        <Space size="small">
          {platforms.map(p => (
            <Tooltip key={p} title={platforms.find(pt => pt.id === p)?.name}>
              <span className="text-lg">{platforms.find(pt => pt.id === p)?.icon}</span>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = taskStatusMap[status]
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: PublishTask) => (
        <Progress percent={progress} status={record.status === 'failed' ? 'exception' : 'active'} size="small" />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <Text className="text-sm">{date}</Text>,
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date?: string) => <Text className="text-sm">{date || '-'}</Text>,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      render: (message: string, record: PublishTask) => (
        <Text type={record.status === 'success' ? 'success' : 'danger'}>{message}</Text>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
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
          <Title level={2}>自动上架</Title>
          <Text type="secondary">一键上架商品到多个电商平台，支持定时发布</Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* 左侧：创建商品 */}
          <Col xs={24} lg={10}>
            <Card title="创建商品">
              <Form form={form} layout="vertical" onFinish={handleCreateProduct}>
                <Form.Item
                  label="商品名称"
                  name="productName"
                  rules={[{ required: true, message: '请输入商品名称' }]}
                >
                  <Input placeholder="请输入商品名称" />
                </Form.Item>

                <Form.Item
                  label="商品分类"
                  name="category"
                  rules={[{ required: true, message: '请选择商品分类' }]}
                >
                  <Select placeholder="请选择分类">
                    {categories.map(cat => (
                      <Select.Option key={cat.id} value={cat.name}>{cat.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="价格"
                      name="price"
                      rules={[{ required: true, message: '请输入价格' }]}
                    >
                      <Input
                        prefix="¥"
                        type="number"
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="库存"
                      name="stock"
                      rules={[{ required: true, message: '请输入库存' }]}
                    >
                      <Input type="number" placeholder="0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="商品图片"
                  name="images"
                  rules={[{ required: true, message: '请上传商品图片' }]}
                >
                  <Upload {...uploadProps}>
                    {fileList.length < 5 && (
                      <div>
                        <UploadOutlined className="text-2xl mb-2" />
                        <div className="text-sm">点击上传图片</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                <Form.Item
                  label="商品描述"
                  name="description"
                  rules={[{ required: true, message: '请输入商品描述' }]}
                >
                  <TextArea rows={4} placeholder="请输入商品详细描述" maxLength={1000} showCount />
                </Form.Item>

                <Form.Item
                  label="发布平台"
                  name="platforms"
                  rules={[{ required: true, message: '请选择发布平台' }]}
                >
                  <Checkbox.Group>
                    <Space direction="vertical">
                      {platforms.map(platform => (
                        <Checkbox key={platform.id} value={platform.id}>
                          <Space>
                            <span className="text-xl">{platform.icon}</span>
                            <span>{platform.name}</span>
                          </Space>
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item
                  label="发布方式"
                  name="publishMode"
                  initialValue="now"
                >
                  <Radio.Group>
                    <Radio value="now">
                      <Space>
                        <SendOutlined />
                        <span>立即发布</span>
                      </Space>
                    </Radio>
                    <Radio value="draft">
                      <Space>
                        <EditOutlined />
                        <span>保存草稿</span>
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

                {form.getFieldValue('publishMode') === 'scheduled' && (
                  <Form.Item
                    label="发布时间"
                    name="scheduledTime"
                    rules={[{ required: true, message: '请选择发布时间' }]}
                  >
                    <Input type="datetime-local" />
                  </Form.Item>
                )}

                {publishing && (
                  <div className="mb-4">
                    <Text strong>发布进度：</Text>
                    <Progress percent={publishProgress} status="active" />
                  </div>
                )}

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  icon={<PlusOutlined />}
                  className="bg-gradient-to-r from-orange-500 to-red-600 border-0"
                >
                  创建商品
                </Button>
              </Form>
            </Card>
          </Col>

          {/* 右侧：商品列表 */}
          <Col xs={24} lg={14}>
            <Card
              title="商品列表"
              extra={
                <Badge count={products.length} showZero color="orange" />
              }
            >
              <Table
                columns={columns}
                dataSource={products}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: true }}
              />
            </Card>
          </Col>
        </Row>

        {/* 发布任务 */}
        <Card
          title="发布任务"
          className="mt-6"
          extra={
            <Text type="secondary">最近 {publishTasks.length} 次发布</Text>
          }
        >
          <Table
            columns={taskColumns}
            dataSource={publishTasks}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </Card>

        {/* 商品详情弹窗 */}
        <Modal
          title="商品详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedProduct && (
            <Space direction="vertical" size="large" className="w-full">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card>
                    <Image
                      src={selectedProduct.images[0] || '/placeholder.png'}
                      alt={selectedProduct.name}
                      width="100%"
                    />
                  </Card>
                </Col>
                <Col span={16}>
                  <Card>
                    <Space direction="vertical" size="middle" className="w-full">
                      <Title level={4}>{selectedProduct.name}</Title>
                      <Space>
                        <Text strong style={{ color: '#ff4d4f', fontSize: '24px' }}>
                          ¥{selectedProduct.price}
                        </Text>
                        <Tag color="blue">{selectedProduct.category}</Tag>
                        <Tag icon={<ShoppingOutlined />} color="orange">
                          库存：{selectedProduct.stock}
                        </Tag>
                      </Space>

                      <Divider />

                      <Space direction="vertical" size="small">
                        <Text strong>商品描述</Text>
                        <Text>{selectedProduct.description}</Text>
                      </Space>

                      <Divider />

                      <Space direction="vertical" size="small">
                        <Text strong>发布平台</Text>
                        <Space size="small">
                          {selectedProduct.platforms.map(p => (
                            <Tooltip key={p} title={platforms.find(pt => pt.id === p)?.name}>
                              <span className="text-2xl">{platforms.find(pt => pt.id === p)?.icon}</span>
                            </Tooltip>
                          ))}
                        </Space>
                      </Space>

                      <Divider />

                      <Space direction="vertical" size="small">
                        <Text strong>状态</Text>
                        <Tag icon={statusMap[selectedProduct.status].icon} color={statusMap[selectedProduct.status].color}>
                          {statusMap[selectedProduct.status].text}
                        </Tag>
                        {selectedProduct.publishTime && (
                          <Text type="secondary" className="text-sm">
                            定时发布：{selectedProduct.publishTime}
                          </Text>
                        )}
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Space className="w-full justify-end">
                <Button onClick={() => handleCopy(selectedProduct)}>
                  复制商品
                </Button>
                {selectedProduct.status === 'draft' && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handlePublish(selectedProduct.id)}
                  >
                    立即发布
                  </Button>
                )}
              </Space>
            </Space>
          )}
        </Modal>
      </div>
    </div>
  )
}
