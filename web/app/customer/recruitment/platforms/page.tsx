'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  QRCode,
  Spin,
  message,
  Empty,
  Tabs,
  Tag,
  Space,
  Typography,
} from 'antd';
import {
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  WeiboSquareFilled,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  authUrl: string;
}

interface BoundAccount {
  platform: string;
  accountName: string;
  boundAt: string;
  status: 'active' | 'expired';
}

const platforms: Platform[] = [
  {
    id: 'boss',
    name: 'Boss直聘',
    icon: <span style={{ fontSize: 32, color: '#00C777' }}>B</span>,
    color: '#00C777',
    authUrl: '/api/oauth/boss/initiate',
  },
  {
    id: 'zhilian',
    name: '智联招聘',
    icon: <span style={{ fontSize: 32, color: '#0066CC' }}>Z</span>,
    color: '#0066CC',
    authUrl: '/api/oauth/zhilian/initiate',
  },
  {
    id: '51job',
    name: '前程无忧',
    icon: <span style={{ fontSize: 32, color: '#FF6000' }}>5</span>,
    color: '#FF6000',
    authUrl: '/api/oauth/51job/initiate',
  },
  {
    id: 'lagou',
    name: '拉勾招聘',
    icon: <span style={{ fontSize: 32, color: '#1DC6B1' }}>L</span>,
    color: '#1DC6B1',
    authUrl: '/api/oauth/lagou/initiate',
  },
];

// 已绑定账号从 API 获取
const fetchBoundAccounts = async (): Promise<BoundAccount[]> => {
  try {
    const { default: api } = await import('@/services/api');
    const res = await api.get('/social/accounts', { type: 'recruitment' });
    const data = Array.isArray(res) ? res : (res?.data || []);
    return data.map((a: any) => ({
      platform: a.platform,
      accountName: a.accountName || a.nickname || a.username || '',
      boundAt: a.createdAt || a.boundAt || '',
      status: a.status === 'active' ? 'active' : 'expired',
    }));
  } catch {
    return [];
  }
};

export default function RecruitmentPlatforms() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [boundAccounts, setBoundAccounts] = useState<BoundAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // 加载已绑定账号
  useState(() => {
    fetchBoundAccounts().then(accounts => {
      setBoundAccounts(accounts);
      setAccountsLoading(false);
    });
  });

  const handleBindAccount = async (platform: Platform) => {
    setSelectedPlatform(platform);
    setLoading(true);
    setQrCodeUrl('');

    try {
      // 调用后端获取二维码
      const { default: api } = await import('@/services/api');
      const res = await api.post('/oauth/initiate', { platform: platform.id, type: 'recruitment' });
      const qrData = res?.data || res;
      if (qrData?.qrCodeUrl || qrData?.qrCode) {
        setQrCodeUrl(qrData.qrCodeUrl || qrData.qrCode);
      } else if (qrData?.loginUrl) {
        setQrCodeUrl(qrData.loginUrl);
      } else {
        // 后端未返回二维码URL时显示登录页面URL
        setQrCodeUrl(platform.authUrl);
      }
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`recruitment_auth_${platform.id}_${Date.now()}`)}`
      );
    } catch (error) {
      message.error('获取授权二维码失败');
    } finally {
      setLoading(false);
      setModalVisible(true);
    }
  };

  const handleUnbind = (platform: string) => {
    Modal.confirm({
      title: '确认解绑',
      content: '确定要解绑该招聘平台账号吗？解绑后自动发布和沟通功能将暂停。',
      okText: '确认解绑',
      cancelText: '取消',
      onOk: () => {
        setBoundAccounts(prev => prev.filter(acc => acc.platform !== platform));
        message.success('已解绑');
      },
    });
  };

  const getPlatformInfo = (platformId: string) => platforms.find(p => p.id === platformId);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={4}>招聘平台授权</Title>
      <Text type="secondary">
        绑定招聘平台账号后，系统将自动帮您发布职位、筛选简历、与候选人沟通
      </Text>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* 已绑定账号 */}
        <Col span={24}>
          <Card title="已绑定的招聘平台" style={{ marginBottom: 24 }}>
            {boundAccounts.length === 0 ? (
              <Empty description="暂无绑定的招聘平台" />
            ) : (
              <Row gutter={16}>
                {boundAccounts.map(account => {
                  const platform = getPlatformInfo(account.platform);
                  return (
                    <Col span={8} key={account.platform}>
                      <Card
                        size="small"
                        style={{
                          borderColor: platform?.color,
                          background: `${platform?.color}10`,
                        }}
                        actions={[
                          <Button type="link" danger onClick={() => handleUnbind(account.platform)}>
                            解绑
                          </Button>,
                        ]}
                      >
                        <Card.Meta
                          avatar={<div style={{ color: platform?.color }}>{platform?.icon}</div>}
                          title={platform?.name}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{account.accountName}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                绑定于 {account.boundAt}
                              </Text>
                            </Space>
                          }
                        />
                        <Tag
                          color={account.status === 'active' ? 'green' : 'red'}
                          style={{ marginTop: 8 }}
                        >
                          {account.status === 'active' ? (
                            <>
                              <CheckCircleOutlined /> 正常
                            </>
                          ) : (
                            <>
                              <ExclamationCircleOutlined /> 已过期
                            </>
                          )}
                        </Tag>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>

        {/* 可绑定的平台 */}
        <Col span={24}>
          <Card title="添加招聘平台">
            <Row gutter={[24, 24]}>
              {platforms.map(platform => (
                <Col span={6} key={platform.id}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', borderColor: '#f0f0f0' }}
                    cover={
                      <div style={{ padding: '40px 0', background: `${platform.color}10` }}>
                        <div style={{ color: platform.color }}>{platform.icon}</div>
                        <div style={{ marginTop: 12, fontWeight: 500, color: '#333' }}>
                          {platform.name}
                        </div>
                      </div>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {boundAccounts.some(acc => acc.platform === platform.id) ? (
                        <Tag color="green">已绑定</Tag>
                      ) : (
                        <Button
                          type="primary"
                          onClick={() => handleBindAccount(platform)}
                          style={{ background: platform.color, borderColor: platform.color }}
                        >
                          扫码授权
                        </Button>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 功能说明 */}
      <Card title="授权说明" style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col span={8}>
            <Title level={5}>
              <EnvironmentOutlined /> 自动发布职位
            </Title>
            <Text type="secondary">
              绑定平台后，可一键将职位发布到多个招聘平台，无需手动登录各个平台
            </Text>
          </Col>
          <Col span={8}>
            <Title level={5}>
              <EnvironmentOutlined /> 智能简历筛选
            </Title>
            <Text type="secondary">AI自动分析简历与职位的匹配度，筛选优质候选人</Text>
          </Col>
          <Col span={8}>
            <Title level={5}>
              <EnvironmentOutlined /> 自动沟通候选人
            </Title>
            <Text type="secondary">设置智能话术，自动与候选人沟通，解答疑问，提高回复效率</Text>
          </Col>
        </Row>
      </Card>

      {/* 扫码授权弹窗 */}
      <Modal
        title={`扫码授权 - ${selectedPlatform?.name}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin spinning={loading}>
            {qrCodeUrl ? (
              <>
                <QRCode value={qrCodeUrl} size={200} />
                <div style={{ marginTop: 16 }}>
                  <Text>请使用 {selectedPlatform?.name} App 扫码授权</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    二维码有效期为5分钟，请尽快扫码
                  </Text>
                </div>
              </>
            ) : (
              <div style={{ width: 200, height: 200, margin: '0 auto', background: '#f5f5f5' }} />
            )}
          </Spin>
        </div>
      </Modal>
    </div>
  );
}
