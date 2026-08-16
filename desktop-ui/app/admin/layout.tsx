'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Result, Spin, Popover, Tag, Empty } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminNavbar from './layout/Navbar';
import AnnouncementBar from '@/components/AnnouncementBar';

const { Header, Content } = Layout;

const SIDER_WIDTH = 220;

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  target: string;
  publishedAt: string;
}

const TYPE_META: Record<Announcement['type'], { color: string; label: string }> = {
  info: { color: 'blue', label: '提示' },
  warning: { color: 'orange', label: '警告' },
  important: { color: 'red', label: '重要' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  // 拉取系统公告
  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: Announcement[] }>(
        '/announcements?audience=all&limit=5'
      )) as unknown as { success: boolean; data: Announcement[] };
      if (res.success && Array.isArray(res.data)) {
        setAnnouncements(res.data);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      // 公告接口失败时静默降级
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user, fetchAnnouncements]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="您没有权限访问管理员后台，请使用管理员账号登录或切换到正确的角色。"
        extra={<button onClick={() => router.push('/login')}>返回登录</button>}
      />
    );
  }

  const popoverContent = (
    <div style={{ width: 360, maxHeight: 400, overflowY: 'auto' }}>
      {announcementsLoading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="small" />
        </div>
      ) : announcements.length === 0 ? (
        <Empty description="暂无系统公告" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        announcements.map(item => (
          <div
            key={item.id}
            style={{
              padding: '10px 4px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Tag color={TYPE_META[item.type]?.color || 'blue'} style={{ margin: 0 }}>
                {TYPE_META[item.type]?.label || '提示'}
              </Tag>
              <span style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>{item.title}</span>
            </div>
            <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.6 }}>
              {item.content}
            </div>
            {item.publishedAt && (
              <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 4 }}>
                {new Date(item.publishedAt).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      <Layout style={{ marginLeft: SIDER_WIDTH }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* 公告滚动栏：填充铃铛左侧全部空间 */}
          <AnnouncementBar />

          {/* 右侧：系统公告铃铛 */}
          <Popover
            content={popoverContent}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <NotificationOutlined />
                <span>系统公告</span>
              </div>
            }
            trigger="click"
            placement="bottomRight"
          >
            <div style={{ position: 'relative', cursor: 'pointer', padding: '4px 8px' }}>
              <NotificationOutlined style={{ color: '#1677ff', fontSize: 18 }} />
              {announcements.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: announcements.some(a => a.type === 'important') ? '#ff4d4f' : '#1677ff',
                    border: '1px solid #fff',
                  }}
                />
              )}
            </div>
          </Popover>
        </Header>
        <Content
          style={{
            padding: '0 24px 24px',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
