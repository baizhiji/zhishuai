'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Tag, Button, Space, Typography, Switch, message, Badge, Descriptions, Modal, Form, Input, Select,
} from 'antd';
import {
  GlobalOutlined, LinkOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, ReloadOutlined,
  ApiOutlined, SettingOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Title, Text, Paragraph } = Typography;

interface Platform {
  id: string;
  name: string;
  key: string;
  description: string;
  icon: string;
  connected: boolean;
  lastSyncAt?: string;
  jobCount?: number;
  accountName?: string;
}

const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'boss', name: 'BOSS直聘', key: 'boss_zhipin', description: '中国领先的在线招聘平台，覆盖互联网、金融等行业', icon: '🔵', connected: false },
  { id: 'zhilian', name: '智联招聘', key: 'zhilian', description: '老牌综合招聘网站，覆盖全国各行业', icon: '🟢', connected: false },
  { id: 'qiancheng', name: '前程无忧', key: '51job', description: '综合性人力资源服务商，提供招聘、培训等服务', icon: '🟠', connected: false },
  { id: 'liepin', name: '猎聘', key: 'liepin', description: '中高端人才招聘平台，专注精英群体', icon: '🔴', connected: false },
  { id: 'lagou', name: '拉勾', key: 'lagou', description: '专注互联网行业招聘', icon: '🟣', connected: false },
  { id: 'linkedin', name: 'LinkedIn', key: 'linkedin', description: '全球职业社交平台，覆盖国际化人才', icon: '🔷', connected: false },
];

export default function RecruitmentPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);

  // 连接平台 Modal
  const [connectVisible, setConnectVisible] = useState(false);
  const [connectForm] = Form.useForm();
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recruitment/search-config?summary=true') as { configs: unknown[] };
      // 基于真实配置组装平台状态 - 简化为基于本地存储
      const savedStr = localStorage.getItem('recruitment_platforms');
      if (savedStr) {
        const saved = JSON.parse(savedStr) as Platform[];
        setPlatforms(DEFAULT_PLATFORMS.map(p => saved.find(s => s.id === p.id) || p));
      } else {
        setPlatforms([...DEFAULT_PLATFORMS]);
      }
    } catch {
      const savedStr = localStorage.getItem('recruitment_platforms');
      if (savedStr) {
        setPlatforms(JSON.parse(savedStr) as Platform[]);
      } else {
        setPlatforms([...DEFAULT_PLATFORMS]);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlatforms(); }, [fetchPlatforms]);

  const savePlatforms = (newPlatforms: Platform[]) => {
    setPlatforms(newPlatforms);
    localStorage.setItem('recruitment_platforms', JSON.stringify(newPlatforms));
  };

  const handleConnect = (platform: Platform) => {
    setConnectingPlatform(platform);
    connectForm.resetFields();
    connectForm.setFieldsValue({ platform: platform.id });
    setConnectVisible(true);
  };

  const handleConnectSubmit = async () => {
    try {
      const values = await connectForm.validateFields();
      setConnectLoading(true);
      // 创建搜索配置表示平台连接
      await apiClient.post('/recruitment/search-config', {
        postId: null,
        platform: connectingPlatform!.id,
        keywords: values.keywords || '',
        location: values.location || '',
        autoContact: false,
        status: 'active',
      });
      const newPlatforms = platforms.map(p =>
        p.id === connectingPlatform!.id
          ? { ...p, connected: true, accountName: values.accountName, lastSyncAt: new Date().toISOString() }
          : p
      );
      savePlatforms(newPlatforms);
      message.success(`${connectingPlatform!.name} 连接成功`);
      setConnectVisible(false);
    } catch (e: unknown) {
      message.error((e as Error)?.message || '连接失败');
    } finally { setConnectLoading(false); }
  };

  const handleDisconnect = async (platform: Platform) => {
    Modal.confirm({
      title: `确定断开 ${platform.name}？`,
      content: '断开后将无法在该平台发布职位和搜索候选人',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const newPlatforms = platforms.map(p =>
          p.id === platform.id ? { ...p, connected: false, accountName: undefined, lastSyncAt: undefined } : p
        );
        savePlatforms(newPlatforms);
        message.success(`已断开 ${platform.name}`);
      },
    });
  };

  const handleToggleAuto = (platform: Platform) => {
    const newPlatforms = platforms.map(p =>
      p.id === platform.id ? { ...p, connected: !p.connected } : p
    );
    savePlatforms(newPlatforms);
    message.success(`${platform.name} 已${newPlatforms.find(p => p.id === platform.id)!.connected ? '连接' : '断开'}`);
  };

  const connectedCount = platforms.filter(p => p.connected).length;

  return (
    <PageContainer
      title="招聘平台管理"
      description="管理已接入的招聘平台，一键同步职位到多平台"
      breadcrumb={[{ title: '首页', href: '/customer/dashboard' }, { title: '智能招聘', href: '/customer/recruitment' }, { title: '平台管理' }]}
      loading={false}
      skeletonType="card"
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchPlatforms} loading={loading}>刷新</Button>
      }
    >
      {/* 摘要 */}
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={8}>
            <Space direction="vertical" size={0} style={{ display: 'flex', alignItems: 'center' }}>
              <Title level={1} style={{ color: '#6d28d9', marginBottom: 0 }}>{connectedCount}</Title>
              <Text type="secondary">已连接平台</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size={0} style={{ display: 'flex', alignItems: 'center' }}>
              <Title level={1} style={{ color: '#52c41a', marginBottom: 0 }}>{platforms.length - connectedCount}</Title>
              <Text type="secondary">待接入平台</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size={0} style={{ display: 'flex', alignItems: 'center' }}>
              <Title level={1} style={{ color: '#722ed1', marginBottom: 0 }}>{platforms.length}</Title>
              <Text type="secondary">平台总数</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 平台列表 */}
      <Row gutter={[16, 16]}>
        {platforms.map(platform => (
          <Col xs={24} sm={12} lg={8} key={platform.id}>
            <Card
              style={{ borderRadius: 8, height: '100%' }}
              title={
                <Space>
                  <span style={{ fontSize: 20 }}>{platform.icon}</span>
                  <span>{platform.name}</span>
                  {platform.connected && <Badge status="success" text="已连接" />}
                  {!platform.connected && <Badge status="default" text="未连接" />}
                </Space>
              }
              extra={
                <Switch
                  checked={platform.connected}
                  onChange={() => handleToggleAuto(platform)}
                  checkedChildren="开"
                  unCheckedChildren="关"
                />
              }
            >
              <Paragraph type="secondary" style={{ minHeight: 40, marginBottom: 12 }}>{platform.description}</Paragraph>
              {platform.connected && (
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="账号">{platform.accountName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="最近同步">
                    {platform.lastSyncAt ? new Date(platform.lastSyncAt).toLocaleString('zh-CN') : '-'}
                  </Descriptions.Item>
                </Descriptions>
              )}
              <div style={{ marginTop: 12 }}>
                {platform.connected ? (
                  <Space>
                    <Button size="small" icon={<SettingOutlined />} onClick={() => handleConnect(platform)}>配置</Button>
                    <Button size="small" danger onClick={() => handleDisconnect(platform)}>断开</Button>
                  </Space>
                ) : (
                  <Button type="primary" size="small" icon={<LinkOutlined />} onClick={() => handleConnect(platform)}>立即连接</Button>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 连接平台 Modal */}
      <Modal
        title={`连接 ${connectingPlatform?.name || ''}`}
        open={connectVisible}
        onCancel={() => setConnectVisible(false)}
        onOk={handleConnectSubmit}
        confirmLoading={connectLoading}
        okText="确认连接"
        cancelText="取消"
        width={500}
      >
        <Form form={connectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="accountName" label="平台账号" rules={[{ required: true, message: '请输入平台账号' }]}>
            <Input placeholder="请输入该平台注册账号" />
          </Form.Item>
          <Form.Item name="keywords" label="默认搜索关键词">
            <Input placeholder="如：前端开发工程师" />
          </Form.Item>
          <Form.Item name="location" label="默认地区">
            <Input placeholder="如：北京" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
