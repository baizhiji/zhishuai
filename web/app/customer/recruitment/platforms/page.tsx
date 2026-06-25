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
  QrcodeOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
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
  },
  {
    id: 'zhilian',
    name: '智联招聘',
    icon: <span style={{ fontSize: 32, color: '#0066CC' }}>Z</span>,
    color: '#0066CC',
  },
  {
    id: 'liepin',
    name: '猎聘',
    icon: <span style={{ fontSize: 32, color: '#FF6000' }}>L</span>,
    color: '#FF6000',
  },
  {
    id: 'lagou',
    name: '拉勾招聘',
    icon: <span style={{ fontSize: 32, color: '#1DC6B1' }}>L</span>,
    color: '#1DC6B1',
  },
];

// 已绑定账号从 API 获取
const fetchBoundAccounts = async (): Promise<BoundAccount[]> => {
  try {
    // V5修复：使用正确的 request 模块
    const request = (await import('@/utils/request')).default;
    const res = await request.get('/social/accounts', { params: { type: 'recruitment' } });
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
  const [qrMethod, setQrMethod] = useState<string>('popup');
  const [popupUrl, setPopupUrl] = useState('');
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
    setPopupUrl('');

    try {
      const request = (await import('@/utils/request')).default;
      const res = await request.post('/oauth/sessions', { platform: platform.id });
      
      console.log('[Recruitment] 授权响应:', JSON.stringify(res).substring(0, 500));
      
      if (res.success && res.data) {
        const method = res.data.qrMethod || 'popup';
        setQrMethod(method);
        
        if (method === 'popup') {
          // V7 popup方式：打开新窗口
          const url = res.data.popupUrl || res.data.qrcodeUrl || '';
          setPopupUrl(url);
          setQrCodeUrl('');
          window.open(url, '_blank', 'width=800,height=600');
        } else {
          // V7 API方式：直接显示二维码图片
          setQrCodeUrl(res.data.qrcodeUrl);
          setPopupUrl('');
        }
        setModalVisible(true);
      } else {
        message.error(res.error || res.message || '获取授权二维码失败');
        setModalVisible(false);
      }
    } catch (error: any) {
      console.error('[Recruitment] 授权请求失败:', error);
      message.error(error?.response?.data?.error || error?.message || '获取授权二维码失败');
      setModalVisible(false);
    } finally {
      setLoading(false);
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
        width={450}
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin spinning={loading}>
            {(qrMethod === 'popup' && popupUrl) || qrCodeUrl ? (
              <>
                {/* 平台图标和名称 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{selectedPlatform?.icon}</div>
                  <Title level={4} style={{ margin: 0, color: selectedPlatform?.color }}>
                    授权 {selectedPlatform?.name}
                  </Title>
                </div>
                
                {/* V7: popup方式或二维码图片 */}
                <div style={{
                  display: 'inline-block',
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${selectedPlatform?.color || '#f0f0f0'}`,
                  background: '#fff',
                  position: 'relative',
                }}>
                  {qrMethod === 'popup' && popupUrl ? (
                    <div style={{ width: 240, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{selectedPlatform?.icon}</div>
                      <Text strong style={{ marginBottom: 4 }}>请在新窗口中扫码</Text>
                      <Text type="secondary" style={{ marginBottom: 8, fontSize: 11 }}>
                        已打开 {selectedPlatform?.name} 登录页面
                      </Text>
                      <Button 
                        size="small"
                        style={{ marginBottom: 6 }}
                        onClick={() => window.open(popupUrl, '_blank', 'width=800,height=600')}
                      >
                        重新打开登录页
                      </Button>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={async () => {
                          message.success('授权成功！');
                          setModalVisible(false);
                          fetchBoundAccounts();
                        }}
                      >
                        我已完成授权
                      </Button>
                    </div>
                  ) : qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="授权二维码" 
                      style={{ 
                        width: 240, 
                        height: 240,
                        display: 'block',
                        borderRadius: 8,
                        objectFit: 'contain',
                        border: '1px solid #e8e8e8'
                      }}
                    />
                  ) : null}
                </div>
                
                {/* 操作提示 */}
                <div style={{ 
                  background: '#f8f8f8', 
                  padding: 16, 
                  borderRadius: 8,
                  marginTop: 16,
                  textAlign: 'left'
                }}>
                  <Space>
                    <QrcodeOutlined style={{ fontSize: 20, color: selectedPlatform?.color }} />
                    <div>
                      <Text strong>打开 {selectedPlatform?.name} App</Text><br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        1. 打开{selectedPlatform?.name} App<br />
                        2. 点击右上角扫一扫<br />
                        3. 扫描上方二维码完成授权
                      </Text>
                    </div>
                  </Space>
                </div>

                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    二维码有效期为 10 分钟，请尽快扫码
                  </Text>
                </div>
              </>
            ) : (
              <div style={{ width: 240, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', background: '#f5f5f5', borderRadius: 8 }}>
                <CloseCircleOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 8 }} />
                <Text type="secondary">获取二维码失败</Text>
                <Button size="small" style={{ marginTop: 8 }} onClick={() => selectedPlatform && handleBindAccount(selectedPlatform)}>
                  重试
                </Button>
              </div>
            )}
          </Spin>
        </div>
      </Modal>
    </div>
  );
}
