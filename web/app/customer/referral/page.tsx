'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, QRCode, Button, Space, Tag, Modal, message } from 'antd';
import { UserAddOutlined, ScanOutlined, RiseOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export default function ReferralPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalReferrals: 0,
    registeredCount: 0,
    activeCount: 0,
    totalRewards: 0,
  });
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const [referralsRes, statsRes] = await Promise.all([
        api.get('/referral/records').catch(() => []),
        api.get('/referral/stats').catch(() => ({})),
      ]);

      const referralsList = Array.isArray(referralsRes) ? referralsRes : (referralsRes?.data || []);
      const statsData = statsRes?.data || statsRes;

      setReferrals(referralsList);
      if (statsData) {
        setStats({
          totalReferrals: statsData.totalReferrals || referralsList.length,
          registeredCount: statsData.registeredCount || referralsList.filter((r: any) => r.status === 'registered').length,
          activeCount: statsData.activeCount || referralsList.filter((r: any) => r.status === 'active').length,
          totalRewards: statsData.totalRewards || referralsList.reduce((sum: number, r: any) => sum + (r.reward || 0), 0),
        });
      }
    } catch (error) {
      console.error('获取推荐数据失败:', error);
      // 降级：显示空数据
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

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
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    { title: '注册时间', dataIndex: 'registeredAt', key: 'registeredAt', render: (v: string) => v || '-' },
    {
      title: '奖励',
      dataIndex: 'reward',
      key: 'reward',
      render: (reward: number) => reward ? `+${reward}积分` : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => { setSelectedReferral(record); setQrModalVisible(true); }}>
          查看详情
        </Button>
      ),
    },
  ];

  const referralLink = `https://www.baizhiji.net/register?ref=${user?.id || ''}`;

  // 下载二维码
  const downloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = '推荐二维码.png';
      a.click();
      message.success('二维码已下载');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="推荐分享"
        extra={
          <Space>
            <Button
              icon={<ScanOutlined />}
              onClick={() => {
                setSelectedReferral({ name: '我的推荐码', link: referralLink });
                setQrModalVisible(true);
              }}
            >
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
            <Button type="primary" onClick={() => { navigator.clipboard.writeText(referralLink); message.success('链接已复制'); }}>
              复制链接
            </Button>
          </div>
        </div>

        <Table columns={columns} dataSource={referrals} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="推荐二维码" open={qrModalVisible} onCancel={() => setQrModalVisible(false)} footer={null}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <QRCode value={selectedReferral?.link || referralLink} size={200} />
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedReferral?.name || '我的推荐码'}</p>
            <p style={{ color: '#666', margin: '8px 0 0' }}>扫码注册获取奖励</p>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} style={{ marginTop: 16 }} onClick={downloadQR}>
            下载二维码
          </Button>
        </div>
      </Modal>
    </div>
  );
}
