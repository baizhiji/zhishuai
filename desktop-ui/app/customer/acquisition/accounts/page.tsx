'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

/** 平台视觉标识（key 与后端统一，一个平台仅一个入口） */
const PLATFORM_STYLE: Record<string, { name: string; color: string; bg: string; desc: string }> = {
  douyin: { name: '抖音', color: '#161823', bg: '#eef0f2', desc: '扫码登录抖音创作者中心，支持多账号矩阵' },
  kuaishou: { name: '快手', color: '#FF4906', bg: '#fff0ea', desc: '扫码登录快手网页版，支持多账号矩阵' },
  xiaohongshu: { name: '小红书', color: '#FF2442', bg: '#ffeef1', desc: '扫码登录小红书网页版，支持多账号矩阵' },
};

/** 固定平台入口，避免后端返回重复 platform key 导致同平台出现多个授权卡片 */
const SUPPORTED_PLATFORM_KEYS = Object.keys(PLATFORM_STYLE);

const POLL_INTERVAL = 3000;

export default function AcquisitionAccountsPage() {
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
      setAccounts(list);
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
            message.success(`${st.platformName || '平台'}授权成功`);
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
          // 会话已被服务端清理（超时/取消）
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
      content: `确定解绑「${account.platformName}」账号「${account.accountName}」吗？解绑后该平台的跟评将无法使用。`,
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

  /** 返回某平台全部已授权账号（支持同平台多账号矩阵） */
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
      width: 120,
      render: (_: string, record: SocialAccount) => {
        const style = PLATFORM_STYLE[record.platform] || PLATFORM_STYLE.douyin;
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
      width: 180,
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

  return (
    <PageContainer
      title="平台账号授权"
      description="完成抖音、快手、小红书账号授权后，即可使用智能跟评。支持同平台多账号矩阵，每个账号独立频控、独立发送"
      breadcrumb={[{ title: '智能获客', href: '/customer/acquisition/board' }, { title: '平台账号授权' }]}
      loading={loading}
      skeletonType="card"
    >
      {/* 授权状态概览 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="已授权账号" value={stats?.active ?? 0} valueStyle={{ color: '#07C160' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="账号总数" value={stats?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="已过期" value={stats?.expired ?? 0} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="已停用" value={stats?.disabled ?? 0} />
          </Card>
        </Col>
      </Row>

      {/* 平台授权卡片：每个平台仅一个入口，入口内可授权多个账号 */}
      <Typography.Title level={5} style={{ marginTop: 8 }}>
        选择平台扫码授权
      </Typography.Title>
      <Row gutter={16}>
        {SUPPORTED_PLATFORM_KEYS.map((key) => {
          const style = PLATFORM_STYLE[key];
          const accs = accountsByPlatform(key);
            const first = accs[0];
            return (
              <Col xs={24} sm={12} lg={6} key={key} style={{ marginBottom: 16 }}>
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
                          {accs.length > 1 && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              矩阵可用
                            </Typography.Text>
                          )}
                        </Space>
                        {accs.slice(0, 2).map((a) => (
                          <Space key={a.id} size={6} style={{ width: '100%' }}>
                            <Avatar size={20} src={a.avatar || undefined} />
                            <Typography.Text ellipsis style={{ maxWidth: 150, fontSize: 13 }}>
                              {a.accountName || '未命名账号'}
                            </Typography.Text>
                            {a.status !== 'active' && statusTag(a.status)}
                          </Space>
                        ))}
                        {accs.length > 2 && (
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            … 等共 {accs.length} 个账号
                          </Typography.Text>
                        )}
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
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无绑定账号，请先在上方扫码授权"
              />
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
        description="授权过程通过浏览器打开平台官方登录页完成，二维码为实时生成的真实登录码。为保证账号安全，请勿将二维码分享给他人。账号 Cookie 加密存储，仅用于发送跟评。"
      />
    </PageContainer>
  );
}
