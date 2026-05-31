'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, QRCode, Button, Space, Tag, Modal } from 'antd';
import { UserAddOutlined, ScanOutlined, RiseOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

export default function ReferralPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);

  // 模拟推荐数据
  const mockReferrals = [
    { id: '1', userId: 'U001', name: '张三', phone: '138****1234', status: 'registered', registeredAt: '2024-05-10', reward: 10 },
    { id: '2', userId: 'U002', name: '李四', phone: '139****5678', status: 'active', registeredAt: '2024-05-08', reward: 20 },
    { id: '3', userId: 'U003', name: '王五', phone: '137****9012', status: 'registered', registeredAt: '2024-05-05', reward: 10 },
  ];

  useEffect(() => {
    // Mock 数据
    setReferrals(mockReferrals);
    setStats({
      totalReferrals: mockReferrals.length,
      registeredCount: mockReferrals.filter(r => r.status === 'registered').length,
      activeCount: mockReferrals.filter(r => r.status === 'active').length,
      totalRewards: mockReferrals.reduce((sum, r) => sum + r.reward, 0),
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'blue';
      case 'active': return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registered': return '已注册';
      case 'active': return '活跃用户';
      default: return status;
    }
  };

  const columns = [
    { title: '推荐人', dataIndex: 'name', key: 'name' },
    { 
      title: '手机号', 
      dataIndex: 'phone', 
      key: 'phone',
      render: (phone: string) => phone
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    { title: '注册时间', dataIndex: 'registeredAt', key: 'registeredAt' },
    { 
      title: '奖励', 
      dataIndex: 'reward', 
      key: 'reward',
      render: (reward: number) => `+${reward}积分`
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" size="small">查看详情</Button>
      )
    }
  ];

  const referralLink = `https://www.baizhiji.net/register?ref=${user?.id || 'test'}`;

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title="推荐分享" 
        extra={
          <Space>
            <Button icon={<ScanOutlined />} onClick={() => {
              setSelectedReferral({ name: '我的推荐码', link: referralLink });
              setQrModalVisible(true);
            }}>
              生成二维码
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="推荐人数" value={stats.totalReferrals || 0} prefix={<UserAddOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="注册人数" value={stats.registeredCount || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="活跃用户" value={stats.activeCount || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="累计奖励" value={stats.totalRewards || 0} suffix="积分" prefix={<RiseOutlined />} />
          </Col>
        </Row>

        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ marginBottom: 8, color: '#666' }}>我的推荐链接</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 4 }}
              value={referralLink}
              readOnly
            />
            <Button 
              type="primary"
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
              }}
            >
              复制链接
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={referrals}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title="推荐二维码"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <QRCode value={selectedReferral?.link || ''} size={200} />
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedReferral?.name}</p>
            <p style={{ color: '#666', margin: '8px 0 0' }}>扫码注册获取奖励</p>
          </div>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            style={{ marginTop: 16 }}
            onClick={() => {
              // 实际可以添加下载功能
            }}
          >
            下载二维码
          </Button>
        </div>
      </Modal>
    </div>
  );
}
