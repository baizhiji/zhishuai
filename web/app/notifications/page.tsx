'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Badge,
  Tabs,
  Empty,
  Spin,
  Typography,
  Modal,
  Descriptions,
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  TeamOutlined,
  FileTextOutlined,
  MessageOutlined,
  DollarOutlined,
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'system':
      return <BellOutlined style={{ color: '#1890ff' }} />;
    case 'message':
      return <MailOutlined style={{ color: '#52c41a' }} />;
    case 'recruitment':
      return <TeamOutlined style={{ color: '#faad14' }} />;
    case 'content':
      return <FileTextOutlined style={{ color: '#722ed1' }} />;
    case 'chat':
      return <MessageOutlined style={{ color: '#13c2c2' }} />;
    case 'payment':
      return <DollarOutlined style={{ color: '#f5222d' }} />;
    default:
      return <BellOutlined style={{ color: '#666' }} />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'system':
      return 'blue';
    case 'message':
      return 'green';
    case 'recruitment':
      return 'orange';
    case 'content':
      return 'purple';
    case 'chat':
      return 'cyan';
    case 'payment':
      return 'red';
    default:
      return 'default';
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'system':
      return '系统通知';
    case 'message':
      return '消息';
    case 'recruitment':
      return '招聘';
    case 'content':
      return '内容';
    case 'chat':
      return 'AI 对话';
    case 'payment':
      return '支付';
    default:
      return '其他';
  }
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/notifications');
      const list = res?.data?.list || res?.data || [];
      setNotifications(list.map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        title: n.title || '',
        content: n.content || '',
        isRead: n.isRead ?? false,
        createdAt: n.createdAt || '',
        metadata: n.metadata,
      })));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
    setLoading(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications.filter(n => n.type === activeTab);

  const handleMarkAsRead = async (id: number) => {
    try {
      await request.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await request.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const showDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailModalVisible(true);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const tabItems = [
    { key: 'all', label: `全部 (${notifications.length})` },
    {
      key: 'unread',
      label: (
        <Badge count={unreadCount} offset={[10, 0]}>
          未读
        </Badge>
      ),
    },
    { key: 'system', label: '系统' },
    { key: 'recruitment', label: '招聘' },
    { key: 'content', label: '内容' },
    { key: 'chat', label: 'AI 对话' },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>通知中心</span>
            {unreadCount > 0 && <Tag color="red">{unreadCount} 未读</Tag>}
          </Space>
        }
        extra={
          <Button
            type="link"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            全部标为已读
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ padding: '0 16px' }}
        />

        <Spin spinning={loading}>
          <List
            dataSource={filteredNotifications}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />,
            }}
            renderItem={item => (
              <List.Item
                style={{
                  padding: '16px 24px',
                  background: item.isRead ? 'transparent' : '#e6f7ff',
                  cursor: 'pointer',
                }}
                onClick={() => showDetail(item)}
                actions={[
                  !item.isRead && (
                    <Button
                      key="read"
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={e => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                    >
                      标为已读
                    </Button>
                  ),
                  <Button
                    key="delete"
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      {getTypeIcon(item.type)}
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong={!item.isRead}>{item.title}</Text>
                      <Tag color={getTypeColor(item.type)}>{getTypeName(item.type)}</Tag>
                      {!item.isRead && <Badge status="processing" />}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary" style={{ maxWidth: 600 }} ellipsis>
                        {item.content}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.createdAt}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            {selectedNotification && getTypeIcon(selectedNotification.type)}
            <span>{selectedNotification?.title}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          <Button type="primary" onClick={() => setDetailModalVisible(false)}>
            我知道了
          </Button>
        }
        width={600}
      >
        {selectedNotification && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getTypeColor(selectedNotification.type)}>
                {getTypeName(selectedNotification.type)}
              </Tag>
              <Text type="secondary">{selectedNotification.createdAt}</Text>
            </Space>
            <div
              style={{
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 15, lineHeight: 1.8 }}>{selectedNotification.content}</Text>
            </div>
            {selectedNotification.metadata && (
              <Descriptions bordered column={1} size="small">
                {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                  <Descriptions.Item label={key}>{String(value)}</Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
