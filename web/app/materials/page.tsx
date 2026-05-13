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
  PlusOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined,
  FolderAddOutlined,
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
  folderId?: string // 所属文件夹ID
  isFavorite?: boolean // 是否收藏
}

// 文件夹类型
interface Folder {
  id: string
  name: string
  icon: string
  color: string
  createdAt: number
}

// 默认文件夹
const defaultFolders: Folder[] = [
  { id: 'all', name: '全部素材', icon: 'folder', color: '#4F46E5', createdAt: 0 },
  { id: 'favorites', name: '我的收藏', icon: 'star', color: '#f59e0b', createdAt: 0 },
  { id: 'titles', name: '标题文案', icon: 'font', color: '#8b5cf6', createdAt: 0 },
  { id: 'images', name: '图片素材', icon: 'image', color: '#06b6d4', createdAt: 0 },
  { id: 'videos', name: '视频素材', icon: 'video', color: '#ef4444', createdAt: 0 },
  { id: 'copies', name: '文案大全', icon: 'file', color: '#10b981', createdAt: 0 },
]

// 文件夹图标映射
const folderIconMap: Record<string, React.ReactNode> = {
  folder: <FolderOutlined />,
  star: <StarFilled />,
  font: <FontSizeOutlined />,
  image: <PictureOutlined />,
  video: <VideoCameraOutlined />,
  file: <FileTextOutlined />,
}

export default function MaterialLibraryPage() {
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState<ContentCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [materials, setMaterials] = useState<Material[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [folders, setFolders] = useState<Folder[]>(defaultFolders)
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)

  // 从 localStorage 加载素材和文件夹
  useEffect(() => {
    loadMaterials()
    loadFolders()
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

  const loadFolders = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('materialFolders')
      if (saved) {
        try {
          const customFolders = JSON.parse(saved)
          setFolders([...defaultFolders, ...customFolders])
        } catch (error) {
          console.error('加载文件夹失败:', error)
        }
      }
    }
  }

  // 保存自定义文件夹到 localStorage
  const saveCustomFolders = (customFolders: Folder[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('materialFolders', JSON.stringify(customFolders))
    }
  }

  // 创建文件夹
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      message.error('请输入文件夹名称')
      return
    }
    const newFolder: Folder = {
      id: `custom_${Date.now()}`,
      name: newFolderName,
      icon: 'folder',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      createdAt: Date.now(),
    }
    const customFolders = folders.filter(f => !defaultFolders.some(df => df.id === f.id))
    const updatedCustomFolders = [...customFolders, newFolder]
    saveCustomFolders(updatedCustomFolders)
    setFolders([...defaultFolders, ...updatedCustomFolders])
    setNewFolderName('')
    setShowFolderModal(false)
    message.success('文件夹创建成功')
  }

  // 删除文件夹
  const handleDeleteFolder = (folderId: string) => {
    const customFolders = folders.filter(f => !defaultFolders.some(df => df.id === f.id) && f.id !== folderId)
    saveCustomFolders(customFolders)
    setFolders([...defaultFolders, ...customFolders])
    if (selectedFolder === folderId) {
      setSelectedFolder('all')
    }
    message.success('文件夹已删除')
  }

  // 重命名文件夹
  const handleRenameFolder = () => {
    if (!editingFolder || !newFolderName.trim()) {
      message.error('请输入文件夹名称')
      return
    }
    const customFolders = folders.map(f => 
      f.id === editingFolder.id ? { ...f, name: newFolderName } : f
    ).filter(f => !defaultFolders.some(df => df.id === f.id))
    saveCustomFolders(customFolders)
    setFolders([...defaultFolders.map(f => f.id === editingFolder.id ? { ...f, name: newFolderName } : f), ...customFolders.filter(f => !defaultFolders.some(df => df.id === f.id))])
    setEditingFolder(null)
    setNewFolderName('')
    setShowFolderModal(false)
    message.success('文件夹已重命名')
  }

  // 切换收藏状态
  const toggleFavorite = (materialId: string) => {
    const updated = materials.map(m => 
      m.id === materialId ? { ...m, isFavorite: !m.isFavorite } : m
    )
    setMaterials(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('materials', JSON.stringify(updated))
    }
    message.success('已更新收藏状态')
  }

  // 移动素材到文件夹
  const moveToFolder = (materialIds: string[], folderId: string) => {
    const updated = materials.map(m => 
      materialIds.includes(m.id) ? { ...m, folderId: folderId === 'all' ? undefined : folderId } : m
    )
    setMaterials(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('materials', JSON.stringify(updated))
    }
    setSelectedRowKeys([])
    message.success(`已移动到 ${folders.find(f => f.id === folderId)?.name || '全部素材'}`)
  }

  // 筛选素材
  const filteredMaterials = materials.filter((material) => {
    const categoryMatch = filterCategory === 'all' || material.category === filterCategory
    const statusMatch = filterStatus === 'all' || material.status === filterStatus
    const searchMatch =
      !searchText ||
      material.title.toLowerCase().includes(searchText.toLowerCase()) ||
      material.content.toLowerCase().includes(searchText.toLowerCase())
    
    // 文件夹筛选
    let folderMatch = true
    if (selectedFolder === 'favorites') {
      folderMatch = material.isFavorite === true
    } else if (selectedFolder === 'titles') {
      folderMatch = material.category === ContentCategory.TITLE || material.category === ContentCategory.TAGS
    } else if (selectedFolder === 'images') {
      folderMatch = material.category === ContentCategory.IMAGE || material.category === ContentCategory.XIAOHONGSHU
    } else if (selectedFolder === 'videos') {
      folderMatch = material.category === ContentCategory.VIDEO || material.category === ContentCategory.DIGITAL_HUMAN
    } else if (selectedFolder === 'copies') {
      folderMatch = material.category === ContentCategory.COPYWRITING || material.category === ContentCategory.ECOMMERCE
    } else if (selectedFolder !== 'all') {
      folderMatch = material.folderId === selectedFolder
    }

    return categoryMatch && statusMatch && searchMatch && folderMatch
  })

  // 获取文件夹中的素材数量
  const getFolderCount = (folderId: string) => {
    if (folderId === 'all') return materials.length
    if (folderId === 'favorites') return materials.filter(m => m.isFavorite).length
    if (folderId === 'titles') return materials.filter(m => m.category === ContentCategory.TITLE || m.category === ContentCategory.TAGS).length
    if (folderId === 'images') return materials.filter(m => m.category === ContentCategory.IMAGE || m.category === ContentCategory.XIAOHONGSHU).length
    if (folderId === 'videos') return materials.filter(m => m.category === ContentCategory.VIDEO || m.category === ContentCategory.DIGITAL_HUMAN).length
    if (folderId === 'copies') return materials.filter(m => m.category === ContentCategory.COPYWRITING || m.category === ContentCategory.ECOMMERCE).length
    return materials.filter(m => m.folderId === folderId).length
  }

  // 删除素材
  const handleDelete = (id: string) => {
    const newMaterials = materials.filter((m) => m.id !== id)
    setMaterials(newMaterials)
    if (typeof window !== 'undefined') {
      localStorage.setItem('materials', JSON.stringify(newMaterials))
    }
    message.success('已删除')
  }

  // 批量删除
  const handleBatchDelete = () => {
    const newMaterials = materials.filter((m) => !selectedRowKeys.includes(m.id))
    setMaterials(newMaterials)
    if (typeof window !== 'undefined') {
      localStorage.setItem('materials', JSON.stringify(newMaterials))
    }
    setSelectedRowKeys([])
    message.success(`已删除 ${selectedRowKeys.length} 条素材`)
  }

  // 复制内容
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    message.success('已复制到剪贴板')
  }

  // 下载内容
  const handleDownload = (material: Material) => {
    const blob = new Blob([material.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${material.title}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    message.success('已下载')
  }

  // 预览素材
  const handlePreview = (material: Material) => {
    setPreviewMaterial(material)
    setPreviewVisible(true)
  }

  // 获取分类图标
  const getCategoryIcon = (category: ContentCategory) => {
    const iconMap: Partial<Record<ContentCategory, React.ReactNode>> = {
      [ContentCategory.TITLE]: <FontSizeOutlined />,
      [ContentCategory.TAGS]: <TagsOutlined />,
      [ContentCategory.COPYWRITING]: <FileTextOutlined />,
      [ContentCategory.IMAGE_TO_TEXT]: <FileImageOutlined />,
      [ContentCategory.XIAOHONGSHU]: <HeartOutlined />,
      [ContentCategory.IMAGE]: <PictureOutlined />,
      [ContentCategory.ECOMMERCE]: <ShoppingOutlined />,
      [ContentCategory.VIDEO]: <VideoCameraOutlined />,
      [ContentCategory.VIDEO_ANALYSIS]: <VideoCameraOutlined />,
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
          <Button 
            type="text" 
            size="small" 
            icon={record.isFavorite ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />} 
            onClick={() => toggleFavorite(record.id)}
          />
          <span style={{ color: contentCategoryConfig[record.category]?.color }}>
            {getCategoryIcon(record.category)}
          </span>
          <Text strong>{text}</Text>
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
        if (categoryConfig?.type === 'image' || categoryConfig?.type === 'video') {
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
      render: (timestamp: number) => new Date(timestamp).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Material) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
            预览
          </Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.content)}>
            复制
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} className="mb-1">素材库</Title>
          <Text type="secondary">管理和查看所有已生成的素材内容</Text>
        </div>
        <Space>
          <Button icon={<FolderAddOutlined />} onClick={() => { setNewFolderName(''); setEditingFolder(null); setShowFolderModal(true); }}>
            新建文件夹
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新建素材
          </Button>
        </Space>
      </div>

      <div className="flex gap-4">
        {/* 文件夹侧边栏 */}
        <Card size="small" style={{ width: 240, borderRadius: 8 }} styles={{ body: { padding: 8 } }}>
          <div className="mb-3">
            <Text strong type="secondary" style={{ fontSize: 12 }}>文件夹</Text>
          </div>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`flex items-center justify-between p-2 rounded cursor-pointer mb-1 ${
                selectedFolder === folder.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: folder.color }}>
                  {folderIconMap[folder.icon] || <FolderOutlined />}
                </span>
                <Text style={{ color: selectedFolder === folder.id ? '#4F46E5' : '#374151' }}>
                  {folder.name}
                </Text>
              </div>
              <div className="flex items-center gap-1">
                <Tag style={{ marginRight: 0, fontSize: 11 }}>{getFolderCount(folder.id)}</Tag>
                {!defaultFolders.some(df => df.id === folder.id) && (
                  <Popconfirm 
                    title="确定删除此文件夹?" 
                    onConfirm={(e) => { e?.stopPropagation(); handleDeleteFolder(folder.id); }}
                  >
                    <Button 
                      type="text" 
                      size="small" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={(e) => e?.stopPropagation()}
                    />
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </Card>

        {/* 素材列表区域 */}
        <div className="flex-1">
          {/* 筛选栏 */}
          <Card size="small" className="mb-4" style={{ borderRadius: 8 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="搜索素材标题或内容"
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Select
                  placeholder="选择分类"
                  value={filterCategory}
                  onChange={setFilterCategory}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="all">全部分类</Select.Option>
                  {Object.entries(contentCategoryConfig).map(([key, config]) => (
                    <Select.Option key={key} value={key}>
                      {config.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Select
                  placeholder="选择状态"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="all">全部状态</Select.Option>
                  <Select.Option value="unused">未使用</Select.Option>
                  <Select.Option value="used">已使用</Select.Option>
                </Select>
              </Col>
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Text type="secondary">共 {filteredMaterials.length} 条素材</Text>
                  {selectedRowKeys.length > 0 && (
                    <>
                      <Select
                        placeholder="移动到"
                        style={{ width: 120 }}
                        onChange={(value) => moveToFolder(selectedRowKeys as string[], value)}
                      >
                        <Select.Option value="all">移除文件夹</Select.Option>
                        {folders.filter(f => f.id !== 'all' && f.id !== 'favorites').map(folder => (
                          <Select.Option key={folder.id} value={folder.id}>{folder.name}</Select.Option>
                        ))}
                      </Select>
                      <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 条素材？`} onConfirm={handleBatchDelete}>
                        <Button danger icon={<DeleteOutlined />}>
                          批量删除
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 素材表格 */}
          <Card style={{ borderRadius: 8 }}>
            <Table
              columns={columns}
              dataSource={filteredMaterials}
              rowKey="id"
              rowSelection={rowSelection}
              pagination={{
                pageSize: 10,
                size: 'small',
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </div>
      </div>

      {/* 创建/编辑文件夹模态框 */}
      <Modal
        title={editingFolder ? '编辑文件夹' : '新建文件夹'}
        open={showFolderModal}
        onCancel={() => { setShowFolderModal(false); setNewFolderName(''); setEditingFolder(null); }}
        onOk={editingFolder ? handleRenameFolder : handleCreateFolder}
        okText={editingFolder ? '保存' : '创建'}
      >
        <div className="py-4">
          <Text type="secondary">文件夹名称</Text>
          <Input
            className="mt-2"
            placeholder="请输入文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onPressEnter={editingFolder ? handleRenameFolder : handleCreateFolder}
          />
        </div>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title={previewMaterial?.title}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="favorite" icon={previewMaterial?.isFavorite ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />} onClick={() => previewMaterial && toggleFavorite(previewMaterial.id)}>
            {previewMaterial?.isFavorite ? '取消收藏' : '收藏'}
          </Button>,
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
    </div>
  )
}
