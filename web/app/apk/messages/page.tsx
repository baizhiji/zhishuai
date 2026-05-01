'use client';

import React, { useState } from 'react';
import {
  Layout,
  List,
  Tabs,
  Badge,
  Empty,
  Card,
  Tag,
  Button,
  Switch,
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  SettingOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import './styles.css';

const { Content } = Layout;
const { TabPane } = Tabs;

// 消息类型
interface Message {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: string;
  important?: boolean;
}

// 模拟消息数据
const mockMessages: Record<string, Message[]> = {
  system: [
    {
      id: '1',
      title: '系统更新通知',
      content: '智枢AI SaaS系统已完成v2.0版本更新，新增AI数字人功能，支持多平台一键发布。',
      time: '2024-01-15 10:30',
      read: false,
      type: 'system',
      important: true,
    },
    {
      id: '2',
      title: '账号安全提醒',
      content: '您的账号在新设备登录，请确认是否为本人操作。如非本人，请立即修改密码。',
      time: '2024-01-14 15:20',
      read: false,
      type: 'system',
      important: true,
    },
    {
      id: '3',
      title: '功能开通成功',
      content: '恭喜！您申请的自媒体矩阵功能已开通，现在可以使用AI内容工厂。',
      time: '2024-01-13 09:00',
      read: true,
      type: 'system',
      important: false,
    },
  ],
  order: [
    {
      id: '4',
      title: '订单支付成功',
      content: '您的订单 #202401150001 已支付成功，金额 ¥299.00，套餐：高级版（年付）。',
      time: '2024-01-12 14:00',
      read: false,
      type: 'order',
    },
    {
      id: '5',
      title: '订单到期提醒',
      content: '您的套餐将于 7 天后到期，为避免服务中断，请及时续费。',
      time: '2024-01-11 11:00',
      read: true,
      type: 'order',
    },
  ],
  activity: [
    {
      id: '6',
      title: '新年特惠活动',
      content: '新年限时优惠：全场功能8折起，充值返利最高20%，立即参与！',
      time: '2024-01-10 16:00',
      read: false,
      type: 'activity',
    },
    {
      id: '7',
      title: '新功能上线通知',
      content: 'AI数字人视频功能已上线，支持一键生成数字人播报视频，快来体验吧！',
      time: '2024-01-09 10:00',
      read: true,
      type: 'activity',
    },
  ],
};

// 消息类型配置
const messageTypeConfig = {
  system: {
    icon: <SettingOutlined />,
    color: '#1890ff',
    label: '系统',
  },
  order: {
    icon: <FileTextOutlined />,
    color: '#52c41a',
    label: '订单',
  },
  activity: {
    icon: <CustomerServiceOutlined />,
    color: '#faad14',
    label: '活动',
  },
};

// 消息列表项组件
const MessageItem: React.FC<{
  message: typeof mockMessages.system[0];
  onDelete: (id: string) => void;
}> = ({ message, onDelete }) => {
  const config = messageTypeConfig[message.type as keyof typeof messageTypeConfig];

  return (
    <div className={`message-item ${!message.read ? 'unread' : ''}`}>
      <div className="message-icon" style={{ background: config?.color || '#999' }}>
        {config?.icon || <BellOutlined />}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-title">{message.title}</span>
          {message.important && (
            <Tag color="red" className="important-tag">重要</Tag>
          )}
        </div>
        <p className="message-text">{message.content}</p>
        <div className="message-footer">
          <span className="message-time">{message.time}</span>
          {!message.read && <span className="unread-dot"></span>}
        </div>
      </div>
      <div className="message-actions">
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(message.id)}
          className="delete-btn"
        />
      </div>
    </div>
  );
};

// 主组件
const MessagesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState(mockMessages);

  // 计算未读数
  const getUnreadCount = () => {
    const all = [...messages.system, ...messages.order, ...messages.activity];
    return all.filter((m) => !m.read).length;
  };

  const unreadCount = getUnreadCount();

  // 删除消息
  const handleDelete = (id: string) => {
    setMessages((prev) => {
      const newMessages = { ...prev };
      (Object.keys(newMessages) as Array<keyof typeof newMessages>).forEach((key) => {
        newMessages[key] = newMessages[key].filter(
          (m) => m.id !== id
        );
      });
      return newMessages;
    });
  };

  // 全部标为已读
  const markAllRead = () => {
    setMessages((prev) => {
      const newMessages = { ...prev };
      (Object.keys(newMessages) as Array<keyof typeof newMessages>).forEach((key) => {
        newMessages[key] = newMessages[key].map(
          (m) => ({ ...m, read: true })
        );
      });
      return newMessages;
    });
  };

  // 获取当前显示的消息
  const getCurrentMessages = () => {
    if (activeTab === 'all') {
      return [...messages.system, ...messages.order, ...messages.activity].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    }
    return messages[activeTab as keyof typeof messages] || [];
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'all',
      label: (
        <span>
          全部
          {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
        </span>
      ),
    },
    {
      key: 'system',
      label: (
        <span>
          系统
          <Badge count={messages.system.filter((m) => !m.read).length} size="small" />
        </span>
      ),
    },
    {
      key: 'order',
      label: (
        <span>
          订单
          <Badge count={messages.order.filter((m) => !m.read).length} size="small" />
        </span>
      ),
    },
    {
      key: 'activity',
      label: (
        <span>
          活动
          <Badge count={messages.activity.filter((m) => !m.read).length} size="small" />
        </span>
      ),
    },
  ];

  return (
    <Layout className="apk-layout">
      <Content className="apk-content">
        {/* 头部 */}
        <div className="apk-header">
          <div className="apk-header-title">
            <h2>消息通知</h2>
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </div>
          <Button
            type="text"
            icon={<CheckCircleOutlined />}
            onClick={markAllRead}
            className="apk-btn-text"
            disabled={unreadCount === 0}
          >
            全部已读
          </Button>
        </div>

        {/* 消息分类 */}
        <div className="message-tabs">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            type="card"
            size="small"
            className="apk-tabs"
          />
        </div>

        {/* 消息列表 */}
        <div className="message-list">
          {getCurrentMessages().length > 0 ? (
            <div className="message-items">
              {getCurrentMessages().map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <Empty
              description="暂无消息"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="apk-empty"
            >
              <Button type="primary" onClick={markAllRead}>
                检查新消息
              </Button>
            </Empty>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default MessagesPage;
