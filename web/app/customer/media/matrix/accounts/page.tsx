'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Typography,
  Statistic,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SyncOutlined,
  UserOutlined
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;

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
  expiresAt?: string;
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
  lagou: '#00b42a',
  zhipin: '#1f8efa'
};

export default function MatrixAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [unbindLoading, setUnbindLoading] = useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = useState<string | null>(null);
  const [userId] = useState('default-user'); // TODO: 从上下文获取

  useEffect(() => {
    fetchAccounts();
    fetchStats();
  }, [userId]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await request.get('/social/accounts', {
        params: { userId }
      });
      if (res.code === 0) {
        setAccounts(res.data);
      }
    } catch (error) {
      console.error('获取账号列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await request.get('/social/accounts/stats', {
        params: { userId }
      });
      if (res.code === 0) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const handleUnbind = async (accountId: string) => {
    Modal.confirm({
      title: '确认解绑',
      content: '确定要解绑该账号吗？解绑后将无法使用该账号进行发布操作。',
      okText: '确认解绑',
      okType: 'danger',
      onOk: async () => {
        setUnbindLoading(accountId);
        try {
          const res = await request.delete(`/social/accounts/${accountId}`);
          if (res.code === 0) {
            message.success('解绑成功');
            fetchAccounts();
            fetchStats();
          } else {
            message.error(res.message || '解绑失败');
          }
        } catch (error) {
          message.error('解绑失败');
        } finally {
          setUnbindLoading(null);
        }
      }
    });
  };

  const handleRefresh = async (accountId: string) => {
    setRefreshLoading(accountId);
    try {
      const res = await request.post(`/social/accounts/${accountId}/refresh`);
      if (res.code === 0) {
        message.success('刷新成功');
        fetchAccounts();
      } else {
        message.error(res.message || '刷新失败');
      }
    } catch (error) {
      message.error('刷新失败');
    } finally {
      setRefreshLoading(null);
    }
  };

  const handleBindSuccess = () => {
    setBindModalVisible(false);
    fetchAccounts();
    fetchStats();
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string, record: Account) => (
        <Space>
          <span style={{ fontSize: 20 }}>📱</span>
          <div>
            <div style={{ fontWeight: 500 }}>{record.platformName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.accountId}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '账号信息',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (name: string, record: Account) => (
        <Space>
          {record.avatar ? (
            <img src={record.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserOutlined />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            {record.fans !== undefined && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                粉丝: {record.fans > 10000 ? `${(record.fans / 10000).toFixed(1)}w` : record.fans}
              </Text>
            )}
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '正常' },
          expired: { color: 'orange', text: '已过期' },
          error: { color: 'red', text: '异常' }
        };
        const { color, text } = statusMap[status as keyof typeof statusMap] || statusMap.error;
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncTime',
      key: 'lastSyncTime',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Account) => (
        <Space>
          <Button
            type="link"
            icon={<SyncOutlined />}
            loading={refreshLoading === record.id}
            onClick={() => handleRefresh(record.id)}
            disabled={record.status === 'expired'}
          >
            刷新
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            loading={unbindLoading === record.id}
            onClick={() => handleUnbind(record.id)}
          >
            解绑
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>📱 矩阵账号管理</Title>
        <Text type="secondary">绑定和管理你的社交媒体账号，用于内容发布和数据分析</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总账号数" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="正常账号" value={stats?.active || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已过期" value={stats?.expired || 0} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平台覆盖"
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : accounts.length === 0 ? (
          <Empty description="暂未绑定任何账号" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setBindModalVisible(true)}>
              绑定第一个账号
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={accounts}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      {/* 绑定账号弹窗 */}
      <BindAccountModal
        visible={bindModalVisible}
        onClose={() => setBindModalVisible(false)}
        onSuccess={handleBindSuccess}
        userId={userId}
      />
    </div>
  );
}

// 绑定账号弹窗组件
interface BindModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

function BindAccountModal({ visible, onClose, onSuccess, userId }: BindModalProps) {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrcodeImage, setQrcodeImage] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchPlatforms();
    } else {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setSelectedPlatform(null);
    setSessionId(null);
    setQrcodeImage(null);
    setSessionStatus('pending');
    setLoading(false);
    setLoginLoading(false);
  };

  const fetchPlatforms = async () => {
    try {
      const res = await request.get('/social/platforms');
      if (res.code === 0) {
        setPlatforms(res.data);
      }
    } catch (error) {
      console.error('获取平台列表失败:', error);
    }
  };

  const handleSelectPlatform = async (platform: string) => {
    setSelectedPlatform(platform);
    setLoading(true);
    
    try {
      const res = await request.post('/social/session/create', {
        platform,
        userId
      });
      
      if (res.code === 0) {
        setSessionId(res.data.sessionId);
        setQrcodeImage(res.data.qrcodeImage);
        setSessionStatus('pending');
        
        // 开始轮询状态
        pollSessionStatus(res.data.sessionId);
      } else {
        message.error(res.message || '创建会话失败');
      }
    } catch (error) {
      message.error('创建会话失败');
    } finally {
      setLoading(false);
    }
  };

  const pollSessionStatus = (sid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await request.get(`/social/session/${sid}/status`);
        if (res.code === 0) {
          setSessionStatus(res.data.status);
          
          if (res.data.status === 'confirmed') {
            // 开始登录
            clearInterval(interval);
            handleLogin(sid);
          } else if (res.data.status === 'failed') {
            clearInterval(interval);
            message.error('登录失败，请重新扫码');
          }
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleLogin = async (sid: string) => {
    setLoginLoading(true);
    
    try {
      const res = await request.post(`/social/session/${sid}/login`);
      
      if (res.code === 0) {
        message.success('绑定成功！');
        onSuccess();
      } else {
        message.error(res.message || '登录失败');
        setSessionStatus('failed');
      }
    } catch (error) {
      message.error('登录失败');
      setSessionStatus('failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSimulateScan = async () => {
    if (!sessionId) return;
    
    try {
      await request.post(`/social/session/${sessionId}/scan`);
      setSessionStatus('scanning');
    } catch (error) {
      console.error('扫码模拟失败:', error);
    }
  };

  const handleSimulateConfirm = async () => {
    if (!sessionId || sessionStatus !== 'scanning') return;
    
    try {
      await request.post(`/social/session/${sessionId}/confirm`);
      setSessionStatus('confirmed');
    } catch (error) {
      console.error('确认模拟失败:', error);
    }
  };

  const getStatusText = () => {
    switch (sessionStatus) {
      case 'pending': return '等待扫码';
      case 'scanning': return '已扫码，等待确认';
      case 'confirmed': return '已确认，正在登录...';
      case 'success': return '登录成功';
      case 'failed': return '登录失败';
      default: return sessionStatus;
    }
  };

  return (
    <Modal
      title="绑定社交账号"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div style={{ textAlign: 'center' }}>
        {!selectedPlatform ? (
          // 平台选择
          <>
            <Title level={5}>选择要绑定的平台</Title>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {platforms.map(platform => (
                <Col span={8} key={platform.id}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center' }}
                    onClick={() => handleSelectPlatform(platform.id)}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                      {platform.icon || '📱'}
                    </div>
                    <div>{platform.name}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        ) : !qrcodeImage ? (
          // 加载中
          <div style={{ padding: 40 }}>
            <Spin size="large" tip="准备中..." />
          </div>
        ) : (
          // 二维码
          <>
            <Title level={5}>
              打开{platforms.find(p => p.id === selectedPlatform)?.name}扫码绑定
            </Title>
            
            <div style={{
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              display: 'inline-block',
              margin: '16px 0'
            }}>
              <img src={qrcodeImage} alt="二维码" style={{ width: 200, height: 200 }} />
            </div>
            
            <div style={{ margin: '16px 0' }}>
              <Tag color={sessionStatus === 'pending' ? 'blue' : 
                         sessionStatus === 'scanning' ? 'orange' :
                         sessionStatus === 'confirmed' || sessionStatus === 'success' ? 'green' : 'red'}>
                {getStatusText()}
              </Tag>
            </div>
            
            {/* 演示按钮：实际使用时会被真实扫码替代 */}
            <div style={{ marginTop: 16 }}>
              <Space>
                <Button onClick={handleSimulateScan} disabled={sessionStatus !== 'pending'}>
                  模拟扫码
                </Button>
                <Button onClick={handleSimulateConfirm} disabled={sessionStatus !== 'scanning'}>
                  模拟确认
                </Button>
                <Button onClick={() => setSelectedPlatform(null)}>
                  返回
                </Button>
              </Space>
            </div>
            
            {loginLoading && (
              <div style={{ marginTop: 16 }}>
                <Spin tip="正在登录并绑定账号..." />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
