'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Modal, message, Space, Tag, Spin, Descriptions, Typography, Alert, QRCode, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { request } from '@/utils/request';

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
  { code: 'zhipin', name: 'Boss直聘', icon: '💼', color: '#15c15a' },
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
      const res = await request.get('/oauth/accounts');
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
      const res = await request.post('/oauth/sessions', { platform });
      
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
        await request.post('/oauth/authorize', { sessionId, platform: selectedPlatform });
        
        // 获取状态
        const res = await request.get(`/oauth/sessions/${sessionId}`);
        
        if (res.success) {
          setOauthStatus(res.data.status);
          
          if (res.data.status === 'confirmed') {
            message.success('授权成功！');
            setOauthModalVisible(false);
            loadAccounts();
            setPolling(false);
          } else if (res.data.status === 'expired') {
            message.error('授权已过期，请重新扫码');
            setPolling(false);
          } else {
            // 继续轮询
            setTimeout(poll, 2000);
          }
        } else {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // 删除账号
  const handleDelete = async (accountId: string) => {
    try {
      const res = await request.delete(`/oauth/accounts/${accountId}`);
      if (res.success) {
        message.success('删除成功');
        loadAccounts();
      } else {
        message.error(res.error || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 刷新状态
  const handleRefresh = async (accountId: string) => {
    try {
      const res = await request.post(`/oauth/accounts/${accountId}/refresh`);
      if (res.success) {
        message.success('刷新成功');
        loadAccounts();
      } else {
        message.error(res.error || '刷新失败');
      }
    } catch (error) {
      message.error('刷新失败');
    }
  };

  // 表格列
  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        const p = PLATFORMS.find(p => p.code === platform);
        return (
          <Space>
            <span>{p?.icon}</span>
            <span>{p?.name || platform}</span>
          </Space>
        );
      }
    },
    {
      title: '账号信息',
      dataIndex: 'accountInfo',
      key: 'accountInfo',
      render: (info: any) => info?.nickname || info?.username || '-'
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar: string) => avatar ? <img src={avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} /> : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '失效'}
        </Tag>
      )
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
          <Button size="small" icon={<SyncOutlined />} onClick={() => handleRefresh(record.id)}>
            刷新
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 获取当前平台信息
  const currentPlatform = PLATFORMS.find(p => p.code === selectedPlatform);

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <span>🎯</span>
            <span>矩阵账号授权</span>
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
          description="点击「添加账号」选择平台后，使用对应APP扫码即可授权。授权成功后，系统将自动管理账号并执行自动化任务。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 授权弹窗 */}
      <Modal
        title={
          <Space>
            <span>{currentPlatform?.icon}</span>
            <span>授权 {currentPlatform?.name}</span>
          </Space>
        }
        open={oauthModalVisible}
        onCancel={() => {
          setOauthModalVisible(false);
          setPolling(false);
        }}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {oauthSession?.qrCode ? (
            <>
              <QRCode value={oauthSession.qrCode} size={200} />
              <div style={{ marginTop: 20 }}>
                {oauthStatus === 'pending' && (
                  <Space direction="vertical">
                    <Text>请使用 {currentPlatform?.name} APP 扫码授权</Text>
                    <Spin />
                  </Space>
                )}
                {oauthStatus === 'scanning' && (
                  <Text type="warning">已扫码，请在手机上确认授权</Text>
                )}
                {oauthStatus === 'confirmed' && (
                  <Text type="success">授权成功！</Text>
                )}
                {oauthStatus === 'expired' && (
                  <>
                    <Text type="danger">二维码已过期</Text>
                    <Button onClick={() => createOAuthSession(selectedPlatform!)} style={{ marginTop: 10 }}>
                      重新生成二维码
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <Space direction="vertical">
              <Spin size="large" />
              <Text>正在生成授权二维码...</Text>
            </Space>
          )}
        </div>
      </Modal>
    </div>
  );
}
