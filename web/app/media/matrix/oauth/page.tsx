'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Modal, message, Space, Tag, Spin, QRCode, Descriptions, Typography, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { request } from '@/utils/api';

const { Title, Text } = Typography;

// 平台列表
const PLATFORMS = [
  { code: 'douyin', name: '抖音', icon: '🎵', color: '#fe2c55' },
  { code: 'kuaishou', name: '快手', icon: '📱', color: '#ff4906' },
  { code: 'xiaohongshu', name: '小红书', icon: '📕', color: '#ff2442' },
  { code: 'weixin', name: '微信视频号', icon: '💫', color: '#07c160' },
  { code: 'weibo', name: '微博', icon: '🌐', color: '#e6162d' },
  { code: 'bilibili', name: 'B站', icon: '📺', color: '#fb7299' },
  { code: 'boss', name: 'BOSS直聘', icon: '👔', color: '#15c15a' },
  { code: 'lagou', name: '拉勾网', icon: '🎯', color: '#00b42a' },
  { code: 'zhipin', name: 'BOSS直聘', icon: '💼', color: '#15c15a' },
];

export default function OAuthPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [oauthModalVisible, setOauthModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [oauthSession, setOauthSession] = useState<any>(null);
  const [oauthStatus, setOauthStatus] = useState<'pending' | 'scanning' | 'confirmed' | 'expired' | null>(null);
  const [polling, setPolling] = useState(false);

  // 加载账号列表
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await request('/oauth/accounts');
      if (res.success) {
        setAccounts(res.data || []);
      }
    } catch (error) {
      console.error('加载账号失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // 打开授权弹窗
  const handleOpenOAuth = (platform: string) => {
    setSelectedPlatform(platform);
    setOauthModalVisible(true);
    setOauthSession(null);
    setOauthStatus('pending');
    createOAuthSession(platform);
  };

  // 创建授权会话
  const createOAuthSession = async (platform: string) => {
    try {
      const res = await request('/oauth/sessions', {
        method: 'POST',
        body: { platform }
      });
      
      if (res.success) {
        setOauthSession(res.data);
        // 开始轮询状态
        startPolling(res.data.sessionId);
      } else {
        message.error(res.error || '创建授权会话失败');
      }
    } catch (error) {
      console.error('创建授权会话失败', error);
      message.error('创建授权会话失败');
    }
  };

  // 轮询授权状态
  const startPolling = (sessionId: string) => {
    setPolling(true);
    
    const poll = async () => {
      try {
        // 触发授权检查
        await request('/oauth/authorize', {
          method: 'POST',
          body: { sessionId, platform: selectedPlatform }
        });
        
        // 获取状态
        const res = await request(`/oauth/sessions/${sessionId}`);
        
        if (res.success) {
          setOauthStatus(res.data.status);
          
          if (res.data.status === 'confirmed') {
            message.success('授权成功！');
            setOauthModalVisible(false);
            loadAccounts();
            setPolling(false);
            return;
          } else if (res.data.status === 'expired') {
            message.error('授权已过期');
            setPolling(false);
            return;
          }
        }
      } catch (error) {
        console.error('轮询失败', error);
      }
      
      // 继续轮询
      if (oauthStatus !== 'confirmed' && oauthStatus !== 'expired') {
        setTimeout(poll, 3000);
      }
    };
    
    poll();
  };

  // 取消授权
  const handleCancelOAuth = async () => {
    if (oauthSession?.sessionId) {
      try {
        await request(`/oauth/sessions/${oauthSession.sessionId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('取消授权失败', error);
      }
    }
    setOauthModalVisible(false);
    setOauthSession(null);
    setOauthStatus(null);
    setPolling(false);
  };

  // 删除账号
  const handleDeleteAccount = async (id: string) => {
    try {
      const res = await request(`/oauth/accounts/${id}`, {
        method: 'DELETE'
      });
      
      if (res.success) {
        message.success('删除成功');
        loadAccounts();
      } else {
        message.error(res.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败', error);
      message.error('删除失败');
    }
  };

  // 刷新账号
  const handleRefreshAccount = async (id: string) => {
    try {
      const res = await request(`/oauth/accounts/${id}/refresh`, {
        method: 'POST'
      });
      
      if (res.success) {
        if (res.data.status === 'active') {
          message.success('账号状态正常');
        } else {
          message.warning('授权已过期，请重新授权');
        }
        loadAccounts();
      }
    } catch (error) {
      console.error('刷新失败', error);
      message.error('刷新失败');
    }
  };

  // 表格列
  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string, record: any) => {
        const p = PLATFORMS.find(p => p.code === platform);
        return (
          <Space>
            <span style={{ fontSize: 20 }}>{p?.icon}</span>
            <span>{p?.name || platform}</span>
          </Space>
        );
      }
    },
    {
      title: '账号',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (name: string, record: any) => (
        <Space>
          {record.avatar && (
            <img src={record.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          )}
          <span>{name || '未获取到账号名'}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          active: { color: 'success', text: '正常', icon: <CheckCircleOutlined /> },
          expired: { color: 'error', text: '已过期', icon: <CloseCircleOutlined /> },
          frozen: { color: 'warning', text: '已冻结', icon: <ExclamationCircleOutlined /> }
        };
        const s = statusMap[status] || statusMap.active;
        return (
          <Tag color={s.color} icon={s.icon}>
            {s.text}
          </Tag>
        );
      }
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncAt',
      key: 'lastSyncAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="link" 
            icon={<SyncOutlined spin={loading} />}
            onClick={() => handleRefreshAccount(record.id)}
          >
            刷新
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: '确认删除',
              content: '确定要删除这个授权账号吗？',
              onOk: () => handleDeleteAccount(record.id)
            })}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 按平台分组
  const groupedAccounts = PLATFORMS.map(platform => ({
    ...platform,
    accounts: accounts.filter(a => a.platform === platform.code)
  }));

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>矩阵账号授权</span>
            <Text type="secondary">添加各平台账号进行统一管理</Text>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOauthModalVisible(true)}>
            添加账号
          </Button>
        }
      >
        <Alert
          message="授权说明"
          description="点击「添加账号」选择平台后，系统会打开授权二维码。请使用对应APP扫码授权。授权成功后，账号将自动同步。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无授权账号，请点击右上角「添加账号」' }}
        />
      </Card>

      {/* 添加账号弹窗 */}
      <Modal
        title="添加账号"
        open={oauthModalVisible}
        onCancel={handleCancelOAuth}
        footer={null}
        width={600}
      >
        {!selectedPlatform ? (
          <div>
            <Title level={5}>选择平台</Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
              {PLATFORMS.map(platform => (
                <Card
                  key={platform.code}
                  hoverable
                  onClick={() => handleOpenOAuth(platform.code)}
                  style={{ textAlign: 'center' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{platform.icon}</div>
                  <div>{platform.name}</div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Title level={4}>
              {PLATFORMS.find(p => p.code === selectedPlatform)?.icon}{' '}
              {PLATFORMS.find(p => p.code === selectedPlatform)?.name} 授权
            </Title>
            
            {oauthSession?.qrcodeUrl ? (
              <div style={{ margin: '20px 0' }}>
                <Card bordered={false} style={{ display: 'inline-block', background: '#f5f5f5' }}>
                  <img src={oauthSession.qrcodeUrl} alt="授权二维码" style={{ width: 200, height: 200 }} />
                </Card>
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">请使用{PLATFORMS.find(p => p.code === selectedPlatform)?.name}APP扫码授权</Text>
                </div>
              </div>
            ) : (
              <Spin size="large" tip="正在准备授权..." />
            )}

            {oauthStatus && (
              <div style={{ marginTop: 16 }}>
                {oauthStatus === 'pending' && <Text>等待扫码...</Text>}
                {oauthStatus === 'scanning' && <Text type="processing">已扫码，等待确认...</Text>}
                {oauthStatus === 'confirmed' && <Text type="success">授权成功！</Text>}
                {oauthStatus === 'expired' && <Text type="danger">授权已过期，请重试</Text>}
              </div>
            )}

            {polling && (
              <div style={{ marginTop: 8 }}>
                <SyncOutlined spin /> 正在检查授权状态...
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <Button onClick={handleCancelOAuth}>取消</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
