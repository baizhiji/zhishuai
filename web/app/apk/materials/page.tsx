'use client';

import React, { useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Input,
  Tabs,
  Badge,
  Empty,
  Modal,
  Button,
  message,
  Image,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  FileTextOutlined,
  CloseOutlined,
  UploadOutlined,
  StarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  FilterOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import './styles.css';

const { Content } = Layout;
const { Meta } = Card;
const { TabPane } = Tabs;

// 模拟素材数据
const mockMaterials = [
  {
    id: '1',
    type: 'image',
    title: '产品展示图',
    url: 'https://picsum.photos/400/300?random=1',
    size: '2.5MB',
    createTime: '2024-01-15 10:30',
    category: '产品图',
  },
  {
    id: '2',
    type: 'video',
    title: '品牌宣传片',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    cover: 'https://picsum.photos/400/300?random=2',
    duration: '02:30',
    size: '45MB',
    createTime: '2024-01-14 15:20',
    category: '宣传视频',
  },
  {
    id: '3',
    type: 'image',
    title: '活动海报',
    url: 'https://picsum.photos/400/300?random=3',
    size: '1.8MB',
    createTime: '2024-01-13 09:00',
    category: '营销素材',
  },
  {
    id: '4',
    type: 'audio',
    title: '背景音乐',
    url: '#',
    duration: '03:45',
    size: '5.2MB',
    createTime: '2024-01-12 14:00',
    category: '音频素材',
  },
  {
    id: '5',
    type: 'document',
    title: '产品文案',
    url: '#',
    size: '0.3MB',
    createTime: '2024-01-11 11:00',
    category: '文案素材',
  },
  {
    id: '6',
    type: 'image',
    title: '团队合影',
    url: 'https://picsum.photos/400/300?random=4',
    size: '3.1MB',
    createTime: '2024-01-10 16:00',
    category: '团队素材',
  },
];

// 素材分类
const categories = [
  { key: 'all', label: '全部', count: 28 },
  { key: 'image', label: '图片', count: 15 },
  { key: 'video', label: '视频', count: 5 },
  { key: 'audio', label: '音频', count: 3 },
  { key: 'document', label: '文档', count: 5 },
];

// 上传弹窗组件
const UploadModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal
    title="上传素材"
    open={visible}
    onCancel={onClose}
    footer={null}
    width={400}
    className="apk-modal"
  >
    <div className="upload-area">
      <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
      <p>点击或拖拽上传文件</p>
      <p className="upload-hint">支持 jpg、png、mp4、mp3、pdf 格式</p>
      <Button type="primary" icon={<UploadOutlined />}>
        选择文件
      </Button>
    </div>
    <div className="upload-tips">
      <h4>上传说明：</h4>
      <ul>
        <li>单文件大小不超过 100MB</li>
        <li>图片支持 jpg、png、gif 格式</li>
        <li>视频支持 mp4、mov 格式</li>
        <li>音频支持 mp3、wav 格式</li>
      </ul>
    </div>
  </Modal>
);

// 素材卡片组件
const MaterialCard: React.FC<{
  material: typeof mockMaterials[0];
  onPreview: (m: typeof mockMaterials[0]) => void;
  onDelete: (id: string) => void;
}> = ({ material, onPreview, onDelete }) => {
  const getIcon = () => {
    switch (material.type) {
      case 'video':
        return <VideoCameraOutlined />;
      case 'audio':
        return <AudioOutlined />;
      case 'document':
        return <FileTextOutlined />;
      default:
        return <PictureOutlined />;
    }
  };

  return (
    <Card
      hoverable
      className="material-card"
      cover={
        <div className="material-cover">
          {material.type === 'image' ? (
            <img src={material.url} alt={material.title} />
          ) : material.type === 'video' ? (
            <div className="video-cover">
              <img src={material.cover || 'https://picsum.photos/400/300'} alt="" />
              <div className="play-icon">
                <VideoCameraOutlined />
              </div>
            </div>
          ) : (
            <div className="file-cover">
              {getIcon()}
            </div>
          )}
          <div className="material-overlay">
            <Button
              size="small"
              type="text"
              icon={<ShareAltOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                message.success('分享链接已复制');
              }}
            />
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                message.success('开始下载');
              }}
            />
            <Button
              size="small"
              type="text"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(material.id);
              }}
            />
          </div>
        </div>
      }
      onClick={() => onPreview(material)}
    >
      <Meta
        title={material.title}
        description={
          <div className="material-info">
            <span>{material.category}</span>
            <span>{material.size}</span>
          </div>
        }
      />
      <div className="material-time">{material.createTime}</div>
    </Card>
  );
};

// 主组件
const MaterialLibraryPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<typeof mockMaterials[0] | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 筛选素材
  const filteredMaterials = mockMaterials.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = selectedCategory === 'all' || m.type === selectedCategory;
    return matchSearch && matchCategory;
  });

  // 删除素材
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个素材吗？删除后不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.success('素材已删除');
      },
    });
  };

  // 批量选择
  const toggleSelect = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Layout className="apk-layout">
      <Content className="apk-content">
        {/* 头部 */}
        <div className="apk-header">
          <div className="apk-header-title">
            <h2>素材库</h2>
            <Badge count={28} style={{ backgroundColor: '#1890ff' }} />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setUploadModalVisible(true)}
            className="apk-btn-primary"
          >
            上传素材
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="apk-search-bar">
          <Input
            placeholder="搜索素材名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="apk-search-input"
            allowClear
          />
        </div>

        {/* 分类标签 */}
        <div className="category-tabs">
          <Tabs
            activeKey={selectedCategory}
            onChange={setSelectedCategory}
            type="card"
            size="small"
            className="apk-tabs"
          >
            {categories.map((cat) => (
              <TabPane
                tab={
                  <span>
                    {cat.label}
                    <Badge count={cat.count} size="small" style={{ marginLeft: 4 }} />
                  </span>
                }
                key={cat.key}
              />
            ))}
          </Tabs>
        </div>

        {/* 工具栏 */}
        <div className="material-toolbar">
          <div className="toolbar-left">
            <span className="material-count">共 {filteredMaterials.length} 个素材</span>
          </div>
          <div className="toolbar-right">
            <Button
              type="text"
              icon={<FilterOutlined />}
              className="apk-btn-text"
            >
              筛选
            </Button>
            <Button
              type="text"
              icon={<SortAscendingOutlined />}
              className="apk-btn-text"
            >
              排序
            </Button>
          </div>
        </div>

        {/* 素材列表 */}
        <div className="material-list">
          {filteredMaterials.length > 0 ? (
            <Row gutter={[12, 12]}>
              {filteredMaterials.map((material) => (
                <Col xs={12} sm={8} md={6} lg={4} key={material.id}>
                  <MaterialCard
                    material={material}
                    onPreview={setPreviewMaterial}
                    onDelete={handleDelete}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              description="暂无素材"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="apk-empty"
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上传第一个素材
              </Button>
            </Empty>
          )}
        </div>

        {/* 上传弹窗 */}
        <UploadModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
        />

        {/* 预览弹窗 */}
        <Modal
          open={!!previewMaterial}
          onCancel={() => setPreviewMaterial(null)}
          footer={null}
          width={700}
          className="apk-modal preview-modal"
          centered
        >
          {previewMaterial && (
            <div className="preview-content">
              {previewMaterial.type === 'image' ? (
                <Image src={previewMaterial.url} alt={previewMaterial.title} width="100%" />
              ) : previewMaterial.type === 'video' ? (
                <video
                  src={previewMaterial.url}
                  controls
                  style={{ width: '100%' }}
                  poster={previewMaterial.cover}
                />
              ) : (
                <div className="file-preview">
                  {previewMaterial.type === 'video' && <VideoCameraOutlined />}
                  {previewMaterial.type === 'audio' && <AudioOutlined />}
                  {previewMaterial.type === 'document' && <FileTextOutlined />}
                </div>
              )}
              <div className="preview-info">
                <h3>{previewMaterial.title}</h3>
                <div className="preview-meta">
                  <span>类型：{previewMaterial.type}</span>
                  <span>大小：{previewMaterial.size}</span>
                  <span>分类：{previewMaterial.category}</span>
                  <span>上传时间：{previewMaterial.createTime}</span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default MaterialLibraryPage;
