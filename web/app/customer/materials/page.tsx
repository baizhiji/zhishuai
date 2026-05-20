'use client'

import { useState, useEffect } from 'react'
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
  Image,
  Popconfirm,
  Drawer,
} from 'antd'
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  TagsOutlined,
  FileImageOutlined,
  HeartOutlined,
  PictureOutlined,
  ShoppingOutlined,
  VideoCameraOutlined,
  RobotOutlined,
  FontSizeOutlined,
} from '@ant-design/icons'
import { ContentCategory, contentCategoryConfig } from '@/lib/content/types'

const { Title, Text, Paragraph } = Typography
const { Search } = Input

interface Material {
  id: string
  category: ContentCategory
  title: string
  content: string
  status: 'unused' | 'used'
  timestamp: number
}

interface MaterialLibraryPageProps {
  onSelectMaterial?: (material: Material) => void
  visible?: boolean
  onClose?: () => void
  filterCategory?: ContentCategory
}

export default function MaterialLibraryPage({
  onSelectMaterial,
  visible,
  onClose,
  filterCategory,
}: MaterialLibraryPageProps) {
  const [searchText, setSearchText] = useState('')
  const [filterCategoryState, setFilterCategoryState] = useState<ContentCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [materials, setMaterials] = useState<Material[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)

  // 从 localStorage 加载素材
  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('materials')
      if (saved) {
        try {
          setMaterials(JSON.parse(saved))
        } catch (error) {
          console.error('加载素材失败:', error)
        }
      }
    }
  }

  // 筛选素材
  const filteredMaterials = materials.filter((material) => {
    // 分类筛选
    const categoryMatch =
      filterCategoryState === 'all' || material.category === filterCategoryState

    // 外部传入的分类筛选（如果有的话）
    const externalCategoryMatch = !filterCategory || material.category === filterCategory

    // 状态筛选
    const statusMatch = filterStatus === 'all' || material.status === filterStatus

    // 搜索筛选
    const searchMatch =
      !searchText ||
      material.title.toLowerCase().includes(searchText.toLowerCase()) ||
      material.content.toLowerCase().includes(searchText.toLowerCase())

    return categoryMatch && statusMatch && searchMatch && externalCategoryMatch
  })

  // 删除素材
  const handleDelete = (id: string) => {
    const newMaterials = materials.filter((m) => m.id !== id)
    setMaterials(newMaterials)
    if (typeof window !== 'undefined') {
      localStorage.setItem('materials', JSON.stringify(newMaterials))
    }
    message.success('已删除')
  }

  // 复制内容
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    message.success('已复制到剪贴板')
  }

  // 下载内容
  const handleDownload = (material: Material) => {
    const categoryConfig = contentCategoryConfig[material.category]
    if (categoryConfig.type === 'image' || categoryConfig.type === 'video') {
      window.open(material.content, '_blank')
    } else {
      const blob = new Blob([material.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${material.title}_${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
    message.success('已下载')
  }

  // 预览素材
  const handlePreview = (material: Material) => {
    setPreviewMaterial(material)
    setPreviewVisible(true)
  }

  // 选择素材
  const handleSelect = (material: Material) => {
    if (onSelectMaterial) {
      onSelectMaterial(material)
      if (onClose) {
        onClose()
      }
    }
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
      [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined />,
    }
    return iconMap[category]
  }

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: Material) => (
        <Space>
          <span style={{ color: contentCategoryConfig[record.category]?.color }}>
            {getCategoryIcon(record.category)}
          </span>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: ContentCategory) => (
        <Tag color={contentCategoryConfig[category]?.color}>
          {contentCategoryConfig[category]?.label}
        </Tag>
      ),
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string, record: Material) => {
        const categoryConfig = contentCategoryConfig[record.category]
        if (categoryConfig.type === 'image' || categoryConfig.type === 'video') {
          return (
            <Image
              src={content}
              alt={record.title}
              style={{ width: 60, height: 60, objectFit: 'cover' }}
            />
          )
        }
        return <Paragraph ellipsis={{ rows: 1 }}>{content}</Paragraph>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'used' ? 'green' : 'blue'}>
          {status === 'used' ? '已使用' : '未使用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: number) =>
        new Date(timestamp).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Material) => (
        <Space size="small">
          {onSelectMaterial && (
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleSelect(record)}
            >
              使用
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record.content)}
          >
            复制
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 渲染主页面
  const renderMainPage = () => (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2}>素材库</Title>
        <Text type="secondary">管理和使用您的AI生成内容</Text>
      </div>

      {/* 筛选栏 */}
      <Card className="mb-4">
        <Row gutter={16}>
          <Col span={6}>
            <Search
              placeholder="搜索素材标题或内容"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择分类"
              value={filterCategoryState}
              onChange={setFilterCategoryState}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="all">全部分类</Select.Option>
              {Object.values(ContentCategory).map((category) => (
                <Select.Option key={category} value={category}>
                  {contentCategoryConfig[category]?.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="unused">未使用</Select.Option>
              <Select.Option value="used">已使用</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 素材表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredMaterials}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  )

  // 渲染抽屉版本（用于在发布时选择素材）
  const renderDrawer = () => (
    <Drawer
      title="选择素材"
      onClose={onClose}
      open={visible}
      width={800}
    >
      {/* 筛选栏 */}
      <div className="mb-4">
        <Row gutter={16}>
          <Col span={12}>
            <Search
              placeholder="搜索素材标题或内容"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={12}>
            <Select
              placeholder="选择分类"
              value={filterCategory}
              onChange={() => {}}
              style={{ width: '100%' }}
              disabled
            >
              <Select.Option value={filterCategory}>
                {contentCategoryConfig[filterCategory!]?.label}
              </Select.Option>
            </Select>
          </Col>
        </Row>
      </div>

      {/* 素材表格 */}
      <Table
        columns={columns}
        dataSource={filteredMaterials}
        rowKey="id"
        pagination={{
          pageSize: 5,
          size: 'small',
        }}
      />
    </Drawer>
  )

  // 预览模态框
  const renderPreviewModal = () => (
    <Modal
      title={previewMaterial?.title}
      open={previewVisible}
      onCancel={() => setPreviewVisible(false)}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} onClick={() => previewMaterial && handleCopy(previewMaterial.content)}>
          复制
        </Button>,
        <Button key="download" icon={<DownloadOutlined />} onClick={() => previewMaterial && handleDownload(previewMaterial)}>
          下载
        </Button>,
        <Button key="close" onClick={() => setPreviewVisible(false)}>
          关闭
        </Button>,
      ]}
      width={800}
    >
      {previewMaterial && (
        <div>
          <Space className="mb-4">
            <Tag color={contentCategoryConfig[previewMaterial.category]?.color}>
              {contentCategoryConfig[previewMaterial.category]?.label}
            </Tag>
            <Tag color={previewMaterial.status === 'used' ? 'green' : 'blue'}>
              {previewMaterial.status === 'used' ? '已使用' : '未使用'}
            </Tag>
          </Space>
          <div className="mt-4">
            {contentCategoryConfig[previewMaterial.category]?.type === 'image' ? (
              <Image src={previewMaterial.content} alt={previewMaterial.title} style={{ maxWidth: '100%' }} />
            ) : contentCategoryConfig[previewMaterial.category]?.type === 'video' ? (
              <video src={previewMaterial.content} controls style={{ maxWidth: '100%', maxHeight: 400 }} />
            ) : (
              <Paragraph className="whitespace-pre-wrap">{previewMaterial.content}</Paragraph>
            )}
          </div>
        </div>
      )}
    </Modal>
  )

  // 根据props决定渲染主页面还是抽屉
  return (
    <>
      {visible ? renderDrawer() : renderMainPage()}
      {renderPreviewModal()}
    </>
  )
}
