<<<<<<< HEAD
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
  FileOutlined,
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

export default function MaterialLibraryPage() {
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

    // 状态筛选
    const statusMatch = filterStatus === 'all' || material.status === filterStatus

    // 搜索筛选
    const searchMatch =
      !searchText ||
      material.title.toLowerCase().includes(searchText.toLowerCase()) ||
      material.content.toLowerCase().includes(searchText.toLowerCase())

    return categoryMatch && statusMatch && searchMatch
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

  // 获取分类图标
  const getCategoryIcon = (category: ContentCategory) => {
    const iconMap: Record<ContentCategory, React.ReactNode> = {
      [ContentCategory.TITLE]: <FontSizeOutlined />,
      [ContentCategory.TAGS]: <TagsOutlined />,
      [ContentCategory.COPYWRITING]: <FileTextOutlined />,
      [ContentCategory.IMAGE_TO_TEXT]: <FileImageOutlined />,
      [ContentCategory.XIAOHONGSHU]: <HeartOutlined />,
      [ContentCategory.IMAGE]: <PictureOutlined />,
      [ContentCategory.ECOMMERCE]: <ShoppingOutlined />,
      [ContentCategory.VIDEO]: <VideoCameraOutlined />,
      [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined />,
      [ContentCategory.VIDEO_ANALYSIS]: <FileOutlined />,
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

  return (
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
=======
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tabs,
  Input,
  Tag,
  Image,
  Empty,
  Row,
  Col,
  Spin,
  message,
  Modal,
} from 'antd';
import {
  FontSizeOutlined,
  TagsOutlined,
  FileTextOutlined,
  PictureOutlined,
  HeartOutlined,
  ShoppingOutlined,
  VideoCameraOutlined,
  ApartmentOutlined,
  RobotOutlined,
  SearchOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  ContentCategory,
  contentCategoryConfig,
} from '@/lib/content/types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// 素材库存储键
const STORAGE_KEY = 'materials-library';

// 素材项类型
interface MaterialItem {
  id: string;
  category: ContentCategory;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnail?: string;
  createdAt: number;
}

// 内容类型配置
const categoryList = [
  { key: ContentCategory.COPYWRITING, label: '文案', icon: <FileTextOutlined /> },
  { key: ContentCategory.XIAOHONGSHU, label: '小红书', icon: <HeartOutlined /> },
  { key: ContentCategory.IMAGE, label: '图片', icon: <PictureOutlined /> },
  { key: ContentCategory.VIDEO, label: '视频', icon: <VideoCameraOutlined /> },
  { key: ContentCategory.DIGITAL_HUMAN, label: '数字人', icon: <RobotOutlined /> },
  { key: ContentCategory.ECOMMERCE, label: '电商', icon: <ShoppingOutlined /> },
  { key: ContentCategory.TITLE, label: '标题', icon: <FontSizeOutlined /> },
  { key: ContentCategory.TAGS, label: '标签', icon: <TagsOutlined /> },
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ContentCategory | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<MaterialItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // 加载素材
  const loadMaterials = () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        const factoryData = localStorage.getItem('generation-history');
        const savedData = localStorage.getItem(STORAGE_KEY);
        
        // 合并内容工厂和素材库的数据
        const allMaterials: MaterialItem[] = [];
        
        // 从内容工厂历史记录导入
        if (factoryData) {
          const history = JSON.parse(factoryData);
          history.forEach((record: any) => {
            if (record.status === 'success') {
              allMaterials.push({
                id: `factory-${record.id}`,
                category: record.category,
                title: record.title || getCategoryLabel(record.category),
                content: record.content || '',
                imageUrl: record.imageUrl,
                videoUrl: record.videoUrl,
                thumbnail: record.thumbnail,
                createdAt: record.timestamp,
              });
            }
          });
        }
        
        // 从素材库导入
        if (savedData) {
          const saved = JSON.parse(savedData);
          saved.forEach((item: MaterialItem) => {
            if (!allMaterials.find(m => m.id === item.id)) {
              allMaterials.push(item);
            }
          });
        }
        
        // 按时间排序
        allMaterials.sort((a, b) => b.createdAt - a.createdAt);
        setMaterials(allMaterials);
      }
    } catch (error) {
      console.error('加载素材失败:', error);
    }
    setLoading(false);
  };

  // 获取分类标签
  const getCategoryLabel = (category: ContentCategory) => {
    return contentCategoryConfig[category]?.label || category;
  };

  // 获取分类颜色
  const getCategoryColor = (category: ContentCategory) => {
    return contentCategoryConfig[category]?.color || 'default';
  };

  // 筛选素材
  const filteredMaterials = materials.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = !searchText || 
      item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 统计各分类数量
  const getCategoryCount = (category: ContentCategory | 'all') => {
    if (category === 'all') return materials.length;
    return materials.filter(m => m.category === category).length;
  };

  // 复制内容
  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  // 删除素材
  const deleteMaterial = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个素材吗？',
      onOk: () => {
        const newMaterials = materials.filter(m => m.id !== id);
        setMaterials(newMaterials);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaterials));
        }
        message.success('删除成功');
      },
    });
  };

  // 查看详情
  const viewDetail = (item: MaterialItem) => {
    setSelectedItem(item);
    setDetailVisible(true);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // 渲染素材卡片
  const renderMaterialCard = (item: MaterialItem) => {
    const config = contentCategoryConfig[item.category];
    
    return (
      <Card
        key={item.id}
        size="small"
        hoverable
        style={{ marginBottom: 12 }}
        cover={
          item.imageUrl ? (
            <div style={{ height: 120, overflow: 'hidden', background: '#f5f5f5' }}>
              <Image
                src={item.imageUrl}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : item.videoUrl ? (
            <div style={{ height: 120, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VideoCameraOutlined style={{ fontSize: 40, color: '#fff' }} />
            </div>
          ) : null
        }
        actions={[
          <CopyOutlined key="copy" onClick={() => copyContent(item.content)} />,
          <DeleteOutlined key="delete" onClick={() => deleteMaterial(item.id)} />,
        ]}
        onClick={() => viewDetail(item)}
      >
        <Card.Meta
          title={
            <Space>
              <Tag color={getCategoryColor(item.category)}>{getCategoryLabel(item.category)}</Tag>
              <Text strong style={{ fontSize: 12 }} ellipsis={{ tooltip: item.title }}>
                {item.title}
              </Text>
            </Space>
          }
          description={
            <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }} ellipsis={{ rows: 2 }}>
              {item.content}
            </Paragraph>
          }
        />
        <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
          {new Date(item.createdAt).toLocaleString('zh-CN')}
        </Text>
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>素材库</Title>
        <Text type="secondary">
          统一管理内容工厂生成的所有素材，支持复制、删除等操作
        </Text>
      </div>

      {/* 搜索和统计 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索素材标题或内容"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col>
            <Space>
              <Text type="secondary">共 {materials.length} 个素材</Text>
              <Button icon={<ReloadOutlined />} onClick={loadMaterials}>
                刷新
              </Button>
            </Space>
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </Col>
        </Row>
      </Card>

<<<<<<< HEAD
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

      {/* 预览模态框 */}
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
=======
      {/* 分类标签 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="small">
          <Tag
            color={activeCategory === 'all' ? 'blue' : 'default'}
            onClick={() => setActiveCategory('all')}
            style={{ cursor: 'pointer', padding: '4px 12px' }}
          >
            全部 ({getCategoryCount('all')})
          </Tag>
          {categoryList.map(cat => (
            <Tag
              key={cat.key}
              color={activeCategory === cat.key ? 'blue' : 'default'}
              onClick={() => setActiveCategory(cat.key)}
              style={{ cursor: 'pointer', padding: '4px 12px' }}
              icon={cat.icon}
            >
              {cat.label} ({getCategoryCount(cat.key)})
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 素材列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : filteredMaterials.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredMaterials.map(item => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              {renderMaterialCard(item)}
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={
            searchText ? '没有找到匹配的素材' : '暂无素材，请先在内容工厂生成内容'
          }
          style={{ padding: 48 }}
        />
      )}

      {/* 详情弹窗 */}
      <Modal
        title={
          <Space>
            <Tag color={selectedItem ? getCategoryColor(selectedItem.category) : 'default'}>
              {selectedItem ? getCategoryLabel(selectedItem.category) : ''}
            </Tag>
            <Text strong>{selectedItem?.title}</Text>
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setDetailVisible(false)}>关闭</Button>
            {selectedItem && (
              <Button type="primary" onClick={() => copyContent(selectedItem.content)}>
                复制内容
              </Button>
            )}
          </Space>
        }
        width={600}
      >
        {selectedItem && (
          <div>
            {selectedItem.imageUrl && (
              <div style={{ marginBottom: 16 }}>
                <Image
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            )}
            {selectedItem.videoUrl && (
              <div style={{ marginBottom: 16, background: '#000', textAlign: 'center' }}>
                <video
                  src={selectedItem.videoUrl}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <Text strong>内容：</Text>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedItem.content}
              </div>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              创建时间：{new Date(selectedItem.createdAt).toLocaleString('zh-CN')}
            </Text>
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </div>
        )}
      </Modal>
    </div>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> 962968886be726cd434c792933b5515366d34518
}
