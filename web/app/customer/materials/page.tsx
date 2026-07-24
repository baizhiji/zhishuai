'use client';

import { useState, useEffect } from 'react';
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
} from 'antd';
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
  ShopOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  CustomerServiceOutlined,
  PlaySquareOutlined,
  SmileOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { ContentCategory, contentCategoryConfig } from '@/lib/content/types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface Material {
  id: string;
  category: ContentCategory;
  title: string;
  content: string;
  images?: string[];
  status: 'unused' | 'used';
  timestamp: number;
}

export default function MaterialLibraryPage() {
  const [searchText, setSearchText] = useState('');
  const [filterCategoryState, setFilterCategoryState] = useState<ContentCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // 从后端 API 加载素材
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '1000' });
      if (searchText) params.set('keyword', searchText);
      if (filterCategoryState !== 'all') params.set('type', filterCategoryState);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      
      const res = await fetch('/api/materials?' + params.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const list = (json.data.list || []).map((m: any) => ({
          id: m.id,
          category: m.type as ContentCategory,
          title: m.title,
          content: m.content || '',
          images: m.images || [],
          status: m.used ? 'used' : 'unused',
          timestamp: new Date(m.createdAt).getTime(),
        }));
        setMaterials(list);
      }
    } catch (error) {
      console.error('加载素材失败:', error);
    }
  };

  // 筛选素材
  const filteredMaterials = materials.filter(material => {
    // 分类筛选
    const categoryMatch =
      filterCategoryState === 'all' || material.category === filterCategoryState;

    // 状态筛选
    const statusMatch = filterStatus === 'all' || material.status === filterStatus;

    // 搜索筛选
    const searchMatch =
      !searchText ||
      material.title.toLowerCase().includes(searchText.toLowerCase()) ||
      material.content.toLowerCase().includes(searchText.toLowerCase());

    return categoryMatch && statusMatch && searchMatch;
  });

  // 删除素材
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const json = await res.json();
      if (json.success) {
        setMaterials(prev => prev.filter(m => m.id !== id));
        message.success('已删除');
      } else {
        message.error(json.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 复制内容
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  // 下载内容
  const handleDownload = (material: Material) => {
    // 如果有图片，下载所有图片
    if (material.images && material.images.length > 0) {
      material.images.forEach((imgUrl, idx) => {
        // 尝试直接下载图片
        fetch(imgUrl)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${material.title}_${idx + 1}.png`;
            a.click();
            URL.revokeObjectURL(url);
          })
          .catch(() => {
            // fetch 失败时降级为打开链接
            window.open(imgUrl, '_blank');
          });
      });
      message.success(`正在下载 ${material.images.length} 张图片`);
      return;
    }
    const categoryConfig = contentCategoryConfig[material.category];
    if (categoryConfig.type === 'image' || categoryConfig.type === 'video') {
      window.open(material.content, '_blank');
    } else {
      const blob = new Blob([material.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${material.title}_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    message.success('已下载');
  };

  // 预览素材
  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
    setPreviewVisible(true);
  };

  // 获取分类图标
  const getCategoryIcon = (category: ContentCategory) => {
    const iconMap: Record<ContentCategory, React.ReactNode> = {
      [ContentCategory.XIAOHONGSHU]: <HeartOutlined />,
      [ContentCategory.IMAGE_GENERATION]: <PictureOutlined />,
      [ContentCategory.ECOMMERCE_DETAIL]: <ShoppingOutlined />,
      [ContentCategory.SHORT_VIDEO]: <VideoCameraOutlined />,
      [ContentCategory.ENTERPRISE_VIDEO]: <ShopOutlined />,
      [ContentCategory.PRODUCT_VIDEO]: <ThunderboltOutlined />,
      [ContentCategory.STORE_TOUR_VIDEO]: <EnvironmentOutlined />,
      [ContentCategory.PERSON_MV_VIDEO]: <CustomerServiceOutlined />,
      [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined />,
      [ContentCategory.AI_SKETCH]: <PlaySquareOutlined />,
      [ContentCategory.AI_COMIC]: <SmileOutlined />,
      [ContentCategory.CONTENT_CREATIVITY]: <BulbOutlined />,
    };    
    return iconMap[category];
  };

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
      width: 250,
      render: (content: string, record: Material) => {
        const categoryConfig = contentCategoryConfig[record.category];
        // 优先展示 images 数组中的图片
        if (record.images && record.images.length > 0) {
          return (
            <Space size={4} wrap>
              <Image.PreviewGroup>
                {record.images.slice(0, 3).map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    alt={`${record.title}-${idx + 1}`}
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMzAiIHk9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIxMiI+5Zu+54mHPC90ZXh0Pjwvc3ZnPg=="
                  />
                ))}
              </Image.PreviewGroup>
              {record.images.length > 3 && (
                <Tag style={{ marginTop: 16 }}>+{record.images.length - 3}</Tag>
              )}
            </Space>
          );
        }
        if (categoryConfig.type === 'image' || categoryConfig.type === 'video') {
          return (
            <Image
              src={content}
              alt={record.title}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMzAiIHk9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIxMiI+5Zu+54mHPC90ZXh0Pjwvc3ZnPg=="
            />
          );
        }
        return <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>{content}</Paragraph>;
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
      width: 260,
      render: (_: any, record: Material) => (
        <Space size="small" wrap>
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
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
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
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2}>内容中心</Title>
        <Text type="secondary">管理和使用您的AI生成内容，支持预览、下载，与AI创作工厂无缝对接</Text>
      </div>

      {/* 筛选栏 */}
      <Card className="mb-4">
        <Row gutter={16}>
          <Col span={6}>
            <Search
              placeholder="搜索素材标题或内容"
              allowClear
              onChange={e => setSearchText(e.target.value)}
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
              {Object.values(ContentCategory).map(category => (
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
            showTotal: total => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 预览模态框 */}
      <Modal
        title={previewMaterial?.title}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => previewMaterial && handleCopy(previewMaterial.content)}
          >
            复制
          </Button>,
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => previewMaterial && handleDownload(previewMaterial)}
          >
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
              {previewMaterial.images && previewMaterial.images.length > 0 && (
                <Tag color="orange">{previewMaterial.images.length} 张图片</Tag>
              )}
            </Space>
            <div className="mt-4">
              {/* 图片展示 */}
              {previewMaterial.images && previewMaterial.images.length > 0 && (
                <div className="mb-4">
                  <Image.PreviewGroup>
                    <Row gutter={[8, 8]}>
                      {previewMaterial.images.map((img, idx) => (
                        <Col key={idx} span={8}>
                          <Image
                            src={img}
                            alt={`${previewMaterial.title}-${idx + 1}`}
                            style={{ width: '100%', borderRadius: 8 }}
                            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIxNCI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=="
                          />
                        </Col>
                      ))}
                    </Row>
                  </Image.PreviewGroup>
                </div>
              )}
              {/* 视频展示 */}
              {(!previewMaterial.images || previewMaterial.images.length === 0) && contentCategoryConfig[previewMaterial.category]?.type === 'video' && (
                <video
                  src={previewMaterial.content}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 400 }}
                />
              )}
              {/* 图片内容（无 images 数组时） */}
              {(!previewMaterial.images || previewMaterial.images.length === 0) && contentCategoryConfig[previewMaterial.category]?.type === 'image' && (
                <Image
                  src={previewMaterial.content}
                  alt={previewMaterial.title}
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIxNiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=="
                />
              )}
              {/* 文字内容 */}
              {previewMaterial.content && contentCategoryConfig[previewMaterial.category]?.type !== 'image' && contentCategoryConfig[previewMaterial.category]?.type !== 'video' && (
                <Paragraph className="whitespace-pre-wrap" style={{ maxHeight: 400, overflow: 'auto' }}>{previewMaterial.content}</Paragraph>
              )}
              {/* 文字辅助说明（图片场景下也展示文案） */}
              {previewMaterial.images && previewMaterial.images.length > 0 && previewMaterial.content && (
                <div className="mt-4">
                  <Text strong>文案内容：</Text>
                  <Paragraph className="whitespace-pre-wrap mt-2" style={{ maxHeight: 200, overflow: 'auto', background: '#fafafa', padding: 12, borderRadius: 8 }}>{previewMaterial.content}</Paragraph>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
