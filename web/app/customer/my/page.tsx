'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Button,
  List,
  Typography,
  Space,
  Tag,
  Modal,
  QRCode,
  message,
  Divider,
  Progress,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  EditOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  TeamOutlined,
  CrownOutlined,
  LogoutOutlined,
  SettingOutlined,
  SafetyOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

export default function MyPage() {
  const { user, logout } = useAuth();
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalRewards: 0,
  });

  // 模拟推荐数据
  useEffect(() => {
    setReferrals([
      { id: 1, name: '张三', phone: '138****1234', status: 'active', date: '2024-05-15', reward: 20 },
      { id: 2, name: '李四', phone: '139****5678', status: 'registered', date: '2024-05-10', reward: 10 },
    ]);
    setStats({
      totalReferrals: 2,
      activeReferrals: 1,
      totalRewards: 30,
    });
  }, []);

  // APK 下载地址（后续改为动态获取）
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL || '/app/zhishuai.apk';
  const appName = '智枢AI';
  const downloadLink = `${window.location.origin}/download`;

  const handleDownloadApk = () => {
    window.open(apkUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadLink);
    message.success('下载链接已复制到剪贴板');
  };

  const menuItems = [
    {
      icon: <TeamOutlined />,
      title: '我的推荐',
      desc: '查看推荐用户和奖励',
      path: '/customer/referral',
      color: '#1890ff',
    },
    {
      icon: <ApiOutlined />,
      title: 'API 管理',
      desc: '管理 API Keys',
      path: '/customer/api-keys',
      color: '#52c41a',
    },
    {
      icon: <SafetyOutlined />,
      title: '安全设置',
      desc: '修改密码、安全设置',
      path: '/customer/settings/security',
      color: '#fa8c16',
    },
    {
      icon: <SettingOutlined />,
      title: '公司信息',
      desc: '完善公司资料',
      path: '/customer/settings/company',
      color: '#722ed1',
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 用户信息卡片 */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar size={72} icon={<UserOutlined />} src={user?.avatar} />
          </Col>
          <Col flex={1}>
            <Title level={4} style={{ marginBottom: 4 }}>{user?.name || '用户'}</Title>
            <Space>
              <Tag icon={<PhoneOutlined />}>{user?.phone || '未绑定手机'}</Tag>
              <Tag color="gold" icon={<CrownOutlined />}>终端客户</Tag>
            </Space>
          </Col>
          <Col>
            <Button icon={<EditOutlined />}>编辑资料</Button>
          </Col>
        </Row>
      </Card>

      {/* 推荐统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ textAlign: 'center', borderRadius: 12 }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{stats.totalReferrals}</Title>
            <Text type="secondary">推荐人数</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ textAlign: 'center', borderRadius: 12 }}>
            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{stats.activeReferrals}</Title>
            <Text type="secondary">活跃用户</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ textAlign: 'center', borderRadius: 12 }}>
            <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>{stats.totalRewards}</Title>
            <Text type="secondary">累计奖励</Text>
          </Card>
        </Col>
      </Row>

      {/* 下载 App 卡片 */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Row gutter={24} align="middle">
          <Col flex={1}>
            <Title level={4} style={{ color: 'white', marginBottom: 4 }}>下载 {appName} App</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>
              扫码下载或在浏览器打开下载链接，随时随地管理您的业务
            </Paragraph>
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadApk}
                style={{ background: 'white', color: '#667eea', border: 'none' }}
              >
                下载安装包
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleCopyLink}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                复制链接
              </Button>
            </Space>
          </Col>
          <Col>
            <div style={{ textAlign: 'center' }}>
              <QRCode
                value={downloadLink}
                size={120}
                style={{ background: 'white', padding: 8 }}
              />
              <Text style={{ display: 'block', marginTop: 8, color: 'rgba(255,255,255,0.9)' }}>扫码下载</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 功能菜单 */}
      <Card title="常用功能" style={{ borderRadius: 12 }}>
        <List
          dataSource={menuItems}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => window.location.href = item.path}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 24, color: item.color }}>{item.icon}</span>
                  </div>
                }
                title={item.title}
                description={item.desc}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 退出登录 */}
      <Card style={{ marginTop: 16, borderRadius: 12 }}>
        <Button
          block
          danger
          icon={<LogoutOutlined />}
          size="large"
          onClick={logout}
        >
          退出登录
        </Button>
      </Card>

      {/* 版本信息 */}
      <div style={{ textAlign: 'center', marginTop: 24, color: '#999' }}>
        <Text type="secondary">{appName} v1.0.0</Text>
      </div>
    </div>
  );
}
