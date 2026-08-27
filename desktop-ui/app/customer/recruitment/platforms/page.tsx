'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  DisconnectOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SearchOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageContainer from '@/components/customer/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import {
  cancelSession,
  createSession,
  getAccounts,
  getAccountStats,
  getSessionStatus,
  refreshAccount,
  unbindAccount,
} from '@/services/social-account';
import type { AccountStats, LoginSession, SocialAccount } from '@/services/social-account';

const { Text } = Typography;

/** 招聘平台视觉标识 */
const PLATFORM_STYLE: Record<string, { name: string; color: string; bg: string; desc: string }> = {
  bosszhipin: { name: 'BOSS直聘', color: '#00B8FF', bg: '#e8f7ff', desc: '扫码登录 BOSS直聘，用于真实候选人搜索与私信' },
  zhilian: { name: '智联招聘', color: '#E60012', bg: '#fff0f1', desc: '扫码登录智联招聘，用于真实候选人搜索与私信' },
};

const RECRUIT_PLATFORMS = ['bosszhipin', 'zhilian'];
const POLL_INTERVAL = 3000;

export default function RecruitmentPlatformsPage() {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 扫码授权会话
  const [activeSession, setActiveSession] = useState<LoginSession | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [polling, setPolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPolling(false);
  }, []);

  const loadAccounts = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await getAccounts(userId);
      setAccounts(list.filter((a) => RECRUIT_PLATFORMS.includes(a.platform)));
    } catch (e: any) {
      message.error(e?.message || '加载账号失败');
    }
  }, [userId]);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    try {
      setStats(await getAccountStats(userId));
    } catch {
      // 统计加载失败不阻塞页面
    }
  }, [userId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadAccounts(), loadStats()]);
    } catch (e: any) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [loadAccounts, loadStats]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // 轮询扫码状态
  const startPolling = useCallback(
    (sessionId: string) => {
      stopPolling();
      setPolling(true);
      timerRef.current = setInterval(async () => {
        try {
          const st = await getSessionStatus(sessionId);
          if (st.status === 'success') {
            stopPolling();
            message.success(`${st.platformName || '平台'}授权成功，已可用于真实搜索与私信`);
            setActiveSession(null);
            setModalOpen(false);
            loadAccounts();
            loadStats();
          } else if (['expired', 'failed', 'cancelled'].includes(st.status)) {
            stopPolling();
            message.info(st.message || '授权已失效，请重新发起');
            setActiveSession(null);
            setModalOpen(false);
          }
        } catch (e: any) {
          stopPolling();
          message.warning(e?.message || '授权会话已过期，请重新发起');
          setActiveSession(null);
          setModalOpen(false);
        }
      }, POLL_INTERVAL);
    },
    [loadAccounts, loadStats, stopPolling]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleAuthorize = async (platform: string) => {
    try {
      const session = await createSession(platform, userId);
      setActiveSession(session);
      setModalOpen(true);
      startPolling(session.sessionId);
    } catch (e: any) {
      message.error(e?.message || '发起授权失败');
    }
  };

  const handleCancelAuth = async () => {
    if (activeSession) {
      try {
        await cancelSession(activeSession.sessionId);
      } catch {
        // 忽略取消失败
      }
    }
    stopPolling();
    setActiveSession(null);
    setModalOpen(false);
  };

  const handleUnbind = (account: SocialAccount) => {
    Modal.confirm({
      title: '确认解绑',
      content: `确定解绑「${account.platformName}」账号「${account.accountName}」吗？解绑后该平台的真实搜索与私信将无法使用。`,
      okText: '解绑',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await unbindAccount(account.id);
          message.success('已解绑');
          loadAccounts();
          loadStats();
        } catch (e: any) {
          message.error(e?.message || '解绑失败');
        }
      },
    });
  };

  const handleReauth = async (account: SocialAccount) => {
    try {
      const session = await refreshAccount(account.id);
      setActiveSession(session);
      setModalOpen(true);
      startPolling(session.sessionId);
    } catch (e: any) {
      message.error(e?.message || '发起重新授权失败');
    }
  };

  const accountsByPlatform = (platform: string) =>
    accounts.filter((acc) => acc.platform === platform);

  const statusTag = (status: string) => {
    if (status === 'active') return <Tag color="success">已授权</Tag>;
    if (status === 'expired') return <Tag color="error">已过期</Tag>;
    return <Tag>{status || '未知'}</Tag>;
  };

  const columns: ColumnsType<SocialAccount> = [
    {
      title: '平台',
      dataIndex: 'platform',
      width: 140,
      render: (_: string, record: SocialAccount) => {
        const style = PLATFORM_STYLE[record.platform] || { name: '招聘平台', color: '#333', bg: '#f5f5f5' };
        return (
          <Space>
            <span
              style={{
                display: 'inline-flex',
                width: 28,
                height: 28,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                background: style.bg,
                color: style.color,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {style.name.slice(0, 1)}
            </span>
            {record.platformName}
          </Space>
        );
      },
    },
    {
      title: '账号',
      dataIndex: 'accountName',
      render: (_: string, record: SocialAccount) => (
        <Space>
          <Avatar size={28} src={record.avatar || undefined} icon={!record.avatar ? <QrcodeOutlined /> : undefined} />
          {record.accountName || '未命名账号'}
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'status', width: 100, render: statusTag },
    {
      title: '最近同步',
      dataIndex: 'lastSyncAt',
      width: 180,
      render: (v?: string | null) => (v ? new Date(v).toLocaleString() : '—'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      render: (_: unknown, record: SocialAccount) => (
        <Space>
          <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleReauth(record)}>
            重新授权
          </Button>
          <Button type="link" size="small" danger icon={<DisconnectOutlined />} onClick={() => handleUnbind(record)}>
            解绑
          </Button>
        </Space>
      ),
    },
  ];

  const qrSrc = activeSession?.qrcodeImage
    ? activeSession.qrcodeImage.startsWith('data:')
      ? activeSession.qrcodeImage
      : `data:image/png;base64,${activeSession.qrcodeImage}`
    : '';

  const recruitStats = {
    active: accounts.filter((a) => a.status === 'active').length,
    total: accounts.length,
    expired: accounts.filter((a) => a.status === 'expired').length,
  };

  return (
    <PageContainer
      title="招聘平台授权"
      description="扫码授权 BOSS直聘 / 智联招聘 账号后，系统即可在对应平台执行真实候选人搜索与真实私信"
      breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '智能招聘', href: '/customer/recruitment' }, { title: '平台授权' }]}
      loading={loading}
      skeletonType="card"
    >
      {/* 授权状态概览 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="已授权账号" value={recruitStats.active} valueStyle={{ color: '#07C160' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="账号总数" value={recruitStats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="已过期" value={recruitStats.expired} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="支持平台" value={RECRUIT_PLATFORMS.length} />
          </Card>
        </Col>
      </Row>

      {/* 平台授权卡片 */}
      <Typography.Title level={5} style={{ marginTop: 8 }}>
        选择平台扫码授权
      </Typography.Title>
      <Row gutter={16}>
        {RECRUIT_PLATFORMS.map((key) => {
          const style = PLATFORM_STYLE[key] || PLATFORM_STYLE.bosszhipin;
          const accs = accountsByPlatform(key);
          const first = accs[0];
          return (
            <Col xs={24} sm={12} lg={8} key={key} style={{ marginBottom: 16 }}>
              <Card hoverable styles={{ body: { padding: 20 } }} style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: style.bg,
                      color: style.color,
                      fontWeight: 700,
                      fontSize: 20,
                      marginRight: 12,
                    }}
                  >
                    {style.name.slice(0, 1)}
                  </span>
                  <div>
                    <Typography.Text strong style={{ fontSize: 16 }}>
                      {style.name}
                    </Typography.Text>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {style.desc}
                      </Typography.Text>
                    </div>
                  </div>
                </div>

                <div style={{ minHeight: 40, marginBottom: 12 }}>
                  {accs.length > 0 ? (
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space size={6}>
                        <Tag color="success">已授权 {accs.length} 个账号</Tag>
                      </Space>
                      {accs.slice(0, 2).map((a) => (
                        <Space key={a.id} size={6} style={{ width: '100%' }}>
                          <Avatar size={20} src={a.avatar || undefined} />
                          <Typography.Text ellipsis style={{ maxWidth: 180, fontSize: 13 }}>
                            {a.accountName || '未命名账号'}
                          </Typography.Text>
                          {a.status !== 'active' && statusTag(a.status)}
                        </Space>
                      ))}
                    </Space>
                  ) : (
                    <Typography.Text type="secondary">未授权</Typography.Text>
                  )}
                </div>

                <Space wrap>
                  <Button type="primary" icon={<QrcodeOutlined />} onClick={() => handleAuthorize(key)}>
                    {accs.length > 0 ? '添加账号' : '立即授权'}
                  </Button>
                  {first && (
                    <Button icon={<ReloadOutlined />} onClick={() => handleReauth(first)}>
                      重新授权
                    </Button>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 已绑定账号列表 */}
      <Typography.Title level={5} style={{ marginTop: 16 }}>
        已绑定账号（{accounts.length}）
      </Typography.Title>
      <Card styles={{ body: { padding: 0 } }}>
        <Table<SocialAccount>
          rowKey="id"
          columns={columns}
          dataSource={accounts}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无绑定账号，请先在上方扫码授权" />
            ),
          }}
        />
      </Card>

      {/* 扫码授权弹窗 */}
      <Modal
        title={activeSession ? `扫码登录${activeSession.platformName || ''}` : '扫码授权'}
        open={modalOpen}
        onCancel={handleCancelAuth}
        footer={
          <Button onClick={handleCancelAuth} disabled={polling}>
            {polling ? '等待扫码中…' : '取消授权'}
          </Button>
        }
        width={420}
        destroyOnClose
        closable={false}
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="登录二维码"
              style={{
                width: 280,
                height: 280,
                objectFit: 'contain',
                borderRadius: 8,
                border: '1px solid #f0f0f0',
              }}
            />
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin tip="正在获取二维码…" />
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            {polling ? (
              <Space>
                <Spin size="small" />
                <Typography.Text type="secondary">
                  请使用{activeSession?.platformName || '对应平台'}APP扫描二维码登录
                </Typography.Text>
              </Space>
            ) : (
              <Typography.Text type="secondary">二维码即将就绪…</Typography.Text>
            )}
          </div>
          {activeSession && activeSession.expiresIn > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
              <ClockCircleFilled /> 会话约 {Math.ceil(activeSession.expiresIn / 60)} 分钟内有效
            </Typography.Text>
          )}
        </div>
      </Modal>

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        message="授权说明"
        description={
          <Space direction="vertical" size={2}>
            <span><SearchOutlined /> 授权后，系统将使用该账号在招聘平台执行真实候选人搜索（每 30 分钟自动执行）。</span>
            <span><MessageOutlined /> 开启「自动沟通」后，系统将使用该账号向匹配候选人真实发送私信。</span>
            <span><CheckCircleFilled /> 账号 Cookie 加密存储，仅用于搜索与私信，请勿将二维码分享给他人。</span>
          </Space>
        }
      />
    </PageContainer>
  );
}
