'use client';

import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Input, Select, Button, Space, Table, Tag, Modal, message, Image, Popconfirm, Segmented,
} from 'antd';
import {
  SearchOutlined, DeleteOutlined, DownloadOutlined, CopyOutlined, EyeOutlined,
  AppstoreOutlined, UnorderedListOutlined, HeartOutlined, PictureOutlined,
  ShoppingOutlined, VideoCameraOutlined, RobotOutlined, SmileOutlined, BulbOutlined,
  StarOutlined, ThunderboltOutlined, EnvironmentOutlined, CustomerServiceOutlined,
  PlaySquareOutlined, ShopOutlined,
} from '@ant-design/icons';
import { ContentCategory, contentCategoryConfig } from '@/lib/content/types';
import request from '@/utils/request';
import PageContainer from '@/components/customer/PageContainer';

const { Text, Paragraph } = Typography;

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
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: '1', pageSize: '1000' };
      if (searchText) params.keyword = searchText;
      if (filterCategoryState !== 'all') params.type = filterCategoryState;
      if (filterStatus !== 'all') params.status = filterStatus;
      const res: { list?: Array<Record<string, unknown>> } = await request.get('/api/materials', { params });
      const list = (res.list || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        category: m.type as ContentCategory,
        title: m.title as string,
        content: (m.content as string) || '',
        images: (m.images as string[]) || [],
        status: (m.used ? 'used' : 'unused') as 'used' | 'unused',
        timestamp: new Date(m.createdAt as string).getTime(),
      }));
      setMaterials(list);
    } catch {
      message.error('加载素材失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const categoryMatch = filterCategoryState === 'all' || material.category === filterCategoryState;
    const statusMatch = filterStatus === 'all' || material.status === filterStatus;
    const searchMatch =
      !searchText ||
      material.title.toLowerCase().includes(searchText.toLowerCase()) ||
      material.content.toLowerCase().includes(searchText.toLowerCase());
    return categoryMatch && statusMatch && searchMatch;
  });

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/api/materials/${id}`);
      setMaterials(prev => prev.filter(m => m.id !== id));
      message.success('已删除');
    } catch {
      message.error('删除失败');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  const handleDownload = (material: Material) => {
    if (material.images && material.images.length > 0) {
      material.images.forEach((imgUrl, idx) => {
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

  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
    setPreviewVisible(true);
  };

  const getCategoryIcon = (category: ContentCategory): React.ReactNode => {
    const iconMap: Record<ContentCategory, React.ReactNode> = {
      [ContentCategory.XIAOHONGSHU]: <HeartOutlined />,
      [ContentCategory.IMAGE_GENERATION]: <PictureOutlined />,
      [ContentCategory.ECOMMERCE_DETAIL]: <ShoppingOutlined />,
      [ContentCategory.SHORT_VIDEO]: <VideoCameraOutlined />,
      [ContentCategory.ENTERPRISE_VIDEO]: <ShopOutlined />,
      [ContentCategory.PRODUCT_VIDEO]: <ThunderboltOutlined />,
      [ContentCategory.STORE_TOUR_VIDEO]: <EnvironmentOutlined />,
      [ContentCategory.PERSON_MV_VIDEO]: <CustomerServiceOutlined />,
      [ContentCategory.CARTOON_VIDEO]: <StarOutlined />,
      [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined />,
      [ContentCategory.AI_SKETCH]: <PlaySquareOutlined />,
      [ContentCategory.AI_COMIC]: <SmileOutlined />,
      [ContentCategory.SMART_EDIT]: <VideoCameraOutlined />,
      [ContentCategory.CONTENT_CREATIVITY]: <BulbOutlined />,
    };
    return iconMap[category] || <FileOutlined />;
  };

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
          <span style={{ fontWeight: 500 }}>{text}</span>
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
        if (record.images && record.images.length > 0) {
          return (
            <Space size={4} wrap>
              <Image.PreviewGroup>
                {record.images.slice(0, 3).map((img, idx) => (
                  <Image key={idx} src={img} alt={`${record.title}-${idx + 1}`} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} />
                ))}
              </Image.PreviewGroup>
              {record.images.length > 3 && <Tag style={{ marginTop: 16 }}>+{record.images.length - 3}</Tag>}
            </Space>
          );
        }
        if (categoryConfig?.type === 'image' || categoryConfig?.type === 'video') {
          return <Image src={content} alt={record.title} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} />;
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
      fixed: 'right' as const,
      render: (_: unknown, record: Material) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.content)}>复制</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderGridCard = (material: Material) => (
    <div
      key={material.id}
      style={{
        background: '#fff', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        transition: 'box-shadow 0.2s',
        cursor: 'pointer',
      }}
    >
      {/* 缩略图区域 */}
      <div
        style={{
          height: 160, background: '#fafafa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {material.images && material.images.length > 0 ? (
          <Image src={material.images[0]} alt={material.title} width="100%" height="100%" style={{ objectFit: 'cover' }} preview={false} />
        ) : (
          <div style={{ fontSize: 40, opacity: 0.3 }}>
            {getCategoryIcon(material.category)}
          </div>
        )}
        <Tag
          color={contentCategoryConfig[material.category]?.color}
          style={{ position: 'absolute', top: 8, left: 8 }}
        >
          {contentCategoryConfig[material.category]?.label}
        </Tag>
        <Tag
          color={material.status === 'used' ? 'green' : 'blue'}
          style={{ position: 'absolute', top: 8, right: 8 }}
        >
          {material.status === 'used' ? '已使用' : '未使用'}
        </Tag>
      </div>
      {/* 信息区域 */}
      <div style={{ padding: 12 }}>
        <Paragraph ellipsis={{ rows: 1 }} style={{ marginBottom: 4, fontWeight: 500, fontSize: 14 }}>
          {material.title}
        </Paragraph>
        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
          {material.content}
        </Paragraph>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {new Date(material.timestamp).toLocaleDateString('zh-CN')}
          </Text>
          <Space size={0}>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(material)} />
            <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(material.content)} />
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(material.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer
      title="内容中心"
      description="管理和使用您的AI生成内容，支持预览、下载，与AI创作工厂无缝对接"
      breadcrumb={[{ title: '内容中心' }]}
      loading={loading}
      skeletonType="card"
      extra={
        <Space>
          <Segmented
            options={[
              { label: '列表', value: 'list', icon: <UnorderedListOutlined /> },
              { label: '网格', value: 'grid', icon: <AppstoreOutlined /> },
            ]}
            value={viewMode}
            onChange={v => setViewMode(v as 'list' | 'grid')}
          />
        </Space>
      }
    >
      {/* 筛选栏 */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '16px 24px',
        marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索素材标题或内容"
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={6}>
            <Select placeholder="选择分类" value={filterCategoryState} onChange={setFilterCategoryState} style={{ width: '100%' }} allowClear>
              <Select.Option value="all">全部分类</Select.Option>
              {Object.values(ContentCategory).map(category => (
                <Select.Option key={category} value={category}>
                  {contentCategoryConfig[category]?.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select placeholder="选择状态" value={filterStatus} onChange={setFilterStatus} style={{ width: '100%' }} allowClear>
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="unused">未使用</Select.Option>
              <Select.Option value="used">已使用</Select.Option>
            </Select>
          </Col>
        </Row>
      </div>

      {/* 内容区域 */}
      {filteredMaterials.length > 0 ? (
        viewMode === 'list' ? (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Table
              columns={columns}
              dataSource={filteredMaterials}
              rowKey="id"
              scroll={{ x: 1100 }}
              pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredMaterials.map(renderGridCard)}
          </div>
        )
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Text type="secondary">暂无素材数据，前往AI创作工厂开始创作吧</Text>
        </div>
      )}

      <Modal
        title={previewMaterial?.title}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => previewMaterial && handleCopy(previewMaterial.content)}>复制</Button>,
          <Button key="download" icon={<DownloadOutlined />} onClick={() => previewMaterial && handleDownload(previewMaterial)}>下载</Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>关闭</Button>,
        ]}
        width={800}
      >
        {previewMaterial && (
          <div>
            <Space style={{ marginBottom: 16 }}>
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
            <div style={{ marginTop: 16 }}>
              {previewMaterial.images && previewMaterial.images.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Image.PreviewGroup>
                    <Row gutter={[8, 8]}>
                      {previewMaterial.images.map((img, idx) => (
                        <Col key={idx} span={8}>
                          <Image src={img} alt={`${previewMaterial.title}-${idx + 1}`} style={{ width: '100%', borderRadius: 8 }} />
                        </Col>
                      ))}
                    </Row>
                  </Image.PreviewGroup>
                </div>
              )}
              {(!previewMaterial.images || previewMaterial.images.length === 0) && contentCategoryConfig[previewMaterial.category]?.type === 'video' && (
                <video src={previewMaterial.content} controls style={{ maxWidth: '100%', maxHeight: 400 }} />
              )}
              {(!previewMaterial.images || previewMaterial.images.length === 0) && contentCategoryConfig[previewMaterial.category]?.type === 'image' && (
                <Image src={previewMaterial.content} alt={previewMaterial.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
              )}
              {previewMaterial.content && contentCategoryConfig[previewMaterial.category]?.type !== 'image' && contentCategoryConfig[previewMaterial.category]?.type !== 'video' && (
                <Paragraph style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>{previewMaterial.content}</Paragraph>
              )}
              {previewMaterial.images && previewMaterial.images.length > 0 && previewMaterial.content && (
                <div style={{ marginTop: 16, background: '#fafafa', borderRadius: 8, padding: 12 }}>
                  <Text strong>文案内容：</Text>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{previewMaterial.content}</Paragraph>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

// Need FileOutlined for fallback icon - import it inline
function FileOutlined() {
  return (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor">
      <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494z" />
    </svg>
  );
}
