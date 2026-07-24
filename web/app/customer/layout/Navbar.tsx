'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Avatar,
  Space,
  Button,
  Dropdown,
  theme,
  Image,
  Modal,
  Form,
  Input,
  message,
  Badge,
  Popover,
  Empty,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import {
  PieChartOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  AppstoreOutlined,
  QrcodeOutlined,
  MessageOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  SwapOutlined,
  PictureOutlined,
  AndroidOutlined,
  HomeOutlined,
  CommentOutlined,
  IdcardOutlined,
  LockOutlined,
  ExperimentOutlined,
  CrownOutlined,
  BankOutlined,
  ApartmentOutlined,
  NotificationOutlined,
  BellOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import RoleSwitchModal from '@/components/common/RoleSwitchModal';
import { getLatestAnnouncements, type Announcement } from '@/services/version';

const { Sider, Header, Content } = Layout;
const { useToken } = theme;

// 角色类型
type Role = 'admin' | 'agent' | 'customer';

interface NavigationItem {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  path?: string;
  featureKey?: string; // 关联的功能代码，无此字段表示始终显示
  type?: 'divider';
  danger?: boolean;
  onClick?: () => void;
  children?: NavigationItem[];
}

// 导航菜单配置
function getNavigationItems(
  role: Role,
  enabledFeatures?: Set<string>,
  options?: { onLogout?: () => void },
): NavigationItem[] {
  const onLogout = options?.onLogout;
  // 注意：featureKey 过滤已禁用——功能权限应在页面内部校验，
  // 不应让 Navbar 整体隐藏菜单项，避免后端 features 接口数据异常
  // 导致整个工作台看上去"功能消失"。
  void enabledFeatures;

  switch (role) {
    case 'customer':
      return [
        {
          key: 'dashboard',
          label: '工作台',
          icon: <PieChartOutlined />,
          path: '/customer/dashboard',
        },
        {
          key: 'materials',
          label: '内容中心',
          icon: <AppstoreOutlined />,
          path: '/customer/materials',
        },
        {
          key: 'ai-factory',
          label: 'AI创作工厂',
          icon: <ExperimentOutlined />,
          featureKey: 'factory',
          path: '/customer/ai-factory',
        },
        {
          key: 'recruitment',
          label: '招聘助手',
          icon: <TeamOutlined />,
          featureKey: 'recruitment',
          children: [
            {
              key: 'recruit-platforms',
              label: '平台授权',
              icon: <QrcodeOutlined />,
              path: '/customer/recruitment/platforms',
            },
            {
              key: 'recruit-auto',
              label: '智能沟通',
              icon: <MessageOutlined />,
              path: '/customer/recruitment/auto',
            },
            {
              key: 'recruit-publish',
              label: '职位发布',
              icon: <ShareAltOutlined />,
              path: '/customer/recruitment/publish',
            },
            {
              key: 'recruit-screen',
              label: '简历筛选',
              icon: <UserAddOutlined />,
              path: '/customer/interview',
            },
            {
              key: 'recruit-interview',
              label: '面试管理',
              icon: <TeamOutlined />,
              path: '/customer/recruitment-dashboard',
            },
          ],
        },
        {
          key: 'acquisition',
          label: '智能获客',
          icon: <UserAddOutlined />,
          featureKey: 'acquisition',
          children: [
            {
              key: 'acquisition-discover',
              label: '潜客发现',
              icon: <UserAddOutlined />,
              path: '/customer/acquisition/discover',
            },
            {
              key: 'acquisition-task',
              label: '引流任务',
              icon: <ShareAltOutlined />,
              path: '/customer/acquisition/task',
            },
            {
              key: 'acquisition-board',
              label: '获客看板',
              icon: <PieChartOutlined />,
              path: '/customer/acquisition/board',
            },
          ],
        },
        {
          key: 'share',
          label: '推荐分享',
          icon: <ShareAltOutlined />,
          featureKey: 'share',
          children: [
            {
              key: 'share-code',
              label: '二维码生成',
              icon: <QrcodeOutlined />,
              path: '/customer/share/code',
            },
            {
              key: 'share-track',
              label: '推荐追踪',
              icon: <PieChartOutlined />,
              path: '/customer/share/track',
            },
            {
              key: 'share-board',
              label: '分享看板',
              icon: <ShareAltOutlined />,
              path: '/customer/share/board',
            },
          ],
        },
        {
          key: 'tickets',
          label: '工单管理',
          icon: <FileTextOutlined />,
          path: '/customer/tickets',
        },
        {
          key: 'login-logs',
          label: '登录日志',
          icon: <FileTextOutlined />,
          path: '/customer/login-logs',
        },
        {
          key: 'api-keys',
          label: 'API管理',
          icon: <AppstoreOutlined />,
          path: '/customer/api-keys',
        },
        {
          key: 'settings',
          label: '设置',
          icon: <SettingOutlined />,
          children: [
            {
              key: 'settings-company',
              label: '公司信息',
              icon: <TeamOutlined />,
              path: '/customer/settings/company',
            },
            {
              key: 'settings-security',
              label: '安全设置',
              icon: <SettingOutlined />,
              path: '/customer/settings/security',
            },
            {
              key: 'settings-theme',
              label: '主题设置',
              icon: <PictureOutlined />,
              path: '/customer/settings/theme',
            },
            {
              key: 'settings-app-download',
              label: '智枢AI APP下载',
              icon: <AndroidOutlined />,
              path: '/customer/settings/app-download',
            },
            { key: 'settings-divider', type: 'divider' as const },
            {
              key: 'settings-logout',
              label: '退出登录',
              icon: <LogoutOutlined />,
              danger: true,
              onClick: onLogout,
            },
          ],
        },
      ];
    default:
      return [];
  }
}

// 获取当前选中的菜单项
function getSelectedKeys(items: NavigationItem[], path: string): string[] {
  for (const item of items) {
    if (item.path && path.startsWith(item.path)) {
      return [item.key];
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.type === 'divider') continue;
        if (child.path && path.startsWith(child.path)) {
          return [child.key];
        }
      }
    }
  }
  return [];
}

// 获取当前展开的菜单项
function getOpenKeysForPath(items: NavigationItem[], path: string): string[] {
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        if (child.type === 'divider') continue;
        if (child.path && path.startsWith(child.path)) {
          return [item.key];
        }
      }
    }
  }
  return [];
}

export default function Navbar({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useToken();
  const { user, logout, isAdmin } = useAuth();

  // 用于解决服务端/客户端 hydration 不匹配问题
  const [mounted, setMounted] = useState(false);

  // Sider 折叠状态
  const [collapsed, setCollapsed] = useState(false);

  // Logo 图片加载状态
  const [logoError, setLogoError] = useState(false);

  // 角色切换弹窗状态
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  // 个人资料 / 修改密码 Modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [userInfo, setUserInfo] = useState({ username: '客户', phone: '' });

  // 当前查看的角色
  const [currentRole, setCurrentRole] = useState<Role>('customer');

  // 用户启用的功能代码集合
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string> | undefined>(undefined);

  // 系统公告（头部铃铛 Popover）
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementPopoverOpen, setAnnouncementPopoverOpen] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const res: any = await getLatestAnnouncements();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.list)
        ? res.data.list
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.list)
        ? res.list
        : [];
      setAnnouncements(list.slice(0, 5));
    } catch (err) {
      console.error('[Navbar] 加载公告失败:', err);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  // 首次挂载时加载公告
  useEffect(() => {
    if (mounted) {
      loadAnnouncements();
    }
  }, [mounted, loadAnnouncements]);

  // 确保只在客户端挂载后渲染，避免 hydration 不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 初始化用户信息
  useEffect(() => {
    if (mounted) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          setUserInfo({
            username: u.username || u.phone || '客户',
            phone: u.phone || '',
          });
        }
      } catch {}
    }
  }, [mounted]);

  // 获取用户功能开关
  useEffect(() => {
    if (!mounted) return;
    const userId = user?.id;
    if (!userId) return;

    const fetchFeatures = async () => {
      try {
        const { default: apiClient } = await import('@/lib/api');
        const res: any = await apiClient.get(`/features?userId=${userId}`);
        const features = res.data || [];
        const enabled = new Set<string>();
        features.forEach((f: any) => {
          if (f.enabled) enabled.add(f.code);
        });
        setEnabledFeatures(enabled);
      } catch {
        // 获取失败时不过滤，显示全部
        setEnabledFeatures(undefined);
      }
    };
    fetchFeatures();
  }, [mounted, user?.id]);

  // 监听用户角色变化
  useEffect(() => {
    if (mounted) {
      const isCustomerRoute = pathname.startsWith('/customer');
      if (isCustomerRoute) {
        setCurrentRole('customer');
        return;
      }
      const saved = localStorage.getItem('viewing_role');
      if (saved && ['admin', 'agent', 'customer'].includes(saved)) {
        setCurrentRole(saved as Role);
      } else {
        setCurrentRole((user?.role as Role) || 'customer');
      }
    }
  }, [mounted, pathname, user?.role]);

  // /customer 路由下强制使用 customer 角色
  const isCustomerRoute = pathname.startsWith('/customer');

  // 切换角色
  const handleRoleSwitch = (role: Role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewing_role', role);
    }
    setCurrentRole(role);
    setRoleModalVisible(false);
    if (role === 'admin') {
      router.push('/admin/tenants');
    } else if (role === 'agent') {
      router.push('/agent/tenants');
    } else {
      router.push('/');
    }
  };

  // 退出登录
  const handleLogout = useCallback(() => {
    logout();
    message.success('已退出登录');
    router.push('/login');
  }, [logout, router]);

  // 导航菜单项（按功能开关动态过滤）
  const navItems = useMemo(() => {
    return getNavigationItems('customer', enabledFeatures, { onLogout: handleLogout });
  }, [enabledFeatures, handleLogout]);

  // 菜单展开状态
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 用户手动展开/折叠菜单
  const handleOpenChange = useCallback((keys: string[]) => {
    setOpenKeys(keys);
  }, []);

  // 路由变化时自动更新菜单展开状态
  useEffect(() => {
    const keysFromPath = getOpenKeysForPath(navItems, pathname);
    if (keysFromPath.length > 0) {
      setOpenKeys(keysFromPath);
    }
  }, [pathname, navItems]);

  // 服务端渲染时返回占位符
  if (!mounted) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="ant-spin ant-spin-lg ant-spin-spinning">
              <span className="ant-spin-dot ant-spin-dot-spin">
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
              </span>
            </div>
            <div style={{ marginTop: 16, color: '#999' }}>加载中...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // 修改密码
  const handlePasswordChange = () => {
    passwordForm
      .validateFields()
      .then(values => {
        if (values.newPassword !== values.confirmPassword) {
          message.error('两次输入的密码不一致');
          return;
        }
        message.success('密码修改成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      })
      .catch(() => {});
  };

  // 更新个人资料
  const handleProfileUpdate = () => {
    profileForm
      .validateFields()
      .then(values => {
        localStorage.setItem('userInfo', JSON.stringify(values));
        setUserInfo(prev => ({ ...prev, ...values }));
        message.success('个人信息更新成功');
        setProfileModalVisible(false);
      })
      .catch(() => {});
  };

  // 侧边栏用户菜单 - 含个人资料、修改密码、退出
  const userMenuItems = [
    ...(mounted && isAdmin
      ? [
          {
            key: 'switch-role',
            label: '切换角色视角',
            icon: <SwapOutlined />,
            onClick: () => setRoleModalVisible(true),
          },
          { type: 'divider' as const },
        ]
      : []),
    {
      key: 'profile',
      label: '个人资料',
      icon: <IdcardOutlined />,
      onClick: () => {
        profileForm.setFieldsValue(userInfo);
        setProfileModalVisible(true);
      },
    },
    {
      key: 'password',
      label: '修改密码',
      icon: <LockOutlined />,
      onClick: () => setPasswordModalVisible(true),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  // 获取角色显示文本
  const getRoleDisplayText = (role: Role) => {
    switch (role) {
      case 'admin':
        return '开发者总后台';
      case 'agent':
        return '区域代理';
      case 'customer':
        return '终端客户';
      default:
        return '未知角色';
    }
  };

  const roleColorMap: Record<string, string> = {
    admin: '#1890ff',
    agent: '#52c41a',
    user: '#faad14',
    customer: '#faad14',
  };
  const userRole = user?.role || 'customer';
  const userRoleColor = roleColorMap[userRole] || '#faad14';

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 - 白色风格 */}
      <Sider
        width={240}
        collapsedWidth={64}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space>
            {logoError ? (
              <div
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: token.colorPrimary,
                  borderRadius: 6,
                }}
              >
                <AppstoreOutlined style={{ color: '#fff', fontSize: 18 }} />
              </div>
            ) : (
              <Image
                src="/logo.png"
                alt="智枢AI"
                width={32}
                height={32}
                preview={false}
                style={{ borderRadius: 6 }}
                onError={() => setLogoError(true)}
              />
            )}
            <span
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: token.colorText,
              }}
            >
              智枢AI
            </span>
          </Space>
        </div>

        {/* 导航菜单 - 白色主题 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys(navItems, pathname)}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            style={{ border: 'none' }}
            items={navItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              children: item.children?.map(child => {
                if (child.type === 'divider') {
                  return { type: 'divider' as const };
                }
                return {
                  key: child.key,
                  icon: child.icon,
                  label: child.label,
                  danger: child.danger,
                  onClick: child.path ? () => router.push(child.path!) : child.onClick,
                };
              }),
              onClick: item.path ? () => router.push(item.path!) : undefined,
            }))}
          />
        </div>


      </Sider>

      {/* 主内容区域 */}
      <Layout>
        {/* 顶部导航栏 - 白色风格 */}
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
          }}
        >
          {/* 系统公告铃铛入口 */}
          <Popover
            open={announcementPopoverOpen}
            onOpenChange={setAnnouncementPopoverOpen}
            trigger="click"
            placement="bottomRight"
            content={
              <div style={{ width: 360, maxHeight: 480, overflow: 'auto' }}>
                <Space
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Space size={6}>
                    <BellOutlined style={{ color: '#1890ff' }} />
                    <Typography.Text strong>系统公告</Typography.Text>
                    {announcements.length > 0 && (
                      <Tag color="blue">{announcements.length} 条</Tag>
                    )}
                  </Space>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setAnnouncementPopoverOpen(false);
                      loadAnnouncements();
                    }}
                  >
                    刷新
                  </Button>
                </Space>

                {announcementsLoading ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {[0, 1].map(i => (
                      <Skeleton key={i} active paragraph={{ rows: 2 }} />
                    ))}
                  </Space>
                ) : announcements.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Space direction="vertical" size={2}>
                        <Typography.Text type="secondary">暂无公告</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          平台新动态将第一时间在此展示
                        </Typography.Text>
                      </Space>
                    }
                    style={{ padding: '24px 0' }}
                  />
                ) : (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {announcements.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          padding: '12px 14px',
                          border: '1px solid #f0f0f0',
                          borderRadius: 8,
                          background: '#fafafa',
                        }}
                      >
                        <Space size={6} wrap style={{ marginBottom: 6 }}>
                          <Tag
                            color={
                              item.priority === 'high'
                                ? 'red'
                                : item.priority === 'normal'
                                ? 'orange'
                                : 'default'
                            }
                          >
                            {item.priority === 'high'
                              ? '重要'
                              : item.priority === 'normal'
                              ? '一般'
                              : '提示'}
                          </Tag>
                          {item.startTime && (
                            <Typography.Text
                              type="secondary"
                              style={{ fontSize: 12 }}
                            >
                              <ClockCircleOutlined />{' '}
                              {new Date(item.startTime).toLocaleDateString('zh-CN')}
                            </Typography.Text>
                          )}
                        </Space>
                        <Typography.Text
                          strong
                          style={{ display: 'block', marginBottom: 4 }}
                        >
                          {item.title}
                        </Typography.Text>
                        <Typography.Paragraph
                          type="secondary"
                          style={{ fontSize: 13, margin: 0 }}
                          ellipsis={{ rows: 2 }}
                        >
                          {item.content}
                        </Typography.Paragraph>
                      </div>
                    ))}
                  </Space>
                )}
              </div>
            }
          >
            <Badge count={announcements.length} size="small" offset={[-4, 4]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                aria-label="系统公告"
              />
            </Badge>
          </Popover>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1 }}>{children}</div>

          {/* 版权信息 */}
          <div
            style={{
              textAlign: 'center',
              padding: '16px 0',
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgContainer,
              color: token.colorTextSecondary,
              fontSize: 12,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              智枢 AI SaaS 系统版权所属：上海百智集网络科技有限公司
            </div>
          </div>
        </Content>
      </Layout>

      {/* 角色切换弹窗 - 使用共享组件 */}
      <RoleSwitchModal
        open={roleModalVisible}
        currentRole={currentRole}
        userRole={user?.role}
        onCancel={() => setRoleModalVisible(false)}
      />

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        onOk={handlePasswordChange}
        okText="确定"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* 个人资料弹窗 */}
      <Modal
        title="个人资料"
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        onOk={handleProfileUpdate}
        okText="保存"
        cancelText="取消"
      >
        <Form form={profileForm} layout="vertical" initialValues={userInfo}>
          <Form.Item name="username" label="用户名">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
