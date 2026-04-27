'use client'

import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  message,
  Tabs,
  Empty,
  Image,
} from 'antd'
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  RobotOutlined,
  ShopOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Search } = Input

interface Material {
  id: string
  type: 'text' | 'image' | 'video' | 'digital-human' | 'ecommerce'
  title: string
  content: string
  url?: string
  thumbnail?: string
  status: 'unused' | 'used'
  createdAt: string
  category: string
}

export default function MaterialLibraryPage() {
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')

  // 模拟数据
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      type: 'text',
      title: '抖音文案 - AI智能生成',
      content: '这是一段关于AI技术的抖音文案，通过智枢AI自动生成...',
      status: 'unused',
      createdAt: '2024-03-25 10:30:00',
      category: '自媒体',
    },
    {
      id: '2',
      type: 'image',
      title: '产品封面图',
      content: '生成的产品宣传图片',
      url: '/placeholder-image.jpg',
      thumbnail: '/placeholder-image.jpg',
      status: 'used',
      createdAt: '2024-03-24 15:20:00',
      category: '电商',
    },
    {
      id: '3',
      type: 'video',
      title: '短视频 - 产品介绍',
      content: '15秒产品介绍视频',
      url: '/placeholder-video.mp4',
      thumbnail: '/placeholder-video.jpg',
      status: 'unused',
      createdAt: '2024-03-23 09:15:00',
      category: '自媒体',
    },
    {
      id: '4',
      type: 'digital-human',
      title: '数字人视频 - 讲解',
      content: 'AI数字人讲解产品功能',
      url: '/placeholder-digital-human.mp4',
      thumbnail: '/placeholder-digital-human.jpg',
      status: 'unused',
      createdAt: '2024-03-22 14:45:00',
      category: '自媒体',
    },
  ])

  // 筛选数据
  const filteredMaterials = materials.filter((item) => {
    const matchSearch = item.title.includes(searchText) || item.content.includes(searchText)
    const matchType = filterType === 'all' || item.type === filterType
    const matchStatus = filterStatus === 'all' || item.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  // 类型配置
  const typeConfig = {
    text: {
      icon: <FileTextOutlined className="text-blue-500 text-2xl" />,
      color: 'blue',
      label: '文本',
    },
    image: {
      icon: <PictureOutlined className="text-green-500 text-2xl" />,
      color: 'green',
      label: '图片',
    },
    video: {
      icon: <VideoCameraOutlined className="text-purple-500 text-2xl" />,
      color: 'purple',
      label: '视频',
    },
    'digital-human': {
      icon: <RobotOutlined className="text-orange-500 text-2xl" />,
      color: 'orange',
      label: '数字人',
    },
    ecommerce: {
      icon: <ShopOutlined className="text-pink-500 text-2xl" />,
      color: 'pink',
      label: '电商详情页',
    },
  }

  // 删除素材
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个素材吗？',
      onOk: () => {
        setMaterials(materials.filter((item) => item.id !== id))
        message.success('删除成功')
      },
    })
  }

  // 下载素材
  const handleDownload = (item: Material) => {
    message.success(`正在下载：${item.title}`)

    // 下载后自动标记为已使用（每个素材只能使用一次）
    setMaterials(
      materials.map((m) =>
        m.id === item.id ? { ...m, status: 'used' as const } : m
      )
    )
  }

  // 查看详情
  const handleView = (item: Material) => {
    Modal.info({
      title: item.title,
      content: (
        <div>
          <p>
            <Text strong>类型：</Text>
            {typeConfig[item.type].label}
          </p>
          <p>
            <Text strong>分类：</Text>
            {item.category}
          </p>
          <p>
            <Text strong>状态：</Text>
            {item.status === 'used' ? '已使用' : '未使用'}
          </p>
          <p>
            <Text strong>内容：</Text>
          </p>
          <div className="bg-gray-50 p-3 rounded mt-2">
            {item.type === 'text' ? (
              <Text>{item.content}</Text>
            ) : (
              <Image src={item.thumbnail || item.url} alt={item.title} />
            )}
          </div>
          <p className="mt-2 text-gray-500 text-sm">
            创建时间：{item.createdAt}
          </p>
        </div>
      ),
    })
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <div className="flex items-center gap-2">
          {typeConfig[type as keyof typeof typeConfig].icon}
          <span>{typeConfig[type as keyof typeof typeConfig].label}</span>
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => (
        <Text type="secondary" className="text-sm">
          {content.length > 50 ? `${content.substring(0, 50)}...` : content}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'used' ? 'green' : 'default'}>
          {status === 'used' ? '已使用' : '未使用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Material) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            disabled={record.status === 'used'}
          >
            下载
          </Button>
          <Button
            type="link"
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

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">素材库</Title>
        <Text type="secondary">
          统一管理所有AI生成的内容（文本、图片、视频、数字人视频、电商详情页等）
        </Text>
      </div>

      {/* 筛选栏 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="搜索素材"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Select
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
              options={[
                { label: '全部类型', value: 'all' },
                { label: '文本', value: 'text' },
                { label: '图片', value: 'image' },
                { label: '视频', value: 'video' },
                { label: '数字人视频', value: 'digital-human' },
                { label: '电商详情页', value: 'ecommerce' },
              ]}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Select
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '未使用', value: 'unused' },
                { label: '已使用', value: 'used' },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Text type="secondary">
              共 {filteredMaterials.length} 个素材
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {materials.filter((m) => m.type === 'text').length}
              </div>
              <div className="text-gray-600 text-sm">文本</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {materials.filter((m) => m.type === 'image').length}
              </div>
              <div className="text-gray-600 text-sm">图片</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {materials.filter((m) => m.type === 'video').length}
              </div>
              <div className="text-gray-600 text-sm">视频</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {materials.filter((m) => m.type === 'digital-human').length}
              </div>
              <div className="text-gray-600 text-sm">数字人</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 素材列表 */}
      <Card>
        {filteredMaterials.length > 0 ? (
          <Table
            dataSource={filteredMaterials}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        ) : (
          <Empty description="暂无素材" />
        )}
      </Card>
    </div>
  )
}
