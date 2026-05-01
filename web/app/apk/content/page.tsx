'use client';

import React, { useState } from 'react';
import {
  Layout,
  Card,
  Button,
  Tag,
  Modal,
  Input,
  Select,
  message,
  Image,
  Tabs,
  List,
  Avatar,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import './styles.css';

const { Content } = Layout;
const { TextArea } = Input;

// 模拟内容详情数据
const mockContentDetail = {
  id: '1',
  type: 'article',
  title: 'AI赋能企业数字化转型白皮书',
  content: `随着人工智能技术的快速发展，越来越多的企业开始意识到AI在数字化转型中的重要性。

AI可以帮助企业实现：
1. 自动化生产流程，提高效率
2. 智能数据分析，辅助决策
3. 个性化用户体验，提升满意度
4. 预测性维护，降低成本

本白皮书将深入探讨AI在企业数字化转型中的应用场景和最佳实践...`,
  coverImage: 'https://picsum.photos/800/400?random=10',
  status: 'published',
  platforms: ['weixin', 'weibo', 'douyin'],
  publishTime: '2024-01-15 10:30',
  views: 12580,
  likes: 328,
  comments: 56,
  shares: 89,
  createdAt: '2024-01-14 15:20',
  updatedAt: '2024-01-15 10:30',
};

// 平台配置
const platformConfig = {
  weixin: { name: '微信', color: '#07c160' },
  weibo: { name: '微博', color: '#ff6b00' },
  douyin: { name: '抖音', color: '#010101' },
  xiaohongshu: { name: '小红书', color: '#ff2442' },
  bilibili: { name: 'B站', color: '#00a1d6' },
};

// 评论区数据
const mockComments = [
  {
    id: '1',
    user: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
    content: '文章写得很好，对我们公司很有参考价值！',
    time: '2小时前',
    likes: 12,
  },
  {
    id: '2',
    user: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
    content: 'AI确实是未来的趋势，期待更多这样的文章。',
    time: '3小时前',
    likes: 8,
  },
  {
    id: '3',
    user: '王五',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    content: '有没有相关的案例分享？',
    time: '5小时前',
    likes: 5,
  },
];

// 主组件
const ContentDetailPage: React.FC = () => {
  const [content, setContent] = useState(mockContentDetail);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');

  // 复制内容
  const handleCopy = () => {
    navigator.clipboard.writeText(content.content);
    message.success('内容已复制到剪贴板');
  };

  // 分享内容
  const handleShare = () => {
    setShareModalVisible(true);
  };

  // 删除内容
  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这篇内容吗？删除后不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.success('内容已删除');
        // 实际应该跳转到列表页
      },
    });
  };

  // 保存编辑
  const handleSaveEdit = () => {
    message.success('保存成功');
    setEditModalVisible(false);
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'detail',
      label: '内容详情',
    },
    {
      key: 'comments',
      label: (
        <span>
          评论
          <Tag className="count-tag">{content.comments}</Tag>
        </span>
      ),
    },
    {
      key: 'data',
      label: '数据统计',
    },
  ];

  return (
    <Layout className="apk-layout">
      <Content className="apk-content">
        {/* 头部操作栏 */}
        <div className="content-header">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => setEditModalVisible(true)}
            className="apk-btn-text"
          >
            编辑
          </Button>
          <div className="header-actions">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              className="apk-btn-text"
            >
              分享
            </Button>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              className="apk-btn-text danger"
            >
              删除
            </Button>
          </div>
        </div>

        {/* 内容信息 */}
        <div className="content-info">
          {/* 状态标签 */}
          <div className="content-status">
            <Tag
              color={content.status === 'published' ? 'success' : 'default'}
              icon={content.status === 'published' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            >
              {content.status === 'published' ? '已发布' : '草稿'}
            </Tag>
            {content.platforms.map((p) => (
              <Tag key={p} color={platformConfig[p as keyof typeof platformConfig]?.color}>
                {platformConfig[p as keyof typeof platformConfig]?.name || p}
              </Tag>
            ))}
          </div>

          {/* 标题 */}
          <h1 className="content-title">{content.title}</h1>

          {/* 元信息 */}
          <div className="content-meta">
            <span>发布时间：{content.publishTime}</span>
          </div>

          {/* 封面图 */}
          <div className="content-cover">
            <Image
              src={content.coverImage}
              alt={content.title}
              width="100%"
              height={200}
              style={{ objectFit: 'cover', borderRadius: 12 }}
            />
          </div>
        </div>

        {/* 标签页 */}
        <div className="content-tabs">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="apk-tabs"
          />
        </div>

        {/* 标签页内容 */}
        <div className="content-body">
          {activeTab === 'detail' && (
            <div className="detail-content">
              <pre className="content-text">{content.content}</pre>
              
              <div className="content-actions">
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  className="apk-btn-primary"
                >
                  复制内容
                </Button>
                <Button
                  icon={<SendOutlined />}
                  onClick={() => message.info('跳转到发布页面')}
                >
                  一键发布
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comments-content">
              <List
                className="comment-list"
                itemLayout="horizontal"
                dataSource={mockComments}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={item.avatar} />}
                      title={
                        <div className="comment-header">
                          <span className="comment-user">{item.user}</span>
                          <span className="comment-time">{item.time}</span>
                        </div>
                      }
                      description={item.content}
                    />
                    <div className="comment-likes">
                      <StarOutlined />
                      <span>{item.likes}</span>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="data-content">
              <div className="data-stats">
                <div className="stat-item">
                  <span className="stat-value">{content.views.toLocaleString()}</span>
                  <span className="stat-label">浏览</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{content.likes}</span>
                  <span className="stat-label">点赞</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{content.comments}</span>
                  <span className="stat-label">评论</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{content.shares}</span>
                  <span className="stat-label">分享</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 编辑弹窗 */}
        <Modal
          title="编辑内容"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          width={600}
          className="apk-modal"
          footer={[
            <Button key="cancel" onClick={() => setEditModalVisible(false)}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleSaveEdit}>
              保存
            </Button>,
          ]}
        >
          <div className="edit-form">
            <div className="form-item">
              <label>标题</label>
              <Input defaultValue={content.title} />
            </div>
            <div className="form-item">
              <label>内容</label>
              <TextArea
                rows={10}
                defaultValue={content.content}
              />
            </div>
            <div className="form-item">
              <label>发布平台</label>
              <Select
                mode="multiple"
                defaultValue={content.platforms}
                options={Object.entries(platformConfig).map(([key, val]) => ({
                  value: key,
                  label: val.name,
                }))}
              />
            </div>
          </div>
        </Modal>

        {/* 分享弹窗 */}
        <Modal
          title="分享内容"
          open={shareModalVisible}
          onCancel={() => setShareModalVisible(false)}
          footer={null}
          className="apk-modal"
        >
          <div className="share-platforms">
            {Object.entries(platformConfig).map(([key, val]) => (
              <div key={key} className="share-item">
                <Button
                  type="primary"
                  ghost
                  style={{ borderColor: val.color, color: val.color }}
                >
                  分享到{val.name}
                </Button>
              </div>
            ))}
          </div>
          <div className="share-link">
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 100px)' }}
                defaultValue="https://zhishuai.com/content/123"
                disabled
              />
              <Button
                type="primary"
                onClick={() => {
                  navigator.clipboard.writeText('https://zhishuai.com/content/123');
                  message.success('链接已复制');
                }}
              >
                复制
              </Button>
            </Input.Group>
          </div>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ContentDetailPage;
