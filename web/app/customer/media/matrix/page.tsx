'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Spin,
  Alert,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  SyncOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  MobileOutlined,
  GlobalOutlined,
  TeamOutlined,
  FundViewOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import request from '@/utils/request';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

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

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  status: 'coming' | 'available';
}

// 支持的平台列表（当前可用）
const platforms: Platform[] = [
  { id: 'douyin', name: '抖音', icon: '🎵', color: '#fe2c55', description: '短视频创作与分享', status: 'available' },
  { id: 'kuaishou', name: '快手', icon: '📹', color: '#ff4906', description: '老铁文化短视频社区', status: 'available' },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', color: '#ff2442', description: '种草社区与生活方式', status: 'available' },
  { id: 'channels', name: '视频号', icon: '💬', color: '#07c160', description: '微信生态短视频', status: 'available' },
  { id: 'weibo', name: '微博', icon: '🌐', color: '#e6162d', description: '社交媒体资讯平台', status: 'coming' },
  { id: 'bili', name: '哔哩哔哩', icon: '📺', color: '#00a1d6', description: '年轻人文化社区', status: 'coming' },
  { id: 'toutiao', name: '今日头条', icon: '📰', color: '#ff6900', description: '个性化资讯平台', status: 'coming' },
  { id: 'zhihu', name: '知乎', icon: '💬', color: '#0084ff', description: '知识问答社区', status: 'coming' },
];

export default function MatrixManagementPage() {
  const { user } = useAuth();
  const userId = user?.id || 'default';
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [bindStep, setBindStep] = useState<'select' | 'scan' | 'success'>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrcodeImage, setQrcodeImage] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('pending');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [userId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, statsRes] = await Promise.all([
        request.get('/social/accounts', { params: { userId } }),
        request.get('/social/accounts/stats', { params: { userId } }),
      ]);

      if (accountsRes.code === 0) {
        setAccounts(accountsRes.data || []);
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
        {
          id: '2',
          platform: 'xiaohongshu',
          platformName: '小红书',
          accountId: 'xhs456',
          accountName: 'AI创作助手',
          fans: 8650,
          status: 'active',
          lastSyncTime: new Date().toISOString(),
        },
      ]);
      setStats({
        total: 2,
        active: 2,
        expired: 0,
        byPlatform: { douyin: 1, xiaohongshu: 1 },
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleOpenBindModal = () => {
    setBindStep('select');
    setBindModalVisible(true);
  };

  const handleSelectPlatform = async (platform: Platform) => {
    if (platform.status === 'coming') {
      message.info(`${platform.name} 即将上线，敬请期待`);
      return;
    }

    setSelectedPlatform(platform);
    setBindStep('scan');

    try {
      const res = await request.post('/oauth/sessions', { platform: platform.id });
      
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
        setQrcodeImage(res.data.qrcodeUrl);
        setSessionStatus('pending');
        
        // 开始轮询授权状态
        startPolling(res.data.sessionId);
      } else {
        message.error(res.error || '创建授权会话失败');
        setBindStep('select');
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      message.error('创建授权会话失败');
      setBindStep('select');
    }
  };

  const startPolling = (sid: string) => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const interval = setInterval(async () => {
      try {
        const res = await request.get(`/oauth/sessions/${sid}`);
        
        if (res.success && res.data) {
          const { status, accountInfo } = res.data;
          setSessionStatus(status);

          if (status === 'confirmed') {
            clearInterval(interval);
            setBindStep('success');
            message.success('授权成功！');
            setTimeout(() => {
              handleCloseBindModal();
              fetchData();
            }, 1500);
          } else if (status === 'expired' || status === 'failed') {
            clearInterval(interval);
            message.error(status === 'expired' ? '授权已过期，请重新扫码' : '授权失败，请重试');
          }
        }
      } catch (error) {
        console.error('轮询状态失败:', error);
      }
    }, 2000);
    
    setPollingInterval(interval);
  };

  const handleCloseBindModal = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setBindModalVisible(false);
    setBindStep('select');
    setSelectedPlatform(null);
    setSessionId(null);
    setQrcodeImage(null);
    setSessionStatus('pending');
  };

  const handleRefreshAccount = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      const res = await request.post(`/oauth/accounts/${accountId}/refresh`);
      if (res.success) {
        message.success('刷新成功');
        fetchData();
      } else {
        message.error(res.error || '刷新失败');
      }
    } catch (error) {
      message.error('刷新失败');
    } finally {
      setSyncingId(null);
    }
  };

  const handleUnbind = async (accountId: string) => {
    try {
      const res = await request.delete(`/social/accounts/${accountId}`);
      if (res.code === 0) {
        message.success('解绑成功');
        fetchData();
      } else {
        message.error(res.message || '解绑失败');
      }
    } catch (error) {
      message.error('解绑失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      active: { color: 'success', text: '正常', icon: <CheckCircleOutlined /> },
      expired: { color: 'warning', text: '已过期', icon: <ClockCircleOutlined /> },
      error: { color: 'error', text: '异常', icon: <CloseCircleOutlined /> },
    };
    const config = statusMap[status] || statusMap.error;
    return <Badge color={config.color} text={<Space size={4}>{config.icon}{config.text}</Space>} />;
  };

  const columns = [
    {
      title: '平台账号',
      key: 'platform',
      render: (_: any, record: Account) => (
        <Space>
          <Avatar 
            size={40} 
            src={record.avatar} 
            icon={<span style={{ fontSize: 20 }}>{platforms.find(p => p.id === record.platform)?.icon || '📱'}</span>}
            style={{ backgroundColor: platforms.find(p => p.id === record.platform)?.color }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              <Space>
                {record.platformName}
                {getStatusBadge(record.status)}
              </Space>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.accountName || record.accountId}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '粉丝数',
      dataIndex: 'fans',
      key: 'fans',
      render: (fans: number) => fans ? (
        <Text strong style={{ color: '#1890ff' }}>{fans.toLocaleString()}</Text>
      ) : '-',
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncTime',
      key: 'lastSyncTime',
      render: (time: string) => time ? (
        <Text type="secondary">{new Date(time).toLocaleString()}</Text>
      ) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Account) => (
        <Space>
          <Tooltip title="刷新账号状态">
            <Button 
              type="text" 
              icon={<SyncOutlined spin={syncingId === record.id} />} 
              onClick={() => handleRefreshAccount(record.id)}
              disabled={syncingId === record.id}
            />
          </Tooltip>
          <Popconfirm
            title="确认解绑此账号？"
            description="解绑后需要重新授权才能使用"
            onConfirm={() => handleUnbind(record.id)}
            okText="确认解绑"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              解绑
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          📱 矩阵账号管理
        </Title>
        <Text type="secondary">一站式管理多平台社交账号，实现内容统一发布和数据分析</Text>
      </div>

      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="绑定账号" value={stats?.total || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="正常账号"
              value={stats?.active || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="已过期"
              value={stats?.expired || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="覆盖平台"
              value={Object.keys(stats?.byPlatform || {}).length}
              suffix="个"
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 账号列表 */}
      <Card
        title="已绑定的账号"
        loading={loading}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenBindModal}>
            绑定新账号
          </Button>
        }
      >
        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <QrcodeOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Title level={5} type="secondary" style={{ marginTop: 16 }}>
              还没有绑定任何账号
            </Title>
            <Paragraph type="secondary">
              点击上方「绑定新账号」开始添加你的社交媒体账号
            </Paragraph>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenBindModal}>
              立即绑定
            </Button>
          </div>
        ) : (
          <Table 
            dataSource={accounts} 
            columns={columns} 
            rowKey="id" 
            pagination={false}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* 支持的平台 */}
      <Card title="支持的平台" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          {platforms.map(platform => (
            <Col span={6} key={platform.id}>
              <Card
                hoverable={platform.status === 'available'}
                style={{ 
                  textAlign: 'center',
                  borderColor: selectedPlatform?.id === platform.id ? platform.color : undefined,
                  opacity: platform.status === 'coming' ? 0.6 : 1,
                }}
                onClick={() => {
                  if (platform.status === 'available') {
                    setSelectedPlatform(platform);
                    handleSelectPlatform(platform);
                  }
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>{platform.icon}</div>
                <Title level={5}>{platform.name}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>{platform.description}</Text>
                {platform.status === 'coming' && (
                  <Tag color="default" style={{ marginTop: 8 }}>即将上线</Tag>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 绑定账号弹窗 */}
      <Modal
        title={bindStep === 'select' ? '选择要绑定的平台' : bindStep === 'scan' ? `授权 ${selectedPlatform?.name}` : '授权成功'}
        open={bindModalVisible}
        onCancel={handleCloseBindModal}
        footer={null}
        width={450}
        destroyOnClose
      >
        {bindStep === 'select' && (
          <div>
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              选择要绑定的社交媒体平台，扫码即可完成授权
            </Paragraph>
            <Row gutter={[16, 16]}>
              {platforms.filter(p => p.status === 'available').map(platform => (
                <Col span={8} key={platform.id}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center' }}
                    onClick={() => handleSelectPlatform(platform)}
                  >
                    <div style={{ fontSize: 36 }}>{platform.icon}</div>
                    <Text strong>{platform.name}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {bindStep === 'scan' && (
          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ 
                background: '#f5f5f5', 
                padding: 24, 
                borderRadius: 8,
                position: 'relative'
              }}>
                {qrcodeImage ? (
                  <img 
                    src={qrcodeImage} 
                    alt="授权二维码" 
                    style={{ width: 200, height: 200 }} 
                    onError={(e) => {
                      console.error('[Matrix] 图片加载失败，尝试 blob URL');
                      // 如果 base64 图片加载失败，尝试转换为 blob URL
                      try {
                        const base64Data = qrcodeImage.split(',')[1];
                        const byteCharacters = atob(base64Data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'image/png' });
                        const blobUrl = URL.createObjectURL(blob);
                        (e.target as HTMLImageElement).src = blobUrl;
                      } catch (err) {
                        console.error('[Matrix] Blob 转换失败:', err);
                      }
                    }}
                  />
                ) : (
                  <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin size="large" />
                  </div>
                )}
                
                {sessionStatus === 'scanning' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                  }}>
                    <Space direction="vertical">
                      <Spin size="large" />
                      <Text>正在确认授权...</Text>
                    </Space>
                  </div>
                )}
              </div>

              <div>
                <Space>
                  <ScanOutlined style={{ fontSize: 24, color: selectedPlatform?.color }} />
                  <div style={{ textAlign: 'left' }}>
                    <Text strong>打开 {selectedPlatform?.name} App</Text>
                    <br />
                    <Text type="secondary">扫描左侧二维码完成授权</Text>
                  </div>
                </Space>
              </div>

              {sessionStatus === 'pending' && (
                <Alert
                  type="info"
                  showIcon
                  icon={<ClockCircleOutlined />}
                  message="二维码有效期10分钟"
                  description="请在有效期内完成扫码授权"
                />
              )}

              <Button onClick={() => setBindStep('select')} block>
                返回选择其他平台
              </Button>
            </Space>
          </div>
        )}

        {bindStep === 'success' && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <Title level={4} style={{ marginTop: 16 }}>授权成功！</Title>
            <Paragraph type="secondary">
              {selectedPlatform?.name} 账号已成功绑定
            </Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
}
