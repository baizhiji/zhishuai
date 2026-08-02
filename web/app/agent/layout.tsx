'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Popover, Badge, Spin, App } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AgentNavbar from './layout/Navbar';

const { Header, Content } = Layout;

interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  important?: boolean;
}

const AgentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { message, modal } = App.useApp();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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
      // 非代理商/管理员，禁止访问
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
        '/api/announcements?audience=agent&limit=5'
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
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // 顶部时间显示
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const w = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      setCurrentTime(`${y}-${m}-${d} 周${w}`);
    };
    updateTime();
    const t = setInterval(updateTime, 60_000);
    return () => clearInterval(t);
  }, []);

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

  const latestAnnouncement = announcements[0];
  const hasImportant = announcements.some(a => a.important);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AgentNavbar />
      <Layout style={{ marginLeft: 220 }}>
        {/* 顶部 Header — 系统公告显示区 */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          {/* 左侧：当前时间 + 系统公告（最重要的） */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <span style={{ color: '#8c8c8c', fontSize: 13, marginRight: 24, whiteSpace: 'nowrap' }}>
              {currentTime}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                flex: 1,
                maxWidth: 640,
              }}
            >
              <Popover
                trigger="click"
                open={popoverOpen}
                onOpenChange={setPopoverOpen}
                placement="bottomLeft"
                content={
                  <div style={{ width: 380, maxHeight: 460, overflow: 'auto' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        padding: '4px 0 12px',
                        borderBottom: '1px solid #f0f0f0',
                        marginBottom: 8,
                      }}
                    >
                      系统公告
                    </div>
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
                }
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '4px 12px',
                    borderRadius: 6,
                    background: '#f0f5ff',
                    border: '1px solid #d6e4ff',
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  <Badge
                    count={hasImportant ? announcements.length : 0}
                    size="small"
                    offset={[-2, 2]}
                  >
                    <BellOutlined
                      style={{ color: '#1677ff', fontSize: 16, marginRight: 8 }}
                    />
                  </Badge>
                  <span
                    style={{
                      fontSize: 13,
                      color: '#262626',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 420,
                    }}
                    title={latestAnnouncement?.title || '系统公告'}
                  >
                    {latestAnnouncement
                      ? `${latestAnnouncement.important ? '【重要】' : ''}${latestAnnouncement.title}`
                      : '欢迎使用智枢AI 代理后台'}
                  </span>
                </div>
              </Popover>
            </div>
          </div>

          {/* 右侧：欢迎语（不再显示用户菜单，按钮已移到侧边栏"系统设置"） */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#595959', fontSize: 13 }}>
              欢迎，{user.name || user.phone || '代理商'}
            </span>
          </div>
        </Header>

        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 56px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AgentLayout;
