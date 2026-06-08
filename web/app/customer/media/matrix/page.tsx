'use client';

import React, { useState, useEffect } from 'react';
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
  Form,
  Input,
  Select,
  message,
  Avatar,
  Badge,
  Statistic,
  Divider,
  List,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  SyncOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  MobileOutlined,
  GlobalOutlined,
  TeamOutlined,
  FundViewOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;

interface Account {
  id: string;
  platform: string;
  platformName: string;
  accountId: string;
  accountName: string;
  avatar?: string;
  fans?: number;
  status: 'active' | 'expired' | 'error';
  lastSyncTime?: string;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  byPlatform: Record<string, number>;
}

const platformColors: Record<string, string> = {
  douyin: '#fe2c55',
  kuaishou: '#ff4906',
  xiaohongshu: '#fe2c25',
  weibo: '#e6162d',
  boss: '#15c15a',
};

const platformIcons: Record<string, React.ReactNode> = {
  douyin: <span style={{ fontSize: 24 }}>🎵</span>,
  kuaishou: <span style={{ fontSize: 24 }}>📹</span>,
  xiaohongshu: <span style={{ fontSize: 24 }}>📕</span>,
  weibo: <span style={{ fontSize: 24 }}>🌐</span>,
  boss: <span style={{ fontSize: 24 }}>💼</span>,
};

export default function MatrixManagementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrcodeImage, setQrcodeImage] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('pending');
  const [userId] = useState('default-user');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, statsRes] = await Promise.all([
        request.get('/social/accounts', { params: { userId: userId as string } }),
        request.get('/social/accounts/stats', { params: { userId: userId as string } }),
      ]);

      if (accountsRes.code === 0) {
        setAccounts(accountsRes.data);
      }
      if (statsRes.code === 0) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      // 使用演示数据
      setAccounts([
        {
          id: '1',
          platform: 'douyin',
          platformName: '抖音',
          accountId: 'test123',
          accountName: '智枢AI官方',
          fans: 12580,
          status: 'active',
          lastSyncTime: new Date().toISOString(),
        },
      ]);
      setStats({
        total: 1,
        active: 1,
        expired: 0,
        byPlatform: { douyin: 1 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBind = async (platform: string) => {
    setSelectedPlatform(platform);
    setBindModalVisible(true);

    try {
      const res = await request.post('/social/session/create', {
        platform,
        userId: userId as string,
      });

      if (res.code === 0) {
        setSessionId(res.data.sessionId);
        setQrcodeImage(res.data.qrcodeImage);
        setSessionStatus('pending');

        // 开始轮询
        pollSessionStatus(res.data.sessionId);
      }
    } catch (error) {
      message.error('创建会话失败');
    }
  };

  const pollSessionStatus = (sid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await request.get(`/social/session/${sid}/status`);
        if (res.code === 0) {
          setSessionStatus(res.data.status);

          if (res.data.status === 'confirmed') {
            clearInterval(interval);
            handleLogin(sid);
          } else if (res.data.status === 'failed') {
            clearInterval(interval);
            message.error('登录失败，请重试');
          }
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleLogin = async (sid: string) => {
    try {
      const res = await request.post(`/social/session/${sid}/login`);
      if (res.code === 0) {
        message.success('绑定成功！');
        setBindModalVisible(false);
        resetBindState();
        fetchData();
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (error) {
      message.error('登录失败');
    }
  };

  const resetBindState = () => {
    setSelectedPlatform(null);
    setSessionId(null);
    setQrcodeImage(null);
    setSessionStatus('pending');
  };

  const handleUnbind = async (accountId: string) => {
    try {
      const res = await request.delete(`/social/accounts/${accountId}`);
      if (res.code === 0) {
        message.success('解绑成功');
        fetchData();
      }
    } catch (error) {
      message.error('解绑失败');
    }
  };

  const columns = [
    {
      title: '平台账号',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string, record: Account) => (
        <Space>
          {platformIcons[platform] || <MobileOutlined />}
          <div>
            <div style={{ fontWeight: 500 }}>{record.platformName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.accountName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '粉丝数',
      dataIndex: 'fans',
      key: 'fans',
      render: (fans: number) => fans?.toLocaleString() || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'success', text: '正常' },
          expired: { color: 'warning', text: '已过期' },
          error: { color: 'error', text: '异常' },
        };
        const { color, text } = statusMap[status as keyof typeof statusMap] || statusMap.error;
        return <Badge status={color as any} text={text} />;
      },
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncTime',
      key: 'lastSyncTime',
      render: (time: string) => (time ? new Date(time).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Account) => (
        <Button type="link" danger size="small" onClick={() => handleUnbind(record.id)}>
          解绑
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          📱 矩阵管理系统
        </Title>
        <Text type="secondary">一站式管理多平台社交账号，实现内容统一发布和数据分析</Text>
      </div>

      {/* 快捷入口 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card
            hoverable
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Link href="/media/matrix/accounts" style={{ color: 'white' }}>
              <Space direction="vertical" size={0}>
                <TeamOutlined style={{ fontSize: 24 }} />
                <Title level={4} style={{ color: 'white', margin: '8px 0' }}>
                  账号管理
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>绑定和解绑社交媒体账号</Text>
              </Space>
            </Link>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Link href="/media/matrix/publish" style={{ color: 'white' }}>
              <Space direction="vertical" size={0}>
                <GlobalOutlined style={{ fontSize: 24 }} />
                <Title level={4} style={{ color: 'white', margin: '8px 0' }}>
                  内容发布
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>一键发布内容到多平台</Text>
              </Space>
            </Link>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <Link href="/media/matrix/stats" style={{ color: 'white' }}>
              <Space direction="vertical" size={0}>
                <FundViewOutlined style={{ fontSize: 24 }} />
                <Title level={4} style={{ color: 'white', margin: '8px 0' }}>
                  数据统计
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>多平台数据汇总分析</Text>
              </Space>
            </Link>
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
            }}
          >
            <Link href="/media/matrix/automation" style={{ color: 'white' }}>
              <Space direction="vertical" size={0}>
                <SyncOutlined style={{ fontSize: 24 }} />
                <Title level={4} style={{ color: 'white', margin: '8px 0' }}>
                  自动化
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>设置自动发布任务</Text>
              </Space>
            </Link>
          </Card>
        </Col>
      </Row>

      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="绑定账号" value={stats?.total || 0} prefix={<MobileOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="正常账号"
              value={stats?.active || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已过期"
              value={stats?.expired || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="覆盖平台"
              value={Object.keys(stats?.byPlatform || {}).length}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      {/* 账号列表 */}
      <Card
        title="已绑定的账号"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBindModalVisible(true)}>
            绑定新账号
          </Button>
        }
      >
        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <MobileOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <Paragraph>暂未绑定任何账号</Paragraph>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setBindModalVisible(true)}
            >
              绑定第一个账号
            </Button>
          </div>
        ) : (
          <Table columns={columns} dataSource={accounts} rowKey="id" pagination={false} />
        )}
      </Card>

      {/* 绑定账号弹窗 */}
      <BindAccountModal
        visible={bindModalVisible}
        onClose={() => {
          setBindModalVisible(false);
          resetBindState();
        }}
        platforms={[
          { id: 'douyin', name: '抖音', icon: '🎵' },
          { id: 'kuaishou', name: '快手', icon: '📹' },
          { id: 'xiaohongshu', name: '小红书', icon: '📕' },
          { id: 'weibo', name: '微博', icon: '🌐' },
          { id: 'boss', name: 'BOSS直聘', icon: '💼' },
        ]}
        selectedPlatform={selectedPlatform}
        qrcodeImage={qrcodeImage}
        sessionStatus={sessionStatus}
        onSelectPlatform={handleBind}
        onSimulateScan={async () => {
          if (sessionId) {
            await request.post(`/social/session/${sessionId}/scan`);
            setSessionStatus('scanning');
          }
        }}
        onSimulateConfirm={async () => {
          if (sessionId) {
            await request.post(`/social/session/${sessionId}/confirm`);
            setSessionStatus('confirmed');
          }
        }}
        loading={!qrcodeImage && selectedPlatform !== null}
      />
    </div>
  );
}

// 绑定账号弹窗组件
interface BindModalProps {
  visible: boolean;
  onClose: () => void;
  platforms: { id: string; name: string; icon: string }[];
  selectedPlatform: string | null;
  qrcodeImage: string | null;
  sessionStatus: string;
  onSelectPlatform: (platform: string) => void;
  onSimulateScan: () => void;
  onSimulateConfirm: () => void;
  loading: boolean;
}

function BindAccountModal({
  visible,
  onClose,
  platforms,
  selectedPlatform,
  qrcodeImage,
  sessionStatus,
  onSelectPlatform,
  onSimulateScan,
  onSimulateConfirm,
  loading,
}: BindModalProps) {
  const getStatusText = () => {
    switch (sessionStatus) {
      case 'pending':
        return '等待扫码';
      case 'scanning':
        return '已扫码，等待确认';
      case 'confirmed':
        return '已确认，正在登录...';
      case 'success':
        return '登录成功';
      case 'failed':
        return '登录失败';
      default:
        return sessionStatus;
    }
  };

  return (
    <Modal
      title="绑定社交账号"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <div style={{ textAlign: 'center' }}>
        {!selectedPlatform ? (
          <>
            <Paragraph>选择要绑定的平台</Paragraph>
            <Row gutter={[12, 12]}>
              {platforms.map(p => (
                <Col span={8} key={p.id}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => onSelectPlatform(p.id)}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{p.icon}</div>
                    <div>{p.name}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        ) : !qrcodeImage ? (
          <div style={{ padding: 40 }}>
            <Text type="secondary">正在准备授权...</Text>
          </div>
        ) : (
          <>
            <Paragraph>
              请使用<Text strong>{platforms.find(p => p.id === selectedPlatform)?.name}</Text>
              扫码绑定
            </Paragraph>
            <div
              style={{
                background: '#f5f5f5',
                padding: 20,
                borderRadius: 8,
                display: 'inline-block',
              }}
            >
              <img src={qrcodeImage} alt="二维码" style={{ width: 200, height: 200 }} />
            </div>
            <div style={{ margin: '16px 0' }}>
              <Tag
                color={
                  sessionStatus === 'pending'
                    ? 'blue'
                    : sessionStatus === 'scanning'
                      ? 'orange'
                      : sessionStatus === 'confirmed' || sessionStatus === 'success'
                        ? 'green'
                        : 'red'
                }
              >
                {getStatusText()}
              </Tag>
            </div>
            <Space>
              <Button size="small" onClick={onSimulateScan} disabled={sessionStatus !== 'pending'}>
                模拟扫码
              </Button>
              <Button
                size="small"
                onClick={onSimulateConfirm}
                disabled={sessionStatus !== 'scanning'}
              >
                模拟确认
              </Button>
              <Button size="small" onClick={onClose}>
                取消
              </Button>
            </Space>
          </>
        )}
      </div>
    </Modal>
  );
}
