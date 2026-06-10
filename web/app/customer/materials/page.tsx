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
          </Col>
        </Row>
      </Card>

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
          </div>
        )}
      </Modal>
    </div>
  );
}
