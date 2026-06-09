'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  message,
  Image,
  Popconfirm,
  Empty,
  Badge,
} from 'antd';
import {
  HeartOutlined,
  VideoCameraOutlined,
  RobotOutlined,
  EyeOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { ContentCategory, contentCategoryConfig } from '@/lib/content/types';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;

// 内容类型配置
const contentTypes = [
  {
    key: ContentCategory.XIAOHONGSHU,
    label: '小红书图文',
    icon: <HeartOutlined />,
    color: '#FF2442',
    description: '小红书图文内容',
  },
  {
    key: ContentCategory.VIDEO,
    label: '短视频',
    icon: <VideoCameraOutlined />,
    color: '#1890FF',
    description: 'AI生成的短视频脚本',
  },
  {
    key: ContentCategory.DIGITAL_HUMAN,
    label: '数字人短视频',
    icon: <RobotOutlined />,
    color: '#722ED1',
    description: '数字人短视频内容',
  },
];

interface Material {
  id: string;
  category: ContentCategory;
  title: string;
  content: string;
  tags?: string[];
  status: 'unused' | 'used';
  timestamp: number;
  metadata?: any;
}

export default function MaterialLibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ContentCategory>(ContentCategory.XIAOHONGSHU);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // 从本地存储加载素材
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_materials');
      if (saved) {
        try {
          const allMaterials = JSON.parse(saved);
          // 只保留我们需要的类型
          const filtered = allMaterials.filter((m: Material) =>
            [ContentCategory.XIAOHONGSHU, ContentCategory.VIDEO, ContentCategory.DIGITAL_HUMAN].includes(m.category)
          );
          setMaterials(filtered);
        } catch (error) {
          console.error('加载素材失败:', error);
        }
      }
    }
  };

  // 获取当前tab的素材数量
  const getCount = (category: ContentCategory) => {
    return materials.filter(m => m.category === category).length;
  };

  // 获取当前tab的素材
  const getCurrentMaterials = () => {
    return materials.filter(m => m.category === activeTab);
  };

  // 删除素材
  const handleDelete = (id: string) => {
    const newMaterials = materials.filter(m => m.id !== id);
    setMaterials(newMaterials);
    if (typeof window !== 'undefined') {
      // 保存所有素材
      const saved = localStorage.getItem('ai_materials');
      if (saved) {
        try {
          const allMaterials = JSON.parse(saved);
          const updated = allMaterials.filter((m: Material) => m.id !== id);
          localStorage.setItem('ai_materials', JSON.stringify(updated));
        } catch (error) {
          console.error('保存素材失败:', error);
        }
      }
    }
    message.success('已删除');
  };

  // 复制内容
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  // 下载内容
  const handleDownload = (material: Material) => {
    const content = material.tags
      ? `${material.title}\n\n标签: ${material.tags.join(', ')}\n\n内容:\n${material.content}`
      : `${material.title}\n\n内容:\n${material.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${material.title}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已下载');
  };

  // 预览素材
  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
    setPreviewVisible(true);
  };

  // 标记为已使用
  const handleMarkAsUsed = (id: string) => {
    const newMaterials = materials.map(m =>
      m.id === id ? { ...m, status: 'used' as const } : m
    );
    setMaterials(newMaterials);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_materials');
      if (saved) {
        try {
          const allMaterials = JSON.parse(saved);
          const updated = allMaterials.map((m: Material) =>
            m.id === id ? { ...m, status: 'used' as const } : m
          );
          localStorage.setItem('ai_materials', JSON.stringify(updated));
        } catch (error) {
          console.error('保存素材失败:', error);
        }
      }
    }
    message.success('已标记为已使用');
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
            {contentTypes.find(t => t.key === record.category)?.icon}
          </span>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '标签/话题',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) =>
        tags && tags.length > 0 ? (
          <Space size={[0, 4]} wrap>
            {tags.slice(0, 3).map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
            {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
          </Space>
        ) : '-',
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string, record: Material) => {
        const categoryConfig = contentCategoryConfig[record.category];
        if (categoryConfig.type === 'image' || categoryConfig.type === 'video') {
          return (
            <Image
              src={content}
              alt={record.title}
              style={{ width: 60, height: 60, objectFit: 'cover' }}
            />
          );
        }
        return <Paragraph ellipsis={{ rows: 1 }}>{content}</Paragraph>;
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
          {record.status !== 'used' && (
            <Button type="link" size="small" onClick={() => handleMarkAsUsed(record.id)}>
              标记已用
            </Button>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
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
        <Title level={2}>素材库</Title>
        <Text type="secondary">管理和使用您的AI生成内容</Text>
      </div>

      {/* 内容类型卡片 */}
      <Row gutter={16} className="mb-4">
        {contentTypes.map(type => (
          <Col span={8} key={type.key}>
            <Card
              hoverable
              onClick={() => setActiveTab(type.key)}
              style={{
                borderColor: activeTab === type.key ? type.color : undefined,
                background: activeTab === type.key ? `${type.color}10` : undefined,
              }}
              className="text-center"
            >
              <div style={{ fontSize: 32, color: type.color, marginBottom: 8 }}>
                {type.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{type.label}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                {type.description}
              </div>
              <Badge
                count={getCount(type.key)}
                style={{ marginTop: 8 }}
                showZero
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 内容类型按钮（备用） */}
      <Card className="mb-4">
        <Space size="large">
          {contentTypes.map(type => (
            <Button
              key={type.key}
              type={activeTab === type.key ? 'primary' : 'default'}
              icon={type.icon}
              onClick={() => setActiveTab(type.key)}
              style={{
                background: activeTab === type.key ? type.color : undefined,
                borderColor: activeTab === type.key ? type.color : undefined,
              }}
            >
              {type.label}
              <Badge count={getCount(type.key)} style={{ marginLeft: 8 }} showZero />
            </Button>
          ))}
          <Button icon={<SyncOutlined />} onClick={loadMaterials}>
            刷新
          </Button>
          <Button type="link" icon={<PlusOutlined />} onClick={() => router.push('/customer/media/factory')}>
            去内容工厂生成
          </Button>
        </Space>
      </Card>

      {/* 素材表格 */}
      <Card>
        {getCurrentMaterials().length > 0 ? (
          <Table
            columns={columns}
            dataSource={getCurrentMaterials()}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                暂无{contentTypes.find(t => t.key === activeTab)?.label}内容
              </span>
            }
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/customer/media/factory')}>
              去内容工厂生成
            </Button>
          </Empty>
        )}
      </Card>

      {/* 预览模态框 */}
      <Modal
        title={previewMaterial?.title}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => previewMaterial && handleCopy(previewMaterial.content)}>
            复制内容
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
            
            {/* 标签 */}
            {previewMaterial.tags && previewMaterial.tags.length > 0 && (
              <div className="mb-4">
                <Text strong>标签/话题：</Text>
                <Space size={[4, 4]} wrap className="mt-2">
                  {previewMaterial.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
            
            {/* 内容 */}
            <div className="mt-4">
              <Text strong>内容：</Text>
              <div className="mt-2">
                {contentCategoryConfig[previewMaterial.category]?.type === 'image' ? (
                  <Image
                    src={previewMaterial.content}
                    alt={previewMaterial.title}
                    style={{ maxWidth: '100%' }}
                  />
                ) : contentCategoryConfig[previewMaterial.category]?.type === 'video' ? (
                  <video
                    src={previewMaterial.content}
                    controls
                    style={{ maxWidth: '100%', maxHeight: 400 }}
                  />
                ) : (
                  <Paragraph className="whitespace-pre-wrap" style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                    {previewMaterial.content}
                  </Paragraph>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
