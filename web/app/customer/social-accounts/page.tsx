'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Spin,
  message,
  Table,
  Tag,
  Space,
  Empty,
  Typography,
  Popconfirm,
} from 'antd';
import {
  MobileOutlined,
  WeiboOutlined,
  YoutubeOutlined,
  QrcodeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

// 平台配置
const PLATFORMS = [
  { id: 'douyin', name: '抖音', color: '#fe2c55', icon: '🎵' },
  { id: 'kuaishou', name: '快手', color: '#ff4906', icon: '📹' },
  { id: 'xiaohongshu', name: '小红书', color: '#ff2442', icon: '📕' },
  { id: 'weibo', name: '微博', color: '#e6162d', icon: '🌐' },
  { id: 'channels', name: '视频号', color: '#07c160', icon: '📱' },
  { id: 'boss', name: 'BOSS直聘', color: '#00be76', icon: '💼' },
  { id: 'liepin', name: '前程无忧', color: '#ff6633', icon: '📋' },
  { id: 'zhilian', name: '智联招聘', color: '#00b42a', icon: '📊' },
];

interface SocialAccount {
  id: string;
  platform: string;
  platformName: string;
  accountName: string;
  avatar?: string;
  status: string;
  lastSyncTime?: string;
}

interface QrcodeSession {
  sessionId: string;
  qrcodeImage: string;
  platformName: string;
}

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrSession, setQrSession] = useState<QrcodeSession | null>(null);
  const [qrPolling, setQrPolling] = useState(false);
  const [qrStatus, setQrStatus] = useState<'waiting' | 'scanned' | 'success' | 'expired'>(
    'waiting'
  );

  // 加载已绑定的账号
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await request.get('/api/social/accounts');
      if (res.code === 0) {
        setAccounts(res.data || []);
      }
    } catch (error) {
      console.error('加载账号失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // 生成二维码
  const generateQrcode = async (platform: string) => {
    try {
      const res = await request.post('/api/social/session/create', {
        platform,
        userId: 'current-user',
      });

      if (res.code === 0) {
        const platformInfo = PLATFORMS.find(p => p.id === platform);
        setQrSession({
          sessionId: res.data.sessionId,
          qrcodeImage: res.data.qrcodeImage,
          platformName: platformInfo?.name || platform,
        });
        setQrModalVisible(true);
        setQrStatus('waiting');
        setQrPolling(true);
      } else {
        message.error('生成二维码失败');
      }
    } catch (error) {
      message.error('生成二维码失败');
    }
  };

  // 轮询二维码状态
  useEffect(() => {
    if (!qrSession || !qrPolling) return;

    const pollStatus = async () => {
      try {
        const res = await request.get(`/api/social/session/${qrSession.sessionId}/status`);

        if (res.code === 0) {
          const status = res.data.status;
          setQrStatus(status);

          if (status === 'success') {
            setQrPolling(false);
            message.success('登录成功！');
            setTimeout(() => {
              setQrModalVisible(false);
              loadAccounts();
            }, 1500);
          } else if (status === 'expired') {
            setQrPolling(false);
            message.error('二维码已过期，请重新生成');
          }
        } else if (res.code === 404) {
          setQrStatus('expired');
          setQrPolling(false);
        }
      } catch (error) {
        console.error('轮询状态失败:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [qrSession, qrPolling]);

  // 解绑账号
  const unbindAccount = async (accountId: string) => {
    try {
      const res = await request.delete(`/api/social/accounts/${accountId}`);
      if (res.code === 0) {
        message.success('解绑成功');
        loadAccounts();
      } else {
        message.error('解绑失败');
      }
    } catch (error) {
      message.error('解绑失败');
    }
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platformName',
      key: 'platform',
      render: (text: string, record: SocialAccount) => {
        const platform = PLATFORMS.find(p => p.name === text);
        return (
          <Space>
            <span style={{ fontSize: 20 }}>{platform?.icon}</span>
            <span>{text}</span>
          </Space>
        );
      },
    },
    {
      title: '账号',
      dataIndex: 'accountName',
      key: 'accountName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '已连接' : '未连接'}
        </Tag>
      ),
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
      render: (_: any, record: SocialAccount) => (
        <Popconfirm
          title="确定要解绑此账号吗？"
          onConfirm={() => unbindAccount(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            解绑
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>社交账号管理</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        连接你的社交媒体和招聘平台账号，实现自动化运营
      </Text>

      {/* 平台选择卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {PLATFORMS.map(platform => {
          const isBound = accounts.some(a => a.platform === platform.id);
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={platform.id}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderColor: isBound ? platform.color : undefined,
                  opacity: isBound ? 0.7 : 1,
                }}
                onClick={() => !isBound && generateQrcode(platform.id)}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>{platform.icon}</div>
                <div style={{ fontWeight: 500 }}>{platform.name}</div>
                {isBound && (
                  <Tag color="green" style={{ marginTop: 8 }}>
                    <CheckCircleOutlined /> 已连接
                  </Tag>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 已绑定账号列表 */}
      <Card title="已连接的账号">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : accounts.length > 0 ? (
          <Table columns={columns} dataSource={accounts} rowKey="id" pagination={false} />
        ) : (
          <Empty description="暂无已连接的账号" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 二维码登录弹窗 */}
      <Modal
        title={`扫码登录 ${qrSession?.platformName || ''}`}
        open={qrModalVisible}
        onCancel={() => {
          setQrModalVisible(false);
          setQrPolling(false);
        }}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {qrSession?.qrcodeImage ? (
            <div style={{ marginBottom: 20 }}>
              <img
                src={qrSession.qrcodeImage}
                alt="登录二维码"
                style={{ width: 200, height: 200 }}
              />
            </div>
          ) : (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          )}

          <div style={{ marginTop: 16 }}>
            {qrStatus === 'waiting' && (
              <>
                <QrcodeOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
                <Text>请使用{qrSession?.platformName}APP扫码登录</Text>
              </>
            )}
            {qrStatus === 'scanned' && (
              <>
                <LoadingOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 8 }} />
                <Text type="secondary">请在手机上确认登录</Text>
              </>
            )}
            {qrStatus === 'success' && (
              <>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 8 }} />
                <Text type="success">登录成功！</Text>
              </>
            )}
            {qrStatus === 'expired' && (
              <>
                <Text type="danger">二维码已过期</Text>
                <br />
                <Button
                  type="primary"
                  onClick={() => generateQrcode(qrSession?.platformName || '')}
                >
                  重新生成
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
