'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Popover, Spin, App, Badge, Tabs, List, Tag, Button } from 'antd';
import {
  BellOutlined, ClockCircleOutlined, SyncOutlined,
  WarningOutlined, RightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AgentNavbar from './layout/Navbar';
import AnnouncementBar from '@/components/AnnouncementBar';

const { Header, Content } = Layout;

interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  important?: boolean;
}

interface PendingTicket {
  id: string;
  ticketNo: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  userName?: string;
}

const AgentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { message } = App.useApp();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('tickets');

  // 待处理工单通知
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketStats, setTicketStats] = useState({ pending: 0, processing: 0 });

  // 角色检查
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (
      !loading &&
      user &&
      user.role !== 'agent' &&
      user.role !== 'admin'
    ) {
      message.error('您没有权限访问代理商后台');
      router.replace('/');
    }
  }, [loading, user, router, message]);

  // 获取系统公告
  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: Announcement[] }>(
        '/announcements?audience=agent&limit=5'
      )) as unknown as { success: boolean; data: Announcement[] };
      if (res.success && Array.isArray(res.data)) {
        setAnnouncements(res.data);
      } else {
        setAnnouncements([]);
      }
    } catch {
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  // 获取待处理工单数（轮询 + 弹窗打开时刷新）
  const fetchPendingTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{
        success: boolean;
        data?: { list: PendingTicket[]; total: number };
      }>(
        '/tickets?status=pending,processing&pageSize=10&agentId=' + user?.id
      )) as unknown as { success: boolean; data?: { list: PendingTicket[]; total: number } };
      if (res.success && res.data) {
        setPendingTickets(res.data.list || []);
        const pending = (res.data.list || []).filter(t => t.status === 'pending').length;
        const processing = (res.data.list || []).filter(t => t.status === 'processing').length;
        setTicketStats({ pending, processing });
      } else {
        setPendingTickets([]);
        setTicketStats({ pending: 0, processing: 0 });
      }
    } catch {
      setPendingTickets([]);
      setTicketStats({ pending: 0, processing: 0 });
    } finally {
      setTicketsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // 弹窗打开时刷新工单数据
  useEffect(() => {
    if (popoverOpen && user) {
      fetchPendingTickets();
    }
  }, [popoverOpen, user, fetchPendingTickets]);

  // 每 60 秒轮询一次工单数（显示在 Badge 上）
  useEffect(() => {
    if (!user) return;
    fetchPendingTickets();
    const interval = setInterval(fetchPendingTickets, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading || !user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: 16,
          color: '#666',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const hasImportant = announcements.some(a => a.important);
  const pendingTotal = ticketStats.pending + ticketStats.processing;

  const getPriorityTag = (priority: string) => {
    const map: Record<string, { color: string; label: string }> = {
      high: { color: 'red', label: '紧急' },
      medium: { color: 'orange', label: '中等' },
      low: { color: 'blue', label: '普通' },
    };
    const p = map[priority] || { color: 'default', label: priority };
    return <Tag color={p.color} style={{ fontSize: 11, lineHeight: '18px' }}>{p.label}</Tag>;
  };

  const notificationContent = (
    <div style={{ width: 400, maxHeight: 480, overflow: 'auto' }}>
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'tickets',
            label: (
              <span>
                待处理工单
                {pendingTotal > 0 && (
                  <Badge count={pendingTotal} size="small" style={{ marginLeft: 6, boxShadow: 'none' }} />
                )}
              </span>
            ),
            children: (
              <div>
                {ticketsLoading ? (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <Spin size="small" />
                  </div>
                ) : pendingTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                    <CheckCircleIcon />
                    <div style={{ marginTop: 8 }}>暂无待处理工单</div>
                  </div>
                ) : (
                  <>
                    {/* 统计摘要 */}
                    <div style={{ display: 'flex', gap: 12, padding: '8px 0 12px', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#1677ff' }}>
                        <ClockCircleOutlined /> 待接单 {ticketStats.pending}
                      </span>
                      <span style={{ fontSize: 12, color: '#fa8c16' }}>
                        <SyncOutlined /> 处理中 {ticketStats.processing}
                      </span>
                    </div>
                    <List
                      size="small"
                      dataSource={pendingTickets.slice(0, 8)}
                      renderItem={(ticket) => (
                        <List.Item
                          style={{ cursor: 'pointer', padding: '8px 4px' }}
                          onClick={() => {
                            setPopoverOpen(false);
                            router.push('/agent/tickets');
                          }}
                        >
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, color: '#8c8c8c' }}>{ticket.ticketNo}</span>
                                {getPriorityTag(ticket.priority)}
                              </div>
                              <Tag style={{ fontSize: 11 }}>
                                {ticket.status === 'pending' ? '待接单' : '处理中'}
                              </Tag>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                              {ticket.title.length > 28 ? ticket.title.slice(0, 28) + '...' : ticket.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#bfbfbf' }}>
                              {ticket.userName || '客户'} · {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('zh-CN') : ''}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                    {pendingTickets.length > 8 && (
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <Button type="link" size="small" onClick={() => { setPopoverOpen(false); router.push('/agent/tickets'); }}>
                          查看全部 {pendingTotal} 条 <RightOutlined />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ),
          },
          {
            key: 'announcements',
            label: (
              <span>
                系统公告
                {announcements.length > 0 && (
                  <Badge count={announcements.length} size="small" style={{ marginLeft: 6, boxShadow: 'none', backgroundColor: hasImportant ? '#ff4d4f' : '#1677ff' }} />
                )}
              </span>
            ),
            children: (
              <div>
                {announcementsLoading ? (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <Spin size="small" />
                  </div>
                ) : announcements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                    暂无系统公告
                  </div>
                ) : (
                  announcements.map(a => (
                    <div
                      key={a.id}
                      style={{
                        padding: '10px 4px',
                        borderBottom: '1px dashed #f0f0f0',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        {a.important && (
                          <span
                            style={{
                              background: '#ff4d4f',
                              color: '#fff',
                              fontSize: 11,
                              padding: '0 6px',
                              borderRadius: 3,
                            }}
                          >
                            重要
                          </span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                        {a.content}
                      </div>
                      <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 4 }}>
                        {a.publishedAt}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AgentNavbar />
      <Layout style={{ marginLeft: 220 }}>
        {/* 顶部 Header — 公告滚动栏 + 右侧通知中心 */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            height: 56,
            position: 'sticky',
            top: 0,
            zIndex: 9,
            gap: 16,
          }}
        >
          {/* 公告滚动栏：填充铃铛左侧全部空间 */}
          <AnnouncementBar />

          <Popover
            trigger="click"
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            placement="bottomRight"
            content={notificationContent}
          >
            <div style={{ position: 'relative', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
              <Badge
                count={pendingTotal}
                size="small"
                offset={[-4, 2]}
                style={{ boxShadow: 'none' }}
              >
                <BellOutlined style={{ color: '#1677ff', fontSize: 18 }} />
              </Badge>
              {/* 重要公告圆点 */}
              {hasImportant && pendingTotal === 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#ff4d4f',
                    border: '1px solid #fff',
                  }}
                />
              )}
            </div>
          </Popover>
        </Header>

        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 56px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

// 内联 CheckCircleIcon（避免额外导入）
const CheckCircleIcon = () => (
  <svg viewBox="0 0 1024 1024" width="40" height="40" style={{ color: '#52c41a', opacity: 0.5 }}>
    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m193.5 301.7l-210.6 292a31.8 31.8 0 0 1-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="currentColor" />
  </svg>
);

export default AgentLayout;
